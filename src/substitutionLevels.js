// Five "solve the system by substitution" levels of increasing difficulty.
// Each is a pair of linear equations with a tidy integer solution. At least one
// equation is already solved for a variable (or trivially isolated) so that the
// substitution method is the natural path. Each level carries display strings
// for the two equations, the numeric solution, a one-line hint about which
// variable to isolate, and a fully worked step list for "Show me the steps".
export const SUBSTITUTION_LEVELS = [
  {
    id: 'sub-1',
    title: 'Plug in for y',
    eq1: 'y = 2x + 1',
    eq2: '3x + y = 11',
    sol: { x: 2, y: 5 },
    isolate:
      'Equation 1 already gives y by itself. Drop "2x + 1" in place of y in equation 2.',
    steps: [
      'Equation 1 is already solved for y:  y = 2x + 1',
      'Substitute (2x + 1) for y in equation 2:  3x + (2x + 1) = 11',
      'Combine like terms:  5x + 1 = 11',
      'Subtract 1 from both sides:  5x = 10, so x = 2',
      'Back-substitute into equation 1:  y = 2(2) + 1 = 5',
      'Solution:  (x, y) = (2, 5)',
    ],
  },
  {
    id: 'sub-2',
    title: 'A tidy swap',
    eq1: 'y = x − 1',
    eq2: 'x + y = 7',
    sol: { x: 4, y: 3 },
    isolate:
      'Equation 1 gives y by itself. Replace y with "x − 1" in equation 2.',
    steps: [
      'Equation 1 is already solved for y:  y = x − 1',
      'Substitute (x − 1) for y in equation 2:  x + (x − 1) = 7',
      'Combine like terms:  2x − 1 = 7',
      'Add 1 to both sides:  2x = 8, so x = 4',
      'Back-substitute into equation 1:  y = 4 − 1 = 3',
      'Solution:  (x, y) = (4, 3)',
    ],
  },
  {
    id: 'sub-3',
    title: 'Substitute for x',
    eq1: 'x = y + 2',
    eq2: '2x + 3y = 19',
    sol: { x: 5, y: 3 },
    isolate:
      'Equation 1 gives x by itself. Replace x with "y + 2" in equation 2, then solve for y first.',
    steps: [
      'Equation 1 is already solved for x:  x = y + 2',
      'Substitute (y + 2) for x in equation 2:  2(y + 2) + 3y = 19',
      'Distribute:  2y + 4 + 3y = 19',
      'Combine like terms:  5y + 4 = 19',
      'Subtract 4 from both sides:  5y = 15, so y = 3',
      'Back-substitute into equation 1:  x = 3 + 2 = 5',
      'Solution:  (x, y) = (5, 3)',
    ],
  },
  {
    id: 'sub-4',
    title: 'Distribute carefully',
    eq1: 'y = 3x − 2',
    eq2: '2x + y = 8',
    sol: { x: 2, y: 4 },
    isolate:
      'Equation 1 gives y by itself. Replace y with "3x − 2" in equation 2 and combine.',
    steps: [
      'Equation 1 is already solved for y:  y = 3x − 2',
      'Substitute (3x − 2) for y in equation 2:  2x + (3x − 2) = 8',
      'Combine like terms:  5x − 2 = 8',
      'Add 2 to both sides:  5x = 10, so x = 2',
      'Back-substitute into equation 1:  y = 3(2) − 2 = 4',
      'Solution:  (x, y) = (2, 4)',
    ],
  },
  {
    id: 'sub-5',
    title: 'Isolate, then substitute',
    eq1: 'x − y = 1',
    eq2: '2x + y = 8',
    sol: { x: 3, y: 2 },
    isolate:
      'Neither equation is solved yet. Isolate x in equation 1 (x = y + 1), then substitute into equation 2.',
    steps: [
      'Isolate x in equation 1:  x − y = 1  →  x = y + 1',
      'Substitute (y + 1) for x in equation 2:  2(y + 1) + y = 8',
      'Distribute:  2y + 2 + y = 8',
      'Combine like terms:  3y + 2 = 8',
      'Subtract 2 from both sides:  3y = 6, so y = 2',
      'Back-substitute:  x = 2 + 1 = 3',
      'Solution:  (x, y) = (3, 2)',
    ],
  },
]
