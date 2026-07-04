'use client';

import { useLanguage } from './LanguageContext';
import { t } from './i18n';
import LangSwitch from './LangSwitch';

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

export default function HomeContent({ villas }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);

  return (
    <>
      <nav className="nav">
        <a href="/" className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href="#listings">{tt('navListings')}</a>
          <a href="#owner">{tt('navOwners')}</a>
          <a href="/dashboard">{tt('navBookings')}</a>
          <a href="#contact">{tt('navContact')}</a>
          <LangSwitch />
        </div>
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
              <select defaultValue="all">
                <option value="all">{tt('searchLocationAll')}</option>
                <option value="firstline">{tt('searchLocationFirstline')}</option>
                <option value="center">{tt('searchLocationCenter')}</option>
              </select>
            </div>
            <div className="search-field">
              <label>{tt('searchGuestsLabel')}</label>
              <select defaultValue="2">
                <option value="2">2 {tt('guestsLabel')}</option>
                <option value="4">4 {tt('guestsLabel')}</option>
                <option value="6">6+ {tt('guestsLabel')}</option>
              </select>
            </div>
            <div className="search-field">
              <label>{tt('searchDateLabel')}</label>
              <input type="text" placeholder={tt('searchDatePlaceholder')} />
            </div>
            <button className="search-btn">{tt('searchBtn')}</button>
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

          {villas.length === 0 ? (
            <div className="empty-state">
              <p>{tt('emptyState')}</p>
            </div>
          ) : (
            <div className="villa-grid">
              {villas.map((villa) => {
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
                      <div className="villa-location">{villa.location_name}</div>
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

        <section className="section" id="owner">
          <div className="cta-panel">
            <div className="cta-text">
              <h3>{tt('ctaTitle')}</h3>
              <p>{tt('ctaSub')}</p>
            </div>
            <a href="/register" className="cta-btn">
              {tt('ctaBtn')}
            </a>
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
