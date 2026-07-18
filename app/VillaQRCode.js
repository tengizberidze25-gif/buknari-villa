'use client';

import { useState } from 'react';

export default function VillaQRCode({ villaId, size = 220 }) {
  const [downloading, setDownloading] = useState(false);

  if (!villaId) return null;

  const villaUrl = `https://buknarivilla.ge/villa/${villaId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(
    villaUrl
  )}`;

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(qrImageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buknari-villa-qr-${villaId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      // If the fetch is blocked for any reason, just open the image directly
      // so the person can still save it manually.
      window.open(qrImageUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="villa-qr-box">
      <img src={qrImageUrl} alt="QR კოდი ვილის გვერდზე" width={size} height={size} className="villa-qr-image" />
      <div className="villa-qr-actions">
        <button type="button" onClick={handleDownload} disabled={downloading} className="villa-qr-download">
          {downloading ? 'იტვირთება...' : '⬇ QR კოდის ჩამოტვირთვა'}
        </button>
        <p className="villa-qr-hint">
          დაბეჭდე ვიზიტკაზე, ბანერზე ან ვილის კართან — სკანირებისას პირდაპირ ამ გვერდზე გადავა.
        </p>
      </div>
    </div>
  );
}
