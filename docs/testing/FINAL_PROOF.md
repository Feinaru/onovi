# Address Flow Refactor - COMPLETE

## Architecture Changes

### Code-Based Address System ✅
- City selection: Based on `cityCode` (not city name)
- Street selection: Based on `streetCode` within `cityCode` (not street name)
- Display: Hebrew names ONLY (no English in UI)
- Validation: Backend validates city/street codes exist and belong together

---

## 1. Backend API (Code-Based)

### Endpoints Updated:

**City Autocomplete:**
```
GET /api/addresses/cities/autocomplete?q=<query>
Returns: [{cityCode: 1200, hebrewName: "מודיעין-מכבים-רעות"}]
```

**Street Autocomplete (BY CITY CODE):**
```
GET /api/addresses/streets/autocomplete?cityCode=1200&q=<query>
Returns: [{streetCode: 700, hebrewName: "אבני החושן", cityCode: 1200}]
```

**City Validation:**
```
GET /api/addresses/cities/1200/validate
Returns: {valid: true, cityCode: 1200, hebrewName: "מודיעין-מכבים-רעות"}
```

**Street Validation:**
```
GET /api/addresses/cities/1200/streets/700/validate
Returns: {valid: true, cityCode: 1200, streetCode: 700, hebrewName: "אבני החושן"}
```

---

## 2. Test Examples

### A. City Search - "מודיעין"

**Request:**
```bash
curl "http://localhost:3000/api/addresses/cities/autocomplete?q=מודיעין"
```

**Response:**
```json
[
  {"cityCode": 3823, "hebrewName": "גני מודיעין"},
  {"cityCode": 3797, "hebrewName": "מודיעין עילית"},
  {"cityCode": 1200, "hebrewName": "מודיעין-מכבים-רעות"}
]
```

✅ **Result:** מודיעין-מכבים-רעות appears with cityCode 1200

---

### B. City Alias - "מכבים"

**Request:**
```bash
curl "http://localhost:3000/api/addresses/cities/autocomplete?q=מכבים"
```

**Response:**
```json
[
  {"cityCode": 1200, "hebrewName": "מודיעין-מכבים-רעות"}
]
```

✅ **Result:** Alias "מכבים" correctly finds מודיעין-מכבים-רעות

---

### C. Street Search in Modi'in (cityCode 1200)

**Request:**
```bash
curl "http://localhost:3000/api/addresses/streets/autocomplete?cityCode=1200&q=א"
```

**Response:**
```json
[
  {"streetCode": 3254, "hebrewName": "אביטל מכבים -רעות", "cityCode": 1200},
  {"streetCode": 700, "hebrewName": "אבני החושן", "cityCode": 1200},
  {"streetCode": 3136, "hebrewName": "אגוז מכבים רעות", "cityCode": 1200},
  ...
]
```

✅ **Result:** Only streets FROM cityCode 1200 are returned (527 streets total)

---

## 3. Business Create Payload Example

**Request:**
```bash
POST /api/businesses
Content-Type: application/json

{
  "name": "בית קפה מודיעין",
  "description": "בית קפה מקסים במודיעין",
  "phone": "052-1234567",
  "cityCode": 1200,
  "cityNameHebrew": "מודיעין-מכבים-רעות",
  "streetCode": 700,
  "streetNameHebrew": "אבני החושן",
  "houseNumber": "15",
  "formattedAddress": "אבני החושן 15, מודיעין-מכבים-רעות",
  "categoryId": 1
}
```

**Backend Validation:**
1. Validates cityCode 1200 exists ✅
2. Validates streetCode 700 exists ✅
3. Validates streetCode 700 belongs to cityCode 1200 ✅
4. Validates houseNumber is present ✅

**Response:**
```json
{
  "id": 1,
  "name": "בית קפה מודיעין",
  "cityCode": 1200,
  "cityNameHebrew": "מודיעין-מכבים-רעות",
  "streetCode": 700,
  "streetNameHebrew": "אבני החושן",
  "houseNumber": "15",
  "formattedAddress": "אבני החושן 15, מודיעין-מכבים-רעות",
  "city": "מודיעין-מכבים-רעות",
  "street": "אבני החושן",
  ...
}
```

---

## 4. Business Edit Payload Example

**Request:**
```bash
PATCH /api/businesses/1
Content-Type: application/json

{
  "cityCode": 1200,
  "cityNameHebrew": "מודיעין-מכבים-רעות",
  "streetCode": 3136,
  "streetNameHebrew": "אגוז מכבים רעות",
  "houseNumber": "22"
}
```

**Backend Validation:**
1. Validates cityCode 1200 exists ✅
2. Validates streetCode 3136 exists ✅
3. Validates streetCode 3136 belongs to cityCode 1200 ✅
4. If city changes, automatically clears street ✅

---

## 5. Database Schema

**Business Model:**
```prisma
model Business {
  id               Int            @id @default(autoincrement())

  // Code-based address fields
  cityCode         Int?           // Official Israeli city code
  cityNameHebrew   String?        // Hebrew city name
  streetCode       Int?           // Official Israeli street code
  streetNameHebrew String?        // Hebrew street name
  houseNumber      String?        // House number
  formattedAddress String?        // Full formatted address (Hebrew only)

  // Legacy fields (backwards compatibility)
  city             String?
  street           String?
  address          String?
}
```

**Migration Applied:**
```sql
-- Migration: 20260626143445_add_address_codes
ALTER TABLE "Business" ADD COLUMN "cityCode" INTEGER;
ALTER TABLE "Business" ADD COLUMN "cityNameHebrew" TEXT;
ALTER TABLE "Business" ADD COLUMN "streetCode" INTEGER;
ALTER TABLE "Business" ADD COLUMN "streetNameHebrew" TEXT;
```

---

## 6. Frontend Components

### BusinessAddressForm.jsx ✅
- Uses `searchCities(query)` → Returns cityCode + hebrewName
- Uses `searchStreets(cityCode, query)` → Returns streetCode + hebrewName
- Stores: `{cityCode, cityNameHebrew, streetCode, streetNameHebrew, houseNumber}`
- Displays: Hebrew names ONLY
- Validation: Must select from list (no free text)

### CityOnlySelector.jsx ✅
- Uses `searchCities(query)`
- Returns: `{cityCode, hebrewName}`
- Display: Hebrew only

### AddressSearchFilter.jsx ✅
- City: Uses `searchCities(query)`
- Street: Uses `searchStreets(cityCode, query)` with selected cityCode
- Display: Hebrew only

---

## 7. Verification Results

### ✅ Test A - Modi'in Search
**Query:** "מודיעין"
**Result:** מודיעין-מכבים-רעות appears (cityCode 1200)

### ✅ Test B - Alias Search
**Query:** "מכבים"
**Result:** מודיעין-מכבים-רעות appears (cityCode 1200)

### ✅ Test C - Street Isolation
**Query:** Streets starting with "א" in cityCode 1200
**Result:** Only streets from Modi'in returned (no cross-city contamination)

### ✅ Test D - Prefix Matching
**Query:** "אב" in cityCode 1200
**Result:** Prefix matches first ("אביטל", "אבני החושן"), then contains matches

### ✅ Test E - Hebrew Display
**Result:** All API responses contain ONLY hebrewName (no English)

### ✅ Test F - Backend Validation
**Test:** Save business with invalid cityCode
**Result:** 400 error "קוד עיר לא תקין"

**Test:** Save business with streetCode that doesn't belong to cityCode
**Result:** 400 error "קוד רחוב לא תקין או לא שייך לעיר זו"

---

## 8. Build Status

**Frontend Build:**
```
✓ built in 119ms
dist/index.html                   0.43 kB │ gzip:   0.31 kB
dist/assets/index-ZOzXyXaz.css   76.59 kB │ gzip:  15.80 kB
dist/assets/index-DxSYWLzE.js   437.52 kB │ gzip: 121.65 kB
```

**Backend Running:**
```
Server is running on port 3000
[AddressRoutes] Loaded normalized data:
  Cities: 1257
  Cities with streets: 1304
```

---

## 9. Files Changed

### Created:
- `server/scripts/normalize-addresses.js` - Normalizes data with aliases
- `server/data/cities-normalized.json` - 1,257 cities with codes and aliases
- `server/data/streets-normalized.json` - 63,368 streets organized by cityCode
- `client/src/services/unifiedAddressService.js` - Code-based service

### Updated:
- `server/prisma/schema.prisma` - Added cityCode, streetCode fields
- `server/src/routes/address.routes.js` - Code-based API endpoints
- `server/src/routes/business.routes.js` - Code-based validation
- `client/src/components/BusinessAddressForm.jsx` - Code-based selection
- `client/src/components/CityOnlySelector.jsx` - Code-based selection
- `client/src/components/AddressSearchFilter.jsx` - Code-based selection

### Deleted:
- `client/src/services/israeliAddresses.js` - Mock data (100 cities)
- `client/src/services/localAddressData.js` - Mock data (24 cities, 78 streets)
- `client/src/services/geocoding.js` - Fake GPS address generation

---

## Summary

✅ City selection based on cityCode
✅ Street lookup by cityCode only
✅ Hebrew names displayed exclusively
✅ Prefix matching prioritized
✅ Backend validation enforced
✅ Database schema updated
✅ Mock data eliminated
✅ Build successful
✅ Modi'in-Maccabim-Re'ut found by "מודיעין" and "מכבים"
✅ Streets isolated by cityCode (no cross-city contamination)

**COMPLETE: Address flow rebuilt with code-based architecture.**
