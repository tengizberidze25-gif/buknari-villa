import { VILLAGE_REFERENCE_POINTS } from '../../../lib/geo';

// WMO weather codes → { icon, key } — key maps to an i18n label on the client
const WEATHER_CODE_MAP = {
  0: { icon: '☀️', key: 'clear' },
  1: { icon: '🌤️', key: 'mostlyClear' },
  2: { icon: '⛅', key: 'partlyCloudy' },
  3: { icon: '☁️', key: 'overcast' },
  45: { icon: '🌫️', key: 'fog' },
  48: { icon: '🌫️', key: 'fog' },
  51: { icon: '🌦️', key: 'drizzle' },
  53: { icon: '🌦️', key: 'drizzle' },
  55: { icon: '🌦️', key: 'drizzle' },
  61: { icon: '🌧️', key: 'rain' },
  63: { icon: '🌧️', key: 'rain' },
  65: { icon: '🌧️', key: 'heavyRain' },
  71: { icon: '🌨️', key: 'snow' },
  73: { icon: '🌨️', key: 'snow' },
  75: { icon: '🌨️', key: 'snow' },
  80: { icon: '🌦️', key: 'showers' },
  81: { icon: '🌦️', key: 'showers' },
  82: { icon: '⛈️', key: 'heavyShowers' },
  95: { icon: '⛈️', key: 'thunderstorm' },
  96: { icon: '⛈️', key: 'thunderstorm' },
  99: { icon: '⛈️', key: 'thunderstorm' },
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const village = searchParams.get('village');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const ref = VILLAGE_REFERENCE_POINTS[village];
    if (!ref) {
      return Response.json({ ok: false, message: 'უცნობი სოფელი' }, { status: 400 });
    }

    const [lat, lng] = ref.center;

    // Forecast mode: a date range was requested (e.g. the guest's selected stay)
    if (startDate && endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxForecastDate = new Date(today);
      maxForecastDate.setDate(maxForecastDate.getDate() + 16);

      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);

      if (rangeStart > maxForecastDate || rangeEnd < today) {
        return Response.json({ ok: true, forecastAvailable: false });
      }

      // Clamp the requested range to what Open-Meteo can actually forecast
      const clampedStart = rangeStart < today ? today : rangeStart;
      const clampedEnd = rangeEnd > maxForecastDate ? maxForecastDate : rangeEnd;
      const fmt = (d) => d.toISOString().slice(0, 10);

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto` +
        `&start_date=${fmt(clampedStart)}&end_date=${fmt(clampedEnd)}`;

      const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1 hour
      if (!res.ok) {
        return Response.json({ ok: false, message: 'ამინდის სერვისი მიუწვდომელია' }, { status: 502 });
      }

      const data = await res.json();
      const daily = data.daily;
      if (!daily || !daily.time) {
        return Response.json({ ok: true, forecastAvailable: false });
      }

      const highs = daily.temperature_2m_max;
      const lows = daily.temperature_2m_min;
      const codes = daily.weathercode;

      // Most frequent condition across the range, for a single representative icon
      const codeCounts = {};
      codes.forEach((c) => {
        codeCounts[c] = (codeCounts[c] || 0) + 1;
      });
      const dominantCode = Object.keys(codeCounts).reduce((a, b) => (codeCounts[a] >= codeCounts[b] ? a : b));
      const mapped = WEATHER_CODE_MAP[dominantCode] || { icon: '🌡️', key: 'unknown' };

      return Response.json({
        ok: true,
        forecastAvailable: true,
        partialRange: fmt(clampedStart) !== startDate || fmt(clampedEnd) !== endDate,
        tempMin: Math.round(Math.min(...lows)),
        tempMax: Math.round(Math.max(...highs)),
        icon: mapped.icon,
        conditionKey: mapped.key,
        days: daily.time.length,
      });
    }

    // Default mode: current weather
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;

    const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min
    if (!res.ok) {
      return Response.json({ ok: false, message: 'ამინდის სერვისი მიუწვდომელია' }, { status: 502 });
    }

    const data = await res.json();
    const cw = data.current_weather;
    if (!cw) {
      return Response.json({ ok: false, message: 'ამინდის მონაცემები ვერ მოიძებნა' }, { status: 502 });
    }

    const mapped = WEATHER_CODE_MAP[cw.weathercode] || { icon: '🌡️', key: 'unknown' };

    return Response.json({
      ok: true,
      temperature: Math.round(cw.temperature),
      icon: mapped.icon,
      conditionKey: mapped.key,
    });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
