import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { LIKE_TERMS_LEVELS } from './likeTermsLevels.js'
import Whiteboard from './Whiteboard.jsx'
import OwlSpeech from './OwlSpeech.jsx'

const genId = () => Math.random().toString(36).slice(2, 9)
const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Render a single term, e.g. {3,'x'} -> "3x", {1,'x'} -> "x", {5,''} -> "5".
function termText(t) {
  if (t.varname === '') return String(t.coef)
  if (t.coef === 1) return t.varname
  return `${t.coef}${t.varname}`
}

const makeTerms = (spec) => spec.map((t) => ({ id: genId(), ...t }))

const exprText = (list) => list.map(termText).join(' + ')

// Are any two terms in the list "like" (same variable)? If not, it's fully
// combined.
function hasLikePair(terms) {
  const seen = new Set()
  for (const t of terms) {
    if (seen.has(t.varname)) return true
    seen.add(t.varname)
  }
  return false
}

// Collapse a term list into its canonical simplified form: variables in
// alphabetical order, constant last.
function combineAll(terms) {
  const sums = new Map()
  for (const t of terms) sums.set(t.varname, (sums.get(t.varname) || 0) + t.coef)
  const vars = [...sums.keys()].filter((v) => v !== '').sort()
  const out = vars.map((v) => ({ varname: v, coef: sums.get(v) }))
  if (sums.has('')) out.push({ varname: '', coef: sums.get('') })
  return out
}

// Build 4 multiple-choice answers (the correct simplified form plus plausible
// distractors made by nudging a single coefficient).
function makeOptions(correctList) {
  const correct = exprText(correctList)
  const opts = new Set([correct])
  const candidates = []
  for (let gi = 0; gi < correctList.length; gi++) {
    for (const d of [1, -1, 2, -2]) {
      const copy = correctList.map((t) => ({ ...t }))
      copy[gi] = { ...copy[gi], coef: copy[gi].coef + d }
      if (copy[gi].coef >= 1) candidates.push(copy)
    }
  }
  for (const c of shuffle(candidates)) {
    if (opts.size >= 4) break
    opts.add(exprText(c))
  }
  return { correct, options: shuffle([...opts]) }
}

const VARS = ['x', 'y', 'z']

// Generate a solvable "combine the like terms" puzzle. Each group gets a total
// coefficient split across two terms so combining is always possible.
function genSolve(difficulty) {
  const pool = shuffle(VARS)
  let keys
  if (difficulty === 'medium') {
    keys = rint(0, 1) === 0 ? [pool[0], pool[1], ''] : [pool[0], pool[1], pool[2]]
  } else {
    keys = rint(0, 1) === 0 ? [pool[0], ''] : [pool[0], pool[1]]
  }

  const terms = []
  for (const k of keys) {
    const total = rint(3, 7)
    const a = rint(1, total - 1)
    terms.push({ id: genId(), coef: a, varname: k })
    terms.push({ id: genId(), coef: total - a, varname: k })
  }
  const display = shuffle(terms)
  const correctList = combineAll(display)
  const { correct, options } = makeOptions(correctList)
  return { terms: display, correct, options }
}

export default function LikeTermsLesson({
  onBack,
  onPass,
  lessonTitle = 'Combining Like Terms',
  value,
  onChange,
}) {
  const levelIndex = value.levelIndex
  const level = LIKE_TERMS_LEVELS[levelIndex]

  const results = value.results ?? {}
  const levelResult = results[levelIndex] ?? { solved: false, wrong: false }

  // The puzzle data for this level (persisted). Identify levels use the fixed
  // spec; solve levels get a freshly generated set of terms + answer options.
  const data = useMemo(() => {
    if (value.terms) {
      return { terms: value.terms, options: value.options, correct: value.correct }
    }
    if (level.mode === 'solve') return genSolve(level.difficulty)
    return { terms: makeTerms(level.spec) }
  }, [value.terms, value.options, value.correct, level])

  const terms = data.terms

  const [anchorA, setAnchorA] = useState(null)
  const [anchorB, setAnchorB] = useState(null)
  const [cursor, setCursor] = useState(null)
  const [choice, setChoice] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [showIntro, setShowIntro] = useState(levelIndex === 0 && value.terms == null)
  const [showSummary, setShowSummary] = useState(false)

  const areaRef = useRef(null)
  const dotRefs = useRef({})
  const [dotPos, setDotPos] = useState({})

  // Persist a freshly generated solve-mode puzzle so it survives reloads and
  // doesn't regenerate on every render.
  useEffect(() => {
    if (level.mode === 'solve' && value.terms == null) {
      onChange({ levelIndex, terms: data.terms, options: data.options, correct: data.correct, results })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.mode, value.terms, levelIndex])

  // Measure each dot's center (relative to the rope area) so the SVG rope can
  // connect them.
  useLayoutEffect(() => {
    const measure = () => {
      const area = areaRef.current
      if (!area) return
      const base = area.getBoundingClientRect()
      const pos = {}
      for (const t of terms) {
        const el = dotRefs.current[t.id]
        if (!el) continue
        const r = el.getBoundingClientRect()
        pos[t.id] = { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 }
      }
      setDotPos(pos)
    }
    measure()
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    if (document.fonts?.ready) document.fonts.ready.then(measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
    // Also re-measure when the intro is dismissed: on level 1 the puzzle area
    // isn't mounted while the intro shows, so the dots can't be measured until
    // showIntro flips to false (terms hasn't changed, so it alone won't retrigger).
  }, [terms, showIntro])

  const solved = level.mode === 'solve' ? !!levelResult.solved : !hasLikePair(terms)
  const isLast = levelIndex === LIKE_TERMS_LEVELS.length - 1

  const onDot = (id) => {
    if (solved) return
    setLastResult(null)
    if (anchorA == null) {
      setAnchorA(id)
      setAnchorB(null)
    } else if (anchorB == null) {
      if (id === anchorA) setAnchorA(null)
      else setAnchorB(id)
    } else {
      setAnchorA(id)
      setAnchorB(null)
    }
  }

  const onAreaMove = (e) => {
    if (anchorA == null || anchorB != null) return
    const base = areaRef.current?.getBoundingClientRect()
    if (!base) return
    setCursor({ x: e.clientX - base.left, y: e.clientY - base.top })
  }

  const submitIdentify = () => {
    if (anchorA == null || anchorB == null) return
    const a = terms.find((t) => t.id === anchorA)
    const b = terms.find((t) => t.id === anchorB)
    if (!a || !b) return

    if (a.varname === b.varname) {
      const combined = { id: genId(), coef: a.coef + b.coef, varname: a.varname }
      const next = terms
        .filter((t) => t.id !== b.id)
        .map((t) => (t.id === a.id ? combined : t))
      const nowSolved = !hasLikePair(next)
      setLastResult('correct')
      setAnchorA(null)
      setAnchorB(null)
      onChange({
        levelIndex,
        terms: next,
        results: nowSolved
          ? { ...results, [levelIndex]: { solved: true, wrong: levelResult.wrong } }
          : results,
      })
    } else {
      setLastResult('wrong')
      setAnchorA(null)
      setAnchorB(null)
      onChange({
        levelIndex,
        terms,
        results: { ...results, [levelIndex]: { solved: levelResult.solved, wrong: true } },
      })
    }
  }

  const submitSolve = () => {
    if (choice == null) return
    const ok = choice === data.correct
    setLastResult(ok ? 'correct' : 'wrong')
    onChange({
      levelIndex,
      terms: data.terms,
      options: data.options,
      correct: data.correct,
      results: {
        ...results,
        [levelIndex]: { solved: ok || levelResult.solved, wrong: levelResult.wrong || !ok },
      },
    })
  }

  const handleSubmit = () => (level.mode === 'solve' ? submitSolve() : submitIdentify())

  const resetLevel = () => {
    setAnchorA(null)
    setAnchorB(null)
    setChoice(null)
    setLastResult(null)
    if (level.mode === 'solve') {
      const fresh = genSolve(level.difficulty)
      onChange({ levelIndex, terms: fresh.terms, options: fresh.options, correct: fresh.correct, results })
    } else {
      onChange({ levelIndex, terms: makeTerms(level.spec), results })
    }
  }

  const goNext = () => {
    setAnchorA(null)
    setAnchorB(null)
    setChoice(null)
    setLastResult(null)
    onChange({ levelIndex: levelIndex + 1, terms: null, options: null, correct: null, results })
  }

  const retryLesson = () => {
    setAnchorA(null)
    setAnchorB(null)
    setChoice(null)
    setLastResult(null)
    setShowSummary(false)
    onChange({ levelIndex: 0, terms: null, options: null, correct: null, results: {} })
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
          <div className="intro__icon" aria-hidden="true">🪢</div>
          <p className="intro__eyebrow">Before we start</p>
          <h2 className="intro__title">Tidy up an expression by combining like terms.</h2>
          <p className="intro__blurb">
            A <strong>term</strong> is a single piece of an expression, like <strong>3x</strong>,{' '}
            <strong>2y</strong>, or a plain number like <strong>5</strong>. Terms are{' '}
            <strong>“like”</strong> when they share the exact same variable — so <strong>3x</strong>{' '}
            and <strong>2x</strong> are alike, but <strong>3x</strong> and <strong>2y</strong> are
            not. Like terms can be added together by adding their coefficients (the numbers in
            front), which makes a long expression shorter and simpler without changing its value. In
            these puzzles you’ll rope matching terms together and watch them merge.
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
    const total = LIKE_TERMS_LEVELS.length
    const correctCount = LIKE_TERMS_LEVELS.reduce(
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
            {LIKE_TERMS_LEVELS.map((lvl, i) => {
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
  let feedbackText =
    level.mode === 'solve'
      ? 'Work it out on the whiteboard, then pick the simplified form.'
      : 'Rope two like terms together, then Submit.'
  if (lastResult === 'wrong') {
    feedbackClass = 'feedback--bad'
    feedbackText =
      level.mode === 'solve'
        ? 'Not quite — combine the like terms and try again.'
        : 'Those aren’t like terms — they need the same variable. Try again.'
  } else if (solved) {
    feedbackClass = 'feedback--ok'
    feedbackText =
      level.mode === 'solve'
        ? `✓ Correct! The simplified form is ${data.correct}.`
        : `✓ Fully combined! It simplifies to ${exprText(combineAll(terms))}.`
  } else if (lastResult === 'correct') {
    feedbackClass = 'feedback--ok'
    feedbackText = '✓ Nice — those combined. Keep going.'
  }

  const canSubmit =
    !solved && (level.mode === 'solve' ? choice != null : anchorA != null && anchorB != null)

  // Build the hanging-rope SVG path between two dots.
  const ropePath = (p1, p2) => {
    const mx = (p1.x + p2.x) / 2
    const sag = Math.max(p1.y, p2.y) + 26 + Math.abs(p2.x - p1.x) * 0.04
    return `M ${p1.x} ${p1.y} Q ${mx} ${sag} ${p2.x} ${p2.y}`
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
          aria-valuenow={levelIndex + 1}
          aria-valuemin={1}
          aria-valuemax={LIKE_TERMS_LEVELS.length}
        >
          <div
            className="progress__fill"
            style={{ width: `${((levelIndex + 1) / LIKE_TERMS_LEVELS.length) * 100}%` }}
          />
        </div>
        <h2>{level.title}</h2>
        <p>{level.instruction}</p>
      </div>

      <main className="order">
        <div
          className="terms-area"
          ref={areaRef}
          onMouseMove={onAreaMove}
          onMouseLeave={() => setCursor(null)}
        >
          <svg className="rope-layer" aria-hidden="true">
            {anchorA != null && anchorB != null && dotPos[anchorA] && dotPos[anchorB] && (
              <path className="rope rope--set" d={ropePath(dotPos[anchorA], dotPos[anchorB])} />
            )}
            {anchorA != null && anchorB == null && dotPos[anchorA] && cursor && (
              <line
                className="rope rope--live"
                x1={dotPos[anchorA].x}
                y1={dotPos[anchorA].y}
                x2={cursor.x}
                y2={cursor.y}
              />
            )}
          </svg>

          <div className="terms-row">
            {terms.map((t, i) => (
              <Fragment key={t.id}>
                <div className="term-col">
                  {level.mode === 'identify' ? (
                    <button
                      type="button"
                      ref={(el) => (dotRefs.current[t.id] = el)}
                      className={
                        'term__dot' +
                        (anchorA === t.id || anchorB === t.id ? ' term__dot--active' : '')
                      }
                      onClick={() => onDot(t.id)}
                      disabled={solved}
                      aria-label={`Connect term ${termText(t)}`}
                    />
                  ) : (
                    <span className="term__dot term__dot--static" aria-hidden="true" />
                  )}
                  <span className="term">{termText(t)}</span>
                </div>
                {i < terms.length - 1 && <span className="term__plus">+</span>}
              </Fragment>
            ))}
          </div>
        </div>

        {level.mode === 'solve' && (
          <>
            <p className="solve-hint">Now you try! Try writing on the whiteboard below.</p>
            <Whiteboard key={levelIndex} />

            <div className="choices" role="group" aria-label="Choose the simplified expression">
              {data.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={'choice' + (choice === opt ? ' choice--sel' : '')}
                  disabled={solved}
                  onClick={() => {
                    setChoice(opt)
                    setLastResult(null)
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}

        <OwlSpeech
          text={feedbackText}
          tone={feedbackClass === 'feedback--ok' ? 'ok' : feedbackClass === 'feedback--bad' ? 'bad' : 'neutral'}
        />

        <div className="controls">
          {!solved && (
            <button className="btn btn--ghost" onClick={resetLevel}>
              {level.mode === 'solve' ? 'New equation' : 'Reset'}
            </button>
          )}
          {canSubmit && (
            <button className="btn" onClick={handleSubmit}>
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
