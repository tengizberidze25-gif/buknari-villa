import Link from 'next/link';
import { headers } from 'next/headers';
import { localizedHref } from './localizedHref';

export const metadata = {
  title: 'გვერდი ვერ მოიძებნა — Buknari Villa',
};

const TEXT = {
  ka: {
    message: 'ეს გვერდი ვერ მოიძებნა — შესაძლოა ბმული მოძველებულია, ან ვილა უკვე აღარ არის ხელმისაწვდომი.',
    back: '← მთავარ გვერდზე დაბრუნება',
  },
  en: {
    message: "This page couldn't be found — the link may be outdated, or the villa is no longer available.",
    back: '← Back to homepage',
  },
  ru: {
    message: 'Страница не найдена — возможно, ссылка устарела, или вилла больше недоступна.',
    back: '← Вернуться на главную',
  },
  hy: {
    message: 'Այս էջը չի գտնվել — հղումը կարող է հնացած լինել, կամ վիլլան այլևս հասանելի չէ։',
    back: '← Վերադառնալ գլխավոր էջ',
  },
};

export default function NotFound() {
  const locale = headers().get('x-locale') || 'ka';
  const t = TEXT[locale] || TEXT.ka;

  return (
    <div className="auth-page">
      <div className="auth-texture" />
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <Link href={localizedHref('/', locale)} className="auth-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </Link>

        <h1 style={{ fontSize: '4rem', margin: '24px 0 8px' }}>404</h1>
        <p className="auth-sub" style={{ marginBottom: '24px' }}>{t.message}</p>

        <Link href={localizedHref('/', locale)} className="auth-cta">
          {t.back}
        </Link>
      </div>
    </div>
  );
}
