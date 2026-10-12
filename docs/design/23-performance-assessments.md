# 23 — Performance Assessments

**Status:** Design draft · **Date:** 2026-10-11
**Amendment (2026-10-11):** aligned to the Elite Mastery OS spec ("Complete Application Sequence and Elite Mastery Operating System") — assessments framed as the evidence engine for mastery gates (Doc 21 §C.4); protocol template extended with gate-mapping fields (`rank_gated`, `domains_tested`, `gate_components`); monthly checkpoints mapped to journey step 11 and the Day-180 final assessment.
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11) + Elite Mastery OS spec (2026-10-11)
**Depends on:** Doc 17 (content standards, exercise DB, safety rules), Doc 18 (progression rules, safety events, assessment API), Doc 21 (mastery gates, ranks, domains)
**Engines covered:** 9 (Performance Assessment)

> Assessments produce evidence. Evidence moves difficulty (Engine 7) and earns achievements (Engine 15). The 180-day calendar opens curriculum phases; only assessment results and logged performance move capability.

---

## A. Assessment philosophy

1. **Specialization-specific benchmarks.** Each track measures what it trains. An Office-Worker assessment tests posture tolerance, movement quality, and workday movement breaks — not a 1RM. A Soccer Fitness assessment tests footwork and change-of-direction — not bench press. Every assessment belongs to exactly one specialization and one phase.
2. **Evidence over elapsed time.** Reaching Day 120 with unpassed assessments means the user trains at their demonstrated level with the next phase's curriculum open. Calendar time is never a pass criterion (Doc 17, R4).
3. **Verified vs. unverified status.** An achievement is `verified` only when its assessment evidence was scored against the published rubric — by self-report with required media, or by reviewer where the protocol demands it. Everything else is `unverified` (participation, streaks). The product labels them differently, always.
4. **AI video analysis is tentative, never definitive.** AI may pre-score observable technique points (e.g. "knees tracked over toes: yes/no/unclear") and draft feedback phrasing for the reviewer. It may NOT: declare an injury risk, clear or fail a user on safety grounds, or substitute for professional assessment. Any AI-generated technique note is labeled as such and is overridable by the reviewer and by the user's own reported experience. Pain or dizziness reported during an assessment stops it immediately (Doc 17, R3) regardless of what any analysis says.
5. **Assessments are coaching moments, not exams.** Fail states don't exist as punishments — results are pass / partial / retry, each with a prescribed next step (§E).
6. **Assessments are the evidence engine for mastery gates.** Every assessment declares, at authoring time, which mastery rank, which domains, and which gate components it feeds (Doc 21 §C.4). An assessment result is not just a score — it is the physical/demonstration evidence input to specific gates. The protocol template (§C) carries these mappings as required fields.

---

## B. Checkpoint schedule

| Checkpoint | When | Trigger | Purpose | Feeds gates |
|---|---|---|---|---|
| Baseline | Days 1–7 | Enrollment complete | Establish starting capability; set initial difficulty caps; capture "before" evidence | Entry rank prerequisites across domains |
| Monthly mastery assessment | Every 30 days (days 30, 60, 90, 120, 150) | Phase boundary job — journey step 11 | Verify readiness for the next phase's demands; gate rank advancement | Rank gates for the phase's domains (per protocol mapping) |
| Reassessment | Any time | User request, or scheduled after a retry result | Re-attempt a specific assessment without waiting for the phase boundary | Same gates as the original attempt |
| Final review | Day 180 | Program completion | Full battery + portfolio assembly; next-path recommendation | Mastery Achievement gates; portfolio evidence |

Rules:
- Baseline must complete before the first adaptive plan is generated; until then the composer uses onboarding-declared capability with conservative caps.
- Monthly checkpoints open automatically at the boundary. The next phase's curriculum opens regardless of results — but difficulty and rank advancement move only on evidence (§E).
- A user may attempt any monthly checkpoint early (user-requested reassessment) but not more than once per 7 days per assessment — prevents grinding, protects recovery.
- Missed checkpoints are rescheduled, never backfilled with punitive volume.
- Each monthly assessment's protocol states exactly which rank/domain gates it can satisfy — users see "this assessment gates Practitioner in agility and lower-body strength" before they start.

---

## C. Protocol template

Every assessment is a reviewed content item (`type: assessment`, Doc 17 §A.1) with these fields:

| Field | Content |
|---|---|
| `assessment_id` | Stable id, e.g. `asmt.office-worker.baseline-screen` (never reused) |
| `specialization` / `phase` | Exactly one track; phase it gates (or `baseline` / `final`) |
| `movement` / skill tested | What capability this measures, in plain language |
| `setup` | Equipment, space, camera angle for evidence, warm-up required |
| `standard` (instructions) | Step-by-step protocol the user follows; includes stop conditions ("stop if pain, dizziness, or loss of balance") |
| `scoring_rubric` | Observable criteria → points. Each criterion: what to look for, 0/1/2 scale, example of each level |
| `pass_criteria` | Minimum total and any must-pass criteria (e.g. "no pain reported" is always must-pass) |
| `required_evidence` | video (max length, required angles) / photo / logged reps — per criterion |
| `reviewer_involvement` | `self_scored` (user scores against rubric with media) \| `ai_assisted` (AI pre-scores, user confirms) \| `reviewer_required` (human scores; used for elevated risk tiers and final review) |
| `safety_gates` | Contraindication flags that disqualify; readiness required (`proceed` only — no assessments on `reduce`/`rest` days) |
| `time_limit` | Max duration; timeouts are neutral (retry), not failures |
| `rank_gated` | Which mastery rank this assessment gates, e.g. `Practitioner` (Doc 21 §C.2) |
| `domains_tested[]` | Mastery domain slugs this assessment feeds, e.g. `["agility", "lower_body_strength"]` (Doc 21 §C.3) |
| `gate_components[]` | Which gate components this result satisfies: subset of `physical`, `demonstration` (knowledge/prerequisites/consistency come from Engines 14/15/18) |
| `version` | MAJOR.MINOR — rubric changes are MAJOR (Doc 17 §A.5); prior results keep the version they were scored under |

Gate-mapping fields are mandatory at Technical Review: an assessment without `rank_gated` and `domains_tested` cannot publish.

---

## D. Worked examples — Office-Worker Fitness

Written against the planned Doc 19 curriculum checkpoints (baseline → 30-day phase gates → day-180 final).

### D.1 `asmt.office-worker.baseline-screen` — Baseline Movement Screen (days 1–7)

- **Tests:** foundational movement quality for desk-work demands: sit-to-stand, pushing, overhead reach, balance.
- **Setup:** sturdy chair, wall, phone camera side-on for squats, 2m clear space. 3-min march-in-place warm-up.
- **Standard:**
  1. Chair sit-to-stand × 10, controlled tempo, arms crossed. Stop if knee pain.
  2. Wall push-up × 10, body straight. Stop if shoulder/wrist pain.
  3. Standing overhead reach × 5/side, slow. Note any pinching.
  4. Supported single-leg stance (fingertips on wall), 20 s per leg.
- **Rubric (0/1/2 each):** sit-to-stand depth/control; push-up body line; reach symmetry; balance steadiness. Max 8.
- **Pass criteria:** total ≥ 5 AND no pain reported on any item AND balance ≥ 1 per leg.
- **Evidence:** one side-on video (≤ 90 s) covering items 1–2; self-reported scores for 3–4 with optional video.
- **Reviewer:** `self_scored`. **Safety gates:** knee/shoulder/wrist `withhold` flags reroute to the adapted baseline (seated variants) instead of this protocol.
- **Gate mapping:** `rank_gated: Entry`; `domains_tested: [functional_strength, balance, mobility]`; `gate_components: [physical, demonstration]`. Satisfies Entry prerequisites across these domains.
- **On fail/retry:** difficulty caps set to D1 across the board; reassessment available after 14 days of training.

### D.2 `asmt.office-worker.phase2-checkpoint` — Hinge Competency + Posture Endurance (day 60)

- **Tests:** hip-hinge pattern (the phase-2 skill) and static posture tolerance for desk work.
- **Setup:** chair, wall, timer.
- **Standard:**
  1. Dowel hip hinge (broomstick along spine, 3 contact points) × 10 slow reps.
  2. Wall sit 45 s, thighs parallel-ish, back flat.
  3. Dead bug × 8/side, slow, lower back stays down.
- **Rubric:** hinge — contact points maintained (0–2), no lumbar rounding (0–2); wall sit — completed time (0–2); dead bug — control, no arching (0–2). Max 8.
- **Pass criteria:** total ≥ 6 AND hinge sub-score ≥ 3 (must-pass: the phase skill) AND no back pain.
- **Evidence:** rear-three-quarter video of hinges (≤ 60 s); timer screenshot or video for wall sit.
- **Reviewer:** `ai_assisted` — AI pre-scores contact-point maintenance; user confirms or corrects.
- **Safety gates:** back `withhold` flag → adapted protocol (supine-only core screen).
- **Gate mapping:** `rank_gated: Beginner`; `domains_tested: [functional_strength, mobility]`; `gate_components: [physical, demonstration]`. Pass satisfies the physical + demonstration components of the Beginner gate in these domains (knowledge + consistency components come from Engines 14/18).
- **Links to progression:** pass promotes `ex.hip-hinge` and `ex.dead-bug` +1 difficulty (Doc 18 §B.2); fail holds both and schedules targeted hinge practice + reassessment in 14 days.

### D.3 `asmt.office-worker.final-review` — Mastery Circuit + Movement-Break Demo (day 180)

- **Tests:** retained movement quality under mild fatigue + ability to teach (trainer-development tie-in, Engine 16).
- **Setup:** same as baseline + a colleague or camera-as-audience.
- **Standard:**
  1. Repeat D.1 baseline screen (same protocol, current ability).
  2. 3-minute "movement break" the user leads on camera: pick 3 office-appropriate movements, cue each one out loud (form cue + breathing cue + one common error to avoid).
- **Rubric:** baseline retest scored as D.1 (max 8); demo scored on movement selection (appropriate for office, 0–2), cue clarity (0–2), safety callouts incl. stop conditions (0–2, must-pass ≥ 1).
- **Pass criteria:** baseline retest ≥ 6 AND demo ≥ 4 with safety callout present AND no pain.
- **Evidence:** both videos; portfolio entry auto-assembled (Engine 15).
- **Reviewer:** `reviewer_required` — a qualified reviewer scores the demo; baseline retest is `ai_assisted`.
- **Gate mapping:** `rank_gated: Mastery Achievement`; `domains_tested: [functional_strength, balance, mobility]`; `gate_components: [physical, demonstration]`. Together with the knowledge gate (final module assessment) and consistency record, a pass completes the Mastery Achievement gates.
- **Output:** `verified` Office-Worker Mastery achievement (labeled "Practice-Engine achievement", Doc 17 R7) + next-path recommendation (repeat advanced track, new specialization, or trainer-development pathway).

---

## E. Assessment → progression & gate linkage (Engines 7 + 15)

| Result | Meaning | Engine 7 effect | Mastery-gate effect | Scheduling effect |
|---|---|---|---|---|
| **Pass** | Met pass criteria | Promote assessed exercises +1 difficulty (Doc 18 §B.2); `consecutive_successes` reset to 0 at the new rung | Satisfies the protocol's `gate_components` for `rank_gated` in `domains_tested` (Doc 21 §C.4) | Next phase curriculum opens (already open); achievement marked `verified` |
| **Partial** | Some criteria met | Hold difficulty; targeted practice block inserted into next 2 weeks' plans | Gate components partially satisfied; failed components named in the improvement plan | Reassessment auto-scheduled in 14 days |
| **Retry** | Below criteria or stopped early | Hold difficulty; composer favors easier variants of the tested movements | No gate components satisfied; targeted improvement plan issued (Doc 21 §C.4) | Reassessment auto-scheduled in 14 days; user may also request earlier (7-day cooldown) |
| **Stopped (pain/safety)** | R3 pathway | Exercise withheld; safety event logged | Gates untouched; reassessment only after withhold clears + reviewer-set days | Safety pathway first |

Hard rules:
- A failed assessment never lowers existing difficulty — it holds. Regression comes only from the §B.2 regress triggers (2 failed sessions or pain).
- Phase boundaries open curriculum regardless of results. The user is never "held back a month."
- Assessment results are versioned: a rubric MAJOR bump does not invalidate prior passes, but the next checkpoint uses the new rubric.
- `POST /assessments/:id/complete` (Doc 18 §E) is the single write path; it runs the safety engine, updates `progression_state`, evaluates affected gates (Doc 21 §C.4), and emits achievements.

---

## F. Data model (extends Docs 17–18, 21)

```ts
// assessments: the reviewed protocol (content item of type `assessment`)
assessments {
  id uuid PK, assessment_id text unique,        // asmt.office-worker.baseline-screen
  specialization_id FK, phase int nullable,    // null = baseline/final
  name text, standard_json jsonb,              // §C fields: setup, instructions, stop conditions
  scoring_rubric jsonb, pass_criteria jsonb,
  required_evidence jsonb, reviewer_involvement text,  // self_scored | ai_assisted | reviewer_required
  rank_gated text,                             // §C: mastery rank this assessment gates (Doc 21 §C.2)
  domains_tested text[],                       // §C: mastery domain slugs (Doc 21 §C.3)
  gate_components text[],                      // §C: subset of [physical, demonstration]
  safety_gates jsonb, time_limit_s int nullable,
  version text, review_status text,            // Doc 17 lifecycle
  created_at timestamp
}

// assessment_results: one row per attempt
assessment_results {
  id uuid PK, user_id FK, assessment_id FK,
  attempt int,                                // 1, 2, 3…
  trigger text,                               // baseline | monthly_checkpoint | user_request | scheduled_retry
  scores jsonb,                               // per-criterion scores
  total int, result text,                     // pass | partial | retry | stopped_safety
  ai_prescore jsonb nullable,                 // present only when reviewer_involvement = ai_assisted
  user_confirmed bool, reviewer_id text nullable, reviewed_at timestamp nullable,
  evidence_ids uuid[],                        // → evidence store (Doc 18: videos/photos/logs)
  progression_applied bool default false,     // Engine 7 promotion written
  gates_evaluated bool default false,         // Doc 21 §C.4 gate evaluation run
  version_scored text,                        // rubric version used
  created_at timestamp
}

// evidence links: assessment_results.evidence_ids → evidence table (Engine 15 store)
// achievements reference assessment_results.id (Doc 21 §C.5: gate_evidence.physical)
```

Key queries:
- "User's verified achievements": `assessment_results WHERE result='pass' AND (reviewer_involvement='self_scored' OR reviewed_at IS NOT NULL)`.
- "Due reassessments": results with `result IN ('partial','retry')` and no newer attempt within 14 days.
- "Rubric drift check": results grouped by `version_scored` per `assessment_id` (flags when a MAJOR bump changed pass rates — feeds Doc 24 content intelligence).
- "Gate readiness": for a user × rank × domain, which `gate_components` are satisfied by passing results and which remain (feeds the targeted improvement plan, Doc 21 §C.4).

---

## Decision log

- **Three result states, no fail-as-punishment.** Pass / partial / retry keeps assessments coaching-shaped and avoids dropout after a bad day.
- **Phase opens on calendar; difficulty moves on evidence.** The single most important invariant — stated in three places so no implementation can miss it.
- **AI pre-scores, never adjudicates.** `ai_assisted` still requires user confirmation; `reviewer_required` for finals and elevated tiers. No AI-only pass/fail on anything that grants a verified achievement.
- **Rubric changes are MAJOR versions** with prior results grandfathered — prevents retroactive invalidation and keeps the audit trail clean.
- **Assessments require `proceed` readiness.** Testing on a compromised day measures the bad day, not the user.
- **Assessments are the evidence engine for mastery gates.** Every protocol declares `rank_gated`, `domains_tested`, and `gate_components` at authoring time — no unmapped assessments publish.
- **Monthly checkpoints are the rank-advancement moments.** Journey step 11; each checkpoint's protocol tells the user exactly which gates it can satisfy before they start.

## Next

- **24 — Content Studio Admin** (engines 17–20 tooling): authoring, review queues, publishing dashboard, content intelligence — assessment protocols are content items in its queues.
- **29 — Elite Mastery OS alignment** (planned): requirement inventory mapping the Elite Mastery OS spec across docs 17–28.
- **30 — Exercise player & Daily Command Center** (planned): guided session UX surfaces assessment scheduling and gate progress.
- Then: implementation per the build roadmap (100 prompts / 20 phases).
