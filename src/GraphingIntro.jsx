import { useEffect, useState } from 'react'
import Owl from './Owl.jsx'
import './GraphingIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Coordinate-plane geometry, kept in lock-step with src/components/Graph.jsx so
// the animated grid matches the app's real graphs.
const GR = 5
const SIZE = 340
const PAD = 28
const span = SIZE - PAD * 2
const scale = span / (2 * GR)

const sx = (x) => PAD + (x + GR) * scale
const sy = (y) => PAD + (GR - y) * scale
// Owl overlay lives in a square box, so grid points map to % of the stage.
const px = (x) => (sx(x) / SIZE) * 100
const py = (y) => (sy(y) / SIZE) * 100

// Where the line y = m x + b meets the edges of the visible box.
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

// Two worked examples: start at the intercept, step by the slope, draw the line.
const PHASES = [
  {
    m: 1,
    b: 1,
    eq: ['y = ', 'x', ' + ', '1'],
    intercept: { x: 0, y: 1 },
    run: 2,
    rise: 2,
    second: { x: 2, y: 3 },
  },
  {
    m: 2,
    b: -1,
    eq: ['y = ', '2x', ' − ', '1'],
    intercept: { x: 0, y: -1 },
    run: 1,
    rise: 2,
    second: { x: 1, y: 1 },
  },
]

const PHASE_TEXT = [
  <>
    To graph a line, start at the <strong>y-intercept</strong> — the spot where the
    line crosses the vertical axis. Then use the <strong>slope</strong> to step to a
    second point: over by the run, up by the rise. Connect the two and you have your
    line.
  </>,
  <>
    Same recipe every time: drop a pin on the <strong>intercept</strong> first, let
    the <strong>slope</strong> step you to another point, then draw the line straight
    through both.
  </>,
]

export default function GraphingIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [pins, setPins] = useState([])
  const [showStep, setShowStep] = useState(false)
  const [showRiseRun, setShowRiseRun] = useState(false)
  const [lineIn, setLineIn] = useState(false)
  const [hotPart, setHotPart] = useState(null) // 'int' | 'slope' | null
  const [owl, setOwl] = useState({ x: 0, y: 0, state: 'idle' })
  const [showNext, setShowNext] = useState(false)

  const cfg = PHASES[phase]
  const isLast = phase === PHASES.length - 1
  const ends = lineBoxPoints(cfg.m, cfg.b)

  useEffect(() => {
    let cancelled = false
    // Reset the stage for this phase.
    setPins([])
    setShowStep(false)
    setShowRiseRun(false)
    setLineIn(false)
    setHotPart(null)
    setShowNext(false)
    setOwl({ x: cfg.intercept.x, y: GR + 1, state: 'idle' })

    async function run() {
      await wait(500)
      if (cancelled) return

      // 1) Hop to the y-intercept and drop the first pin.
      setHotPart('int')
      setOwl({ x: cfg.intercept.x, y: cfg.intercept.y, state: 'hop' })
      await wait(620)
      if (cancelled) return
      setPins([cfg.intercept])
      await wait(820)
      if (cancelled) return

      // 2) Use the slope: step over (run), then up (rise).
      setHotPart('slope')
      setShowStep(true)
      setShowRiseRun(true)
      await wait(520)
      if (cancelled) return
      setOwl({ x: cfg.intercept.x + cfg.run, y: cfg.intercept.y, state: 'hop' })
      await wait(680)
      if (cancelled) return
      setOwl({ x: cfg.second.x, y: cfg.second.y, state: 'hop' })
      await wait(700)
      if (cancelled) return
      setPins([cfg.intercept, cfg.second])
      await wait(720)
      if (cancelled) return

      // 3) Draw the line through both pins.
      setShowRiseRun(false)
      setShowStep(false)
      setHotPart(null)
      setLineIn(true)
      await wait(950)
      if (cancelled) return

      // 4) Bruh runs the length of the finished line.
      setOwl({ x: ends[0].x, y: ends[0].y, state: 'run' })
      await wait(420)
      if (cancelled) return
      setOwl({ x: ends[1].x, y: ends[1].y, state: 'run' })
      await wait(1250)
      if (cancelled) return
      setOwl((o) => ({ ...o, state: 'idle' }))

      if (!cancelled) setShowNext(true)
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const handleNext = () => {
    if (isLast) {
      onDone()
      return
    }
    setShowNext(false)
    setPhase((p) => p + 1)
  }

  const ticks = []
  for (let i = -GR; i <= GR; i++) ticks.push(i)

  const lineLen =
    ends.length === 2
      ? Math.hypot(sx(ends[1].x) - sx(ends[0].x), sy(ends[1].y) - sy(ends[0].y))
      : 0

  return (
    <div className="ointro">
      <div className="ointro__board" style={{ flexDirection: 'column' }}>
        <div className="gintro__eq" aria-label="line equation">
          {cfg.eq.map((part, i) => {
            const cls =
              'gintro__eqpart' +
              (i === 1 ? ' gintro__eqpart--slope' + (hotPart === 'slope' ? ' is-hot' : '') : '') +
              (i === 3 ? ' gintro__eqpart--int' + (hotPart === 'int' ? ' is-hot' : '') : '')
            return (
              <span key={i} className={cls}>
                {part}
              </span>
            )
          })}
        </div>

        <div className="gintro__stage">
          <svg className="graph" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Coordinate plane">
            {ticks.map((t) => (
              <g key={`g${t}`}>
                <line className="graph__grid" x1={sx(t)} y1={sy(-GR)} x2={sx(t)} y2={sy(GR)} />
                <line className="graph__grid" x1={sx(-GR)} y1={sy(t)} x2={sx(GR)} y2={sy(t)} />
              </g>
            ))}

            <line className="graph__axis" x1={sx(-GR)} y1={sy(0)} x2={sx(GR)} y2={sy(0)} />
            <line className="graph__axis" x1={sx(0)} y1={sy(-GR)} x2={sx(0)} y2={sy(GR)} />

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

            {/* dashed guide of the slope step (run then rise) */}
            <polyline
              className={'gintro__step' + (showStep ? ' is-on' : '')}
              points={`${sx(cfg.intercept.x)},${sy(cfg.intercept.y)} ${sx(
                cfg.intercept.x + cfg.run,
              )},${sy(cfg.intercept.y)} ${sx(cfg.second.x)},${sy(cfg.second.y)}`}
            />

            {/* rise / run slope triangle */}
            {showRiseRun && (
              <g>
                <line
                  className="graph__run"
                  x1={sx(cfg.intercept.x)}
                  y1={sy(cfg.intercept.y)}
                  x2={sx(cfg.intercept.x + cfg.run)}
                  y2={sy(cfg.intercept.y)}
                />
                <line
                  className="graph__rise"
                  x1={sx(cfg.intercept.x + cfg.run)}
                  y1={sy(cfg.intercept.y)}
                  x2={sx(cfg.intercept.x + cfg.run)}
                  y2={sy(cfg.intercept.y + cfg.rise)}
                />
                <text
                  className="graph__runlabel"
                  x={sx(cfg.intercept.x + cfg.run / 2)}
                  y={sy(cfg.intercept.y) + 18}
                >
                  run {cfg.run}
                </text>
                <text
                  className="graph__riselabel"
                  x={sx(cfg.intercept.x + cfg.run) + 8}
                  y={sy(cfg.intercept.y + cfg.rise / 2)}
                >
                  rise {cfg.rise}
                </text>
              </g>
            )}

            {/* the line, drawn through both pins */}
            {ends.length === 2 && (
              <line
                className={'graph__line graph__line--target gintro__line' + (lineIn ? ' gintro__line--in' : '')}
                style={{ '--len': lineLen }}
                x1={sx(ends[0].x)}
                y1={sy(ends[0].y)}
                x2={sx(ends[1].x)}
                y2={sy(ends[1].y)}
              />
            )}

            {/* dropped pins */}
            {pins.map((p, i) => (
              <g key={`${phase}-${p.x}-${p.y}-${i}`} className="graph__pin gintro__pin">
                <circle cx={sx(p.x)} cy={sy(p.y)} r={7} />
                <circle cx={sx(p.x)} cy={sy(p.y)} r={2.5} className="graph__pindot" />
              </g>
            ))}
          </svg>

          <div className="gintro__owllayer" aria-hidden="true">
            <div
              className={`gintro__owl gintro__owl--${owl.state}`}
              style={{ left: `${px(owl.x)}%`, top: `${py(owl.y)}%` }}
            >
              <div className="gintro__owlinner">
                <Owl />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p key={phase} className="bintro__text ointro__text">
        {PHASE_TEXT[phase]}
      </p>

      {showNext && (
        <button className="btn bintro__btn" onClick={handleNext}>
          {isLast ? 'Start →' : 'Next →'}
        </button>
      )}
    </div>
  )
}
