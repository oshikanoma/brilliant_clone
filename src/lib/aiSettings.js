// The single, user-facing "AI features" gate. When the student turns AI off in
// Settings, the whole app's no-AI promise becomes verifiable directly in the UI:
//   - the placement test runs fully on-device (no network call, no "Adaptive"
//     badge — it's the deterministic engine);
//   - Bruh's Homework Help (the only other AI surface) is hidden and blocked.
//
// Stored in localStorage as a plain app-wide flag (default: on) so the plain
// client modules below can read it synchronously at call time without threading
// React state around.

const KEY = 'algebruh:aiEnabled'

export function getAiEnabled() {
  try {
    const v = localStorage.getItem(KEY)
    return v === null ? true : v === 'true'
  } catch {
    return true
  }
}

export function setAiEnabled(on) {
  try {
    localStorage.setItem(KEY, on ? 'true' : 'false')
  } catch {
    /* ignore (private mode, etc.) */
  }
}
