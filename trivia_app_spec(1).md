# TriviaArena — Product Spec & Architecture Reference

**Version:** 3.0  
**Last Updated:** 2026-03-31  
**Status:** Draft

### Changelog
| Version | Change |
|---|---|
| 3.0 | Rebuilt as a web app. Removed timer, Elo ratings, AsyncStorage, and React Native. Core loop: pick a mode → answer questions → see score + full review. |
| 2.0 | Removed auth, backend, and database. Fully offline React Native + Expo app. |
| 1.0 | Initial spec |

---

## 1. Product Overview

TriviaArena is a lightweight, fully client-side web quiz app for trivia competition practice. It loads question banks from JSON files bundled in the codebase, presents multiple-choice questions one at a time, and at the end shows the player their score along with a full review of every question — what they got right, what they got wrong, and the correct answers.

There is no backend, no database, no accounts, and no timer. The entire app runs in the browser.

### Core Goals

- Pick a topic mode and start a quiz in two clicks
- Answer multiple-choice questions one at a time
- See a clear score and full answer review at the end
- Add new question sets by dropping in a JSON file — no code change required
- Works entirely offline once the page is loaded

---

## 2. Feature Summary

| Feature | Description |
|---|---|
| Mode Selector | Landing page — grid of topic cards, one per JSON file |
| Pre-Quiz Config | Choose number of questions and difficulty filter |
| Quiz Screen | One question at a time, multiple choice, no timer |
| Results Screen | Score summary + full question-by-question review |
| Correct answer reveal | Every question shows the right answer and optional explanation |
| Fully client-side | No server, no API calls, no accounts |

**Not in this version:**
- Timer / countdown
- Elo or skill ratings
- User accounts or login
- Leaderboard
- Cloud sync

---

## 3. Question JSON Schema

Question files live in `src/questions/`. Each file is one mode. The filename (without extension) becomes the mode's identifier.

```json
{
  "mode": "science",
  "label": "Science & Nature",
  "icon": "🔬",
  "color": "#00C9A7",
  "questions": [
    {
      "id": "sci_001",
      "question": "What is the powerhouse of the cell?",
      "options": [
        "Nucleus",
        "Mitochondria",
        "Ribosome",
        "Golgi Apparatus"
      ],
      "correct_index": 1,
      "explanation": "The mitochondria produces ATP, the cell's energy currency.",
      "difficulty": "easy"
    }
  ]
}
```

### Field Reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `mode` | string | ✅ | Unique slug, matches filename |
| `label` | string | ✅ | Display name on the mode card |
| `icon` | string | ✅ | Emoji shown on the mode card |
| `color` | string | ✅ | Hex accent colour for the card and quiz header |
| `questions[].id` | string | ✅ | Unique within the file |
| `questions[].question` | string | ✅ | The question text |
| `questions[].options` | string[] | ✅ | 2–6 answer choices |
| `questions[].correct_index` | number | ✅ | Zero-based index into the options array |
| `questions[].explanation` | string | ❌ | Shown on the results review screen |
| `questions[].difficulty` | enum | ❌ | `easy`, `medium`, `hard` — used for difficulty filter |

### Adding New Content

Add a new `.json` file to `src/questions/` and add one import line to `questionLoader.ts`. No other changes needed.

---

## 4. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | React + Vite | Fast dev server, simple build, no SSR needed |
| Styling | Tailwind CSS | Utility-first, rapid UI iteration |
| Animations | Framer Motion | Answer feedback, screen transitions |
| State | Zustand | Lightweight in-memory state, no persistence needed |
| Question loading | Static `import` statements | Bundled at build time, zero network calls |
| Hosting | Any static host (Vercel, Netlify, GitHub Pages) | No server required |

> No backend. No database. No auth. No API calls of any kind.

---

## 5. Directory Structure

```
trivia-arena/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── questions/                  # ← JSON question bank files
│   │   ├── science.json
│   │   ├── history.json
│   │   ├── geography.json
│   │   └── pop-culture.json
│   │
│   ├── components/
│   │   ├── ModeCard.tsx            # Single topic card on the home screen
│   │   ├── QuestionCard.tsx        # Question text + option buttons
│   │   ├── OptionButton.tsx        # Individual answer choice
│   │   ├── ProgressBar.tsx         # Q n of N indicator
│   │   ├── ScoreSummary.tsx        # Score headline on results screen
│   │   └── ReviewItem.tsx          # Single question row in the review list
│   │
│   ├── pages/
│   │   ├── Home.tsx                # Mode selector
│   │   ├── Config.tsx              # Pre-quiz config (question count, difficulty)
│   │   ├── Quiz.tsx                # Active quiz
│   │   └── Results.tsx             # Score + full review
│   │
│   ├── store/
│   │   └── quizStore.ts            # All quiz state (Zustand, in-memory only)
│   │
│   └── lib/
│       ├── questionLoader.ts       # Imports and validates all JSON files
│       └── quiz.ts                 # Shuffle, filter, and scoring helpers
│
├── index.html
├── vite.config.ts
└── tailwind.config.ts
```

---

## 6. Application State (Zustand)

All state lives in memory. Nothing is persisted — refreshing the page resets everything, which is the intended behaviour.

```typescript
type QuizStatus = 'idle' | 'configuring' | 'active' | 'results';
type Difficulty  = 'easy' | 'medium' | 'hard' | 'all';

interface QuizStore {
  modes: Mode[];                    // All loaded modes
  selectedMode: Mode | null;
  questions: Question[];            // Filtered + shuffled subset for this session
  currentIndex: number;
  answers: (number | null)[];       // Player's selected option index per question
  score: number;
  status: QuizStatus;

  selectMode:     (mode: Mode) => void;
  startQuiz:      (count: number, difficulty: Difficulty) => void;
  answerQuestion: (optionIndex: number) => void;
  nextQuestion:   () => void;
  finishQuiz:     () => void;
  resetQuiz:      () => void;
}
```

---

## 7. Question Loader

```typescript
// src/lib/questionLoader.ts

import science    from '../questions/science.json';
import history    from '../questions/history.json';
import geography  from '../questions/geography.json';
import popCulture from '../questions/pop-culture.json';

const ALL_MODULES = [science, history, geography, popCulture];

export function loadAllModes(): Mode[] {
  return ALL_MODULES.flatMap(mod => {
    if (!validateMode(mod)) {
      console.warn(`Skipping invalid question file: ${mod?.mode ?? 'unknown'}`);
      return [];
    }
    return [mod as Mode];
  });
}
```

`validateMode` checks that required fields (`mode`, `label`, `icon`, `color`, `questions`) are present and that every question has `id`, `question`, `options`, and `correct_index`.

---

## 8. Quiz Flow — State Machine

```
IDLE
  └→ [Page loads, modes are loaded from JSON files]
  └→ [User clicks a mode card]            → CONFIGURING

CONFIGURING
  └→ [User selects question count + difficulty]
  └→ [User clicks "Start Quiz"]           → ACTIVE

ACTIVE
  └→ [Questions presented one at a time]
  └→ [User clicks an answer option]
      ├→ Option highlights correct (green) or wrong (red)
      ├→ Correct answer always revealed
      └→ "Next" button appears
          ├→ [More questions remain]      → ACTIVE (next question)
          └→ [Last question answered]    → RESULTS

RESULTS
  └→ [Score shown + full review displayed]
  └→ [User clicks "Play Again"]           → CONFIGURING (same mode)
  └→ [User clicks "Choose Mode"]          → IDLE
```

### Answer Behaviour

- The player selects one option — it immediately locks
- Correct option turns **green**, wrong selection turns **red**, correct answer revealed simultaneously in green
- All other options dim
- A "Next Question" button appears — the player must actively advance
- The player cannot change their answer or go back to previous questions
- Questions are not skippable

---

## 9. UI Screens

### 9.1 Home — Mode Selector

- Full-width header with app name
- Responsive grid of mode cards (2 columns mobile, 3–4 columns desktop)
- Each card shows: emoji icon, mode label, total question count, accent colour
- Clicking a card opens the pre-quiz config for that mode

### 9.2 Pre-Quiz Config

- Modal or dedicated screen
- Mode name and icon shown at top
- **Question count** — segmented control: 5 / 10 / 20 / All
  - If the mode has fewer questions than selected, uses all available
- **Difficulty filter** — segmented control: All / Easy / Medium / Hard
  - Shows available count for the selected filter (e.g., "23 questions available")
  - If a difficulty has no questions in this mode, that option is disabled
- "Start Quiz" primary button + "Back" link

### 9.3 Active Quiz

- Progress indicator: "Question 4 of 10" + thin progress bar at the top
- Question text — large, centred, prominent
- Answer options listed vertically, full width on mobile, constrained on desktop
- On answer selection:
  - Correct option: green background + checkmark icon
  - Wrong selected option: red background + ✗ icon; correct option simultaneously turns green
  - Unselected options dim
  - "Next Question" button appears below (reads "See Results" on the final question)
- No timer, no skip, no back navigation

### 9.4 Results Screen

Two sections: a **score summary** at the top and a **full review** below.

#### Score Summary

- Large score: "8 / 10"
- Percentage: "80%"
- Contextual message:
  - 90–100% → "Outstanding!"
  - 70–89% → "Great work!"
  - 50–69% → "Good effort!"
  - Below 50% → "Keep practising!"
- Two stat pills: "✓ 8 Correct" (green) and "✗ 2 Incorrect" (red)
- CTAs: "Play Again" (same mode + config) and "Choose Another Mode"

#### Full Review

- Every question is shown in order, split into two groups:
  - **Incorrect answers** — shown first (most useful for practice)
  - **Correct answers** — shown below, collapsed by default
- Each review item shows:
  - Question text
  - The player's selected answer — labelled green if correct, red if wrong
  - The correct answer — always shown in green
  - Explanation text if present in the JSON

---

## 10. Design System

Dark-first, high contrast, focused and competitive without being distracting.

### Colours

```
Background:     #0A0E1A   deep navy
Surface:        #131929   card / panel backgrounds
Border:         #2A3550
Text primary:   #F0F4FF
Text secondary: #7A8BAD
Correct:        #00C9A7   teal green
Wrong:          #FF4D6D   red
Accent:         per-mode hex from JSON color field
```

### Typography

| Role | Font |
|---|---|
| Display / headings | Chakra Petch (Google Fonts) |
| Body / UI | DM Sans (Google Fonts) |

### Animations (Framer Motion)

| Element | Animation |
|---|---|
| Mode cards on load | Staggered fade-up |
| Screen transitions | Fade + slight slide |
| Answer option feedback | Background colour transition (200ms) |
| Results score | Count-up from 0 to final score |
| Review items | Staggered fade-in as list renders |

---

## 11. Build Plan (Cursor / AI-assisted)

| Day | Focus |
|---|---|
| Day 1 | Vite + React scaffold, Tailwind setup, question loader + types, Zustand store, quiz state machine |
| Day 2 | All four screens (Home, Config, Quiz, Results), answer reveal logic, review list |
| Day 3 | Framer Motion animations, responsive layout polish, cross-browser testing |

**Tips for using Cursor:**
- Paste this spec into Cursor context at the start of every session
- Define TypeScript types for `Mode`, `Question`, and `QuizStore` before writing any components
- Build screens in order: Home → Config → Quiz → Results
- The Results review list is the most complex component — tackle it early on Day 2

---

## 12. Out of Scope (v1)

| Feature | Notes |
|---|---|
| Timer / countdown | Restore `timer_seconds` to the JSON schema and add a `useTimer` hook |
| Elo / skill ratings | Can be added with `localStorage`, no backend needed |
| User accounts | Would require a backend |
| Leaderboard | Would require a backend |
| Keyboard navigation | Good accessibility addition for v2 |
| Dark / light mode toggle | Defaults to dark; straightforward addition |
| Progress saved on refresh | Would use `localStorage`; intentionally omitted for simplicity |

---

## 13. Open Questions

- **Can the player go back to a previous question?** Currently no — once Next is clicked the answer is locked. Confirm before building.
- **Should the results review paginate for large sets?** For 20+ questions a long scroll may be unwieldy.
- **Correct section collapsed by default on Results?** Spec says yes — confirm this is the right default.
- **Always shuffle questions?** Assumed on. Should there be an option to preserve JSON order?

---

*This spec is a living document. Update the version number and Last Updated date on any significant change.*
