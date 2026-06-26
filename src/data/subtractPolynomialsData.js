// Multiple-choice content for the "Subtract Polynomials" checkpoint. Subtracting
// means DISTRIBUTING the minus sign to every term in the second polynomial
// (flipping each sign), then combining like terms. The classic mistake is
// flipping only the first sign. Consumed by ConceptLesson (LEVELS + generateLike).

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
    id: 'sub-1',
    topic: 'Negative Result',
    prompt: 'Subtract:  (5x² + 2x) − (2x² + 4x)',
    options: ['3x² − 2x', '3x² + 6x', '7x² + 6x', '3x² + 2x'],
    correct: 0,
    explain: 'Distribute the minus: 5x² + 2x − 2x² − 4x. Then 5x² − 2x² = 3x² and 2x − 4x = −2x.',
  },
  {
    id: 'sub-2',
    topic: 'Two Binomials',
    prompt: 'Subtract:  (7x² + 6x) − (3x² + x)',
    options: ['4x² + 5x', '4x² + 7x', '10x² + 5x', '4x² + 6x'],
    correct: 0,
    explain: 'Flip both signs: 7x² + 6x − 3x² − x. Combine: 7x² − 3x² = 4x², 6x − x = 5x.',
  },
  {
    id: 'sub-3',
    topic: 'Minus a Negative',
    prompt: 'Subtract:  (6x² + 3x) − (2x² − 5x)',
    options: ['4x² + 8x', '4x² − 2x', '4x² + 8x²', '8x² − 2x'],
    correct: 0,
    explain: 'Minus a negative flips to plus: 6x² + 3x − 2x² + 5x. So 4x² and 3x + 5x = 8x.',
  },
  {
    id: 'sub-4',
    topic: 'With Constants',
    prompt: 'Subtract:  (4x² + 5x + 9) − (x² + 2x + 3)',
    options: ['3x² + 3x + 6', '3x² + 7x + 12', '3x² + 3x + 12', '5x² + 3x + 6'],
    correct: 0,
    explain: 'Flip every term in the second group: 4x² − x², 5x − 2x, 9 − 3 → 3x² + 3x + 6.',
  },
  {
    id: 'sub-5',
    topic: 'Cubic Terms',
    prompt: 'Subtract:  (3x³ + 5x²) − (x³ + 8x²)',
    options: ['2x³ − 3x²', '2x³ + 13x²', '2x⁶ − 3x⁴', '4x³ − 3x²'],
    correct: 0,
    explain: 'Subtract within each family: 3x³ − x³ = 2x³ and 5x² − 8x² = −3x². Exponents stay put.',
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

// One randomized "subtract these polynomials" question. The first polynomial is
// built large enough that the differences stay clean. The correct answer
// distributes the minus (flips every second-poly sign) then combines like terms.
// Distractors model the headline mistakes: flipping only the first sign, adding
// instead of subtracting, and adding the exponents.
export function generateLike() {
  const withConst = Math.random() < 0.5
  // Keep the first polynomial bigger so x² stays positive; x term may go negative.
  const b2 = rint(1, 4)
  const b1 = rint(1, 5)
  const b0 = withConst ? rint(1, 5) : 0
  const a2 = b2 + rint(1, 4)
  const a1 = rint(1, 6)
  const a0 = withConst ? b0 + rint(0, 4) : 0

  const p1 = [{ coef: a2, pow: 2 }, { coef: a1, pow: 1 }]
  const p2 = [{ coef: b2, pow: 2 }, { coef: b1, pow: 1 }]
  if (withConst) {
    p1.push({ coef: a0, pow: 0 })
    p2.push({ coef: b0, pow: 0 })
  }

  // Correct: subtract term by term (distribute the minus to every term).
  const diff = [{ coef: a2 - b2, pow: 2 }, { coef: a1 - b1, pow: 1 }]
  if (withConst) diff.push({ coef: a0 - b0, pow: 0 })

  const prompt = `Subtract:  (${polyText(p1)}) − (${polyText(p2)})`
  const correctStr = polyText(diff)

  // Mistake 1: only flip the FIRST sign — subtract x², but ADD the rest.
  const onlyFirst = [{ coef: a2 - b2, pow: 2 }, { coef: a1 + b1, pow: 1 }]
  if (withConst) onlyFirst.push({ coef: a0 + b0, pow: 0 })

  // Mistake 2: don't distribute at all — add both polynomials.
  const added = [{ coef: a2 + b2, pow: 2 }, { coef: a1 + b1, pow: 1 }]
  if (withConst) added.push({ coef: a0 + b0, pow: 0 })

  const wrongs = [
    onlyFirst,
    added,
    // adds the exponents of the leading terms (x² − x² -> x⁴)
    [{ coef: a2 - b2, pow: 4 }, ...diff.slice(1)],
    // miscounts the x family by one
    diff.map((t) => (t.pow === 1 ? { ...t, coef: t.coef + 1 } : t)),
  ]

  const seen = new Set([correctStr])
  const distractors = []
  for (const w of wrongs) {
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
    const text = polyText(diff.map((t) => (t.pow === 2 ? { ...t, coef: t.coef + bump } : t)))
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
    explain: `Distribute the minus to flip every sign: ${polyText(p1)} − ${monomial(b2, 2)} − ${monomial(b1, 1)}${withConst ? ` − ${b0}` : ''}. Then combine like terms: ${a2} − ${b2} = ${a2 - b2}x² and ${a1} − ${b1} = ${a1 - b1}x${withConst ? `, and ${a0} − ${b0} = ${a0 - b0}` : ''}.`,
  }
}
