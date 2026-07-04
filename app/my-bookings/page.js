'use client';

import { useState, useEffect, useCallback } from 'react';

const STATUS_LABELS = {
  pending: 'მოლოდინში',
  confirmed: 'დადასტურებული',
  declined: 'უარყოფილი',
};

function fmt(dateStr) {
  return dateStr;
}

export default function MyBookingsPage() {
  const [step, setStep] = useState('phone'); // phone | code | list
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
          localStorage.removeItem('buknari_guest_phone');
          localStorage.removeItem('buknari_guest_token');
          setStep('phone');
          setError(data.message || 'სესია ამოიწურა, გთხოვთ ხელახლა შეხვიდეთ');
        } else {
          setBookings(data.bookings);
          setStep('list');
        }
      })
      .catch(() => setError('კავშირის შეცდომა'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('buknari_guest_phone');
    const tok = localStorage.getItem('buknari_guest_token');
    if (ph && tok) {
      setSessionPhone(ph);
      setToken(tok);
      loadBookings(ph, tok);
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
        setError(data.message || 'დაფიქსირდა შეცდომა');
      } else {
        setStep('code');
      }
    } catch (err) {
      setError('კავშირის შეცდომა, სცადეთ თავიდან');
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
        setError(data.message || 'დაფიქსირდა შეცდომა');
      } else {
        localStorage.setItem('buknari_guest_phone', data.phone);
        localStorage.setItem('buknari_guest_token', data.token);
        setSessionPhone(data.phone);
        setToken(data.token);
        loadBookings(data.phone, data.token);
      }
    } catch (err) {
      setError('კავშირის შეცდომა, სცადეთ თავიდან');
    }
    setLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem('buknari_guest_phone');
    localStorage.removeItem('buknari_guest_token');
    setSessionPhone(null);
    setToken(null);
    setBookings([]);
    setPhone('');
    setCode('');
    setStep('phone');
  }

  async function cancelBooking(bookingId) {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ ჯავშნის გაუქმება?')) return;
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
        setError(data.message || 'გაუქმება ვერ მოხერხდა');
      }
    } catch (e) {
      setError('კავშირის შეცდომა');
    }
    setCancelingId(null);
  }

  if (step === 'phone' || step === 'code') {
    return (
      <div className="auth-page">
        <div className="auth-texture" />
        <div className="auth-card">
          <a href="/" className="auth-logo">
            <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
          </a>

          {step === 'phone' && (
            <>
              <h1>ჩემი ჯავშნები</h1>
              <p className="auth-sub">
                შეიყვანეთ ტელეფონის ნომერი, რომლითაც ჯავშანი გააკეთეთ — გამოგიგზავნით დამადასტურებელ კოდს SMS-ით.
              </p>
              <form onSubmit={handleSendOtp}>
                <label>ტელეფონის ნომერი</label>
                <input
                  type="tel"
                  placeholder="599 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                {error && <div className="auth-error">{error}</div>}
                <button type="submit" disabled={loading}>
                  {loading ? 'იგზავნება...' : 'კოდის გაგზავნა'}
                </button>
              </form>
            </>
          )}

          {step === 'code' && (
            <>
              <h1>შეიყვანეთ კოდი</h1>
              <p className="auth-sub">
                SMS კოდი გამოგზავნილია ნომერზე <strong>{phone}</strong>
              </p>
              <form onSubmit={handleVerifyOtp}>
                <label>დამადასტურებელი კოდი</label>
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
                  {loading ? 'მოწმდება...' : 'დადასტურება'}
                </button>
                <button
                  type="button"
                  className="auth-secondary"
                  onClick={() => {
                    setStep('phone');
                    setError('');
                  }}
                >
                  ← ნომრის შეცვლა
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
        <a href="/" className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href="/#listings">ვილები</a>
          <button type="button" className="guest-logout-link" onClick={handleLogout}>
            ნომრის შეცვლა
          </button>
        </div>
      </nav>

      <main className="wrap dashboard-content">
        <h1 className="dashboard-title">ჩემი ჯავშნები</h1>
        <p className="guest-bookings-phone">ნომერი: {sessionPhone}</p>

        {loading && <p className="booking-loading">იტვირთება...</p>}
        {error && <div className="auth-error">{error}</div>}

        {!loading && bookings.length === 0 && (
          <div className="empty-state">
            <p>თქვენს ნომერზე ჯავშანი ვერ მოიძებნა.</p>
          </div>
        )}

        {!loading &&
          bookings.map((b) => (
            <div key={b.id} className="guest-booking-card">
              <div className="guest-booking-main">
                <a href={`/villa/${b.villa_id}`} className="guest-booking-title">
                  {b.villas?.title || 'ვილა'}
                </a>
                {b.villas?.location_name && (
                  <div className="guest-booking-location">{b.villas.location_name}</div>
                )}
                <div className="guest-booking-dates">
                  {fmt(b.check_in)} → {fmt(b.check_out)}
                </div>
              </div>
              <div className="guest-booking-side">
                <span className={`guest-booking-status guest-booking-status-${b.status}`}>
                  {STATUS_LABELS[b.status] || b.status}
                </span>
                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <button
                    className="btn-unblock"
                    disabled={cancelingId === b.id}
                    onClick={() => cancelBooking(b.id)}
                  >
                    {cancelingId === b.id ? 'მიმდინარეობს...' : 'გაუქმება'}
                  </button>
                )}
              </div>
            </div>
          ))}
      </main>
    </div>
  );
}
