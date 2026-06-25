import { useEffect, useState } from 'react'
import Owl from './Owl.jsx'

// Animated concept intro for the Solving Equations checkpoint. Walks through a
// short story on a balance scale: Bruh teeters on it, hops off, two numbers tip
// it, a +1 levels it out, and finally a number turns into an unknown x.
export default function BalanceIntro({ onDone }) {
  const [step, setStep] = useState(0)
  const [showNext, setShowNext] = useState(true)

  // The Next button only appears once the step's animation has played.
  useEffect(() => {
    if (step === 0) {
      setShowNext(true)
      return
    }
    setShowNext(false)
    const t = setTimeout(() => setShowNext(true), 850)
    return () => clearTimeout(t)
  }, [step])

  const isLast = step === 3

  // Beam tilt + how far each pan slides (only step 1 is imbalanced).
  const tilt = step === 1 ? 8 : 0
  const drop = step === 1 ? 22 : 0

  const leftChips =
    step === 0
      ? []
      : step === 1
        ? [{ key: '3', text: '3' }]
        : step === 2
          ? [
              { key: '3', text: '3' },
              { key: '+1', text: '+1', plus: true },
            ]
          : [
              { key: 'x', text: 'x', variable: true },
              { key: '+1', text: '+1', plus: true },
            ]
  const rightChips = step === 0 ? [] : [{ key: '4', text: '4' }]

  const text =
    step === 0 ? (
      <>
        <strong>With equations, it’s all about balance.</strong> Whatever sits on the
        left side weighs exactly the same as what sits on the right, and the equals sign in the
        middle is a promise that those two sides stay perfectly balanced.
      </>
    ) : step === 1 ? (
      <>Put a <strong>3</strong> on one side and a <strong>4</strong> on the other — the heavier side drops, so right now the two sides aren’t equal.</>
    ) : step === 2 ? (
      <>That means whenever you change one side, you have to do the very same thing to the other side to keep the scale level.</>
    ) : (
      <>But what happens if we don’t know one of the numbers?</>
    )

  const handleNext = () => {
    if (isLast) onDone()
    else setStep((s) => s + 1)
  }

  return (
    <div className="bintro">
      <div className="bintro__stage">
        <div className="bintro__owlrow">
          <span className={`bintro__owl ${step > 0 ? 'bintro__owl--gone' : ''}`} aria-hidden="true">
            <Owl />
          </span>
        </div>

        <div className={`bintro__scale ${step === 0 ? 'bintro__scale--teeter' : ''}`}>
          <div className="bintro__top">
            <div className="bintro__fulcrum" aria-hidden="true" />
            <div className="bintro__beam" style={{ transform: `rotate(${tilt}deg)` }} aria-hidden="true">
              <span className="bintro__cap bintro__cap--l" />
              <span className="bintro__cap bintro__cap--r" />
            </div>
          </div>

          <div className="bintro__pans">
            <div className="bintro__slot" style={{ transform: `translateY(${-drop}px)` }}>
              <span className="bintro__cord" aria-hidden="true" />
              <div className="bintro__chips">
                {leftChips.map((c) => (
                  <span
                    key={c.key}
                    className={`bintro__chip ${c.variable ? 'bintro__chip--var' : ''} ${
                      c.plus ? 'bintro__chip--plus' : ''
                    }`}
                  >
                    {c.text}
                  </span>
                ))}
              </div>
              <span className="bintro__plate" aria-hidden="true" />
            </div>

            <div className="bintro__slot" style={{ transform: `translateY(${drop}px)` }}>
              <span className="bintro__cord" aria-hidden="true" />
              <div className="bintro__chips">
                {rightChips.map((c) => (
                  <span key={c.key} className="bintro__chip">
                    {c.text}
                  </span>
                ))}
              </div>
              <span className="bintro__plate" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <p key={step} className="bintro__text">
        {text}
      </p>

      {showNext && (
        <button className="btn bintro__btn" onClick={handleNext}>
          {isLast ? 'Start solving →' : 'Next →'}
        </button>
      )}
    </div>
  )
}
