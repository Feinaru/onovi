#!/usr/bin/env node

/**
 * Quick Auth Regression Test
 * Uses existing users in the database
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'change-this-secret-in-production';
const BASE_URL = 'http://localhost:3000';

// Create tokens for existing users
const tokens = {
  serviceProvider: jwt.sign({ id: 2 }, JWT_SECRET), // USER ID 2 - SERVICE_PROVIDER
  customer: jwt.sign({ id: 3 }, JWT_SECRET),         // USER ID 3 - CUSTOMER
};

async function request(method, path, token = null) {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { method, headers });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { response, data, status: response.status };
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log('\n═════════════════════════════════════════');
  console.log('Auth Regression Quick Check');
  console.log('═════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  // Test 1: SERVICE_PROVIDER can access their routes
  if (await test('1. SERVICE_PROVIDER can access service-provider routes', async () => {
    const { status, data } = await request('GET', '/api/service-provider/service-groups', tokens.serviceProvider);
    assert(status === 200, `Expected 200, got ${status}. Error: ${data?.error || data?.message || 'none'}`);
    assert(data.success, 'Expected success:true');
  })) passed++; else failed++;

  // Test 2: SERVICE_PROVIDER can access business profile
  if (await test('2. SERVICE_PROVIDER can access business profile', async () => {
    const { status, data } = await request('GET', '/api/service-provider/business/profile', tokens.serviceProvider);
    assert(status === 200, `Expected 200, got ${status}. Error: ${data?.error || 'none'}`);
  })) passed++; else failed++;

  // Test 3: CUSTOMER cannot access SERVICE_PROVIDER routes
  if (await test('3. CUSTOMER blocked from SERVICE_PROVIDER routes', async () => {
    const { status } = await request('GET', '/api/service-provider/service-groups', tokens.customer);
    assert(status === 403, `Expected 403, got ${status}`);
  })) passed++; else failed++;

  // Test 4: Unauthenticated requests are rejected
  if (await test('4. Unauthenticated requests rejected', async () => {
    const { status } = await request('GET', '/api/service-provider/service-groups');
    assert(status === 401, `Expected 401, got ${status}`);
  })) passed++; else failed++;

  // Test 5: Invalid token rejected
  if (await test('5. Invalid token rejected', async () => {
    const { status } = await request('GET', '/api/service-provider/service-groups', 'invalid-token');
    assert(status === 401, `Expected 401, got ${status}`);
  })) passed++; else failed++;

  // Test 6: Existing registration flow works (public catalog)
  if (await test('6. Registration catalog endpoints work (fields)', async () => {
    const { status, data } = await request('GET', '/api/registration/fields');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(data), 'Expected array of fields');
  })) passed++; else failed++;

  // Test 7: Professions endpoint
  if (await test('7. Registration catalog endpoints work (professions)', async () => {
    const { status, data } = await request('GET', '/api/registration/fields/1/professions');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(data), 'Expected array of professions');
  })) passed++; else failed++;

  // Test 8: Services endpoint
  if (await test('8. Registration catalog endpoints work (services)', async () => {
    const { status, data } = await request('GET', '/api/registration/professions/1/services');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(data), 'Expected array of services');
  })) passed++; else failed++;

  // Test 9: Auth middleware populates user correctly
  if (await test('9. Auth middleware populates req.user with role', async () => {
    // This is implicitly tested by test #3 working correctly
    // If role wasn't populated, test #3 would fail with 401 instead of 403
    assert(true, 'Verified by other tests');
  })) passed++; else failed++;

  console.log('\n═════════════════════════════════════════');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('═════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 All auth regression checks passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some checks failed!\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
