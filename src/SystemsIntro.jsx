import { useEffect, useState } from 'react'
import Owl from './Owl.jsx'
import './SystemsIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Match the coordinate-plane geometry used by src/components/Graph.jsx so the
// grid, lines, and the overlaid owl all line up exactly.
const SIZE = 340
const PAD = 28
const GR = 5
const scale = (SIZE - PAD * 2) / (2 * GR)
const sx = (x) => PAD + (x + GR) * scale
const sy = (y) => PAD + (GR - y) * scale
const px = (x) => `${(sx(x) / SIZE) * 100}%`
const py = (y) => `${(sy(y) / SIZE) * 100}%`

// The two equations of the system and where they cross.
//   line 1: y =  x + 1   (target tone)
//   line 2: y = -x + 5   (line2 tone)
// Both pass through the lattice point (2, 3) — the solution.
const CROSS = { x: 2, y: 3 }
const L1 = { from: { x: -5, y: -4 }, to: { x: 4, y: 5 } }
const L2 = { from: { x: 5, y: 0 }, to: { x: 0, y: 5 } }

const TICKS = []
for (let i = -GR; i <= GR; i++) TICKS.push(i)

const RUN_MS = 1450 // keep in sync with the owl left/top transition in the CSS

const PHASE_TEXT = [
  <>
    A <strong>system</strong> is two equations — two lines — at once. Its{' '}
    <strong>solution</strong> is the single point that lies on <em>both</em> lines: exactly where
    they <strong>cross</strong>.
  </>,
  <>
    In each puzzle you'll spot that crossing point and <strong>drop a pin</strong> right on it.
  </>,
]

// Animated concept intro for Systems of Equations. Bruh runs along the first
// line, then the second, and lands on the point where they intersect.
export default function SystemsIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [lines, setLines] = useState(0) // how many lines are drawn (0, 1, 2)
  const [owlAt, setOwlAt] = useState(L1.from)
  const [owlVisible, setOwlVisible] = useState(false)
  const [owlInstant, setOwlInstant] = useState(true)
  const [running, setRunning] = useState(false)
  const [lean, setLean] = useState(0)
  const [popPoint, setPopPoint] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [showNext, setShowNext] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (phase === 0) {
        await wait(400)
        if (cancelled) return

        // Draw the first line.
        setLines(1)
        await wait(950)
        if (cancelled) return

        // Drop Bruh onto the start of the first line (no slide-in).
        setOwlInstant(true)
        setOwlAt(L1.from)
        setLean(0)
        setOwlVisible(true)
        await wait(70)
        if (cancelled) return
        setOwlInstant(false)
        await wait(450)
        if (cancelled) return

        // Run up the first line to the crossing point.
        setRunning(true)
        setLean(7)
        setOwlAt(CROSS)
        await wait(RUN_MS)
        if (cancelled) return
        setRunning(false)
        setLean(0)
        await wait(350)
        if (cancelled) return

        // Draw the second line.
        setLines(2)
        await wait(950)
        if (cancelled) return

        // Jump Bruh to the foot of the second line.
        setOwlInstant(true)
        setOwlAt(L2.from)
        setLean(0)
        await wait(70)
        if (cancelled) return
        setOwlInstant(false)
        await wait(450)
        if (cancelled) return

        // Run up the second line, landing back on the crossing point.
        setRunning(true)
        setLean(-7)
        setOwlAt(CROSS)
        await wait(RUN_MS)
        if (cancelled) return
        setRunning(false)
        setLean(0)
        await wait(250)
        if (cancelled) return

        // Pop the intersection and reveal its coordinates.
        setPopPoint(true)
        setShowLabel(true)
        await wait(950)
        if (cancelled) return

        setShowNext(true)
      } else {
        // Phase 2: reinforce by dropping a pin on the intersection.
        await wait(500)
        if (cancelled) return
        setShowPin(true)
        await wait(950)
        if (cancelled) return
        setShowNext(true)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [phase])

  const isLast = phase === PHASE_TEXT.length - 1

  const handleNext = () => {
    if (isLast) {
      onDone()
      return
    }
    setShowNext(false)
    setPhase((p) => p + 1)
  }

  return (
    <div className="ointro sysintro">
      <div className="sysintro__plane">
        <svg
          className="graph sysintro__svg"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Two lines crossing on a coordinate plane"
        >
          {TICKS.map((t) => (
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

          {lines >= 1 && (
            <line
              className="graph__line graph__line--target sysintro__line"
              pathLength="1"
              x1={sx(L1.from.x)}
              y1={sy(L1.from.y)}
              x2={sx(L1.to.x)}
              y2={sy(L1.to.y)}
            />
          )}

          {lines >= 2 && (
            <line
              className="graph__line graph__line--line2 sysintro__line"
              pathLength="1"
              x1={sx(L2.from.x)}
              y1={sy(L2.from.y)}
              x2={sx(L2.to.x)}
              y2={sy(L2.to.y)}
            />
          )}
        </svg>

        {/* The crossing point — pulses once Bruh lands on it. */}
        {popPoint && (
          <span
            className={'sysintro__cross' + (popPoint ? ' sysintro__cross--pop' : '')}
            style={{ left: px(CROSS.x), top: py(CROSS.y) }}
            aria-hidden="true"
          />
        )}

        {/* Coordinate label for the solution. */}
        {showLabel && (
          <span
            className="sysintro__coord"
            style={{ left: px(CROSS.x), top: py(CROSS.y) }}
            aria-hidden="true"
          >
            ({CROSS.x}, {CROSS.y})
          </span>
        )}

        {/* A pin dropping onto the intersection (phase 2). */}
        {showPin && (
          <span
            className="sysintro__pin"
            style={{ left: px(CROSS.x), top: py(CROSS.y) }}
            aria-hidden="true"
          />
        )}

        {/* Bruh the owl, overlaid on the plane and running along each line. */}
        <span
          className={
            'sysintro__owl' +
            (owlVisible ? ' sysintro__owl--in' : '') +
            (owlInstant ? ' sysintro__owl--instant' : '')
          }
          style={{ left: px(owlAt.x), top: py(owlAt.y) }}
          aria-hidden="true"
        >
          <span className="sysintro__lean" style={{ transform: `rotate(${lean}deg)` }}>
            <span className={'sysintro__bob' + (running ? ' sysintro__bob--run' : '')}>
              <span className="sysintro__owlinner">
                <Owl />
              </span>
            </span>
          </span>
        </span>
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
