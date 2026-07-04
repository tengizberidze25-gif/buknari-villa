import { supabase } from '../lib/supabase';
import HomeContent from './HomeContent';
import { averageRating } from './ratingLabel';

export const revalidate = 30; // 30 წამში ერთხელ ახლდება (ISR)

async function getVillas() {
  const { data, error } = await supabase
    .from('villas')
    .select('*, villa_photos(url, sort_order)')
    .eq('status', 'approved')
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error.message);
    return [];
  }

  const villas = data || [];

  const { data: reviews } = await supabase.from('villa_reviews').select('villa_id, rating');
  const byVilla = {};
  (reviews || []).forEach((r) => {
    if (!byVilla[r.villa_id]) byVilla[r.villa_id] = [];
    byVilla[r.villa_id].push(r);
  });

  return villas.map((v) => ({
    ...v,
    avg_rating: averageRating(byVilla[v.id]),
    review_count: byVilla[v.id]?.length || 0,
  }));
}

export default async function HomePage() {
  const villas = await getVillas();
  return <HomeContent villas={villas} />;
}
