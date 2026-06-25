// Server-side adaptive placement decision. This runs ONLY on the server (the
// Vite dev middleware locally, or the serverless function in production) so the
// OpenAI API key is never shipped to the browser. It asks the model to act as an
// adaptive placement engine and return a strict JSON decision, then validates /
// repairs that decision against the curriculum using the local binary-search
// engine as a safety net.

import { localDecide } from '../src/placementLogic.js'

const SYSTEM_PROMPT = `You are the adaptive placement engine for an algebra learning app.

The course is a LINEAR PATH of skill checkpoints ordered from easiest to hardest. You receive:
- "curriculum": an ordered array of probeable checkpoints, each { checkpointIndex, topic, section }.
- "history": the questions already asked this session, each { checkpointIndex, topic, correct } where correct is a boolean.

Your goal is to find, as efficiently as possible, the HIGHEST checkpoint the student has clearly mastered, then place them right after it. Use a binary-search strategy:
- With no history, probe a checkpoint near the MIDDLE of the curriculum.
- After a CORRECT answer, probe a harder (later) checkpoint.
- After a WRONG answer, probe an easier (earlier) checkpoint.
- Never probe the same checkpointIndex twice.
- Aim to decide within about 5-6 questions; never exceed 8.

When you still need more information, return:
  { "action": "ask", "checkpointIndex": <one checkpointIndex from the curriculum that has NOT been asked yet> }

When you have enough evidence, return:
  { "action": "place", "completedThrough": <the highest checkpointIndex the student has demonstrated mastery of; use -1 if they could not answer the easiest question correctly>, "message": "<one warm, encouraging sentence, in the friendly voice of Bruh the owl mascot, telling them where they're starting and why>" }

Everything at or below completedThrough is treated as mastered (so the student starts at the next checkpoint). Be conservative: if the student missed a question, do not place them above it.

Respond with ONLY the JSON object — no prose, no code fences.`

function normalizeDecision(decision, curriculum, history) {
  const validIndices = curriculum.map((c) => c.checkpointIndex)
  const asked = new Set(history.map((h) => h.checkpointIndex))

  if (decision?.action === 'ask') {
    const idx = Number(decision.checkpointIndex)
    if (validIndices.includes(idx) && !asked.has(idx)) {
      return { action: 'ask', checkpointIndex: idx }
    }
    // Model picked an invalid / already-asked checkpoint — repair via local search.
    return localDecide(history, curriculum)
  }

  if (decision?.action === 'place') {
    const ct = Number.isInteger(decision.completedThrough) ? decision.completedThrough : -1
    const out = { action: 'place', completedThrough: ct }
    if (typeof decision.message === 'string' && decision.message.trim()) {
      out.message = decision.message.trim()
    }
    return out
  }

  return localDecide(history, curriculum)
}

export async function decidePlacement({ history = [], curriculum = [], apiKey, model }) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set on the server')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ curriculum, history }) },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI request failed (${res.status}): ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI returned no content')

  let decision
  try {
    decision = JSON.parse(content)
  } catch {
    throw new Error('OpenAI returned non-JSON content')
  }

  return normalizeDecision(decision, curriculum, history)
}
