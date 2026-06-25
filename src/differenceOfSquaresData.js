// Multiple-choice content for the "Difference of Squares" checkpoint.
// Rule: a² − b² = (a + b)(a − b). A sum a² + b² does NOT factor this way.
// LEVELS progress in difficulty; generateLike powers the make-up flow.

const sup = (n) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])

const shuffle = (arr) => {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const LEVELS = [
  {
    id: 'dos-9',
    topic: 'Subtract 9',
    prompt: 'Factor:  x² − 9',
    options: ['(x + 3)(x − 3)', '(x − 3)²', '(x + 3)²', '(x − 9)(x + 1)'],
    correct: 0,
    explain: 'a² − b² = (a + b)(a − b), with a = x and b = 3 since 9 = 3².',
  },
  {
    id: 'dos-25',
    topic: 'Subtract 25',
    prompt: 'Factor:  x² − 25',
    options: ['(x + 5)(x − 5)', '(x − 5)²', '(x + 5)²', '(x − 25)(x + 1)'],
    correct: 0,
    explain: 'Here 25 = 5², so x² − 25 = (x + 5)(x − 5).',
  },
  {
    id: 'dos-49',
    topic: 'Subtract 49',
    prompt: 'Factor:  x² − 49',
    options: ['(x + 7)(x − 7)', '(x + 7)²', '(x − 7)²', '(x + 49)(x − 1)'],
    correct: 0,
    explain: 'Since 49 = 7², the conjugate factors are (x + 7)(x − 7).',
  },
  {
    id: 'dos-4x2-9',
    topic: 'With Coefficient',
    prompt: 'Factor:  4x² − 9',
    options: ['(2x + 3)(2x − 3)', '(2x − 3)²', '(2x + 3)²', '(4x + 3)(x − 3)'],
    correct: 0,
    explain: '4x² = (2x)² and 9 = 3², so a = 2x and b = 3: (2x + 3)(2x − 3).',
  },
  {
    id: 'dos-x4-16',
    topic: 'Fourth Power',
    prompt: 'Factor:  x⁴ − 16',
    options: ['(x² + 4)(x² − 4)', '(x² − 4)²', '(x² + 4)²', '(x² + 16)(x² − 1)'],
    correct: 0,
    explain: 'x⁴ = (x²)² and 16 = 4², so a = x² and b = 4: (x² + 4)(x² − 4).',
  },
]

// One randomized x² − b² question for the make-up flow. The correct answer is the
// conjugate pair (x + b)(x − b); distractors are the perfect-square mistakes.
export function generateLike(level) {
  const b = 2 + Math.floor(Math.random() * 9) // 2..10
  const sq = b * b
  const correct = `(x + ${b})(x − ${b})`
  const options = shuffle([
    correct,
    `(x − ${b})²`,
    `(x + ${b})²`,
    `(x − ${sq})(x + 1)`,
  ])
  return {
    prompt: `Factor:  x${sup(2)} − ${sq}`,
    options,
    correct: options.indexOf(correct),
    explain: `a² − b² = (a + b)(a − b) with a = x and b = ${b}, since ${sq} = ${b}². So x${sup(2)} − ${sq} = (x + ${b})(x − ${b}).`,
  }
}
