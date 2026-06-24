// Puzzle definitions. Each level is one screen of the lesson path.
//
// type 'balance'    -> make both sides equal. Some weights are locked in place;
//                      the student drags the rest to balance the scale.
// type 'substitute' -> an equation like x + 2 = 4 (or 2x + 5 = 15). The x blocks
//                      and the right side are locked. The student drags ONE number
//                      block onto the x's; it replaces ALL of them with that value,
//                      and they look for the value that balances the scale.
//                      `coefficient` (default 1) is how many x blocks get replaced.

export const LEVELS = [
  {
    id: 1,
    type: 'balance',
    title: 'Balance the Scale',
    instruction:
      'One side is fixed. Drag weights onto the other side until the scale is perfectly balanced.',
    // Locked weights that start on the scale.
    locked: { left: [{ id: 'L1', value: 7 }], right: [] },
    // Movable weights available in the tray.
    tray: [
      { id: 'b1', value: 5 },
      { id: 'b2', value: 4 },
      { id: 'b3', value: 3 },
      { id: 'b4', value: 2 },
      { id: 'b5', value: 1 },
      { id: 'b6', value: 1 },
    ],
  },
  {
    id: 2,
    type: 'substitute',
    title: 'Find x',
    instruction:
      'The equation x + 2 = 4 is already on the scale. The right side is locked. Drag a number block onto the left to substitute it for x — which value balances the scale?',
    addend: 2, // the locked "+ 2" shown next to x on the left
    constant: 4, // the locked number on the right
    // Number blocks the student substitutes in for x.
    tray: [
      { id: 'n1', value: 1 },
      { id: 'n2', value: 2 },
      { id: 'n3', value: 3 },
    ],
  },
  {
    id: 3,
    type: 'substitute',
    title: 'Find x Again',
    instruction:
      'Now solve x + 4 = 9 the same way. The right side is locked — drag a number block onto the left to substitute it for x. Which value balances the scale?',
    addend: 4,
    constant: 9,
    tray: [
      { id: 'm1', value: 3 },
      { id: 'm2', value: 5 },
      { id: 'm3', value: 7 },
    ],
  },
  {
    id: 4,
    type: 'substitute',
    title: 'Two x’s',
    instruction:
      'Two identical x blocks: 2x + 5 = 15. Drag one number block onto the x’s — it replaces ALL of them at once. Which value balances the scale?',
    coefficient: 2, // number of x blocks the dropped value replaces
    addend: 5, // the locked "+ 5" on the left
    constant: 15, // the locked number on the right
    tray: [
      { id: 'p1', value: 3 },
      { id: 'p2', value: 5 },
      { id: 'p3', value: 7 },
    ],
  },
  {
    id: 5,
    type: 'substitute',
    title: 'Four x’s',
    instruction:
      'Four x blocks this time: 4x + 3 = 35. Drag one number block onto the x’s to replace ALL four at once. Which value balances the scale?',
    coefficient: 4,
    addend: 3,
    constant: 35,
    tray: [
      { id: 'p1', value: 6 },
      { id: 'p2', value: 8 },
      { id: 'p3', value: 10 },
    ],
  },
]
