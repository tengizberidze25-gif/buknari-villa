'use client';

import { useEffect, useRef, useState } from 'react';

export default function VillageVideoGallery({ village }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!village) return;
    setLoading(true);
    fetch(`/api/village-videos?village=${encodeURIComponent(village)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setVideos(data.videos);
        else setVideos([]);
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [village]);

  function handleScroll() {
    if (scrollRef.current && scrollRef.current.scrollLeft > 10) {
      setScrolled(true);
    }
  }

  if (loading || videos.length === 0) return null;

  return (
    <section className="section village-video-section">
      <div className="section-head">
        <div>
          <div className="section-eyebrow">ცხოვრება ადგილზე</div>
          <h2>{village}</h2>
        </div>
      </div>
      <div className="village-video-wrap">
        <div className="village-video-scroll" ref={scrollRef} onScroll={handleScroll}>
          {videos.map((v) => (
            <video
              key={v.id}
              src={v.url}
              className="village-video-item"
              autoPlay
              muted
              loop
              playsInline
              controls
            />
          ))}
        </div>
        {videos.length > 1 && !scrolled && (
          <div className="village-video-hint">
            <span className="village-video-hint-arrow">→</span>
          </div>
        )}
      </div>
    </section>
  );
}
