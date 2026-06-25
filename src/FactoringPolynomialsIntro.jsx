import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from './Owl.jsx'
import './FactoringPolynomialsIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// The trinomial x² + 5x + 6 as stable tokens. Bruh hops onto the middle term
// (`bt`, the b = 5) and the constant (`ct`, the c = 6).
const FORM_TOKENS = [
  { id: 'xsq', kind: 'var', raw: 'x²' },
  { id: 'op1', kind: 'op', raw: '+' },
  { id: 'bt', kind: 'num', raw: '5x' },
  { id: 'op2', kind: 'op', raw: '+' },
  { id: 'ct', kind: 'num', raw: '6' },
]

// Candidate factor pairs of c = 6. Bruh checks each: which one also adds to 5?
const SEARCH = [
  { id: 's1', a: 1, b: 6, sum: 7, ok: false },
  { id: 's2', a: 2, b: 3, sum: 5, ok: true },
]

const PHASE_TEXT = [
  <>
    Meet <strong>x² + 5x + 6</strong>. <strong>Factoring</strong> is multiplying
    in reverse: we want to rewrite it as two binomials{' '}
    <strong>(x + ▢)(x + ▢)</strong>.
  </>,
  <>
    The trick: find two numbers that <strong>multiply to 6</strong> (the
    constant) and <strong>add to 5</strong> (the middle coefficient). Bruh marks
    both targets.
  </>,
  <>
    Test the factor pairs of 6. Only <strong>2 and 3</strong> also add to 5 — so
    the polynomial factors into <strong>(x + 2)(x + 3)</strong>.
  </>,
]

// Animated concept intro for Factoring Polynomials. Bruh marks the b and c
// targets, hunts for the matching factor pair, then rewrites the trinomial.
export default function FactoringPolynomialsIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [highlight, setHighlight] = useState([])
  const [showGoal, setShowGoal] = useState(false)
  const [shownRows, setShownRows] = useState(0)
  const [verdict, setVerdict] = useState({})
  const [transformed, setTransformed] = useState(false)
  const [popId, setPopId] = useState(null)
  const [showNext, setShowNext] = useState(false)

  const [owlTarget, setOwlTarget] = useState(null)
  const [hopSeq, setHopSeq] = useState(0)
  const [owlX, setOwlX] = useState(null)
  const [owlReady, setOwlReady] = useState(false)

  const stageRef = useRef(null)
  const tokenRefs = useRef({})

  const hopTo = (id) => {
    setOwlTarget(id)
    setHopSeq((n) => n + 1)
  }

  useEffect(() => {
    let cancelled = false
    async function run() {
      await wait(450)
      if (cancelled) return

      if (phase === 0) {
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 1) {
        hopTo('ct')
        await wait(620)
        if (cancelled) return
        setHighlight(['ct'])
        await wait(620)
        if (cancelled) return
        hopTo('bt')
        await wait(620)
        if (cancelled) return
        setHighlight(['bt', 'ct'])
        await wait(500)
        if (cancelled) return
        setShowGoal(true)
        await wait(700)
        if (cancelled) return
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 2) {
        setShowGoal(true)
        setHighlight(['bt', 'ct'])
        await wait(300)
        if (cancelled) return
        for (let i = 0; i < SEARCH.length; i++) {
          const row = SEARCH[i]
          setShownRows(i + 1)
          await wait(700)
          if (cancelled) return
          setVerdict((v) => ({ ...v, [row.id]: row.ok ? 'yes' : 'no' }))
          await wait(820)
          if (cancelled) return
        }
        setHighlight([])
        setTransformed(true)
        setPopId('fac')
        await wait(950)
        if (cancelled) return
        setPopId(null)
        if (!cancelled) setShowNext(true)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [phase])

  // Measure the target token's center relative to the stage and slide Bruh
  // there; the CSS transition turns the move into a hop.
  useLayoutEffect(() => {
    const stage = stageRef.current
    const target = owlTarget && tokenRefs.current[owlTarget]
    if (!stage || !target) return
    const measure = () => {
      const base = stage.getBoundingClientRect()
      const r = target.getBoundingClientRect()
      setOwlX(r.left - base.left + r.width / 2)
      setOwlReady(true)
    }
    measure()
    const raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [owlTarget, hopSeq])

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
    <div className="ointro facpoly">
      <div className="ointro__board facpoly__board">
        <div className="facpoly__stage" ref={stageRef}>
          {owlTarget != null && owlX != null && (
            <span
              className={'facpoly__owl' + (owlReady ? ' facpoly__owl--ready' : '')}
              style={{ transform: `translateX(${owlX}px)` }}
              aria-hidden="true"
            >
              <span key={hopSeq} className="facpoly__owlhop">
                <span className="facpoly__owlbody">
                  <Owl />
                </span>
              </span>
            </span>
          )}

          <div className="eq eq--readonly ointro__eq facpoly__eq">
            {FORM_TOKENS.map((t) => {
              const cls =
                'token token--static' +
                (t.kind === 'op' ? ' token--op' : '') +
                (highlight.includes(t.id) ? ' ointro__tok--hot' : '')
              return (
                <span
                  key={t.id}
                  ref={(el) => {
                    if (el) tokenRefs.current[t.id] = el
                    else delete tokenRefs.current[t.id]
                  }}
                  className={cls}
                >
                  {t.raw}
                </span>
              )
            })}
          </div>
        </div>

        <div className={'facpoly__goal' + (showGoal ? ' facpoly__goal--on' : '')} aria-hidden={!showGoal}>
          <span className="facpoly__goal-chip">multiply to <strong>6</strong></span>
          <span className="facpoly__goal-chip">add to <strong>5</strong></span>
        </div>

        <div className="facpoly__search">
          {SEARCH.slice(0, shownRows).map((row) => {
            const v = verdict[row.id]
            return (
              <div
                key={row.id}
                className={
                  'facpoly__row' +
                  (v === 'yes' ? ' facpoly__row--yes' : '') +
                  (v === 'no' ? ' facpoly__row--no' : '')
                }
              >
                <span className="facpoly__pair">
                  {row.a} · {row.b} = 6
                </span>
                <span className="facpoly__sum">
                  {row.a} + {row.b} = {row.sum}
                </span>
                <span className="facpoly__mark">
                  {v === 'yes' ? '✓' : v === 'no' ? '✗' : ''}
                </span>
              </div>
            )
          })}
        </div>

        {transformed && (
          <div className="facpoly__result">
            <span className="facpoly__arrow" aria-hidden="true">↓</span>
            <span className={'facpoly__factored' + (popId === 'fac' ? ' ointro__tok--pop' : '')}>
              (x + 2)(x + 3)
            </span>
          </div>
        )}
      </div>

      <p key={phase} className="bintro__text ointro__text facpoly__text">
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
