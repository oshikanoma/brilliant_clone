import { useEffect, useRef, useState } from 'react'
import OwlSpeech from './OwlSpeech.jsx'
import { shuffleChoices } from './shuffleChoices.js'
import { CURRICULUM, pickQuestion } from './placementBank.js'
import { nextStep } from './placementLogic.js'
import { CHECKPOINTS } from './LessonPath.jsx'

// Adaptive placement test. It walks the curriculum section by section (easiest
// to hardest), asking two questions per section. You only advance past a section
// if you clear both — so a single lucky answer can't fling you ahead — and you're
// placed at the START of the first section you weren't solid on. The placement is
// intentionally conservative: it's better to relearn a concept than skip it.

const topicFor = (cp) =>
  CURRICULUM.find((c) => c.checkpointIndex === cp)?.topic || CHECKPOINTS[cp] || 'Question'

export default function PlacementTest({ onExit }) {
  const [history, setHistory] = useState([])
  const [current, setCurrent] = useState(null) // { checkpointIndex, topic, question }
  const [choice, setChoice] = useState(null)
  const [locked, setLocked] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(null)
  const [placement, setPlacement] = useState(null) // { completedThrough, sectionName }
  const started = useRef(false)

  // Advance the section-gated engine given the running history.
  const loadStep = (hist) => {
    const step = nextStep(hist)
    if (step.action === 'place') {
      setPlacement(step)
      setCurrent(null)
      return
    }
    setCurrent({
      checkpointIndex: step.checkpointIndex,
      topic: topicFor(step.checkpointIndex),
      question: shuffleChoices(pickQuestion(step.checkpointIndex)),
    })
    setChoice(null)
    setLocked(false)
    setWasCorrect(null)
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    loadStep([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = () => {
    if (choice == null || locked) return
    setWasCorrect(choice === current.question.correct)
    setLocked(true)
  }

  const goNext = () => {
    const next = [
      ...history,
      { checkpointIndex: current.checkpointIndex, topic: current.topic, correct: wasCorrect },
    ]
    setHistory(next)
    loadStep(next)
  }

  // ---- Summary / placement verdict ----
  if (placement) {
    const ct = placement.completedThrough
    const startsAt = ct < 0 ? CHECKPOINTS[0] : CHECKPOINTS[ct + 1]
    const correctCount = history.filter((h) => h.correct).length
    const message =
      ct < 0
        ? "No worries at all — we'll start at the very beginning and build a rock-solid base together."
        : `Based on how you did, I'm starting you at the beginning of ${placement.sectionName}. I'd rather firm up a concept than skip past it — you'll fly once the basics are solid!`

    return (
      <div className="app">
        <header className="app__header app__header--lesson">
          <h1>Placement test</h1>
        </header>
        <div className="summary">
          <p className="summary__eyebrow">Placement complete</p>
          <div className="summary__score summary__score--pass">
            {ct < 0 ? 'Start' : `→ ${startsAt}`}
          </div>
          <p className="summary__count">{correctCount} of {history.length} correct</p>

          {history.length > 0 && (
            <ul className="summary__list">
              {history.map((h, i) => (
                <li key={`${h.checkpointIndex}-${i}`} className="summary__item">
                  <span className={`summary__mark ${h.correct ? 'summary__mark--ok' : 'summary__mark--bad'}`}>
                    {h.correct ? '✓' : '✕'}
                  </span>
                  <span className="summary__title">{h.topic}</span>
                </li>
              ))}
            </ul>
          )}

          <OwlSpeech tone="happy" text={<span>{message}</span>} />

          <button className="btn" onClick={() => onExit(ct)}>
            {ct < 0 ? 'Start from the beginning →' : 'Jump in →'}
          </button>
        </div>
      </div>
    )
  }

  if (!current) return null

  const question = current.question
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
        <p className="placement-count">Question {history.length + 1}</p>
        <h2>{current.topic}</h2>
      </div>

      <main className="order">
        <OwlSpeech
          text={<strong>I'll work up through the topics — just answer honestly and do your best!</strong>}
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
              Next →
            </button>
          )}
        </div>

        {!locked && <p className="lesson-hint">Pick the answer you think is right, then Submit.</p>}
      </main>
    </div>
  )
}
