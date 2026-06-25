// Checkpoint puzzles for "Zero & Negative Exponents": a⁰ = 1 for any nonzero
// base, and a⁻ⁿ = 1/aⁿ (a negative exponent flips the factor to the
// denominator). Five multiple-choice levels plus a generator for make-up.
// Shape matches ConceptLesson: { id, topic, prompt, options, correct, explain }
// and generateLike(level) => { prompt, options, correct, explain }.

const sup = (n) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])

export const LEVELS = [
  {
    id: 'zero',
    topic: 'Zero & Negative Exponents',
    prompt: 'Evaluate:  5⁰',
    options: ['1', '0', '5', 'undefined'],
    correct: 0,
    explain: 'Any nonzero base raised to the 0 power equals 1, so 5⁰ = 1.',
  },
  {
    id: 'neg-var',
    topic: 'Zero & Negative Exponents',
    prompt: 'Rewrite with a positive exponent:  x⁻²',
    options: ['1/x²', '−x²', 'x²', '−2x'],
    correct: 0,
    explain: 'A negative exponent flips the factor to the denominator: x⁻² = 1/x².',
  },
  {
    id: 'neg-num',
    topic: 'Zero & Negative Exponents',
    prompt: 'Evaluate:  2⁻³',
    options: ['1/8', '−8', '8', '−6'],
    correct: 0,
    explain: '2⁻³ = 1/2³ = 1/8. The negative exponent means reciprocal, not a negative value.',
  },
  {
    id: 'coef-zero',
    topic: 'Zero & Negative Exponents',
    prompt: 'Simplify:  4x⁰   (x ≠ 0)',
    options: ['4', '1', '4x', '0'],
    correct: 0,
    explain: 'Only x is raised to the 0 power, and x⁰ = 1, so 4 · 1 = 4.',
  },
  {
    id: 'neg-num-2',
    topic: 'Zero & Negative Exponents',
    prompt: 'Evaluate:  3⁻²',
    options: ['1/9', '−9', '1/6', '9'],
    correct: 0,
    explain: '3⁻² = 1/3² = 1/9.',
  },
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function buildQuestion(prompt, answer, distractors, explain) {
  const opts = [answer]
  for (const d of distractors) {
    if (opts.length >= 4) break
    if (d !== answer && !opts.includes(d)) opts.push(d)
  }
  let extra = 2
  while (opts.length < 4) {
    const filler = String(extra)
    if (!opts.includes(filler)) opts.push(filler)
    extra += 1
  }
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return { prompt, options: opts, correct: opts.indexOf(answer), explain }
}

function genZero() {
  const base = pick([2, 3, 4, 5, 6, 7, 8, 9])
  return buildQuestion(
    `Evaluate:  ${base}${sup(0)}`,
    '1',
    ['0', String(base), 'undefined'],
    `Any nonzero base raised to the 0 power equals 1, so ${base}⁰ = 1.`,
  )
}

function genNegVar() {
  const base = pick(['x', 'y', 'a', 'm', 'n'])
  const n = 2 + Math.floor(Math.random() * 4) // 2..5
  const answer = `1/${base}${sup(n)}`
  return buildQuestion(
    `Rewrite with a positive exponent:  ${base}${sup(-n)}`,
    answer,
    [`−${base}${sup(n)}`, `${base}${sup(n)}`, `−${n}${base}`],
    `A negative exponent flips the factor to the denominator: ${base}⁻${sup(n).replace('⁻', '')} = ${answer}.`,
  )
}

function genNegNum() {
  const base = pick([2, 3, 4, 5])
  const n = 2 + Math.floor(Math.random() * 2) // 2..3
  const val = Math.pow(base, n)
  const answer = `1/${val}`
  return buildQuestion(
    `Evaluate:  ${base}${sup(-n)}`,
    answer,
    [`−${val}`, String(val), `1/${base * n}`],
    `${base}⁻${sup(n).replace('⁻', '')} = 1/${base}${sup(n)} = ${answer}.`,
  )
}

export function generateLike(level) {
  const kind = pick(['zero', 'neg-var', 'neg-num'])
  if (kind === 'zero') return genZero()
  if (kind === 'neg-num') return genNegNum()
  return genNegVar()
}
