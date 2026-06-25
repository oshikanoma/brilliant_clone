// Multiple-choice content for the "Perfect Squares" checkpoint.
// Rules: a² + 2ab + b² = (a + b)²  and  a² − 2ab + b² = (a − b)².
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
    id: 'psq-9',
    topic: 'Perfect Squares',
    prompt: 'Factor:  x² + 6x + 9',
    options: ['(x + 3)²', '(x − 3)²', '(x + 9)²', '(x + 3)(x − 3)'],
    correct: 0,
    explain: 'First and last are squares (x² and 3²) and 6x = 2·3·x, so (x + 3)².',
  },
  {
    id: 'psq-25',
    topic: 'Perfect Squares',
    prompt: 'Factor:  x² + 10x + 25',
    options: ['(x + 5)²', '(x − 5)²', '(x + 25)²', '(x + 5)(x − 5)'],
    correct: 0,
    explain: '25 = 5² and the middle 10x = 2·5·x, so it is (x + 5)².',
  },
  {
    id: 'psq-minus-16',
    topic: 'Perfect Squares',
    prompt: 'Factor:  x² − 8x + 16',
    options: ['(x − 4)²', '(x + 4)²', '(x − 16)²', '(x − 4)(x + 4)'],
    correct: 0,
    explain: 'A negative middle gives a − b: 16 = 4² and 8x = 2·4·x, so (x − 4)².',
  },
  {
    id: 'psq-49',
    topic: 'Perfect Squares',
    prompt: 'Factor:  x² + 14x + 49',
    options: ['(x + 7)²', '(x − 7)²', '(x + 49)²', '(x + 7)(x − 7)'],
    correct: 0,
    explain: '49 = 7² and 14x = 2·7·x, so the trinomial is (x + 7)².',
  },
  {
    id: 'psq-4x2',
    topic: 'Perfect Squares',
    prompt: 'Factor:  4x² + 12x + 9',
    options: ['(2x + 3)²', '(2x − 3)²', '(4x + 3)²', '(2x + 3)(2x − 3)'],
    correct: 0,
    explain: '4x² = (2x)², 9 = 3², and 12x = 2·(2x)·3, so it is (2x + 3)².',
  },
]

// One randomized x² + 2bx + b² question for the make-up flow. The correct answer
// is the single square (x + b)²; distractors are the common factoring mistakes.
export function generateLike(level) {
  const b = 2 + Math.floor(Math.random() * 8) // 2..9
  const sq = b * b
  const mid = 2 * b
  const correct = `(x + ${b})²`
  const options = shuffle([
    correct,
    `(x − ${b})²`,
    `(x + ${sq})²`,
    `(x + ${b})(x − ${b})`,
  ])
  return {
    prompt: `Factor:  x${sup(2)} + ${mid}x + ${sq}`,
    options,
    correct: options.indexOf(correct),
    explain: `A perfect-square trinomial: x${sup(2)} is a square, ${sq} = ${b}², and the middle ${mid}x = 2·${b}·x. So it factors as (x + ${b})².`,
  }
}
