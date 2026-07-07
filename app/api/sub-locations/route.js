import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const village = searchParams.get('village');

  if (!village) {
    return Response.json({ ok: false, message: 'village პარამეტრი აუცილებელია' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('sub_locations')
    .select('id, name, sort_order')
    .eq('village', village)
    .order('sort_order', { ascending: true });

  if (error) {
    return Response.json({ ok: false, message: 'ჩატვირთვა ვერ მოხერხდა' }, { status: 500 });
  }
  return Response.json({ ok: true, subLocations: data });
}
