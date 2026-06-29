/**
 * ONE-TIME MIGRATION SCRIPT
 *
 * Fixes legacy businesses that were created before mandatory geocoding.
 *
 * For businesses without valid coordinates:
 * - Sets address to: חיים ויצמן 26, מודיעין-מכבים-רעות
 * - Geocodes the address and saves coordinates
 *
 * This is NOT a fallback - it's a one-time data cleanup for old records only.
 * New businesses MUST have successful geocoding or they cannot be saved.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// Load city/street data
const DATA_DIR = path.join(__dirname, '..', 'data');
const citiesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cities-normalized.json'), 'utf8'));
const streetsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'streets-normalized.json'), 'utf8'));

// Default address for legacy businesses
const DEFAULT_ADDRESS = {
  cityName: 'מודיעין-מכבים-רעות',
  streetName: 'חיים ויצמן',
  houseNumber: '26'
};

/**
 * Find city by Hebrew name
 */
function findCity(hebrewName) {
  return citiesData.find(c => c.hebrewName === hebrewName);
}

/**
 * Find street by Hebrew name in city
 */
function findStreet(cityCode, hebrewName) {
  const cityStreets = streetsData[cityCode.toString()];
  if (!cityStreets || !cityStreets.streets) return null;
  return cityStreets.streets.find(s => s.hebrewName === hebrewName);
}

/**
 * Forward geocode address using Nominatim
 */
async function forwardGeocode(street, houseNumber, city) {
  const fullAddress = `${street} ${houseNumber}, ${city}, Israel`;
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&accept-language=he&addressdetails=1&limit=1`;

  console.log(`  🔍 Geocoding: ${fullAddress}`);

  try {
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'PickMe-Israel-Address-Migration/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('No results from Nominatim');
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      hasHouseNumber: !!result.address?.house_number
    };
  } catch (error) {
    throw new Error(`Geocoding failed: ${error.message}`);
  }
}

/**
 * Main migration function
 */
async function migrateLegacyBusinesses() {
  console.log('🚀 Starting legacy business address migration...\n');

  try {
    // Find city and street codes
    const city = findCity(DEFAULT_ADDRESS.cityName);
    if (!city) {
      throw new Error(`City not found: ${DEFAULT_ADDRESS.cityName}`);
    }

    const street = findStreet(city.cityCode, DEFAULT_ADDRESS.streetName);
    if (!street) {
      throw new Error(`Street not found: ${DEFAULT_ADDRESS.streetName} in city ${DEFAULT_ADDRESS.cityName}`);
    }

    console.log(`✅ Default address codes found:`);
    console.log(`   City: ${city.hebrewName} (${city.cityCode})`);
    console.log(`   Street: ${street.hebrewName} (${street.streetCode})`);
    console.log(`   House: ${DEFAULT_ADDRESS.houseNumber}\n`);

    // Geocode default address
    console.log(`🌍 Geocoding default address...`);
    const coords = await forwardGeocode(
      street.hebrewName,
      DEFAULT_ADDRESS.houseNumber,
      city.hebrewName
    );

    console.log(`✅ Geocoding successful:`);
    console.log(`   Latitude: ${coords.latitude}`);
    console.log(`   Longitude: ${coords.longitude}`);
    console.log(`   Has house number: ${coords.hasHouseNumber}\n`);

    // Find legacy businesses (missing address or coordinates)
    const legacyBusinesses = await prisma.business.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null },
          { cityCode: null },
          { streetCode: null },
          { houseNumber: null }
        ]
      }
    });

    console.log(`📋 Found ${legacyBusinesses.length} legacy businesses without valid addresses\n`);

    if (legacyBusinesses.length === 0) {
      console.log('✅ No legacy businesses to migrate. All done!');
      return;
    }

    // Update each legacy business
    let updated = 0;
    let errors = 0;

    for (const business of legacyBusinesses) {
      try {
        console.log(`📝 Updating Business #${business.id}: ${business.name}`);
        console.log(`   Current address: ${business.formattedAddress || 'none'}`);
        console.log(`   Current coords: ${business.latitude || 'none'}, ${business.longitude || 'none'}`);

        await prisma.business.update({
          where: { id: business.id },
          data: {
            cityCode: city.cityCode,
            cityNameHebrew: city.hebrewName,
            streetCode: street.streetCode,
            streetNameHebrew: street.hebrewName,
            houseNumber: DEFAULT_ADDRESS.houseNumber,
            formattedAddress: `${street.hebrewName} ${DEFAULT_ADDRESS.houseNumber}, ${city.hebrewName}`,
            latitude: coords.latitude,
            longitude: coords.longitude,
            hasExactCoordinates: coords.hasHouseNumber,
            isEstimatedLocation: !coords.hasHouseNumber,
            // Legacy fields
            city: city.hebrewName,
            street: street.hebrewName,
            address: `${street.hebrewName} ${DEFAULT_ADDRESS.houseNumber}, ${city.hebrewName}`
          }
        });

        console.log(`   ✅ Updated successfully\n`);
        updated++;
      } catch (error) {
        console.error(`   ❌ Error updating Business #${business.id}:`, error.message);
        errors++;
      }
    }

    console.log('=' .repeat(60));
    console.log(`✅ Migration complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total: ${legacyBusinesses.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateLegacyBusinesses()
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
