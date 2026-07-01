#!/usr/bin/env node

/**
 * Phase 4 - Document Engine Tests
 *
 * Tests:
 * 1. Admin creates DocumentType
 * 2. Admin adds requirement to ServiceTemplate
 * 3. Duplicate requirement is blocked
 * 4. Service Provider fetches required documents
 * 5. Service Provider uploads a document
 * 6. Same uploaded document is reused across multiple services
 * 7. Admin approves document
 * 8. Admin rejects document with note
 * 9. Computed document status (missing/pending/complete)
 */

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;

// Test data IDs
let adminToken;
let spToken;
let documentTypeId1, documentTypeId2;
let serviceTemplateId1, serviceTemplateId2;
let requirementId1, requirementId2, requirementId3;
let businessId, spUserId;
let uploadedDocumentId1, uploadedDocumentId2;

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

  // Create admin token
  require('dotenv').config({ path: __dirname + '/.env' });
  const jwt = require('jsonwebtoken');
  adminToken = jwt.sign(
    { id: 1, email: 'admin@timefill.local', role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Get or create test field and profession
  const fields = await request('GET', '/api/admin/fields', null, adminToken);
  let fieldId = fields.data?.[0]?.id;

  if (!fieldId) {
    const field = await request('POST', '/api/admin/fields', {
      name: 'Test_Field_Docs',
      nameHebrew: 'שדה מסמכים',
      displayOrder: 9999
    }, adminToken);
    fieldId = field.data.id;
  }

  const professions = await request('GET', '/api/admin/professions', null, adminToken);
  let professionId = professions.data?.find(p => p.fieldId === fieldId)?.id;

  if (!professionId) {
    const profession = await request('POST', '/api/admin/professions', {
      fieldId: fieldId,
      name: 'Test_Profession_Docs',
      nameHebrew: 'מקצוע מסמכים',
      displayOrder: 9999
    }, adminToken);
    professionId = profession.data.id;
  }

  // Create two service templates for testing
  const service1 = await request('POST', '/api/admin/service-templates', {
    professionId: professionId,
    name: 'Test_Service_Doc_1',
    nameHebrew: 'שירות מסמכים 1',
    defaultDurationMinutes: 30,
    defaultPrice: 100,
    displayOrder: 9999
  }, adminToken);

  const service2 = await request('POST', '/api/admin/service-templates', {
    professionId: professionId,
    name: 'Test_Service_Doc_2',
    nameHebrew: 'שירות מסמכים 2',
    defaultDurationMinutes: 45,
    defaultPrice: 150,
    displayOrder: 9998
  }, adminToken);

  if (service1.status === 201) {
    serviceTemplateId1 = service1.data.id;
  } else if (service1.status === 400 && service1.data.error?.includes('already exists')) {
    const services = await request('GET', '/api/admin/service-templates', null, adminToken);
    serviceTemplateId1 = services.data.find(s => s.name === 'Test_Service_Doc_1')?.id;
  }

  if (service2.status === 201) {
    serviceTemplateId2 = service2.data.id;
  } else if (service2.status === 400 && service2.data.error?.includes('already exists')) {
    const services = await request('GET', '/api/admin/service-templates', null, adminToken);
    serviceTemplateId2 = services.data.find(s => s.name === 'Test_Service_Doc_2')?.id;
  }

  // Create service provider with business
  const timestamp = Date.now();
  const registration = await request('POST', '/api/register/service-provider', {
    email: `test-doc-${timestamp}@test.com`,
    password: 'SecurePass123!',
    serviceProviderName: 'Test SP Documents',
    businessName: 'Test Business Documents',
    businessIdentificationNumber: `BIZDOC${timestamp}`,
    phone: `05099${timestamp.toString().slice(-5)}`,
    address: '123 Test St',
    city: 'Tel Aviv',
    fieldIds: [fieldId],
    professionIds: [professionId],
    serviceTemplateIds: [serviceTemplateId1]
  });

  if (registration.status !== 201) {
    console.error('Failed to create test service provider:', registration);
    process.exit(1);
  }

  spUserId = registration.data.data.userId;
  businessId = registration.data.data.businessId;

  spToken = jwt.sign(
    { id: spUserId, email: `test-doc-${timestamp}@test.com`, role: 'SERVICE_PROVIDER' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Add second service template to the business
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  await prisma.businessService.create({
    data: {
      businessId: businessId,
      serviceTemplateId: serviceTemplateId2,
      name: 'Test_Service_Doc_2',
      description: 'Test',
      durationMinutes: 45,
      regularPrice: 150,
      approvalStatus: 'PENDING'
    }
  });

  // Clean up old requirements from these service templates (from previous test runs)
  await prisma.serviceDocumentRequirement.deleteMany({
    where: {
      serviceTemplateId: {
        in: [serviceTemplateId1, serviceTemplateId2]
      }
    }
  });

  console.log(`  Service Provider ID: ${spUserId}`);
  console.log(`  Business ID: ${businessId}`);
  console.log(`  Service Template 1 ID: ${serviceTemplateId1}`);
  console.log(`  Service Template 2 ID: ${serviceTemplateId2}`);
  console.log('');
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Phase 4 - Document Engine Tests');
  console.log('='.repeat(60));
  console.log('');

  await setupTestData();

  // Test 1: Admin creates DocumentType
  console.log('Test 1: Admin creates DocumentType');
  const ts = Date.now();
  const docType1 = await request('POST', '/api/admin/documents/document-types', {
    name: `Test_Business_License_${ts}`,
    nameHebrew: 'רישיון עסק',
    description: 'Business license document',
    acceptedFormats: ['.pdf', '.jpg'],
    maxSizeKB: 5000
  }, adminToken);

  if (docType1.status === 201 && docType1.data.data) {
    documentTypeId1 = docType1.data.data.id;
    pass(`DocumentType created: ID ${documentTypeId1}`);
  } else {
    fail(`DocumentType creation failed: ${JSON.stringify(docType1)}`);
  }

  // Create second document type for reuse test
  const docType2 = await request('POST', '/api/admin/documents/document-types', {
    name: `Test_Insurance_Certificate_${ts}`,
    nameHebrew: 'אישור ביטוח',
    description: 'Insurance certificate',
    acceptedFormats: ['.pdf'],
    maxSizeKB: 3000
  }, adminToken);

  if (docType2.status === 201) {
    documentTypeId2 = docType2.data.data.id;
  }

  // Test 2: Admin adds requirement to ServiceTemplate
  console.log('Test 2: Admin adds requirement to ServiceTemplate');
  const req1 = await request('POST', `/api/admin/documents/service-templates/${serviceTemplateId1}/requirements`, {
    documentTypeId: documentTypeId1,
    instruction: 'Please upload a valid business license'
  }, adminToken);

  if (req1.status === 201 && req1.data.data) {
    requirementId1 = req1.data.data.id;
    pass(`Requirement added to service template 1: ID ${requirementId1}`);
  } else {
    fail(`Adding requirement failed: ${JSON.stringify(req1)}`);
  }

  // Add same document type to service template 2 (for reuse test)
  const req2 = await request('POST', `/api/admin/documents/service-templates/${serviceTemplateId2}/requirements`, {
    documentTypeId: documentTypeId1,
    instruction: 'Business license required for this service too'
  }, adminToken);

  if (req2.status === 201) {
    requirementId2 = req2.data.data.id;
  }

  // Add different document type to service template 2
  const req3 = await request('POST', `/api/admin/documents/service-templates/${serviceTemplateId2}/requirements`, {
    documentTypeId: documentTypeId2,
    instruction: 'Insurance certificate required'
  }, adminToken);

  if (req3.status === 201) {
    requirementId3 = req3.data.data.id;
  }

  // Test 3: Duplicate requirement is blocked
  console.log('Test 3: Duplicate requirement is blocked');
  const duplicateReq = await request('POST', `/api/admin/documents/service-templates/${serviceTemplateId1}/requirements`, {
    documentTypeId: documentTypeId1,
    instruction: 'Trying to add same document type again'
  }, adminToken);

  if (duplicateReq.status === 400 && duplicateReq.data.error?.includes('already required')) {
    pass('Duplicate requirement blocked');
  } else {
    fail(`Duplicate requirement NOT blocked: ${JSON.stringify(duplicateReq)}`);
  }

  // Test 4: Service Provider fetches required documents
  console.log('Test 4: Service Provider fetches required documents');
  const requiredDocs = await request('GET', '/api/service-provider/documents/required-documents', null, spToken);

  if (requiredDocs.status === 200 && requiredDocs.data.data) {
    // Should have our 2 new document types required (may have more from previous test runs)
    const docTypeIds = requiredDocs.data.data.map(d => d.documentType.id);
    if (docTypeIds.includes(documentTypeId1) && docTypeIds.includes(documentTypeId2)) {
      pass(`Required documents fetched: includes both new document types`);
    } else {
      fail(`Required documents missing new IDs: expected ${documentTypeId1} and ${documentTypeId2}, got ${JSON.stringify(docTypeIds)}`);
    }
  } else {
    fail(`Fetching required documents failed: ${JSON.stringify(requiredDocs)}`);
  }

  // Test 5: Service Provider uploads a document
  console.log('Test 5: Service Provider uploads a document');
  const upload1 = await request('POST', '/api/service-provider/documents/upload', {
    documentTypeId: documentTypeId1,
    fileName: 'business_license.pdf',
    fileUrl: 'https://placeholder.com/business_license.pdf',
    fileSizeKB: 1500
  }, spToken);

  if (upload1.status === 201 && upload1.data.data) {
    uploadedDocumentId1 = upload1.data.data.id;
    pass(`Document uploaded: ID ${uploadedDocumentId1}`);
  } else {
    fail(`Document upload failed: ${JSON.stringify(upload1)}`);
  }

  // Test 6: Same uploaded document is reused across multiple services
  console.log('Test 6: Same uploaded document is reused across multiple services');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const linkedServices = await prisma.businessServiceDocument.findMany({
    where: { uploadedDocumentId: uploadedDocumentId1 },
    include: {
      businessService: true
    }
  });

  if (linkedServices.length === 2) {
    pass(`Document reused across ${linkedServices.length} services`);
  } else {
    fail(`Document NOT reused correctly: linked to ${linkedServices.length} services, expected 2`);
  }

  // Upload second document for status test
  const upload2 = await request('POST', '/api/service-provider/documents/upload', {
    documentTypeId: documentTypeId2,
    fileName: 'insurance.pdf',
    fileUrl: 'https://placeholder.com/insurance.pdf',
    fileSizeKB: 800
  }, spToken);

  if (upload2.status === 201) {
    uploadedDocumentId2 = upload2.data.data.id;
  }

  // Test 7: Admin approves document
  console.log('Test 7: Admin approves document');
  const approve = await request('POST', `/api/admin/documents/uploaded-documents/${uploadedDocumentId1}/approve`, {}, adminToken);

  if (approve.status === 200 && approve.data.data.status === 'APPROVED') {
    pass('Document approved by admin');
  } else {
    fail(`Document approval failed: ${JSON.stringify(approve)}`);
  }

  // Test 8: Admin rejects document with note
  console.log('Test 8: Admin rejects document with note');
  const reject = await request('POST', `/api/admin/documents/uploaded-documents/${uploadedDocumentId2}/reject`, {
    adminNotes: 'Insurance certificate is expired'
  }, adminToken);

  if (reject.status === 200 && reject.data.data.status === 'REJECTED' && reject.data.data.adminNotes) {
    pass('Document rejected with note by admin');
  } else {
    fail(`Document rejection failed: ${JSON.stringify(reject)}`);
  }

  // Test 9: Computed document status
  console.log('Test 9: Computed document status');

  // Test 9a: Status with rejected doc should be INCOMPLETE
  const status1 = await request('GET', '/api/service-provider/documents/status', null, spToken);

  if (status1.status === 200 && status1.data.data.status === 'נדרש להשלים העלאת מסמכים') {
    pass(`Status with rejected doc: ${status1.data.data.status}`);
  } else {
    fail(`Status wrong: ${JSON.stringify(status1)}`);
  }

  // Re-upload rejected document
  await prisma.uploadedDocument.delete({ where: { id: uploadedDocumentId2 } });
  const reupload = await request('POST', '/api/service-provider/documents/upload', {
    documentTypeId: documentTypeId2,
    fileName: 'insurance_new.pdf',
    fileUrl: 'https://placeholder.com/insurance_new.pdf',
    fileSizeKB: 900
  }, spToken);

  if (reupload.status === 201) {
    uploadedDocumentId2 = reupload.data.data.id;
  }

  // Test 9b: Status with pending doc should be UNDER_REVIEW
  const status2 = await request('GET', '/api/service-provider/documents/status', null, spToken);

  if (status2.status === 200 && status2.data.data.status === 'העלאת מסמכים בבדיקה') {
    pass(`Status with pending doc: ${status2.data.data.status}`);
  } else {
    fail(`Status wrong: ${JSON.stringify(status2)}`);
  }

  // Approve second document
  await request('POST', `/api/admin/documents/uploaded-documents/${uploadedDocumentId2}/approve`, {}, adminToken);

  // Test 9c: Status with all approved should be COMPLETE
  const status3 = await request('GET', '/api/service-provider/documents/status', null, spToken);

  if (status3.status === 200 && status3.data.data.status === 'העלאת מסמכים הושלמה') {
    pass(`Status with all approved: ${status3.data.data.status}`);
  } else {
    fail(`Status wrong: ${JSON.stringify(status3)}`);
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
