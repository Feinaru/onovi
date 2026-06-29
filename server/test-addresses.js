/**
 * Test script for Israeli addresses API
 * Demonstrates progressive autocomplete functionality
 */

const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:3000${path}`;

    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  console.log('='.repeat(70));
  console.log('ISRAELI ADDRESS DATABASE - API TEST');
  console.log('='.repeat(70));

  try {
    // Test 1: Database stats
    console.log('\n1. Database Statistics:');
    console.log('-'.repeat(70));
    const stats = await makeRequest('/api/addresses/stats');
    console.log(`   Source: ${stats.source}`);
    console.log(`   Total Cities: ${stats.totalCities}`);
    console.log(`   Total Streets: ${stats.totalStreets}`);
    console.log(`   Downloaded: ${new Date(stats.downloadedAt).toLocaleString()}`);

    // Test 2: City autocomplete
    console.log('\n2. City Autocomplete (query: "תל"):');
    console.log('-'.repeat(70));
    const cities = await makeRequest('/api/addresses/cities/autocomplete?q=' + encodeURIComponent('תל'));
    cities.slice(0, 10).forEach((city, i) => {
      console.log(`   ${i + 1}. ${city.name} (${city.nameEng})`);
    });
    console.log(`   ...${cities.length} total results`);

    // Test 3: Progressive street filtering
    console.log('\n3. Progressive Street Filtering in Tel Aviv:');
    console.log('-'.repeat(70));

    const queries = ['ח', 'חב', 'חבר', 'חברון'];
    for (const q of queries) {
      const streets = await makeRequest(
        `/api/addresses/streets/autocomplete?city=${encodeURIComponent('תל אביב - יפו')}&q=${encodeURIComponent(q)}`
      );
      console.log(`   Query "${q}": ${streets.length} results`);
      if (streets.length > 0 && streets.length <= 5) {
        streets.forEach(s => console.log(`      - ${s.name}`));
      } else if (streets.length > 0) {
        streets.slice(0, 3).forEach(s => console.log(`      - ${s.name}`));
        console.log(`      ... and ${streets.length - 3} more`);
      }
    }

    // Test 4: Different cities
    console.log('\n4. Streets in Different Cities:');
    console.log('-'.repeat(70));

    const testCases = [
      { city: 'ירושלים', query: 'יפו' },
      { city: 'חיפה', query: 'הרצל' },
      { city: 'באר שבע', query: 'רגר' }
    ];

    for (const test of testCases) {
      const streets = await makeRequest(
        `/api/addresses/streets/autocomplete?city=${encodeURIComponent(test.city)}&q=${encodeURIComponent(test.query)}`
      );
      console.log(`   ${test.city}, query "${test.query}": ${streets.length} results`);
      streets.slice(0, 3).forEach(s => console.log(`      - ${s.name}`));
    }

    console.log('\n' + '='.repeat(70));
    console.log('ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error('Make sure the server is running: npm start');
    process.exit(1);
  }
}

// Wait a moment for server to be ready, then run tests
setTimeout(test, 1000);
