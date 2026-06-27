// Server-side adaptive placement "brain". Runs only on the server (Vite dev
// middleware locally, serverless function in production) so the OpenAI key stays
// secret. Given the student's results so far, the model chooses the NEXT topic to
// quiz (or decides to place them) — but it only ever picks among hand-written
// topics, so the actual questions and answer keys always come from our vetted
// bank, never from the model.
//
// Crucially, the model's choice is passed through deterministic guardrails
// (see ../src/lib/placementLogic.js) before we trust it:
//   - It can't quiz a section beyond the first one the student hasn't mastered.
//   - It can't end the test earlier than our mastery rules allow (so a topic is
//     always confirmed by repetition), and it can't place a student further along
//     than their demonstrated mastery justifies.
// If the model is unavailable or returns anything off, we silently fall back to
// the deterministic engine, so placement always works.

import {
  nextStep,
  masteredCeiling,
  frontierSectionIndex,
  sectionIndexOfCheckpoint,
  placementFor,
  MASTER_AT,
} from '../src/lib/placementLogic.js'
import { PLACEMENT_SECTIONS, CURRICULUM } from '../src/data/placementBank.js'

const topicName = (cp) =>
  CURRICULUM.find((c) => c.checkpointIndex === cp)?.topic || `Checkpoint ${cp}`

const correctCount = (history, cp) =>
  history.filter((h) => h.checkpointIndex === cp && h.correct).length

function buildSystemPrompt() {
  const sections = PLACEMENT_SECTIONS.map((s, i) => {
    const topics = s.genres
      .map((cp) => `{ "checkpointIndex": ${cp}, "topic": "${topicName(cp)}" }`)
      .join(', ')
    return `${i + 1}. "${s.name}" — quizzable topics: [ ${topics} ]`
  }).join('\n')

  return `You are the adaptive placement engine for a beginner algebra course (ages ~13-15). Based on how a student has answered so far, you decide the NEXT thing to do: quiz one more topic, or place the student.

CURRICULUM, easiest to hardest:
${sections}

How placement works:
- Work through sections IN ORDER (easiest first). Don't quiz a harder section until the current one is handled.
- CONFIRM MASTERY BY REPETITION: a topic counts as mastered only after the student answers it correctly ${MASTER_AT} times; treat it as not mastered after ${MASTER_AT} misses. So quiz a given topic more than once before trusting it — never advance off a single answer.
- Be CONSERVATIVE: when you place the student, place them at the START of the first section that has a topic they have NOT mastered. It's better to relearn a concept than to skip it. Even a flawless student should be placed into the final section, not past it.

You will receive the history of questions asked (topic + correct/incorrect). Choose ONE next action.

Return ONLY a JSON object, one of:
{ "action": "ask", "checkpointIndex": <one of the quizzable checkpointIndex values above>, "reason": "<short>" }
{ "action": "place", "completedThrough": <integer>, "reason": "<short>" }

For "place", "completedThrough" is the flat checkpoint index of the LAST checkpoint to mark complete; the student starts at the very beginning when it is -1, otherwise at the section that begins right after it.`
}

function buildUserPrompt(history) {
  if (!history.length) {
    return 'No questions asked yet. Choose the first topic to quiz (start with the easiest section).'
  }
  const lines = history.map(
    (h, i) =>
      `${i + 1}. ${topicName(h.checkpointIndex)} (checkpointIndex ${h.checkpointIndex}): ${
        h.correct ? 'correct' : 'incorrect'
      }`,
  )
  return `Results so far:\n${lines.join('\n')}\n\nWhat is the next action?`
}

// Run the model's choice through the deterministic guardrails. `ai` may be null.
// Exported for unit testing; also the single source of truth for validation.
export function reconcile(ai, history) {
  const det = nextStep(history)

  if (det.action === 'place') {
    // Mastery rules say the test is over. Honor the model's placement only if it's
    // valid and never further along than demonstrated mastery allows.
    if (ai?.action === 'place' && Number.isInteger(ai.completedThrough)) {
      const ceiling = masteredCeiling(history)
      const ct = Math.max(-1, Math.min(ai.completedThrough, ceiling))
      return placementFor(ct)
    }
    return det
  }

  // Mastery rules say keep probing — the model may pick WHICH valid topic to quiz.
  if (ai?.action === 'ask' && isValidAsk(ai.checkpointIndex, history)) {
    return { action: 'ask', checkpointIndex: ai.checkpointIndex }
  }
  return det
}

function isValidAsk(cp, history) {
  if (!Number.isInteger(cp)) return false
  const si = sectionIndexOfCheckpoint(cp)
  if (si < 0) return false // not a quizzable topic
  if (si > frontierSectionIndex(history)) return false // can't probe ahead of the frontier
  if (correctCount(history, cp) >= MASTER_AT) return false // already mastered → don't loop
  return true
}

export async function decidePlacement({ history = [], apiKey, model }) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set on the server')
  const hist = Array.isArray(history) ? history : []

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
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(hist) },
      ],
    }),
  })

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`OpenAI request failed (${res.status}): ${t.slice(0, 300)}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  let ai = null
  if (content) {
    try {
      ai = JSON.parse(content)
    } catch {
      ai = null // fall through to deterministic guardrail
    }
  }
  return reconcile(ai, hist)
}
