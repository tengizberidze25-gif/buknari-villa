import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import crypto from 'crypto';

function verifyBookingToken(bookingId, token) {
  const secret = process.env.SESSION_SECRET;
  const expected = crypto.createHmac('sha256', secret).update(bookingId).digest('hex');
  return token === expected;
}

export async function POST(request) {
  try {
    const { bookingId, token } = await request.json();

    if (!bookingId || !token || !verifyBookingToken(bookingId, token)) {
      return Response.json({ ok: false, message: 'ბმული არასწორია' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('villa_bookings').delete().eq('id', bookingId);

    if (error) {
      return Response.json({ ok: false, message: 'გაუქმება ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
