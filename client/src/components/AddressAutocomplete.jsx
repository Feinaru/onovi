import { useState, useEffect } from 'react';
import { searchAddresses } from '../services/unifiedAddressService';

export default function AddressAutocomplete({ value, onChange, required = false, label = 'כתובת מלאה' }) {
  const [query, setQuery] = useState(value?.formattedAddress || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value?.formattedAddress) {
      setQuery(value.formattedAddress);
    }
  }, [value]);

  const handleInputChange = async (e) => {
    const inputValue = e.target.value;
    setQuery(inputValue);

    console.log('[AddressAutocomplete] Input changed:', inputValue);

    if (inputValue.length >= 1) {
      setLoading(true);
      try {
        const results = await searchAddresses(inputValue);
        console.log('[AddressAutocomplete] Got results:', results.length);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('[AddressAutocomplete] Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    console.log('[AddressAutocomplete] Suggestion selected:', suggestion);

    const addressData = {
      city: suggestion.city,
      street: suggestion.street || null,
      houseNumber: null,
      formattedAddress: suggestion.formattedAddress,
      latitude: null,
      longitude: null
    };

    setQuery(suggestion.displayText);
    setShowSuggestions(false);
    onChange(addressData);
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
      setFocused(false);
    }, 200);
  };

  const handleFocus = () => {
    setFocused(true);
    if (query.length >= 1) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="address-autocomplete-container">
      <div className="form-group">
        <label className="form-label">
          {label} {required && '*'}
        </label>

        <div className="address-input-wrapper">
          <input
            type="text"
            className={`address-input ${focused ? 'address-input-focused' : ''}`}
            placeholder="לדוגמה: רחוב הרצל 123, תל אביב"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions.length > 0) {
                e.preventDefault();
                handleSelectSuggestion(suggestions[0]);
              }
            }}
            required={required}
          />

          <div className="address-input-icon">📍</div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="address-suggestions-dropdown">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="address-suggestion-item"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur
                    handleSelectSuggestion(suggestion);
                  }}
                >
                  <span className="address-suggestion-icon">
                    {suggestion.type === 'city' ? '🏙️' : '🏠'}
                  </span>
                  <div className="address-suggestion-content">
                    <div className="address-suggestion-main">{suggestion.displayText}</div>
                    <div className="address-suggestion-type">
                      {suggestion.type === 'city' ? 'עיר' : 'רחוב'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="address-hint">⏳ טוען...</div>
        )}

        {!loading && (
          <div className="address-hint">
            הקלד עיר או רחוב. לדוגמה: "תל אביב" או "הרצל, תל אביב"
          </div>
        )}
      </div>

      {/* Address Preview */}
      {value?.city && (
        <div className="address-preview-card">
          <div className="address-preview-header">
            <span className="address-preview-icon">✓</span>
            <span className="address-preview-title">כתובת נבחרה</span>
          </div>

          <div className="address-preview-details">
            <div className="address-preview-row">
              <span className="address-preview-label">עיר:</span>
              <span className="address-preview-value">{value.city}</span>
            </div>

            {value.street && (
              <div className="address-preview-row">
                <span className="address-preview-label">רחוב:</span>
                <span className="address-preview-value">{value.street}</span>
              </div>
            )}

            {value.houseNumber && (
              <div className="address-preview-row">
                <span className="address-preview-label">מספר:</span>
                <span className="address-preview-value">{value.houseNumber}</span>
              </div>
            )}

            {(value.latitude && value.longitude) && (
              <div className="address-preview-row">
                <span className="address-preview-label">קואורדינטות:</span>
                <span className="address-preview-value" style={{ fontSize: 'var(--text-xs)' }}>
                  {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Map Placeholder */}
          {(value.latitude && value.longitude) && (
            <div className="address-map-placeholder">
              <div className="map-placeholder-icon">🗺️</div>
              <div className="map-placeholder-text">מפה תוצג כאן בגרסה הבאה</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
