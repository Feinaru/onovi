import { useState, useEffect } from 'react';
import { searchCities, searchStreets } from '../services/unifiedAddressService';
import { forwardGeocode } from '../services/addressAPI';
import DraggableMapRefinement from './DraggableMapRefinement';

/**
 * BusinessAddressForm - Code-Based Address Input
 *
 * CRITICAL RULES:
 * - City selection: stores cityCode + hebrewName
 * - Street selection: uses cityCode to search, stores streetCode + hebrewName
 * - Display: Hebrew names ONLY (no English)
 * - Validation: Must select from list (no free text)
 * - Save payload: includes cityCode, streetCode, Hebrew names
 */
export default function BusinessAddressForm({ value, onChange, required = true }) {
  // State for city selection
  const [cityQuery, setCityQuery] = useState(value?.cityNameHebrew || '');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState(
    value?.cityCode ? { cityCode: value.cityCode, hebrewName: value.cityNameHebrew } : null
  );

  // State for street selection
  const [streetQuery, setStreetQuery] = useState(value?.streetNameHebrew || '');
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [selectedStreet, setSelectedStreet] = useState(
    value?.streetCode ? { streetCode: value.streetCode, hebrewName: value.streetNameHebrew } : null
  );

  // House number
  const [houseNumber, setHouseNumber] = useState(value?.houseNumber || '');

  // Loading and errors
  const [loading, setLoading] = useState({ cities: false, streets: false });
  const [errors, setErrors] = useState({});

  // Location refinement state
  const [showRefinementMap, setShowRefinementMap] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinedLocation, setRefinedLocation] = useState(null);
  const [geocodedLocation, setGeocodedLocation] = useState(null);
  const [isManuallyVerified, setIsManuallyVerified] = useState(false);

  // Track initial saved coordinates (for edit mode) - initialize directly from value prop
  const [initialSavedCoords, setInitialSavedCoords] = useState(() => {
    if (value?.latitude && value?.longitude && value?.cityCode && value?.streetCode && value?.houseNumber) {
      console.log('[BusinessAddressForm] 🔧 Initializing initialSavedCoords with value:', {
        latitude: value.latitude,
        longitude: value.longitude,
        locationVerifiedByBusiness: value.locationVerifiedByBusiness
      });
      return {
        latitude: value.latitude,
        longitude: value.longitude,
        locationVerifiedByBusiness: value.locationVerifiedByBusiness
      };
    }
    console.log('[BusinessAddressForm] 🔧 No saved coords to initialize');
    return null;
  });
  const [addressChanged, setAddressChanged] = useState(false);

  // Initialize map display with saved coordinates if editing existing business
  useEffect(() => {
    if (initialSavedCoords) {
      console.log('[BusinessAddressForm] 📍 Initializing map with saved coordinates:', {
        lat: initialSavedCoords.latitude,
        lon: initialSavedCoords.longitude,
        locationVerified: initialSavedCoords.locationVerifiedByBusiness
      });

      // Show map with saved coordinates
      setGeocodedLocation({
        latitude: initialSavedCoords.latitude,
        longitude: initialSavedCoords.longitude,
        formattedAddress: value.formattedAddress || `${value.streetNameHebrew} ${value.houseNumber}, ${value.cityNameHebrew}`
      });
      setShowRefinementMap(true);

      // Set verification status
      const verificationStatus = initialSavedCoords.locationVerifiedByBusiness || false;
      console.log('[BusinessAddressForm] 🎯 Setting isManuallyVerified to:', verificationStatus);
      setIsManuallyVerified(verificationStatus);
    }
  }, []); // Run only once on mount

  // Update parent whenever address changes
  // NO FALLBACK - geocoding must succeed or address is invalid
  useEffect(() => {
    async function geocodeAddress() {
      if (selectedCity && selectedStreet && houseNumber) {
        console.log('='.repeat(80));
        console.log('[BusinessAddressForm] 🏗️ Building address data...');

        // Check if this is initial load with saved coordinates (edit mode)
        const isInitialLoad = initialSavedCoords && !addressChanged && !refinedLocation;

        if (isInitialLoad) {
          // Use saved coordinates on initial load (edit mode)
          console.log('[BusinessAddressForm] 📍 Using saved coordinates (edit mode - no address change)');

          const addressData = {
            cityCode: selectedCity.cityCode,
            cityNameHebrew: selectedCity.hebrewName,
            streetCode: selectedStreet.streetCode,
            streetNameHebrew: selectedStreet.hebrewName,
            houseNumber: houseNumber,
            formattedAddress: `${selectedStreet.hebrewName} ${houseNumber}, ${selectedCity.hebrewName}`,
            latitude: initialSavedCoords.latitude,
            longitude: initialSavedCoords.longitude,
            hasExactCoordinates: false,
            isEstimatedLocation: true,
            locationVerifiedByBusiness: initialSavedCoords.locationVerifiedByBusiness || false,
            isComplete: true
          };

          onChange(addressData);
          console.log('='.repeat(80));
          return;
        }

        // Check if user refined the location (dragged marker)
        if (initialSavedCoords && !addressChanged && refinedLocation) {
          // Use refined location from map drag
          console.log('[BusinessAddressForm] 📍 Using refined coordinates (user dragged marker)');
          console.log('[BusinessAddressForm] Refined lat/lon:', refinedLocation.latitude, refinedLocation.longitude);

          const addressData = {
            cityCode: selectedCity.cityCode,
            cityNameHebrew: selectedCity.hebrewName,
            streetCode: selectedStreet.streetCode,
            streetNameHebrew: selectedStreet.hebrewName,
            houseNumber: houseNumber,
            formattedAddress: `${selectedStreet.hebrewName} ${houseNumber}, ${selectedCity.hebrewName}`,
            latitude: refinedLocation.latitude,
            longitude: refinedLocation.longitude,
            hasExactCoordinates: false,
            isEstimatedLocation: true,
            locationVerifiedByBusiness: true, // Mark as manually verified
            isComplete: true
          };

          console.log('[BusinessAddressForm] 📤 Sending refined data to parent:', {
            latitude: addressData.latitude,
            longitude: addressData.longitude,
            locationVerifiedByBusiness: addressData.locationVerifiedByBusiness
          });
          onChange(addressData);
          console.log('='.repeat(80));
          return;
        }

        // Address changed or new business - geocode the address
        console.log('[BusinessAddressForm] 🔍 Address changed or new business - geocoding...');

        const addressData = {
          cityCode: selectedCity.cityCode,
          cityNameHebrew: selectedCity.hebrewName,
          streetCode: selectedStreet.streetCode,
          streetNameHebrew: selectedStreet.hebrewName,
          houseNumber: houseNumber,
          formattedAddress: `${selectedStreet.hebrewName} ${houseNumber}, ${selectedCity.hebrewName}`,
          latitude: null,
          longitude: null,
          hasExactCoordinates: false,
          isEstimatedLocation: true,
          isComplete: false // Will only be true if geocoding succeeds
        };

        // MANDATORY: Get coordinates via forward geocoding
        try {
          console.log('[BusinessAddressForm] 🔍 Calling forward geocode (MANDATORY)...');
          const geocodeResult = await forwardGeocode(
            selectedStreet.hebrewName,
            houseNumber,
            selectedCity.hebrewName
          );

          console.log('[BusinessAddressForm] 📦 Geocode result:', geocodeResult);

          if (geocodeResult.success && geocodeResult.latitude && geocodeResult.longitude) {
            // Use refined location if available, otherwise use geocoded location
            const finalLat = refinedLocation?.latitude || geocodeResult.latitude;
            const finalLon = refinedLocation?.longitude || geocodeResult.longitude;
            const isManuallyRefined = !!refinedLocation;

            addressData.latitude = finalLat;
            addressData.longitude = finalLon;
            addressData.hasExactCoordinates = geocodeResult.hasExactCoordinates;
            addressData.isEstimatedLocation = geocodeResult.isEstimatedLocation;
            addressData.locationVerifiedByBusiness = isManuallyRefined;
            addressData.isComplete = true; // Mark as complete

            // Store geocoded location for map display (don't overwrite if already set from saved coords)
            if (!geocodedLocation || addressChanged) {
              setGeocodedLocation({
                latitude: geocodeResult.latitude,
                longitude: geocodeResult.longitude,
                formattedAddress: addressData.formattedAddress
              });
            }

            // Reset manually verified status when address changes
            if (addressChanged) {
              setIsManuallyVerified(false);
            }

            // Show map after successful geocoding
            setShowRefinementMap(true);

            console.log('[BusinessAddressForm] ✅ Geocoding succeeded:', {
              lat: finalLat,
              lon: finalLon,
              isExact: geocodeResult.hasExactCoordinates,
              type: geocodeResult.hasExactCoordinates ? 'house-level' : 'street-level',
              manuallyRefined: isManuallyRefined
            });
          } else {
            // Geocoding failed - address is INVALID
            console.error('[BusinessAddressForm] ❌ Geocoding FAILED - address will be REJECTED on save');
            addressData.isComplete = false;
            setShowRefinementMap(false);
          }
        } catch (error) {
          console.error('[BusinessAddressForm] ❌ Geocoding exception:', error);
          addressData.isComplete = false;
        }

        console.log('[BusinessAddressForm] 📤 Sending to parent:', {
          formattedAddress: addressData.formattedAddress,
          latitude: addressData.latitude,
          longitude: addressData.longitude,
          hasExactCoordinates: addressData.hasExactCoordinates,
          isEstimatedLocation: addressData.isEstimatedLocation,
          isComplete: addressData.isComplete
        });
        console.log('='.repeat(80));

        onChange(addressData);
      } else {
        // Incomplete form - not ready to save
        onChange({
          cityCode: selectedCity?.cityCode || null,
          cityNameHebrew: selectedCity?.hebrewName || null,
          streetCode: selectedStreet?.streetCode || null,
          streetNameHebrew: selectedStreet?.hebrewName || null,
          houseNumber: houseNumber || null,
          formattedAddress: null,
          latitude: null,
          longitude: null,
          hasExactCoordinates: false,
          isEstimatedLocation: true,
          isComplete: false
        });
      }
    }

    geocodeAddress();
  }, [selectedCity, selectedStreet, houseNumber, refinedLocation, addressChanged, initialSavedCoords]);

  // City autocomplete
  const handleCityInputChange = async (e) => {
    const query = e.target.value;
    setCityQuery(query);

    console.log('[BusinessAddressForm] City input:', query);

    // Clear selection if user changes input
    if (selectedCity && query !== selectedCity.hebrewName) {
      setSelectedCity(null);
      setSelectedStreet(null);
      setStreetQuery('');
      setErrors({});
      setAddressChanged(true); // Mark address as changed
    }

    if (query.length >= 1) {
      setLoading({ ...loading, cities: true });
      try {
        const results = await searchCities(query);
        console.log('[BusinessAddressForm] Found cities:', results.length);
        setCitySuggestions(results);
        setShowCitySuggestions(true);
      } catch (error) {
        console.error('[BusinessAddressForm] City search error:', error);
        setCitySuggestions([]);
        setErrors({ ...errors, city: 'שגיאה בחיפוש ערים' });
      } finally {
        setLoading({ ...loading, cities: false });
      }
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  };

  const handleSelectCity = (city) => {
    console.log('[BusinessAddressForm] City selected:', city);
    console.log('[BusinessAddressForm] City coordinates:', city.latitude, city.longitude);

    setSelectedCity(city);
    setCityQuery(city.hebrewName);
    setShowCitySuggestions(false);
    setCitySuggestions([]);
    setErrors({ ...errors, city: null });
    setAddressChanged(true); // Mark address as changed

    // Clear street when city changes
    setSelectedStreet(null);
    setStreetQuery('');
    setStreetSuggestions([]);
  };

  // Street autocomplete - MUST use cityCode
  const handleStreetInputChange = async (e) => {
    const query = e.target.value;
    setStreetQuery(query);

    console.log('[BusinessAddressForm] Street input:', query);

    if (!selectedCity || !selectedCity.cityCode) {
      console.error('[BusinessAddressForm] Cannot search streets without cityCode');
      setErrors({ ...errors, street: 'נא לבחור עיר תחילה' });
      return;
    }

    // Clear selection if user changes input
    if (selectedStreet && query !== selectedStreet.hebrewName) {
      setSelectedStreet(null);
      setAddressChanged(true); // Mark address as changed
    }

    if (query.length >= 1) {
      setLoading({ ...loading, streets: true });
      console.log('[BusinessAddressForm] Searching streets in cityCode:', selectedCity.cityCode);

      try {
        const results = await searchStreets(selectedCity.cityCode, query);
        console.log('[BusinessAddressForm] Found streets:', results.length);
        setStreetSuggestions(results);
        setShowStreetSuggestions(true);

        if (results.length === 0) {
          console.warn('[BusinessAddressForm] No streets found for query:', query);
        }
      } catch (error) {
        console.error('[BusinessAddressForm] Street search error:', error);
        setStreetSuggestions([]);
        setErrors({ ...errors, street: 'שגיאה בחיפוש רחובות' });
      } finally {
        setLoading({ ...loading, streets: false });
      }
    } else {
      setStreetSuggestions([]);
      setShowStreetSuggestions(false);
    }
  };

  const handleSelectStreet = (street) => {
    console.log('[BusinessAddressForm] Street selected:', street);

    setSelectedStreet(street);
    setStreetQuery(street.hebrewName);
    setShowStreetSuggestions(false);
    setStreetSuggestions([]);
    setErrors({ ...errors, street: null });
    setAddressChanged(true); // Mark address as changed
  };

  const handleHouseNumberChange = (e) => {
    const value = e.target.value;
    setHouseNumber(value);
    setErrors({ ...errors, houseNumber: null });
    setAddressChanged(true); // Mark address as changed
  };

  // Location refinement handlers
  const handleStartRefinement = () => {
    setIsRefining(true);
  };

  const handleLocationChange = (latitude, longitude) => {
    setRefinedLocation({ latitude, longitude });
    console.log('[BusinessAddressForm] Location refined:', latitude, longitude);
  };

  const handleCancelRefinement = () => {
    setIsRefining(false);
    setRefinedLocation(null);
  };

  const handleConfirmLocation = () => {
    setIsRefining(false);

    // Immediately and synchronously update parent with confirmed verified location
    if (refinedLocation && selectedCity && selectedStreet && houseNumber) {
      setIsManuallyVerified(true);

      const confirmedAddressData = {
        cityCode: selectedCity.cityCode,
        cityNameHebrew: selectedCity.hebrewName,
        streetCode: selectedStreet.streetCode,
        streetNameHebrew: selectedStreet.hebrewName,
        houseNumber: houseNumber,
        formattedAddress: `${selectedStreet.hebrewName} ${houseNumber}, ${selectedCity.hebrewName}`,
        latitude: refinedLocation.latitude,
        longitude: refinedLocation.longitude,
        hasExactCoordinates: false,
        isEstimatedLocation: true,
        locationVerifiedByBusiness: true,
        isComplete: true
      };

      console.log('[BusinessAddressForm] ✅ Confirming location - calling onChange with:', confirmedAddressData);
      onChange(confirmedAddressData);
    }
  };

  return (
    <div className="business-address-form">
      <h3 className="form-section-title">כתובת העסק</h3>

      {/* City Selection */}
      <div className="form-group">
        <label className="form-label">
          עיר {required && '*'}
        </label>
        <div className="address-input-wrapper">
          <input
            type="text"
            className={`address-input ${selectedCity ? 'address-input-selected' : ''} ${errors.city ? 'address-input-error' : ''}`}
            placeholder="הקלד שם עיר..."
            value={cityQuery}
            onChange={handleCityInputChange}
            onFocus={() => {
              if (citySuggestions.length > 0) {
                setShowCitySuggestions(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowCitySuggestions(false), 200);
            }}
            required={required}
          />
          {loading.cities && <span className="address-input-loading">⏳</span>}
          {selectedCity && <span className="address-input-badge">✓</span>}

          {showCitySuggestions && citySuggestions.length > 0 && (
            <div className="address-suggestions-dropdown">
              {citySuggestions.map((city, index) => (
                <button
                  key={index}
                  type="button"
                  className="address-suggestion-item"
                  onMouseDown={() => handleSelectCity(city)}
                >
                  📍 {city.hebrewName}
                </button>
              ))}
            </div>
          )}
        </div>
        {errors.city && <div className="form-error">{errors.city}</div>}
        {selectedCity && (
          <div className="form-hint">
            נבחר: {selectedCity.hebrewName} (קוד: {selectedCity.cityCode})
          </div>
        )}
      </div>

      {/* Street Selection - Only show after city selected */}
      {selectedCity && (
        <div className="form-group">
          <label className="form-label">
            רחוב {required && '*'}
          </label>
          <div className="address-input-wrapper">
            <input
              type="text"
              className={`address-input ${selectedStreet ? 'address-input-selected' : ''} ${errors.street ? 'address-input-error' : ''}`}
              placeholder="הקלד שם רחוב..."
              value={streetQuery}
              onChange={handleStreetInputChange}
              onFocus={() => {
                if (streetSuggestions.length > 0) {
                  setShowStreetSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowStreetSuggestions(false), 200);
              }}
              required={required}
            />
            {loading.streets && <span className="address-input-loading">⏳</span>}
            {selectedStreet && <span className="address-input-badge">✓</span>}

            {showStreetSuggestions && streetSuggestions.length > 0 && (
              <div className="address-suggestions-dropdown">
                {streetSuggestions.map((street, index) => (
                  <button
                    key={index}
                    type="button"
                    className="address-suggestion-item"
                    onMouseDown={() => handleSelectStreet(street)}
                  >
                    🏠 {street.hebrewName}
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.street && <div className="form-error">{errors.street}</div>}
          {selectedStreet && (
            <div className="form-hint">
              נבחר: {selectedStreet.hebrewName} (קוד: {selectedStreet.streetCode})
            </div>
          )}
        </div>
      )}

      {/* House Number - Only show after street selected */}
      {selectedStreet && (
        <div className="form-group">
          <label className="form-label">
            מספר בית {required && '*'}
          </label>
          <input
            type="text"
            className={`address-input ${errors.houseNumber ? 'address-input-error' : ''}`}
            placeholder="מספר בית"
            value={houseNumber}
            onChange={handleHouseNumberChange}
            required={required}
          />
          {errors.houseNumber && <div className="form-error">{errors.houseNumber}</div>}
        </div>
      )}

      {/* Address Preview */}
      {selectedCity && selectedStreet && houseNumber && (
        <div className="address-preview">
          <div className="address-preview-header">
            <span className="address-preview-icon">✓</span>
            <span className="address-preview-title">כתובת מלאה</span>
          </div>
          <div className="address-preview-text">
            {selectedStreet.hebrewName} {houseNumber}, {selectedCity.hebrewName}
          </div>
          <div className="address-preview-codes">
            קוד עיר: {selectedCity.cityCode} | קוד רחוב: {selectedStreet.streetCode}
          </div>
        </div>
      )}

      {/* Location Refinement Section */}
      {showRefinementMap && geocodedLocation && (
        <div className="location-refinement-section" style={{ marginTop: '30px' }}>
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>✅</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: '#166534', fontSize: '14px' }}>
                {isManuallyVerified ? 'המיקום שופר ידנית על ידי העסק' : 'מצאנו את מיקום העסק באופן אוטומטי'}
              </div>
              <div style={{ fontSize: '12px', color: '#15803D', marginTop: '4px' }}>
                הסיכה מוצבת ב{geocodedLocation.formattedAddress}
              </div>
            </div>
          </div>

          {/* Map Display */}
          <DraggableMapRefinement
            initialLocation={geocodedLocation}
            onLocationChange={handleLocationChange}
            isDraggable={isRefining}
            height="400px"
          />

          {/* Refinement Controls */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {!isRefining ? (
              <button
                type="button"
                onClick={handleStartRefinement}
                style={{
                  padding: '10px 24px',
                  background: 'white',
                  border: '2px solid #EF4444',
                  color: '#EF4444',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>📍</span>
                שפר את מיקום העסק
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  style={{
                    padding: '10px 24px',
                    background: '#10B981',
                    border: 'none',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>✓</span>
                  אישור מיקום
                </button>
                <button
                  type="button"
                  onClick={handleCancelRefinement}
                  style={{
                    padding: '10px 24px',
                    background: '#6B7280',
                    border: 'none',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>✕</span>
                  ביטול
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
