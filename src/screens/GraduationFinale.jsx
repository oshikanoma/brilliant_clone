import { useEffect, useMemo, useState } from 'react'
import Owl from '../components/Owl.jsx'
import AvatarOwl from '../components/AvatarOwl.jsx'
import './GraduationFinale.css'

// Confetti colors lean on the app's pastel green/yellow palette with a couple
// of warm party accents mixed in.
const CONFETTI_COLORS = ['#A7DE3C', '#6fa80e', '#f7d94c', '#ffb454', '#7cc6ff', '#ff8fab']

// The celebratory graduation overlay shown by LessonPath once the whole course
// is finished. The beats are sequenced with setTimeout so the avatar walks in,
// Bruh enters, hands over the diploma, speaks, and then the confetti + cap toss
// fire before the closing button unlocks.
//
//   phase 0: nothing yet
//   phase 1: avatar walks to center
//   phase 2: Bruh slides in
//   phase 3: diploma handoff
//   phase 4: speech bubble
//   phase 5: confetti + cap toss
export default function GraduationFinale({ avatar, name, onClose }) {
  const [phase, setPhase] = useState(0)
  const [buttonReady, setButtonReady] = useState(false)

  const trimmedName = (name || '').trim()
  const speech = trimmedName
    ? `Congrats, ${trimmedName} — you've come so far. Can't wait to learn with you next time!`
    : `Congrats — you've come so far. Can't wait to learn with you next time!`

  // Pre-compute confetti pieces once so they don't re-randomize on every render.
  const confetti = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 1.6 + Math.random() * 1.6,
        size: 6 + Math.random() * 7,
        rotate: Math.random() * 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 4 === 0,
      })),
    [],
  )

  useEffect(() => {
    let cancelled = false
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))

    async function run() {
      await wait(250)
      if (cancelled) return
      setPhase(1) // walk in
      await wait(2000)
      if (cancelled) return
      setPhase(2) // Bruh enters
      await wait(950)
      if (cancelled) return
      setPhase(3) // diploma handoff
      await wait(1150)
      if (cancelled) return
      setPhase(4) // speech bubble
      await wait(1100)
      if (cancelled) return
      setPhase(5) // confetti + cap toss
      await wait(650)
      if (cancelled) return
      setButtonReady(true)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      className="grad__overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Course complete"
      onClick={onClose}
    >
      <div className="grad__card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="grad__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        {/* Falling confetti rains over the whole card during the celebration. */}
        {phase >= 5 && (
          <div className="grad__confetti" aria-hidden="true">
            {confetti.map((c, i) => (
              <span
                key={i}
                className={`grad__confetti-piece${c.round ? ' grad__confetti-piece--round' : ''}`}
                style={{
                  left: `${c.left}%`,
                  width: `${c.size}px`,
                  height: `${c.size}px`,
                  background: c.color,
                  animationDelay: `${c.delay}s`,
                  animationDuration: `${c.duration}s`,
                  '--grad-rot': `${c.rotate}deg`,
                }}
              />
            ))}
          </div>
        )}

        <p className="grad__eyebrow">🎓 Graduation Day</p>

        <div className="grad__stage" aria-hidden="true">
          <div className="grad__banner">Class of Algebra</div>
          <div className="grad__bunting">
            <span /><span /><span /><span /><span /><span />
          </div>

          {/* Bruh waits stage-right with the rolled diploma until the handoff. */}
          <div className={`grad__bruh${phase >= 2 ? ' grad__bruh--in' : ''}`}>
            <span className="grad__owl">
              <Owl />
            </span>
          </div>

          {/* The diploma scroll: shows near Bruh, then arcs over to the avatar. */}
          <div
            className={
              'grad__diploma' +
              (phase >= 2 ? ' grad__diploma--show' : '') +
              (phase >= 3 ? ' grad__diploma--handoff' : '')
            }
          >
            <span className="grad__diploma-ribbon" />
            <span className="grad__diploma-roll" />
          </div>

          {/* The user's avatar, wearing a CSS mortarboard, walks to center. */}
          <div className={`grad__walker${phase >= 1 ? ' grad__walker--in' : ''}`}>
            <div className={`grad__walkbob${phase === 1 ? ' is-walking' : ''}`}>
              <span className={`grad__cap${phase >= 5 ? ' grad__cap--toss' : ''}`}>
                <span className="grad__cap-board" />
                <span className="grad__cap-base" />
                <span className="grad__cap-tassel">
                  <span className="grad__cap-bead" />
                </span>
              </span>
              <AvatarOwl avatar={avatar} size={84} />
            </div>
          </div>

          <div className="grad__platform" />

          {/* Bruh's line, popping in once the diploma is delivered. */}
          {phase >= 4 && (
            <div className="grad__speech" role="status" aria-live="polite">
              {speech}
            </div>
          )}
        </div>

        <h2 className="grad__title">You did it!</h2>
        <p className="grad__caption">
          Every lesson, every streak, every tricky problem — it all led here.
          You&apos;ve completed the whole course.
        </p>

        <button
          type="button"
          className="btn grad__btn"
          onClick={onClose}
          disabled={!buttonReady}
        >
          Thank you, Bruh!
        </button>
      </div>
    </div>
  )
}
