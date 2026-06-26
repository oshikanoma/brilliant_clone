// "Combining Like Terms" checkpoint puzzles.
//
// A term is { coef, varname } where varname is a variable like 'x' / 'y' / 'z'
// or '' for a plain constant. An expression is just a list of terms joined by
// '+'. Two terms are "like" when they share the same varname, so they can be
// added into one.
//
// First three levels use the rope mechanic (mode: 'identify'): the student
// connects two terms; if they're alike the pair collapses into one and the
// expression shortens. The last two are generated for the student to solve on
// their own (mode: 'solve') with a whiteboard and multiple-choice answers,
// since there's no single numeric answer.

export const LIKE_TERMS_LEVELS = [
  {
    id: 1,
    mode: 'identify',
    title: 'Rope the Matches',
    instruction:
      'Like terms share the same variable. Click the dot above one term, drag the rope to a matching term, then Submit to combine them.',
    spec: [
      { coef: 3, varname: 'x' },
      { coef: 5, varname: '' },
      { coef: 2, varname: 'x' },
      { coef: 2, varname: '' },
    ],
  },
  {
    id: 2,
    mode: 'identify',
    title: 'Two Variables',
    instruction:
      'Now there are x and y terms. Only terms with the same variable can be combined — connect the matching pairs.',
    spec: [
      { coef: 4, varname: 'x' },
      { coef: 3, varname: 'y' },
      { coef: 2, varname: 'x' },
      { coef: 2, varname: 'y' },
    ],
  },
  {
    id: 3,
    mode: 'identify',
    title: 'A Bigger Mix',
    instruction:
      'Three groups hide in here: x terms, y terms, and constants. Rope each matching pair until nothing else can combine.',
    spec: [
      { coef: 2, varname: 'x' },
      { coef: 4, varname: '' },
      { coef: 3, varname: 'y' },
      { coef: 1, varname: 'x' },
      { coef: 1, varname: 'y' },
      { coef: 2, varname: '' },
    ],
  },
  {
    id: 4,
    mode: 'solve',
    difficulty: 'easy',
    title: 'Now You Try',
    instruction:
      'Combine the like terms yourself. Use the whiteboard to work it out, then pick the simplified form.',
  },
  {
    id: 5,
    mode: 'solve',
    difficulty: 'medium',
    title: 'Your Turn — Harder',
    instruction:
      'One more, with an extra group. Work it out on the whiteboard, then choose the fully simplified expression.',
  },
]
