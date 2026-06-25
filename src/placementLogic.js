// Deterministic binary-search placement engine. This is the fallback used when
// the AI proxy is unavailable (no key configured, network/API error), and it's
// also used server-side to sanity-check / repair the AI's decisions. It keeps
// the feature fully functional even with no AI at all.
//
// The curriculum is an ordered list of probeable checkpoints. Given the answer
// history, we know everything at/below the highest CORRECT index is mastered and
// everything at/above the lowest WRONG index is not — so we probe the middle of
// the remaining open interval, converging in ~log2(n) questions.

export const MAX_PROBES = 8

// A decision is one of:
//   { action: 'ask', checkpointIndex }
//   { action: 'place', completedThrough }   // -1 means "start from the beginning"
export function localDecide(history = [], curriculum = []) {
  const indices = curriculum.map((c) => c.checkpointIndex).sort((a, b) => a - b)
  const asked = new Set(history.map((h) => h.checkpointIndex))
  const correct = history.filter((h) => h.correct).map((h) => h.checkpointIndex)
  const wrong = history.filter((h) => !h.correct).map((h) => h.checkpointIndex)

  // Highest mastered (floor) and lowest missed (ceiling).
  const lo = correct.length ? Math.max(...correct) : -1
  const hi = wrong.length ? Math.min(...wrong) : Infinity

  if (history.length >= MAX_PROBES) {
    return { action: 'place', completedThrough: lo }
  }

  const candidates = indices.filter((i) => i > lo && i < hi && !asked.has(i))
  if (candidates.length === 0) {
    return { action: 'place', completedThrough: lo }
  }

  const mid = candidates[Math.floor(candidates.length / 2)]
  return { action: 'ask', checkpointIndex: mid }
}
