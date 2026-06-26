import './SubstitutionIntro.css'
import { useEffect, useState } from 'react'
import Owl from '../components/Owl.jsx'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// The walkthrough system: eq1 is already solved for y, so its right-hand side
// (2x + 1) is what Bruh carries over and plugs into eq2's y-slot.
const EXPR = '2x + 1'

// The chain of equations shown while solving, revealed one line at a time.
const SOLVE_LINES = [
  '3x + (2x + 1) = 11',
  '5x + 1 = 11',
  '5x = 10',
  'x = 2',
  'y = 2(2) + 1 = 5',
]
const FINAL_LINE = '(x, y) = (2, 5)'

const PHASE_TEXT = [
  <>
    A <strong>system</strong> is two equations that share the same x and y. We're
    hunting for the single pair (x, y) that makes <em>both</em> true at once.
  </>,
  <>
    Equation 1 already says <strong>y = 2x + 1</strong>. So anywhere we see a y,
    we can drop in <strong>(2x + 1)</strong> instead. Watch Bruh carry it into
    equation 2's y-slot.
  </>,
  <>
    Now it's <strong>one equation in one variable</strong> — solve for x, then
    back-substitute to find y. That pair is the solution to the whole system!
  </>,
]

// Animated concept intro for solving systems by substitution. Bruh literally
// picks up the "(2x + 1)" expression and drops it into the other equation's
// y-slot, then the combined equation collapses to the solution.
export default function SubstitutionIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [highlightExpr, setHighlightExpr] = useState(false)
  const [carrying, setCarrying] = useState(false)
  const [dropping, setDropping] = useState(false)
  const [filled, setFilled] = useState(false)
  const [solveStep, setSolveStep] = useState(0)
  const [showNext, setShowNext] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setShowNext(false)

      if (phase === 0) {
        await wait(550)
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 1) {
        // Reset the substitution choreography each time we (re)enter phase 1.
        setHighlightExpr(false)
        setCarrying(false)
        setDropping(false)
        setFilled(false)
        await wait(500)
        if (cancelled) return
        setHighlightExpr(true)
        await wait(1100)
        if (cancelled) return
        setCarrying(true)
        await wait(1300)
        if (cancelled) return
        setDropping(true)
        await wait(620)
        if (cancelled) return
        setCarrying(false)
        setDropping(false)
        setFilled(true)
        await wait(950)
        if (cancelled) return
        setShowNext(true)
        return
      }

      // phase 2 — collapse to the solution, one line at a time.
      setFilled(true)
      setSolveStep(0)
      for (let i = 1; i <= SOLVE_LINES.length + 1; i++) {
        await wait(i === 1 ? 450 : 850)
        if (cancelled) return
        setSolveStep(i)
      }
      await wait(300)
      if (!cancelled) setShowNext(true)
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

  const slotClass =
    'subintro__slot' +
    (filled ? ' subintro__slot--filled' : carrying || dropping ? ' subintro__slot--waiting' : '')

  return (
    <div className="subintro">
      <div className="subintro__board">
        {phase < 2 ? (
          <>
            <div
              className={
                'subintro__eq' + (highlightExpr || carrying || dropping ? ' subintro__eq--focus' : '')
              }
            >
              <span className="subintro__label">Eq 1</span>
              <span>y =</span>
              <span
                className={
                  'subintro__expr' +
                  (highlightExpr && !carrying && !dropping ? ' subintro__expr--hot' : '') +
                  (carrying || dropping || filled ? ' subintro__expr--lifted' : '')
                }
              >
                {EXPR}
              </span>
            </div>

            <div className="subintro__carry" aria-hidden="true">
              {(carrying || dropping) && (
                <>
                  <span className="subintro__carryowl">
                    <Owl />
                  </span>
                  <span className={'subintro__chip' + (dropping ? ' subintro__chip--drop' : '')}>
                    ({EXPR})
                  </span>
                </>
              )}
            </div>

            <div className={'subintro__eq' + (filled ? ' subintro__eq--focus' : '')}>
              <span className="subintro__label">Eq 2</span>
              <span>3x +</span>
              <span className={slotClass}>{filled ? `(${EXPR})` : 'y'}</span>
              <span>= 11</span>
            </div>
          </>
        ) : (
          <div className="subintro__solve">
            {SOLVE_LINES.slice(0, solveStep).map((line) => (
              <div key={line} className="subintro__solveline">
                {line}
              </div>
            ))}
            {solveStep > SOLVE_LINES.length && (
              <div className="subintro__solveline subintro__solveline--final">{FINAL_LINE}</div>
            )}
          </div>
        )}
      </div>

      <p key={phase} className="subintro__text">
        {PHASE_TEXT[phase]}
      </p>

      {showNext && (
        <button className="btn subintro__btn" onClick={handleNext}>
          {isLast ? 'Start →' : 'Next →'}
        </button>
      )}
    </div>
  )
}
