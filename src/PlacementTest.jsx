import { useEffect, useRef, useState } from 'react'
import OwlSpeech from './OwlSpeech.jsx'
import { shuffleChoices } from './shuffleChoices.js'
import { CURRICULUM, pickQuestion } from './placementBank.js'
import { decideNextStep } from './placementClient.js'
import { CHECKPOINTS } from './LessonPath.jsx'

// Adaptive placement test. Instead of a fixed list of questions, an AI engine
// (server-side, with a local binary-search fallback) looks at the student's
// answers so far and decides which checkpoint to probe next — zeroing in on the
// hardest thing they can do. When it has enough evidence it places the student
// anywhere along the path by reporting `completedThrough`, and the app marks all
// checkpoints up to there complete. Each question comes from a curated bank, so
// the math is always correct; the AI only chooses *which* topic to ask.

const floorOf = (history) => {
  const correct = history.filter((h) => h.correct).map((h) => h.checkpointIndex)
  return correct.length ? Math.max(...correct) : -1
}

export default function PlacementTest({ onExit }) {
  const [phase, setPhase] = useState('thinking') // 'thinking' | 'question' | 'summary'
  const [history, setHistory] = useState([])
  const [current, setCurrent] = useState(null) // { checkpointIndex, topic, section, question }
  const [choice, setChoice] = useState(null)
  const [locked, setLocked] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(null)
  const [placement, setPlacement] = useState(null) // { completedThrough, message, source }

  const usedIds = useRef(new Set())
  const started = useRef(false)

  // Ask the engine what to do next given the running history.
  const requestNext = async (hist) => {
    setPhase('thinking')
    const decision = await decideNextStep({ history: hist, curriculum: CURRICULUM })

    if (decision.action === 'place') {
      setPlacement({
        completedThrough: Number.isInteger(decision.completedThrough) ? decision.completedThrough : floorOf(hist),
        message: decision.message,
        source: decision.source,
      })
      setPhase('summary')
      return
    }

    const meta = CURRICULUM.find((c) => c.checkpointIndex === decision.checkpointIndex)
    const base = meta ? pickQuestion(decision.checkpointIndex, usedIds.current) : null
    if (!meta || !base) {
      // Nothing left to ask for this checkpoint — place at the current floor.
      setPlacement({ completedThrough: floorOf(hist), source: decision.source })
      setPhase('summary')
      return
    }

    usedIds.current.add(base.id)
    setCurrent({
      checkpointIndex: decision.checkpointIndex,
      topic: meta.topic,
      section: meta.section,
      question: shuffleChoices(base),
    })
    setChoice(null)
    setLocked(false)
    setWasCorrect(null)
    setPhase('question')
  }

  // Kick off the first probe once (guarded against StrictMode double-invoke).
  useEffect(() => {
    if (started.current) return
    started.current = true
    requestNext([])
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
    requestNext(next)
  }

  // ---- Thinking / loading ----
  if (phase === 'thinking') {
    return (
      <div className="app">
        <header className="app__header app__header--lesson">
          <h1>Placement test</h1>
        </header>
        <main className="order placement-thinking">
          <OwlSpeech
            tone="neutral"
            text={
              <strong>
                {history.length === 0
                  ? 'Let me find the right starting point for you…'
                  : 'Nice — let me pick a good next question…'}
              </strong>
            }
          />
          <div className="placement-dots" aria-label="Thinking">
            <span /><span /><span />
          </div>
        </main>
      </div>
    )
  }

  // ---- Summary / placement verdict ----
  if (phase === 'summary') {
    const ct = placement?.completedThrough ?? -1
    const nextIdx = ct + 1
    const startsAt = ct < 0 ? CHECKPOINTS[0] : CHECKPOINTS[nextIdx]
    const defaultMsg =
      ct < 0
        ? "No worries at all — we'll start at the very beginning and build rock-solid foundations together."
        : `You clearly know your stuff all the way through ${CHECKPOINTS[ct]}! I'll start you at ${startsAt} so you begin right where it gets interesting.`
    const message = placement?.message || defaultMsg

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

  // ---- Question ----
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
          text={<strong>I'm picking questions based on your answers — just do your best!</strong>}
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
