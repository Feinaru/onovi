/**
 * RE-GEOCODE EXISTING ADDRESSES
 *
 * For businesses that have address data but wrong/missing coordinates,
 * this script re-geocodes their EXISTING addresses and updates coordinates.
 *
 * Does NOT change addresses, only fixes coordinates.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
      success: true,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      hasHouseNumber: !!result.address?.house_number
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main function
 */
async function reGeocodeBusinesses() {
  console.log('🚀 Starting address re-geocoding...\n');

  try {
    // Find businesses with addresses but invalid coordinates
    const businesses = await prisma.business.findMany({
      where: {
        AND: [
          { streetNameHebrew: { not: null } },
          { cityNameHebrew: { not: null } },
          { houseNumber: { not: null } },
          {
            OR: [
              { latitude: null },
              { longitude: null },
              // City center coordinates for Modiin (old fallback)
              { AND: [{ latitude: 31.896900 }, { longitude: 34.998100 }] }
            ]
          }
        ]
      }
    });

    console.log(`📋 Found ${businesses.length} businesses to re-geocode\n`);

    if (businesses.length === 0) {
      console.log('✅ No businesses need re-geocoding. All done!');
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const business of businesses) {
      try {
        console.log(`📝 Business #${business.id}: ${business.name}`);
        console.log(`   Address: ${business.streetNameHebrew} ${business.houseNumber}, ${business.cityNameHebrew}`);
        console.log(`   Old coords: ${business.latitude}, ${business.longitude}`);

        const result = await forwardGeocode(
          business.streetNameHebrew,
          business.houseNumber,
          business.cityNameHebrew
        );

        if (result.success) {
          await prisma.business.update({
            where: { id: business.id },
            data: {
              latitude: result.latitude,
              longitude: result.longitude,
              hasExactCoordinates: result.hasHouseNumber,
              isEstimatedLocation: !result.hasHouseNumber
            }
          });

          console.log(`   ✅ New coords: ${result.latitude}, ${result.longitude}`);
          console.log(`   Type: ${result.hasHouseNumber ? 'house-level' : 'street-level'}\n`);
          updated++;
        } else {
          console.error(`   ❌ Geocoding failed: ${result.error}\n`);
          failed++;
        }

        // Rate limit: wait 1 second between requests
        await sleep(1000);
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        failed++;
      }
    }

    console.log('='.repeat(60));
    console.log(`✅ Re-geocoding complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${businesses.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Re-geocoding failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
reGeocodeBusinesses()
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
