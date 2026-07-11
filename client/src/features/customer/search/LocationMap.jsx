import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Component to update map view when center changes
 */
function MapUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);

  return null;
}

/**
 * LocationMap - Shows user location and radius circle
 */
export function LocationMap({ lat, lng, radiusKm, onRadiusChange }) {
  const center = [lat, lng];
  const radiusMeters = radiusKm * 1000;

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{
        height: '280px',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
      }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={center} />
          <Circle
            center={center}
            radius={radiusMeters}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 2
            }}
          />
          <MapUpdater center={center} />
        </MapContainer>
      </div>

      {/* Radius slider */}
      <div style={{
        marginTop: '16px',
        padding: '16px',
        background: '#f9fafb',
        borderRadius: '8px'
      }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151'
        }}>
          רדיוס חיפוש: {radiusKm} ק״מ
        </label>
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={radiusKm}
          onChange={(e) => onRadiusChange(parseInt(e.target.value))}
          style={{
            width: '100%',
            cursor: 'pointer'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '4px'
        }}>
          <span>1 ק״מ</span>
          <span>50 ק״מ</span>
        </div>
      </div>
    </div>
  );
}
