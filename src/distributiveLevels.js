// "Distributive Property" checkpoint puzzles.
//
// Each level is an expression of the form  m(ax + b)  — a multiplier outside a
// set of parentheses holding two terms. The student builds an AREA MODEL: each
// time they tap the "multiplier" button they lay down one more copy (row) of
// the parenthesised group, made of tiles marked "x" or with the integer they
// stand for. After stacking all `multiplier` copies, the area shows the
// distributed result, and the student picks the simplified expression from
// four choices.
//
// A term is { coef, varname } where varname is 'x' or '' for a plain constant.
// `inside` is the list of terms inside the parentheses.

export const DISTRIBUTIVE_LEVELS = [
  {
    id: 1,
    title: 'Stack the Groups',
    multiplier: 2,
    inside: [
      { coef: 1, varname: 'x' },
      { coef: 3, varname: '' },
    ],
    instruction:
      'The 2 outside means two copies of (x + 3). Tap the multiplier to lay down each copy, then choose the simplified answer.',
  },
  {
    id: 2,
    title: 'Three Copies',
    multiplier: 3,
    inside: [
      { coef: 2, varname: 'x' },
      { coef: 1, varname: '' },
    ],
    instruction:
      'Build 3(2x + 1): press the multiplier until you have three rows, then pick the answer that matches the whole area.',
  },
  {
    id: 3,
    title: 'Bigger Coefficient',
    multiplier: 4,
    inside: [
      { coef: 1, varname: 'x' },
      { coef: 2, varname: '' },
    ],
    instruction:
      'Lay down four copies of (x + 2). Count the x-tiles and the unit tiles, then choose the simplified form.',
  },
  {
    id: 4,
    title: 'Both Terms Grow',
    multiplier: 2,
    inside: [
      { coef: 3, varname: 'x' },
      { coef: 4, varname: '' },
    ],
    instruction:
      'Two copies of (3x + 4). Every term inside gets multiplied — build the area and pick the right answer.',
  },
  {
    id: 5,
    title: 'Put It Together',
    multiplier: 5,
    inside: [
      { coef: 2, varname: 'x' },
      { coef: 3, varname: '' },
    ],
    instruction:
      'Last one: 5(2x + 3). Stack all five copies, then choose the fully distributed expression.',
  },
]
