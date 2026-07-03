import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const villaId = searchParams.get('villaId');

    if (!villaId) {
      return Response.json({ ok: false, message: 'villaId საჭიროა' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('villa_bookings')
      .select('check_in, check_out, status')
      .eq('villa_id', villaId)
      .in('status', ['pending', 'confirmed', 'owner_block']);

    if (error) {
      return Response.json({ ok: false, message: 'მონაცემების წამოღება ვერ მოხერხდა' }, { status: 500 });
    }

    // Only ever expose date ranges + status — never guest_name / guest_phone
    return Response.json({ ok: true, ranges: data || [] });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
