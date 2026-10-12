# 30 — Exercise Player & Daily Command Center

**Status:** Design draft · **Date:** 2026-10-11
**Source brief:** "Practice-Engine — Complete Application Sequence and Elite Mastery Operating System" (2026-10-11), Parts 3–4
**Depends on:** Doc 18 (composer output contract, per-set feedback model, readiness interface); Doc 17 (safety rules R3, content pins); Doc 19 (portfolio/evidence requirements)
**Engines covered:** Workout execution player (Engine 6 delivery surface), Daily experience assembly (Engines 4, 8, 10, 13)

> The player is where the plan meets the person. It enforces the spec's hard rules: guided sequence, per-set feedback, and **no session is ever marked successful merely because a timer expired**. The Command Center is mission control, not a content feed.

---

## A. Exercise player (spec Part 4)

### A.1 Guided sequence (state machine)

```
readiness → warmup → ┌─ demo → perform → record ─┐ → cooldown → reflection → done
                     │        ↻ per exercise       │              (per set)
                     └────────── rest ────────────┘
```

- **readiness:** Engine 8 pre-workout check-in (Doc 18, §C.1). Must resolve to `proceed`/`reduce`/`substitute` before warm-up unlocks; `rest`/`refer` routes out of the player entirely.
- **warmup / cooldown:** from the plan; compressible per Doc 18 §A.4, never skippable.
- **Per exercise:** demo (autoplay, captioned) → perform (timer/counter running) → record (per-set feedback, §A.3) → rest (auto-start countdown) → next exercise.
- **Exits available in every state:** substitute exercise, skip exercise, **stop workout**, **report pain/discomfort** (fixed footer, always visible).
- **Pain exit:** stops the current exercise immediately, triggers Doc 17 R3 (withhold + safety event + plan regeneration). The session may continue with remaining exercises or stop — the user's call, never coerced. A stopped session is `stopped`, not failed.

### A.2 Exercise screen contract

Every exercise screen carries exactly these elements (spec Part 4):

| Element | Example | Source |
|---|---|---|
| Position | "EXERCISE 3 OF 7" | Plan order |
| Name | "Bodyweight Squat" | Exercise record |
| Level tag | "Foundation" | Difficulty rung label (reviewer-owned; D1–D2 "Foundation") |
| Prescription | 3 Sets · 10 Reps · 60s Rest | Plan (Doc 18, §A.2) |
| Technique | One coaching line: "Keep your feet stable, lower under control, and use a comfortable depth." | Approved cues (2–3 max on screen) |
| Alternative | "Alternative: Supported chair squat." — one-tap swap | Easier variant on the ladder |
| Media | Demo video (autoplay, captioned) + audio-coaching toggle | Pinned `content_id + version` |
| Per-set input | Reps completed stepper; "How difficult was this set?" | §A.3 |
| Record | "Record Set Feedback" button | Commits the set |

### A.3 Per-set feedback record

```ts
// set_feedback: the atomic unit of training evidence
set_feedback {
  id uuid PK, session_id FK,
  content_id text, variant text,
  set_index int,
  reps_done int, duration_s int nullable,
  difficulty_rating: too_easy | challenging | too_difficult,
    // player labels: "Too easy" / "Challenging but manageable" / "Too difficult"
  pain_flag bool default false, pain_location text nullable,
    // player label: "Pain or concerning symptoms"
  recorded_at timestamp
}
```

Mapping to Engine 7 (Doc 18, §B.2):
- `too_easy` / `challenging` → **successful set** (counts toward the 3-consecutive-successes promotion rule); `too_easy` additionally marks the exercise promotion-candidate at the next evaluation.
- `too_difficult` → **incomplete set**; two consecutive incomplete/failed sessions on an exercise trigger regress.
- `pain_flag` → R3 pathway immediately (Doc 17): exercise stopped + withheld, `safety_events` row, plan regenerated without it.

### A.4 Hard rules

1. **Completion requires evidence.** A session reaches `completed` only when per-exercise feedback is recorded for **every** exercise (all sets recorded, or the exercise explicitly skipped/substituted). **Timer expiry alone never marks a session successful.**
2. **Skipped ≠ failed.** Explicitly skipped exercises don't count toward regress rules; they reschedule without penalty.
3. **Stopped ≠ failed.** Abandoning mid-session records `stopped`; progression state is untouched except for sets actually recorded.
4. **Pain always wins.** A pain report overrides everything: exercise stops, R3 runs, no completion credit is needed or given for that exercise.
5. **Offline parity.** The full player works offline from the downloaded media pack; feedback syncs later; completion is evaluated at sync time under the same rules.

### A.5 Production requirements

- **Offline playback:** demo media packs download at plan generation (or on Wi-Fi); the player never hard-depends on network mid-session.
- **Audio coaching:** cues, count-ins, and rest announcements via TTS; mute toggle; never replaces captions.
- **Captions:** on all demonstration video, always available.
- **Timers:** rest countdown auto-starts after each recorded set; hold durations counted; timers are conveniences — they never complete anything (§A.4.1).
- **Substitutions:** one-tap swap to the easier variant (or any eligible variant); the swap is logged with the new `content_id + variant`; progression state is not penalized.
- **Stop / report discomfort:** fixed footer button, visible in every state, one tap.

### A.6 Player API (design level, extends Doc 18 §E)

| Method & path | Purpose |
|---|---|
| `POST /sessions/:id/begin` | Open run state; returns the guided sequence for the plan |
| `POST /sessions/:id/sets` | Record one `set_feedback` row |
| `POST /sessions/:id/substitute` | Swap exercise variant mid-session (logs old → new refs) |
| `POST /sessions/:id/skip-exercise` | Mark an exercise explicitly skipped |
| `POST /sessions/:id/complete` | Validate per-exercise feedback for all exercises; 422 lists anything missing |
| `POST /sessions/:id/stop` | Mark `stopped` (not failed); no penalty |

---

## B. Daily Command Center (spec Part 3)

### B.1 Today screen contract

Header (spec Part 3):
- `Day X of 180` · `{Specialization} · Phase N` (e.g. "Day 42 of 180", "Soccer Performance · Phase 2")
- Streak: active-day streak with accessible freeze rules (never a punishment mechanic)
- `Program journey %` = **calendar progress** (`day / 180`) — labeled as schedule progress. Per spec Part 5, the three progress systems (calendar, competency, earned mastery) are never merged into one percentage; competency and mastery live under Masteries/Progress.

Mission cards — each shows title, estimated minutes, required/optional badge, status (not started / in progress / done), and deep link:

| Card | Example | Required? |
|---|---|---|
| **Primary mission** | "Acceleration & Lower-Body Control" — 35 min; "Warm-up, strength, footwork, cooldown, and technique reflection." CTA: "Open workout player" | Yes |
| **Knowledge mission** | Lesson title — 6 min; CTA opens the lesson | Per curriculum (usually yes) |
| **Evidence mission** | "Record footwork" — CTA opens camera | Optional except assessment weeks |
| **Nutrition mission** | "Log a familiar meal" — CTA opens food capture | Optional |
| **Recovery mission** | Readiness check-in — CTA opens check-in; shows state once done | Yes (gates the workout) |

The user sees immediately: what is required today, what is optional, how long each takes, and what's done.

### B.2 Data sources

| Mission | Source |
|---|---|
| Primary mission | Composer plan (Doc 18, §A.2): title, minutes, block summary |
| Knowledge mission | Plan's paired lesson (Engine 13; `plan.lesson`) |
| Evidence mission | Portfolio requirements (Doc 19, §I) + assessment schedule (Engine 9) |
| Nutrition mission | Engine 10 last-log state (logged today? → done) |
| Recovery mission | Engine 8 check-in state for today |
| Header stats | Enrollment (program day), session history (streak), schedule |

### B.3 Five-tab shell (spec Part 13)

| Tab | Contains |
|---|---|
| **Today** | This command center |
| **Masteries** | 40-specialization browser, active blueprint, competency map, rank requirements, upcoming assessments, achievements |
| **Journal** | Workout history, food photos, videos, notes |
| **Progress** | Physical metrics, milestones, knowledge progress, portfolio |
| **Profile** | Goals, equipment, schedule, safety preferences, subscription |

Once enrolled, the current mastery path is the center of the experience — the app does not surface all 40 specializations daily. (This 5-tab shell is the Elite Mastery OS navigation; it supersedes earlier tab sketches.)

### B.4 Assembly rules

1. **Required vs optional is explicit** on every card — never implied.
2. **Incomplete missions roll into the weekly review** (Doc 18, §B.5), never into punitive volume.
3. **Journey % stays calendar-only.** Competency progress and earned mastery are separate systems with separate screens (spec Part 5).
4. **Recovery gates the workout:** the primary mission CTA stays locked until the readiness check-in resolves (or is explicitly deferred by the user, logged as such).

---

## Decision log

- **Player owns feedback; composer owns planning.** The composer generates the plan (Doc 18); the player executes it and produces `set_feedback`. Clean handoff at `POST /sessions/:id/begin`.
- **Four-option difficulty vocabulary is fixed** (`too_easy / challenging / too_difficult` + pain). It maps 1:1 onto Engine 7's success/incomplete/pain semantics — no separate RPE translation layer needed in the player.
- **Completion is evidence-based, not time-based.** The timer-expiry hard rule (§A.4.1) is the single most important trust property of the player.
- **Command Center assembles; it doesn't compute.** Every card renders state owned by another engine. No duplicated logic.

## Next

- Implementation (build roadmap phases): player media pipeline (offline packs, captions, TTS), command-center assembly service.
- Doc 29 (alignment): records this doc's relationship to the Elite Mastery OS spec.
