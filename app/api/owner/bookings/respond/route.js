import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import crypto from 'crypto';

function verifyToken(token, ownerId) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('.');
    const signature = parts.pop();
    const payload = parts.join('.');
    const [tokenOwnerId, expiresAt] = payload.split('.');

    if (tokenOwnerId !== ownerId) return false;
    if (Date.now() > Number(expiresAt)) return false;

    const secret = process.env.SESSION_SECRET;
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return signature === expectedSig;
  } catch (e) {
    return false;
  }
}

function normalizeSmsPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.indexOf('995') === 0) digits = digits.substring(3);
  if (digits.length !== 9) return '';
  return '995' + digits;
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
    // Best-effort
  }
}

export async function POST(request) {
  try {
    const { ownerId, token, bookingId, action } = await request.json();

    if (!ownerId || !token || !verifyToken(token, ownerId)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა' }, { status: 401 });
    }
    if (!bookingId || !['confirm', 'decline'].includes(action)) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    // Confirm this booking belongs to a villa owned by this owner
    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, villa_id, check_in, check_out, guest_phone, villas!inner(owner_id, title)')
      .eq('id', bookingId)
      .single();

    if (!booking || booking.villas.owner_id !== ownerId) {
      return Response.json({ ok: false, message: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const newStatus = action === 'confirm' ? 'confirmed' : 'declined';

    const { error } = await supabaseAdmin
      .from('villa_bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      return Response.json({ ok: false, message: 'განახლება ვერ მოხერხდა' }, { status: 500 });
    }

    if (action === 'confirm' && booking.guest_phone) {
      const normalized = normalizeSmsPhone(booking.guest_phone);
      if (normalized) {
        const secret = process.env.SESSION_SECRET;
        const reviewToken = crypto.createHmac('sha256', secret).update(booking.id).digest('hex');
        const reviewUrl = `https://buknarivilla.ge/review/${booking.id}?t=${reviewToken}`;
        await sendSms(
          normalized,
          `თქვენი ჯავშანი დადასტურდა! "${booking.villas.title}" — ${booking.check_in} → ${booking.check_out}. მადლობა, რომ ირჩევთ Buknari Villa-ს. დასვენების შემდეგ დაგვიტოვეთ შეფასება: ${reviewUrl}`
        );
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
