// A small interactive coordinate plane used by the "Graphs and Linear
// Relationships" lesson. It can draw a target line, let the student drop pins on
// lattice points, highlight a rise/run slope triangle, and draw the line through
// the student's pins.

export const GR = 5 // grid runs from -GR..GR on both axes
const SIZE = 340
const PAD = 28
const span = SIZE - PAD * 2
const scale = span / (2 * GR)

const sx = (x) => PAD + (x + GR) * scale
const sy = (y) => PAD + (GR - y) * scale

// Where the line y = m x + b crosses the edges of the visible box, so we can
// draw it spanning the whole plane.
function lineBoxPoints(m, b) {
  const within = (v) => v >= -GR - 1e-9 && v <= GR + 1e-9
  const pts = []
  for (const x of [-GR, GR]) {
    const y = m * x + b
    if (within(y)) pts.push({ x, y })
  }
  if (m !== 0) {
    for (const y of [-GR, GR]) {
      const x = (y - b) / m
      if (within(x)) pts.push({ x, y })
    }
  }
  const uniq = []
  for (const p of pts) {
    if (!uniq.some((q) => Math.abs(q.x - p.x) < 1e-6 && Math.abs(q.y - p.y) < 1e-6)) uniq.push(p)
  }
  return uniq.slice(0, 2)
}

export default function Graph({
  m = 1,
  b = 0,
  showLine = false,
  lineTone = 'target', // 'target' | 'ok'
  pins = [],
  onPlace,
  riseRun = null, // { run, rise, fromX, fromY }
  userLine = false,
}) {
  const ticks = []
  for (let i = -GR; i <= GR; i++) ticks.push(i)

  const handleClick = (e) => {
    if (!onPlace) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * SIZE
    const py = ((e.clientY - rect.top) / rect.height) * SIZE
    const x = Math.round((px - PAD) / scale - GR)
    const y = Math.round(GR - (py - PAD) / scale)
    if (x < -GR || x > GR || y < -GR || y > GR) return
    onPlace({ x, y })
  }

  const target = showLine ? lineBoxPoints(m, b) : null

  // Line through the two student pins (extended across the box).
  let userPts = null
  if (userLine && pins.length === 2 && pins[0].x !== pins[1].x) {
    const um = (pins[1].y - pins[0].y) / (pins[1].x - pins[0].x)
    const ub = pins[0].y - um * pins[0].x
    userPts = lineBoxPoints(um, ub)
  }

  return (
    <svg
      className={'graph' + (onPlace ? ' graph--clickable' : '')}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      onClick={handleClick}
      role="img"
      aria-label="Coordinate plane"
    >
      {/* grid lines */}
      {ticks.map((t) => (
        <g key={`g${t}`}>
          <line className="graph__grid" x1={sx(t)} y1={sy(-GR)} x2={sx(t)} y2={sy(GR)} />
          <line className="graph__grid" x1={sx(-GR)} y1={sy(t)} x2={sx(GR)} y2={sy(t)} />
        </g>
      ))}

      {/* axes */}
      <line className="graph__axis" x1={sx(-GR)} y1={sy(0)} x2={sx(GR)} y2={sy(0)} />
      <line className="graph__axis" x1={sx(0)} y1={sy(-GR)} x2={sx(0)} y2={sy(GR)} />

      {/* axis number labels (just a few to stay readable) */}
      {[-4, -2, 2, 4].map((t) => (
        <g key={`lbl${t}`}>
          <text className="graph__tick" x={sx(t)} y={sy(0) + 14}>
            {t}
          </text>
          <text className="graph__tick" x={sx(0) - 12} y={sy(t) + 4}>
            {t}
          </text>
        </g>
      ))}

      {/* rise / run slope triangle */}
      {riseRun && (
        <g>
          <line
            className="graph__run"
            x1={sx(riseRun.fromX)}
            y1={sy(riseRun.fromY)}
            x2={sx(riseRun.fromX + riseRun.run)}
            y2={sy(riseRun.fromY)}
          />
          <line
            className="graph__rise"
            x1={sx(riseRun.fromX + riseRun.run)}
            y1={sy(riseRun.fromY)}
            x2={sx(riseRun.fromX + riseRun.run)}
            y2={sy(riseRun.fromY + riseRun.rise)}
          />
          <text
            className="graph__runlabel"
            x={sx(riseRun.fromX + riseRun.run / 2)}
            y={sy(riseRun.fromY) + 18}
          >
            run {riseRun.run}
          </text>
          <text
            className="graph__riselabel"
            x={sx(riseRun.fromX + riseRun.run) + 8}
            y={sy(riseRun.fromY + riseRun.rise / 2)}
          >
            rise {riseRun.rise}
          </text>
        </g>
      )}

      {/* target line */}
      {target && target.length === 2 && (
        <line
          className={'graph__line ' + (lineTone === 'ok' ? 'graph__line--ok' : 'graph__line--target')}
          x1={sx(target[0].x)}
          y1={sy(target[0].y)}
          x2={sx(target[1].x)}
          y2={sy(target[1].y)}
        />
      )}

      {/* line through the student's pins */}
      {userPts && userPts.length === 2 && (
        <line
          className="graph__line graph__line--user"
          x1={sx(userPts[0].x)}
          y1={sy(userPts[0].y)}
          x2={sx(userPts[1].x)}
          y2={sy(userPts[1].y)}
        />
      )}

      {/* dropped pins */}
      {pins.map((p, i) => (
        <g key={i} className="graph__pin">
          <circle cx={sx(p.x)} cy={sy(p.y)} r={7} />
          <circle cx={sx(p.x)} cy={sy(p.y)} r={2.5} className="graph__pindot" />
        </g>
      ))}
    </svg>
  )
}
