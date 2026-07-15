import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const lang = searchParams.get('lang') || 'ka';

    if (!code) {
      return Response.json({ ok: false, message: 'ბმული არასწორია ან ვადაგასულია' }, { status: 403 });
    }

    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, check_in, check_out, status, villas(title, title_en, title_ru, title_hy)')
      .eq('cancel_code', code)
      .single();

    if (!booking) {
      return Response.json({ ok: false, message: 'ჯავშანი ვერ მოიძებნა' }, { status: 404 });
    }

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
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        status: booking.status,
        villaTitle,
      },
    });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
