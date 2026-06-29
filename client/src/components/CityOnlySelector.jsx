import { useState } from 'react';
import { searchCities } from '../services/unifiedAddressService';

/**
 * CityOnlySelector - Code-Based City Selection
 * Stores cityCode, displays hebrewName only
 * NO English text in UI
 */
export default function CityOnlySelector({ value, onChange, placeholder = "בחר עיר..." }) {
  // value should be {cityCode, hebrewName}
  const [cityQuery, setCityQuery] = useState(value?.hebrewName || '');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState(value || null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = async (e) => {
    const query = e.target.value;
    setCityQuery(query);

    console.log('[CityOnlySelector] Input changed:', query);

    // Clear selection if user changes input
    if (selectedCity && query !== selectedCity.hebrewName) {
      setSelectedCity(null);
      onChange(null);
    }

    if (query.length >= 1) {
      setLoading(true);
      try {
        const results = await searchCities(query);
        console.log('[CityOnlySelector] Got results:', results.length);
        setCitySuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('[CityOnlySelector] Search error:', error);
        setCitySuggestions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCity = (city) => {
    console.log('[CityOnlySelector] City selected:', city);

    setSelectedCity(city);
    setCityQuery(city.hebrewName);
    setShowSuggestions(false);
    setCitySuggestions([]);

    // Return {cityCode, hebrewName}
    onChange({
      cityCode: city.cityCode,
      hebrewName: city.hebrewName
    });
  };

  const handleClear = () => {
    setSelectedCity(null);
    setCityQuery('');
    onChange(null);
  };

  return (
    <div className="city-only-selector">
      <div className="city-input-wrapper">
        <input
          type="text"
          className={`search-input ${selectedCity ? 'field-selected-compact' : ''}`}
          placeholder={placeholder}
          value={cityQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (citySuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />
        {selectedCity && (
          <span className="field-badge-compact">✓</span>
        )}
        {selectedCity && (
          <button
            type="button"
            className="clear-city-btn"
            onClick={handleClear}
            title="נקה"
          >
            ✕
          </button>
        )}

        {showSuggestions && citySuggestions.length > 0 && (
          <div className="address-dropdown-compact">
            {citySuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="address-dropdown-item-compact"
                onMouseDown={() => handleSelectCity(suggestion)}
              >
                📍 {suggestion.hebrewName}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="city-hint">⏳ טוען...</div>
        )}

        {!loading && cityQuery.length >= 1 && !selectedCity && citySuggestions.length === 0 && (
          <div className="city-hint">לא נמצאה עיר מתאימה</div>
        )}
      </div>
    </div>
  );
}
