// Question bank for the "Powers of Powers" checkpoint: (xᵃ)ᵇ = xᵃᵇ.
const sup = (n) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])

export const LEVELS = [
  {
    id: 'ppow-1',
    topic: 'Powers of Powers',
    prompt: 'Simplify:  (x²)³',
    options: ['x⁵', 'x⁶', 'x⁸', 'x²³'],
    correct: 1,
    explain: 'Power of a power: multiply the exponents, 2 · 3 = 6.',
  },
  {
    id: 'ppow-2',
    topic: 'Powers of Powers',
    prompt: 'Simplify:  (y³)²',
    options: ['y⁵', 'y⁹', 'y⁶', 'y¹'],
    correct: 2,
    explain: 'Multiply the exponents: 3 · 2 = 6.',
  },
  {
    id: 'ppow-3',
    topic: 'Powers of Powers',
    prompt: 'Simplify:  (2²)³',
    options: ['2⁶', '2⁵', '4⁶', '8⁶'],
    correct: 0,
    explain: 'Keep the base 2 and multiply exponents: 2 · 3 = 6.',
  },
  {
    id: 'ppow-4',
    topic: 'Powers of Powers',
    prompt: 'Simplify:  (a⁴)²',
    options: ['a⁶', 'a⁴', 'a⁸', 'a¹⁶'],
    correct: 2,
    explain: 'Multiply the exponents: 4 · 2 = 8.',
  },
  {
    id: 'ppow-5',
    topic: 'Powers of Powers',
    prompt: 'Simplify:  (3x²)³',
    options: ['27x⁶', '9x⁶', '27x⁵', '3x⁶'],
    correct: 0,
    explain: 'Cube the coefficient (3³=27) and multiply exponents (2·3=6).',
  },
]

// One freshly randomized question for the make-up flow: power of a power → multiply.
export function generateLike() {
  const bases = ['x', 'y', 'a', 'b', 'n', 'm', 't']
  const base = bases[Math.floor(Math.random() * bases.length)]
  const inner = 2 + Math.floor(Math.random() * 4) // 2..5
  const outer = 2 + Math.floor(Math.random() * 4) // 2..5
  const product = inner * outer

  const correctStr = base + sup(product)
  const wrongSet = new Set([correctStr])
  const wrongs = []
  const candidates = [
    base + sup(inner + outer), // added instead of multiplied
    base + sup(inner), // forgot the outer power
    base + sup(outer), // used only the outer
    base + sup(product + 1), // off by one
    base + sup(product - 1), // off by one
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
    prompt: `Simplify:  (${base}${sup(inner)})${sup(outer)}`,
    options,
    correct: options.indexOf(correctStr),
    explain: `Power of a power: multiply the exponents, ${inner} · ${outer} = ${product}.`,
  }
}
