'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '../../LanguageContext';
import { t } from '../../i18n';

export default function WeatherWidget({ village }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!village) return;
    setLoading(true);
    fetch(`/api/weather?village=${encodeURIComponent(village)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setWeather(data);
        else setWeather(null);
      })
      .catch(() => setWeather(null))
      .finally(() => setLoading(false));
  }, [village]);

  if (loading || !weather) return null;

  return (
    <div className="weather-widget">
      <span className="weather-widget-icon">{weather.icon}</span>
      <span className="weather-widget-temp">{weather.temperature}°C</span>
      <span className="weather-widget-condition">{tt(`weather_${weather.conditionKey}`)}</span>
      <span className="weather-widget-village">{village}</span>
    </div>
  );
}
