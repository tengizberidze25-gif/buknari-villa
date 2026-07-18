'use client';

import { useEffect } from 'react';

export default function DebugErrorCapture() {
  useEffect(() => {
    function report(payload) {
      try {
        fetch('/api/debug-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      } catch (e) {
        // ignore
      }
    }

    function onError(event) {
      report({
        type: 'error',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        col: event.colno,
        stack: event.error?.stack?.slice(0, 300),
        ua: navigator.userAgent,
        path: window.location.pathname,
      });
    }

    function onRejection(event) {
      report({
        type: 'unhandledrejection',
        message: String(event.reason?.message || event.reason),
        stack: event.reason?.stack?.slice(0, 300),
        ua: navigator.userAgent,
        path: window.location.pathname,
      });
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
