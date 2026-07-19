import { notFound } from 'next/navigation';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import InvoiceContent from './InvoiceContent';

export const metadata = {
  robots: { index: false, follow: false },
};

async function getBooking(code) {
  const { data: booking } = await supabaseAdmin
    .from('villa_bookings')
    .select('*')
    .eq('cancel_code', code)
    .maybeSingle();

  if (!booking) return null;

  const { data: villa } = await supabaseAdmin
    .from('villas')
    .select(
      'id, title, title_en, title_ru, title_hy, village, price_per_night, high_season_price, high_season_start, high_season_end, contact_phone, contact_whatsapp'
    )
    .eq('id', booking.villa_id)
    .maybeSingle();

  return { booking, villa };
}

export default async function InvoicePage({ params }) {
  const result = await getBooking(params.code);
  if (!result || !result.villa) notFound();

  return <InvoiceContent booking={result.booking} villa={result.villa} />;
}
