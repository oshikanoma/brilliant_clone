import { PLACEMENT_SECTIONS } from '../data/placementBank.js'

// Section-gated, conservative placement engine.
//
// Design goals (from real feedback):
//  - Confirm mastery, don't sample: every probed genre (topic) is asked MORE THAN
//    ONCE before we trust it. A genre is mastered only once you answer it
//    correctly TWICE; it's failed once you miss it twice; a 1-1 split triggers a
//    3rd tiebreaker. So you have to actually be solid on a topic to pass it.
//  - No single answer is decisive: because each genre needs two matching answers,
//    one accidental misclick can't fail a topic and one lucky guess can't pass it.
//  - Tailored & in-order: we walk sections easiest → hardest and gate each genre
//    in turn, so you can't be yanked ahead off one lucky fundamentals answer.
//  - Conservative: you're placed at the START of the first section that had a
//    genre you hadn't mastered ("better to relearn a concept than skip it"). Even
//    a perfect run still drops you into the final section rather than skipping to
//    the exam.
//
// History entries are { checkpointIndex, correct }; a genre can appear multiple
// times (once per question asked of it).
//
// A decision is one of:
//   { action: 'ask', checkpointIndex }
//   { action: 'place', completedThrough, sectionName }   // -1 => start at the beginning

export const MASTER_AT = 2 // correct answers needed to master a genre
const FAIL_AT = 2 //         wrong answers that mean a genre isn't mastered

// completedThrough for placing the student at the *start* of section `si`: mark
// everything up to (but not including) that section's first checkpoint complete.
function placeAtSection(si) {
  const section = PLACEMENT_SECTIONS[si]
  return {
    action: 'place',
    completedThrough: section.startCheckpoint - 1,
    sectionName: section.name,
  }
}

export function nextStep(history = []) {
  // Tally how this genre has gone so far.
  const tally = (cp) => {
    const asked = history.filter((x) => x.checkpointIndex === cp)
    const correct = asked.filter((x) => x.correct).length
    return { correct, wrong: asked.length - correct }
  }

  for (let si = 0; si < PLACEMENT_SECTIONS.length; si++) {
    const { genres } = PLACEMENT_SECTIONS[si]

    // Gate each genre in turn: it must be mastered before we look at the next.
    for (const cp of genres) {
      const { correct, wrong } = tally(cp)
      if (correct >= MASTER_AT) continue // mastered → check the next genre
      if (wrong >= FAIL_AT) return placeAtSection(si) // missed twice → (re)start here
      return { action: 'ask', checkpointIndex: cp } // still proving it → ask again
    }
    // Every genre in this section mastered → advance to the next section.
  }

  // Mastered every section. Stay conservative: still start them in the final
  // section rather than skipping straight to the exam.
  return placeAtSection(PLACEMENT_SECTIONS.length - 1)
}

// ---------------------------------------------------------------------------
// Guardrails shared with the AI engine. The AI may choose WHICH topic to probe
// and WHEN to place, but it can never override these mastery facts derived
// purely from what the student has actually answered.

const correctCount = (history, cp) =>
  history.filter((h) => h.checkpointIndex === cp && h.correct).length

// Index of the first section that isn't fully mastered yet (every genre answered
// correctly >= MASTER_AT times). If all are mastered, the last section.
export function frontierSectionIndex(history = []) {
  for (let si = 0; si < PLACEMENT_SECTIONS.length; si++) {
    const mastered = PLACEMENT_SECTIONS[si].genres.every(
      (cp) => correctCount(history, cp) >= MASTER_AT,
    )
    if (!mastered) return si
  }
  return PLACEMENT_SECTIONS.length - 1
}

// The most generous (furthest) placement the student's *demonstrated* mastery can
// justify — i.e. the start of the frontier section. The AI's placement is clamped
// to never exceed this, so it can be more conservative but never skip ahead.
export function masteredCeiling(history = []) {
  return PLACEMENT_SECTIONS[frontierSectionIndex(history)].startCheckpoint - 1
}

// Which section a probeable checkpoint belongs to (−1 if it isn't a genre).
export function sectionIndexOfCheckpoint(cp) {
  return PLACEMENT_SECTIONS.findIndex((s) => s.genres.includes(cp))
}

// Build a placement decision from a completedThrough value, naming the section
// the student lands in.
export function placementFor(completedThrough) {
  const startsAt = completedThrough + 1
  const section =
    PLACEMENT_SECTIONS.find((s) => s.startCheckpoint === startsAt) ||
    PLACEMENT_SECTIONS[0]
  return { action: 'place', completedThrough, sectionName: section.name }
}
