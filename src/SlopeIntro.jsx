import { useEffect, useState } from 'react'
import Owl from './Owl.jsx'
import './SlopeIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Coordinate system mirrors src/components/Graph.jsx so the grid matches the
// app's existing coordinate-plane look.
const SIZE = 340
const PAD = 28
const GR = 5
const scale = (SIZE - PAD * 2) / (2 * GR)
const sx = (x) => PAD + (x + GR) * scale
const sy = (y) => PAD + (GR - y) * scale
// As a percentage of the (square) SVG box, for positioning the HTML owl overlay.
const px = (x) => (sx(x) / SIZE) * 100
const py = (y) => (sy(y) / SIZE) * 100

// Two phases: a positive slope (y = 2x) then a negative slope (y = -x). For
// each we list the integer lattice points Bruh hops between; each segment is a
// "run" of 1 to the right and a "rise" of m up (or down).
const PHASES = [
  {
    m: 2,
    line: [{ x: -2.5, y: -5 }, { x: 2.5, y: 5 }],
    points: [
      { x: -2, y: -4 }, { x: -1, y: -2 }, { x: 0, y: 0 }, { x: 1, y: 2 }, { x: 2, y: 4 },
    ],
    labelStep: 2,
    text: (
      <>
        Slope is the <strong>m</strong> in <strong>y = mx + b</strong> — it
        measures how steep a line is. It's <strong>rise ÷ run</strong>: how far{' '}
        <strong>up</strong> the line climbs for every step to the{' '}
        <strong>right</strong>. Here the line rises <strong>2</strong> for every{' '}
        <strong>1</strong> across, so the slope is <strong>2</strong>. A steeper
        line means a bigger slope.
      </>
    ),
  },
  {
    m: -1,
    line: [{ x: -5, y: 5 }, { x: 5, y: -5 }],
    points: [
      { x: -2, y: 2 }, { x: -1, y: 1 }, { x: 0, y: 0 }, { x: 1, y: -1 }, { x: 2, y: -2 },
    ],
    labelStep: 2,
    text: (
      <>
        When a line <strong>falls</strong> as you move to the right, the rise is
        negative — so the slope is <strong>negative</strong>. Bruh runs{' '}
        <strong>down</strong> this line: it drops <strong>1</strong> for every
        step right, giving a slope of <strong>−1</strong>.
      </>
    ),
  },
]

export default function SlopeIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [lineDrawn, setLineDrawn] = useState(false)
  const [runsShown, setRunsShown] = useState(0)
  const [risesShown, setRisesShown] = useState(0)
  const [running, setRunning] = useState(false)
  const [showNext, setShowNext] = useState(false)

  const cfg = PHASES[phase]
  const nSteps = cfg.points.length - 1
  // Bruh sits on the lattice point he has climbed to (advances on each rise).
  const owlPoint = cfg.points[Math.min(risesShown, nSteps)]

  useEffect(() => {
    let cancelled = false
    // Reset for the incoming phase.
    setLineDrawn(false)
    setRunsShown(0)
    setRisesShown(0)
    setRunning(false)
    setShowNext(false)

    async function run() {
      await wait(400)
      if (cancelled) return
      setLineDrawn(true)
      await wait(850)
      if (cancelled) return

      for (let i = 0; i < nSteps; i++) {
        if (cancelled) return
        // Step to the right first (the "run").
        setRunsShown(i + 1)
        await wait(540)
        if (cancelled) return
        // Then climb (the "rise") — Bruh slides up the line to the next point.
        setRunning(true)
        setRisesShown(i + 1)
        await wait(620)
        if (cancelled) return
        setRunning(false)
        await wait(120)
      }

      if (!cancelled) {
        await wait(350)
        if (!cancelled) setShowNext(true)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [phase, nSteps])

  const isLast = phase === PHASES.length - 1

  const handleNext = () => {
    if (isLast) {
      onDone()
      return
    }
    setPhase((p) => p + 1)
  }

  const ticks = []
  for (let i = -GR; i <= GR; i++) ticks.push(i)

  const m = cfg.m
  const readoutReady = risesShown >= nSteps

  return (
    <div className="ointro slintro">
      <div className="ointro__board slintro__board">
        <div className="graph-wrap slintro__wrap">
          <svg
            className="graph slintro__graph"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={`Coordinate plane showing a line with slope ${m}`}
          >
            <defs>
              <marker
                id="slintro-run-head"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" className="slintro__runfill" />
              </marker>
              <marker
                id="slintro-rise-head"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" className="slintro__risefill" />
              </marker>
            </defs>

            {/* grid */}
            {ticks.map((t) => (
              <g key={`g${t}`}>
                <line className="graph__grid" x1={sx(t)} y1={sy(-GR)} x2={sx(t)} y2={sy(GR)} />
                <line className="graph__grid" x1={sx(-GR)} y1={sy(t)} x2={sx(GR)} y2={sy(t)} />
              </g>
            ))}

            {/* axes */}
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

            {/* the line itself, drawn in with a dash sweep */}
            <line
              className={'slintro__line' + (lineDrawn ? ' slintro__line--in' : '')}
              x1={sx(cfg.line[0].x)}
              y1={sy(cfg.line[0].y)}
              x2={sx(cfg.line[1].x)}
              y2={sy(cfg.line[1].y)}
            />

            {/* staircase: run (right) + rise (up/down) for each climbed step */}
            {cfg.points.slice(0, nSteps).map((p, i) => {
              const showRun = i < runsShown
              const showRise = i < risesShown
              const x0 = p.x
              const y0 = p.y
              const x1 = p.x + 1
              const y1 = p.y + m
              const labelled = i === cfg.labelStep
              return (
                <g key={`step${i}`}>
                  {showRun && (
                    <line
                      className="slintro__run"
                      markerEnd="url(#slintro-run-head)"
                      x1={sx(x0)}
                      y1={sy(y0)}
                      x2={sx(x1)}
                      y2={sy(y0)}
                    />
                  )}
                  {showRise && (
                    <line
                      className="slintro__rise"
                      markerEnd="url(#slintro-rise-head)"
                      x1={sx(x1)}
                      y1={sy(y0)}
                      x2={sx(x1)}
                      y2={sy(y1)}
                    />
                  )}
                  {labelled && showRun && (
                    <text className="slintro__runlabel" x={sx(x0 + 0.5)} y={sy(y0) + 17}>
                      run 1
                    </text>
                  )}
                  {labelled && showRise && (
                    <text
                      className="slintro__riselabel"
                      x={sx(x1) + 7}
                      y={sy(y0 + m / 2) + 4}
                    >
                      rise {m}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Bruh, overlaid on the plane, sliding from lattice point to point */}
          <div
            className={'slintro__owl' + (running ? ' slintro__owl--run' : '')}
            style={{ left: `${px(owlPoint.x)}%`, top: `${py(owlPoint.y)}%` }}
            aria-hidden="true"
          >
            <div className="slintro__owlinner">
              <Owl />
            </div>
          </div>
        </div>

        <div className={'slintro__readout' + (readoutReady ? ' slintro__readout--in' : '')}>
          slope = <span className="slintro__frac">rise / run</span> ={' '}
          <span className="slintro__frac">
            {m} / 1
          </span>{' '}
          = <strong>{m}</strong>
        </div>
      </div>

      <p key={phase} className="bintro__text ointro__text">
        {cfg.text}
      </p>

      {showNext && (
        <button className="btn bintro__btn" onClick={handleNext}>
          {isLast ? 'Start →' : 'Next →'}
        </button>
      )}
    </div>
  )
}
