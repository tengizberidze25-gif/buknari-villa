import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const villaId = searchParams.get('villaId');
    if (!villaId) {
      return Response.json({ ok: false, message: 'villaId აუცილებელია' }, { status: 400 });
    }

    const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const since72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

    const [{ count: recentViews }, { data: recentBookings }] = await Promise.all([
      supabaseAdmin
        .from('villa_view_events')
        .select('id', { count: 'exact', head: true })
        .eq('villa_id', villaId)
        .gte('created_at', since48h),
      supabaseAdmin
        .from('villa_bookings')
        .select('created_at')
        .eq('villa_id', villaId)
        .in('status', ['pending', 'confirmed'])
        .gte('created_at', since72h)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    let recentBookingHoursAgo = null;
    if (recentBookings && recentBookings.length > 0) {
      const diffMs = Date.now() - new Date(recentBookings[0].created_at).getTime();
      recentBookingHoursAgo = Math.max(1, Math.round(diffMs / (60 * 60 * 1000)));
    }

    return Response.json({
      ok: true,
      recentViews: recentViews || 0,
      recentBookingHoursAgo,
    });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
