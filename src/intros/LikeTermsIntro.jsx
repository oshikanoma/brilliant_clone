import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Owl from '../components/Owl.jsx'
import './LikeTermsIntro.css'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// term/op token builders. `sup` renders as a superscript (e.g. x²).
const tk = (id, main, sup) => ({ id, kind: 'term', main, sup })
const op = (id) => ({ id, kind: 'op', main: '+' })

// Each phase walks Bruh from one like-term onto its match, then collapses them
// into a single combined term. `startId` is where the owl sits, `targetId` is
// the surviving term it hops onto, `removeId` is the matching term that vanishes.
const PHASES = [
  {
    initial: [tk('a', '2x'), op('o1'), tk('b', '4'), op('o2'), tk('c', 'x')],
    final: [tk('a', '3x'), op('o1'), tk('b', '4')],
    startId: 'c',
    targetId: 'a',
    removeId: 'c',
    text: (
      <>
        Terms with the <strong>same variable</strong> add together:{' '}
        <strong>2x + x = 3x</strong>. The constant <strong>4</strong> has no like
        term, so it just stays put — leaving <strong>3x + 4</strong>.
      </>
    ),
  },
  {
    initial: [tk('a', '5z'), op('o1'), tk('b', '3'), op('o2'), tk('c', '2z')],
    final: [tk('a', '7z'), op('o1'), tk('b', '3')],
    startId: 'c',
    targetId: 'a',
    removeId: 'c',
    text: (
      <>
        The same rule works for <strong>any</strong> variable. Here the z-terms
        are alike, so <strong>5z + 2z = 7z</strong> — giving <strong>7z + 3</strong>.
      </>
    ),
  },
  {
    initial: [tk('a', 'x', '2'), op('o1'), tk('b', '8'), op('o2'), tk('c', '3x', '2')],
    final: [tk('a', '4x', '2'), op('o1'), tk('b', '8')],
    startId: 'c',
    targetId: 'a',
    removeId: 'c',
    text: (
      <>
        Like terms must share the same variable <strong>and</strong> the same
        power — <strong>x²</strong> only combines with <strong>x²</strong>. Add
        their coefficients (<strong>x² + 3x² = 4x²</strong>) and you’re done. The
        idea holds across any letter or power.
      </>
    ),
  },
]

// Animated concept intro for Combining Like Terms. Bruh hops between matching
// terms in the equation and they pop together into one combined term.
export default function LikeTermsIntro({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [tokens, setTokens] = useState(PHASES[0].initial)
  const [owlId, setOwlId] = useState(PHASES[0].startId)
  const [owlLeft, setOwlLeft] = useState(null)
  const [hopKey, setHopKey] = useState(0)
  const [highlight, setHighlight] = useState([])
  const [popId, setPopId] = useState(null)
  const [showNext, setShowNext] = useState(false)

  const [tick, setTick] = useState(0)

  const boardRef = useRef(null)
  const tokRefs = useRef({})

  // Measure the owl's current target token center (relative to the board) so the
  // owl can be absolutely positioned above it and slide between targets.
  useLayoutEffect(() => {
    const board = boardRef.current
    if (!board) return
    const base = board.getBoundingClientRect()
    const el = tokRefs.current[owlId]
    if (el) {
      const r = el.getBoundingClientRect()
      setOwlLeft(r.left - base.left + r.width / 2)
    }
  }, [tokens, owlId, tick])

  // Re-measure once web fonts settle and on resize so the owl stays centered.
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    if (document.fonts?.ready) document.fonts.ready.then(bump)
    window.addEventListener('resize', bump)
    return () => window.removeEventListener('resize', bump)
  }, [])

  // Bump the hop key whenever the owl changes targets to retrigger its arc.
  useEffect(() => {
    setHopKey((k) => k + 1)
  }, [owlId])

  useEffect(() => {
    let cancelled = false
    const p = PHASES[phase]
    setTokens(p.initial)
    setOwlId(p.startId)
    setHighlight([])
    setPopId(null)
    setShowNext(false)

    async function run() {
      await wait(800)
      if (cancelled) return
      // Hop onto the surviving like-term.
      setOwlId(p.targetId)
      await wait(680)
      if (cancelled) return
      // Both like-terms light up.
      setHighlight([p.targetId, p.removeId])
      await wait(900)
      if (cancelled) return
      // Collapse: the match vanishes and the survivor pops into its combined form.
      setTokens(p.final)
      setHighlight([])
      setPopId(p.targetId)
      await wait(1000)
      if (cancelled) return
      setPopId(null)
      await wait(350)
      if (cancelled) return
      setShowNext(true)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [phase])

  const isLast = phase === PHASES.length - 1

  const handleNext = () => {
    if (isLast) {
      onDone()
      return
    }
    setShowNext(false)
    setPhase((ph) => ph + 1)
  }

  return (
    <div className="ointro">
      <div className="ointro__board liintro__board" ref={boardRef}>
        {owlLeft != null && (
          <span className="liintro__owl" style={{ left: `${owlLeft}px` }} aria-hidden="true">
            <span className="liintro__owlhop" key={hopKey}>
              <span className="ointro__owlinner liintro__owlinner">
                <Owl />
              </span>
            </span>
          </span>
        )}

        <div className="eq eq--readonly ointro__eq liintro__eq">
          {tokens.map((t) => {
            const cls =
              'token token--static' +
              (t.kind === 'op' ? ' token--op' : '') +
              (highlight.includes(t.id) ? ' ointro__tok--hot' : '') +
              (popId === t.id ? ' ointro__tok--pop' : '')
            return (
              <span key={t.id} ref={(el) => (tokRefs.current[t.id] = el)} className={cls}>
                {t.main}
                {t.sup ? <sup>{t.sup}</sup> : null}
              </span>
            )
          })}
        </div>
      </div>

      <p key={phase} className="bintro__text ointro__text">
        {PHASES[phase].text}
      </p>

      {showNext && (
        <button className="btn bintro__btn" onClick={handleNext}>
          {isLast ? 'Start →' : 'Next →'}
        </button>
      )}
    </div>
  )
}
