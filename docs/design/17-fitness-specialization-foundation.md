# 17 — Fitness Specialization Foundation

**Status:** Design draft · **Date:** 2026-10-11
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11)
**Build-order position:** FIRST — content standards → exercise database → safety rules. Everything downstream (curriculum, personalization, daily experience, assessments) depends on this layer.

> Design principle: most of this is ordinary application services with deterministic rules. AI personalizes, explains, and drafts; validated rules control safety and progression. No 24-agent swarm.

---

## A. Content standards (Engines 17, 19, 20)

### A.1 Content types

| Type | Examples | Technical reviewer |
|------|----------|--------------------|
| `exercise` | Chair squat + variants | Exercise specialist |
| `lesson` | "How the squat works: knees, hips, balance" | Exercise specialist / educator |
| `quiz` | Squat technique check, 5 questions | Educator |
| `demo_video` | Technique / modification / coaching / equipment-variation cuts | Exercise specialist + video producer |
| `assessment` | Phase checkpoint protocol + scoring rubric | Exercise specialist |
| `curriculum` | Specialization phase structure, weekly themes | Exercise specialist + product owner |
| `nutrition_note` | "Adding protein to familiar meals" | Registered dietitian / qualified nutrition reviewer |

AI may draft any type. A human owns every item; nothing publishes without human review.

### A.2 Lifecycle

```
Draft → Technical Review → Safety Review → Approved → Published
                                                ↓
                                      Revised / Archived / Withdrawn
```

Transition rules:

| Transition | Who | Requires |
|---|---|---|
| Draft → Technical Review | Author | All required fields complete (A.3); media attached or shot-list approved |
| Technical Review → Safety Review | Technical reviewer | Technique / nutrition / educational accuracy sign-off |
| Safety Review → Approved | Safety reviewer | Safeguards checklist for the content's risk tier |
| Approved → Published | Scheduled publisher | `effective_date` reached; no open safety flags |
| Published → Revised | Content editor | New version created as Draft; **published versions are immutable** — no in-place edits |
| Any → Withdrawn | Safety reviewer or product owner | Safety issue or reviewer withdrawal; triggers plan regeneration (C.5) |
| Published → Archived | Content editor | Superseded by a newer published version |

Safety Review is mandatory for: any exercise carrying contraindication flags; all prenatal, youth, and older-adult content; nutrition guidance touching restricted groups (kids, pregnancy, ED-risk, medically complex).

### A.3 Required fields (every content item)

- `content_id` — stable, human-readable, e.g. `ex.chair-squat`, `les.squat-mechanics-01`. Never reused.
- `type`, `title`
- `specializations[]` — tracks where the content is permitted
- `eligibility` — age bands, ability level, equipment, space, restriction flags
- `version` — `MAJOR.MINOR` (A.5)
- `review_status`, `reviewer`, `reviewed_at`
- `effective_date`
- `dependencies[]` — content_ids this item builds on
- `media_files[]` — video / audio / captions / images with checksums
- `localization` — language + regional adaptations

### A.4 Review SLAs (operational targets, not guarantees)

| Trigger | Target |
|---|---|
| Safety-critical issue | Immediate triage, same business day |
| Reported content error | 1–2 business days |
| Exercise demonstrations | Re-review every 6–12 months or when flagged |
| Curriculum | Re-review every 3–6 months |
| Nutrition information | On guidance change + periodic expert review |
| Translation / accessibility | Before release and after significant updates |

### A.5 Versioning

- **MAJOR** (technique change, safety/eligibility change, assessment rubric change): full re-review (technical + safety); all future scheduled plans referencing the old version are regenerated; users with it in their current week are notified.
- **MINOR** (copy clarification, caption fix, new thumbnail): technical review only; no plan regeneration.
- Workouts pin `content_id + version` at plan-generation time, so a software release or content edit can never silently change an approved plan.

### A.6 Content intelligence (Engine 20)

Automatic flags → review tasks (no auto-publish of fixes):

- Repeated user confusion on an exercise (low completion, repeated "too hard" feedback)
- Demo video abandonment spike
- Quiz with < 60% pass rate after two attempts
- Specialization with insufficient beginner modifications
- Repeated pain reports on an exercise → immediate safety triage
- Stale review date past SLA

---

## B. Exercise database (Engines 5, 17, 18)

Postgres + Drizzle (repo convention). Canonical tables:

### B.1 Tables

**specializations** — one row per track (13 to start)
- `id` uuid PK, `slug` unique (e.g. `office-worker`), `name`, `primary_focus`, `typical_location`
- `risk_tier`: `standard` | `elevated` (elevated = kids, prenatal, older-adult, medically complex → extra safeguards everywhere)
- `status`: draft | active | retired

**exercises** — canonical technique record (target: 150–250 reviewed)
- `id` uuid PK, `slug` unique (e.g. `chair-squat`), `family` (15 families from the brief), `name`, `description`
- `muscle_groups` text[], `movement_pattern` (squat | hinge | push | pull | carry | rotation | gait | balance | …)
- `equipment` text[] (none | mat | chair | light_dumbbells | resistance_band | stairs | …), `space_required` (small_indoor | medium_indoor | outdoor)
- `difficulty` 1–5, `entry_criteria` jsonb (prerequisites, e.g. "can sit-to-stand 10× unassisted")
- `coaching_cues` text[], `common_errors` jsonb (error → correction)
- `review_status`, `current_version`, `specializations` text[] (permitted tracks)
- timestamps, `created_by`

**exercise_variants** — one technique, many access points
- `id`, `exercise_id` FK, `name` (e.g. "Wall push-up"), `difficulty`, `equipment_delta`, `cue_overrides`, `entry_criteria`
- Rule: variants differ in support / range / load, never in fundamental technique.

**exercise_media** — `id`, `exercise_id`, `variant_id` nullable, `kind` (demo | modification | coaching | equipment_variation), `url`, `duration_s`, `captions_url`, `thumbnail_url`, `status`

**exercise_contraindications** — `id`, `exercise_id` FK, `flag` (knee | back | shoulder | wrist | ankle | balance_risk | dizziness | pregnancy_stage | …), `severity` (`withhold` | `modify` | `screen`), `guidance` text, `reviewer`
- Separate table (not jsonb) so the composer can join/filter and every flag is auditable.

**content_items / content_versions / content_reviews** — generic lifecycle store for lessons, quizzes, assessments, curricula, nutrition notes (fields from A.3).

**curricula** — `id`, `specialization_id` FK, `version`, `status`
**curriculum_phases** — `id`, `curriculum_id` FK, `phase_index` 1–6, `day_start`, `day_end`, `objectives` text[], `assessment_id` FK nullable
**assessments** — `id`, `name`, `protocol` (content ref), `scoring_rubric` jsonb, `pass_criteria` jsonb

### B.2 Relationships that must be explicit

- Workout session → scheduled exercises → `exercise_id + pinned version`
- Lesson → curriculum objectives (`objective_ids`)
- Achievement → assessment evidence (`evidence_ids`)
- Plan-regeneration query: "future sessions referencing content_id X below version Y"

### B.3 Indexing (composer query support)

- Composite index on exercises: `(review_status, difficulty)` + GIN on `equipment`, `specializations`, `muscle_groups`
- `exercise_contraindications(exercise_id, flag)`

### B.4 Drizzle sketch (illustrative, not the migration)

```ts
import { pgTable, uuid, text, integer, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const riskTier = pgEnum("risk_tier", ["standard", "elevated"]);
export const reviewStatus = pgEnum("review_status",
  ["draft", "technical_review", "safety_review", "approved", "published", "withdrawn", "archived"]);
export const severity = pgEnum("severity", ["withhold", "modify", "screen"]);

export const specializations = pgTable("specializations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  primaryFocus: text("primary_focus").notNull(),
  typicalLocation: text("typical_location").notNull(),
  riskTier: riskTier("risk_tier").notNull().default("standard"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  family: text("family").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  muscleGroups: text("muscle_groups").array().notNull().default([]),
  movementPattern: text("movement_pattern").notNull(),
  equipment: text("equipment").array().notNull().default([]),
  spaceRequired: text("space_required").notNull().default("small_indoor"),
  difficulty: integer("difficulty").notNull(),
  entryCriteria: jsonb("entry_criteria"),
  coachingCues: text("coaching_cues").array().notNull().default([]),
  commonErrors: jsonb("common_errors"),
  specializations: text("specializations").array().notNull().default([]),
  reviewStatus: reviewStatus("review_status").notNull().default("draft"),
  currentVersion: text("current_version").notNull().default("1.0"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const exerciseVariants = pgTable("exercise_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  exerciseId: uuid("exercise_id").notNull().references(() => exercises.id),
  name: text("name").notNull(),
  difficulty: integer("difficulty").notNull(),
  equipmentDelta: text("equipment_delta").array().notNull().default([]),
  cueOverrides: text("cue_overrides").array().notNull().default([]),
  entryCriteria: jsonb("entry_criteria"),
});

export const exerciseContraindications = pgTable("exercise_contraindications", {
  id: uuid("id").primaryKey().defaultRandom(),
  exerciseId: uuid("exercise_id").notNull().references(() => exercises.id),
  flag: text("flag").notNull(),
  severity: severity("severity").notNull(),
  guidance: text("guidance").notNull(),
  reviewer: text("reviewer").notNull(),
});
```

### B.5 Seed coverage rule

Every specialization ships with: full family coverage at difficulty 1–2 (every user can start), ≥ 3 variants per foundational exercise, and at least one `modify`-path for every `withhold`-flagged exercise where a safe alternative exists. Gaps are content tasks (Engine 20), not AI improvisation.

---

## C. Safety rules engine (Engines 7, 8, 9, 23)

Deterministic, versioned, unit-tested. Runs at every evaluation point; AI never overrides it.

### C.1 Evaluation points

| When | Input | Output |
|---|---|---|
| Onboarding completed | Profile + flags | Eligibility profile, difficulty cap, withheld exercises |
| Plan generation | Eligibility + history + availability | Filtered exercise candidates (C.3) |
| Pre-workout check-in | Soreness, sleep, illness, pain | proceed \| reduce \| substitute \| rest \| refer |
| Post-workout feedback | RPE, pain flag, completion | Progression update or safety pathway |
| Content withdrawn | content_id | Regenerate affected future plans (C.5) |
| Phase boundary (every 30 days) | Assessment results | Open next phase curriculum; schedule assessment — **difficulty never auto-advances on calendar time** |

### C.2 Rule catalog

**R1 — Eligibility gates**
- Kids track: guardian consent required; technique-first progressions; no maximal loading.
- Prenatal: only prenatal-approved variants; stage-specific restrictions owned by the reviewer (parameters, not hardcoded medicine).
- Older-adult: balance screening before unsupported single-leg work.
- Elevated risk tier ⇒ Safety Review mandatory on all content (A.2).

**R2 — Contraindication filter**
- `withhold` severity: exercise excluded for the user entirely.
- `modify` severity: only variants without the flag are eligible.
- `screen`: eligible, but pre-workout check-in asks the targeted question first.

**R3 — Pain pathway**
Pain reported → stop the exercise immediately → withhold it for reviewer-set days → if repeated across sessions or reported as severe → safety event logged, professional-referral guidance shown, plan regenerated without it. Pain reports also auto-flag the content item (A.6).

**R4 — Progression gates (Engine 7)**
Difficulty increases only on evidence: assessment pass, OR 3 consecutive successful completions at the current difficulty with RPE at/below target. Elapsed days are never evidence. Missed sessions never generate punitive volume — the plan offers a manageable restart.

**R5 — Readiness adjustment (Engine 8)**
Pre-workout check-in (perceived exertion, soreness, sleep, illness) maps to: proceed / reduce intensity / substitute activity / schedule recovery / advise professional assessment. Unusual performance deterioration triggers review, not harder work.

**R6 — Nutrition boundaries (Engines 10–11)**
No calorie or macro targets inferred from photos alone. Kids, pregnancy, ED-risk, and medically complex users get templated, reviewer-approved guidance only. The first 7–14 days may be observation, but basic guidance is given immediately when requested.

**R7 — Claim boundaries (product copy + AI system prompt)**
- Targeted exercises develop particular muscles; they cannot selectively remove fat from a chosen area. The product says this plainly.
- No automated medical clearance, ever.
- Internal achievements are labeled "Practice-Engine achievement" — never presented as professional credentials.

**R8 — AI boundaries**
AI receives approved content IDs + structured user data and returns validated structured outputs. It cannot publish content, override safety flags, grant achievements, or invent exercises. Every AI output that touches a plan is validated against R1–R7 before it reaches the user.

### C.3 Workout Composer filter (deterministic core)

```
candidates = exercises
  .where(review_status = 'published')
  .where(specializations ∋ user.specialization)
  .where(equipment ⊆ user.equipment)
  .where(space_required ≤ user.space)
  .where(difficulty ≤ user.difficulty_cap)
  .where(NOT EXISTS contraindication
           WHERE exercise_id = exercises.id
             AND flag ∈ user.flags
             AND severity = 'withhold')
  .where(id ∉ user.withheld_exercises)
  .order_by(curriculum_priority, variety_score, progression_state)
```

AI personalization operates *within* this filtered set: ordering, rep/set schemes, coaching tone, lesson pairing. It cannot widen the set.

### C.4 Worked example (from the brief)

Soccer Fitness user, no equipment, small indoor space, poor balance:
- Filter (R2 + entry criteria) excludes outdoor sprinting and advanced jumping (space + prerequisites).
- Composer selects approved balance + footwork drills at difficulty ≤ cap.
- Post-session results feed Engine 7; learning and documentation update independently.

### C.5 Failsafes

- AI provider down → serve cached plans + reviewed templates; queue personalization for retry.
- Offline → downloaded workouts/lessons remain usable; evidence syncs later.
- Exercise withdrawn → regenerate all future scheduled sessions referencing it, using approved alternatives; notify users who have it in their current week.

---

## D. Decision log

- **One AI orchestration layer, not 24 agents** — cost, debuggability, coordination. (Brief §11.)
- **Contraindications as a table, not jsonb** — joinable by the composer, individually auditable and reviewable.
- **Published content immutable; revisions are new versions** — a software release or copy edit can never silently change an approved plan.
- **Postgres + Drizzle** — repo convention (`artifacts/` API already uses Drizzle).
- **Seed coverage rule (B.5)** — forces the content factory to close beginner gaps instead of letting AI improvise.

## E. Next design docs

- **18 — Office-Worker Fitness curriculum** (V1 specialization): 6 phases, weekly themes, lesson map, assessment checkpoints, trainer-development assignments.
- **19 — Workout Composer + Adaptive Progression**: detailed inputs/outputs, variety and scheduling algorithms, R4/R5 implementation.
- **20 — Nutrition engines**: food-capture confirmation UX, observation-period rules, meal-guidance templates.
