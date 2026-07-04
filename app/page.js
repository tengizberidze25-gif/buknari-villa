import { supabase } from '../lib/supabase';
import HomeContent from './HomeContent';

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
  return data || [];
}

export default async function HomePage() {
  const villas = await getVillas();
  return <HomeContent villas={villas} />;
}
