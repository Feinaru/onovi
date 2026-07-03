/**
 * Israeli Streets Service
 * Real street data for Israeli cities
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

// Cache for street data to avoid excessive API calls
const streetCache = new Map();
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes

/**
 * Normalize Hebrew text for prefix matching
 */
function normalizeHebrew(text) {
  if (!text) return '';
  return text
    .trim()
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .toLowerCase();
}

/**
 * Search for real streets in a specific Israeli city using OpenStreetMap
 * PREFIX-BASED: Shows results starting with query after just 1 character
 */
export async function searchStreetsInCity(city, query) {
  if (!city || !query || query.length < 1) {
    return [];
  }

  // Check cache first
  const cacheKey = `${city}:${query}`;
  const cached = streetCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }

  try {
    // Use OpenStreetMap Nominatim to search for streets in the city
    const searchTerm = `${query}, ${city}, Israel`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(searchTerm)}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=10&` +
      `countrycodes=il&` +
      `accept-language=he`,
      {
        headers: {
          'User-Agent': 'Lomea-App/1.0'
        }
      }
    );

    if (!response.ok) {
      console.error('Street search failed:', response.status);
      return [];
    }

    const data = await response.json();

    // Filter and format results with PREFIX MATCHING
    const normalizedQuery = normalizeHebrew(query);

    const streets = data
      .filter(item => {
        // Only include results that have a road/street component
        return item.address && item.address.road;
      })
      .map(item => {
        const address = item.address;
        const streetName = address.road;
        const cityName = address.city || address.town || address.village || city;
        const normalizedStreet = normalizeHebrew(streetName);

        return {
          street: streetName,
          city: cityName,
          displayText: streetName,
          fullAddress: `${streetName}, ${cityName}`,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: 'street',
          // For sorting: check if it's a prefix match
          isPrefixMatch: normalizedStreet.startsWith(normalizedQuery),
          normalizedName: normalizedStreet
        };
      })
      // Remove duplicates based on street name
      .filter((street, index, self) =>
        index === self.findIndex(s => s.street === street.street)
      )
      // Sort: PREFIX matches first, then CONTAINS matches
      .sort((a, b) => {
        if (a.isPrefixMatch && !b.isPrefixMatch) return -1;
        if (!a.isPrefixMatch && b.isPrefixMatch) return 1;
        return a.normalizedName.localeCompare(b.normalizedName, 'he');
      });

    // Cache the results
    streetCache.set(cacheKey, {
      data: streets,
      timestamp: Date.now()
    });

    return streets;
  } catch (error) {
    console.error('Error searching streets:', error);
    return [];
  }
}

/**
 * Get autocomplete suggestions for streets in a city
 * PREFIX-BASED: Opens after 1 character, shows prefix matches first
 */
export async function getStreetAutocomplete(city, query) {
  if (!city) {
    return [];
  }

  // Trigger after just 1 character
  if (!query || query.length < 1) {
    return [];
  }

  const streets = await searchStreetsInCity(city, query);
  return streets.slice(0, 10); // Show top 10 results (prefix matches will be first)
}

/**
 * Validate if a street exists in a city
 */
export async function validateStreetInCity(city, street) {
  if (!city || !street) return false;

  try {
    // Search for the exact street
    const results = await searchStreetsInCity(city, street);

    // Check if we found an exact match
    const exactMatch = results.find(r =>
      r.street.toLowerCase() === street.toLowerCase() ||
      r.street.toLowerCase().includes(street.toLowerCase())
    );

    return !!exactMatch;
  } catch (error) {
    console.error('Error validating street:', error);
    return false;
  }
}

/**
 * Get coordinates for a specific address
 */
export async function getAddressCoordinates(city, street, houseNumber) {
  try {
    const addressParts = [];
    if (houseNumber) addressParts.push(houseNumber);
    if (street) addressParts.push(street);
    if (city) addressParts.push(city);
    addressParts.push('Israel');

    const addressString = addressParts.join(', ');

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(addressString)}&` +
      `format=json&` +
      `limit=1&` +
      `countrycodes=il&` +
      `accept-language=he`,
      {
        headers: {
          'User-Agent': 'Lomea-App/1.0'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      formattedAddress: data[0].display_name
    };
  } catch (error) {
    console.error('Error getting address coordinates:', error);
    return null;
  }
}

/**
 * Clear the street cache (useful for testing or memory management)
 */
export function clearStreetCache() {
  streetCache.clear();
}
