// "Graphs and Linear Relationships" checkpoint — the final lesson.
//
// Five questions, each teaching one piece of a line in y = mx + b form, one
// step at a time:
//   1. intercept — drop a pin where the line crosses the y-axis (x = 0).
//   2. slope     — read rise over run off the line and type the slope.
//   3–5. graph   — plot increasingly harder lines yourself by dropping two pins
//                  the line passes through.
//
// Each level is { mode, m, b }. m may be fractional (e.g. 0.5) for the hardest
// graphing question; the lesson checks plotted pins against y = m x + b exactly.

export const GRAPHS_LEVELS = [
  { id: 1, mode: 'intercept', m: 1, b: 2, title: 'Find the Y-Intercept' },
  { id: 2, mode: 'slope', m: 2, b: -1, title: 'Measure the Slope' },
  { id: 3, mode: 'graph', m: 1, b: 1, title: 'Graph a Line' },
  { id: 4, mode: 'graph', m: -2, b: 3, title: 'A Steeper, Falling Line' },
  { id: 5, mode: 'graph', m: 0.5, b: -1, title: 'A Fractional Slope' },
]
