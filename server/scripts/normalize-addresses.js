/**
 * Normalize Israeli Address Data
 * Creates normalized city and street files with proper aliases
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CITIES_FILE = path.join(DATA_DIR, 'cities.json');
const STREETS_FILE = path.join(DATA_DIR, 'streets.json');
const NORMALIZED_CITIES_FILE = path.join(DATA_DIR, 'cities-normalized.json');
const NORMALIZED_STREETS_FILE = path.join(DATA_DIR, 'streets-normalized.json');

console.log('='.repeat(60));
console.log('Israeli Address Data Normalizer');
console.log('='.repeat(60));

// Read raw data
console.log('Reading raw data...');
const cities = JSON.parse(fs.readFileSync(CITIES_FILE, 'utf8'));
const streetsData = JSON.parse(fs.readFileSync(STREETS_FILE, 'utf8'));

console.log(`Found ${cities.length} cities`);
console.log(`Found ${Object.keys(streetsData).length} cities with streets`);

// Define city aliases for common variations
const CITY_ALIASES = {
  '1200': ['מודיעין', 'מכבים רעות', 'מכבים-רעות', 'מודיעין מכבים רעות'], // מודיעין-מכבים-רעות
  '5000': ['תל אביב', 'תל אביב יפו', 'תל-אביב-יפו'], // תל אביב-יפו
  '3000': ['ירושלים', 'ירושליים'], // ירושלים
  '2600': ['פתח תקוה', 'פתח-תקוה', 'פת'], // פתח תקווה
  '2700': ['חיפה'], // חיפה
  '70': ['באר שבע', 'באר-שבע', 'באר שבע'], // באר שבע
  '8600': ['נתניה'], // נתניה
  '2300': ['חולון'], // חולון
  '6100': ['בני ברק', 'בני-ברק', 'בני ברק'], // בני ברק
  '2610': ['רמת גן', 'רמת-גן'], // רמת גן
};

// Normalize cities
console.log('\nNormalizing cities...');
const normalizedCities = cities.map(city => {
  const cityCode = city.code.toString();
  const aliases = CITY_ALIASES[cityCode] || [];

  return {
    cityCode: city.code,
    hebrewName: city.nameHeb,
    aliases: aliases,
    // Store English for internal use only, NEVER display in UI
    _englishName: city.nameEng
  };
});

console.log(`Normalized ${normalizedCities.length} cities`);

// Count cities with aliases
const citiesWithAliases = normalizedCities.filter(c => c.aliases.length > 0);
console.log(`Cities with aliases: ${citiesWithAliases.length}`);

// Normalize streets
console.log('\nNormalizing streets...');
const normalizedStreets = {};

for (const [cityCode, cityData] of Object.entries(streetsData)) {
  normalizedStreets[cityCode] = {
    cityCode: parseInt(cityCode),
    cityName: cityData.cityName,
    streets: cityData.streets.map(street => ({
      streetCode: street.code,
      hebrewName: street.name
    }))
  };
}

console.log(`Normalized ${Object.keys(normalizedStreets).length} cities with streets`);

// Calculate total streets
const totalStreets = Object.values(normalizedStreets).reduce(
  (sum, city) => sum + city.streets.length,
  0
);
console.log(`Total streets: ${totalStreets}`);

// Write normalized files
console.log('\nWriting normalized files...');
fs.writeFileSync(
  NORMALIZED_CITIES_FILE,
  JSON.stringify(normalizedCities, null, 2),
  'utf8'
);
console.log(`✓ ${NORMALIZED_CITIES_FILE}`);

fs.writeFileSync(
  NORMALIZED_STREETS_FILE,
  JSON.stringify(normalizedStreets, null, 2),
  'utf8'
);
console.log(`✓ ${NORMALIZED_STREETS_FILE}`);

// Verify Modi'in
console.log('\n' + '='.repeat(60));
console.log('VERIFICATION: Modi\'in-Maccabim-Re\'ut');
console.log('='.repeat(60));

const modiin = normalizedCities.find(c => c.cityCode === 1200);
if (modiin) {
  console.log('City found:');
  console.log(`  Code: ${modiin.cityCode}`);
  console.log(`  Hebrew Name: ${modiin.hebrewName}`);
  console.log(`  Aliases: ${modiin.aliases.join(', ')}`);

  const modiinStreets = normalizedStreets['1200'];
  if (modiinStreets) {
    console.log(`  Streets: ${modiinStreets.streets.length}`);
    console.log(`  Sample streets: ${modiinStreets.streets.slice(0, 5).map(s => s.hebrewName).join(', ')}`);
  }
} else {
  console.log('❌ Modi\'in not found!');
}

console.log('\n' + '='.repeat(60));
console.log('NORMALIZATION COMPLETE');
console.log('='.repeat(60));
console.log(`Cities: ${normalizedCities.length}`);
console.log(`Cities with aliases: ${citiesWithAliases.length}`);
console.log(`Cities with streets: ${Object.keys(normalizedStreets).length}`);
console.log(`Total streets: ${totalStreets}`);
console.log('='.repeat(60));
