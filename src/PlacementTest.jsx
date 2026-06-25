import { useMemo, useState } from 'react'
import OwlSpeech from './OwlSpeech.jsx'
import { shuffleAll } from './shuffleChoices.js'

// A short placement test offered to brand-new accounts. It mirrors the Review
// checkpoint (one question per foundational skill) and gives feedback after
// every answer. Acing it on the first try lets the student test out of the
// whole Algebra Foundations module and jump straight to graphs.

const BASE_QUESTIONS = [
  {
    id: 'solve',
    topic: 'Solving Equations',
    prompt: 'Solve for x:  2x = 10',
    options: ['x = 5', 'x = 20', 'x = 8', 'x = 12'],
    correct: 0,
    explain: 'Divide both sides by 2: x = 10 ÷ 2 = 5.',
  },
  {
    id: 'order1',
    topic: 'Order of Operations',
    prompt: 'Simplify:  6 + 2 × 5',
    options: ['16', '40', '20', '13'],
    correct: 0,
    explain: 'Multiply before adding: 2 × 5 = 10, then 6 + 10 = 16.',
  },
  {
    id: 'order2',
    topic: 'Order of Operations',
    prompt: 'Simplify:  (8 − 3) × 2',
    options: ['10', '5', '2', '13'],
    correct: 0,
    explain: 'Parentheses first: 8 − 3 = 5, then 5 × 2 = 10.',
  },
  {
    id: 'liketerms',
    topic: 'Combining Like Terms',
    prompt: 'Combine like terms:  4a + 2a − 3',
    options: ['6a − 3', '6a', '3a', '6a + 3'],
    correct: 0,
    explain: 'Add the a-terms: 4a + 2a = 6a. The −3 has no like term, so it stays.',
  },
  {
    id: 'distribute',
    topic: 'Distributive Property',
    prompt: 'Expand:  3(x + 2)',
    options: ['3x + 6', '3x + 2', 'x + 6', '3x + 5'],
    correct: 0,
    explain: 'Multiply 3 by each term inside: 3·x + 3·2 = 3x + 6.',
  },
  {
    id: 'evaluate',
    topic: 'Evaluating Expressions',
    prompt: 'If x = 4, what is  2x + 1 ?',
    options: ['9', '7', '24', '6'],
    correct: 0,
    explain: '2 × 4 + 1 = 8 + 1 = 9.',
  },
]

export default function PlacementTest({ onExit }) {
  // Shuffle each question's options once per attempt so the answer isn't always first.
  const QUESTIONS = useMemo(() => shuffleAll(BASE_QUESTIONS), [])
  const [qIndex, setQIndex] = useState(0)
  const [choice, setChoice] = useState(null)
  const [locked, setLocked] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(null)
  // Track first-try correctness per question id.
  const [firstTry, setFirstTry] = useState({})
  const [showSummary, setShowSummary] = useState(false)

  const question = QUESTIONS[qIndex]
  const isLast = qIndex === QUESTIONS.length - 1

  const submit = () => {
    if (choice == null || locked) return
    const ok = choice === question.correct
    setWasCorrect(ok)
    setLocked(true)
    setFirstTry((prev) => ({ ...prev, [question.id]: ok }))
  }

  const goNext = () => {
    setChoice(null)
    setLocked(false)
    setWasCorrect(null)
    if (isLast) setShowSummary(true)
    else setQIndex((i) => i + 1)
  }

  // ---- Summary / verdict ----
  if (showSummary) {
    const correctCount = QUESTIONS.reduce((n, q) => n + (firstTry[q.id] ? 1 : 0), 0)
    const passed = correctCount === QUESTIONS.length
    return (
      <div className="app">
        <header className="app__header app__header--lesson">
          <h1>Placement test</h1>
        </header>
        <div className="summary">
          <p className="summary__eyebrow">Placement complete</p>
          <div className={`summary__score ${passed ? 'summary__score--pass' : 'summary__score--fail'}`}>
            {correctCount}/{QUESTIONS.length}
          </div>
          <ul className="summary__list">
            {QUESTIONS.map((q) => {
              const ok = firstTry[q.id]
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
                Whoa — a perfect score! You clearly know the foundations. I'll skip you straight
                to <strong>Graphs and Linear Relationships</strong>.
              </p>
              <button className="btn" onClick={() => onExit(true)}>
                Jump to graphs →
              </button>
            </>
          ) : (
            <>
              <p className="summary__msg summary__msg--todo">
                Close, but not a clean sweep — and that's totally fine! Let's build the foundations
                properly so graphs feel easy later.
              </p>
              <button className="btn" onClick={() => onExit(false)}>
                Start from the beginning →
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  let tone = null
  let feedback = ''
  if (locked) {
    tone = wasCorrect ? 'ok' : 'bad'
    feedback = wasCorrect ? `✓ Correct! ${question.explain}` : `Not quite. ${question.explain}`
  }

  return (
    <div className="app">
      <header className="app__header app__header--lesson">
        <h1>Placement test</h1>
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
          text={<strong>Answer each one — get them all right and you can skip the fundamentals!</strong>}
          tone="neutral"
        />

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

        {feedback && (
          <p className={`answer-feedback answer-feedback--${tone}`} role="status" aria-live="polite">
            {feedback}
          </p>
        )}

        <div className="controls">
          {!locked && choice != null && (
            <button className="btn" onClick={submit}>
              Submit
            </button>
          )}
          {locked && (
            <button className="btn" onClick={goNext}>
              {isLast ? 'See results →' : 'Next →'}
            </button>
          )}
        </div>

        {!locked && <p className="lesson-hint">Pick the answer you think is right, then Submit.</p>}
      </main>
    </div>
  )
}
