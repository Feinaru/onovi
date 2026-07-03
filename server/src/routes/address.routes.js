/**
 * Address Routes - Code-Based Architecture
 * Uses city codes, not city names for street lookup
 */

const router = require('express').Router();
const fs = require('fs');
const path = require('path');

// Load normalized data
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const citiesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cities-normalized.json'), 'utf8'));
const streetsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'streets-normalized.json'), 'utf8'));

console.log('[AddressRoutes] Loaded normalized data:');
console.log(`  Cities: ${citiesData.length}`);
console.log(`  Cities with streets: ${Object.keys(streetsData).length}`);

/**
 * City autocomplete - Hebrew only, with alias support
 * GET /api/addresses/cities/autocomplete?q=<query>
 */
router.get('/cities/autocomplete', (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();

  console.log(`[AddressRoutes] City autocomplete: "${query}"`);

  if (!query || query.length === 0) {
    return res.json([]);
  }

  const results = citiesData
    .filter(city => {
      const hebrewName = city.hebrewName.toLowerCase();

      // Match Hebrew name
      if (hebrewName.includes(query)) {
        return true;
      }

      // Match any alias
      if (city.aliases && city.aliases.length > 0) {
        return city.aliases.some(alias => alias.toLowerCase().includes(query));
      }

      return false;
    })
    .map(city => ({
      cityCode: city.cityCode,
      hebrewName: city.hebrewName,
      latitude: city.latitude || null,
      longitude: city.longitude || null,
      // NEVER return English name or aliases in response
      // They are only for internal matching
    }))
    .slice(0, 50);

  console.log(`[AddressRoutes] Found ${results.length} cities`);

  res.json(results);
});

/**
 * Street autocomplete - BY CITY CODE ONLY
 * GET /api/addresses/streets/autocomplete?cityCode=<code>&q=<query>
 */
router.get('/streets/autocomplete', (req, res) => {
  const cityCode = req.query.cityCode;
  const query = (req.query.q || '').trim().toLowerCase();

  console.log(`[AddressRoutes] Street autocomplete: cityCode=${cityCode}, query="${query}"`);

  if (!cityCode) {
    console.log('[AddressRoutes] ERROR: cityCode is required');
    return res.status(400).json({ error: 'cityCode is required' });
  }

  if (!query || query.length === 0) {
    return res.json([]);
  }

  // Lookup streets by city code
  const cityStreets = streetsData[cityCode];

  if (!cityStreets) {
    console.log(`[AddressRoutes] No streets found for cityCode ${cityCode}`);
    return res.json([]);
  }

  console.log(`[AddressRoutes] City ${cityCode} (${cityStreets.cityName}) has ${cityStreets.streets.length} streets`);

  // Filter streets: prefix matches first, then contains matches
  const prefixMatches = [];
  const containsMatches = [];

  for (const street of cityStreets.streets) {
    const streetName = street.hebrewName.toLowerCase();

    if (streetName.startsWith(query)) {
      prefixMatches.push({
        streetCode: street.streetCode,
        hebrewName: street.hebrewName,
        cityCode: cityStreets.cityCode,
        cityName: cityStreets.cityName
      });
    } else if (streetName.includes(query)) {
      containsMatches.push({
        streetCode: street.streetCode,
        hebrewName: street.hebrewName,
        cityCode: cityStreets.cityCode,
        cityName: cityStreets.cityName
      });
    }
  }

  // Prefix matches first, then contains matches
  const results = [...prefixMatches, ...containsMatches].slice(0, 50);

  console.log(`[AddressRoutes] Found ${results.length} streets (${prefixMatches.length} prefix, ${containsMatches.length} contains)`);

  res.json(results);
});

/**
 * Get database stats
 * GET /api/addresses/stats
 */
router.get('/stats', (req, res) => {
  const totalStreets = Object.values(streetsData).reduce(
    (sum, city) => sum + city.streets.length,
    0
  );

  res.json({
    totalCities: citiesData.length,
    citiesWithStreets: Object.keys(streetsData).length,
    totalStreets: totalStreets
  });
});

/**
 * Validate city code
 * GET /api/addresses/cities/:cityCode/validate
 */
router.get('/cities/:cityCode/validate', (req, res) => {
  const cityCode = parseInt(req.params.cityCode);
  const city = citiesData.find(c => c.cityCode === cityCode);

  if (city) {
    res.json({
      valid: true,
      cityCode: city.cityCode,
      hebrewName: city.hebrewName
    });
  } else {
    res.json({
      valid: false
    });
  }
});

/**
 * Validate street code in city
 * GET /api/addresses/cities/:cityCode/streets/:streetCode/validate
 */
router.get('/cities/:cityCode/streets/:streetCode/validate', (req, res) => {
  const cityCode = req.params.cityCode;
  const streetCode = parseInt(req.params.streetCode);

  const cityStreets = streetsData[cityCode];

  if (!cityStreets) {
    return res.json({ valid: false });
  }

  const street = cityStreets.streets.find(s => s.streetCode === streetCode);

  if (street) {
    res.json({
      valid: true,
      cityCode: cityStreets.cityCode,
      cityName: cityStreets.cityName,
      streetCode: street.streetCode,
      hebrewName: street.hebrewName
    });
  } else {
    res.json({
      valid: false
    });
  }
});

/**
 * Reverse geocode coordinates to Israeli address
 * GET /api/addresses/reverse-geocode?lat=<latitude>&lon=<longitude>
 */
router.get('/reverse-geocode', async (req, res) => {
  const { lat, lon } = req.query;

  console.log(`[AddressRoutes] Reverse geocode: lat=${lat}, lon=${lon}`);

  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon parameters required' });
  }

  try {
    // Use Nominatim OSM API for reverse geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=he&addressdetails=1`;

    console.log('[AddressRoutes] Calling Nominatim:', nominatimUrl);

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Lomea-Israel-Address-App/1.0'
      }
    });

    if (!response.ok) {
      console.error('[AddressRoutes] Nominatim error:', response.status);
      return res.status(500).json({ error: 'Reverse geocoding failed' });
    }

    const data = await response.json();
    console.log('[AddressRoutes] Nominatim response:', JSON.stringify(data, null, 2));

    // Extract address components
    const address = data.address || {};
    const cityName = address.city || address.town || address.village || null;
    const street = address.road || null;
    const houseNumber = address.house_number || null;

    console.log('[AddressRoutes] Extracted:', { cityName, street, houseNumber });

    if (!cityName) {
      console.log('[AddressRoutes] No city detected from coordinates');
      return res.json({
        success: false,
        error: 'No city detected'
      });
    }

    // Try to match city with our database
    const normalizedCityQuery = cityName.toLowerCase().trim();
    let matchedCity = citiesData.find(city => {
      const hebrewName = city.hebrewName.toLowerCase();
      if (hebrewName === normalizedCityQuery) return true;
      if (city.aliases && city.aliases.some(alias => alias.toLowerCase() === normalizedCityQuery)) return true;
      return false;
    });

    // If exact match not found, try partial match
    if (!matchedCity) {
      matchedCity = citiesData.find(city => {
        const hebrewName = city.hebrewName.toLowerCase();
        if (hebrewName.includes(normalizedCityQuery) || normalizedCityQuery.includes(hebrewName)) return true;
        if (city.aliases && city.aliases.some(alias => {
          const aliasLower = alias.toLowerCase();
          return aliasLower.includes(normalizedCityQuery) || normalizedCityQuery.includes(aliasLower);
        })) return true;
        return false;
      });
    }

    if (!matchedCity) {
      console.log('[AddressRoutes] City not found in database:', cityName);
      return res.json({
        success: false,
        cityName: cityName,
        street: street,
        houseNumber: houseNumber,
        error: 'City not in database'
      });
    }

    console.log('[AddressRoutes] Matched city:', matchedCity.hebrewName, 'Code:', matchedCity.cityCode);

    // Try to match street if available
    let matchedStreet = null;
    if (street && matchedCity) {
      const cityStreets = streetsData[matchedCity.cityCode.toString()];
      if (cityStreets) {
        const normalizedStreetQuery = street.toLowerCase().trim();
        matchedStreet = cityStreets.streets.find(s =>
          s.hebrewName.toLowerCase() === normalizedStreetQuery
        );

        if (!matchedStreet) {
          matchedStreet = cityStreets.streets.find(s => {
            const streetName = s.hebrewName.toLowerCase();
            return streetName.includes(normalizedStreetQuery) || normalizedStreetQuery.includes(streetName);
          });
        }

        if (matchedStreet) {
          console.log('[AddressRoutes] Matched street:', matchedStreet.hebrewName, 'Code:', matchedStreet.streetCode);
        }
      }
    }

    // Build formatted address
    let formattedAddress = matchedCity.hebrewName;
    if (matchedStreet) {
      formattedAddress = `${matchedStreet.hebrewName}, ${matchedCity.hebrewName}`;
      if (houseNumber) {
        formattedAddress = `${matchedStreet.hebrewName} ${houseNumber}, ${matchedCity.hebrewName}`;
      }
    }

    const result = {
      success: true,
      cityCode: matchedCity.cityCode,
      cityNameHebrew: matchedCity.hebrewName,
      streetCode: matchedStreet?.streetCode || null,
      streetNameHebrew: matchedStreet?.hebrewName || null,
      houseNumber: houseNumber,
      formattedAddress: formattedAddress,
      // Include city center coordinates as fallback
      cityLatitude: matchedCity.latitude || null,
      cityLongitude: matchedCity.longitude || null,
      source: 'nominatim'
    };

    console.log('[AddressRoutes] Reverse geocode result:', result);

    res.json(result);

  } catch (error) {
    console.error('[AddressRoutes] Reverse geocode error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Forward geocode Israeli address to coordinates
 * GET /api/addresses/forward-geocode?street=<street>&houseNumber=<num>&city=<city>
 */
router.get('/forward-geocode', async (req, res) => {
  const { street, houseNumber, city } = req.query;

  console.log('='.repeat(80));
  console.log('[AddressRoutes] 🔍 FORWARD GEOCODE REQUEST');
  console.log('[AddressRoutes] Requested address:', {
    street,
    houseNumber,
    city,
    fullAddress: `${street} ${houseNumber || ''}, ${city}`.trim()
  });

  if (!street || !city) {
    return res.status(400).json({
      success: false,
      error: 'street and city parameters required'
    });
  }

  try {
    // Build full address for Nominatim
    const fullAddress = houseNumber
      ? `${street} ${houseNumber}, ${city}, Israel`
      : `${street}, ${city}, Israel`;

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&accept-language=he&addressdetails=1&limit=1`;

    console.log('[AddressRoutes] 📍 Nominatim URL:', nominatimUrl);
    console.log('[AddressRoutes] 📍 Encoded query:', encodeURIComponent(fullAddress));

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Lomea-Israel-Address-App/1.0'
      }
    });

    console.log('[AddressRoutes] 📡 Nominatim HTTP status:', response.status);

    if (!response.ok) {
      console.error('[AddressRoutes] ❌ Nominatim HTTP error:', response.status, response.statusText);
      return res.status(500).json({
        success: false,
        error: 'Forward geocoding failed'
      });
    }

    const data = await response.json();
    console.log('[AddressRoutes] 📦 Raw Nominatim response:');
    console.log(JSON.stringify(data, null, 2));

    if (!data || data.length === 0) {
      console.log('[AddressRoutes] ❌ REJECTION REASON: No results found for address');
      console.log('[AddressRoutes] 🔄 FALLBACK: Will use city center coordinates');
      console.log('='.repeat(80));
      return res.json({
        success: false,
        error: 'Address not found',
        hasExactCoordinates: false
      });
    }

    const result = data[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    // Check if result is precise (has house number)
    const hasHouseNumber = result.address?.house_number !== undefined;
    const isExact = hasHouseNumber && houseNumber;

    console.log('[AddressRoutes] 🔍 Result analysis:', {
      returnedHouseNumber: result.address?.house_number,
      requestedHouseNumber: houseNumber,
      hasHouseNumber,
      isExact,
      displayName: result.display_name
    });

    const geocodeResult = {
      success: true,
      latitude: latitude,
      longitude: longitude,
      hasExactCoordinates: isExact,
      isEstimatedLocation: !isExact,
      displayName: result.display_name,
      source: 'nominatim'
    };

    if (!isExact) {
      console.log('[AddressRoutes] ⚠️ WARNING: Coordinates are NOT exact (missing house number)');
      console.log('[AddressRoutes] 🔄 FALLBACK: Will use city center coordinates');
    } else {
      console.log('[AddressRoutes] ✅ SUCCESS: Exact coordinates obtained!');
    }

    console.log('[AddressRoutes] 📤 Final geocode result:', geocodeResult);
    console.log('='.repeat(80));

    res.json(geocodeResult);

  } catch (error) {
    console.error('[AddressRoutes] ❌ EXCEPTION during forward geocode:', error.message);
    console.error('[AddressRoutes] Stack:', error.stack);
    console.log('='.repeat(80));
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      hasExactCoordinates: false
    });
  }
});

module.exports = router;
