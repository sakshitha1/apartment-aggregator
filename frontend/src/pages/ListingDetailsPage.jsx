import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button.jsx'
import { PageFade } from '../components/PageFade.jsx'
import { formatPrice } from '../data/mockListings.js'
import { useListing } from '../hooks/useListing.js'
import { useFavorites } from '../context/FavoritesContext.jsx'

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

export function ListingDetailsPage() {
  const { id } = useParams()
  const { data: listing, loading } = useListing(id)
  const { isFavorite, toggle } = useFavorites()

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

  return (
    <PageFade>
      <div className="space-y-6">

      {/* Hero placeholder (no photos in DB) */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 to-zinc-200 shadow-sm">
        <div className="flex h-64 items-center justify-center sm:h-80">
          <div className="text-center">
            <span className="text-5xl">🏠</span>
            <div className="mt-2 text-sm text-zinc-400">{listing.homeType || 'Property'}</div>
          </div>
        </div>
      </div>

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
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Property Details</h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {listing.amenities?.map((a) => (
                <Amenity key={a} label={a} />
              ))}
            </ul>
          </section>

          {listing.priceHistory?.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight">Price History</h2>
              <div className="overflow-hidden rounded-2xl border border-zinc-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-xs font-semibold text-zinc-600">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Event</th>
                      <th className="px-4 py-2">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {listing.priceHistory.map((h, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-zinc-500">{h.date}</td>
                        <td className="px-4 py-2">{h.event}</td>
                        <td className="px-4 py-2 font-semibold">{formatPrice(h.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
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

            <div className="mt-4 space-y-3">
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
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-600">
                    {listing.taxInfo.taxPaid != null && <div>Tax Paid: {formatPrice(listing.taxInfo.taxPaid)}</div>}
                    {listing.taxInfo.propertyValue != null && <div>Value: {formatPrice(listing.taxInfo.propertyValue)}</div>}
                  </div>
                </div>
              )}

              {listing.mortgageInfo && listing.mortgageInfo.rate && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
                  <div className="font-semibold text-zinc-900">Mortgage</div>
                  <div className="mt-2 text-xs text-zinc-600">
                    Rate: {listing.mortgageInfo.rate}% ({listing.mortgageInfo.rateSource})
                  </div>
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="mt-4 w-full"
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

            <div className="mt-3 text-center text-xs text-zinc-500">
              {listing.timeOnZillow ? `Time on Zillow: ${listing.timeOnZillow}` : 'Schedule a viewing or make an offer'}
            </div>
          </div>
        </aside>
      </div>
      </div>
    </PageFade>
  )
}

