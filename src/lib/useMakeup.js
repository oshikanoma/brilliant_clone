import { useState } from 'react'

// Number of correct answers required to "make up" a single missed level.
const TOTAL = 3

// Shared state machine for the post-summary make-up flow. A lesson supplies:
//   makeQuestion(levelIndex) -> a freshly generated question for that missed
//                               level (lesson-specific shape).
//   onAllDone()             -> called once every missed level has been made up.
//
// The lesson renders `question` with its own interaction UI (keyed by `seq` so
// the UI resets between questions) and calls `registerResult(correct)` whenever
// the student answers. Each correct fills a star; three stars advance to the
// next missed level. A wrong answer just loads a fresh question (no star lost).
export function useMakeup(makeQuestion, onAllDone) {
  const [active, setActive] = useState(false)
  const [queue, setQueue] = useState([])
  const [qi, setQi] = useState(0)
  const [stars, setStars] = useState(0)
  const [question, setQuestion] = useState(null)
  const [seq, setSeq] = useState(0)

  const start = (missedIndices) => {
    if (!missedIndices || missedIndices.length === 0) {
      onAllDone()
      return
    }
    setActive(true)
    setQueue(missedIndices)
    setQi(0)
    setStars(0)
    setQuestion(makeQuestion(missedIndices[0]))
    setSeq((s) => s + 1)
  }

  const registerResult = (correct) => {
    if (!active) return
    if (correct) {
      const nextStars = stars + 1
      if (nextStars >= TOTAL) {
        const nextQi = qi + 1
        if (nextQi >= queue.length) {
          setActive(false)
          onAllDone()
          return
        }
        setQi(nextQi)
        setStars(0)
        setQuestion(makeQuestion(queue[nextQi]))
        setSeq((s) => s + 1)
      } else {
        setStars(nextStars)
        setQuestion(makeQuestion(queue[qi]))
        setSeq((s) => s + 1)
      }
    } else {
      // Wrong: keep the stars, hand them a brand-new question.
      setQuestion(makeQuestion(queue[qi]))
      setSeq((s) => s + 1)
    }
  }

  return {
    active,
    question,
    stars,
    total: TOTAL,
    sourceIndex: queue[qi],
    seq,
    start,
    registerResult,
  }
}

// "Missed" = a finished level that had at least one wrong attempt. Returns the
// ordered list of missed level indices given the lesson's `results` map.
export function missedIndicesFrom(results, count) {
  const out = []
  for (let i = 0; i < count; i++) {
    if (results[i]?.wrong) out.push(i)
  }
  return out
}
