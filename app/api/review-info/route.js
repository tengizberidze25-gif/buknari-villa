import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import crypto from 'crypto';

function verifyBookingToken(bookingId, token) {
  const secret = process.env.SESSION_SECRET;
  const expected = crypto.createHmac('sha256', secret).update(bookingId).digest('hex');
  return token === expected;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const token = searchParams.get('t');

    if (!bookingId || !token || !verifyBookingToken(bookingId, token)) {
      return Response.json({ ok: false, message: 'ბმული არასწორია' }, { status: 403 });
    }

    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, villa_id, status, guest_name, villas(title)')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return Response.json({ ok: false, message: 'ჯავშანი ვერ მოიძებნა' }, { status: 404 });
    }

    const { data: existingReview } = await supabaseAdmin
      .from('villa_reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    return Response.json({
      ok: true,
      booking: {
        villaTitle: booking.villas?.title || '',
        status: booking.status,
        guestName: booking.guest_name,
        alreadyReviewed: !!existingReview,
      },
    });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
