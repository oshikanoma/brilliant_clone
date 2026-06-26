// Server-side "Bruh's Homework Help" lesson generator. Runs only on the server
// (Vite dev middleware locally, serverless function in production) so the OpenAI
// key stays secret. Given a student's plain-language description of what they're
// stuck on, it asks the model to write a short, customized mini-lesson in Bruh
// the owl's warm, encouraging voice, and returns it as strict JSON.

const SYSTEM_PROMPT = `You are Bruh (a friendly owl, also called Hoot), the tutor mascot of a beginner-friendly algebra app. A student tells you, in their own words, what they're confused about. Build them a short, customized practice set that directly addresses THEIR problem — like a mini-checkpoint they can actually solve.

Voice: warm, encouraging, plainspoken, a little playful — like a patient older friend. Never condescending. Assume the student is a beginner.

Content rules:
- Stay strictly on math/algebra. If the message is off-topic or empty, gently steer back in "intro" and return empty "walkthrough" and "problems" arrays.
- FIRST, write a "walkthrough": pick ONE representative example like theirs and solve it in 3 to 5 short steps. This is played as a little step-by-step animation BEFORE they practice, so each step is one short idea, in order. Start a step by stating the example, then each following step does one move toward the answer, ending with the result.
- THEN write 2 or 3 interactive multiple-choice problems that match what they asked about, in increasing difficulty.
- Each problem has EXACTLY 4 options. Exactly one is correct. The wrong options should be plausible (reflect common mistakes), not silly.
- "correct" is the 0-based index of the right option.
- "explain" teaches the solution as a short worked-out walkthrough (this is shown AFTER they answer), so include the key steps in 1-3 sentences.
- Use plain text math (e.g. x^2, *, /, parentheses). No markdown, no LaTeX, no code fences.

Return ONLY a JSON object with this exact shape:
{
  "concept": "<short name of the skill, e.g. 'Factoring trinomials'>",
  "intro": "<1-2 sentences acknowledging their struggle and introducing the walkthrough>",
  "walkthrough": ["<step 1: state the example>", "<step 2>", "<step 3, ...>"],
  "problems": [
    {
      "prompt": "<the problem to solve>",
      "options": ["<opt A>", "<opt B>", "<opt C>", "<opt D>"],
      "correct": 0,
      "explain": "<short worked-out walkthrough of why the answer is right>"
    }
  ],
  "tip": "<one memorable tip or common-mistake warning>"
}`

function normalizeLesson(raw) {
  const asText = (v, fallback = '') => (typeof v === 'string' ? v.trim() : fallback)

  const walkthrough = Array.isArray(raw?.walkthrough)
    ? raw.walkthrough.map((s) => asText(s)).filter(Boolean).slice(0, 6)
    : []

  const problems = Array.isArray(raw?.problems)
    ? raw.problems
        .map((p) => {
          const options = Array.isArray(p?.options)
            ? p.options.map((o) => asText(o)).filter(Boolean)
            : []
          const correct = Number.isInteger(p?.correct) ? p.correct : 0
          return {
            prompt: asText(p?.prompt),
            options,
            correct,
            explain: asText(p?.explain),
          }
        })
        // Keep only well-formed problems: a prompt, 2-6 options, valid answer index.
        .filter(
          (p) => p.prompt && p.options.length >= 2 && p.options.length <= 6 && p.correct < p.options.length && p.correct >= 0
        )
        .slice(0, 3)
    : []

  return {
    concept: asText(raw?.concept, 'Your question'),
    intro: asText(
      raw?.intro,
      problems.length || walkthrough.length
        ? "Let's walk through it, then you try!"
        : "Tell me a specific algebra problem and I'll whip up a walkthrough and some practice for you!"
    ),
    walkthrough,
    problems,
    tip: asText(raw?.tip),
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
      temperature: 0.5,
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
  return normalizeLesson(parsed)
}
