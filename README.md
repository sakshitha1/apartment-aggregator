# Apartment Aggregator

A full-stack real estate property listing platform with **18,700+ real listings**, advanced market intelligence, AI-powered natural language search, and smart alert notifications.

---

## Features

### Property Search & Filtering
- **Text search** across city, address, and county
- **Property type** filter (Single Family, Condo, Apartment, Townhouse, Multi Family, Manufactured, Lot)
- **Price range** filter with min/max inputs and a drag slider
- **Bedrooms** (Any, 1+, 2+, 3+, 4+, 5+)
- **Bathrooms** (Any, 1+, 2+, 3+, 4+) — in expanded filters
- **Listing status** (For Sale, Recently Sold, For Rent, etc.)
- **State** selector (dynamically populated from data)
- **County** text filter
- **Living area** (min/max sqft)
- **Year built** (from/to range)
- **Minimum Value Score** slider (0–100)
- **Sort by**: Most Popular, Best Value Score, Newest Listings, Price Asc/Desc

### AI Smart Search
Natural language queries are parsed by **Groq (Llama 3.3-70b)** into structured filters. Supports all filter dimensions including:
- Price range, bedrooms, bathrooms, property type
- City, state, county
- Living area, year built
- Listing status, minimum value score
- Sort order

After parsing, a summary badge shows exactly which filters were applied.

**AI Match % Scoring:** When a natural language search is applied, each listing card displays a match percentage badge scored against the original query using the keyword matching engine. Results automatically sort by **Best Match %** — the sort order the AI infers is the most relevant for the query. You can re-sort by any other criteria while the match badges remain visible, or clear AI mode entirely with the × button in the header.

### Market Intelligence
- **Value Score (0–100)**: Composite metric — 40% price vs. city median, 20% living area, 20% freshness, 20% popularity
- **Market Labels**: Great Deal / Below Market / Market Price / Slightly Above / Premium
- **City Price Widget**: Compares the listing against P25/Median/P75/P90 for its city, plus a **KNN Model Estimate** (violet marker) showing the ML-predicted fair price for the property — including how far above or below the estimate the listing is priced
- **City Trends Chart**: Average prices in a city over time (since 2000)

### Property Detail Page
Each listing shows:
- Address, price, status, price per sqft
- Map or photo (OpenStreetMap via Nominatim)
- Value Score badge + Market Label
- Quick facts: type, beds, baths, area, year built, county
- Preference match badge (keyword-based scoring)
- **Price History** interactive chart (listing_price_history table)
- **Tax History** (annual tax paid, assessed value, multi-year dropdown)
- **Mortgage Rates** (30yr fixed, ARM, etc.)
- **Nearby Schools** (name, rating, distance, grades)
- **Nearby Comparable Homes**
- **Subtype badges**: New Construction, Foreclosure, Open House, Pending
- **Route Calculator**: Travel time/distance from property (driving/walking/cycling via OSRM)
- External Zillow link

### Preference Matching & Alerts
Set preferences via the notification bell icon in the navbar. The system checks every 5 minutes and on preference changes.

**Structured preference filters:**
| Field | Description |
|---|---|
| City | Target city (partial match) |
| State | 2-letter state code |
| County | County name (partial match) |
| Max / Min Price | Price bounds |
| Min Bedrooms | Minimum bedroom count |
| Min Bathrooms | Minimum bathroom count |
| Property Type | Category slug (e.g. condo, single-family) |
| Status | Listing status (FOR_SALE, RECENTLY_SOLD, etc.) |
| Year Built From | Minimum year built |
| Min Area | Minimum living area in sqft |
| Min Value Score | Quality threshold (default 70) |
| Keywords | Free-form text for on-page preference match scoring |

**Keyword matching engine** (`PreferenceMatcher.jsx`) evaluates keywords against listing data with rules for:
- Size (spacious, cozy, medium)
- Age (modern/new construction, renovated, historic, mid-century)
- Bedrooms (studio, 2 bed, family, estate)
- Bathrooms (en-suite, 2 bath, 3 bath)
- Price tier (affordable, mid-range, luxury, ultra luxury)
- Market position (deal, bargain, great deal, high value, fair price)
- Investment potential (rental income, ROI)
- Popularity (popular, very popular, favorited)
- Property type (condo, house, apartment, townhouse, new home, foreclosure)
- Listing status (for sale, recently sold, pending, open house)
- 30+ neutral/unverifiable keywords (counted as partial matches)

### Comparison Tool
Select up to 4 listings and compare them side-by-side on the Compare page.

### Favorites
Save listings to a favorites list (persisted via backend for authenticated users).

### User Accounts
Register/login with JWT authentication. Required for favorites and some personalization features.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion |
| Backend | Node.js, Express 5 |
| Database | SQLite via better-sqlite3 |
| AI Search | Groq API (Llama 3.3-70b-versatile) |
| Maps / Routing | OpenStreetMap (Nominatim) + OSRM |
| Auth | JWT + bcryptjs |

---

## Directory Structure

```
aptAgrFin/
├── README.md
├── apartments-listings.db      # SQLite database (~18,700 listings)
├── property_listings.csv       # Source data
├── list_info/                  # Supplemental CSV data (schools, taxes, KNN prices, etc.)
│   ├── knn_price.csv           # KNN model price estimates per listing (loaded at startup)
├── models/                     # CatBoost ML model assets
│
├── backend/
│   ├── server.js               # Express API server (port 3001)
│   └── package.json
│
└── frontend/
    ├── index.html
    ├── vite.config.js          # Dev server on port 5000, proxies /api → 3001
    ├── package.json
    └── src/
        ├── main.jsx            # React entry point
        ├── App.jsx             # Router setup
        ├── api/
        │   ├── ai.js           # Groq AI natural language parser
        │   ├── client.js       # Base fetch wrapper
        │   └── listings.js     # Listing API calls
        ├── components/
        │   ├── FilterBar.jsx           # Main filter sidebar
        │   ├── NaturalSearchBar.jsx    # AI smart search input
        │   ├── NotificationBell.jsx    # Alert preferences panel
        │   ├── PreferenceMatcher.jsx   # Keyword matching engine + badge
        │   ├── ListingCard.jsx         # Property card in search results
        │   ├── ValueScoreBadge.jsx     # Value score indicator
        │   ├── MarketLabel.jsx         # Market position label
        │   ├── PriceTrendsChart.jsx    # Price history chart
        │   ├── StaticMap.jsx           # OpenStreetMap map embed
        │   ├── RouteCalculator.jsx     # Commute calculator
        │   ├── CompareBar.jsx          # Floating compare selection bar
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   └── ...
        ├── context/
        │   ├── PreferencesContext.jsx  # Alert preferences + auto-check logic
        │   ├── AuthContext.jsx         # Login/register state
        │   ├── FavoritesContext.jsx    # Saved favorites
        │   └── CompareContext.jsx      # Comparison selection
        ├── data/
        │   └── mockListings.js         # Category definitions, helpers
        ├── hooks/
        │   ├── useListings.js          # Listings fetch + loading state
        │   └── useListing.js           # Single listing fetch
        └── pages/
            ├── HomePage.jsx            # Landing page with market stats
            ├── SearchResultsPage.jsx   # Main search + filter results
            ├── ListingDetailsPage.jsx  # Full property detail view
            ├── AlertsPage.jsx          # Alert results list
            ├── FavoritesPage.jsx       # Saved listings
            ├── ComparePage.jsx         # Side-by-side comparison
            └── AddListingWizardPage.jsx
```

---

## Getting Started

### Prerequisites
- Node.js 18+ (22 recommended)
- A [Groq API key](https://console.groq.com/) for the AI smart search feature

### 1. Install dependencies

```bash
# Backend
cd aptAgrFin/backend && npm install

# Frontend
cd aptAgrFin/frontend && npm install
```

### 2. Configure environment

Create `aptAgrFin/frontend/.env`:
```
VITE_GROQ_API_KEY=your_groq_api_key_here
```

The backend reads from `apartments-listings.db` in the `aptAgrFin/` root directory. No additional configuration is needed for the database.

### 3. Start the backend (port 3001)

```bash
cd aptAgrFin/backend
npm run dev        # with file watching
# or
npm start          # production
```

### 4. Start the frontend (port 5000)

```bash
cd aptAgrFin/frontend
npm run dev
```

The Vite dev server proxies all `/api` requests to `http://localhost:3001` automatically.

Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## API Reference

### `GET /api/listings`
List and filter property listings.

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Text search (city, address, county) |
| `category` | string | Property type: `single-family`, `apartment`, `condo`, `townhouse`, `multi-family`, `manufactured`, `lot` |
| `state` | string | 2-letter state code |
| `homeStatus` | string | Listing status (e.g. `FOR_SALE`, `RECENTLY_SOLD`) |
| `minPrice` / `maxPrice` | number | Price range |
| `rooms` / `minBedrooms` | number | Minimum bedrooms |
| `bathrooms` | number | Minimum bathrooms |
| `minArea` / `maxArea` | number | Living area in sqft |
| `yearBuiltMin` / `yearBuiltMax` | number | Year built range |
| `county` | string | County filter (partial match) |
| `minValueScore` | number | Minimum value score (0–100, applied post-fetch) |
| `sort` | string | `price_asc`, `price_desc`, `new`, `value_score` (default: popular) |
| `limit` | number | Page size (max 500, default 200) |
| `offset` | number | Pagination offset |

### `GET /api/listings/:id`
Single listing detail including price history, schools, tax info, mortgage rates, subtypes, and nearby homes.

### `GET /api/listings/batch`
Fetch multiple listings by comma-separated IDs (`?ids=123,456`).

### `GET /api/alerts/check`
Find high-value listings matching user preferences.

| Parameter | Description |
|---|---|
| `city` | City filter (partial match) |
| `county` | County filter (partial match) |
| `state` | State code |
| `maxPrice` / `minPrice` | Price range |
| `minBedrooms` / `minBathrooms` | Minimum rooms |
| `category` | Property type slug |
| `homeStatus` | Listing status |
| `minArea` / `maxArea` | Area range |
| `yearBuiltMin` / `yearBuiltMax` | Year built range |
| `minValueScore` | Value score threshold (default: 70) |
| `limit` | Max results (default: 50, max: 200) |

### `GET /api/categories` — Distinct property types
### `GET /api/states` — All distinct state codes
### `GET /api/statuses` — All distinct listing statuses
### `GET /api/stats` — Platform-wide summary statistics
### `GET /api/market-stats?city=...` — Price percentiles and trends for a city
### `POST /api/auth/register` — Create user account
### `POST /api/auth/login` — Login and receive JWT
### `GET /api/proxy/geocode?q=...` — Server-side Nominatim geocoding proxy
### `GET /api/proxy/route?from=lat,lon&to=lat,lon&mode=driving` — OSRM routing proxy

---

## Database Schema

The primary table is `property_listings` with columns mapped as `field1`–`field23`:

| Column | Field | Description |
|---|---|---|
| field1 | zpid | Unique property ID (PK) |
| field2 | price | Listing price |
| field3 | homeStatus | Listing status |
| field4 | homeType | Property type |
| field5 | datePosted | Date posted |
| field6 | streetAddress | Street address |
| field7 | city | City |
| field8 | state | State (2-letter) |
| field9 | zipcode | ZIP code |
| field10 | county | County |
| field11 | yearBuilt | Year built |
| field12 | livingArea | Living area (sqft) |
| field13 | livingAreaUnits | Area unit (sqft) |
| field14 | rentZestimate | Estimated rental value |
| field15 | bathrooms | Bathroom count |
| field16 | bedrooms | Bedroom count |
| field17 | pageViewCount | Zillow page views |
| field18 | favoriteCount | Zillow favorites |
| field19 | propertyTaxRate | Property tax rate |
| field20 | timeOnZillow | Days on Zillow |
| field21 | dateSold | Date sold (if applicable) |
| field22 | url | Zillow listing URL |
| field23 | lastUpdated | Last update timestamp |

**Related tables:**
- `listing_price_history` — Price change events with date, rate, price/sqft
- `listing_schools_info` — Nearby schools with rating, distance, grade levels
- `listing_tax_info` — Annual tax paid, assessed value, multi-year history
- `listing_mortgage_info` — Rate types (30yr fixed, ARM, etc.) and current rates
- `listing_subtype` — Boolean flags: New Home, Foreclosure, Open House, Pending
- `listing_nearby_homes` — Comparable properties with address and price
- `users` — Registered user accounts
- `favorites` — User-saved property IDs
