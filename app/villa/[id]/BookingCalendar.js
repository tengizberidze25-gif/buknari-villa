'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../LanguageContext';
import { t } from '../../i18n';

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function BookingCalendar({ villaId }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);
  const MONTH_NAMES = t(lang, 'monthNames');
  const DAY_NAMES = t(lang, 'dayNames');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [ranges, setRanges] = useState([]);
  const [loadingRanges, setLoadingRanges] = useState(true);
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/villa-availability?villaId=${villaId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setRanges(data.ranges);
      })
      .finally(() => setLoadingRanges(false));
  }, [villaId]);

  function isBlocked(date) {
    return ranges.some((r) => date >= new Date(r.check_in) && date < new Date(r.check_out));
  }

  function isPast(date) {
    return date < today;
  }

  // Is there any blocked day strictly between two dates (exclusive)?
  function hasBlockedBetween(start, end) {
    let d = addDays(start, 1);
    while (d < end) {
      if (isBlocked(d)) return true;
      d = addDays(d, 1);
    }
    return false;
  }

  function handleDayClick(date) {
    if (isPast(date) || isBlocked(date)) return;

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }

    // Selecting check-out
    if (date <= checkIn) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }
    if (hasBlockedBetween(checkIn, date)) {
      setError(tt('bcErrorRangeBlocked'));
      return;
    }
    setError('');
    setCheckOut(date);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!checkIn || !checkOut) {
      setError(tt('bcErrorSelectDates'));
      return;
    }
    if (!guestName.trim() || !guestPhone.trim()) {
      setError(tt('bcErrorNamePhone'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/request-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          villaId,
          checkIn: toISO(checkIn),
          checkOut: toISO(checkOut),
          guestName,
          guestPhone,
          guestMessage,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.message || tt('genericError'));
        if (res.status === 409) {
          // Dates got taken in the meantime — refresh availability
          const r = await fetch(`/api/villa-availability?villaId=${villaId}`).then((x) => x.json());
          if (r.ok) setRanges(r.ranges);
          setCheckIn(null);
          setCheckOut(null);
        }
      } else {
        setDone(true);
      }
    } catch (err) {
      setError(tt('connectionErrorRetry'));
    }
    setSubmitting(false);
  }

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const nights =
    checkIn && checkOut ? Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24)) : 0;

  if (done) {
    const dateRange = `${toISO(checkIn)} — ${toISO(checkOut)}`;
    return (
      <div className="booking-box booking-done">
        <div className="booking-done-icon">✓</div>
        <h3>{tt('bcDoneTitle')}</h3>
        <p>{tt('bcDoneMessage').replace('{dates}', dateRange)}</p>
      </div>
    );
  }

  return (
    <div className="booking-box">
      <h3 className="booking-title">{tt('bcSelectDates')}</h3>

      <div className="booking-cal-nav">
        <button type="button" onClick={() => setViewMonth(new Date(year, month - 1, 1))} aria-label={tt('bcPrevMonth')}>‹</button>
        <span>{MONTH_NAMES[month]} {year}</span>
        <button type="button" onClick={() => setViewMonth(new Date(year, month + 1, 1))} aria-label={tt('bcNextMonth')}>›</button>
      </div>

      <div className="booking-cal-weekdays">
        {DAY_NAMES.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="booking-cal-grid">
        {cells.map((date, i) => {
          if (!date) return <span key={i} className="booking-cal-cell empty" />;

          const blocked = isBlocked(date);
          const past = isPast(date);
          const isCheckIn = checkIn && isSameDay(date, checkIn);
          const isCheckOut = checkOut && isSameDay(date, checkOut);
          const inRange = checkIn && checkOut && date > checkIn && date < checkOut;

          const cls = [
            'booking-cal-cell',
            blocked || past ? 'disabled' : '',
            isCheckIn || isCheckOut ? 'selected' : '',
            inRange ? 'in-range' : '',
          ].join(' ').trim();

          return (
            <button
              key={i}
              type="button"
              className={cls}
              disabled={blocked || past}
              onClick={() => handleDayClick(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {loadingRanges && <p className="booking-loading">{tt('bcLoadingAvailability')}</p>}

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="booking-selected-dates">
          <div>
            <label>{tt('bcCheckIn')}</label>
            <span>{checkIn ? toISO(checkIn) : '—'}</span>
          </div>
          <div>
            <label>{tt('bcCheckOut')}</label>
            <span>{checkOut ? toISO(checkOut) : '—'}</span>
          </div>
          {nights > 0 && <div className="booking-nights">{nights} {tt('nightsLabel')}</div>}
        </div>

        <input
          type="text"
          placeholder={tt('bcNamePlaceholder')}
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />
        <input
          type="tel"
          placeholder={tt('bcPhonePlaceholder')}
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
        />
        <textarea
          placeholder={tt('bcMessagePlaceholder')}
          rows={2}
          value={guestMessage}
          onChange={(e) => setGuestMessage(e.target.value)}
        />

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" disabled={submitting || !checkIn || !checkOut}>
          {submitting ? tt('bcSubmitting') : tt('bcSubmitBtn')}
        </button>
      </form>
    </div>
  );
}
