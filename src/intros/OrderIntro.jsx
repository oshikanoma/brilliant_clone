import { useEffect, useState } from 'react'
import Owl from '../components/Owl.jsx'

const OP = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const T = (id, kind, raw) => ({ id, kind, raw })

// Fixed walkthrough expression: 4 × (1 + 1) ^ 2 − 3. Each entry is the token
// list after k reductions have been applied.
const STATES = [
  [
    T('a', 'num', '4'), T('mul', 'op', '*'), T('lp', 'lp', '('), T('p1', 'num', '1'),
    T('pl', 'op', '+'), T('p2', 'num', '1'), T('rp', 'rp', ')'), T('exp', 'op', '^'),
    T('e2', 'num', '2'), T('min', 'op', '-'), T('m3', 'num', '3'),
  ],
  [
    T('a', 'num', '4'), T('mul', 'op', '*'), T('r1', 'num', '2'), T('exp', 'op', '^'),
    T('e2', 'num', '2'), T('min', 'op', '-'), T('m3', 'num', '3'),
  ],
  [T('a', 'num', '4'), T('mul', 'op', '*'), T('r2', 'num', '4'), T('min', 'op', '-'), T('m3', 'num', '3')],
  [T('r3', 'num', '16'), T('min', 'op', '-'), T('m3', 'num', '3')],
  [T('r4', 'num', '13')],
]

// One reduction step: the PEMDAS row it belongs to, the tokens it consumes, and
// the id of the resulting number (so it can pop in once the others collapse).
const STEPS = [
  { cat: 'P', highlight: ['lp', 'p1', 'pl', 'p2', 'rp'], newId: 'r1' },
  { cat: 'E', highlight: ['r1', 'exp', 'e2'], newId: 'r2' },
  { cat: 'MD', highlight: ['a', 'mul', 'r2'], newId: 'r3' },
  { cat: 'AS', highlight: ['r3', 'min', 'm3'], newId: 'r4' },
]

const PEMDAS_ROWS = [
  { key: 'P', label: 'P', sub: 'Parentheses' },
  { key: 'E', label: 'E', sub: 'Exponents' },
  { key: 'MD', label: 'MD', sub: 'Multiply / Divide' },
  { key: 'AS', label: 'AS', sub: 'Add / Subtract' },
]

// Which reduction steps run during each phase (text/button stop).
const PHASE_STEPS = [[0], [1, 2], [3]]

const PHASE_TEXT = [
  <>When an expression mixes several operations, you can’t just work left to right — you’d get different answers depending on where you started.</>,
  <>To keep everyone agreeing on one result, math follows a fixed order called <strong>PEMDAS</strong>: Parentheses first, then Exponents, then Multiplication and Division (left to right), and finally Addition and Subtraction (left to right).</>,
  <>Following this order every time is what makes an expression simplify to one correct, predictable answer.</>,
]

// Animated concept intro for Order of Operations. Bruh hops down the PEMDAS
// acronym while the sample expression collapses one step at a time.
export default function OrderIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [applied, setApplied] = useState(0)
  const [doneCats, setDoneCats] = useState([])
  const [owlCat, setOwlCat] = useState(null)
  const [highlight, setHighlight] = useState([])
  const [popId, setPopId] = useState(null)
  const [showNext, setShowNext] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      await wait(450)
      for (const k of PHASE_STEPS[phase]) {
        if (cancelled) return
        setOwlCat(STEPS[k].cat)
        await wait(560)
        if (cancelled) return
        setHighlight(STEPS[k].highlight)
        await wait(900)
        if (cancelled) return
        setHighlight([])
        setApplied(k + 1)
        setDoneCats((d) => (d.includes(STEPS[k].cat) ? d : [...d, STEPS[k].cat]))
        setPopId(STEPS[k].newId)
        await wait(1000)
        if (cancelled) return
        setPopId(null)
        // brief breather so each collapsed equation can be read before the next
        await wait(450)
        if (cancelled) return
      }
      if (!cancelled) setShowNext(true)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [phase])

  const isLast = phase === PHASE_STEPS.length - 1
  const tokens = STATES[applied]

  const handleNext = () => {
    if (isLast) {
      onDone()
      return
    }
    setShowNext(false)
    setPhase((p) => p + 1)
  }

  return (
    <div className="ointro">
      <div className="order__main ointro__board">
        <div className="eq eq--readonly ointro__eq">
          {tokens.map((t) => {
            const text = t.kind === 'op' ? OP[t.raw] : t.raw
            const cls =
              'token token--static' +
              (t.kind === 'op' ? ' token--op' : '') +
              (t.kind === 'lp' || t.kind === 'rp' ? ' token--paren' : '') +
              (highlight.includes(t.id) ? ' ointro__tok--hot' : '') +
              (popId === t.id ? ' ointro__tok--pop' : '')
            return (
              <span key={t.id} className={cls}>
                {text}
              </span>
            )
          })}
        </div>

        <ol className="pemdas ointro__pemdas" aria-label="PEMDAS order">
          {PEMDAS_ROWS.map((row) => {
            const done = doneCats.includes(row.key)
            const active = owlCat === row.key && !done
            const state = done ? 'done' : active ? 'active' : 'pending'
            return (
              <li key={row.key} className={`pemdas__row pemdas__row--${state}`}>
                {owlCat === row.key && (
                  <span className="ointro__owl" aria-hidden="true">
                    <span className="ointro__owlinner">
                      <Owl />
                    </span>
                  </span>
                )}
                <span className="pemdas__key">{done ? '✓' : row.label}</span>
                <span className="pemdas__sub">{row.sub}</span>
              </li>
            )
          })}
        </ol>
      </div>

      <p key={phase} className="bintro__text ointro__text">
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
