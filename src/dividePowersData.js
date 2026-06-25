// Checkpoint puzzles for "Divide Powers": dividing same-base powers subtracts
// the exponents — xᵃ / xᵇ = xᵃ⁻ᵇ. Five multiple-choice levels of increasing
// difficulty plus a generator for the make-up flow. Shape matches ConceptLesson:
// { id, topic, prompt, options, correct, explain } and
// generateLike(level) => { prompt, options, correct, explain }.

const sup = (n) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])

export const LEVELS = [
  {
    id: 'basic',
    topic: 'Subtract the Exponents',
    prompt: 'Simplify:  x⁷ / x²',
    options: ['x⁵', 'x⁹', 'x³·⁵', 'x¹⁴'],
    correct: 0,
    explain: 'Same base in a quotient, so subtract the exponents: 7 − 2 = 5, giving x⁵.',
  },
  {
    id: 'other-base',
    topic: 'Any Shared Base',
    prompt: 'Simplify:  y⁹ / y⁴',
    options: ['y⁵', 'y¹³', 'y⁶', 'y²·²⁵'],
    correct: 0,
    explain: 'Subtract the exponents on the shared base: 9 − 4 = 5, giving y⁵.',
  },
  {
    id: 'coefficients',
    topic: 'Dividing Coefficients Too',
    prompt: 'Simplify:  10x⁸ / 2x³',
    options: ['5x⁵', '5x¹¹', '8x⁵', '20x⁵'],
    correct: 0,
    explain: 'Divide the coefficients (10 ÷ 2 = 5) and subtract the exponents (8 − 3 = 5): 5x⁵.',
  },
  {
    id: 'numeric',
    topic: 'Numeric Bases',
    prompt: 'Evaluate:  2⁶ / 2²',
    options: ['16', '8', '64', '2¹²'],
    correct: 0,
    explain: 'Subtract the exponents: 6 − 2 = 4, so 2⁴ = 16.',
  },
  {
    id: 'negative-result',
    topic: 'When the Result Goes Negative',
    prompt: 'Simplify:  x³ / x⁵',
    options: ['x⁻²', 'x²', 'x⁸', 'x⁻⁸'],
    correct: 0,
    explain: 'Subtract the exponents: 3 − 5 = −2, giving x⁻² (which is 1/x²).',
  },
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Build a 4-option question from a correct answer string plus distractor
// candidates: keep distinct strings, pad if needed, shuffle, and report the
// post-shuffle index of the correct answer.
function buildQuestion(prompt, answer, distractors, explain) {
  const opts = [answer]
  for (const d of distractors) {
    if (opts.length >= 4) break
    if (!opts.includes(d)) opts.push(d)
  }
  let extra = 1
  while (opts.length < 4) {
    const filler = answer + '·' + extra
    if (!opts.includes(filler)) opts.push(filler)
    extra += 1
  }
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return { prompt, options: opts, correct: opts.indexOf(answer), explain }
}

export function generateLike(level) {
  const base = pick(['x', 'y', 'a', 'm', 'n', 'p'])
  const a = 5 + Math.floor(Math.random() * 5) // 5..9
  const b = 1 + Math.floor(Math.random() * 4) // 1..4
  const diff = a - b

  const answer = base + sup(diff)
  const distractors = [
    base + sup(a + b),
    base + sup(a),
    base + sup(a * b),
    base + sup(b - a),
  ]
  return buildQuestion(
    `Simplify:  ${base}${sup(a)} / ${base}${sup(b)}`,
    answer,
    distractors,
    `Same base in a quotient, so subtract the exponents: ${a} − ${b} = ${diff}, giving ${answer}.`,
  )
}
