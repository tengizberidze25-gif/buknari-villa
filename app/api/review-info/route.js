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
    const lang = searchParams.get('lang') || 'ka';

    if (!bookingId || !token || !verifyBookingToken(bookingId, token)) {
      return Response.json({ ok: false, message: 'ბმული არასწორია' }, { status: 403 });
    }

    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, villa_id, status, guest_name, villas(title, title_en, title_ru, title_hy)')
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

    const villa = booking.villas || {};
    const villaTitle =
      (lang === 'en' && villa.title_en) ||
      (lang === 'ru' && villa.title_ru) ||
      (lang === 'hy' && villa.title_hy) ||
      villa.title ||
      '';

    return Response.json({
      ok: true,
      booking: {
        villaTitle,
        status: booking.status,
        guestName: booking.guest_name,
        alreadyReviewed: !!existingReview,
      },
    });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
