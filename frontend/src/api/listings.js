import { apiFetch } from './client.js'

export async function fetchListings(params = {}) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || v === 'any') continue
    qs.set(k, String(v))
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const data = await apiFetch(`/api/listings${suffix}`)
  if (Array.isArray(data)) {
    return { items: data, total: data.length }
  }
  if (data?.items && Array.isArray(data.items)) {
    return {
      items: data.items,
      total: typeof data.total === 'number' ? data.total : data.items.length,
      limit: data.limit,
      offset: data.offset,
    }
  }
  return { items: [], total: 0 }
}

export async function fetchListingById(id) {
  return await apiFetch(`/api/listings/${encodeURIComponent(id)}`)
}

export async function fetchListingsBatch(ids) {
  if (!ids || !ids.length) return []
  const qs = new URLSearchParams({ ids: ids.join(',') })
  return await apiFetch(`/api/listings/batch?${qs.toString()}`)
}

export async function fetchCategories() {
  return await apiFetch('/api/categories')
}

export async function fetchStates() {
  return await apiFetch('/api/states')
}

export async function fetchStatuses() {
  return await apiFetch('/api/statuses')
}

export async function fetchStats() {
  return await apiFetch('/api/stats')
}

export async function fetchMarketStats(city) {
  const qs = city ? `?city=${encodeURIComponent(city)}` : ''
  return await apiFetch(`/api/market-stats${qs}`)
}
