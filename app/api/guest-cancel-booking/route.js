import { supabaseAdmin } from '../../../lib/supabaseAdmin';

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
    // Best-effort — cancellation already succeeded even if SMS fails
  }
}

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return Response.json({ ok: false, message: 'ბმული არასწორია' }, { status: 403 });
    }

    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, check_in, check_out, guest_name, guest_phone, villa_id, villas(title, owner_id)')
      .eq('cancel_code', code)
      .single();

    if (!booking) {
      return Response.json({ ok: false, message: 'ჯავშანი ვერ მოიძებნა' }, { status: 404 });
    }

    const { error } = await supabaseAdmin.from('villa_bookings').delete().eq('id', booking.id);

    if (error) {
      return Response.json({ ok: false, message: 'გაუქმება ვერ მოხერხდა' }, { status: 500 });
    }

    const villaTitle = booking.villas?.title || '';

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
            `სტუმარმა გააუქმა ჯავშანი — "${villaTitle}", ${booking.check_in} → ${booking.check_out}. სტუმარი: ${booking.guest_name}.`
          );
        }
      }
    }

    // Confirm the cancellation to the guest
    const normalizedGuest = normalizeSmsPhone(booking.guest_phone);
    if (normalizedGuest) {
      await sendSms(
        normalizedGuest,
        `თქვენი ჯავშანი გაუქმებულია — "${villaTitle}", ${booking.check_in} → ${booking.check_out}.`
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
