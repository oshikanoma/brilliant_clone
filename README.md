# algebruh

> A focused, mobile-first algebra learning app in the spirit of Brilliant.org — learn by *doing*, not by reading. Guided by **Bruh the owl**, students work through interactive puzzles, an adaptive placement test, and an AI homework helper.

### Live demo

**▶ [oshikanoma.github.io/brilliant_clone](https://oshikanoma.github.io/brilliant_clone/)**

The site is deployed automatically to GitHub Pages on every push to `main`.

**To try it as a grader:**
1. Open the live demo link above.
2. **Create a demo account** with any name/email + password (these are stored in your browser's `localStorage` — see [Authentication](#authentication)), **or** click **Continue with Google**.
3. Optionally take the **placement test** to skip ahead, or start from the top of the path.

---

## What it is

algebruh started as the single-topic "balance scale" vertical described in [`PRD.md`](./PRD.md) and grew into a full early-algebra course. It teaches 8th–9th graders their first abstract math through:

- **Direct manipulation** — drag weights onto a balance scale to *feel* what "both sides are equal" means.
- **Animated concept intros** — Bruh hops across each equation to show the rule before you practice it.
- **A forgiving make-up flow** — miss a question and you make it up by getting it right 3 more times, so nobody advances on a concept they haven't mastered.
- **An adaptive placement test** — a deterministic, section-gated engine places returning learners conservatively (it would rather have you re-learn than skip).
- **Bruh's Homework Help** — describe a problem you're stuck on and the AI tutor generates an animated walkthrough followed by interactive practice problems.

## Features

- 🦉 **Bruh the owl** mascot with a customizable avatar (set during sign-up and in Settings).
- 🧮 **Interactive balance scale** with touch-friendly drag-and-drop (`@dnd-kit`).
- 📈 **Interactive coordinate graphs** for slope, intercepts, graphing, and systems.
- ✍️ **Scratch whiteboard** (with undo/redo) on the harder multi-step lessons.
- 🔁 **Make-up state machine** (`lib/useMakeup.js`) shared across every checkpoint.
- 🧭 **Adaptive placement test** that morphs the learner's progress along the path.
- 🤖 **AI homework help** — animated worked example + generated practice questions.
- 🏁 **Final exam → graduation finale** — pass the 80% cumulative exam to walk the stage.
- 📊 **Weekly activity graph** of daily correct answers.
- 🔐 **Dual-mode auth** — local demo accounts *and* Firebase Google sign-in, sharing the same progress shape.
- 💾 **Progress persistence** via `localStorage` (per local account / per Firebase `uid`).

## Course map

| Section | Checkpoints |
|---|---|
| **Algebra Foundations** | Solving Equations · Order of Operations · Combining Like Terms · Distributive Property · Evaluating Expressions · Review |
| **Graphs & Linear Relationships** | Y-Intercept · Slope · Graphing · Systems (Graphing / Elimination / Substitution) · Review |
| **Expressions with Exponents** | Multiply Powers · Powers of Powers · Divide Powers · Powers of Products & Quotients · Zero & Negative Exponents · Review |
| **Quadratics & Polynomials** | Add · Subtract · Multiply · Factoring · Difference of Squares · Perfect Squares · Review |
| **Graduation** | Final Exam (pass/fail, 80%) → graduation ceremony |

## Tech stack

- **React 19** + **Vite 8** (mobile-first responsive UI)
- **@dnd-kit** for touch drag-and-drop
- **Firebase Auth** (Google sign-in)
- **OpenAI** (server-side only) for Bruh's Homework Help
- **GitHub Pages** for hosting (auto-deploy via GitHub Actions)
- A serverless `api/homework` proxy (e.g. Vercel) for the AI feature

## Project structure

```
src/
├── App.jsx              # Root component: routing + screen/progress state
├── main.jsx             # Entry point
├── components/          # Shared UI (Owl, OwlSpeech, Graph, BalanceScale,
│                        #   Whiteboard, AvatarEditor, MakeupDots, …)
├── intros/              # Animated concept intros (one per lesson) + their CSS
├── lessons/             # Interactive lesson engines (ConceptLesson,
│                        #   GraphsLesson, SystemsLesson, Lesson, …)
├── screens/             # Top-level pages (Auth, Welcome, Settings, LessonPath,
│                        #   PlacementTest, HomeworkHelp, GraduationFinale, …)
├── data/                # Level definitions & question banks (*Levels.js,
│                        #   *Data.js, placementBank.js, finalExamData.js, …)
├── lib/                 # Logic & services (auth, firebase, useMakeup,
│                        #   shuffleChoices, placementLogic, homeworkClient)
├── styles/              # Global CSS (index.css)
└── assets/              # Static images

api/        # Serverless function entry points (e.g. /api/homework)
server/     # Server-side logic shared by the dev middleware + serverless fns
```

## Getting started

**Prerequisites:** Node 20+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (optional — see below)
cp .env.example .env.local
#   ...then fill in the values you need

# 3. Start the dev server
npm run dev

# 4. Production build / local preview
npm run build
npm run preview
```

The app runs **without any configuration** — Google sign-in and AI homework help simply stay disabled (and degrade gracefully) until you add the relevant keys.

## Environment variables

Copy `.env.example` → `.env.local`. All values are optional for a basic local run.

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_*` | Firebase web config that enables **Google sign-in**. Without it, only local demo accounts work. |
| `OPENAI_API_KEY` | **Secret** (no `VITE_` prefix). Read only server-side by the homework proxy. Enables Bruh's Homework Help. |
| `OPENAI_MODEL` | Optional; defaults to `gpt-4o-mini`. |
| `VITE_HOMEWORK_API_URL` | Full URL of a deployed `/api/homework` function. Needed when the host (like GitHub Pages) can't run serverless functions; leave blank to use the same-origin endpoint in dev. |

See the comments in [`.env.example`](./.env.example) for full setup instructions, including Firebase authorized-domain configuration.

## Authentication

algebruh ships with **two auth modes** that share the same progress data shape:

- **Local demo accounts** — email/password stored in `localStorage`. This is a grader convenience for trying the app instantly and is **explicitly not secure / not for real use**.
- **Firebase Google sign-in** — real OAuth; progress is keyed by the Firebase `uid`.

## Deployment

- **Frontend (GitHub Pages):** pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds with Vite (`base: /brilliant_clone/`), adds a `404.html` SPA fallback, and publishes to Pages.
- **AI proxy (serverless):** `api/homework.js` is deployed to a serverless host (e.g. Vercel) with `OPENAI_API_KEY` set in that host's environment. The browser only ever calls `/api/homework`, never OpenAI directly, so the key stays secret.

## Relationship to the PRD

[`PRD.md`](./PRD.md) documents the original product vision: a single-topic (linear equations) balance-scale MVP, with quantified success metrics and explicit non-goals. The shipped app keeps that core mechanic and learn-by-doing philosophy, then expands the curriculum into a multi-section algebra course and layers in optional AI assistance.

---

*Built by Tiffany Lam.*
