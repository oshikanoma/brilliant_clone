// Checkpoint puzzles for "Powers of Products & Quotients": an exponent on a
// product or quotient distributes to every factor — (ab)ⁿ = aⁿbⁿ and
// (a/b)ⁿ = aⁿ/bⁿ. Five multiple-choice levels plus a generator for make-up.
// Shape matches ConceptLesson: { id, topic, prompt, options, correct, explain }
// and generateLike(level) => { prompt, options, correct, explain }.

const sup = (n) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])

export const LEVELS = [
  {
    id: 'product',
    topic: 'Powers of Products & Quotients',
    prompt: 'Simplify:  (2x)³',
    options: ['8x³', '2x³', '6x³', '8x'],
    correct: 0,
    explain: 'The power lands on every factor: 2³ = 8 and x³, giving 8x³.',
  },
  {
    id: 'product-2',
    topic: 'Powers of Products & Quotients',
    prompt: 'Simplify:  (3y)²',
    options: ['9y²', '6y²', '3y²', '9y'],
    correct: 0,
    explain: 'Raise each factor to the 2nd power: 3² = 9 and y², giving 9y².',
  },
  {
    id: 'quotient',
    topic: 'Powers of Products & Quotients',
    prompt: 'Simplify:  (x/y)²',
    options: ['x²/y²', 'x²/y', 'x/y²', '2x/2y'],
    correct: 0,
    explain: 'The exponent drops onto top and bottom: x²/y².',
  },
  {
    id: 'product-nested',
    topic: 'Powers of Products & Quotients',
    prompt: 'Simplify:  (2a²b)³',
    options: ['8a⁶b³', '6a⁶b³', '8a⁵b³', '8a⁶b'],
    correct: 0,
    explain: 'Each factor gets the power of 3: 2³ = 8, (a²)³ = a⁶, and b³, giving 8a⁶b³.',
  },
  {
    id: 'quotient-nested',
    topic: 'Powers of Products & Quotients',
    prompt: 'Simplify:  (x²/3)²',
    options: ['x⁴/9', 'x⁴/6', 'x⁴/3', '2x²/9'],
    correct: 0,
    explain: 'Distribute the power: (x²)² = x⁴ on top and 3² = 9 on the bottom, giving x⁴/9.',
  },
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function buildQuestion(prompt, answer, distractors, explain) {
  const opts = [answer]
  for (const d of distractors) {
    if (opts.length >= 4) break
    if (d !== answer && !opts.includes(d)) opts.push(d)
  }
  let extra = 4
  while (opts.length < 4) {
    const filler = `${extra}${answer.replace(/^\d+/, '')}`
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
  const base = pick(['x', 'y', 'a', 'm', 'n'])
  const c = 2 + Math.floor(Math.random() * 3) // 2..4
  const n = 2 + Math.floor(Math.random() * 2) // 2..3
  const cPow = Math.pow(c, n)

  const answer = `${cPow}${base}${sup(n)}`
  const distractors = [
    `${c * n}${base}${sup(n)}`, // multiplied coefficient by exponent instead of raising it
    `${c}${base}${sup(n)}`, // forgot to raise the coefficient
    `${cPow}${base}`, // dropped the variable's exponent
    `${cPow}${base}${sup(n + 1)}`,
  ]
  return buildQuestion(
    `Simplify:  (${c}${base})${sup(n)}`,
    answer,
    distractors,
    `The power lands on every factor: ${c}${sup(n)} = ${cPow} and ${base}${sup(n)}, giving ${answer}.`,
  )
}
