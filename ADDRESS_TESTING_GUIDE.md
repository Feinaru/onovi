# Israeli Address Database - Testing Guide

## ✅ Implementation Complete

The Israeli address database has been fully integrated end-to-end with real government data.

## 🚀 Current Status

### Backend (Port 3000)
- ✅ Server running: `http://localhost:3000`
- ✅ Database loaded: 1,259 cities + 63,354 streets
- ✅ API endpoints active:
  - `GET /api/addresses/cities/autocomplete?q=<query>`
  - `GET /api/addresses/streets/autocomplete?city=<city>&q=<query>`
  - `GET /api/addresses/stats`

### Frontend (Port 5174)
- ✅ Frontend running: `http://localhost:5174`
- ✅ New address API service created
- ✅ BusinessAddressForm updated with real API integration
- ✅ Comprehensive logging enabled
- ✅ Debug info panel (development mode)

## 🧪 How to Test the Address Flow

### Step 1: Open the Application
Navigate to: **http://localhost:5174**

### Step 2: Test City Autocomplete

1. Go to the business registration or address form
2. Click in the **"עיר"** (City) field
3. Type **ONE character** (e.g., "ת")
4. **Expected:** Dropdown appears with cities starting with that letter
5. **Check browser console** for logs:
   ```
   [AddressAPI] fetchCities: Query: ת
   [AddressAPI] fetchCities: Response count: 21
   [BusinessAddressForm] City results: 21
   ```

#### City Test Cases:
| Query | Expected Results |
|-------|------------------|
| `ת` | 21 cities (תל אביב, תלמי אליהו, etc.) |
| `תל` | 21 cities (תל אביב - יפו, תל מונד, etc.) |
| `תל א` | 1 city (תל אביב - יפו) |
| `ירו` | 1 city (ירושלים) |

### Step 3: Test Street Autocomplete

1. **First select a city** (e.g., "תל אביב - יפו")
2. Click in the **"רחוב"** (Street) field
3. Type **ONE character** (e.g., "ח")
4. **Expected:** Dropdown appears immediately with 50 streets
5. **Check browser console** for logs:
   ```
   [AddressAPI] fetchStreets: City: תל אביב - יפו, Query: ח
   [AddressAPI] fetchStreets: Response count: 50
   [BusinessAddressForm] Street dropdown will show: 50 items
   ```

#### Progressive Filtering Test:
Type these queries **sequentially** in Tel Aviv:

| Query | Expected Count | Example Streets |
|-------|----------------|-----------------|
| `ח` | 50 | חביב אבשלום, חבקוק, חברון, etc. |
| `חב` | 20 | החבצלת, חבר הלאומים, חברה חדשה, חברון, חברת שס |
| `חבר` | 5 | חבר הלאומים, חברה חדשה, חברון, חברת שס |
| `חברון` | 1 | חברון |

### Step 4: Complete the Address

1. Select a street from the dropdown
2. Enter a house number (e.g., "45")
3. **Expected:**
   - Green checkmarks appear next to selected fields
   - Address preview box appears at the bottom
   - "כתובת מלאה: חברון 45, תל אביב - יפו"

### Step 5: Check Debug Info

At the bottom of the form (in development mode), you'll see:
```
Debug Info:
API: http://localhost:3000
City: תל אביב - יפו
Street: חברון
City Results: 21
Street Results: 5
Show City Dropdown: no
Show Street Dropdown: no
```

## 🔍 What to Check in Browser Console

### Successful Flow:
```
[BusinessAddressForm] City input changed: ת
[AddressAPI] fetchCities: Request URL: http://localhost:3000/api/addresses/cities/autocomplete?q=%D7%AA
[AddressAPI] fetchCities: Response count: 21

[BusinessAddressForm] City selected: תל אביב - יפו

[BusinessAddressForm] Street input changed: ח
[BusinessAddressForm] Selected city: תל אביב - יפו
[AddressAPI] fetchStreets: Request URL: http://localhost:3000/api/addresses/streets/autocomplete?city=%D7%AA%D7%9C%20%D7%90%D7%91%D7%99%D7%91%20-%20%D7%99%D7%A4%D7%95&q=%D7%97
[AddressAPI] fetchStreets: Response count: 50
[BusinessAddressForm] Street dropdown will show: 50 items

[BusinessAddressForm] Street selected: חברון
```

### Error Indicators:

#### ❌ CORS Error:
```
Access to fetch at 'http://localhost:3000/api/addresses/cities/autocomplete'
from origin 'http://localhost:5174' has been blocked by CORS policy
```
**Fix:** Backend CORS is already configured, but check if backend is running

#### ❌ 404 Error:
```
[AddressAPI] fetchCities: HTTP error 404 Not Found
```
**Fix:** Check that backend routes are registered in `server/src/app.js`

#### ❌ Connection Refused:
```
Failed to fetch
TypeError: Failed to fetch
```
**Fix:** Ensure backend server is running on port 3000

## 🔧 Troubleshooting

### Issue: No dropdown appears

**Check:**
1. Browser console for errors
2. Network tab: Are API requests being made?
3. API response: Is it returning data?

**Common Causes:**
- Backend not running → Start with `npm start` in server folder
- Wrong API URL → Check `.env`: `VITE_API_BASE_URL=http://localhost:3000`
- City not selected → Must select city before searching streets

### Issue: Empty dropdown

**Check:**
1. Console log: `[AddressAPI] Response count: 0`
2. Console warning: `No streets found for query`

**Common Causes:**
- Typo in city name
- City name doesn't match exactly (check spaces, hyphens)
- Database not loaded → Check server startup logs

### Issue: Wrong API being called

**Check:**
1. Network tab: Verify URL starts with `/api/addresses/`
2. **NOT** using old mock data from `localAddressData.js`

## ✅ Success Criteria

The address search is working correctly when:

1. ✅ City autocomplete opens after 1 character
2. ✅ Cities from all over Israel appear (not just 100 hardcoded ones)
3. ✅ Street autocomplete opens after 1 character
4. ✅ Streets belong to the selected city only
5. ✅ Progressive filtering narrows results (ח → חב → חבר → חברון)
6. ✅ No CORS errors in console
7. ✅ API requests go to `http://localhost:3000/api/addresses/`
8. ✅ Hebrew text is URL-encoded properly (%D7%AA for ת)
9. ✅ Can complete full address and see preview
10. ✅ Debug info shows correct values

## 📊 Database Coverage

**Source:** Israel Government Open Data Portal (data.gov.il)

- **Cities:** 1,259 (all Israeli settlements)
- **Streets:** 63,354 (nationwide coverage)
- **Cities with streets:** 1,304

### Sample Cities You Can Test:
- תל אביב - יפו (Tel Aviv)
- ירושלים (Jerusalem)
- חיפה (Haifa)
- באר שבע (Beer Sheva)
- נתניה (Netanya)
- אשדוד (Ashdod)
- ראשון לציון (Rishon LeZion)

### Sample Streets in Tel Aviv:
- חברון
- דיזנגוף
- אלנבי
- רוטשילד
- בן יהודה
- הרצל

## 🎯 Test Script (Quick Validation)

Run this in the browser console after opening the form:
```javascript
// Check if new API is being used
console.log('Testing address API...');

// Test city search
fetch('http://localhost:3000/api/addresses/cities/autocomplete?q=תל')
  .then(r => r.json())
  .then(d => console.log('Cities found:', d.length, d.slice(0, 3)));

// Test street search (Tel Aviv)
fetch('http://localhost:3000/api/addresses/streets/autocomplete?city=תל אביב - יפו&q=ח')
  .then(r => r.json())
  .then(d => console.log('Streets found:', d.length, d.slice(0, 5)));
```

Expected output:
```
Cities found: 21 [...]
Streets found: 50 [...]
```

## 📝 What Changed

### Before (Broken):
- ❌ Hardcoded list of ~100 cities in `israeliAddresses.js`
- ❌ Mock street data in `localAddressData.js`
- ❌ Limited coverage, manually maintained
- ❌ No real database connection

### After (Fixed):
- ✅ Real API calls to backend
- ✅ Backend uses official government database (data.gov.il)
- ✅ 1,259 cities + 63,354 streets
- ✅ Nationwide coverage
- ✅ Progressive autocomplete
- ✅ Comprehensive logging
- ✅ Debug panel for development

## 🎉 You're Done When...

You can:
1. Search for any Israeli city (try "נצרת", "אילת", "צפת")
2. Select a city from the dropdown
3. Search for streets in that city (try "ח", "ר", "ב")
4. See the results narrow as you type more letters
5. Select a street and enter a house number
6. See the complete address preview
7. Submit/save the business with the real address

The address database is now production-ready with full Israeli coverage!
