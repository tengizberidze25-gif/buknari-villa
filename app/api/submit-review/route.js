import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import crypto from 'crypto';

function verifyBookingToken(bookingId, token) {
  const secret = process.env.SESSION_SECRET;
  const expected = crypto.createHmac('sha256', secret).update(bookingId).digest('hex');
  return token === expected;
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
          ReportLabel: 'Buknari Villa Review',
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
    const { bookingId, token, rating, comment, photoPath } = await request.json();

    if (!bookingId || !token || !verifyBookingToken(bookingId, token)) {
      return Response.json({ ok: false, message: 'ბმული არასწორია' }, { status: 403 });
    }

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 10) {
      return Response.json({ ok: false, message: 'შეფასება უნდა იყოს 1-დან 10-მდე' }, { status: 400 });
    }

    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, villa_id, status, guest_name, villas(title, owner_id, owners(phone))')
      .eq('id', bookingId)
      .single();

    if (!booking || booking.status !== 'confirmed') {
      return Response.json({ ok: false, message: 'მხოლოდ დადასტურებული ჯავშნის შემდეგ შეგიძლიათ შეაფასოთ' }, { status: 400 });
    }

    const { data: existingReview } = await supabaseAdmin
      .from('villa_reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (existingReview) {
      return Response.json({ ok: false, message: 'თქვენ უკვე დატოვეთ შეფასება ამ ჯავშანზე' }, { status: 409 });
    }

    let photoUrl = null;
    if (photoPath) {
      const { data: publicUrlData } = supabaseAdmin.storage.from('review-photos').getPublicUrl(photoPath);
      photoUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabaseAdmin.from('villa_reviews').insert({
      villa_id: booking.villa_id,
      booking_id: booking.id,
      guest_name: booking.guest_name,
      rating: ratingNum,
      comment: (comment || '').toString().trim(),
      photo_url: photoUrl,
    });

    if (error) {
      return Response.json({ ok: false, message: 'შეფასების შენახვა ვერ მოხერხდა' }, { status: 500 });
    }

    const ownerPhone = normalizeSmsPhone(booking.villas?.owners?.phone);
    if (ownerPhone) {
      const commentPart = comment ? ` კომენტარი: "${comment}"` : '';
      await sendSms(
        ownerPhone,
        `ახალი შეფასება "${booking.villas?.title || ''}"-ზე — ${ratingNum}/10 (${booking.guest_name || 'სტუმარი'}-სგან).${commentPart}`
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
