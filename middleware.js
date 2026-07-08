import { NextResponse } from 'next/server';

const LOCALES = ['en', 'ru', 'hy'];
const DEFAULT_LOCALE = 'ka';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const segments = pathname.split('/');
  const maybeLocale = segments[1];

  let locale = DEFAULT_LOCALE;
  let rewrittenPath = pathname;

  if (LOCALES.includes(maybeLocale)) {
    locale = maybeLocale;
    rewrittenPath = '/' + segments.slice(2).join('/');
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);

  if (locale !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = rewrittenPath || '/';
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api|admin|.*\\.(?:png|jpg|jpeg|webp|svg|ico|gif|css|js|txt|xml|json)).*)',
  ],
};
