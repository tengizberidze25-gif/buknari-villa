'use client';

import { useLanguage } from './LanguageContext';

const LANG_LABELS = {
  ka: 'ქარ',
  en: 'ENG',
  ru: 'РУС',
  hy: 'ՀԱՅ',
};

export default function LangSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <select
      className="lang-select"
      value={lang}
      onChange={(e) => setLang(e.target.value)}
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
