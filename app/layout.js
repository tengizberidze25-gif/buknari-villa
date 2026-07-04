import './globals.css';
import { LanguageProvider } from './LanguageContext';

export const metadata = {
  title: 'Buknari Villa — ვილების და სახლების გაქირავება ბუკნარში',
  description: 'ზღვისპირა ვილები და სახლები ბუკნარში. დაათვალიერე, დაუკავშირდი მფლობელს WhatsApp-ით, დაჯავშნე შენი დასვენება.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ka">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@500;600;700&family=Noto+Serif:ital,wght@0,500;0,600;1,500&family=Noto+Sans+Georgian:wght@400;500;600&family=Noto+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
