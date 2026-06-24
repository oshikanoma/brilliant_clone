import { useLayoutEffect, useRef, useState } from 'react'
import Owl from './Owl.jsx'

const CHECKPOINTS = [
  'Solving Equations',
  'Order of Operations',
  'Combining Like Terms',
  'Distributive Property',
  'Evaluating Expressions',
  'Graphs and Linear Relationships',
]

// Serpentine offsets so the trail winds wider left/right as it descends.
const OFFSETS = ['-34%', '34%', '-34%', '34%', '-34%', '34%']

// Little foliage tucked beside each checkpoint, varied so it feels scattered.
const DECOR = [
  { leaf: '🌿', flower: '🌸' },
  { leaf: '🍃', flower: '🌼' },
  { leaf: '🌱', flower: '🌷' },
  { leaf: '🍃', flower: '🌻' },
  { leaf: '🌿', flower: '🌸' },
  { leaf: '🌱', flower: '🌼' },
]

export default function LessonPath({
  name,
  streak = 0,
  onStart,
  unlocked = 1,
  completed = {},
  finished = false,
  onDismissFinale,
  onTestSkills,
}) {
  const [selected, setSelected] = useState(null)
  const trailRef = useRef(null)
  const dotRefs = useRef([])
  const [points, setPoints] = useState([])

  // Measure each checkpoint's center so we can draw a dotted line that hops
  // from one checkpoint to the next, following the winding path.
  useLayoutEffect(() => {
    const measure = () => {
      const trail = trailRef.current
      if (!trail) return
      const base = trail.getBoundingClientRect()
      const pts = dotRefs.current.filter(Boolean).map((el) => {
        const r = el.getBoundingClientRect()
        return {
          x: r.left - base.left + r.width / 2,
          y: r.top - base.top + r.height / 2,
        }
      })
      setPoints(pts)
    }
    measure()
    // Re-measure after paint / web font load so segments line up exactly.
    const raf = requestAnimationFrame(measure)
    const t = setTimeout(measure, 400)
    window.addEventListener('resize', measure)
    if (document.fonts?.ready) document.fonts.ready.then(measure)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      window.removeEventListener('resize', measure)
    }
  }, [unlocked, completed])

  return (
    <div className="path">
      <aside className="infocard" aria-label="About this track">
        <span className="infocard__eyebrow">You’re learning</span>
        <h2 className="infocard__title">Algebra</h2>
        <p className="infocard__caption">
          Learn to wield the essential tools of math, from balancing equations
          to graphing lines, one checkpoint at a time.
        </p>
        <ul className="infocard__list">
          <li>Build intuition with hands-on puzzles</li>
          <li>Master one concept before the next unlocks</li>
          <li>Track your progress along the path</li>
        </ul>
      </aside>

      <header className="path__header">
        <p className="path__eyebrow">Learning Algebra</p>
        <h1 className="path__title">Algebra Foundations</h1>
        {name && <p className="path__greeting">Let’s go, {name} 👋</p>}
        {streak > 0 && (
          <p className="path__streak" aria-label={`${streak} day login streak`}>
            🏆 {streak}-day streak
          </p>
        )}
      </header>

      <div className="trail" ref={trailRef}>
        <svg className="trail__lines" aria-hidden="true">
          {points.length > 1 && (
            <polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} />
          )}
        </svg>

        {CHECKPOINTS.map((label, i) => {
          const isUnlocked = i < unlocked
          const isCompleted = !!completed[i]
          const isSelected = selected === i
          return (
            <div
              className="trail__row"
              key={label}
              style={{ transform: `translateX(${OFFSETS[i]})` }}
            >
              <span className="trail__leaf" aria-hidden="true">
                {DECOR[i].leaf}
              </span>
              <span className="trail__flower" aria-hidden="true">
                {DECOR[i].flower}
              </span>
              <span className="checkpoint-stage">
                {isSelected && (
                  <span className="owl" aria-hidden="true">
                    <Owl />
                  </span>
                )}
                <button
                  type="button"
                  ref={(el) => (dotRefs.current[i] = el)}
                  className={
                    'checkpoint' +
                    (isUnlocked ? ' checkpoint--unlocked' : ' checkpoint--locked') +
                    (isCompleted ? ' checkpoint--done' : '') +
                    (isSelected ? ' checkpoint--selected' : '')
                  }
                  disabled={!isUnlocked}
                  onClick={() => isUnlocked && setSelected(i)}
                  aria-label={`${label}${isUnlocked ? '' : ' (locked)'}${
                    isCompleted ? ' (completed)' : ''
                  }`}
                >
                  <span className="checkpoint__icon">
                    {isCompleted ? '✓' : isUnlocked ? i + 1 : '🔒'}
                  </span>
                </button>
              </span>
              <span
                className={
                  'checkpoint__label' + (isUnlocked ? '' : ' checkpoint__label--locked')
                }
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {finished && (
        <aside className="finale" role="dialog" aria-label="Module complete">
          <button
            type="button"
            className="finale__close"
            onClick={onDismissFinale}
            aria-label="Dismiss"
          >
            ×
          </button>
          <div className="finale__burst" aria-hidden="true">🎉</div>
          <p className="finale__eyebrow">Module complete</p>
          <h3 className="finale__title">You finished Algebra Foundations!</h3>
          <p className="finale__caption">
            You balanced equations, untangled order of operations, combined like terms,
            distributed, evaluated expressions, and graphed lines. Ready to test out your skills?
          </p>
          <button className="btn finale__btn" onClick={onTestSkills}>
            Test your skills →
          </button>
        </aside>
      )}

      {selected !== null && (
        <div className="path__startbar">
          <div className="path__startinfo">
            <span className="path__startlabel">Checkpoint {selected + 1}</span>
            <strong>{CHECKPOINTS[selected]}</strong>
          </div>
          <button className="btn path__startbtn" onClick={() => onStart(selected)}>
            Start →
          </button>
        </div>
      )}
    </div>
  )
}

export { CHECKPOINTS }
