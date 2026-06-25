import { useMemo, useState } from 'react'
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import Pan from './components/Pan.jsx'
import BalanceScale from './components/BalanceScale.jsx'
import EquationBar from './components/EquationBar.jsx'
import OwlSpeech from './OwlSpeech.jsx'
import BalanceIntro from './BalanceIntro.jsx'
import MakeupDots from './MakeupDots.jsx'
import { useMakeup, missedIndicesFrom } from './useMakeup.js'
import { LEVELS } from './levels.js'

const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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

// Generate a fresh equation puzzle in the same style as `level`.
function generateLike(level) {
  if (level.type === 'balance') {
    const target = rint(3, 11)
    return {
      type: 'balance',
      title: 'Balance the Scale',
      instruction: `One side is fixed at ${target}. Drag weights onto the other side until the scale is perfectly balanced.`,
      locked: { left: [{ id: 'L1', value: target }], right: [] },
      tray: [
        { id: 'b1', value: 5 },
        { id: 'b2', value: 4 },
        { id: 'b3', value: 3 },
        { id: 'b4', value: 2 },
        { id: 'b5', value: 1 },
        { id: 'b6', value: 1 },
      ],
    }
  }
  const coefficient = level.coefficient ?? 1
  const x = rint(2, 7)
  const addend = rint(1, 6)
  const constant = coefficient * x + addend
  const pool = shuffle([x - 1, x + 1, x + 2, x - 2].filter((v) => v > 0 && v !== x))
  const values = shuffle([x, pool[0], pool[1]])
  const tray = values.map((v, i) => ({ id: `n${i}`, value: v }))
  const coefText = coefficient === 1 ? '' : String(coefficient)
  return {
    type: 'substitute',
    title: coefficient === 1 ? 'Find x' : `${coefficient} x's`,
    instruction: `Solve ${coefText}x + ${addend} = ${constant}. Drag a number block onto the x to substitute it — which value balances the scale?`,
    coefficient,
    addend,
    constant,
    tray,
  }
}

// One generated equation question for the make-up flow.
function LessonMakeupPlayer({ level, onResult }) {
  const base = useMemo(() => initLevel(level), [level])
  const [locations, setLocations] = useState(base.locations)
  const [result, setResult] = useState(null)
  const [everWrong, setEverWrong] = useState(false)
  const locked = result === 'correct'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 80, tolerance: 6 } })
  )

  const xIds = useMemo(
    () => Object.keys(base.weights).filter((id) => base.weights[id].variable),
    [base.weights]
  )
  const aId = base.weights.a0 ? 'a0' : null

  const substitutedX = useMemo(() => {
    if (level.type !== 'substitute') return null
    const occupant = locations.left.find((id) => !xIds.includes(id) && id !== aId)
    return occupant ? base.weights[occupant]?.value ?? null : null
  }, [level.type, locations.left, xIds, aId, base.weights])

  const weights = useMemo(() => {
    const resolved = {}
    for (const [id, w] of Object.entries(base.weights)) {
      if (w.variable) {
        if (substitutedX != null) {
          resolved[id] = { ...w, variable: false, locked: false, value: substitutedX, label: String(substitutedX) }
        } else {
          resolved[id] = { ...w, value: 0, label: 'x' }
        }
      } else {
        resolved[id] = { ...w, label: String(w.value) }
      }
    }
    return resolved
  }, [base.weights, substitutedX])

  const sumOf = (ids) => ids.reduce((s, id) => s + (weights[id]?.value ?? 0), 0)
  const leftTotal = sumOf(locations.left)
  const rightTotal = sumOf(locations.right)
  const balanced = leftTotal === rightTotal
  const isCorrect =
    level.type === 'substitute' ? balanced && substitutedX !== null : balanced && rightTotal > 0
  const placedOnPlate =
    level.type === 'substitute'
      ? substitutedX !== null
      : [...locations.left, ...locations.right].some((id) => !base.weights[id]?.locked)

  function handleDragEnd({ active, over }) {
    if (locked) return
    if (!over) return
    const weightId = active.id
    const target = over.id
    const zones = zonesFor(level)
    if (!zones.includes(target)) return
    if (weights[weightId]?.locked) return
    setResult(null)

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
          if (!occupant || !prev.left.includes(weightId) || weightId === aId) return prev
          return { ...prev, tray: [...prev.tray, occupant], left: [...xIds, ...(aId ? [aId] : [])] }
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

  const reset = () => {
    setLocations(initLevel(level).locations)
    setResult(null)
  }

  const submit = () => {
    if (isCorrect) setResult('correct')
    else {
      setResult('wrong')
      setEverWrong(true)
    }
  }

  let resultTone = null
  let resultText = ''
  if (result === 'correct') {
    resultTone = 'ok'
    resultText =
      level.type === 'substitute'
        ? `✓ Correct! x = ${substitutedX} makes both sides equal ${leftTotal}.`
        : `✓ Balanced! Both sides weigh ${leftTotal}.`
  } else if (result === 'wrong') {
    resultTone = 'bad'
    const diff = Math.abs(leftTotal - rightTotal)
    if (level.type === 'substitute') {
      resultText =
        substitutedX != null
          ? `With x = ${substitutedX}, the left side comes to ${leftTotal} but the right side is ${rightTotal}. Try a ${leftTotal > rightTotal ? 'smaller' : 'larger'} value for x.`
          : 'Drop a number block onto the x to test a value.'
    } else {
      resultText = `Not balanced yet — the left side weighs ${leftTotal} and the right weighs ${rightTotal}. ${
        leftTotal > rightTotal
          ? `Add ${diff} more to the right (or take ${diff} off the left).`
          : `Add ${diff} more to the left (or take ${diff} off the right).`
      }`
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <main className="scale-area">
        <OwlSpeech text={<strong>{level.instruction}</strong>} tone="neutral" />

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

        <section className="tray-section">
          <h3 className="tray-section__title">Weights</h3>
          <Pan id="tray" weightIds={locations.tray} weights={weights} bin />
        </section>

        {resultText && (
          <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
            {resultText}
          </p>
        )}

        <div className="controls">
          {!locked && (
            <button className="btn btn--ghost" onClick={reset}>
              Reset
            </button>
          )}
          {!locked && placedOnPlate && (
            <button className="btn" onClick={submit}>
              Submit
            </button>
          )}
          {locked && (
            <button className="btn" onClick={() => onResult(!everWrong)}>
              Next →
            </button>
          )}
        </div>
      </main>
    </DndContext>
  )
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
  const [mkDone, setMkDone] = useState(false)
  const makeup = useMakeup((idx) => generateLike(LEVELS[idx]), () => setMkDone(true))
  const missed = missedIndicesFrom(results, LEVELS.length)

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


  // ---- Question (Bruh, top), step hint (bottom), result (near Submit) ----
  const questionText = level.instruction
  const hintText =
    level.type === 'substitute'
      ? 'Drag a number block onto the x to test a value, then tap Submit.'
      : 'Drag weights onto the scale until both sides are equal, then tap Submit.'

  const diff = Math.abs(leftTotal - rightTotal)
  let resultTone = null
  let resultText = ''
  if (lastResult === 'correct' || levelResult.solved) {
    resultTone = 'ok'
    resultText =
      level.type === 'substitute'
        ? substitutedX != null
          ? `✓ Correct! x = ${substitutedX} makes both sides equal ${leftTotal}.`
          : '✓ Correct!'
        : `✓ Balanced! Both sides weigh ${leftTotal}.`
  } else if (lastResult === 'wrong') {
    resultTone = 'bad'
    if (level.type === 'substitute') {
      resultText =
        substitutedX != null
          ? `With x = ${substitutedX}, the left side comes to ${leftTotal} but the right side is ${rightTotal}. The two sides have to match, so try a ${leftTotal > rightTotal ? 'smaller' : 'larger'} value for x.`
          : 'Drop a number block onto the x to test a value.'
    } else {
      resultText = `Not balanced yet — the left side weighs ${leftTotal} and the right weighs ${rightTotal}. ${
        leftTotal > rightTotal
          ? `The left is heavier by ${diff}; add ${diff} more to the right (or take ${diff} off the left).`
          : `The right is heavier by ${diff}; add ${diff} more to the left (or take ${diff} off the right).`
      }`
    }
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

        <BalanceIntro onDone={() => setShowIntro(false)} />
      </div>
    )
  }

  if (makeup.active) {
    return (
      <div className="app">
        <header className="app__header app__header--lesson">
          <button className="back-btn" onClick={onBack} aria-label="Back to path">
            ← Path
          </button>
          <h1>{lessonTitle}</h1>
        </header>
        <div className="level-head">
          <MakeupDots stars={makeup.stars} total={makeup.total} />
          <h2>Make-up · {LEVELS[makeup.sourceIndex].title}</h2>
        </div>
        <LessonMakeupPlayer key={makeup.seq} level={makeup.question} onResult={makeup.registerResult} />
      </div>
    )
  }

  if (mkDone) {
    return (
      <div className="app">
        <header className="app__header app__header--lesson">
          <button className="back-btn" onClick={onBack} aria-label="Back to path">
            ← Path
          </button>
          <h1>{lessonTitle}</h1>
        </header>
        <div className="summary">
          <p className="summary__eyebrow">All caught up</p>
          <div className="summary__score summary__score--pass">★</div>
          <p className="summary__msg summary__msg--pass">
            Nice — you made up everything you missed. Checkpoint complete!
          </p>
          <button className="btn" onClick={onPass ?? onBack}>
            Back to path →
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
                    {ok ? '✓' : ''}
                  </span>
                  <span className="summary__title">{lvl.title}</span>
                </li>
              )
            })}
          </ul>

          {missed.length === 0 ? (
            <>
              <p className="summary__msg summary__msg--pass">
                Perfect — you nailed every question! The next checkpoint is unlocked.
              </p>
              <button className="btn" onClick={onPass ?? onBack}>
                Back to path →
              </button>
            </>
          ) : (
            <>
              <p className="summary__msg summary__msg--todo">
                Let's lock in the {missed.length} you missed — answer 3 similar questions for each.
              </p>
              <button className="btn" onClick={() => makeup.start(missed)}>
                Let's see what we missed →
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
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <main className="scale-area">
          <OwlSpeech text={<strong>{questionText}</strong>} tone="neutral" />

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

          <section className="tray-section">
            <h3 className="tray-section__title">Weights</h3>
            <Pan id="tray" weightIds={locations.tray} weights={weights} bin />
          </section>

          {resultText && (
            <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
              {resultText}
            </p>
          )}

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
                Finish lesson
              </button>
            )}
          </div>

          {!levelResult.solved && <p className="lesson-hint">{hintText}</p>}
        </main>
      </DndContext>
    </div>
  )
}
