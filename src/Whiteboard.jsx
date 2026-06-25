import { useEffect, useRef, useState } from 'react'
import './Whiteboard.css'

// A small free-draw scratch pad for working problems out by hand. Drawing is
// kept on a canvas (mouse + touch). Each finished stroke is snapshotted so
// Undo/Redo can step through history; "Clear" wipes it (and is itself undoable).
// It's intentionally ephemeral — closing it discards the scribbles.
export default function Whiteboard() {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  // Snapshot history (ImageData) + pointer to the current state.
  const history = useRef([])
  const index = useRef(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const refreshButtons = () => {
    setCanUndo(index.current > 0)
    setCanRedo(index.current < history.current.length - 1)
  }

  // Push the current canvas pixels onto the history stack, dropping any redo
  // states that are now stale.
  const snapshot = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const img = ctx.getImageData(0, 0, c.width, c.height)
    history.current = history.current.slice(0, index.current + 1)
    history.current.push(img)
    index.current = history.current.length - 1
    refreshButtons()
  }

  const restore = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const img = history.current[index.current]
    if (img) ctx.putImageData(img, 0, 0)
    refreshButtons()
  }

  // Size the canvas to its box (accounting for device pixel ratio) so strokes
  // stay crisp, set up the pen once on mount, and capture the blank baseline.
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ratio = window.devicePixelRatio || 1
    const rect = c.getBoundingClientRect()
    c.width = Math.round(rect.width * ratio)
    c.height = Math.round(rect.height * ratio)
    const ctx = c.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#1a2e05'
    // Baseline blank state so the first Undo returns to an empty board.
    history.current = [ctx.getImageData(0, 0, c.width, c.height)]
    index.current = 0
    refreshButtons()
  }, [])

  const posOf = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const t = e.touches && e.touches[0]
    const clientX = t ? t.clientX : e.clientX
    const clientY = t ? t.clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const start = (e) => {
    drawing.current = true
    last.current = posOf(e)
  }

  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const p = posOf(e)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    snapshot()
  }

  const undo = () => {
    if (index.current <= 0) return
    index.current -= 1
    restore()
  }

  const redo = () => {
    if (index.current >= history.current.length - 1) return
    index.current += 1
    restore()
  }

  const clear = () => {
    const c = canvasRef.current
    if (!c) return
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    snapshot()
  }

  return (
    <div className="whiteboard">
      <div className="whiteboard__bar">
        <span className="whiteboard__label">Scratch space</span>
        <div className="whiteboard__tools">
          <button
            type="button"
            className="btn btn--ghost whiteboard__tool"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
          >
            Undo
          </button>
          <button
            type="button"
            className="btn btn--ghost whiteboard__tool"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
          >
            Redo
          </button>
          <button type="button" className="btn btn--ghost whiteboard__tool" onClick={clear}>
            Clear
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="whiteboard__canvas"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
    </div>
  )
}
