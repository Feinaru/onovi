#!/usr/bin/env node

/**
 * Epic 1 Smoke Test
 * Tests all new functionality added in Epic 1
 */

const BASE_URL = 'http://localhost:3000';

let serviceProviderToken = null;
let serviceId = null;

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

async function test(name, fn) {
  try {
    console.log(`\n🧪 ${name}`);
    await fn();
    console.log(`✅ PASS: ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('Epic 1 Smoke Test');
  console.log('═══════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  // 1. Login as SERVICE_PROVIDER
  if (await test('1. Login as SERVICE_PROVIDER', async () => {
    const { status, data } = await request('POST', '/auth/login', {
      phone: '0500000002',
      password: 'test123'
    });

    if (status !== 200 || !data.token) {
      throw new Error('Login failed or no token returned');
    }

    serviceProviderToken = data.token;
    console.log('   ✓ Logged in successfully');
  })) passed++; else failed++;

  // 2. Get Business Profile (includes all new fields)
  if (await test('2. Get Business Profile with new fields', async () => {
    const { status, data } = await request('GET', '/api/service-provider/business/profile', null, serviceProviderToken);

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}`);
    }

    if (!data.success || !data.data) {
      throw new Error('No profile data returned');
    }

    const profile = data.data;

    // Check media fields exist
    if (!('logoUrl' in profile)) throw new Error('logoUrl field missing');
    if (!('coverImageUrl' in profile)) throw new Error('coverImageUrl field missing');
    if (!('galleryImages' in profile)) throw new Error('galleryImages field missing');

    // Check settings fields exist
    if (!('language' in profile)) throw new Error('language field missing');
    if (!('timezone' in profile)) throw new Error('timezone field missing');
    if (!('defaultAppointmentBufferMins' in profile)) throw new Error('defaultAppointmentBufferMins field missing');
    if (!('defaultBookingBehavior' in profile)) throw new Error('defaultBookingBehavior field missing');

    console.log('   ✓ All media fields present');
    console.log('   ✓ All settings fields present');
  })) passed++; else failed++;

  // 3. Get Services List
  if (await test('3. Get Services List', async () => {
    const { status, data } = await request('GET', '/api/service-provider/services', null, serviceProviderToken);

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}`);
    }

    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Invalid services data');
    }

    if (data.data.length === 0) {
      throw new Error('No services found - cannot test service editing');
    }

    const service = data.data[0];
    serviceId = service.id;

    // Check new fields
    if (!('visibleToCustomers' in service)) throw new Error('visibleToCustomers field missing');
    if (!('calendarColor' in service)) throw new Error('calendarColor field missing');

    console.log(`   ✓ Found ${data.data.length} services`);
    console.log('   ✓ New service fields present');
  })) passed++; else failed++;

  // 4. Update Service (price, duration, active, visibility)
  if (await test('4. Update Service (price, duration, active, visibility)', async () => {
    if (!serviceId) throw new Error('No service ID available');

    const { status, data } = await request('PUT', `/api/service-provider/services/${serviceId}`, {
      regularPrice: 150,
      durationMinutes: 45,
      active: true,
      visibleToCustomers: false
    }, serviceProviderToken);

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}: ${JSON.stringify(data)}`);
    }

    if (!data.success) {
      throw new Error('Update failed');
    }

    const updated = data.data;
    if (updated.regularPrice !== 150) throw new Error('Price not updated');
    if (updated.durationMinutes !== 45) throw new Error('Duration not updated');
    if (updated.active !== true) throw new Error('Active status not updated');
    if (updated.visibleToCustomers !== false) throw new Error('Visibility not updated');

    console.log('   ✓ Price updated to 150');
    console.log('   ✓ Duration updated to 45 minutes');
    console.log('   ✓ Active set to true');
    console.log('   ✓ Visibility set to false');
  })) passed++; else failed++;

  // 5. Update Business Media
  if (await test('5. Update Business Media (logo, cover, gallery)', async () => {
    const fakeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const { status, data } = await request('PUT', '/api/service-provider/business/profile', {
      name: 'Test Business',
      phone: '0500000002',
      logoUrl: fakeImage,
      coverImageUrl: fakeImage,
      galleryImages: [fakeImage]
    }, serviceProviderToken);

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}: ${JSON.stringify(data)}`);
    }

    if (!data.success) {
      throw new Error('Media update failed');
    }

    console.log('   ✓ Logo uploaded');
    console.log('   ✓ Cover image uploaded');
    console.log('   ✓ Gallery image uploaded');
  })) passed++; else failed++;

  // 6. Update Business Settings
  if (await test('6. Update Business Settings', async () => {
    const { status, data } = await request('PUT', '/api/service-provider/business/settings', {
      language: 'en',
      timezone: 'Europe/London',
      defaultAppointmentBufferMins: 15,
      defaultBookingBehavior: 'auto'
    }, serviceProviderToken);

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}: ${JSON.stringify(data)}`);
    }

    if (!data.success) {
      throw new Error('Settings update failed');
    }

    const updated = data.data;
    if (updated.language !== 'en') throw new Error('Language not updated');
    if (updated.timezone !== 'Europe/London') throw new Error('Timezone not updated');
    if (updated.defaultAppointmentBufferMins !== 15) throw new Error('Buffer not updated');
    if (updated.defaultBookingBehavior !== 'auto') throw new Error('Booking behavior not updated');

    console.log('   ✓ Language set to English');
    console.log('   ✓ Timezone set to Europe/London');
    console.log('   ✓ Buffer set to 15 minutes');
    console.log('   ✓ Booking behavior set to auto');
  })) passed++; else failed++;

  // 7. Verify Persistence (re-fetch profile)
  if (await test('7. Verify Persistence (re-fetch profile)', async () => {
    const { status, data } = await request('GET', '/api/service-provider/business/profile', null, serviceProviderToken);

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}`);
    }

    const profile = data.data;

    // Check media persisted
    if (!profile.logoUrl || !profile.logoUrl.includes('data:image')) {
      throw new Error('Logo not persisted');
    }
    if (!profile.coverImageUrl || !profile.coverImageUrl.includes('data:image')) {
      throw new Error('Cover image not persisted');
    }
    if (!profile.galleryImages || !profile.galleryImages.includes('data:image')) {
      throw new Error('Gallery not persisted');
    }

    // Check settings persisted
    if (profile.language !== 'en') throw new Error('Language not persisted');
    if (profile.timezone !== 'Europe/London') throw new Error('Timezone not persisted');
    if (profile.defaultAppointmentBufferMins !== 15) throw new Error('Buffer not persisted');
    if (profile.defaultBookingBehavior !== 'auto') throw new Error('Booking behavior not persisted');

    console.log('   ✓ All media persisted');
    console.log('   ✓ All settings persisted');
  })) passed++; else failed++;

  // 8. Verify Service Groups still work
  if (await test('8. Verify Service Groups endpoint still works', async () => {
    const { status, data } = await request('GET', '/api/service-provider/service-groups', null, serviceProviderToken);

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}`);
    }

    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Service groups endpoint broken');
    }

    console.log(`   ✓ Service groups endpoint works (${data.data.length} groups)`);
  })) passed++; else failed++;

  // 9. Verify Registration Catalog endpoints
  if (await test('9. Verify Registration Catalog endpoints', async () => {
    const { status: fieldsStatus } = await request('GET', '/api/registration/fields');
    if (fieldsStatus !== 200) throw new Error('Fields endpoint failed');

    const { status: professionsStatus } = await request('GET', '/api/registration/fields/1/professions');
    if (professionsStatus !== 200) throw new Error('Professions endpoint failed');

    const { status: servicesStatus } = await request('GET', '/api/registration/professions/1/services');
    if (servicesStatus !== 200) throw new Error('Services endpoint failed');

    console.log('   ✓ Fields endpoint works');
    console.log('   ✓ Professions endpoint works');
    console.log('   ✓ Services endpoint works');
  })) passed++; else failed++;

  console.log('\n═══════════════════════════════════════════════════');
  console.log('Epic 1 Smoke Test Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log('═══════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('⚠️  Some tests failed!');
    process.exit(1);
  } else {
    console.log('🎉 All Epic 1 smoke tests passed!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
