import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from '../components/Owl.jsx'
import './PowersOfPowersIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// pow: base + raised exponent. op: a plain symbol. sup: a standalone exponent
// (the outer power). Ids stay stable across states so slots keep their spots.
const P = (id, base, exp) => ({ id, kind: 'pow', base, exp })
const O = (id, raw) => ({ id, kind: 'op', raw })
const S = (id, raw) => ({ id, kind: 'sup', raw })

const STATES = {
  expr: [O('lp', '('), P('a', 'x', '2'), O('rp', ')'), S('o', '3')],
  expand: [P('e1', 'x', '2'), O('d1', '·'), P('e2', 'x', '2'), O('d2', '·'), P('e3', 'x', '2')],
  final: [P('f', 'x', '6')],
  rule: [
    O('lp2', '('),
    P('ra', 'x', 'a'),
    O('rp2', ')'),
    S('rb', 'b'),
    O('req', '='),
    P('rc', 'x', 'a·b'),
  ],
}

const PHASE_TEXT = [
  <>
    Meet <strong>(x²)³</strong>. This is a power <strong>raised to another power</strong>. The{' '}
    <strong>3</strong> on the outside tells us how many times to use what's inside.
  </>,
  <>
    The outer <strong>3</strong> means we multiply <strong>x²</strong> by itself{' '}
    <strong>3 times</strong>: <strong>x² · x² · x²</strong>. Watch it unfold.
  </>,
  <>
    Now multiplying powers, we <strong>add</strong> those exponents: <strong>2 + 2 + 2 = 6</strong>.
    That's the same as <strong>2 · 3</strong> — so for a power of a power, just{' '}
    <strong>multiply</strong> the exponents.
  </>,
  <>
    The rule: <strong>(xᵃ)ᵇ = xᵃᵇ</strong> — <strong>multiply</strong>. Don't mix it up with{' '}
    <strong>xᵃ · xᵇ = xᵃ⁺ᵇ</strong>, where you <strong>add</strong>. Power of a power → multiply.
  </>,
]

// Animated concept intro for Powers of Powers. Bruh bounces on the outer
// exponent; the expression expands into repeated multiplication, then collapses
// to a single power as the exponents multiply.
export default function PowersOfPowersIntro({ onDone }) {
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
        hopTo('o')
        await wait(620)
        if (cancelled) return
        setHighlight(['o'])
        await wait(680)
        if (cancelled) return
        setHighlight([])
        setStateKey('expand')
        setPopId('e2')
        await wait(950)
        if (cancelled) return
        setPopId(null)
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 2) {
        hopTo('e1-exp')
        await wait(620)
        if (cancelled) return
        setHighlight(['e1-exp', 'e2-exp', 'e3-exp'])
        await wait(720)
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
    <div className="ointro ppow">
      <div className="ointro__board ppow__board">
        <div className="ppow__stage" ref={stageRef}>
          {owlTarget != null && owlX != null && (
            <span
              className={'ppow__owl' + (owlReady ? ' ppow__owl--ready' : '')}
              style={{ transform: `translateX(${owlX}px)` }}
              aria-hidden="true"
            >
              <span key={hopSeq} className="ppow__owlhop">
                <span className="ppow__owlbody">
                  <Owl />
                </span>
              </span>
            </span>
          )}

          <div className="eq eq--readonly ointro__eq ppow__eq">
            {tokens.map((t) => {
              if (t.kind === 'pow') {
                const expId = t.id + '-exp'
                return (
                  <span
                    key={t.id}
                    ref={reg(t.id)}
                    className={'token token--static ppow__pow' + pop(t.id)}
                  >
                    <span className="ppow__base">{t.base}</span>
                    <sup ref={reg(expId)} className={'ppow__exp' + hot(expId)}>
                      {t.exp}
                    </sup>
                  </span>
                )
              }
              if (t.kind === 'sup') {
                return (
                  <sup
                    key={t.id}
                    ref={reg(t.id)}
                    className={'token token--static ppow__outer' + hot(t.id) + pop(t.id)}
                  >
                    {t.raw}
                  </sup>
                )
              }
              return (
                <span
                  key={t.id}
                  ref={reg(t.id)}
                  className={'token token--static ppow__op' + hot(t.id) + pop(t.id)}
                >
                  {t.raw}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <p key={phase} className="bintro__text ointro__text ppow__text">
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
