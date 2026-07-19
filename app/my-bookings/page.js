'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { t } from '../i18n';
import LangSwitch from '../LangSwitch';
import { localizedHref } from '../localizedHref';

function fmt(dateStr) {
  return dateStr;
}

function localizedVillaTitle(villa, lang) {
  if (!villa) return null;
  if (lang === 'en' && villa.title_en) return villa.title_en;
  if (lang === 'ru' && villa.title_ru) return villa.title_ru;
  if (lang === 'hy' && villa.title_hy) return villa.title_hy;
  return villa.title;
}

function localizedVillaLocation(villa, lang) {
  if (!villa) return null;
  if (lang === 'en' && villa.location_name_en) return villa.location_name_en;
  if (lang === 'ru' && villa.location_name_ru) return villa.location_name_ru;
  if (lang === 'hy' && villa.location_name_hy) return villa.location_name_hy;
  return villa.location_name;
}

export default function MyBookingsPage() {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);

  const STATUS_LABELS = {
    pending: tt('statusPending'),
    confirmed: tt('statusConfirmed'),
    declined: tt('statusDeclined'),
  };

  const [step, setStep] = useState('checking'); // checking | phone | code | list
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState(null);
  const [sessionPhone, setSessionPhone] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelingId, setCancelingId] = useState(null);

  const loadBookings = useCallback((ph, tok) => {
    setLoading(true);
    setError('');
    fetch('/api/guest/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: ph, token: tok }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          try {
            localStorage.removeItem('buknari_guest_phone');
            localStorage.removeItem('buknari_guest_token');
          } catch (e) {
            // ignore
          }
          setStep('phone');
          setError(data.message || tt('mbSessionExpired'));
        } else {
          setBookings(data.bookings);
          setStep('list');
        }
      })
      .catch(() => setError(tt('connectionError')))
      .finally(() => setLoading(false));
  }, [lang]);

  useEffect(() => {
    let ph = null;
    let tok = null;
    try {
      ph = localStorage.getItem('buknari_guest_phone');
      tok = localStorage.getItem('buknari_guest_token');
    } catch (e) {
      // localStorage blocked — just fall through to the phone-entry step
    }
    if (ph && tok) {
      setSessionPhone(ph);
      setToken(tok);
      loadBookings(ph, tok);
    } else {
      setStep('phone');
    }
  }, [loadBookings]);

  async function handleSendOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.message || tt('genericError'));
      } else {
        setStep('code');
      }
    } catch (err) {
      setError(tt('connectionErrorRetry'));
    }
    setLoading(false);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/guest/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.message || tt('genericError'));
      } else {
        try {
          localStorage.setItem('buknari_guest_phone', data.phone);
          localStorage.setItem('buknari_guest_token', data.token);
        } catch (e) {
          // ignore — session just won't persist across visits
        }
        setSessionPhone(data.phone);
        setToken(data.token);
        loadBookings(data.phone, data.token);
      }
    } catch (err) {
      setError(tt('connectionErrorRetry'));
    }
    setLoading(false);
  }

  function handleLogout() {
    try {
      localStorage.removeItem('buknari_guest_phone');
      localStorage.removeItem('buknari_guest_token');
    } catch (e) {
      // ignore
    }
    setSessionPhone(null);
    setToken(null);
    setBookings([]);
    setPhone('');
    setCode('');
    setStep('phone');
  }

  async function cancelBooking(bookingId) {
    if (!confirm(tt('mbConfirmCancel'))) return;
    setCancelingId(bookingId);
    try {
      const res = await fetch('/api/guest/cancel-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sessionPhone, token, bookingId }),
      });
      const data = await res.json();
      if (data.ok) {
        setBookings((list) => list.filter((b) => b.id !== bookingId));
      } else {
        setError(data.message || tt('genericError'));
      }
    } catch (e) {
      setError(tt('connectionError'));
    }
    setCancelingId(null);
  }

  if (step === 'checking') {
    return (
      <div className="auth-page">
        <div className="auth-texture" />
        <div className="auth-card">
          <p className="booking-loading">{tt('loadingGeneric')}</p>
        </div>
      </div>
    );
  }

  if (step === 'phone' || step === 'code') {
    return (
      <div className="auth-page">
        <div className="auth-texture" />
        <div className="auth-card">
          <a href={localizedHref('/', lang)} className="auth-logo">
            <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
          </a>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <LangSwitch />
          </div>

          {step === 'phone' && (
            <>
              <h1>{tt('mbTitle')}</h1>
              <p className="auth-sub">{tt('mbPhoneIntro')}</p>
              <form onSubmit={handleSendOtp}>
                <label>{tt('mbPhoneLabel')}</label>
                <input
                  type="tel"
                  placeholder="599 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                {error && <div className="auth-error">{error}</div>}
                <button type="submit" disabled={loading}>
                  {loading ? tt('mbSending') : tt('mbSendCode')}
                </button>
              </form>
            </>
          )}

          {step === 'code' && (
            <>
              <h1>{tt('mbCodeTitle')}</h1>
              <p className="auth-sub">
                {tt('mbCodeIntro')} <strong>{phone}</strong>
              </p>
              <form onSubmit={handleVerifyOtp}>
                <label>{tt('mbCodeLabel')}</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                />
                {error && <div className="auth-error">{error}</div>}
                <button type="submit" disabled={loading}>
                  {loading ? tt('mbVerifying') : tt('mbVerify')}
                </button>
                <button
                  type="button"
                  className="auth-secondary"
                  onClick={() => {
                    setStep('phone');
                    setError('');
                  }}
                >
                  {tt('mbChangeNumber')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <nav className="nav">
        <a href={localizedHref('/', lang)} className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href={localizedHref('/#listings', lang)}>{tt('navListings')}</a>
          <button type="button" className="guest-logout-link" onClick={handleLogout}>
            {tt('mbLogout')}
          </button>
        </div>
        <LangSwitch />
      </nav>

      <main className="wrap dashboard-content">
        <h1 className="dashboard-title">{tt('mbTitle')}</h1>
        <p className="guest-bookings-phone">{tt('mbPhoneNumberPrefix')} {sessionPhone}</p>

        {loading && <p className="booking-loading">{tt('loadingGeneric')}</p>}
        {error && <div className="auth-error">{error}</div>}

        {!loading && bookings.length === 0 && (
          <div className="empty-state">
            <p>{tt('mbEmpty')}</p>
          </div>
        )}

        {!loading &&
          bookings.map((b) => (
            <div key={b.id} className="guest-booking-card">
              <div className="guest-booking-main">
                <a href={localizedHref(`/villa/${b.villa_id}`, lang)} className="guest-booking-title">
                  {localizedVillaTitle(b.villas, lang) || 'Villa'}
                </a>
                {b.villas?.location_name && (
                  <div className="guest-booking-location">{localizedVillaLocation(b.villas, lang)}</div>
                )}
                <div className="guest-booking-dates">
                  {fmt(b.check_in)} → {fmt(b.check_out)}
                </div>
              </div>
              <div className="guest-booking-side">
                <span className={`guest-booking-status guest-booking-status-${b.status}`}>
                  {STATUS_LABELS[b.status] || b.status}
                </span>
                {b.cancel_code && (
                  <a href={`/invoice/${b.cancel_code}`} target="_blank" rel="noopener noreferrer" className="btn-unblock">
                    🧾 ინვოისი
                  </a>
                )}
                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <button
                    className="btn-unblock"
                    disabled={cancelingId === b.id}
                    onClick={() => cancelBooking(b.id)}
                  >
                    {cancelingId === b.id ? tt('mbCancelling') : tt('mbCancelBtn')}
                  </button>
                )}
              </div>
            </div>
          ))}
      </main>
    </div>
  );
}
