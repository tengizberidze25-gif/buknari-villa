'use client';

import { useState, useEffect } from 'react';

const STATUS_LABELS = {
  pending: 'მოლოდინში',
  confirmed: 'დადასტურებული',
  declined: 'უარყოფილი',
};

export default function CancelBookingPage({ params, searchParams }) {
  const bookingId = params.bookingId;
  const token = searchParams.t;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('ბმული არასრულია');
      setLoading(false);
      return;
    }
    fetch(`/api/booking-info?bookingId=${bookingId}&t=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) setError(data.message || 'ჯავშანი ვერ მოიძებნა');
        else setBooking(data.booking);
      })
      .catch(() => setError('კავშირის შეცდომა'))
      .finally(() => setLoading(false));
  }, [bookingId, token]);

  async function handleCancel() {
    setCancelling(true);
    setError('');
    try {
      const res = await fetch('/api/guest-cancel-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, token }),
      });
      const data = await res.json();
      if (data.ok) setDone(true);
      else setError(data.message || 'დაფიქსირდა შეცდომა');
    } catch (e) {
      setError('კავშირის შეცდომა');
    }
    setCancelling(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-texture" />
      <div className="auth-card">
        <a href="/" className="auth-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>

        {loading && <p className="booking-loading">იტვირთება...</p>}

        {!loading && error && <div className="auth-error">{error}</div>}

        {!loading && booking && !done && (
          <>
            <h1>ჯავშნის გაუქმება</h1>
            <p className="auth-sub">
              "{booking.villaTitle}" — {booking.checkIn} → {booking.checkOut}
              <br />
              სტატუსი: {STATUS_LABELS[booking.status] || booking.status}
            </p>

            {booking.status === 'declined' ? (
              <p className="dashboard-empty-hint">ეს ჯავშანი უკვე უარყოფილია.</p>
            ) : (
              <button className="auth-cta" style={{ border: 'none', cursor: 'pointer' }} onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'მიმდინარეობს...' : 'ჯავშნის გაუქმება'}
              </button>
            )}
          </>
        )}

        {done && (
          <>
            <h1>ჯავშანი გაუქმებულია ✓</h1>
            <p className="auth-sub">თქვენი ჯავშანი წარმატებით გაუქმდა.</p>
            <a href="/" className="auth-cta">მთავარ გვერდზე დაბრუნება →</a>
          </>
        )}
      </div>
    </div>
  );
}
