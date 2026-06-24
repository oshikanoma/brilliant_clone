// Data for the "Test Your Skills" paint-by-number: an owl perched in a forest.
//
// Each region of the picture carries a tiny problem drawn from the skills the
// student practiced (order of operations, distributing, combining/evaluating,
// reading slope). Solving the problem gives a number 1–6, which matches one of
// the numbered paint canisters. Paint every region with the right number and
// the owl is correctly colored.

export const PALETTE = [
  { n: 1, name: 'Bark', hex: '#8a5d34' },
  { n: 2, name: 'Leaf', hex: '#5b9c46' },
  { n: 3, name: 'Night', hex: '#3a6ea5' },
  { n: 4, name: 'Beak', hex: '#f0a23b' },
  { n: 5, name: 'Moon', hex: '#f6d65b' },
  { n: 6, name: 'Snow', hex: '#ffffff' },
  { n: 7, name: 'Tan', hex: '#e9d9bb' },
]

// Regions are listed in draw order (background first). `color` is the correct
// canister number; `problem` is the skill question shown on the piece.
export const REGIONS = [
  // Backdrop
  { id: 'sky', color: 3, problem: '1+2', shape: { type: 'rect', x: 0, y: 0, w: 300, h: 340 }, lx: 44, ly: 30 },
  { id: 'ground', color: 2, problem: '6/3', shape: { type: 'rect', x: 0, y: 272, w: 300, h: 68 }, lx: 40, ly: 312 },
  { id: 'moon', color: 5, problem: '2+3', shape: { type: 'circle', cx: 252, cy: 46, r: 28 }, lx: 252, ly: 46 },
  // A bunch of yellow stars scattered across the night sky
  { id: 'star1', color: 5, problem: '1+4', shape: { type: 'circle', cx: 60, cy: 58, r: 13 }, lx: 60, ly: 58 },
  { id: 'star2', color: 5, problem: '10/2', shape: { type: 'circle', cx: 150, cy: 40, r: 13 }, lx: 150, ly: 40 },
  { id: 'star3', color: 5, problem: '8−3', shape: { type: 'circle', cx: 108, cy: 80, r: 12 }, lx: 108, ly: 80 },
  { id: 'star4', color: 5, problem: '5·1', shape: { type: 'circle', cx: 205, cy: 68, r: 13 }, lx: 205, ly: 68 },

  // Trees: trunk drawn first so the larger foliage sits in front of the bark
  { id: 'trunkL', color: 1, problem: '5−4', shape: { type: 'rect', x: 22, y: 160, w: 16, h: 120 }, lx: 30, ly: 256 },
  { id: 'leafL', color: 2, problem: '2(1)', shape: { type: 'circle', cx: 30, cy: 130, r: 50 }, lx: 36, ly: 118 },
  { id: 'trunkR', color: 1, problem: '4−3', shape: { type: 'rect', x: 262, y: 160, w: 16, h: 120 }, lx: 270, ly: 256 },
  { id: 'leafR', color: 2, problem: '1+1', shape: { type: 'circle', cx: 270, cy: 130, r: 50 }, lx: 264, ly: 118 },

  // Owl body
  { id: 'body', color: 1, problem: '8−7', shape: { type: 'ellipse', cx: 150, cy: 204, rx: 60, ry: 76 }, lx: 112, ly: 168 },

  // Ears sit low on the head, close together (drawn over the body as tufts)
  { id: 'earL', color: 1, problem: '6−5', shape: { type: 'polygon', points: [[124, 110], [143, 148], [105, 148]] }, lx: 123, ly: 124 },
  { id: 'earR', color: 1, problem: '7−6', shape: { type: 'polygon', points: [[176, 110], [195, 148], [157, 148]] }, lx: 177, ly: 124 },

  { id: 'wingL', color: 1, problem: '3−2', shape: { type: 'ellipse', cx: 96, cy: 214, rx: 16, ry: 40 }, lx: 96, ly: 214 },
  { id: 'wingR', color: 1, problem: '9−8', shape: { type: 'ellipse', cx: 204, cy: 214, rx: 16, ry: 40 }, lx: 204, ly: 214 },
  { id: 'belly', color: 7, problem: '3+4', shape: { type: 'ellipse', cx: 150, cy: 226, rx: 36, ry: 48 }, lx: 150, ly: 248 },
  { id: 'eyeL', color: 6, problem: '2·3', shape: { type: 'circle', cx: 126, cy: 154, r: 21 }, lx: 126, ly: 154 },
  { id: 'eyeR', color: 6, problem: '9−3', shape: { type: 'circle', cx: 174, cy: 154, r: 21 }, lx: 174, ly: 154 },
  // Beak points downward
  { id: 'beak', color: 4, problem: '2x, x=2', shape: { type: 'polygon', points: [[139, 176], [161, 176], [150, 190]] }, lx: 150, ly: 183 },
]

// Fixed (non-paintable) details drawn on top: pupils + the owl's tiny glasses.
export const PUPILS = [
  { cx: 126, cy: 154, r: 14 },
  { cx: 174, cy: 154, r: 14 },
]
