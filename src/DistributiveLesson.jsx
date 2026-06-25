import { Fragment, useMemo, useState } from 'react'
import { DISTRIBUTIVE_LEVELS } from './distributiveLevels.js'
import DistributiveIntro from './DistributiveIntro.jsx'
import OwlSpeech from './OwlSpeech.jsx'
import MakeupDots from './MakeupDots.jsx'
import { useMakeup, missedIndicesFrom } from './useMakeup.js'

const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Render a single term, e.g. {2,'x'} -> "2x", {1,'x'} -> "x", {3,''} -> "3".
function termText(t) {
  if (t.varname === '') return String(t.coef)
  if (t.coef === 1) return 'x'
  return `${t.coef}x`
}

const exprText = (list) => list.map(termText).join(' + ')

// The parenthesised expression as text, e.g. "3(2x + 1)".
function problemText(level) {
  return `${level.multiplier}(${exprText(level.inside)})`
}

// The correct distributed result: multiply every term's coefficient.
function distribute(level) {
  return level.inside.map((t) => ({ coef: t.coef * level.multiplier, varname: t.varname }))
}

// Build four multiple-choice answers: the correct distributed form plus three
// plausible distractors based on common distribution mistakes. Each distractor
// carries a `why` so Bruh can explain exactly what went wrong if it's picked.
function makeOptions(level) {
  const m = level.multiplier
  const [first, second] = level.inside
  const a = first.coef
  const b = second.coef
  const correct = exprText(distribute(level))

  const candidates = [
    {
      terms: [{ coef: m * a, varname: 'x' }, { coef: b, varname: '' }],
      why: `You multiplied the x-term by ${m} but left the ${b} alone. The ${m} has to be shared with every term inside the parentheses, so the ${b} becomes ${m}×${b} = ${m * b}.`,
    },
    {
      terms: [{ coef: a, varname: 'x' }, { coef: m * b, varname: '' }],
      why: `You distributed the ${m} to the constant but not to the x-term. The ${m} multiplies everything inside, so ${a === 1 ? 'x' : a + 'x'} becomes ${m}×${a} = ${m * a}x.`,
    },
    {
      terms: [{ coef: m * a, varname: 'x' }, { coef: m + b, varname: '' }],
      why: `Careful — the ${m} multiplies the ${b}, it isn't added to it. ${m}×${b} = ${m * b}, not ${m} + ${b} = ${m + b}.`,
    },
    {
      terms: [{ coef: m + a, varname: 'x' }, { coef: m * b, varname: '' }],
      why: `The ${m} multiplies the coefficient ${a}, it isn't added to it. ${m}×${a} = ${m * a}x, not ${m} + ${a} = ${m + a}x.`,
    },
    {
      terms: [{ coef: m * a + b, varname: 'x' }, { coef: m * b, varname: '' }],
      why: `You can't merge the x-term and the plain number into one term — they aren't alike. Keep ${m * a}x and ${m * b} separate.`,
    },
  ]

  const byText = new Map([[correct, null]])
  for (const c of shuffle(candidates)) {
    if (byText.size >= 4) break
    const text = exprText(c.terms)
    if (!byText.has(text)) byText.set(text, c.why)
  }
  const options = shuffle([...byText.keys()].map((text) => ({ text, why: byText.get(text) })))
  return { correct, options }
}

// Generate a fresh distributive problem in the same style as the fixed levels.
function generateLike() {
  const multiplier = rint(2, 5)
  const inside = [
    { coef: rint(1, 3), varname: 'x' },
    { coef: rint(1, 4), varname: '' },
  ]
  return {
    id: 'mk',
    multiplier,
    inside,
    title: 'Distribute',
    instruction: `Distribute ${multiplier}(${exprText(inside)}): build the area, then choose the simplified expression.`,
  }
}

// One generated distributive question for the make-up flow. Calls onResult(true)
// on a correct pick and onResult(false) on a wrong one.
function DistributiveMakeupPlayer({ level, onResult }) {
  const { correct, options } = useMemo(() => makeOptions(level), [level])
  const [groups, setGroups] = useState(0)
  const [choice, setChoice] = useState(null)
  const [result, setResult] = useState(null)
  const [everWrong, setEverWrong] = useState(false)
  const locked = result === 'correct'

  const built = groups >= level.multiplier
  const isCorrect = choice === correct
  const xTiles =
    level.inside.filter((t) => t.varname === 'x').reduce((n, t) => n + t.coef, 0) * groups
  const unitTiles =
    level.inside.filter((t) => t.varname === '').reduce((n, t) => n + t.coef, 0) * groups

  let resultTone = null
  let resultText = ''
  if (result === 'correct') {
    resultTone = 'ok'
    resultText = `✓ Correct! ${problemText(level)} = ${correct}.`
  } else if (result === 'wrong') {
    resultTone = 'bad'
    const chosen = options.find((o) => o.text === choice)
    resultText = chosen?.why ?? 'Not quite — count every tile in the area, then multiply.'
  }

  return (
    <main className="order">
      <OwlSpeech text={<strong>{level.instruction}</strong>} tone="neutral" />

      <div className="distrib__expr" aria-label="Expression to distribute">
        <span className="distrib__mult">{level.multiplier}</span>
        <span className="distrib__paren">(</span>
        {level.inside.map((t, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="distrib__plus">+</span>}
            <span className={`distrib__term distrib__term--${t.varname === 'x' ? 'x' : 'unit'}`}>
              {termText(t)}
            </span>
          </Fragment>
        ))}
        <span className="distrib__paren">)</span>
      </div>

      <div className="distrib__build">
        <button
          type="button"
          className="multiplier"
          onClick={() => !built && !locked && setGroups((g) => Math.min(level.multiplier, g + 1))}
          disabled={built || locked}
          aria-label={`Add one copy of the group (multiplier ${level.multiplier})`}
        >
          <span className="multiplier__sign">×{level.multiplier}</span>
          <span className="multiplier__hint">{built ? 'Done' : 'Add group'}</span>
          <span className="multiplier__count">{groups} / {level.multiplier}</span>
        </button>

        <div className="area" aria-label="Area model">
          {Array.from({ length: level.multiplier }).map((_, row) => {
            const filled = row < groups
            return (
              <div
                key={row}
                className={'area__row' + (filled ? ' area__row--filled' : ' area__row--ghost')}
              >
                {level.inside.flatMap((t, ti) =>
                  Array.from({ length: t.coef }).map((__, k) => (
                    <span
                      key={`${ti}-${k}`}
                      className={'tile ' + (t.varname === 'x' ? 'tile--x' : 'tile--unit')}
                    >
                      {filled ? (t.varname === 'x' ? 'x' : '1') : ''}
                    </span>
                  ))
                )}
              </div>
            )
          })}
        </div>
      </div>

      {built && (
        <p className="distrib__tally">
          That's <strong>{xTiles}</strong> x-tile{xTiles === 1 ? '' : 's'} and{' '}
          <strong>{unitTiles}</strong> unit{unitTiles === 1 ? '' : 's'} in all.
        </p>
      )}

      <div className="choices" role="group" aria-label="Choose the simplified expression">
        {options.map((opt) => (
          <button
            key={opt.text}
            type="button"
            className={'choice' + (choice === opt.text ? ' choice--sel' : '')}
            disabled={!built || locked}
            onClick={() => {
              setChoice(opt.text)
              setResult(null)
            }}
          >
            {opt.text}
          </button>
        ))}
      </div>

      {resultText && (
        <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
          {resultText}
        </p>
      )}

      <div className="controls">
        {!locked && built && choice != null && (
          <button
            className="btn"
            onClick={() => {
              if (isCorrect) setResult('correct')
              else {
                setResult('wrong')
                setEverWrong(true)
              }
            }}
          >
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
  )
}

export default function DistributiveLesson({
  onBack,
  onPass,
  lessonTitle = 'Distributive Property',
  value,
  onChange,
}) {
  const levelIndex = value.levelIndex
  const level = DISTRIBUTIVE_LEVELS[levelIndex]

  const results = value.results ?? {}
  const levelResult = results[levelIndex] ?? { solved: false, wrong: false }

  // How many copies of the parenthesised group the student has laid down so far.
  const groups = value.groups ?? 0

  // Multiple-choice answers are generated once per level and kept stable.
  const { correct, options } = useMemo(() => makeOptions(level), [level])

  const [choice, setChoice] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [showIntro, setShowIntro] = useState(levelIndex === 0 && (value.groups ?? 0) === 0)
  const [showSummary, setShowSummary] = useState(false)
  const [mkDone, setMkDone] = useState(false)
  const makeup = useMakeup(() => generateLike(), () => setMkDone(true))
  const missed = missedIndicesFrom(results, DISTRIBUTIVE_LEVELS.length)

  const built = groups >= level.multiplier
  const solved = !!levelResult.solved
  const isLast = levelIndex === DISTRIBUTIVE_LEVELS.length - 1
  // On the final two levels, don't hand the student the tile counts — let them
  // work out the total themselves.
  const hideTally = levelIndex >= DISTRIBUTIVE_LEVELS.length - 2

  // Tally of tiles once (or while) the area is built up.
  const xTiles = level.inside
    .filter((t) => t.varname === 'x')
    .reduce((n, t) => n + t.coef, 0) * groups
  const unitTiles = level.inside
    .filter((t) => t.varname === '')
    .reduce((n, t) => n + t.coef, 0) * groups

  const addGroup = () => {
    if (built || solved) return
    setLastResult(null)
    onChange({ levelIndex, groups: Math.min(level.multiplier, groups + 1), results })
  }

  const resetLevel = () => {
    setChoice(null)
    setLastResult(null)
    onChange({ levelIndex, groups: 0, results })
  }

  const submit = () => {
    if (choice == null) return
    const ok = choice === correct
    setLastResult(ok ? 'correct' : 'wrong')
    onChange({
      levelIndex,
      groups,
      results: {
        ...results,
        [levelIndex]: { solved: ok || levelResult.solved, wrong: levelResult.wrong || !ok },
      },
    })
  }

  const goNext = () => {
    setChoice(null)
    setLastResult(null)
    onChange({ levelIndex: levelIndex + 1, groups: 0, results })
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
        <DistributiveIntro onDone={() => setShowIntro(false)} />
      </div>
    )
  }

  // ---- Make-up screen (drilling missed levels) ----
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
          <h2>Make-up · {DISTRIBUTIVE_LEVELS[makeup.sourceIndex].title}</h2>
        </div>
        <DistributiveMakeupPlayer key={makeup.seq} level={makeup.question} onResult={makeup.registerResult} />
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
    const total = DISTRIBUTIVE_LEVELS.length
    const correctCount = DISTRIBUTIVE_LEVELS.reduce(
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
            {DISTRIBUTIVE_LEVELS.map((lvl, i) => {
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
  const hintText = !built
    ? `Tap the ×${level.multiplier} button to stack each copy of the group.`
    : 'The area is built — now pick the simplified expression below.'
  let resultTone = null
  let resultText = ''
  if (solved) {
    resultTone = 'ok'
    resultText = `✓ Correct! ${problemText(level)} = ${correct}.`
  } else if (lastResult === 'wrong') {
    resultTone = 'bad'
    const chosen = options.find((o) => o.text === choice)
    resultText =
      chosen?.why ?? 'Not quite — count every tile in the area, then multiply and try again.'
  }

  const canSubmit = built && !solved && choice != null

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
          aria-valuemax={DISTRIBUTIVE_LEVELS.length}
        >
          <div
            className="progress__fill"
            style={{ width: `${((levelIndex + 1) / DISTRIBUTIVE_LEVELS.length) * 100}%` }}
          />
        </div>
        <h2>{level.title}</h2>
      </div>

      <main className="order">
        <OwlSpeech text={<strong>{questionText}</strong>} tone="neutral" />

        <div className="distrib__expr" aria-label="Expression to distribute">
          <span className="distrib__mult">{level.multiplier}</span>
          <span className="distrib__paren">(</span>
          {level.inside.map((t, i) => (
            <Fragment key={i}>
              {i > 0 && <span className="distrib__plus">+</span>}
              <span className={`distrib__term distrib__term--${t.varname === 'x' ? 'x' : 'unit'}`}>
                {termText(t)}
              </span>
            </Fragment>
          ))}
          <span className="distrib__paren">)</span>
        </div>

        <div className="distrib__build">
          <button
            type="button"
            className="multiplier"
            onClick={addGroup}
            disabled={built || solved}
            aria-label={`Add one copy of the group (multiplier ${level.multiplier})`}
          >
            <span className="multiplier__sign">×{level.multiplier}</span>
            <span className="multiplier__hint">{built ? 'Done' : 'Add group'}</span>
            <span className="multiplier__count">{groups} / {level.multiplier}</span>
          </button>

          <div className="area" aria-label="Area model">
            {Array.from({ length: level.multiplier }).map((_, row) => {
              const filled = row < groups
              return (
                <div
                  key={row}
                  className={'area__row' + (filled ? ' area__row--filled' : ' area__row--ghost')}
                >
                  {level.inside.flatMap((t, ti) =>
                    Array.from({ length: t.coef }).map((__, k) => (
                      <span
                        key={`${ti}-${k}`}
                        className={
                          'tile ' + (t.varname === 'x' ? 'tile--x' : 'tile--unit')
                        }
                      >
                        {filled ? (t.varname === 'x' ? 'x' : '1') : ''}
                      </span>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {built && (
          hideTally ? (
            <p className="distrib__tally">Now how many are there in total?</p>
          ) : (
            <p className="distrib__tally">
              That's <strong>{xTiles}</strong> x-tile{xTiles === 1 ? '' : 's'} and{' '}
              <strong>{unitTiles}</strong> unit{unitTiles === 1 ? '' : 's'} in all.
            </p>
          )
        )}

        <div className="choices" role="group" aria-label="Choose the simplified expression">
          {options.map((opt) => (
            <button
              key={opt.text}
              type="button"
              className={'choice' + (choice === opt.text ? ' choice--sel' : '')}
              disabled={!built || solved}
              onClick={() => {
                setChoice(opt.text)
                setLastResult(null)
              }}
            >
              {opt.text}
            </button>
          ))}
        </div>

        {resultText && (
          <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
            {resultText}
          </p>
        )}

        <div className="controls">
          {!solved && groups > 0 && (
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
