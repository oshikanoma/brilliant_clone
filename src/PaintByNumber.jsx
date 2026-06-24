import { useMemo, useState } from 'react'
import { PALETTE, REGIONS, PUPILS } from './paintData.js'
import OwlSpeech from './OwlSpeech.jsx'

const hexFor = (n) => PALETTE.find((p) => p.n === n)?.hex ?? '#e8edf2'

// Readable text color for a paint swatch based on its brightness.
function textOn(hex) {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.62 ? '#1e293b' : '#ffffff'
}

// One paint-by-number piece.
function Region({ region, fill, onClick }) {
  const { shape } = region
  const props = {
    className: 'pbn__region',
    style: { fill },
    onClick,
  }
  if (shape.type === 'rect')
    return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} {...props} />
  if (shape.type === 'circle')
    return <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...props} />
  if (shape.type === 'ellipse')
    return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...props} />
  if (shape.type === 'polygon')
    return <polygon points={shape.points.map((p) => p.join(',')).join(' ')} {...props} />
  return null
}

// The small problem that labels each region — plain text with a soft white
// halo so it stays readable on any paint color, without a boxed border.
function Label({ x, y, text }) {
  return (
    <text className="pbn__plabel" x={x} y={y} dominantBaseline="central">
      {text}
    </text>
  )
}

export default function PaintByNumber({ onBack }) {
  const [selected, setSelected] = useState(1)
  const [fills, setFills] = useState({}) // regionId -> color number
  const [needColorHint, setNeedColorHint] = useState(false)

  const paintedCount = Object.values(fills).filter((v) => v != null).length
  const allFilled = REGIONS.every((r) => fills[r.id] != null)
  const allCorrect = useMemo(() => REGIONS.every((r) => fills[r.id] === r.color), [fills])
  const status = !allFilled ? 'painting' : allCorrect ? 'done' : 'wrong'

  const paint = (id) => {
    if (status === 'done') return
    if (selected == null) {
      setNeedColorHint(true)
      return
    }
    setNeedColorHint(false)
    setFills((prev) => ({ ...prev, [id]: prev[id] === selected ? null : selected }))
  }

  const reset = () => setFills({})

  let tone = 'neutral'
  let message
  if (status === 'done') {
    tone = 'ok'
    message = '🎉 You did it! Every piece colored and every answer correct. What a masterpiece!'
  } else if (status === 'wrong') {
    tone = 'bad'
    message =
      "It's all colored in, but something isn't quite right. Re-solve a few pieces and recheck your colors!"
  } else if (needColorHint) {
    message = 'Pick a paint number from the bottom first, then tap a piece to fill it.'
  } else if (paintedCount === 0) {
    message =
      "Let's paint this owl! Solve each piece, then color it with the matching paint number. You've got this!"
  } else if (paintedCount < REGIONS.length / 2) {
    message = 'Nice start — keep solving and filling. I believe in you!'
  } else {
    message = "Looking great! Almost there — finish the last few pieces."
  }

  return (
    <div className="app">
      <header className="app__header app__header--lesson">
        <button className="back-btn" onClick={onBack} aria-label="Back to path">
          ← Path
        </button>
        <h1>Test Your Skills</h1>
      </header>

      <div className="level-head">
        <h2>Paint the Forest Owl</h2>
        <p>
          Each piece holds a problem from your lessons. Solve it to get a number 1–6, then color the
          piece with the matching paint. Fill them all correctly to finish the picture.
        </p>
      </div>

      <main className="order">
        <OwlSpeech text={message} tone={tone} />

        <div className="pbn__canvas">
          <svg viewBox="0 0 300 340" role="img" aria-label="Paint-by-number owl in a forest">
            {REGIONS.map((r) => (
              <Region key={r.id} region={r} fill={hexFor(fills[r.id])} onClick={() => paint(r.id)} />
            ))}

            {/* fixed details: pupils + the owl's tiny glasses */}
            <g className="pbn__details" pointerEvents="none">
              {PUPILS.map((p, i) => (
                <g key={i}>
                  <circle cx={p.cx} cy={p.cy} r={p.r} className="pbn__pupil" />
                  <circle cx={p.cx - p.r * 0.34} cy={p.cy - p.r * 0.4} r={p.r * 0.28} className="pbn__glint" />
                </g>
              ))}
              <circle className="pbn__lens" cx={142} cy={168} r={7} />
              <circle className="pbn__lens" cx={158} cy={168} r={7} />
              <line className="pbn__bridge" x1={149} y1={168} x2={151} y2={168} />
              <line className="pbn__temple" x1={135} y1={166} x2={127} y2={163} />
              <line className="pbn__temple" x1={165} y1={166} x2={173} y2={163} />
            </g>

            {/* problem labels on top of everything */}
            {status !== 'done' &&
              REGIONS.map((r) => <Label key={`l-${r.id}`} x={r.lx} y={r.ly} text={r.problem} />)}
          </svg>
        </div>

        <div className="pbn__canisters" role="group" aria-label="Paint colors">
          {PALETTE.map((p) => (
            <button
              key={p.n}
              type="button"
              className={'canister' + (selected === p.n ? ' canister--sel' : '')}
              onClick={() => {
                setSelected(p.n)
                setNeedColorHint(false)
              }}
              aria-label={`Paint number ${p.n}, ${p.name}`}
            >
              <span
                className="canister__paint"
                style={{
                  background: p.hex,
                  color: textOn(p.hex),
                  textShadow: textOn(p.hex) === '#ffffff' ? '0 1px 2px rgba(0, 0, 0, 0.45)' : 'none',
                }}
              >
                {p.n}
              </span>
            </button>
          ))}
        </div>

        <div className="controls">
          {paintedCount > 0 && status !== 'done' && (
            <button className="btn btn--ghost" onClick={reset}>
              Clear
            </button>
          )}
          {status === 'done' && (
            <button className="btn" onClick={onBack}>
              Back to path →
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
