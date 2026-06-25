import { useState } from 'react'
import OwlSpeech from './OwlSpeech.jsx'
import { logIn, signUp, logInWithGoogle } from './auth.js'

// Login / sign-up gate shown before the app. Accounts are stored locally (see
// auth.js) so a student's progress is remembered and restored per username.
export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    const res = mode === 'signup' ? signUp(username, password) : logIn(username, password)
    if (res.error) {
      setError(res.error)
      return
    }
    onAuthed(res.user, res.isNew)
  }

  const swap = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'))
    setError('')
  }

  const googleSignIn = async () => {
    // Real Firebase Google sign-in. On success, App's auth-state listener swaps
    // in the logged-in session, so there's nothing more to do here.
    setError('')
    setBusy(true)
    const res = await logInWithGoogle()
    setBusy(false)
    if (res?.error) setError(res.error)
  }

  return (
    <div className="welcome welcome--auth">
      <div className="welcome__card">
        <div className="welcome__badge">algebruh</div>
        <p className="welcome__slogan">
          Welcome to <strong>algebruh</strong> — where algebra is just a hoot away! 🦉
        </p>
        <h1 className="welcome__title">{mode === 'signup' ? 'Create account' : 'Log in'}</h1>

        <OwlSpeech
          tone="neutral"
          text={
            mode === 'signup'
              ? "Hoot! Pick a username and password so I can save your progress as you learn."
              : "Welcome back! Log in and we'll pick up right where you left off."
          }
        />

        <form className="welcome__form" onSubmit={submit}>
          <input
            className="welcome__input"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError('')
            }}
            placeholder="Username"
            autoCapitalize="none"
            autoComplete="username"
            maxLength={24}
          />
          <input
            className="welcome__input"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            placeholder="Password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          {error && <p className="auth__error">{error}</p>}
          <button className="btn welcome__btn" type="submit" disabled={!username.trim() || !password}>
            {mode === 'signup' ? 'Sign up →' : 'Log in →'}
          </button>
        </form>

        <div className="auth__divider">
          <span>or</span>
        </div>

        <button type="button" className="auth__google" onClick={googleSignIn} disabled={busy}>
          <svg className="auth__google-icon" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
            />
          </svg>
          {busy ? 'Connecting…' : 'Continue with Google'}
        </button>

        <button type="button" className="auth__switch" onClick={swap}>
          {mode === 'signup'
            ? 'Already have an account? Log in'
            : 'New here? Create an account'}
        </button>
      </div>
    </div>
  )
}
