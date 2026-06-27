import { PLACEMENT_SECTIONS } from '../data/placementBank.js'

// Section-gated, conservative placement engine.
//
// Design goals (from real feedback):
//  - No single answer is decisive: a student worried about an accidental misclick
//    shouldn't get bumped a whole section over one slip — and a lucky guess
//    shouldn't fling them ahead. So each section is judged by a BEST-2-OF-3 vote:
//    you must answer 2 of its 3 probes correctly to clear it, and 2 incorrectly
//    to fail it. One wrong (or one right) is never enough to decide placement.
//  - Tailored & in-order: we walk sections easiest → hardest and only advance
//    past a section once it's cleared, so you can't be yanked to "graphing" off a
//    single fundamentals answer.
//  - Efficient: the vote is decided as soon as it's mathematically settled (the
//    2nd matching answer), so a clear pass/fail takes 2 questions and only a
//    split (1-1) needs the 3rd tiebreaker. A strong student sees ~8 questions.
//  - Conservative: you're placed at the START of the first section you didn't
//    clear ("better to relearn a concept than skip over it"). Even a perfect run
//    still drops you into the final section rather than skipping straight to the
//    exam.
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
    const need = Math.floor(probes.length / 2) + 1 // 2 correct to clear (of 3)
    const maxWrong = probes.length - need + 1 //      2 wrong to fail (of 3)

    // Tally answered probes in order, stopping at the first unanswered one.
    let correct = 0
    let wrong = 0
    for (const cp of probes) {
      const r = answeredCorrect(cp)
      if (r === null) break
      if (r) correct++
      else wrong++
    }

    // Decide the section as soon as the best-of-3 vote is mathematically settled.
    if (correct >= need) continue // cleared → move on to the next section
    if (wrong >= maxWrong) return placeAtSection(si) // failed → (re)start here

    // Vote still open (e.g. 1-1) → ask the next probe in this section.
    const unanswered = probes.find((cp) => answeredCorrect(cp) === null)
    return { action: 'ask', checkpointIndex: unanswered }
  }

  // Cleared every section. Stay conservative: still start them in the final
  // section rather than skipping straight to the exam.
  return placeAtSection(PLACEMENT_SECTIONS.length - 1)
}
