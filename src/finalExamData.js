// The cumulative Final Exam pulls one question from every major skill across
// the whole course: Algebra Foundations, Graphs & Linear Relationships,
// Expressions with Exponents, and Quadratics & Polynomials. It is scored
// pass/fail (80% on the first try), so there is no make-up generator — the
// ConceptLesson engine just shuffles each question's options per attempt.

export const LEVELS = [
  // ---- Algebra Foundations ----
  {
    id: 'fe-solve',
    topic: 'Solving Equations',
    prompt: 'Solve for x:  3x − 5 = 16',
    options: ['x = 7', 'x = 5', 'x = 11', 'x = 3'],
    correct: 0,
    explain: 'Add 5: 3x = 21, then divide by 3: x = 7.',
  },
  {
    id: 'fe-order',
    topic: 'Order of Operations',
    prompt: 'Simplify:  8 + 2 × (5 − 3)²',
    options: ['16', '40', '36', '20'],
    correct: 0,
    explain: 'Parentheses: 5 − 3 = 2. Exponent: 2² = 4. Multiply: 2 × 4 = 8. Add: 8 + 8 = 16.',
  },
  {
    id: 'fe-liketerms',
    topic: 'Combining Like Terms',
    prompt: 'Combine like terms:  5x + 2 − 3x + 7',
    options: ['2x + 9', '2x + 5', '8x + 9', '2x − 5'],
    correct: 0,
    explain: '5x − 3x = 2x and 2 + 7 = 9, giving 2x + 9.',
  },
  {
    id: 'fe-distribute',
    topic: 'Distributive Property',
    prompt: 'Expand:  −3(2x − 4)',
    options: ['−6x + 12', '−6x − 12', '6x + 12', '−6x − 4'],
    correct: 0,
    explain: '−3·2x = −6x and −3·(−4) = +12, so −6x + 12.',
  },
  {
    id: 'fe-evaluate',
    topic: 'Evaluating Expressions',
    prompt: 'If x = −2, what is  x² + 3x − 1 ?',
    options: ['−3', '9', '−9', '3'],
    correct: 0,
    explain: '(−2)² = 4, 3·(−2) = −6, so 4 − 6 − 1 = −3.',
  },

  // ---- Graphs & Linear Relationships ----
  {
    id: 'fe-yint',
    topic: 'Y-Intercept',
    prompt: 'What is the y-intercept of  y = −4x + 9 ?',
    options: ['(0, 9)', '(9, 0)', '(0, −4)', '(0, −9)'],
    correct: 0,
    explain: 'At x = 0, y = 9, so the y-intercept is (0, 9).',
  },
  {
    id: 'fe-slope',
    topic: 'Slope',
    prompt: 'Find the slope between (1, 2) and (4, 11).',
    options: ['3', '1/3', '9', '13'],
    correct: 0,
    explain: 'Slope = (11 − 2) / (4 − 1) = 9 / 3 = 3.',
  },
  {
    id: 'fe-systems',
    topic: 'Systems of Equations',
    prompt: 'Where do  y = 2x − 1  and  y = x + 3  intersect?',
    options: ['(4, 7)', '(7, 4)', '(3, 5)', '(2, 3)'],
    correct: 0,
    explain: 'Set 2x − 1 = x + 3 → x = 4, then y = 4 + 3 = 7. They meet at (4, 7).',
  },

  // ---- Expressions with Exponents ----
  {
    id: 'fe-multpow',
    topic: 'Multiply Powers',
    prompt: 'Simplify:  x⁴ · x³',
    options: ['x⁷', 'x¹²', 'x', '2x⁷'],
    correct: 0,
    explain: 'Multiplying like bases adds exponents: 4 + 3 = 7, so x⁷.',
  },
  {
    id: 'fe-powpow',
    topic: 'Powers of Powers',
    prompt: 'Simplify:  (x²)⁵',
    options: ['x¹⁰', 'x⁷', 'x²⁵', '2x¹⁰'],
    correct: 0,
    explain: 'A power of a power multiplies exponents: 2 × 5 = 10, so x¹⁰.',
  },
  {
    id: 'fe-divpow',
    topic: 'Divide Powers',
    prompt: 'Simplify:  x⁸ ÷ x³',
    options: ['x⁵', 'x¹¹', 'x²', 'x²⁴'],
    correct: 0,
    explain: 'Dividing like bases subtracts exponents: 8 − 3 = 5, so x⁵.',
  },
  {
    id: 'fe-zeroneg',
    topic: 'Zero & Negative Exponents',
    prompt: 'Evaluate:  2⁻³',
    options: ['1/8', '−8', '−6', '8'],
    correct: 0,
    explain: 'A negative exponent means the reciprocal: 2⁻³ = 1 / 2³ = 1/8.',
  },

  // ---- Quadratics & Polynomials ----
  {
    id: 'fe-addpoly',
    topic: 'Add Polynomials',
    prompt: 'Add:  (3x² + 2x − 1) + (x² − 5x + 4)',
    options: ['4x² − 3x + 3', '4x² + 7x + 3', '2x² − 3x + 3', '4x² − 3x − 3'],
    correct: 0,
    explain: 'Combine like terms: 4x², 2x − 5x = −3x, −1 + 4 = 3 → 4x² − 3x + 3.',
  },
  {
    id: 'fe-multpoly',
    topic: 'Multiply Polynomials',
    prompt: 'Expand:  (x + 3)(x + 5)',
    options: ['x² + 8x + 15', 'x² + 15x + 8', 'x² + 2x + 15', 'x² + 8x + 8'],
    correct: 0,
    explain: 'FOIL: x² + 5x + 3x + 15 = x² + 8x + 15.',
  },
  {
    id: 'fe-factor',
    topic: 'Factoring Polynomials',
    prompt: 'Factor:  x² + 7x + 12',
    options: ['(x + 3)(x + 4)', '(x + 2)(x + 6)', '(x + 1)(x + 12)', '(x − 3)(x − 4)'],
    correct: 0,
    explain: 'Find two numbers that multiply to 12 and add to 7: 3 and 4.',
  },
  {
    id: 'fe-diffsq',
    topic: 'Difference of Squares',
    prompt: 'Factor:  x² − 49',
    options: ['(x + 7)(x − 7)', '(x − 7)²', '(x + 7)²', '(x + 49)(x − 1)'],
    correct: 0,
    explain: 'A difference of squares a² − b² factors as (a + b)(a − b): here (x + 7)(x − 7).',
  },
  {
    id: 'fe-perfsq',
    topic: 'Perfect Squares',
    prompt: 'Expand:  (x + 6)²',
    options: ['x² + 12x + 36', 'x² + 36', 'x² + 6x + 36', 'x² + 12x + 12'],
    correct: 0,
    explain: '(x + 6)² = x² + 2·6·x + 6² = x² + 12x + 36.',
  },
]
