import AvatarOwl from './AvatarOwl.jsx'

const SWATCHES = [
  '#b78250', '#e8453c', '#ffd23c', '#ffffff', '#8ec5ff', '#f7a8c4',
  '#a7de3c', '#c08bff', '#ff9f6b', '#7ad9c4', '#9aa7b5',
]
const ACCESSORIES = [
  { key: 'none', label: 'None' },
  { key: 'bow', label: 'Bow' },
  { key: 'glasses', label: 'Glasses' },
  { key: 'mustache', label: 'Mustache' },
]

// Reusable owl avatar customizer (preview + color + accessory). `value` is an
// avatar object ({ color, accessory }); `onChange` receives the updated avatar.
// Used in both Settings and the new-account setup so they stay in sync.
export default function AvatarEditor({ value, onChange, previewSize = 120 }) {
  const set = (patch) => onChange({ ...value, ...patch })

  return (
    <div className="avatar-edit">
      <div className="avatar-edit__preview">
        <AvatarOwl avatar={value} size={previewSize} />
      </div>

      <div className="avatar-edit__controls">
        <div className="field">
          <span className="field__label">Body color</span>
          <div className="avatar-edit__colors">
            <input
              className="avatar-edit__picker"
              type="color"
              value={value.color}
              onChange={(e) => set({ color: e.target.value })}
              aria-label="Pick owl color"
            />
            <div className="avatar-edit__swatches">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`avatar-edit__swatch ${
                    value.color.toLowerCase() === c.toLowerCase() ? 'avatar-edit__swatch--on' : ''
                  }`}
                  style={{ background: c }}
                  onClick={() => set({ color: c })}
                  aria-label={`Use color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <span className="field__label">
            Accessory <span className="field__optional">(one at a time)</span>
          </span>
          <div className="avatar-edit__accessories">
            {ACCESSORIES.map((acc) => (
              <button
                key={acc.key}
                type="button"
                className={`chip ${value.accessory === acc.key ? 'chip--on' : ''}`}
                onClick={() => set({ accessory: acc.key })}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
