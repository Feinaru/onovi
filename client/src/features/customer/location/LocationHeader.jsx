import React from 'react';
import LocationSelector from '../../../components/LocationSelector';
import LiveAvailability from '../../../components/LiveAvailability';
import ErrorBoundary from '../../../components/ErrorBoundary';

/**
 * LocationHeader - Location selector and live availability display
 */
function LocationHeader({ userLocation, onLocationSelect, categories, onQuickBook }) {
  return (
    <>
      <div className="location-header">
        <LocationSelector
          currentLocation={userLocation}
          onLocationSelect={onLocationSelect}
        />
      </div>

      {userLocation ? (
        <ErrorBoundary onReset={() => onLocationSelect(null)}>
          <LiveAvailability
            onQuickBook={onQuickBook}
            categories={categories}
            userLocation={userLocation}
          />
        </ErrorBoundary>
      ) : (
        <div className="location-prompt-section">
          <div className="location-prompt-card">
            <div className="location-prompt-icon">📍</div>
            <h2 className="location-prompt-title">בחר את המיקום שלך</h2>
            <p className="location-prompt-description">
              כדי לראות תורים זמינים באזור שלך, עלינו לדעת היכן אתה נמצא
            </p>
            <button
              className="btn-primary btn-lg"
              onClick={() => document.querySelector('.location-display-btn').click()}
            >
              📍 בחר מיקום
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default LocationHeader;
