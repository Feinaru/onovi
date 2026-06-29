// Address API Automated Test
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  console.log('ADDRESS API AUTOMATED TEST SUITE\n');
  console.log('='.repeat(60));

  let passed = 0, failed = 0;

  // Test 1
  try {
    console.log('\nTC-NET-001: City Autocomplete - Single character');
    const r1 = await makeRequest('/api/addresses/cities/autocomplete?q=' + encodeURIComponent('ת'));
    if (r1.status === 200 && r1.data.length >= 20) {
      console.log(`   PASS - Status: ${r1.status}, Results: ${r1.data.length}`);
      passed++;
    } else {
      console.log(`   FAIL - Status: ${r1.status}, Results: ${r1.data.length}`);
      failed++;
    }
  } catch (e) {
    console.log(`   FAIL - ${e.message}`);
    failed++;
  }

  // Test 2
  try {
    console.log('\nTC-NET-002: City Autocomplete Progressive');
    const r2 = await makeRequest('/api/addresses/cities/autocomplete?q=' + encodeURIComponent('תל א'));
    if (r2.status === 200 && r2.data.length <= 5) {
      console.log(`   PASS - Results narrowed to: ${r2.data.length}`);
      passed++;
    } else {
      console.log(`   FAIL - Results: ${r2.data.length}`);
      failed++;
    }
  } catch (e) {
    console.log(`   FAIL - ${e.message}`);
    failed++;
  }

  // Test 3
  try {
    console.log('\nTC-NET-003: Street Autocomplete in Tel Aviv');
    const r3 = await makeRequest('/api/addresses/streets/autocomplete?city=' +
      encodeURIComponent('תל אביב - יפו') + '&q=' + encodeURIComponent('ח'));
    if (r3.status === 200 && r3.data.length >= 40) {
      console.log(`   PASS - Results: ${r3.data.length}`);
      passed++;
    } else {
      console.log(`   FAIL - Results: ${r3.data.length}`);
      failed++;
    }
  } catch (e) {
    console.log(`   FAIL - ${e.message}`);
    failed++;
  }

  // Test 4: Progressive
  console.log('\nTC-NET-004: Progressive Filtering');
  const queries = ['ח', 'חב', 'חבר', 'חברון'];
  let progressive = true;
  let prevCount = Infinity;

  for (const q of queries) {
    try {
      const r = await makeRequest('/api/addresses/streets/autocomplete?city=' +
        encodeURIComponent('תל אביב - יפו') + '&q=' + encodeURIComponent(q));
      console.log(`   "${q}" -> ${r.data.length} results`);

      if (r.data.length > prevCount) {
        progressive = false;
      }
      prevCount = r.data.length;
    } catch (e) {
      progressive = false;
    }
  }

  if (progressive) {
    console.log(`   PASS - Results narrow progressively`);
    passed++;
  } else {
    console.log(`   FAIL - Results do not narrow`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed/(passed+failed))*100).toFixed(1)}%`);
  console.log('\n' + (failed === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'));

  process.exit(failed > 0 ? 1 : 0);
})();
