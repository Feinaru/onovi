/**
 * Real Israeli Address API Service
 * Connects to backend API using official data.gov.il database
 * Source: 1,259 cities and 63,354 streets from Israeli government
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Fetch cities from the real Israeli address database
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of city objects
 */
export async function fetchCities(query) {
  if (!query || query.trim().length === 0) {
    console.log('[AddressAPI] fetchCities: Empty query, returning []');
    return [];
  }

  const url = `${API_BASE_URL}/api/addresses/cities/autocomplete?q=${encodeURIComponent(query.trim())}`;
  console.log('[AddressAPI] fetchCities: Request URL:', url);
  console.log('[AddressAPI] fetchCities: Query:', query);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error('[AddressAPI] fetchCities: HTTP error', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[AddressAPI] fetchCities: Response count:', data.length);
    console.log('[AddressAPI] fetchCities: First 3 results:', data.slice(0, 3));

    return data.map(city => ({
      code: city.code,
      name: city.name,
      nameEng: city.nameEng,
      displayText: city.name
    }));
  } catch (error) {
    console.error('[AddressAPI] fetchCities: Error:', error);
    throw error;
  }
}

/**
 * Fetch streets for a specific city from the real Israeli address database
 * @param {string} cityName - City name (Hebrew)
 * @param {string} query - Street search query
 * @returns {Promise<Array>} Array of street objects
 */
export async function fetchStreets(cityName, query) {
  if (!cityName || !query || query.trim().length === 0) {
    console.log('[AddressAPI] fetchStreets: Missing cityName or query', { cityName, query });
    return [];
  }

  const url = `${API_BASE_URL}/api/addresses/streets/autocomplete?city=${encodeURIComponent(cityName.trim())}&q=${encodeURIComponent(query.trim())}`;
  console.log('[AddressAPI] fetchStreets: Request URL:', url);
  console.log('[AddressAPI] fetchStreets: City:', cityName, 'Query:', query);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error('[AddressAPI] fetchStreets: HTTP error', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[AddressAPI] fetchStreets: Response count:', data.length);
    console.log('[AddressAPI] fetchStreets: First 5 results:', data.slice(0, 5));

    return data.map(street => ({
      code: street.code,
      name: street.name,
      displayText: street.name
    }));
  } catch (error) {
    console.error('[AddressAPI] fetchStreets: Error:', error);
    throw error;
  }
}

/**
 * Get database statistics
 * @returns {Promise<Object>} Database stats
 */
export async function fetchStats() {
  const url = `${API_BASE_URL}/api/addresses/stats`;
  console.log('[AddressAPI] fetchStats: Request URL:', url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[AddressAPI] fetchStats: Database stats:', data);

    return data;
  } catch (error) {
    console.error('[AddressAPI] fetchStats: Error:', error);
    throw error;
  }
}

/**
 * Reverse geocode GPS coordinates to Israeli address
 * @param {number} latitude - GPS latitude
 * @param {number} longitude - GPS longitude
 * @returns {Promise<Object>} Address data with cityCode, streetCode, etc.
 */
export async function reverseGeocode(latitude, longitude) {
  const url = `${API_BASE_URL}/api/addresses/reverse-geocode?lat=${latitude}&lon=${longitude}`;
  console.log('[AddressAPI] reverseGeocode: Request URL:', url);
  console.log('[AddressAPI] reverseGeocode: Coordinates:', { latitude, longitude });

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error('[AddressAPI] reverseGeocode: HTTP error', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[AddressAPI] reverseGeocode: Response:', data);

    return data;
  } catch (error) {
    console.error('[AddressAPI] reverseGeocode: Error:', error);
    throw error;
  }
}

/**
 * Forward geocode Israeli address to coordinates
 * @param {string} street - Street name in Hebrew
 * @param {string} houseNumber - House number
 * @param {string} city - City name in Hebrew
 * @returns {Promise<Object>} Geocoding result with latitude, longitude, hasExactCoordinates
 */
export async function forwardGeocode(street, houseNumber, city) {
  const params = new URLSearchParams({
    street: street,
    city: city
  });
  if (houseNumber) {
    params.append('houseNumber', houseNumber);
  }

  const url = `${API_BASE_URL}/api/addresses/forward-geocode?${params.toString()}`;
  console.log('[AddressAPI] forwardGeocode: Request URL:', url);
  console.log('[AddressAPI] forwardGeocode: Address:', { street, houseNumber, city });

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error('[AddressAPI] forwardGeocode: HTTP error', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[AddressAPI] forwardGeocode: Response:', data);

    return data;
  } catch (error) {
    console.error('[AddressAPI] forwardGeocode: Error:', error);
    throw error;
  }
}
