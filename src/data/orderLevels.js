// Order-of-operations puzzles for the "Order of Operations" checkpoint.
//
// Each level is a single expression written as a flat list of tokens. The
// student repeatedly selects the next operation to evaluate (per PEMDAS); a
// correct submit collapses that part of the expression, e.g.
//   5 + (4 - 2) * 3   ->   5 + 2 * 3   ->   5 + 6   ->   11
//
// Tokens: numbers as numeric strings, operators as + - * / ^, and parens ( ).

export const ORDER_LEVELS = [
  {
    id: 1,
    mode: 'identify',
    title: 'One Step at a Time',
    instruction:
      'Follow PEMDAS: tap the numbers and operation to evaluate next, then Submit. Get it right and that part collapses.',
    expr: ['5', '+', '(', '4', '-', '2', ')', '*', '3'],
  },
  {
    id: 2,
    mode: 'identify',
    title: 'Now With an Exponent',
    instruction:
      'A tougher one. Work through it in PEMDAS order — parentheses, then the exponent, then ×, then + / −.',
    expr: ['2', '*', '(', '3', '+', '1', ')', '^', '2', '-', '5'],
  },
  {
    id: 3,
    mode: 'solve',
    difficulty: 'easy',
    title: 'Now You Try',
    instruction:
      'Now you try! Work it out on the whiteboard below, then type your final answer.',
  },
  {
    id: 4,
    mode: 'solve',
    difficulty: 'medium',
    title: 'Your Turn — Harder',
    instruction:
      'One more on your own, this time with an exponent. Use the whiteboard, then enter your answer.',
  },
  {
    id: 5,
    mode: 'solve',
    difficulty: 'medium',
    title: 'The Final Stretch',
    instruction:
      'Last one. Work through it in PEMDAS order on the whiteboard, then enter your final answer.',
  },
]
