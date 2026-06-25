import { useEffect, useState } from 'react'
import './EliminationIntro.css'
import Graph from './components/Graph.jsx'
import OwlSpeech from './OwlSpeech.jsx'

// Animated concept intro for "Systems (Elimination)". It opens on a coordinate
// plane showing two lines + their equations, shrinks the graph away while Bruh
// explains we can't always rely on a picture, then stacks the two equations and
// adds them so one variable cancels — the heart of elimination.
//
// Demo system (kept tiny + tidy so the choreography reads clearly):
//   x + y = 4     →  y = −x + 4   (line 1)
//   x − y = 2     →  y =  x − 2   (line 2)
//   solution: (3, 1)

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Slope/intercept forms for the demo graph.
const LINE1 = { m: -1, b: 4 } // x + y = 4
const LINE2 = { m: 1, b: -2 } // x − y = 2

const PHASE_TEXT = [
  <>
    A <strong>system</strong> is two equations at once. Graphed, each is a line —
    and the spot where they cross is the one <strong>(x, y)</strong> that solves
    both. Here the lines meet at <strong>(3, 1)</strong>.
  </>,
  <>
    But we won't always have a graph, and reading exact crossings off a picture
    is hard. Good news: we can find that point using only the equations.
  </>,
  <>
    <strong>The whole point of elimination:</strong> get rid of one variable.
    Stack the equations and <strong>add</strong> them so the <strong>+y</strong>
    and <strong>−y</strong> cancel — that leaves one easy equation in
    <strong> x</strong>. Solve it, then substitute back for <strong>y</strong>.
  </>,
  <>
    What if nothing cancels yet? <strong>Multiply a whole equation</strong> by a
    number first — that's the distributive property, applied to every term! Scaling
    <strong> 3x − y = 7</strong> by <strong>2</strong> makes the <strong>−y</strong>
    into <strong>−2y</strong>, so it cancels the <strong>+2y</strong> when you add.
  </>,
]

// Tokens for the stacked equations in phase 2. Columns: x · op · y · = · c
const ROW1 = ['x', '+', 'y', '=', '4']
const ROW2 = ['x', '−', 'y', '=', '2']

// Phase 3 demo (needs a multiply to line up): x + 2y = 7 and 3x − y = 7.
// Multiply equation 2 by 2 → 6x − 2y = 14, then add: 7x = 21 → x = 3, y = 2.
const M_ROW1 = ['x', '+', '2y', '=', '7']
const M_ROW2_ORIG = ['3x', '−', 'y', '=', '7']
const M_ROW2_MUL = ['6x', '−', '2y', '=', '14']

export default function EliminationIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [showNext, setShowNext] = useState(false)
  // Sub-steps that drive the phase-2 elimination choreography.
  const [step, setStep] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setShowNext(false)
      if (phase < 2) {
        // Phases 0 & 1 are static boards; just reveal the button shortly.
        await wait(700)
        if (!cancelled) setShowNext(true)
        return
      }
      setStep(0)
      await wait(700)
      if (cancelled) return

      if (phase === 2) {
        // Phase 2: variables already cancel — stack, add, solve.
        setStep(1) // highlight the +y / −y columns
        await wait(1100)
        if (cancelled) return
        setStep(2) // cancel them + drop the summed equation
        await wait(1200)
        if (cancelled) return
        setStep(3) // solve for x
        await wait(1100)
        if (cancelled) return
        setStep(4) // back-substitute for y
        await wait(1100)
        if (cancelled) return
        setStep(5) // reveal the solution chip
        await wait(700)
        if (!cancelled) setShowNext(true)
        return
      }

      // Phase 3: coefficients don't line up — multiply a whole equation first.
      setStep(1) // highlight the mismatched y coefficients
      await wait(1300)
      if (cancelled) return
      setStep(2) // multiply equation 2 by 2 (distribute to every term)
      await wait(1400)
      if (cancelled) return
      setStep(3) // now +2y / −2y are opposites — highlight them
      await wait(1100)
      if (cancelled) return
      setStep(4) // cancel + drop the summed equation 7x = 21
      await wait(1200)
      if (cancelled) return
      setStep(5) // divide for x
      await wait(1100)
      if (cancelled) return
      setStep(6) // back-substitute for y
      await wait(1100)
      if (cancelled) return
      setStep(7) // reveal the solution chip
      await wait(700)
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

  const renderStack = () => {
    const yHot = step === 1
    const yGone = step >= 2
    return (
      <div className="elimintro__grid" aria-label="Stacked equations">
        {ROW1.map((t, i) => {
          const isYcol = i === 1 || i === 2 // the "+" and "y" of row 1
          const cls =
            'elimintro__cell' +
            (i === 1 ? ' elimintro__cell--op' : '') +
            (i === 3 ? ' elimintro__cell--eq' : '') +
            (isYcol && yHot ? ' elimintro__cell--hot' : '') +
            (isYcol && yGone ? ' elimintro__cell--cancel' : '')
          return (
            <span key={`r1-${i}`} className={cls}>
              {t}
            </span>
          )
        })}

        {ROW2.map((t, i) => {
          const isYcol = i === 1 || i === 2 // the "−" and "y" of row 2
          const cls =
            'elimintro__cell' +
            (i === 1 ? ' elimintro__cell--op' : '') +
            (i === 3 ? ' elimintro__cell--eq' : '') +
            (isYcol && yHot ? ' elimintro__cell--hot' : '') +
            (isYcol && yGone ? ' elimintro__cell--cancel' : '')
          return (
            <span key={`r2-${i}`} className={cls}>
              {t}
            </span>
          )
        })}

        <div className="elimintro__rule" aria-hidden="true">
          <span className="elimintro__opbadge">+</span>
        </div>

        {/* Summed equation: 2x = 6, with the y column blanked out. */}
        {step >= 2 ? (
          <>
            <span className="elimintro__cell elimintro__cell--sum elimintro__pop">2x</span>
            <span className="elimintro__cell" />
            <span className="elimintro__cell" />
            <span className="elimintro__cell elimintro__cell--eq elimintro__pop">=</span>
            <span className="elimintro__cell elimintro__cell--sum elimintro__pop">6</span>
          </>
        ) : (
          <span style={{ gridColumn: '1 / -1', height: '2.2rem' }} />
        )}
      </div>
    )
  }

  // Phase 3 stack: the y-coefficients don't cancel until we scale equation 2.
  const renderStackMul = () => {
    const rowMul = step >= 2 // equation 2 has been multiplied by 2
    const mulHot = step === 2 // the whole scaled row flashes as it transforms
    const yMismatch = step === 1 // 2y vs −y don't match yet
    const yOpp = step === 3 // +2y / −2y are now opposites
    const yGone = step >= 4 // they cancel
    const row2 = rowMul ? M_ROW2_MUL : M_ROW2_ORIG
    return (
      <div className="elimintro__grid" aria-label="Stacked equations">
        {M_ROW1.map((t, i) => {
          const isY = i === 2
          const cls =
            'elimintro__cell' +
            (i === 1 ? ' elimintro__cell--op' : '') +
            (i === 3 ? ' elimintro__cell--eq' : '') +
            (isY && (yMismatch || yOpp) ? ' elimintro__cell--hot' : '') +
            (isY && yGone ? ' elimintro__cell--cancel' : '')
          return (
            <span key={`m1-${i}`} className={cls}>
              {t}
            </span>
          )
        })}

        {row2.map((t, i) => {
          const isY = i === 2
          const cls =
            'elimintro__cell' +
            (i === 1 ? ' elimintro__cell--op' : '') +
            (i === 3 ? ' elimintro__cell--eq' : '') +
            ((mulHot || (isY && (yMismatch || yOpp))) ? ' elimintro__cell--hot' : '') +
            (mulHot ? ' elimintro__pop' : '') +
            (isY && yGone ? ' elimintro__cell--cancel' : '')
          return (
            <span key={`m2-${i}`} className={cls}>
              {t}
            </span>
          )
        })}

        <div className="elimintro__rule" aria-hidden="true">
          <span className="elimintro__opbadge">+</span>
        </div>

        {/* Summed equation: 7x = 21, with the y column blanked out. */}
        {step >= 4 ? (
          <>
            <span className="elimintro__cell elimintro__cell--sum elimintro__pop">7x</span>
            <span className="elimintro__cell" />
            <span className="elimintro__cell" />
            <span className="elimintro__cell elimintro__cell--eq elimintro__pop">=</span>
            <span className="elimintro__cell elimintro__cell--sum elimintro__pop">21</span>
          </>
        ) : (
          <span style={{ gridColumn: '1 / -1', height: '2.2rem' }} />
        )}
      </div>
    )
  }

  return (
    <div className="elimintro">
      <OwlSpeech text={<strong>{PHASE_TEXT[phase]}</strong>} tone="neutral" />

      <div className="elimintro__stage">
        {phase < 2 ? (
          <div className="elimintro__board">
            <div
              className={
                'elimintro__graph' + (phase === 1 ? ' elimintro__graph--shrink' : '')
              }
            >
              <Graph
                m={LINE1.m}
                b={LINE1.b}
                showLine
                lineTone="ok"
                m2={LINE2.m}
                b2={LINE2.b}
                showLine2
                line2Tone="target"
                pins={[{ x: 3, y: 1 }]}
              />
            </div>
            <div className="elimintro__eqs">
              <div className="elimintro__eq elimintro__eq--l1">
                <span className="elimintro__dot elimintro__dot--l1" />x + y = 4
              </div>
              <div className="elimintro__eq elimintro__eq--l2">
                <span className="elimintro__dot elimintro__dot--l2" />x − y = 2
              </div>
            </div>
          </div>
        ) : phase === 2 ? (
          <div>
            {renderStack()}
            {step >= 3 && (
              <p className="elimintro__line">
                <span>divide by 2 →</span> x = 3
              </p>
            )}
            {step >= 4 && (
              <p className="elimintro__line">
                <span>substitute →</span> 3 + y = 4, so y = 1
              </p>
            )}
            {step >= 5 && <div className="elimintro__sol">(3, 1)</div>}
          </div>
        ) : (
          <div>
            {step >= 2 && (
              <p className="elimintro__line elimintro__line--mul">
                <span>multiply ② by 2 →</span> distribute to every term
              </p>
            )}
            {renderStackMul()}
            {step >= 5 && (
              <p className="elimintro__line">
                <span>divide by 7 →</span> x = 3
              </p>
            )}
            {step >= 6 && (
              <p className="elimintro__line">
                <span>substitute →</span> 3 + 2y = 7, so y = 2
              </p>
            )}
            {step >= 7 && <div className="elimintro__sol">(3, 2)</div>}
          </div>
        )}
      </div>

      {showNext && (
        <button className="btn bintro__btn" onClick={handleNext}>
          {isLast ? 'Start →' : 'Next →'}
        </button>
      )}
    </div>
  )
}
