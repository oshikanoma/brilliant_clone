import Pan from './Pan.jsx'

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const sumValues = (ids, weights) =>
  ids.reduce((total, id) => total + (weights[id]?.value ?? 0), 0)

// Phase 3: the scale teeters. We total each side and tilt the beam toward the
// heavier side; the heavier pan also dips down while the lighter one rises.
// The pans themselves stay upright so weights sit flat and dropping stays easy.
export default function BalanceScale({ leftIds, rightIds, weights, dropZones = ['left', 'right'] }) {
  const leftTotal = sumValues(leftIds, weights)
  const rightTotal = sumValues(rightIds, weights)
  const diff = rightTotal - leftTotal // > 0 means the right side is heavier

  // Beam rotation (clockwise positive => right end dips). Capped so it never
  // looks broken, even with a big imbalance.
  const angle = clamp(diff * 2, -9, 9)
  // How far each pan slides vertically (heavier side moves down).
  const rightDrop = clamp(diff * 5, -30, 30)

  return (
    <div className="scale">
      <div className="scale__top">
        <div className="scale__fulcrum" aria-hidden="true" />
        <div
          className="scale__beam"
          style={{ transform: `rotate(${angle}deg)` }}
          aria-hidden="true"
        >
          <span className="scale__beamcap scale__beamcap--l" />
          <span className="scale__beamcap scale__beamcap--r" />
        </div>
      </div>

      <div className="scale__pans">
        <div className="scale__slot" style={{ transform: `translateY(${-rightDrop}px)` }}>
          <Pan
            id="left"
            label="Left side"
            weightIds={leftIds}
            weights={weights}
            disabled={!dropZones.includes('left')}
          />
        </div>
        <div className="scale__slot" style={{ transform: `translateY(${rightDrop}px)` }}>
          <Pan
            id="right"
            label="Right side"
            weightIds={rightIds}
            weights={weights}
            disabled={!dropZones.includes('right')}
          />
        </div>
      </div>
    </div>
  )
}
