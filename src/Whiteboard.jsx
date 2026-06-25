import { useEffect, useRef } from 'react'
import './Whiteboard.css'

// A small free-draw scratch pad for working problems out by hand. Drawing is
// kept on a canvas (mouse + touch); "Clear" wipes it. It's intentionally
// ephemeral — closing it discards the scribbles.
export default function Whiteboard() {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  // Size the canvas to its box (accounting for device pixel ratio) so strokes
  // stay crisp, and set up the pen once on mount.
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
    drawing.current = false
  }

  const clear = () => {
    const c = canvasRef.current
    if (!c) return
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
  }

  return (
    <div className="whiteboard">
      <div className="whiteboard__bar">
        <span className="whiteboard__label">✏️ Scratch space — work it out here</span>
        <button type="button" className="btn btn--ghost whiteboard__clear" onClick={clear}>
          Clear
        </button>
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
