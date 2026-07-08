import { headers } from 'next/headers';
import { supabase } from '../lib/supabase';
import HomeContent from './HomeContent';
import { averageRating } from './ratingLabel';
import { buildAlternates } from './hreflang';

export const revalidate = 30; // 30 წამში ერთხელ ახლდება (ISR)

export async function generateMetadata() {
  const locale = headers().get('x-locale') || 'ka';
  return {
    alternates: buildAlternates('/', locale),
  };
}

async function getVillas() {
  const { data, error } = await supabase
    .from('villas')
    .select('*, villa_photos(url, sort_order)')
    .eq('status', 'approved')
    .eq('is_available', true)
    .order('sort_order', { ascending: true })
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

async function getTestimonials() {
  const { data } = await supabase
    .from('villa_reviews')
    .select('guest_name, rating, comment, created_at, villas(title, title_en, title_ru, title_hy)')
    .not('comment', 'is', null)
    .neq('comment', '')
    .gte('rating', 8)
    .order('created_at', { ascending: false })
    .limit(6);
  return data || [];
}

export default async function HomePage() {
  const villas = await getVillas();
  const testimonials = await getTestimonials();
  return <HomeContent villas={villas} testimonials={testimonials} />;
}
