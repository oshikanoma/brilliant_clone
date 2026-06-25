import { useEffect, useState } from 'react'
import Welcome from './Welcome.jsx'
import Auth from './Auth.jsx'
import LessonPath, { CHECKPOINTS } from './LessonPath.jsx'
import Lesson from './Lesson.jsx'
import OrderLesson from './OrderLesson.jsx'
import LikeTermsLesson from './LikeTermsLesson.jsx'
import DistributiveLesson from './DistributiveLesson.jsx'
import EvaluateLesson from './EvaluateLesson.jsx'
import GraphsLesson from './GraphsLesson.jsx'
import ReviewLesson from './ReviewLesson.jsx'
import GraphsReviewLesson from './GraphsReviewLesson.jsx'
import SystemsLesson from './SystemsLesson.jsx'
import EliminationLesson from './EliminationLesson.jsx'
import SubstitutionLesson from './SubstitutionLesson.jsx'
import YInterceptIntro from './YInterceptIntro.jsx'
import SlopeIntro from './SlopeIntro.jsx'
import GraphingIntro from './GraphingIntro.jsx'
import SystemsIntro from './SystemsIntro.jsx'
import PlacementTest from './PlacementTest.jsx'
import PaintByNumber from './PaintByNumber.jsx'
import { INTERCEPT_LEVELS, SLOPE_LEVELS, GRAPH_LEVELS } from './graphsLevels.js'
// Reusable multiple-choice engine + per-checkpoint intros/data for the two new
// sections (Expressions with Exponents, Quadratics and Polynomials).
import ConceptLesson from './ConceptLesson.jsx'
import MultiplyPowersIntro from './MultiplyPowersIntro.jsx'
import PowersOfPowersIntro from './PowersOfPowersIntro.jsx'
import DividePowersIntro from './DividePowersIntro.jsx'
import ProductQuotientPowersIntro from './ProductQuotientPowersIntro.jsx'
import ZeroNegExponentsIntro from './ZeroNegExponentsIntro.jsx'
import AddPolynomialsIntro from './AddPolynomialsIntro.jsx'
import SubtractPolynomialsIntro from './SubtractPolynomialsIntro.jsx'
import MultiplyPolynomialsIntro from './MultiplyPolynomialsIntro.jsx'
import FactoringPolynomialsIntro from './FactoringPolynomialsIntro.jsx'
import DifferenceOfSquaresIntro from './DifferenceOfSquaresIntro.jsx'
import PerfectSquaresIntro from './PerfectSquaresIntro.jsx'
import { LEVELS as MULTIPLY_POWERS_LEVELS, generateLike as multiplyPowersLike } from './multiplyPowersData.js'
import { LEVELS as POWERS_OF_POWERS_LEVELS, generateLike as powersOfPowersLike } from './powersOfPowersData.js'
import { LEVELS as DIVIDE_POWERS_LEVELS, generateLike as dividePowersLike } from './dividePowersData.js'
import { LEVELS as PRODUCT_QUOTIENT_LEVELS, generateLike as productQuotientLike } from './productQuotientPowersData.js'
import { LEVELS as ZERO_NEG_LEVELS, generateLike as zeroNegLike } from './zeroNegExponentsData.js'
import { LEVELS as ADD_POLY_LEVELS, generateLike as addPolyLike } from './addPolynomialsData.js'
import { LEVELS as SUBTRACT_POLY_LEVELS, generateLike as subtractPolyLike } from './subtractPolynomialsData.js'
import { LEVELS as MULTIPLY_POLY_LEVELS, generateLike as multiplyPolyLike } from './multiplyPolynomialsData.js'
import { LEVELS as FACTOR_POLY_LEVELS, generateLike as factorPolyLike } from './factoringPolynomialsData.js'
import { LEVELS as DIFF_SQUARES_LEVELS, generateLike as diffSquaresLike } from './differenceOfSquaresData.js'
import { LEVELS as PERFECT_SQUARES_LEVELS, generateLike as perfectSquaresLike } from './perfectSquaresData.js'
import { LEVELS as EXPONENTS_REVIEW_LEVELS } from './exponentsReviewData.js'
import { LEVELS as QUADRATICS_REVIEW_LEVELS } from './quadraticsReviewData.js'
import { LEVELS as FINAL_EXAM_LEVELS } from './finalExamData.js'
import Settings from './Settings.jsx'
import About from './About.jsx'
import AvatarOwl, { DEFAULT_AVATAR } from './AvatarOwl.jsx'
import {
  getCurrentUser,
  setCurrentUser,
  loadUserState,
  saveUserState,
  onGoogleAuthChange,
  signOutGoogle,
} from './auth.js'

const freshLesson = () => ({ levelIndex: 0, locations: null, results: {} })

// Offered to brand-new accounts right after they pick a name: take a quick
// placement test to skip the fundamentals, or start from the very beginning.
function PlacementOffer({ name, onTake, onSkip }) {
  return (
    <div className="intro">
      <div className="intro__icon" aria-hidden="true">🚀</div>
      <p className="intro__eyebrow">Welcome{name ? `, ${name}` : ''}</p>
      <h2 className="intro__title">Already know some of this?</h2>
      <p className="intro__blurb">
        Take a quick <strong>adaptive placement test</strong>. Bruh picks each question based on how
        you answer the last one — getting harder when you're right, easier when you're not — to find
        exactly where you should start. Do well and you'll skip ahead, anywhere from
        <strong> Graphs</strong> to <strong>Polynomials</strong>.
      </p>
      <div className="placement-offer__actions">
        <button className="btn intro__btn" onClick={onTake}>
          Take the placement test →
        </button>
        <button className="btn btn--ghost" onClick={onSkip}>
          Start from the beginning
        </button>
      </div>
    </div>
  )
}

// Integer count of local days since the epoch — used to compare login dates
// without time-of-day or timezone-string parsing headaches.
const dayIndex = (d = new Date()) =>
  Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000)

// Celebratory popup shown on the first login of each day, rewarding the streak.
function StreakReward({ streak, onClose }) {
  const milestone = streak >= 5 && streak % 5 === 0
  let title
  let msg
  if (streak === 1) {
    title = 'Day 1!'
    msg = "You're here! Come back tomorrow to start building a streak."
  } else if (milestone) {
    title = `${streak}-day streak! 🏆`
    msg = 'Incredible dedication — you earned a gold feather. Bruh is so proud of you!'
  } else {
    title = `${streak}-day streak!`
    msg = "You're on a roll — keep it going by logging in again tomorrow!"
  }
  return (
    <div className="streak-overlay" onClick={onClose}>
      <div className="streak" role="dialog" aria-label="Login streak reward" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="streak__close" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
        <div className="streak__flame" aria-hidden="true">
          {milestone ? '🏆' : '🔥'}
          <span className="streak__num">{streak}</span>
        </div>
        <p className="streak__title">{title}</p>
        <p className="streak__msg">{msg}</p>
        <button className="btn streak__btn" onClick={onClose}>
          Let’s go →
        </button>
      </div>
    </div>
  )
}

// Light-green brand bar pinned to the top of every screen. The brand is a button
// that returns home to the path; the hamburger opens a Settings/About/Log out
// menu, and the user's avatar sits to the right of their name.
function TopBar({ displayName, avatar, onNavigate, onLogout }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button type="button" className="topbar__brandbtn" onClick={() => onNavigate('path')}>
          <span className="topbar__brand">algebruh</span>
        </button>
        <button type="button" className="topbar__home" onClick={() => onNavigate('path')}>
          <span className="topbar__homeicon" aria-hidden="true">⌂</span>
          Home
        </button>
      </div>

      <div className="topbar__account">
        <span className="topbar__user" title={displayName}>
          {displayName}
        </span>
        <span className="topbar__avatar">
          <AvatarOwl avatar={avatar} size={34} />
        </span>
        <div className="topbar__menuwrap">
          <button
            type="button"
            className="topbar__menubtn"
            aria-label="Menu"
            aria-haspopup="true"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="topbar__bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
          {open && (
            <>
              <div className="topbar__backdrop" onClick={() => setOpen(false)} />
              <div className="menu" role="menu">
                <button
                  type="button"
                  className="menu__item"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    onNavigate('settings')
                  }}
                >
                  Settings
                </button>
                <button
                  type="button"
                  className="menu__item"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    onNavigate('about')
                  }}
                >
                  About
                </button>
                <button
                  type="button"
                  className="menu__item menu__item--danger"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    onLogout()
                  }}
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// A logged-in student's whole experience. Mounted with a `key` of the storage
// id so switching accounts re-initializes state from that user's saved progress.
// `username` is the storage key (a local username, or `google:<uid>`),
// `defaultName` seeds the display name (e.g. a Google profile name), and
// `isGoogle` toggles account-specific UI (password changes don't apply).
function Session({ username, defaultName = '', isGoogle = false, onLogout }) {
  const saved = loadUserState(username)
  const [screen, setScreen] = useState(saved?.screen ?? 'welcome')
  const [name, setName] = useState(saved?.name ?? defaultName ?? '')
  const [birthday, setBirthday] = useState(saved?.birthday ?? '')
  const [avatar, setAvatar] = useState(saved?.avatar ?? DEFAULT_AVATAR)
  const [checkpoint, setCheckpoint] = useState(saved?.checkpoint ?? 0)
  // Per-checkpoint lesson progress, keyed by checkpoint index.
  const [lessons, setLessons] = useState(saved?.lessons ?? {})
  // How many checkpoints are unlocked (the first is always available), and which
  // ones the student has passed. Passing a checkpoint unlocks the next.
  const [unlocked, setUnlocked] = useState(saved?.unlocked ?? 1)
  const [completed, setCompleted] = useState(saved?.completed ?? {})
  // Daily login streak tracking.
  const [streak, setStreak] = useState(saved?.streak ?? 0)
  const [lastLoginDay, setLastLoginDay] = useState(saved?.lastLoginDay ?? null)
  const [streakReward, setStreakReward] = useState(null)
  // Paint-by-number progress (the end-of-course reward): regionId -> color number.
  const [paint, setPaint] = useState(saved?.paint ?? {})
  // Correct answers tallied per local day (dayIndex -> count), powering the
  // weekly activity bar graph on the path.
  const [dailyCorrect, setDailyCorrect] = useState(saved?.dailyCorrect ?? {})

  // Persist this user's session on every meaningful change.
  useEffect(() => {
    saveUserState(username, {
      screen,
      name,
      birthday,
      avatar,
      checkpoint,
      lessons,
      unlocked,
      completed,
      streak,
      lastLoginDay,
      paint,
      dailyCorrect,
    })
  }, [username, screen, name, birthday, avatar, checkpoint, lessons, unlocked, completed, streak, lastLoginDay, paint, dailyCorrect])

  // Reconcile the login streak once per session: bump it on consecutive days,
  // reset it after a missed day, and reward the first login of the day.
  useEffect(() => {
    const today = dayIndex()
    if (lastLoginDay === today) return
    const next = lastLoginDay != null && today - lastLoginDay === 1 ? streak + 1 : 1
    setStreak(next)
    setLastLoginDay(today)
    setStreakReward({ streak: next })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lastIndex = CHECKPOINTS.length - 1

  // Adaptive placement: mark every checkpoint up to (and including)
  // `completedThrough` complete, unlock the next one, and drop the student there.
  // A value < 0 means "start from the very beginning".
  const applyPlacement = (completedThrough) => {
    if (!Number.isInteger(completedThrough) || completedThrough < 0) {
      setCheckpoint(0)
      setScreen('path')
      return
    }
    const done = {}
    for (let i = 0; i <= completedThrough; i++) done[i] = true
    setCompleted(done)
    setUnlocked(Math.min(CHECKPOINTS.length, completedThrough + 2))
    setCheckpoint(Math.min(CHECKPOINTS.length - 1, completedThrough + 1))
    setScreen('path')
  }

  // Mark a checkpoint passed and unlock the next one on the path. Passing the
  // final checkpoint (the Final Exam) flips `completed[lastIndex]`, which
  // unlocks the "Walk the stage" graduation button on the path.
  const passCheckpoint = (index) => {
    setCompleted((prev) => ({ ...prev, [index]: true }))
    setUnlocked((u) => Math.min(CHECKPOINTS.length, Math.max(u, index + 2)))
  }

  const lessonProps = {
    lessonTitle: CHECKPOINTS[checkpoint],
    value: lessons[checkpoint] ?? freshLesson(),
    onChange: (next) => {
      // Count any level that just transitioned to solved as a correct answer
      // for today, feeding the weekly activity graph on the path.
      const prevResults = lessons[checkpoint]?.results ?? {}
      const nextResults = next?.results ?? {}
      let gained = 0
      for (const k of Object.keys(nextResults)) {
        if (nextResults[k]?.solved && !prevResults[k]?.solved) gained += 1
      }
      if (gained > 0) {
        const today = dayIndex()
        setDailyCorrect((d) => ({ ...d, [today]: (d[today] ?? 0) + gained }))
      }
      setLessons((prev) => ({ ...prev, [checkpoint]: next }))
    },
    onBack: () => setScreen('path'),
    onPass: () => {
      passCheckpoint(checkpoint)
      // Acing the Algebra Foundations Review (checkpoint 5) unlocks the
      // paint-by-number reward instead of just bouncing back to the path.
      setScreen(checkpoint === 5 ? 'paint' : 'path')
    },
  }

  // Pick the active screen. Each checkpoint maps to a lesson style by its index
  // in the flat CHECKPOINTS list (see LessonPath SECTIONS):
  //   0 Solving Equations → balance-scale lesson
  //   1 Order of Operations → PEMDAS lesson
  //   2 Combining Like Terms → rope lesson
  //   3 Distributive Property → area-model lesson
  //   4 Evaluating Expressions → substitution lesson
  //   5 Review → mixed foundations quiz (passing rewards paint-by-number)
  //   6 Y-Intercept / 7 Slope / 8 Graphing → coordinate-plane lesson (filtered)
  //   9 Systems (Graphing) → graph two lines, pin intersection
  //   10 Systems (Elimination) / 11 Systems (Substitution) → solve algebraically
  //   12 Review → mixed graphs quiz
  //   13–17 Expressions with Exponents → ConceptLesson (animated intro + MC + make-up)
  //   18 Review → mixed exponents quiz
  //   19–24 Quadratics and Polynomials → ConceptLesson (animated intro + MC + make-up)
  //   25 Review → mixed quadratics quiz
  //   26 Final Exam → cumulative ConceptLesson exam (pass/fail 80%, unlocks graduation)
  let screenEl
  if (screen === 'welcome') {
    screenEl = (
      <Welcome
        onContinue={(n) => {
          setName(n)
          setScreen('placement-offer')
        }}
      />
    )
  } else if (screen === 'placement-offer') {
    screenEl = (
      <PlacementOffer
        name={name}
        onTake={() => setScreen('placement')}
        onSkip={() => setScreen('path')}
      />
    )
  } else if (screen === 'placement') {
    screenEl = (
      <PlacementTest onExit={(completedThrough) => applyPlacement(completedThrough)} />
    )
  } else if (screen === 'path') {
    screenEl = (
      <LessonPath
        name={name}
        avatar={avatar}
        streak={streak}
        dailyCorrect={dailyCorrect}
        unlocked={unlocked}
        completed={completed}
        graduated={!!completed[lastIndex]}
        onStart={(index) => {
          setCheckpoint(index)
          setScreen('lesson')
        }}
        onRestart={(index) => {
          // Replay a completed checkpoint from scratch (wipe its lesson
          // progress) while keeping it unlocked/completed on the path.
          setLessons((prev) => ({ ...prev, [index]: freshLesson() }))
          setCheckpoint(index)
          setScreen('lesson')
        }}
      />
    )
  } else if (screen === 'paint') {
    screenEl = <PaintByNumber onBack={() => setScreen('path')} fills={paint} onChangeFills={setPaint} />
  } else if (screen === 'settings') {
    screenEl = (
      <Settings
        username={username}
        canChangePassword={!isGoogle}
        name={name}
        birthday={birthday}
        avatar={avatar}
        onSavePersonal={({ name: n, birthday: b }) => {
          setName(n)
          setBirthday(b)
        }}
        onSaveAvatar={setAvatar}
        onBack={() => setScreen('path')}
      />
    )
  } else if (screen === 'about') {
    screenEl = <About onBack={() => setScreen('path')} />
  } else if (checkpoint === 1) {
    screenEl = <OrderLesson {...lessonProps} />
  } else if (checkpoint === 2) {
    screenEl = <LikeTermsLesson {...lessonProps} />
  } else if (checkpoint === 3) {
    screenEl = <DistributiveLesson {...lessonProps} />
  } else if (checkpoint === 4) {
    screenEl = <EvaluateLesson {...lessonProps} />
  } else if (checkpoint === 5) {
    screenEl = <ReviewLesson {...lessonProps} />
  } else if (checkpoint === 6) {
    screenEl = <GraphsLesson {...lessonProps} levels={INTERCEPT_LEVELS} IntroComponent={YInterceptIntro} />
  } else if (checkpoint === 7) {
    screenEl = <GraphsLesson {...lessonProps} levels={SLOPE_LEVELS} IntroComponent={SlopeIntro} />
  } else if (checkpoint === 8) {
    screenEl = <GraphsLesson {...lessonProps} levels={GRAPH_LEVELS} IntroComponent={GraphingIntro} />
  } else if (checkpoint === 9) {
    screenEl = <SystemsLesson {...lessonProps} IntroComponent={SystemsIntro} />
  } else if (checkpoint === 10) {
    screenEl = <EliminationLesson {...lessonProps} />
  } else if (checkpoint === 11) {
    screenEl = <SubstitutionLesson {...lessonProps} />
  } else if (checkpoint === 12) {
    screenEl = <GraphsReviewLesson {...lessonProps} />
  } else if (checkpoint === 13) {
    screenEl = (
      <ConceptLesson {...lessonProps} levels={MULTIPLY_POWERS_LEVELS} IntroComponent={MultiplyPowersIntro} generateLike={multiplyPowersLike} />
    )
  } else if (checkpoint === 14) {
    screenEl = (
      <ConceptLesson {...lessonProps} levels={POWERS_OF_POWERS_LEVELS} IntroComponent={PowersOfPowersIntro} generateLike={powersOfPowersLike} />
    )
  } else if (checkpoint === 15) {
    screenEl = (
      <ConceptLesson {...lessonProps} levels={DIVIDE_POWERS_LEVELS} IntroComponent={DividePowersIntro} generateLike={dividePowersLike} />
    )
  } else if (checkpoint === 16) {
    screenEl = (
      <ConceptLesson {...lessonProps} levels={PRODUCT_QUOTIENT_LEVELS} IntroComponent={ProductQuotientPowersIntro} generateLike={productQuotientLike} />
    )
  } else if (checkpoint === 17) {
    screenEl = (
      <ConceptLesson {...lessonProps} levels={ZERO_NEG_LEVELS} IntroComponent={ZeroNegExponentsIntro} generateLike={zeroNegLike} />
    )
  } else if (checkpoint === 18) {
    screenEl = (
      <ConceptLesson
        {...lessonProps}
        levels={EXPONENTS_REVIEW_LEVELS}
        isReview
        intro={{
          icon: '⚡',
          eyebrow: 'Expressions with Exponents · Checkpoint',
          title: 'Time to test your exponent skills!',
          blurb: (
            <span>
              You've multiplied, divided, and stacked powers, and tamed zero and negative
              exponents. <strong>Let's see what stuck.</strong>
            </span>
          ),
        }}
      />
    )
  } else if (checkpoint === 19) {
    screenEl = (
      <ConceptLesson {...lessonProps} levels={ADD_POLY_LEVELS} IntroComponent={AddPolynomialsIntro} generateLike={addPolyLike} />
    )
  } else if (checkpoint === 20) {
    screenEl = (
      <ConceptLesson {...lessonProps} levels={SUBTRACT_POLY_LEVELS} IntroComponent={SubtractPolynomialsIntro} generateLike={subtractPolyLike} />
    )
  } else if (checkpoint === 21) {
    screenEl = (
      <ConceptLesson {...lessonProps} levels={MULTIPLY_POLY_LEVELS} IntroComponent={MultiplyPolynomialsIntro} generateLike={multiplyPolyLike} />
    )
  } else if (checkpoint === 22) {
    screenEl = (
      <ConceptLesson {...lessonProps} levels={FACTOR_POLY_LEVELS} IntroComponent={FactoringPolynomialsIntro} generateLike={factorPolyLike} />
    )
  } else if (checkpoint === 23) {
    screenEl = (
      <ConceptLesson {...lessonProps} levels={DIFF_SQUARES_LEVELS} IntroComponent={DifferenceOfSquaresIntro} generateLike={diffSquaresLike} />
    )
  } else if (checkpoint === 24) {
    screenEl = (
      <ConceptLesson {...lessonProps} levels={PERFECT_SQUARES_LEVELS} IntroComponent={PerfectSquaresIntro} generateLike={perfectSquaresLike} />
    )
  } else if (checkpoint === 25) {
    screenEl = (
      <ConceptLesson
        {...lessonProps}
        levels={QUADRATICS_REVIEW_LEVELS}
        isReview
        intro={{
          icon: '🎯',
          eyebrow: 'Quadratics and Polynomials · Checkpoint',
          title: 'The final review!',
          blurb: (
            <span>
              You've added, subtracted, multiplied, and factored polynomials, and spotted
              special patterns. <strong>One last check before you graduate!</strong>
            </span>
          ),
        }}
      />
    )
  } else if (checkpoint === 26) {
    screenEl = (
      <ConceptLesson
        {...lessonProps}
        levels={FINAL_EXAM_LEVELS}
        isReview
        passPct={80}
        intro={{
          icon: '🎓',
          eyebrow: 'Final Exam · Everything you’ve learned',
          title: 'The Final Exam!',
          blurb: (
            <span>
              This one covers <strong>everything</strong> — foundations, graphs, exponents, and
              polynomials. Score <strong>80% or higher</strong> to graduate. You've got this!
            </span>
          ),
          cta: 'Start the exam →',
        }}
      />
    )
  } else {
    screenEl = <Lesson {...lessonProps} />
  }

  return (
    <>
      <TopBar
        displayName={name || defaultName || username}
        avatar={avatar}
        onNavigate={setScreen}
        onLogout={onLogout}
      />
      {screenEl}
      {streakReward && screen !== 'welcome' && (
        <StreakReward streak={streakReward.streak} onClose={() => setStreakReward(null)} />
      )}
    </>
  )
}

export default function App() {
  // Local username/password session (localStorage-backed demo accounts).
  const [localUser, setLocalUser] = useState(getCurrentUser())
  // Firebase (Google) session, driven by onAuthStateChanged.
  const [googleUser, setGoogleUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  useEffect(() => {
    // Listen for Firebase auth state. Fires immediately with the current user
    // (or null), which also flips authReady so we don't flash the login screen
    // while Firebase restores a persisted Google session.
    const unsub = onGoogleAuthChange((u) => {
      setGoogleUser(u)
      setAuthReady(true)
    })
    return unsub
  }, [])

  const handleLogout = () => {
    // Clear whichever session is active. signOutGoogle triggers the listener,
    // which clears googleUser on its own.
    signOutGoogle()
    setCurrentUser(null)
    setLocalUser(null)
  }

  // A Google session takes precedence; otherwise fall back to a local account.
  const identity = googleUser
    ? {
        storageKey: `google:${googleUser.uid}`,
        defaultName: googleUser.displayName || googleUser.email || 'Friend',
        isGoogle: true,
      }
    : localUser
      ? { storageKey: localUser, defaultName: '', isGoogle: false }
      : null

  // Avoid flashing the login screen before Firebase reports its restored state.
  if (!authReady) {
    return (
      <div className="welcome welcome--auth">
        <div className="welcome__card">
          <div className="welcome__badge">algebruh</div>
          <p className="welcome__slogan">Loading…</p>
        </div>
      </div>
    )
  }

  if (!identity) {
    return (
      <>
        <header className="topbar">
          <span className="topbar__brand">algebruh</span>
          <button type="button" className="topbar__home" onClick={() => setShowAbout((s) => !s)}>
            {showAbout ? '← Back' : 'About'}
          </button>
        </header>
        {showAbout ? <About onBack={() => setShowAbout(false)} /> : <Auth onAuthed={(u) => setLocalUser(u)} />}
      </>
    )
  }

  return (
    <Session
      key={identity.storageKey}
      username={identity.storageKey}
      defaultName={identity.defaultName}
      isGoogle={identity.isGoogle}
      onLogout={handleLogout}
    />
  )
}
