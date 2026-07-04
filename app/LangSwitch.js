'use client';

import { useLanguage } from './LanguageContext';

export default function LangSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="lang-switch">
      <button className={lang === 'ka' ? 'active' : ''} onClick={() => setLang('ka')}>
        ქარ
      </button>
      <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>
        ENG
      </button>
      <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>
        РУС
      </button>
    </div>
  );
}
