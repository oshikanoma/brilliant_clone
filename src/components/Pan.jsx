import { useDroppable } from '@dnd-kit/core'
import Weight from './Weight.jsx'

// A droppable zone that holds weights.
// - Scale pans (default) render a physical plate the weights rest on.
// - `bin` zones (the tray, the x-dock) are simple holding bins with no plate.
export default function Pan({ id, label, weightIds, weights, bin = false, hint = 'Drop here', disabled = false }) {
  const { isOver, setNodeRef } = useDroppable({ id, disabled })
  const empty = weightIds.length === 0

  return (
    <div className="pan-wrap">
      <div
        ref={setNodeRef}
        className={`pan pan--${id} ${bin ? 'pan--bin' : ''} ${
          isOver ? 'pan--over' : ''
        } ${empty ? 'pan--empty' : ''}`}
      >
        <div className="pan__weights">
          {empty && <span className="pan__hint">{hint}</span>}
          {weightIds.map((wid) => (
            <Weight
              key={wid}
              id={wid}
              label={weights[wid].label}
              variable={weights[wid].variable}
              locked={weights[wid].locked}
            />
          ))}
        </div>
        {!bin && <div className="pan__plate" aria-hidden="true" />}
      </div>
      {label && <div className="pan__label">{label}</div>}
    </div>
  )
}
