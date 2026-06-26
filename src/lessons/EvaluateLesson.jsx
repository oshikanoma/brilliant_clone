import { Fragment, useMemo, useState } from 'react'
import { EVALUATE_LEVELS } from '../data/evaluateLevels.js'
import EvaluateIntro from '../intros/EvaluateIntro.jsx'
import OwlSpeech from '../components/OwlSpeech.jsx'
import MakeupDots from '../components/MakeupDots.jsx'
import { useMakeup, missedIndicesFrom } from '../lib/useMakeup.js'

const OP_DISPLAY = { '+': '+', '-': '−' }

const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Evaluate the expression left to right, using `termVal` to turn each term into
// a number (so we can model both the correct evaluation and common mistakes).
function evalWith(level, termVal) {
  let result = termVal(level.terms[0])
  for (let i = 1; i < level.terms.length; i++) {
    const v = termVal(level.terms[i])
    result = level.ops[i - 1] === '-' ? result - v : result + v
  }
  return result
}

const trueTermVal = (level) => (t) =>
  t.varname === '' ? t.coef : t.coef * level.values[t.varname]

function correctAnswer(level) {
  return evalWith(level, trueTermVal(level))
}

// Value the student gets if they ADD the coefficient and value instead of
// multiplying them (a classic mistake), and if they IGNORE the coefficient.
const addMistakeValue = (level) =>
  evalWith(level, (t) => (t.varname === '' ? t.coef : t.coef + level.values[t.varname]))
const ignoreMistakeValue = (level) =>
  evalWith(level, (t) => (t.varname === '' ? t.coef : level.values[t.varname]))

// A representative variable term, used to phrase explanations with real numbers.
function sampleVarTerm(level) {
  const t = level.terms.find((tt) => tt.varname !== '')
  if (!t) return null
  return { c: t.coef, v: level.values[t.varname], name: t.varname }
}

// Explanation for a specific wrong value the student gave (choice or typed).
function wrongWhy(level, given) {
  const s = sampleVarTerm(level)
  if (s) {
    const chip = s.c === 1 ? s.name : `${s.c}${s.name}`
    if (given === addMistakeValue(level))
      return `It looks like you added the coefficient and the value. ${chip} means ${s.c}×${s.v} = ${s.c * s.v}, not ${s.c} + ${s.v}.`
    if (given === ignoreMistakeValue(level))
      return `Don't drop the coefficient — ${chip} means ${s.c}×${s.v} = ${s.c * s.v}, not just ${s.v}.`
  }
  return 'Not quite. Substitute each value, multiply it by the coefficient in front, then work left to right.'
}

// Build four answer choices: the correct value plus three plausible mistakes,
// each carrying a `why` so Bruh can explain a wrong pick.
function makeOptions(level) {
  const correct = correctAnswer(level)
  const byVal = new Map([[correct, null]])

  const labeled = [addMistakeValue(level), ignoreMistakeValue(level)]
  const fillers = [correct + 2, correct - 2, correct + 1, correct - 1, correct + 3]

  for (const c of [...labeled, ...fillers]) {
    if (byVal.size >= 4) break
    if (Number.isInteger(c) && c > 0 && !byVal.has(c)) byVal.set(c, wrongWhy(level, c))
  }
  let pad = correct + 4
  while (byVal.size < 4) {
    if (pad > 0 && !byVal.has(pad)) byVal.set(pad, wrongWhy(level, pad))
    pad += 1
  }
  const options = shuffle([...byVal.keys()].map((value) => ({ value, why: byVal.get(value) })))
  return { correct, options }
}

// Generate a fresh evaluation problem with the same shape/mode as `level`:
// same variables and term layout, new random coefficients/values/ops, kept to a
// positive integer result.
function generateLike(level) {
  const usedVars = [...new Set(level.terms.filter((t) => t.varname !== '').map((t) => t.varname))]
  const values = {}
  usedVars.forEach((v) => {
    values[v] = rint(2, 7)
  })
  const terms = level.terms.map((t) => ({
    coef: t.varname === '' ? rint(1, 6) : rint(2, 4),
    varname: t.varname,
  }))
  const lvl = {
    mode: level.mode,
    values,
    terms,
    ops: level.ops.map(() => (Math.random() < 0.5 ? '+' : '-')),
    title: level.title,
    instruction: '',
  }
  for (let i = 0; i < 20 && correctAnswer(lvl) <= 0; i++) {
    lvl.ops = lvl.ops.map(() => (Math.random() < 0.5 ? '+' : '-'))
  }
  if (correctAnswer(lvl) <= 0) lvl.ops = lvl.ops.map(() => '+')
  lvl.instruction =
    level.mode === 'choice'
      ? 'Substitute each variable, then choose what the expression equals.'
      : 'Substitute each variable, work left to right, then type the value.'
  return lvl
}

// One generated evaluation question for the make-up flow.
function EvaluateMakeupPlayer({ level, onResult }) {
  const { correct, options } = useMemo(() => makeOptions(level), [level])
  const [subbed, setSubbed] = useState(() => new Set())
  const [choice, setChoice] = useState(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [everWrong, setEverWrong] = useState(false)
  const locked = result === 'correct'

  const varIndices = level.terms.map((t, i) => (t.varname === '' ? -1 : i)).filter((i) => i >= 0)
  const fullySubbed = varIndices.every((i) => subbed.has(i))
  const isCorrect = level.mode === 'choice' ? choice === correct : Number(answer) === correct
  const canSubmit =
    !locked && fullySubbed && (level.mode === 'choice' ? choice != null : answer.trim() !== '')

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
    resultText = `✓ Correct! The expression equals ${correct}.`
  } else if (result === 'wrong') {
    resultTone = 'bad'
    if (level.mode === 'choice') {
      const chosen = options.find((o) => o.value === choice)
      resultText = chosen?.why ?? wrongWhy(level, choice)
    } else {
      resultText = wrongWhy(level, Number(answer))
    }
  }

  return (
    <main className="order">
      <OwlSpeech text={<strong>{level.instruction}</strong>} tone="neutral" />

      <div className="given" aria-label="Given values">
        {varIndices.length > 0 && <span className="given__label">Given</span>}
        {Object.entries(level.values).map(([name, val]) => (
          <span key={name} className="given__item">
            {name} = <strong>{val}</strong>
          </span>
        ))}
      </div>

      <div className="evalexpr" aria-label="Expression to evaluate">
        {level.terms.map((t, i) => {
          const done = subbed.has(i)
          return (
            <Fragment key={i}>
              {i > 0 && <span className="eval-op">{OP_DISPLAY[level.ops[i - 1]]}</span>}
              <span className="eval-term">
                {t.varname === '' ? (
                  <span className="eval-const">{t.coef}</span>
                ) : (
                  <>
                    {t.coef !== 1 && <span className="eval-coef">{t.coef}</span>}
                    <button
                      type="button"
                      className={'var-chip' + (done ? ' var-chip--done' : '')}
                      onClick={() => !locked && setSubbed((prev) => new Set(prev).add(i))}
                      disabled={done || locked}
                      aria-label={done ? `${t.varname} substituted` : `Substitute ${t.varname}`}
                    >
                      {done ? `(${level.values[t.varname]})` : t.varname}
                    </button>
                  </>
                )}
              </span>
            </Fragment>
          )
        })}
      </div>

      {level.mode === 'choice' ? (
        <div className="choices" role="group" aria-label="Choose the value">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={'choice' + (choice === opt.value ? ' choice--sel' : '')}
              disabled={!fullySubbed || locked}
              onClick={() => {
                setChoice(opt.value)
                setResult(null)
              }}
            >
              {opt.value}
            </button>
          ))}
        </div>
      ) : (
        <div className="answer">
          <label className="answer__label" htmlFor="mk-eval-answer">
            Your answer
          </label>
          <input
            id="mk-eval-answer"
            className="answer__input"
            type="number"
            inputMode="numeric"
            value={answer}
            disabled={!fullySubbed || locked}
            placeholder="?"
            onChange={(e) => {
              setAnswer(e.target.value)
              setResult(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        </div>
      )}

      {resultText && (
        <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
          {resultText}
        </p>
      )}

      <div className="controls">
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
          {!fullySubbed
            ? 'Tap each variable to drop in the value it stands for.'
            : level.mode === 'choice'
              ? 'Now evaluate and choose the answer below.'
              : 'Now evaluate and type the value below.'}
        </p>
      )}
    </main>
  )
}

export default function EvaluateLesson({
  onBack,
  onPass,
  lessonTitle = 'Evaluating Expressions',
  value,
  onChange,
}) {
  const levelIndex = value.levelIndex
  const level = EVALUATE_LEVELS[levelIndex]

  const results = value.results ?? {}
  const levelResult = results[levelIndex] ?? { solved: false, wrong: false }

  const { correct, options } = useMemo(() => makeOptions(level), [level])

  // Which term indices have had their variable substituted in.
  const [subbed, setSubbed] = useState(() => new Set())
  const [choice, setChoice] = useState(null)
  const [answer, setAnswer] = useState('')
  const [lastResult, setLastResult] = useState(null)
  const [showIntro, setShowIntro] = useState(levelIndex === 0 && !levelResult.solved)
  const [showSummary, setShowSummary] = useState(false)
  const [mkDone, setMkDone] = useState(false)
  const makeup = useMakeup((idx) => generateLike(EVALUATE_LEVELS[idx]), () => setMkDone(true))
  const missed = missedIndicesFrom(results, EVALUATE_LEVELS.length)

  const solved = !!levelResult.solved
  const isLast = levelIndex === EVALUATE_LEVELS.length - 1

  // Variable term indices that still need substituting.
  const varIndices = level.terms
    .map((t, i) => (t.varname === '' ? -1 : i))
    .filter((i) => i >= 0)
  const fullySubbed = varIndices.every((i) => subbed.has(i))

  const resetLocal = () => {
    setSubbed(new Set())
    setChoice(null)
    setAnswer('')
    setLastResult(null)
  }

  const popVar = (i) => {
    if (solved) return
    setLastResult(null)
    setSubbed((prev) => new Set(prev).add(i))
  }

  const submit = () => {
    if (!fullySubbed) return
    let ok
    if (level.mode === 'choice') {
      if (choice == null) return
      ok = choice === correct
    } else {
      if (answer.trim() === '') return
      ok = Number(answer) === correct
    }
    setLastResult(ok ? 'correct' : 'wrong')
    onChange({
      levelIndex,
      results: {
        ...results,
        [levelIndex]: { solved: ok || levelResult.solved, wrong: levelResult.wrong || !ok },
      },
    })
  }

  const resetLevel = () => {
    resetLocal()
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
        <EvaluateIntro onDone={() => setShowIntro(false)} />
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
          <h2>Make-up · {EVALUATE_LEVELS[makeup.sourceIndex].title}</h2>
        </div>
        <EvaluateMakeupPlayer key={makeup.seq} level={makeup.question} onResult={makeup.registerResult} />
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
    const total = EVALUATE_LEVELS.length
    const correctCount = EVALUATE_LEVELS.reduce(
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
            {EVALUATE_LEVELS.map((lvl, i) => {
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
              <button className="btn" onClick={onPass ?? onBack}>Back to path →</button>
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

  // ---- Question (Bruh, top), step hint (bottom), result (under answers) ----
  const questionText = level.instruction
  const hintText = !fullySubbed
    ? 'Tap each variable to drop in the value it stands for.'
    : level.mode === 'choice'
      ? 'Now evaluate and choose the answer below.'
      : 'Now evaluate and type the value below.'
  let resultTone = null
  let resultText = ''
  if (solved) {
    resultTone = 'ok'
    resultText = `✓ Correct! The expression equals ${correct}.`
  } else if (lastResult === 'wrong') {
    resultTone = 'bad'
    if (level.mode === 'choice') {
      const chosen = options.find((o) => o.value === choice)
      resultText = chosen?.why ?? wrongWhy(level, choice)
    } else {
      resultText = wrongWhy(level, Number(answer))
    }
  }

  const canSubmit =
    !solved &&
    fullySubbed &&
    (level.mode === 'choice' ? choice != null : answer.trim() !== '')

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
          aria-valuemax={EVALUATE_LEVELS.length}
        >
          <div
            className="progress__fill"
            style={{ width: `${((levelIndex + 1) / EVALUATE_LEVELS.length) * 100}%` }}
          />
        </div>
        <h2>{level.title}</h2>
      </div>

      <main className="order">
        <OwlSpeech text={<strong>{questionText}</strong>} tone="neutral" />

        <div className="given" aria-label="Given values">
          {varIndices.length > 0 && <span className="given__label">Given</span>}
          {Object.entries(level.values).map(([name, val]) => (
            <span key={name} className="given__item">
              {name} = <strong>{val}</strong>
            </span>
          ))}
        </div>

        <div className="evalexpr" aria-label="Expression to evaluate">
          {level.terms.map((t, i) => {
            const done = subbed.has(i)
            return (
              <Fragment key={i}>
                {i > 0 && <span className="eval-op">{OP_DISPLAY[level.ops[i - 1]]}</span>}
                <span className="eval-term">
                  {t.varname === '' ? (
                    <span className="eval-const">{t.coef}</span>
                  ) : (
                    <>
                      {t.coef !== 1 && <span className="eval-coef">{t.coef}</span>}
                      <button
                        type="button"
                        className={'var-chip' + (done ? ' var-chip--done' : '')}
                        onClick={() => popVar(i)}
                        disabled={done || solved}
                        aria-label={
                          done
                            ? `${t.varname} substituted with ${level.values[t.varname]}`
                            : `Substitute ${t.varname}`
                        }
                      >
                        {done ? `(${level.values[t.varname]})` : t.varname}
                      </button>
                    </>
                  )}
                </span>
              </Fragment>
            )
          })}
        </div>

        {level.mode === 'choice' ? (
          <div className="choices" role="group" aria-label="Choose the value">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={'choice' + (choice === opt.value ? ' choice--sel' : '')}
                disabled={!fullySubbed || solved}
                onClick={() => {
                  setChoice(opt.value)
                  setLastResult(null)
                }}
              >
                {opt.value}
              </button>
            ))}
          </div>
        ) : (
          <div className="answer">
            <label className="answer__label" htmlFor="eval-answer">
              Your answer
            </label>
            <input
              id="eval-answer"
              className="answer__input"
              type="number"
              inputMode="numeric"
              value={answer}
              disabled={!fullySubbed || solved}
              placeholder="?"
              onChange={(e) => {
                setAnswer(e.target.value)
                setLastResult(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>
        )}

        {resultText && (
          <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
            {resultText}
          </p>
        )}

        <div className="controls">
          {!solved && subbed.size > 0 && (
            <button className="btn btn--ghost" onClick={resetLevel}>
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
              Finish lesson
            </button>
          )}
        </div>

        {!solved && <p className="lesson-hint">{hintText}</p>}
      </main>
    </div>
  )
}
