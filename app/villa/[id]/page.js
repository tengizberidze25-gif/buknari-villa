import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Gallery from './Gallery';
import BookingCalendar from './BookingCalendar';
import { AMENITIES } from '../../amenities';
import VillaLocationMap from './VillaLocationMap';

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

export default async function VillaDetailPage({ params }) {
  const villa = await getVilla(params.id);
  if (!villa) notFound();

  const photos = (villa.villa_photos || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => p.url);

  const whatsapp = villa.contact_whatsapp
    ? `https://wa.me/${villa.contact_whatsapp.replace(/\D/g, '')}`
    : null;
  const phone = villa.contact_phone ? villa.contact_phone.replace(/\s/g, '') : null;

  return (
    <>
      <nav className="nav">
        <a href="/" className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href="/#listings">ვილები</a>
          <a href="/#owner">მფლობელებისთვის</a>
          <a href="/#contact">კონტაქტი</a>
        </div>
      </nav>

      <main className="wrap villa-detail">
        <a href="/" className="back-link">← ყველა ვილა</a>

        <Gallery photos={photos} title={villa.title} />

        <div className="villa-detail-grid">
          <div className="villa-detail-main">
            <div className="villa-detail-location">{villa.location_name}</div>
            <h1 className="villa-detail-title">{villa.title}</h1>

            <div className="villa-detail-meta">
              {villa.max_guests ? <span>👤 {villa.max_guests} სტუმარი</span> : null}
              {villa.bedrooms ? <span>🛏 {villa.bedrooms} საძინებელი</span> : null}
              {villa.bathrooms ? <span>🛁 {villa.bathrooms} სააბაზანო</span> : null}
            </div>

            {villa.description ? (
              <>
                <div className="section-divider" />
                <p className="villa-detail-description">{villa.description}</p>
              </>
            ) : null}

            {villa.amenities && villa.amenities.length > 0 ? (
              <>
                <div className="section-divider" />
                <h3 className="villa-amenities-title">კეთილმოწყობა</h3>
                <div className="villa-amenities-grid">
                  {AMENITIES.filter((a) => villa.amenities.includes(a.key)).map((a) => (
                    <div key={a.key} className="villa-amenity-item">
                      <span>{a.icon}</span> {a.label}
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {villa.lat && villa.lng ? (
              <>
                <div className="section-divider" />
                <h3 className="villa-amenities-title">მდებარეობა</h3>
                <VillaLocationMap villa={villa} />
              </>
            ) : null}
          </div>

          <aside className="villa-detail-sidebar">
            <div className="villa-detail-price-box">
              <div className="villa-detail-price">
                <span>₾{villa.price_per_night || '—'}</span> / ღამე
              </div>
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="villa-detail-whatsapp">
                  WhatsApp-ით დაკავშირება
                </a>
              ) : null}
              {phone ? (
                <a href={`tel:${phone}`} className="villa-detail-phone">
                  📞 {villa.contact_phone}
                </a>
              ) : null}
              {!whatsapp && !phone ? (
                <p className="villa-detail-nocontact">საკონტაქტო ინფორმაცია მალე დაემატება</p>
              ) : null}
            </div>

            <BookingCalendar villaId={villa.id} />
          </aside>
        </div>
      </main>

      <footer className="wrap footer">
        <div className="footer-logo">Buknari Villa</div>
        <div className="footer-meta">© 2026 buknarivilla.ge</div>
      </footer>
    </>
  );
}
