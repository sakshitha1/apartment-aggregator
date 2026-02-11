import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, '..', 'apartments-listings.db')

const db = new Database(DB_PATH, { readonly: true })

const app = express()
app.use(cors())
app.use(express.json())

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// The first row in every table is a header row – skip it with field1 != <header_value>
const HEADER_ZPID = 'zpid'

/**
 * Map a raw property_listings row (field1..field23) into a nice JSON shape.
 */
function mapListing(row) {
  const price = Number(row.field2) || 0
  const bedrooms = Number(row.field16) || 0
  const bathrooms = Number(row.field15) || 0
  const livingArea = Number(row.field12) || null
  const yearBuilt = Number(row.field11) || null
  const pageViewCount = Number(row.field17) || 0
  const favoriteCount = Number(row.field18) || 0

  return {
    id: row.field1,
    price,
    homeStatus: row.field3 || '',
    homeType: row.field4 || '',
    category: (row.field4 || '').toLowerCase().replace(/\s+/g, '-'),
    datePosted: row.field5 || null,
    streetAddress: row.field6 || '',
    city: row.field7 || '',
    state: row.field8 || '',
    zipcode: row.field9 || '',
    county: row.field10 || '',
    address: [row.field6, row.field7, row.field8, row.field9]
      .filter(Boolean)
      .join(', '),
    title: buildTitle(row),
    yearBuilt,
    livingArea,
    livingAreaUnits: row.field13 || 'sqft',
    rentZestimate: Number(row.field14) || null,
    bathrooms,
    bedrooms,
    rooms: bedrooms, // alias for frontend compatibility
    pageViewCount,
    favoriteCount,
    propertyTaxRate: Number(row.field19) || null,
    timeOnZillow: row.field20 || '',
    dateSold: row.field21 || null,
    url: row.field22 || '',
    lastUpdated: row.field23 || '',
    // Frontend compatibility fields
    isNew: isRecent(row.field5),
    badges: buildBadges(row),
    hasPhotos: false, // DB doesn't store photos
    photos: [],
    amenities: buildAmenities(row),
  }
}

function buildTitle(row) {
  const parts = []
  const bedrooms = Number(row.field16) || 0
  const type = row.field4 || 'Property'
  if (bedrooms > 0) parts.push(`${bedrooms}-Bed`)
  parts.push(type)
  if (row.field7) parts.push(`in ${row.field7}`)
  if (row.field8) parts.push(`${row.field8}`)
  return parts.join(' ')
}

function isRecent(datePosted) {
  if (!datePosted) return false
  try {
    const posted = new Date(datePosted)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return posted >= thirtyDaysAgo
  } catch {
    return false
  }
}

function buildBadges(row) {
  const badges = []
  if (row.field3 === 'Recently Sold') badges.push('Recently Sold')
  const views = Number(row.field17) || 0
  if (views >= 100) badges.push('Popular')
  return badges
}

function buildAmenities(row) {
  const amenities = []
  const bedrooms = Number(row.field16) || 0
  const bathrooms = Number(row.field15) || 0
  const area = Number(row.field12) || 0
  const yearBuilt = Number(row.field11) || 0
  if (bedrooms) amenities.push(`${bedrooms} Bedrooms`)
  if (bathrooms) amenities.push(`${bathrooms} Bathrooms`)
  if (area) amenities.push(`${area} ${row.field13 || 'sqft'}`)
  if (yearBuilt) amenities.push(`Built ${yearBuilt}`)
  return amenities
}

// ---------------------------------------------------------------------------
// Map homeType values to category keys used by the frontend
// ---------------------------------------------------------------------------
const HOME_TYPE_TO_CATEGORY = {
  apartment: 'apartment',
  condo: 'condo',
  'single family': 'single-family',
  'single-family': 'single-family',
  'multi family': 'multi-family',
  'multi-family': 'multi-family',
  townhouse: 'townhouse',
  manufactured: 'manufactured',
  lot: 'lot',
}

function categoryToSql(category) {
  // Reverse map: frontend category key -> homeType in DB
  const map = {
    apartment: 'Apartment',
    condo: 'Condo',
    'single-family': 'Single Family',
    'multi-family': 'Multi Family',
    townhouse: 'Townhouse',
    manufactured: 'Manufactured',
    lot: 'Lot',
  }
  return map[category] || null
}

// ---------------------------------------------------------------------------
// GET /api/listings
// Query params: maxPrice, minBedrooms, category, sort, limit, offset, q
// ---------------------------------------------------------------------------
app.get('/api/listings', (req, res) => {
  try {
    const {
      maxPrice,
      minBedrooms,
      bedrooms,
      rooms, // alias
      category,
      sort,
      limit: rawLimit,
      offset: rawOffset,
      q,
    } = req.query

    const conditions = [`field1 != ?`]
    const params = [HEADER_ZPID]

    // Price filter
    if (maxPrice && maxPrice !== 'any') {
      conditions.push(`CAST(field2 AS REAL) <= ?`)
      params.push(Number(maxPrice))
    }

    // Bedrooms filter (accept both "bedrooms", "minBedrooms", or legacy "rooms")
    const minBed = minBedrooms || bedrooms || rooms
    if (minBed && minBed !== 'any') {
      conditions.push(`CAST(field16 AS INTEGER) >= ?`)
      params.push(Number(minBed))
    }

    // Category / homeType filter
    if (category && category !== 'any') {
      const homeType = categoryToSql(category)
      if (homeType) {
        conditions.push(`field4 = ?`)
        params.push(homeType)
      }
    }

    // Text search (city, address, county)
    if (q && q.trim()) {
      const term = `%${q.trim()}%`
      conditions.push(`(field6 LIKE ? OR field7 LIKE ? OR field10 LIKE ?)`)
      params.push(term, term, term)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    // Count
    const countRow = db
      .prepare(`SELECT COUNT(*) AS total FROM property_listings ${where}`)
      .get(...params)

    // Sort
    let orderBy = 'ORDER BY CAST(field17 AS INTEGER) DESC' // default: popular (pageViewCount)
    if (sort === 'price_asc') orderBy = 'ORDER BY CAST(field2 AS REAL) ASC'
    else if (sort === 'price_desc') orderBy = 'ORDER BY CAST(field2 AS REAL) DESC'
    else if (sort === 'new') orderBy = 'ORDER BY field5 DESC'

    const limit = Math.min(Number(rawLimit) || 200, 500)
    const offset = Number(rawOffset) || 0

    const rows = db
      .prepare(
        `SELECT * FROM property_listings ${where} ${orderBy} LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset)

    const items = rows.map(mapListing)

    res.json({ items, total: countRow.total, limit, offset })
  } catch (err) {
    console.error('GET /api/listings error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/listings/:id
// ---------------------------------------------------------------------------
app.get('/api/listings/:id', (req, res) => {
  try {
    const { id } = req.params

    const row = db
      .prepare(`SELECT * FROM property_listings WHERE field1 = ? AND field1 != ?`)
      .get(id, HEADER_ZPID)

    if (!row) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    const listing = mapListing(row)

    // Enrich with price history
    const priceHistory = db
      .prepare(
        `SELECT * FROM listing_price_history WHERE field1 = ? AND field1 != ?`,
      )
      .all(id, HEADER_ZPID)
      .map((r) => ({
        event: r.field2,
        price: Number(r.field3) || 0,
        pricePerSqFt: Number(r.field4) || null,
        priceChangeRate: Number(r.field5) || null,
        date: r.field6,
        source: r.field7,
      }))

    // Nearby schools
    const schools = db
      .prepare(
        `SELECT * FROM listing_schools_info WHERE field1 = ? AND field1 != ?`,
      )
      .all(id, HEADER_ZPID)
      .map((r) => ({
        name: r.field2,
        rating: Number(r.field3) || null,
        type: r.field4,
        gradeLevel: r.field5,
        grades: r.field6,
        distance: r.field7,
        link: r.field8,
      }))

    // Tax info
    const taxRow = db
      .prepare(
        `SELECT * FROM listing_tax_info WHERE field1 = ? AND field1 != ?`,
      )
      .get(id, HEADER_ZPID)

    const taxInfo = taxRow
      ? {
          valueIncreaseRate: Number(taxRow.field4) || null,
          taxIncreaseRate: Number(taxRow.field5) || null,
          taxPaid: Number(taxRow.field6) || null,
          propertyValue: Number(taxRow.field7) || null,
        }
      : null

    // Mortgage info
    const mortgageRow = db
      .prepare(
        `SELECT * FROM listing_mortgage_info WHERE field1 = ? AND field1 != ?`,
      )
      .get(id, HEADER_ZPID)

    const mortgageInfo = mortgageRow
      ? {
          bucketType: mortgageRow.field2,
          rate: Number(mortgageRow.field3) || null,
          rateSource: mortgageRow.field4,
        }
      : null

    res.json({
      ...listing,
      priceHistory,
      schools,
      taxInfo,
      mortgageInfo,
    })
  } catch (err) {
    console.error('GET /api/listings/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/categories  – distinct homeTypes
// ---------------------------------------------------------------------------
app.get('/api/categories', (_req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT DISTINCT field4 AS homeType FROM property_listings WHERE field1 != ? AND field4 IS NOT NULL AND field4 != '' ORDER BY field4`,
      )
      .all(HEADER_ZPID)

    const categories = rows.map((r) => ({
      key: (r.homeType || '').toLowerCase().replace(/\s+/g, '-'),
      label: r.homeType,
    }))

    res.json(categories)
  } catch (err) {
    console.error('GET /api/categories error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`)
  const count = db
    .prepare(`SELECT COUNT(*) AS c FROM property_listings WHERE field1 != ?`)
    .get(HEADER_ZPID)
  console.log(`📊 ${count.c} listings loaded from ${DB_PATH}`)
})
