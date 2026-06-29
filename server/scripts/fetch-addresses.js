/**
 * Script to fetch Israeli address data from data.gov.il
 * Source: Israel Government Open Data Portal (data.gov.il)
 *
 * This script downloads:
 * - Cities (settlements) - Resource ID: d4901968-dad3-4845-a9b0-a57d027f11ab
 * - Streets by city - Resource ID: 9ad3862c-8391-4b2f-84a4-2d4c68625f4b
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const BASE_URL = 'https://data.gov.il/api/3/action/datastore_search';
const CITIES_RESOURCE_ID = 'd4901968-dad3-4845-a9b0-a57d027f11ab';
const STREETS_RESOURCE_ID = '9ad3862c-8391-4b2f-84a4-2d4c68625f4b';
const BATCH_SIZE = 5000; // Max records per request
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function fetchData(resourceId, offset = 0, limit = BATCH_SIZE) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}?resource_id=${resourceId}&limit=${limit}&offset=${offset}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success) {
            resolve(json.result);
          } else {
            reject(new Error('API returned success: false'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function fetchAllCities() {
  console.log('Fetching cities data...');
  const cities = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    console.log(`  Fetching cities ${offset}/${total}...`);
    const result = await fetchData(CITIES_RESOURCE_ID, offset, BATCH_SIZE);

    total = result.total;
    cities.push(...result.records);
    offset += BATCH_SIZE;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Process cities data - extract unique cities with their codes
  const citiesMap = new Map();
  cities.forEach(record => {
    const code = record['סמל_ישוב'];
    const nameHeb = (record['שם_ישוב'] || '').trim();
    const nameEng = (record['שם_ישוב_לועזי'] || '').trim();

    if (code && nameHeb) {
      citiesMap.set(code, {
        code,
        nameHeb,
        nameEng
      });
    }
  });

  const citiesArray = Array.from(citiesMap.values());
  console.log(`\nTotal cities: ${citiesArray.length}`);

  fs.writeFileSync(
    path.join(DATA_DIR, 'cities.json'),
    JSON.stringify(citiesArray, null, 2)
  );

  return citiesArray;
}

async function fetchAllStreets() {
  console.log('\nFetching streets data...');
  const streets = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    console.log(`  Fetching streets ${offset}/${total}...`);
    const result = await fetchData(STREETS_RESOURCE_ID, offset, BATCH_SIZE);

    total = result.total;
    streets.push(...result.records);
    offset += BATCH_SIZE;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Process streets data - group by city
  const streetsByCity = {};
  streets.forEach(record => {
    const cityCode = record['סמל_ישוב'];
    const cityName = (record['שם_ישוב'] || '').trim();
    const streetCode = record['סמל_רחוב'];
    const streetName = (record['שם_רחוב'] || '').trim();

    if (cityCode && streetName) {
      if (!streetsByCity[cityCode]) {
        streetsByCity[cityCode] = {
          cityCode,
          cityName,
          streets: []
        };
      }

      streetsByCity[cityCode].streets.push({
        code: streetCode,
        name: streetName
      });
    }
  });

  const totalStreets = Object.values(streetsByCity).reduce(
    (sum, city) => sum + city.streets.length,
    0
  );

  console.log(`\nTotal streets: ${totalStreets}`);
  console.log(`Cities with streets: ${Object.keys(streetsByCity).length}`);

  fs.writeFileSync(
    path.join(DATA_DIR, 'streets.json'),
    JSON.stringify(streetsByCity, null, 2)
  );

  return streetsByCity;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Israeli Address Database Downloader');
  console.log('Source: data.gov.il (Israel Government Open Data)');
  console.log('='.repeat(60));

  try {
    const startTime = Date.now();

    const cities = await fetchAllCities();
    const streetsByCity = await fetchAllStreets();

    const totalStreets = Object.values(streetsByCity).reduce(
      (sum, city) => sum + city.streets.length,
      0
    );

    const stats = {
      source: 'data.gov.il - Israel Government Open Data Portal',
      citiesResourceId: CITIES_RESOURCE_ID,
      streetsResourceId: STREETS_RESOURCE_ID,
      downloadedAt: new Date().toISOString(),
      totalCities: cities.length,
      totalStreets: totalStreets,
      citiesWithStreets: Object.keys(streetsByCity).length
    };

    fs.writeFileSync(
      path.join(DATA_DIR, 'stats.json'),
      JSON.stringify(stats, null, 2)
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('DOWNLOAD COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total cities: ${stats.totalCities}`);
    console.log(`Total streets: ${stats.totalStreets}`);
    console.log(`Cities with streets: ${stats.citiesWithStreets}`);
    console.log(`Time elapsed: ${duration}s`);
    console.log(`Data saved to: ${DATA_DIR}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
