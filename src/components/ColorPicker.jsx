import { useEffect, useRef, useState } from 'react'
import './ColorPicker.css'

// --- color math --------------------------------------------------------------
function hexToRgb(hex) {
  const m = (hex || '').replace('#', '')
  const n = m.length === 3 ? m.split('').map((c) => c + c).join('') : m.padEnd(6, '0').slice(0, 6)
  const int = parseInt(n, 16) || 0
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

function rgbToHex(r, g, b) {
  const h = (x) => Math.round(x).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function rgbToHsv(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

function hsvToRgb(h, s, v) {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g] = [c, x]
  else if (h < 120) [r, g] = [x, c]
  else if (h < 180) [g, b] = [c, x]
  else if (h < 240) [g, b] = [x, c]
  else if (h < 300) [r, b] = [x, c]
  else [r, b] = [c, x]
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

const clamp01 = (n) => Math.min(1, Math.max(0, n))

// Inline color picker: a saturation/value gradient square plus a rainbow hue
// slider — pick any exact color, no presets. `value`/`onChange` are hex strings.
export default function ColorPicker({ value, onChange }) {
  // Keep hue/sat/val in state so dragging through greys doesn't reset the hue
  // (hex alone can't remember hue when saturation hits zero). Seed from `value`.
  const [hsv, setHsv] = useState(() => {
    const { r, g, b } = hexToRgb(value)
    return rgbToHsv(r, g, b)
  })

  // If the color is changed from outside (e.g. a freshly loaded avatar) and
  // doesn't match what we'd produce, resync.
  useEffect(() => {
    const cur = hsvToRgb(hsv.h, hsv.s, hsv.v)
    if (rgbToHex(cur.r, cur.g, cur.b).toLowerCase() !== (value || '').toLowerCase()) {
      const { r, g, b } = hexToRgb(value)
      setHsv(rgbToHsv(r, g, b))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const squareRef = useRef(null)
  const hueRef = useRef(null)
  const drag = useRef(null) // 'sv' | 'hue' | null

  const emit = (next) => {
    setHsv(next)
    const { r, g, b } = hsvToRgb(next.h, next.s, next.v)
    onChange?.(rgbToHex(r, g, b))
  }

  const fromSquare = (e) => {
    const rect = squareRef.current.getBoundingClientRect()
    const s = clamp01((e.clientX - rect.left) / rect.width)
    const v = clamp01(1 - (e.clientY - rect.top) / rect.height)
    emit({ ...hsv, s, v })
  }

  const fromHue = (e) => {
    const rect = hueRef.current.getBoundingClientRect()
    const h = clamp01((e.clientX - rect.left) / rect.width) * 360
    emit({ ...hsv, h })
  }

  const startSquare = (e) => {
    drag.current = 'sv'
    e.currentTarget.setPointerCapture(e.pointerId)
    fromSquare(e)
  }
  const startHue = (e) => {
    drag.current = 'hue'
    e.currentTarget.setPointerCapture(e.pointerId)
    fromHue(e)
  }
  const move = (e) => {
    if (drag.current === 'sv') fromSquare(e)
    else if (drag.current === 'hue') fromHue(e)
  }
  const end = () => {
    drag.current = null
  }

  // Keyboard nudges for accessibility.
  const onSquareKey = (e) => {
    const step = e.shiftKey ? 0.1 : 0.02
    let { s, v } = hsv
    if (e.key === 'ArrowLeft') s -= step
    else if (e.key === 'ArrowRight') s += step
    else if (e.key === 'ArrowUp') v += step
    else if (e.key === 'ArrowDown') v -= step
    else return
    e.preventDefault()
    emit({ ...hsv, s: clamp01(s), v: clamp01(v) })
  }
  const onHueKey = (e) => {
    const step = e.shiftKey ? 24 : 6
    let h = hsv.h
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') h -= step
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') h += step
    else return
    e.preventDefault()
    emit({ ...hsv, h: (h + 360) % 360 })
  }

  const hueColor = `hsl(${hsv.h}, 100%, 50%)`

  return (
    <div className="colorpick">
      <div
        ref={squareRef}
        className="colorpick__square"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${hueColor}`,
        }}
        onPointerDown={startSquare}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onSquareKey}
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuetext={`saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
      >
        <span
          className="colorpick__thumb"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: value }}
        />
      </div>

      <div
        ref={hueRef}
        className="colorpick__hue"
        onPointerDown={startHue}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onHueKey}
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
      >
        <span className="colorpick__huethumb" style={{ left: `${(hsv.h / 360) * 100}%`, background: hueColor }} />
      </div>

      <div className="colorpick__readout">
        <span className="colorpick__chip" style={{ background: value }} aria-hidden="true" />
        <input
          className="colorpick__hex"
          type="text"
          value={(value || '').toUpperCase()}
          spellCheck={false}
          aria-label="Hex color"
          onChange={(e) => {
            const t = e.target.value.trim()
            if (/^#?[0-9a-fA-F]{6}$/.test(t)) {
              const hex = t.startsWith('#') ? t : `#${t}`
              const { r, g, b } = hexToRgb(hex)
              emit(rgbToHsv(r, g, b))
            }
          }}
        />
      </div>
    </div>
  )
}
