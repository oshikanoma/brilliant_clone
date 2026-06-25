// Mixed multiple-choice review for the "Quadratics and Polynomials" section.
// One question per skill: adding, subtracting, and multiplying polynomials,
// factoring, difference of squares, and perfect squares. Used by ConceptLesson
// with isReview (80% to pass).
export const LEVELS = [
  {
    id: 'add',
    topic: 'Add Polynomials',
    prompt: 'Add:  (2x² + 3x) + (x² + 5x)',
    options: ['3x² + 8x', '2x² + 8x', '3x² + 15x', '3x⁴ + 8x²'],
    correct: 0,
    explain: 'Combine like terms: 2x² + x² = 3x² and 3x + 5x = 8x.',
  },
  {
    id: 'subtract',
    topic: 'Subtract Polynomials',
    prompt: 'Subtract:  (5x² + 2x) − (2x² + 4x)',
    options: ['3x² − 2x', '3x² + 2x', '7x² + 6x', '3x² − 6x'],
    correct: 0,
    explain: 'Distribute the minus: 5x² − 2x² = 3x² and 2x − 4x = −2x.',
  },
  {
    id: 'multiply',
    topic: 'Multiply Polynomials',
    prompt: 'Multiply:  (x + 2)(x + 3)',
    options: ['x² + 5x + 6', 'x² + 6', 'x² + 6x + 6', 'x² + 5x + 5'],
    correct: 0,
    explain: 'FOIL: x·x + x·3 + 2·x + 2·3 = x² + 5x + 6.',
  },
  {
    id: 'factor',
    topic: 'Factoring Polynomials',
    prompt: 'Factor:  x² + 5x + 6',
    options: ['(x + 2)(x + 3)', '(x + 1)(x + 6)', '(x + 2)(x + 4)', '(x − 2)(x − 3)'],
    correct: 0,
    explain: 'Find two numbers that multiply to 6 and add to 5: 2 and 3.',
  },
  {
    id: 'diff-squares',
    topic: 'Difference of Squares',
    prompt: 'Factor:  x² − 9',
    options: ['(x + 3)(x − 3)', '(x − 3)²', '(x + 3)²', '(x − 9)(x + 1)'],
    correct: 0,
    explain: 'a² − b² = (a + b)(a − b), with a = x and b = 3.',
  },
  {
    id: 'perfect-square',
    topic: 'Perfect Squares',
    prompt: 'Factor:  x² + 6x + 9',
    options: ['(x + 3)²', '(x − 3)²', '(x + 9)²', '(x + 6)²'],
    correct: 0,
    explain: 'It is a perfect-square trinomial: (x + 3)² = x² + 6x + 9.',
  },
]
