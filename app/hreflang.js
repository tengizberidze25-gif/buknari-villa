const LOCALES = ['ka', 'en', 'ru', 'hy'];
const BASE_URL = 'https://www.buknarivilla.ge';

// pathWithoutLocale — გვერდის path ენის პრეფიქსის გარეშე, მაგ. '/' ან '/villa/123'
// currentLocale — მიმდინარე მოთხოვნის ენა (x-locale header-იდან)
export function buildAlternates(pathWithoutLocale, currentLocale) {
  const clean = pathWithoutLocale === '/' ? '' : pathWithoutLocale;

  const languages = {};
  LOCALES.forEach((loc) => {
    languages[loc] = loc === 'ka' ? `${BASE_URL}${clean || '/'}` : `${BASE_URL}/${loc}${clean}`;
  });
  languages['x-default'] = languages.ka;

  const canonical =
    currentLocale === 'ka' ? `${BASE_URL}${clean || '/'}` : `${BASE_URL}/${currentLocale}${clean}`;

  return { canonical, languages };
}

export const OG_LOCALE_MAP = { ka: 'ka_GE', en: 'en_US', ru: 'ru_RU', hy: 'hy_AM' };
