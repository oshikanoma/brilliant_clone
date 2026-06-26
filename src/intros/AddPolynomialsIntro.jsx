import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from '../components/Owl.jsx'
import './AddPolynomialsIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// tone codes the "like term family" so matching terms share a color: x² with x²,
// x with x. Ops/parens carry no tone.
const T = (id, kind, raw, tone = null) => ({ id, kind, raw, tone })

// Token list after each transformation. Ids stay stable across states so a slot
// keeps its position while its contents pop/change.
const STATES = {
  // 2x² + 3x  +  x² + 5x
  expr: [
    T('a', 'num', '2x²', 'x2'),
    T('p1', 'op', '+'),
    T('b', 'num', '3x', 'x'),
    T('plus', 'op', '+'),
    T('c', 'num', 'x²', 'x2'),
    T('p2', 'op', '+'),
    T('d', 'num', '5x', 'x'),
  ],
  // 3x²  +  3x + 5x  (x² terms combined)
  x2done: [
    T('s2', 'num', '3x²', 'x2'),
    T('plus', 'op', '+'),
    T('b', 'num', '3x', 'x'),
    T('p2', 'op', '+'),
    T('d', 'num', '5x', 'x'),
  ],
  // 3x² + 8x
  final: [
    T('s2', 'num', '3x²', 'x2'),
    T('plus', 'op', '+'),
    T('s1', 'num', '8x', 'x'),
  ],
}

const PHASE_TEXT = [
  <>
    Meet two polynomials: <strong>(2x² + 3x)</strong> and <strong>(x² + 5x)</strong>. To
    add them we drop the parentheses and hunt for <strong>like terms</strong> — terms
    that share the exact same variable <em>and</em> exponent.
  </>,
  <>
    First the <strong>x²</strong> family. Only x² combines with x², so{' '}
    <strong>2x² + x² = 3x²</strong>. We add the coefficients and keep the exponent
    untouched.
  </>,
  <>
    Now the <strong>x</strong> family: <strong>3x + 5x = 8x</strong>. Different families
    never merge, so the answer is <strong>3x² + 8x</strong>.
  </>,
]

// Animated concept intro for Adding Polynomials. Bruh hops onto matching like
// terms and they pop together into a single combined term.
export default function AddPolynomialsIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [stateKey, setStateKey] = useState('expr')
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
        // Combine the x² family: 2x² + x² -> 3x²
        hopTo('a')
        await wait(620)
        if (cancelled) return
        setHighlight(['a', 'c'])
        await wait(680)
        if (cancelled) return
        setHighlight([])
        setStateKey('x2done')
        setPopId('s2')
        await wait(950)
        if (cancelled) return
        setPopId(null)
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 2) {
        // Combine the x family: 3x + 5x -> 8x
        hopTo('b')
        await wait(620)
        if (cancelled) return
        setHighlight(['b', 'd'])
        await wait(680)
        if (cancelled) return
        setHighlight([])
        setStateKey('final')
        setPopId('s1')
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
    setPopId(null)
    setPhase((p) => p + 1)
  }

  return (
    <div className="ointro addpoly">
      <div className="ointro__board addpoly__board">
        <div className="addpoly__legend" aria-hidden="true">
          <span className="addpoly__chip addpoly__chip--x2">x² terms</span>
          <span className="addpoly__chip addpoly__chip--x">x terms</span>
        </div>

        <div className="addpoly__stage" ref={stageRef}>
          {owlTarget != null && owlX != null && (
            <span
              className={'addpoly__owl' + (owlReady ? ' addpoly__owl--ready' : '')}
              style={{ transform: `translateX(${owlX}px)` }}
              aria-hidden="true"
            >
              <span key={hopSeq} className="addpoly__owlhop">
                <span className="addpoly__owlbody">
                  <Owl />
                </span>
              </span>
            </span>
          )}

          <div className="eq eq--readonly ointro__eq addpoly__eq">
            {tokens.map((t) => {
              const cls =
                'token token--static' +
                (t.kind === 'op' ? ' token--op' : '') +
                (t.tone === 'x2' ? ' addpoly__tok--x2' : '') +
                (t.tone === 'x' ? ' addpoly__tok--x' : '') +
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

      <p key={phase} className="bintro__text ointro__text addpoly__text">
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
