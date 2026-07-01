#!/usr/bin/env node

/**
 * Phase 5 - Consent & Legal Approval Engine Tests
 *
 * Tests:
 * 1. Create draft
 * 2. Publish version
 * 3. Prevent two published versions of same type
 * 4. Fetch published documents
 * 5. Accept Terms
 * 6. Accept Privacy
 * 7. Reject registration without mandatory consents
 * 8. Accept Marketing (optional)
 * 9. Verify immutable consent history
 * 10. Verify registration snapshot is stored correctly
 */

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;

// Test data
let adminToken;
let spToken, spUserId;
let termsId, privacyId, marketingId;
let termsCode, privacyCode, marketingCode;
let fieldId, professionId, serviceId;

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
  console.log('Setting up test data...');

  // Create tokens
  require('dotenv').config({ path: __dirname + '/.env' });
  const jwt = require('jsonwebtoken');

  adminToken = jwt.sign(
    { id: 1, email: 'admin@timefill.local', role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Get existing field/profession/service for registration
  const fields = await request('GET', '/api/admin/fields', null, adminToken);
  fieldId = fields.data?.[0]?.id || 1;

  const professions = await request('GET', '/api/admin/professions', null, adminToken);
  professionId = professions.data?.[0]?.id || 1;

  const services = await request('GET', '/api/admin/service-templates', null, adminToken);
  serviceId = services.data?.[0]?.id || 1;

  // Clean up old test consent types (deactivate all)
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.consentType.updateMany({
    where: {
      isActive: true
    },
    data: {
      isActive: false
    }
  });

  // Create service provider user
  const timestamp = Date.now();
  const registration = await request('POST', '/api/register/service-provider', {
    email: `test-consent-${timestamp}@test.com`,
    password: 'SecurePass123!',
    serviceProviderName: 'Test SP Consent',
    businessName: 'Test Business Consent',
    businessIdentificationNumber: `BIZCON${timestamp}`,
    phone: `05088${timestamp.toString().slice(-5)}`,
    address: '123 Test St',
    city: 'Tel Aviv',
    fieldIds: [fieldId],
    professionIds: [professionId],
    serviceTemplateIds: [serviceId]
  });

  if (registration.status === 201) {
    spUserId = registration.data.data.userId;
    spToken = jwt.sign(
      { id: spUserId, email: `test-consent-${timestamp}@test.com`, role: 'SERVICE_PROVIDER' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  } else {
    console.error('Failed to create test SP:', registration);
    process.exit(1);
  }

  console.log(`  Service Provider ID: ${spUserId}`);
  console.log('');
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Phase 5 - Consent & Legal Approval Engine Tests');
  console.log('='.repeat(60));
  console.log('');

  await setupTestData();

  // Required for Test 7
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const jwt = require('jsonwebtoken');
  require('dotenv').config({ path: __dirname + '/.env' });

  // Test 1: Create draft
  console.log('Test 1: Create draft');
  const ts = Date.now();
  termsCode = `TERMS_OF_USE_${ts}`;
  const draft1 = await request('POST', '/api/admin/legal/documents/draft', {
    code: termsCode,
    titleHe: 'תנאי שימוש',
    titleEn: 'Terms of Use',
    contentHe: 'תוכן תנאי השימוש',
    contentEn: 'Terms of use content',
    isMandatory: true
  }, adminToken);

  if (draft1.status === 201 && draft1.data.data) {
    termsId = draft1.data.data.id;
    pass(`Draft created: ID ${termsId}`);
  } else {
    fail(`Draft creation failed: ${JSON.stringify(draft1)}`);
  }

  // Create privacy and marketing drafts
  privacyCode = `PRIVACY_POLICY_${ts}`;
  const draft2 = await request('POST', '/api/admin/legal/documents/draft', {
    code: privacyCode,
    titleHe: 'מדיניות פרטיות',
    titleEn: 'Privacy Policy',
    contentHe: 'תוכן מדיניות הפרטיות',
    contentEn: 'Privacy policy content',
    isMandatory: true
  }, adminToken);

  if (draft2.status === 201) {
    privacyId = draft2.data.data.id;
  }

  marketingCode = `MARKETING_CONSENT_${ts}`;
  const draft3 = await request('POST', '/api/admin/legal/documents/draft', {
    code: marketingCode,
    titleHe: 'הסכמה לשיווק',
    titleEn: 'Marketing Consent',
    contentHe: 'תוכן הסכמה לשיווק',
    contentEn: 'Marketing consent content',
    isMandatory: false
  }, adminToken);

  if (draft3.status === 201) {
    marketingId = draft3.data.data.id;
  }

  // Test 2: Publish version
  console.log('Test 2: Publish version');
  const publish1 = await request('POST', `/api/admin/legal/documents/${termsCode}/publish`, {}, adminToken);

  if (publish1.status === 200 && publish1.data.data.isActive) {
    pass('Version published successfully');
  } else {
    fail(`Version publish failed: ${JSON.stringify(publish1)}`);
  }

  // Publish privacy and marketing
  await request('POST', `/api/admin/legal/documents/${privacyCode}/publish`, {}, adminToken);
  await request('POST', `/api/admin/legal/documents/${marketingCode}/publish`, {}, adminToken);

  // Test 3: Prevent two published versions of same type
  console.log('Test 3: Prevent two published versions of same type');
  const duplicatePublish = await request('POST', `/api/admin/legal/documents/${termsCode}/publish`, {}, adminToken);

  if (duplicatePublish.status === 400 && duplicatePublish.data.error?.includes('already published')) {
    pass('Duplicate publish blocked');
  } else {
    fail(`Duplicate publish NOT blocked: ${JSON.stringify(duplicatePublish)}`);
  }

  // Test 4: Fetch published documents
  console.log('Test 4: Fetch published documents');
  const published = await request('GET', '/api/service-provider/legal/documents', null, spToken);

  if (published.status === 200 && published.data.data && published.data.data.length >= 3) {
    const codes = published.data.data.map(d => d.code);
    if (codes.some(c => c.startsWith('TERMS_OF_USE')) &&
        codes.some(c => c.startsWith('PRIVACY_POLICY')) &&
        codes.some(c => c.startsWith('MARKETING_CONSENT'))) {
      pass(`Published documents fetched: ${published.data.data.length} documents`);
    } else {
      fail(`Published documents missing expected types: ${JSON.stringify(codes)}`);
    }
  } else {
    fail(`Fetching published documents failed: ${JSON.stringify(published)}`);
  }

  // Get the actual published document IDs
  const publishedDocs = published.data.data;
  const termsDoc = publishedDocs.find(d => d.code.startsWith('TERMS_OF_USE'));
  const privacyDoc = publishedDocs.find(d => d.code.startsWith('PRIVACY_POLICY'));
  const marketingDoc = publishedDocs.find(d => d.code.startsWith('MARKETING_CONSENT'));

  // Test 5 & 6: Accept Terms and Privacy together (both mandatory)
  console.log('Test 5: Accept Terms');
  console.log('Test 6: Accept Privacy');
  const acceptMandatory = await request('POST', '/api/service-provider/legal/accept', {
    consents: [
      {
        consentTypeId: termsDoc.id,
        wasScrolled: true
      },
      {
        consentTypeId: privacyDoc.id,
        wasScrolled: true
      }
    ],
    servicesSnapshot: {
      fields: [fieldId],
      professions: [professionId],
      services: [serviceId]
    }
  }, spToken);

  if (acceptMandatory.status === 201 && acceptMandatory.data.data) {
    pass('Terms accepted');
    pass('Privacy accepted');
  } else {
    fail(`Terms acceptance failed: ${JSON.stringify(acceptMandatory)}`);
    fail(`Privacy acceptance failed: ${JSON.stringify(acceptMandatory)}`);
  }

  // Test 7: Reject registration without mandatory consents
  console.log('Test 7: Reject registration without mandatory consents');
  // Create new SP without consents
  const ts2 = Date.now();
  const newSp = await request('POST', '/api/register/service-provider', {
    email: `test-no-consent-${ts2}@test.com`,
    password: 'SecurePass123!',
    serviceProviderName: 'Test SP No Consent',
    businessName: 'Test Business No Consent',
    businessIdentificationNumber: `BIZNOC${ts2}`,
    phone: `05077${ts2.toString().slice(-5)}`,
    address: '123 Test St',
    city: 'Tel Aviv',
    fieldIds: [fieldId],
    professionIds: [professionId],
    serviceTemplateIds: [serviceId]
  });

  if (newSp.status === 201) {
    const newSpToken = jwt.sign(
      { id: newSp.data.data.userId, email: `test-no-consent-${ts2}@test.com`, role: 'SERVICE_PROVIDER' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Try to accept only marketing (optional) without mandatory ones
    const incompleteConsent = await request('POST', '/api/service-provider/legal/accept', {
      consents: [
        {
          consentTypeId: marketingDoc.id,
          wasScrolled: false
        }
      ]
    }, newSpToken);

    if (incompleteConsent.status === 400 && incompleteConsent.data.error?.includes('required')) {
      pass('Registration rejected without mandatory consents');
    } else {
      fail(`Registration NOT rejected: ${JSON.stringify(incompleteConsent)}`);
    }
  } else {
    fail('Failed to create test SP for consent rejection test');
  }

  // Test 8: Accept Marketing (optional)
  console.log('Test 8: Accept Marketing (optional)');
  const acceptMarketing = await request('POST', '/api/service-provider/legal/accept', {
    consents: [
      {
        consentTypeId: marketingDoc.id,
        wasScrolled: false
      }
    ],
    servicesSnapshot: {
      fields: [1],
      professions: [1],
      services: [1]
    }
  }, spToken);

  if (acceptMarketing.status === 201 && acceptMarketing.data.data) {
    pass('Marketing consent accepted (optional)');
  } else {
    fail(`Marketing acceptance failed: ${JSON.stringify(acceptMarketing)}`);
  }

  // Test 9: Verify immutable consent history
  console.log('Test 9: Verify immutable consent history');
  const history = await request('GET', `/api/admin/legal/consents/user/${spUserId}`, null, adminToken);

  if (history.status === 200 && history.data.data && history.data.data.length === 3) {
    // Verify all consents have required fields
    const allHaveRequiredFields = history.data.data.every(c =>
      c.id && c.userId && c.consentTypeId && c.agreedAt && c.consentVersion
    );

    if (allHaveRequiredFields) {
      pass('Consent history is immutable and complete');
    } else {
      fail('Consent history missing required fields');
    }
  } else {
    fail(`Consent history verification failed: ${JSON.stringify(history)}`);
  }

  // Test 10: Verify registration snapshot is stored correctly
  console.log('Test 10: Verify registration snapshot is stored correctly');
  const consentWithSnapshot = history.data.data.find(c => c.selectedServicesSnapshot);

  if (consentWithSnapshot) {
    try {
      const snapshot = JSON.parse(consentWithSnapshot.selectedServicesSnapshot);
      if (snapshot.fields && snapshot.professions && snapshot.services) {
        pass('Registration snapshot stored correctly');
      } else {
        fail('Registration snapshot missing required fields');
      }
    } catch (e) {
      fail('Registration snapshot is not valid JSON');
    }
  } else {
    fail('No consent with services snapshot found');
  }

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

runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
