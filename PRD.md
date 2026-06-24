# Product Requirements Document: algebruh

**Document Owner:** Tiffany Lam
**Last Updated:** June 23, 2026
**Status:** Draft v1.0
**Product Type:** Mobile-first interactive learning app (Brilliant.org-style, single-subject vertical)

---

## 1. Overview

### 1.1 Summary
algebruh is a mobile learning app that teaches foundational algebra to early high school students through interactive, hands-on puzzles. Inspired by Brilliant.org's "learn by doing" philosophy, algebruh deliberately rejects the multi-subject model. Instead of spreading thin across many topics, it goes **deep on a single domain — solving linear equations — and builds the full Brilliant-quality experience around that one topic.**

The core mechanic is a **balancing scale**: students drag and drop weights and variable-blocks onto two sides of a scale to physically "feel" what it means for two expressions to be equal, and to discover the rules for isolating a variable by keeping the scale balanced.

### 1.2 Problem Statement
Many 8th and 9th graders encounter algebra as their first truly abstract math subject. The leap from arithmetic ("numbers you can count") to algebra ("letters that stand for numbers") is where a large share of students disengage. Symbol manipulation feels arbitrary and rule-based — *"why does moving a term to the other side flip the sign?"* — and traditional worksheets reinforce memorization over understanding.

These students are not lacking intelligence; they're lacking an **intuitive, visual model** of what an equation actually *is*. Classroom time is limited, and one-on-one help is scarce.

### 1.3 Solution
A focused mobile app that makes the abstract concrete. By representing equations as a physical balance scale, students learn the single most important idea in introductory algebra — *whatever you do to one side, you must do to the other* — through direct manipulation rather than rote rules. The app supplements (not replaces) classroom instruction, offering a low-pressure, self-paced visual sandbox.

### 1.4 Vision & Scope Philosophy
We are building **vertically**, not horizontally. Rather than a shallow app covering algebra, geometry, and statistics, algebruh delivers a complete, polished experience for **one topic done exceptionally well**. This vertical slice is the foundation: prove that deep, interactive, single-topic mastery works, then potentially expand to adjacent topics later.

---

## 2. Goals & Success Metrics

### 2.1 Product Goals
1. Help disinterested early-algebra students build genuine intuition for solving linear equations.
2. Deliver a "sticky," game-like experience that students *choose* to return to.
3. Validate the single-subject vertical model as an MVP.

### 2.2 Non-Goals (Out of Scope for MVP)
- Covering multiple math subjects or even multiple algebra topics beyond linear equations.
- Social features (leaderboards, friends, multiplayer).
- Teacher/classroom dashboards or assignment management.
- Monetization, subscriptions, or paywalls.
- AI tutoring / chatbot help.
- Offline mode.
- Native iOS/Android builds (MVP targets responsive web / mobile web; see §6).

### 2.3 Success Metrics
| Metric | Target (MVP) |
|---|---|
| Lesson completion rate | ≥ 60% of users who start Lesson 1 complete it |
| Course completion rate | ≥ 25% of starters finish all lessons |
| Puzzle solve rate | ≥ 80% of attempted puzzles eventually solved |
| Return rate | ≥ 30% of users return within 7 days |
| Successful resume | ≥ 95% of returning mid-lesson users land back at their saved checkpoint |
| Self-reported confidence | ≥ 70% report feeling "more confident" in a post-course survey |

---

## 3. Target User

### 3.1 Primary Persona — "Maya, the Reluctant Algebra Student"
- **Age / Grade:** 13–15, 8th–9th grade.
- **Context:** Taking algebra for the first time in school. Bright but not math-confident; finds symbol manipulation confusing and boring.
- **Pain points:** Feels lost when the teacher moves fast; worksheets feel pointless; doesn't know *why* the rules work.
- **Tech:** Lives on her phone. Expects app interactions to be smooth, tactile, and visual — like the games and apps she already uses.
- **Motivation:** Wants to not feel "dumb" in class and to pass tests, but responds far better to visual, low-stakes exploration than to drills.

### 3.2 User Story
> *As an 8th–9th grader learning algebra for the first time, I want to master my algebraic skills with a visual aid so that I can supplement my learning in class.*

### 3.3 Supporting User Stories
- As Maya, I want to **drag weights onto a scale** so I can see two sides of an equation literally balance.
- As Maya, I want **immediate visual feedback** when the scale tips, so I learn from mistakes without feeling judged.
- As Maya, I want **short, bite-sized lessons** so I can practice in 5–10 minutes between other things.
- As Maya, I want to **see my progress** through the lessons so I feel a sense of accomplishment.
- As Maya, I want **hints when I'm stuck** so I don't give up and quit.
- As Maya, I want the app to **remember exactly where I left off** so I can close it and pick back up later without losing my place.
- As Maya, I want to **see what I'm getting right and wrong** so I know which concepts I've actually mastered.

---

## 4. Core Features (MVP)

### 4.1 Interactive Balance Scale (The Core Mechanic)
The defining feature. A visual balance scale represents an equation, with the left pan = left side of the equation and the right pan = right side.

- **Weights** represent constants (numbered blocks, e.g. a "5" weight).
- **Variable blocks** represent the unknown (e.g. an "x" block of unknown weight).
- Students **drag and drop** weights/blocks onto either pan.
- The scale **visually tilts** in real time toward the heavier side, or sits level when balanced.
- To "solve," students perform balanced operations: **remove/add the same amount from both sides**, or **split both sides** (division), keeping the scale level until a single `x` block sits alone against its value.
- When the variable is isolated and the scale balances, the puzzle is **solved** with a celebratory animation.

**Key learning outcome:** students internalize that an equation is a statement of balance, and that solving means performing the same operation to both sides.

### 4.2 Structured Lesson Path (5–7 Lessons)
A linear, progressively difficult sequence. Each lesson contains a short concept intro followed by interactive puzzles.

| # | Lesson | Concept | Example |
|---|---|---|---|
| 1 | What Is Balance? | Equality as balance; both sides equal | `3 = 3`, `2 + 1 = 3` |
| 2 | Meet the Variable | Introducing `x` as an unknown weight | `x = 5` |
| 3 | Adding & Subtracting | Keep balance by doing the same to both sides | `x + 2 = 7` |
| 4 | Bigger Steps | Multi-step balance with larger numbers | `x + 5 = 12` |
| 5 | Multiplying the Variable | Multiple `x` blocks; intro to coefficients | `2x = 8` |
| 6 | Dividing to Solve | Splitting both sides evenly | `3x = 15` |
| 7 | Putting It Together | Combined operations | `2x + 3 = 11` |

*(Lessons 6–7 may be combined or trimmed depending on build capacity; minimum viable is 5 lessons.)*

### 4.3 Progress Tracking & Persistence
A first-class requirement: the app must remember everything about where a student is and how they're doing, so that learning is continuous across sessions and devices.

**Resume exactly where you left off**
- If a student exits the app mid-lesson — or even mid-puzzle — re-entering returns them to that exact point, not the start of the lesson.
- The app saves the current lesson, the current puzzle index within that lesson, and (where feasible) the in-progress state of the active puzzle (which blocks are on which pan).
- On launch, the app restores this checkpoint automatically and offers a clear "Continue" entry point on the lesson map.

**Persistent progress**
- Visual lesson map / path showing locked, available, in-progress, and completed states.
- Per-lesson and per-puzzle completion indicators.
- Progress persists across sessions and devices, tied to the user's account (synced via Firestore), with a local cache so the last state survives an abrupt close.

**Right/wrong tracking (mastery signals)**
- The app records each puzzle attempt and whether it was solved correctly, including the number of attempts and hints used per puzzle.
- Aggregate stats per lesson (e.g. puzzles solved, accuracy, attempts) give the student a sense of mastery and let us identify where students struggle.
- This attempt history is the foundation for future adaptive features (e.g. recommending review of a weak concept) — but for the MVP it is captured and surfaced as simple progress/accuracy, not yet used to alter the lesson path.
- Tracking is framed positively (progress and growth), consistent with the "forgiving exploration" principle — wrong attempts are data, never punishment.

### 4.4 Feedback & Hints
- **Real-time visual feedback:** the scale tilts immediately as blocks are placed.
- **Success feedback:** animation + encouraging message on solving.
- **Hints:** a tappable hint button offering a graduated nudge (e.g. "Try removing the same weight from both sides").
- **No harsh failure states** — students can freely experiment and reset the puzzle.

### 4.5 Lightweight Onboarding & Accounts
- Simple sign-up / sign-in (email or anonymous guest mode) via Firebase Authentication.
- Minimal onboarding: one or two screens explaining the balance metaphor before Lesson 1.

---

## 5. User Flow

```
Launch App
   │
   ▼
Sign In / Guest  ──(first time)──►  Onboarding (balance metaphor intro)
   │                                        │
   ▼                                        ▼
Lesson Map (progress path) ◄────────────────┘
   │
   ▼
Select available Lesson
   │
   ▼
Concept Intro (1 short screen)
   │
   ▼
Puzzle 1 ──► drag/drop weights ──► scale balances? ──no──► (tilt feedback / hint) ──► retry
   │                                     │
   │                                    yes
   ▼                                     ▼
Puzzle 2 … N  ───────────────────►  Lesson Complete (celebration)
                                          │
                                          ▼
                                   Progress saved → Lesson Map (next unlocked)
```

---

## 6. Technical Requirements

### 6.1 Tech Stack
- **Frontend:** React (mobile-first responsive UI). Component-driven architecture; the balance scale built as a reusable interactive component.
- **Drag-and-drop:** A React DnD solution with touch support (e.g. `dnd-kit`) to ensure the core mechanic works smoothly on mobile touchscreens.
- **Backend / Platform:** Firebase
  - **Authentication** — email/password + anonymous guest accounts.
  - **Firestore** — store user profiles, lesson/puzzle definitions, and per-user progress.
  - **Hosting** — deploy the responsive web app.
- **State management:** React Context or a lightweight store (e.g. Zustand) for puzzle and progress state.

### 6.2 Data Model (high level)
- **User:** `{ uid, displayName, createdAt }`
- **Progress (per lesson):** `{ uid, lessonId, status (locked/available/in-progress/complete), currentPuzzleIndex, puzzlesSolved[], updatedAt }`
- **Resume checkpoint:** `{ uid, lastLessonId, lastPuzzleIndex, inProgressPuzzleState (blocks on each pan), updatedAt }` — written on each meaningful state change and on app backgrounding/exit so the student can resume mid-puzzle.
- **Attempt log (right/wrong tracking):** `{ uid, lessonId, puzzleId, correct (bool), attempts, hintsUsed, durationMs, timestamp }` — one record per puzzle attempt; aggregated into per-lesson accuracy stats.
- **Lesson/Puzzle content:** equation definition (left side, right side terms), available weights, target solution. Content can be stored in Firestore or bundled as static config for the MVP.

### 6.3 Persistence Strategy
- **Source of truth:** Firestore documents keyed by `uid`, so progress follows the student across devices and survives reinstalls (for signed-in accounts).
- **Local cache:** persist the resume checkpoint to local storage as well, so the last state is available instantly on launch and survives an abrupt close before a sync completes; reconcile with Firestore on next load.
- **Write triggers:** save on puzzle solve, on advancing puzzles, on hint use, and on app blur/backgrounding/exit. Writes are debounced to avoid excessive Firestore operations.
- **Guest accounts:** for anonymous/guest users, persist locally; on later sign-up, migrate the guest's progress and attempt history into the new account (see Open Questions).

### 6.4 Platform & Performance
- **Mobile-first** responsive design; primary target is mobile browsers (portrait orientation).
- Touch interactions must feel tactile and lag-free (drag, snap-to-pan, tilt animation).
- Animations (scale tilt, success states) should be smooth at 60fps on mid-range phones.

### 6.5 Accessibility (baseline)
- Sufficient color contrast and large touch targets.
- Numeric values shown as text on blocks (not color-only).

---

## 7. Design Principles

1. **Concrete before abstract.** Every concept appears first as physical blocks on a scale, with symbolic notation introduced alongside, never before.
2. **Learn by doing.** Minimal reading; maximal interaction. Following Brilliant.org's model.
3. **Forgiving exploration.** No penalties, no timers, no "wrong answer" shaming. Mistakes are reversible and instructive.
4. **Bite-sized.** Each lesson completable in 5–10 minutes.
5. **One thing, done well.** Resist scope creep into other topics; depth over breadth.

---

## 8. Milestones & Phasing

| Phase | Deliverable |
|---|---|
| **Phase 1 — Core Mechanic** | Working balance-scale component with drag-and-drop, tilt physics, and solve detection (single hardcoded puzzle). |
| **Phase 2 — Lesson Engine** | Data-driven puzzles; sequence of puzzles within a lesson; lesson-complete flow. |
| **Phase 3 — Content** | All 5–7 lessons authored and tuned for difficulty progression. |
| **Phase 4 — Accounts & Progress** | Firebase auth + Firestore progress persistence; lesson map with lock/unlock. |
| **Phase 5 — Polish** | Onboarding, hints, animations, feedback states; mobile QA. |
| **Phase 6 — Launch** | Deploy to Firebase Hosting; collect early feedback against success metrics. |

---

## 9. Open Questions & Risks

- **Drag-and-drop on mobile:** touch DnD with a tilting scale is the riskiest technical piece — needs an early prototype to de-risk.
- **Difficulty tuning:** the jump to multiplication/division (coefficients) is conceptually harder; lessons 5–7 may need extra puzzles or scaffolding.
- **Negative numbers / subtraction on a scale:** physically representing negatives on a balance is non-trivial; MVP scopes to non-negative values only.
- **Guest vs. account:** decide whether progress for guest users persists locally or requires sign-up to save.
- **Content authoring:** static config vs. Firestore-driven content — start static for speed, migrate later if needed.

---

## 10. Appendix — Brilliant.org Inspiration

What we borrow from Brilliant.org:
- Interactive, visual, "learn-by-doing" puzzles over passive video/text.
- Clean, focused, gamified progression.
- Bite-sized lessons.

What we intentionally do differently:
- **Single subject, single topic.** Brilliant spans dozens of courses; algebruh does one topic deeply — a vertical MVP rather than a broad platform.
```