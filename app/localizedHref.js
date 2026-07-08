// ყველა შიდა ბმულისთვის (Link href, router.push) — ინახავს მიმდინარე ენას URL-ში.
// გამოყენება: localizedHref('/villa/123', lang)  →  '/villa/123' (ka) ან '/en/villa/123'
export function localizedHref(path, lang) {
  if (!lang || lang === 'ka') return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `/${lang}${clean}`;
}
