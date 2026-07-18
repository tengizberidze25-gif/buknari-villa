'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../LanguageContext';
import { t } from '../../i18n';
import { getStoredReferralCode } from '../../referralCode';
import TravelPostcard from './TravelPostcard';

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

// Checks whether a date falls within a recurring annual season, given as
// 'MM-DD' strings. Handles seasons that wrap across the new year (e.g. Dec–Jan).
function isDateInSeason(date, startMMDD, endMMDD) {
  if (!startMMDD || !endMMDD) return false;
  const [sm, sd] = startMMDD.split('-').map(Number);
  const [em, ed] = endMMDD.split('-').map(Number);
  const val = (date.getMonth() + 1) * 100 + date.getDate();
  const startVal = sm * 100 + sd;
  const endVal = em * 100 + ed;
  if (startVal <= endVal) return val >= startVal && val <= endVal;
  return val >= startVal || val <= endVal; // wraps around the year boundary
}

// Sums the per-night price across a stay, using the high-season price for any
// night that falls within the recurring season range.
function computeStayTotal(checkIn, checkOut, basePrice, seasonPrice, seasonStart, seasonEnd) {
  if (!checkIn || !checkOut || !basePrice) return 0;
  let total = 0;
  let cursor = new Date(checkIn);
  while (cursor < checkOut) {
    const useSeasonPrice = seasonPrice && isDateInSeason(cursor, seasonStart, seasonEnd);
    total += useSeasonPrice ? seasonPrice : basePrice;
    cursor = addDays(cursor, 1);
  }
  return total;
}

// Rewards longer stays with a discount, if the owner has configured one for
// this villa — nudges guests toward booking more nights.
function computeLongStayDiscount(nights, minNights, pct) {
  if (!minNights || !pct || nights < minNights) return 0;
  return Math.min(pct, 50) / 100;
}

export default function BookingCalendar({
  villaId,
  villaTitle,
  villaCoverPhoto,
  whatsappNumber,
  pricePerNight,
  minNights,
  village,
  highSeasonPrice,
  highSeasonStart,
  highSeasonEnd,
  longStayDiscountMinNights,
  longStayDiscountPct,
  referralExcluded,
}) {
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
  const [guestEmail, setGuestEmail] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyStart, setNotifyStart] = useState('');
  const [notifyEnd, setNotifyEnd] = useState('');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [referralCode, setReferralCode] = useState(null);
  const [ownRewardPct, setOwnRewardPct] = useState(0);
  const [siteReferralPct, setSiteReferralPct] = useState(10);

  useEffect(() => {
    if (referralExcluded) return;
    setReferralCode(getStoredReferralCode());
  }, [referralExcluded]);

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setSiteReferralPct(data.referralDiscountPct);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (referralExcluded) {
      setOwnRewardPct(0);
      return;
    }
    const digits = guestPhone.replace(/\D/g, '');
    if (digits.length < 9) {
      setOwnRewardPct(0);
      return;
    }
    let cancelled = false;
    fetch(`/api/check-referral-reward?phone=${digits}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.ok) setOwnRewardPct(data.hasReward ? data.discountPct : 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [guestPhone, referralExcluded]);

  useEffect(() => {
    if (!checkIn || !checkOut || !village) {
      setForecast(null);
      return;
    }
    setLoadingForecast(true);
    fetch(`/api/weather?village=${encodeURIComponent(village)}&startDate=${toISO(checkIn)}&endDate=${toISO(checkOut)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setForecast(data);
        else setForecast(null);
      })
      .catch(() => setForecast(null))
      .finally(() => setLoadingForecast(false));
  }, [checkIn, checkOut, village]);

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
    const nightsSelected = Math.round((date - checkIn) / (1000 * 60 * 60 * 24));
    const requiredMinNights = minNights || 1;
    if (nightsSelected < requiredMinNights) {
      setError(tt('bcErrorMinNights').replace('{min}', requiredMinNights));
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
          guestEmail,
          guestMessage,
          referralCode: referralCode || '',
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

  async function handleNotifySubmit(e) {
    e.preventDefault();
    if (!notifyStart || !notifyEnd || !notifyPhone) {
      setNotifyMsg(tt('bcErrorSelectDates'));
      return;
    }
    setNotifySubmitting(true);
    setNotifyMsg('');
    try {
      const res = await fetch('/api/notify-when-available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ villaId, phone: notifyPhone, checkIn: notifyStart, checkOut: notifyEnd }),
      });
      const data = await res.json();
      if (data.ok) {
        setNotifyMsg(tt('bcNotifySuccess'));
        setNotifyPhone('');
      } else {
        setNotifyMsg(data.message || tt('genericError'));
      }
    } catch (err) {
      setNotifyMsg(tt('connectionErrorRetry'));
    }
    setNotifySubmitting(false);
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

  const stayTotal =
    checkIn && checkOut
      ? computeStayTotal(checkIn, checkOut, pricePerNight, highSeasonPrice, highSeasonStart, highSeasonEnd)
      : 0;

  const longStayDiscountPctValue = computeLongStayDiscount(nights, longStayDiscountMinNights, longStayDiscountPct);
  const guestPhoneDigits = guestPhone.replace(/\D/g, '').replace(/^995/, '');
  const referralDiscountPctValue = referralCode ? siteReferralPct / 100 : 0;
  const ownRewardDiscountPctValue = ownRewardPct > 0 ? ownRewardPct / 100 : 0;

  const discountPct = longStayDiscountPctValue + referralDiscountPctValue + ownRewardDiscountPctValue;
  const discountAmount = Math.round(stayTotal * discountPct);
  const discountedTotal = stayTotal - discountAmount;

  useEffect(() => {
    if (!discountedTotal) {
      setAnimatedTotal(0);
      return;
    }
    const from = animatedTotal;
    const to = discountedTotal;
    const duration = 550;
    const start = performance.now();
    let frame;
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedTotal(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountedTotal]);

  const whatsappDigits = (whatsappNumber || '').toString().replace(/\D/g, '');
  const whatsappMessage =
    nights > 0 && checkIn && checkOut
      ? tt('bcWhatsappMessageDates')
          .replace('{title}', villaTitle || '')
          .replace('{checkIn}', toISO(checkIn))
          .replace('{checkOut}', toISO(checkOut))
          .replace('{nights}', nights)
          .replace('{total}', discountedTotal.toLocaleString())
      : tt('bcWhatsappMessageGeneric').replace('{title}', villaTitle || '');
  const whatsappBookingUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  if (done) {
    const dateRange = `${toISO(checkIn)} — ${toISO(checkOut)}`;
    return (
      <div className="booking-box booking-done">
        <div className="booking-done-icon">✓</div>
        <h3>{tt('bcDoneTitle')}</h3>
        <p>{tt('bcDoneMessage').replace('{dates}', dateRange)}</p>
        <TravelPostcard villaTitle={villaTitle} coverPhoto={villaCoverPhoto} checkIn={checkIn} checkOut={checkOut} />
        {!referralExcluded && (
          <p className="booking-referral-later-hint">
            {tt('bcReferralAfterStayHint').replace('{pct}', siteReferralPct)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="booking-box">
      <h3 className="booking-title">{tt('bcSelectDates')}</h3>
      {minNights > 1 && <p className="booking-min-nights-hint">{tt('bcMinNightsHint').replace('{min}', minNights)}</p>}

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

      {!showNotifyForm ? (
        <button type="button" className="booking-notify-toggle" onClick={() => setShowNotifyForm(true)}>
          🔔 {tt('bcNotifyToggle')}
        </button>
      ) : (
        <div className="booking-notify-form">
          <p className="booking-notify-intro">{tt('bcNotifyIntro')}</p>
          <form onSubmit={handleNotifySubmit}>
            <div className="booking-selected-dates">
              <div>
                <label>{tt('bcCheckIn')}</label>
                <input
                  type="date"
                  value={notifyStart}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setNotifyStart(e.target.value)}
                />
              </div>
              <div>
                <label>{tt('bcCheckOut')}</label>
                <input
                  type="date"
                  value={notifyEnd}
                  min={notifyStart || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setNotifyEnd(e.target.value)}
                />
              </div>
            </div>
            <input
              type="text"
              placeholder={tt('bcPhonePlaceholder')}
              value={notifyPhone}
              onChange={(e) => setNotifyPhone(e.target.value)}
            />
            {notifyMsg && <p className="booking-notify-msg">{notifyMsg}</p>}
            <button type="submit" disabled={notifySubmitting}>
              {notifySubmitting ? tt('bcSubmitting') : tt('bcNotifySubmitBtn')}
            </button>
          </form>
        </div>
      )}

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
          {nights > 0 && (
            <div className="booking-nights">
              {nights} {tt('nightsLabel')}
            </div>
          )}
        </div>

        {nights > 0 && pricePerNight ? (
          <div className="booking-price-breakdown">
            <div className="booking-price-row">
              <span>₾{pricePerNight.toLocaleString()} × {nights} {tt('nightsLabel')}</span>
              <span>₾{stayTotal.toLocaleString()}</span>
            </div>
            {stayTotal !== nights * pricePerNight && (
              <div className="booking-price-row booking-price-row-note">
                <span>{tt('bcSeasonPriceNote')}</span>
              </div>
            )}
            {longStayDiscountPctValue > 0 && (
              <div className="booking-price-row booking-price-row-discount">
                <span>{tt('bcLongStayDiscount').replace('{pct}', Math.round(longStayDiscountPctValue * 100))}</span>
                <span>−₾{Math.round(stayTotal * longStayDiscountPctValue).toLocaleString()}</span>
              </div>
            )}
            {referralDiscountPctValue > 0 && (
              <div className="booking-price-row booking-price-row-discount booking-price-row-referral">
                <span>🎁 {tt('bcReferralDiscount').replace('{pct}', Math.round(referralDiscountPctValue * 100))}</span>
                <span>−₾{Math.round(stayTotal * referralDiscountPctValue).toLocaleString()}</span>
              </div>
            )}
            {ownRewardDiscountPctValue > 0 && (
              <div className="booking-price-row booking-price-row-discount booking-price-row-referral">
                <span>🎉 {tt('bcOwnRewardDiscount').replace('{pct}', Math.round(ownRewardDiscountPctValue * 100))}</span>
                <span>−₾{Math.round(stayTotal * ownRewardDiscountPctValue).toLocaleString()}</span>
              </div>
            )}
            <div className="booking-price-row booking-price-total">
              <span>{tt('bcTotalLabel')}</span>
              <span className="booking-price-total-amount">₾{animatedTotal.toLocaleString()}</span>
            </div>
            <div className="booking-price-avg">
              {tt('bcAvgPerNight').replace('{amount}', Math.round(discountedTotal / nights).toLocaleString())}
            </div>
          </div>
        ) : null}

        {referralCode && !ownRewardDiscountPctValue && referralDiscountPctValue > 0 && (
          <p className="booking-referral-hint">🎁 {tt('bcReferralAppliedHint')}</p>
        )}

        {whatsappBookingUrl && (
          <a
            href={whatsappBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="booking-whatsapp-btn"
          >
            💬 {tt('bcWhatsappBookBtn')}
          </a>
        )}

        {checkIn && checkOut && !loadingForecast && forecast && forecast.forecastAvailable && (
          <div className="booking-forecast">
            <div className="booking-forecast-summary">
              <span className="booking-forecast-icon">{forecast.icon}</span>
              <span className="booking-forecast-temp">
                {forecast.tempMin}° – {forecast.tempMax}°C
              </span>
              <span className="booking-forecast-condition">{tt(`weather_${forecast.conditionKey}`)}</span>
            </div>
            {forecast.daily && forecast.daily.length > 1 && (
              <div className="booking-forecast-days">
                {forecast.daily.map((d) => {
                  const dDate = new Date(d.date);
                  const weekdayIdx = (dDate.getDay() + 6) % 7; // Monday = 0
                  return (
                    <div key={d.date} className="booking-forecast-day">
                      <span className="booking-forecast-day-weekday">{DAY_NAMES[weekdayIdx]}</span>
                      <span className="booking-forecast-day-date">
                        {dDate.getDate()} {MONTH_NAMES[dDate.getMonth()].slice(0, 3)}
                      </span>
                      <span className="booking-forecast-day-icon">{d.icon}</span>
                      <span className="booking-forecast-day-temp">
                        <span className="booking-forecast-day-min">{d.tempMin}°</span>{' '}
                        <span className="booking-forecast-day-max">{d.tempMax}°</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {forecast.partialRange && (
              <span className="booking-forecast-note">{tt('bcForecastPartial')}</span>
            )}
          </div>
        )}
        {checkIn && checkOut && !loadingForecast && forecast && forecast.forecastAvailable === false && (
          <p className="booking-forecast-unavailable">{tt('bcForecastUnavailable')}</p>
        )}

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
        <input
          type="email"
          placeholder={tt('bcEmailPlaceholder')}
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
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
