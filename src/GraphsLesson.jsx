import { useState } from 'react'
import { GRAPHS_LEVELS } from './graphsLevels.js'
import Graph from './components/Graph.jsx'
import OwlSpeech from './OwlSpeech.jsx'

// Turn a number into a tidy fraction string for small denominators.
function toFrac(n) {
  if (Number.isInteger(n)) return String(n)
  for (const d of [2, 3, 4]) {
    if (Number.isInteger(n * d)) return `${n * d}/${d}`
  }
  return String(n)
}

// The "mx" part of the equation, e.g. 1 -> "x", -1 -> "−x", 0.5 -> "1/2x".
function slopeTermText(m) {
  if (m === 1) return 'x'
  if (m === -1) return '−x'
  return `${toFrac(m)}x`
}

function equationText(m, b) {
  let s = `y = ${slopeTermText(m)}`
  if (b > 0) s += ` + ${b}`
  else if (b < 0) s += ` − ${Math.abs(b)}`
  return s
}

// Parse a slope the student typed: integer, decimal, or "rise/run" fraction.
function parseSlope(str) {
  const s = str.trim().replace('−', '-')
  if (s === '') return null
  if (s.includes('/')) {
    const [a, c] = s.split('/')
    const na = Number(a)
    const nc = Number(c)
    if (!nc || Number.isNaN(na) || Number.isNaN(nc)) return null
    return na / nc
  }
  const n = Number(s)
  return Number.isNaN(n) ? null : n
}

const onLine = (p, m, b) => Math.abs(p.y - (m * p.x + b)) < 1e-9

export default function GraphsLesson({
  onBack,
  onPass,
  lessonTitle = 'Graphs and Linear Relationships',
  value,
  onChange,
}) {
  const levelIndex = value.levelIndex
  const level = GRAPHS_LEVELS[levelIndex]

  const results = value.results ?? {}
  const levelResult = results[levelIndex] ?? { solved: false, wrong: false }

  const [pins, setPins] = useState([])
  const [slopeInput, setSlopeInput] = useState('')
  const [lastResult, setLastResult] = useState(null)
  const [showIntro, setShowIntro] = useState(levelIndex === 0 && !levelResult.solved)
  const [showSummary, setShowSummary] = useState(false)

  const solved = !!levelResult.solved
  const isLast = levelIndex === GRAPHS_LEVELS.length - 1
  const maxPins = level.mode === 'graph' ? 2 : level.mode === 'intercept' ? 1 : 0

  const resetLocal = () => {
    setPins([])
    setSlopeInput('')
    setLastResult(null)
  }

  const placePin = (pt) => {
    if (solved || maxPins === 0) return
    setLastResult(null)
    setPins((prev) => {
      // Toggle off if tapping an existing pin.
      if (prev.some((p) => p.x === pt.x && p.y === pt.y)) {
        return prev.filter((p) => !(p.x === pt.x && p.y === pt.y))
      }
      if (prev.length >= maxPins) return [pt]
      return [...prev, pt]
    })
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

  const submit = () => {
    if (level.mode === 'intercept') {
      if (pins.length !== 1) return
      markResult(pins[0].x === 0 && pins[0].y === level.b)
    } else if (level.mode === 'slope') {
      const v = parseSlope(slopeInput)
      if (v == null) return
      markResult(Math.abs(v - level.m) < 1e-9)
    } else {
      if (pins.length !== 2) return
      const ok =
        pins[0].x !== pins[1].x &&
        onLine(pins[0], level.m, level.b) &&
        onLine(pins[1], level.m, level.b)
      markResult(ok)
    }
  }

  const goNext = () => {
    resetLocal()
    onChange({ levelIndex: levelIndex + 1, results })
  }

  const retryLesson = () => {
    resetLocal()
    setShowSummary(false)
    onChange({ levelIndex: 0, results: {} })
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
        <div className="intro">
          <div className="intro__icon" aria-hidden="true">📈</div>
          <p className="intro__eyebrow">Before we start</p>
          <h2 className="intro__title">Every straight line is captured by y = mx + b.</h2>
          <p className="intro__blurb">
            A linear equation in the form <strong>y = mx + b</strong> hides two key facts about
            its graph. The <strong>b</strong> is the <strong>y-intercept</strong> — where the line
            crosses the y-axis (the point where <strong>x = 0</strong>). The <strong>m</strong> is
            the <strong>slope</strong> — how steep the line is, measured as{' '}
            <strong>rise over run</strong> (how far it goes up for every step to the right). In
            these last puzzles you'll find the intercept, measure a slope, and then graph lines of
            your own — one piece at a time.
          </p>
          <button className="btn intro__btn" onClick={() => setShowIntro(false)}>
            Next →
          </button>
        </div>
      </div>
    )
  }

  // ---- Summary screen ----
  if (showSummary) {
    const total = GRAPHS_LEVELS.length
    const correctCount = GRAPHS_LEVELS.reduce(
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
            {GRAPHS_LEVELS.map((lvl, i) => {
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
                Incredible — you finished the whole Algebra module!
              </p>
              <button className="btn" onClick={onPass ?? onBack}>Back to path →</button>
            </>
          ) : (
            <>
              <p className="summary__msg summary__msg--fail">
                You scored below 80%. Retry the lesson to master it.
              </p>
              <button className="btn" onClick={retryLesson}>Retry lesson ↻</button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ---- Per-mode instruction + owl explanation ----
  let instruction
  let baseFeedback
  if (level.mode === 'intercept') {
    instruction = `Here's the line ${equationText(level.m, level.b)}. Where is its y-intercept?`
    baseFeedback =
      'The y-intercept is where the line crosses the y-axis — exactly where x = 0. Tap the grid to drop a pin there.'
  } else if (level.mode === 'slope') {
    instruction = `What is the slope of ${equationText(level.m, level.b)}?`
    baseFeedback =
      'Slope is rise over run: count how far the line goes UP (rise, green) for each step it goes RIGHT (run, blue), then type rise ÷ run.'
  } else {
    instruction = `Graph the line ${equationText(level.m, level.b)} by dropping two pins it passes through.`
    baseFeedback =
      'Start at the y-intercept (0, ' +
      level.b +
      '), then use the slope to step to another point. Drop two pins on the line.'
  }

  let feedbackClass = ''
  let feedbackText = baseFeedback
  if (lastResult === 'wrong') {
    feedbackClass = 'feedback--bad'
    feedbackText =
      level.mode === 'slope'
        ? 'Not quite — rise over run. Recount the steps and try again.'
        : level.mode === 'intercept'
          ? 'Not quite — the y-intercept sits on the y-axis, where x = 0. Try again.'
          : 'Those points aren\'t both on the line. Check the intercept and slope, then try again.'
  } else if (solved) {
    feedbackClass = 'feedback--ok'
    feedbackText =
      level.mode === 'slope'
        ? `✓ Correct! The slope is ${toFrac(level.m)}.`
        : level.mode === 'intercept'
          ? `✓ Correct! The y-intercept is (0, ${level.b}).`
          : `✓ Nailed it — that's the line ${equationText(level.m, level.b)}.`
  }

  // Show the line for the intercept/slope questions (the equation is given), and
  // reveal the line on graphing questions only once solved.
  const showLine = level.mode !== 'graph' || solved
  const riseRun =
    level.mode === 'slope'
      ? { run: 1, rise: level.m, fromX: 0, fromY: level.b }
      : null

  const canSubmit =
    !solved &&
    (level.mode === 'slope'
      ? parseSlope(slopeInput) != null
      : level.mode === 'intercept'
        ? pins.length === 1
        : pins.length === 2)

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
          aria-valuemax={GRAPHS_LEVELS.length}
        >
          <div
            className="progress__fill"
            style={{ width: `${((levelIndex + 1) / GRAPHS_LEVELS.length) * 100}%` }}
          />
        </div>
        <h2>{level.title}</h2>
        <p>{instruction}</p>
      </div>

      <main className="order">
        <div className="graph-wrap">
          <Graph
            m={level.m}
            b={level.b}
            showLine={showLine}
            lineTone={solved ? 'ok' : 'target'}
            pins={pins}
            onPlace={level.mode === 'slope' ? undefined : placePin}
            riseRun={riseRun}
            userLine={level.mode === 'graph'}
          />
        </div>

        {level.mode === 'slope' && (
          <div className="answer">
            <label className="answer__label" htmlFor="slope-input">
              Slope
            </label>
            <input
              id="slope-input"
              className="answer__input"
              type="text"
              inputMode="text"
              value={slopeInput}
              disabled={solved}
              placeholder="?"
              onChange={(e) => {
                setSlopeInput(e.target.value)
                setLastResult(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>
        )}

        <OwlSpeech
          text={feedbackText}
          tone={feedbackClass === 'feedback--ok' ? 'ok' : feedbackClass === 'feedback--bad' ? 'bad' : 'neutral'}
        />

        <div className="controls">
          {!solved && (pins.length > 0 || slopeInput !== '') && (
            <button className="btn btn--ghost" onClick={resetLocal}>
              Reset
            </button>
          )}
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
              Finish lesson 🎉
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
