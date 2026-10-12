# 29 — Elite Mastery OS Alignment

**Status:** Design draft · **Date:** 2026-10-11
**Source brief:** "PRACTICE-ENGINE — Complete Application Sequence and Elite Mastery Operating System" (2026-10-11)
**Depends on:** Docs 17–28 (all engine designs, curricula, catalogs)
**Engines covered:** Cross-cutting — aligns all 24 logical engines to the Elite Mastery product spec

> The Elite Mastery OS spec is the product's experience contract: a 14-step user journey, 8 onboarding screens, the 180-day blueprint, the Daily Command Center, the exercise player, the mastery system, and 5-tab navigation. Docs 17–28 already cover most of the machinery. This doc inventories every normative requirement in the spec, maps each to the existing design, and records the authoritative resolutions for the gaps. Other agents implement section C; nothing here is optional.

---

## A. Requirement inventory

Every normative ("must / should / requires") requirement in the Elite OS spec, organized by its 14 parts.

### Part 1 — User journey (14 steps)

| # | Requirement |
|---|---|
| J1 | Discovery: landing communicates the difference (headline "MASTER YOUR BODY", subhead, "Begin Your Mastery"; secondary: Explore Specializations, How It Works, Sign In; real demos, no unrealistic transformation guarantees) |
| J2 | Account creation: email/password + secure providers; essential info only; age/guardian consent before minors enter |
| J3 | Eligibility & fitness profile completion |
| J4 | Choose primary specialization: 8 categories, 40 choices; searchable by outcome ("I want to run faster…") |
| J5 | Set personal goals |
| J6 | Baseline assessment: movement history, exercise tolerance, strength/functional checks, specialization-relevant assessments, optional technique videos, recovery/limitations; no single mandatory physical test for every specialization |
| J7 | Receive 180-day mastery blueprint |
| J8 | Enter Daily Training Command Center |
| J9 | Train + Learn + Document (daily loop) |
| J10 | Complete weekly challenges |
| J11 | Pass monthly mastery assessments |
| J12 | Build trainer competence |
| J13 | Complete Day-180 final assessment |
| J14 | Receive portfolio + next mastery path |

### Onboarding screens (Phase 1, screens 1–8)

| Screen | Requirement |
|---|---|
| S1 | Welcome screen per J1 |
| S2 | Account creation per J2 |
| S3 | Primary specialization: category browse → specialization + requirements; outcome search |
| S4 | Secondary objective (strength, stamina, muscle development, mobility, body composition, agility, confidence with movement); modifies primary without creating conflicting programs |
| S5 | Training environment: equipment, indoor/outdoor space, duration, weekly availability; bodyweight default; no gym required |
| S6 | Readiness & safety: experience, limitations, symptoms; high-risk answers → follow-up questions, restricted program, or professional-evaluation recommendation (never an automatically demanding workout) |
| S7 | Food & lifestyle: normal foods, budget, restrictions, meal-photo opt-in; system learns existing foods |
| S8 | Baseline assessment per J6 |

### Part 2 — Blueprint (10 required items)

B1 primary specialization + personal objectives · B2 six training phases · B3 required physical competencies · B4 knowledge modules · B5 weekly workout + recovery structure · B6 monthly assessments · B7 documentation milestones · B8 optional trainer-development assignments · B9 final portfolio requirements · B10 criteria for continuing to advanced training. Illustrative competency values must be labeled as example interface data, not measured/validated scores. The user must know exactly what they are working toward while daily workload adapts.

### Part 3 — Daily Command Center

| Element | Requirement |
|---|---|
| Header | Day X of 180, specialization · phase, streak, journey % |
| Primary mission | Duration, focus (e.g. "Acceleration & Lower-Body Control"), warm-up → strength → footwork → cooldown → technique reflection |
| Knowledge mission | Lesson with stated length (e.g. 6-minute) |
| Evidence mission | e.g. "Record footwork" |
| Nutrition | Log a familiar meal |
| Recovery | Readiness check-in |
| Nav | 5 destinations: HOME, MASTERIES, JOURNAL, PROGRESS, PROFILE |

User sees immediately: what is required today, what is optional, how long things take, progress made. Mission-control dashboard, not a content feed.

### Part 4 — Exercise player

Sequence: readiness check → warm-up → demonstration → perform → record result → rest → next exercise → cooldown → reflection. Per-exercise screen: exercise X of N, name, level, sets/reps/rest, technique cue, alternative (regression), reps completed, per-set difficulty feedback (too easy / challenging but manageable / too difficult / pain or concerning symptoms), record set feedback. Production needs: offline playback, audio coaching, captions, timers, substitutions, visible stop/discomfort option. **No workout marked successful merely because a timer expired.**

### Part 5 — Mastery system

- **Three independent progress systems:** (1) calendar progression Day 1–180, (2) competency progression (skills via training + assessments), (3) earned mastery status (evidence + defined standards). Never combined into one misleading percentage.
- **Seven ranks:** Entry → Foundation → Beginner → Practitioner → Specialist → Expert Track → Mastery Achievement. Mastery Achievement is an internal program distinction — not universal elite athletic status, not professional licensure.
- **Per-specialization mastery domains** (spec examples: soccer = acceleration, deceleration, lower-body strength, endurance, agility, movement knowledge; muscle building = resistance technique, progressive overload, exercise selection, recovery knowledge, measurable strength; older adult = functional strength, balance, mobility, walking capacity, confidence). A user may be advanced in one domain and foundational in another.
- **Mastery gates:** completed prerequisites + knowledge assessment + physical/functional assessment + demonstration evidence where relevant + sufficient consistency and safe execution.
- **Fail behavior:** targeted improvement plan + reassessment opportunity; no loss of access to safe daily activity.

### Part 6 — Weekly experience

Example week (Mon strength/technique, Tue conditioning/movement, Wed mobility/recovery/education, Thu specialization training, Fri strength/applied, Sat challenge/assessment, Sun recovery/review) — an example, not a universal prescription; adapts to age, ability, health, recovery. Weekly review: planned vs completed, performance/difficulty analysis, learning review, next-week changes; shows what improved / what needs work / what comes next; evidence-based, never invented improvement.

### Part 7 — Six phases

| Days | Name | Focus |
|---|---|---|
| 1–30 | 1. Foundation | Safe movement, baselines, consistency |
| 31–60 | 2. Capacity | Strength, endurance, coordination, knowledge |
| 61–90 | 3. Specialization | Discipline-specific skills, demanding training |
| 91–120 | 4. Performance | Measurable performance, applied understanding |
| 121–150 | 5. Advanced Application | Higher standards per proven capability |
| 151–180 | 6. Final Mastery Review | Assessments, evidence review, portfolio |

Each phase: physical standards, knowledge requirements, practical assignments, final checkpoint.

### Part 8 — Nutrition

6-step sequence: photograph/manual entry → AI proposes foods/ingredients → user confirms/corrects (+portions) → patterns recorded → guidance adapts to specialization + familiar foods → practical suggestions, never a compulsory replacement diet. Regional foods, budgets supported. Photo estimates show uncertainty. Higher-risk users: tighter safeguards, professional involvement.

### Part 9 — Evidence

Types: demo videos, test results, voluntary progress photos, written reflections, quiz/lesson records, consistency records, coaching assignments. Linked to competency + phase. Cross-time comparison (e.g. Day-30 vs Day-90 squat) requires consistent camera/task. AI may highlight differences; uncertain technique judgments labeled as such. Private by default; retention/deletion controls. Never required to publish body or face.

### Part 10 — Trainer development

| Month | Task |
|---|---|
| 1 | Exercise names, purposes, fundamental safety |
| 2 | Explain basic technique and common errors |
| 3 | Exercise variations and progression |
| 4 | Build simple example training sessions |
| 5 | Coaching explanations and case scenarios |
| 6 | Coaching portfolio + knowledge assessment |

Record demo, explain exercise, identify common mistakes, structured feedback. No authorization to coach vulnerable populations or exceed professional scope from the internal pathway alone.

### Part 11 — AI coach (7 situations)

| Situation | AI action |
|---|---|
| How to perform a movement | Retrieve approved demonstration + explain technique |
| Exercise too difficult | Offer an eligible regression |
| Missed workout | Rebuild schedule without punishment workouts |
| Food question | Use confirmed preferences + relevant guidance |
| Skill improvement | Explain competency gap + available practice |
| Evidence submitted | Tentative structured analysis where supported |
| Milestone question | Explain exact assessment requirements |

AI must not override exercise eligibility and safety rules. Integrated into workflow, not a disconnected chatbot.

### Part 12 — Content workflow

Curriculum → exercise/lesson specs → scripts/demos/quizzes → qualified review → versioned library → personalized delivery → feedback → revision. Every exercise: name, demonstration, instructions, muscles, equipment, difficulty, alternatives, progression, restrictions, review status. New content shippable without app release when the format is supported.

### Part 13 — Navigation (5 destinations)

| Destination | Contents |
|---|---|
| Today | Daily mission, workout, lessons, food, recovery |
| Masteries | 40 specializations, active blueprint, competency map, assessments |
| Journal | Workout history, food photos, videos, notes |
| Progress | Physical metrics, milestones, knowledge, portfolio |
| Profile | Goals, equipment, schedule, safety prefs, subscription |

Masteries shows current discipline, competency tree, rank requirements, upcoming assessments, achievements. Don't overwhelm with all 40 daily; the enrolled path is the center of the experience.

### Part 14 — Top-tier list (10)

Competency map · adaptive progression · 180-day structure · evidence-based assessments · reviewed exercise library · practical nutrition · multimodal learning · evidence portfolio · trainer education · continuous content production. Defining experience: the Day-180 portfolio demonstrates what the user can do, understands, how they progressed, which standards they met, what evidence supports it, and what's next.

---

## B. Mapping table

Status: **COVERED** = already in the docs as designed · **DELTA** = needs a doc change (resolved in §C).

| Requirement | Existing doc | Status |
|---|---|---|
| J1 landing content | — (doc 22 starts at onboarding flow) | **DELTA** → doc 22 |
| J2 account creation | doc 22 §A.1.1 (identity), §E (consent) | **DELTA** (screen-level: providers, minimal info) → doc 22 |
| J3 eligibility/profile | doc 22 §A.1.1–2, §E; doc 17 R1 | COVERED |
| J4 choose specialization | doc 22 §B, doc 28 | **DELTA** (category browse + outcome search UI) → doc 22 |
| J5 personal goals | doc 22 §A.1.2 (primary objectives) | COVERED |
| J6 baseline assessment | doc 23 §B (baseline days 1–7); "no single mandatory test" | COVERED |
| J7 blueprint | doc 19 (curriculum) | **DELTA** (10 required items) → doc 19 |
| J8 command center | — | **DELTA** → new doc 30 |
| J9 train/learn/document | docs 18, 21 | COVERED |
| J10 weekly challenges | — | **DELTA** → docs 19/21 |
| J11 monthly assessments | doc 23 §B | COVERED |
| J12 trainer competence | doc 21 §D | **DELTA** (month-by-month table) → doc 21 |
| J13 day-180 assessment | doc 23 §B (final review) | COVERED |
| J14 portfolio + next path | doc 21 §C.3 | COVERED |
| S1 welcome, S2 account | — | **DELTA** → doc 22 |
| S3 primary (browse + outcome search) | doc 22 §B (flow), doc 28 (catalog) | **DELTA** (screen spec) → doc 22 |
| S4 secondary objective | doc 28 §B (secondary = specialization) | **DELTA** (capability-objective form) → doc 28 |
| S5 training environment | doc 22 §A.1.3–4 | COVERED |
| S6 readiness/safety | doc 22 §A.1.2 + §A.3, doc 17 R1 | COVERED |
| S7 food/lifestyle | doc 22 §A.1.5, doc 20 | COVERED |
| S8 baseline | doc 23 §B | COVERED |
| Blueprint B1–B10 | doc 19 (phases, lesson map, checkpoints, portfolio reqs) | **DELTA** (formalize 10-item contract) → doc 19 |
| Illustrative data labeled as example | — | **DELTA** (UI copy rule) → docs 19/30 |
| Command-center layout | — | **DELTA** → new doc 30 |
| 5-tab navigation | doc 26 §B (8 tabs) | **DELTA** (supersede) → doc 26 |
| Player sequence + per-set feedback | — | **DELTA** → new doc 30; doc 18 (feedback feeds progression) |
| No timer-expiry success | — | **DELTA** → doc 30 (+ doc 18 completion rules) |
| Player offline/audio/captions/substitution/stop | doc 26 §H (offline), doc 18 (substitutions) | **DELTA** (player-level spec) → doc 30 |
| 3 independent progress systems | doc 21 §C (4 dimensions, never averaged) | **DELTA** (top-level framing) → doc 21 |
| 7 exact ranks | doc 21 §C.2 (example ladder Foundation→…→Expert-track) | **DELTA** → doc 21 |
| Per-specialization domains | doc 21 §C.1 (cross-cutting dimensions) | **DELTA** → doc 21 |
| 5-component gates | doc 21 §C.2 (evidence-based grants) | **DELTA** (formalize) → doc 21 |
| Fail → improvement plan + reassessment, safe activity retained | doc 23 §E (pass/partial/retry) | **DELTA** (improvement-plan artifact) → docs 21/23 |
| Weekly template + review sequence | doc 18 §B.5 (weekly review job), doc 19 (weekly themes) | **DELTA** (user-facing Mon–Sun template + "improved/needs work/next") → doc 19 |
| Phase names (Elite OS) | doc 19 §B (Foundation/Beginner/Practitioner/Specialist/Expert Track/Mastery Review) | **DELTA** → doc 19 |
| Phase contents (standards, knowledge, assignments, checkpoint) | doc 19 §B–E | COVERED |
| Nutrition 6-step sequence | doc 20 §A.1 | COVERED |
| Uncertainty display; higher-risk safeguards | doc 20 §A.1, §B.4; doc 17 R6 | COVERED |
| Evidence types + linking + comparison rules | doc 21 §C.3 | COVERED |
| AI tentative labeling; private default; no body/face requirement | doc 17 R8; doc 23 §A; doc 21 §C.3; doc 25 | COVERED |
| Trainer month table | doc 21 §D (strands) | **DELTA** → doc 21 |
| No vulnerable-population authorization | doc 17 R7; doc 21 §D.3 | COVERED |
| AI coach 7 situations | doc 26 §D (capabilities) | **DELTA** (situation table) → doc 26 |
| AI never overrides eligibility/safety | doc 17 R8; doc 18 §A.3.6 | COVERED |
| Content workflow | doc 17 §A.2; doc 24 | COVERED |
| Exercise record fields | doc 17 §A.3/§B; exercise seed | COVERED |
| Content without app release | — (implied by versioning) | **DELTA** (state explicitly) → doc 24 |
| Masteries destination contents | doc 21 §C, doc 23 | **DELTA** (destination spec) → doc 30 |
| Top-tier 10 list | across docs 17–28 | COVERED (restated as acceptance criteria in §D) |

---

## C. Deltas & resolutions

Authoritative decisions. Implementing agents: apply exactly these.

### C.1 Navigation — 5 destinations SUPERSEDE doc 26's 8 tabs

Doc 26 §B is replaced:

| Destination | Contents | Key engines |
|---|---|---|
| Today | Daily mission, workout, lessons, food, recovery (the Command Center, doc 30) | 4, 6, 8, 10, 13 |
| Masteries | 40-specialization catalog (pre-enrollment), active blueprint, competency map, rank requirements, upcoming assessments, achievements | 2, 9, 13, 15 |
| Journal | Workout history, food photos, videos, notes, reflections | 10, 15 |
| Progress | Physical metrics (measured-only), milestones, knowledge, portfolio, mastery ranks | 9, 14, 15, 22 |
| Profile | Goals, equipment, schedule, safety prefs, notification prefs, privacy/sharing, subscription, consent, data deletion, onboarding resume | 1, 21, 23, 24 |

Onboarding is a gated full-screen flow (not a tab); after completion it lives under Profile. The player, food capture, and lesson views are full-screen experiences launched from Today, not tabs.

### C.2 Onboarding — the 8 screens (doc 22 amended)

Doc 22 §A.1 is extended with the spec's screens, in order:
1. **Welcome** — headline "MASTER YOUR BODY", subhead, "Begin Your Mastery"; secondary: Explore Specializations, How It Works, Sign In. Real demonstrations; no transformation guarantees.
2. **Account** — email/password + available secure providers; minimal info; age band + guardian consent captured before a minor proceeds (doc 22 §E).
3. **Primary specialization** — 8 category cards → specialization list with requirements; outcome search ("I want to run faster" → ranked specialization matches).
4. **Secondary objective** — capability objectives and/or a second specialization (§C.3).
5. **Training environment** — equipment, space, duration, availability (existing §A.1.3–4; bodyweight default, no gym required).
6. **Readiness & safety** — experience, limitations, symptoms (existing §A.1.2 + §A.3; high-risk → follow-ups/restriction/referral).
7. **Food & lifestyle** — normal foods, budget, restrictions, meal-photo opt-in (existing §A.1.5).
8. **Baseline assessment** — per doc 23 §B; no single mandatory test across specializations.

### C.3 Secondary objective — two forms (doc 28 amended)

Doc 28 §B's `secondary` accepts **either** a second specialization **or** one capability objective from a controlled list: strength, stamina, muscle development, mobility, body composition, agility, confidence with movement. Capability objectives map to emphasis blocks:

| Objective | Emphasis block |
|---|---|
| strength | Progressive resistance blocks (squat/press/row/hinge patterns) |
| stamina | Conditioning intervals, walk/run progression |
| muscle development | Hypertrophy accessory blocks (higher-rep, targeted families) |
| mobility | Dedicated mobility flows + movement-break frequency |
| body composition | Conditioning emphasis + nutrition-guidance priority (no body-image pressure; teens excluded from this objective) |
| agility | Footwork, change-of-direction, reaction drills |
| confidence with movement | Technique-first cueing, supported variants, slower promotion thresholds |

Precedence unchanged (safety > characteristics > primary > secondary). A capability objective never unlocks exercises the primary withholds.

### C.4 Mastery system (doc 21 amended)

- **Top-level framing:** three independent progress systems — calendar (Day 1–180), competency (domain skills via training + assessments), earned mastery status (ranks). Displayed separately; never averaged into one percentage.
- **Ranks (exact):** Entry → Foundation → Beginner → Practitioner → Specialist → Expert Track → Mastery Achievement. Replaces doc 21 §C.2's example ladder. Each rank lists required evidence explicitly, per specialization.
- **Domains:** each specialization defines 3–6 mastery domains (spec's soccer/muscle-building/older-adult examples are the pattern). Doc 21 §C.1's four dimensions become the *evidence axes* that feed domains, not the ranks themselves. A user may hold different ranks in different domains.
- **Gates (5 components):** (1) completed prerequisites, (2) knowledge assessment pass, (3) physical/functional assessment pass, (4) demonstration evidence where the protocol requires it, (5) consistency + safe execution threshold. All five recorded on the achievement.
- **Fail behavior:** generates an improvement plan (targeted exercises, lessons, reassessment date); safe daily activity continues uninterrupted. Doc 23's pass/partial/retry maps: retry → improvement plan.
- Rank ladder data model: `mastery_ranks(specialization_slug, rank, domain, required_evidence[])`; `user_ranks(user_id, specialization_slug, domain, rank, evidence_ids[], granted_at)`.

### C.5 Exercise player — new doc 30

Doc 30 specifies: the 9-step sequence (§A player table), per-exercise screen contract (exercise X of N, name, level, sets/reps/rest, technique cue, regression alternative, reps completed, 4-option per-set feedback, record-set control), completion rule (**a set counts only on recorded feedback; a workout counts only on completed exercises — never on timer expiry**), offline playback, audio coaching, captions, timers, substitution flow, and the always-visible stop/discomfort control (→ doc 17 R3 pain pathway). Per-set feedback feeds doc 18 progression (too easy ×N → promotion consideration; too difficult ×N → regress; pain → R3 immediately).

### C.6 Weekly challenges (docs 19/21)

Journey step J10, previously absent. Definition: one optional challenge per week, tied to the current phase (e.g. "complete 5 sessions", "hold a 60-second plank with good form", "record a teach-back of the squat"). Rules: optional, never punitive, scaled to demonstrated ability, completable within the week's plan; completion writes a portfolio artifact. Challenges never gate ranks.

### C.7 Category names (doc 28)

Use the Elite OS category names: **"Adaptive Fitness"** (not "Adaptive and Specialized Fitness") and **"Practical Fitness Goals"** (not "Practical Fitness"). Others unchanged.

### C.8 Blueprint contract (doc 19)

Doc 19's curriculum gains a formal blueprint object containing exactly the 10 items (B1–B10). Generated at enrollment (step J7), viewable in Masteries. Illustrative numbers (e.g. competency bars) carry a persistent "example data" label until replaced by measured values.

### C.9 AI coach situation table (doc 26)

Doc 26 §D gains the 7-situation table (§A Part 11) as the AI coach's behavioral contract, with the hard constraint: no action may widen the composer's candidate set or override R1–R8.

### C.10 Phase names (doc 19)

Doc 19 §B phases renamed to the Elite OS names: 1 Foundation, 2 Capacity, 3 Specialization, 4 Performance, 5 Advanced Application, 6 Final Mastery Review (day ranges unchanged).

### C.11 Content without app release (doc 24)

State explicitly: versioned content publishes through the content pipeline; the mobile app renders any content whose format version it supports. A new app release is required only for new format versions, never for new exercises/lessons/quizzes.

---

## D. Confirmations — already aligned, no changes

- **Content workflow** (spec Part 12): doc 17 §A.2 lifecycle + doc 24 studio. Covered.
- **Evidence privacy** (Part 9): private by default, per-item share opt-in, retention/deletion — doc 21 §C.3, doc 25. Covered.
- **Failsafes** (offline, AI down, withdrawal): docs 17 §C.5, 18 §B.4. Covered.
- **Claim boundaries** (spot reduction, no medical clearance, internal achievements, non-contact boxing, post-clearance return-to-exercise): docs 17 R7, 28 §F. Covered.
- **Safety rules R1–R8**: unchanged and supreme — the Elite OS spec's readiness/safety language is consistent with them. Covered.
- **No punitive volume** (missed workouts, J10 challenges): docs 18 §B.2/B.4. Covered.
- **Deterministic precedence** safety > characteristics > primary > secondary: doc 28 §B.2. Covered.
- **Top-tier 10** as acceptance criteria: each maps to docs 17–28 (competency map→21/29, adaptive progression→18, 180-day structure→19, evidence-based assessments→23, reviewed library→17+seed, practical nutrition→20, multimodal learning→21, portfolio→21, trainer education→21, continuous content→24).

## Decision log

- **Elite OS is the experience contract; docs 17–28 are the machinery spec.** Where they conflict, this doc's §C resolutions win; implementing agents amend the listed docs accordingly.
- **Amend, don't rewrite.** Deltas land as targeted amendments (new sections or superseded-section replacements), preserving each doc's existing contracts.
- **The 8-tab model is the only fully superseded structure** (doc 26 §B). Everything else is refinement.
- **Doc 28's local copy is authoritative** over the repo (repo lacks doc 28); it is included in the alignment set as written.

## Next

- Implementing agents: doc 30 (player + command center); amendments to docs 18, 19, 21, 22, 23, 24, 26, 28 per §C.
- Then: 100-prompt build roadmap (`100-prompt-build-roadmap.md`, transcribed alongside this doc) drives implementation in 20 phases.
