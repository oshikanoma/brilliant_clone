import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from '../components/Owl.jsx'
import './MultiplyPowersIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Power tokens carry a base + exponent; plain tokens just carry `raw`. Ids stay
// stable across states so a slot keeps its spot while its contents pop/change.
const P = (id, base, exp) => ({ id, kind: 'pow', base, exp })
const O = (id, raw) => ({ id, kind: 'op', raw })

const STATES = {
  expr: [P('a', 'x', '2'), O('op', '·'), P('b', 'x', '3')],
  final: [P('f', 'x', '5')],
  num: [P('na', '2', '3'), O('nop', '·'), P('nb', '2', '2')],
  numFinal: [P('nf', '2', '5')],
  rule: [P('ra', 'x', 'a'), O('rop', '·'), P('rb', 'x', 'b'), O('req', '='), P('rc', 'x', 'a+b')],
}

const PHASE_TEXT = [
  <>
    Meet <strong>x² · x³</strong>. Two powers with the <strong>same base</strong> (both are{' '}
    <strong>x</strong>) multiplied together. There's a shortcut hiding in here.
  </>,
  <>
    <strong>x²</strong> means <strong>x·x</strong> and <strong>x³</strong> means{' '}
    <strong>x·x·x</strong> — that's <strong>x</strong> written <strong>5</strong> times. Same base,
    so we just <strong>add</strong> the exponents: <strong>2 + 3 = 5</strong>.
  </>,
  <>
    It works with numbers too. <strong>2³ · 2²</strong> is <strong>2</strong> multiplied{' '}
    <strong>3 + 2 = 5</strong> times, so it collapses to <strong>2⁵</strong>.
  </>,
  <>
    The rule: <strong>xᵃ · xᵇ = xᵃ⁺ᵇ</strong>. Remember — this only works when the{' '}
    <strong>bases match</strong>. Different bases can't be combined this way.
  </>,
]

// Animated concept intro for Multiply Powers. Bruh hops onto each exponent, then
// the two powers collapse into a single power as the exponents add.
export default function MultiplyPowersIntro({ onDone }) {
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
        hopTo('a-exp')
        await wait(620)
        if (cancelled) return
        setHighlight(['a-exp'])
        await wait(560)
        if (cancelled) return
        hopTo('b-exp')
        await wait(620)
        if (cancelled) return
        setHighlight(['a-exp', 'b-exp'])
        await wait(620)
        if (cancelled) return
        setHighlight([])
        setStateKey('final')
        setPopId('f')
        await wait(950)
        if (cancelled) return
        setPopId(null)
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 2) {
        setStateKey('num')
        await wait(650)
        if (cancelled) return
        hopTo('na-exp')
        await wait(620)
        if (cancelled) return
        setHighlight(['na-exp', 'nb-exp'])
        await wait(680)
        if (cancelled) return
        setHighlight([])
        setStateKey('numFinal')
        setPopId('nf')
        await wait(950)
        if (cancelled) return
        setPopId(null)
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 3) {
        setStateKey('rule')
        await wait(550)
        if (cancelled) return
        setPopId('rc')
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

  const reg = (id) => (el) => {
    if (el) tokenRefs.current[id] = el
    else delete tokenRefs.current[id]
  }
  const hot = (id) => (highlight.includes(id) ? ' ointro__tok--hot' : '')
  const pop = (id) => (popId === id ? ' ointro__tok--pop' : '')

  return (
    <div className="ointro mpow">
      <div className="ointro__board mpow__board">
        <div className="mpow__stage" ref={stageRef}>
          {owlTarget != null && owlX != null && (
            <span
              className={'mpow__owl' + (owlReady ? ' mpow__owl--ready' : '')}
              style={{ transform: `translateX(${owlX}px)` }}
              aria-hidden="true"
            >
              <span key={hopSeq} className="mpow__owlhop">
                <span className="mpow__owlbody">
                  <Owl />
                </span>
              </span>
            </span>
          )}

          <div className="eq eq--readonly ointro__eq mpow__eq">
            {tokens.map((t) => {
              if (t.kind === 'pow') {
                const expId = t.id + '-exp'
                return (
                  <span
                    key={t.id}
                    ref={reg(t.id)}
                    className={'token token--static mpow__pow' + pop(t.id)}
                  >
                    <span className="mpow__base">{t.base}</span>
                    <sup ref={reg(expId)} className={'mpow__exp' + hot(expId)}>
                      {t.exp}
                    </sup>
                  </span>
                )
              }
              return (
                <span
                  key={t.id}
                  ref={reg(t.id)}
                  className={'token token--static token--op mpow__op' + hot(t.id) + pop(t.id)}
                >
                  {t.raw}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <p key={phase} className="bintro__text ointro__text mpow__text">
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
