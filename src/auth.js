// Lightweight, LOCAL-ONLY account system for the demo.
//
// Accounts and per-user progress are stored in the browser's localStorage, so a
// student can log in on this device and have their progress restored. This is
// NOT secure (passwords are only lightly obfuscated, never sent anywhere) and is
// meant purely for local testing. For real, cross-device accounts, swap these
// functions for Firebase Authentication + Firestore (see PRD §6) — the rest of
// the app only depends on the small interface below.

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
