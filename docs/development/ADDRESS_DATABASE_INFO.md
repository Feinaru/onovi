# Israeli Address Database

## Source

**Official Government Data Source: data.gov.il**
- Source: Israel Government Open Data Portal (data.gov.il)
- Official API: https://data.gov.il/api/3/action/datastore_search

## Database Resources

### 1. Cities (Settlements)
- **Resource ID**: `d4901968-dad3-4845-a9b0-a57d027f11ab`
- **Total Records**: 1,259 cities/settlements
- **Data Fields**:
  - City code (סמל_ישוב)
  - Hebrew name (שם_ישוב)
  - English name (שם_ישוב_לועזי)

### 2. Streets by City
- **Resource ID**: `9ad3862c-8391-4b2f-84a4-2d4c68625f4b`
- **Total Records**: 63,354 streets
- **Coverage**: 1,304 cities with street data
- **Data Fields**:
  - City code (סמל_ישוב)
  - City name (שם_ישוב)
  - Street code (סמל_רחוב)
  - Street name (שם_רחוב)

## Database Statistics

```json
{
  "source": "data.gov.il - Israel Government Open Data Portal",
  "totalCities": 1259,
  "totalStreets": 63354,
  "citiesWithStreets": 1304
}
```

## API Endpoints

### 1. Get Database Statistics
```
GET /api/addresses/stats
```

Returns database metadata and download information.

### 2. City Autocomplete
```
GET /api/addresses/cities/autocomplete?q=<query>
```

**Parameters:**
- `q` - Search query (Hebrew or English)

**Returns:** Array of cities matching the query (max 50 results)

**Example:**
```bash
curl "http://localhost:3000/api/addresses/cities/autocomplete?q=תל"
```

**Response:**
```json
[
  {
    "code": 5000,
    "name": "תל אביב - יפו",
    "nameEng": "TEL AVIV - YAFO"
  },
  ...
]
```

### 3. Street Autocomplete by City
```
GET /api/addresses/streets/autocomplete?city=<cityName>&q=<query>
```

**Parameters:**
- `city` - City name (Hebrew or English, must match exactly)
- `q` - Search query for street name

**Returns:** Array of streets in the specified city matching the query (max 50 results)

**Example:**
```bash
curl "http://localhost:3000/api/addresses/streets/autocomplete?city=תל%20אביב%20-%20יפו&q=חברון"
```

**Response:**
```json
[
  {
    "code": 1141,
    "name": "חברון"
  }
]
```

## Progressive Filtering Example

The API supports progressive narrowing of results as the user types:

```
Query "ח"      → 50 results  (all streets containing 'ח')
Query "חב"     → 20 results  (streets containing 'חב')
Query "חבר"    → 5 results   (streets containing 'חבר')
Query "חברון"  → 1 result    (exact match: "חברון")
```

This behavior ensures:
- Every valid street in the selected city will appear
- Results narrow progressively as more characters are typed
- No manual street list maintenance required
- Real-time autocomplete functionality

## Setup Instructions

### 1. Download Address Database

Run the fetch script to download the complete Israeli address database:

```bash
node scripts/fetch-addresses.js
```

This will:
- Download all 1,259 cities from data.gov.il
- Download all 63,354 streets from data.gov.il
- Save data to `data/cities.json` and `data/streets.json`
- Generate statistics in `data/stats.json`
- Takes approximately 7-8 seconds

### 2. Start the Server

```bash
npm start
```

The server will automatically load the address database on startup.

### 3. Test the API

```bash
node test-addresses.js
```

## Files

- `scripts/fetch-addresses.js` - Download script for address database
- `data/cities.json` - Cities database (1,259 records)
- `data/streets.json` - Streets database (63,354 records, grouped by city)
- `data/stats.json` - Database statistics and metadata
- `src/routes/address.routes.js` - API routes for address autocomplete
- `test-addresses.js` - Test script demonstrating API functionality

## Data Characteristics

### Real Nationwide Coverage
- ✅ All Israeli cities and settlements
- ✅ All streets in each city
- ✅ Official government data
- ✅ Regularly updated at source

### Not Included
- ❌ No manually hardcoded street lists
- ❌ No small sample datasets
- ❌ No artificial limitations

### Data Quality
- Official Israeli government source
- Comprehensive nationwide coverage
- Includes both Hebrew and English names
- Unique codes for cities and streets
- Suitable for production use

## Updating the Database

To refresh the address database with the latest data from data.gov.il:

```bash
node scripts/fetch-addresses.js
```

Then restart the server to load the updated data.

## License and Attribution

Data source: Israel Government Open Data Portal (data.gov.il)
Data is publicly available and provided by the Israeli government for public use.
