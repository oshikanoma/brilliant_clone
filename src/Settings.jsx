import { useState } from 'react'
import AvatarOwl, { DEFAULT_AVATAR } from './AvatarOwl.jsx'
import { changePassword } from './auth.js'

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

export default function Settings({ username, canChangePassword = true, name, birthday, avatar, onSavePersonal, onSaveAvatar, onBack }) {
  // Personal info draft.
  const [draftName, setDraftName] = useState(name ?? '')
  const [draftBday, setDraftBday] = useState(birthday ?? '')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [personalMsg, setPersonalMsg] = useState(null)

  // Avatar draft (only committed on Save).
  const [draftAvatar, setDraftAvatar] = useState(avatar ?? DEFAULT_AVATAR)
  const [avatarMsg, setAvatarMsg] = useState(null)

  const savePersonal = () => {
    if (canChangePassword && (pw || pw2)) {
      if (pw !== pw2) {
        setPersonalMsg({ tone: 'bad', text: 'Passwords don’t match.' })
        return
      }
      const res = changePassword(username, pw)
      if (res.error) {
        setPersonalMsg({ tone: 'bad', text: res.error })
        return
      }
    }
    onSavePersonal({ name: draftName.trim(), birthday: draftBday })
    setPw('')
    setPw2('')
    setPersonalMsg({ tone: 'ok', text: 'Saved!' })
  }

  const saveAvatar = () => {
    onSaveAvatar(draftAvatar)
    setAvatarMsg('Saved!')
    setTimeout(() => setAvatarMsg(null), 2000)
  }

  return (
    <div className="app">
      <header className="app__header app__header--lesson">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <h1>Settings</h1>
      </header>

      <section className="settings__section">
        <h2 className="settings__heading">Personal info</h2>

        <label className="field">
          <span className="field__label">Name</span>
          <input
            className="field__input"
            type="text"
            value={draftName}
            maxLength={24}
            placeholder="Your name"
            onChange={(e) => {
              setDraftName(e.target.value)
              setPersonalMsg(null)
            }}
          />
        </label>

        <label className="field">
          <span className="field__label">
            Birthday <span className="field__optional">(optional)</span>
          </span>
          <input
            className="field__input"
            type="date"
            value={draftBday}
            onChange={(e) => {
              setDraftBday(e.target.value)
              setPersonalMsg(null)
            }}
          />
        </label>

        {canChangePassword ? (
          <>
            <label className="field">
              <span className="field__label">New password</span>
              <input
                className="field__input"
                type="password"
                value={pw}
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
                onChange={(e) => {
                  setPw(e.target.value)
                  setPersonalMsg(null)
                }}
              />
            </label>

            <label className="field">
              <span className="field__label">Confirm new password</span>
              <input
                className="field__input"
                type="password"
                value={pw2}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                onChange={(e) => {
                  setPw2(e.target.value)
                  setPersonalMsg(null)
                }}
              />
            </label>
          </>
        ) : (
          <p className="settings__hint">You’re signed in with Google, so your password is managed by your Google account.</p>
        )}

        {personalMsg && (
          <p className={`settings__msg settings__msg--${personalMsg.tone}`} role="status">
            {personalMsg.text}
          </p>
        )}
        <button className="btn" onClick={savePersonal}>
          Save personal info
        </button>
      </section>

      <section className="settings__section">
        <h2 className="settings__heading">Avatar</h2>
        <p className="settings__hint">This little owl shows up next to your name at the top.</p>

        <div className="avatar-edit">
          <div className="avatar-edit__preview">
            <AvatarOwl avatar={draftAvatar} size={120} />
          </div>

          <div className="avatar-edit__controls">
            <div className="field">
              <span className="field__label">Body color</span>
              <div className="avatar-edit__colors">
                <input
                  className="avatar-edit__picker"
                  type="color"
                  value={draftAvatar.color}
                  onChange={(e) => setDraftAvatar((a) => ({ ...a, color: e.target.value }))}
                  aria-label="Pick owl color"
                />
                <div className="avatar-edit__swatches">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`avatar-edit__swatch ${
                        draftAvatar.color.toLowerCase() === c.toLowerCase() ? 'avatar-edit__swatch--on' : ''
                      }`}
                      style={{ background: c }}
                      onClick={() => setDraftAvatar((a) => ({ ...a, color: c }))}
                      aria-label={`Use color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="field">
              <span className="field__label">Accessory <span className="field__optional">(one at a time)</span></span>
              <div className="avatar-edit__accessories">
                {ACCESSORIES.map((acc) => (
                  <button
                    key={acc.key}
                    type="button"
                    className={`chip ${draftAvatar.accessory === acc.key ? 'chip--on' : ''}`}
                    onClick={() => setDraftAvatar((a) => ({ ...a, accessory: acc.key }))}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {avatarMsg && (
          <p className="settings__msg settings__msg--ok" role="status">
            {avatarMsg}
          </p>
        )}
        <button className="btn" onClick={saveAvatar}>
          Save avatar
        </button>
      </section>
    </div>
  )
}
