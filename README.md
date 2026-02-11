# Apartment Aggregator

A full-stack property listing aggregator with **18,700+ real listings** sourced from a SQLite database.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Backend:** Express + better-sqlite3
- **Database:** SQLite (`apartments-listings.db`)

## Getting Started

### 1. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 2. Start the backend (port 3001)

```bash
cd backend
npm run dev
```

### 3. Start the frontend (port 5173)

```bash
cd frontend
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3001`.

Open [http://localhost:5173](http://localhost:5173) in your browser.

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/listings` | List & filter listings |
| `GET /api/listings/:id` | Single listing with price history, schools, tax & mortgage info |
| `GET /api/categories` | Distinct property types |

### Query Parameters for `/api/listings`

| Param | Example | Description |
|---|---|---|
| `maxPrice` | `500000` | Max price filter |
| `rooms` / `minBedrooms` | `3` | Minimum bedrooms |
| `category` | `condo` | Property type (`single-family`, `apartment`, `condo`, `townhouse`, `multi-family`, `manufactured`, `lot`) |
| `sort` | `price_asc` | Sort order (`price_asc`, `price_desc`, `new`, default: popular) |
| `q` | `Jacksonville` | Search by city, address, or county |
| `limit` | `20` | Page size (max 500) |
| `offset` | `0` | Pagination offset |
