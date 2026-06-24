// "Evaluating Expressions" checkpoint puzzles.
//
// Each level is an expression made of terms joined by + / − operators, plus a
// map of variable values to substitute in. The student first taps each variable
// (e.g. the "x") to "pop" it and drop in the number it stands for, then works
// out the value of the now-numeric expression.
//
// A term is { coef, varname } where varname is 'x' / 'y' (a variable) or '' for
// a plain constant. `ops` holds the operators sitting between consecutive terms
// (length === terms.length - 1). `values` maps each variable to its number.
//
// First three levels are multiple choice; the last two are open-ended (the
// student types the answer).

export const EVALUATE_LEVELS = [
  {
    id: 1,
    mode: 'choice',
    title: 'Drop In the Value',
    values: { x: 5 },
    terms: [
      { coef: 1, varname: 'x' },
      { coef: 4, varname: '' },
    ],
    ops: ['+'],
    instruction:
      'Tap the x to swap in its value, then choose what the expression equals.',
  },
  {
    id: 2,
    mode: 'choice',
    title: 'Mind the Coefficient',
    values: { x: 4 },
    terms: [
      { coef: 2, varname: 'x' },
      { coef: 3, varname: '' },
    ],
    ops: ['+'],
    instruction:
      'The 2 in 2x means 2 times x. Tap the x, substitute, then pick the value.',
  },
  {
    id: 3,
    mode: 'choice',
    title: 'Now With Subtraction',
    values: { x: 6 },
    terms: [
      { coef: 3, varname: 'x' },
      { coef: 5, varname: '' },
    ],
    ops: ['-'],
    instruction:
      'Substitute the x, then evaluate 3x − 5 and choose the answer.',
  },
  {
    id: 4,
    mode: 'open',
    title: 'Two Variables',
    values: { x: 4, y: 2 },
    terms: [
      { coef: 2, varname: 'x' },
      { coef: 3, varname: 'y' },
    ],
    ops: ['+'],
    instruction:
      'Now there are two variables. Tap each one to substitute, then type the value.',
  },
  {
    id: 5,
    mode: 'open',
    title: 'Put It Together',
    values: { x: 6, y: 5 },
    terms: [
      { coef: 4, varname: 'x' },
      { coef: 2, varname: 'y' },
      { coef: 3, varname: '' },
    ],
    ops: ['-', '+'],
    instruction:
      'Substitute both variables, work left to right, and type the final value.',
  },
]
