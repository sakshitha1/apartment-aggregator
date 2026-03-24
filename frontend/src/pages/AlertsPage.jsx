import { Link } from 'react-router-dom'
import { PageFade } from '../components/PageFade.jsx'
import { formatPrice } from '../data/mockListings.js'
import { ValueScoreBadge } from '../components/ValueScoreBadge.jsx'
import { MarketLabel } from '../components/MarketLabel.jsx'
import { usePreferences } from '../context/PreferencesContext.jsx'

export function AlertsPage() {
  const { lastAlertResults, prefs, checkAlerts } = usePreferences()

  return (
    <PageFade>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Alert Results</h1>
            <p className="mt-1 text-sm text-zinc-500">
              High-value listings matching your preferences
              {prefs.city ? ` in ${prefs.city}` : ''}
              {prefs.maxPrice ? ` under ${formatPrice(Number(prefs.maxPrice))}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => checkAlerts(true)}
            className="shrink-0 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition"
          >
            Refresh Now
          </button>
        </div>

        {!lastAlertResults.length && (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center">
            <div className="text-3xl">🔔</div>
            <div className="mt-3 text-base font-semibold text-zinc-800">No results yet</div>
            <div className="mt-1 text-sm text-zinc-500">
              Click "Refresh Now" above, or set up your preferences using the bell icon in the navbar.
            </div>
            <Link
              to="/search"
              className="mt-4 inline-block rounded-xl bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Browse Listings
            </Link>
          </div>
        )}

        {lastAlertResults.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lastAlertResults.map((listing) => (
              <Link
                key={listing.id}
                to={`/listing/${listing.id}`}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition"
              >
                <div className="flex h-32 w-full items-center justify-center bg-zinc-900 border-b-4 border-rose-500">
                  <div className="text-center font-serif">
                    <div className="text-xl font-light tracking-widest text-white opacity-90 px-2 line-clamp-1">{listing.city?.toUpperCase() || 'PROPERTY'}</div>
                    <div className="mt-1 text-[9px] font-semibold tracking-[0.15em] text-rose-400 uppercase">{listing.homeType || 'Listing'}</div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {listing.valueScore != null && <ValueScoreBadge score={listing.valueScore} />}
                    {listing.marketLabel && <MarketLabel label={listing.marketLabel} />}
                  </div>
                  <div className="text-sm font-semibold line-clamp-2 group-hover:text-rose-600 transition">
                    {listing.title}
                  </div>
                  <div className="text-xs text-zinc-500">{listing.address}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-zinc-900">{formatPrice(listing.price)}</span>
                    {listing.bedrooms > 0 && (
                      <span className="text-xs text-zinc-500">{listing.bedrooms}bd · {listing.bathrooms}ba</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center">
          <Link to="/search" className="text-sm font-semibold text-rose-600 hover:text-rose-700">
            Search all listings →
          </Link>
        </div>
      </div>
    </PageFade>
  )
}
