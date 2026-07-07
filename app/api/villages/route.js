import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('villages')
    .select('id, name, name_en, name_ru, name_hy, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    return Response.json({ ok: false, message: 'სოფლების ჩატვირთვა ვერ მოხერხდა' }, { status: 500 });
  }
  return Response.json({ ok: true, villages: data });
}
