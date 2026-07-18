import { supabase } from '../lib/supabase';

const baseUrl = 'https://www.buknarivilla.ge';

function langAlternates(path) {
  const clean = path === '/' ? '' : path;
  return {
    languages: {
      en: `${baseUrl}/en${clean}`,
      ru: `${baseUrl}/ru${clean}`,
      hy: `${baseUrl}/hy${clean}`,
    },
  };
}

export default async function sitemap() {
  const staticEntries = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
      alternates: langAlternates('/'),
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
      alternates: langAlternates('/terms'),
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
      alternates: langAlternates('/privacy'),
    },
    {
      url: `${baseUrl}/guide/guests`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: langAlternates('/guide/guests'),
    },
    {
      url: `${baseUrl}/guide/owners`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: langAlternates('/guide/owners'),
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
      alternates: langAlternates(`/villa/${villa.id}`),
    }));
  } catch (e) {
    // If the DB call fails, still return the static entries rather than crashing the sitemap
  }

  return [...staticEntries, ...villaEntries];
}
