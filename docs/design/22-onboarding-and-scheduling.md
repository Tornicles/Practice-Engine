# 22 — Onboarding & Scheduling

**Status:** Design draft · **Date:** 2026-10-11
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11)
**Depends on:** Doc 17 (safety rules R1–R8, specializations table, content lifecycle)
**Engines covered:** 1 (Onboarding), 2 (Specialization), 3 (Personalization), 4 (Scheduling)

> Onboarding is a data-collection flow, not a quiz and not a sales funnel. Its output is the initial training profile that every downstream engine consumes. It must be fast, skippable where safe, and never skip safety.

---

## A. Onboarding (Engine 1)

### A.1 Flow: one question per screen, mostly tap-based

Sections in fixed order. Each screen = one question, large tap targets, back button, progress indicator, "save and finish later" on every screen.

| # | Section | Questions (tap-based unless noted) |
|---|---|---|
| 1 | Identity & eligibility | Age band (5 bands, §E); country/region (list); preferred language (list) |
| 2 | Fitness profile | Experience (new / returning / active); activity level (4 taps); primary objectives (multi-tap, max 3); previous training (free text, optional); current exercise tolerance (4 taps); limitations or injuries? (yes → §A.3 follow-ups) |
| 3 | Home environment | Floor space (small/medium/large); indoor/outdoor access; equipment multi-tap: mat, chair, light dumbbells, resistance bands, stairs, pull-up bar, none |
| 4 | Lifestyle | Occupation (list incl. office / warehouse / student / retired / other); training days per week (1–7 stepper); minutes per day (15/20/30/45/60); sleep (poor/ok/good) |
| 5 | Food | "Want nutrition guidance?" (yes/no — detail deferred to Engine 10); common meals (free text, optional); allergies / restrictions (multi-tap + free text) |
| 6 | Trainer ambitions | "Fitness mastery only" / "Mastery + coaching pathway" (Engine 16 opt-in) |

### A.2 Time target and deferral

- Target: **3–6 minutes**, ~18–24 taps total.
- Rule: anything not needed for the first plan is **deferred**, not asked. Deferred items enter a contextual queue surfaced later (e.g. detailed food preferences appear when the user first opens Food; equipment re-check appears if plans stall).
- Skipping is allowed on every non-safety screen. Safety screens (§A.3, §E) cannot be skipped — but they can be paused and resumed.

### A.3 Safety answers trigger follow-ups (never skipped for speed)

A safety-related answer opens a follow-up branch instead of advancing:

| Answer | Follow-ups (max 3 deep) | Result |
|---|---|---|
| "Knee pain" (limitations) | Which side? → When did it start? → Diagnosed by a professional? | Sets `flags[]` + severity per reviewer table (`screen` default; `withhold` if undiagnosed + acute) |
| "Back issue" | Location? → During what movement? → Diagnosed? | Same as above |
| "Pregnant" | Prenatal track offered; stage? → routes to prenatal eligibility (§E) | Only prenatal-approved content eligible (Doc 17, R1) |
| "Dizzy spells" | Frequency? → During exercise? | `balance_risk` flag; balance screening before unsupported work |
| Age band < 18 | Guardian consent screen (§E) | Kids track only until consent recorded |

If follow-ups can't resolve to a safe default within 3 questions, the profile is flagged `needs_review` and a human/coach review task is created — the user still gets a conservative D1 plan in the meantime (bodyweight fundamentals, no flagged areas).

### A.4 Output: initial training profile

```json
{
  "user_id": "u_123",
  "age_band": "25-34",
  "country": "US",
  "language": "en",
  "objectives": ["strength", "mobility"],
  "flags": ["knee:mild:screen"],
  "equipment": ["none", "chair", "mat"],
  "space": "small_indoor",
  "occupation": "office",
  "training_days": 4,
  "minutes_per_day": 30,
  "sleep": "ok",
  "food_opt_in": true,
  "trainer_ambitions": "mastery_only",
  "difficulty_cap": 1,
  "withheld_exercises": [],
  "consents": ["data:granted"],
  "onboarding_completed_at": "2026-10-11T14:00:00Z",
  "profile_version": 1
}
```

Defaults are conservative: `difficulty_cap: 1`, no flags assumed, everything reviewable in Settings. The profile is versioned; every change is an event (brief §8).

---

## B. Specialization (Engine 2)

### B.1 Selection flow (after onboarding)

1. Track cards: 13 specializations shown as cards (focus, typical location, time commitment, difficulty honesty — "starts gentle").
2. **Recommendation, not assignment:** deterministic scoring (objectives × limitations × environment × age band) surfaces 1–3 recommended tracks; the user picks. The recommendation explains itself in one line ("Matches your knee flag and home setup").
3. Confirm screen: 180-day structure, 6 phases, "calendar opens phases, evidence moves difficulty" (brief §3).

### B.2 Change flow

Settings → Change specialization → confirm → new curriculum version + exercise allowlist + assessment standards load. **History is retained:** `progression_state` carries over for overlapping exercises (Doc 18, §B.4); achievements keep their original specialization tag; prior enrollment row is marked `superseded`, never deleted.

### B.3 What loads on selection/change

- Curriculum version (phases, weekly themes, lesson map)
- Exercise allowlist (`specializations[]` contains the track)
- Assessment standards (Engine 9 protocols for the track)
- Track-specific onboarding deltas (e.g. prenatal stage, sport position)

---

## C. Personalization (Engine 3)

### C.1 Initial derivation (deterministic, from onboarding)

| Decision | Rule |
|---|---|
| `difficulty_cap` | 1 default; 2 only if experience ∈ {active} AND no flags AND age band adult |
| Session duration | `minutes_per_day` snapped to 15 / 20 / 30 / 45 |
| Learning pace | 1 lesson/day; standard quiz difficulty; standard review intervals |
| Rest-day placement | Never > 3 consecutive loading days for beginners (see §D.1) |

No AI in initial derivation — it's a rules table, auditable.

### C.2 Ongoing updates

Triggers: weekly review (Doc 18, §B.5), profile change event, phase boundary, readiness patterns (Engine 8). Personalization adjusts variation selection, duration, and learning pace **within** safety outputs — it never overrides R1–R8 (Doc 17).

---

## D. Scheduling (Engine 4)

### D.1 Calendar generation

- Training days placed on the user's chosen days; rest days interspersed (beginners: max 3 consecutive loading days).
- Weekly template per day: workout (from composer) + paired lesson + optional meal-guidance nudge (if `food_opt_in`) — one bundled "today" view, not three separate task lists.
- Assessment windows scheduled at phase checkpoints; weekly review day fixed (e.g. Sunday).
- Timezone stored per user; all times rendered local.

### D.2 Reminders

| Reminder | Timing | Rules |
|---|---|---|
| Workout | 30 min before user's preferred time (configurable) | User-local timezone; **quiet hours respected** (default 21:00–07:00, configurable) |
| Lesson | Bundled with workout reminder | Never a separate ping |
| Weekly review | Morning of review day | — |
| Milestone / phase boundary | When reached | Celebratory, not nagging |

Notification channels: push primary; no email unless opted in. One reminder per event — no escalating nag sequences.

### D.3 Missed activities

- Any item can be skipped or rescheduled with two taps.
- Missed sessions **never generate punitive volume** (Doc 17, R4; Doc 18, §B.4).
- 5 consecutive misses → manageable restart: cap −1 for a week, shorter sessions, re-onboarding-lite check-in ("what changed?").
- Streaks display "paused" for lapses under 7 days, with a win-back nudge — not "broken".

### D.4 Availability change

User updates days/minutes → schedule recalculated → affected future plans regenerated (new `plan_id`s, Doc 18, §A.5) → user sees the new week immediately. Past completed sessions untouched.

---

## E. Eligibility & consent matrix (implements Doc 17, R1)

| Age band | Standard tracks | Kids | Prenatal | Older-adult |
|---|---|---|---|---|
| Under 13 | Blocked | Allowed, **guardian consent required** | Blocked | Blocked |
| 13–17 | Allowed, guardian consent required | Allowed, guardian consent required | Blocked (refer to professional guidance) | Blocked |
| 18–64 | Allowed | N/A | Prenatal track only (stage-gated) | Allowed |
| 65+ | Allowed | N/A | N/A | Older-adult track recommended; standard tracks allowed after balance screening |

Rules:
- Guardian consent is a recorded consent (`consents` table), not a checkbox — identity of the granter + timestamp.
- Prenatal: only prenatal-approved variants eligible; stage is reviewer-parameterized, never hardcoded (Doc 17, R1).
- Older-adult: balance screening (3-question + supported-stance self-test) before unsupported single-leg work.
- Elevated risk tier ⇒ Safety Review mandatory on all content (Doc 17, §A.2).

---

## F. Data model

```ts
// profiles: 1:1 with user; versioned on every change
profiles {
  id uuid PK, user_id FK unique,
  age_band text, country text, language text,
  experience text, activity_level text, objectives text[],
  limitations text[], flags text[],          // e.g. ["knee:mild:screen"]
  equipment text[], space text,
  occupation text, training_days int[], minutes_per_day int,
  sleep text, food_opt_in bool default false,
  trainer_ambitions text default 'mastery_only',
  difficulty_cap int default 1,
  needs_review bool default false,
  profile_version int default 1,
  onboarding_completed_at timestamp nullable,
  updated_at timestamp
}

// consents: guardian, data, media sharing — recorded, expirable
consents {
  id uuid PK, user_id FK,
  kind text,                               // guardian | data_processing | media_share | health_data
  status text default 'granted',           // granted | withdrawn | expired
  granted_by text,                         // user or guardian identifier
  granted_at timestamp, expires_at timestamp nullable,
  metadata jsonb
}

// specialization_enrollments: history retained on change
specialization_enrollments {
  id uuid PK, user_id FK, specialization_id FK,   // → doc 17 specializations
  curriculum_version text,
  status text default 'active',            // active | superseded
  prior_enrollment_id FK nullable,
  enrolled_at timestamp
}

// schedules: weekly template + timezone
schedules {
  id uuid PK, user_id FK,
  week_start date, timezone text,
  template jsonb,                          // {mon: {workout: true, lesson: true}, ...}
  quiet_hours jsonb default {start: "21:00", end: "07:00"},
  updated_at timestamp
}

// notification_prefs: channels + lead time
notification_prefs {
  user_id FK PK,
  push_enabled bool default true, email_enabled bool default false,
  workout_reminder_min int default 30,
  lesson_bundled bool default true
}

// reminder_log: audit trail, one row per sent reminder
reminder_log {
  id uuid PK, user_id FK,
  kind text,                               // workout | lesson | weekly_review | milestone
  scheduled_for timestamp, sent_at timestamp nullable,
  status text                              // sent | skipped_quiet_hours | failed
}
```

Relations: `profiles.user_id` 1:1; `consents` / `specialization_enrollments` / `schedules` N:1 to user; `specialization_enrollments.specialization_id → specializations` (Doc 17); workout sessions come from `scheduled_sessions` (Doc 18) and reference the active enrollment's curriculum version. Consent checks run at read time — a withdrawn guardian consent immediately restricts the account to allowed content.

---

## Decision log

- **Onboarding collects; specialization is chosen after, by the user.** Recommendation is deterministic and explained in one line.
- **Defer > lengthen.** Anything not needed for plan #1 waits for its context.
- **Safety screens can't be skipped, but can be paused.** The 3–6 minute target never overrides a safety follow-up; unresolved cases get a conservative plan + human review task.
- **Defaults are conservative** (D1 cap, no assumed flags). The system earns trust by starting easy.
- **Reminders are bundled and quiet-hours-aware.** One ping per event; no nag sequences.
- **Missed ≠ punished.** Restart logic is supportive by design (brief §7: "should not automatically generate punitive exercise volume").
- **History survives specialization changes.** Supersede, never delete.

## Next

- **19 — Office-Worker Fitness curriculum** (V1): 6 phases, weekly themes, lesson map, assessment checkpoints, trainer-development assignments.
- **20 — Nutrition engines** (10–12): food-capture confirmation UX, observation-period rules, meal-guidance templates.
- **21 — Education, Mastery & Trainer Development** (written in parallel with this doc).
- **23 — Performance assessment protocols** (Engine 9): per-specialization benchmark protocols and scoring rubrics.
- **24 — Content studio admin** (Engines 17–20 tooling).
- **25 — Platform operations** (Engines 21–24).
- **26 — Technical consolidation** (brief §10).
