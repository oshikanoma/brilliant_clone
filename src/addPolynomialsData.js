// Multiple-choice content for the "Add Polynomials" checkpoint. Adding
// polynomials means combining LIKE terms — terms with the same variable AND
// exponent — by adding their coefficients while the exponent stays put.
// Consumed by ConceptLesson (LEVELS for the fixed run, generateLike for make-up).

const sup = (n) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])

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
    id: 'add-1',
    topic: 'Add Polynomials',
    prompt: 'Add:  (2x² + 3x) + (x² + 5x)',
    options: ['3x² + 8x', '3x⁴ + 8x', '8x³', '2x² + 8x'],
    correct: 0,
    explain: 'Combine like terms: x² with x² gives 2 + 1 = 3x², and x with x gives 3 + 5 = 8x.',
  },
  {
    id: 'add-2',
    topic: 'Add Polynomials',
    prompt: 'Add:  (x² + 4x) + (3x² + x)',
    options: ['4x² + 5x', '4x² + 4x', '4x⁴ + 5x²', '3x² + 5x'],
    correct: 0,
    explain: 'x² + 3x² = 4x² and 4x + x = 5x. Add coefficients, keep each exponent.',
  },
  {
    id: 'add-3',
    topic: 'Add Polynomials',
    prompt: 'Add:  (4x² + 2x + 1) + (x² + 3x + 5)',
    options: ['5x² + 5x + 6', '5x² + 6x + 5', '4x² + 5x + 6', '5x² + 5x + 5'],
    correct: 0,
    explain: 'Group by family: 4x² + x² = 5x², 2x + 3x = 5x, and the constants 1 + 5 = 6.',
  },
  {
    id: 'add-4',
    topic: 'Add Polynomials',
    prompt: 'Add:  (3x³ + 2x²) + (x³ + 4x²)',
    options: ['4x³ + 6x²', '4x⁶ + 6x⁴', '4x⁵', '3x³ + 6x²'],
    correct: 0,
    explain: 'x³ only adds to x³ (3 + 1 = 4x³) and x² only to x² (2 + 4 = 6x²). Exponents never add.',
  },
  {
    id: 'add-5',
    topic: 'Add Polynomials',
    prompt: 'Add:  (2x² + 5x + 7) + (4x² − 2x + 1)',
    options: ['6x² + 3x + 8', '6x² + 7x + 8', '6x² + 3x + 6', '6x⁴ + 3x + 8'],
    correct: 0,
    explain: 'Watch the signs: 5x + (−2x) = 3x. Then 2x² + 4x² = 6x² and 7 + 1 = 8.',
  },
]

// Render a single monomial from a positive coefficient and a power.
function monomial(absCoef, pow) {
  if (pow === 0) return String(absCoef)
  const v = pow === 1 ? 'x' : 'x' + sup(pow)
  return absCoef === 1 ? v : absCoef + v
}

// Render a polynomial (terms sorted high power -> low) with proper +/− joins,
// dropping any zero-coefficient terms.
function polyText(terms) {
  const parts = terms.filter((t) => t.coef !== 0)
  if (parts.length === 0) return '0'
  return parts
    .map((t, i) => {
      const body = monomial(Math.abs(t.coef), t.pow)
      if (i === 0) return (t.coef < 0 ? '−' : '') + body
      return (t.coef < 0 ? ' − ' : ' + ') + body
    })
    .join('')
}

// One randomized "add these polynomials" question. Builds two polynomials over
// the same powers, sums coefficients term-by-term for the correct answer, then
// makes distractors from classic mistakes (off-by-one coefficient, multiplying
// instead of adding, adding the exponents).
export function generateLike() {
  const withConst = Math.random() < 0.5
  const a2 = rint(1, 5)
  const b2 = rint(1, 5)
  const a1 = rint(1, 6)
  const b1 = rint(1, 6)
  const a0 = withConst ? rint(1, 6) : 0
  const b0 = withConst ? rint(1, 6) : 0

  const p1 = [{ coef: a2, pow: 2 }, { coef: a1, pow: 1 }]
  const p2 = [{ coef: b2, pow: 2 }, { coef: b1, pow: 1 }]
  if (withConst) {
    p1.push({ coef: a0, pow: 0 })
    p2.push({ coef: b0, pow: 0 })
  }

  const sum = [{ coef: a2 + b2, pow: 2 }, { coef: a1 + b1, pow: 1 }]
  if (withConst) sum.push({ coef: a0 + b0, pow: 0 })

  const prompt = `Add:  (${polyText(p1)}) + (${polyText(p2)})`
  const correctStr = polyText(sum)

  const wrongs = [
    // adds the exponents of the leading like terms (x² + x² -> x⁴)
    [{ coef: a2 + b2, pow: 4 }, ...sum.slice(1)],
    // multiplies the leading coefficients instead of adding
    [{ coef: a2 * b2, pow: 2 }, ...sum.slice(1)],
    // miscounts the x family by one
    sum.map((t) => (t.pow === 1 ? { ...t, coef: t.coef + 1 } : t)),
    // miscounts the x² family by one the other way
    sum.map((t) => (t.pow === 2 ? { ...t, coef: t.coef - 1 } : t)),
  ]

  const seen = new Set([correctStr])
  const distractors = []
  for (const w of shuffle(wrongs)) {
    if (distractors.length >= 3) break
    const text = polyText(w)
    if (!seen.has(text)) {
      seen.add(text)
      distractors.push(text)
    }
  }
  // Safety net so we always reach 4 distinct options.
  let bump = 2
  while (distractors.length < 3) {
    const text = polyText(sum.map((t) => (t.pow === 1 ? { ...t, coef: t.coef + bump } : t)))
    bump += 1
    if (!seen.has(text)) {
      seen.add(text)
      distractors.push(text)
    }
  }

  const options = shuffle([correctStr, ...distractors])
  return {
    prompt,
    options,
    correct: options.indexOf(correctStr),
    explain: `Combine like terms: add the x² coefficients (${a2} + ${b2} = ${a2 + b2}) and the x coefficients (${a1} + ${b1} = ${a1 + b1})${withConst ? `, plus the constants (${a0} + ${b0} = ${a0 + b0})` : ''}. The exponents never change.`,
  }
}
