import { useState } from 'react'
import OwlSpeech from './OwlSpeech.jsx'

// The "Review" checkpoint closes out the Graphs and Linear Relationships
// section. It's a mixed multiple-choice quiz drawing one question from each
// graphing skill (y-intercept, slope, reading/graphing a line, and systems of
// equations). The student must score at least 80% on the first try of each
// question to pass and unlock the next section.

const QUESTIONS = [
  {
    id: 'yintercept',
    topic: 'Y-Intercept',
    prompt: 'What is the y-intercept of  y = 3x − 4 ?',
    options: ['(0, −4)', '(0, 3)', '(−4, 0)', '(0, 4)'],
    correct: 0,
    explain: 'The y-intercept is where x = 0: y = 3·0 − 4 = −4, so the point is (0, −4).',
  },
  {
    id: 'slope',
    topic: 'Slope',
    prompt: 'What is the slope of  y = −2x + 5 ?',
    options: ['−2', '5', '2', '−5'],
    correct: 0,
    explain: 'In y = mx + b, the slope m is the coefficient of x — here that is −2.',
  },
  {
    id: 'riserun',
    topic: 'Slope',
    prompt: 'A line goes up 6 units for every 3 units it moves right. What is its slope?',
    options: ['2', '1/2', '3', '6'],
    correct: 0,
    explain: 'Slope = rise / run = 6 / 3 = 2.',
  },
  {
    id: 'readline',
    topic: 'Reading a Line',
    prompt: 'A line passes through (0, 1) with slope 2. Which point is also on the line?',
    options: ['(1, 3)', '(1, 2)', '(2, 1)', '(1, −1)'],
    correct: 0,
    explain: 'Start at (0, 1) and move right 1, up 2: that lands on (1, 3).',
  },
  {
    id: 'systems-concept',
    topic: 'Systems of Equations',
    prompt: 'The solution to a system of two lines is the point where the lines ___?',
    options: ['cross / intersect', 'are parallel', 'have the same slope', 'hit the y-axis'],
    correct: 0,
    explain: 'A system is solved at the point where both lines cross — it satisfies both equations.',
  },
  {
    id: 'systems-solve',
    topic: 'Systems of Equations',
    prompt: 'Where do the lines  y = x + 1  and  y = −x + 5  meet?',
    options: ['(2, 3)', '(3, 2)', '(1, 5)', '(0, 1)'],
    correct: 0,
    explain: 'Set x + 1 = −x + 5 → 2x = 4 → x = 2, then y = 2 + 1 = 3. They meet at (2, 3).',
  },
]

export default function GraphsReviewLesson({ onBack, onPass, lessonTitle = 'Review', value, onChange }) {
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
          <div className="intro__icon" aria-hidden="true">📈</div>
          <p className="intro__eyebrow">Graphs &amp; Linear Relationships · Checkpoint</p>
          <h2 className="intro__title">Time to test your graphing skills!</h2>
          <OwlSpeech
            tone="ok"
            text={
              <span>
                You've covered y-intercepts, slope, reading lines, and systems of
                equations. <strong>Let's see what stuck.</strong>
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
                Incredible — you've mastered graphs and linear relationships. The next section is unlocked!
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
