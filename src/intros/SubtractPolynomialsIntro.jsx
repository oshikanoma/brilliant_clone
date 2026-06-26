import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from '../components/Owl.jsx'
import './SubtractPolynomialsIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// tone groups like terms by color (x² with x², x with x). Ops/parens get none.
const T = (id, kind, raw, tone = null) => ({ id, kind, raw, tone })

// Token list after each transformation. Ids stay stable across states so a slot
// keeps its position while its contents pop/flip/combine.
const STATES = {
  // 5x² + 2x − (2x² + 4x)
  expr: [
    T('a', 'num', '5x²', 'x2'),
    T('p1', 'op', '+'),
    T('b', 'num', '2x', 'x'),
    T('minus', 'op', '−'),
    T('lp', 'paren', '('),
    T('c', 'num', '2x²', 'x2'),
    T('p2', 'op', '+'),
    T('d', 'num', '4x', 'x'),
    T('rp', 'paren', ')'),
  ],
  // 5x² + 2x − 2x² − 4x  (minus distributed, both signs flipped)
  distributed: [
    T('a', 'num', '5x²', 'x2'),
    T('p1', 'op', '+'),
    T('b', 'num', '2x', 'x'),
    T('m1', 'op', '−'),
    T('c', 'num', '2x²', 'x2'),
    T('m2', 'op', '−'),
    T('d', 'num', '4x', 'x'),
  ],
  // 3x² + 2x − 4x  (x² family combined)
  x2done: [
    T('s2', 'num', '3x²', 'x2'),
    T('p1', 'op', '+'),
    T('b', 'num', '2x', 'x'),
    T('m2', 'op', '−'),
    T('d', 'num', '4x', 'x'),
  ],
  // 3x² − 2x
  final: [
    T('s2', 'num', '3x²', 'x2'),
    T('m', 'op', '−'),
    T('s1', 'num', '2x', 'x'),
  ],
}

const PHASE_TEXT = [
  <>
    Here's a subtraction: <strong>(5x² + 2x) − (2x² + 4x)</strong>. That minus sign in
    front of the parentheses doesn't just sit there — it belongs to{' '}
    <strong>every</strong> term inside.
  </>,
  <>
    Distribute the minus: <strong>+2x²</strong> flips to <strong>−2x²</strong> and{' '}
    <strong>+4x</strong> flips to <strong>−4x</strong>. The most common mistake is
    flipping only the first sign — you must flip them <strong>all</strong>.
  </>,
  <>
    Now combine like terms. The <strong>x²</strong> family: 5x² − 2x² = 3x². Then the{' '}
    <strong>x</strong> family: 2x − 4x = −2x. The result is <strong>3x² − 2x</strong>.
  </>,
]

// Animated concept intro for Subtracting Polynomials. Bruh lands on the
// distributing minus, the inside signs flip, then like terms combine.
export default function SubtractPolynomialsIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [stateKey, setStateKey] = useState('expr')
  const [owlTarget, setOwlTarget] = useState(null)
  const [hopSeq, setHopSeq] = useState(0)
  const [highlight, setHighlight] = useState([])
  const [popId, setPopId] = useState([])
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
        // Land on the distributing minus, then flip every inside sign.
        hopTo('minus')
        await wait(620)
        if (cancelled) return
        setHighlight(['minus', 'lp', 'c', 'p2', 'd', 'rp'])
        await wait(720)
        if (cancelled) return
        setHighlight([])
        setStateKey('distributed')
        setPopId(['m1', 'c', 'm2', 'd'])
        await wait(1000)
        if (cancelled) return
        setPopId([])
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 2) {
        // Combine the x² family: 5x² − 2x² -> 3x²
        hopTo('a')
        await wait(620)
        if (cancelled) return
        setHighlight(['a', 'm1', 'c'])
        await wait(640)
        if (cancelled) return
        setHighlight([])
        setStateKey('x2done')
        setPopId(['s2'])
        await wait(900)
        if (cancelled) return
        setPopId([])
        await wait(420)
        if (cancelled) return
        // Combine the x family: 2x − 4x -> −2x
        hopTo('b')
        await wait(620)
        if (cancelled) return
        setHighlight(['b', 'm2', 'd'])
        await wait(640)
        if (cancelled) return
        setHighlight([])
        setStateKey('final')
        setPopId(['m', 's1'])
        await wait(950)
        if (cancelled) return
        setPopId([])
        if (!cancelled) setShowNext(true)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [phase])

  // Measure target token center relative to the stage and slide Bruh there.
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
    setPopId([])
    setPhase((p) => p + 1)
  }

  return (
    <div className="ointro subpoly">
      <div className="ointro__board subpoly__board">
        <div className="subpoly__legend" aria-hidden="true">
          <span className="subpoly__chip subpoly__chip--x2">x² terms</span>
          <span className="subpoly__chip subpoly__chip--x">x terms</span>
        </div>

        <div className="subpoly__stage" ref={stageRef}>
          {owlTarget != null && owlX != null && (
            <span
              className={'subpoly__owl' + (owlReady ? ' subpoly__owl--ready' : '')}
              style={{ transform: `translateX(${owlX}px)` }}
              aria-hidden="true"
            >
              <span key={hopSeq} className="subpoly__owlhop">
                <span className="subpoly__owlbody">
                  <Owl />
                </span>
              </span>
            </span>
          )}

          <div className="eq eq--readonly ointro__eq subpoly__eq">
            {tokens.map((t) => {
              const cls =
                'token token--static' +
                (t.kind === 'op' ? ' token--op' : '') +
                (t.kind === 'paren' ? ' token--paren' : '') +
                (t.tone === 'x2' ? ' subpoly__tok--x2' : '') +
                (t.tone === 'x' ? ' subpoly__tok--x' : '') +
                ((t.id === 'm1' || t.id === 'm2') ? ' subpoly__tok--flip' : '') +
                (highlight.includes(t.id) ? ' ointro__tok--hot' : '') +
                (popId.includes(t.id) ? ' ointro__tok--pop' : '')
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

      <p key={phase} className="bintro__text ointro__text subpoly__text">
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
