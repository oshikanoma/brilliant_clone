// Mixed multiple-choice review for the "Expressions with Exponents" section.
// One question per skill: multiplying powers, powers of powers, dividing powers,
// powers of products/quotients, and zero/negative exponents. Used by
// ConceptLesson with isReview (80% to pass).
export const LEVELS = [
  {
    id: 'multiply',
    topic: 'Multiply Powers',
    prompt: 'Simplify:  x³ · x⁴',
    options: ['x⁷', 'x¹²', 'x', 'x⁻¹'],
    correct: 0,
    explain: 'Same base, so add the exponents: 3 + 4 = 7, giving x⁷.',
  },
  {
    id: 'power-of-power',
    topic: 'Powers of Powers',
    prompt: 'Simplify:  (x²)³',
    options: ['x⁶', 'x⁵', 'x⁸', 'x⁹'],
    correct: 0,
    explain: 'A power raised to a power multiplies the exponents: 2 · 3 = 6.',
  },
  {
    id: 'divide',
    topic: 'Divide Powers',
    prompt: 'Simplify:  x⁷ / x²',
    options: ['x⁵', 'x⁹', 'x³·⁵', 'x¹⁴'],
    correct: 0,
    explain: 'Same base, so subtract the exponents: 7 − 2 = 5, giving x⁵.',
  },
  {
    id: 'product-power',
    topic: 'Powers of Products',
    prompt: 'Simplify:  (2x)³',
    options: ['8x³', '2x³', '6x³', '8x'],
    correct: 0,
    explain: 'Raise each factor to the power: 2³ = 8 and x³, giving 8x³.',
  },
  {
    id: 'zero',
    topic: 'Zero Exponent',
    prompt: 'Evaluate:  5⁰',
    options: ['1', '0', '5', 'undefined'],
    correct: 0,
    explain: 'Any nonzero base raised to the 0 power equals 1.',
  },
  {
    id: 'negative',
    topic: 'Negative Exponent',
    prompt: 'Rewrite with a positive exponent:  x⁻²',
    options: ['1/x²', '−x²', '−2x', 'x²'],
    correct: 0,
    explain: 'A negative exponent means reciprocal: x⁻² = 1/x².',
  },
]
