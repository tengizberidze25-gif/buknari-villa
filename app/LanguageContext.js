'use client';

import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext({
  lang: 'ka',
  setLang: () => {},
});

// URL-ია ენის ჭეშმარიტი წყარო (middleware.js წყვეტს locale-ს URL-იდან).
// ეს Provider უბრალოდ გადასცემს სერვერზე უკვე გამოთვლილ locale-ს კომპონენტებს.
// ენის რეალურად შეცვლა ხდება LangSwitch.js-ში router.push-ით — არა აქ.
export function LanguageProvider({ children, initialLocale }) {
  const [lang] = useState(initialLocale || 'ka');

  return (
    <LanguageContext.Provider value={{ lang, setLang: () => {} }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
