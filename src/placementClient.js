import { localDecide } from './placementLogic.js'

// Calls the placement proxy (which talks to OpenAI server-side). On any failure
// — no proxy configured, network error, bad response — it transparently falls
// back to the deterministic local binary-search engine so the placement test
// always works. Returns a decision plus a `source` of 'ai' or 'local'.
//
// The endpoint defaults to the same-origin /api/placement (works in local dev
// via the Vite middleware, and in production when the app + function share a
// host). When the app is hosted on GitHub Pages with the function elsewhere, set
// VITE_PLACEMENT_API_URL to the function's full URL.
const ENDPOINT = import.meta.env.VITE_PLACEMENT_API_URL || '/api/placement'

export async function decideNextStep({ history, curriculum }) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, curriculum }),
    })
    if (!res.ok) throw new Error(`Placement proxy returned ${res.status}`)
    const data = await res.json()
    if (data && (data.action === 'ask' || data.action === 'place')) {
      return { ...data, source: 'ai' }
    }
    throw new Error('Malformed placement decision')
  } catch {
    return { ...localDecide(history, curriculum), source: 'local' }
  }
}
