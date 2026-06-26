import { PLACEMENT_SECTIONS } from './placementBank.js'

// Section-gated, conservative placement engine.
//
// Design goals (from real feedback):
//  - Tailored & in-order: you can't get yanked to "graphing" off one lucky
//    fundamentals answer. We walk sections from easiest to hardest and only let
//    you advance past a section if you clear BOTH of its probe questions.
//  - More thorough: 2 probes per section (an easy + a harder one), up to 8
//    questions for a strong student, instead of a 3-question binary search.
//  - Conservative: you're placed at the START of the first section you didn't
//    fully clear ("better to relearn a concept than skip over it"). Even a
//    perfect run still drops you into the final section rather than skipping it.
//
// A decision is one of:
//   { action: 'ask', checkpointIndex }
//   { action: 'place', completedThrough, sectionName }   // -1 => start at the beginning

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
  const answeredCorrect = (cp) => {
    const h = history.find((x) => x.checkpointIndex === cp)
    return h ? !!h.correct : null // null = not asked yet
  }

  for (let si = 0; si < PLACEMENT_SECTIONS.length; si++) {
    const { probes } = PLACEMENT_SECTIONS[si]

    // Ask any not-yet-answered probe in this section (in order).
    const unanswered = probes.find((cp) => answeredCorrect(cp) === null)
    if (unanswered !== undefined) {
      return { action: 'ask', checkpointIndex: unanswered }
    }

    // All probes answered — did they clear the whole section?
    const cleared = probes.every((cp) => answeredCorrect(cp) === true)
    if (!cleared) {
      // First shaky section → this is where they (re)start.
      return placeAtSection(si)
    }
    // Cleared this section; continue probing the next one.
  }

  // Cleared every section. Stay conservative: still start them in the final
  // section rather than skipping straight to the exam.
  return placeAtSection(PLACEMENT_SECTIONS.length - 1)
}
