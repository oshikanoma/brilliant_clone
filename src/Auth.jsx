import { useState } from 'react'
import OwlSpeech from './OwlSpeech.jsx'
import { logIn, signUp } from './auth.js'

// Login / sign-up gate shown before the app. Accounts are stored locally (see
// auth.js) so a student's progress is remembered and restored per username.
export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

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

        <button type="button" className="auth__switch" onClick={swap}>
          {mode === 'signup'
            ? 'Already have an account? Log in'
            : 'New here? Create an account'}
        </button>
      </div>
    </div>
  )
}
