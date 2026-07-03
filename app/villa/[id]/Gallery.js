'use client';

import { useState, useEffect, useCallback } from 'react';

export default function Gallery({ photos, title }) {
  const [openIndex, setOpenIndex] = useState(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  );
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, close, prev, next]);

  if (!photos || photos.length === 0) {
    return (
      <div className="villa-gallery-empty">
        <span>ფოტო არ არის დამატებული</span>
      </div>
    );
  }

  const main = photos[0];
  const rest = photos.slice(1, 5);

  return (
    <>
      <div className="villa-gallery-grid">
        <button className="villa-gallery-main" onClick={() => setOpenIndex(0)}>
          <img src={main} alt={title} />
        </button>
        {rest.length > 0 && (
          <div className="villa-gallery-sub">
            {rest.map((url, i) => (
              <button key={i} className="villa-gallery-thumb" onClick={() => setOpenIndex(i + 1)}>
                <img src={url} alt={`${title} ${i + 2}`} />
              </button>
            ))}
            {photos.length > 5 && (
              <button className="villa-gallery-more" onClick={() => setOpenIndex(5)}>
                +{photos.length - 5} ფოტო
              </button>
            )}
          </div>
        )}
      </div>

      {openIndex !== null && (
        <div className="villa-lightbox" onClick={close}>
          <button className="villa-lightbox-close" onClick={close} aria-label="დახურვა">✕</button>

          {photos.length > 1 && (
            <button
              className="villa-lightbox-nav villa-lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="წინა"
            >
              ‹
            </button>
          )}

          <img
            src={photos[openIndex]}
            alt={`${title} ${openIndex + 1}`}
            className="villa-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />

          {photos.length > 1 && (
            <button
              className="villa-lightbox-nav villa-lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="შემდეგი"
            >
              ›
            </button>
          )}

          <div className="villa-lightbox-counter">
            {openIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
