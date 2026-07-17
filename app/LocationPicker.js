'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_CENTER = { lat: 41.718, lng: 41.755 }; // ბუკნარის მიდამო

let googleMapsLoadingPromise = null;

function loadGoogleMaps(apiKey) {
  if (typeof window !== 'undefined' && window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }
  if (googleMapsLoadingPromise) return googleMapsLoadingPromise;

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
}

export default function LocationPicker({ initialLat, initialLng }) {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  const [loadError, setLoadError] = useState(false);
  const [coords, setCoords] = useState(
    initialLat && initialLng ? { lat: Number(initialLat), lng: Number(initialLng) } : null
  );

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        const startCenter = coords || DEFAULT_CENTER;

        const map = new google.maps.Map(mapRef.current, {
          center: startCenter,
          zoom: coords ? 15 : 12,
          mapTypeId: 'satellite',
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          mapId: '68ce22de336b927b206a407b',
        });
        mapInstance.current = map;

        const marker = new google.maps.Marker({
          position: startCenter,
          map,
          draggable: true,
          visible: !!coords,
        });
        markerInstance.current = marker;

        function setPoint(latLng) {
          marker.setPosition(latLng);
          marker.setVisible(true);
          setCoords({ lat: latLng.lat(), lng: latLng.lng() });
        }

        map.addListener('click', (e) => setPoint(e.latLng));
        marker.addListener('dragend', (e) => setPoint(e.latLng));

        if (searchInputRef.current && google.maps.places) {
          const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ['geometry'],
          });
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) return;
            const loc = place.geometry.location;
            map.setCenter(loc);
            map.setZoom(16);
            setPoint(loc);
          });
        }
      })
      .catch(() => setLoadError(true));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  return (
    <div className="form-row">
      <label>ვილის ადგილმდებარეობა რუკაზე (არასავალდებულო)</label>
      <p className="form-hint">
        მოძებნეთ მისამართი ან დააჭირეთ ზუსტ წერტილს რუკაზე — pin-ი გადაათრიეთ ზუსტი ადგილის მისათითებლად.
      </p>

      {apiKey && !loadError && (
        <input
          ref={searchInputRef}
          type="text"
          placeholder="მისამართის ძებნა..."
          style={{ marginBottom: '10px' }}
        />
      )}

      {!apiKey && (
        <p className="dashboard-empty-hint">
          რუკა ამჟამად ხელმისაწვდომი არ არის — ეს ველი არასავალდებულოა, შეგიძლიათ ცარიელი დატოვოთ.
        </p>
      )}

      {loadError && (
        <p className="dashboard-empty-hint">რუკის ჩატვირთვა ვერ მოხერხდა — ეს ველი არასავალდებულოა.</p>
      )}

      {apiKey && !loadError && (
        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
          <div ref={mapRef} style={{ height: '320px', width: '100%' }} />
        </div>
      )}

      {coords && (
        <p className="form-hint" style={{ marginTop: '8px' }}>
          📍 არჩეული წერტილი: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </p>
      )}

      <input type="hidden" name="lat" value={coords ? coords.lat : ''} readOnly />
      <input type="hidden" name="lng" value={coords ? coords.lng : ''} readOnly />
    </div>
  );
}
