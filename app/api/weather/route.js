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

    const ref = VILLAGE_REFERENCE_POINTS[village];
    if (!ref) {
      return Response.json({ ok: false, message: 'უცნობი სოფელი' }, { status: 400 });
    }

    const [lat, lng] = ref.center;
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
