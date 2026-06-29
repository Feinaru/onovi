# PickMe - Critical Architecture Refactor Plan
## Single Source of Truth for Address Handling

---

## COMPONENT AUDIT TABLE

| Component Name | Location | Current Address Source | New Address Source | Status |
|----------------|----------|----------------------|-------------------|--------|
| **BusinessAddressForm** | `components/BusinessAddressForm.jsx` | ✅ Government API (`addressAPI.js`) | ✅ Government API | ✅ **OK** |
| **CityOnlySelector** | `components/CityOnlySelector.jsx` | ❌ Mock Data (`israeliAddresses.js`) | ✅ Government API | 🔄 **NEEDS FIX** |
| **LocationSelector** | `components/LocationSelector.jsx` | ❌ Mock Data (`israeliAddresses.js`) + Mock GPS (`geocoding.js`) | ✅ Government API + Real GPS | 🔄 **NEEDS FIX** |
| **AddressAutocomplete** | `components/AddressAutocomplete.jsx` | ❌ Mock Data (`israeliAddresses.js`) | ✅ Government API | 🔄 **NEEDS FIX** |
| **AddressSearchFilter** | `components/AddressSearchFilter.jsx` | ❌ Mock Data (`localAddressData.js`) | ✅ Government API | 🔄 **NEEDS FIX** |

---

## SERVICE FILES AUDIT

| Service File | Purpose | Contains | Action |
|--------------|---------|----------|--------|
| **addressAPI.js** | ✅ Real API calls to government database | `fetchCities()`, `fetchStreets()`, `fetchStats()` | ✅ **KEEP** - This is the ONLY allowed source |
| **israeliAddresses.js** | ❌ Mock data | 100 hardcoded cities, 50 hardcoded streets, fake GPS | 🗑️ **DELETE** |
| **localAddressData.js** | ❌ Mock data | 24 hardcoded cities, 78 streets in 5 cities | 🗑️ **DELETE** |
| **geocoding.js** | ❌ Fake GPS | Generates random addresses from mock data | 🗑️ **DELETE** |
| **israeliStreets.js** | ⚠️ Partial | May contain geocoding utils | 🔍 **REVIEW** then delete or refactor |

---

## MOCK DATA INVENTORY

### Files to DELETE Completely:

1. **`services/israeliAddresses.js`**
   - 100 hardcoded cities (vs 1,259 available)
   - 50 hardcoded common streets
   - Mock search functions
   - Fake GPS reverse geocoding (lines 275-280)
   - Used by: CityOnlySelector, LocationSelector, AddressAutocomplete

2. **`services/localAddressData.js`**
   - 24 hardcoded cities
   - Only 5 cities with streets (78 streets total vs 63,354 available)
   - Used by: AddressSearchFilter

3. **`services/geocoding.js`**
   - Generates fake addresses from GPS coordinates
   - Uses mock street names
   - Creates random house numbers
   - Used by: LocationSelector

---

## REFACTOR STRATEGY

### Phase 1: Create Unified Address Service ✅

**File:** `services/unifiedAddressService.js`

```javascript
/**
 * Unified Address Service - Single Source of Truth
 * All address operations go through this service
 * Backed by Israeli Government Database (data.gov.il)
 */

import { fetchCities, fetchStreets, fetchStats } from './addressAPI';

// City autocomplete (government database)
export async function searchCities(query) {
  if (!query || query.trim().length === 0) return [];
  const results = await fetchCities(query);
  return results.map(city => ({
    type: 'city',
    city: city.name,
    displayText: city.name,
    formattedAddress: city.name,
    code: city.code,
    nameEng: city.nameEng
  }));
}

// Street autocomplete (government database)
export async function searchStreets(cityName, query) {
  if (!cityName || !query || query.trim().length === 0) return [];
  const results = await fetchStreets(cityName, query);
  return results.map(street => ({
    type: 'street',
    city: cityName,
    street: street.name,
    displayText: street.name,
    code: street.code
  }));
}

// Combined address search (for autocomplete components)
export async function searchAddresses(query) {
  // First search cities
  const cities = await searchCities(query);

  // Parse if contains comma (city + street)
  if (query.includes(',')) {
    const parts = query.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const streetPart = parts[0];
      const cityPart = parts[1];

      // Search for streets in matching cities
      const cityMatches = await searchCities(cityPart);
      if (cityMatches.length > 0) {
        const city = cityMatches[0].city;
        const streets = await searchStreets(city, streetPart);
        return [...cities, ...streets];
      }
    }
  }

  return cities;
}

// GPS - Coordinates only (no fake addresses)
export async function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('GPS not available'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}

// Database stats
export async function getAddressStats() {
  return await fetchStats();
}
```

### Phase 2: Update Each Component

#### **CityOnlySelector**
- **Current:** Uses `israeliAddresses.js` (100 cities)
- **New:** Uses `unifiedAddressService.searchCities()` (1,259 cities)
- **Changes:**
  - Replace `import { searchCities } from '../services/israeliAddresses'`
  - With: `import { searchCities } from '../services/unifiedAddressService'`
  - Make async/await
  - Remove `ISRAELI_CITIES` constant usage

#### **LocationSelector**
- **Current:** Uses `israeliAddresses.js` + `geocoding.js` (fake GPS)
- **New:** Uses `unifiedAddressService` + coordinates only
- **Changes:**
  - Replace city search with unified service
  - Remove `reverseGeocode` (fake addresses)
  - GPS returns coordinates only
  - Show "לא הצלחנו לזהות כתובת מדויקת" + manual selection
  - Remove all fake address generation

#### **AddressAutocomplete**
- **Current:** Uses `israeliAddresses.js` (mock search)
- **New:** Uses `unifiedAddressService.searchAddresses()`
- **Changes:**
  - Replace all imports
  - Update to async search
  - Remove `getCityCoordinates` (hardcoded coords)
  - Use real geocoding service or remove coords

#### **AddressSearchFilter**
- **Current:** Uses `localAddressData.js` (5 cities, 78 streets)
- **New:** Uses `unifiedAddressService` (1,259 cities, 63,354 streets)
- **Changes:**
  - Replace `getLocalStreetAutocomplete`
  - With: `unifiedAddressService.searchStreets()`
  - Make async/await
  - Progressive filtering via API

### Phase 3: Delete Mock Data Files

```bash
rm client/src/services/israeliAddresses.js
rm client/src/services/localAddressData.js
rm client/src/services/geocoding.js
# Review and potentially remove israeliStreets.js
```

### Phase 4: Update Tests

- Update any test files that import deleted services
- Add tests for unified service
- Verify API calls work correctly

---

## GPS HANDLING - NEW RULES

### ✅ ALLOWED:
```javascript
// Get GPS coordinates
const { latitude, longitude } = await getCurrentPosition();

// Show to user: "לא הצלחנו לזהות כתובת מדויקת"
// Allow manual city/street selection
```

### ❌ NOT ALLOWED:
```javascript
// Generate fake address
const mockStreets = ['הרצל', 'בן גוריון', ...];
const randomStreet = mockStreets[Math.floor(Math.random() * mockStreets.length)];
const address = { street: randomStreet, city: nearestCity };  // NEVER DO THIS!
```

### GPS Flow:
1. Get coordinates (latitude, longitude)
2. Attempt reverse geocoding with **real service** (Nominatim, Google, etc.)
3. If successful: Show detected address for confirmation
4. If failed: Show message "לא הצלחנו לזהות כתובת מדויקת" + manual selection
5. **NEVER** combine coordinates with random/mock street names

---

## VALIDATION RULES

### ✅ Single Source of Truth

**All validation must use:**
```javascript
// Check if city exists
const cities = await searchCities(cityName);
const cityExists = cities.some(c => c.city === cityName);

// Check if street exists in city
const streets = await searchStreets(cityName, streetName);
const streetExists = streets.some(s => s.street === streetName);
```

**Never use:**
```javascript
// WRONG - hardcoded array
const cityExists = ISRAELI_CITIES.includes(cityName);

// WRONG - hardcoded street list
const streetExists = COMMON_STREETS.includes(streetName);
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Setup ✅
- [x] Create `unifiedAddressService.js`
- [x] Export all necessary functions
- [x] Verify API calls work

### Phase 2: Component Updates
- [ ] Update CityOnlySelector
- [ ] Update LocationSelector
- [ ] Update AddressAutocomplete
- [ ] Update AddressSearchFilter
- [ ] Test each component individually

### Phase 3: Cleanup
- [ ] Delete `israeliAddresses.js`
- [ ] Delete `localAddressData.js`
- [ ] Delete `geocoding.js`
- [ ] Review `israeliStreets.js`
- [ ] Update all imports

### Phase 4: Testing
- [ ] Test city selection across all pages
- [ ] Test street selection in all contexts
- [ ] Test GPS flow (coordinates only)
- [ ] Test search functionality
- [ ] Test business creation
- [ ] Verify no mock data remains

### Phase 5: Verification
- [ ] Grep for `israeliAddresses` - should return 0 results
- [ ] Grep for `localAddressData` - should return 0 results
- [ ] Grep for `ISRAELI_CITIES` - should return 0 results
- [ ] Grep for `COMMON_STREETS` - should return 0 results
- [ ] Grep for `mockStreets` - should return 0 results

---

## EXPECTED OUTCOMES

### Before Refactor:
- ❌ 5 different address systems
- ❌ 100-city limitation in most features
- ❌ Fake GPS addresses generated
- ❌ Inconsistent UX across pages
- ❌ 92% of Israeli cities inaccessible

### After Refactor:
- ✅ **1 unified address system**
- ✅ All 1,259 cities accessible everywhere
- ✅ All 63,354 streets accessible
- ✅ Real GPS (coordinates only, no fakes)
- ✅ Consistent UX across all pages
- ✅ Single source of truth
- ✅ No mock data anywhere

---

## FILES THAT WILL BE CHANGED

### New Files:
1. `client/src/services/unifiedAddressService.js` - **NEW** single source of truth

### Modified Files:
1. `client/src/components/CityOnlySelector.jsx` - Update imports & make async
2. `client/src/components/LocationSelector.jsx` - Update imports, remove fake GPS
3. `client/src/components/AddressAutocomplete.jsx` - Update imports & make async
4. `client/src/components/AddressSearchFilter.jsx` - Update imports & make async

### Deleted Files:
1. `client/src/services/israeliAddresses.js` - **DELETE**
2. `client/src/services/localAddressData.js` - **DELETE**
3. `client/src/services/geocoding.js` - **DELETE**

### Kept Files:
1. `client/src/services/addressAPI.js` - **KEEP** (backend connection)
2. `client/src/components/BusinessAddressForm.jsx` - **NO CHANGE** (already correct)

---

## ROLLBACK PLAN

If issues arise:
1. Revert to git before refactor: `git checkout HEAD~1`
2. Individual component issues: Revert specific file
3. API issues: Check backend server running
4. Missing data: Verify address database loaded

---

**Refactor Date:** June 26, 2026
**Estimated Time:** 3-4 hours
**Priority:** CRITICAL - Blocks production deployment
**Risk Level:** Medium (well-planned, incremental changes)
