'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useLanguage } from './LanguageContext';
import { t } from './i18n';
import LangSwitch from './LangSwitch';
import { ratingLabel } from './ratingLabel';
import VillageVideoGallery from './VillageVideoGallery';
import { localizedHref } from './localizedHref';
import { countLabel } from './pluralLabel';
import { getAutoDistances } from '../lib/geo';

const VillaMap = dynamic(() => import('./VillaMap'), { ssr: false });

function coverPhoto(villa) {
  if (!villa.villa_photos || villa.villa_photos.length === 0) return null;
  const sorted = [...villa.villa_photos].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0].url;
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

function displayPrice(villa) {
  if (villa.high_season_price && isTodayInSeason(villa.high_season_start, villa.high_season_end)) {
    return villa.high_season_price;
  }
  return villa.price_per_night;
}

function villaTitle(villa, lang) {
  if (lang === 'en' && villa.title_en) return villa.title_en;
  if (lang === 'ru' && villa.title_ru) return villa.title_ru;
  if (lang === 'hy' && villa.title_hy) return villa.title_hy;
  return villa.title;
}

function villageLabel(village, lang) {
  if (lang === 'en' && village.name_en) return village.name_en;
  if (lang === 'ru' && village.name_ru) return village.name_ru;
  if (lang === 'hy' && village.name_hy) return village.name_hy;
  return village.name;
}

const ALL_LABEL = { ge: 'ყველა', en: 'All', ru: 'Все', hy: 'Բոլորը' };

function villaLocation(villa, lang) {
  if (lang === 'en' && villa.location_name_en) return villa.location_name_en;
  if (lang === 'ru' && villa.location_name_ru) return villa.location_name_ru;
  if (lang === 'hy' && villa.location_name_hy) return villa.location_name_hy;
  return villa.location_name;
}

function matchesLocation(villa, filter) {
  if (filter === 'all') return true;
  return villa.village === filter;
}

export default function HomeContent({ villas, testimonials }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);

  const [locationFilter, setLocationFilter] = useState('all');
  const [guestsFilter, setGuestsFilter] = useState(2);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const guestBtnRef = useRef(null);
  const [guestPopoverPos, setGuestPopoverPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function toggleGuestsPopover() {
    if (!guestsOpen && guestBtnRef.current) {
      const rect = guestBtnRef.current.getBoundingClientRect();
      setGuestPopoverPos({ top: rect.bottom + 10, left: rect.left });
    }
    setGuestsOpen((o) => !o);
  }
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [villages, setVillages] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('buknari_favorites') || '[]');
      setFavorites(new Set(stored));
    } catch (e) {
      // ignore malformed storage
    }
  }, []);

  function toggleFavorite(villaId, e) {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(villaId)) next.delete(villaId);
      else next.add(villaId);
      localStorage.setItem('buknari_favorites', JSON.stringify([...next]));
      return next;
    });
  }

  const [compareIds, setCompareIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);

  function toggleCompare(villaId, e) {
    e.preventDefault();
    e.stopPropagation();
    setCompareIds((prev) => {
      if (prev.includes(villaId)) return prev.filter((id) => id !== villaId);
      if (prev.length >= 3) return prev; // cap at 3 villas for a readable table
      return [...prev, villaId];
    });
  }

  useEffect(() => {
    fetch('/api/villas-availability')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setAvailabilityMap(data.availability);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/villages')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setVillages(data.villages);
      })
      .catch(() => {});
  }, []);

  function isVillaAvailable(villaId) {
    if (!checkInDate || !checkOutDate) return true;
    const ranges = availabilityMap[villaId] || [];
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (!(start < end)) return true;
    return !ranges.some((r) => {
      const rStart = new Date(r.check_in);
      const rEnd = new Date(r.check_out);
      return start < rEnd && rStart < end;
    });
  }

  const filteredVillas = useMemo(() => {
    const minGuests = guestsFilter;
    const matching = villas.filter((villa) => {
      const locOk = matchesLocation(villa, locationFilter);
      const guestsOk = !villa.max_guests || villa.max_guests >= minGuests;
      const favOk = !favoritesOnly || favorites.has(villa.id);
      return locOk && guestsOk && favOk;
    });

    return [...matching].sort((a, b) => {
      const aAvail = isVillaAvailable(a.id) ? 0 : 1;
      const bAvail = isVillaAvailable(b.id) ? 0 : 1;
      return aAvail - bAvail;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [villas, locationFilter, guestsFilter, checkInDate, checkOutDate, availabilityMap, favoritesOnly, favorites]);

  const popularVillaIds = useMemo(() => {
    const withViews = villas.filter((v) => (v.views_count || 0) >= 5);
    const sorted = [...withViews].sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    return new Set(sorted.slice(0, 3).map((v) => v.id));
  }, [villas]);

  function scrollToListings(e) {
    e.preventDefault();
    document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
  }

  const effectiveVillageForVideo = locationFilter === 'all' ? 'ბუკნარი' : locationFilter;

  return (
    <>
      <nav className="nav">
        <a href={localizedHref('/', lang)} className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href="#listings">{tt('navListings')}</a>
          <a href="#owner">{tt('navOwners')}</a>
          <a href={localizedHref('/my-bookings', lang)}>{tt('navBookings')}</a>
          <a href="#contact">{tt('navContact')}</a>
        </div>
        <LangSwitch />
      </nav>

      <header className="hero">
        <div className="hero-texture" />
        <div className="horizon" />
        <div className="wrap hero-inner">
          <div className="eyebrow">{tt('heroEyebrow')}</div>
          <h1>
            {tt('heroTitleLine1')}
            <br />
            <em>{tt('heroTitleEm')}</em>
            <br />
            {tt('heroTitleLine2')}
            <br />
            {tt('heroTitleLine3')}
          </h1>
          <p className="hero-sub">{tt('heroSub')}</p>

          <div className="search-panel">
            <div className="search-field">
              <label>{tt('searchLocationLabel')}</label>
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                <option value="all">{ALL_LABEL[lang] || 'ყველა'}</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.name}>{villageLabel(v, lang)}</option>
                ))}
              </select>
            </div>
            <div className="search-field" style={{ position: 'relative' }}>
              <label>{tt('searchGuestsLabel')}</label>
              <button
                type="button"
                ref={guestBtnRef}
                className="guest-stepper-trigger"
                onClick={toggleGuestsPopover}
              >
                {guestsFilter} {countLabel(guestsFilter, lang, 'guest')}
              </button>

              {guestsOpen && mounted && createPortal(
                <>
                  <div className="guest-stepper-backdrop" onClick={() => setGuestsOpen(false)} />
                  <div
                    className="guest-stepper-popover"
                    style={{ position: 'fixed', top: guestPopoverPos.top, left: guestPopoverPos.left }}
                  >
                    <span>{countLabel(guestsFilter, lang, 'guest')}</span>
                    <div className="guest-stepper-controls">
                      <button
                        type="button"
                        className="guest-stepper-btn"
                        disabled={guestsFilter <= 1}
                        onClick={() => setGuestsFilter((n) => Math.max(1, n - 1))}
                      >
                        −
                      </button>
                      <span className="guest-stepper-count">{guestsFilter}</span>
                      <button
                        type="button"
                        className="guest-stepper-btn"
                        disabled={guestsFilter >= 20}
                        onClick={() => setGuestsFilter((n) => Math.min(20, n + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
            <div className="search-field search-field-dates">
              <label>{tt('searchDateLabel')}</label>
              <div className="search-dates-row">
                <div className="search-date-col">
                  <span className="search-date-sublabel">{tt('checkInLabel')}</span>
                  <div className="search-date-input-wrap">
                    <input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={checkInDate}
                      onChange={(e) => {
                        setCheckInDate(e.target.value);
                        if (checkOutDate && e.target.value >= checkOutDate) setCheckOutDate('');
                      }}
                    />
                    <span className="search-date-icon">📅</span>
                  </div>
                </div>
                <span className="search-dates-arrow">→</span>
                <div className="search-date-col">
                  <span className="search-date-sublabel">{tt('checkOutLabel')}</span>
                  <div className="search-date-input-wrap">
                    <input
                      type="date"
                      min={checkInDate || new Date().toISOString().slice(0, 10)}
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      disabled={!checkInDate}
                    />
                    <span className="search-date-icon">📅</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="search-btn" onClick={scrollToListings}>
              {tt('searchBtn')}
            </button>
          </div>
        </div>

        <div className="scroll-hint">
          <div className="scroll-hint-line" />
          {tt('scrollHint')}
        </div>
      </header>

      <VillageVideoGallery village={effectiveVillageForVideo} />

      <main className="wrap">
        <section className="section" id="how-it-works">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">{tt('howItWorksEyebrow')}</div>
              <h2>{tt('howItWorksTitle')}</h2>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '32px',
              marginTop: '8px',
            }}
          >
            {[1, 2, 3].map((step) => (
              <div key={step}>
                <div style={{ fontSize: '2rem', fontWeight: 700, opacity: 0.35, marginBottom: '8px' }}>
                  {String(step).padStart(2, '0')}
                </div>
                <h3 style={{ marginBottom: '6px' }}>{tt(`howItWorksStep${step}Title`)}</h3>
                <p style={{ opacity: 0.8 }}>{tt(`howItWorksStep${step}Desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="section-divider" />

        <section className="section" id="listings">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">{tt('sectionEyebrow')}</div>
              <h2>{tt('sectionTitle')}</h2>
            </div>
            <div className="section-head-right">
              <p>{tt('sectionSub')}</p>
              <div className="section-head-actions">
                {favorites.size > 0 && (
                  <button
                    type="button"
                    className={`favorites-toggle${favoritesOnly ? ' active' : ''}`}
                    onClick={() => setFavoritesOnly((v) => !v)}
                  >
                    ❤️ {tt('favoritesOnlyLabel')} ({favorites.size})
                  </button>
                )}
                <a href="#map" className="favorites-toggle">
                  🗺️ {tt('viewOnMapLabel')}
                </a>
              </div>
            </div>
          </div>

          {filteredVillas.length === 0 ? (
            <div className="empty-state">
              <p>{favoritesOnly ? tt('noFavorites') : villas.length === 0 ? tt('emptyState') : tt('noResults')}</p>
            </div>
          ) : (
            <div className="villa-grid">
              {filteredVillas.map((villa) => {
                const photo = coverPhoto(villa);
                const title = villaTitle(villa, lang);
                const available = isVillaAvailable(villa.id);
                const showBadge = checkInDate && checkOutDate && !available;
                return (
                  <a href={localizedHref(`/villa/${villa.id}`, lang)}
                    className={`villa-card${showBadge ? ' villa-card-unavailable' : ''}`}
                    key={villa.id}
                  >
                    <div className="villa-photo">
                      <img src={photo || '/placeholder-villa.jpg'} alt={title} />
                      <button
                        type="button"
                        className={`villa-favorite-btn${favorites.has(villa.id) ? ' active' : ''}`}
                        onClick={(e) => toggleFavorite(villa.id, e)}
                        aria-label={tt('favoritesOnlyLabel')}
                      >
                        {favorites.has(villa.id) ? '❤️' : '🤍'}
                      </button>
                      <div className="villa-price-tag">
                        <span>₾{displayPrice(villa) || '—'}</span> {tt('perNight')}
                      </div>
                      {showBadge && <div className="villa-unavailable-badge">{tt('datesBookedBadge')}</div>}
                      {!showBadge && popularVillaIds.has(villa.id) && (
                        <div className="villa-popular-badge">🔥 {tt('popularBadge')}</div>
                      )}
                    </div>
                    <div className="villa-body">
                      <div className="villa-location-row">
                        <div className="villa-location">{villaLocation(villa, lang)}</div>
                        {villa.avg_rating ? (
                          <div className="villa-card-rating">
                            <span>{villa.avg_rating}</span> {ratingLabel(villa.avg_rating, lang)}
                          </div>
                        ) : null}
                      </div>
                      <h3 className="villa-title">{title}</h3>
                      <div className="villa-meta">
                        {villa.max_guests ? <span>👤 {villa.max_guests} {countLabel(villa.max_guests, lang, 'guest')}</span> : null}
                        {villa.bedrooms ? <span>🛏 {villa.bedrooms} {countLabel(villa.bedrooms, lang, 'bedroom')}</span> : null}
                      </div>
                      <button
                        type="button"
                        className={`villa-compare-btn${compareIds.includes(villa.id) ? ' active' : ''}`}
                        onClick={(e) => toggleCompare(villa.id, e)}
                      >
                        {compareIds.includes(villa.id) ? '✓ ' : '⚖️ '}
                        {tt('compareBtnLabel')}
                      </button>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        <div className="section-divider" />

        <section className="section" id="map">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">{tt('mapEyebrow')}</div>
              <h2>{tt('mapTitle')}</h2>
            </div>
            <a href="#listings" className="favorites-toggle">
              ☰ {tt('backToListLabel')}
            </a>
          </div>
          <VillaMap villas={filteredVillas} villaTitle={villaTitle} lang={lang} />
        </section>

        {testimonials && testimonials.length > 0 && (
          <>
            <div className="section-divider" />
            <section className="section" id="testimonials">
              <div className="section-head">
                <div>
                  <div className="section-eyebrow">{tt('testimonialsEyebrow')}</div>
                  <h2>{tt('testimonialsTitle')}</h2>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '20px',
                  marginTop: '8px',
                }}
              >
                {testimonials.map((tItem, i) => (
                  <div
                    key={i}
                    style={{
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px',
                      padding: '20px',
                    }}
                  >
                    <div style={{ marginBottom: '10px', fontWeight: 700 }}>
                      {tItem.rating}/10
                    </div>
                    <p style={{ opacity: 0.9, marginBottom: '14px' }}>&ldquo;{tItem.comment}&rdquo;</p>
                    <div style={{ fontSize: '0.85rem', opacity: 0.65 }}>
                      {tItem.guest_name || ''}
                      {tItem.villas ? ` · ${villaTitle(tItem.villas, lang)}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="section-divider" />

        <section className="section" id="owner">
          <div className="cta-panel">
            <div className="cta-text">
              <h3>{tt('ctaTitle')}</h3>
              <p>{tt('ctaSub')}</p>
            </div>
            <div className="cta-actions">
              <a href="/register" className="cta-btn">
                {tt('ctaBtn')}
              </a>
              <a href="/dashboard" className="cta-secondary-link">
                {tt('ownerLoginLink')}
              </a>
            </div>
          </div>
        </section>

        <div className="section-divider" />

        <section className="section partner-banner-section">
          <div className="partner-banner-label">{tt('partnerBannerLabel')}</div>
          <a
            href="https://www.facebook.com/BERTOWERBATUMI"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="partner-banner"
          >
            <img src="/ber-tower-banner.jpg" alt="BER Tower" className="partner-banner-img" />
            <div className="partner-banner-overlay" />
            <div className="partner-banner-text">
              <h3>{tt('partnerBannerTitle')}</h3>
              <p>{tt('partnerBannerDesc')}</p>
              <span className="partner-banner-btn">{tt('partnerBannerBtn')}</span>
            </div>
          </a>
        </section>
      </main>

      <footer className="wrap footer" id="contact">
        <div className="footer-logo">Buknari Villa</div>
        <a href="mailto:info@buknarivilla.ge" className="footer-email">info@buknarivilla.ge</a>
        <a href={localizedHref('/privacy', lang)} className="footer-email">{tt('footerPrivacy')}</a>
        <a href={localizedHref('/terms', lang)} className="footer-email">{tt('footerTerms')}</a>
        <div className="footer-meta">{tt('footerMeta')}</div>
      </footer>

      {compareIds.length > 0 && !compareOpen && (
        <div className="compare-bar">
          <span className="compare-bar-count">
            ⚖️ {tt('compareBarLabel')} ({compareIds.length}/3)
          </span>
          <div className="compare-bar-actions">
            <button type="button" className="compare-bar-clear" onClick={() => setCompareIds([])}>
              {tt('compareClearLabel')}
            </button>
            <button
              type="button"
              className="compare-bar-open"
              disabled={compareIds.length < 2}
              onClick={() => setCompareOpen(true)}
            >
              {tt('compareOpenLabel')} →
            </button>
          </div>
        </div>
      )}

      {compareOpen && (
        <div className="compare-modal-overlay" onClick={() => setCompareOpen(false)}>
          <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
            <div className="compare-modal-header">
              <h3>{tt('compareModalTitle')}</h3>
              <button type="button" className="compare-modal-close" onClick={() => setCompareOpen(false)}>
                ✕
              </button>
            </div>
            <div className="compare-table-wrap">
              <table className="compare-table">
                <tbody>
                  <tr className="compare-row-photo">
                    <td></td>
                    {compareIds.map((id) => {
                      const v = villas.find((x) => x.id === id);
                      if (!v) return <td key={id} />;
                      return (
                        <td key={id}>
                          <img src={coverPhoto(v) || '/placeholder-villa.jpg'} alt="" className="compare-photo" />
                          <a href={localizedHref(`/villa/${v.id}`, lang)} className="compare-title-link">
                            {villaTitle(v, lang)}
                          </a>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="compare-row-label">{tt('perNight')}</td>
                    {compareIds.map((id) => {
                      const v = villas.find((x) => x.id === id);
                      return <td key={id}>{v ? `₾${displayPrice(v)}` : '—'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="compare-row-label">{tt('guestsLabel')}</td>
                    {compareIds.map((id) => {
                      const v = villas.find((x) => x.id === id);
                      return <td key={id}>{v?.max_guests || '—'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="compare-row-label">{tt('bedroomsLabel')}</td>
                    {compareIds.map((id) => {
                      const v = villas.find((x) => x.id === id);
                      return <td key={id}>{v?.bedrooms || '—'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="compare-row-label">{tt('bathroomsLabel')}</td>
                    {compareIds.map((id) => {
                      const v = villas.find((x) => x.id === id);
                      return <td key={id}>{v?.bathrooms || '—'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="compare-row-label">{tt('reviewsLabel')}</td>
                    {compareIds.map((id) => {
                      const v = villas.find((x) => x.id === id);
                      return <td key={id}>{v?.avg_rating ? `${v.avg_rating} ★` : '—'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="compare-row-label">{tt('vdDistanceCenterLabel')}</td>
                    {compareIds.map((id) => {
                      const v = villas.find((x) => x.id === id);
                      if (!v) return <td key={id}>—</td>;
                      const auto = getAutoDistances(v.village, v.lat, v.lng);
                      const d = v.distance_center_m || auto.center;
                      return <td key={id}>{d ? `${d < 1000 ? d + ' მ' : (d / 1000).toFixed(1) + ' კმ'}` : '—'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="compare-row-label">{tt('vdDistanceSeaLabel')}</td>
                    {compareIds.map((id) => {
                      const v = villas.find((x) => x.id === id);
                      if (!v) return <td key={id}>—</td>;
                      const auto = getAutoDistances(v.village, v.lat, v.lng);
                      const d = v.distance_sea_m || auto.sea;
                      return <td key={id}>{d ? `${d < 1000 ? d + ' მ' : (d / 1000).toFixed(1) + ' კმ'}` : '—'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td></td>
                    {compareIds.map((id) => (
                      <td key={id}>
                        <a href={localizedHref(`/villa/${id}`, lang)} className="compare-view-btn">
                          {tt('compareViewLabel')} →
                        </a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
