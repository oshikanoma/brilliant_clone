import Owl from './Owl.jsx'

export default function About({ onBack }) {
  return (
    <div className="app">
      <header className="app__header app__header--lesson">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <h1>About</h1>
      </header>

      <div className="about">
        <p className="about__text">
          <strong>algebruh</strong> is a site aimed at helping 7th-9th graders trying
          to learn the fundamentals of algebra, but of course, all ages are welcome! algebruh was developed by a student <em>for</em>{' '}
          students — and Bruh the Owl is more than happy to join along for the ride.
        </p>

        <div className="about__owl">
          <span className="owl owl--float">
            <Owl />
          </span>
        </div>
      </div>
    </div>
  )
}
