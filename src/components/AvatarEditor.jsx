import AvatarOwl from './AvatarOwl.jsx'
import ColorPicker from './ColorPicker.jsx'

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
          <ColorPicker value={value.color} onChange={(color) => set({ color })} />
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
