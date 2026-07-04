import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import crypto from 'crypto';

function verifyBookingToken(bookingId, token) {
  const secret = process.env.SESSION_SECRET;
  const expected = crypto.createHmac('sha256', secret).update(bookingId).digest('hex');
  return token === expected;
}

export async function POST(request) {
  try {
    const { bookingId, token, rating, comment } = await request.json();

    if (!bookingId || !token || !verifyBookingToken(bookingId, token)) {
      return Response.json({ ok: false, message: 'ბმული არასწორია' }, { status: 403 });
    }

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 10) {
      return Response.json({ ok: false, message: 'შეფასება უნდა იყოს 1-დან 10-მდე' }, { status: 400 });
    }

    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, villa_id, status, guest_name')
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

    const { error } = await supabaseAdmin.from('villa_reviews').insert({
      villa_id: booking.villa_id,
      booking_id: booking.id,
      guest_name: booking.guest_name,
      rating: ratingNum,
      comment: (comment || '').toString().trim(),
    });

    if (error) {
      return Response.json({ ok: false, message: 'შეფასების შენახვა ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
