import { useState } from 'react'
import './EliminationIntro.css'
import { ELIMINATION_LEVELS } from './eliminationLevels.js'
import EliminationIntro from './EliminationIntro.jsx'
import OwlSpeech from './OwlSpeech.jsx'
import Whiteboard from './Whiteboard.jsx'
import MakeupDots from './MakeupDots.jsx'
import { useMakeup, missedIndicesFrom } from './useMakeup.js'

const MINUS = '−'

const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = (arr) => arr[rint(0, arr.length - 1)]

// ---- small math + formatting helpers ----
function gcd(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    ;[a, b] = [b, a % b]
  }
  return a || 1
}
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b)

// Pretty number with a real minus sign.
const num = (n) => (n < 0 ? MINUS + Math.abs(n) : String(n))

// A single "coef·var" term, hiding 1/−1 coefficients ("x", "−x", "3x").
function termText(coef, v) {
  if (coef === 1) return v
  if (coef === -1) return MINUS + v
  return `${coef < 0 ? MINUS : ''}${Math.abs(coef)}${v}`
}

// "a x + b y = c" in standard form, with tidy signs.
function eqText(a, b, c) {
  let s = ''
  if (a === 1) s += 'x'
  else if (a === -1) s += MINUS + 'x'
  else s += `${a < 0 ? MINUS : ''}${Math.abs(a)}x`
  if (b !== 0) {
    s += b < 0 ? ` ${MINUS} ` : ' + '
    const mag = Math.abs(b)
    s += `${mag === 1 ? '' : mag}y`
  }
  s += ` = ${num(c)}`
  return s
}

// Pick the cheaper variable to eliminate (fewest multiplications), preferring y.
function planFor(level, v) {
  const co1 = v === 'x' ? level.a1 : level.b1
  const co2 = v === 'x' ? level.a2 : level.b2
  const L = lcm(co1, co2)
  const k1 = L / Math.abs(co1)
  const k2 = L / Math.abs(co2)
  const op = Math.sign(co1) === Math.sign(co2) ? 'subtract' : 'add'
  return { v, k1, k2, op, work: k1 + k2 }
}

function choosePlan(level) {
  const py = planFor(level, 'y')
  const px = planFor(level, 'x')
  return py.work <= px.work ? py : px
}

// Build the fully worked elimination for a level (used by "Show me the steps"
// and to tailor the wrong-answer hint).
function workedSteps(level) {
  const { a1, b1, c1, a2, b2, c2, sol } = level
  const plan = choosePlan(level)
  const elim = plan.v
  const keep = elim === 'x' ? 'y' : 'x'
  const { k1, k2, op } = plan

  const A1 = a1 * k1, B1 = b1 * k1, C1 = c1 * k1
  const A2 = a2 * k2, B2 = b2 * k2, C2 = c2 * k2

  let sumA = op === 'add' ? A1 + A2 : A1 - A2
  let sumB = op === 'add' ? B1 + B2 : B1 - B2
  let sumC = op === 'add' ? C1 + C2 : C1 - C2

  let keepCoef = keep === 'x' ? sumA : sumB
  let order = '① − ②'
  // For subtraction, flip the order if it keeps the surviving coefficient positive.
  if (op === 'subtract' && keepCoef < 0) {
    sumA = -sumA
    sumB = -sumB
    sumC = -sumC
    keepCoef = -keepCoef
    order = '② − ①'
  }

  const steps = []
  steps.push(
    `Goal: cancel ${elim} by lining the equations up and ${op === 'add' ? 'adding' : 'subtracting'} them.`
  )
  if (k1 !== 1 || k2 !== 1) {
    steps.push(
      k1 !== 1
        ? `Multiply equation ① by ${k1}:  ${eqText(A1, B1, C1)}`
        : `Leave equation ① as is:  ${eqText(A1, B1, C1)}`
    )
    steps.push(
      k2 !== 1
        ? `Multiply equation ② by ${k2}:  ${eqText(A2, B2, C2)}`
        : `Leave equation ② as is:  ${eqText(A2, B2, C2)}`
    )
  }
  steps.push(
    `${op === 'add' ? 'Add the equations' : `Subtract the equations (${order})`} — the ${elim}-terms cancel:  ${termText(keepCoef, keep)} = ${num(sumC)}`
  )
  steps.push(`Solve:  ${keep} = ${num(sol[keep])}`)
  steps.push(
    `Substitute ${keep} = ${num(sol[keep])} into ${eqText(a1, b1, c1)}  →  ${elim} = ${num(sol[elim])}`
  )
  steps.push(`Solution:  (x, y) = (${num(sol.x)}, ${num(sol.y)})`)
  return { steps, plan, elim, op }
}

// Parse a number the student typed (integer / decimal / negative).
function parseNum(str) {
  const s = str.trim().replace('−', '-')
  if (s === '') return null
  const n = Number(s)
  return Number.isNaN(n) ? null : n
}

// Generate a fresh two-equation system in standard form with a clean integer
// solution, in the same style as `level`. We pick the solution first, then small
// nonzero coefficients with a nonzero determinant (a1·b2 − a2·b1 ≠ 0) so the
// system has a unique solution and the lines aren't parallel.
function generateLike(level) {
  const small = [-4, -3, -2, -1, 1, 2, 3, 4]
  const x0 = rint(-4, 4)
  const y0 = rint(-4, 4)
  for (let tries = 0; tries < 200; tries++) {
    const a1 = pick(small)
    const b1 = pick(small)
    const a2 = pick(small)
    const b2 = pick(small)
    if (a1 * b2 - a2 * b1 === 0) continue
    const c1 = a1 * x0 + b1 * y0
    const c2 = a2 * x0 + b2 * y0
    return { a1, b1, c1, a2, b2, c2, sol: { x: x0, y: y0 }, title: level.title }
  }
  // Fallback (extremely unlikely): a guaranteed-valid system.
  return {
    a1: 1, b1: 1, c1: x0 + y0,
    a2: 1, b2: -1, c2: x0 - y0,
    sol: { x: x0, y: y0 },
    title: level.title,
  }
}

// One generated elimination question for the make-up flow: enter x and y for a
// freshly generated system. Tracks whether the student ever answered wrong so a
// star is only earned on a clean correct answer.
function EliminationMakeupPlayer({ level, onResult }) {
  const [xInput, setXInput] = useState('')
  const [yInput, setYInput] = useState('')
  const [result, setResult] = useState(null)
  const [everWrong, setEverWrong] = useState(false)
  const [showBoard, setShowBoard] = useState(false)
  const locked = result === 'correct'

  const px = parseNum(xInput)
  const py = parseNum(yInput)
  const canSubmit = !locked && px != null && py != null

  const submit = () => {
    if (!canSubmit) return
    const ok = Math.abs(px - level.sol.x) < 1e-9 && Math.abs(py - level.sol.y) < 1e-9
    if (ok) setResult('correct')
    else {
      setResult('wrong')
      setEverWrong(true)
    }
  }

  let resultTone = null
  let resultText = ''
  if (result === 'correct') {
    resultTone = 'ok'
    resultText = `✓ Correct! x = ${num(level.sol.x)} and y = ${num(level.sol.y)} satisfy both equations.`
  } else if (result === 'wrong') {
    resultTone = 'bad'
    const xRight = px != null && Math.abs(px - level.sol.x) < 1e-9
    const yRight = py != null && Math.abs(py - level.sol.y) < 1e-9
    if (xRight && !yRight) {
      resultText = `Your x is right! Substitute x = ${num(level.sol.x)} back into one equation to fix y.`
    } else if (yRight && !xRight) {
      resultText = `Your y is right! Substitute y = ${num(level.sol.y)} back into one equation to fix x.`
    } else {
      resultText = 'Not quite. Line the equations up in columns and add or subtract to cancel a variable, then solve.'
    }
  }

  return (
    <main className="order">
      <OwlSpeech
        text={<strong>Solve the system by elimination — find the (x, y) that fits both equations.</strong>}
        tone="neutral"
      />

      <div className="elimintro__eqs" style={{ alignItems: 'center', marginTop: '0.5rem' }}>
        <div className="elimintro__eq elimintro__eq--l1">
          <span className="elimintro__dot elimintro__dot--l1" />
          {eqText(level.a1, level.b1, level.c1)}
        </div>
        <div className="elimintro__eq elimintro__eq--l2">
          <span className="elimintro__dot elimintro__dot--l2" />
          {eqText(level.a2, level.b2, level.c2)}
        </div>
      </div>

      <div className="answer">
        <label className="answer__label" htmlFor="mk-elim-x">
          x =
        </label>
        <input
          id="mk-elim-x"
          className="answer__input"
          type="text"
          inputMode="text"
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
        <label className="answer__label" htmlFor="mk-elim-y">
          y =
        </label>
        <input
          id="mk-elim-y"
          className="answer__input"
          type="text"
          inputMode="text"
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
          Multiply an equation if needed so a variable's coefficients match, then add or subtract to
          eliminate it. Solve for one variable, then substitute back for the other.
        </p>
      )}
    </main>
  )
}

export default function EliminationLesson({
  onBack,
  onPass,
  lessonTitle = 'Systems (Elimination)',
  levels = ELIMINATION_LEVELS,
  value,
  onChange,
}) {
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
  // The step-by-step walkthrough is a training-wheel for the first two levels;
  // from level 3 on, students solve without it.
  const stepsAllowed = levelIndex < 2

  const { steps, plan } = workedSteps(level)

  const resetLocal = () => {
    setXInput('')
    setYInput('')
    setLastResult(null)
    setShowSteps(false)
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

  const px = parseNum(xInput)
  const py = parseNum(yInput)
  const canSubmit = !solved && px != null && py != null

  const submit = () => {
    if (!canSubmit) return
    const ok = Math.abs(px - level.sol.x) < 1e-9 && Math.abs(py - level.sol.y) < 1e-9
    markResult(ok)
  }

  const goNext = () => {
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
        <EliminationIntro onDone={() => setShowIntro(false)} />
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
        <EliminationMakeupPlayer key={makeup.seq} level={makeup.question} onResult={makeup.registerResult} />
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
          <div className={`summary__score ${missed.length === 0 ? 'summary__score--pass' : 'summary__score--fail'}`}>
            {pct}%
          </div>
          <p className="summary__count">
            {correctCount} of {total} correct on the first try
          </p>
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
                Nailed it — you can solve a system with elimination. Checkpoint complete!
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
    resultText = `✓ Correct! x = ${num(level.sol.x)} and y = ${num(level.sol.y)} satisfy both equations.`
  } else if (lastResult === 'wrong') {
    resultTone = 'bad'
    const xRight = px != null && Math.abs(px - level.sol.x) < 1e-9
    const yRight = py != null && Math.abs(py - level.sol.y) < 1e-9
    if (xRight && !yRight) {
      resultText = `Your x is right! Now substitute x = ${num(level.sol.x)} back into one equation to fix y.`
    } else if (yRight && !xRight) {
      resultText = `Your y is right! Now substitute y = ${num(level.sol.y)} back into one equation to fix x.`
    } else {
      const verb = plan.op === 'add' ? 'add' : 'subtract'
      resultText = `Not quite. Line the equations up in columns and ${verb} them to cancel ${plan.v}${plan.k1 !== 1 || plan.k2 !== 1 ? ' (scale one first so its coefficients match)' : ''}.${stepsAllowed ? ' Need a walkthrough? Tap “Show me the steps”.' : ' Use the whiteboard to work it out.'}`
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
          text={<strong>Solve the system by elimination — find the (x, y) that fits both equations.</strong>}
          tone="neutral"
        />

        <div className="elimintro__eqs" style={{ alignItems: 'center', marginTop: '0.5rem' }}>
          <div className="elimintro__eq elimintro__eq--l1">
            <span className="elimintro__dot elimintro__dot--l1" />
            {eqText(level.a1, level.b1, level.c1)}
          </div>
          <div className="elimintro__eq elimintro__eq--l2">
            <span className="elimintro__dot elimintro__dot--l2" />
            {eqText(level.a2, level.b2, level.c2)}
          </div>
        </div>

        <div className="answer">
          <label className="answer__label" htmlFor="elim-x">
            x =
          </label>
          <input
            id="elim-x"
            className="answer__input"
            type="text"
            inputMode="text"
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
          <label className="answer__label" htmlFor="elim-y">
            y =
          </label>
          <input
            id="elim-y"
            className="answer__input"
            type="text"
            inputMode="text"
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

        {resultText && (
          <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
            {resultText}
          </p>
        )}

        {showBoard && <Whiteboard key={levelIndex} />}

        {stepsAllowed && (showSteps || solved) && (
          <ol className="elim-steps" aria-label="Elimination walkthrough">
            {steps.map((s, i) => (
              <li key={i} className="elim-steps__item">
                {s}
              </li>
            ))}
          </ol>
        )}

        <div className="controls">
          {!solved && (xInput !== '' || yInput !== '') && (
            <button className="btn btn--ghost" onClick={resetLocal}>
              Reset
            </button>
          )}
          <button className="btn btn--ghost" onClick={() => setShowBoard((b) => !b)}>
            {showBoard ? 'Hide whiteboard' : 'Whiteboard'}
          </button>
          {!solved && stepsAllowed && !showSteps && (
            <button className="btn btn--ghost" onClick={() => setShowSteps(true)}>
              Show me the steps
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
              Finish lesson
            </button>
          )}
        </div>

        {!solved && (
          <p className="lesson-hint">
            Multiply an equation if needed so a variable's coefficients match, then add or subtract to
            eliminate it. Solve for one variable, then substitute back for the other.
          </p>
        )}
      </main>
    </div>
  )
}
