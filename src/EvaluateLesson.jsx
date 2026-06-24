import { Fragment, useMemo, useState } from 'react'
import { EVALUATE_LEVELS } from './evaluateLevels.js'
import OwlSpeech from './OwlSpeech.jsx'

const OP_DISPLAY = { '+': '+', '-': '−' }

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

// Build four answer choices: the correct value plus three plausible mistakes.
function makeOptions(level) {
  const correct = correctAnswer(level)
  const opts = new Set([correct])

  const candidates = [
    // Added the coefficient and the value instead of multiplying them.
    evalWith(level, (t) => (t.varname === '' ? t.coef : t.coef + level.values[t.varname])),
    // Ignored the coefficient entirely (treated it as 1).
    evalWith(level, (t) => (t.varname === '' ? t.coef : level.values[t.varname])),
    correct + level.values[level.terms[0].varname] || correct + 2,
    correct + 2,
    correct - 2,
    correct + 1,
    correct - 1,
    correct + 3,
  ]

  for (const c of candidates) {
    if (opts.size >= 4) break
    if (Number.isInteger(c) && c > 0 && c !== correct) opts.add(c)
  }
  // Safety net in case duplicates left us short.
  let pad = correct + 4
  while (opts.size < 4) {
    if (pad > 0 && pad !== correct) opts.add(pad)
    pad += 1
  }
  return { correct, options: shuffle([...opts]) }
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
          <div className="intro__icon" aria-hidden="true">🔍</div>
          <p className="intro__eyebrow">Before we start</p>
          <h2 className="intro__title">To evaluate an expression, swap each variable for its value.</h2>
          <p className="intro__blurb">
            A variable like <strong>x</strong> is just a placeholder for a number. To{' '}
            <strong>evaluate</strong> an expression, you replace every variable with the value
            you're given and then do the arithmetic. For example, if{' '}
            <strong>x = 4</strong>, then <strong>2x + 3</strong> becomes{' '}
            <strong>2(4) + 3 = 8 + 3 = 11</strong>. Remember that <strong>2x</strong> means
            "2 times x," so the coefficient multiplies the value you drop in. In these puzzles
            you'll tap each variable to pop in its number, then work out the result.
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

  // ---- Feedback line ----
  let feedbackClass = ''
  let feedbackText = !fullySubbed
    ? 'Tap each variable to drop in the value it stands for.'
    : level.mode === 'choice'
      ? 'Now evaluate and choose the answer.'
      : 'Now evaluate and type the value.'
  if (lastResult === 'wrong') {
    feedbackClass = 'feedback--bad'
    feedbackText = 'Not quite — recheck your arithmetic and try again.'
  } else if (solved) {
    feedbackClass = 'feedback--ok'
    feedbackText = `✓ Correct! The expression equals ${correct}.`
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
        <p>{level.instruction}</p>
      </div>

      <main className="order">
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
                key={opt}
                type="button"
                className={'choice' + (choice === opt ? ' choice--sel' : '')}
                disabled={!fullySubbed || solved}
                onClick={() => {
                  setChoice(opt)
                  setLastResult(null)
                }}
              >
                {opt}
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

        <OwlSpeech
          text={feedbackText}
          tone={feedbackClass === 'feedback--ok' ? 'ok' : feedbackClass === 'feedback--bad' ? 'bad' : 'neutral'}
        />

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
              Finish lesson 🎉
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
