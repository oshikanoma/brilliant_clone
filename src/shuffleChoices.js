// Multiple-choice option shuffler. Our question banks author the correct answer
// as `correct: 0` (top-left) for readability, which would otherwise make every
// answer the first choice. `shuffleChoices` returns a copy of a question with
// its options randomized and the `correct` index remapped to match.
//
// Call it once per attempt (e.g. inside a useMemo with a stable dependency) so
// the option order stays fixed while the student is answering, but reshuffles
// on a fresh mount/retry.
export function shuffleChoices(question) {
  const order = question.options.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return {
    ...question,
    options: order.map((i) => question.options[i]),
    correct: order.indexOf(question.correct),
  }
}

// Shuffle the options of every question in a bank (question order is preserved).
export function shuffleAll(questions) {
  return (questions ?? []).map(shuffleChoices)
}
