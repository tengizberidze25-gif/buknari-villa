'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from './LanguageContext';
import { t } from './i18n';
import LangSwitch from './LangSwitch';
import { ratingLabel } from './ratingLabel';
import VillageVideoGallery from './VillageVideoGallery';
import { localizedHref } from './localizedHref';
import { countLabel } from './pluralLabel';

const VillaMap = dynamic(() => import('./VillaMap'), { ssr: false });

function coverPhoto(villa) {
  if (!villa.villa_photos || villa.villa_photos.length === 0) return null;
  const sorted = [...villa.villa_photos].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0].url;
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
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [villages, setVillages] = useState([]);

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
      return locOk && guestsOk;
    });

    return [...matching].sort((a, b) => {
      const aAvail = isVillaAvailable(a.id) ? 0 : 1;
      const bAvail = isVillaAvailable(b.id) ? 0 : 1;
      return aAvail - bAvail;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [villas, locationFilter, guestsFilter, checkInDate, checkOutDate, availabilityMap]);

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
            {tt('heroTitleLine1')} <em>{tt('heroTitleEm')}</em>
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
                className="guest-stepper-trigger"
                onClick={() => setGuestsOpen((o) => !o)}
              >
                {guestsFilter} {countLabel(guestsFilter, lang, 'guest')}
              </button>

              {guestsOpen && (
                <>
                  <div className="guest-stepper-backdrop" onClick={() => setGuestsOpen(false)} />
                  <div className="guest-stepper-popover">
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
                </>
              )}
            </div>
            <div className="search-field search-field-dates">
              <label>{tt('searchDateLabel')}</label>
              <div className="search-dates-row">
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={checkInDate}
                  onChange={(e) => {
                    setCheckInDate(e.target.value);
                    if (checkOutDate && e.target.value >= checkOutDate) setCheckOutDate('');
                  }}
                />
                <span className="search-dates-arrow">→</span>
                <input
                  type="date"
                  min={checkInDate || new Date().toISOString().slice(0, 10)}
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  disabled={!checkInDate}
                />
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
            <p>{tt('sectionSub')}</p>
          </div>

          {filteredVillas.length === 0 ? (
            <div className="empty-state">
              <p>{villas.length === 0 ? tt('emptyState') : tt('noResults')}</p>
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
                      <div className="villa-price-tag">
                        <span>₾{villa.price_per_night || '—'}</span> {tt('perNight')}
                      </div>
                      {showBadge && <div className="villa-unavailable-badge">{tt('datesBookedBadge')}</div>}
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
      </main>

      <footer className="wrap footer" id="contact">
        <div className="footer-logo">Buknari Villa</div>
        <a href="mailto:info@buknarivilla.ge" className="footer-email">info@buknarivilla.ge</a>
        <a href={localizedHref('/privacy', lang)} className="footer-email">{tt('footerPrivacy')}</a>
        <a href={localizedHref('/terms', lang)} className="footer-email">{tt('footerTerms')}</a>
        <div className="footer-meta">{tt('footerMeta')}</div>
      </footer>
    </>
  );
}
