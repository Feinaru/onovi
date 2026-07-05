#!/usr/bin/env node

/**
 * Auth Regression Test
 *
 * Verifies that auth middleware changes didn't break existing functionality:
 * 1. ADMIN login and access
 * 2. SERVICE_PROVIDER login and access
 * 3. SERVICE_RECIPIENT login and access
 * 4. Protected routes reject unauthenticated users
 * 5. Role-based routes block wrong roles
 * 6. Registration flow still works
 */

const BASE_URL = 'http://localhost:3000';

// Pre-generated tokens for testing
const tokens = {
  admin: null,
  serviceProvider: null,
  serviceRecipient: null
};

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { response, data };
}

async function test(description, fn) {
  try {
    console.log(`\n🧪 ${description}`);
    await fn();
    console.log(`✅ PASS: ${description}`);
    return true;
  } catch (error) {
    console.error(`❌ FAIL: ${description}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('Auth Regression Test');
  console.log('═══════════════════════════════════════════════════');

  let passed = 0;
  let failed = 0;

  // Test 1: ADMIN login
  if (await test('1. ADMIN can login', async () => {
    const { response, data } = await request('POST', '/auth/register', {
      fullName: 'Test Admin',
      phone: '0599999991',
      password: 'admin123',
      role: 'ADMIN'
    });

    // May already exist, try login
    const { response: loginResp, data: loginData } = await request('POST', '/auth/login', {
      phone: '0599999991',
      password: 'admin123'
    });

    assert(loginResp.ok, `Login failed: ${loginData?.message || 'Unknown error'}`);
    assert(loginData.token, 'No token received');
    assert(loginData.user, 'No user data');
    assert(loginData.user.role === 'ADMIN', `Expected ADMIN role, got ${loginData.user.role}`);

    tokens.admin = loginData.token;
    console.log(`   ✓ ADMIN logged in (ID: ${loginData.user.id})`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: SERVICE_PROVIDER login
  if (await test('2. SERVICE_PROVIDER can login', async () => {
    // Try existing user first
    const { response: loginResp, data: loginData } = await request('POST', '/auth/login', {
      phone: '0500000002',
      password: 'password123'
    });

    // If fails, create new one
    if (!loginResp.ok) {
      const { response: regResp, data: regData } = await request('POST', '/auth/register', {
        fullName: 'Test Service Provider',
        phone: '0599999992',
        password: 'provider123',
        role: 'SERVICE_PROVIDER'
      });

      const { response: login2Resp, data: login2Data } = await request('POST', '/auth/login', {
        phone: '0599999992',
        password: 'provider123'
      });

      assert(login2Resp.ok, 'Login failed after registration');
      assert(login2Data.user.role === 'SERVICE_PROVIDER', 'Wrong role');
      tokens.serviceProvider = login2Data.token;
      console.log(`   ✓ SERVICE_PROVIDER logged in (new user)`);
    } else {
      assert(loginData.user.role === 'SERVICE_PROVIDER', 'Wrong role');
      tokens.serviceProvider = loginData.token;
      console.log(`   ✓ SERVICE_PROVIDER logged in (existing user)`);
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: SERVICE_RECIPIENT login
  if (await test('3. SERVICE_RECIPIENT can login', async () => {
    const { response: regResp, data: regData } = await request('POST', '/auth/register', {
      fullName: 'Test Service Recipient',
      phone: '0599999993',
      password: 'recipient123',
      role: 'SERVICE_RECIPIENT'
    });

    // May already exist, try login
    const { response: loginResp, data: loginData } = await request('POST', '/auth/login', {
      phone: '0599999993',
      password: 'recipient123'
    });

    assert(loginResp.ok, 'Login failed');
    assert(loginData.user.role === 'SERVICE_RECIPIENT', 'Wrong role');

    tokens.serviceRecipient = loginData.token;
    console.log(`   ✓ SERVICE_RECIPIENT logged in`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: Protected routes reject unauthenticated users
  if (await test('4. Protected routes reject unauthenticated requests', async () => {
    const protectedRoutes = [
      '/api/service-provider/business/profile',
      '/api/service-provider/service-groups',
      '/api/admin/users'
    ];

    for (const route of protectedRoutes) {
      const { response } = await request('GET', route);
      assert(response.status === 401, `Route ${route} should return 401, got ${response.status}`);
    }

    console.log(`   ✓ All protected routes return 401 without auth`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 5: Role-based routes block wrong roles
  if (await test('5a. SERVICE_PROVIDER routes block ADMIN', async () => {
    const { response, data } = await request('GET', '/api/service-provider/business/profile', null, tokens.admin);
    assert(response.status === 403, `Expected 403, got ${response.status}`);
    console.log(`   ✓ ADMIN blocked from SERVICE_PROVIDER routes`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('5b. SERVICE_PROVIDER routes block SERVICE_RECIPIENT', async () => {
    const { response } = await request('GET', '/api/service-provider/business/profile', null, tokens.serviceRecipient);
    assert(response.status === 403 || response.status === 404, `Expected 403/404, got ${response.status}`);
    console.log(`   ✓ SERVICE_RECIPIENT blocked from SERVICE_PROVIDER routes`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('5c. ADMIN routes block SERVICE_PROVIDER', async () => {
    const { response } = await request('GET', '/api/admin/users', null, tokens.serviceProvider);
    assert(response.status === 403, `Expected 403, got ${response.status}`);
    console.log(`   ✓ SERVICE_PROVIDER blocked from ADMIN routes`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 6: SERVICE_PROVIDER can access their own routes
  if (await test('6a. SERVICE_PROVIDER can access service-provider routes', async () => {
    const { response, data } = await request('GET', '/api/service-provider/service-groups', null, tokens.serviceProvider);
    assert(response.ok, `Expected 200, got ${response.status}: ${data?.error || ''}`);
    assert(data.success !== undefined, 'Response should have success field');
    console.log(`   ✓ SERVICE_PROVIDER accessed service-groups`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 7: ADMIN can access admin routes
  if (await test('6b. ADMIN can access admin routes', async () => {
    const { response, data } = await request('GET', '/api/admin/users', null, tokens.admin);
    assert(response.ok, `Expected 200, got ${response.status}`);
    console.log(`   ✓ ADMIN accessed admin routes`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 8: Registration flow basic check
  if (await test('7. Registration flow accepts new users', async () => {
    const randomPhone = `059${Math.floor(1000000 + Math.random() * 9000000)}`;
    const { response, data } = await request('POST', '/auth/register', {
      fullName: 'Registration Test User',
      phone: randomPhone,
      password: 'test12345',
      role: 'SERVICE_RECIPIENT'
    });

    // Check if registration succeeded or user already exists
    const isSuccess = response.ok || (response.status === 400 && data?.message?.includes('already'));
    assert(isSuccess, `Registration failed: ${response.status} - ${data?.message || 'Unknown error'}`);
    console.log(`   ✓ Registration endpoint works`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 9: Token validation works correctly
  if (await test('8. Invalid tokens are rejected', async () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token';
    const { response } = await request('GET', '/api/service-provider/service-groups', null, invalidToken);
    assert(response.status === 401, `Expected 401 for invalid token, got ${response.status}`);
    console.log(`   ✓ Invalid tokens rejected`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 10: Expired/malformed tokens
  if (await test('9. Malformed tokens are rejected', async () => {
    const { response } = await request('GET', '/api/service-provider/service-groups', null, 'not-a-jwt-token');
    assert(response.status === 401, `Expected 401 for malformed token, got ${response.status}`);
    console.log(`   ✓ Malformed tokens rejected`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('Auth Regression Test Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log('═══════════════════════════════════════════════════');

  if (failed === 0) {
    console.log('\n🎉 All auth regression tests passed!');
    console.log('Auth middleware changes did not break existing functionality.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some auth tests failed!');
    console.log('Review the auth middleware changes.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
