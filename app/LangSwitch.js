'use client';

import { usePathname } from 'next/navigation';

const LANG_LABELS = {
  ka: '🇬🇪 ქარ',
  en: '🇬🇧 ENG',
  ru: '🇷🇺 РУС',
  hy: '🇦🇲 ՀԱՅ',
};

const LOCALES = ['en', 'ru', 'hy'];

export default function LangSwitch() {
  const pathname = usePathname();

  const segments = pathname.split('/');
  const currentLocale = LOCALES.includes(segments[1]) ? segments[1] : 'ka';
  const pathWithoutLocale =
    currentLocale === 'ka' ? pathname : '/' + segments.slice(2).join('/');

  function handleChange(e) {
    const newLocale = e.target.value;
    const cleanPath = pathWithoutLocale === '' ? '/' : pathWithoutLocale;
    const newPath =
      newLocale === 'ka' ? cleanPath : `/${newLocale}${cleanPath === '/' ? '' : cleanPath}`;
    window.location.href = newPath;
  }

  return (
    <select
      className="lang-select"
      value={currentLocale}
      onChange={handleChange}
      aria-label="Language"
    >
      {Object.entries(LANG_LABELS).map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}
