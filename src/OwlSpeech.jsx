import Owl from './Owl.jsx'

// A floating owl that "says" the current feedback in a speech bubble. Replaces
// the plain feedback box inside lessons. `tone` is 'ok' | 'bad' | 'neutral'.
export default function OwlSpeech({ text, tone = 'neutral' }) {
  return (
    <div className="owl-speech">
      <span className="owl owl--float" aria-hidden="true">
        <Owl />
      </span>
      <div className={`speech speech--${tone}`} role="status" aria-live="polite">
        {text}
      </div>
    </div>
  )
}
