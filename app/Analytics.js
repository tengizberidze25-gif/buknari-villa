'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function Analytics({ gaId }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    function checkConsent() {
      setConsented(localStorage.getItem('buknari_cookie_consent') === 'accepted');
    }
    checkConsent();
    window.addEventListener('buknari-cookie-consent-changed', checkConsent);
    return () => window.removeEventListener('buknari-cookie-consent-changed', checkConsent);
  }, []);

  if (!gaId || !consented) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
