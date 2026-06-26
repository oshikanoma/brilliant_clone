import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from '../components/Owl.jsx'
import './DistributiveIntro.css'

const OP = { '+': '+', '*': '×' }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const T = (id, kind, raw) => ({ id, kind, raw })

// Each entry is the full token list after k rewrite steps. Unchanged tokens keep
// their id so React (and the owl-position measuring) tracks them across states.
const STATES = [
  // 0: the starting expression  2(x + 3)
  [
    T('m', 'num', '2'), T('lp', 'lp', '('), T('x', 'var', 'x'),
    T('plus', 'op', '+'), T('three', 'num', '3'), T('rp', 'rp', ')'),
  ],
  // 1: distributed  (2 × x) + (2 × 3)
  [
    T('lp2', 'lp', '('), T('a2', 'num', '2'), T('mul1', 'op', '*'), T('x2', 'var', 'x'), T('rp2', 'rp', ')'),
    T('plus2', 'op', '+'),
    T('lp3', 'lp', '('), T('b2', 'num', '2'), T('mul2', 'op', '*'), T('c3', 'num', '3'), T('rp3', 'rp', ')'),
  ],
  // 2: first product collapsed  2x + (2 × 3)
  [
    T('r2x', 'res', '2x'),
    T('plus2', 'op', '+'),
    T('lp3', 'lp', '('), T('b2', 'num', '2'), T('mul2', 'op', '*'), T('c3', 'num', '3'), T('rp3', 'rp', ')'),
  ],
  // 3: fully distributed  2x + 6
  [T('r2x', 'res', '2x'), T('plus2', 'op', '+'), T('r6', 'res', '6')],
]

const PHASE_TEXT = [
  <>
    The <strong>distributive property</strong> means you multiply the number outside the
    parentheses by <em>every</em> term inside — so the <strong>2</strong> hits both the{' '}
    <strong>x</strong> and the <strong>3</strong>.
  </>,
  <>
    Multiply each piece out and combine — that's the fully distributed result:{' '}
    <strong>2(x + 3) = 2x + 6</strong>.
  </>,
]

const PHASE_COUNT = 2

// Animated concept intro for the Distributive Property. Bruh hops along the
// expression, popping the parentheses away as 2(x + 3) expands and boils down
// to 2x + 6.
export default function DistributiveIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [applied, setApplied] = useState(0)
  const [hot, setHot] = useState([])
  const [popIds, setPopIds] = useState([])
  const [owlTarget, setOwlTarget] = useState(null)
  const [owlX, setOwlX] = useState(null)
  const [hopKey, setHopKey] = useState(0)
  const [showNext, setShowNext] = useState(false)

  const boardRef = useRef(null)
  const tokRefs = useRef({})

  // Measure the target token's horizontal center (relative to the board) so the
  // owl can hop directly above it. Re-runs whenever the target or the rendered
  // expression changes, and on resize.
  useLayoutEffect(() => {
    const measure = () => {
      const board = boardRef.current
      const el = owlTarget != null ? tokRefs.current[owlTarget] : null
      if (!board || !el) return
      const b = board.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      setOwlX(r.left - b.left + r.width / 2)
    }
    measure()
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [owlTarget, applied])

  useEffect(() => {
    let cancelled = false
    const hopTo = (id) => {
      setOwlTarget(id)
      setHopKey((k) => k + 1)
    }

    async function runPhase0() {
      await wait(500)
      if (cancelled) return
      // Bounce on the opening paren and pop it.
      hopTo('lp')
      await wait(720)
      if (cancelled) return
      setHot(['lp'])
      await wait(420)
      if (cancelled) return
      setPopIds(['lp'])
      await wait(520)
      if (cancelled) return
      setHot([])
      setPopIds([])
      // Bounce on the closing paren and pop it.
      hopTo('rp')
      await wait(680)
      if (cancelled) return
      setHot(['rp'])
      await wait(420)
      if (cancelled) return
      setPopIds(['rp'])
      await wait(520)
      if (cancelled) return
      setHot([])
      setPopIds([])
      // The outside 2 distributes into both terms.
      hopTo('m')
      await wait(640)
      if (cancelled) return
      setHot(['m'])
      await wait(560)
      if (cancelled) return
      setHot([])
      // Expand to (2 × x) + (2 × 3); the new product copies pop in.
      setApplied(1)
      setPopIds(['lp2', 'a2', 'mul1', 'x2', 'rp2', 'lp3', 'b2', 'mul2', 'c3', 'rp3'])
      hopTo('plus2')
      await wait(1150)
      if (cancelled) return
      setPopIds([])
      if (!cancelled) setShowNext(true)
    }

    async function runPhase1() {
      await wait(450)
      if (cancelled) return
      // Bounce on the first product, collapse (2 × x) -> 2x.
      hopTo('mul1')
      await wait(720)
      if (cancelled) return
      setHot(['lp2', 'a2', 'mul1', 'x2', 'rp2'])
      await wait(720)
      if (cancelled) return
      setHot([])
      setApplied(2)
      setPopIds(['r2x'])
      hopTo('r2x')
      await wait(980)
      if (cancelled) return
      setPopIds([])
      await wait(380)
      if (cancelled) return
      // Bounce on the second product, collapse (2 × 3) -> 6.
      hopTo('mul2')
      await wait(720)
      if (cancelled) return
      setHot(['lp3', 'b2', 'mul2', 'c3', 'rp3'])
      await wait(720)
      if (cancelled) return
      setHot([])
      setApplied(3)
      setPopIds(['r6'])
      hopTo('r6')
      await wait(980)
      if (cancelled) return
      setPopIds([])
      hopTo('plus2')
      await wait(450)
      if (cancelled) return
      if (!cancelled) setShowNext(true)
    }

    if (phase === 0) runPhase0()
    else runPhase1()

    return () => {
      cancelled = true
    }
  }, [phase])

  const isLast = phase === PHASE_COUNT - 1
  const tokens = STATES[applied]
  const owlVisible = owlTarget != null && owlX != null

  const handleNext = () => {
    if (isLast) {
      onDone()
      return
    }
    setShowNext(false)
    setPhase((p) => p + 1)
  }

  return (
    <div className="ointro dintro">
      <div className="dintro__board" ref={boardRef}>
        {owlVisible && (
          <span
            className="dintro__owl"
            style={{ left: `${owlX}px` }}
            aria-hidden="true"
          >
            <span key={hopKey} className="dintro__owlhop">
              <span className="dintro__owlinner">
                <Owl />
              </span>
            </span>
          </span>
        )}

        <div className="eq eq--readonly ointro__eq dintro__eq">
          {tokens.map((t) => {
            const text = t.kind === 'op' ? OP[t.raw] : t.raw
            const cls =
              'token token--static' +
              (t.kind === 'op' ? ' token--op' : '') +
              (t.kind === 'lp' || t.kind === 'rp' ? ' token--paren' : '') +
              (t.kind === 'res' ? ' dintro__tok--res' : '') +
              (hot.includes(t.id) ? ' ointro__tok--hot' : '') +
              (popIds.includes(t.id) ? ' ointro__tok--pop' : '')
            return (
              <span
                key={t.id}
                ref={(el) => {
                  if (el) tokRefs.current[t.id] = el
                  else delete tokRefs.current[t.id]
                }}
                className={cls}
              >
                {text}
              </span>
            )
          })}
        </div>
      </div>

      <p key={phase} className="bintro__text ointro__text dintro__text">
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
