'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../LanguageContext';
import { t } from '../../i18n';
import LangSwitch from '../../LangSwitch';
import { localizedHref } from '../../localizedHref';

export default function CancelBookingPage({ params }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);

  const STATUS_LABELS = {
    pending: tt('statusPending'),
    confirmed: tt('statusConfirmed'),
    declined: tt('statusDeclined'),
  };

  const code = params.bookingId;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code) {
      setError(tt('cbLinkIncomplete'));
      setLoading(false);
      return;
    }
    fetch(`/api/booking-info?code=${code}&lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) setError(data.message || tt('cbNotFound'));
        else setBooking(data.booking);
      })
      .catch(() => setError(tt('connectionError')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, lang]);

  async function handleCancel() {
    setCancelling(true);
    setError('');
    try {
      const res = await fetch('/api/guest-cancel-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.ok) setDone(true);
      else setError(data.message || tt('genericError'));
    } catch (e) {
      setError(tt('connectionError'));
    }
    setCancelling(false);
  }

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

        {loading && <p className="booking-loading">{tt('loadingGeneric')}</p>}

        {!loading && error && <div className="auth-error">{error}</div>}

        {!loading && booking && !done && (
          <>
            <h1>{tt('cbTitle')}</h1>
            <p className="auth-sub">
              "{booking.villaTitle}" — {booking.checkIn} → {booking.checkOut}
              <br />
              {tt('cbStatusPrefix')} {STATUS_LABELS[booking.status] || booking.status}
            </p>

            {booking.status === 'declined' ? (
              <p className="dashboard-empty-hint">{tt('cbAlreadyDeclined')}</p>
            ) : (
              <button className="auth-cta" style={{ border: 'none', cursor: 'pointer' }} onClick={handleCancel} disabled={cancelling}>
                {cancelling ? tt('mbCancelling') : tt('cbCancelBtn')}
              </button>
            )}
          </>
        )}

        {done && (
          <>
            <h1>{tt('cbDoneTitle')}</h1>
            <p className="auth-sub">{tt('cbDoneMessage')}</p>
            <a href={localizedHref('/', lang)} className="auth-cta">{tt('backHome')}</a>
          </>
        )}
      </div>
    </div>
  );
}
