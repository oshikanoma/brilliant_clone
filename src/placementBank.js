// Curated question bank for the adaptive placement test. There is one entry per
// *skill* checkpoint on the path (the review and final-exam checkpoints are not
// probed directly — they're auto-completed when the surrounding skills are).
//
// The keys are the flat CHECKPOINTS indices from LessonPath. The adaptive engine
// (AI, with a binary-search fallback) decides which checkpoint to probe next;
// the UI then pulls a question for that checkpoint from here. Every question is
// hand-written so the math and the `correct` index are guaranteed right — the AI
// only chooses *which* checkpoint to ask about, never the answers. Options are
// shuffled at render time by shuffleChoices, so `correct: 0` is fine here.

export const PLACEMENT_QUESTIONS = {
  // ---- Algebra Foundations ----
  0: [
    {
      id: 'p-solve',
      prompt: 'Solve for x:  5x − 3 = 12',
      options: ['x = 3', 'x = 9', 'x = 15', 'x = 1.8'],
      correct: 0,
      explain: 'Add 3: 5x = 15, then divide by 5: x = 3.',
    },
  ],
  1: [
    {
      id: 'p-order',
      prompt: 'Simplify:  4 + 6 ÷ 2 × 3',
      options: ['13', '15', '21', '9'],
      correct: 0,
      explain: 'Left-to-right for ÷ and ×: 6 ÷ 2 = 3, 3 × 3 = 9, then 4 + 9 = 13.',
    },
  ],
  2: [
    {
      id: 'p-liketerms',
      prompt: 'Combine like terms:  7y − 2 + 3y',
      options: ['10y − 2', '10y', '4y − 2', '10y + 2'],
      correct: 0,
      explain: '7y + 3y = 10y; the −2 has no like term, so 10y − 2.',
    },
  ],
  3: [
    {
      id: 'p-distribute',
      prompt: 'Expand:  4(2x − 3)',
      options: ['8x − 12', '8x − 3', '6x − 12', '8x + 12'],
      correct: 0,
      explain: '4·2x = 8x and 4·(−3) = −12, so 8x − 12.',
    },
  ],
  4: [
    {
      id: 'p-evaluate',
      prompt: 'If x = 5, evaluate  3x − 7',
      options: ['8', '22', '15', '2'],
      correct: 0,
      explain: '3 × 5 − 7 = 15 − 7 = 8.',
    },
  ],

  // ---- Graphs and Linear Relationships ----
  6: [
    {
      id: 'p-yint',
      prompt: 'What is the y-intercept of  y = 2x − 6 ?',
      options: ['(0, −6)', '(0, 2)', '(−6, 0)', '(0, 6)'],
      correct: 0,
      explain: 'At x = 0, y = −6, so the y-intercept is (0, −6).',
    },
  ],
  7: [
    {
      id: 'p-slope',
      prompt: 'What is the slope of  y = (3/4)x + 2 ?',
      options: ['3/4', '2', '4/3', '−3/4'],
      correct: 0,
      explain: 'In y = mx + b, the slope is the coefficient of x — here 3/4.',
    },
  ],
  8: [
    {
      id: 'p-graphing',
      prompt: 'Which point lies on the line  y = x − 2 ?',
      options: ['(5, 3)', '(2, 2)', '(0, 2)', '(3, 5)'],
      correct: 0,
      explain: 'Plug in x = 5: y = 5 − 2 = 3, so (5, 3) is on the line.',
    },
  ],
  9: [
    {
      id: 'p-sys-graph',
      prompt: 'Two lines are graphed and cross at (2, 5). What is the solution to that system?',
      options: ['x = 2, y = 5', 'x = 5, y = 2', 'No solution', '(0, 0)'],
      correct: 0,
      explain: 'The solution of a system is the intersection point: x = 2, y = 5.',
    },
  ],
  10: [
    {
      id: 'p-sys-elim',
      prompt: 'Add the equations  x + y = 7  and  x − y = 1.  What is x?',
      options: ['x = 4', 'x = 3', 'x = 7', 'x = 8'],
      correct: 0,
      explain: 'Adding cancels y: 2x = 8, so x = 4.',
    },
  ],
  11: [
    {
      id: 'p-sys-sub',
      prompt: 'If  y = 2x  and  x + y = 9,  what is x?',
      options: ['x = 3', 'x = 9', 'x = 4.5', 'x = 6'],
      correct: 0,
      explain: 'Substitute: x + 2x = 9 → 3x = 9 → x = 3.',
    },
  ],

  // ---- Expressions with Exponents ----
  13: [
    {
      id: 'p-multpow',
      prompt: 'Simplify:  a⁵ · a²',
      options: ['a⁷', 'a¹⁰', 'a³', '2a⁷'],
      correct: 0,
      explain: 'Multiplying like bases adds exponents: 5 + 2 = 7.',
    },
  ],
  14: [
    {
      id: 'p-powpow',
      prompt: 'Simplify:  (b³)⁴',
      options: ['b¹²', 'b⁷', 'b⁸¹', 'b'],
      correct: 0,
      explain: 'A power of a power multiplies exponents: 3 × 4 = 12.',
    },
  ],
  15: [
    {
      id: 'p-divpow',
      prompt: 'Simplify:  m⁹ ÷ m⁴',
      options: ['m⁵', 'm¹³', 'm³', 'm³⁶'],
      correct: 0,
      explain: 'Dividing like bases subtracts exponents: 9 − 4 = 5.',
    },
  ],
  16: [
    {
      id: 'p-prodpow',
      prompt: 'Simplify:  (2x)³',
      options: ['8x³', '6x³', '2x³', '8x'],
      correct: 0,
      explain: 'Raise each factor: 2³ · x³ = 8x³.',
    },
  ],
  17: [
    {
      id: 'p-zeroneg',
      prompt: 'Simplify:  x⁻²',
      options: ['1/x²', '−x²', 'x²', '−2x'],
      correct: 0,
      explain: 'A negative exponent means the reciprocal: x⁻² = 1/x².',
    },
  ],

  // ---- Quadratics and Polynomials ----
  19: [
    {
      id: 'p-addpoly',
      prompt: 'Add:  (2x² + 3x) + (x² − x)',
      options: ['3x² + 2x', '3x² + 4x', '2x² + 2x', '3x² − 2x'],
      correct: 0,
      explain: 'Combine like terms: 2x² + x² = 3x² and 3x − x = 2x.',
    },
  ],
  20: [
    {
      id: 'p-subpoly',
      prompt: 'Subtract:  (5x² − 2x) − (2x² + 3x)',
      options: ['3x² − 5x', '3x² + x', '7x² + x', '3x² − 2x'],
      correct: 0,
      explain: 'Distribute the minus: 5x² − 2x − 2x² − 3x = 3x² − 5x.',
    },
  ],
  21: [
    {
      id: 'p-multpoly',
      prompt: 'Expand:  (x + 2)(x − 3)',
      options: ['x² − x − 6', 'x² + x − 6', 'x² − 6', 'x² − 5x − 6'],
      correct: 0,
      explain: 'FOIL: x² − 3x + 2x − 6 = x² − x − 6.',
    },
  ],
  22: [
    {
      id: 'p-factor',
      prompt: 'Factor:  x² + 5x + 6',
      options: ['(x + 2)(x + 3)', '(x + 1)(x + 6)', '(x − 2)(x − 3)', '(x + 5)(x + 1)'],
      correct: 0,
      explain: 'Two numbers multiplying to 6 and adding to 5: 2 and 3.',
    },
  ],
  23: [
    {
      id: 'p-diffsq',
      prompt: 'Factor:  x² − 25',
      options: ['(x + 5)(x − 5)', '(x − 5)²', '(x + 5)²', '(x + 25)(x − 1)'],
      correct: 0,
      explain: 'Difference of squares: a² − b² = (a + b)(a − b).',
    },
  ],
  24: [
    {
      id: 'p-perfsq',
      prompt: 'Expand:  (x − 4)²',
      options: ['x² − 8x + 16', 'x² + 16', 'x² − 16', 'x² − 8x − 16'],
      correct: 0,
      explain: '(x − 4)² = x² − 2·4·x + 4² = x² − 8x + 16.',
    },
  ],
}

// Ordered curriculum metadata sent to the adaptive engine. Each entry maps a
// probeable skill checkpoint to its topic + section. Indices match the flat
// CHECKPOINTS list in LessonPath. (Reviews at 5/12/18/25 and the Final Exam at
// 26 are intentionally omitted.)
export const CURRICULUM = [
  { checkpointIndex: 0, topic: 'Solving Equations', section: 'Algebra Foundations' },
  { checkpointIndex: 1, topic: 'Order of Operations', section: 'Algebra Foundations' },
  { checkpointIndex: 2, topic: 'Combining Like Terms', section: 'Algebra Foundations' },
  { checkpointIndex: 3, topic: 'Distributive Property', section: 'Algebra Foundations' },
  { checkpointIndex: 4, topic: 'Evaluating Expressions', section: 'Algebra Foundations' },
  { checkpointIndex: 6, topic: 'Y-Intercept', section: 'Graphs and Linear Relationships' },
  { checkpointIndex: 7, topic: 'Slope', section: 'Graphs and Linear Relationships' },
  { checkpointIndex: 8, topic: 'Graphing', section: 'Graphs and Linear Relationships' },
  { checkpointIndex: 9, topic: 'Systems (Graphing)', section: 'Graphs and Linear Relationships' },
  { checkpointIndex: 10, topic: 'Systems (Elimination)', section: 'Graphs and Linear Relationships' },
  { checkpointIndex: 11, topic: 'Systems (Substitution)', section: 'Graphs and Linear Relationships' },
  { checkpointIndex: 13, topic: 'Multiply Powers', section: 'Expressions with Exponents' },
  { checkpointIndex: 14, topic: 'Powers of Powers', section: 'Expressions with Exponents' },
  { checkpointIndex: 15, topic: 'Divide Powers', section: 'Expressions with Exponents' },
  { checkpointIndex: 16, topic: 'Powers of Products & Quotients', section: 'Expressions with Exponents' },
  { checkpointIndex: 17, topic: 'Zero & Negative Exponents', section: 'Expressions with Exponents' },
  { checkpointIndex: 19, topic: 'Add Polynomials', section: 'Quadratics and Polynomials' },
  { checkpointIndex: 20, topic: 'Subtract Polynomials', section: 'Quadratics and Polynomials' },
  { checkpointIndex: 21, topic: 'Multiply Polynomials', section: 'Quadratics and Polynomials' },
  { checkpointIndex: 22, topic: 'Factoring Polynomials', section: 'Quadratics and Polynomials' },
  { checkpointIndex: 23, topic: 'Difference of Squares', section: 'Quadratics and Polynomials' },
  { checkpointIndex: 24, topic: 'Perfect Squares', section: 'Quadratics and Polynomials' },
]

// Pull the first not-yet-used question for a checkpoint (the engine generally
// probes each checkpoint at most once, but this guards against repeats).
export function pickQuestion(checkpointIndex, usedIds = new Set()) {
  const arr = PLACEMENT_QUESTIONS[checkpointIndex] || []
  return arr.find((q) => !usedIds.has(q.id)) || arr[0] || null
}

// Section-gated placement plan. The test walks these sections IN ORDER and asks
// the `probes` (an easy + a harder checkpoint) for each. You only advance to the
// next section if you got BOTH probes right; the moment a section isn't fully
// cleared, that's where you're placed — so you can never "jump ahead" off a
// single lucky answer, and you always (re)start at the beginning of the first
// section you weren't solid on.
//
// `startCheckpoint` is the flat CHECKPOINTS index where the section begins; the
// checkpoint just before it (a Review for later sections) is the last thing
// marked complete when you place into that section.
export const PLACEMENT_SECTIONS = [
  { name: 'Algebra Foundations', startCheckpoint: 0, probes: [0, 3] },
  { name: 'Graphs and Linear Relationships', startCheckpoint: 6, probes: [6, 9] },
  { name: 'Expressions with Exponents', startCheckpoint: 13, probes: [13, 16] },
  { name: 'Quadratics and Polynomials', startCheckpoint: 19, probes: [19, 22] },
]
