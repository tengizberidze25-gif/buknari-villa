'use client';

import { useState, useEffect } from 'react';
import Gallery from './Gallery';
import BookingCalendar from './BookingCalendar';
import VillaLocationMap from './VillaLocationMap';
import { AMENITIES } from '../../amenities';
import { ratingLabel } from '../../ratingLabel';
import { useLanguage } from '../../LanguageContext';
import { t } from '../../i18n';
import LangSwitch from '../../LangSwitch';
import { localizedHref } from '../../localizedHref';
import { countLabel } from '../../pluralLabel';
import { approxPrice } from '../../currency';

function localized(villa, field, lang) {
  if (lang === 'en' && villa[`${field}_en`]) return villa[`${field}_en`];
  if (lang === 'ru' && villa[`${field}_ru`]) return villa[`${field}_ru`];
  if (lang === 'hy' && villa[`${field}_hy`]) return villa[`${field}_hy`];
  return villa[field];
}

function amenityLabel(a, lang) {
  if (lang === 'en' && a.label_en) return a.label_en;
  if (lang === 'ru' && a.label_ru) return a.label_ru;
  if (lang === 'hy' && a.label_hy) return a.label_hy;
  return a.label;
}

const LOCALE_MAP = { ka: 'ka-GE', en: 'en-US', ru: 'ru-RU', hy: 'hy-AM' };

export default function VillaDetailContent({ villa, reviews, avgRating, photos, whatsapp, phone, similarVillas }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);

  const title = localized(villa, 'title', lang);
  const description = localized(villa, 'description', lang);

  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const villaUrl = `https://www.buknarivilla.ge/villa/${villa.id}`;

  useEffect(() => {
    const key = `buknari_viewed_${villa.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    fetch('/api/villa-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ villaId: villa.id }),
    }).catch(() => {});
  }, [villa.id]);

  async function handleShareClick() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: title, url: villaUrl });
      } catch (e) {
        // user cancelled or share failed silently — no fallback needed
      }
    } else {
      setShareMenuOpen((open) => !open);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(villaUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  }

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} — ${villaUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(villaUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(villaUrl)}&text=${encodeURIComponent(title)}`,
  };

  return (
    <>
      <nav className="nav">
        <a href={localizedHref('/', lang)} className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href={localizedHref('/#listings', lang)}>{tt('navListings')}</a>
          <a href={localizedHref('/#owner', lang)}>{tt('navOwners')}</a>
          <a href={localizedHref('/#contact', lang)}>{tt('navContact')}</a>
        </div>
        <LangSwitch />
      </nav>

      <main className="wrap villa-detail">
        <a href={localizedHref('/', lang)} className="back-link">{tt('backLink')}</a>

        <Gallery photos={photos} title={title} />

        <div className="villa-detail-grid">
          <div className="villa-detail-main">
            <div className="villa-detail-location">
              {localized(villa, 'location_name', lang)}
              {villa.display_id ? <span className="villa-detail-id">#{villa.display_id}</span> : null}
            </div>
            <h1 className="villa-detail-title">{title}</h1>

            {avgRating ? (
              <div className="villa-rating-badge">
                <span className="villa-rating-score">{avgRating}</span>
                <span>
                  <strong>{ratingLabel(avgRating, lang)}</strong>
                  <br />
                  {reviews.length} {countLabel(reviews.length, lang, 'review')}
                </span>
              </div>
            ) : null}

            <div className="villa-detail-meta">
              {villa.max_guests ? <span>👤 {villa.max_guests} {countLabel(villa.max_guests, lang, 'guest')}</span> : null}
              {villa.bedrooms ? <span>🛏 {villa.bedrooms} {countLabel(villa.bedrooms, lang, 'bedroom')}</span> : null}
              {villa.bathrooms ? <span>🛁 {villa.bathrooms} {countLabel(villa.bathrooms, lang, 'bathroom')}</span> : null}
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
                      <span>{a.icon}</span> {amenityLabel(a, lang)}
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
              <div className="villa-detail-price-row">
                <div className="villa-detail-price">
                  <span>₾{villa.price_per_night || '—'}</span> {tt('perNight')}
                  {approxPrice(villa.price_per_night, lang) && (
                    <div style={{ fontSize: '0.8rem', opacity: 0.65, fontWeight: 400 }}>
                      {approxPrice(villa.price_per_night, lang)}
                    </div>
                  )}
                </div>
                <div className="villa-share-wrap">
                  <button
                    type="button"
                    className="villa-share-btn"
                    onClick={handleShareClick}
                    aria-label={tt('vdShare')}
                  >
                    ↗ {tt('vdShare')}
                  </button>
                  {shareMenuOpen && (
                    <div className="villa-share-menu">
                      <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </a>
                      <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer">
                        Facebook
                      </a>
                      <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer">
                        Telegram
                      </a>
                      <button type="button" onClick={copyLink}>
                        {copied ? tt('vdLinkCopied') : tt('vdCopyLink')}
                      </button>
                    </div>
                  )}
                </div>
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

        {similarVillas && similarVillas.length > 0 && (
          <div className="section" style={{ marginTop: '48px' }}>
            <h2 style={{ marginBottom: '20px' }}>{tt('similarVillasTitle')}</h2>
            <div className="villa-grid">
              {similarVillas.map((sv) => {
                const svPhotos = (sv.villa_photos || []).sort((a, b) => a.sort_order - b.sort_order);
                const svCover = svPhotos[0]?.url;
                const svTitle = localized(sv, 'title', lang);
                const svLocation = localized(sv, 'location_name', lang);
                return (
                  <a href={localizedHref(`/villa/${sv.id}`, lang)} className="villa-card" key={sv.id}>
                    <div className="villa-photo">
                      <img src={svCover || '/placeholder-villa.jpg'} alt={svTitle} />
                      <div className="villa-price-tag">
                        <span>₾{sv.price_per_night || '—'}</span> {tt('perNight')}
                      </div>
                    </div>
                    <div className="villa-body">
                      <div className="villa-location">{svLocation}</div>
                      <h3 className="villa-title">{svTitle}</h3>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="wrap footer">
        <div className="footer-logo">Buknari Villa</div>
        <div className="footer-meta">{tt('footerMeta')}</div>
      </footer>
    </>
  );
}
