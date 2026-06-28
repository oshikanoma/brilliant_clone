import { useEffect, useRef, useState } from 'react'
import OwlSpeech from '../components/OwlSpeech.jsx'
import { shuffleChoices } from '../lib/shuffleChoices.js'
import { CURRICULUM, pickQuestion } from '../data/placementBank.js'
import { decideStep } from '../lib/placementClient.js'
import { CHECKPOINTS } from './LessonPath.jsx'

// Adaptive placement test. After each answer, an AI (Hoot) picks the next topic to
// quiz — or decides you're ready to be placed — based on how you've done. The
// questions themselves always come from our vetted bank (so answers are correct),
// and the AI's choice is run through mastery guardrails: a topic must be proven by
// repetition (right twice to pass, wrong twice to fail), it can't skip you ahead of
// what you've mastered, and you're placed at the START of the first section you
// weren't solid on. If the AI is unavailable, a deterministic engine takes over so
// placement always works — it just won't be adaptive.

const topicFor = (cp) =>
  CURRICULUM.find((c) => c.checkpointIndex === cp)?.topic || CHECKPOINTS[cp] || 'Question'

export default function PlacementTest({ aiEnabled = true, onToggleAi, onExit }) {
  const [history, setHistory] = useState([])
  const [current, setCurrent] = useState(null) // { checkpointIndex, topic, question }
  const [choice, setChoice] = useState(null)
  const [locked, setLocked] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(null)
  const [placement, setPlacement] = useState(null) // { completedThrough, sectionName }
  const [thinking, setThinking] = useState(true) // Hoot is choosing the next step
  const [engine, setEngine] = useState(null) // 'ai' | 'local'
  const started = useRef(false)
  const usedIds = useRef(new Set()) // questions already shown, so genre repeats stay fresh

  // Ask the AI engine (with deterministic fallback) for the next step.
  const loadStep = async (hist) => {
    setThinking(true)
    const { decision, source } = await decideStep(hist)
    setEngine(source)
    if (decision.action === 'place') {
      setPlacement(decision)
      setCurrent(null)
      setThinking(false)
      return
    }
    const q = pickQuestion(decision.checkpointIndex, usedIds.current)
    if (q) usedIds.current.add(q.id)
    setCurrent({
      checkpointIndex: decision.checkpointIndex,
      topic: topicFor(decision.checkpointIndex),
      question: shuffleChoices(q),
    })
    setChoice(null)
    setLocked(false)
    setWasCorrect(null)
    setThinking(false)
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
          {engine === 'ai' && (
            <span className="placement-engine placement-engine--ai">Adapted by Hoot</span>
          )}
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

  // ---- Hoot is choosing the next question ----
  if (thinking) {
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
                  ? "Let's find your starting point…"
                  : 'Nice — let me pick your next one…'}
              </strong>
            }
          />
          <div className="placement-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="lesson-hint">Hoot is adapting the test to how you're doing.</p>
        </main>
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

        <button
          type="button"
          className={
            'aigate aigate--' + (aiEnabled ? (engine === 'local' ? 'offline' : 'on') : 'off')
          }
          onClick={() => onToggleAi?.(!aiEnabled)}
          aria-pressed={aiEnabled}
          title="Turn the AI adaptation on or off. When off, the test runs fully on your device."
        >
          <span className="aigate__dot" aria-hidden="true" />
          <span className="aigate__text">
            {aiEnabled
              ? engine === 'local'
                ? 'AI on — offline right now, using on-device picks'
                : 'AI connected — Hoot is adapting to you'
              : 'AI off — running fully on-device'}
          </span>
          <span className="aigate__switch">{aiEnabled ? 'Turn off' : 'Turn on'}</span>
        </button>

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
