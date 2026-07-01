#!/usr/bin/env node

/**
 * Phase 3 - Service Provider Registration Tests
 *
 * Tests:
 * 1. Successful registration
 * 2. Duplicate email
 * 3. Invalid hierarchy
 * 4. Invalid service
 * 5. Duplicate service selection
 * 6. Registration status
 * 7. Suggestion request creation
 * 8. Update registration
 */

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;
let fieldId, professionId, serviceTemplateId;
let registeredUserId, registeredBusinessId;
let authToken;

async function request(method, path, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return { status: response.status, data };
}

function pass(msg) {
  console.log(`✓ PASS: ${msg}`);
  passed++;
}

function fail(msg) {
  console.log(`✗ FAIL: ${msg}`);
  failed++;
}

async function setupTestData() {
  console.log('Setting up test data (Field, Profession, Service)...');

  // Need admin token for setup
  require('dotenv').config({ path: __dirname + '/.env' });
  const jwt = require('jsonwebtoken');
  const adminToken = jwt.sign(
    { id: 1, email: 'admin@timefill.local', role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Create test field (or use existing)
  let field = await request('POST', '/api/admin/fields', {
    name: 'Test_Field_Registration',
    nameHebrew: 'שדה רישום',
    displayOrder: 9999
  }, adminToken);

  if (field.status === 201) {
    fieldId = field.data.id;
    console.log(`  Created test field ID: ${fieldId}`);
  } else if (field.status === 400 && field.data.error?.includes('already exists')) {
    // Fetch existing field
    const fields = await request('GET', '/api/admin/fields', null, adminToken);
    const existing = fields.data.find(f => f.name === 'Test_Field_Registration');
    if (existing) {
      fieldId = existing.id;
      console.log(`  Using existing test field ID: ${fieldId}`);
    } else {
      console.error('Failed to create or find test field');
      process.exit(1);
    }
  } else {
    console.error('Failed to create test field:', field);
    process.exit(1);
  }

  // Create test profession (or use existing)
  let profession = await request('POST', '/api/admin/professions', {
    fieldId,
    name: 'Test_Profession_Registration',
    nameHebrew: 'מקצוע רישום',
    displayOrder: 9999
  }, adminToken);

  if (profession.status === 201) {
    professionId = profession.data.id;
    console.log(`  Created test profession ID: ${professionId}`);
  } else if (profession.status === 400 && profession.data.error?.includes('already exists')) {
    // Fetch existing profession
    const professions = await request('GET', '/api/admin/professions', null, adminToken);
    const existing = professions.data.find(p => p.name === 'Test_Profession_Registration');
    if (existing) {
      professionId = existing.id;
      console.log(`  Using existing test profession ID: ${professionId}`);
    } else {
      console.error('Failed to create or find test profession');
      process.exit(1);
    }
  } else {
    console.error('Failed to create test profession:', profession);
    process.exit(1);
  }

  // Create test service (or use existing)
  let service = await request('POST', '/api/admin/service-templates', {
    professionId,
    name: 'Test_Service_Registration',
    nameHebrew: 'שירות רישום',
    defaultDurationMinutes: 30,
    defaultPrice: 100,
    displayOrder: 9999
  }, adminToken);

  if (service.status === 201) {
    serviceTemplateId = service.data.id;
    console.log(`  Created test service ID: ${serviceTemplateId}`);
  } else if (service.status === 400 && service.data.error?.includes('already exists')) {
    // Fetch existing service
    const services = await request('GET', '/api/admin/service-templates', null, adminToken);
    const existing = services.data.find(s => s.name === 'Test_Service_Registration');
    if (existing) {
      serviceTemplateId = existing.id;
      console.log(`  Using existing test service ID: ${serviceTemplateId}`);
    } else {
      console.error('Failed to create or find test service');
      process.exit(1);
    }
  } else {
    console.error('Failed to create test service:', service);
    process.exit(1);
  }

  console.log(`  Test data ready: Field=${fieldId}, Profession=${professionId}, Service=${serviceTemplateId}`);
  console.log('');
}

async function cleanupTestData() {
  console.log('Cleaning up test data...');

  require('dotenv').config({ path: __dirname + '/.env' });
  const jwt = require('jsonwebtoken');
  const adminToken = jwt.sign(
    { id: 1, email: 'admin@timefill.local', role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Delete in reverse order
  if (serviceTemplateId) {
    await request('DELETE', `/api/admin/service-templates/${serviceTemplateId}`, null, adminToken);
  }
  if (professionId) {
    await request('DELETE', `/api/admin/professions/${professionId}`, null, adminToken);
  }
  if (fieldId) {
    await request('DELETE', `/api/admin/fields/${fieldId}`, null, adminToken);
  }

  console.log('Cleanup complete');
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Phase 3 - Service Provider Registration Tests');
  console.log('='.repeat(60));
  console.log('');

  await setupTestData();

  // Test 1: Successful registration
  console.log('Test 1: Successful registration');
  const timestamp = Date.now();
  const registration = await request('POST', '/api/register/service-provider', {
    email: `test-${timestamp}@registration.test`,
    password: 'SecurePass123!',
    serviceProviderName: 'John Doe',
    businessName: 'Test Business Registration',
    businessIdentificationNumber: `BIZ${timestamp}`,
    phone: `05012${timestamp.toString().slice(-5)}`,
    address: '123 Test St',
    city: 'Tel Aviv',
    fieldIds: [fieldId],
    professionIds: [professionId],
    serviceTemplateIds: [serviceTemplateId]
  });

  if (registration.status === 201 && registration.data.data.businessId) {
    registeredUserId = registration.data.data.userId;
    registeredBusinessId = registration.data.data.businessId;
    pass(`Registration successful - Business ID: ${registeredBusinessId}`);

    // Get auth token for registered user
    require('dotenv').config({ path: __dirname + '/.env' });
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { id: registeredUserId, email: registration.data.data.email, role: 'SERVICE_PROVIDER' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  } else {
    fail(`Registration failed: ${JSON.stringify(registration)}`);
  }

  // Test 2: Duplicate email rejection
  console.log('Test 2: Duplicate email rejection');
  if (registeredUserId) {
    // Try to register with same email from Test 1
    const duplicateAttempt = await request('POST', '/api/register/service-provider', {
      email: `test-${timestamp}@registration.test`,  // Same email as Test 1
      password: 'AnotherPass456!',
      serviceProviderName: 'Duplicate User',
      businessName: 'Duplicate Business',
      businessIdentificationNumber: '111111111',
      phone: `05099${timestamp.toString().slice(-5)}`,  // Different phone
      address: '456 Test Ave',
      city: 'Tel Aviv',
      fieldIds: [fieldId],
      professionIds: [professionId],
      serviceTemplateIds: [serviceTemplateId]
    });

    if (duplicateAttempt.status === 400 && duplicateAttempt.data.error.includes('already registered')) {
      pass('Duplicate email rejected');
    } else {
      fail(`Duplicate email NOT rejected: ${JSON.stringify(duplicateAttempt)}`);
    }
  } else {
    fail('Skipped - Test 1 failed');
  }

  // Test 3: Invalid hierarchy (service doesn't belong to profession)
  console.log('Test 3: Invalid hierarchy rejection');

  // Create another field+profession that's not related to our service
  require('dotenv').config({ path: __dirname + '/.env' });
  const jwt = require('jsonwebtoken');
  const adminToken = jwt.sign(
    { id: 1, email: 'admin@timefill.local', role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const otherField = await request('POST', '/api/admin/fields', {
    name: 'Other_Field_Test',
    nameHebrew: 'שדה אחר',
    displayOrder: 9998
  }, adminToken);

  const otherProfession = await request('POST', '/api/admin/professions', {
    fieldId: otherField.data.id,
    name: 'Other_Profession_Test',
    nameHebrew: 'מקצוע אחר',
    displayOrder: 9998
  }, adminToken);

  const invalidHierarchy = await request('POST', '/api/register/service-provider', {
    email: `test-invalid-${Date.now()}@registration.test`,
    password: 'SecurePass123!',
    serviceProviderName: 'Invalid User',
    businessName: 'Invalid Hierarchy Business',
    businessIdentificationNumber: '222222222',
    phone: '0502222222',
    fieldIds: [otherField.data.id],
    professionIds: [otherProfession.data.id],
    serviceTemplateIds: [serviceTemplateId]  // This service doesn't belong to otherProfession
  });

  if (invalidHierarchy.status === 400 && invalidHierarchy.data.error === 'Invalid hierarchy') {
    pass('Invalid hierarchy rejected');
  } else {
    fail(`Invalid hierarchy NOT rejected: ${JSON.stringify(invalidHierarchy)}`);
  }

  // Cleanup extra test data
  await request('DELETE', `/api/admin/professions/${otherProfession.data.id}`, null, adminToken);
  await request('DELETE', `/api/admin/fields/${otherField.data.id}`, null, adminToken);

  // Test 4: Invalid service ID
  console.log('Test 4: Invalid service ID rejection');
  const invalidService = await request('POST', '/api/register/service-provider', {
    email: `test-invalid-service-${Date.now()}@registration.test`,
    password: 'SecurePass123!',
    serviceProviderName: 'Invalid Service User',
    businessName: 'Invalid Service Business',
    businessIdentificationNumber: '333333333',
    phone: '0503333333',
    fieldIds: [fieldId],
    professionIds: [professionId],
    serviceTemplateIds: [99999]  // Non-existent service
  });

  if (invalidService.status === 400) {
    pass('Invalid service ID rejected');
  } else {
    fail(`Invalid service ID NOT rejected: ${JSON.stringify(invalidService)}`);
  }

  // Test 5: Duplicate service selection
  console.log('Test 5: Duplicate service selection rejection');
  const ts5 = Date.now();
  const duplicateService = await request('POST', '/api/register/service-provider', {
    email: `test-dup-service-${ts5}@registration.test`,
    password: 'SecurePass123!',
    serviceProviderName: 'Duplicate Service User',
    businessName: 'Duplicate Service Business',
    businessIdentificationNumber: '444444444',
    phone: `05044${ts5.toString().slice(-5)}`,
    fieldIds: [fieldId],
    professionIds: [professionId],
    serviceTemplateIds: [serviceTemplateId, serviceTemplateId]  // Same service twice
  });

  if (duplicateService.status === 400 && duplicateService.data.error.includes('Duplicate services')) {
    pass('Duplicate service selection rejected');
  } else {
    fail(`Duplicate service NOT rejected: ${JSON.stringify(duplicateService)}`);
  }

  // Test 6: Get registration status
  console.log('Test 6: Get registration status');
  if (authToken) {
    const status = await request('GET', '/api/register/service-provider/status', null, authToken);

    if (status.status === 200 && status.data.status === 'PENDING_APPROVAL') {
      pass(`Registration status retrieved: ${status.data.status}`);
    } else {
      fail(`Status retrieval failed: ${JSON.stringify(status)}`);
    }
  } else {
    fail('No auth token available for status check');
  }

  // Test 7: Submit suggestion request
  console.log('Test 7: Submit suggestion request');
  if (authToken) {
    const suggestion = await request('POST', '/api/register/suggestion', {
      userId: registeredUserId,
      type: 'SERVICE',
      name: 'New Service Suggestion',
      description: 'This is a test suggestion',
      parentProfessionId: professionId
    }, authToken);

    if (suggestion.status === 201 && suggestion.data.data.suggestionId) {
      pass(`Suggestion created: ID ${suggestion.data.data.suggestionId}`);
    } else {
      fail(`Suggestion creation failed: ${JSON.stringify(suggestion)}`);
    }
  } else {
    fail('No auth token available for suggestion');
  }

  // Test 8: Update registration
  console.log('Test 8: Update registration');
  if (authToken) {
    const update = await request('PATCH', '/api/register/service-provider', {
      businessName: 'Updated Business Name',
      phone: '0505555555'
    }, authToken);

    if (update.status === 200) {
      pass('Registration updated successfully');
    } else {
      fail(`Update failed: ${JSON.stringify(update)}`);
    }
  } else {
    fail('No auth token available for update');
  }

  // Test 9: Missing required fields
  console.log('Test 9: Missing required fields rejection');
  const missingFields = await request('POST', '/api/register/service-provider', {
    email: `test-missing-${Date.now()}@registration.test`,
    password: 'SecurePass123!'
    // Missing other required fields
  });

  if (missingFields.status === 400) {
    pass('Missing required fields rejected');
  } else {
    fail(`Missing fields NOT rejected: ${JSON.stringify(missingFields)}`);
  }

  await cleanupTestData();

  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('Test Results');
  console.log('='.repeat(60));
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('✓ ALL TESTS PASSED');
    process.exit(0);
  } else {
    console.log('✗ SOME TESTS FAILED');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
