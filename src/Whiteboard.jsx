import { useEffect, useRef } from 'react'

// A simple freehand drawing canvas for scratch work. Drawing is local scratch
// only — it isn't read or evaluated.
export default function Whiteboard() {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#1e293b'
    ctxRef.current = ctx
  }, [])

  const posOf = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e) => {
    e.preventDefault()
    drawing.current = true
    last.current = posOf(e)
    const { x, y } = last.current
    const ctx = ctxRef.current
    // A dot so a single tap leaves a mark.
    ctx.beginPath()
    ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fillStyle = ctx.strokeStyle
    ctx.fill()
  }

  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = ctxRef.current
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
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
  }

  return (
    <div className="whiteboard">
      <canvas
        ref={canvasRef}
        className="whiteboard__canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <button type="button" className="whiteboard__clear" onClick={clear}>
        Clear
      </button>
    </div>
  )
}
