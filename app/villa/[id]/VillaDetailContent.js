'use client';

import Gallery from './Gallery';
import BookingCalendar from './BookingCalendar';
import VillaLocationMap from './VillaLocationMap';
import { AMENITIES } from '../../amenities';
import { ratingLabel } from '../../ratingLabel';
import { useLanguage } from '../../LanguageContext';
import { t } from '../../i18n';
import LangSwitch from '../../LangSwitch';

function localized(villa, field, lang) {
  if (lang === 'en' && villa[`${field}_en`]) return villa[`${field}_en`];
  if (lang === 'ru' && villa[`${field}_ru`]) return villa[`${field}_ru`];
  if (lang === 'hy' && villa[`${field}_hy`]) return villa[`${field}_hy`];
  return villa[field];
}

const LOCALE_MAP = { ka: 'ka-GE', en: 'en-US', ru: 'ru-RU', hy: 'hy-AM' };

export default function VillaDetailContent({ villa, reviews, avgRating, photos, whatsapp, phone }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);

  const title = localized(villa, 'title', lang);
  const description = localized(villa, 'description', lang);

  return (
    <>
      <nav className="nav">
        <a href="/" className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href="/#listings">{tt('navListings')}</a>
          <a href="/#owner">{tt('navOwners')}</a>
          <a href="/#contact">{tt('navContact')}</a>
        </div>
        <LangSwitch />
      </nav>

      <main className="wrap villa-detail">
        <a href="/" className="back-link">{tt('backLink')}</a>

        <Gallery photos={photos} title={title} />

        <div className="villa-detail-grid">
          <div className="villa-detail-main">
            <div className="villa-detail-location">{villa.location_name}</div>
            <h1 className="villa-detail-title">{title}</h1>

            {avgRating ? (
              <div className="villa-rating-badge">
                <span className="villa-rating-score">{avgRating}</span>
                <span>
                  <strong>{ratingLabel(avgRating)}</strong>
                  <br />
                  {reviews.length} {tt('reviewsLabel')}
                </span>
              </div>
            ) : null}

            <div className="villa-detail-meta">
              {villa.max_guests ? <span>👤 {villa.max_guests} {tt('guestsLabel')}</span> : null}
              {villa.bedrooms ? <span>🛏 {villa.bedrooms} {tt('bedroomsLabel')}</span> : null}
              {villa.bathrooms ? <span>🛁 {villa.bathrooms} {tt('bathroomsLabel')}</span> : null}
            </div>

            {description ? (
              <>
                <div className="section-divider" />
                <p className="villa-detail-description">{description}</p>
              </>
            ) : null}

            {villa.amenities && villa.amenities.length > 0 ? (
              <>
                <div className="section-divider" />
                <h3 className="villa-amenities-title">{tt('vdAmenitiesTitle')}</h3>
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
                <h3 className="villa-amenities-title">{tt('vdLocationTitle')}</h3>
                <VillaLocationMap villa={villa} />
              </>
            ) : null}

            {reviews.length > 0 ? (
              <>
                <div className="section-divider" />
                <h3 className="villa-amenities-title">{tt('vdReviewsTitle')} ({reviews.length})</h3>
                <div className="villa-reviews-list">
                  {reviews.map((r) => (
                    <div key={r.id} className="villa-review-item">
                      <div className="villa-review-header">
                        <span className="villa-review-score">{r.rating}/10</span>
                        <span className="villa-review-name">{r.guest_name || tt('vdGuestFallback')}</span>
                        <span className="villa-review-date">
                          {new Date(r.created_at).toLocaleDateString(LOCALE_MAP[lang] || 'ka-GE', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                      {r.comment ? <p className="villa-review-comment">{r.comment}</p> : null}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <aside className="villa-detail-sidebar">
            <div className="villa-detail-price-box">
              <div className="villa-detail-price">
                <span>₾{villa.price_per_night || '—'}</span> {tt('perNight')}
              </div>
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="villa-detail-whatsapp">
                  {tt('vdWhatsappBtn')}
                </a>
              ) : null}
              {phone ? (
                <a href={`tel:${phone}`} className="villa-detail-phone">
                  📞 {villa.contact_phone}
                </a>
              ) : null}
              {!whatsapp && !phone ? (
                <p className="villa-detail-nocontact">{tt('vdNoContact')}</p>
              ) : null}
            </div>

            <BookingCalendar villaId={villa.id} />
          </aside>
        </div>
      </main>

      <footer className="wrap footer">
        <div className="footer-logo">Buknari Villa</div>
        <div className="footer-meta">{tt('footerMeta')}</div>
      </footer>
    </>
  );
}
