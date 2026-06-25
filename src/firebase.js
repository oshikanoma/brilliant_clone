// Firebase initialization for Google authentication.
//
// Config is read from Vite env vars (see .env.example). These values are NOT
// secret for a web app — the Firebase web API key is safe to expose — but we
// keep them in env so each environment can point at its own project.
//
// If the config isn't present, `firebaseEnabled` is false and the rest of the
// app degrades gracefully (the "Continue with Google" button explains that it
// needs configuration instead of crashing).
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId
)

let app = null
let auth = null
let googleProvider = null

if (isFirebaseConfigured) {
  app = initializeApp(cfg)
  auth = getAuth(app)
  googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({ prompt: 'select_account' })
}

export { app, auth, googleProvider }
