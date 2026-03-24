import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const PreferencesContext = createContext(null)
const LS_KEY = 'rea.preferences'
const LS_SEEN_KEY = 'rea.alerts.seen'

const DEFAULT_PREFS = {
  enabled: false,
  city: '',
  county: '',
  state: '',
  maxPrice: '',
  minPrice: '',
  minBedrooms: '',
  minBathrooms: '',
  category: '',
  homeStatus: '',
  minArea: '',
  maxArea: '',
  yearBuiltMin: '',
  yearBuiltMax: '',
  minValueScore: 70,
  keywords: '',
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

function loadSeenIds() {
  try {
    const raw = localStorage.getItem(LS_SEEN_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveSeenIds(set) {
  try {
    const arr = Array.from(set).slice(-500)
    localStorage.setItem(LS_SEEN_KEY, JSON.stringify(arr))
  } catch {}
}

export function PreferencesProvider({ children }) {
  const [prefs, setPrefsState] = useState(loadPrefs)
  const [alertCount, setAlertCount] = useState(0)
  const [lastAlertResults, setLastAlertResults] = useState([])
  const seenRef = useRef(loadSeenIds())
  const timerRef = useRef(null)
  const debounceRef = useRef(null)

  const setPrefs = useCallback((patch) => {
    setPrefsState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const checkAlerts = useCallback(async (force = false) => {
    const p = prefs
    if (!force && !p.enabled) return 0
    try {
      const qs = new URLSearchParams()
      if (p.city) qs.set('city', p.city)
      if (p.county) qs.set('county', p.county)
      if (p.state) qs.set('state', p.state)
      if (p.maxPrice) qs.set('maxPrice', p.maxPrice)
      if (p.minPrice) qs.set('minPrice', p.minPrice)
      if (p.minBedrooms) qs.set('minBedrooms', p.minBedrooms)
      if (p.minBathrooms) qs.set('minBathrooms', p.minBathrooms)
      if (p.category) qs.set('category', p.category)
      if (p.homeStatus) qs.set('homeStatus', p.homeStatus)
      if (p.minArea) qs.set('minArea', p.minArea)
      if (p.maxArea) qs.set('maxArea', p.maxArea)
      if (p.yearBuiltMin) qs.set('yearBuiltMin', p.yearBuiltMin)
      if (p.yearBuiltMax) qs.set('yearBuiltMax', p.yearBuiltMax)
      if (p.minValueScore) qs.set('minValueScore', p.minValueScore)
      qs.set('limit', '50')

      const res = await fetch(`/api/alerts/check?${qs.toString()}`)
      if (!res.ok) return 0
      const items = await res.json()

      setLastAlertResults(items)

      const newItems = items.filter((l) => !seenRef.current.has(l.id))

      if (newItems.length) {
        newItems.forEach((l) => seenRef.current.add(l.id))
        saveSeenIds(seenRef.current)
        setAlertCount((c) => c + newItems.length)

        if ('Notification' in window && Notification.permission === 'granted') {
          newItems.slice(0, 3).forEach((l) => {
            const n = new Notification(`New High-Value Listing Found!`, {
              body: `${l.title} — ${l.city} — Score: ${l.valueScore}/100`,
              icon: '/favicon.ico',
              tag: `listing-${l.id}`,
            })
            n.onclick = () => {
              window.focus()
              window.location.href = '/alerts'
            }
          })
        }
      }

      return items.length
    } catch {
      return 0
    }
  }, [prefs])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (prefs.enabled) {
      checkAlerts()
      timerRef.current = setInterval(() => checkAlerts(), 5 * 60 * 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [prefs.enabled])

  useEffect(() => {
    if (!prefs.enabled) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      checkAlerts()
    }, 2000)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [
    prefs.city, prefs.county, prefs.state,
    prefs.maxPrice, prefs.minPrice,
    prefs.minBedrooms, prefs.minBathrooms,
    prefs.category, prefs.homeStatus,
    prefs.minArea, prefs.maxArea,
    prefs.yearBuiltMin, prefs.yearBuiltMax,
    prefs.minValueScore, prefs.enabled,
  ])

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    const result = await Notification.requestPermission()
    return result
  }, [])

  const clearAlertCount = useCallback(() => setAlertCount(0), [])

  return (
    <PreferencesContext.Provider
      value={{ prefs, setPrefs, alertCount, clearAlertCount, checkAlerts, requestNotificationPermission, lastAlertResults }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
