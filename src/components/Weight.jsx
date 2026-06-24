import { useDraggable } from '@dnd-kit/core'

// A single weight block.
// - `label` is what shows on the face (a number, or "x" for a variable block).
// - `variable` styles it as an unknown x block.
// - `locked` weights are fixed in place and can't be dragged.
export default function Weight({ id, label, variable = false, locked = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled: locked })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const classes = [
    'weight',
    variable && 'weight--var',
    locked && 'weight--locked',
    isDragging && 'weight--dragging',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      ref={setNodeRef}
      className={classes}
      style={style}
      disabled={locked}
      {...(locked ? {} : listeners)}
      {...attributes}
    >
      <span className="weight__value">{label}</span>
    </button>
  )
}
