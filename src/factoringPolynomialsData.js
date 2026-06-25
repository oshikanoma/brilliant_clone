// Multiple-choice content for the "Factoring Polynomials" checkpoint. Factoring
// reverses multiplication: for x² + bx + c, find two numbers that multiply to c
// and add to b. Used by ConceptLesson with the animated FactoringPolynomialsIntro
// and generateLike for make-up rounds.

const sup = (n) =>
  String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])

const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const LEVELS = [
  {
    id: 'fac-1',
    topic: 'Factoring Polynomials',
    prompt: 'Factor:  x² + 3x + 2',
    options: ['(x + 1)(x + 2)', '(x + 1)(x + 1)', '(x + 2)(x + 2)', '(x + 1)(x + 3)'],
    correct: 0,
    explain: 'Need two numbers that multiply to 2 and add to 3: that is 1 and 2.',
  },
  {
    id: 'fac-2',
    topic: 'Factoring Polynomials',
    prompt: 'Factor:  x² + 5x + 6',
    options: ['(x + 2)(x + 3)', '(x + 1)(x + 6)', '(x + 2)(x + 4)', '(x + 1)(x + 5)'],
    correct: 0,
    explain: 'Need two numbers that multiply to 6 and add to 5: that is 2 and 3.',
  },
  {
    id: 'fac-3',
    topic: 'Factoring Polynomials',
    prompt: 'Factor:  x² + 7x + 12',
    options: ['(x + 3)(x + 4)', '(x + 2)(x + 6)', '(x + 1)(x + 12)', '(x + 5)(x + 2)'],
    correct: 0,
    explain: 'Need two numbers that multiply to 12 and add to 7: that is 3 and 4.',
  },
  {
    id: 'fac-4',
    topic: 'Factoring Polynomials',
    prompt: 'Factor:  x² + 8x + 15',
    options: ['(x + 3)(x + 5)', '(x + 1)(x + 15)', '(x + 4)(x + 4)', '(x + 2)(x + 6)'],
    correct: 0,
    explain: 'Need two numbers that multiply to 15 and add to 8: that is 3 and 5.',
  },
  {
    id: 'fac-5',
    topic: 'Factoring Polynomials',
    prompt: 'Factor:  x² + 11x + 24',
    options: ['(x + 3)(x + 8)', '(x + 4)(x + 6)', '(x + 2)(x + 12)', '(x + 1)(x + 24)'],
    correct: 0,
    explain: 'Need two numbers that multiply to 24 and add to 11: that is 3 and 8.',
  },
]

// Generate a fresh trinomial x² + (p+q)x + pq to factor, with small positive
// roots p, q. The correct answer is (x + p)(x + q); distractors come from wrong
// factor pairs of the constant (which therefore add to the wrong middle term).
export function generateLike(level) {
  const p = rint(1, 8)
  const q = rint(1, 8)
  const b = p + q
  const c = p * q

  // Always present each pair in sorted order so option strings are canonical
  // (and so duplicates collapse cleanly in the Set below).
  const factored = (m, n) => {
    const lo = Math.min(m, n)
    const hi = Math.max(m, n)
    return `(x + ${lo})(x + ${hi})`
  }
  const correctText = factored(p, q)

  const wrong = new Set()
  // Real factor pairs of c — these multiply to c but add to the wrong middle.
  for (let m = 1; m <= c; m++) {
    if (c % m === 0) wrong.add(factored(m, c / m))
  }
  // Structural slips: numbers that add to b but don't multiply to c, plus
  // near-misses around the true roots.
  wrong.add(factored(1, b - 1))
  wrong.add(factored(p, q + 1))
  wrong.add(factored(p + 1, q))
  wrong.delete(correctText)

  // Guarantee at least three distinct distractors regardless of how few factor
  // pairs c happens to have.
  let guard = 1
  while (wrong.size < 3) {
    wrong.add(factored(1, b + guard))
    wrong.delete(correctText)
    guard++
  }

  const distractors = shuffle([...wrong]).slice(0, 3)
  const options = shuffle([correctText, ...distractors])
  const correct = options.indexOf(correctText)

  return {
    prompt: `Factor:  x${sup(2)} + ${b}x + ${c}`,
    options,
    correct,
    explain: `Need two numbers that multiply to ${c} and add to ${b}: that is ${p} and ${q}, giving ${correctText}.`,
  }
}
