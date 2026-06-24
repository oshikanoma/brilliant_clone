const sumValues = (ids, weights) =>
  ids.reduce((total, id) => total + (weights[id]?.value ?? 0), 0)

// Builds an expression from a side. Variable (green) blocks always read as "x"
// even though their face shows a real number, e.g. an x-block + a 2 -> "x + 2".
// Variable terms are listed first so it reads "x + 2" rather than "2 + x".
function expression(ids, weights) {
  if (ids.length === 0) return '0'
  const terms = ids.map((id) => (weights[id]?.variable ? 'x' : weights[id]?.label ?? ''))
  const vars = terms.filter((t) => t === 'x')
  const nums = terms.filter((t) => t !== 'x')
  return [...vars, ...nums].join(' + ')
}

// A live equation that mirrors the scale. Each side shows its expression; the
// symbol between them is the true relationship (=, <, or >) based on the
// resolved totals, so the algebra always lines up with what the balance does.
export default function EquationBar({ leftIds, rightIds, weights, unknownVariables = false }) {
  // When variables are still unknown (e.g. an x not yet substituted), a side's
  // numeric total is undetermined, so we show "?" rather than a misleading sum.
  const leftUnknown = unknownVariables && leftIds.some((id) => weights[id]?.variable)
  const rightUnknown = unknownVariables && rightIds.some((id) => weights[id]?.variable)
  const leftTotal = sumValues(leftIds, weights)
  const rightTotal = sumValues(rightIds, weights)

  const unknown = leftUnknown || rightUnknown
  const balanced = !unknown && leftTotal === rightTotal
  const op = unknown ? '?' : balanced ? '=' : leftTotal > rightTotal ? '>' : '<'

  return (
    <div className="equation">
      <div className="equation__side">
        <div className="equation__expr">{expression(leftIds, weights)}</div>
        <div className="equation__total">= {leftUnknown ? '?' : leftTotal}</div>
      </div>

      <div className={`equation__op ${balanced ? 'equation__op--balanced' : ''}`}>
        {op}
      </div>

      <div className="equation__side">
        <div className="equation__expr">{expression(rightIds, weights)}</div>
        <div className="equation__total">= {rightUnknown ? '?' : rightTotal}</div>
      </div>
    </div>
  )
}
