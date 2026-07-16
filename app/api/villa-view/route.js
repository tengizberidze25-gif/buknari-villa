import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { villaId } = await request.json();
    if (!villaId) {
      return Response.json({ ok: false, message: 'villaId აუცილებელია' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.rpc('increment_villa_views', {
      villa_id_input: villaId,
    });

    if (error) {
      return Response.json({ ok: false, message: 'დათვლა ვერ მოხერხდა' }, { status: 500 });
    }

    // Best-effort — powers the "viewed recently" social-proof badge.
    // Doesn't affect the response even if this insert fails.
    try {
      await supabaseAdmin.from('villa_view_events').insert({ villa_id: villaId });
    } catch (e) {
      // ignore
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
