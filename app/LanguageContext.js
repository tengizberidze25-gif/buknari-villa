'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({
  lang: 'ka',
  setLang: () => {},
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('ka');

  useEffect(() => {
    const stored = localStorage.getItem('buknari_lang');
    if (stored === 'ka' || stored === 'en' || stored === 'ru' || stored === 'hy') {
      setLangState(stored);
    }
  }, []);

  function setLang(newLang) {
    setLangState(newLang);
    localStorage.setItem('buknari_lang', newLang);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
