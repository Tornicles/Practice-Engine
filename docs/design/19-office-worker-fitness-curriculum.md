# 19 — Office-Worker Fitness Curriculum

**Status:** Design draft · **Date:** 2026-10-11
**Amendment (2026-10-11):** Aligned to the Elite Mastery OS spec ("Complete Application Sequence and Elite Mastery Operating System"). Added: (§J) the 180-day mastery blueprint with all 10 required items from OS Part 2, including the required physical competencies and knowledge modules; (§K) the weekly structure template from OS Part 6 plus the weekly-challenge mechanic (journey step 10). All existing sections preserved.
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11), §2, §3, §17; "Complete Application Sequence and Elite Mastery Operating System" (2026-10-11)
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

## J. The 180-day mastery blueprint (Elite OS, Part 2)

After onboarding, the user receives their blueprint. It must contain all 10 required items — mapped here to this doc's sections so nothing is implied:

| # | Required item | Where it lives in this doc |
|---|---|---|
| 1 | Primary specialization + personal objectives | §A (specialization profile); personal objectives captured at onboarding (Elite OS Screens 4–5) and shown on the blueprint header |
| 2 | Six training phases | §B — Foundation, Beginner, Practitioner, Specialist, Expert Track, Mastery Review |
| 3 | Required physical competencies | §J.1 below — the track's 10 competencies, each tied to assessment items |
| 4 | Knowledge modules | §J.2 below — the 6 modules grouping the §C lesson map |
| 5 | Weekly workout & recovery structure | §K — the adapted weekly template |
| 6 | Monthly assessments | §D — checkpoints A1–A6 |
| 7 | Documentation milestones | §I — per-phase required artifacts |
| 8 | Optional trainer-development assignments | §E — one per phase, portfolio artifacts |
| 9 | Final portfolio requirements | §I, Phase 6 row + §J.3 portfolio checklist |
| 10 | Advancement criteria | §J.4 — what "more advanced training" requires; the three next-path options |

The blueprint is generated once (Day 1) and re-issued when the primary specialization changes. Daily workload adapts (Doc 18); the blueprint's structure does not.

### J.1 Required physical competencies

Ten competencies; a user may be advanced in one and foundational in another. Each is demonstrated through the linked assessment items — never inferred from workout completion alone.

| # | Competency | Demonstrated via |
|---|---|---|
| 1 | Sit-to-stand pattern | A1 sit-to-stand; A2 chair squat 3×10 |
| 2 | Hip hinge pattern | A3+ deadlift/hinge items; Phase-4 lift mechanics |
| 3 | Push pattern | A1 wall push-up max; A2 2×12; A5 floor push-up 2×8 |
| 4 | Pull pattern | A3 band row 3×12 |
| 5 | Core bracing & anti-extension | A3 dead bug 3×8/side; A1/A2 plank holds |
| 6 | Single-leg balance | A1–A5 single-leg stance progressions (supported → 45 s eyes open) |
| 7 | Thoracic mobility & rotation | A1 seated thoracic rotation; §C lessons |
| 8 | Hip-flexor length & glute activation | Glute bridge; hip-flexor stretch (form-checked in A1 retest) |
| 9 | Loaded carry | A4 farmer carry 60 s |
| 10 | Movement-break habit (behavioral) | Break-adherence log ≥ 4/day sustained 3+ weeks (§F, §I) |

### J.2 Knowledge modules

The §C lesson map grouped into 6 modules (one per phase):

| Module | Phase | Lessons | Module outcome (user can…) |
|---|---|---|---|
| M1 "Desk body basics" | 1 | sitting-mechanics, bracing, break-habit, squat-mechanics | Explain what sitting does to the body and why breaks + bracing matter |
| M2 "Strength foundations" | 2 | hip-hinge, push-pull-balance, consistency | Distinguish hinge vs. squat; describe progressive overload in plain terms |
| M3 "Capacity & control" | 3 | combinations, work-capacity, single-leg | Pace by RPE; describe balance as a trainable skill |
| M4 "Loading & real-world strength" | 4 | loading, posture-endurance, lift-mechanics | Apply progressive overload without a gym; lift household objects safely |
| M5 "Advanced practice & coaching eye" | 5 | advanced-practice, coaching-eye | Watch a movement and name what to check first |
| M6 "Scope & what's next" | 6 | scope-of-practice, next-path | State what a trainer does/doesn't do; read own data to choose a next path |

Quizzes attach to assessable lessons (Engine 14); module completion requires its lessons + quizzes.

### J.3 Final portfolio checklist (blueprint item 9, explicit)

At Day 180 the portfolio must contain, at minimum:
- [ ] A1 baseline video + A6 final assessment report
- [ ] One before/after movement comparison (A1 vs. retest clips)
- [ ] Demonstration set: 3 exercises filmed at standard (Phase 5)
- [ ] All 6 trainer-development artifacts (§E), including the capstone
- [ ] Training journal export (consistency record)
- [ ] Break-adherence summary
- [ ] Next-path recommendation (generated from A6 + portfolio review)

### J.4 Advancement criteria (blueprint item 10, explicit)

"Continuing into more advanced training" is offered — never auto-assigned — when the user meets **all** of:
1. A5 passed at standard (or A6 report shows A5-level capability), **and**
2. ≥ 8 of 10 competencies demonstrated at their phase-appropriate standard, **and**
3. Consistency: ≥ 70% of planned sessions completed in Phases 4–6, with no unresolved safety flags.

The three next paths (§B, Phase 6): (a) repeat the track targeting higher evidence levels; (b) enroll in an adjacent specialization (composition rules, doc 28 §B); (c) maintenance mode — 2–3 sessions/week, no new curriculum, portfolio retained.

---

## K. Weekly structure & weekly challenges (Elite OS, Part 6)

### K.1 The weekly template

The Elite OS example week is the scheduler's template — adapted per user (age, ability, specialization, health circumstances, recovery). It is not a universal prescription.

| Day | Template slot | Office-worker realization (example) |
|---|---|---|
| Monday | Strength & technique | Main session: squat/hinge/push technique + strength blocks |
| Tuesday | Conditioning & movement skills | Interval marching / step circuits + coordination drills |
| Wednesday | Mobility, recovery & education | Mobility flow + knowledge mission (lesson); lighter load |
| Thursday | Specialization-specific training | Desk-worker focus: posture endurance, carries, break-habit coaching |
| Friday | Strength & applied practice | Strength blocks + applied practice (lift/carry mechanics) |
| Saturday | Challenge or performance assessment | Weekly challenge (§K.2) or scheduled assessment week |
| Sunday | Recovery & weekly review | Rest or gentle mobility; weekly review: what improved, what needs work, what comes next (evidence only — never invented improvement) |

The scheduler (Engine 4) may compress this to fewer days, move the challenge, or convert days to recovery based on readiness (Engine 8) and the user's schedule. The template's *shape* — hard/easy alternation, one education-forward day, one review day — is preserved.

### K.2 Weekly challenges (journey step 10)

One optional challenge per week, tied to the current phase. Challenges are the "prove it" layer between daily training and monthly assessments.

**Rules (non-negotiable):**
- **Optional.** Skipping a challenge changes nothing: no streak break, no plan change, no nagging.
- **Never punitive.** A failed or skipped challenge never increases load, never gates phase progression, and never affects mastery ranks.
- **Phase-tied.** The challenge pool for each week draws only from movements at or below the user's demonstrated difficulty.
- **Portfolio-feeding.** Completed challenges log evidence (result + optional video) to the portfolio (§I).
- **One at a time.** A new challenge appears only when the previous week's is resolved (completed, skipped, or expired).

**Challenge types:**

| Type | Example (office worker) | What it proves |
|---|---|---|
| Consistency | "5 movement-break days this week" | Habit adherence |
| Skill | "30-s single-leg stance each side, 3 days" | Balance competency (§J.1 #6) |
| Volume | "100 total chair squats across the week, any split" | Work capacity |
| Teach-back | "Explain the hip hinge to someone; log their one cue back" | Trainer pathway (§E) |
| Knowledge | "Score 4/5 on the M2 module quiz" | Module completion (§J.2) |

**Generation:** Engine 2 selects the week's challenge from the phase's challenge pool, filtered by the safety rules and difficulty cap like any other content. Assessment weeks (checkpoints) replace the challenge with the assessment — never both.

**Weekly review (Sunday)** shows: planned vs. completed, what improved (with evidence links), what needs work (linked to specific competencies), what comes next. The system identifies evidence; it does not invent improvement to encourage engagement.

---

## Decision log

- **Office-Worker as V1** — home-first, minimal equipment, standard risk tier; the safest track to prove the full loop (generate → deliver → adapt → document → maintain).
- **Phase 1 pass = completion, not performance** — baselines must be safe to attempt on day 1; grading performance at baseline would punish the users who need the track most.
- **Expert Track gated by evidence, not by Day 121** — the calendar opens themes; only assessment evidence opens advanced content (Doc 18, §G).
- **Breaks are not workouts** — separate system, no load, no progression; conflating them would corrupt training data.
- **Equipment widens, never gates** — the full 180 days are completable on rung 1.
- **Blueprint is structural, not adaptive (§J)** — the 10 items are fixed at generation; only the daily workload adapts. Users always know what they're working toward.
- **Challenges are opt-in proof, not requirements (§K.2)** — they feed the portfolio and motivation without ever gating progression or punishing skips.

## Next

- **20 — Nutrition engines** (10–12): food-capture confirmation UX, observation-period rules, meal-guidance templates.
- **21 — Education & portfolio** (13–16): lesson delivery mechanics, knowledge assessment, mastery tracking, trainer-development pathway detail.
- Remaining 12 specialization curricula after the V1 pilot (brief §2 catalog).
