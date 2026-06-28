// Frontend client for the adaptive placement test. Asks the server (which talks to
// OpenAI with the key kept secret) for the next step given the answer history, and
// transparently FALLS BACK to the on-device deterministic engine if the proxy is
// unreachable or misbehaves. So placement keeps working with or without AI — it
// just isn't adaptive when the model isn't available.
//
// Defaults to same-origin /api/placement (works in local dev via the Vite
// middleware, and in production when the app + functions share a host). On GitHub
// Pages, set VITE_PLACEMENT_API_URL to the deployed function's full URL.
import { nextStep } from './placementLogic.js'
import { getAiEnabled } from './aiSettings.js'

const ENDPOINT = import.meta.env.VITE_PLACEMENT_API_URL || '/api/placement'

// Returns { decision, source: 'ai' | 'local' }.
export async function decideStep(history) {
  // Respect the user-facing AI toggle: when off, never hit the network — run the
  // deterministic engine on-device so the no-AI gate is real and verifiable.
  if (!getAiEnabled()) {
    return { decision: nextStep(history), source: 'local' }
  }
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history }),
    })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const decision = await res.json()
    if (!isValidDecision(decision)) throw new Error('bad decision shape')
    return { decision, source: 'ai' }
  } catch {
    return { decision: nextStep(history), source: 'local' }
  }
}

function isValidDecision(d) {
  if (!d || typeof d !== 'object') return false
  if (d.action === 'ask') return Number.isInteger(d.checkpointIndex)
  if (d.action === 'place') return Number.isInteger(d.completedThrough)
  return false
}
