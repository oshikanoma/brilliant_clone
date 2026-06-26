import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from '../components/Owl.jsx'
import './DifferenceOfSquaresIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const T = (id, kind, raw) => ({ id, kind, raw })

// Token list after each transformation. Ids stay stable across states so a slot
// keeps its position while its contents pop/change (e.g. `b`: 9 → 3²).
const STATES = {
  expr: [T('a', 'var', 'x²'), T('op', 'op', '−'), T('b', 'num', '9')],
  squared: [T('a', 'var', 'x²'), T('op', 'op', '−'), T('b', 'num', '3²')],
  final: [T('f1', 'paren', '(x + 3)'), T('f2', 'paren', '(x − 3)')],
}

const PHASE_TEXT = [
  <>
    Meet <strong>x² − 9</strong>. Two terms with a <strong>minus</strong> sign between them —
    and each one happens to be a <strong>perfect square</strong>.
  </>,
  <>
    Bruh checks: <strong>9 = 3²</strong>, and <strong>x²</strong> is already a square. So this
    is a <strong>difference of squares</strong>, the pattern <strong>a² − b²</strong>.
  </>,
  <>
    Two perfect squares being <strong>subtracted</strong> factor into conjugates:{' '}
    <strong>a² − b² = (a + b)(a − b)</strong>. So <strong>x² − 9 = (x + 3)(x − 3)</strong>.
    Careful — a <strong>sum</strong> like <strong>x² + 9</strong> does <em>not</em> factor this way.
  </>,
]

// Animated concept intro for the Difference of Squares. Bruh hops onto each term
// to confirm both are squares, then the expression factors into conjugates.
export default function DifferenceOfSquaresIntro({ onDone }) {
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
        hopTo('a')
        await wait(620)
        if (cancelled) return
        setHighlight(['a'])
        await wait(560)
        if (cancelled) return
        setHighlight([])
        hopTo('b')
        await wait(620)
        if (cancelled) return
        setHighlight(['b'])
        await wait(560)
        if (cancelled) return
        setHighlight([])
        setStateKey('squared')
        setPopId('b')
        await wait(900)
        if (cancelled) return
        setPopId(null)
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 2) {
        hopTo('a')
        await wait(620)
        if (cancelled) return
        setHighlight(['a', 'op', 'b'])
        await wait(640)
        if (cancelled) return
        setHighlight([])
        setStateKey('final')
        setPopId('f1')
        await wait(620)
        if (cancelled) return
        setPopId('f2')
        await wait(700)
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
    <div className="ointro diffsq">
      <div className="ointro__board diffsq__board">
        <div
          className={'diffsq__rule' + (showRule ? ' diffsq__rule--on' : '')}
          aria-hidden={!showRule}
        >
          <span className="diffsq__rule-label">pattern</span>
          <span className="diffsq__rule-eq">
            a² − b² = <strong>(a + b)(a − b)</strong>
          </span>
        </div>

        <div className="diffsq__stage" ref={stageRef}>
          {owlTarget != null && owlX != null && (
            <span
              className={'diffsq__owl' + (owlReady ? ' diffsq__owl--ready' : '')}
              style={{ transform: `translateX(${owlX}px)` }}
              aria-hidden="true"
            >
              <span key={hopSeq} className="diffsq__owlhop">
                <span className="diffsq__owlbody">
                  <Owl />
                </span>
              </span>
            </span>
          )}

          <div className="eq eq--readonly ointro__eq diffsq__eq">
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

      <p key={phase} className="bintro__text ointro__text diffsq__text">
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
