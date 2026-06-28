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

import { TEMPLATE_CATALOG, isTemplate, generateProblemSet } from '../src/lib/homeworkTemplates.js'

const SYSTEM_PROMPT = `You are Bruh (a friendly owl, also called Hoot), the tutor mascot of a beginner-friendly algebra app. A student tells you, in their own words, what they're confused about.

Your ONLY jobs are:
1. Decide which ONE skill family below best matches what they're stuck on.
2. Write short, warm, encouraging text in Bruh's voice (plainspoken, a little playful, never condescending; assume a beginner).

You do NOT write practice problems or answers — the app generates those from the chosen family with verified answer keys.

Skill families (use the exact id):
${TEMPLATE_CATALOG}

Rules:
- Pick the single closest family id. If the message is clearly off-topic, empty, or not about algebra, set "template" to "none".
- "intro" should acknowledge their specific struggle and lead into a walkthrough + practice (1-2 sentences). If "none", gently steer them back to asking an algebra question.
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

const asText = (v, fallback = '') => (typeof v === 'string' ? v.trim() : fallback)

// Combine the model's voice text with code-generated, answer-verified practice.
function buildLesson(decision, seed) {
  const template = asText(decision?.template).toLowerCase()
  const tip = asText(decision?.tip)

  // Off-topic / unmatched: return a gentle steer-back with no problems.
  if (!isTemplate(template)) {
    return {
      concept: asText(decision?.concept, 'Hoot?'),
      intro: asText(
        decision?.intro,
        "I'm your algebra buddy! Tell me a specific algebra thing you're stuck on — like solving an equation or factoring — and I'll build you a walkthrough and some practice."
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
  return buildLesson(parsed, Date.now())
}
