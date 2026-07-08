import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { supabase } from '../../../lib/supabase';
import { averageRating } from '../../ratingLabel';
import VillaDetailContent from './VillaDetailContent';
import { buildAlternates, OG_LOCALE_MAP } from '../../hreflang';

export const revalidate = 30;

async function getVilla(id) {
  const { data, error } = await supabase
    .from('villas')
    .select('*, villa_photos(url, sort_order)')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error || !data) return null;
  return data;
}

async function getReviews(villaId) {
  const { data } = await supabase
    .from('villa_reviews')
    .select('*')
    .eq('villa_id', villaId)
    .order('created_at', { ascending: false });
  return data || [];
}

async function getSimilarVillas(villa) {
  const cols =
    'id, title, title_en, title_ru, title_hy, price_per_night, location_name, location_name_en, location_name_ru, location_name_hy, villa_photos(url, sort_order)';

  if (villa.village) {
    const { data } = await supabase
      .from('villas')
      .select(cols)
      .eq('status', 'approved')
      .eq('is_available', true)
      .eq('village', villa.village)
      .neq('id', villa.id)
      .limit(3);
    if (data && data.length > 0) return data;
  }

  const { data: fallback } = await supabase
    .from('villas')
    .select(cols)
    .eq('status', 'approved')
    .eq('is_available', true)
    .neq('id', villa.id)
    .limit(3);
  return fallback || [];
}

export async function generateMetadata({ params }) {
  const villa = await getVilla(params.id);
  if (!villa) return {};

  const locale = headers().get('x-locale') || 'ka';
  const { canonical, languages } = buildAlternates(`/villa/${villa.id}`, locale);

  const photos = (villa.villa_photos || []).sort((a, b) => a.sort_order - b.sort_order);
  const coverPhoto = photos[0]?.url;
  const title = `${villa.title} — Buknari Villa`;
  const description =
    (villa.description || '').slice(0, 160) ||
    'ვილების და სახლების გაქირავება ბუკნარში — buknarivilla.ge';

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Buknari Villa',
      locale: OG_LOCALE_MAP[locale] || 'ka_GE',
      type: 'website',
      images: coverPhoto ? [{ url: coverPhoto, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: coverPhoto ? [coverPhoto] : undefined,
    },
  };
}

export default async function VillaDetailPage({ params }) {
  const villa = await getVilla(params.id);
  if (!villa) notFound();

  const reviews = await getReviews(villa.id);
  const avgRating = averageRating(reviews);
  const similarVillas = await getSimilarVillas(villa);

  const photos = (villa.villa_photos || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => p.url);

  const whatsapp = villa.contact_whatsapp
    ? `https://wa.me/${villa.contact_whatsapp.replace(/\D/g, '')}`
    : null;
  const phone = villa.contact_phone ? villa.contact_phone.replace(/\s/g, '') : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: villa.title,
    description: villa.description || undefined,
    image: photos.length > 0 ? photos : undefined,
    address: villa.village || villa.location_name
      ? {
          '@type': 'PostalAddress',
          addressLocality: villa.village || villa.location_name,
          addressRegion: 'Adjara',
          addressCountry: 'GE',
        }
      : undefined,
    priceRange: villa.price_per_night ? `₾${villa.price_per_night}` : undefined,
    aggregateRating:
      reviews.length > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: avgRating,
            reviewCount: reviews.length,
            bestRating: 10,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VillaDetailContent
        villa={villa}
        reviews={reviews}
        avgRating={avgRating}
        photos={photos}
        whatsapp={whatsapp}
        phone={phone}
        similarVillas={similarVillas}
      />
    </>
  );
}
