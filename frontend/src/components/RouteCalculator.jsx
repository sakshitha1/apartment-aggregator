import { useState } from 'react'

const TRAVEL_MODES = [
  { key: 'driving', label: 'Drive', icon: '🚗' },
  { key: 'walking', label: 'Walk', icon: '🚶' },
  { key: 'cycling', label: 'Bike', icon: '🚲' },
]

async function geocodeViaProxy(address) {
  const res = await fetch(`/api/proxy/geocode?q=${encodeURIComponent(address)}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Address not found')
  }
  return res.json()
}

async function routeViaProxy(from, to, mode) {
  const fromStr = `${from.lon},${from.lat}`
  const toStr = `${to.lon},${to.lat}`
  const res = await fetch(`/api/proxy/route?from=${fromStr}&to=${toStr}&mode=${mode}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Route not found')
  }
  return res.json()
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function RouteCalculator({ listing }) {
  const [destination, setDestination] = useState('')
  const [mode, setMode] = useState('driving')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const origin = listing.address || `${listing.streetAddress}, ${listing.city}, ${listing.state}`

  async function calculate() {
    if (!destination.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const [from, to] = await Promise.all([
        geocodeViaProxy(origin),
        geocodeViaProxy(destination),
      ])
      const route = await routeViaProxy(from, to, mode)
      setResult({ from, to, route, mode })
    } catch (err) {
      setError(err.message || 'Could not calculate route. Try a more specific address.')
    } finally {
      setLoading(false)
    }
  }

  const mapsUrl = result
    ? `https://www.openstreetmap.org/directions?engine=osrm_${result.mode}&route=${result.from.lat},${result.from.lon};${result.to.lat},${result.to.lon}`
    : null

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🗺️</span>
        <h3 className="text-sm font-semibold text-zinc-900">Route Calculator</h3>
      </div>

      <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
        <span className="font-semibold">From:</span> {origin}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-600">Destination</label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && calculate()}
          placeholder="e.g. Times Square, New York"
          className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
        />
      </div>

      <div className="flex gap-2">
        {TRAVEL_MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition ${
              mode === m.key
                ? 'border-rose-500 bg-rose-50 text-rose-600'
                : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <span>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={calculate}
        disabled={loading || !destination.trim()}
        className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
      >
        {loading ? 'Calculating…' : 'Calculate Route'}
      </button>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center">
              <div className="text-xl font-bold text-zinc-900">
                {formatDuration(result.route.durationMin)}
              </div>
              <div className="text-xs text-zinc-500">Travel time</div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center">
              <div className="text-xl font-bold text-zinc-900">
                {result.route.distanceMi} mi
              </div>
              <div className="text-xs text-zinc-500">{result.route.distanceKm} km</div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            <span className="font-semibold">To:</span>{' '}
            <span className="line-clamp-1">{result.to.name}</span>
          </div>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              View on OpenStreetMap →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
