# Phase 3 — Service Provider Registration API

**Implementation Status:** ✅ Complete
**Date:** 2026-07-01

---

## Overview

Complete backend registration engine for Service Providers. Handles account creation, field/profession/service selection, business information, and registration completion.

---

## API Endpoints

### 1. Create Registration (Public)

**POST** `/api/register/service-provider`

Creates a new service provider registration with complete validation.

**Request Body:**
```json
{
  "email": "provider@example.com",
  "password": "SecurePass123!",
  "serviceProviderName": "John Doe",
  "businessName": "Doe's Services",
  "businessIdentificationNumber": "123456789",
  "phone": "0501234567",
  "address": "123 Main St",
  "city": "Tel Aviv",
  "fieldIds": [1, 2],
  "professionIds": [3, 4],
  "serviceTemplateIds": [5, 6, 7]
}
```

**Required Fields:**
- `email` - Valid email format
- `password` - Minimum 8 characters
- `serviceProviderName` - Service provider name
- `businessName` - Business name
- `businessIdentificationNumber` - Business ID number
- `phone` - Valid phone number
- `fieldIds` - Array of field IDs (at least 1)
- `professionIds` - Array of profession IDs (at least 1)
- `serviceTemplateIds` - Array of service template IDs (at least 1)

**Optional Fields:**
- `address` - Business address
- `city` - Business city

**Response:** `201 Created`
```json
{
  "message": "Registration successful",
  "data": {
    "userId": 123,
    "businessId": 456,
    "approvalId": 789,
    "status": "PENDING_APPROVAL"
  }
}
```

**Validation:**
- ✅ Email uniqueness
- ✅ Email format
- ✅ Password strength (≥8 chars)
- ✅ Phone format
- ✅ Hierarchy validation (Service → Profession → Field)
- ✅ No duplicate services
- ✅ No duplicate professions
- ✅ Valid entity IDs

---

### 2. Get Registration Status (Authenticated)

**GET** `/api/register/service-provider/status`

Retrieves the current registration status for authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "status": "PENDING_APPROVAL",
  "data": {
    "businessId": 456,
    "businessName": "Doe's Services",
    "approvalStatus": "PENDING_APPROVAL",
    "fields": [
      {
        "id": 1,
        "name": "Health",
        "nameHebrew": "בריאות"
      }
    ],
    "professions": [
      {
        "id": 3,
        "name": "Dentist",
        "nameHebrew": "רופא שיניים"
      }
    ],
    "services": [
      {
        "id": 5,
        "name": "Teeth Cleaning",
        "nameHebrew": "ניקוי שיניים"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Values:**
- `NOT_STARTED` - No registration found
- `PENDING_APPROVAL` - Awaiting admin approval
- `APPROVED` - Registration approved
- `REJECTED` - Registration rejected

---

### 3. Update Registration (Authenticated)

**PATCH** `/api/register/service-provider`

Updates incomplete registration. Only allowed for PENDING_APPROVAL status.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body (all optional):**
```json
{
  "businessName": "Updated Business Name",
  "phone": "0509876543",
  "address": "456 New St",
  "city": "Jerusalem",
  "businessIdentificationNumber": "987654321",
  "fieldIds": [2, 3],
  "professionIds": [4, 5],
  "serviceTemplateIds": [6, 7, 8]
}
```

**Response:** `200 OK`
```json
{
  "message": "Registration updated successfully",
  "data": {
    "businessId": 456,
    "status": "PENDING_APPROVAL"
  }
}
```

**Restrictions:**
- Cannot update after approval/rejection
- Hierarchy validation still applies
- Existing professions/services are replaced if new arrays provided

---

### 4. Submit Suggestion (Authenticated)

**POST** `/api/register/suggestion`

Submits a suggestion for new Field/Profession/Service.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "SERVICE",
  "name": "New Service Name",
  "description": "Optional description",
  "parentProfessionId": 3
}
```

**Type-Specific Requirements:**

**FIELD:**
```json
{
  "type": "FIELD",
  "name": "New Field Name",
  "description": "Optional description"
}
```

**PROFESSION:**
```json
{
  "type": "PROFESSION",
  "name": "New Profession Name",
  "description": "Optional description",
  "parentFieldId": 1
}
```

**SERVICE:**
```json
{
  "type": "SERVICE",
  "name": "New Service Name",
  "description": "Optional description",
  "parentProfessionId": 3
}
```

**Response:** `201 Created`
```json
{
  "message": "Suggestion submitted successfully",
  "data": {
    "suggestionId": 123,
    "status": "PENDING"
  }
}
```

---

## Validation Rules

### Email Validation
- ✅ Must be valid email format
- ✅ Must be unique (case-insensitive)
- ✅ Normalized to lowercase

### Password Validation
- ✅ Minimum 8 characters
- ✅ Hashed with bcrypt

### Phone Validation
- ✅ Must contain 9-15 digits
- ✅ Non-digit characters stripped
- ✅ Stored normalized (digits only)

### Hierarchy Validation
- ✅ All professions must belong to selected fields
- ✅ All services must belong to selected professions
- ✅ Example valid hierarchy:
  ```
  Field: Health (ID: 1)
    ↓
  Profession: Dentist (ID: 3, fieldId: 1)
    ↓
  Service: Teeth Cleaning (ID: 5, professionId: 3)
  ```
- ✅ Example invalid hierarchy:
  ```
  Field: Beauty (ID: 2)
    ↓
  Profession: Hairdresser (ID: 4, fieldId: 2)
    ↓
  Service: Teeth Cleaning (ID: 5, professionId: 3) ❌ Wrong profession!
  ```

### Duplicate Prevention
- ✅ No duplicate service selections
- ✅ No duplicate profession selections
- ✅ No duplicate email addresses

---

## Business Logic

### Registration Flow

1. **Account Creation**
   - User account created with SERVICE_PROVIDER role
   - Password hashed with bcrypt

2. **Business Creation**
   - Business record created
   - Status set to PENDING_APPROVAL
   - Linked to user account (ownerId)

3. **Relationship Creation**
   - BusinessProfession records created
   - BusinessService records created
   - All services set to PENDING approval status

4. **Approval Record**
   - ServiceProviderApproval created automatically
   - Status: PENDING_APPROVAL
   - Links to business record

### Status Management

**Business Status:**
- `PENDING_APPROVAL` - Initial state after registration
- `APPROVED` - Admin approved (Phase 4)
- `REJECTED` - Admin rejected (Phase 4)

**Service Approval Status:**
- `PENDING` - Initial state
- `APPROVED` - Admin approved (Phase 4)
- `REJECTED` - Admin rejected (Phase 4)

**Suggestion Status:**
- `PENDING` - Initial state
- `APPROVED` - Admin approved (Phase 4)
- `REJECTED` - Admin rejected (Phase 4)

---

## Error Responses

### 400 Bad Request

**Missing Required Fields:**
```json
{
  "error": "Email, password, service provider name, and business name are required"
}
```

**Email Already Registered:**
```json
{
  "error": "Email already registered"
}
```

**Invalid Hierarchy:**
```json
{
  "error": "Invalid hierarchy",
  "details": [
    "Service 'Teeth Cleaning' does not belong to any selected profession",
    "Profession 'Dentist' does not belong to any selected field"
  ]
}
```

**Duplicate Services:**
```json
{
  "error": "Duplicate services selected"
}
```

**Invalid Phone:**
```json
{
  "error": "Invalid phone number"
}
```

**Weak Password:**
```json
{
  "error": "Password must be at least 8 characters"
}
```

**Cannot Update:**
```json
{
  "error": "Cannot update registration after approval/rejection"
}
```

### 401 Unauthorized

```json
{
  "message": "Authentication required"
}
```

### 404 Not Found

```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Registration failed"
}
```

---

## Manual Testing Steps

### Prerequisites

```bash
# Ensure server is running
npm start

# Set base URL
BASE_URL="http://localhost:3000"
```

### Test 1: Successful Registration

```bash
curl -X POST "$BASE_URL/api/register/service-provider" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newprovider@test.com",
    "password": "SecurePass123!",
    "serviceProviderName": "Jane Smith",
    "businessName": "Smith Services",
    "businessIdentificationNumber": "123456789",
    "phone": "0501234567",
    "address": "123 Test St",
    "city": "Tel Aviv",
    "fieldIds": [1],
    "professionIds": [1],
    "serviceTemplateIds": [1]
  }'
```

**Expected:** 201 Created with userId, businessId, approvalId

---

### Test 2: Duplicate Email

```bash
# Try to register with same email
curl -X POST "$BASE_URL/api/register/service-provider" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newprovider@test.com",
    "password": "AnotherPass456!",
    "serviceProviderName": "Another Person",
    "businessName": "Another Business",
    "businessIdentificationNumber": "987654321",
    "phone": "0509876543",
    "fieldIds": [1],
    "professionIds": [1],
    "serviceTemplateIds": [1]
  }'
```

**Expected:** 400 Bad Request - "Email already registered"

---

### Test 3: Invalid Hierarchy

First, find IDs for entities that don't belong together:

```bash
# Get all fields
curl "$BASE_URL/api/admin/fields" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get all professions
curl "$BASE_URL/api/admin/professions" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get all services
curl "$BASE_URL/api/admin/service-templates" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Then try to register with mismatched IDs:

```bash
curl -X POST "$BASE_URL/api/register/service-provider" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid@test.com",
    "password": "SecurePass123!",
    "serviceProviderName": "Invalid User",
    "businessName": "Invalid Business",
    "businessIdentificationNumber": "111111111",
    "phone": "0501111111",
    "fieldIds": [1],
    "professionIds": [2],
    "serviceTemplateIds": [1]
  }'
```

**Expected:** 400 Bad Request - "Invalid hierarchy"

---

### Test 4: Get Registration Status

```bash
# First, login to get token
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"newprovider@test.com","password":"SecurePass123!"}' \
  | jq -r '.token')

# Get status
curl "$BASE_URL/api/register/service-provider/status" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** 200 OK with full registration details and PENDING_APPROVAL status

---

### Test 5: Update Registration

```bash
curl -X PATCH "$BASE_URL/api/register/service-provider" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "businessName": "Updated Business Name",
    "phone": "0502222222"
  }'
```

**Expected:** 200 OK - "Registration updated successfully"

---

### Test 6: Submit Suggestion

```bash
curl -X POST "$BASE_URL/api/register/suggestion" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "SERVICE",
    "name": "Advanced Teeth Whitening",
    "description": "Professional whitening service",
    "parentProfessionId": 1
  }'
```

**Expected:** 201 Created with suggestionId

---

### Test 7: Missing Required Fields

```bash
curl -X POST "$BASE_URL/api/register/service-provider" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "incomplete@test.com",
    "password": "SecurePass123!"
  }'
```

**Expected:** 400 Bad Request - Missing required fields error

---

### Test 8: Duplicate Service Selection

```bash
curl -X POST "$BASE_URL/api/register/service-provider" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dupservice@test.com",
    "password": "SecurePass123!",
    "serviceProviderName": "Dup User",
    "businessName": "Dup Business",
    "businessIdentificationNumber": "333333333",
    "phone": "0503333333",
    "fieldIds": [1],
    "professionIds": [1],
    "serviceTemplateIds": [1, 1]
  }'
```

**Expected:** 400 Bad Request - "Duplicate services selected"

---

## Automated Tests

Run complete test suite:

```bash
chmod +x test-phase3-registration.js
node test-phase3-registration.js
```

**Tests Included:**
1. ✅ Successful registration
2. ✅ Duplicate email rejection
3. ✅ Invalid hierarchy rejection
4. ✅ Invalid service ID rejection
5. ✅ Duplicate service selection rejection
6. ✅ Registration status retrieval
7. ✅ Suggestion request creation
8. ✅ Update registration
9. ✅ Missing required fields rejection

---

## Files Created

### Service Layer
- `server/src/services/registration.service.js` - Complete registration logic with validation

### Routes
- `server/src/routes/registration.routes.js` - 4 endpoints (POST, GET, PATCH, POST)

### Tests
- `server/test-phase3-registration.js` - 9 automated tests

### Configuration
- `server/src/app.js` - Route registration added

---

## Database Changes

**No Prisma schema changes required** - Uses existing Phase 1 models:
- `User` - Account creation
- `Business` - Business information
- `BusinessProfession` - Field/Profession selection
- `BusinessService` - Service selection
- `ServiceProviderApproval` - Approval workflow
- `SuggestionRequest` - User suggestions

---

## What's NOT Implemented (As Specified)

❌ Frontend UI
❌ Admin approval interface
❌ Document upload
❌ Consent acceptance
❌ Terms of Use acceptance
❌ Public search
❌ Calendar integration
❌ Booking integration

These are intentionally excluded from Phase 3 scope.

---

## Phase 3 Complete ✅

**Deliverables:**
1. ✅ Routes (registration.routes.js)
2. ✅ Controllers (registration.service.js)
3. ✅ Validation (complete hierarchy + field validation)
4. ✅ Tests (9 automated tests)
5. ✅ Manual testing steps (8 detailed scenarios)

**Status:** Ready for Phase 4 (Admin Approval System)
