import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from './Owl.jsx'
import './DividePowersIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const PHASE_TEXT = [
  <>
    Meet <strong>x⁷ / x²</strong>. The <strong>same base</strong> sits on top and on the
    bottom of this <strong>quotient</strong>. When that happens, there's a shortcut instead
    of writing everything out.
  </>,
  <>
    Watch the exponents. Same base in a quotient → <strong>subtract</strong> the
    exponents: <strong>7 − 2</strong>. Bruh checks the top power, then the bottom power.
  </>,
  <>
    So <strong>7 − 2 = 5</strong>, and the whole fraction collapses into a single{' '}
    <strong>x⁵</strong>. Dividing same-base powers always subtracts the exponents.
  </>,
]

// Animated concept intro for Dividing Powers. The fraction x⁷ / x² is shown,
// Bruh hops onto the top and bottom exponents, then the quotient collapses to x⁵.
export default function DividePowersIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [stateKey, setStateKey] = useState('frac')
  const [owlTarget, setOwlTarget] = useState(null)
  const [hopSeq, setHopSeq] = useState(0)
  const [highlight, setHighlight] = useState([])
  const [popId, setPopId] = useState(null)
  const [showMinus, setShowMinus] = useState(false)
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
        hopTo('ne')
        await wait(640)
        if (cancelled) return
        setHighlight(['ne'])
        await wait(560)
        if (cancelled) return
        hopTo('de')
        await wait(640)
        if (cancelled) return
        setHighlight(['ne', 'de'])
        await wait(560)
        if (cancelled) return
        setShowMinus(true)
        await wait(700)
        if (cancelled) return
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 2) {
        setHighlight(['ne', 'de'])
        await wait(520)
        if (cancelled) return
        setHighlight([])
        setStateKey('result')
        setPopId('res')
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
  // it (both axes so he can reach the top and bottom of the fraction).
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

  const tokenCls = (id, base) =>
    base +
    (highlight.includes(id) ? ' ointro__tok--hot' : '') +
    (popId === id ? ' ointro__tok--pop' : '')

  const setTokRef = (id) => (el) => {
    if (el) tokenRefs.current[id] = el
    else delete tokenRefs.current[id]
  }

  return (
    <div className="ointro dpow">
      <div className="ointro__board dpow__board">
        <div className="dpow__stage" ref={stageRef}>
          {owlTarget != null && owlX != null && (
            <span
              className={'dpow__owl' + (owlReady ? ' dpow__owl--ready' : '')}
              style={{ transform: `translate(${owlX}px, ${owlY}px)` }}
              aria-hidden="true"
            >
              <span key={hopSeq} className="dpow__owlhop">
                <span className="dpow__owlbody">
                  <Owl />
                </span>
              </span>
            </span>
          )}

          {stateKey === 'frac' ? (
            <div className="dpow__frac">
              <div className="dpow__row">
                <span ref={setTokRef('nb')} className="token token--static dpow__tok">
                  x
                </span>
                <span ref={setTokRef('ne')} className={tokenCls('ne', 'token token--static dpow__exp')}>
                  ⁷
                </span>
              </div>
              <div className="dpow__bar" />
              <div className="dpow__row">
                <span ref={setTokRef('db')} className="token token--static dpow__tok">
                  x
                </span>
                <span ref={setTokRef('de')} className={tokenCls('de', 'token token--static dpow__exp')}>
                  ²
                </span>
              </div>
            </div>
          ) : (
            <div className="eq eq--readonly ointro__eq dpow__eq">
              <span ref={setTokRef('res')} className={tokenCls('res', 'token token--static dpow__tok')}>
                x⁵
              </span>
            </div>
          )}

          <span className={'dpow__sub' + (showMinus ? ' dpow__sub--on' : '')} aria-hidden={!showMinus}>
            7 − 2
          </span>
        </div>
      </div>

      <p key={phase} className="bintro__text ointro__text dpow__text">
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
