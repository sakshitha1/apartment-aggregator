import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '../components/Button.jsx'
import { PageFade } from '../components/PageFade.jsx'
import { formatPrice } from '../data/mockListings.js'
import { useListing } from '../hooks/useListing.js'
import { useFavorites } from '../context/FavoritesContext.jsx'
import { useCompare } from '../context/CompareContext.jsx'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { ValueScoreBadge, ValueScoreExplainer } from '../components/ValueScoreBadge.jsx'
import { MarketLabel, CityPriceWidget } from '../components/MarketLabel.jsx'
import { RouteCalculator } from '../components/RouteCalculator.jsx'
import { usePreferenceMatch, PreferenceMatchBadge } from '../components/PreferenceMatcher.jsx'
import { CityTrendsChart, ListingPriceHistoryChart } from '../components/PriceTrendsChart.jsx'

function Amenity({ label }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-100 text-base">
        ✓
      </span>
      <span className="font-medium">{label}</span>
    </li>
  )
}

function PropertyCover({ listing }) {
  const [coords, setCoords] = useState(null)
  
  useEffect(() => {
    if (!listing.address) return
    fetch(`/api/proxy/geocode?q=${encodeURIComponent(listing.address)}`)
      .then(r => r.json())
      .then(d => { if (d.lat && d.lon) setCoords(d) })
      .catch(() => {})
  }, [listing.address])

  if (listing.hasPhotos && listing.photos?.length > 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-zinc-200 shadow-sm">
        <img src={listing.photos[0]} alt={listing.title} className="h-64 sm:h-80 w-full object-cover" />
      </div>
    )
  }

  if (coords) {
    return (
      <div className="overflow-hidden rounded-3xl border border-zinc-200 shadow-sm relative h-64 sm:h-80">
        <iframe
          title="Property Location"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - 0.005},${coords.lat - 0.005},${coords.lon + 0.005},${coords.lat + 0.005}&layer=mapnik&marker=${coords.lat},${coords.lon}`}
        />
        <div className="absolute top-4 left-4 rounded-xl bg-white/90 px-3 py-1 text-xs font-semibold shadow backdrop-blur">
          Map View
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-900 shadow-sm">
      <div className="flex h-64 items-center justify-center sm:h-80 border-b-8 border-rose-500">
        <div className="text-center font-serif">
          <div className="text-3xl font-light tracking-widest text-white opacity-90">{listing.city?.toUpperCase() || 'PROPERTY'}</div>
          <div className="mt-2 text-xs font-semibold tracking-[0.2em] text-rose-400 uppercase">{listing.homeType || 'Listing'}</div>
          <div className="mt-4 text-[10px] text-zinc-500 uppercase tracking-wider">Photo unavailable</div>
        </div>
      </div>
    </div>
  )
}

export function ListingDetailsPage() {
  const { id } = useParams()
  const { data: listing, loading } = useListing(id)
  const { isFavorite, toggle } = useFavorites()
  const { isInCompare, toggle: toggleCompare, count, max } = useCompare()
  const { prefs } = usePreferences()
  const match = usePreferenceMatch(listing, prefs.keywords)

  if (loading) {
    return (
      <PageFade>
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-zinc-200" />
          <div className="h-64 animate-pulse rounded-3xl bg-zinc-200" />
        </div>
      </PageFade>
    )
  }

  if (!listing) {
    return (
      <PageFade>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6">
          <div className="text-lg font-semibold">Listing not found</div>
          <div className="mt-2 text-sm text-zinc-600">
            Try going back to{' '}
            <Link className="font-semibold text-rose-600" to="/search">
              search
            </Link>
            .
          </div>
        </div>
      </PageFade>
    )
  }

  const inCompare = isInCompare(listing.id)
  const canAddCompare = inCompare || count < max

  return (
    <PageFade>
      <div className="space-y-6">

      <PropertyCover listing={listing} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <section className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href)
                    alert('Link copied to clipboard!')
                  }}
                  className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:bg-zinc-50"
                  aria-label="Share"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => toggle(listing.id)}
                  className={`grid h-10 w-10 place-items-center rounded-full border shadow-sm ${
                    isFavorite(listing.id)
                      ? 'border-rose-200 bg-rose-50 text-rose-500'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                  }`}
                  aria-label={isFavorite(listing.id) ? 'Remove from favorites' : 'Save to favorites'}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill={isFavorite(listing.id) ? 'currentColor' : 'none'}>
                    <path
                      d="M12 21s-7-4.6-9.5-8.6C.5 8.9 3 6 6.3 6c1.7 0 3.2.8 3.7 1.7.5-.9 2-1.7 3.7-1.7C17 6 19.5 8.9 21.5 12.4 19 16.4 12 21 12 21z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="text-sm text-zinc-600">{listing.address}</div>
            <div className="flex flex-wrap gap-2">
              {listing.homeStatus && (
                <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {listing.homeStatus}
                </span>
              )}
              {listing.price && listing.livingArea ? (
                <span className="inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                  ${Math.round(listing.price / listing.livingArea)}/sqft
                </span>
              ) : null}
              {listing.marketLabel && <MarketLabel label={listing.marketLabel} size="lg" />}
            </div>
          </section>

          {/* Value Score + Preference Match */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {listing.valueScore != null && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
                <ValueScoreBadge score={listing.valueScore} size="lg" />
                <ValueScoreExplainer />
              </div>
            )}

            {prefs.keywords && match && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <PreferenceMatchBadge match={match} size="lg" />
              </div>
            )}
          </section>

          {/* City price range */}
          {listing.cityStats && (
            <CityPriceWidget cityStats={listing.cityStats} currentPrice={listing.price} knnPrice={listing.knnPrice} />
          )}

          {/* Compare button */}
          <button
            type="button"
            onClick={() => toggleCompare(listing.id)}
            disabled={!canAddCompare}
            className={`w-full rounded-xl border py-2.5 text-sm font-semibold transition ${
              inCompare
                ? 'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100'
                : canAddCompare
                ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                : 'border-zinc-100 bg-white text-zinc-300 cursor-not-allowed'
            }`}
          >
            {inCompare ? '✓ Added to Compare' : canAddCompare ? '⚖️ Add to Compare' : 'Compare list is full (max 4)'}
          </button>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Property Details</h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {listing.amenities?.map((a) => (
                <Amenity key={a} label={a} />
              ))}
            </ul>
          </section>

          {/* Route Calculator */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Route Calculator</h2>
            <RouteCalculator listing={listing} />
          </section>

          <ListingPriceHistoryChart priceHistory={listing.priceHistory} />

          {listing.city && (
            <section>
              <CityTrendsChart city={listing.city} currentPrice={listing.price} />
            </section>
          )}

          {listing.schools?.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight">Nearby Schools</h2>
              <div className="space-y-2">
                {listing.schools.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm"
                  >
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-zinc-500">
                        {s.type} · {s.gradeLevel} · {s.distance}
                      </div>
                    </div>
                    {s.rating && (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-sm font-bold text-rose-600">
                        {s.rating}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Subtype flags (foreclosure, new home, etc.) */}
          {listing.subtypeFlags && Object.values(listing.subtypeFlags).some(Boolean) && (
            <section className="flex flex-wrap gap-2">
              {listing.subtypeFlags.isNewHome && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">New Construction</span>}
              {listing.subtypeFlags.isForeclosure && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Foreclosure</span>}
              {listing.subtypeFlags.isBankOwned && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">Bank Owned (REO)</span>}
              {listing.subtypeFlags.isPending && <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">Pending</span>}
              {listing.subtypeFlags.isForAuction && <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">For Auction</span>}
              {listing.subtypeFlags.isOpenHouse && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Open House</span>}
              {listing.subtypeFlags.isFSBO && <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">For Sale By Owner</span>}
              {listing.subtypeFlags.isComingSoon && <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">Coming Soon</span>}
            </section>
          )}

          {/* Nearby comparable homes */}
          {listing.nearbyHomes?.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight">Nearby Comparable Homes</h2>
              <div className="space-y-2">
                {listing.nearbyHomes.map((h, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm">
                    <div>
                      <div className="font-medium line-clamp-1">{h.address}</div>
                      <div className="text-xs text-zinc-500">{h.city}, {h.state} · {h.homeType}{h.livingArea ? ` · ${h.livingArea} sqft` : ''}</div>
                    </div>
                    {h.price > 0 && (
                      <span className="shrink-0 text-sm font-semibold text-zinc-900 ml-3">
                        {h.price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {listing.url && (
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold text-rose-600 hover:text-rose-700"
            >
              View on Zillow →
            </a>
          )}
        </div>

        {/* Sticky action box */}
        <aside className="lg:sticky lg:top-20">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xl font-semibold text-zinc-900">
                  {formatPrice(listing.price)}
                </div>
                <div className="text-xs text-zinc-500">
                  {listing.homeStatus === 'Recently Sold' ? 'Sold price' : 'Asking price'}
                </div>
              </div>
              {listing.bedrooms > 0 && (
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {listing.bedrooms} bed · {listing.bathrooms} bath
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <div className="font-semibold text-zinc-900">Quick Facts</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-600">
                  <div>Type: {listing.homeType}</div>
                  <div>Beds: {listing.bedrooms || '—'}</div>
                  <div>Baths: {listing.bathrooms || '—'}</div>
                  <div>Area: {listing.livingArea ? `${listing.livingArea} ${listing.livingAreaUnits || 'sqft'}` : '—'}</div>
                  <div>Year Built: {listing.yearBuilt || '—'}</div>
                  <div>County: {listing.county || '—'}</div>
                </div>
              </div>

              {listing.taxInfo && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
                  <div className="font-semibold text-zinc-900">Tax Info</div>
                  <div className="mt-2 space-y-1 text-xs text-zinc-600">
                    {listing.taxInfo.taxPaid != null && <div className="flex justify-between"><span>Annual Tax</span><span className="font-medium">{formatPrice(listing.taxInfo.taxPaid)}</span></div>}
                    {listing.taxInfo.propertyValue != null && <div className="flex justify-between"><span>Assessed Value</span><span className="font-medium">{formatPrice(listing.taxInfo.propertyValue)}</span></div>}
                    {listing.taxInfo.entries?.length > 1 && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-rose-600 font-medium">History ({listing.taxInfo.entries.length} years)</summary>
                        <div className="mt-1 space-y-0.5">
                          {listing.taxInfo.entries.map((e, i) => e.taxPaid > 0 && (
                            <div key={i} className="flex justify-between">
                              <span>{e.year}</span>
                              <span>{formatPrice(e.taxPaid)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {listing.mortgageInfo?.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
                  <div className="font-semibold text-zinc-900">Mortgage Rates</div>
                  <div className="mt-2 space-y-1 text-xs text-zinc-600">
                    {listing.mortgageInfo.map((m, i) => m.rate && (
                      <div key={i} className="flex justify-between">
                        <span className="truncate">{m.bucketType?.replace(' Bucket', '')}</span>
                        <span className="font-medium ml-2">{m.rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                if (listing.url) {
                  window.open(listing.url, '_blank')
                } else {
                  alert('No external listing URL available.')
                }
              }}
            >
              View on Zillow
            </Button>

            <div className="text-center text-xs text-zinc-500">
              {listing.timeOnZillow ? `Time on Zillow: ${listing.timeOnZillow}` : 'Schedule a viewing or make an offer'}
            </div>
          </div>
        </aside>
      </div>
      </div>
    </PageFade>
  )
}
