import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { Modal } from '../Modal.jsx'
import { Button } from '../Button.jsx'

function Input({ label, error, right, ...props }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-zinc-600">{label}</div>
      <div className="relative">
        <input
          className={clsx(
            'h-11 w-full rounded-xl border bg-white px-3 pr-11 text-sm shadow-sm focus:ring-2',
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/25'
              : 'border-zinc-200 focus:border-rose-500 focus:ring-rose-500/20',
          )}
          {...props}
        />
        {right ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {right}
          </div>
        ) : null}
      </div>
      {error ? <div className="mt-1 text-xs text-rose-600">{error}</div> : null}
    </label>
  )
}

export function AuthModal() {
  const { authModal, closeAuthModal, openLogin, openRegister, login, register } =
    useAuth()
  const mode = authModal // 'login' | 'register' | null

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')

  const title = useMemo(() => {
    if (mode === 'register') return 'Create your account'
    if (mode === 'login') return 'Welcome back'
    return ''
  }, [mode])

  useEffect(() => {
    if (!mode) return
    setFormError('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    // Keep email/name so switching feels smooth.
  }, [mode])

  const passwordError = useMemo(() => {
    if (!password) return ''
    if (mode === 'register' && password.length < 8) return 'Use at least 8 characters.'
    return ''
  }, [password, mode])

  const confirmError = useMemo(() => {
    if (mode !== 'register') return ''
    if (!confirmPassword) return ''
    if (confirmPassword !== password) return 'Passwords do not match.'
    return ''
  }, [confirmPassword, password, mode])

  return (
    <Modal open={!!mode} title={title} onClose={closeAuthModal}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setFormError('')

          if (mode === 'register') {
            if (password.length < 8) return setFormError('Password is too short.')
            if (password !== confirmPassword)
              return setFormError('Please make sure both passwords match.')
            register({ name, email, password })
          } else {
            login({ email, password })
          }
        }}
      >
        {mode === 'register' ? (
          <Input
            label="Full name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Aida T."
            required
          />
        ) : null}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          error={passwordError}
          right={
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full text-zinc-600 hover:bg-zinc-100"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path
                  d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          }
        />

        {mode === 'register' ? (
          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            error={confirmError}
          />
        ) : null}

        {formError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </div>
        ) : null}

        <Button className="w-full" size="lg" type="submit">
          {mode === 'register' ? 'Sign up' : 'Log in'}
        </Button>

        {mode === 'register' ? (
          <div className="text-center text-xs text-zinc-500">
            By continuing you agree to our Terms and acknowledge the Privacy Policy.
          </div>
        ) : null}

        <div className="text-center text-sm text-zinc-600">
          {mode === 'register' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setFormError('')
                  openLogin()
                }}
                className="font-semibold text-rose-600 hover:text-rose-700"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              New here?{' '}
              <button
                type="button"
                onClick={() => {
                  setFormError('')
                  openRegister()
                }}
                className="font-semibold text-rose-600 hover:text-rose-700"
              >
                Create account
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  )
}

