'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { localizedHref } from './localizedHref';

const TEXT = {
  ka: {
    message:
      'ეს საიტი იყენებს მინიმალურ cookies-ს სესიის შესანარჩუნებლად და Google Analytics-ს ანონიმური სტატისტიკისთვის.',
    learnMore: 'დაწვრილებით',
    accept: 'თანხმობა',
    decline: 'უარყოფა',
  },
  en: {
    message: 'This site uses minimal cookies to keep you signed in, and Google Analytics for anonymous statistics.',
    learnMore: 'Learn more',
    accept: 'Accept',
    decline: 'Decline',
  },
  ru: {
    message:
      'Этот сайт использует минимальные cookies для сохранения сессии и Google Analytics для анонимной статистики.',
    learnMore: 'Подробнее',
    accept: 'Принять',
    decline: 'Отклонить',
  },
  hy: {
    message:
      'Այս կայքն օգտագործում է նվազագույն cookies՝ ձեր սեսիան պահպանելու համար և Google Analytics՝ անանուն վիճակագրության համար։',
    learnMore: 'Իմանալ ավելին',
    accept: 'Ընդունել',
    decline: 'Մերժել',
  },
};

export default function CookieConsent() {
  const { lang } = useLanguage();
  const t = TEXT[lang] || TEXT.ka;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('buknari_cookie_consent');
    if (!stored) setVisible(true);
  }, []);

  function choose(value) {
    localStorage.setItem('buknari_cookie_consent', value);
    window.dispatchEvent(new Event('buknari-cookie-consent-changed'));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <p>
        {t.message} <a href={localizedHref('/privacy', lang)}>{t.learnMore}</a>
      </p>
      <div className="cookie-banner-actions">
        <button type="button" className="cookie-decline" onClick={() => choose('declined')}>
          {t.decline}
        </button>
        <button type="button" className="cookie-accept" onClick={() => choose('accepted')}>
          {t.accept}
        </button>
      </div>
    </div>
  );
}
