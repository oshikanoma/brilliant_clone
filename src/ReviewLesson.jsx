import { useState } from 'react'
import OwlSpeech from './OwlSpeech.jsx'

// The "Review" checkpoint closes out the Algebra Foundations section. It's a
// mixed multiple-choice quiz drawing one question from each foundational skill
// (solving, order of operations, like terms, distributing, evaluating). The
// student must score at least 80% on the first try of each question to pass and
// unlock the next section.

const QUESTIONS = [
  {
    id: 'solve',
    topic: 'Solving Equations',
    prompt: 'Solve for x:  x + 7 = 12',
    options: ['x = 5', 'x = 19', 'x = 7', 'x = 12'],
    correct: 0,
    explain: 'Subtract 7 from both sides: x = 12 − 7 = 5.',
  },
  {
    id: 'order1',
    topic: 'Order of Operations',
    prompt: 'Simplify:  2 + 3 × 4',
    options: ['14', '20', '24', '9'],
    correct: 0,
    explain: 'Multiply before you add: 3 × 4 = 12, then 2 + 12 = 14.',
  },
  {
    id: 'order2',
    topic: 'Order of Operations',
    prompt: 'Simplify:  (6 − 2) × 3',
    options: ['12', '4', '0', '7'],
    correct: 0,
    explain: 'Parentheses first: 6 − 2 = 4, then 4 × 3 = 12.',
  },
  {
    id: 'liketerms',
    topic: 'Combining Like Terms',
    prompt: 'Combine like terms:  3x + 5x − 2',
    options: ['8x − 2', '8x', '6x', '10x'],
    correct: 0,
    explain: 'Add the x-terms: 3x + 5x = 8x. The −2 has no like term, so it stays.',
  },
  {
    id: 'distribute',
    topic: 'Distributive Property',
    prompt: 'Expand:  2(x + 4)',
    options: ['2x + 8', '2x + 4', 'x + 8', '2x + 6'],
    correct: 0,
    explain: 'Multiply 2 by each term inside: 2·x + 2·4 = 2x + 8.',
  },
  {
    id: 'evaluate',
    topic: 'Evaluating Expressions',
    prompt: 'If x = 3, what is  4x − 5 ?',
    options: ['7', '17', '12', '2'],
    correct: 0,
    explain: '4 × 3 − 5 = 12 − 5 = 7.',
  },
]

export default function ReviewLesson({ onBack, onPass, lessonTitle = 'Review', value, onChange }) {
  const qIndex = value.levelIndex
  const results = value.results ?? {}
  const qResult = results[qIndex] ?? { solved: false, wrong: false }

  const [choice, setChoice] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [showSummary, setShowSummary] = useState(false)
  // Brief Bruh hype screen before the very first question.
  const [showIntro, setShowIntro] = useState(qIndex === 0 && !(results[0]?.solved))

  const question = QUESTIONS[qIndex]
  const solved = !!qResult.solved
  const isLast = qIndex === QUESTIONS.length - 1

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

  const retry = () => {
    setChoice(null)
    setLastResult(null)
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
        <div className="intro review-intro">
          <div className="intro__icon" aria-hidden="true">📝</div>
          <p className="intro__eyebrow">Algebra Foundations · Checkpoint</p>
          <h2 className="intro__title">Let's put your skills to the test!</h2>
          <OwlSpeech
            tone="ok"
            text={
              <span>
                You've learned a lot — solving equations, order of operations, like
                terms, distributing, and evaluating. <strong>Let's see what stuck.</strong>
              </span>
            }
          />
          <button className="btn intro__btn" onClick={() => setShowIntro(false)}>
            Show me what you've got →
          </button>
        </div>
      </div>
    )
  }

  // ---- Summary screen ----
  if (showSummary) {
    const total = QUESTIONS.length
    const correctCount = QUESTIONS.reduce(
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
          <p className="summary__eyebrow">Review complete</p>
          <div className={`summary__score ${passed ? 'summary__score--pass' : 'summary__score--fail'}`}>
            {pct}%
          </div>
          <p className="summary__count">{correctCount} of {total} correct on the first try</p>
          <ul className="summary__list">
            {QUESTIONS.map((q, i) => {
              const r = results[i] ?? {}
              const ok = r.solved && !r.wrong
              return (
                <li key={q.id} className="summary__item">
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
                Nice work — you've locked in the foundations. The next section is unlocked!
              </p>
              <button className="btn" onClick={onPass ?? onBack}>
                Back to path →
              </button>
            </>
          ) : (
            <>
              <p className="summary__msg summary__msg--todo">
                You need 80% to pass the review. Give it another run — you've got this!
              </p>
              <button className="btn" onClick={retry}>
                Try the review again →
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

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
          aria-valuenow={qIndex + 1}
          aria-valuemin={1}
          aria-valuemax={QUESTIONS.length}
        >
          <div
            className="progress__fill"
            style={{ width: `${((qIndex + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <h2>{question.topic}</h2>
      </div>

      <main className="order">
        <OwlSpeech
          text={<strong>Quick review — pick the right answer to lock in what you've learned.</strong>}
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

        {!solved && <p className="lesson-hint">Choose the answer you think is right, then Submit.</p>}
      </main>
    </div>
  )
}
