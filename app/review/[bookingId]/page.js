'use client';

import { useState, useEffect } from 'react';

export default function ReviewPage({ params, searchParams }) {
  const bookingId = params.bookingId;
  const token = searchParams.t;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('ბმული არასრულია');
      setLoading(false);
      return;
    }
    fetch(`/api/review-info?bookingId=${bookingId}&t=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) setError(data.message || 'ჯავშანი ვერ მოიძებნა');
        else setBooking(data.booking);
      })
      .catch(() => setError('კავშირის შეცდომა'))
      .finally(() => setLoading(false));
  }, [bookingId, token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) {
      setError('აირჩიეთ შეფასება');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, token, rating, comment }),
      });
      const data = await res.json();
      if (data.ok) setDone(true);
      else setError(data.message || 'დაფიქსირდა შეცდომა');
    } catch (e) {
      setError('კავშირის შეცდომა');
    }
    setSubmitting(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-texture" />
      <div className="auth-card">
        <a href="/" className="auth-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>

        {loading && <p className="booking-loading">იტვირთება...</p>}
        {!loading && error && !booking && <div className="auth-error">{error}</div>}

        {!loading && booking && !done && (
          <>
            <h1>როგორი იყო თქვენი დასვენება?</h1>
            <p className="auth-sub">"{booking.villaTitle}" — დაგვეხმარეთ სხვა სტუმრებს, დატოვეთ შეფასება.</p>

            {booking.alreadyReviewed ? (
              <p className="dashboard-empty-hint">თქვენ უკვე დატოვეთ შეფასება ამ ჯავშანზე. მადლობა!</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="review-score-picker">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`review-score-btn ${(hoverRating || rating) >= n ? 'active' : ''}`}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="review-score-hint">{rating ? `თქვენი შეფასება: ${rating}/10` : 'აირჩიეთ ქულა 1-დან 10-მდე'}</p>

                <textarea
                  rows={4}
                  placeholder="გაგვიზიარეთ თქვენი შთაბეჭდილება (არასავალდებულო)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />

                {error && <div className="auth-error">{error}</div>}

                <button type="submit" disabled={submitting}>
                  {submitting ? 'იგზავნება...' : 'შეფასების გაგზავნა'}
                </button>
              </form>
            )}
          </>
        )}

        {done && (
          <>
            <h1>მადლობა შეფასებისთვის ✓</h1>
            <p className="auth-sub">თქვენი გამოხმაურება დაეხმარება სხვა სტუმრებს არჩევანის გაკეთებაში.</p>
            <a href="/" className="auth-cta">მთავარ გვერდზე დაბრუნება →</a>
          </>
        )}
      </div>
    </div>
  );
}
