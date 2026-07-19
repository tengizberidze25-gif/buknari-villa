'use client';

import { useState, useEffect } from 'react';
import Gallery from './Gallery';
import BookingCalendar from './BookingCalendar';
import VillaLocationMap from './VillaLocationMap';
import WeatherWidget from './WeatherWidget';
import { AMENITIES } from '../../amenities';
import { ratingLabel } from '../../ratingLabel';
import { useLanguage } from '../../LanguageContext';
import { t } from '../../i18n';
import LangSwitch from '../../LangSwitch';
import { localizedHref } from '../../localizedHref';
import { countLabel } from '../../pluralLabel';
import { approxPrice } from '../../currency';
import { getAutoDistances } from '../../../lib/geo';
import ConciergeChat from './ConciergeChat';
import SunsetCountdown from './SunsetCountdown';
import SeasonalityChart from './SeasonalityChart';

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

// Checks whether today falls within a recurring annual season, given as
// 'MM-DD' strings. Handles seasons that wrap across the new year (e.g. Dec–Jan).
function isTodayInSeason(startMMDD, endMMDD) {
  if (!startMMDD || !endMMDD) return false;
  const today = new Date();
  const [sm, sd] = startMMDD.split('-').map(Number);
  const [em, ed] = endMMDD.split('-').map(Number);
  const val = (today.getMonth() + 1) * 100 + today.getDate();
  const startVal = sm * 100 + sd;
  const endVal = em * 100 + ed;
  if (startVal <= endVal) return val >= startVal && val <= endVal;
  return val >= startVal || val <= endVal;
}

const LOCALE_MAP = { ka: 'ka-GE', en: 'en-US', ru: 'ru-RU', hy: 'hy-AM' };

const DISTANCE_UNITS = {
  ka: { m: 'მ', km: 'კმ' },
  en: { m: 'm', km: 'km' },
  ru: { m: 'м', km: 'км' },
  hy: { m: 'մ', km: 'կմ' },
};

function formatDistance(meters, lang) {
  if (!meters) return null;
  const units = DISTANCE_UNITS[lang] || DISTANCE_UNITS.ka;
  if (meters < 1000) return `${meters} ${units.m}`;
  return `${(meters / 1000).toFixed(1)} ${units.km}`;
}

export default function VillaDetailContent({ villa, reviews, avgRating, photos, whatsapp, phone, similarVillas }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);

  const title = localized(villa, 'title', lang);
  const description = localized(villa, 'description', lang);

  const autoDistances = getAutoDistances(villa.village, villa.lat, villa.lng);
  const distanceCenterM = villa.distance_center_m || autoDistances.center;
  const distanceSeaM = villa.distance_sea_m || autoDistances.sea;

  const inHighSeasonNow =
    villa.high_season_price && isTodayInSeason(villa.high_season_start, villa.high_season_end);
  const headlinePrice = inHighSeasonNow ? villa.high_season_price : villa.price_per_night;

  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [socialProof, setSocialProof] = useState(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const villaUrl = `https://www.buknarivilla.ge/villa/${villa.id}`;

  useEffect(() => {
    const target = document.getElementById('villa-booking-box');
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const key = `buknari_viewed_${villa.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) {
      // sessionStorage can throw in Safari private mode or restricted
      // in-app browser contexts (e.g. opened via a QR scanner) — if so,
      // we just skip the dedup and always log the view below.
    }
    fetch('/api/villa-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ villaId: villa.id }),
    }).catch(() => {});
  }, [villa.id]);

  useEffect(() => {
    function loadSocialProof() {
      fetch(`/api/villa-social-proof?villaId=${villa.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) setSocialProof(data);
        })
        .catch(() => {});
    }
    loadSocialProof();
    const interval = setInterval(loadSocialProof, 30000);
    return () => clearInterval(interval);
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

      <main className="wrap villa-detail" id="main-content">
        <a href={localizedHref('/', lang)} className="back-link">{tt('backLink')}</a>

        <Gallery photos={photos} title={title} />

        <div className="villa-detail-grid">
          <div className="villa-detail-main">
            <div className="villa-detail-location">
              {localized(villa, 'location_name', lang)}
              {villa.display_id ? <span className="villa-detail-id">#{villa.display_id}</span> : null}
            </div>
            <h1 className="villa-detail-title">{title}</h1>
            {socialProof && socialProof.liveViewers >= 2 && (
              <div className="live-presence-badge">
                <span className="live-presence-dot"></span>
                {tt('vdLiveViewers').replace('{count}', socialProof.liveViewers)}
              </div>
            )}
            <SunsetCountdown lat={villa.lat} lng={villa.lng} />
            {villa.owner_verified ? (
              <div className="verified-owner-badge">✓ {tt('verifiedOwnerLabel')}</div>
            ) : null}
            <WeatherWidget village={villa.village} />

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
              {distanceCenterM ? (
                <span>🚶 {formatDistance(distanceCenterM, lang)} {tt('vdDistanceCenterLabel')}</span>
              ) : null}
              {distanceSeaM ? (
                <span>🌊 {formatDistance(distanceSeaM, lang)} {tt('vdDistanceSeaLabel')}</span>
              ) : null}
            </div>

            {description ? (
              <>
                <div className="section-divider" />
                <p className="villa-detail-description">{description}</p>
              </>
            ) : null}

            {villa.video_url ? (
              <>
                <div className="section-divider" />
                <video
                  src={villa.video_url}
                  controls
                  playsInline
                  className="villa-detail-video"
                />
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

            <div className="section-divider" />
            <SeasonalityChart
              basePrice={villa.price_per_night}
              seasonPrice={villa.high_season_price}
              seasonStart={villa.high_season_start}
              seasonEnd={villa.high_season_end}
            />

            {villa.lat && villa.lng ? (
              <>
                <div className="section-divider" />
                <h3 className="villa-amenities-title">{tt('vdLocationTitle')}</h3>
                <VillaLocationMap villa={villa} />
              </>
            ) : null}

            {villa.nearby_food ? (
              <>
                <div className="section-divider" />
                <h3 className="villa-amenities-title">🍽 {tt('vdNearbyFoodTitle')}</h3>
                <p className="villa-detail-description">{localized(villa, 'nearby_food', lang)}</p>
              </>
            ) : null}

            {villa.nearby_shops ? (
              <>
                <div className="section-divider" />
                <h3 className="villa-amenities-title">🛒 {tt('vdNearbyShopsTitle')}</h3>
                <p className="villa-detail-description">{localized(villa, 'nearby_shops', lang)}</p>
              </>
            ) : null}

            {(villa.checkin_time || villa.checkout_time || villa.cancellation_policy || villa.house_rules) ? (
              <>
                <div className="section-divider" />
                <h3 className="villa-amenities-title">📋 {tt('vdStayInfoTitle')}</h3>
                <div className="villa-stay-info">
                  {villa.checkin_time ? (
                    <div className="villa-stay-info-row">
                      <span className="villa-stay-info-label">🔑 {tt('vdCheckinLabel')}</span>
                      <span>{villa.checkin_time}</span>
                    </div>
                  ) : null}
                  {villa.checkout_time ? (
                    <div className="villa-stay-info-row">
                      <span className="villa-stay-info-label">🚪 {tt('vdCheckoutLabel')}</span>
                      <span>{villa.checkout_time}</span>
                    </div>
                  ) : null}
                  {villa.house_rules ? (
                    <div className="villa-stay-info-row villa-stay-info-row-block">
                      <span className="villa-stay-info-label">📜 {tt('vdHouseRulesLabel')}</span>
                      <p>{localized(villa, 'house_rules', lang)}</p>
                    </div>
                  ) : null}
                  {villa.cancellation_policy ? (
                    <div className="villa-stay-info-row villa-stay-info-row-block">
                      <span className="villa-stay-info-label">↩️ {tt('vdCancellationLabel')}</span>
                      <p>{localized(villa, 'cancellation_policy', lang)}</p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            {villa.faq ? (
              <>
                <div className="section-divider" />
                <h3 className="villa-amenities-title">❓ {tt('vdFaqTitle')}</h3>
                <p className="villa-detail-description">{localized(villa, 'faq', lang)}</p>
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
                      {r.photo_url ? (
                        <img src={r.photo_url} alt="" className="villa-review-photo" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <aside className="villa-detail-sidebar" id="villa-booking-box">
            <div className="villa-detail-price-box">
              <div className="villa-detail-price-row">
                <div className="villa-detail-price">
                  <span>₾{headlinePrice || '—'}</span> {tt('perNight')}
                  {inHighSeasonNow ? <span className="villa-price-season-tag">🔥 {tt('vdHighSeasonLabel')}</span> : null}
                  {approxPrice(headlinePrice, lang) && (
                    <div style={{ fontSize: '0.8rem', opacity: 0.65, fontWeight: 400 }}>
                      {approxPrice(headlinePrice, lang)}
                    </div>
                  )}
                  {villa.high_season_price ? (
                    <div className="villa-high-season-note">
                      {inHighSeasonNow
                        ? `${tt('vdRegularPriceLabel')}: ₾${villa.price_per_night} ${tt('perNight')}`
                        : `🔥 ₾${villa.high_season_price} ${tt('perNight')} — ${tt('vdHighSeasonLabel')}`}
                    </div>
                  ) : null}
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

            {socialProof && (socialProof.recentViews >= 3 || socialProof.recentBookingHoursAgo) && (
              <div className="villa-social-proof">
                {socialProof.recentBookingHoursAgo ? (
                  <div className="villa-social-proof-item">
                    🔥 {tt('vdRecentBooking').replace('{hours}', socialProof.recentBookingHoursAgo)}
                  </div>
                ) : null}
                {socialProof.recentViews >= 3 ? (
                  <div className="villa-social-proof-item">
                    👀 {tt('vdRecentViews').replace('{count}', socialProof.recentViews)}
                  </div>
                ) : null}
              </div>
            )}

            <BookingCalendar
              villaId={villa.id}
              villaTitle={title}
              villaCoverPhoto={photos && photos[0]}
              whatsappNumber={villa.contact_whatsapp}
              pricePerNight={villa.price_per_night}
              minNights={villa.min_nights}
              village={villa.village}
              highSeasonPrice={villa.high_season_price}
              highSeasonStart={villa.high_season_start}
              highSeasonEnd={villa.high_season_end}
              longStayDiscountMinNights={villa.long_stay_discount_min_nights}
              longStayDiscountPct={villa.long_stay_discount_pct}
              referralExcluded={villa.referral_excluded}
            />
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

      {showStickyBar && (
        <div className="sticky-book-bar">
          <div className="sticky-book-bar-price">
            <span className="sticky-book-bar-amount">₾{headlinePrice || '—'}</span>
            <span className="sticky-book-bar-unit">{tt('perNight')}</span>
          </div>
          <button
            type="button"
            className="sticky-book-bar-btn"
            onClick={() =>
              document.getElementById('villa-booking-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          >
            {tt('stickyBookBtn')}
          </button>
        </div>
      )}

      <ConciergeChat villaId={villa.id} />
    </>
  );
}
