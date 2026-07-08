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

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
