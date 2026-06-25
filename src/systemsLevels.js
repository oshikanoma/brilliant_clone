// Levels for the "Systems (Graphing)" checkpoint. A system is two lines; its
// solution is the single point where they cross — the (x, y) that satisfies both
// equations at once. Intersections are chosen to land on integer lattice points
// inside the visible grid (−5..5), and the lines pass through plenty of integer
// lattice points so the student can drop valid pins on them.
//
// mode:
//   'pin'   — both lines are drawn; the student pins the intersection.
//   'graph' — nothing is pre-drawn; the student graphs each line (two pins per
//             line) and then pins the intersection, in three stages.

export const SYSTEMS_LEVELS = [
  { id: 1, title: 'Where Lines Cross', mode: 'pin', m1: 1, b1: 1, m2: -1, b2: 3, sol: { x: 1, y: 2 } },
  { id: 2, title: 'Two Rising Lines', mode: 'pin', m1: 2, b1: -1, m2: 1, b2: 1, sol: { x: 2, y: 3 } },
  { id: 3, title: 'Graph It Yourself', mode: 'graph', m1: 1, b1: -1, m2: -1, b2: 5, sol: { x: 3, y: 2 } },
  { id: 4, title: 'Draw the Whole System', mode: 'graph', m1: 2, b1: -3, m2: -1, b2: 3, sol: { x: 2, y: 1 } },
]
