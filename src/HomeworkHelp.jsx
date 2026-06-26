import { useEffect, useMemo, useRef, useState } from 'react'
import OwlSpeech from './OwlSpeech.jsx'
import { shuffleChoices } from './shuffleChoices.js'
import { askBruh } from './homeworkClient.js'
import './HomeworkHelp.css'

const EXAMPLES = [
  "I don't get how to factor x^2 + 5x + 6",
  'Why does a negative exponent flip the fraction?',
  'How do I find the slope between two points?',
  "I keep messing up distributing a negative, like -2(x - 4)",
]

// "Bruh is thinking" indicator: the standard bobbing owl + animated dots.
function BruhThinking() {
  return (
    <div className="hw-think" role="status" aria-live="polite">
      <OwlSpeech
        tone="neutral"
        text={
          <strong>
            Bruh is working out a lesson just for you
            <span className="hw-dots"><span>.</span><span>.</span><span>.</span></span>
          </strong>
        }
      />
    </div>
  )
}

// One interactive multiple-choice problem, styled like the checkpoint questions:
// pick an option, submit, then see the answer highlighted with a walkthrough.
function HwProblem({ problem, index }) {
  const [seed, setSeed] = useState(0)
  // Shuffle so the correct answer isn't always in the same spot; reshuffle on retry.
  const q = useMemo(() => shuffleChoices(problem), [problem, seed])
  const [choice, setChoice] = useState(null)
  const [locked, setLocked] = useState(false)
  const wasCorrect = locked && choice === q.correct

  const retry = () => {
    setLocked(false)
    setChoice(null)
    setSeed((s) => s + 1)
  }

  return (
    <div className="hw-problem">
      <p className="hw-problem__label">Practice {index + 1}</p>
      <div className="review-q">{q.prompt}</div>

      <div className="choices" role="group" aria-label="Choose the answer">
        {q.options.map((opt, i) => {
          const sel = choice === i
          const showCorrect = locked && i === q.correct
          const showWrong = locked && sel && i !== q.correct
          return (
            <button
              key={i}
              type="button"
              className={
                'choice' +
                (sel ? ' choice--sel' : '') +
                (showCorrect ? ' choice--correct' : '') +
                (showWrong ? ' choice--wrong' : '')
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
        <p className={`answer-feedback answer-feedback--${wasCorrect ? 'ok' : 'bad'}`} role="status" aria-live="polite">
          {wasCorrect ? `✓ Nice! ${q.explain}` : `Not quite. ${q.explain}`}
        </p>
      )}

      <div className="controls">
        {!locked && choice != null && (
          <button className="btn" onClick={() => setLocked(true)}>
            Submit
          </button>
        )}
        {locked && (
          <button className="btn btn--ghost" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

// A little animated walkthrough: Bruh reveals the solving steps one at a time
// (each slides in), then hands off to the practice problems.
function Walkthrough({ steps, onDone }) {
  const [shown, setShown] = useState(1)
  const atEnd = shown >= steps.length

  return (
    <div className="hw-walk">
      <p className="hw-walk__label">How to solve it</p>

      <OwlSpeech tone="neutral" text={<strong>{steps[shown - 1]}</strong>} />

      <ol className="hw-walk__steps">
        {steps.slice(0, shown).map((s, i) => (
          <li
            key={i}
            className={'hw-walk__step' + (i === shown - 1 ? ' hw-walk__step--current' : '')}
          >
            <span className="hw-walk__num">{i + 1}</span>
            <span className="hw-walk__text">{s}</span>
          </li>
        ))}
      </ol>

      <div className="controls">
        {!atEnd ? (
          <button className="btn" onClick={() => setShown((n) => n + 1)}>
            Next step →
          </button>
        ) : (
          <button className="btn" onClick={onDone}>
            Let’s practice →
          </button>
        )}
      </div>
    </div>
  )
}

function LessonCard({ lesson }) {
  const hasWalk = lesson.walkthrough?.length > 0
  // Show the animated walkthrough first; reveal the practice problems after it.
  const [practicing, setPracticing] = useState(!hasWalk)

  return (
    <div className="hw-lesson">
      <p className="hw-lesson__eyebrow">Bruh’s practice</p>
      <h3 className="hw-lesson__title">{lesson.concept}</h3>

      <div className="hw-lesson__intro">
        <OwlSpeech tone="neutral" text={lesson.intro} />
      </div>

      {hasWalk && !practicing && (
        <Walkthrough steps={lesson.walkthrough} onDone={() => setPracticing(true)} />
      )}

      {practicing && lesson.problems?.length > 0 && (
        <div className="hw-problems">
          {lesson.problems.map((p, i) => (
            <HwProblem key={i} problem={p} index={i} />
          ))}
        </div>
      )}

      {practicing && lesson.tip && (
        <div className="hw-tip">
          <span className="hw-tip__label">Tip</span>
          <span>{lesson.tip}</span>
        </div>
      )}
    </div>
  )
}

export default function HomeworkHelp({ onBack }) {
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [transcript, setTranscript] = useState([]) // { id, problem, lesson|null, error|null }
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [transcript, pending])

  const send = async (text) => {
    const problem = text.trim()
    if (!problem || pending) return
    const id = Date.now()
    setInput('')
    setPending(true)
    setTranscript((t) => [...t, { id, problem, lesson: null, error: null }])
    try {
      const lesson = await askBruh(problem)
      setTranscript((t) => t.map((e) => (e.id === id ? { ...e, lesson } : e)))
    } catch {
      setTranscript((t) =>
        t.map((e) =>
          e.id === id
            ? { ...e, error: "Bruh couldn't reach the lesson helper right now. Give it another try in a moment!" }
            : e
        )
      )
    } finally {
      setPending(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const empty = transcript.length === 0

  return (
    <div className="app hw">
      <header className="app__header app__header--lesson">
        <button className="back-btn" onClick={onBack} aria-label="Back to path">
          ← Path
        </button>
        <h1>Bruh’s Homework Help</h1>
      </header>

      <main className="hw__main">
        {empty && (
          <div className="hw-hero">
            <h2 className="hw-hero__title">Stuck on something? Hoot it at me!</h2>
            <OwlSpeech
              tone="neutral"
              text={
                <span>
                  Describe whatever’s tripping you up — a problem, a rule, a concept — and I’ll build
                  you a quick custom lesson with steps and a practice problem.
                </span>
              }
            />
            <div className="hw-chips">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" className="hw-chip" onClick={() => send(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="hw-thread">
          {transcript.map((entry) => (
            <div key={entry.id} className="hw-exchange">
              <div className="hw-ask">
                <p className="hw-ask__bubble">{entry.problem}</p>
              </div>
              {entry.lesson && <LessonCard lesson={entry.lesson} />}
              {entry.error && <p className="hw-error">{entry.error}</p>}
              {!entry.lesson && !entry.error && pending && <BruhThinking />}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </main>

      <div className="hw-composer">
        <textarea
          className="hw-composer__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe what you're stuck on…"
          rows={2}
          disabled={pending}
        />
        <button className="btn hw-composer__send" onClick={() => send(input)} disabled={pending || !input.trim()}>
          {pending ? 'Thinking…' : 'Ask Bruh →'}
        </button>
      </div>
    </div>
  )
}
