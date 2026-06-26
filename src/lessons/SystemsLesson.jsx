import { useState } from 'react'
import { SYSTEMS_LEVELS } from '../data/systemsLevels.js'
import Graph from '../components/Graph.jsx'
import OwlSpeech from '../components/OwlSpeech.jsx'
import MakeupDots from '../components/MakeupDots.jsx'
import { useMakeup, missedIndicesFrom } from '../lib/useMakeup.js'

const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = (arr) => arr[rint(0, arr.length - 1)]

// Format a line as "y = mx + b" for display.
function eqText(m, b) {
  const mPart = m === 1 ? 'x' : m === -1 ? '−x' : `${m < 0 ? '−' : ''}${Math.abs(m)}x`
  let s = `y = ${mPart}`
  if (b > 0) s += ` + ${b}`
  else if (b < 0) s += ` − ${Math.abs(b)}`
  return s
}

// Does the lattice point p lie on the line y = m x + b?
const onLine = (p, m, b) => p.y === m * p.x + b

// Generate a fresh PIN-style system for the make-up flow: two lines that cross
// at a clean integer point inside the −5..5 grid. We pick the intersection
// first, then two different integer slopes, and derive the intercepts so both
// lines pass through that point. Used for ALL missed levels (even graph ones) —
// pinning the intersection is the core skill we want to lock in.
function generateLike(level) {
  while (true) {
    const x0 = rint(-3, 3)
    const y0 = rint(-3, 3)
    const m1 = pick([-2, -1, 1, 2])
    let m2 = pick([-2, -1, 1, 2])
    while (m2 === m1) m2 = pick([-2, -1, 1, 2])
    const b1 = y0 - m1 * x0
    const b2 = y0 - m2 * x0
    // Keep both intercepts on the grid so the lines stay clearly visible.
    if (Math.abs(b1) > 5 || Math.abs(b2) > 5) continue
    return { mode: 'pin', title: level.title, m1, b1, m2, b2, sol: { x: x0, y: y0 } }
  }
}

// One generated system question for the make-up flow: both lines are drawn and
// the student drops a single pin on their intersection. A star is earned only
// when the first answer for this question is correct (no prior wrong attempt).
function SystemsMakeupPlayer({ level, onResult }) {
  const [pins, setPins] = useState([])
  const [result, setResult] = useState(null)
  const [everWrong, setEverWrong] = useState(false)
  const locked = result === 'correct'
  const sol = level.sol

  const placePin = (pt) => {
    if (locked) return
    setResult(null)
    setPins((prev) => {
      if (prev.some((p) => p.x === pt.x && p.y === pt.y)) {
        return prev.filter((p) => !(p.x === pt.x && p.y === pt.y))
      }
      return [pt]
    })
  }

  const canSubmit = !locked && pins.length === 1
  const isCorrect = pins.length === 1 && pins[0].x === sol.x && pins[0].y === sol.y

  const submit = () => {
    if (!canSubmit) return
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
    resultText = `✓ Solved! The lines cross at (${sol.x}, ${sol.y}).`
  } else if (result === 'wrong') {
    const pin = pins[0]
    resultTone = 'bad'
    resultText = pin
      ? `(${pin.x}, ${pin.y}) isn't where both lines cross. Find the single point that sits on both.`
      : 'Pin the single point where the two lines cross.'
  }

  return (
    <main className="order">
      <OwlSpeech
        text={
          <strong>
            Solve the system {eqText(level.m1, level.b1)} and {eqText(level.m2, level.b2)} — pin the
            point where the lines cross.
          </strong>
        }
        tone="neutral"
      />

      <div className="graph-wrap">
        <Graph
          m={level.m1}
          b={level.b1}
          showLine
          lineTone={locked ? 'ok' : 'target'}
          m2={level.m2}
          b2={level.b2}
          showLine2
          line2Tone={locked ? 'ok' : 'target'}
          pins={locked ? [sol] : pins}
          onPlace={placePin}
        />
      </div>

      {resultText && (
        <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
          {resultText}
        </p>
      )}

      <div className="controls">
        {!locked && pins.length > 0 && (
          <button
            className="btn btn--ghost"
            onClick={() => {
              setPins([])
              setResult(null)
            }}
          >
            Reset
          </button>
        )}
        {canSubmit && (
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

      {!locked && (
        <p className="lesson-hint">
          The solution is the single point that lies on both lines. Tap the grid where they cross.
        </p>
      )}
    </main>
  )
}

export default function SystemsLesson({ onBack, onPass, lessonTitle = 'Systems (Graphing)', IntroComponent = null, value, onChange }) {
  const levelIndex = value.levelIndex
  const level = SYSTEMS_LEVELS[levelIndex]
  const isGraph = level.mode === 'graph'

  const results = value.results ?? {}
  const levelResult = results[levelIndex] ?? { solved: false, wrong: false }

  // Pins the student has dropped for the current interaction. In 'pin' mode and
  // in graph stage 3 this holds a single point; in graph stages 1 & 2 it holds
  // up to two points used to define a line.
  const [pins, setPins] = useState([])
  // Graph-mode stage: 1 = graph line 1, 2 = graph line 2, 3 = pin intersection.
  const [stage, setStage] = useState(1)
  const [feedback, setFeedback] = useState(null) // { tone, text } | null
  const [showIntro, setShowIntro] = useState(levelIndex === 0 && !levelResult.solved)
  const [showSummary, setShowSummary] = useState(false)
  const [mkDone, setMkDone] = useState(false)
  const makeup = useMakeup((idx) => generateLike(SYSTEMS_LEVELS[idx]), () => setMkDone(true))
  const missed = missedIndicesFrom(results, SYSTEMS_LEVELS.length)

  const solved = !!levelResult.solved
  const isLast = levelIndex === SYSTEMS_LEVELS.length - 1
  const sol = level.sol

  const maxPins = isGraph && stage !== 3 ? 2 : 1
  const ready = pins.length === maxPins

  const placePin = (pt) => {
    if (solved) return
    setFeedback(null)
    setPins((prev) => {
      if (prev.some((p) => p.x === pt.x && p.y === pt.y)) {
        return prev.filter((p) => !(p.x === pt.x && p.y === pt.y))
      }
      if (prev.length >= maxPins) return [...prev.slice(1), pt] // replace oldest
      return [...prev, pt]
    })
  }

  const resetPins = () => {
    setPins([])
    setFeedback(null)
  }

  const markWrong = () => {
    onChange({
      levelIndex,
      results: { ...results, [levelIndex]: { solved: levelResult.solved, wrong: true } },
    })
  }

  const markSolved = () => {
    onChange({
      levelIndex,
      results: { ...results, [levelIndex]: { solved: true, wrong: levelResult.wrong } },
    })
  }

  const submit = () => {
    if (solved || !ready) return

    if (!isGraph) {
      const pin = pins[0]
      const ok = pin.x === sol.x && pin.y === sol.y
      if (ok) {
        setFeedback({ tone: 'ok', text: '' })
        markSolved()
      } else {
        setFeedback({
          tone: 'bad',
          text: `(${pin.x}, ${pin.y}) isn't on both lines. The solution is the one point where the two lines cross — find where they overlap.`,
        })
        markWrong()
      }
      return
    }

    // Graph mode.
    if (stage === 1 || stage === 2) {
      const m = stage === 1 ? level.m1 : level.m2
      const b = stage === 1 ? level.b1 : level.b2
      const [p, q] = pins
      const distinct = p.x !== q.x
      const ok = distinct && onLine(p, m, b) && onLine(q, m, b)
      if (ok) {
        setPins([])
        if (stage === 1) {
          setStage(2)
          setFeedback({ tone: 'ok', text: '✓ Line 1 is graphed. Now graph the second line.' })
        } else {
          setStage(3)
          setFeedback({ tone: 'ok', text: '✓ Both lines are graphed. Now pin where they meet.' })
        }
      } else {
        setFeedback({
          tone: 'bad',
          text: !distinct
            ? 'Both points are on the same vertical — pick two points with different x-values.'
            : `Both points must satisfy ${eqText(m, b)}. Plug each x in and check the y.`,
        })
        markWrong()
      }
      return
    }

    // Graph mode, stage 3: pin the intersection.
    const pin = pins[0]
    const ok = pin.x === sol.x && pin.y === sol.y
    if (ok) {
      setFeedback({ tone: 'ok', text: '' })
      markSolved()
    } else {
      setFeedback({
        tone: 'bad',
        text: `(${pin.x}, ${pin.y}) isn't where both lines cross. Look for the single point that sits on both.`,
      })
      markWrong()
    }
  }

  const goNext = () => {
    setPins([])
    setStage(1)
    setFeedback(null)
    onChange({ levelIndex: levelIndex + 1, results })
  }

  // ---- Intro screen ----
  if (showIntro) {
    return (
      <div className="app">
        <header className="app__header app__header--lesson">
          <button className="back-btn" onClick={onBack} aria-label="Back to path">
            ← Path
          </button>
          <h1>{lessonTitle}</h1>
        </header>
        {IntroComponent ? (
          <IntroComponent onDone={() => setShowIntro(false)} />
        ) : (
          <div className="intro">
            <div className="intro__icon" aria-hidden="true">✖️</div>
            <p className="intro__eyebrow">Before we start</p>
            <h2 className="intro__title">A system of equations is two lines at once.</h2>
            <p className="intro__blurb">
              When you have <strong>two</strong> linear equations together, you have a{' '}
              <strong>system</strong>. Its <strong>solution</strong> is the single point{' '}
              <strong>(x, y)</strong> that makes <em>both</em> equations true at the same time —
              graphically, that's exactly where the two lines <strong>cross</strong>. First you'll
              pin where two drawn lines meet, then you'll <strong>graph the lines yourself</strong>{' '}
              and find the crossing.
            </p>
            <button className="btn intro__btn" onClick={() => setShowIntro(false)}>
              Next →
            </button>
          </div>
        )}
      </div>
    )
  }

  // ---- Make-up screen ----
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
          <h2>Make-up · {SYSTEMS_LEVELS[makeup.sourceIndex].title}</h2>
        </div>
        <SystemsMakeupPlayer key={makeup.seq} level={makeup.question} onResult={makeup.registerResult} />
      </div>
    )
  }

  // ---- All caught up ----
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

  // ---- Summary screen ----
  if (showSummary) {
    const total = SYSTEMS_LEVELS.length
    const correctCount = SYSTEMS_LEVELS.reduce(
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
          <p className="summary__count">{correctCount} of {total} correct on the first try</p>
          <ul className="summary__list">
            {SYSTEMS_LEVELS.map((lvl, i) => {
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
                Brilliant — you can solve systems by finding where lines meet. The next checkpoint
                is unlocked!
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

  // ---- Owl prompt ----
  let owlText
  if (!isGraph) {
    owlText = (
      <strong>
        Solve the system {eqText(level.m1, level.b1)} and {eqText(level.m2, level.b2)} — pin the
        point where the lines cross.
      </strong>
    )
  } else if (stage === 1) {
    owlText = (
      <strong>
        Graph the first line, {eqText(level.m1, level.b1)}, by dropping two points it passes through.
      </strong>
    )
  } else if (stage === 2) {
    owlText = (
      <strong>
        Now graph the second line, {eqText(level.m2, level.b2)} — drop two points it passes through.
      </strong>
    )
  } else {
    owlText = <strong>Where do the two lines meet? Pin their intersection.</strong>
  }

  // ---- Feedback line ----
  let fbTone = null
  let fbText = ''
  if (solved) {
    fbTone = 'ok'
    fbText = `✓ Solved! The lines meet at (${sol.x}, ${sol.y}) — the one point that lies on both.`
  } else if (feedback && feedback.text) {
    fbTone = feedback.tone
    fbText = feedback.text
  }

  // ---- Graph props per mode / stage ----
  let graphProps
  if (!isGraph) {
    graphProps = {
      m: level.m1, b: level.b1, showLine: true, lineTone: solved ? 'ok' : 'target',
      m2: level.m2, b2: level.b2, showLine2: true, line2Tone: solved ? 'ok' : 'target',
      pins, onPlace: placePin,
    }
  } else if (solved) {
    graphProps = {
      m: level.m1, b: level.b1, showLine: true, lineTone: 'ok',
      m2: level.m2, b2: level.b2, showLine2: true, line2Tone: 'ok',
      pins: [sol],
    }
  } else if (stage === 1) {
    graphProps = { m: level.m1, b: level.b1, showLine: false, userLine: true, pins, onPlace: placePin }
  } else if (stage === 2) {
    graphProps = {
      m: level.m1, b: level.b1, showLine: true, lineTone: 'ok',
      userLine: true, pins, onPlace: placePin,
    }
  } else {
    graphProps = {
      m: level.m1, b: level.b1, showLine: true, lineTone: 'ok',
      m2: level.m2, b2: level.b2, showLine2: true, line2Tone: 'ok',
      pins, onPlace: placePin,
    }
  }

  // ---- Hint per mode / stage ----
  let hint
  if (!isGraph) {
    hint = 'The solution is the single point that lies on both lines. Tap the grid where they intersect.'
  } else if (stage === 1) {
    hint = `Drop two lattice points that satisfy ${eqText(level.m1, level.b1)}, then Submit to draw the line.`
  } else if (stage === 2) {
    hint = `Drop two lattice points that satisfy ${eqText(level.m2, level.b2)}, then Submit to draw the line.`
  } else {
    hint = 'Both lines are drawn — tap the single point where they cross.'
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
          aria-valuemax={SYSTEMS_LEVELS.length}
        >
          <div
            className="progress__fill"
            style={{ width: `${((levelIndex + 1) / SYSTEMS_LEVELS.length) * 100}%` }}
          />
        </div>
        <h2>{level.title}</h2>
      </div>

      <main className="order">
        <OwlSpeech text={owlText} tone="neutral" />

        {isGraph && !solved && (
          <p className="lesson-hint" aria-live="polite">
            Step {stage} of 3
          </p>
        )}

        <div className="graph-wrap">
          <Graph {...graphProps} />
        </div>

        {fbText && (
          <p className={`answer-feedback answer-feedback--${fbTone}`} role="status" aria-live="polite">
            {fbText}
          </p>
        )}

        <div className="controls">
          {!solved && pins.length > 0 && (
            <button className="btn btn--ghost" onClick={resetPins}>
              Reset
            </button>
          )}
          {!solved && ready && (
            <button className="btn" onClick={submit}>
              Submit
            </button>
          )}
          {solved && !isLast && (
            <button className="btn" onClick={goNext}>
              Next level →
            </button>
          )}
          {solved && isLast && (
            <button className="btn" onClick={() => setShowSummary(true)}>
              Finish lesson
            </button>
          )}
        </div>

        {!solved && <p className="lesson-hint">{hint}</p>}
      </main>
    </div>
  )
}
