'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    fetch('/api/debug-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'react-error-boundary',
        message: error?.message,
        stack: error?.stack?.slice(0, 500),
        digest: error?.digest,
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        path: typeof window !== 'undefined' ? window.location.pathname : '',
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: 'sans-serif', padding: 40, textAlign: 'center' }}>
        <h2>რაღაც არასწორად წავიდა</h2>
        <p>გვერდის ჩატვირთვისას შეცდომა მოხდა.</p>
        <button
          onClick={() => reset()}
          style={{ padding: '10px 20px', marginTop: 16, cursor: 'pointer' }}
        >
          ხელახლა ცდა
        </button>
      </body>
    </html>
  );
}
