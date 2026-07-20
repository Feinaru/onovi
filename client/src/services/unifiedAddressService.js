/**
 * Unified Address Service - Code-Based Architecture
 * Single Source of Truth for All Address Operations
 *
 * CRITICAL RULES:
 * - City selection based on cityCode, NOT city name
 * - Street lookup by cityCode, NOT city name
 * - Display Hebrew names ONLY (no English)
 * - No fuzzy matching, no contains, prefix-first only
 * - Must select from list, no manual typing
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Search for cities by query
 * Supports Hebrew names and aliases (e.g., "מודיעין", "מכבים")
 * Returns cityCode + hebrewName only
 *
 * @param {string} query - Search query (minimum 1 character)
 * @returns {Promise<Array>} Array of cities: [{cityCode, hebrewName}]
 */
export async function searchCities(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const url = `${API_BASE_URL}/api/addresses/cities/autocomplete?q=${encodeURIComponent(query.trim())}`;
  console.log('[UnifiedAddressService] searchCities:', query);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`[UnifiedAddressService] Found ${data.length} cities`);

    return data.map(city => ({
      cityCode: city.cityCode,
      hebrewName: city.hebrewName,
      latitude: city.latitude,
      longitude: city.longitude,
      // Display text = Hebrew name only
      displayText: city.hebrewName
    }));
  } catch (error) {
    console.error('[UnifiedAddressService] searchCities error:', error);
    throw error;
  }
}

/**
 * Search for streets IN A SPECIFIC CITY by cityCode
 * CRITICAL: Must pass cityCode, NOT city name
 *
 * @param {number} cityCode - City code (required)
 * @param {string} query - Street search query (minimum 1 character)
 * @returns {Promise<Array>} Array of streets: [{streetCode, hebrewName, cityCode, cityName}]
 */
export async function searchStreets(cityCode, query) {
  if (!cityCode) {
    console.error('[UnifiedAddressService] searchStreets: cityCode is required');
    return [];
  }

  if (!query || query.trim().length === 0) {
    return [];
  }

  const url = `${API_BASE_URL}/api/addresses/streets/autocomplete?cityCode=${cityCode}&q=${encodeURIComponent(query.trim())}`;
  console.log('[UnifiedAddressService] searchStreets:', cityCode, query);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`[UnifiedAddressService] Found ${data.length} streets in city ${cityCode}`);

    return data.map(street => ({
      streetCode: street.streetCode,
      hebrewName: street.hebrewName,
      cityCode: street.cityCode,
      cityName: street.cityName,
      // Display text = Hebrew name only
      displayText: street.hebrewName
    }));
  } catch (error) {
    console.error('[UnifiedAddressService] searchStreets error:', error);
    throw error;
  }
}

/**
 * Get current GPS position
 * Returns ONLY coordinates - NEVER generates fake addresses
 *
 * @returns {Promise<Object>} Object with latitude, longitude, accuracy
 */
export async function getCurrentPosition() {
  console.log('[UnifiedAddressService] getCurrentPosition called');

  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      const error = new Error('GPS not available on this device');
      console.error('[UnifiedAddressService] GPS not available');
      reject(error);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        console.log('[UnifiedAddressService] GPS coordinates:', result);
        resolve(result);
      },
      (error) => {
        console.error('[UnifiedAddressService] GPS error:', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Get database statistics
 * @returns {Promise<Object>} Statistics about available cities and streets
 */
export async function getAddressStats() {
  console.log('[UnifiedAddressService] getAddressStats called');

  try {
    const response = await fetch(`${API_BASE_URL}/api/addresses/stats`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[UnifiedAddressService] getAddressStats error:', error);
    throw error;
  }
}

/**
 * Validate if a cityCode exists
 * @param {number} cityCode - City code to validate
 * @returns {Promise<boolean>} True if city exists
 */
export async function validateCity(cityCode) {
  if (!cityCode) {
    return false;
  }

  console.log('[UnifiedAddressService] validateCity:', cityCode);

  try {
    const response = await fetch(`${API_BASE_URL}/api/addresses/cities/${cityCode}/validate`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('[UnifiedAddressService] validateCity error:', error);
    return false;
  }
}

/**
 * Validate if a streetCode exists in a cityCode
 * @param {number} cityCode - City code
 * @param {number} streetCode - Street code to validate
 * @returns {Promise<boolean>} True if street exists in city
 */
export async function validateStreet(cityCode, streetCode) {
  if (!cityCode || !streetCode) {
    return false;
  }

  console.log('[UnifiedAddressService] validateStreet:', cityCode, streetCode);

  try {
    const response = await fetch(`${API_BASE_URL}/api/addresses/cities/${cityCode}/streets/${streetCode}/validate`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('[UnifiedAddressService] validateStreet error:', error);
    return false;
  }
}
