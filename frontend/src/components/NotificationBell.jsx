import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../context/PreferencesContext.jsx'

export function NotificationBell() {
  const { prefs, setPrefs, alertCount, clearAlertCount, requestNotificationPermission, checkAlerts } = usePreferences()
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState(null)
  const [permStatus, setPermStatus] = useState('Notification' in window ? Notification.permission : 'unsupported')
  const panelRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      if ('Notification' in window) setPermStatus(Notification.permission)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleToggleEnable() {
    if (!prefs.enabled && permStatus !== 'granted') {
      const result = await requestNotificationPermission()
      setPermStatus(result)
      if (result === 'denied') return
    }
    setPrefs({ enabled: !prefs.enabled })
  }

  function handleOpen() {
    setOpen((v) => !v)
    if (alertCount > 0) clearAlertCount()
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm hover:shadow transition"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-700" fill="none">
          <path
            d="M15 17H5a1 1 0 01-.8-1.6L6 13V10a6 6 0 0112 0v3l1.8 2.4A1 1 0 0119 17h-4zm0 0a3 3 0 01-6 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {prefs.enabled && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500" />
        )}
        {alertCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {alertCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl z-50 max-h-[85vh] overflow-y-auto">
          <div className="border-b border-zinc-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Alert Preferences</div>
              <label className="relative inline-flex cursor-pointer items-center gap-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={prefs.enabled}
                    onChange={handleToggleEnable}
                  />
                  <div
                    className={`h-5 w-9 rounded-full transition ${prefs.enabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                  />
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${prefs.enabled ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </div>
                <span className="text-xs text-zinc-600">{prefs.enabled ? 'On' : 'Off'}</span>
              </label>
            </div>
            {permStatus === 'denied' && (
              <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                ⚠️ Notifications are blocked. You may need to enable them via your browser's site settings.
              </div>
            )}
            {permStatus === 'unsupported' && (
              <div className="mt-1 text-xs text-zinc-500">
                Browser notifications not supported.
              </div>
            )}
          </div>

          <div className="space-y-3 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600">City</label>
                <input
                  type="text"
                  value={prefs.city}
                  onChange={(e) => setPrefs({ city: e.target.value })}
                  placeholder="e.g. Austin"
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600">State</label>
                <input
                  type="text"
                  value={prefs.state}
                  onChange={(e) => setPrefs({ state: e.target.value.toUpperCase().slice(0, 2) })}
                  placeholder="e.g. TX"
                  maxLength={2}
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-600">County</label>
              <input
                type="text"
                value={prefs.county}
                onChange={(e) => setPrefs({ county: e.target.value })}
                placeholder="e.g. Los Angeles"
                className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600">Max Price</label>
                <input
                  type="number"
                  value={prefs.maxPrice}
                  onChange={(e) => setPrefs({ maxPrice: e.target.value })}
                  placeholder="e.g. 500000"
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600">Min Price</label>
                <input
                  type="number"
                  value={prefs.minPrice}
                  onChange={(e) => setPrefs({ minPrice: e.target.value })}
                  placeholder="e.g. 100000"
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600">Min Bedrooms</label>
                <select
                  value={prefs.minBedrooms}
                  onChange={(e) => setPrefs({ minBedrooms: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="">Any</option>
                  {['1','2','3','4','5'].map((v) => <option key={v} value={v}>{v}+</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600">Min Bathrooms</label>
                <select
                  value={prefs.minBathrooms}
                  onChange={(e) => setPrefs({ minBathrooms: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="">Any</option>
                  {['1','2','3','4'].map((v) => <option key={v} value={v}>{v}+</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600">Property Type</label>
                <select
                  value={prefs.category}
                  onChange={(e) => setPrefs({ category: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="">Any</option>
                  <option value="single-family">Single Family</option>
                  <option value="condo">Condo</option>
                  <option value="apartment">Apartment</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="multi-family">Multi Family</option>
                  <option value="manufactured">Manufactured</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600">Status</label>
                <select
                  value={prefs.homeStatus}
                  onChange={(e) => setPrefs({ homeStatus: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="">Any</option>
                  <option value="FOR_SALE">For Sale</option>
                  <option value="RECENTLY_SOLD">Recently Sold</option>
                  <option value="FOR_RENT">For Rent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600">Year Built From</label>
                <input
                  type="number"
                  value={prefs.yearBuiltMin}
                  onChange={(e) => setPrefs({ yearBuiltMin: e.target.value })}
                  placeholder="e.g. 2000"
                  min={1800}
                  max={2026}
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600">Min Area (sqft)</label>
                <input
                  type="number"
                  value={prefs.minArea}
                  onChange={(e) => setPrefs({ minArea: e.target.value })}
                  placeholder="e.g. 1000"
                  min={0}
                  className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-600">
                Min Value Score: <span className="text-rose-600">{prefs.minValueScore}</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={prefs.minValueScore}
                onChange={(e) => setPrefs({ minValueScore: Number(e.target.value) })}
                className="mt-1 w-full accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>0</span><span>50</span><span>100</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-600">Preference Keywords</label>
              <input
                type="text"
                value={prefs.keywords}
                onChange={(e) => setPrefs({ keywords: e.target.value })}
                placeholder="e.g. modern, spacious, renovated, pool"
                className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
              <p className="mt-1 text-[10px] text-zinc-400">Used for on-page match scoring only</p>
            </div>

            {checkResult !== null && (
              <div className={`rounded-xl px-3 py-2 text-xs font-semibold text-center ${checkResult > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-50 text-zinc-500 border border-zinc-200'}`}>
                {checkResult > 0 ? `Found ${checkResult} matching listing${checkResult !== 1 ? 's' : ''}` : 'No new matches found'}
              </div>
            )}

            <button
              type="button"
              disabled={checking}
              onClick={async () => {
                setChecking(true)
                setCheckResult(null)
                const count = await checkAlerts(true)
                setChecking(false)
                setCheckResult(typeof count === 'number' ? count : 0)
              }}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {checking ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
                  </svg>
                  Checking…
                </span>
              ) : 'Check Now'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); navigate('/alerts') }}
              className="block w-full rounded-xl border border-rose-200 bg-rose-50 py-2 text-center text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
            >
              View Last Results
            </button>
          </div>

          <div className="border-t border-zinc-100 px-4 py-2 text-[10px] text-zinc-400">
            Alerts check every 5 minutes while this tab is open.
          </div>
        </div>
      )}
    </div>
  )
}
