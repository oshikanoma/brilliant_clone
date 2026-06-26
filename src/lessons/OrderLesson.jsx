import { useEffect, useMemo, useState } from 'react'
import { ORDER_LEVELS } from '../data/orderLevels.js'
import Whiteboard from '../components/Whiteboard.jsx'
import OwlSpeech from '../components/OwlSpeech.jsx'
import OrderIntro from '../intros/OrderIntro.jsx'
import MakeupDots from '../components/MakeupDots.jsx'
import { useMakeup, missedIndicesFrom } from '../lib/useMakeup.js'

const genId = () => Math.random().toString(36).slice(2, 9)

const OP_DISPLAY = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' }

const PEMDAS_ROWS = [
  { key: 'P', label: 'P', sub: 'Parentheses' },
  { key: 'E', label: 'E', sub: 'Exponents' },
  { key: 'MD', label: 'MD', sub: 'Multiply / Divide' },
  { key: 'AS', label: 'AS', sub: 'Add / Subtract' },
]
const PEMDAS_ORDER = ['P', 'E', 'MD', 'AS']

// Plain-language name for each PEMDAS category, used in Bruh's explanations.
const CAT_NAME = {
  P: 'whatever is inside the parentheses',
  E: 'the exponent',
  MD: 'multiplication and division',
  AS: 'addition and subtraction',
}

// Describe the operation a step points at, e.g. "3 × 4".
function describeStep(tokens, step) {
  const a = tokens[step.opIdx - 1]
  const b = tokens[step.opIdx + 1]
  const aT = a.kind === 'num' ? a.value : a.raw
  const bT = b.kind === 'num' ? b.value : b.raw
  return `${aT} ${OP_DISPLAY[tokens[step.opIdx].raw]} ${bT}`
}

// Turn a level's flat expr (e.g. ['5','+','(', ...]) into id-tagged tokens.
function makeTokens(expr) {
  return expr.map((raw) => {
    if (raw === '(') return { id: genId(), kind: 'lp', raw }
    if (raw === ')') return { id: genId(), kind: 'rp', raw }
    if ('+-*/^'.includes(raw)) return { id: genId(), kind: 'op', raw }
    return { id: genId(), kind: 'num', raw, value: Number(raw) }
  })
}

// Find the index of the next operator to evaluate within [start, end], honoring
// precedence (exponent, then ×/÷, then +/−) and left-to-right order.
function findOpInRange(tokens, start, end) {
  const tiers = [['^'], ['*', '/'], ['+', '-']]
  for (const tier of tiers) {
    for (let i = start; i <= end; i++) {
      if (tokens[i].kind === 'op' && tier.includes(tokens[i].raw)) return i
    }
  }
  return -1
}

// Determine the next step: which operation should be evaluated, its PEMDAS
// category, and (for parenthesised steps) the wrapping paren ids. Returns null
// once the expression is a single number.
function nextStep(tokens) {
  if (tokens.length <= 1) return null

  // Innermost parentheses = the last '(' (it can contain no further '(').
  let lp = -1
  for (let i = 0; i < tokens.length; i++) if (tokens[i].kind === 'lp') lp = i

  if (lp !== -1) {
    let rp = lp + 1
    while (rp < tokens.length && tokens[rp].kind !== 'rp') rp++
    const opIdx = findOpInRange(tokens, lp + 1, rp - 1)
    if (opIdx === -1) return null
    const targetIds = [tokens[opIdx - 1].id, tokens[opIdx].id, tokens[opIdx + 1].id]
    // If the parens wrap exactly this single operation, allow selecting them too.
    const parenIds =
      lp === opIdx - 2 && rp === opIdx + 2 ? [tokens[lp].id, tokens[rp].id] : null
    return { opIdx, category: 'P', targetIds, parenIds }
  }

  const opIdx = findOpInRange(tokens, 0, tokens.length - 1)
  if (opIdx === -1) return null
  const raw = tokens[opIdx].raw
  const category = raw === '^' ? 'E' : raw === '*' || raw === '/' ? 'MD' : 'AS'
  const targetIds = [tokens[opIdx - 1].id, tokens[opIdx].id, tokens[opIdx + 1].id]
  return { opIdx, category, targetIds, parenIds: null }
}

function compute(a, raw, b) {
  switch (raw) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return a / b
    case '^': return Math.pow(a, b)
    default: return a
  }
}

// Collapse any "( number )" down to just the number.
function collapseParens(tokens) {
  let out = tokens
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i + 2 < out.length; i++) {
      if (out[i].kind === 'lp' && out[i + 1].kind === 'num' && out[i + 2].kind === 'rp') {
        out = [...out.slice(0, i), out[i + 1], ...out.slice(i + 3)]
        changed = true
        break
      }
    }
  }
  return out
}

// Evaluate the operation at opIdx and return the simplified token list.
function evaluate(tokens, opIdx) {
  const a = tokens[opIdx - 1].value
  const b = tokens[opIdx + 1].value
  const r = compute(a, tokens[opIdx].raw, b)
  const numTok = { id: genId(), kind: 'num', raw: String(r), value: r }
  const next = [...tokens.slice(0, opIdx - 1), numTok, ...tokens.slice(opIdx + 2)]
  return collapseParens(next)
}

const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x))

// Fully reduce an expression, verifying every intermediate result is a
// non-negative integer (keeps generated puzzles clean for the student).
function reduceChecked(tokens) {
  let t = tokens
  while (t.length > 1) {
    const s = nextStep(t)
    if (!s) return { value: null, valid: false }
    const a = t[s.opIdx - 1].value
    const b = t[s.opIdx + 1].value
    const r = compute(a, t[s.opIdx].raw, b)
    if (!Number.isInteger(r) || r < 0) return { value: null, valid: false }
    t = evaluate(t, s.opIdx)
  }
  return { value: t[0].value, valid: true }
}

const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))

// Build a random PEMDAS expression for the given difficulty.
function buildExpr(difficulty) {
  if (difficulty === 'medium') {
    if (rint(0, 1) === 0) {
      const a = rint(2, 4), b = rint(1, 3), c = rint(1, 3), d = rint(1, 9)
      return [String(a), '*', '(', String(b), '+', String(c), ')', '^', '2', '-', String(d)]
    }
    const a = rint(3, 6), b = rint(1, a - 1), c = rint(1, 6), d = rint(2, 4)
    return ['(', String(a), '-', String(b), ')', '^', '2', '+', String(c), '*', String(d)]
  }
  const t = rint(0, 2)
  if (t === 0) {
    const b = rint(3, 9), c = rint(1, b - 1), a = rint(1, 9), d = rint(2, 5)
    return [String(a), '+', '(', String(b), '-', String(c), ')', '*', String(d)]
  }
  if (t === 1) {
    const a = rint(1, 6), b = rint(1, 6), c = rint(2, 5), d = rint(1, 9)
    return ['(', String(a), '+', String(b), ')', '*', String(c), '-', String(d)]
  }
  const a = rint(2, 9), b = rint(1, 6), c = rint(1, 6), d = rint(1, 9)
  return [String(a), '*', '(', String(b), '+', String(c), ')', '-', String(d)]
}

// Generate a valid (clean, positive integer answer) puzzle as id-tagged tokens.
function generateTokens(difficulty) {
  let tokens = makeTokens(buildExpr(difficulty))
  for (let i = 0; i < 40; i++) {
    const { value, valid } = reduceChecked(tokens)
    if (valid && value >= 1 && value <= 200) return tokens
    tokens = makeTokens(buildExpr(difficulty))
  }
  return tokens
}

// Generate a fresh expression in the same mode/difficulty as `level`.
function generateLike(level) {
  const difficulty = level.difficulty ?? (level.expr?.includes('^') ? 'medium' : 'easy')
  return { mode: level.mode, difficulty, tokens: generateTokens(difficulty) }
}

// One generated order-of-operations question for the make-up flow.
function OrderMakeupPlayer({ level, onResult }) {
  const [tokens, setTokens] = useState(level.tokens)
  const [selected, setSelected] = useState([])
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [stepResult, setStepResult] = useState(null)
  const [everWrong, setEverWrong] = useState(false)

  // ---- Solve mode (whiteboard + typed answer) ----
  if (level.mode === 'solve') {
    const solveAnswer = reduceChecked(level.tokens).value
    const isCorrect = Number(answer) === solveAnswer
    const locked = result === 'correct'
    const canSubmit = !locked && answer.trim() !== ''
    const submit = () => {
      if (!canSubmit) return
      if (isCorrect) setResult('correct')
      else {
        setResult('wrong')
        setEverWrong(true)
      }
    }
    let resultTone = null
    let resultText = ''
    if (result === 'correct') {
      resultTone = 'ok'
      resultText = `✓ Correct! The answer is ${solveAnswer}.`
    } else if (result === 'wrong') {
      resultTone = 'bad'
      const fs = nextStep(level.tokens)
      resultText = fs
        ? `Not quite. Follow PEMDAS — the first thing to simplify is ${describeStep(level.tokens, fs)} (${CAT_NAME[fs.category]}). Work in that order and try again.`
        : 'Not quite — recheck your arithmetic and try again.'
    }
    return (
      <main className="order">
        <OwlSpeech text={<strong>Work it out in PEMDAS order, then enter your answer.</strong>} tone="neutral" />
        <div className="eq eq--readonly">
          {level.tokens.map((t) => {
            const cls =
              'token token--static' +
              (t.kind === 'op' ? ' token--op' : '') +
              (t.kind === 'lp' || t.kind === 'rp' ? ' token--paren' : '')
            const text = t.kind === 'num' ? t.value : t.kind === 'op' ? OP_DISPLAY[t.raw] : t.raw
            return (
              <span key={t.id} className={cls}>
                {text}
              </span>
            )
          })}
        </div>
        <p className="solve-hint">Now you try! Try writing on the whiteboard below.</p>
        <Whiteboard />
        <div className="answer">
          <label className="answer__label" htmlFor="mk-order-answer">
            Your answer
          </label>
          <input
            id="mk-order-answer"
            className="answer__input"
            type="number"
            inputMode="numeric"
            value={answer}
            disabled={locked}
            placeholder="?"
            onChange={(e) => {
              setAnswer(e.target.value)
              setResult(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        </div>
        {resultText && (
          <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
            {resultText}
          </p>
        )}
        <div className="controls">
          {canSubmit && (
            <button className="btn" onClick={submit}>
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

  // ---- Identify mode (tap the next step until fully simplified) ----
  const step = nextStep(tokens)
  const solved = tokens.length <= 1
  const activeIdx = step ? PEMDAS_ORDER.indexOf(step.category) : PEMDAS_ORDER.length

  const toggle = (id) => {
    if (solved) return
    setStepResult(null)
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const submitStep = () => {
    if (!step || selected.length === 0) return
    const sel = new Set(selected)
    const target = new Set(step.targetIds)
    const withParens = step.parenIds && new Set([...step.targetIds, ...step.parenIds])
    const correct = sameSet(sel, target) || (withParens && sameSet(sel, withParens))
    if (correct) {
      setTokens(evaluate(tokens, step.opIdx))
      setSelected([])
      setStepResult('correct')
    } else {
      setStepResult('wrong')
      setEverWrong(true)
    }
  }

  let resultTone = null
  let resultText = ''
  if (solved) {
    resultTone = 'ok'
    resultText = `✓ Fully simplified! The answer is ${tokens[0].value}.`
  } else if (stepResult === 'wrong' && step) {
    resultTone = 'bad'
    resultText = `Not yet — by PEMDAS you should handle ${CAT_NAME[step.category]} next, which means evaluating ${describeStep(tokens, step)}. Tap exactly that part${step.parenIds ? ' (you can include its parentheses too)' : ''}.`
  } else if (stepResult === 'correct') {
    resultTone = 'ok'
    resultText = '✓ Nice — that part is simplified.'
  }

  return (
    <main className="order">
      <OwlSpeech text={<strong>Follow PEMDAS: tap the part to evaluate next, then Submit.</strong>} tone="neutral" />
      <div className="order__main">
        <div className="eq">
          {tokens.map((t) => {
            const isSel = selected.includes(t.id)
            const cls =
              'token' +
              (t.kind === 'op' ? ' token--op' : '') +
              (t.kind === 'lp' || t.kind === 'rp' ? ' token--paren' : '') +
              (isSel ? ' token--sel' : '')
            const text = t.kind === 'num' ? t.value : t.kind === 'op' ? OP_DISPLAY[t.raw] : t.raw
            return (
              <button key={t.id} className={cls} onClick={() => toggle(t.id)} disabled={solved}>
                {text}
              </button>
            )
          })}
        </div>
        <ol className="pemdas" aria-label="PEMDAS order">
          {PEMDAS_ROWS.map((row, i) => {
            const state = solved || i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'pending'
            return (
              <li key={row.key} className={`pemdas__row pemdas__row--${state}`}>
                <span className="pemdas__key">{state === 'done' ? '✓' : row.label}</span>
                <span className="pemdas__sub">{row.sub}</span>
              </li>
            )
          })}
        </ol>
      </div>
      {resultText && (
        <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
          {resultText}
        </p>
      )}
      <div className="controls">
        {!solved && selected.length > 0 && (
          <button className="btn" onClick={submitStep}>
            Submit
          </button>
        )}
        {solved && (
          <button className="btn" onClick={() => onResult(!everWrong)}>
            Next →
          </button>
        )}
      </div>
    </main>
  )
}

export default function OrderLesson({ onBack, onPass, lessonTitle = 'Order of Operations', value, onChange }) {
  const levelIndex = value.levelIndex
  const level = ORDER_LEVELS[levelIndex]

  const results = value.results ?? {}
  const levelResult = results[levelIndex] ?? { solved: false, wrong: false }

  // Current expression tokens for this level (persisted), or a fresh build.
  // Identify levels use the fixed expr; solve levels get a generated one.
  const tokens = useMemo(
    () => value.tokens ?? (level.mode === 'solve' ? generateTokens(level.difficulty) : makeTokens(level.expr)),
    [value.tokens, level]
  )

  const [selected, setSelected] = useState([])
  const [answer, setAnswer] = useState('')
  const [lastResult, setLastResult] = useState(null)
  const [showIntro, setShowIntro] = useState(levelIndex === 0 && value.tokens == null)
  const [showSummary, setShowSummary] = useState(false)
  const [mkDone, setMkDone] = useState(false)
  const makeup = useMakeup((idx) => generateLike(ORDER_LEVELS[idx]), () => setMkDone(true))
  const missed = missedIndicesFrom(results, ORDER_LEVELS.length)

  // Persist a freshly generated solve-mode equation so it survives a reload and
  // doesn't regenerate on every render.
  useEffect(() => {
    if (level.mode === 'solve' && value.tokens == null) {
      onChange({ levelIndex, tokens, results })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.mode, value.tokens, levelIndex])

  const step = level.mode === 'identify' ? nextStep(tokens) : null
  // For identify levels the puzzle is done the moment there's no operation left
  // to evaluate (i.e. it's a single number, or nothing further can collapse).
  // Keying off `!step` rather than only the token count guarantees the
  // Next/Finish button always appears once simplifying is complete.
  const solved = level.mode === 'solve' ? !!levelResult.solved : !step
  const activeIdx = step ? PEMDAS_ORDER.indexOf(step.category) : PEMDAS_ORDER.length
  const solveAnswer = useMemo(
    () => (level.mode === 'solve' ? reduceChecked(tokens).value : null),
    [level.mode, tokens]
  )

  const isLast = levelIndex === ORDER_LEVELS.length - 1

  const toggle = (id) => {
    if (solved) return
    setLastResult(null)
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const submitSolve = () => {
    if (answer.trim() === '') return
    const ok = Number(answer) === solveAnswer
    setLastResult(ok ? 'correct' : 'wrong')
    onChange({
      levelIndex,
      tokens,
      results: {
        ...results,
        [levelIndex]: { solved: ok || levelResult.solved, wrong: levelResult.wrong || !ok },
      },
    })
  }

  const handleSubmit = () => {
    if (level.mode === 'solve') return submitSolve()
    if (!step || selected.length === 0) return
    const sel = new Set(selected)
    const target = new Set(step.targetIds)
    const withParens = step.parenIds && new Set([...step.targetIds, ...step.parenIds])
    const correct = sameSet(sel, target) || (withParens && sameSet(sel, withParens))

    if (correct) {
      const next = evaluate(tokens, step.opIdx)
      const nowSolved = !nextStep(next)
      setLastResult('correct')
      setSelected([])
      onChange({
        levelIndex,
        tokens: next,
        results: nowSolved
          ? { ...results, [levelIndex]: { solved: true, wrong: levelResult.wrong } }
          : results,
      })
    } else {
      setLastResult('wrong')
      onChange({
        levelIndex,
        tokens,
        results: { ...results, [levelIndex]: { solved: levelResult.solved, wrong: true } },
      })
    }
  }

  const resetLevel = () => {
    setSelected([])
    setLastResult(null)
    const fresh = level.mode === 'solve' ? generateTokens(level.difficulty) : makeTokens(level.expr)
    onChange({ levelIndex, tokens: fresh, results })
  }

  const goNext = () => {
    setSelected([])
    setAnswer('')
    setLastResult(null)
    onChange({ levelIndex: levelIndex + 1, tokens: null, results })
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
        <OrderIntro onDone={() => setShowIntro(false)} />
      </div>
    )
  }

  // ---- Make-up screen ----
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
          <h2>Make-up · {ORDER_LEVELS[makeup.sourceIndex].title}</h2>
        </div>
        <OrderMakeupPlayer key={makeup.seq} level={makeup.question} onResult={makeup.registerResult} />
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
    const total = ORDER_LEVELS.length
    const correctCount = ORDER_LEVELS.reduce(
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
            {ORDER_LEVELS.map((lvl, i) => {
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
  const hintText =
    level.mode === 'solve'
      ? 'Work it out on the whiteboard, then enter your answer below.'
      : 'Tap the part to evaluate next, then Submit.'
  let resultTone = null
  let resultText = ''
  if (solved) {
    resultTone = 'ok'
    resultText =
      level.mode === 'solve'
        ? `✓ Correct! The answer is ${solveAnswer}.`
        : `✓ Fully simplified! The answer is ${tokens[0].value}.`
  } else if (lastResult === 'correct') {
    // A single step collapsed but the equation isn't done yet — make it obvious
    // the student should keep going rather than think they're stuck.
    resultTone = 'ok'
    resultText = '✓ Nice — that part is simplified. Now tap the next part to evaluate, then Submit.'
  } else if (lastResult === 'wrong') {
    resultTone = 'bad'
    if (level.mode === 'solve') {
      const fs = nextStep(tokens)
      resultText = fs
        ? `Not quite. Follow PEMDAS — the very first thing to simplify here is ${describeStep(tokens, fs)} (${CAT_NAME[fs.category]}). Do the steps in that order and try again.`
        : 'Not quite — recheck your arithmetic and try again.'
    } else if (step) {
      resultText = `Not yet — by PEMDAS you should handle ${CAT_NAME[step.category]} next, which means evaluating ${describeStep(tokens, step)}. Tap exactly that part${step.parenIds ? ' (you can include its parentheses too)' : ''}.`
    } else {
      resultText = 'Not quite — check the PEMDAS order and try again.'
    }
  } else if (lastResult === 'correct') {
    resultTone = 'ok'
    resultText = '✓ Nice — that part is simplified.'
  }

  const canSubmit =
    !solved && (level.mode === 'solve' ? answer.trim() !== '' : selected.length > 0)

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
          aria-valuemax={ORDER_LEVELS.length}
        >
          <div
            className="progress__fill"
            style={{ width: `${((levelIndex + 1) / ORDER_LEVELS.length) * 100}%` }}
          />
        </div>
        <h2>{level.title}</h2>
      </div>

      <main className="order">
        <OwlSpeech text={<strong>{questionText}</strong>} tone="neutral" />

        {level.mode === 'solve' ? (
          <>
            <div className="eq eq--readonly">
              {tokens.map((t) => {
                const cls =
                  'token token--static' +
                  (t.kind === 'op' ? ' token--op' : '') +
                  (t.kind === 'lp' || t.kind === 'rp' ? ' token--paren' : '')
                const text =
                  t.kind === 'num' ? t.value : t.kind === 'op' ? OP_DISPLAY[t.raw] : t.raw
                return (
                  <span key={t.id} className={cls}>
                    {text}
                  </span>
                )
              })}
            </div>

            <p className="solve-hint">Now you try! Try writing on the whiteboard below.</p>
            <Whiteboard key={levelIndex} />

            <div className="answer">
              <label className="answer__label" htmlFor="answer-input">
                Your answer
              </label>
              <input
                id="answer-input"
                className="answer__input"
                type="number"
                inputMode="numeric"
                value={answer}
                disabled={solved}
                placeholder="?"
                onChange={(e) => {
                  setAnswer(e.target.value)
                  setLastResult(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit()
                }}
              />
            </div>
          </>
        ) : (
          <div className="order__main">
            <div className="eq">
              {tokens.map((t) => {
                const isSel = selected.includes(t.id)
                const cls =
                  'token' +
                  (t.kind === 'op' ? ' token--op' : '') +
                  (t.kind === 'lp' || t.kind === 'rp' ? ' token--paren' : '') +
                  (isSel ? ' token--sel' : '')
                const text =
                  t.kind === 'num' ? t.value : t.kind === 'op' ? OP_DISPLAY[t.raw] : t.raw
                return (
                  <button key={t.id} className={cls} onClick={() => toggle(t.id)} disabled={solved}>
                    {text}
                  </button>
                )
              })}
            </div>

            <ol className="pemdas" aria-label="PEMDAS order">
              {PEMDAS_ROWS.map((row, i) => {
                const state = solved || i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'pending'
                return (
                  <li key={row.key} className={`pemdas__row pemdas__row--${state}`}>
                    <span className="pemdas__key">{state === 'done' ? '✓' : row.label}</span>
                    <span className="pemdas__sub">{row.sub}</span>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {resultText && (
          <p className={`answer-feedback answer-feedback--${resultTone}`} role="status" aria-live="polite">
            {resultText}
          </p>
        )}

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
              Finish lesson
            </button>
          )}
        </div>

        {!solved && <p className="lesson-hint">{hintText}</p>}
      </main>
    </div>
  )
}
