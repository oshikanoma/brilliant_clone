import { useEffect, useState } from 'react'
import Graph, { GR } from './components/Graph.jsx'
import Owl from './Owl.jsx'
import './YInterceptIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Mirror the coordinate math in components/Graph.jsx so the owl overlay lines up
// exactly with the SVG grid/line it floats above.
const SIZE = 340
const PAD = 28
const span = SIZE - PAD * 2
const scale = span / (2 * GR)
const sx = (x) => PAD + (x + GR) * scale
const sy = (y) => PAD + (GR - y) * scale
// Convert grid coords to a percentage of the (square) board, since the SVG
// scales uniformly to fill its container.
const px = (x) => `${(sx(x) / SIZE) * 100}%`
const py = (y) => `${(sy(y) / SIZE) * 100}%`
// Screen-space angle of the run direction (y grows downward in SVG space).
const angleDeg = (a, b) =>
  (Math.atan2(sy(b.y) - sy(a.y), sx(b.x) - sx(a.x)) * 180) / Math.PI

// Two lines, each crossing the y-axis at a different b. Bruh starts at the
// bottom-left end of the visible line, runs up to the intercept (where it pops),
// then carries on to the top-right end.
const PHASES = [
  {
    m: 1,
    b: 2,
    eq: 'y = x + 2',
    start: { x: -5, y: -3 },
    intercept: { x: 0, y: 2 },
    end: { x: 3, y: 5 },
    label: '(0, 2)',
  },
  {
    m: 2,
    b: -3,
    eq: 'y = 2x − 3',
    start: { x: -1, y: -5 },
    intercept: { x: 0, y: -3 },
    end: { x: 4, y: 5 },
    label: '(0, −3)',
  },
]

const PHASE_TEXT = [
  <>
    Every straight line can be written as <strong>y = mx + b</strong>. The{' '}
    <strong>b</strong> is the <strong>y-intercept</strong> — the exact spot where the
    line crosses the vertical y-axis. Watch Bruh run up <strong>y = x + 2</strong> and
    stop right where it crosses at <strong>(0, 2)</strong>.
  </>,
  <>
    The crossing always happens where <strong>x = 0</strong>, so the y-intercept is
    simply the value of <strong>b</strong>. On <strong>y = 2x − 3</strong> that lands at{' '}
    <strong>(0, −3)</strong> — same idea, brand-new line.
  </>,
]

// Animated concept intro for the Y-Intercept checkpoint. Bruh the owl jogs along
// a graphed line and pauses on the point where it crosses the y-axis.
export default function YInterceptIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [pos, setPos] = useState(PHASES[0].start)
  const [dur, setDur] = useState(0)
  const [tilt, setTilt] = useState(0)
  const [running, setRunning] = useState(false)
  const [popped, setPopped] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const [showNext, setShowNext] = useState(false)

  useEffect(() => {
    let cancelled = false
    const P = PHASES[phase]
    // Snap back to the start of this phase's line with no transition.
    setPopped(false)
    setShowLabel(false)
    setShowNext(false)
    setRunning(false)
    setDur(0)
    setPos(P.start)
    setTilt(angleDeg(P.start, P.intercept))

    async function run() {
      await wait(550)
      if (cancelled) return
      // Leg 1: jog up the line to the y-intercept.
      setRunning(true)
      setDur(1500)
      setTilt(angleDeg(P.start, P.intercept))
      setPos(P.intercept)
      await wait(1550)
      if (cancelled) return
      // Land on the intercept: pop the point and reveal its label.
      setRunning(false)
      setPopped(true)
      setShowLabel(true)
      await wait(1150)
      if (cancelled) return
      // Leg 2: keep climbing to the top-right end so the crossing is obvious.
      setRunning(true)
      setDur(1300)
      setTilt(angleDeg(P.intercept, P.end))
      setPos(P.end)
      await wait(1400)
      if (cancelled) return
      setRunning(false)
      setShowNext(true)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [phase])

  const isLast = phase === PHASES.length - 1
  const P = PHASES[phase]

  const handleNext = () => {
    if (isLast) {
      onDone()
      return
    }
    setShowNext(false)
    setPhase((p) => p + 1)
  }

  return (
    <div className="ointro yint">
      <div className="yint__board">
        <span key={`eq${phase}`} className="yint__eq">
          {P.eq}
        </span>

        <div className="yint__graph">
          <Graph m={P.m} b={P.b} showLine lineTone="target" />
        </div>

        {/* the y-intercept point, pulsing once Bruh lands on it */}
        <div
          className={'yint__pt' + (popped ? ' is-pop' : '')}
          style={{ left: px(P.intercept.x), top: py(P.intercept.y) }}
        >
          <span className="yint__dot" aria-hidden="true" />
          {showLabel && <span className="yint__label">{P.label}</span>}
        </div>

        {/* Bruh, sliding along the line */}
        <div
          className="yint__owl"
          style={{ left: px(pos.x), top: py(pos.y), transitionDuration: `${dur}ms` }}
          aria-hidden="true"
        >
          <div className="yint__owltilt" style={{ transform: `rotate(${tilt}deg)` }}>
            <div className={'yint__owlinner' + (running ? ' is-running' : '')}>
              <Owl />
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
