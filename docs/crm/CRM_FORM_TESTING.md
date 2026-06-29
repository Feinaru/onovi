# CRM Lead Creation Form - Testing Guide

## Files Created

1. `/client/src/components/CreateLeadForm.jsx` - Lead creation form component
2. `/client/src/pages/CRMPage.jsx` - CRM page wrapper with success screen

## Files Modified

1. `/client/src/main.jsx` - Added CRM navigation and routing

## How to Open the Form

### Option 1: Login as ADMIN
1. Open browser: `http://localhost:5173` (or `http://localhost:5174`)
2. Click "התחבר" (Login)
3. Login with:
   - Phone: `0500000001`
   - Password: `123456`
4. Click the **"CRM 📋"** button in the sidebar
5. The lead creation form will appear

### Option 2: Login as BUSINESS
1. Open browser: `http://localhost:5173` (or `http://localhost:5174`)
2. Click "התחבר" (Login)
3. Login with:
   - Phone: `0500000002`
   - Password: `123456`
4. Click the **"CRM 📋"** button in the sidebar
5. The lead creation form will appear

---

## Test Scenarios

### ✅ Test 1: Create Lead with Valid Israeli ID

**Steps:**
1. Open the CRM form
2. Fill in:
   - **Identifier Type:** תעודת זהות (Israeli ID)
   - **Identifier Value:** `000000018` (valid Israeli ID with correct checksum)
   - **Business Name:** `מסעדת הדוגמה`
   - **Phone:** `050-1234567`
   - **Contact Person:** `יוסי כהן` (optional)
   - **Email:** `yossi@example.com` (optional)
   - **Source:** Phone Call
   - **Initial Note:** `מעוניין בחבילה פרימיום` (optional)
3. Click **"צור ליד"**

**Expected Result:**
- ✅ Success message: "הליד נוצר בהצלחה!"
- ✅ Shows business name
- ✅ Button to create another lead

---

### ❌ Test 2: Invalid Israeli ID (Bad Checksum)

**Steps:**
1. Open the CRM form
2. Fill in:
   - **Identifier Type:** תעודת זהות
   - **Identifier Value:** `000000019` (invalid - fails checksum)
   - **Business Name:** `מסעדת טסט`
   - **Phone:** `050-9999999`
3. Click **"צור ליד"**

**Expected Result:**
- ❌ Error message in red box: "מספר תעודת זהות לא תקין (בדיקת ספרת ביקורת נכשלה)"
- Form stays visible
- Can fix and retry

---

### ❌ Test 3: Duplicate Identifier

**Steps:**
1. First, create a lead with ID `000000018` (from Test 1)
2. Try to create ANOTHER lead with the SAME ID:
   - **Identifier Type:** תעודת זהות
   - **Identifier Value:** `000000018` (same as before)
   - **Business Name:** `מסעדה שנייה`
   - **Phone:** `050-8888888`
3. Click **"צור ליד"**

**Expected Result:**
- ❌ Error message: "ליד עם מזהה זה כבר קיים במערכת"
- Form stays visible
- Cannot create duplicate

---

### 🎉 Test 4: Create Lead That Matches Existing Business

**Setup:** First create a business with a specific identifier.

**Step 1: Create a Business**
1. Login as BUSINESS user (`0500000002` / `123456`)
2. Go to "ניהול עסק" (Business Management)
3. Create a new business:
   - Name: `בית קפה דוגמה`
   - Phone: `03-5555555`
   - **Identifier Type:** Company Number
   - **Identifier Value:** `514588832`
   - Category: Select any
4. Submit

**Step 2: Create Lead with SAME Identifier**
1. Go to CRM (click "CRM 📋")
2. Fill in:
   - **Identifier Type:** חברה בע"מ (Company Number)
   - **Identifier Value:** `514588832` (SAME as the business)
   - **Business Name:** `בית קפה`
   - **Phone:** `03-5555555`
3. Click **"צור ליד"**

**Expected Result:**
- ✅ Lead created successfully
- 🎉 **Success screen shows:** "הליד הזה כבר רשום כעסק במערכת!"
- Shows the linked business name: `בית קפה דוגמה`
- Lead has `registrationStatus: "REGISTERED"`

---

### ❌ Test 5: Missing Required Fields

**Steps:**
1. Open the CRM form
2. Leave fields empty
3. Try to click **"צור ליד"** without filling required fields

**Expected Result:**
- Browser validation prevents submission
- Red highlights on empty required fields

---

### ✅ Test 6: Create Lead with Company Number

**Steps:**
1. Open the CRM form
2. Fill in:
   - **Identifier Type:** חברה בע"מ (Company Number)
   - **Identifier Value:** `123456789`
   - **Business Name:** `חברת בדיקה בע"מ`
   - **Phone:** `03-1234567`
3. Click **"צור ליד"**

**Expected Result:**
- ✅ Success - company numbers are validated (9 digits)
- Lead created

---

### ✅ Test 7: Create Lead with Authorized Dealer

**Steps:**
1. Open the CRM form
2. Fill in:
   - **Identifier Type:** עוסק מורשה (Authorized Dealer)
   - **Identifier Value:** `987654321`
   - **Business Name:** `עסק קטן`
   - **Phone:** `054-1234567`
3. Click **"צור ליד"**

**Expected Result:**
- ✅ Success
- Lead created

---

## Backend Verification

To verify leads were created correctly:

```bash
# Get auth token first
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0500000001","password":"123456"}' \
  | jq -r '.token'

# Save token, then:
export TOKEN="your_token_here"

# List all leads
curl http://localhost:3000/api/leads \
  -H "Authorization: Bearer $TOKEN" \
  | jq .

# Get specific lead
curl http://localhost:3000/api/leads/1 \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

---

## What to Verify

### Form Behavior:
- ✅ All 4 identifier types available in dropdown
- ✅ Required fields marked with red asterisk (*)
- ✅ Optional fields can be left empty
- ✅ Helper text shows below identifier field
- ✅ Form is clean, simple, easy to understand

### Validation:
- ✅ Israeli ID checksum validation works
- ✅ Duplicate detection works
- ✅ Invalid IDs are rejected
- ✅ Error messages are clear in Hebrew

### Success Flow:
- ✅ Success screen appears after creation
- ✅ Can create another lead from success screen
- ✅ If linked to business, shows special message

### Auto-Linking:
- ✅ Creating lead with existing business identifier → shows "רשום כעסק"
- ✅ Timeline event created when lead is linked
- ✅ Registration status is REGISTERED

---

## Test Identifiers Reference

### Valid Israeli IDs (with correct checksum):
- `000000018` ✅
- `123456782` ✅
- `987654327` ✅

### Invalid Israeli IDs (bad checksum):
- `000000019` ❌
- `123456781` ❌
- `987654321` ❌

### Valid Company Numbers (any 9 digits):
- `514588832` ✅
- `123456789` ✅
- `500000001` ✅ (already exists from seed data)

---

## Quick Test Sequence

```bash
# 1. Valid lead
Israeli ID: 000000018
Business: מסעדת טסט
Phone: 050-1234567
→ Should succeed

# 2. Invalid ID
Israeli ID: 000000019
Business: עסק שני
Phone: 050-9999999
→ Should fail with checksum error

# 3. Duplicate
Israeli ID: 000000018
Business: עסק שלישי
Phone: 050-8888888
→ Should fail with duplicate error

# 4. Company number
Company Number: 987654321
Business: חברה בע"מ
Phone: 03-5555555
→ Should succeed
```

---

## Notes

- The form is ONLY accessible to BUSINESS and ADMIN users
- Customers cannot access the CRM
- The form uses the backend's `/api/leads` endpoint
- All validation happens server-side (frontend just displays errors)
- Success shows whether the lead is already registered as a business
