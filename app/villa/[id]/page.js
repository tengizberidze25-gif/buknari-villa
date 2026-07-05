import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { averageRating } from '../../ratingLabel';
import VillaDetailContent from './VillaDetailContent';

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

export default async function VillaDetailPage({ params }) {
  const villa = await getVilla(params.id);
  if (!villa) notFound();

  const reviews = await getReviews(villa.id);
  const avgRating = averageRating(reviews);

  const photos = (villa.villa_photos || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => p.url);

  const whatsapp = villa.contact_whatsapp
    ? `https://wa.me/${villa.contact_whatsapp.replace(/\D/g, '')}`
    : null;
  const phone = villa.contact_phone ? villa.contact_phone.replace(/\s/g, '') : null;

  return (
    <VillaDetailContent
      villa={villa}
      reviews={reviews}
      avgRating={avgRating}
      photos={photos}
      whatsapp={whatsapp}
      phone={phone}
    />
  );
}
