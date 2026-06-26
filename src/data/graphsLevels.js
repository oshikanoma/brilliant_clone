// Level data for the "Graphs and Linear Relationships" section.
//
// The section is split into separate checkpoints, each a focused set of levels:
//   • INTERCEPT_LEVELS — drop a pin where the line crosses the y-axis (x = 0).
//   • SLOPE_LEVELS     — read rise over run off the line and type the slope.
//   • GRAPH_LEVELS     — plot a line yourself by dropping two pins on it.
//
// Each level is { id, mode, m, b, title }. m may be fractional (e.g. 0.5) for
// the hardest graphing question; lessons check plotted pins against y = m x + b.

export const INTERCEPT_LEVELS = [
  { id: 1, mode: 'intercept', m: 1, b: 2, title: 'Find the Y-Intercept' },
  { id: 2, mode: 'intercept', m: -2, b: -3, title: 'A Negative Intercept' },
  { id: 3, mode: 'intercept', m: 2, b: 4, title: 'One More Intercept' },
]

export const SLOPE_LEVELS = [
  { id: 1, mode: 'slope', m: 2, b: -1, title: 'Measure the Slope' },
  { id: 2, mode: 'slope', m: -1, b: 2, title: 'A Falling Slope' },
  { id: 3, mode: 'slope', m: 3, b: 0, title: 'A Steeper Slope' },
]

export const GRAPH_LEVELS = [
  { id: 1, mode: 'graph', m: 1, b: 1, title: 'Graph a Line' },
  { id: 2, mode: 'graph', m: -2, b: 3, title: 'A Steeper, Falling Line' },
  { id: 3, mode: 'graph', m: 0.5, b: -1, title: 'A Fractional Slope' },
]
