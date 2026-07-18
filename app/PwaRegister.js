'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failing shouldn't break the site — installability
        // just won't be offered, that's all.
      });
    }
  }, []);

  return null;
}
