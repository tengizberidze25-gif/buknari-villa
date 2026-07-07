'use client';

import { useEffect, useRef, useState } from 'react';

export default function VillageVideoGallery({ village }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
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

  if (loading || videos.length === 0) return null;

  return (
    <section className="section village-video-section">
      <div className="section-head">
        <div>
          <div className="section-eyebrow">ცხოვრება ადგილზე</div>
          <h2>{village}</h2>
        </div>
      </div>
      <div className="village-video-scroll" ref={scrollRef}>
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
    </section>
  );
}
