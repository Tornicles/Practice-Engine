# 28 — Forty Specializations: Catalog & Composition Model

**Status:** Design draft · **Date:** 2026-10-11
**Source brief:** "PRACTICE-ENGINE — Complete Guide to the 40 Fitness Specializations" (2026-10-11)
**Depends on:** Doc 17 (specializations table, safety rules R1–R8), Doc 18 (composer, progression), Doc 19 (V1 curriculum pattern)
**Engines covered:** 2 (Specialization), 3 (Personalization), 17 (Curriculum Production)

> The catalog grows from 13 to 40. The 13 do not disappear — they become the **base movement tracks** (exercise-eligibility layer). The 40 are the user-facing catalog. One user picks a primary, an optional secondary, and personal characteristics; the system composes them into a single coherent 180-day journey.

---

## A. The catalog

8 categories, 40 specializations. Full records (tagline, focus, outcomes, risk tier, base tracks, priority families) live in `content/specializations/catalog.ts` — this doc defines how they behave.

| # | Specialization | Category | Risk tier | Base track(s) |
|---|---|---|---|---|
| 1 | Obesity Fitness | Weight & body transformation | standard | obesity |
| 2 | Weight Loss Fitness | Weight & body transformation | standard | weight_loss |
| 3 | Healthy Weight Gain Fitness | Weight & body transformation | standard | weight_gain |
| 4 | Muscle Building Fitness | Weight & body transformation | standard | weight_gain |
| 5 | Lean Fitness | Weight & body transformation | standard | lean |
| 6 | Body Shaping Fitness | Weight & body transformation | standard | body_shape |
| 7 | Soccer Fitness | Sports performance | standard | soccer |
| 8 | American Football Fitness | Sports performance | standard | american_football |
| 9 | Athletics & Track & Field Fitness | Sports performance | standard | athletics |
| 10 | Basketball Fitness | Sports performance | standard | athletics |
| 11 | Volleyball Fitness | Sports performance | standard | athletics |
| 12 | Tennis Fitness | Sports performance | standard | athletics |
| 13 | Boxing Fitness | Sports performance | standard | athletics |
| 14 | Martial Arts Fitness | Sports performance | standard | athletics |
| 15 | Office Worker Fitness | Lifestyle & occupational | standard | office_worker |
| 16 | Blue-Collar Worker Fitness | Lifestyle & occupational | standard | blue_collar |
| 17 | Stay-at-Home Parent Fitness | Lifestyle & occupational | standard | weight_loss |
| 18 | Traveler Fitness | Lifestyle & occupational | standard | weight_loss |
| 19 | Shift Worker Fitness | Lifestyle & occupational | standard | weight_loss |
| 20 | Kids Fitness | Age & life stages | **elevated** | kids |
| 21 | Teenager Fitness | Age & life stages | **elevated** | lean |
| 22 | Older Adult Fitness | Age & life stages | **elevated** | older_adult |
| 23 | Prenatal Fitness | Age & life stages | **elevated** | prenatal |
| 24 | Postpartum Fitness | Age & life stages | **elevated** | prenatal |
| 25 | Bodyweight & Calisthenics Fitness | Strength & conditioning | standard | lean |
| 26 | Functional Fitness | Strength & conditioning | standard | blue_collar |
| 27 | Strength Training Fitness | Strength & conditioning | standard | weight_gain |
| 28 | Endurance Training Fitness | Strength & conditioning | standard | weight_loss |
| 29 | Speed & Agility Fitness | Strength & conditioning | standard | athletics |
| 30 | Mobility & Flexibility Fitness | Strength & conditioning | standard | office_worker |
| 31 | Disability & Adaptive Fitness | Adaptive & specialized | **elevated** | obesity |
| 32 | Low-Impact Fitness | Adaptive & specialized | standard | obesity |
| 33 | Balance & Fall Prevention Fitness | Adaptive & specialized | **elevated** | older_adult |
| 34 | Return-to-Exercise After Injury | Adaptive & specialized | **elevated** | obesity |
| 35 | Yoga Fitness | Mind–body | standard | office_worker |
| 36 | Pilates Fitness | Mind–body | standard | office_worker |
| 37 | Dance Fitness | Mind–body | standard | weight_loss |
| 38 | Movement & Breathing Fitness | Mind–body | standard | office_worker |
| 39 | Beginner Fitness | Practical goals | standard | obesity |
| 40 | Fitness for Physical Job Tests | Practical goals | standard | blue_collar |

Base-track assignment rule: when a specialization has no exact base track, it inherits the closest track's **exercise eligibility**, and its `priorityFamilies` carry the specificity. Eligibility is permissive; safety rules are restrictive (doc 17 R1/R2 always apply).

---

## B. The composition model (the important architectural decision)

The 40 are **not** mutually exclusive. At enrollment (and any time after), the user sets:

```
primary:        SpecializationSlug          // what they want to master — exactly 1
secondary:      SpecializationSlug | null   // what else they want to improve — 0 or 1
characteristics: {
  ageBand:        "child" | "teen" | "adult" | "older_adult"
  experience:     "beginner" | "some" | "experienced"
  limitations:    Flag[]                    // injuries, conditions, pregnancy stage
  equipment:      EquipmentCode[]
  space:          SpaceRequired
  schedule:       { daysPerWeek, minutesPerSession, shiftWork? }
}
```

### B.1 What each input controls

| Input | Drives | Never drives |
|---|---|---|
| Primary | Curriculum phases, weekly themes, assessment checkpoints, lesson map | — |
| Secondary | Emphasis: 1 focused session/week OR accessory-block swaps within primary sessions | Phase structure, assessments, safety constraints |
| Characteristics | Safety filtering (R1/R2), difficulty caps, session length, scheduling | Curriculum identity |

### B.2 Precedence (conflicts resolve deterministically)

**Safety rules > characteristics > primary > secondary.**

- A flagged limitation removes exercises no matter what the primary wants.
- Characteristics can only *restrict* the primary (lower caps, shorter sessions), never expand it.
- The secondary can only *add emphasis inside* the primary's safety envelope. If the secondary wants something the primary's curriculum or the safety rules forbid, the secondary loses silently and the plan notes the substitution.

### B.3 Worked compositions

**Older adult + beginner + weight loss.** Primary: older-adult-fitness (elevated safeguards, functional focus). Secondary: weight-loss-fitness → adds one low-impact conditioning walk per week; does not add high-intensity intervals (primary forbids). Characteristics: age band older_adult → balance screening before unsupported single-leg work (R1).

**Soccer player + muscle building.** Primary: soccer-fitness (agility, conditioning, hamstring/calf work). Secondary: muscle-building-fitness → accessory strength blocks (squats, presses, rows) inside two sessions/week; sprint/conditioning volume unchanged. No conflict: different movement families.

**Beginner + prenatal.** Primary: prenatal-fitness (elevated; only reviewed variants). Secondary: beginner-fitness → reinforces technique-first cueing and slower progression. Characteristics: pregnancy stage parameter (reviewer-owned) gates specific movements. The secondary never unlocks anything the prenatal track withholds.

**Shift worker + strength training.** Primary: shift-worker-fitness (readiness-based scheduling, Engine 8 drives session timing). Secondary: strength-training-fitness → progressive resistance blocks scheduled on high-readiness days only.

### B.4 What the composer receives

Engine 2 (Specialization) resolves the triple into a single **resolved profile**:

```ts
resolvedProfile = {
  curriculumId,            // from primary
  phaseObjectives,         // from primary
  emphasisBlocks,          // from secondary (0–2/week)
  eligibility,             // characteristics → R1/R2 filter output
  difficultyCap,
  assessmentSchedule,      // from primary
}
```

The composer (doc 18) consumes the resolved profile exactly as before — composition happens **above** the composer, so the safety filter and progression engine need no changes.

---

## C. Curriculum coverage strategy

Full 180-day curricula (doc-19 depth: phases, weekly themes, lesson maps, checkpoints) are expensive. Coverage tiers:

- **Tier 1 — full curriculum:** Office Worker Fitness first (V1 pilot, doc 19). Then, by demand and safety priority: older-adult, obesity, beginner, weight-loss.
- **Tier 2 — blueprint:** phases + objectives + assessment checkpoints + priority-family exercise lists, composed onto the Tier-1 content library. All 40 get at least this before they are selectable.
- **Tier 3 — full media:** demonstration videos per the doc-17 media spec, produced in priority order.

No specialization is selectable in the product until it reaches Tier 2 **and** its risk-tier safeguards are implemented and reviewed. Elevated-tier tracks additionally require their specialist reviewer sign-off (prenatal → prenatal expertise; disability → disability-informed expertise; return-to-exercise → post-clearance protocol).

---

## D. Risk tiers & safeguards

Standard tier: doc 17 R1–R8 as written.

Elevated tier adds:
- **kids:** guardian consent, guardian-visible progress, technique-first progressions, no maximal loading, no body-composition targets, play-based framing.
- **teenager:** guardian consent where required by region; no weight targets, no body-image-driven programming; supervised resistance progressions only.
- **prenatal/postpartum:** qualified prenatal expertise owns the track; stage/symptom parameters gate movements; warning-sign escalation list shown in-product; postpartum progression depends on recovery, symptoms, delivery circumstances, professional guidance.
- **older_adult / balance_fall_prevention:** balance screening, fall-risk flags, recurrent-fall or unexplained-dizziness → professional evaluation before progression.
- **disability_adaptive:** disability-informed expertise; never assumes identical needs per diagnosis; individualized modification paths.
- **return_to_exercise:** post-clearance only — not diagnosis, not rehab; works within established restrictions; fear-of-movement handled via graduated exposure, never pushed.

---

## E. Data model (extends doc 17)

```ts
// specializations: the 40 user-facing tracks (content/specializations/catalog.ts is the seed)
specializations {
  id uuid PK, slug unique, name, category,
  tagline text, training_focus text, outcomes text,
  risk_tier: standard | elevated,
  base_tracks text[],              // 1–2 of the 13
  priority_families text[],
  typical_location text, notes text nullable,
  coverage_tier: blueprint | full_curriculum,
  status: draft | active | retired
}

// user_specialization_selections: the composition triple (§B)
user_specialization_selections {
  id uuid PK, user_id FK,
  primary_slug FK, secondary_slug FK nullable,
  characteristics jsonb,           // age band, experience, limitations, equipment, space, schedule
  resolved_profile jsonb,          // Engine 2 output (§B.4)
  created_at, updated_at
}
```

`curricula` / `curriculum_phases` (doc 17) key off the 40 slugs; `exercises.specializations` (doc 17) continues to key off the 13 base tracks — the composition layer translates.

---

## F. Claim boundaries (from the guide, enforced in copy + AI prompts)

- Body shaping: targeted exercises develop particular muscles; they cannot selectively remove fat from a chosen area. Stated plainly wherever body-shape goals appear.
- Boxing: conditioning and non-contact fundamentals; no sparring required or implied.
- Return-to-exercise: post-clearance fitness pathway, not injury diagnosis, PT, or rehab.
- Blue-collar: complements workplace safety procedures; does not replace them.
- Movement & breathing: no claims about treating respiratory, cardiovascular, or mental-health conditions.
- Job tests: uses the actual standards of the relevant organization; never a generic assumed test.
- Teenager: no unhealthy body-image pressures, no weight targets.

## G. Decision log

- **40 user-facing specializations over 13 base movement tracks.** Keeps the exercise library's eligibility model stable (the 525-exercise seed keys off 13 tracks) while the catalog grows. New specializations map; they don't fork the library.
- **Composition above the composer.** Primary/secondary/characteristics resolve into one profile; the composer, safety filter, and progression engine are unchanged. One integration point, not three.
- **Precedence is fixed and deterministic** (safety > characteristics > primary > secondary) — no AI judgment in conflict resolution.
- **Tiered curriculum coverage.** Selectability requires Tier 2 + safeguards; full curricula roll out by priority. Prevents 40 shallow tracks.
- **Doc 17's 13-track table is superseded by this catalog** for product purposes; the 13 live on as `baseTracks`.

## H. Next

- **Doc 27 — Master exercise library:** dedup methodology, catalog stats, review workflow, how the 525-entry seed becomes selectable records. (In progress — seed conversion running.)
- **Implementation, brief §12:** 60 prompts in 12 batches; batch 1 (repo audit, consolidation plan) takes docs 17–26 + 28 as input.
- Remaining work after that: Tier-1 full curricula beyond Office Worker; Tier-2 blueprints for the other 39; Tier-3 media production.
