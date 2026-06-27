// Serverless proxy for the adaptive placement test (e.g. a Vercel function). Keeps
// the OpenAI key server-side via OPENAI_API_KEY; the browser POSTs { history } and
// gets back the next decision ({ action: 'ask', ... } or { action: 'place', ... }).

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
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
    })
    res.status(200).json(decision)
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
