import { useState } from 'react'
import OwlSpeech from '../components/OwlSpeech.jsx'
import AvatarEditor from '../components/AvatarEditor.jsx'
import { DEFAULT_AVATAR } from '../components/AvatarOwl.jsx'

export default function Welcome({ onContinue }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR)

  const submit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onContinue({ name: trimmed, avatar })
  }

  return (
    <div className="welcome">
      <div className="welcome__card">
        <div className="welcome__badge">algebruh</div>
        <h1 className="welcome__title">Welcome!</h1>

        <OwlSpeech
          tone="neutral"
          text="Hoot hoot! I'm Bruh, your owl guide — I'll be right here helping you learn algebra today. First, what should I call you, and how should we dress up your owl?"
        />

        <form className="welcome__form" onSubmit={submit}>
          <input
            className="welcome__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={24}
            autoFocus
          />

          <div className="welcome__avatar">
            <p className="welcome__avatar-label">Make your owl your own</p>
            <AvatarEditor value={avatar} onChange={setAvatar} previewSize={104} />
          </div>

          <button className="btn welcome__btn" type="submit" disabled={!name.trim()}>
            Continue →
          </button>
        </form>
      </div>
    </div>
  )
}
