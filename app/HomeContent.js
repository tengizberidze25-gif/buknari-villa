'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from './LanguageContext';
import { t } from './i18n';
import LangSwitch from './LangSwitch';
import { ratingLabel } from './ratingLabel';

const VillaMap = dynamic(() => import('./VillaMap'), { ssr: false });

function coverPhoto(villa) {
  if (!villa.villa_photos || villa.villa_photos.length === 0) return null;
  const sorted = [...villa.villa_photos].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0].url;
}

function villaTitle(villa, lang) {
  if (lang === 'en' && villa.title_en) return villa.title_en;
  if (lang === 'ru' && villa.title_ru) return villa.title_ru;
  return villa.title;
}

function matchesLocation(villa, filter) {
  if (filter === 'all') return true;
  const loc = (villa.location_name || '').toLowerCase();
  if (filter === 'firstline') return loc.includes('პირველი') || loc.includes('ზღვასთან') || loc.includes('ზღვის');
  if (filter === 'center') return loc.includes('ცენტრ');
  return true;
}

export default function HomeContent({ villas }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);

  const [locationFilter, setLocationFilter] = useState('all');
  const [guestsFilter, setGuestsFilter] = useState('2');
  const [checkInDate, setCheckInDate] = useState('');

  const filteredVillas = useMemo(() => {
    const minGuests = Number(guestsFilter.replace('+', ''));
    return villas.filter((villa) => {
      const locOk = matchesLocation(villa, locationFilter);
      const guestsOk = !villa.max_guests || villa.max_guests >= minGuests;
      return locOk && guestsOk;
    });
  }, [villas, locationFilter, guestsFilter]);

  function scrollToListings(e) {
    e.preventDefault();
    document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <nav className="nav">
        <a href="/" className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href="#listings">{tt('navListings')}</a>
          <a href="#owner">{tt('navOwners')}</a>
          <a href="/my-bookings">{tt('navBookings')}</a>
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
                <option value="all">{tt('searchLocationAll')}</option>
                <option value="firstline">{tt('searchLocationFirstline')}</option>
                <option value="center">{tt('searchLocationCenter')}</option>
              </select>
            </div>
            <div className="search-field">
              <label>{tt('searchGuestsLabel')}</label>
              <select value={guestsFilter} onChange={(e) => setGuestsFilter(e.target.value)}>
                <option value="2">2 {tt('guestsLabel')}</option>
                <option value="4">4 {tt('guestsLabel')}</option>
                <option value="6">6+ {tt('guestsLabel')}</option>
              </select>
            </div>
            <div className="search-field">
              <label>{tt('searchDateLabel')}</label>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
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

      <main className="wrap">
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
                return (
                  <a href={`/villa/${villa.id}`} className="villa-card" key={villa.id}>
                    <div className="villa-photo">
                      <img src={photo || '/placeholder-villa.jpg'} alt={title} />
                      <div className="villa-price-tag">
                        <span>₾{villa.price_per_night || '—'}</span> {tt('perNight')}
                      </div>
                    </div>
                    <div className="villa-body">
                      <div className="villa-location-row">
                        <div className="villa-location">{villa.location_name}</div>
                        {villa.avg_rating ? (
                          <div className="villa-card-rating">
                            <span>{villa.avg_rating}</span> {ratingLabel(villa.avg_rating)}
                          </div>
                        ) : null}
                      </div>
                      <h3 className="villa-title">{title}</h3>
                      <div className="villa-meta">
                        {villa.max_guests ? <span>👤 {villa.max_guests} {tt('guestsLabel')}</span> : null}
                        {villa.bedrooms ? <span>🛏 {villa.bedrooms} {tt('bedroomsLabel')}</span> : null}
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
        <div className="footer-meta">{tt('footerMeta')}</div>
      </footer>
    </>
  );
}
