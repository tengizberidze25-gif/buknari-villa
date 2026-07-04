'use client';

import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
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

function coverPhoto(villa) {
  if (!villa.villa_photos || villa.villa_photos.length === 0) return null;
  const sorted = [...villa.villa_photos].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0].url;
}

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
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="სატელიტი">
            <TileLayer
              attribution='Imagery &copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="რუკა">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        {withCoords.map((villa) => {
          const photo = coverPhoto(villa);
          return (
            <Marker key={villa.id} position={[Number(villa.lat), Number(villa.lng)]} icon={markerIcon}>
              <Popup>
                <div className="villa-map-popup">
                  {photo && <img src={photo} alt="" className="villa-map-popup-photo" />}
                  <strong>{villaTitle ? villaTitle(villa, lang) : villa.title}</strong>
                  <div>{villa.location_name}</div>
                  <div className="villa-map-popup-price">₾{villa.price_per_night} / ღამე</div>
                  <a href={`/villa/${villa.id}`}>ნახვა →</a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
