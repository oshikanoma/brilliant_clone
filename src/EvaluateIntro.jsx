import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from './Owl.jsx'
import './EvaluateIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const T = (id, kind, raw) => ({ id, kind, raw })

// Token list after each transformation. Ids are kept stable across states so a
// slot keeps its position while its contents pop/change (e.g. `xv`: x → (5)).
const STATES = {
  expr: [T('c', 'num', '4'), T('xv', 'var', 'x'), T('op', 'op', '+'), T('k', 'num', '2')],
  subbed: [T('c', 'num', '4'), T('xv', 'paren', '(5)'), T('op', 'op', '+'), T('k', 'num', '2')],
  mul: [T('m', 'num', '20'), T('op', 'op', '+'), T('k', 'num', '2')],
  final: [T('f', 'num', '22')],
}

const PHASE_TEXT = [
  <>
    Meet <strong>4x + 2</strong>. We've been solving for <strong>x</strong>… but what if
    we're <strong>given</strong> it? Notice there's no equals sign here, so this is an{' '}
    <strong>expression</strong>, not an equation.
  </>,
  <>
    Now we're told <strong>x = 5</strong>. To <strong>evaluate</strong> the expression, just
    substitute that value in place of the variable — every <strong>x</strong> becomes{' '}
    <strong>(5)</strong>.
  </>,
  <>
    With the value dropped in, follow the order of operations: multiply{' '}
    <strong>4(5) = 20</strong>, then add to get <strong>22</strong>.
  </>,
]

// Animated concept intro for Evaluating Expressions. Bruh hops onto tokens to
// substitute the given value, then bounces along as the expression evaluates.
export default function EvaluateIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [stateKey, setStateKey] = useState('expr')
  const [showGiven, setShowGiven] = useState(false)
  const [owlTarget, setOwlTarget] = useState(null)
  const [hopSeq, setHopSeq] = useState(0)
  const [highlight, setHighlight] = useState([])
  const [popId, setPopId] = useState(null)
  const [showNext, setShowNext] = useState(false)

  const stageRef = useRef(null)
  const tokenRefs = useRef({})
  const [owlX, setOwlX] = useState(null)
  const [owlReady, setOwlReady] = useState(false)

  // Send Bruh to a token: remember the target and bump the hop counter so the
  // arc animation replays even when hopping in place.
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
        setShowGiven(true)
        await wait(700)
        if (cancelled) return
        hopTo('xv')
        await wait(620)
        if (cancelled) return
        setHighlight(['xv'])
        await wait(520)
        if (cancelled) return
        setHighlight([])
        setStateKey('subbed')
        setPopId('xv')
        await wait(900)
        if (cancelled) return
        setPopId(null)
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 2) {
        // Step 1: 4(5) → 20
        hopTo('c')
        await wait(620)
        if (cancelled) return
        setHighlight(['c', 'xv'])
        await wait(620)
        if (cancelled) return
        setHighlight([])
        setStateKey('mul')
        setPopId('m')
        await wait(950)
        if (cancelled) return
        setPopId(null)
        await wait(450)
        if (cancelled) return
        // Step 2: 20 + 2 → 22
        hopTo('m')
        await wait(620)
        if (cancelled) return
        setHighlight(['m', 'op', 'k'])
        await wait(620)
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

  // Measure the target token's center relative to the owl's offset parent (the
  // stage) and slide Bruh there; the CSS transition turns the move into a hop.
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
    <div className="ointro eintro">
      <div className="ointro__board eintro__board">
        <div className={'eintro__given' + (showGiven ? ' eintro__given--on' : '')} aria-hidden={!showGiven}>
          <span className="eintro__given-label">given</span>
          <span className="eintro__given-eq">
            x = <strong>5</strong>
          </span>
        </div>

        <div className="eintro__stage" ref={stageRef}>
          {owlTarget != null && owlX != null && (
            <span
              className={'eintro__owl' + (owlReady ? ' eintro__owl--ready' : '')}
              style={{ transform: `translateX(${owlX}px)` }}
              aria-hidden="true"
            >
              <span key={hopSeq} className="eintro__owlhop">
                <span className="eintro__owlbody">
                  <Owl />
                </span>
              </span>
            </span>
          )}

          <div className="eq eq--readonly ointro__eq eintro__eq">
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

      <p key={phase} className="bintro__text ointro__text eintro__text">
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
