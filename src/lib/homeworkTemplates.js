// Code-verified problem generators for Bruh's Homework Help.
//
// The AI tutor only *classifies* a student's question into one of these template
// families (and writes the encouraging voice text). The actual practice problems,
// their options, and the correct answer are generated HERE, in code — so the
// answer key is always computed deterministically and is guaranteed correct,
// exactly like the placement test's vetted bank. The model never authors an
// answer key.
//
// Each template exposes gen(rng, level) -> { prompt, options, correct, explain,
// steps }. `steps` powers the animated walkthrough; the MCQ fields power practice.

// --- tiny deterministic RNG so a given seed reproduces the same set ----------
export function rng(seed = Date.now()) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

const ri = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1))
const nz = (r, lo, hi) => {
  let v = 0
  while (v === 0) v = ri(r, lo, hi)
  return v
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)]

// --- formatting helpers ------------------------------------------------------
const termX = (a, v = 'x') => (a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`)

// "ax + b" (handles 1/-1/0 coefficients and signs)
function lin(a, b, v = 'x') {
  if (a === 0) return `${b}`
  let s = termX(a, v)
  if (b > 0) s += ` + ${b}`
  else if (b < 0) s += ` - ${-b}`
  return s
}

// "a x^2 + b x + c"
function quad(a, b, c) {
  if (a === 0) return lin(b, c)
  let s = a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${a}x^2`
  if (b !== 0) s += (b > 0 ? ' + ' : ' - ') + (Math.abs(b) === 1 ? 'x' : `${Math.abs(b)}x`)
  if (c !== 0) s += (c > 0 ? ' + ' : ' - ') + `${Math.abs(c)}`
  return s
}

const fac = (p) => (p >= 0 ? `(x + ${p})` : `(x - ${-p})`)
const addSub = (n) => (n >= 0 ? `+ ${n}` : `- ${-n}`)

// Build a 4-option MCQ: the (correct) answer plus 3 distinct plausible wrongs.
function mkOptions(correct, candidates) {
  const seen = new Set([correct])
  const distractors = []
  for (const c of candidates) {
    const s = String(c)
    if (!seen.has(s)) {
      seen.add(s)
      distractors.push(s)
    }
    if (distractors.length === 3) break
  }
  // Safety pad (rare): nudge so we always present 4 options.
  let k = 2
  while (distractors.length < 3) {
    const s = `${correct}${' '.repeat(k)}`
    if (!seen.has(s)) {
      seen.add(s)
      distractors.push(s)
    }
    k++
  }
  return { options: [correct, ...distractors], correct: 0 }
}

// --- template family generators ---------------------------------------------
// Each returns { prompt, options, correct, explain, steps }.

function twoStep(r, level) {
  const a = ri(r, 2, 4 + level)
  const x = nz(r, -5 - level, 6 + level)
  const b = nz(r, -9, 9)
  const c = a * x + b
  const eq = `${termX(a)} ${addSub(b)} = ${c}`
  const ans = `x = ${x}`
  return {
    prompt: `Solve for x:  ${eq}`,
    ...mkOptions(ans, [`x = ${x + 1}`, `x = ${x - 1}`, `x = ${c - b}`, `x = ${x + 2}`, `x = ${-x}`]),
    explain: `${b >= 0 ? `Subtract ${b}` : `Add ${-b}`} from both sides to get ${termX(a)} = ${c - b}, then divide by ${a}: x = ${x}.`,
    steps: [
      `Start with ${eq}.`,
      `${b >= 0 ? `Subtract ${b} from` : `Add ${-b} to`} both sides:  ${termX(a)} = ${c - b}.`,
      `Divide both sides by ${a}:  x = ${x}.`,
    ],
  }
}

function oneStep(r) {
  if (r() < 0.5) {
    const x = nz(r, -8, 9)
    const b = nz(r, -9, 9)
    const c = x + b
    const eq = `x ${addSub(b)} = ${c}`
    const ans = `x = ${x}`
    return {
      prompt: `Solve for x:  ${eq}`,
      ...mkOptions(ans, [`x = ${c + b}`, `x = ${c}`, `x = ${-x}`, `x = ${x + 1}`]),
      explain: `${b >= 0 ? `Subtract ${b}` : `Add ${-b}`} from both sides: x = ${x}.`,
      steps: [`Start with ${eq}.`, `${b >= 0 ? `Subtract ${b} from` : `Add ${-b} to`} both sides:  x = ${x}.`],
    }
  }
  const a = ri(r, 2, 9)
  const x = nz(r, -7, 8)
  const c = a * x
  const eq = `${termX(a)} = ${c}`
  const ans = `x = ${x}`
  return {
    prompt: `Solve for x:  ${eq}`,
    ...mkOptions(ans, [`x = ${c}`, `x = ${c - a}`, `x = ${-x}`, `x = ${x + 1}`]),
    explain: `Divide both sides by ${a}: x = ${x}.`,
    steps: [`Start with ${eq}.`, `Divide both sides by ${a}:  x = ${x}.`],
  }
}

function combineLike(r, level) {
  const a = nz(r, 1, 6)
  const c = nz(r, 1, 6)
  const b = nz(r, -8, 8)
  const d = nz(r, -8, 8)
  const full = `${termX(a)} ${addSub(b)} + ${termX(c)} ${addSub(d)}`
  const ans = lin(a + c, b + d)
  return {
    prompt: `Combine like terms:  ${full}`,
    ...mkOptions(ans, [lin(a + c, b), lin(a, b + d), lin(a * c, b + d), lin(a + c, b - d), `${a + c + b + d}x`]),
    explain: `Add the x-terms: ${a}x + ${c}x = ${a + c}x. Add the constants: ${b} ${addSub(d)} = ${b + d}. So ${ans}.`,
    steps: [
      `Start with ${full}.`,
      `Add the x-terms:  ${a}x + ${c}x = ${a + c}x.`,
      `Add the constants:  ${b} ${addSub(d)} = ${b + d}.`,
      `Result:  ${ans}.`,
    ],
  }
}

function distribute(r, level) {
  const a = ri(r, 2, 5 + level)
  const b = nz(r, 1, 6)
  const c = nz(r, -7, 7)
  const ans = lin(a * b, a * c)
  return {
    prompt: `Expand:  ${a}(${lin(b, c)})`,
    ...mkOptions(ans, [lin(a * b, c), lin(b, a * c), `${lin(a * b, 0)} ${addSub(a)} ${addSub(c)}`, lin(a * b + a * c, 0)]),
    explain: `Multiply ${a} by each term: ${a}·${b}x = ${a * b}x and ${a}·(${c}) = ${a * c}. So ${ans}.`,
    steps: [
      `Start with ${a}(${lin(b, c)}).`,
      `Multiply ${a} by ${termX(b)}:  ${a * b}x.`,
      `Multiply ${a} by ${c}:  ${a * c}.`,
      `Put it together:  ${ans}.`,
    ],
  }
}

function evaluate(r, level) {
  const a = nz(r, 2, 6)
  const b = nz(r, -9, 9)
  const n = nz(r, -6 - level, 7 + level)
  const val = a * n + b
  const ans = `${val}`
  return {
    prompt: `If x = ${n}, evaluate  ${lin(a, b)}`,
    ...mkOptions(ans, [`${a * n - b}`, `${(a + n) + b}`, `${a * (n + b)}`, `${val + 1}`, `${val - 1}`]),
    explain: `Substitute x = ${n}: ${a}·(${n}) ${addSub(b)} = ${a * n} ${addSub(b)} = ${val}.`,
    steps: [
      `Start with ${lin(a, b)} and x = ${n}.`,
      `Replace x:  ${a}(${n}) ${addSub(b)}.`,
      `Multiply:  ${a * n} ${addSub(b)}.`,
      `Add:  ${val}.`,
    ],
  }
}

function multiplyPowers(r, level) {
  const base = pick(r, ['x', 'a', 'm', 'y'])
  const i = ri(r, 2, 6 + level)
  const j = ri(r, 2, 6 + level)
  const ans = `${base}^${i + j}`
  return {
    prompt: `Simplify:  ${base}^${i} * ${base}^${j}`,
    ...mkOptions(ans, [`${base}^${i * j}`, `${base}^${Math.abs(i - j)}`, `2${base}^${i + j}`, `${base}^${i + j + 1}`]),
    explain: `Same base, so add the exponents: ${i} + ${j} = ${i + j}. So ${ans}.`,
    steps: [
      `Start with ${base}^${i} * ${base}^${j}.`,
      `Multiplying like bases adds exponents:  ${i} + ${j}.`,
      `Result:  ${ans}.`,
    ],
  }
}

function powerOfPower(r, level) {
  const base = pick(r, ['x', 'a', 'b', 'n'])
  const i = ri(r, 2, 5 + level)
  const j = ri(r, 2, 4 + level)
  const ans = `${base}^${i * j}`
  return {
    prompt: `Simplify:  (${base}^${i})^${j}`,
    ...mkOptions(ans, [`${base}^${i + j}`, `${base}^${i ** j}`, `${base}^${Math.abs(i - j)}`, `${j}${base}^${i}`]),
    explain: `A power of a power multiplies the exponents: ${i} × ${j} = ${i * j}. So ${ans}.`,
    steps: [`Start with (${base}^${i})^${j}.`, `Multiply the exponents:  ${i} × ${j}.`, `Result:  ${ans}.`],
  }
}

function dividePowers(r, level) {
  const base = pick(r, ['x', 'a', 'm', 'k'])
  const j = ri(r, 2, 5 + level)
  const i = j + ri(r, 1, 5 + level)
  const ans = `${base}^${i - j}`
  return {
    prompt: `Simplify:  ${base}^${i} / ${base}^${j}`,
    ...mkOptions(ans, [`${base}^${i + j}`, `${base}^${Math.round(i / j)}`, `${base}^${i * j}`, `${base}^${i - j + 1}`]),
    explain: `Same base, so subtract the exponents: ${i} − ${j} = ${i - j}. So ${ans}.`,
    steps: [
      `Start with ${base}^${i} / ${base}^${j}.`,
      `Dividing like bases subtracts exponents:  ${i} − ${j}.`,
      `Result:  ${ans}.`,
    ],
  }
}

function powerOfProduct(r, level) {
  const k = ri(r, 2, 5)
  const n = ri(r, 2, 3)
  const coef = k ** n
  const ans = `${coef}x^${n}`
  return {
    prompt: `Simplify:  (${k}x)^${n}`,
    ...mkOptions(ans, [`${k * n}x^${n}`, `${coef}x`, `${k}x^${n}`, `${coef}x^${n + 1}`]),
    explain: `Raise each factor to the ${n}: ${k}^${n} = ${coef} and x^${n}. So ${ans}.`,
    steps: [`Start with (${k}x)^${n}.`, `Apply the power to each factor:  ${k}^${n} · x^${n}.`, `Result:  ${ans}.`],
  }
}

function negativeExponent(r, level) {
  const base = pick(r, ['x', 'a', 'm'])
  const e = ri(r, 2, 4 + level)
  const ans = `1/${base}^${e}`
  return {
    prompt: `Write with a positive exponent:  ${base}^-${e}`,
    ...mkOptions(ans, [`-${base}^${e}`, `${base}^${e}`, `-${e}${base}`, `1/${base}^${e + 1}`]),
    explain: `A negative exponent means the reciprocal: ${base}^-${e} = 1/${base}^${e}.`,
    steps: [`Start with ${base}^-${e}.`, `A negative exponent flips it into a reciprocal.`, `Result:  ${ans}.`],
  }
}

function addPolynomials(r, level) {
  const a = nz(r, 1, 4)
  const c = nz(r, 1, 4)
  const b = nz(r, -6, 6)
  const d = nz(r, -6, 6)
  const e = nz(r, -8, 8)
  const f = nz(r, -8, 8)
  const ans = quad(a + c, b + d, e + f)
  return {
    prompt: `Add:  (${quad(a, b, e)}) + (${quad(c, d, f)})`,
    ...mkOptions(ans, [quad(a + c, b - d, e + f), quad(a * c, b + d, e + f), quad(a + c, b + d, e - f), quad(a + c, b + d, e + f + 1)]),
    explain: `Combine like terms: ${a + c}x^2, ${b + d}x, and ${e + f}. So ${ans}.`,
    steps: [
      `Start with (${quad(a, b, e)}) + (${quad(c, d, f)}).`,
      `Add the x^2 terms:  ${a + c}x^2.`,
      `Add the x terms:  ${b + d}x.   Add the constants:  ${e + f}.`,
      `Result:  ${ans}.`,
    ],
  }
}

function subtractPolynomials(r, level) {
  const a = ri(r, 3, 6)
  const c = ri(r, 1, a - 1)
  const b = nz(r, -6, 6)
  const d = nz(r, -6, 6)
  const e = nz(r, -8, 8)
  const f = nz(r, -8, 8)
  const ans = quad(a - c, b - d, e - f)
  return {
    prompt: `Subtract:  (${quad(a, b, e)}) − (${quad(c, d, f)})`,
    // Classic mistake: forgetting to distribute the minus to every term.
    ...mkOptions(ans, [quad(a - c, b + d, e + f), quad(a + c, b + d, e + f), quad(a - c, b - d, e + f), quad(a - c, b - d, e - f + 1)]),
    explain: `Distribute the minus: subtract every term. ${a - c}x^2, ${b - d}x, ${e - f}. So ${ans}.`,
    steps: [
      `Start with (${quad(a, b, e)}) − (${quad(c, d, f)}).`,
      `Distribute the minus sign to EVERY term in the second group.`,
      `Combine:  ${a - c}x^2, ${b - d}x, ${e - f}.`,
      `Result:  ${ans}.`,
    ],
  }
}

function multiplyBinomials(r, level) {
  const p = nz(r, -6, 6)
  const q = nz(r, -6, 6)
  const ans = quad(1, p + q, p * q)
  return {
    prompt: `Expand:  ${fac(p)}${fac(q)}`,
    ...mkOptions(ans, [quad(1, 0, p * q), quad(1, p + q, p + q), quad(1, p * q, p + q), quad(1, p + q, p * q + 1)]),
    explain: `FOIL: x·x = x^2, the outer+inner give ${p + q}x, and ${p}·${q} = ${p * q}. So ${ans}.`,
    steps: [
      `Start with ${fac(p)}${fac(q)}.`,
      `First & Outer & Inner & Last (FOIL).`,
      `Middle term:  ${p} + ${q} = ${p + q}, so ${p + q}x.   Last:  ${p}·${q} = ${p * q}.`,
      `Result:  ${ans}.`,
    ],
  }
}

function factorTrinomial(r, level) {
  const p = nz(r, -6, 6)
  const q = nz(r, -6, 6)
  const b = p + q
  const c = p * q
  const ans = `${fac(p)}${fac(q)}`
  return {
    prompt: `Factor:  ${quad(1, b, c)}`,
    ...mkOptions(ans, [`${fac(-p)}${fac(-q)}`, `${fac(p + 1)}${fac(q - 1)}`, `${fac(p)}${fac(q + 1)}`, `${fac(c)}${fac(1)}`]),
    explain: `Find two numbers that multiply to ${c} and add to ${b}: ${p} and ${q}. So ${ans}.`,
    steps: [
      `Start with ${quad(1, b, c)}.`,
      `Look for two numbers that multiply to ${c} and add to ${b}.`,
      `Those numbers are ${p} and ${q}.`,
      `Result:  ${ans}.`,
    ],
  }
}

function differenceOfSquares(r, level) {
  const k = ri(r, 2, 9 + level)
  const sq = k * k
  const ans = `(x + ${k})(x - ${k})`
  return {
    prompt: `Factor:  x^2 - ${sq}`,
    ...mkOptions(ans, [`(x - ${k})^2`, `(x + ${k})^2`, `(x + ${k})(x + ${k})`, `(x + ${sq})(x - 1)`]),
    explain: `${sq} = ${k}^2, and a^2 − b^2 = (a + b)(a − b). So ${ans}.`,
    steps: [
      `Start with x^2 - ${sq}.`,
      `Notice ${sq} = ${k}^2, so this is a difference of squares.`,
      `Use a^2 − b^2 = (a + b)(a − b).`,
      `Result:  ${ans}.`,
    ],
  }
}

function perfectSquare(r, level) {
  const a = nz(r, -7, 7)
  const ans = quad(1, 2 * a, a * a)
  return {
    prompt: `Expand:  (x ${addSub(a)})^2`,
    ...mkOptions(ans, [quad(1, 0, a * a), quad(1, 2 * a, -a * a), quad(1, a, a * a), quad(1, 2 * a, a * a + 1)]),
    explain: `(x ${addSub(a)})^2 = x^2 + 2·(${a})·x + (${a})^2 = ${ans}.`,
    steps: [
      `Start with (x ${addSub(a)})^2.`,
      `Square the first term:  x^2.   Double the product:  2·${a}·x = ${2 * a}x.`,
      `Square the last term:  ${a}^2 = ${a * a}.`,
      `Result:  ${ans}.`,
    ],
  }
}

function slopeIntercept(r) {
  const m = nz(r, -5, 5)
  const b = nz(r, -8, 8)
  const eq = `y = ${lin(m, b)}`
  if (r() < 0.5) {
    const ans = `${m}`
    return {
      prompt: `What is the slope of  ${eq} ?`,
      ...mkOptions(ans, [`${b}`, `${-m}`, `${m + 1}`, `${m - 1}`]),
      explain: `In y = mx + b, the slope is the coefficient of x — here ${m}.`,
      steps: [`Start with ${eq}.`, `It's in y = mx + b form; m is the slope.`, `Slope = ${m}.`],
    }
  }
  const ans = `(0, ${b})`
  return {
    prompt: `What is the y-intercept of  ${eq} ?`,
    ...mkOptions(ans, [`(0, ${m})`, `(${b}, 0)`, `(0, ${-b})`, `(${m}, ${b})`]),
    explain: `The y-intercept is b in y = mx + b: at x = 0, y = ${b}, so (0, ${b}).`,
    steps: [`Start with ${eq}.`, `The y-intercept is b — the value when x = 0.`, `y-intercept = (0, ${b}).`],
  }
}

// Registry. `blurb` helps the model pick the right family.
const TEMPLATE_LIST = [
  { id: 'two_step_equation', label: 'Solving two-step equations', blurb: 'solve ax + b = c for x', gen: twoStep },
  { id: 'one_step_equation', label: 'Solving one-step equations', blurb: 'solve x + b = c or ax = c', gen: oneStep },
  { id: 'combine_like_terms', label: 'Combining like terms', blurb: 'simplify ax + b + cx + d', gen: combineLike },
  { id: 'distribute', label: 'The distributive property', blurb: 'expand a(bx + c)', gen: distribute },
  { id: 'evaluate', label: 'Evaluating expressions', blurb: 'plug a value in for x', gen: evaluate },
  { id: 'multiply_powers', label: 'Multiplying powers', blurb: 'x^a * x^b (add exponents)', gen: multiplyPowers },
  { id: 'power_of_power', label: 'Power of a power', blurb: '(x^a)^b (multiply exponents)', gen: powerOfPower },
  { id: 'divide_powers', label: 'Dividing powers', blurb: 'x^a / x^b (subtract exponents)', gen: dividePowers },
  { id: 'power_of_product', label: 'Power of a product', blurb: '(kx)^n', gen: powerOfProduct },
  { id: 'negative_exponent', label: 'Negative & zero exponents', blurb: 'x^-a = 1/x^a', gen: negativeExponent },
  { id: 'add_polynomials', label: 'Adding polynomials', blurb: 'add two polynomials', gen: addPolynomials },
  { id: 'subtract_polynomials', label: 'Subtracting polynomials', blurb: 'subtract polynomials (distribute the minus)', gen: subtractPolynomials },
  { id: 'multiply_binomials', label: 'Multiplying binomials (FOIL)', blurb: '(x + a)(x + b)', gen: multiplyBinomials },
  { id: 'factor_trinomial', label: 'Factoring trinomials', blurb: 'factor x^2 + bx + c', gen: factorTrinomial },
  { id: 'difference_of_squares', label: 'Difference of squares', blurb: 'factor x^2 - k^2', gen: differenceOfSquares },
  { id: 'perfect_square', label: 'Perfect square binomials', blurb: 'expand (x + a)^2', gen: perfectSquare },
  { id: 'slope_intercept', label: 'Slope & y-intercept', blurb: 'read m and b from y = mx + b', gen: slopeIntercept },
]

const TEMPLATE_MAP = Object.fromEntries(TEMPLATE_LIST.map((t) => [t.id, t]))

export const TEMPLATE_IDS = TEMPLATE_LIST.map((t) => t.id)

// Compact catalog string for the model's system prompt.
export const TEMPLATE_CATALOG = TEMPLATE_LIST.map((t) => `- ${t.id}: ${t.label} (${t.blurb})`).join('\n')

export function isTemplate(id) {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_MAP, id)
}

// Generate verified content for a template: a worked example (walkthrough) plus
// `count` practice problems of increasing difficulty. Returns null for unknown ids.
export function generateProblemSet(templateId, { seed, count = 3 } = {}) {
  const t = TEMPLATE_MAP[templateId]
  if (!t) return null
  const r = rng(seed)
  const example = t.gen(r, 0)
  const problems = []
  for (let i = 0; i < count; i++) {
    const p = t.gen(r, i)
    problems.push({ prompt: p.prompt, options: p.options, correct: p.correct, explain: p.explain })
  }
  return { label: t.label, walkthrough: example.steps, problems }
}
