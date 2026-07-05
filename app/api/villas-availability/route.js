import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('villa_bookings')
      .select('villa_id, check_in, check_out')
      .in('status', ['pending', 'confirmed', 'owner_block']);

    if (error) {
      return Response.json({ ok: false, message: 'მონაცემების წამოღება ვერ მოხერხდა' }, { status: 500 });
    }

    // Group ranges by villa_id — never expose guest_name / guest_phone here
    const availability = {};
    for (const row of data || []) {
      if (!availability[row.villa_id]) availability[row.villa_id] = [];
      availability[row.villa_id].push({ check_in: row.check_in, check_out: row.check_out });
    }

    return Response.json({ ok: true, availability });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
