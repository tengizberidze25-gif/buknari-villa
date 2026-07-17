'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../LanguageContext';
import { t } from '../../i18n';

const GEORGIA_UTC_OFFSET = 4; // Georgia is UTC+4 year-round (no DST since 2017)

// Sunset time algorithm (Sunrise/Sunset Algorithm, Almanac for Computers 1990).
// Returns decimal UTC hours (0-24) for sunset on the given date at lat/lng.
function calcSunsetUtcHours(lat, lng, date) {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((date - startOfYear) / 86400000) + 1;
  const zenith = 90.833;

  const lngHour = lng / 15;
  const tVal = dayOfYear + (18 - lngHour) / 24;

  const M = 0.9856 * tVal - 3.289;
  let L = M + 1.916 * Math.sin(rad * M) + 0.02 * Math.sin(2 * rad * M) + 282.634;
  L = ((L % 360) + 360) % 360;

  let RA = deg * Math.atan(0.91764 * Math.tan(rad * L));
  RA = ((RA % 360) + 360) % 360;
  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = (RA + (Lquadrant - RAquadrant)) / 15;

  const sinDec = 0.39782 * Math.sin(rad * L);
  const cosDec = Math.cos(Math.asin(sinDec));

  const cosH = (Math.cos(rad * zenith) - sinDec * Math.sin(rad * lat)) / (cosDec * Math.cos(rad * lat));
  if (cosH > 1 || cosH < -1) return null; // sun never sets/rises at this latitude on this day

  const H = deg * Math.acos(cosH);
  const Hhours = H / 15;

  const T = Hhours + RA - 0.06571 * tVal - 6.622;
  let UT = T - lngHour;
  UT = ((UT % 24) + 24) % 24;

  return UT;
}

function getNextSunset(lat, lng) {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
    const targetDate = new Date(todayUtc.getTime() + dayOffset * 86400000);
    const utcHours = calcSunsetUtcHours(lat, lng, targetDate);
    if (utcHours === null) continue;

    const sunsetMs = targetDate.getTime() + utcHours * 3600000;
    if (sunsetMs > now.getTime()) {
      return new Date(sunsetMs);
    }
  }
  return null;
}

function formatLocalTime(date) {
  const localMs = date.getTime() + GEORGIA_UTC_OFFSET * 3600000;
  const local = new Date(localMs);
  const h = String(local.getUTCHours()).padStart(2, '0');
  const m = String(local.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function SunsetCountdown({ lat, lng }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);
  const [sunset, setSunset] = useState(null);
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!lat || !lng) return;
    setSunset(getNextSunset(Number(lat), Number(lng)));
  }, [lat, lng]);

  useEffect(() => {
    if (!sunset) return;
    function tick() {
      const diff = sunset.getTime() - Date.now();
      if (diff <= 0) {
        setSunset(getNextSunset(Number(lat), Number(lng)));
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining({ h, m, s });
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sunset, lat, lng]);

  if (!lat || !lng || !sunset || !remaining) return null;

  return (
    <div className="sunset-countdown">
      <span className="sunset-countdown-icon">🌅</span>
      <div className="sunset-countdown-text">
        <div className="sunset-countdown-label">
          {tt('sunsetCountdownLabel')} · {formatLocalTime(sunset)}
        </div>
        <div className="sunset-countdown-timer">
          {String(remaining.h).padStart(2, '0')}:{String(remaining.m).padStart(2, '0')}:
          {String(remaining.s).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}
