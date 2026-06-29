import { useEffect, useRef } from 'react';
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
 * OpenStreetMapView - Free map using OpenStreetMap + Leaflet
 * No API key required, no paid services
 */
export default function OpenStreetMapView({
  userLocation,
  businesses = [],
  onMarkerClick,
  height = '400px',
  zoom = 13
}) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

  // Check if we have any coordinates (GPS or city center)
  const hasCoordinates = userLocation?.latitude && userLocation?.longitude;

  useEffect(() => {
    if (hasCoordinates) {
      initializeMap();
    }

    return () => {
      // Cleanup map on unmount
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [hasCoordinates]);

  useEffect(() => {
    if (leafletMapRef.current && hasCoordinates) {
      updateMarkers();
    }
  }, [businesses, userLocation, hasCoordinates]);

  // If no coordinates at all, show fallback message
  // This should rarely happen now that cities have center coordinates
  if (!hasCoordinates) {
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
          <div style={{ color: '#6B7280', fontSize: '16px', marginBottom: '8px' }}>
            תצוגת מפה לא זמינה
          </div>
          <div style={{ color: '#9CA3AF', fontSize: '14px' }}>
            לא נמצאו נתוני מיקום לעיר זו
          </div>
        </div>
      </div>
    );
  }

  function initializeMap() {
    if (!mapRef.current || leafletMapRef.current || !hasCoordinates) return;

    const defaultCenter = [userLocation.latitude, userLocation.longitude];

    // Create Leaflet map
    leafletMapRef.current = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: zoom,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Add OpenStreetMap tile layer (free, no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(leafletMapRef.current);

    updateMarkers();
  }

  function updateMarkers() {
    if (!leafletMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = [];

    // Add user location marker
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      const userLatLng = [userLocation.latitude, userLocation.longitude];
      bounds.push(userLatLng);

      // Custom blue icon for user location
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="
            position: relative;
            width: 30px;
            height: 30px;
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 20px;
              height: 20px;
              background: #4F46E5;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 40px;
              height: 40px;
              background: rgba(79, 70, 229, 0.2);
              border-radius: 50%;
              animation: pulse 2s infinite;
            "></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const userMarker = L.marker(userLatLng, { icon: userIcon }).addTo(leafletMapRef.current);

      const userPopupContent = `
        <div style="padding: 8px; font-family: Assistant, sans-serif; min-width: 150px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #4F46E5;">
            📍 המיקום שלך
          </div>
          <div style="font-size: 12px; color: #6B7280;">
            ${userLocation.formattedAddress || userLocation.city}
          </div>
        </div>
      `;

      userMarker.bindPopup(userPopupContent);
      markersRef.current.push(userMarker);
    }

    // Add business markers
    businesses.forEach(business => {
      if (!business.latitude || !business.longitude) return;

      const businessLatLng = [business.latitude, business.longitude];
      bounds.push(businessLatLng);

      // Custom icon for businesses (green if available, orange if not)
      const color = business.availableNow ? '#10B981' : '#F59E0B';
      const businessIcon = L.divIcon({
        className: 'custom-business-marker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            ${business.availableNow ? '✓' : '⏰'}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const businessMarker = L.marker(businessLatLng, { icon: businessIcon })
        .addTo(leafletMapRef.current);

      const popupContent = `
        <div style="padding: 12px; font-family: Assistant, sans-serif; max-width: 250px; direction: rtl;">
          <div style="font-weight: 600; font-size: 15px; margin-bottom: 6px; color: #111827;">
            ${business.name}
          </div>
          ${business.category ? `
            <div style="font-size: 13px; color: #6B7280; margin-bottom: 4px;">
              ${business.category}
            </div>
          ` : ''}
          ${business.formattedAddress ? `
            <div style="font-size: 12px; color: #9CA3AF; margin-bottom: 8px;">
              📍 ${business.formattedAddress}
            </div>
          ` : ''}
          ${business.availableNow !== undefined ? `
            <div style="margin-top: 8px;">
              <span style="
                display: inline-block;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                background: ${business.availableNow ? '#D1FAE5' : '#FEF3C7'};
                color: ${business.availableNow ? '#065F46' : '#92400E'};
              ">
                ${business.availableNow ? '✓ זמין עכשיו' : '⏰ לא זמין'}
              </span>
            </div>
          ` : ''}
        </div>
      `;

      businessMarker.bindPopup(popupContent);

      businessMarker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(business);
        }
      });

      markersRef.current.push(businessMarker);
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      leafletMapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15
      });
    }
  }

  return (
    <div
      ref={mapRef}
      style={{
        height: height,
        width: '100%',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--border-default)',
        position: 'relative',
        zIndex: 1
      }}
    />
  );
}
