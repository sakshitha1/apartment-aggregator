import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from './Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function Icon({ children }) {
  return (
    <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center">
      {children}
    </span>
  )
}

export function Navbar() {
  const navigate = useNavigate()
  const { user, openLogin, openRegister, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = useMemo(() => {
    if (!user?.name) return 'U'
    return user.name.slice(0, 1).toUpperCase()
  }, [user])

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500 text-white">
            <span className="text-sm font-semibold">R</span>
          </div>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            RealEstate
          </span>
        </Link>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => navigate('/search')}
          className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm hover:shadow md:flex"
        >
          <span className="font-medium">Where to?</span>
          <span className="text-zinc-400">Anywhere · Any time · Add guests</span>
        </button>

        <Button
          variant="secondary"
          className="hidden md:inline-flex"
          onClick={() => {
            if (!user) return openLogin()
            navigate('/host/new')
          }}
        >
          Become a host
        </Button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2 py-2 shadow-sm hover:shadow"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Icon>
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Icon>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
              {initials}
            </span>
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg"
            >
              {user ? (
                <>
                  <div className="px-4 py-3">
                    <div className="text-sm font-semibold">{user.name}</div>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                  </div>
                  <div className="h-px bg-zinc-100" />
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-50"
                    onClick={() => {
                      setMenuOpen(false)
                      if (!user) return openLogin()
                      navigate('/host/new')
                    }}
                  >
                    Add property
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-50"
                    onClick={() => {
                      setMenuOpen(false)
                      logout()
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-3 text-left text-sm font-semibold hover:bg-zinc-50"
                    onClick={() => {
                      setMenuOpen(false)
                      openLogin()
                    }}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-50"
                    onClick={() => {
                      setMenuOpen(false)
                      openRegister()
                    }}
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile search trigger */}
      <div className="border-t border-zinc-100 bg-white md:hidden">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm"
          >
            <div>
              <div className="text-sm font-semibold">Search</div>
              <div className="text-xs text-zinc-500">
                Location · Dates · Guests
              </div>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-rose-500 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M11 4a7 7 0 105.2 11.8l3.5 3.4a1 1 0 001.4-1.4l-3.4-3.5A7 7 0 0011 4z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

