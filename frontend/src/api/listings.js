import { apiFetch } from './client.js'

// Expected backend shapes (flexible):
// - GET /listings -> { items: Listing[] } OR Listing[]
// - GET /listings/:id -> Listing

export async function fetchListings(params = {}) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || v === 'any') continue
    qs.set(k, String(v))
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const data = await apiFetch(`/listings${suffix}`)
  if (Array.isArray(data)) return data
  if (data?.items && Array.isArray(data.items)) return data.items
  return []
}

export async function fetchListingById(id) {
  return await apiFetch(`/listings/${encodeURIComponent(id)}`)
}

