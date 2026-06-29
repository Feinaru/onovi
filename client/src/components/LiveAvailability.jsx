import { useState, useEffect } from 'react';
import OpenStreetMapView from './OpenStreetMapView';
import { api } from '../api';

/**
 * LiveAvailability - Shows REAL available appointments from database
 * NO fake/mock data
 */
export default function LiveAvailability({ onQuickBook, categories, userLocation }) {
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [nearbyBusinesses, setNearbyBusinesses] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  useEffect(() => {
    loadRealAvailability();
  }, [userLocation]);

  async function loadRealAvailability() {
    setLoading(true);

    try {
      console.log('[LiveAvailability] loadRealAvailability called');
      console.log('[LiveAvailability] userLocation:', userLocation);

      // Fetch REAL available slots from database
      // Don't filter by specific date - show all upcoming appointments
      const query = new URLSearchParams({
        status: 'OPEN'
      });

      // CRITICAL: Filter by cityCode, not city name
      // This ensures Modi'in appointments are found regardless of name variations
      if (userLocation && userLocation.cityCode) {
        query.append('cityCode', userLocation.cityCode);
        console.log('[LiveAvailability] Filtering by cityCode:', userLocation.cityCode);
      } else if (userLocation && userLocation.city) {
        // Fallback to city name (deprecated - less reliable)
        query.append('city', userLocation.city);
        console.log('[LiveAvailability] WARNING: Filtering by city name (no cityCode available):', userLocation.city);
      }

      console.log('[LiveAvailability] API query:', `/slots?${query.toString()}`);

      const slots = await api(`/slots?${query.toString()}`);

      console.log('[LiveAvailability] API returned', slots.length, 'slots');

      // Group slots by business
      const businessMap = new Map();
      slots.forEach(slot => {
        if (!slot.business) return;

        const bizId = slot.business.id;
        if (!businessMap.has(bizId)) {
          const business = slot.business;

          // Use business coordinates if available, otherwise fall back to city center
          let lat = business.latitude;
          let lon = business.longitude;
          let hasExactCoordinates = !!(lat && lon);

          // Fallback to city center coordinates if business doesn't have exact location
          if (!lat || !lon) {
            if (userLocation?.cityLatitude && userLocation?.cityLongitude &&
                business.cityCode === userLocation.cityCode) {
              lat = userLocation.cityLatitude;
              lon = userLocation.cityLongitude;
              hasExactCoordinates = false;
              console.log('[LiveAvailability] Using city center coordinates for business:', business.name);
            }
          }

          businessMap.set(bizId, {
            id: business.id,
            name: business.name,
            category: business.category?.name,
            city: business.city,
            street: business.street,
            houseNumber: business.houseNumber,
            formattedAddress: business.formattedAddress ||
              `${business.street || ''} ${business.houseNumber || ''}, ${business.city}`.trim(),
            latitude: lat,
            longitude: lon,
            hasExactCoordinates: hasExactCoordinates,
            availableNow: true,
            slots: []
          });
        }
        businessMap.get(bizId).slots.push(slot);
      });

      const businesses = Array.from(businessMap.values());

      // Calculate distances if user location has coordinates
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        businesses.forEach(business => {
          if (business.latitude && business.longitude) {
            business.distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              business.latitude,
              business.longitude
            );

            // Don't show fake distances for estimated locations
            if (userLocation.isEstimatedLocation || !business.hasExactCoordinates) {
              business.distanceText = 'בעיר שלך';
            } else if (business.distance < 0.05) {
              // Very close - less than 50m
              business.distanceText = 'קרוב מאוד';
            } else {
              business.distanceText = `${business.distance.toFixed(1)} ק"מ`;
            }
          } else {
            business.distanceText = 'בעיר שלך';
          }
        });

        // Sort by distance
        businesses.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      }

      setAvailableSlots(slots);
      setNearbyBusinesses(businesses);
    } catch (error) {
      console.error('Error loading availability:', error);
      setAvailableSlots([]);
      setNearbyBusinesses([]);
    } finally {
      setLoading(false);
    }
  }

  // Haversine distance formula (in kilometers)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const handleQuickFind = () => {
    if (onQuickBook) {
      onQuickBook();
    }
  };

  // Defensive fallback for city name
  const locationCity = userLocation?.city || userLocation?.cityNameHebrew;

  // Empty state - no location selected
  if (!userLocation || !locationCity) {
    return (
      <div className="live-availability-section">
        <div className="live-availability-header">
          <h2 className="live-title">תורים זמינים עכשיו באזורך</h2>
          <p className="live-subtitle">בחר מיקום כדי לראות תורים זמינים בקרבתך</p>
        </div>
        <div className="empty-state-card">
          <div className="empty-state-icon">📍</div>
          <div className="empty-state-title">בחר את המיקום שלך</div>
          <div className="empty-state-description">
            כדי למצוא תורים זמינים בקרבתך, עליך לבחור מיקום תחילה
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-availability-section">
      <div className="live-availability-header">
        <div className="live-header-content">
          <h2 className="live-title">תורים זמינים עכשיו ב{locationCity}</h2>
          <p className="live-subtitle">תורים אמיתיים מעסקים פעילים</p>
        </div>
        <div className="live-status">
          {loading ? (
            <div className="status-badge status-scanning">
              <span className="pulse-dot"></span>
              טוען זמינות...
            </div>
          ) : (
            <div className="status-badge status-active">
              <span className="pulse-dot-active"></span>
              {nearbyBusinesses.length} עסקים זמינים
            </div>
          )}
        </div>
      </div>

      <div className="live-map-container">
        {loading ? (
          <div className="scanning-overlay">
            <div className="scanning-animation">
              <div className="radar-pulse"></div>
              <div className="radar-pulse radar-pulse-2"></div>
              <div className="radar-pulse radar-pulse-3"></div>
              <div className="scanning-icon">📡</div>
            </div>
            <div className="scanning-text">מחפש תורים זמינים באזור...</div>
          </div>
        ) : nearbyBusinesses.length > 0 ? (
          <>
            <OpenStreetMapView
              userLocation={userLocation}
              businesses={nearbyBusinesses}
              onMarkerClick={(business) => setSelectedMarker(business.id)}
              height="450px"
              zoom={14}
            />

            <div className="found-message">
              <span className="found-icon">✓</span>
              נמצאו {nearbyBusinesses.length} עסקים עם תורים זמינים היום
            </div>
          </>
        ) : (
          <div className="empty-state-card">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">אין תורים זמינים כרגע באזור שלך</div>
            <div className="empty-state-description">
              נסה לשנות מיקום או קטגוריה
            </div>
            <button className="btn-secondary" onClick={handleQuickFind}>
              חפש באזורים אחרים
            </button>
          </div>
        )}
      </div>

      {/* Real availability cards */}
      {!loading && nearbyBusinesses.length > 0 && (
        <div className="quick-slots-container">
          <div className="quick-slots-header">
            <h3 className="quick-slots-title">תורים מהירים</h3>
            <button className="btn-text" onClick={handleQuickFind}>
              הצג הכל
            </button>
          </div>

          <div className="quick-slots-grid">
            {nearbyBusinesses.slice(0, 6).map(business => (
              <div key={business.id} className="quick-slot-card" onClick={handleQuickFind}>
                <div className="quick-slot-header">
                  <span className="quick-badge quick-badge-success">
                    זמין היום
                  </span>
                  {business.slots.length <= 3 && (
                    <span className="quick-urgency">🔥</span>
                  )}
                </div>
                <div className="quick-slot-business">{business.name}</div>
                <div className="quick-slot-category">{business.category || 'שירותים'}</div>
                <div className="quick-slot-footer">
                  {business.distanceText && (
                    <span className="quick-slot-distance">📍 {business.distanceText}</span>
                  )}
                  <span className="quick-slot-time">{business.slots.length} תורים פנויים</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main CTA */}
      <div className="live-cta-section">
        <button className="btn-live-primary" onClick={handleQuickFind}>
          <span className="btn-icon">⚡</span>
          <span>חפש תורים זמינים</span>
        </button>
        <p className="live-cta-note">מציג רק תורים אמיתיים מעסקים פעילים</p>
      </div>
    </div>
  );
}
