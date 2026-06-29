/**
 * Test CRM API Endpoints
 *
 * Tests:
 * 1. Israeli ID validation
 * 2. Create lead
 * 3. Duplicate detection
 * 4. Get leads list
 * 5. Add note
 * 6. Add timeline event
 */

const BASE_URL = 'http://localhost:3000';

// We'll need a valid auth token for testing
// For now, let's test the validation logic

async function testCreateLead() {
  console.log('\n=== Testing Lead Creation ===\n');

  // Test 1: Valid Israeli ID
  const validID = '000000018'; // Valid Israeli ID checksum

  const lead1 = {
    identifierType: 'ISRAELI_ID',
    identifierValue: validID,
    businessName: 'Test Restaurant',
    contactPersonName: 'Yossi Cohen',
    phone: '050-1234567',
    email: 'yossi@test.com',
    source: 'Phone Call',
    categoryId: 1,
    initialNote: 'Interested in premium package'
  };

  console.log('Test 1: Creating lead with valid Israeli ID');
  console.log('Payload:', JSON.stringify(lead1, null, 2));

  // Test 2: Invalid Israeli ID (bad checksum)
  const invalidID = '000000019'; // Invalid checksum

  const lead2 = {
    identifierType: 'ISRAELI_ID',
    identifierValue: invalidID,
    businessName: 'Invalid Test',
    phone: '050-9999999'
  };

  console.log('\nTest 2: Creating lead with invalid Israeli ID (should fail)');
  console.log('Payload:', JSON.stringify(lead2, null, 2));

  // Test 3: Company number
  const lead3 = {
    identifierType: 'COMPANY_NUMBER',
    identifierValue: '514588832',
    businessName: 'Test Company Ltd',
    phone: '03-5555555',
    source: 'Website'
  };

  console.log('\nTest 3: Creating lead with company number');
  console.log('Payload:', JSON.stringify(lead3, null, 2));

  console.log('\n=== Manual Testing Instructions ===\n');
  console.log('To test the API, you need to:');
  console.log('1. Register/Login as BUSINESS or ADMIN user');
  console.log('2. Get the JWT token from the response');
  console.log('3. Use the token in Authorization header: Bearer <token>');
  console.log('\nExample curl commands:\n');

  console.log('# Create lead with valid Israeli ID:');
  console.log(`curl -X POST ${BASE_URL}/api/leads \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -d '${JSON.stringify(lead1)}'`);

  console.log('\n# Create lead with invalid ID (should fail):');
  console.log(`curl -X POST ${BASE_URL}/api/leads \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -d '${JSON.stringify(lead2)}'`);

  console.log('\n# Get all leads:');
  console.log(`curl ${BASE_URL}/api/leads \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"`);

  console.log('\n# Add note to lead:');
  console.log(`curl -X POST ${BASE_URL}/api/leads/1/notes \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -d '{"content": "Called customer, very interested"}'`);

  console.log('\n# Add timeline event:');
  console.log(`curl -X POST ${BASE_URL}/api/leads/1/timeline \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -d '{"type": "PHONE_CALL_OUTBOUND", "description": "Discussed pricing"}'`);
}

// Test the validation logic directly
console.log('=== Testing Identifier Validation Logic ===\n');

const { validateIdentifier } = require('./src/utils/identifierValidation');

// Test valid Israeli ID
console.log('Test: Valid Israeli ID (000000018)');
console.log(validateIdentifier('ISRAELI_ID', '000000018'));

console.log('\nTest: Invalid Israeli ID (000000019)');
console.log(validateIdentifier('ISRAELI_ID', '000000019'));

console.log('\nTest: Israeli ID with dashes (123-456-789)');
console.log(validateIdentifier('ISRAELI_ID', '123-456-789'));

console.log('\nTest: Short Israeli ID (12345678)');
console.log(validateIdentifier('ISRAELI_ID', '12345678'));

console.log('\nTest: Company number (514588832)');
console.log(validateIdentifier('COMPANY_NUMBER', '514588832'));

console.log('\nTest: Authorized dealer (123456789)');
console.log(validateIdentifier('AUTHORIZED_DEALER', '123456789'));

// Run the test
testCreateLead();
