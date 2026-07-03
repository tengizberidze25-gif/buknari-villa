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
    // Best-effort — booking already succeeded even if SMS fails
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const villaId = body.villaId;
    const checkIn = body.checkIn;
    const checkOut = body.checkOut;
    const guestName = (body.guestName || '').toString().trim();
    const guestPhone = (body.guestPhone || '').toString().trim();
    const guestMessage = (body.guestMessage || '').toString().trim();

    if (!villaId || !checkIn || !checkOut || !guestName || !guestPhone) {
      return Response.json({ ok: false, message: 'გთხოვთ შეავსოთ ყველა ველი' }, { status: 400 });
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      return Response.json({ ok: false, message: 'გამგზავრების თარიღი ჩამოსვლის შემდეგ უნდა იყოს' }, { status: 400 });
    }

    // Confirm the villa exists and is approved
    const { data: villa } = await supabaseAdmin
      .from('villas')
      .select('id, title, status, owner_id')
      .eq('id', villaId)
      .single();

    if (!villa || villa.status !== 'approved') {
      return Response.json({ ok: false, message: 'ვილა ვერ მოიძებნა' }, { status: 404 });
    }

    // Check for overlap with existing pending/confirmed/owner_block bookings
    const { data: existing } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, check_in, check_out')
      .eq('villa_id', villaId)
      .in('status', ['pending', 'confirmed', 'owner_block']);

    const overlaps = (existing || []).some(
      (b) => new Date(checkIn) < new Date(b.check_out) && new Date(checkOut) > new Date(b.check_in)
    );

    if (overlaps) {
      return Response.json({ ok: false, message: 'სამწუხაროდ, ეს თარიღები უკვე დაკავებულია' }, { status: 409 });
    }

    const { error } = await supabaseAdmin.from('villa_bookings').insert({
      villa_id: villaId,
      check_in: checkIn,
      check_out: checkOut,
      guest_name: guestName,
      guest_phone: guestPhone,
      guest_message: guestMessage,
      status: 'pending',
    });

    if (error) {
      return Response.json({ ok: false, message: 'მოთხოვნის გაგზავნა ვერ მოხერხდა' }, { status: 500 });
    }

    // Notify the owner by SMS (best-effort, doesn't block the response)
    const { data: owner } = await supabaseAdmin
      .from('owners')
      .select('phone')
      .eq('id', villa.owner_id)
      .single();

    if (owner?.phone) {
      const normalized = normalizeSmsPhone(owner.phone);
      if (normalized) {
        await sendSms(
          normalized,
          `ახალი ჯავშნის მოთხოვნა "${villa.title}" — ${checkIn} → ${checkOut}. სტუმარი: ${guestName}, ${guestPhone}. იხილეთ: https://buknarivilla.ge/dashboard`
        );
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
