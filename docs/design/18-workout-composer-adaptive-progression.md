# 18 — Workout Composer + Adaptive Progression

**Status:** Design draft · **Date:** 2026-10-11
**Amendment (2026-10-11):** Aligned to the Elite Mastery OS spec ("Complete Application Sequence and Elite Mastery Operating System", Parts 3–4). Changes: per-set feedback model added to §C.3; session-completion hard rule added (§C.4); exercise-player UX extracted to new doc 30 (linked below). All other sections unchanged.
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11)
**Depends on:** Doc 17 (content standards, exercise DB, safety rules engine)
**Engines covered:** 6 (Workout Composer), 7 (Adaptive Progression), 8 (Recovery & Readiness — composer interface)

> The composer is a deterministic pipeline with an AI personalization layer on top. Safety filtering (Doc 17, §C) always runs first and AI can never widen the candidate set.

---

## A. Workout Composer (Engine 6)

### A.1 Input contract

| Input | Source | Notes |
|---|---|---|
| `user_id`, `specialization`, `program_day` | Profile / enrollment | Day 1–180; curriculum phase derived from day |
| `difficulty_cap` | Progression state (B) | Max difficulty the composer may select |
| `withheld_exercises[]` | Safety engine | Pain pathway / reviewer withdrawals |
| `user.flags[]` | Profile | Contraindication flags |
| `equipment[]`, `space` | Profile (onboarding + updates) | e.g. `["none","chair","mat"]`, `small_indoor` |
| `time_available_min` | Schedule | 15 / 20 / 30 / 45 typical |
| `readiness` | Engine 8 pre-workout check-in | `proceed` \| `reduce` \| `substitute` \| `rest` \| `refer` |
| `history` | Training log | Last-performed dates, per-exercise progression state, recent RPE |
| `phase_objectives`, `weekly_theme` | Curriculum | What this phase/week is trying to teach |

### A.2 Output contract (session plan)

```json
{
  "plan_id": "pl_9f3a…",
  "user_id": "u_123",
  "program_day": 42,
  "phase": 2,
  "generated_at": "2026-10-11T14:00:00Z",
  "composer_version": "1.0",
  "rules_engine_version": "1.0",
  "content_pins": { "ex.chair-squat": "2.1", "les.squat-mechanics-01": "1.0" },
  "readiness": "proceed",
  "warmup": [
    { "content_id": "ex.marching", "version": "1.2", "duration_s": 120, "media_url": "…" }
  ],
  "main": [
    {
      "content_id": "ex.chair-squat", "version": "2.1",
      "variant": "Standard",
      "sets": 3, "reps": 10, "rest_s": 60,
      "cues": ["Chest tall", "Knees track over toes"],
      "media_url": "…", "coaching_media_url": "…"
    }
  ],
  "cooldown": [ { "content_id": "ex.quad-stretch", "version": "1.0", "duration_s": 60 } ],
  "lesson": { "content_id": "les.squat-mechanics-01", "version": "1.0" },
  "estimated_min": 28,
  "notes": "Balance focus — drills kept low and supported per readiness."
}
```

Every exercise reference pins `content_id + version` (Doc 17, §A.5). The plan is immutable once generated; a new plan is a new `plan_id`.

### A.3 Pipeline stages

1. **Candidate filtering (deterministic).** Doc 17 §C.3 filter: published status, specialization, equipment ⊆ available, space, difficulty ≤ cap, contraindication `withhold` exclusion, withheld list. No AI here.
2. **Readiness adjustment (Engine 8).**
   - `reduce` → volume −30%, difficulty cap −1 for this session, longer rests.
   - `substitute` → swap any exercise touching the flagged area with its `modify`-path variant.
   - `rest` → generate a recovery session (mobility + breathing, no loading) instead of a workout.
   - `refer` → no workout; show professional-referral guidance; log safety event.
3. **Curriculum priority.** Phase objectives → weekly theme → today's focus (e.g. "push emphasis", "balance day"). Orders candidates; doesn't add any.
4. **Variety & scheduling.**
   - Don't repeat the same exercise within 3 days unless it's deliberate practice (technique focus flag).
   - Balance muscle groups across the rolling 7 days (track volume per group; prefer under-trained groups).
   - New exercises enter at difficulty ≤ user's proven level, one new movement per session max.
5. **Load assignment.** Sets/reps/duration from per-exercise progression state (§B) + difficulty templates:
   - D1: 2×8–10 or 60–90s, rest 60–90s · D2: 3×8–12 · D3: 3×10–15 or intervals · D4: 4×10–15 + tempo · D5: 4×12–20 / complex intervals. Templates are reviewer-owned, not AI-invented.
6. **AI personalization (within the filtered set only).** Ordering finesse, cue selection (2–3 per exercise from the approved cue list), coaching tone, lesson pairing, session notes. Output validated against the input/output contracts before delivery.

### A.4 Time budgeting

| Slot | Share | Scaling rule when short on time |
|---|---|---|
| Warm-up | ~15–20% | Compress to 3 min minimum, never skip |
| Main block | ~70% | Trim sets first, then exercises; keep movement variety |
| Cool-down | ~10% | Compress, never skip |

Generation target: 2–10 s server-side; serve the cached plan immediately when inputs are unchanged (same day, same readiness, no profile/content changes).

### A.5 Regeneration triggers

New plan (new `plan_id`, old plan retained for history) on: readiness change, equipment/space/schedule update, pain report, exercise withdrawal, phase boundary, user-requested "give me a different workout" (still within filters).

---

## B. Adaptive Progression (Engine 7)

### B.1 Progression state (per user × exercise)

| Field | Meaning |
|---|---|
| `current_difficulty` | 1–5; the rung the composer uses |
| `consecutive_successes` | Resets on failure / pain / skip |
| `last_rpe` | 1–10 post-workout |
| `last_performed` | Date; drives variety rules |
| `status` | `active` \| `withheld` \| `mastered` |

`mastered` is informational (user can demo it reliably) — it never auto-promotes anything else.

### B.2 Promotion / hold / regress rules (implements Doc 17, R4)

- **Promote** (difficulty +1, via the variant ladder §B.3) when EITHER:
  - the phase assessment for that movement is passed, OR
  - 3 consecutive successful completions at the current difficulty with RPE ≤ target (target = 7 by default, reviewer-set per exercise).
- **Hold** otherwise. Holding is the default; most sessions hold.
- **Regress** (difficulty −1 or easier variant) on: 2 consecutive failed/incomplete sessions, OR any pain flag (which also starts the R3 safety pathway).
- **Never:** promote on calendar time; add punitive volume after missed sessions; promote more than one difficulty step per week per exercise.

### B.3 Variant ladders

Each exercise defines an ordered ladder of variants mapping to difficulties 1–5 (stored on `exercise_variants`, Doc 17 §B.1). The composer selects the rung matching `current_difficulty`; progression moves the user along the ladder, never to an unreviewed movement.

Example shape (reviewer-authored per exercise):
`supported (D1) → reduced-range (D2) → standard (D3) → tempo/loaded (D4) → complex (D5)`

### B.4 Event → response table (brief §8, workout-relevant)

| Event | Automatic response |
|---|---|
| User buys dumbbells | `equipment[]` updated → new variants become eligible next plan |
| User changes work schedule | `time_available_min` recalculated → plan re-budgeted (A.4) |
| User reports pain | Exercise withheld immediately (R3); plan regenerated without it |
| User misses 5 sessions | Manageable restart: difficulty cap −1 for one week, shorter sessions, re-onboarding-lite check-in |
| User improves performance | Promotion *considered* at next B.2 evaluation — not applied mid-week on a single good day |
| User changes specialization | New curriculum loaded; progression history retained (per-exercise state carries over where exercises overlap) |
| Reviewer withdraws an exercise | All future scheduled sessions referencing it regenerated with approved alternatives; current-week users notified |
| AI provider fails | Cached plans + reviewed templates; personalization queued for retry |
| Internet connection fails | Downloaded workouts/lessons usable; evidence syncs later |

### B.5 Weekly review job

Runs every 7 days: reassess training load vs. recovery, adherence, per-exercise progression states; adjust `difficulty_cap`; schedule any due assessments; surface content gaps (e.g. "user ready for D3 but no D3 variant exists" → content task, never AI improvisation).

---

## C. Recovery & Readiness interface (Engine 8 → Composer)

### C.1 Pre-workout check-in (4 taps, < 20 s)

1. Soreness: none / mild / moderate / significant (+ location if moderate+)
2. Sleep last night: poor / ok / good
3. Illness or injury today? yes / no
4. Pain right now? yes / no (+ location)

### C.2 Readiness mapping

| Signals | Readiness | Composer effect |
|---|---|---|
| All clear | `proceed` | Normal plan |
| Moderate soreness or poor sleep | `reduce` | Volume −30%, cap −1, longer rests |
| Pain flagged, or soreness in the session's target area | `substitute` | Swap affected exercises via `modify` paths |
| Illness, significant soreness, or severe pain | `rest` / `refer` | Recovery session or referral guidance; no loading |
| 3rd consecutive `reduce`/`rest` | — | Flag for human/coach review; don't just keep shrinking the plan silently |

### C.3 Per-set + post-workout feedback (feeds §B.2)

Feedback is recorded **per set, in the player** (player UX: doc 30, §A), then summarized post-workout.

Per-set record (`set_feedback`):
- `exercise` (`content_id` + variant), `set_index`, `reps_done` (or duration)
- `difficulty_rating`: `too_easy` | `challenging` | `too_difficult`
  (player labels: "Too easy" / "Challenging but manageable" / "Too difficult")
- `pain_flag` (+ location) — player label: "Pain or concerning symptoms"

Mapping to Engine 7:
- `too_easy` / `challenging` → **successful set** (counts toward the 3-consecutive-successes promotion rule, §B.2); `too_easy` additionally marks the exercise promotion-candidate at the next evaluation.
- `too_difficult` → **incomplete set**; two consecutive incomplete/failed sessions on an exercise trigger regress (§B.2).
- `pain_flag` → R3 safety pathway immediately: exercise stopped + withheld, safety event logged, plan regenerated without it (Doc 17, R3).

Post-workout summary (per session): completion (`completed` | `stopped` | `skipped`), optional overall RPE 1–10, notes. Stored on `scheduled_sessions`.

### C.4 Session-completion hard rule

A session reaches status `completed` **only when per-exercise feedback has been recorded for every exercise** — all sets recorded, or the exercise explicitly skipped or substituted. **Timer expiry alone never marks a session successful.** A session abandoned mid-way without feedback is `stopped`, not failed: it does not count toward regress rules and reschedules without penalty. For offline sessions, completion is evaluated at sync time under the same rules.

---

## D. Data model additions (extends Doc 17)

```ts
// scheduled_sessions: one row per generated plan
scheduled_sessions {
  id uuid PK, user_id FK, plan_id text unique,
  program_day int, phase int,
  status: planned | in_progress | completed | skipped | superseded,
  readiness text, estimated_min int,
  plan_json jsonb,               // the A.2 contract, immutable
  composer_version text, rules_engine_version text,
  generated_at timestamp, completed_at timestamp nullable
}

// session_exercises: pinned, queryable references (for withdrawal regeneration)
session_exercises {
  id uuid PK, session_id FK,
  content_id text, version text, variant text,
  order_index int, sets int, reps int nullable, duration_s int nullable, rest_s int
}

// set_feedback: per-set evidence for progression (player-recorded, doc 30 §A.3)
set_feedback {
  id uuid PK, session_id FK, content_id text, variant text,
  set_index int, reps_done int, duration_s int nullable,
  difficulty_rating text,   // too_easy | challenging | too_difficult
  pain_flag bool default false, pain_location text nullable,
  recorded_at timestamp
}

// progression_state: B.1, one row per user × exercise
progression_state {
  user_id FK, exercise_id FK, current_difficulty int,
  consecutive_successes int default 0, last_rpe int nullable,
  last_performed date nullable, status text default 'active',
  PRIMARY KEY (user_id, exercise_id)
}

// readiness_checkins: C.1 answers
readiness_checkins {
  id uuid PK, user_id FK, session_id FK nullable,
  soreness text, soreness_location text nullable,
  sleep text, illness bool, pain bool, pain_location text nullable,
  readiness text, created_at timestamp
}

// safety_events: R3 / R8 audit trail
safety_events {
  id uuid PK, user_id FK, kind text,   // pain_report | referral_shown | exercise_withheld | content_flagged
  content_id text nullable, detail jsonb, created_at timestamp
}
```

Key queries:
- Withdrawal regeneration: `SELECT DISTINCT session_id FROM session_exercises WHERE content_id = $1 AND version < $2` joined to future `scheduled_sessions`.
- Weekly volume balance: aggregate `set_feedback` by muscle group over 7 days.
- Completion check: exercises in `session_exercises` with no matching `set_feedback` rows and no explicit skip/substitute record → the session cannot complete.

---

## E. Backend API surface (design level)

| Method & path | Purpose | Key fields |
|---|---|---|
| `POST /sessions/plan` | Generate plan | In: `user_id`, `date`, `time_available_min` (optional override). Out: A.2 contract |
| `GET /sessions/today?user_id=` | Cached today plan | Returns current plan or generates if none |
| `POST /sessions/:id/start` | Mark in-progress | — |
| `POST /sessions/:id/sets` | Record per-set feedback | `set_feedback` fields → updates progression_state, safety_events |
| `POST /sessions/:id/complete` | Complete session | Validates per-exercise feedback present (§C.4); 422 lists anything missing |
| `POST /checkins/readiness` | Pre-workout check-in | C.1 fields → readiness level |
| `GET /progression?user_id=` | Progression dashboard data | Per-exercise B.1 rows |
| `POST /assessments/:id/complete` | Record assessment result | May trigger promotions (B.2) |

All write paths run the safety rules engine before persisting; validation failures return structured errors, never a silently adjusted plan.

---

## F. Test scenarios (from brief §15, workout-relevant)

1. Beginner, no equipment, 20 min → completes a full week of varied, completable sessions.
2. User misses 5 sessions → restart plan is shorter and easier, not punitive.
3. Pain reported mid-workout → exercise stopped + withheld, plan regenerated, safety event logged.
4. User adds dumbbells mid-program → new variants appear within one plan cycle; nothing else changes silently.
5. Food photo misidentified → (nutrition doc; no workout impact — confirms engine isolation).
6. AI provider down → cached plan served, personalization absent but session fully usable.
7. Reviewer withdraws an exercise on Wednesday → Thursday+ sessions regenerated; user notified once.
8. Phase boundary reached without passing assessment → next phase curriculum opens, difficulty stays put.
9. Minor on kids track → only kids-track content, consent verified at onboarding.
10. User deletes progress photos → evidence removed; training history (sets/reps) retained per retention policy.
11. Timer expires with no feedback recorded → session stays `in_progress`/`stopped`, never `completed`; the player prompts the user to record or explicitly skip each remaining exercise.

Each scenario gets: setup, expected plan diff, assertions on `progression_state` and `safety_events`.

---

## G. Decision log

- **Filter first, personalize second.** The deterministic filter (§A.3.1) is not an AI prompt — it's code. AI operates on the filtered set.
- **Progression state is per-exercise, not global.** A user can be D4 at bridges and D1 at single-leg balance simultaneously.
- **Readiness is a separate engine's output**, consumed by the composer — not a composer concern. Keeps the pain/recovery logic in one place.
- **Plans are immutable; regeneration creates new plans.** Full audit trail of what the user was actually shown.
- **Promotion is pull-based (evidence), never push-based (calendar).** The 180-day clock opens curriculum phases; only evidence moves difficulty.
- **Completion is evidence-based, not time-based.** Timer expiry alone never completes a session; only recorded per-exercise feedback does. Skipped is not failed; stopped is not failed.

## H. Next design docs

- **30 — Exercise Player & Daily Command Center**: player UX, per-set feedback screens, Today command-center contract (Elite Mastery OS, Parts 3–4).
- **19 — Office-Worker Fitness curriculum** (V1 specialization): 6 phases, weekly themes, lesson map, assessment checkpoints, trainer-development assignments. (Still queued from the previous round.)
- **20 — Nutrition engines** (10–12): food-capture confirmation UX, observation-period rules, meal-guidance templates.
- **21 — Education & portfolio** (13–16): lesson delivery, knowledge assessment, mastery tracking, trainer-development pathway.
