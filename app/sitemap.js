import { supabase } from '../lib/supabase';

export default async function sitemap() {
  const baseUrl = 'https://www.buknarivilla.ge';

  const staticEntries = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  let villaEntries = [];
  try {
    const { data } = await supabase
      .from('villas')
      .select('id, created_at')
      .eq('status', 'approved')
      .eq('is_available', true);

    villaEntries = (data || []).map((villa) => ({
      url: `${baseUrl}/villa/${villa.id}`,
      lastModified: new Date(villa.created_at || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (e) {
    // If the DB call fails, still return the static entries rather than crashing the sitemap
  }

  return [...staticEntries, ...villaEntries];
}
