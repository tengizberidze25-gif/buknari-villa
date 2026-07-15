import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import crypto from 'crypto';

function normalizeSmsPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.indexOf('995') === 0) digits = digits.substring(3);
  if (digits.length !== 9) return '';
  return '995' + digits;
}

function verifyToken(token, phone) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('.');
    const signature = parts.pop();
    const payload = parts.join('.');
    const [tokenPhone, expiresAt] = payload.split('.');

    if (tokenPhone !== phone) return false;
    if (Date.now() > Number(expiresAt)) return false;

    const secret = process.env.SESSION_SECRET;
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return signature === expectedSig;
  } catch (e) {
    return false;
  }
}

async function sendSms(phone, text) {
  const publicKey = process.env.BULKSMS_PUBLIC_KEY;
  const privateKey = process.env.BULKSMS_API_TOKEN;
  const sender = process.env.BULKSMS_SENDER || 'BUKNARI';

  const url =
    'https://api.bulksms.ge/gateway/api/sms/v1/message/send?publicKey=' +
    encodeURIComponent(publicKey);

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + privateKey,
      },
      body: JSON.stringify({
        Text: text,
        Purpose: 'INF',
        Options: {
          Originator: sender,
          Encoding: 'UNICODE',
          SmsType: 'SMS',
          ReportLabel: 'Buknari Villa Booking',
        },
        Receivers: [{ Receiver: phone }],
      }),
    });
  } catch (e) {
    // Best-effort — cancellation already succeeded even if SMS fails
  }
}

export async function POST(request) {
  try {
    const { phone, token, bookingId } = await request.json();
    const normalized = normalizeSmsPhone(phone);

    if (!normalized || !token || !bookingId || !verifyToken(token, normalized)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა' }, { status: 401 });
    }

    // Server-side ownership check: this booking must actually belong to this phone number
    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, guest_name, guest_phone, check_in, check_out, villas(title, owner_id)')
      .eq('id', bookingId)
      .single();

    if (!booking || normalizeSmsPhone(booking.guest_phone) !== normalized) {
      return Response.json({ ok: false, message: 'ჯავშანი ვერ მოიძებნა' }, { status: 404 });
    }

    const { error } = await supabaseAdmin.from('villa_bookings').delete().eq('id', bookingId);

    if (error) {
      return Response.json({ ok: false, message: 'გაუქმება ვერ მოხერხდა' }, { status: 500 });
    }

    // Notify the owner by SMS (best-effort, doesn't block the response)
    if (booking.villas?.owner_id) {
      const { data: owner } = await supabaseAdmin
        .from('owners')
        .select('phone')
        .eq('id', booking.villas.owner_id)
        .single();

      if (owner?.phone) {
        const normalizedOwner = normalizeSmsPhone(owner.phone);
        if (normalizedOwner) {
          await sendSms(
            normalizedOwner,
            `სტუმარმა გააუქმა ჯავშანი — "${booking.villas.title}", ${booking.check_in} → ${booking.check_out}. სტუმარი: ${booking.guest_name}.`
          );
        }
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
