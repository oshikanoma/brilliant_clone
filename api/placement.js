// Serverless proxy for the adaptive placement test. Deploy this on any platform
// that supports Node serverless functions (Vercel, Netlify functions, etc.). It
// keeps the OpenAI API key secret on the server: set OPENAI_API_KEY (and
// optionally OPENAI_MODEL) in the host's environment variables — never in a
// VITE_ variable, which would be bundled into the public client.
//
// The browser calls this endpoint (same-origin when the app and function are on
// the same host, or via VITE_PLACEMENT_API_URL when the app is on GitHub Pages
// and the function lives elsewhere). CORS is permissive so cross-origin calls
// from GitHub Pages work.

import { decidePlacement } from '../server/placement.js'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' })
    return
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const decision = await decidePlacement({
      history: payload.history,
      curriculum: payload.curriculum,
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
    })
    res.status(200).json(decision)
  } catch (err) {
    // The client falls back to its local binary-search engine on any error, so
    // the placement test still works even if this proxy is misconfigured.
    res.status(502).json({ error: String(err?.message || err) })
  }
}
