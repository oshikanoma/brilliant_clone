import '../intros/SubstitutionIntro.css'
import { useState } from 'react'
import { SUBSTITUTION_LEVELS } from '../data/substitutionLevels.js'
import SubstitutionIntro from '../intros/SubstitutionIntro.jsx'
import OwlSpeech from '../components/OwlSpeech.jsx'
import Whiteboard from '../components/Whiteboard.jsx'
import MakeupDots from '../components/MakeupDots.jsx'
import { useMakeup, missedIndicesFrom } from '../lib/useMakeup.js'

// Parse a typed integer, tolerating the unicode minus sign and stray spaces.
function parseNum(str) {
  const s = str.trim().replace('−', '-')
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = (arr) => arr[rint(0, arr.length - 1)]

// Format the "m·x" term with tidy signs and edge cases: 1 -> "x",
// -1 -> "−x", 2 -> "2x", -3 -> "−3x". Uses the unicode minus to match
// the display style in substitutionLevels.js.
function slopeTermText(m) {
  if (m === 1) return 'x'
  if (m === -1) return '−x'
  if (m < 0) return `−${Math.abs(m)}x`
  return `${m}x`
}

// eq1 is always pre-solved for y: "y = m x + k", e.g. "y = 2x − 1",
// "y = −x + 3", "y = x", "y = −x".
function formatEq1(m, k) {
  let s = `y = ${slopeTermText(m)}`
  if (k > 0) s += ` + ${k}`
  else if (k < 0) s += ` − ${Math.abs(k)}`
  return s
}

// eq2 is "a x + b y = c" with tidy signs on each term.
function formatEq2(a, b, c) {
  let s
  if (a === 1) s = 'x'
  else if (a === -1) s = '−x'
  else if (a < 0) s = `−${Math.abs(a)}x`
  else s = `${a}x`

  const yTerm = Math.abs(b) === 1 ? 'y' : `${Math.abs(b)}y`
  if (b > 0) s += ` + ${yTerm}`
  else s += ` − ${yTerm}`

  s += ` = ${c}`
  return s
}

// Generate a fresh substitution-friendly system with a clean integer solution.
// eq1 is pre-solved for y (y = m x + k) and eq2 is a x + b y = c built so that
// (x0, y0) is the unique solution. We reject parallel systems (a + b·m === 0)
// and keep all constants small/tidy.
function generateLike(level) {
  // Loop is bounded in practice: most random draws satisfy the tidy checks.
  for (;;) {
    const x0 = rint(-4, 4)
    const y0 = rint(-4, 4)
    const m = pick([1, -1, 2, -2, 3, -3])
    const k = y0 - m * x0
    const a = pick([1, 2, 3])
    const b = pick([-3, -2, -1, 1, 2, 3])
    // Lines must not be parallel, otherwise the solution isn't unique.
    if (a + b * m === 0) continue
    const c = a * x0 + b * y0
    // Keep the printed numbers from getting unwieldy.
    if (Math.abs(k) > 9 || Math.abs(c) > 30) continue
    return {
      eq1: formatEq1(m, k),
      eq2: formatEq2(a, b, c),
      sol: { x: x0, y: y0 },
      title: level.title,
    }
  }
}

// One generated substitution question for the make-up flow. Tracks whether the
// student ever answered wrong; the star is earned only on a clean first-try
// correct answer. Mirrors GraphsMakeupPlayer.
function SubstitutionMakeupPlayer({ level, onResult }) {
  const [xInput, setXInput] = useState('')
  const [yInput, setYInput] = useState('')
  const [result, setResult] = useState(null)
  const [everWrong, setEverWrong] = useState(false)
  const [showBoard, setShowBoard] = useState(false)
  const locked = result === 'correct'

  const xVal = parseNum(xInput)
  const yVal = parseNum(yInput)
  const canSubmit = !locked && xVal != null && yVal != null

  const submit = () => {
    if (!canSubmit) return
    if (xVal === level.sol.x && yVal === level.sol.y) setResult('correct')
    else {
      setResult('wrong')
      setEverWrong(true)
    }
  }

  let resultTone = null
  let resultText = ''
  if (result === 'correct') {
    resultTone = 'ok'
    resultText = `✓ Yes! (x, y) = (${level.sol.x}, ${level.sol.y}). Both equations hold.`
  } else if (result === 'wrong') {
    resultTone = 'bad'
    const xOk = xVal === level.sol.x
    const yOk = yVal === level.sol.y
    if (xOk && !yOk) {
      resultText = `Your x is right! Back-substitute x = ${level.sol.x} into an equation to fix y.`
    } else if (!xOk && yOk) {
      resultText = `Your y is right! Back-substitute y = ${level.sol.y} to nail down x.`
    } else {
      resultText =
        'Not quite. Equation 1 is solved for y — drop that expression into equation 2, solve, then back-substitute.'
    }
  }

  return (
    <main className="order">
      <OwlSpeech
        text={
          <strong>Solve this system by substitution — type the x and y that satisfy both equations.</strong>
        }
        tone="neutral"
      />

      <div className="subsystem" aria-label="System of equations">
        <span className="subsystem__eq">{level.eq1}</span>
        <span className="subsystem__eq">{level.eq2}</span>
      </div>

      <div className="subanswers">
        <div className="answer">
          <label className="answer__label" htmlFor="mk-sub-x">
            x =
          </label>
          <input
            id="mk-sub-x"
            className="answer__input"
            type="text"
            inputMode="numeric"
            value={xInput}
            disabled={locked}
            placeholder="?"
            onChange={(e) => {
              setXInput(e.target.value)
              setResult(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        </div>
        <div className="answer">
          <label className="answer__label" htmlFor="mk-sub-y">
            y =
          </label>
          <input
            id="mk-sub-y"
            className="answer__input"
            type="text"
            inputMode="numeric"
            value={yInput}
            disabled={locked}
            placeholder="?"
            onChange={(e) => {
              setYInput(e.target.value)
              setResult(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        </div>
      </div>

      {resultText && (
        <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
          {resultText}
        </p>
      )}

      {showBoard && <Whiteboard />}

      <div className="controls">
        {!locked && (xInput !== '' || yInput !== '') && (
          <button
            className="btn btn--ghost"
            onClick={() => {
              setXInput('')
              setYInput('')
              setResult(null)
            }}
          >
            Reset
          </button>
        )}
        <button className="btn btn--ghost" onClick={() => setShowBoard((b) => !b)}>
          {showBoard ? 'Hide whiteboard' : 'Whiteboard'}
        </button>
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
          Pick the equation that's solved for a variable, plug that expression into the other, solve, then back-substitute.
        </p>
      )}
    </main>
  )
}

export default function SubstitutionLesson({
  onBack,
  onPass,
  lessonTitle = 'Systems (Substitution)',
  value,
  onChange,
}) {
  const levels = SUBSTITUTION_LEVELS
  const levelIndex = value.levelIndex
  const level = levels[levelIndex]

  const results = value.results ?? {}
  const levelResult = results[levelIndex] ?? { solved: false, wrong: false }

  const [xInput, setXInput] = useState('')
  const [yInput, setYInput] = useState('')
  const [lastResult, setLastResult] = useState(null)
  const [showSteps, setShowSteps] = useState(false)
  const [showBoard, setShowBoard] = useState(false)
  const [showIntro, setShowIntro] = useState(levelIndex === 0 && !levelResult.solved)
  const [showSummary, setShowSummary] = useState(false)
  const [mkDone, setMkDone] = useState(false)
  const makeup = useMakeup((idx) => generateLike(levels[idx]), () => setMkDone(true))
  const missed = missedIndicesFrom(results, levels.length)

  const solved = !!levelResult.solved
  const isLast = levelIndex === levels.length - 1
  // The worked example is a training-wheel for the first two levels; from
  // level 3 on, students solve without it.
  const stepsAllowed = levelIndex < 2

  const resetLocal = () => {
    setXInput('')
    setYInput('')
    setLastResult(null)
  }

  const markResult = (ok) => {
    setLastResult(ok ? 'correct' : 'wrong')
    onChange({
      levelIndex,
      results: {
        ...results,
        [levelIndex]: { solved: ok || levelResult.solved, wrong: levelResult.wrong || !ok },
      },
    })
  }

  const xVal = parseNum(xInput)
  const yVal = parseNum(yInput)
  const canSubmit = !solved && xVal != null && yVal != null

  const submit = () => {
    if (!canSubmit) return
    markResult(xVal === level.sol.x && yVal === level.sol.y)
  }

  const goNext = () => {
    setShowSteps(false)
    resetLocal()
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
        <SubstitutionIntro onDone={() => setShowIntro(false)} />
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
          <h2>Make-up · {levels[makeup.sourceIndex].title}</h2>
        </div>
        <SubstitutionMakeupPlayer key={makeup.seq} level={makeup.question} onResult={makeup.registerResult} />
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
    const total = levels.length
    const correctCount = levels.reduce(
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
            {levels.map((lvl, i) => {
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
                Nice work — you can solve systems by substitution. Checkpoint complete!
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

  // ---- Feedback text ----
  let resultTone = null
  let resultText = ''
  if (solved) {
    resultTone = 'ok'
    resultText = `✓ Yes! (x, y) = (${level.sol.x}, ${level.sol.y}). Plug those back in and both equations hold.`
  } else if (lastResult === 'wrong') {
    resultTone = 'bad'
    const xOk = xVal === level.sol.x
    const yOk = yVal === level.sol.y
    if (xOk && !yOk) {
      resultText = `Your x is right! Now back-substitute x = ${level.sol.x} into an equation to fix y.`
    } else if (!xOk && yOk) {
      resultText = `Your y is right! Back-substitute y = ${level.sol.y} to nail down x.`
    } else {
      resultText = `Not quite. ${level.isolate} Then solve that single-variable equation and back-substitute.`
    }
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
          aria-valuemax={levels.length}
        >
          <div
            className="progress__fill"
            style={{ width: `${((levelIndex + 1) / levels.length) * 100}%` }}
          />
        </div>
        <h2>{level.title}</h2>
      </div>

      <main className="order">
        <OwlSpeech
          text={
            <strong>Solve this system by substitution — type the x and y that satisfy both equations.</strong>
          }
          tone="neutral"
        />

        <div className="subsystem" aria-label="System of equations">
          <span className="subsystem__eq">{level.eq1}</span>
          <span className="subsystem__eq">{level.eq2}</span>
        </div>

        <div className="subanswers">
          <div className="answer">
            <label className="answer__label" htmlFor="sub-x">
              x =
            </label>
            <input
              id="sub-x"
              className="answer__input"
              type="text"
              inputMode="numeric"
              value={xInput}
              disabled={solved}
              placeholder="?"
              onChange={(e) => {
                setXInput(e.target.value)
                setLastResult(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>
          <div className="answer">
            <label className="answer__label" htmlFor="sub-y">
              y =
            </label>
            <input
              id="sub-y"
              className="answer__input"
              type="text"
              inputMode="numeric"
              value={yInput}
              disabled={solved}
              placeholder="?"
              onChange={(e) => {
                setYInput(e.target.value)
                setLastResult(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>
        </div>

        {resultText && (
          <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
            {resultText}
          </p>
        )}

        {showBoard && <Whiteboard key={levelIndex} />}

        <div className="controls">
          {!solved && (xInput !== '' || yInput !== '') && (
            <button className="btn btn--ghost" onClick={resetLocal}>
              Reset
            </button>
          )}
          <button className="btn btn--ghost" onClick={() => setShowBoard((b) => !b)}>
            {showBoard ? 'Hide whiteboard' : 'Whiteboard'}
          </button>
          {canSubmit && (
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

        {!solved && stepsAllowed && (
          <>
            <div className="substeps-toggle">
              <button className="btn btn--ghost" onClick={() => setShowSteps((s) => !s)}>
                {showSteps ? 'Hide the steps' : 'Show me the steps'}
              </button>
            </div>
            {showSteps && (
              <div className="substeps">
                <p className="substeps__title">Worked example</p>
                <ol className="substeps__list">
                  {level.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}

        {!solved && (
          <p className="lesson-hint">
            Pick the equation that's solved for a variable, plug that expression into the other, solve, then back-substitute.
          </p>
        )}
      </main>
    </div>
  )
}
