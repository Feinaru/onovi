# Business-Lead Auto-Linking Test Guide

## Overview
This guide tests the complete CRM anchor feature: automatic linking between Leads and Businesses based on official identifiers.

## Prerequisites
- Server running on `http://localhost:3000`
- Valid authentication token

---

## Step 1: Get Authentication Token

```bash
# Register a new BUSINESS user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Business Owner",
    "phone": "050-9999999",
    "email": "testowner@business.com",
    "password": "password123",
    "role": "BUSINESS"
  }'
```

**Save the `token` from the response** - you'll need it for all subsequent requests.

Set it as a variable for convenience:
```bash
export TOKEN="your_token_here"
```

---

## Step 2: Create a Category (Required for Businesses)

```bash
# First, register an ADMIN user if needed
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "phone": "050-8888888",
    "email": "admin@test.com",
    "password": "admin123",
    "role": "ADMIN"
  }'

export ADMIN_TOKEN="admin_token_here"

# Create a category
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "מסעדות",
    "icon": "🍽️",
    "displayOrder": 1
  }'
```

---

## Test Scenario 1: Create Lead First, Then Business (Auto-Link)

### Step 1: Create a Lead

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "identifierType": "ISRAELI_ID",
    "identifierValue": "000000018",
    "businessName": "Test Restaurant",
    "contactPersonName": "Yossi Cohen",
    "phone": "050-1234567",
    "email": "yossi@restaurant.com",
    "source": "Phone Call",
    "categoryId": 1,
    "initialNote": "Very interested in premium package"
  }'
```

**Expected**: Lead created with `registrationStatus: "NOT_REGISTERED"`

### Step 2: Verify Lead is NOT Registered

```bash
curl http://localhost:3000/api/leads \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Lead shows `"registrationStatus": "NOT_REGISTERED"`

### Step 3: Create Business with SAME Identifier

```bash
curl -X POST http://localhost:3000/api/businesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Restaurant Ltd",
    "description": "Amazing food",
    "phone": "050-1234567",
    "identifierType": "ISRAELI_ID",
    "identifierValue": "000000018",
    "categoryId": 1
  }'
```

**Expected**:
- Business created successfully
- Console log: `[BusinessRoutes] Auto-linked Lead # 1 to Business # 1`

### Step 4: Verify Lead is NOW Registered

```bash
curl http://localhost:3000/api/leads \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Lead now shows:
- `"registrationStatus": "REGISTERED"`
- `"linkedBusiness": { "id": 1, "name": "Test Restaurant Ltd", ... }`

### Step 5: Check Lead Timeline

```bash
curl http://localhost:3000/api/leads/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Timeline includes event:
```json
{
  "type": "LEAD_CREATED",
  "description": "הליד נרשם כעסק במערכת! 🎉 העסק \"Test Restaurant Ltd\" נרשם"
}
```

---

## Test Scenario 2: Create Business First, Then Lead (Auto-Link)

### Step 1: Create a Business

```bash
curl -X POST http://localhost:3000/api/businesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Coffee Shop Ltd",
    "description": "Best coffee in town",
    "phone": "03-5555555",
    "identifierType": "COMPANY_NUMBER",
    "identifierValue": "514588832",
    "categoryId": 1
  }'
```

**Expected**: Business created successfully

### Step 2: Create Lead with SAME Identifier

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "identifierType": "COMPANY_NUMBER",
    "identifierValue": "514588832",
    "businessName": "Coffee Shop",
    "phone": "03-5555555",
    "source": "Website"
  }'
```

**Expected**:
- Lead created successfully
- Console log: `[LeadRoutes] Auto-linked Lead # 2 to existing Business # 2`
- Lead immediately shows `"registrationStatus": "REGISTERED"`

### Step 3: Verify Immediate Registration

```bash
curl http://localhost:3000/api/leads/2 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Lead is linked to business from creation:
```json
{
  "registrationStatus": "REGISTERED",
  "linkedBusiness": {
    "id": 2,
    "name": "Coffee Shop Ltd"
  }
}
```

---

## Test Scenario 3: Duplicate Business Identifier (Should Fail)

```bash
curl -X POST http://localhost:3000/api/businesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Duplicate Coffee Shop",
    "phone": "03-9999999",
    "identifierType": "COMPANY_NUMBER",
    "identifierValue": "514588832",
    "categoryId": 1
  }'
```

**Expected**: 409 Conflict
```json
{
  "error": "DUPLICATE_IDENTIFIER",
  "message": "עסק עם מזהה זה כבר קיים במערכת",
  "existingBusiness": {
    "id": 2,
    "name": "Coffee Shop Ltd",
    "phone": "03-5555555"
  }
}
```

---

## Test Scenario 4: Invalid Israeli ID (Should Fail)

```bash
curl -X POST http://localhost:3000/api/businesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Bad Business",
    "phone": "050-1111111",
    "identifierType": "ISRAELI_ID",
    "identifierValue": "000000019",
    "categoryId": 1
  }'
```

**Expected**: 400 Bad Request
```json
{
  "message": "מספר תעודת זהות לא תקין (בדיקת ספרת ביקורת נכשלה)"
}
```

---

## Test Scenario 5: Missing Identifier (Should Fail)

```bash
curl -X POST http://localhost:3000/api/businesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "No Identifier Business",
    "phone": "050-2222222",
    "categoryId": 1
  }'
```

**Expected**: 400 Bad Request
```json
{
  "message": "name, phone, categoryId, identifierType and identifierValue are required"
}
```

---

## Verification Checklist

- [ ] Lead created without business shows `NOT_REGISTERED`
- [ ] Creating business auto-links to existing lead
- [ ] Lead status changes to `REGISTERED` after business created
- [ ] Timeline event created on auto-link
- [ ] Business created first auto-links to lead created later
- [ ] Lead created with existing business is immediately `REGISTERED`
- [ ] Duplicate business identifier is rejected
- [ ] Duplicate lead identifier is rejected
- [ ] Invalid Israeli ID is rejected
- [ ] Missing identifier fields are rejected
- [ ] Valid Israeli ID checksum passes
- [ ] Company numbers are validated and normalized

---

## Expected Console Logs

When auto-linking happens, you should see:

```
[BusinessRoutes] Auto-linked Lead # 1 to Business # 1
```

or

```
[LeadRoutes] Auto-linked Lead # 2 to existing Business # 2
```

---

## Quick Test Script

Save this as `test-linking.sh`:

```bash
#!/bin/bash

# Set your tokens
export TOKEN="your_business_token"
export BASE_URL="http://localhost:3000"

echo "=== Test 1: Create Lead ==="
curl -X POST $BASE_URL/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"identifierType":"ISRAELI_ID","identifierValue":"000000018","businessName":"Test Restaurant","phone":"050-1234567"}'

echo -e "\n\n=== Test 2: Create Business (should auto-link) ==="
curl -X POST $BASE_URL/api/businesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Restaurant Ltd","phone":"050-1234567","identifierType":"ISRAELI_ID","identifierValue":"000000018","categoryId":1}'

echo -e "\n\n=== Test 3: Verify Lead is Registered ==="
curl $BASE_URL/api/leads \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=== Test 4: Try Invalid ID (should fail) ==="
curl -X POST $BASE_URL/api/businesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Bad Business","phone":"050-9999999","identifierType":"ISRAELI_ID","identifierValue":"000000019","categoryId":1}'
```

Run with: `bash test-linking.sh`
