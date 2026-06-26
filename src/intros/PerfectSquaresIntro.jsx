import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from '../components/Owl.jsx'
import './PerfectSquaresIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const T = (id, kind, raw) => ({ id, kind, raw })

// Token list after each transformation. Ids stay stable across states so a slot
// keeps its position while its contents pop/change (e.g. `c`: 9 → 3²).
const STATES = {
  expr: [
    T('a', 'var', 'x²'),
    T('op1', 'op', '+'),
    T('m', 'var', '6x'),
    T('op2', 'op', '+'),
    T('c', 'num', '9'),
  ],
  squared: [
    T('a', 'var', 'x²'),
    T('op1', 'op', '+'),
    T('m', 'var', '6x'),
    T('op2', 'op', '+'),
    T('c', 'num', '3²'),
  ],
  final: [T('f', 'paren', '(x + 3)²')],
}

const PHASE_TEXT = [
  <>
    Meet <strong>x² + 6x + 9</strong>. Three terms — and the <strong>first</strong> and{' '}
    <strong>last</strong> are both perfect squares.
  </>,
  <>
    Bruh checks: <strong>9 = 3²</strong>, <strong>x²</strong> is already a square, and the
    middle <strong>6x = 2·3·x</strong> — exactly <strong>twice their product</strong>. That
    makes it a <strong>perfect-square trinomial</strong>.
  </>,
  <>
    A perfect-square trinomial collapses to a single square:{' '}
    <strong>a² + 2ab + b² = (a + b)²</strong>, so <strong>x² + 6x + 9 = (x + 3)²</strong>. If
    the middle were negative — <strong>x² − 6x + 9</strong> — it would factor as{' '}
    <strong>(x − 3)²</strong>.
  </>,
]

// Animated concept intro for Perfect Squares. Bruh hops onto the last and middle
// terms to confirm the pattern, then the trinomial collapses to (x + 3)².
export default function PerfectSquaresIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [stateKey, setStateKey] = useState('expr')
  const [showRule, setShowRule] = useState(false)
  const [owlTarget, setOwlTarget] = useState(null)
  const [hopSeq, setHopSeq] = useState(0)
  const [highlight, setHighlight] = useState([])
  const [popId, setPopId] = useState(null)
  const [showNext, setShowNext] = useState(false)

  const stageRef = useRef(null)
  const tokenRefs = useRef({})
  const [owlX, setOwlX] = useState(null)
  const [owlReady, setOwlReady] = useState(false)

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
        setShowRule(true)
        await wait(700)
        if (cancelled) return
        hopTo('c')
        await wait(620)
        if (cancelled) return
        setHighlight(['c'])
        await wait(560)
        if (cancelled) return
        setHighlight([])
        setStateKey('squared')
        setPopId('c')
        await wait(900)
        if (cancelled) return
        setPopId(null)
        hopTo('m')
        await wait(620)
        if (cancelled) return
        setHighlight(['m'])
        await wait(620)
        if (cancelled) return
        setHighlight([])
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 2) {
        hopTo('a')
        await wait(620)
        if (cancelled) return
        setHighlight(['a', 'm', 'c'])
        await wait(700)
        if (cancelled) return
        setHighlight([])
        setStateKey('final')
        setPopId('f')
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

  // Measure the target token's center relative to the stage and slide Bruh there;
  // the CSS transition turns the move into a hop.
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
  }, [owlTarget, stateKey, hopSeq])

  const isLast = phase === PHASE_TEXT.length - 1
  const tokens = STATES[stateKey]

  const handleNext = () => {
    if (isLast) {
      onDone()
      return
    }
    setShowNext(false)
    setHighlight([])
    setPopId(null)
    setPhase((p) => p + 1)
  }

  return (
    <div className="ointro psq">
      <div className="ointro__board psq__board">
        <div
          className={'psq__rule' + (showRule ? ' psq__rule--on' : '')}
          aria-hidden={!showRule}
        >
          <span className="psq__rule-label">pattern</span>
          <span className="psq__rule-eq">
            a² + 2ab + b² = <strong>(a + b)²</strong>
          </span>
        </div>

        <div className="psq__stage" ref={stageRef}>
          {owlTarget != null && owlX != null && (
            <span
              className={'psq__owl' + (owlReady ? ' psq__owl--ready' : '')}
              style={{ transform: `translateX(${owlX}px)` }}
              aria-hidden="true"
            >
              <span key={hopSeq} className="psq__owlhop">
                <span className="psq__owlbody">
                  <Owl />
                </span>
              </span>
            </span>
          )}

          <div className="eq eq--readonly ointro__eq psq__eq">
            {tokens.map((t) => {
              const cls =
                'token token--static' +
                (t.kind === 'op' ? ' token--op' : '') +
                (t.kind === 'paren' ? ' token--paren' : '') +
                (highlight.includes(t.id) ? ' ointro__tok--hot' : '') +
                (popId === t.id ? ' ointro__tok--pop' : '')
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
      </div>

      <p key={phase} className="bintro__text ointro__text psq__text">
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
