import { useMemo, useState } from 'react'
import OwlSpeech from './OwlSpeech.jsx'
import MakeupDots from './MakeupDots.jsx'
import { useMakeup, missedIndicesFrom } from './useMakeup.js'
import { shuffleAll, shuffleChoices } from './shuffleChoices.js'

// A reusable multiple-choice lesson engine that powers every "Expressions with
// Exponents" and "Quadratics and Polynomials" checkpoint (and their section
// reviews). A checkpoint supplies:
//   levels          - [{ id, topic, prompt, options, correct, explain }]
//   IntroComponent  - an animated concept cutscene (rendered first), OR
//   intro           - a simple static intro object { icon, eyebrow, title, blurb }
//   generateLike    - (level) => { prompt, options, correct, explain } for make-up
//   isReview        - true for section reviews (changes summary wording only)
//   passPct         - if set (e.g. 80), the checkpoint is a pass/fail exam scored
//                     on first-try correctness instead of using the make-up flow
//
// Most checkpoints work the same way: the student must answer each level
// correctly to advance (wrong attempts are remembered), then make up every
// missed level by answering three in a row. Concept checkpoints draw freshly
// generated similar questions for make-up; reviews (no generateLike) re-ask the
// missed question with its options reshuffled. When `passPct` is set, the
// checkpoint is instead a cumulative exam: score ≥ passPct on the first try of
// each question to pass, otherwise retry the whole thing.

function MakeupMC({ question, onResult }) {
  const [choice, setChoice] = useState(null)
  const [locked, setLocked] = useState(false)

  if (!question) return null
  const ok = choice === question.correct

  const submit = () => {
    if (choice == null || locked) return
    setLocked(true)
  }

  return (
    <>
      <div className="review-q" aria-label="Question">
        {question.prompt}
      </div>
      <div className="choices" role="group" aria-label="Choose the answer">
        {question.options.map((opt, i) => {
          const sel = choice === i
          const showAsCorrect = locked && i === question.correct
          const showAsWrong = locked && sel && i !== question.correct
          return (
            <button
              key={i}
              type="button"
              className={
                'choice' +
                (sel ? ' choice--sel' : '') +
                (showAsCorrect ? ' choice--correct' : '') +
                (showAsWrong ? ' choice--wrong' : '')
              }
              disabled={locked}
              onClick={() => setChoice(i)}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {locked && (
        <p
          className={`answer-feedback answer-feedback--${ok ? 'ok' : 'bad'}`}
          role="status"
          aria-live="polite"
        >
          {ok ? `✓ Correct! ${question.explain}` : `Not quite. ${question.explain}`}
        </p>
      )}

      <div className="controls">
        {!locked && choice != null && (
          <button className="btn" onClick={submit}>
            Submit
          </button>
        )}
        {locked && (
          <button className="btn" onClick={() => onResult(ok)}>
            {ok ? 'Next →' : 'Try another →'}
          </button>
        )}
      </div>
    </>
  )
}

export default function ConceptLesson({
  onBack,
  onPass,
  lessonTitle = 'Lesson',
  levels: rawLevels,
  IntroComponent = null,
  intro = null,
  generateLike = null,
  isReview = false,
  passPct = null,
  value,
  onChange,
}) {
  // Shuffle each question's options once per attempt so the answer isn't always
  // the first choice. (Make-up questions from generateLike are already shuffled.)
  const levels = useMemo(() => shuffleAll(rawLevels), [rawLevels])
  const qIndex = value.levelIndex
  const results = value.results ?? {}
  const qResult = results[qIndex] ?? { solved: false, wrong: false }

  const [choice, setChoice] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [showSummary, setShowSummary] = useState(false)
  const [showIntro, setShowIntro] = useState(qIndex === 0 && !(results[0]?.solved))
  const [mkDone, setMkDone] = useState(false)

  // Every checkpoint enforces make-up: a missed question must be earned back by
  // answering three in a row. Concept checkpoints generate fresh similar
  // questions; reviews (no generator) re-ask the missed question with its
  // options reshuffled.
  const makeup = useMakeup(
    (idx) => (generateLike ? generateLike(levels[idx]) : shuffleChoices(levels[idx])),
    () => setMkDone(true)
  )

  const question = levels[qIndex]
  const solved = !!qResult.solved
  const isLast = qIndex === levels.length - 1

  const submit = () => {
    if (choice == null || solved) return
    const ok = choice === question.correct
    setLastResult(ok ? 'correct' : 'wrong')
    onChange({
      levelIndex: qIndex,
      results: {
        ...results,
        [qIndex]: { solved: ok || qResult.solved, wrong: qResult.wrong || !ok },
      },
    })
  }

  const goNext = () => {
    setChoice(null)
    setLastResult(null)
    onChange({ levelIndex: qIndex + 1, results })
  }

  // Exam mode (passPct set): a failing score replays the whole exam from scratch.
  const retry = () => {
    setChoice(null)
    setLastResult(null)
    setShowSummary(false)
    setMkDone(false)
    onChange({ levelIndex: 0, results: {} })
  }

  const Header = (
    <header className="app__header app__header--lesson">
      <button className="back-btn" onClick={onBack} aria-label="Back to path">
        ← Path
      </button>
      <h1>{lessonTitle}</h1>
    </header>
  )

  // ---- Intro screen ----
  if (showIntro) {
    if (IntroComponent) {
      return (
        <div className="app">
          {Header}
          <IntroComponent onDone={() => setShowIntro(false)} />
        </div>
      )
    }
    const info = intro ?? {}
    return (
      <div className="app">
        {Header}
        <div className="intro review-intro">
          <div className="intro__icon" aria-hidden="true">{info.icon ?? '📝'}</div>
          {info.eyebrow && <p className="intro__eyebrow">{info.eyebrow}</p>}
          <h2 className="intro__title">{info.title ?? "Let's go!"}</h2>
          <OwlSpeech
            tone="ok"
            text={<span>{info.blurb ?? <strong>Let's see what stuck.</strong>}</span>}
          />
          <button className="btn intro__btn" onClick={() => setShowIntro(false)}>
            {info.cta ?? 'Show me what you’ve got →'}
          </button>
        </div>
      </div>
    )
  }

  // ---- Make-up flow ----
  if (showSummary && passPct == null && makeup.active) {
    return (
      <div className="app">
        {Header}
        <div className="level-head">
          <MakeupDots stars={makeup.stars} total={makeup.total} />
          <h2>Make-up: {levels[makeup.sourceIndex]?.topic}</h2>
        </div>
        <main className="order">
          <OwlSpeech
            tone="neutral"
            text={<strong>Answer three in a row to make up the ones you missed.</strong>}
          />
          <MakeupMC
            key={makeup.seq}
            question={makeup.question}
            onResult={(ok) => makeup.registerResult(ok)}
          />
        </main>
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
    // Exam mode: pass/fail by first-try score, no make-up.
    if (passPct != null) {
      const pct = Math.round((correctCount / total) * 100)
      const passed = pct >= passPct
      return (
        <div className="app">
          {Header}
          <div className="summary">
            <p className="summary__eyebrow">Final exam complete</p>
            <div className={`summary__score ${passed ? 'summary__score--pass' : 'summary__score--fail'}`}>
              {pct}%
            </div>
            <p className="summary__count">{correctCount} of {total} correct on the first try</p>
            <ul className="summary__list">
              {levels.map((q, i) => {
                const r = results[i] ?? {}
                const ok = r.solved && !r.wrong
                return (
                  <li key={q.id ?? i} className="summary__item">
                    <span className={`summary__mark ${ok ? 'summary__mark--ok' : 'summary__mark--bad'}`}>
                      {ok ? '✓' : ''}
                    </span>
                    <span className="summary__title">{q.topic}</span>
                  </li>
                )
              })}
            </ul>
            {passed ? (
              <>
                <p className="summary__msg summary__msg--pass">
                  You passed the final exam with {pct}%! Head back to the path to walk the stage.
                </p>
                <button className="btn" onClick={onPass ?? onBack}>
                  Back to path →
                </button>
              </>
            ) : (
              <>
                <p className="summary__msg summary__msg--todo">
                  You need {passPct}% to pass the final exam. You scored {pct}% — give it another run.
                </p>
                <button className="btn" onClick={retry}>
                  Retake the exam →
                </button>
              </>
            )}
          </div>
        </div>
      )
    }

    const missed = missedIndicesFrom(results, levels.length)
    // Pass only once every missed question has been made up (3 in a row each).
    const cleared = mkDone || missed.length === 0
    return (
      <div className="app">
        {Header}
        <div className="summary">
          <p className="summary__eyebrow">{isReview ? 'Review complete' : 'Checkpoint complete'}</p>
          <div className={`summary__score ${cleared ? 'summary__score--pass' : 'summary__score--fail'}`}>
            {correctCount}/{total}
          </div>
          <p className="summary__count">{correctCount} of {total} correct on the first try</p>
          <ul className="summary__list">
            {levels.map((q, i) => {
              const r = results[i] ?? {}
              const ok = r.solved && !r.wrong
              return (
                <li key={q.id ?? i} className="summary__item">
                  <span className={`summary__mark ${ok ? 'summary__mark--ok' : 'summary__mark--bad'}`}>
                    {ok ? '✓' : ''}
                  </span>
                  <span className="summary__title">{q.topic}</span>
                </li>
              )
            })}
          </ul>
          {cleared ? (
            <>
              <p className="summary__msg summary__msg--pass">
                {isReview
                  ? "Excellent — you've mastered this section. The next one is unlocked!"
                  : 'Nice work — that skill is locked in. The next checkpoint is unlocked!'}
              </p>
              <button className="btn" onClick={onPass ?? onBack}>
                Back to path →
              </button>
            </>
          ) : (
            <>
              <p className="summary__msg summary__msg--todo">
                You missed {missed.length} — make {missed.length === 1 ? 'it' : 'them'} up by
                answering three in a row for each to lock {missed.length === 1 ? 'it' : 'them'} in.
              </p>
              <button className="btn" onClick={() => makeup.start(missed)}>
                Start make-up →
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ---- Question screen ----
  let resultTone = null
  let resultText = ''
  if (solved) {
    resultTone = 'ok'
    resultText = `✓ Correct! ${question.explain}`
  } else if (lastResult === 'wrong') {
    resultTone = 'bad'
    resultText = `Not quite. ${question.explain}`
  }

  return (
    <div className="app">
      {Header}

      <div className="level-head">
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={qIndex + 1}
          aria-valuemin={1}
          aria-valuemax={levels.length}
        >
          <div
            className="progress__fill"
            style={{ width: `${((qIndex + 1) / levels.length) * 100}%` }}
          />
        </div>
        <h2>{question.topic}</h2>
      </div>

      <main className="order">
        <OwlSpeech
          text={<strong>Pick the right answer to lock in what you've learned.</strong>}
          tone="neutral"
        />

        <div className="review-q" aria-label="Question">
          {question.prompt}
        </div>

        <div className="choices" role="group" aria-label="Choose the answer">
          {question.options.map((opt, i) => {
            const sel = choice === i
            const showAsCorrect = solved && i === question.correct
            return (
              <button
                key={i}
                type="button"
                className={
                  'choice' +
                  (sel ? ' choice--sel' : '') +
                  (showAsCorrect ? ' choice--correct' : '')
                }
                disabled={solved}
                onClick={() => {
                  setChoice(i)
                  setLastResult(null)
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {resultText && (
          <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
            {resultText}
          </p>
        )}

        <div className="controls">
          {!solved && choice != null && (
            <button className="btn" onClick={submit}>
              Submit
            </button>
          )}
          {solved && !isLast && (
            <button className="btn" onClick={goNext}>
              Next →
            </button>
          )}
          {solved && isLast && (
            <button className="btn" onClick={() => setShowSummary(true)}>
              See results →
            </button>
          )}
        </div>

        {!solved && (
          <p className="lesson-hint">
            {isReview || passPct != null
              ? 'Choose the answer you think is right, then Submit.'
              : 'Choose the right answer to continue — get it correct to move on.'}
          </p>
        )}
      </main>
    </div>
  )
}
