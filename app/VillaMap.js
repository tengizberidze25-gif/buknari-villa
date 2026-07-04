'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icons don't resolve correctly with Next.js bundling —
// point them at the CDN copies instead.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const BUKNARI_CENTER = [41.718, 41.755];

export default function VillaMap({ villas, villaTitle, lang }) {
  const withCoords = villas.filter((v) => v.lat && v.lng);

  if (withCoords.length === 0) {
    return null;
  }

  const center =
    withCoords.length > 0
      ? [
          withCoords.reduce((s, v) => s + Number(v.lat), 0) / withCoords.length,
          withCoords.reduce((s, v) => s + Number(v.lng), 0) / withCoords.length,
        ]
      : BUKNARI_CENTER;

  return (
    <div className="villa-map-wrap">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '480px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((villa) => (
          <Marker key={villa.id} position={[Number(villa.lat), Number(villa.lng)]} icon={markerIcon}>
            <Popup>
              <strong>{villaTitle ? villaTitle(villa, lang) : villa.title}</strong>
              <br />
              {villa.location_name}
              <br />
              ₾{villa.price_per_night} / ღამე
              <br />
              <a href={`/villa/${villa.id}`}>ნახვა →</a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
