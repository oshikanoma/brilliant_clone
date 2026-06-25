import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from './Owl.jsx'
import './ProductQuotientPowersIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const PHASE_TEXT = [
  <>
    Meet <strong>(2x)³</strong>. The whole thing inside the parentheses is being raised to a
    power. The key idea: the power <strong>lands on every factor inside</strong>.
  </>,
  <>
    Hand the exponent to each factor: the <strong>2</strong> and the <strong>x</strong> each get
    a power of 3. So <strong>(2x)³ = 2³x³</strong>.
  </>,
  <>
    Now just evaluate the number part: <strong>2³ = 8</strong>, which leaves the tidy{' '}
    <strong>8x³</strong>.
  </>,
  <>
    Quotients work the same way. For <strong>(x/y)²</strong>, the power drops onto the top and
    the bottom: <strong>x²/y²</strong>.
  </>,
]

// Animated concept intro for Powers of Products & Quotients. Bruh hops onto the
// outer exponent and it distributes onto every factor: (2x)³ → 2³x³ → 8x³, then
// a second example shows (x/y)² → x²/y².
export default function ProductQuotientPowersIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [stateKey, setStateKey] = useState('prod')
  const [owlTarget, setOwlTarget] = useState(null)
  const [hopSeq, setHopSeq] = useState(0)
  const [highlight, setHighlight] = useState([])
  const [popId, setPopId] = useState(null)
  const [showNext, setShowNext] = useState(false)

  const stageRef = useRef(null)
  const tokenRefs = useRef({})
  const [owlX, setOwlX] = useState(null)
  const [owlY, setOwlY] = useState(null)
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
        hopTo('oe')
        await wait(640)
        if (cancelled) return
        setHighlight(['oe'])
        await wait(520)
        if (cancelled) return
        setHighlight(['c', 'xv'])
        await wait(620)
        if (cancelled) return
        setHighlight([])
        setStateKey('dist')
        setPopId('dist')
        await wait(950)
        if (cancelled) return
        setPopId(null)
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 2) {
        hopTo('ce')
        await wait(640)
        if (cancelled) return
        setHighlight(['c', 'ce'])
        await wait(620)
        if (cancelled) return
        setHighlight([])
        setStateKey('eval')
        setPopId('e8')
        await wait(950)
        if (cancelled) return
        setPopId(null)
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 3) {
        setStateKey('quot')
        await wait(700)
        if (cancelled) return
        hopTo('qoe')
        await wait(640)
        if (cancelled) return
        setHighlight(['qoe'])
        await wait(520)
        if (cancelled) return
        setHighlight(['qn', 'qd'])
        await wait(620)
        if (cancelled) return
        setHighlight([])
        setStateKey('quotdist')
        setPopId('qdist')
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

  // Measure the target token's center relative to the stage and slide Bruh onto
  // it (both axes, since the quotient example sits taller than the product row).
  useLayoutEffect(() => {
    const stage = stageRef.current
    const target = owlTarget && tokenRefs.current[owlTarget]
    if (!stage || !target) return
    const measure = () => {
      const base = stage.getBoundingClientRect()
      const r = target.getBoundingClientRect()
      setOwlX(r.left - base.left + r.width / 2)
      setOwlY(r.top - base.top + r.height / 2)
      setOwlReady(true)
    }
    measure()
    const raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [owlTarget, stateKey, hopSeq])

  const isLast = phase === PHASE_TEXT.length - 1

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

  const cls = (id, baseCls) =>
    baseCls +
    (highlight.includes(id) ? ' ointro__tok--hot' : '') +
    (popId === id ? ' ointro__tok--pop' : '')

  const setTokRef = (id) => (el) => {
    if (el) tokenRefs.current[id] = el
    else delete tokenRefs.current[id]
  }

  const Tok = ({ id, kind, children }) => (
    <span
      ref={setTokRef(id)}
      className={cls(
        id,
        'token token--static pqp__tok' +
          (kind === 'op' ? ' token--op' : '') +
          (kind === 'exp' ? ' pqp__exp' : ''),
      )}
    >
      {children}
    </span>
  )

  const renderBoard = () => {
    if (stateKey === 'prod') {
      return (
        <div className="eq eq--readonly ointro__eq pqp__eq">
          <Tok id="lp" kind="op">(</Tok>
          <Tok id="c">2</Tok>
          <Tok id="xv">x</Tok>
          <Tok id="rp" kind="op">)</Tok>
          <Tok id="oe" kind="exp">³</Tok>
        </div>
      )
    }
    if (stateKey === 'dist') {
      return (
        <div className={'eq eq--readonly ointro__eq pqp__eq' + (popId === 'dist' ? ' ointro__tok--pop' : '')}>
          <Tok id="c">2</Tok>
          <Tok id="ce" kind="exp">³</Tok>
          <Tok id="xv">x</Tok>
          <Tok id="xe" kind="exp">³</Tok>
        </div>
      )
    }
    if (stateKey === 'eval') {
      return (
        <div className="eq eq--readonly ointro__eq pqp__eq">
          <Tok id="e8">8</Tok>
          <Tok id="xv">x</Tok>
          <Tok id="xe" kind="exp">³</Tok>
        </div>
      )
    }
    // quotient examples render as a fraction with an outer exponent
    const distributed = stateKey === 'quotdist'
    return (
      <div className={'pqp__quot' + (distributed && popId === 'qdist' ? ' ointro__tok--pop' : '')}>
        <span className="pqp__paren">(</span>
        <span className="pqp__frac">
          <span className="pqp__row">
            <Tok id="qn">x</Tok>
            {distributed && <Tok id="qne" kind="exp">²</Tok>}
          </span>
          <span className="pqp__bar" />
          <span className="pqp__row">
            <Tok id="qd">y</Tok>
            {distributed && <Tok id="qde" kind="exp">²</Tok>}
          </span>
        </span>
        <span className="pqp__paren">)</span>
        {!distributed && <Tok id="qoe" kind="exp">²</Tok>}
      </div>
    )
  }

  return (
    <div className="ointro pqp">
      <div className="ointro__board pqp__board">
        <div className="pqp__stage" ref={stageRef}>
          {owlTarget != null && owlX != null && (
            <span
              className={'pqp__owl' + (owlReady ? ' pqp__owl--ready' : '')}
              style={{ transform: `translate(${owlX}px, ${owlY}px)` }}
              aria-hidden="true"
            >
              <span key={hopSeq} className="pqp__owlhop">
                <span className="pqp__owlbody">
                  <Owl />
                </span>
              </span>
            </span>
          )}

          {renderBoard()}
        </div>
      </div>

      <p key={phase} className="bintro__text ointro__text pqp__text">
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
