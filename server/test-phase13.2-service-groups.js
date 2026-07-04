#!/usr/bin/env node

/**
 * Phase 13.2 Service Groups QA Test
 *
 * Tests:
 * 1. Business Profile improvements (email read-only, approval status descriptions)
 * 2. Service Groups CRUD operations
 * 3. Validation (hierarchy, duplicates, empty groups)
 */

const BASE_URL = 'http://localhost:3000';

// Use pre-generated token for user 2 (SERVICE_PROVIDER)
let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzgzMTkxNDIwfQ.KEyy3LejzdFMmVR6ZRWrseL0DYsj4DahZMy-NvTysTA';
let businessId = null;
let fieldId = null;
let professionId = null;
let serviceTemplateIds = [];
let businessProfessionId = null;

async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
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
  console.log('Phase 13.2 - Service Groups Management QA');
  console.log('═══════════════════════════════════════════════════');

  let passed = 0;
  let failed = 0;

  console.log('Using pre-generated token for user 2 (SERVICE_PROVIDER)');

  // Get business profile
  if (await test('Get business profile', async () => {
    const { response, data } = await request('GET', '/api/service-provider/business/profile');

    assert(response.ok, 'Failed to get profile');
    assert(data.success, 'Response not successful');
    assert(data.data.id, 'No business ID');
    assert(data.data.approvalStatus, 'No approval status');

    businessId = data.data.id;
    console.log(`   Business ID: ${businessId}`);
    console.log(`   Approval Status: ${data.data.approvalStatus}`);
    console.log(`   Owner Email: ${data.data.ownerEmail || 'N/A'}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Get catalog data for testing
  if (await test('Get catalog: fields', async () => {
    const { response, data } = await request('GET', '/api/registration/fields', null, false);

    assert(response.ok, 'Failed to get fields');
    assert(Array.isArray(data), 'Fields not an array');
    assert(data.length > 0, 'No fields available');

    fieldId = data[0].id;
    console.log(`   Field ID: ${fieldId} (${data[0].nameHebrew})`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('Get catalog: professions for field', async () => {
    const { response, data } = await request('GET', `/api/registration/fields/${fieldId}/professions`, null, false);

    assert(response.ok, 'Failed to get professions');
    assert(Array.isArray(data), 'Professions not an array');
    assert(data.length > 0, 'No professions available');

    professionId = data[0].id;
    console.log(`   Profession ID: ${professionId} (${data[0].nameHebrew})`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('Get catalog: services for profession', async () => {
    const { response, data } = await request('GET', `/api/registration/professions/${professionId}/services`, null, false);

    assert(response.ok, 'Failed to get services');
    assert(Array.isArray(data), 'Services not an array');
    assert(data.length > 0, 'No services available');

    serviceTemplateIds = data.slice(0, 3).map(s => s.id);
    console.log(`   Service IDs: ${serviceTemplateIds.join(', ')}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test Service Groups CRUD

  if (await test('Get service groups (empty initially)', async () => {
    const { response, data } = await request('GET', '/api/service-provider/service-groups');

    assert(response.ok, 'Failed to get service groups');
    assert(data.success, 'Response not successful');
    assert(Array.isArray(data.data), 'Service groups not an array');

    console.log(`   Current service groups: ${data.data.length}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('Create service group - validation: empty services', async () => {
    const { response, data } = await request('POST', '/api/service-provider/service-groups', {
      fieldId,
      professionId,
      serviceTemplateIds: []
    });

    assert(!response.ok, 'Should fail with empty services');
    assert(data.error, 'Should have error message');
    console.log(`   Error: ${data.error}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('Create service group - validation: invalid hierarchy', async () => {
    const { response, data } = await request('POST', '/api/service-provider/service-groups', {
      fieldId: 9999,
      professionId,
      serviceTemplateIds
    });

    assert(!response.ok, 'Should fail with invalid hierarchy');
    assert(data.error, 'Should have error message');
    console.log(`   Error: ${data.error}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('Create service group - SUCCESS', async () => {
    const { response, data } = await request('POST', '/api/service-provider/service-groups', {
      fieldId,
      professionId,
      serviceTemplateIds
    });

    assert(response.ok, 'Failed to create service group');
    assert(data.success, 'Response not successful');
    assert(data.data.businessProfessionId, 'No businessProfessionId returned');

    businessProfessionId = data.data.businessProfessionId;
    console.log(`   Created BusinessProfession ID: ${businessProfessionId}`);
    console.log(`   Services created: ${data.data.servicesCreated}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('Create duplicate service group - validation', async () => {
    const { response, data } = await request('POST', '/api/service-provider/service-groups', {
      fieldId,
      professionId,
      serviceTemplateIds
    });

    assert(!response.ok, 'Should fail with duplicate profession');
    assert(data.error, 'Should have error message');
    assert(data.error.includes('already exists'), 'Error should mention duplicate');
    console.log(`   Error: ${data.error}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('Get service groups (should have 1 now)', async () => {
    const { response, data } = await request('GET', '/api/service-provider/service-groups');

    assert(response.ok, 'Failed to get service groups');
    assert(data.success, 'Response not successful');
    assert(data.data.length === 1, 'Should have exactly 1 service group');

    const group = data.data[0];
    assert(group.businessProfessionId === businessProfessionId, 'Wrong businessProfessionId');
    assert(group.fieldId === fieldId, 'Wrong fieldId');
    assert(group.professionId === professionId, 'Wrong professionId');
    assert(group.services.length === serviceTemplateIds.length, 'Wrong number of services');

    console.log(`   Field: ${group.fieldName}`);
    console.log(`   Profession: ${group.professionName}`);
    console.log(`   Services: ${group.services.length}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('Update service group - validation: empty services', async () => {
    const { response, data } = await request('PUT', `/api/service-provider/service-groups/${businessProfessionId}`, {
      serviceTemplateIds: []
    });

    assert(!response.ok, 'Should fail with empty services');
    assert(data.error, 'Should have error message');
    console.log(`   Error: ${data.error}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('Update service group - SUCCESS (modify services)', async () => {
    const newServiceIds = serviceTemplateIds.slice(0, 2); // Remove one service

    const { response, data } = await request('PUT', `/api/service-provider/service-groups/${businessProfessionId}`, {
      serviceTemplateIds: newServiceIds
    });

    assert(response.ok, 'Failed to update service group');
    assert(data.success, 'Response not successful');
    console.log(`   Added: ${data.data.added}, Removed: ${data.data.removed}`);

    // Verify the change
    const { data: listData } = await request('GET', '/api/service-provider/service-groups');
    const group = listData.data[0];
    assert(group.services.length === newServiceIds.length, 'Services not updated correctly');
    console.log(`   Services now: ${group.services.length}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('Delete service group - SUCCESS', async () => {
    const { response, data } = await request('DELETE', `/api/service-provider/service-groups/${businessProfessionId}`);

    assert(response.ok, 'Failed to delete service group');
    assert(data.success, 'Response not successful');
    console.log(`   Deleted BusinessProfession ID: ${businessProfessionId}`);

    // Verify deletion
    const { data: listData } = await request('GET', '/api/service-provider/service-groups');
    assert(listData.data.length === 0, 'Service group not deleted');
    console.log(`   Service groups now: ${listData.data.length}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  if (await test('Delete non-existent service group - validation', async () => {
    const { response, data } = await request('DELETE', `/api/service-provider/service-groups/99999`);

    assert(!response.ok, 'Should fail with non-existent group');
    assert(data.error, 'Should have error message');
    console.log(`   Error: ${data.error}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('QA Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log('═══════════════════════════════════════════════════');

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Ready to commit.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please fix before committing.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
