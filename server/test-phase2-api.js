#!/usr/bin/env node

/**
 * Phase 2 QA - Real API Tests
 * Tests case-insensitive duplicate detection and whitespace normalization
 */

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0aW1lZmlsbC5sb2NhbCIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc4MjkxMzI5MiwiZXhwIjoxNzgyOTk5NjkyfQ.uIm0XVHeJ1uqSJ3RUcjfIOlLfffpgohV_aQu8ZhUimg';
const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;
let fieldId, profId, svcId;

async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
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

async function runTests() {
  console.log('='.repeat(60));
  console.log('Phase 2 QA - Real API Tests');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Create Field
  console.log('Test 1: Create Field');
  const field = await request('POST', '/api/admin/fields', {
    name: 'QATestField',
    nameHebrew: 'בדיקה',
    displayOrder: 999
  });

  if (field.status === 201 && field.data.id) {
    fieldId = field.data.id;
    pass(`Field created with ID ${fieldId}`);
  } else {
    fail(`Field creation failed: ${JSON.stringify(field)}`);
    process.exit(1);
  }

  // Test 2: Exact duplicate - should fail
  console.log('Test 2: Duplicate (exact case)');
  const dup1 = await request('POST', '/api/admin/fields', {
    name: 'QATestField',
    nameHebrew: 'בדיקה2'
  });

  if (dup1.status === 400 && dup1.data.error.includes('already exists')) {
    pass('Exact case duplicate blocked');
  } else {
    fail(`Exact case duplicate NOT blocked: ${JSON.stringify(dup1)}`);
  }

  // Test 3: Lowercase duplicate - should fail
  console.log('Test 3: Duplicate (lowercase)');
  const dup2 = await request('POST', '/api/admin/fields', {
    name: 'qatestfield',
    nameHebrew: 'בדיקה3'
  });

  if (dup2.status === 400 && dup2.data.error.includes('already exists')) {
    pass('Case-insensitive duplicate blocked (lowercase)');
  } else {
    fail(`Lowercase duplicate NOT blocked: ${JSON.stringify(dup2)}`);
  }

  // Test 4: Uppercase duplicate - should fail
  console.log('Test 4: Duplicate (uppercase)');
  const dup3 = await request('POST', '/api/admin/fields', {
    name: 'QATESTFIELD',
    nameHebrew: 'בדיקה4'
  });

  if (dup3.status === 400 && dup3.data.error.includes('already exists')) {
    pass('Case-insensitive duplicate blocked (uppercase)');
  } else {
    fail(`Uppercase duplicate NOT blocked: ${JSON.stringify(dup3)}`);
  }

  // Test 5: Whitespace duplicate - should fail
  console.log('Test 5: Duplicate (whitespace)');
  const dup4 = await request('POST', '/api/admin/fields', {
    name: '  QATestField  ',
    nameHebrew: 'בדיקה5'
  });

  if (dup4.status === 400 && dup4.data.error.includes('already exists')) {
    pass('Whitespace-normalized duplicate blocked');
  } else {
    fail(`Whitespace duplicate NOT blocked: ${JSON.stringify(dup4)}`);
  }

  // Test 6: Create Profession
  console.log('Test 6: Create Profession');
  const prof = await request('POST', '/api/admin/professions', {
    fieldId,
    name: 'QATestProf',
    nameHebrew: 'מקצוע',
    displayOrder: 999
  });

  if (prof.status === 201 && prof.data.id) {
    profId = prof.data.id;
    pass(`Profession created with ID ${profId}`);
  } else {
    fail(`Profession creation failed: ${JSON.stringify(prof)}`);
    process.exit(1);
  }

  // Test 7: Profession duplicate (lowercase)
  console.log('Test 7: Profession duplicate (lowercase)');
  const profDup = await request('POST', '/api/admin/professions', {
    fieldId,
    name: 'qatestprof',
    nameHebrew: 'מקצוע2'
  });

  if (profDup.status === 400 && profDup.data.error.includes('already exists')) {
    pass('Profession case-insensitive duplicate blocked');
  } else {
    fail(`Profession duplicate NOT blocked: ${JSON.stringify(profDup)}`);
  }

  // Test 8: Profession duplicate (whitespace)
  console.log('Test 8: Profession duplicate (whitespace)');
  const profSpace = await request('POST', '/api/admin/professions', {
    fieldId,
    name: '  QATestProf  ',
    nameHebrew: 'מקצוע3'
  });

  if (profSpace.status === 400 && profSpace.data.error.includes('already exists')) {
    pass('Profession whitespace duplicate blocked');
  } else {
    fail(`Profession whitespace NOT blocked: ${JSON.stringify(profSpace)}`);
  }

  // Test 9: Create ServiceTemplate
  console.log('Test 9: Create ServiceTemplate');
  const svc = await request('POST', '/api/admin/service-templates', {
    professionId: profId,
    name: 'QATestSvc',
    nameHebrew: 'שירות',
    defaultDurationMinutes: 30,
    defaultPrice: 100,
    displayOrder: 999
  });

  if (svc.status === 201 && svc.data.id) {
    svcId = svc.data.id;
    pass(`ServiceTemplate created with ID ${svcId}`);
  } else {
    fail(`ServiceTemplate creation failed: ${JSON.stringify(svc)}`);
    process.exit(1);
  }

  // Test 10: Service duplicate (lowercase)
  console.log('Test 10: Service duplicate (lowercase)');
  const svcDup = await request('POST', '/api/admin/service-templates', {
    professionId: profId,
    name: 'qatestsvc',
    nameHebrew: 'שירות2',
    defaultDurationMinutes: 30
  });

  if (svcDup.status === 400 && svcDup.data.error.includes('already exists')) {
    pass('Service case-insensitive duplicate blocked');
  } else {
    fail(`Service duplicate NOT blocked: ${JSON.stringify(svcDup)}`);
  }

  // Test 11: Service duplicate (whitespace)
  console.log('Test 11: Service duplicate (whitespace)');
  const svcSpace = await request('POST', '/api/admin/service-templates', {
    professionId: profId,
    name: '  QATestSvc  ',
    nameHebrew: 'שירות3',
    defaultDurationMinutes: 30
  });

  if (svcSpace.status === 400 && svcSpace.data.error.includes('already exists')) {
    pass('Service whitespace duplicate blocked');
  } else {
    fail(`Service whitespace NOT blocked: ${JSON.stringify(svcSpace)}`);
  }

  // Test 12: Try delete field with profession - should fail
  console.log('Test 12: Delete field with profession (should fail)');
  const delField = await request('DELETE', `/api/admin/fields/${fieldId}`);

  if (delField.status === 400 && delField.data.error.includes('professions')) {
    pass('Field deletion blocked when professions exist');
  } else {
    fail(`Field deletion NOT blocked: ${JSON.stringify(delField)}`);
  }

  // Test 13: Try delete profession with service - should fail
  console.log('Test 13: Delete profession with service (should fail)');
  const delProf = await request('DELETE', `/api/admin/professions/${profId}`);

  if (delProf.status === 400 && delProf.data.error.includes('service templates')) {
    pass('Profession deletion blocked when services exist');
  } else {
    fail(`Profession deletion NOT blocked: ${JSON.stringify(delProf)}`);
  }

  // Test 14: Archive service
  console.log('Test 14: Archive service');
  const archive = await request('PATCH', `/api/admin/service-templates/${svcId}/archive`);

  if (archive.status === 200 && archive.data.status === 'ARCHIVED') {
    pass('Service archived successfully');
  } else {
    fail(`Service archive failed: ${JSON.stringify(archive)}`);
  }

  // Test 15: Restore service
  console.log('Test 15: Restore service');
  const restore = await request('PATCH', `/api/admin/service-templates/${svcId}/restore`);

  if (restore.status === 200 && restore.data.status === 'ACTIVE') {
    pass('Service restored successfully');
  } else {
    fail(`Service restore failed: ${JSON.stringify(restore)}`);
  }

  // Cleanup
  console.log('');
  console.log('Cleanup: Deleting test data...');
  await request('DELETE', `/api/admin/service-templates/${svcId}`);
  await request('DELETE', `/api/admin/professions/${profId}`);
  await request('DELETE', `/api/admin/fields/${fieldId}`);

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
