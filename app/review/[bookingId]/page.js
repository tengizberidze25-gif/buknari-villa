'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../LanguageContext';
import { t } from '../../i18n';
import LangSwitch from '../../LangSwitch';
import { localizedHref } from '../../localizedHref';
import { supabase } from '../../../lib/supabase';

export default function ReviewPage({ params, searchParams }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);

  const bookingId = params.bookingId;
  const token = searchParams.t;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(tt('cbLinkIncomplete'));
      setLoading(false);
      return;
    }
    fetch(`/api/review-info?bookingId=${bookingId}&t=${token}&lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) setError(data.message || tt('cbNotFound'));
        else setBooking(data.booking);
      })
      .catch(() => setError(tt('connectionError')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, token, lang]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) {
      setError(tt('rvPickRatingError'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      let photoPath = null;

      if (photoFile) {
        const urlRes = await fetch('/api/review-photo-upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, token, filename: photoFile.name }),
        });
        const urlData = await urlRes.json();

        if (urlData.ok) {
          const { error: uploadError } = await supabase.storage
            .from('review-photos')
            .uploadToSignedUrl(urlData.path, urlData.token, photoFile);
          if (!uploadError) photoPath = urlData.path;
        }
      }

      const res = await fetch('/api/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, token, rating, comment, photoPath }),
      });
      const data = await res.json();
      if (data.ok) setDone(true);
      else setError(data.message || tt('genericError'));
    } catch (e) {
      setError(tt('connectionError'));
    }
    setSubmitting(false);
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
        {!loading && error && !booking && <div className="auth-error">{error}</div>}

        {!loading && booking && !done && (
          <>
            <h1>{tt('rvTitle')}</h1>
            <p className="auth-sub">"{booking.villaTitle}" — {tt('rvIntro')}</p>

            {booking.alreadyReviewed ? (
              <p className="dashboard-empty-hint">{tt('rvAlreadyReviewed')}</p>
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
                <p className="review-score-hint">
                  {rating ? `${tt('rvYourScorePrefix')} ${rating}/10` : tt('rvPickScore')}
                </p>

                <textarea
                  rows={4}
                  placeholder={tt('rvCommentPlaceholder')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />

                <div className="form-row">
                  <label>{tt('rvPhotoLabel')}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files[0] || null)}
                  />
                  {photoFile && <span className="video-upload-filename">{photoFile.name}</span>}
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button type="submit" disabled={submitting}>
                  {submitting ? tt('rvSubmitting') : tt('rvSubmitBtn')}
                </button>
              </form>
            )}
          </>
        )}

        {done && (
          <>
            <h1>{tt('rvDoneTitle')}</h1>
            <p className="auth-sub">{tt('rvDoneMessage')}</p>
            <a href={localizedHref('/', lang)} className="auth-cta">{tt('backHome')}</a>
          </>
        )}
      </div>
    </div>
  );
}
