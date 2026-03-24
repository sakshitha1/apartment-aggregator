import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import { parse } from 'csv-parse/sync'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, '..', 'apartments-listings.db')
const CSV_PATH = path.resolve(__dirname, '..', 'property_listings.csv')
const LIST_INFO_DIR = path.resolve(__dirname, '..', 'list_info')
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key'

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function csvLineParse(line) {
  const result = []
  let current = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function bulkImportCSV(writeDb, filePath, stmt, mapFn) {
  if (!fs.existsSync(filePath)) return 0
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  let count = 0
  const BATCH = 5000
  let batch = []
  const run = writeDb.transaction((rows) => {
    for (const r of rows) {
      try { stmt.run(mapFn(r)); count++ } catch { }
    }
  })
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    batch.push(csvLineParse(line))
    if (batch.length >= BATCH) { run(batch); batch = [] }
  }
  if (batch.length) run(batch)
  return count
}

function importListInfoCsvs() {
  if (!fs.existsSync(LIST_INFO_DIR)) return

  const writeDb = new Database(DB_PATH)
  try {
    const alreadyDone = writeDb
      .prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='listing_price_history' AND sql LIKE '%dateOfEvent%'")
      .get().c > 0
    if (alreadyDone) {
      const n = writeDb.prepare('SELECT COUNT(*) as c FROM listing_price_history').get().c
      if (n > 100) { writeDb.close(); console.log(`✅ Extended data already loaded`); return }
    }

    console.log('📥 Importing extended listing data from list_info/…')
    writeDb.exec(`
      DROP TABLE IF EXISTS listing_price_history;
      DROP TABLE IF EXISTS listing_schools_info;
      DROP TABLE IF EXISTS listing_tax_info;
      DROP TABLE IF EXISTS listing_mortgage_info;
      DROP TABLE IF EXISTS listing_subtype;
      DROP TABLE IF EXISTS listing_nearby_homes;
    `)
    writeDb.exec(`
      CREATE TABLE listing_price_history (
        zpid TEXT, event TEXT, price REAL, pricePerSquareFoot REAL,
        priceChangeRate REAL, dateOfEvent TEXT, source TEXT,
        postingIsRental TEXT, lastUpdated TEXT
      );
      CREATE INDEX idx_ph_zpid ON listing_price_history(zpid);

      CREATE TABLE listing_subtype (
        zpid TEXT PRIMARY KEY, is_FSBA INTEGER, is_comingSoon INTEGER,
        is_newHome INTEGER, is_pending INTEGER, is_forAuction INTEGER,
        is_foreclosure INTEGER, is_bankOwned INTEGER, is_openHouse INTEGER,
        is_FSBO INTEGER, lastUpdated TEXT
      );

      CREATE TABLE listing_tax_info (
        zpid TEXT, lastUpdatedTimestamp TEXT, lastUpdatedDate TEXT,
        valueIncreaseRate REAL, taxIncreaseRate REAL, taxPaid REAL, propertyValue REAL
      );
      CREATE INDEX idx_tax_zpid ON listing_tax_info(zpid);

      CREATE TABLE listing_schools_info (
        zpid TEXT, schoolName TEXT, schoolRating REAL, type TEXT,
        gradeLevel TEXT, grades TEXT, distanceFromListing REAL,
        link TEXT, lastUpdated TEXT
      );
      CREATE INDEX idx_sch_zpid ON listing_schools_info(zpid);

      CREATE TABLE listing_mortgage_info (
        zpid TEXT, bucketType TEXT, rate REAL, rateSource TEXT,
        lastUpdatedTimestamp TEXT, lastUpdatedDate TEXT
      );
      CREATE INDEX idx_mort_zpid ON listing_mortgage_info(zpid);

      CREATE TABLE listing_nearby_homes (
        zpid TEXT, zpidComp TEXT, addressComp TEXT, cityComp TEXT,
        stateComp TEXT, zipComp TEXT, priceComp REAL, homeTypeComp TEXT,
        homeStatusComp TEXT, livingAreaValueComp REAL, livingAreaUnitsComp TEXT,
        lotAreaValueComp REAL, lotAreaUnitsComp TEXT, lastUpdated TEXT
      );
      CREATE INDEX idx_nbr_zpid ON listing_nearby_homes(zpid);
    `)

    const n1 = bulkImportCSV(writeDb, path.join(LIST_INFO_DIR, 'listing_price_history.csv'),
      writeDb.prepare('INSERT INTO listing_price_history VALUES (?,?,?,?,?,?,?,?,?)'),
      (c) => [c[0] || null, c[1] || null, +c[2] || null, +c[3] || null, +c[4] || null, c[5] || null, c[6] || null, c[7] || null, c[8] || null])
    console.log(`   price_history: ${n1} rows`)

    const n2 = bulkImportCSV(writeDb, path.join(LIST_INFO_DIR, 'listing_subtype.csv'),
      writeDb.prepare('INSERT OR REPLACE INTO listing_subtype VALUES (?,?,?,?,?,?,?,?,?,?,?)'),
      (c) => [c[0] || null, c[1] === 'true' ? 1 : 0, c[2] === 'true' ? 1 : 0, c[3] === 'true' ? 1 : 0, c[4] === 'true' ? 1 : 0, c[5] === 'true' ? 1 : 0, c[6] === 'true' ? 1 : 0, c[7] === 'true' ? 1 : 0, c[8] === 'true' ? 1 : 0, c[9] === 'true' ? 1 : 0, c[10] || null])
    console.log(`   subtype: ${n2} rows`)

    const n3 = bulkImportCSV(writeDb, path.join(LIST_INFO_DIR, 'listing_tax_info.csv'),
      writeDb.prepare('INSERT INTO listing_tax_info VALUES (?,?,?,?,?,?,?)'),
      (c) => [c[0] || null, c[1] || null, c[2] || null, +c[3] || null, +c[4] || null, +c[5] || null, +c[6] || null])
    console.log(`   tax_info: ${n3} rows`)

    const n4 = bulkImportCSV(writeDb, path.join(LIST_INFO_DIR, 'listing_schools_info.csv'),
      writeDb.prepare('INSERT INTO listing_schools_info VALUES (?,?,?,?,?,?,?,?,?)'),
      (c) => [c[0] || null, c[1] || null, +c[2] || null, c[3] || null, c[4] || null, c[5] || null, +c[6] || null, c[7] || null, c[8] || null])
    console.log(`   schools: ${n4} rows`)

    const n5 = bulkImportCSV(writeDb, path.join(LIST_INFO_DIR, 'listing_mortgage_info.csv'),
      writeDb.prepare('INSERT INTO listing_mortgage_info VALUES (?,?,?,?,?,?)'),
      (c) => [c[0] || null, c[1] || null, +c[2] || null, c[3] || null, c[4] || null, c[5] || null])
    console.log(`   mortgage: ${n5} rows`)

    const n6 = bulkImportCSV(writeDb, path.join(LIST_INFO_DIR, 'listing_nearby_homes.csv'),
      writeDb.prepare('INSERT INTO listing_nearby_homes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'),
      (c) => [c[0] || null, c[1] || null, c[2] || null, c[3] || null, c[4] || null, c[5] || null, +c[6] || null, c[7] || null, c[8] || null, +c[9] || null, c[10] || null, +c[11] || null, c[12] || null, c[13] || null])
    console.log(`   nearby_homes: ${n6} rows`)

    console.log('✅ Extended data import complete')
  } catch (err) {
    console.error('❌ Error importing list_info:', err)
  } finally {
    writeDb.close()
  }
}

function ensureDatabaseExists() {
  if (fs.existsSync(DB_PATH)) return

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ Missing database file: ${DB_PATH}`)
    console.error(
      `❌ Also couldn't find CSV to build it: ${CSV_PATH}\n` +
      `Put 'apartments-listings.db' in the repo root, or place 'property_listings.csv' there so it can be imported.`,
    )
    process.exit(1)
  }

  console.log(`🛠️  Building SQLite DB from ${CSV_PATH} ...`)

  const buildDb = new Database(DB_PATH)

  const cols23 = Array.from({ length: 23 }, (_, i) => `field${i + 1} TEXT`).join(', ')
  buildDb.exec(`CREATE TABLE IF NOT EXISTS property_listings (${cols23});`)

  const cols7 = Array.from({ length: 7 }, (_, i) => `field${i + 1} TEXT`).join(', ')
  const cols8 = Array.from({ length: 8 }, (_, i) => `field${i + 1} TEXT`).join(', ')
  const cols4 = Array.from({ length: 4 }, (_, i) => `field${i + 1} TEXT`).join(', ')
  buildDb.exec(`CREATE TABLE IF NOT EXISTS listing_price_history (${cols7});`)
  buildDb.exec(`CREATE TABLE IF NOT EXISTS listing_schools_info (${cols8});`)
  buildDb.exec(`CREATE TABLE IF NOT EXISTS listing_tax_info (${cols7});`)
  buildDb.exec(`CREATE TABLE IF NOT EXISTS listing_mortgage_info (${cols4});`)

  const csvText = fs.readFileSync(CSV_PATH, 'utf8')
  const records = parse(csvText, {
    relax_column_count: true,
    skip_empty_lines: true,
  })

  const placeholders23 = Array.from({ length: 23 }, () => '?').join(', ')
  const insertListing = buildDb.prepare(
    `INSERT INTO property_listings VALUES (${placeholders23})`,
  )

  const padTo = (arr, n) => {
    const out = arr.slice(0, n)
    while (out.length < n) out.push('')
    return out
  }

  const insertMany = buildDb.transaction((rows) => {
    for (const r of rows) {
      const vals = padTo(r.map((v) => (v == null ? '' : String(v))), 23)
      insertListing.run(vals)
    }
  })

  insertMany(records)

  buildDb.prepare(`INSERT INTO listing_price_history VALUES (?, ?, ?, ?, ?, ?, ?)`).run('zpid', '', '', '', '', '', '')
  buildDb.prepare(`INSERT INTO listing_schools_info VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('zpid', '', '', '', '', '', '', '')
  buildDb.prepare(`INSERT INTO listing_tax_info VALUES (?, ?, ?, ?, ?, ?, ?)`).run('zpid', '', '', '', '', '', '')
  buildDb.prepare(`INSERT INTO listing_mortgage_info VALUES (?, ?, ?, ?)`).run('zpid', '', '', '')

  buildDb.close()
  console.log(`✅ Created ${DB_PATH}`)
}

ensureDatabaseExists()

function ensureUserTablesExist() {
  const writeDb = new Database(DB_PATH)
  writeDb.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, nickname TEXT UNIQUE, password_hash TEXT);`)
  writeDb.exec(`CREATE TABLE IF NOT EXISTS user_saved_listings (user_id TEXT, zpid TEXT, type TEXT, PRIMARY KEY(user_id, zpid, type));`)
  writeDb.close()
  console.log('✅ Ensured user tables exist')
}
ensureUserTablesExist()
importListInfoCsvs()

const db = new Database(DB_PATH, { readonly: true })

// ---------------------------------------------------------------------------
// Market statistics (computed once at startup, cached in memory)
// ---------------------------------------------------------------------------

const HEADER_ZPID = 'zpid'

function percentile(sorted, p) {
  if (!sorted.length) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower)
}

let cityMarketStats = {}

function computeCityMarketStats() {
  console.log('📊 Computing city market statistics…')
  const rows = db
    .prepare(
      `SELECT field7 AS city, CAST(field2 AS REAL) AS price
       FROM property_listings
       WHERE field1 != ? AND CAST(field2 AS REAL) > 0 AND field7 != '' AND field7 IS NOT NULL`,
    )
    .all(HEADER_ZPID)

  const byCity = {}
  for (const row of rows) {
    if (!byCity[row.city]) byCity[row.city] = []
    byCity[row.city].push(row.price)
  }

  for (const [city, prices] of Object.entries(byCity)) {
    if (prices.length < 5) continue
    prices.sort((a, b) => a - b)
    cityMarketStats[city] = {
      count: prices.length,
      p10: Math.round(percentile(prices, 10)),
      p25: Math.round(percentile(prices, 25)),
      median: Math.round(percentile(prices, 50)),
      p75: Math.round(percentile(prices, 75)),
      p90: Math.round(percentile(prices, 90)),
      avg: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
    }
  }
  console.log(`✅ Market stats ready for ${Object.keys(cityMarketStats).length} cities`)
}

computeCityMarketStats()

// ---------------------------------------------------------------------------
// KNN price predictions (loaded from knn_price.csv)
// ---------------------------------------------------------------------------

let knnPriceMap = new Map()

function loadKnnPrices() {
  const filePath = path.join(LIST_INFO_DIR, 'knn_price.csv')
  if (!fs.existsSync(filePath)) {
    console.warn('⚠️  knn_price.csv not found — skipping KNN prices')
    return
  }
  try {
    const text = fs.readFileSync(filePath, 'utf8')
    const records = parse(text, { columns: true, skip_empty_lines: true })
    for (const r of records) {
      const zpid = r.zpid
      const price = r.price_knn
      if (zpid == null || price == null) continue
      const key = String(Math.round(Number(zpid)))
      knnPriceMap.set(key, Math.round(Number(price)))
    }
    console.log(`✅ KNN prices loaded for ${knnPriceMap.size} listings`)
  } catch (err) {
    console.error('❌ Failed to load knn_price.csv:', err)
  }
}

loadKnnPrices()

// ---------------------------------------------------------------------------
// Value scoring & market labelling
// ---------------------------------------------------------------------------

function getMarketLabel(price, stats) {
  if (!stats || !price || price <= 0) return null
  if (price < stats.p25) return 'Great Deal'
  if (price < stats.median) return 'Below Market'
  if (price <= stats.p75) return 'Market Price'
  if (price <= stats.p90) return 'Above Market'
  return 'Premium'
}

function computeValueScore(price, livingArea, datePosted, pageViewCount, stats) {
  // Price component (40%): below median = higher score
  let priceScore = 50
  if (stats && stats.median > 0 && price > 0) {
    const deviation = (stats.median - price) / stats.median
    priceScore = Math.max(0, Math.min(100, 50 + deviation * 100))
  }

  // Size component (20%): larger = better
  let sizeScore = 50
  if (livingArea > 0) {
    sizeScore = Math.max(0, Math.min(100, 20 + (livingArea - 500) / 45))
  }

  // Freshness component (20%): newer posting = more opportunity
  let freshnessScore = 40
  if (datePosted) {
    try {
      const days = (Date.now() - new Date(datePosted).getTime()) / 86400000
      freshnessScore = Math.max(0, Math.min(100, 100 - (days / 365) * 80))
    } catch { }
  }

  // Popularity component (20%): views signal real interest
  let popularityScore = 30
  if (pageViewCount > 0) {
    popularityScore = Math.max(0, Math.min(100, (pageViewCount / 300) * 100))
  }

  return Math.round(
    priceScore * 0.4 + sizeScore * 0.2 + freshnessScore * 0.2 + popularityScore * 0.2,
  )
}

// ---------------------------------------------------------------------------
function mapListing(row) {
  const price = Number(row.field2) || 0
  const bedrooms = Number(row.field16) || 0
  const bathrooms = Number(row.field15) || 0
  const livingArea = Number(row.field12) || null
  const yearBuilt = Number(row.field11) || null
  const pageViewCount = Number(row.field17) || 0
  const favoriteCount = Number(row.field18) || 0
  const city = row.field7 || ''

  const stats = cityMarketStats[city] || null
  const marketLabel = getMarketLabel(price, stats)
  const valueScore = computeValueScore(price, livingArea || 0, row.field5, pageViewCount, stats)

  const knnPrice = knnPriceMap.get(String(Math.round(Number(row.field1)))) || null

  return {
    id: row.field1,
    price,
    knnPrice,
    homeStatus: row.field3 || '',
    homeType: row.field4 || '',
    category: (row.field4 || '').toLowerCase().replace(/\s+/g, '-'),
    datePosted: row.field5 || null,
    streetAddress: row.field6 || '',
    city,
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
    rooms: bedrooms,
    pageViewCount,
    favoriteCount,
    propertyTaxRate: Number(row.field19) || null,
    timeOnZillow: row.field20 || '',
    dateSold: row.field21 || null,
    url: row.field22 || '',
    lastUpdated: row.field23 || '',
    isNew: isRecent(row.field5),
    badges: buildBadges(row),
    hasPhotos: false,
    photos: [],
    amenities: buildAmenities(row),
    // Market intelligence
    marketLabel,
    valueScore,
    cityStats: stats,
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
// Express app
// ---------------------------------------------------------------------------

const app = express()
app.use(cors({
  origin: '*',
}))
app.use(express.json())

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.sendStatus(401)
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

// ---------------------------------------------------------------------------
// GET /api/listings
// ---------------------------------------------------------------------------
app.get('/api/listings', (req, res) => {
  try {
    const {
      maxPrice,
      minPrice,
      minBedrooms,
      bedrooms,
      rooms,
      bathrooms,
      category,
      state,
      homeStatus,
      minArea,
      maxArea,
      yearBuiltMin,
      yearBuiltMax,
      sort,
      limit: rawLimit,
      offset: rawOffset,
      q,
      minValueScore,
    } = req.query

    const conditions = [`field1 != ?`]
    const params = [HEADER_ZPID]

    if (maxPrice && maxPrice !== 'any' && Number(maxPrice) < 5000000) {
      conditions.push(`CAST(field2 AS REAL) <= ?`)
      params.push(Number(maxPrice))
    }
    if (minPrice && minPrice !== 'any') {
      conditions.push(`CAST(field2 AS REAL) >= ?`)
      params.push(Number(minPrice))
    }

    const minBed = minBedrooms || bedrooms || rooms
    if (minBed && minBed !== 'any') {
      conditions.push(`CAST(field16 AS INTEGER) >= ?`)
      params.push(Number(minBed))
    }

    if (bathrooms && bathrooms !== 'any') {
      conditions.push(`CAST(field15 AS INTEGER) >= ?`)
      params.push(Number(bathrooms))
    }

    if (category && category !== 'any') {
      const homeType = categoryToSql(category)
      if (homeType) {
        conditions.push(`field4 = ?`)
        params.push(homeType)
      }
    }

    if (state && state !== 'any') {
      conditions.push(`field8 = ?`)
      params.push(state)
    }

    if (homeStatus && homeStatus !== 'any') {
      conditions.push(`field3 = ?`)
      params.push(homeStatus)
    }

    if (minArea && minArea !== 'any') {
      conditions.push(`CAST(field12 AS INTEGER) >= ?`)
      params.push(Number(minArea))
    }
    if (maxArea && maxArea !== 'any') {
      conditions.push(`CAST(field12 AS INTEGER) <= ? AND CAST(field12 AS INTEGER) > 0`)
      params.push(Number(maxArea))
    }

    if (yearBuiltMin && yearBuiltMin !== 'any') {
      conditions.push(`CAST(field11 AS INTEGER) >= ?`)
      params.push(Number(yearBuiltMin))
    }
    if (yearBuiltMax && yearBuiltMax !== 'any') {
      conditions.push(`CAST(field11 AS INTEGER) <= ? AND CAST(field11 AS INTEGER) > 0`)
      params.push(Number(yearBuiltMax))
    }

    if (q && q.trim()) {
      const term = `%${q.trim()}%`
      conditions.push(`(field6 LIKE ? OR field7 LIKE ? OR field10 LIKE ?)`)
      params.push(term, term, term)
    }

    if (req.query.county && req.query.county.trim()) {
      conditions.push(`field10 LIKE ?`)
      params.push(`%${req.query.county.trim()}%`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRow = db
      .prepare(`SELECT COUNT(DISTINCT field1) AS total FROM property_listings ${where}`)
      .get(...params)

    let orderBy = 'ORDER BY CAST(field17 AS INTEGER) DESC'
    if (sort === 'price_asc') orderBy = 'ORDER BY CAST(field2 AS REAL) ASC'
    else if (sort === 'price_desc') orderBy = 'ORDER BY CAST(field2 AS REAL) DESC'
    else if (sort === 'new') orderBy = 'ORDER BY field5 DESC'
    else if (sort === 'value_score') orderBy = 'ORDER BY CAST(field18 AS INTEGER) DESC, CAST(field17 AS INTEGER) DESC'

    const limit = Math.min(Number(rawLimit) || 200, 500)
    const offset = Number(rawOffset) || 0

    const rows = db
      .prepare(
        `WITH dedup AS (
          SELECT MIN(rowid) AS rowid
          FROM property_listings
          ${where}
          GROUP BY field1
        )
        SELECT p.*
        FROM property_listings p
        JOIN dedup d ON d.rowid = p.rowid
        ${orderBy}
        LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset)

    let items = rows.map(mapListing)

    // Post-filter by value score (computed in JS) if requested
    if (minValueScore && Number(minValueScore) > 0) {
      items = items.filter((l) => (l.valueScore || 0) >= Number(minValueScore))
    }

    res.json({ items, total: countRow.total, limit, offset })
  } catch (err) {
    console.error('GET /api/listings error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/listings/batch  – fetch multiple listings by comma-separated ids
// ?ids=123,456,789
// MUST be before /:id route
// ---------------------------------------------------------------------------
app.get('/api/listings/batch', (req, res) => {
  try {
    const { ids } = req.query
    if (!ids) return res.json([])
    const idList = ids.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4)
    const items = idList
      .map((id) =>
        db.prepare(`SELECT * FROM property_listings WHERE field1 = ? AND field1 != ?`).get(id, HEADER_ZPID),
      )
      .filter(Boolean)
      .map(mapListing)
    res.json(items)
  } catch (err) {
    console.error('GET /api/listings/batch error:', err)
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

    const priceHistory = db
      .prepare(`SELECT * FROM listing_price_history WHERE zpid = ? ORDER BY dateOfEvent DESC`)
      .all(id)
      .map((r) => ({
        event: r.event,
        price: Number(r.price) || 0,
        pricePerSqFt: Number(r.pricePerSquareFoot) || null,
        priceChangeRate: Number(r.priceChangeRate) || null,
        date: r.dateOfEvent,
        source: r.source,
      }))
      .filter((r) => r.price > 0 || r.event)

    const schools = db
      .prepare(`SELECT * FROM listing_schools_info WHERE zpid = ? ORDER BY distanceFromListing ASC LIMIT 6`)
      .all(id)
      .map((r) => ({
        name: r.schoolName,
        rating: r.schoolRating ? Number(r.schoolRating) : null,
        type: r.type,
        gradeLevel: r.gradeLevel,
        grades: r.grades,
        distance: r.distanceFromListing ? `${r.distanceFromListing} mi` : null,
        link: r.link,
      }))

    const taxRows = db
      .prepare(`SELECT * FROM listing_tax_info WHERE zpid = ? ORDER BY lastUpdatedDate DESC LIMIT 5`)
      .all(id)

    const taxInfo = taxRows.length
      ? {
        entries: taxRows.map((r) => ({
          year: r.lastUpdatedDate ? r.lastUpdatedDate.slice(0, 4) : null,
          taxPaid: Number(r.taxPaid) || null,
          propertyValue: Number(r.propertyValue) || null,
          valueIncreaseRate: Number(r.valueIncreaseRate) || null,
          taxIncreaseRate: Number(r.taxIncreaseRate) || null,
        })),
        taxPaid: Number(taxRows[0]?.taxPaid) || null,
        propertyValue: Number(taxRows[0]?.propertyValue) || null,
      }
      : null

    const mortgageRows = db
      .prepare(`SELECT * FROM listing_mortgage_info WHERE zpid = ? ORDER BY lastUpdatedDate DESC`)
      .all(id)

    const mortgageInfo = mortgageRows.length
      ? mortgageRows.map((r) => ({ bucketType: r.bucketType, rate: Number(r.rate) || null, rateSource: r.rateSource, date: r.lastUpdatedDate }))
      : null

    const subtype = db
      .prepare(`SELECT * FROM listing_subtype WHERE zpid = ?`)
      .get(id)

    const subtypeFlags = subtype
      ? {
        isNewHome: !!subtype.is_newHome,
        isForeclosure: !!subtype.is_foreclosure,
        isBankOwned: !!subtype.is_bankOwned,
        isPending: !!subtype.is_pending,
        isForAuction: !!subtype.is_forAuction,
        isOpenHouse: !!subtype.is_openHouse,
        isFSBO: !!subtype.is_FSBO,
        isComingSoon: !!subtype.is_comingSoon,
      }
      : null

    const nearbyHomes = db
      .prepare(`SELECT DISTINCT zpidComp, addressComp, cityComp, stateComp, priceComp, homeTypeComp, livingAreaValueComp FROM listing_nearby_homes WHERE zpid = ? LIMIT 5`)
      .all(id)
      .map((r) => ({
        id: r.zpidComp,
        address: r.addressComp,
        city: r.cityComp,
        state: r.stateComp,
        price: Number(r.priceComp) || null,
        homeType: r.homeTypeComp,
        livingArea: Number(r.livingAreaValueComp) || null,
      }))

    res.json({ ...listing, priceHistory, schools, taxInfo, mortgageInfo, subtypeFlags, nearbyHomes })
  } catch (err) {
    console.error('GET /api/listings/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/categories
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
// GET /api/states
// ---------------------------------------------------------------------------
app.get('/api/states', (_req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT DISTINCT field8 AS state FROM property_listings
         WHERE field1 != ? AND field8 IS NOT NULL AND field8 != ''
         ORDER BY field8`,
      )
      .all(HEADER_ZPID)

    res.json(rows.map((r) => r.state))
  } catch (err) {
    console.error('GET /api/states error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/statuses
// ---------------------------------------------------------------------------
app.get('/api/statuses', (_req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT DISTINCT field3 AS status FROM property_listings
         WHERE field1 != ? AND field3 IS NOT NULL AND field3 != ''
         ORDER BY field3`,
      )
      .all(HEADER_ZPID)

    res.json(rows.map((r) => r.status))
  } catch (err) {
    console.error('GET /api/statuses error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/stats
// ---------------------------------------------------------------------------
app.get('/api/stats', (_req, res) => {
  try {
    const row = db
      .prepare(
        `SELECT
          COUNT(*) AS total,
          ROUND(AVG(CAST(field2 AS REAL)), 0) AS avgPrice,
          MIN(CAST(field2 AS REAL)) AS minPrice,
          MAX(CAST(field2 AS REAL)) AS maxPrice,
          COUNT(DISTINCT field8) AS states,
          COUNT(DISTINCT field7) AS cities
        FROM property_listings
        WHERE field1 != ? AND CAST(field2 AS REAL) > 0`,
      )
      .get(HEADER_ZPID)

    const typeCounts = db
      .prepare(
        `SELECT field4 AS homeType, COUNT(*) AS count
         FROM property_listings
         WHERE field1 != ? AND field4 IS NOT NULL AND field4 != ''
         GROUP BY field4
         ORDER BY count DESC`,
      )
      .all(HEADER_ZPID)
      .map((r) => ({
        type: r.homeType,
        key: (r.homeType || '').toLowerCase().replace(/\s+/g, '-'),
        count: r.count,
      }))

    res.json({
      totalListings: row.total,
      avgPrice: row.avgPrice,
      minPrice: row.minPrice,
      maxPrice: row.maxPrice,
      states: row.states,
      cities: row.cities,
      byType: typeCounts,
    })
  } catch (err) {
    console.error('GET /api/stats error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/market-stats  – city-level price percentiles
// ?city=CityName  → returns stats for one city
// (no param)      → returns all cities (object keyed by city name)
// ---------------------------------------------------------------------------
app.get('/api/market-stats', (req, res) => {
  try {
    const { city } = req.query
    if (city) {
      return res.json(cityMarketStats[city] || null)
    }
    res.json(cityMarketStats)
  } catch (err) {
    console.error('GET /api/market-stats error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/alerts/check  – find high-value listings matching preferences
// Query: city, county, state, maxPrice, minPrice, minBedrooms, minBathrooms,
//        category, homeStatus, minArea, maxArea, yearBuiltMin, yearBuiltMax,
//        minValueScore, limit
// ---------------------------------------------------------------------------
app.get('/api/alerts/check', (req, res) => {
  try {
    const {
      city,
      county,
      state,
      maxPrice,
      minPrice,
      minBedrooms,
      minBathrooms,
      category,
      homeStatus,
      minArea,
      maxArea,
      yearBuiltMin,
      yearBuiltMax,
      minValueScore = 70,
      limit: rawLimit,
    } = req.query

    const conditions = [`field1 != ?`, `CAST(field2 AS REAL) > 0`]
    const params = [HEADER_ZPID]

    if (city && city !== 'any') {
      conditions.push(`field7 LIKE ?`)
      params.push(`%${city}%`)
    }
    if (county && county !== 'any') {
      conditions.push(`field10 LIKE ?`)
      params.push(`%${county}%`)
    }
    if (state && state !== 'any') {
      conditions.push(`field8 = ?`)
      params.push(state)
    }
    if (maxPrice && Number(maxPrice) < 5000000) {
      conditions.push(`CAST(field2 AS REAL) <= ?`)
      params.push(Number(maxPrice))
    }
    if (minPrice && Number(minPrice) > 0) {
      conditions.push(`CAST(field2 AS REAL) >= ?`)
      params.push(Number(minPrice))
    }
    if (minBedrooms && minBedrooms !== 'any') {
      conditions.push(`CAST(field16 AS INTEGER) >= ?`)
      params.push(Number(minBedrooms))
    }
    if (minBathrooms && minBathrooms !== 'any') {
      conditions.push(`CAST(field15 AS INTEGER) >= ?`)
      params.push(Number(minBathrooms))
    }
    if (category && category !== 'any') {
      const homeType = categoryToSql(category)
      if (homeType) {
        conditions.push(`field4 = ?`)
        params.push(homeType)
      }
    }
    if (homeStatus && homeStatus !== 'any') {
      conditions.push(`field3 = ?`)
      params.push(homeStatus)
    }
    if (minArea && minArea !== 'any') {
      conditions.push(`CAST(field12 AS INTEGER) >= ?`)
      params.push(Number(minArea))
    }
    if (maxArea && maxArea !== 'any') {
      conditions.push(`CAST(field12 AS INTEGER) <= ? AND CAST(field12 AS INTEGER) > 0`)
      params.push(Number(maxArea))
    }
    if (yearBuiltMin && yearBuiltMin !== 'any') {
      conditions.push(`CAST(field11 AS INTEGER) >= ?`)
      params.push(Number(yearBuiltMin))
    }
    if (yearBuiltMax && yearBuiltMax !== 'any') {
      conditions.push(`CAST(field11 AS INTEGER) <= ? AND CAST(field11 AS INTEGER) > 0`)
      params.push(Number(yearBuiltMax))
    }

    const returnLimit = Math.min(Number(rawLimit) || 50, 200)
    const where = `WHERE ${conditions.join(' AND ')}`

    // Fetch a large candidate pool so the in-memory valueScore filter has enough to work with
    const rows = db
      .prepare(
        `WITH dedup AS (
          SELECT MIN(rowid) AS rowid FROM property_listings ${where} GROUP BY field1
        )
        SELECT p.* FROM property_listings p JOIN dedup d ON d.rowid = p.rowid
        ORDER BY CAST(field2 AS REAL) ASC
        LIMIT 2000`,
      )
      .all(...params)

    const items = rows
      .map(mapListing)
      .filter((l) => (l.valueScore || 0) >= Number(minValueScore))
      .sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0))
      .slice(0, returnLimit)

    res.json(items)
  } catch (err) {
    console.error('GET /api/alerts/check error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/proxy/geocode  – server-side Nominatim proxy to avoid CORS
// ?q=address
// ---------------------------------------------------------------------------
app.get('/api/proxy/geocode', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.status(400).json({ error: 'Missing q' })
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
    const r = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'ApartmentAggregator/1.0' } })
    if (!r.ok) return res.status(502).json({ error: 'Geocoding failed' })
    const data = await r.json()
    if (!data.length) return res.status(404).json({ error: 'Address not found' })
    res.json({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ---------------------------------------------------------------------------
// GET /api/proxy/route  – server-side OSRM proxy to avoid CORS
// ?from=lat,lon&to=lat,lon&mode=driving|walking|cycling
// ---------------------------------------------------------------------------
app.get('/api/proxy/route', async (req, res) => {
  try {
    const { from, to, mode = 'driving' } = req.query
    if (!from || !to) return res.status(400).json({ error: 'Missing from/to' })
    const profile = mode === 'cycling' ? 'bike' : mode === 'walking' ? 'foot' : 'car'
    const url = `https://router.project-osrm.org/route/v1/${profile}/${from};${to}?overview=false`
    const r = await fetch(url, { headers: { 'User-Agent': 'ApartmentAggregator/1.0' } })
    if (!r.ok) return res.status(502).json({ error: 'Routing service unavailable' })
    const data = await r.json()
    if (data.code !== 'Ok' || !data.routes?.length) return res.status(404).json({ error: 'No route found' })
    const route = data.routes[0]
    res.json({
      distanceM: route.distance,
      durationS: route.duration,
      distanceKm: (route.distance / 1000).toFixed(1),
      distanceMi: (route.distance / 1609.34).toFixed(1),
      durationMin: Math.round(route.duration / 60),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ---------------------------------------------------------------------------
// GET /api/city-trends  – price history aggregated by city and year
// ?city=CityName (optional filter)
// ---------------------------------------------------------------------------
app.get('/api/city-trends', (req, res) => {
  try {
    const { city } = req.query
    let rows
    if (city && city !== 'any') {
      rows = db.prepare(`
        SELECT substr(ph.dateOfEvent,1,4) AS year,
               ROUND(AVG(ph.price),0) AS avgPrice,
               COUNT(*) AS saleCount
        FROM listing_price_history ph
        JOIN property_listings pl ON pl.field1 = ph.zpid
        WHERE ph.event IN ('Sold','Listed For Sale')
          AND ph.price > 0
          AND ph.dateOfEvent IS NOT NULL
          AND ph.dateOfEvent != ''
          AND pl.field7 LIKE ?
        GROUP BY year
        ORDER BY year ASC
      `).all(`%${city}%`)
    } else {
      rows = db.prepare(`
        SELECT substr(dateOfEvent,1,4) AS year,
               ROUND(AVG(price),0) AS avgPrice,
               COUNT(*) AS saleCount
        FROM listing_price_history
        WHERE event IN ('Sold','Listed For Sale')
          AND price > 0
          AND dateOfEvent IS NOT NULL
          AND dateOfEvent != ''
        GROUP BY year
        ORDER BY year ASC
      `).all()
    }
    res.json(rows.filter((r) => r.year && r.year.match(/^\d{4}$/)))
  } catch (err) {
    console.error('GET /api/city-trends error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// Auth and User Endpoints
// ---------------------------------------------------------------------------

app.post('/api/auth/register', (req, res) => {
  try {
    const { nickname, password } = req.body
    if (!nickname || !password) return res.status(400).json({ error: 'Nickname and password required' })
    const existing = db.prepare('SELECT id FROM users WHERE nickname = ?').get(nickname)
    if (existing) return res.status(400).json({ error: 'Nickname already taken' })
    const hash = bcrypt.hashSync(password, 10)
    const id = crypto.randomUUID()
    const writeDb = new Database(DB_PATH)
    writeDb.prepare('INSERT INTO users (id, nickname, password_hash) VALUES (?, ?, ?)').run(id, nickname, hash)
    writeDb.close()
    const token = jwt.sign({ id, nickname }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id, nickname } })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/auth/login', (req, res) => {
  try {
    const { nickname, password } = req.body
    if (!nickname || !password) return res.status(400).json({ error: 'Nickname and password required' })
    const user = db.prepare('SELECT id, nickname, password_hash FROM users WHERE nickname = ?').get(nickname)
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid nickname or password' })
    }
    const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, nickname: user.nickname } })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/user/saved', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT zpid, type FROM user_saved_listings WHERE user_id = ?').all(req.user.id)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/user/saved', authenticateToken, (req, res) => {
  try {
    const { zpid, type } = req.body // type = 'saved' or 'compared'
    if (!zpid || !type) return res.sendStatus(400)
    const writeDb = new Database(DB_PATH)
    writeDb.prepare('INSERT OR IGNORE INTO user_saved_listings (user_id, zpid, type) VALUES (?, ?, ?)').run(req.user.id, zpid, type)
    writeDb.close()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.delete('/api/user/saved', authenticateToken, (req, res) => {
  try {
    const { zpid, type } = req.body
    if (!zpid || !type) return res.sendStatus(400)
    const writeDb = new Database(DB_PATH)
    writeDb.prepare('DELETE FROM user_saved_listings WHERE user_id = ? AND zpid = ? AND type = ?').run(req.user.id, zpid, type)
    writeDb.close()
    res.json({ success: true })
  } catch (err) {
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
