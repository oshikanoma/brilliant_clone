import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from './Owl.jsx'
import './ZeroNegExponentsIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const PHASE_TEXT = [
  <>
    Meet <strong>5⁰</strong>. A zero exponent looks strange — what could a base "to the zero
    power" even mean? Think about a quotient like <strong>x³ / x³</strong>: subtracting the
    exponents gives <strong>x⁰</strong>.
  </>,
  <>
    But <strong>x³ / x³</strong> is just something divided by itself, which is{' '}
    <strong>1</strong>. So any nonzero base to the zero power equals <strong>1</strong>:{' '}
    <strong>5⁰ = 1</strong>.
  </>,
  <>
    Now a <strong>negative</strong> exponent. It doesn't make a number negative — it{' '}
    <strong>flips the factor to the denominator</strong>. So <strong>x⁻² = 1/x²</strong>.
  </>,
]

// Animated concept intro for Zero & Negative Exponents. Phase 1: 5⁰ pops to 1.
// Phase 2: x⁻² flips down into the denominator as 1/x².
export default function ZeroNegExponentsIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [stateKey, setStateKey] = useState('zero')
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
        hopTo('ze')
        await wait(640)
        if (cancelled) return
        setHighlight(['zb', 'ze'])
        await wait(560)
        if (cancelled) return
        setHighlight([])
        setStateKey('one')
        setPopId('one')
        await wait(950)
        if (cancelled) return
        setPopId(null)
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 2) {
        setStateKey('neg')
        await wait(700)
        if (cancelled) return
        hopTo('ne')
        await wait(640)
        if (cancelled) return
        setHighlight(['nb', 'ne'])
        await wait(560)
        if (cancelled) return
        setHighlight([])
        setStateKey('recip')
        setPopId('recip')
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
  // it (both axes, since the reciprocal example is taller than a single row).
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

  const renderBoard = () => {
    if (stateKey === 'zero') {
      return (
        <div className="eq eq--readonly ointro__eq zne__eq">
          <span ref={setTokRef('zb')} className={cls('zb', 'token token--static zne__tok')}>
            5
          </span>
          <span ref={setTokRef('ze')} className={cls('ze', 'token token--static zne__exp')}>
            ⁰
          </span>
        </div>
      )
    }
    if (stateKey === 'one') {
      return (
        <div className="eq eq--readonly ointro__eq zne__eq">
          <span ref={setTokRef('one')} className={cls('one', 'token token--static zne__tok')}>
            1
          </span>
        </div>
      )
    }
    if (stateKey === 'neg') {
      return (
        <div className="eq eq--readonly ointro__eq zne__eq">
          <span ref={setTokRef('nb')} className={cls('nb', 'token token--static zne__tok')}>
            x
          </span>
          <span ref={setTokRef('ne')} className={cls('ne', 'token token--static zne__exp')}>
            ⁻²
          </span>
        </div>
      )
    }
    // reciprocal: 1 / x²
    return (
      <div className={'zne__frac' + (popId === 'recip' ? ' ointro__tok--pop' : '')}>
        <span ref={setTokRef('recip')} className="token token--static zne__tok">
          1
        </span>
        <span className="zne__bar" />
        <span className="zne__row">
          <span className="token token--static zne__tok">x</span>
          <span className="token token--static zne__exp">²</span>
        </span>
      </div>
    )
  }

  return (
    <div className="ointro zne">
      <div className="ointro__board zne__board">
        <div className="zne__stage" ref={stageRef}>
          {owlTarget != null && owlX != null && (
            <span
              className={'zne__owl' + (owlReady ? ' zne__owl--ready' : '')}
              style={{ transform: `translate(${owlX}px, ${owlY}px)` }}
              aria-hidden="true"
            >
              <span key={hopSeq} className="zne__owlhop">
                <span className="zne__owlbody">
                  <Owl />
                </span>
              </span>
            </span>
          )}

          {renderBoard()}
        </div>
      </div>

      <p key={phase} className="bintro__text ointro__text zne__text">
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
