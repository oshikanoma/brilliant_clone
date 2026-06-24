import { useMemo, useState } from 'react'
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import Pan from './components/Pan.jsx'
import BalanceScale from './components/BalanceScale.jsx'
import EquationBar from './components/EquationBar.jsx'
import OwlSpeech from './OwlSpeech.jsx'
import { LEVELS } from './levels.js'

// Which drop zones exist for each level type.
const zonesFor = (level) => {
  if (level.type === 'balance') return ['tray', 'left', 'right']
  return ['tray', 'left'] // substitute: right side is locked
}

// Build the base weight definitions and starting layout for a level.
function initLevel(level) {
  const weights = {}

  if (level.type === 'balance') {
    const leftIds = []
    const rightIds = []
    level.locked.left.forEach((w) => {
      weights[w.id] = { ...w, locked: true }
      leftIds.push(w.id)
    })
    level.locked.right.forEach((w) => {
      weights[w.id] = { ...w, locked: true }
      rightIds.push(w.id)
    })
    const trayIds = level.tray.map((w) => {
      weights[w.id] = { ...w }
      return w.id
    })
    return { weights, locations: { tray: trayIds, left: leftIds, right: rightIds } }
  }

  // substitute: one or more locked x placeholders (plus an optional constant) on
  // the left, a locked constant on the right. e.g. x + 2 = 4 or 2x + 5 = 15.
  // Dropping a single number block onto the left replaces ALL the x placeholders
  // with that value at once (handled in handleDragEnd).
  const coefficient = level.coefficient ?? 1
  const xIds = []
  for (let i = 0; i < coefficient; i++) {
    const id = `x${i}`
    weights[id] = { id, variable: true, locked: true }
    xIds.push(id)
  }
  const leftIds = [...xIds]
  if (level.addend != null) {
    weights.a0 = { id: 'a0', value: level.addend, locked: true }
    leftIds.push('a0')
  }
  weights.c0 = { id: 'c0', value: level.constant, locked: true }
  const trayIds = level.tray.map((w) => {
    weights[w.id] = { ...w }
    return w.id
  })
  return { weights, locations: { tray: trayIds, left: leftIds, right: ['c0'] } }
}

export default function Lesson({ onBack, onPass, lessonTitle = 'Solving Equations', value, onChange }) {
  const levelIndex = value.levelIndex
  const level = LEVELS[levelIndex]

  // Base weight defs + fresh layout for this level (values/labels resolved below).
  const base = useMemo(() => initLevel(level), [levelIndex])

  // The saved board layout for the current level, or a fresh one if this level
  // hasn't been touched yet. `value.locations` is the persisted, in-progress
  // arrangement of weights so the student returns to exactly where they left off.
  const locations = value.locations ?? base.locations

  // Per-level results: { solved, wrong } where `wrong` stays true once the
  // student has ever submitted an incorrect answer for that level.
  const results = value.results ?? {}
  const levelResult = results[levelIndex] ?? { solved: false, wrong: false }

  // Transient submit feedback for the current view: 'correct' | 'wrong' | null.
  const [lastResult, setLastResult] = useState(null)
  const [showSummary, setShowSummary] = useState(false)
  // Concept intro shown once, right before a fresh start of the first level.
  const [showIntro, setShowIntro] = useState(levelIndex === 0 && value.locations == null)

  // The x placeholder ids and addend id for this level (used by substitute logic).
  const xIds = useMemo(
    () => Object.keys(base.weights).filter((id) => base.weights[id].variable),
    [base.weights]
  )
  const aId = base.weights.a0 ? 'a0' : null

  const setLevelIndex = (updater) => {
    const next = typeof updater === 'function' ? updater(levelIndex) : updater
    // Switching levels starts that level fresh (null -> derived from base).
    onChange({ levelIndex: next, locations: null, results })
  }

  const setLocations = (updater) =>
    onChange({
      levelIndex,
      locations: typeof updater === 'function' ? updater(locations) : updater,
      results,
    })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 80, tolerance: 6 } })
  )

  // For substitute levels: the value currently standing in for x — the dropped
  // number block on the left (null while the x placeholders are still showing).
  const substitutedX = useMemo(() => {
    if (level.type !== 'substitute') return null
    const occupant = locations.left.find((id) => !xIds.includes(id) && id !== aId)
    return occupant ? base.weights[occupant]?.value ?? null : null
  }, [level.type, locations.left, xIds, aId, base.weights])

  // Resolve every weight to a concrete value + display label for this render.
  // While unsubstituted, x blocks read "x" (value 0, locked). Once a value is
  // dropped in, every x placeholder becomes that number — and stays draggable, so
  // pulling ANY of them back to the tray reverts all the x's together.
  const weights = useMemo(() => {
    const resolved = {}
    for (const [id, w] of Object.entries(base.weights)) {
      if (w.variable) {
        if (substitutedX != null) {
          resolved[id] = {
            ...w,
            variable: false,
            locked: false,
            value: substitutedX,
            label: String(substitutedX),
          }
        } else {
          resolved[id] = { ...w, value: 0, label: 'x' }
        }
      } else {
        resolved[id] = { ...w, label: String(w.value) }
      }
    }
    // Once the level is solved, freeze every block so nothing can be moved.
    if (levelResult.solved) {
      for (const id of Object.keys(resolved)) {
        resolved[id] = { ...resolved[id], locked: true }
      }
    }
    return resolved
  }, [base.weights, substitutedX, levelResult.solved])

  // Tolerate IDs that don't resolve (can briefly happen if state outlives a
  // level/definition change, e.g. across a hot reload) instead of crashing.
  const sumOf = (ids) => ids.reduce((sum, id) => sum + (weights[id]?.value ?? 0), 0)
  const leftTotal = sumOf(locations.left)
  const rightTotal = sumOf(locations.right)

  // The current board is correct when the scale balances (and x has actually
  // been set, for substitute levels — so an empty "0 = 0" board doesn't count).
  const balanced = leftTotal === rightTotal
  const isCorrect =
    level.type === 'substitute'
      ? balanced && substitutedX !== null
      : balanced && rightTotal > 0

  // Whether the student has put a movable weight on a plate (so there's an
  // answer to submit). For substitute levels that's a value standing in for x.
  const placedOnPlate =
    level.type === 'substitute'
      ? substitutedX !== null
      : [...locations.left, ...locations.right].some((id) => !base.weights[id]?.locked)

  // Submit the current arrangement: record right/wrong and gate progression.
  const handleSubmit = () => {
    const correct = isCorrect
    setLastResult(correct ? 'correct' : 'wrong')
    onChange({
      levelIndex,
      locations,
      results: {
        ...results,
        [levelIndex]: {
          solved: correct || levelResult.solved,
          wrong: levelResult.wrong || !correct,
        },
      },
    })
  }

  function handleDragEnd({ active, over }) {
    // Once solved, the board is frozen — no more moves.
    if (levelResult.solved) return
    // Editing the board invalidates the previous submit result.
    setLastResult(null)
    if (!over) return
    const weightId = active.id
    const target = over.id
    const zones = zonesFor(level)
    if (!zones.includes(target)) return
    if (weights[weightId]?.locked) return

    // Substitute levels: dropping a number on the left replaces ALL the x
    // placeholders with that value (the dropped block sits in the first slot and
    // the remaining x's mirror it). Any previously dropped number returns to the
    // tray. Dragging ANY of the substituted blocks back to the tray restores the
    // x's (the real dropped number returns to the tray, mirrors become x again).
    if (level.type === 'substitute') {
      setLocations((prev) => {
        const occupant = prev.left.find((id) => !xIds.includes(id) && id !== aId)
        if (target === 'left') {
          if (!prev.tray.includes(weightId)) return prev
          let tray = prev.tray.filter((id) => id !== weightId)
          if (occupant) tray = [...tray, occupant]
          const mirrors = xIds.slice(1)
          const left = [weightId, ...mirrors, ...(aId ? [aId] : [])]
          return { ...prev, tray, left }
        }
        if (target === 'tray') {
          // Only meaningful while substituted, and only for blocks on the left.
          if (!occupant || !prev.left.includes(weightId) || weightId === aId) return prev
          return {
            ...prev,
            tray: [...prev.tray, occupant],
            left: [...xIds, ...(aId ? [aId] : [])],
          }
        }
        return prev
      })
      return
    }

    setLocations((prev) => {
      const from = zones.find((z) => prev[z]?.includes(weightId))
      if (!from || from === target) return prev
      return {
        ...prev,
        [from]: prev[from].filter((id) => id !== weightId),
        [target]: [...prev[target], weightId],
      }
    })
  }

  const resetLevel = () => setLocations(initLevel(level).locations)
  const isLast = levelIndex === LEVELS.length - 1

  const goNext = () => {
    setLevelIndex((i) => i + 1)
    setLastResult(null)
  }

  const retryLesson = () => {
    onChange({ levelIndex: 0, locations: null, results: {} })
    setLastResult(null)
    setShowSummary(false)
  }

  // Feedback line: show the wrong nudge right after an incorrect submit, the
  // success line once the level is solved, otherwise a neutral prompt.
  let feedbackClass = ''
  let feedbackText = 'Arrange the weights, then tap Submit.'
  if (lastResult === 'wrong') {
    feedbackClass = 'feedback--bad'
    feedbackText = 'Not balanced yet — keep adjusting.'
  } else if (lastResult === 'correct' || levelResult.solved) {
    feedbackClass = 'feedback--ok'
    feedbackText =
      level.type === 'substitute'
        ? substitutedX != null
          ? `✓ Correct! x = ${substitutedX}`
          : '✓ Correct!'
        : '✓ Balanced! Both sides are equal.'
  }

  if (showIntro) {
    return (
      <div className="app">
        <header className="app__header app__header--lesson">
          <button className="back-btn" onClick={onBack} aria-label="Back to path">
            ← Path
          </button>
          <h1>{lessonTitle}</h1>
        </header>

        <div className="intro">
          <div className="intro__icon" aria-hidden="true">⚖️</div>
          <p className="intro__eyebrow">Before we start</p>
          <h2 className="intro__title">With equations, it’s all about balance.</h2>
          <p className="intro__blurb">
            An equation is really just a statement that two things are equal. Think of it
            like a balance scale: whatever sits on the left side weighs exactly the same
            as what sits on the right, and the equals sign in the middle is a promise that
            those two sides stay perfectly balanced. That means whenever you change one
            side, you have to do the very same thing to the other side to keep the scale
            level. Master that single idea — keep both sides equal — and you’ve understood
            the heart of algebra.
          </p>
          <button className="btn intro__btn" onClick={() => setShowIntro(false)}>
            Next →
          </button>
        </div>
      </div>
    )
  }

  if (showSummary) {
    const total = LEVELS.length
    // A level counts as correct only if it was solved with no wrong attempts.
    const correctCount = LEVELS.reduce(
      (n, _, i) => n + (results[i]?.solved && !results[i]?.wrong ? 1 : 0),
      0
    )
    const pct = Math.round((correctCount / total) * 100)
    const passed = pct >= 80

    return (
      <div className="app">
        <header className="app__header app__header--lesson">
          <button className="back-btn" onClick={onBack} aria-label="Back to path">
            ← Path
          </button>
          <h1>{lessonTitle}</h1>
        </header>

        <div className="summary">
          <p className="summary__eyebrow">Lesson complete</p>
          <div className={`summary__score ${passed ? 'summary__score--pass' : 'summary__score--fail'}`}>
            {pct}%
          </div>
          <p className="summary__count">
            {correctCount} of {total} correct on the first try
          </p>

          <ul className="summary__list">
            {LEVELS.map((lvl, i) => {
              const r = results[i] ?? {}
              const ok = r.solved && !r.wrong
              return (
                <li key={lvl.id} className="summary__item">
                  <span className={`summary__mark ${ok ? 'summary__mark--ok' : 'summary__mark--bad'}`}>
                    {ok ? '✓' : '✗'}
                  </span>
                  <span className="summary__title">{lvl.title}</span>
                </li>
              )
            })}
          </ul>

          {passed ? (
            <>
              <p className="summary__msg summary__msg--pass">
                Nice work — you passed! The next checkpoint is unlocked.
              </p>
              <button className="btn" onClick={onPass ?? onBack}>
                Back to path →
              </button>
            </>
          ) : (
            <>
              <p className="summary__msg summary__msg--fail">
                You scored below 80%. Retry the lesson to master it.
              </p>
              <button className="btn" onClick={retryLesson}>
                Retry lesson ↻
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app__header app__header--lesson">
        <button className="back-btn" onClick={onBack} aria-label="Back to path">
          ← Path
        </button>
        <h1>{lessonTitle}</h1>
      </header>

      <div className="level-head">
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={levelIndex + 1}
          aria-valuemin={1}
          aria-valuemax={LEVELS.length}
        >
          <div
            className="progress__fill"
            style={{ width: `${((levelIndex + 1) / LEVELS.length) * 100}%` }}
          />
        </div>
        <h2>{level.title}</h2>
        <p>{level.instruction}</p>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <main className="scale-area">
          <BalanceScale
            leftIds={locations.left}
            rightIds={locations.right}
            weights={weights}
            dropZones={zonesFor(level)}
          />

          <EquationBar
            leftIds={locations.left}
            rightIds={locations.right}
            weights={weights}
            unknownVariables={level.type === 'substitute'}
          />

          <OwlSpeech
            text={feedbackText}
            tone={feedbackClass === 'feedback--ok' ? 'ok' : feedbackClass === 'feedback--bad' ? 'bad' : 'neutral'}
          />

          <section className="tray-section">
            <h3 className="tray-section__title">Weights</h3>
            <Pan id="tray" weightIds={locations.tray} weights={weights} bin />
          </section>

          <div className="controls">
            {!levelResult.solved && (
              <button className="btn btn--ghost" onClick={resetLevel}>
                Reset
              </button>
            )}
            {!levelResult.solved && placedOnPlate && (
              <button className="btn" onClick={handleSubmit}>
                Submit
              </button>
            )}
            {levelResult.solved && !isLast && (
              <button className="btn" onClick={goNext}>
                Next level →
              </button>
            )}
            {levelResult.solved && isLast && (
              <button className="btn" onClick={() => setShowSummary(true)}>
                Finish lesson 🎉
              </button>
            )}
          </div>
        </main>
      </DndContext>
    </div>
  )
}
