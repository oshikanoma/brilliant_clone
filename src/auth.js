// Account system for the app. Two paths coexist:
//
//   1. Local username/password — LOCAL-ONLY demo accounts kept in localStorage
//      (NOT secure, lightly obfuscated, never sent anywhere). Handy for offline
//      testing without any backend.
//   2. Google sign-in — real Firebase Authentication (see firebase.js). The
//      Firebase user is the source of truth; per-user progress is still stored
//      locally, keyed by the Firebase uid.
//
// Per-user progress (loadUserState/saveUserState) is shared by both paths.

import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from './firebase.js'

const ACCOUNTS_KEY = 'algebruh:accounts'
const CURRENT_KEY = 'algebruh:current'
const userKey = (u) => `algebruh:user:${u.toLowerCase()}`

// Tiny non-cryptographic hash, just so the raw password isn't sitting in
// localStorage in plain text. Do not rely on this for real security.
function obfuscate(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return String(h)
}

function loadAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {}
  } catch {
    return {}
  }
}

function saveAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch {
    // ignore storage failures (e.g. private mode)
  }
}

export function getCurrentUser() {
  try {
    return localStorage.getItem(CURRENT_KEY) || null
  } catch {
    return null
  }
}

export function setCurrentUser(username) {
  try {
    if (username) localStorage.setItem(CURRENT_KEY, username)
    else localStorage.removeItem(CURRENT_KEY)
  } catch {
    // ignore
  }
}

export function signUp(username, password) {
  const u = username.trim()
  if (!u) return { error: 'Please enter a username.' }
  if (u.length > 24) return { error: 'Username is too long.' }
  if (password.length < 4) return { error: 'Password must be at least 4 characters.' }
  const accounts = loadAccounts()
  if (accounts[u.toLowerCase()]) return { error: 'That username is already taken.' }
  accounts[u.toLowerCase()] = { username: u, pass: obfuscate(password) }
  saveAccounts(accounts)
  setCurrentUser(u)
  return { user: u, isNew: true }
}

// Whether real Google sign-in is wired up (Firebase config present).
export const googleAuthAvailable = isFirebaseConfigured

// Sign in with Google via Firebase popup. On success the onGoogleAuthChange
// listener (below) drives the app's logged-in state, so callers only need to
// surface an error message. Returns { ok } or { error }.
export async function logInWithGoogle() {
  if (!isFirebaseConfigured || !auth) {
    return { error: 'Google sign-in isn’t set up yet. Add your Firebase config to enable it.' }
  }
  try {
    await signInWithPopup(auth, googleProvider)
    return { ok: true }
  } catch (e) {
    // The user closing the popup is not a real error — stay silent.
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
      return { ok: false }
    }
    if (e.code === 'auth/unauthorized-domain') {
      return { error: 'This domain isn’t authorized for Google sign-in. Add it in the Firebase console.' }
    }
    return { error: e.message || 'Google sign-in failed. Please try again.' }
  }
}

// Subscribe to Firebase auth state. Calls cb with the Firebase user (or null).
// Returns an unsubscribe function. When Firebase isn't configured, reports a
// signed-out state once so the app can fall back to local accounts.
export function onGoogleAuthChange(cb) {
  if (!isFirebaseConfigured || !auth) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(auth, cb)
}

export async function signOutGoogle() {
  if (auth) {
    try {
      await fbSignOut(auth)
    } catch {
      // ignore
    }
  }
}

export function logIn(username, password) {
  const u = username.trim()
  if (!u) return { error: 'Please enter your username.' }
  const accounts = loadAccounts()
  const acc = accounts[u.toLowerCase()]
  if (!acc) return { error: 'No account found with that username.' }
  if (acc.pass !== obfuscate(password)) return { error: 'Incorrect password.' }
  setCurrentUser(acc.username)
  return { user: acc.username, isNew: false }
}

// Change an existing account's password. Returns { ok } or { error }.
export function changePassword(username, newPassword) {
  if (!newPassword || newPassword.length < 4) {
    return { error: 'Password must be at least 4 characters.' }
  }
  const accounts = loadAccounts()
  const acc = accounts[username.toLowerCase()]
  if (!acc) return { error: 'Account not found.' }
  acc.pass = obfuscate(newPassword)
  saveAccounts(accounts)
  return { ok: true }
}

export function loadUserState(username) {
  try {
    return JSON.parse(localStorage.getItem(userKey(username)))
  } catch {
    return null
  }
}

export function saveUserState(username, state) {
  try {
    localStorage.setItem(userKey(username), JSON.stringify(state))
  } catch {
    // ignore
  }
}
