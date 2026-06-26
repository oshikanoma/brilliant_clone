// Serverless proxy for "Bruh's Homework Help" (e.g. a Vercel function). Keeps the
// OpenAI key server-side via the OPENAI_API_KEY env var; the browser POSTs
// { problem } and gets back a generated mini-lesson as JSON.

import { generateLesson } from '../server/homework.js'

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
    const lesson = await generateLesson({
      problem: payload.problem,
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
    })
    res.status(200).json(lesson)
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
