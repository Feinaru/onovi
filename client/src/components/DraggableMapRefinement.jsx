import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * DraggableMapRefinement - Optional location refinement
 *
 * Shows a map with a draggable marker for fine-tuning business location
 *
 * Props:
 * - initialLocation: { latitude, longitude, formattedAddress }
 * - onLocationChange: (latitude, longitude) => void
 * - isDraggable: boolean (default: false)
 */
export default function DraggableMapRefinement({
  initialLocation,
  onLocationChange,
  isDraggable = false,
  height = '400px'
}) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const [currentCoords, setCurrentCoords] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!initialLocation?.latitude || !initialLocation?.longitude) return;
    if (mapRef.current && !leafletMapRef.current) {
      initializeMap();
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [initialLocation]);

  // Update marker draggability when isDraggable changes
  useEffect(() => {
    if (markerRef.current) {
      if (isDraggable) {
        markerRef.current.dragging.enable();
        markerRef.current.setOpacity(0.8);
      } else {
        markerRef.current.dragging.disable();
        markerRef.current.setOpacity(1);
      }
    }
  }, [isDraggable]);

  function initializeMap() {
    const center = [initialLocation.latitude, initialLocation.longitude];

    // Create Leaflet map
    leafletMapRef.current = L.map(mapRef.current, {
      center: center,
      zoom: 17, // Closer zoom for refinement
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(leafletMapRef.current);

    // Create custom business marker icon
    const businessIcon = L.divIcon({
      className: 'custom-business-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          background: #EF4444;
          border: 4px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: ${isDraggable ? 'move' : 'pointer'};
        ">
          🏢
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Add marker
    markerRef.current = L.marker(center, {
      icon: businessIcon,
      draggable: isDraggable
    }).addTo(leafletMapRef.current);

    // Marker popup
    const popupContent = `
      <div style="padding: 8px; font-family: Assistant, sans-serif; direction: rtl;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
          📍 מיקום העסק
        </div>
        <div style="font-size: 12px; color: #6B7280;">
          ${initialLocation.formattedAddress || 'כתובת העסק'}
        </div>
      </div>
    `;
    markerRef.current.bindPopup(popupContent);

    // Handle marker drag
    markerRef.current.on('dragend', () => {
      const newPos = markerRef.current.getLatLng();
      setCurrentCoords({ lat: newPos.lat, lng: newPos.lng });

      if (onLocationChange) {
        onLocationChange(newPos.lat, newPos.lng);
      }

      console.log('[DraggableMap] New location:', newPos.lat, newPos.lng);
    });

    // Handle marker drag (live update)
    markerRef.current.on('drag', () => {
      const newPos = markerRef.current.getLatLng();
      setCurrentCoords({ lat: newPos.lat, lng: newPos.lng });
    });
  }

  if (!initialLocation?.latitude || !initialLocation?.longitude) {
    return (
      <div style={{
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</div>
          <div style={{ color: '#6B7280', fontSize: '16px' }}>
            נא להזין כתובת תחילה
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={mapRef}
        style={{
          height: height,
          width: '100%',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          border: isDraggable ? '3px solid #EF4444' : '1px solid var(--border-default)',
          position: 'relative',
          zIndex: 1
        }}
      />

      {/* Live coordinates display while dragging */}
      {isDraggable && currentCoords && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 1000,
          fontFamily: 'monospace',
          direction: 'ltr'
        }}>
          {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
        </div>
      )}

      {/* Dragging instruction */}
      {isDraggable && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#EF4444',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          textAlign: 'center',
          direction: 'rtl'
        }}>
          🔄 גרור את הסיכה למיקום המדויק של הכניסה לעסק
        </div>
      )}
    </div>
  );
}
