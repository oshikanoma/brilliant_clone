import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from '../components/Owl.jsx'
import './MultiplyPolynomialsIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// The two binomial factors, laid out as stable tokens so Bruh can hop onto the
// individual terms (`a1`,`a2` from the first factor, `b1`,`b2` from the second).
const FACTOR_TOKENS = [
  { id: 'lp1', kind: 'paren', raw: '(' },
  { id: 'a1', kind: 'var', raw: 'x' },
  { id: 'fop1', kind: 'op', raw: '+' },
  { id: 'a2', kind: 'num', raw: '2' },
  { id: 'rp1', kind: 'paren', raw: ')' },
  { id: 'lp2', kind: 'paren', raw: '(' },
  { id: 'b1', kind: 'var', raw: 'x' },
  { id: 'fop2', kind: 'op', raw: '+' },
  { id: 'b2', kind: 'num', raw: '3' },
  { id: 'rp2', kind: 'paren', raw: ')' },
]

// FOIL: each product pairs one term from each factor. Bruh hops onto the lead
// term, both factor terms light up, then the product pops into the row below.
const PRODUCTS = [
  { id: 'p1', label: 'First', factors: ['a1', 'b1'], hop: 'a1', text: 'x²' },
  { id: 'p2', label: 'Outer', factors: ['a1', 'b2'], hop: 'b2', text: '3x' },
  { id: 'p3', label: 'Inner', factors: ['a2', 'b1'], hop: 'a2', text: '2x' },
  { id: 'p4', label: 'Last', factors: ['a2', 'b2'], hop: 'b2', text: '6' },
]

const PHASE_TEXT = [
  <>
    Meet <strong>(x + 2)(x + 3)</strong>. To multiply two binomials, we hand out
    every term in the first factor to <strong>every</strong> term in the second —
    a pattern nicknamed <strong>FOIL</strong>.
  </>,
  <>
    <strong>F</strong>irst, <strong>O</strong>uter, <strong>I</strong>nner,{' '}
    <strong>L</strong>ast. Bruh visits each pair and writes the four products:{' '}
    <strong>x·x</strong>, <strong>x·3</strong>, <strong>2·x</strong>, and{' '}
    <strong>2·3</strong>.
  </>,
  <>
    Two of those products are <strong>like terms</strong>: 3x + 2x combine into{' '}
    <strong>5x</strong>. Tidy up and the answer is{' '}
    <strong>x² + 5x + 6</strong>.
  </>,
]

// Animated concept intro for Multiplying Polynomials. Bruh hops across the two
// binomials to build the four FOIL products, then merges the like terms.
export default function MultiplyPolynomialsIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [shownCount, setShownCount] = useState(0)
  const [highlight, setHighlight] = useState([])
  const [popId, setPopId] = useState(null)
  const [activeLabel, setActiveLabel] = useState(null)
  const [prodHot, setProdHot] = useState([])
  const [combined, setCombined] = useState(false)
  const [showNext, setShowNext] = useState(false)

  const [owlTarget, setOwlTarget] = useState(null)
  const [hopSeq, setHopSeq] = useState(0)
  const [owlX, setOwlX] = useState(null)
  const [owlReady, setOwlReady] = useState(false)

  const stageRef = useRef(null)
  const tokenRefs = useRef({})

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
        for (let i = 0; i < PRODUCTS.length; i++) {
          const p = PRODUCTS[i]
          hopTo(p.hop)
          await wait(620)
          if (cancelled) return
          setActiveLabel(p.label)
          setHighlight(p.factors)
          await wait(560)
          if (cancelled) return
          setHighlight([])
          setShownCount(i + 1)
          setPopId(p.id)
          await wait(720)
          if (cancelled) return
          setPopId(null)
          await wait(220)
          if (cancelled) return
        }
        setActiveLabel(null)
        if (!cancelled) setShowNext(true)
        return
      }

      if (phase === 2) {
        setShownCount(PRODUCTS.length)
        await wait(300)
        if (cancelled) return
        setProdHot(['p2', 'p3'])
        await wait(820)
        if (cancelled) return
        setProdHot([])
        setCombined(true)
        setPopId('sum')
        await wait(900)
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

  // Measure the target factor token's center relative to the stage and slide
  // Bruh there; the CSS transition turns the move into a hop.
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
  }, [owlTarget, hopSeq])

  const isLast = phase === PHASE_TEXT.length - 1

  const handleNext = () => {
    if (isLast) {
      onDone()
      return
    }
    setShowNext(false)
    setHighlight([])
    setPopId(null)
    setProdHot([])
    setActiveLabel(null)
    setPhase((p) => p + 1)
  }

  return (
    <div className="ointro mulpoly">
      <div className="ointro__board mulpoly__board">
        <div className="mulpoly__stage" ref={stageRef}>
          {owlTarget != null && owlX != null && (
            <span
              className={'mulpoly__owl' + (owlReady ? ' mulpoly__owl--ready' : '')}
              style={{ transform: `translateX(${owlX}px)` }}
              aria-hidden="true"
            >
              <span key={hopSeq} className="mulpoly__owlhop">
                <span className="mulpoly__owlbody">
                  <Owl />
                </span>
              </span>
            </span>
          )}

          <div className="eq eq--readonly ointro__eq mulpoly__eq">
            {FACTOR_TOKENS.map((t) => {
              const cls =
                'token token--static' +
                (t.kind === 'op' ? ' token--op' : '') +
                (t.kind === 'paren' ? ' token--paren' : '') +
                (highlight.includes(t.id) ? ' ointro__tok--hot' : '')
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

        <div className="mulpoly__arrow" aria-hidden="true">
          ↓
        </div>

        <div className="mulpoly__products">
          {!combined ? (
            PRODUCTS.slice(0, shownCount).map((p, i) => (
              <span key={p.id} className="mulpoly__prodgroup">
                {i > 0 && <span className="mulpoly__plus">+</span>}
                <span className="mulpoly__prodslot">
                  <span className="mulpoly__label">{p.label}</span>
                  <span
                    className={
                      'mulpoly__prod' +
                      (popId === p.id ? ' ointro__tok--pop' : '') +
                      (prodHot.includes(p.id) ? ' mulpoly__prod--hot' : '')
                    }
                  >
                    {p.text}
                  </span>
                </span>
              </span>
            ))
          ) : (
            <span className="mulpoly__final">
              <span className="mulpoly__prod">x²</span>
              <span className="mulpoly__plus">+</span>
              <span className={'mulpoly__prod' + (popId === 'sum' ? ' ointro__tok--pop' : '')}>
                5x
              </span>
              <span className="mulpoly__plus">+</span>
              <span className="mulpoly__prod">6</span>
            </span>
          )}
        </div>

        {activeLabel && (
          <div className="mulpoly__hint" key={activeLabel}>
            {activeLabel}
          </div>
        )}
      </div>

      <p key={phase} className="bintro__text ointro__text mulpoly__text">
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
