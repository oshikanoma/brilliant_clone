// A recolorable owl mascot for user avatars — nearly identical to Bruh but with
// no glasses by default. `color` tints the body; `accessory` adds one of
// 'glasses' | 'bow' | 'mustache' (or 'none').

export const DEFAULT_AVATAR = { color: '#b78250', accessory: 'none' }

// Darken a hex color by `amount` (0..1) — used for the body outline and wings.
function shade(hex, amount) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const num = parseInt(full, 16)
  if (Number.isNaN(num)) return hex
  const r = Math.round(((num >> 16) & 255) * (1 - amount))
  const g = Math.round(((num >> 8) & 255) * (1 - amount))
  const b = Math.round((num & 255) * (1 - amount))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export default function AvatarOwl({ avatar = DEFAULT_AVATAR, size = 64 }) {
  const color = avatar?.color ?? DEFAULT_AVATAR.color
  const accessory = avatar?.accessory ?? 'none'
  const edge = shade(color, 0.3)
  const wing = shade(color, 0.14)
  const scale = size / 66

  return (
    <span className="avatarowl" style={{ width: 66 * scale, height: 64 * scale }} aria-hidden="true">
      <span className="avatarowl__inner" style={{ transform: `scale(${scale})` }}>
        <span className="owl__body" style={{ background: color, borderColor: edge }}>
          <span className="owl__ear owl__ear--l" style={{ borderBottomColor: edge }} />
          <span className="owl__ear owl__ear--r" style={{ borderBottomColor: edge }} />
          <span className="owl__wing owl__wing--l" style={{ background: wing, borderColor: edge }} />
          <span className="owl__wing owl__wing--r" style={{ background: wing, borderColor: edge }} />
          <span className="owl__eye owl__eye--l">
            <span className="owl__glint" />
          </span>
          <span className="owl__eye owl__eye--r">
            <span className="owl__glint" />
          </span>
          <span className="owl__cheek owl__cheek--l" />
          <span className="owl__cheek owl__cheek--r" />
          <span className="owl__belly" />

          {accessory === 'glasses' && (
            <span className="owl__glasses">
              <span className="owl__lens owl__lens--l" />
              <span className="owl__bridge" />
              <span className="owl__lens owl__lens--r" />
            </span>
          )}

          <span className="owl__beak" />

          {accessory === 'bow' && (
            <span className="avatar-bow">
              <span className="avatar-bow__knot" />
            </span>
          )}
          {accessory === 'mustache' && <span className="avatar-mustache" />}
        </span>
      </span>
    </span>
  )
}
