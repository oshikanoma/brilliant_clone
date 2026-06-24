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
import PaintByNumber from './PaintByNumber.jsx'
import { getCurrentUser, setCurrentUser, loadUserState, saveUserState } from './auth.js'

const freshLesson = () => ({ levelIndex: 0, locations: null, results: {} })

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

// Light-green brand bar pinned to the top of every screen.
function TopBar({ username, onLogout }) {
  return (
    <header className="topbar">
      <span className="topbar__brand">algebruh</span>
      {username && (
        <div className="topbar__account">
          <span className="topbar__user" title={username}>
            {username}
          </span>
          <button type="button" className="topbar__logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      )}
    </header>
  )
}

// A logged-in student's whole experience. Mounted with a `key` of the username
// so switching accounts re-initializes state from that user's saved progress.
function Session({ username }) {
  const saved = loadUserState(username)
  const [screen, setScreen] = useState(saved?.screen ?? 'welcome')
  const [name, setName] = useState(saved?.name ?? '')
  const [checkpoint, setCheckpoint] = useState(saved?.checkpoint ?? 0)
  // Per-checkpoint lesson progress, keyed by checkpoint index.
  const [lessons, setLessons] = useState(saved?.lessons ?? {})
  // How many checkpoints are unlocked (the first is always available), and which
  // ones the student has passed. Passing a checkpoint unlocks the next.
  const [unlocked, setUnlocked] = useState(saved?.unlocked ?? 1)
  const [completed, setCompleted] = useState(saved?.completed ?? {})
  // Whether the "you finished the module" popup has been dismissed on the path.
  const [finaleDismissed, setFinaleDismissed] = useState(saved?.finaleDismissed ?? false)
  // Daily login streak tracking.
  const [streak, setStreak] = useState(saved?.streak ?? 0)
  const [lastLoginDay, setLastLoginDay] = useState(saved?.lastLoginDay ?? null)
  const [streakReward, setStreakReward] = useState(null)

  // Persist this user's session on every meaningful change.
  useEffect(() => {
    saveUserState(username, {
      screen,
      name,
      checkpoint,
      lessons,
      unlocked,
      completed,
      finaleDismissed,
      streak,
      lastLoginDay,
    })
  }, [username, screen, name, checkpoint, lessons, unlocked, completed, finaleDismissed, streak, lastLoginDay])

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

  // Mark a checkpoint passed and unlock the next one on the path.
  const passCheckpoint = (index) => {
    setCompleted((prev) => ({ ...prev, [index]: true }))
    setUnlocked((u) => Math.min(CHECKPOINTS.length, Math.max(u, index + 2)))
    // Finishing the final checkpoint re-arms the module-complete popup.
    if (index === lastIndex) setFinaleDismissed(false)
  }

  const lessonProps = {
    lessonTitle: CHECKPOINTS[checkpoint],
    value: lessons[checkpoint] ?? freshLesson(),
    onChange: (next) => setLessons((prev) => ({ ...prev, [checkpoint]: next })),
    onBack: () => setScreen('path'),
    onPass: () => {
      passCheckpoint(checkpoint)
      setScreen('path')
    },
  }

  // Pick the active screen. Each checkpoint has its own lesson style: checkpoint
  // 1 ("Order of Operations") is the PEMDAS lesson, 2 ("Combining Like Terms")
  // is the rope lesson, 3 ("Distributive Property") is the area-model lesson, 4
  // ("Evaluating Expressions") is the substitution lesson, 5 ("Graphs and Linear
  // Relationships") is the coordinate-plane lesson, and the rest use the
  // balance-scale lesson.
  let screenEl
  if (screen === 'welcome') {
    screenEl = (
      <Welcome
        onContinue={(n) => {
          setName(n)
          setScreen('path')
        }}
      />
    )
  } else if (screen === 'path') {
    screenEl = (
      <LessonPath
        name={name}
        streak={streak}
        unlocked={unlocked}
        completed={completed}
        finished={!!completed[lastIndex] && !finaleDismissed}
        onDismissFinale={() => setFinaleDismissed(true)}
        onTestSkills={() => setScreen('paint')}
        onStart={(index) => {
          setCheckpoint(index)
          setScreen('lesson')
        }}
      />
    )
  } else if (screen === 'paint') {
    screenEl = <PaintByNumber onBack={() => setScreen('path')} />
  } else if (checkpoint === 1) {
    screenEl = <OrderLesson {...lessonProps} />
  } else if (checkpoint === 2) {
    screenEl = <LikeTermsLesson {...lessonProps} />
  } else if (checkpoint === 3) {
    screenEl = <DistributiveLesson {...lessonProps} />
  } else if (checkpoint === 4) {
    screenEl = <EvaluateLesson {...lessonProps} />
  } else if (checkpoint === 5) {
    screenEl = <GraphsLesson {...lessonProps} />
  } else {
    screenEl = <Lesson {...lessonProps} />
  }

  return (
    <>
      {screenEl}
      {streakReward && (
        <StreakReward streak={streakReward.streak} onClose={() => setStreakReward(null)} />
      )}
    </>
  )
}

export default function App() {
  const [user, setUser] = useState(getCurrentUser())

  const handleLogout = () => {
    setCurrentUser(null)
    setUser(null)
  }

  return (
    <>
      <TopBar username={user} onLogout={handleLogout} />
      {user ? (
        <Session key={user} username={user} />
      ) : (
        <Auth onAuthed={(u) => setUser(u)} />
      )}
    </>
  )
}
