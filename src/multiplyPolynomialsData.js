// Multiple-choice content for the "Multiply Polynomials" checkpoint. Students
// distribute every term in the first factor across the second (FOIL for two
// binomials). Used by ConceptLesson with the animated MultiplyPolynomialsIntro
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
    id: 'mul-1',
    topic: 'FOIL Basics',
    prompt: 'Multiply:  (x + 1)(x + 2)',
    options: ['x² + 3x + 2', 'x² + 2x + 2', 'x² + 3x + 3', 'x² + 2'],
    correct: 0,
    explain: 'FOIL: x·x + x·2 + 1·x + 1·2 = x² + 2x + x + 2 = x² + 3x + 2.',
  },
  {
    id: 'mul-2',
    topic: 'Consecutive Pair',
    prompt: 'Multiply:  (x + 2)(x + 3)',
    options: ['x² + 5x + 6', 'x² + 6x + 6', 'x² + 5x + 5', 'x² + 6'],
    correct: 0,
    explain: 'FOIL: x·x + x·3 + 2·x + 2·3 = x² + 3x + 2x + 6 = x² + 5x + 6.',
  },
  {
    id: 'mul-3',
    topic: 'Bigger Numbers',
    prompt: 'Multiply:  (x + 4)(x + 5)',
    options: ['x² + 9x + 20', 'x² + 20x + 9', 'x² + 9x + 9', 'x² + 9x + 45'],
    correct: 0,
    explain: 'FOIL: x·x + x·5 + 4·x + 4·5 = x² + 5x + 4x + 20 = x² + 9x + 20.',
  },
  {
    id: 'mul-4',
    topic: 'Spread Apart',
    prompt: 'Multiply:  (x + 3)(x + 7)',
    options: ['x² + 10x + 21', 'x² + 21x + 10', 'x² + 10x + 10', 'x² + 4x + 21'],
    correct: 0,
    explain: 'FOIL: x·x + x·7 + 3·x + 3·7 = x² + 7x + 3x + 21 = x² + 10x + 21.',
  },
  {
    id: 'mul-5',
    topic: 'Large Products',
    prompt: 'Multiply:  (x + 6)(x + 8)',
    options: ['x² + 14x + 48', 'x² + 48x + 14', 'x² + 14x + 14', 'x² + 14x + 68'],
    correct: 0,
    explain: 'FOIL: x·x + x·8 + 6·x + 6·8 = x² + 8x + 6x + 48 = x² + 14x + 48.',
  },
]

// Generate a fresh two-binomial product (x + a)(x + b) with small positive
// a, b. The correct answer is x² + (a+b)x + ab; distractors come from common
// slips: forgetting to add the outer/inner terms, mis-adding, or mis-multiplying.
export function generateLike(level) {
  const a = rint(1, 9)
  const b = rint(1, 9)
  const sum = a + b
  const prod = a * b

  const trinomial = (mid, last) => `x${sup(2)} + ${mid}x + ${last}`
  const correctText = trinomial(sum, prod)

  const wrong = new Set()
  wrong.add(trinomial(prod, sum)) // swapped middle and last
  wrong.add(`x${sup(2)} + ${prod}`) // forgot the middle term entirely
  wrong.add(trinomial(sum, sum)) // used the sum for the constant too
  wrong.add(trinomial(sum + 1, prod)) // mis-added the middle term
  wrong.add(trinomial(sum, prod + a)) // mis-multiplied the constant
  wrong.delete(correctText)

  const distractors = shuffle([...wrong]).slice(0, 3)
  const options = shuffle([correctText, ...distractors])
  const correct = options.indexOf(correctText)

  return {
    prompt: `Multiply:  (x + ${a})(x + ${b})`,
    options,
    correct,
    explain: `FOIL: x·x + x·${b} + ${a}·x + ${a}·${b} = x${sup(2)} + ${b}x + ${a}x + ${prod} = ${correctText}.`,
  }
}
