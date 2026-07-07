'use client';

import { useEffect, useRef, useState } from 'react';

const BUKNARI_CENTER = { lat: 41.718, lng: 41.755 };

function coverPhoto(villa) {
  if (!villa.villa_photos || villa.villa_photos.length === 0) return null;
  const sorted = [...villa.villa_photos].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0].url;
}

let googleMapsLoadingPromise = null;

function loadGoogleMaps(apiKey) {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google);
  }
  if (googleMapsLoadingPromise) return googleMapsLoadingPromise;

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
}

export default function VillaMap({ villas, villaTitle, lang }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [loadError, setLoadError] = useState(false);

  const withCoords = villas.filter((v) => v.lat && v.lng);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || withCoords.length === 0) return;

    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        const center =
          withCoords.length > 0
            ? {
                lat: withCoords.reduce((s, v) => s + Number(v.lat), 0) / withCoords.length,
                lng: withCoords.reduce((s, v) => s + Number(v.lng), 0) / withCoords.length,
              }
            : BUKNARI_CENTER;

        if (!mapInstance.current) {
          mapInstance.current = new google.maps.Map(mapRef.current, {
            center,
            zoom: 13,
            mapTypeId: 'satellite',
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: false,
          });
        } else {
          mapInstance.current.setCenter(center);
        }

        // Clear previous markers before re-adding (villas list can change with filters)
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const infoWindow = new google.maps.InfoWindow();

        withCoords.forEach((villa) => {
          const marker = new google.maps.Marker({
            position: { lat: Number(villa.lat), lng: Number(villa.lng) },
            map: mapInstance.current,
            title: villaTitle ? villaTitle(villa, lang) : villa.title,
          });

          marker.addListener('click', () => {
            const photo = coverPhoto(villa);
            const title = villaTitle ? villaTitle(villa, lang) : villa.title;
            infoWindow.setContent(`
              <div class="villa-map-popup">
                ${photo ? `<img src="${photo}" alt="" class="villa-map-popup-photo" />` : ''}
                <strong>${title}</strong>
                <div>${villa.location_name || ''}</div>
                <div class="villa-map-popup-price">₾${villa.price_per_night} / ღამე</div>
                <a href="/villa/${villa.id}">ნახვა →</a>
              </div>
            `);
            infoWindow.open(mapInstance.current, marker);
          });

          markersRef.current.push(marker);
        });
      })
      .catch(() => setLoadError(true));

    return () => {
      cancelled = true;
    };
  }, [villas, lang]);

  if (withCoords.length === 0) return null;

  if (loadError) {
    return (
      <div className="villa-map-wrap">
        <p className="dashboard-empty-hint">რუკის ჩატვირთვა ვერ მოხერხდა.</p>
      </div>
    );
  }

  return (
    <div className="villa-map-wrap">
      <div ref={mapRef} style={{ height: '480px', width: '100%' }} />
    </div>
  );
}
