import './globals.css';
import { headers } from 'next/headers';
import { LanguageProvider } from './LanguageContext';
import Analytics from './Analytics';
import CookieConsent from './CookieConsent';
import ReferralCapture from './ReferralCapture';

export const metadata = {
  metadataBase: new URL('https://www.buknarivilla.ge'),
  title: 'Buknari Villa — ვილები და სახლები ბუკნარში, ჩაქვში, ციხისძირში',
  description: 'ზღვისპირა ვილები და სახლები ბუკნარში, ჩაქვში და ციხისძირში. დაათვალიერე, დაუკავშირდი მფლობელს WhatsApp-ით, დაჯავშნე შენი დასვენება პირდაპირ, შუამავლების გარეშე.',
  keywords: ['ვილა ბუკნარში', 'სახლი ჩაქვში', 'ვილა ციხისძირში', 'ზღვისპირა დასვენება', 'Buknari villa', 'Chakvi villa', 'Georgia sea house'],
  openGraph: {
    title: 'Buknari Villa — ვილები და სახლები ზღვისპირა სოფლებში',
    description: 'ზღვისპირა ვილები და სახლები ბუკნარში, ჩაქვში და ციხისძირში. დაუკავშირდი მფლობელს პირდაპირ.',
    url: 'https://www.buknarivilla.ge',
    siteName: 'Buknari Villa',
    locale: 'ka_GE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buknari Villa — ვილები და სახლები ზღვისპირა სოფლებში',
    description: 'ზღვისპირა ვილები და სახლები ბუკნარში, ჩაქვში და ციხისძირში.',
  },
};

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const headersList = headers();
  const locale = headersList.get('x-locale') || 'ka';

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@500;600;700&family=Noto+Serif:ital,wght@0,500;0,600;1,500&family=Noto+Sans+Georgian:wght@400;500;600&family=Noto+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider initialLocale={locale}>
          {children}
          <CookieConsent />
        </LanguageProvider>
        <Analytics gaId={gaId} />
        <ReferralCapture />
      </body>
    </html>
  );
}
