import { useState } from 'react';
import { searchCities, getCurrentPosition } from '../services/unifiedAddressService';
import { reverseGeocode } from '../services/addressAPI';

export default function LocationSelector({ onLocationSelect, currentLocation }) {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState('choose');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [requesting, setRequesting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUseCurrentLocation = () => {
    console.log('[LocationSelector] "Use current location" clicked');
    console.log('[LocationSelector] Geolocation supported:', 'geolocation' in navigator);

    if (!('geolocation' in navigator)) {
      console.error('[LocationSelector] Geolocation not supported');
      alert('המכשיר שלך לא תומך בזיהוי מיקום');
      return;
    }

    setStep('permission');
    console.log('[LocationSelector] Showing permission explanation');
  };

  const handleConfirmPermission = async () => {
    console.log('[LocationSelector] User confirmed permission - requesting GPS');
    setRequesting(true);

    try {
      console.log('[LocationSelector] Calling getCurrentPosition()...');
      const { latitude, longitude, accuracy } = await getCurrentPosition();

      console.log('[LocationSelector] ✅ GPS SUCCESS:', {
        latitude,
        longitude,
        accuracy: `${accuracy.toFixed(0)}m`
      });

      // Immediately reverse geocode to get address
      console.log('[LocationSelector] Calling reverse geocode...');
      const addressData = await reverseGeocode(latitude, longitude);

      console.log('[LocationSelector] Reverse geocode response:', addressData);

      if (!addressData.success) {
        console.error('[LocationSelector] Reverse geocoding failed:', addressData.error);
        console.error('[LocationSelector] Fallback reason: Reverse geocoding failed');

        alert('לא הצלחנו לזהות כתובת מה-GPS. אנא בחר עיר ידנית.');
        setDetectedLocation({
          latitude,
          longitude,
          accuracy,
          source: 'gps'
        });
        setStep('manual');
        setRequesting(false);
        return;
      }

      // Successfully got address from GPS
      setDetectedLocation({
        latitude,
        longitude,
        accuracy,
        cityCode: addressData.cityCode,
        cityNameHebrew: addressData.cityNameHebrew,
        streetCode: addressData.streetCode,
        streetNameHebrew: addressData.streetNameHebrew,
        houseNumber: addressData.houseNumber,
        formattedAddress: addressData.formattedAddress,
        // Store city center coordinates as fallback
        cityLatitude: addressData.cityLatitude,
        cityLongitude: addressData.cityLongitude,
        source: 'gps',
        isEstimatedLocation: false  // GPS is exact location
      });

      console.log('[LocationSelector] Address detected from GPS:', addressData.formattedAddress);

      setStep('confirm');
      setRequesting(false);
    } catch (error) {
      console.error('[LocationSelector] ❌ GPS/Reverse-geocode FAILED:', {
        name: error.name,
        message: error.message,
        code: error.code
      });

      // Determine error reason
      let errorMessage = 'לא הצלחנו לקבל את המיקום.';
      let fallbackReason = 'Unknown error';

      if (error.code === 1) {
        errorMessage = 'הרשאת מיקום נדחתה. אנא אפשר גישה למיקום בהגדרות הדפדפן.';
        fallbackReason = 'Permission denied';
      } else if (error.code === 2) {
        errorMessage = 'לא ניתן לקבל מיקום. ייתכן שה-GPS לא זמין.';
        fallbackReason = 'Position unavailable';
      } else if (error.code === 3) {
        errorMessage = 'הזמן לקבלת מיקום פג. נסה שוב.';
        fallbackReason = 'Timeout';
      }

      console.error('[LocationSelector] Fallback reason:', fallbackReason);

      alert(errorMessage);
      setStep('manual');
      setRequesting(false);
    }
  };

  const handleConfirmDetectedLocation = () => {
    const locationData = {
      ...detectedLocation,
      city: detectedLocation.cityNameHebrew,  // Normalize: add 'city' field for compatibility
      type: 'gps',
      displayText: detectedLocation.formattedAddress
    };
    onLocationSelect(locationData);
    setShowModal(false);
    setStep('choose');
    setDetectedLocation(null);
  };

  const handleChangeManually = () => {
    setDetectedLocation(null);
    setStep('manual');
  };

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    console.log('[LocationSelector] Search input changed:', query);

    if (query.length >= 1) {
      setLoading(true);
      try {
        const results = await searchCities(query);
        console.log('[LocationSelector] Search results:', results.length);
        setSuggestions(results);
      } catch (error) {
        console.error('[LocationSelector] Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectCity = (cityData) => {
    const locationData = {
      type: detectedLocation?.source === 'gps' ? 'gps' : 'manual',
      cityCode: cityData.cityCode,
      city: cityData.hebrewName,
      cityNameHebrew: cityData.hebrewName,  // Include for consistency
      displayText: cityData.hebrewName,
      formattedAddress: cityData.hebrewName,
      source: detectedLocation?.source === 'gps' ? 'gps' : 'manual',
      isEstimatedLocation: false  // Will be set to true if using city center
    };

    // Priority 1: Use GPS coordinates if available (most accurate)
    if (detectedLocation?.latitude && detectedLocation?.longitude) {
      locationData.latitude = detectedLocation.latitude;
      locationData.longitude = detectedLocation.longitude;
      locationData.cityLatitude = detectedLocation.cityLatitude;
      locationData.cityLongitude = detectedLocation.cityLongitude;
      locationData.accuracy = detectedLocation.accuracy;
      locationData.isEstimatedLocation = false;  // GPS is exact
    }
    // Priority 2: Use city center coordinates (fallback for manual selection)
    else if (cityData.latitude && cityData.longitude) {
      locationData.latitude = cityData.latitude;
      locationData.longitude = cityData.longitude;
      locationData.cityLatitude = cityData.latitude;
      locationData.cityLongitude = cityData.longitude;
      locationData.source = 'city-center';
      locationData.isEstimatedLocation = true;  // City center is estimated
    } else {
      locationData.isEstimatedLocation = true;  // No coordinates at all
    }

    onLocationSelect(locationData);
    setShowModal(false);
    setStep('choose');
    setSearchQuery('');
    setSuggestions([]);
    setDetectedLocation(null);
  };

  const handleManualChoice = () => {
    setStep('manual');
  };

  const handleClose = () => {
    setShowModal(false);
    setStep('choose');
    setSearchQuery('');
    setSuggestions([]);
    setDetectedLocation(null);
  };

  return (
    <>
      <button className="location-display-btn" onClick={() => setShowModal(true)}>
        <span className="location-icon">📍</span>
        <span className="location-text">
          {currentLocation ? currentLocation.displayText : 'בחר מיקום'}
        </span>
        <span className="location-arrow">▼</span>
      </button>

      {showModal && (
        <div className="modal-backdrop-v2" onClick={handleClose}>
          <div className="modal-v2 location-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-v2" onClick={handleClose}>✕</button>

            {step === 'choose' && (
              <div className="location-step-content">
                <div className="location-step-header">
                  <div className="location-step-icon">📍</div>
                  <h2 className="location-step-title">בחר את המיקום שלך</h2>
                  <p className="location-step-description">
                    כדי למצוא תורים זמינים בקרבתך
                  </p>
                </div>

                <div className="location-options">
                  <button className="location-option-btn location-option-primary" onClick={handleUseCurrentLocation}>
                    <div className="location-option-icon">📱</div>
                    <div className="location-option-content">
                      <div className="location-option-title">השתמש במיקום הנוכחי</div>
                      <div className="location-option-desc">מדויק ומהיר</div>
                    </div>
                    <div className="location-option-arrow">◀</div>
                  </button>

                  <button className="location-option-btn" onClick={handleManualChoice}>
                    <div className="location-option-icon">🔍</div>
                    <div className="location-option-content">
                      <div className="location-option-title">בחר עיר ידנית</div>
                      <div className="location-option-desc">הקלד שם עיר</div>
                    </div>
                    <div className="location-option-arrow">◀</div>
                  </button>
                </div>
              </div>
            )}

            {step === 'permission' && (
              <div className="location-step-content">
                <div className="location-step-header">
                  <div className="location-step-icon">🔒</div>
                  <h2 className="location-step-title">הרשאת מיקום</h2>
                  <p className="location-step-description">
                    Onovi משתמש במיקום שלך רק כדי למצוא עסקים זמינים בקרבתך.
                  </p>
                </div>

                <div className="location-permission-info">
                  <div className="permission-info-item">
                    <span className="permission-icon">✓</span>
                    <span>המיקום שלך לא נשמר במערכת</span>
                  </div>
                  <div className="permission-info-item">
                    <span className="permission-icon">✓</span>
                    <span>המיקום שלך לא מוצג לעסקים</span>
                  </div>
                  <div className="permission-info-item">
                    <span className="permission-icon">✓</span>
                    <span>משמש רק לחיפוש עסקים באזור</span>
                  </div>
                </div>

                <div className="location-permission-actions">
                  <button className="btn-primary btn-lg btn-full" onClick={handleConfirmPermission} disabled={requesting}>
                    {requesting ? '⏳ מאתר מיקום...' : '✓ אשר והמשך'}
                  </button>
                  <button className="btn-text" onClick={handleManualChoice} disabled={requesting}>
                    בחר עיר ידנית במקום
                  </button>
                </div>
              </div>
            )}

            {step === 'confirm' && detectedLocation && (
              <div className="location-step-content">
                <div className="location-step-header">
                  <div className="location-step-icon">✓</div>
                  <h2 className="location-step-title">זיהינו את המיקום שלך</h2>
                  <p className="location-step-description">אשר את הכתובת או שנה ידנית</p>
                </div>

                <div className="detected-location-card">
                  <div className="detected-location-header">
                    <span className="detected-location-icon">📍</span>
                    <span className="detected-location-title">הכתובת שזוהתה מ-GPS</span>
                  </div>

                  <div className="detected-location-address">
                    {detectedLocation.formattedAddress}
                  </div>

                  <div className="detected-location-details">
                    <div className="detected-detail-row">
                      <span className="detected-detail-label">עיר:</span>
                      <span className="detected-detail-value">{detectedLocation.cityNameHebrew || 'לא זוהה'}</span>
                    </div>
                    {detectedLocation.streetNameHebrew && (
                      <div className="detected-detail-row">
                        <span className="detected-detail-label">רחוב:</span>
                        <span className="detected-detail-value">{detectedLocation.streetNameHebrew}</span>
                      </div>
                    )}
                    {detectedLocation.houseNumber && (
                      <div className="detected-detail-row">
                        <span className="detected-detail-label">מספר בית:</span>
                        <span className="detected-detail-value">{detectedLocation.houseNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="detected-location-note">
                    <span className="detected-note-icon">ℹ️</span>
                    <span className="detected-note-text">
                      כתובת מזוהה באמצעות GPS + OpenStreetMap
                    </span>
                  </div>
                </div>

                <div className="location-confirmation-actions">
                  <button className="btn-primary btn-lg btn-full" onClick={handleConfirmDetectedLocation}>
                    ✓ השתמש בכתובת הזו
                  </button>
                  <button className="btn-secondary btn-lg btn-full" onClick={handleChangeManually}>
                    🔍 בחר מיקום אחר
                  </button>
                </div>
              </div>
            )}

            {step === 'manual' && (
              <div className="location-step-content">
                <div className="location-step-header">
                  <div className="location-step-icon">🔍</div>
                  <h2 className="location-step-title">בחר עיר</h2>
                  <p className="location-step-description">חפש עיר מתוך הרשימה הרשמית</p>
                </div>

                <div className="location-search-container">
                  <input
                    type="text"
                    className="location-search-input"
                    placeholder="הקלד שם עיר..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoFocus
                  />

                  {suggestions.length > 0 && (
                    <div className="location-suggestions">
                      {suggestions.map((suggestion, index) => (
                        <button key={index} className="location-suggestion-item" onClick={() => handleSelectCity(suggestion)}>
                          <span className="suggestion-icon">📍</span>
                          <span className="suggestion-text">{suggestion.displayText}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {loading && (
                    <div className="location-hint">
                      <div className="location-hint-icon">⏳</div>
                      <div className="location-hint-text">טוען...</div>
                    </div>
                  )}

                  {!loading && searchQuery.length >= 1 && suggestions.length === 0 && (
                    <div className="location-no-results">
                      <div className="no-results-icon">🔍</div>
                      <div className="no-results-text">לא נמצאה עיר מתאימה</div>
                      <div className="no-results-hint">ניתן לבחור רק מתוך הרשימה הרשמית של ערי ישראל (1,259 ערים)</div>
                    </div>
                  )}

                  {!loading && searchQuery.length === 0 && (
                    <div className="location-hint">
                      <div className="location-hint-icon">💡</div>
                      <div className="location-hint-text">הקלד לפחות אות אחת כדי לחפש עיר</div>
                    </div>
                  )}
                </div>

                <button className="btn-text" onClick={() => setStep('choose')} style={{ marginTop: 'var(--space-4)' }}>
                  ← חזור
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
