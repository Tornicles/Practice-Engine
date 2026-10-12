# 31 — Practice-Engine System Map

**Status:** Design draft · **Date:** 2026-10-11
**Depends on:** Docs 17–30 (the complete design series)
**Engines covered:** All 24 — this doc is the integration layer.

> Everything the product needs, as one system. This map inventories every input,
> records every supersession, traces every build phase to its design authority,
> and states what is still missing before launch.

---

## A. What this system is

Practice-Engine is an AI-powered physical mastery platform: a 180-day,
specialization-driven training academy with a personal coach, a structured
curriculum, measurable standards, and a clear destination. The user chooses what
to master, trains with what they have, eats the foods they already eat,
documents their development, and learns to guide others. 80% personal fitness
mastery, 20% optional trainer development. High standards, progressive
difficulty, measurable competence — no shortcuts to earned mastery.

## B. Document inventory — every input, where it lives

| # | Input given | Lives in the system as |
|---|---|---|
| 1 | Complete Product & Operating Architecture (24 engines, 13 specializations, 60 prompts) | Docs 17–26 (engine designs). 13 specializations superseded → 40 (see §C) |
| 2 | Master Exercise Library (525 entries, 20 families) | `content/exercise-library/` — 508 deduplicated typed records (draft) + doc 27 |
| 3 | 40 Fitness Specializations guide (8 categories) | `content/specializations/catalog.ts` — 40 typed records + doc 28 |
| 4 | Elite Mastery OS — Complete Application Sequence (14-step journey, 8 screens, mastery system, player, command center) | Doc 29 (requirement-by-requirement alignment) + amendments to docs 18/19/21/22/23/26/28 + new doc 30 |
| 5 | Build Prompt Roadmap (100 prompts, 20 phases) | `docs/100-prompt-build-roadmap.md` + traceability matrix (§E) |

Design series: `docs/design/17` foundation → `18` composer/progression → `19` V1 curriculum →
`20` nutrition → `21` education/mastery → `22` onboarding/scheduling → `23` assessments →
`24` content studio → `25` platform ops → `26` tech architecture → `27` exercise library →
`28` forty specializations → `29` Elite OS alignment → `30` player/command center → `31` this map.

## C. Supersession log (alignment decisions)

| # | Before | After | Authority |
|---|---|---|---|
| 1 | 13 specializations | 40 user-facing specializations; the 13 live on as base movement tracks for exercise eligibility | Doc 28 |
| 2 | 60 implementation prompts (12 batches) | 100 prompts (20 phases) | Build roadmap; doc 31 §E traces phases → docs |
| 3 | 8 mobile tabs | 5 destinations: Today, Masteries, Journal, Progress, Profile | Doc 29 C.1; doc 26 amended |
| 4 | Generic onboarding flow | Exact 8 screens (Welcome → Baseline assessment) | Doc 29 C.2; doc 22 amended |
| 5 | Secondary = second specialization | Secondary = specialization OR capability objective (strength, stamina, muscle development, mobility, body composition, agility, confidence) | Doc 29 C.3; doc 28 amended |
| 6 | Generic mastery levels | 7 exact ranks; 3 independent progress systems (never one %); per-specialization domains; 5-component gates | Doc 29 C.4; docs 21/23 amended |
| 7 | Category names "Adaptive and Specialized" / "Practical Fitness" | "Adaptive Fitness" / "Practical Fitness Goals" | Doc 29 C.7; doc 28 amended |
| 8 | No player spec | Doc 30: guided player sequence, per-set feedback, no timer-expiry success | Doc 29 C.5 |
| 9 | No weekly challenges | Optional phase-tied weekly challenges; feed portfolio; never punitive | Doc 29 C.6; docs 19/21 |

## D. The unified model (one flow)

```
14-step user journey (doc 29 §A: J1–J14)
  → 8 onboarding screens → eligibility profile + baseline (doc 22)
  → composition: primary + secondary + characteristics → resolved profile (doc 28 §B)
      precedence: safety > characteristics > primary > secondary
  → 180-day blueprint (10 required items, doc 19 §J)
  → daily loop: Command Center → player → feedback (docs 30, 18)
      composer filters (doc 17 R1–R8) → AI personalizes within the set
      per-set feedback → progression_state (Engine 7) + safety_events (Engine 8)
  → weekly review → monthly checkpoints → mastery gates (docs 21, 23)
      3 progress systems stay independent; 7 ranks earned on evidence
  → day-180 portfolio + next path (docs 21, 23)
  → content factory keeps it all reviewed and current (docs 17 §A, 24)
  → built by the 100-prompt roadmap (§E) against this design series
```

Data foundations: `content/exercise-library` (508 draft records) + `content/specializations`
(40 draft records) → reviewed through the doc-17 lifecycle → published → selectable.

## E. Traceability — 20 build phases → design authority

| Phase | Prompts | Design authority |
|---|---|---|
| 1 Repository & architecture | 1–5 | Docs 26, 31 |
| 2 Identity, auth, onboarding | 6–10 | Doc 22 |
| 3 Forty specializations | 11–15 | Doc 28, `content/specializations` |
| 4 Exercise library | 16–20 | Docs 17 §B, 27, `content/exercise-library` |
| 5 Exercise content production | 21–25 | Docs 17 §A, 24 |
| 6 Workout engine | 26–30 | Docs 18, 30 |
| 7 Recovery & safety | 31–35 | Docs 17 §C, 18 §C |
| 8 Six-month mastery system | 36–40 | Docs 19, 21, 28 |
| 9 Performance assessment | 41–45 | Doc 23 |
| 10 Nutrition & food intelligence | 46–50 | Doc 20 |
| 11 Education & learning | 51–55 | Doc 21 |
| 12 Trainer development | 56–60 | Doc 21 |
| 13 Documentation & evidence | 61–65 | Docs 21, 23 |
| 14 AI coaching | 66–70 | Docs 18 §A.3.6, 26 |
| 15 Daily command center | 71–75 | Doc 30 |
| 16 Content creation studio | 76–80 | Doc 24 |
| 17 Analytics & reports | 81–85 | Doc 25 |
| 18 Payments & platform admin | 86–90 | Doc 25 |
| 19 Testing & hardening | 91–95 | Docs 17–30 (acceptance criteria live in each doc's test scenarios) |
| 20 Deployment & launch | 96–100 | Doc 26 §J, roadmap "definition of fully built" |

## F. What the prompts will not produce (still needed for launch)

From the roadmap, restated as system requirements: actual exercise demonstration
footage for every published record; fully reviewed six-month curricula per
Tier-1 track; validated performance benchmarks; nutrition content review;
qualified safety reviews (especially elevated-tier tracks); real-user pilot
testing; ongoing content maintenance. Release standard: all 40 tracks have
approved content, every core workflow runs end to end, achievements have
verifiable criteria, AI operates within safeguards, production is tested and
monitored. Prompt 100 is not the release gate — this checklist is.

## G. Canonical glossary (use these exact terms)

- **Mastery ranks:** Entry, Foundation, Beginner, Practitioner, Specialist, Expert Track, Mastery Achievement (internal distinction only).
- **Progress systems:** calendar (Day 1–180), competency, earned mastery status — never merged.
- **Composition precedence:** safety > characteristics > primary > secondary.
- **Content lifecycle:** Draft → Technical Review → Safety Review → Approved → Published; published versions immutable; revisions are new versions.
- **Progression law:** calendar opens phases; only evidence moves difficulty.
- **AI boundary:** AI personalizes within the safety-filtered set; never widens it, never overrides rules, never publishes.
- **No-spot-reduction, no medical clearance, no false credentials** (doc 17 R7).

## H. Next

- Reviewer queues: exercise library families 1–10, then Tier-1 curricula.
- Implementation begins at roadmap Phase 1, prompt 1 (repo audit) — docs 17–31 are its input.
- This map is a living index: update the inventory (§B) and supersession log (§C) whenever a new input lands.
