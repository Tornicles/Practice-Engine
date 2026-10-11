# 19 — Office-Worker Fitness Curriculum

**Status:** Design draft · **Date:** 2026-10-11
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11), §2, §3, §17
**Depends on:** Doc 17 (content standards, exercise DB, safety rules), Doc 18 (composer, progression, readiness)
**Engines covered:** 17 (Curriculum Production — this doc is the V1 output), 9 (Performance Assessment — checkpoints), 12 (Lifestyle Adaptation — movement breaks), 13–16 (Education — lesson map + trainer pathway)

> V1 specialization. Calendar opens phases; difficulty stays evidence-gated (Doc 18, §B.2). A user can reach Day 180 on accessible variations — the clock never promotes.

---

## A. Specialization profile

| Field | Value |
|---|---|
| `slug` | `office-worker` |
| `risk_tier` | `standard` |
| `typical_location` | office, home |
| `primary_focus` | Mobility, strength, movement breaks, posture tolerance |
| `status` | draft (V1 pilot track) |

Rationale for V1: home-first, limited-equipment concept; accessible initial curriculum; large addressable population; no elevated-risk safeguards required beyond the standard rules (Doc 17, R1–R8 still apply in full).

---

## B. The 6 phases

### Phase 1 — Foundation (Days 1–30)

**Objectives:** movement literacy of the foundational patterns; documented baseline; the movement-break habit established; zero intimidation.

| Week | Theme | Physical emphasis |
|---|---|---|
| 1 | Baseline & body awareness | Assessment battery A1; learn bracing, marching, chin tucks |
| 2 | Foundations: sit-to-stand & hinge | Chair squat, glute bridge, hip-flexor stretch |
| 3 | Desk reset: neck, shoulders, thoracic | Wall slides, thoracic rotation, band-free shoulder mobility |
| 4 | The break habit + baseline retest | Break adherence ≥ 4/day; retest A1 movements |

### Phase 2 — Beginner (Days 31–60)

**Objectives:** structured skill development; consistency (≥ 4 sessions/week); first evidence-based progressions.

| Week | Theme | Physical emphasis |
|---|---|---|
| 5 | Consistent practice | Repeat Phase-1 winners; introduce dead bug |
| 6 | Hip hinge & glute wake-up | Hip hinge pattern, lateral steps, calf raises |
| 7 | Push & pull basics | Wall push-up ladder; band row introduced if band owned |
| 8 | Checkpoint A2 | Assessment week; light practice otherwise |

### Phase 3 — Practitioner (Days 61–90)

**Objectives:** movement combinations; work capacity; knowledge (user can name what each exercise trains and why).

| Week | Theme | Physical emphasis |
|---|---|---|
| 9 | Combinations | Squat-to-reach, march-to-step-up sequences |
| 10 | Work capacity | Longer main blocks (up to 30 min); interval marching |
| 11 | Single-leg introduction | Supported single-leg stance, step-up |
| 12 | Checkpoint A3 | Assessment week |

### Phase 4 — Specialist (Days 91–120)

**Objectives:** more demanding practice; applied skill — the user can coach the basics.

| Week | Theme | Physical emphasis |
|---|---|---|
| 13 | Loaded patterns | Band/DB variants where equipment owned; goblet squat |
| 14 | Posture endurance | Longer holds, carries, plank progressions |
| 15 | Applied: carry & lift mechanics | Farmer carry, hip-hinge lift practice with household load |
| 16 | Checkpoint A4 | Assessment week |

### Phase 5 — Expert Track (Days 121–150)

**Objectives:** advanced challenges *appropriate to demonstrated ability*; demonstration-quality technique.

| Week | Theme | Physical emphasis |
|---|---|---|
| 17 | Advanced challenges | Reviewer-set challenge battery, only unlocked movements |
| 18 | Complexes | Multi-movement complexes at demonstrated difficulty |
| 19 | Demonstration prep | Technique refinement for portfolio filming |
| 20 | Checkpoint A5 | Assessment week |

Entry rule: Expert Track content is gated by assessment evidence, not by reaching Day 121. A user at Day 121 without A4-level evidence trains Phase-4-level content under Phase-5 themes.

### Phase 6 — Mastery Review (Days 151–180)

**Objectives:** final assessment; portfolio; achievements; next-path recommendation.

| Week | Theme | Physical emphasis |
|---|---|---|
| 21 | Portfolio assembly | Re-film best demonstrations; gather journal |
| 22 | Final assessment prep | Targeted practice on A6 battery |
| 23 | Final assessment | A6 testing week |
| 24 | Next path | Recommendation: repeat track at higher evidence level, adjacent specialization, or maintenance mode |

---

## C. Lesson map

One lesson per week minimum, each tied to that week's physical activities (brief §13 pattern). `content_id` prefix `les.ow-`.

| Phase | Lesson | Tied to |
|---|---|---|
| 1 | `les.ow-sitting-mechanics-01` — what sitting does to hips, glutes, thoracic spine | Hip-flexor stretch, glute bridge, thoracic rotation |
| 1 | `les.ow-bracing-01` — bracing vs. breath-holding | Dead bug intro, marching |
| 1 | `les.ow-break-habit-01` — why frequency beats duration for desk workers | Movement-break protocol F |
| 1 | `les.ow-squat-mechanics-01` — knees, hips, balance in the sit-to-stand | Chair squat |
| 2 | `les.ow-hip-hinge-01` — hinge vs. squat, protecting the back in daily lifting | Hip hinge, carry prep |
| 2 | `les.ow-push-pull-balance-01` — why desk workers need both | Wall push-up, band row |
| 2 | `les.ow-consistency-01` — adherence science in plain language | Weekly review data |
| 3 | `les.ow-combinations-01` — how combined movements transfer to real life | Combination sequences |
| 3 | `les.ow-work-capacity-01` — pacing, RPE, and the talk test | Interval marching |
| 3 | `les.ow-single-leg-01` — balance as a trainable skill | Single-leg stance, step-up |
| 4 | `les.ow-loading-01` — progressive overload without a gym | Band/DB variants |
| 4 | `les.ow-posture-endurance-01` — endurance vs. "perfect posture" | Carries, planks |
| 4 | `les.ow-lift-mechanics-01` — hip hinge applied to real objects | Farmer carry, household lifts |
| 5 | `les.ow-advanced-practice-01` — what "advanced" actually means (control, not complexity) | Challenge battery |
| 5 | `les.ow-coaching-eye-01` — watching movement: what to look at first | Demonstration prep |
| 6 | `les.ow-scope-of-practice-01` — what a trainer does and doesn't do; referral boundaries | Trainer pathway capstone |
| 6 | `les.ow-next-path-01` — reading your own data; choosing what's next | Portfolio review |

Each lesson ships in text + illustrated sequence; audio/video where the demo benefits (Doc 17, §A.1). Quizzes attach to lessons marked assessable (Engine 14).

---

## D. Assessment checkpoints

Battery prefix `asmt.ow-`. All assessments are in-app, guided, with video reference.

| Checkpoint | When | Tests | Pass criteria |
|---|---|---|---|
| A1 baseline | Days 1–3 | 60-s sit-to-stand count; wall push-up max (unbroken); single-leg stance /side (supported OK); seated thoracic rotation L/R; forearm plank hold | **Completion only** — all 5 documented with acceptable form. Phase 1 pass is about baselines, not performance. |
| A1 retest | Day 28–30 | Same battery | Improvement in ≥ 2 tests OR all within 10% of baseline with better form notes |
| A2 | Day 58–60 | Chair squat 3×10 controlled; wall push-up 2×12; plank 30 s; single-leg stance 20 s/side | 3 of 4 at standard |
| A3 | Day 88–90 | A2 items + band row 3×12 (or chair-supported row); step-up 2×10/leg; dead bug 3×8/side no lumbar lift | 4 of 6 at standard |
| A4 | Day 118–120 | A3 items + farmer carry 60 s; split squat 2×8/leg | 4 of 6 at standard |
| A5 | Day 148–150 | Reviewer-set challenge battery: single-leg stance 45 s eyes open; floor push-up 2×8; 5-min continuous movement circuit | 3 of 5 at standard |
| A6 final | Day 176–180 | Full A1 battery retest + portfolio review (I) | Report, not pass/fail — generates the next-path recommendation |

**On fail (any checkpoint):** `difficulty_cap` and per-exercise `current_difficulty` are unchanged; the next phase opens on its calendar date regardless (Doc 18, §B.2 — the clock never promotes and never punishes); reassessment is offered after 14 days of targeted practice on the missed items; the user is told exactly which items missed and what to practice. If > 40% of active users fail the same checkpoint item, it becomes a content task (Doc 17, §A.6) — the rubric or the teaching is reviewed, not the users.

---

## E. Trainer-development assignments (the 20% pathway)

One assignment per phase, escalating. All are portfolio artifacts (Engine 15/16).

| Phase | Assignment | Evidence |
|---|---|---|
| 1 | Explain one foundational movement in your own words (100–150 words): what it trains, one cue, one common error | Written submission, reviewed against the approved cue list |
| 2 | Film a 60-s demonstration of one exercise + written self-critique against its coaching cues | Video + self-review |
| 3 | Write coaching cues for a peer: pick one exercise, list 2 common errors → corrections | Written; peer-review optional |
| 4 | Build a 15-min mini-program for a hypothetical desk worker **using approved exercises only** (composer-validated) | Program doc; system checks all `content_id`s are published |
| 5 | Film a coaching explanation: what to watch, how to correct, when to regress | Video, 2–3 min |
| 6 | Capstone: scope-of-practice statement + referral-boundary quiz + complete demonstration set | Portfolio section; quiz must pass (Engine 14) |

Labels everywhere: "Practice-Engine achievement" — never a professional credential (Doc 17, R7).

---

## F. Movement-break protocols (Engine 12)

2–3 minute templates, designed for office clothes and no shower.

| Template | Duration | Contents |
|---|---|---|
| Desk Reset | 2:00 | Chin tucks ×10; shoulder rolls ×10 each way; seated thoracic extension ×8; standing hip-flexor stretch 30 s/side; ankle circles ×10/side |
| Walk & Water | 3:00 | Walk (corridor/outside) + water; unstructured |
| Stair Reset | 2:00 | 2 flights easy pace + calf raises ×15 at the top |

**Trigger rules:**
- Default: every 60 min during user-set work hours (configurable 45 / 60 / 90 / off).
- Manual "take a break" button always available.
- Opt-in: suggestion after a 90-min calendar block (calendar integration, Engine 4/21).
- Never during quiet hours; max 6/day default; break adherence feeds the weekly review.
- Breaks are separate from workouts — they don't consume training days and never add load.

---

## G. Equipment ladder

Equipment never gates progression — it only widens the variant set (Doc 18, §B.3).

| Rung | Equipment | Unlock rule | Unlocks (examples) |
|---|---|---|---|
| 1 | None (bodyweight) | Day 1 | Full D1 library |
| 2 | Sturdy chair | Day 1 (assumed available) | Chair squat, step-up prep, seated mobility |
| 3 | Resistance band (light) | User reports ownership; suggested at Phase 2 | Band row, lateral steps, pull-aparts |
| 4 | Light dumbbells (pair, 2–5 kg) | User reports ownership; suggested at Phase 3+ | Farmer carry, goblet squat, overhead press |

A user can complete all 180 days on rung 1. Reporting new equipment triggers plan regeneration with newly eligible variants (Doc 18, §B.4).

---

## H. Seed foundational exercise list

16 movements; every family the track needs at D1–D2 (Doc 17, §B.5).

| # | Exercise (`content_id`) | Family | Movement pattern | Start difficulty | Equipment rung |
|---|---|---|---|---|---|
| 1 | `ex.marching` | Cardiovascular | gait | D1 | 1 |
| 2 | `ex.chair-squat` | Lower-body | squat | D1 | 2 |
| 3 | `ex.glute-bridge` | Glutes and hips | hip extension | D1 | 1 |
| 4 | `ex.wall-push-up` | Upper-body pushing | push | D1 | 1 |
| 5 | `ex.band-row` | Upper-body pulling | pull | D1 | 3 |
| 6 | `ex.dead-bug` | Core | anti-extension | D1 | 1 |
| 7 | `ex.bird-dog` | Core | anti-rotation | D2 | 1 |
| 8 | `ex.chin-tuck` | Mobility | cervical | D1 | 1 |
| 9 | `ex.shoulder-wall-slide` | Mobility | shoulder | D1 | 1 |
| 10 | `ex.thoracic-rotation` | Mobility | rotation | D1 | 1 |
| 11 | `ex.hip-flexor-stretch` | Mobility | hip | D1 | 1 |
| 12 | `ex.calf-raise` | Lower-body | plantar flexion | D1 | 1 |
| 13 | `ex.tandem-stance` | Balance | balance | D1 | 1 |
| 14 | `ex.step-up` | Lower-body | squat (single-leg) | D2 | 2 |
| 15 | `ex.farmer-carry` | Occupational | carry | D2 | 4 (or loaded bag) |
| 16 | `ex.forearm-plank` | Core | anti-extension | D2 | 1 |

Each ships with ≥ 3 variants across its ladder before the track leaves draft (Doc 17, §B.5).

---

## I. Portfolio documentation requirements

Captured in-app; private by default; user controls sharing (Doc 17, R7 / Engine 23).

| Phase | Required artifacts |
|---|---|
| 1 | A1 baseline video (one full run-through); break-adherence log |
| 2 | 60-s demo video (E assignment); A2 assessment record |
| 3 | Before/after comparison (A1 vs. retest clips); training journal export |
| 4 | Coaching-explanation video (E assignment); mini-program doc |
| 5 | Demonstration set: 3 exercises filmed at standard; challenge battery record |
| 6 | Complete portfolio: all artifacts + capstone + A6 report + next-path recommendation |

Deletion: user can delete any photo/video at any time; training history (sets/reps) retained per the retention policy (Doc 18, §F.10).

---

## Decision log

- **Office-Worker as V1** — home-first, minimal equipment, standard risk tier; the safest track to prove the full loop (generate → deliver → adapt → document → maintain).
- **Phase 1 pass = completion, not performance** — baselines must be safe to attempt on day 1; grading performance at baseline would punish the users who need the track most.
- **Expert Track gated by evidence, not by Day 121** — the calendar opens themes; only assessment evidence opens advanced content (Doc 18, §G).
- **Breaks are not workouts** — separate system, no load, no progression; conflating them would corrupt training data.
- **Equipment widens, never gates** — the full 180 days are completable on rung 1.

## Next

- **20 — Nutrition engines** (10–12): food-capture confirmation UX, observation-period rules, meal-guidance templates.
- **21 — Education & portfolio** (13–16): lesson delivery mechanics, knowledge assessment, mastery tracking, trainer-development pathway detail.
- Remaining 12 specialization curricula after the V1 pilot (brief §2 catalog).
