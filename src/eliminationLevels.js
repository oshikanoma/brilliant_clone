// Levels for the "Systems (Elimination)" checkpoint. Each level is a system of
// two linear equations written in standard form:
//
//   a1·x + b1·y = c1
//   a2·x + b2·y = c2
//
// Every system has a single, tidy INTEGER solution and integer coefficients
// chosen so the variables eliminate cleanly. Difficulty ramps up from "just add
// the two equations" to "scale one equation first" to "scale both equations".
export const ELIMINATION_LEVELS = [
  {
    id: 'elim-add',
    title: 'Add to Eliminate',
    // x + y = 5 ; x − y = 1  → add the equations, y cancels.
    a1: 1, b1: 1, c1: 5,
    a2: 1, b2: -1, c2: 1,
    sol: { x: 3, y: 2 },
  },
  {
    id: 'elim-subtract',
    title: 'Subtract to Eliminate',
    // 3x + 2y = 16 ; x + 2y = 8  → subtract the equations, y cancels.
    a1: 3, b1: 2, c1: 16,
    a2: 1, b2: 2, c2: 8,
    sol: { x: 4, y: 2 },
  },
  {
    id: 'elim-scale-one',
    title: 'Scale One Equation',
    // x + 3y = 9 ; 2x − y = 4  → ×2 the first equation, then subtract, x cancels.
    a1: 1, b1: 3, c1: 9,
    a2: 2, b2: -1, c2: 4,
    sol: { x: 3, y: 2 },
  },
  {
    id: 'elim-scale-bigger',
    title: 'Line Up the Coefficients',
    // 3x + 4y = 10 ; 2x + y = 5  → ×4 the second equation, then subtract, y cancels.
    a1: 3, b1: 4, c1: 10,
    a2: 2, b2: 1, c2: 5,
    sol: { x: 2, y: 1 },
  },
  {
    id: 'elim-scale-both',
    title: 'Scale Both Equations',
    // 3x + 2y = 4 ; 2x + 5y = −1  → ×5 and ×2, then subtract, y cancels.
    a1: 3, b1: 2, c1: 4,
    a2: 2, b2: 5, c2: -1,
    sol: { x: 2, y: -1 },
  },
]
