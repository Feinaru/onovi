import { useState } from 'react';
import CityOnlySelector from './CityOnlySelector';
import { searchStreets } from '../services/unifiedAddressService';

/**
 * AddressSearchFilter - Progressive Disclosure for APPOINTMENT SEARCH
 * Uses unified address service (government database - 63,354 streets)
 *
 * Default: City only (enough for most searches)
 * Advanced: City + Street (optional, for precise location)
 *
 * NO HOUSE NUMBER for appointment search
 * House number only needed for:
 * - Business address
 * - Physical service location
 * - Navigation
 * - Exact map positioning
 *
 * Smart UX:
 * - Start with city-only search
 * - Show "חפש קרוב לרחוב מסוים" button
 * - Only then show street field
 */
export default function AddressSearchFilter({ value, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCity, setSelectedCity] = useState(value?.city || null);
  const [streetQuery, setStreetQuery] = useState(value?.street || '');
  const [selectedStreet, setSelectedStreet] = useState(value?.street || null);

  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle city selection - receives {cityCode, hebrewName}
  const handleCityChange = (city) => {
    console.log('[AddressSearchFilter] City selected:', city);

    setSelectedCity(city);
    setSelectedStreet(null);
    setStreetQuery('');

    // Pass city data with code
    onChange({
      city: city,
      street: null,
      isValid: !!city,
      searchType: 'CITY_ONLY'
    });
  };

  // Handle street input - uses cityCode
  const handleStreetInputChange = async (e) => {
    const query = e.target.value;
    setStreetQuery(query);

    console.log('[AddressSearchFilter] Street input:', query);

    if (selectedStreet && query !== selectedStreet.hebrewName) {
      setSelectedStreet(null);
    }

    // Trigger after 1 character - MUST have cityCode
    if (query.length >= 1 && selectedCity && selectedCity.cityCode) {
      setLoading(true);
      try {
        const results = await searchStreets(selectedCity.cityCode, query);
        console.log('[AddressSearchFilter] Street results:', results.length);
        setStreetSuggestions(results);
        setShowStreetSuggestions(true);
      } catch (error) {
        console.error('[AddressSearchFilter] Street search error:', error);
        setStreetSuggestions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setStreetSuggestions([]);
      setShowStreetSuggestions(false);
    }

    // Update parent
    updateParent(selectedCity, selectedStreet);
  };

  const handleSelectStreet = (street) => {
    console.log('[AddressSearchFilter] Street selected:', street);

    setSelectedStreet(street);
    setStreetQuery(street.hebrewName);
    setShowStreetSuggestions(false);
    setStreetSuggestions([]);

    updateParent(selectedCity, street);
  };

  const updateParent = (city, street) => {
    onChange({
      city: city,
      street: street,
      isValid: !!city,
      searchType: street ? 'CITY_STREET' : 'CITY_ONLY'
    });
  };

  const handleToggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
    if (!showAdvanced) {
      // Clear advanced fields when hiding
      setSelectedStreet(null);
      setStreetQuery('');
      updateParent(selectedCity, null);
    }
  };

  return (
    <div className="address-search-filter-progressive">
      {/* Always show: City selection */}
      <div className="form-group-inline">
        <label className="form-label-inline">עיר</label>
        <CityOnlySelector
          value={selectedCity}
          onChange={handleCityChange}
          placeholder="בחר עיר..."
        />
      </div>

      {/* Advanced toggle button */}
      {!showAdvanced && (
        <button
          type="button"
          className="btn-advanced-toggle"
          onClick={handleToggleAdvanced}
          disabled={!selectedCity}
        >
          📍 חפש קרוב לרחוב מסוים
        </button>
      )}

      {/* Advanced field: Street only (NO house number for appointment search) */}
      {showAdvanced && selectedCity && (
        <>
          <div className="form-group-inline">
            <label className="form-label-inline">רחוב</label>
            <div className="address-field-wrapper-compact">
              <input
                type="text"
                className={`search-input ${selectedStreet ? 'field-selected-compact' : ''}`}
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
              />
              {selectedStreet && (
                <span className="field-badge-compact">✓</span>
              )}

              {loading && (
                <div className="field-loading-badge">⏳</div>
              )}

              {showStreetSuggestions && streetSuggestions.length > 0 && (
                <div className="address-dropdown-compact">
                  {streetSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="address-dropdown-item-compact"
                      onMouseDown={() => handleSelectStreet(suggestion)}
                    >
                      🏠 {suggestion.hebrewName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn-hide-advanced"
            onClick={handleToggleAdvanced}
            title="חזור לחיפוש לפי עיר"
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}
