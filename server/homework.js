// Server-side "Bruh's Homework Help" lesson generator. Runs only on the server
// (Vite dev middleware locally, serverless function in production) so the OpenAI
// key stays secret.
//
// VERIFICATION MODEL (mirrors the placement test's "vetted bank" rule):
// the model NEVER authors practice problems or answer keys. It only does two
// jobs: (1) classify the student's plain-language question into one of our
// fixed, code-backed template families, and (2) write the encouraging voice
// text in Bruh's tone. The actual problems, options, and correct answers are
// generated and computed in code (src/lib/homeworkTemplates.js), so every
// answer key is deterministically verified — the model can't hand a student a
// wrong answer.

import { TEMPLATE_CATALOG, normalizeTemplateId, classifyText, generateProblemSet } from '../src/lib/homeworkTemplates.js'

const SYSTEM_PROMPT = `You are Bruh (a friendly owl, also called Hoot), the tutor mascot of a beginner-friendly algebra app. A student tells you, in their own words, what they're confused about.

Your ONLY jobs are:
1. Decide which ONE skill family below best matches what they're stuck on.
2. Write short, warm, encouraging text in Bruh's voice (plainspoken, a little playful, never condescending; assume a beginner).

You do NOT write practice problems or answers — the app generates those from the chosen family with verified answer keys.

Skill families (use the exact id):
${TEMPLATE_CATALOG}

Rules:
- ALWAYS pick the single closest family id whenever the message is about algebra, even if it's vague or phrased as a "why"/"how" question. Only use "none" when the message is clearly NOT about algebra at all (e.g. "what's the weather", an empty message, or random text).
- "intro" must be 1-2 non-empty sentences that acknowledge their specific struggle and lead into a walkthrough + practice. If "none", gently steer them back to asking an algebra question. Never return an empty intro.
- "concept" is a short human label for the skill (e.g. "Factoring trinomials").
- "tip" is one memorable, encouraging tip or common-mistake warning for that skill.
- Plain text only. No markdown, no LaTeX, no code fences.

Return ONLY a JSON object with this exact shape:
{
  "template": "<one id from the list above, or 'none'>",
  "concept": "<short skill name>",
  "intro": "<1-2 sentences in Bruh's voice>",
  "tip": "<one short tip>"
}`

// Treat blank/whitespace strings as missing so fallbacks always win (an empty
// "intro" from the model must never render as an empty speech bubble).
const asText = (v, fallback = '') => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s || fallback
}

// Combine the model's voice text with code-generated, answer-verified practice.
// `problem` is the student's raw text, used for the keyword fallback when the
// model doesn't hand back a usable template id.
function buildLesson(decision, problem, seed) {
  const tip = asText(decision?.tip)

  // Prefer the model's pick; if it's "none"/blank/unknown, fall back to a
  // deterministic keyword classifier on what the student actually wrote.
  const template = normalizeTemplateId(decision?.template) || classifyText(problem)

  // Truly couldn't match anything algebraic: gentle steer-back, no problems —
  // but ALWAYS with non-empty text so the bubble is never blank.
  if (!template) {
    return {
      concept: asText(decision?.concept, 'Hoot?'),
      intro: asText(
        decision?.intro,
        "I'm your algebra buddy! Tell me a specific algebra thing you're stuck on — like “solve 3x + 4 = 19”, “factor x^2 + 5x + 6”, or “simplify x^3 * x^4” — and I'll build you a walkthrough and some practice."
      ),
      walkthrough: [],
      problems: [],
      tip: '',
      verified: true,
    }
  }

  const set = generateProblemSet(template, { seed, count: 3 })
  return {
    concept: asText(decision?.concept, set.label),
    intro: asText(decision?.intro, `Let's work through some ${set.label.toLowerCase()} together, then you try!`),
    walkthrough: set.walkthrough,
    problems: set.problems,
    tip,
    // Surfaced in the UI so it's clear the answer key was computed in code.
    verified: true,
  }
}

export async function generateLesson({ problem, apiKey, model }) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set on the server')
  const text = typeof problem === 'string' ? problem.trim() : ''
  if (!text) throw new Error('No problem description provided')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text.slice(0, 1000) },
      ],
    }),
  })

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`OpenAI request failed (${res.status}): ${t.slice(0, 300)}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI returned no content')

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('OpenAI returned non-JSON content')
  }
  // Fresh seed each call so a student gets new numbers if they ask again.
  return buildLesson(parsed, text, Date.now())
}
