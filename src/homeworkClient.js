// Calls the homework-help proxy (which talks to OpenAI server-side, keeping the
// key secret). Returns the generated lesson object, or throws on failure so the
// UI can show a friendly retry message. Unlike placement, there's no offline
// fallback here — generating a custom lesson genuinely needs the model.
//
// Defaults to same-origin /api/homework (works in local dev via the Vite
// middleware, and in production when the app + functions share a host). On
// GitHub Pages, set VITE_HOMEWORK_API_URL to the deployed function's full URL.
const ENDPOINT = import.meta.env.VITE_HOMEWORK_API_URL || '/api/homework'

export async function askBruh(problem) {
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem }),
    })
  } catch {
    throw new Error('network')
  }
  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json())?.error || ''
    } catch {
      /* ignore */
    }
    throw new Error(detail || `status ${res.status}`)
  }
  return res.json()
}
