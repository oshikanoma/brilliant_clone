// Question bank for the "Multiply Powers" checkpoint: xᵃ · xᵇ = xᵃ⁺ᵇ.
const sup = (n) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])

export const LEVELS = [
  {
    id: 'mpow-1',
    topic: 'Add the Exponents',
    prompt: 'Simplify:  x² · x³',
    options: ['x⁵', 'x⁶', 'x¹', '2x⁵'],
    correct: 0,
    explain: 'Same base, so add the exponents: 2 + 3 = 5.',
  },
  {
    id: 'mpow-2',
    topic: 'Variable Bases',
    prompt: 'Simplify:  y⁴ · y³',
    options: ['y¹²', 'y⁷', 'y¹', 'y⁴³'],
    correct: 1,
    explain: 'Add the exponents: 4 + 3 = 7.',
  },
  {
    id: 'mpow-3',
    topic: 'Numeric Bases',
    prompt: 'Simplify:  2³ · 2²',
    options: ['4⁵', '2⁶', '2⁵', '2¹'],
    correct: 2,
    explain: 'Keep the base 2 and add exponents: 3 + 2 = 5.',
  },
  {
    id: 'mpow-4',
    topic: 'Implied Exponent',
    prompt: 'Simplify:  a · a⁵',
    options: ['a⁵', 'a⁶', 'a⁴', '2a⁶'],
    correct: 1,
    explain: 'A lone a is a¹, so 1 + 5 = 6.',
  },
  {
    id: 'mpow-5',
    topic: 'With Coefficients',
    prompt: 'Simplify:  3x² · 4x³',
    options: ['12x⁵', '7x⁵', '12x⁶', '12x⁵·'],
    correct: 0,
    explain: 'Multiply coefficients (3·4=12) and add exponents (2+3=5).',
  },
]

// One freshly randomized question for the make-up flow: same base, add exponents.
export function generateLike() {
  const bases = ['x', 'y', 'a', 'b', 'n', 'm', 't']
  const base = bases[Math.floor(Math.random() * bases.length)]
  const e1 = 1 + Math.floor(Math.random() * 5) // 1..5
  const e2 = 1 + Math.floor(Math.random() * 5) // 1..5
  const sum = e1 + e2

  const correctStr = base + sup(sum)
  const wrongSet = new Set([correctStr])
  const wrongs = []
  const candidates = [
    base + sup(e1 * e2), // multiplied exponents
    base + sup(Math.abs(e1 - e2)), // subtracted
    base + sup(sum + 1), // off by one
    '2' + base + sup(sum), // bogus coefficient
    base + sup(sum - 1 > 0 ? sum - 1 : sum + 2),
  ]
  for (const c of candidates) {
    if (wrongs.length >= 3) break
    if (!wrongSet.has(c)) {
      wrongSet.add(c)
      wrongs.push(c)
    }
  }

  const options = [correctStr, ...wrongs]
  // Fisher–Yates shuffle.
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  return {
    prompt: `Simplify:  ${base}${sup(e1)} · ${base}${sup(e2)}`,
    options,
    correct: options.indexOf(correctStr),
    explain: `Same base, so add the exponents: ${e1} + ${e2} = ${sum}.`,
  }
}
