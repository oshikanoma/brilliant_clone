import { useLayoutEffect, useRef, useState } from 'react'
import Owl from './Owl.jsx'
import GraduationFinale from './GraduationFinale.jsx'

// The path is split into named sections. Each section shows a bar/header on the
// trail, then its checkpoints. The flat CHECKPOINTS list (used everywhere for
// indexing progress) is derived from these sections in order.
const SECTIONS = [
  {
    title: 'Algebra Foundations',
    items: [
      'Solving Equations',
      'Order of Operations',
      'Combining Like Terms',
      'Distributive Property',
      'Evaluating Expressions',
      'Review',
    ],
  },
  {
    title: 'Graphs and Linear Relationships',
    items: [
      'Y-Intercept',
      'Slope',
      'Graphing',
      'Systems (Graphing)',
      'Systems (Elimination)',
      'Systems (Substitution)',
      'Review',
    ],
  },
  {
    title: 'Expressions with Exponents',
    items: [
      'Multiply Powers',
      'Powers of Powers',
      'Divide Powers',
      'Powers of Products & Quotients',
      'Zero & Negative Exponents',
      'Review',
    ],
  },
  {
    title: 'Quadratics and Polynomials',
    items: [
      'Add Polynomials',
      'Subtract Polynomials',
      'Multiply Polynomials',
      'Factoring Polynomials',
      'Difference of Squares',
      'Perfect Squares',
      'Review',
    ],
  },
  {
    title: 'Graduation',
    items: ['Final Exam'],
  },
]

const CHECKPOINTS = SECTIONS.flatMap((s) => s.items)

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

const decorAt = (i) => DECOR[i % DECOR.length]
const offsetAt = (i) => OFFSETS[i % OFFSETS.length]

// Integer count of local days since the epoch (matches App's dayIndex). Epoch
// day 0 was a Thursday, so weekday = (dayIndex + 4) % 7 with 0 = Sunday.
const dayIndex = (d = new Date()) =>
  Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000)

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// A compact weekly activity chart: one bar per day of the current week (Sun–Sat)
// showing how many questions the student answered correctly that day.
function WeekBars({ dailyCorrect = {} }) {
  const today = dayIndex()
  const sunday = today - ((today + 4) % 7)
  const days = Array.from({ length: 7 }, (_, k) => {
    const idx = sunday + k
    return {
      idx,
      label: WEEKDAY_LABELS[k],
      count: dailyCorrect[idx] ?? 0,
      isToday: idx === today,
      isFuture: idx > today,
    }
  })
  const max = Math.max(1, ...days.map((d) => d.count))
  const weekTotal = days.reduce((n, d) => n + d.count, 0)

  return (
    <div className="weekbars" aria-label="Correct answers this week">
      <div className="weekbars__head">
        <span className="weekbars__title">Questions correct</span>
        <span className="weekbars__total">{weekTotal} this week</span>
      </div>
      <div className="weekbars__chart" role="img" aria-label={`${weekTotal} questions answered correctly this week`}>
        {days.map((d) => (
          <div
            key={d.idx}
            className={
              'weekbars__col' +
              (d.isToday ? ' weekbars__col--today' : '') +
              (d.isFuture ? ' weekbars__col--future' : '')
            }
          >
            <span className="weekbars__count">{d.count > 0 ? d.count : ''}</span>
            <span className="weekbars__barwrap">
              <span
                className="weekbars__bar"
                style={{ height: d.count > 0 ? `${Math.round((d.count / max) * 100)}%` : '0%' }}
              />
            </span>
            <span className={'weekbars__day' + (d.isToday ? ' weekbars__day--today' : '')}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LessonPath({
  name,
  avatar,
  streak = 0,
  dailyCorrect = {},
  onStart,
  onRestart,
  onHomework,
  unlocked = 1,
  completed = {},
  graduated = false,
}) {
  const [selected, setSelected] = useState(null)
  const [restartIdx, setRestartIdx] = useState(null)
  const [showFinale, setShowFinale] = useState(false)
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
      <header className="path__header">
        <h1 className="path__greeting">{name ? `Let’s go, ${name}!` : 'Let’s go!'}</h1>
        {streak > 0 && (
          <p className="path__streak" aria-label={`${streak} day login streak`}>
            🏆 {streak}-day streak
          </p>
        )}
      </header>

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
        <WeekBars dailyCorrect={dailyCorrect} />
        {onHomework && (
          <button type="button" className="infocard__homework" onClick={onHomework}>
            <span className="owl owl--float" aria-hidden="true">
              <Owl />
            </span>
            <span className="infocard__homework-text">
              <strong>Stuck on homework?</strong>
              <span>Ask Bruh for a custom lesson</span>
            </span>
          </button>
        )}
      </aside>

      <div className="trail" ref={trailRef}>
        <svg className="trail__lines" aria-hidden="true">
          {points.length > 1 && (
            <polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} />
          )}
        </svg>

        {(() => {
          let i = -1
          return SECTIONS.map((section) => (
            <div className="path__section-group" key={section.title}>
              <div className="path__section" aria-label={`Section: ${section.title}`}>
                <span className="path__section-line" aria-hidden="true" />
                <span className="path__section-title">{section.title}</span>
                <span className="path__section-line" aria-hidden="true" />
              </div>

              {section.items.map((label) => {
                i += 1
                const idx = i
                const isBig = label === 'Review' || label === 'Final Exam'
                const isUnlocked = idx < unlocked
                const isCompleted = !!completed[idx]
                const isSelected = selected === idx
                return (
                  <div
                    className="trail__row"
                    key={label}
                    style={{ transform: `translateX(${offsetAt(idx)})` }}
                  >
                    <span className="trail__leaf" aria-hidden="true">
                      {decorAt(idx).leaf}
                    </span>
                    <span className="trail__flower" aria-hidden="true">
                      {decorAt(idx).flower}
                    </span>
                    <span className={'checkpoint-stage' + (isBig ? ' checkpoint-stage--big' : '')}>
                      {isSelected && (
                        <span className="owl" aria-hidden="true">
                          <Owl />
                        </span>
                      )}
                      <button
                        type="button"
                        ref={(el) => (dotRefs.current[idx] = el)}
                        className={
                          'checkpoint' +
                          (isBig ? ' checkpoint--big' : '') +
                          (isUnlocked ? ' checkpoint--unlocked' : ' checkpoint--locked') +
                          (isCompleted ? ' checkpoint--done' : '') +
                          (isSelected ? ' checkpoint--selected' : '')
                        }
                        disabled={!isUnlocked}
                        onClick={() => isUnlocked && setSelected(idx)}
                        aria-label={`${label}${isUnlocked ? '' : ' (locked)'}${
                          isCompleted ? ' (completed)' : ''
                        }`}
                      >
                        <span className="checkpoint__icon">
                          {isCompleted ? '✓' : isUnlocked ? idx + 1 : '🔒'}
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
          ))
        })()}
      </div>

      {graduated && (
        <div className="path__grad-cta" role="status">
          <div className="path__grad-cta-text">
            <strong>You passed the Final Exam!</strong>
            <span>Your graduation ceremony is ready whenever you are.</span>
          </div>
          <button className="btn path__grad-btn" onClick={() => setShowFinale(true)}>
            Walk the stage →
          </button>
        </div>
      )}

      {showFinale && (
        <GraduationFinale avatar={avatar} name={name} onClose={() => setShowFinale(false)} />
      )}

      {selected !== null && (
        <div className="path__startbar">
          <div className="path__startinfo">
            <span className="path__startlabel">Checkpoint {selected + 1}</span>
            <strong>{CHECKPOINTS[selected]}</strong>
          </div>
          <button
            className="btn path__startbtn"
            onClick={() => (completed[selected] ? setRestartIdx(selected) : onStart(selected))}
          >
            {completed[selected] ? 'Restart →' : 'Start →'}
          </button>
        </div>
      )}

      {restartIdx !== null && (
        <div className="confirm-overlay" onClick={() => setRestartIdx(null)}>
          <div
            className="confirm"
            role="dialog"
            aria-label="Restart checkpoint"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm__icon" aria-hidden="true">🔄</div>
            <h3 className="confirm__title">Restart this checkpoint?</h3>
            <p className="confirm__msg">
              You’ve already completed <strong>{CHECKPOINTS[restartIdx]}</strong>. Restarting clears
              your progress for it and plays it brand new from the first level.
            </p>
            <div className="confirm__actions">
              <button className="btn btn--ghost" onClick={() => setRestartIdx(null)}>
                Cancel
              </button>
              <button
                className="btn"
                onClick={() => {
                  const i = restartIdx
                  setRestartIdx(null)
                  onRestart(i)
                }}
              >
                Restart →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { CHECKPOINTS, SECTIONS }
