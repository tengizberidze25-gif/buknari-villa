'use client';

import { useRef, useEffect, useState } from 'react';
import { useLanguage } from '../../LanguageContext';
import { t } from '../../i18n';

const CARD_W = 800;
const CARD_H = 1000;

function formatDateShort(date, lang) {
  const months = {
    ka: ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    hy: ['հունվ', 'փետր', 'մարտ', 'ապր', 'մայիս', 'հունիս', 'հուլիս', 'օգոստ', 'սեպտ', 'հոկտ', 'նոյեմ', 'դեկտ'],
  };
  const list = months[lang] || months.ka;
  return `${date.getDate()} ${list[date.getMonth()]}`;
}

export default function TravelPostcard({ villaTitle, coverPhoto, checkIn, checkOut }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = CARD_W;
    canvas.height = CARD_H;

    function drawOverlayAndText() {
      const gradient = ctx.createLinearGradient(0, CARD_H * 0.4, 0, CARD_H);
      gradient.addColorStop(0, 'rgba(10,15,10,0)');
      gradient.addColorStop(1, 'rgba(8,10,8,0.82)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      // Badge
      ctx.fillStyle = '#f3efe6';
      roundRect(ctx, 32, 32, 210, 44, 8);
      ctx.fill();
      ctx.fillStyle = '#12130f';
      ctx.font = "600 20px 'Noto Sans Georgian', sans-serif";
      ctx.fillText('Buknari Villa', 48, 61);

      // Headline
      ctx.fillStyle = '#ffffff';
      ctx.font = "600 46px 'Noto Serif Georgian', serif";
      ctx.fillText(tt('postcardHeadline'), 40, CARD_H - 130);

      // Dates
      ctx.font = "400 26px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      const dateText = `${formatDateShort(checkIn, lang)} — ${formatDateShort(checkOut, lang)}`;
      ctx.fillText(dateText, 40, CARD_H - 80);

      setReady(true);
    }

    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    async function loadAndDraw() {
      try {
        if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      } catch (e) {
        // proceed anyway with fallback fonts
      }

      if (coverPhoto) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const scale = Math.max(CARD_W / img.width, CARD_H / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (CARD_W - w) / 2, (CARD_H - h) / 2, w, h);
          drawOverlayAndText();
        };
        img.onerror = () => {
          setImgError(true);
          ctx.fillStyle = '#2a3a34';
          ctx.fillRect(0, 0, CARD_W, CARD_H);
          drawOverlayAndText();
        };
        img.src = coverPhoto;
      } else {
        ctx.fillStyle = '#2a3a34';
        ctx.fillRect(0, 0, CARD_W, CARD_H);
        drawOverlayAndText();
      }
    }

    loadAndDraw();
  }, [coverPhoto, checkIn, checkOut, lang]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'buknari-villa-postcard.png';
      a.click();
    } catch (e) {
      // Canvas got tainted by a cross-origin image without proper CORS —
      // fall back to a plain text share instead of failing silently.
      handleShareFallback();
    }
  }

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return handleShareFallback();
        const file = new File([blob], 'buknari-villa-postcard.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: tt('postcardHeadline') });
        } else {
          handleDownload();
        }
      });
    } catch (e) {
      handleShareFallback();
    }
  }

  function handleShareFallback() {
    if (navigator.share) {
      navigator.share({ text: `${tt('postcardHeadline')} — Buknari Villa`, url: 'https://buknarivilla.ge' });
    }
  }

  return (
    <div className="travel-postcard">
      <canvas ref={canvasRef} className="travel-postcard-canvas" />
      {ready && (
        <div className="travel-postcard-actions">
          <button type="button" onClick={handleDownload}>
            ⬇ {tt('postcardDownload')}
          </button>
          <button type="button" onClick={handleShare}>
            ↗ {tt('postcardShare')}
          </button>
        </div>
      )}
    </div>
  );
}
