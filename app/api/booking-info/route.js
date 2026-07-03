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
      return Response.json({ ok: false, message: 'ბმული არასწორია ან ვადაგასულია' }, { status: 403 });
    }

    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, check_in, check_out, status, villas(title)')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return Response.json({ ok: false, message: 'ჯავშანი ვერ მოიძებნა' }, { status: 404 });
    }

    return Response.json({
      ok: true,
      booking: {
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        status: booking.status,
        villaTitle: booking.villas?.title || '',
      },
    });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
