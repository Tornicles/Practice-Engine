# 23 — Performance Assessments

**Status:** Design draft · **Date:** 2026-10-11
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11)
**Depends on:** Doc 17 (content standards, exercise DB, safety rules), Doc 18 (progression rules, safety events, assessment API)
**Engines covered:** 9 (Performance Assessment)

> Assessments produce evidence. Evidence moves difficulty (Engine 7) and earns achievements (Engine 15). The 180-day calendar opens curriculum phases; only assessment results and logged performance move capability.

---

## A. Assessment philosophy

1. **Specialization-specific benchmarks.** Each track measures what it trains. An Office-Worker assessment tests posture tolerance, movement quality, and workday movement breaks — not a 1RM. A Soccer Fitness assessment tests footwork and change-of-direction — not bench press. Every assessment belongs to exactly one specialization and one phase.
2. **Evidence over elapsed time.** Reaching Day 120 with unpassed assessments means the user trains at their demonstrated level with the next phase's curriculum open. Calendar time is never a pass criterion (Doc 17, R4).
3. **Verified vs. unverified status.** An achievement is `verified` only when its assessment evidence was scored against the published rubric — by self-report with required media, or by reviewer where the protocol demands it. Everything else is `unverified` (participation, streaks). The product labels them differently, always.
4. **AI video analysis is tentative, never definitive.** AI may pre-score observable technique points (e.g. "knees tracked over toes: yes/no/unclear") and draft feedback phrasing for the reviewer. It may NOT: declare an injury risk, clear or fail a user on safety grounds, or substitute for professional assessment. Any AI-generated technique note is labeled as such and is overridable by the reviewer and by the user's own reported experience. Pain or dizziness reported during an assessment stops it immediately (Doc 17, R3) regardless of what any analysis says.
5. **Assessments are coaching moments, not exams.** Fail states don't exist as punishments — results are pass / partial / retry, each with a prescribed next step (§E).

---

## B. Checkpoint schedule

| Checkpoint | When | Trigger | Purpose |
|---|---|---|---|
| Baseline | Days 1–7 | Enrollment complete | Establish starting capability; set initial difficulty caps; capture "before" evidence |
| Phase checkpoint | Every 30 days (days 30, 60, 90, 120, 150) | Phase boundary job | Verify readiness for the next phase's demands; promote exercises on pass |
| Reassessment | Any time | User request, or scheduled after a retry result | Re-attempt a specific assessment without waiting for the phase boundary |
| Final review | Day 180 | Program completion | Full battery + portfolio assembly; next-path recommendation |

Rules:
- Baseline must complete before the first adaptive plan is generated; until then the composer uses onboarding-declared capability with conservative caps.
- Phase checkpoints open automatically at the boundary. The next phase's curriculum opens regardless of results — but difficulty only moves on evidence (§E).
- A user may attempt any phase checkpoint early (user-requested reassessment) but not more than once per 7 days per assessment — prevents grinding, protects recovery.
- Missed checkpoints are rescheduled, never backfilled with punitive volume.

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
| `version` | MAJOR.MINOR — rubric changes are MAJOR (Doc 17 §A.5); prior results keep the version they were scored under |

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
- **Output:** `verified` Office-Worker Mastery achievement (labeled "Practice-Engine achievement", Doc 17 R7) + next-path recommendation (repeat advanced track, new specialization, or trainer-development pathway).

---

## E. Assessment → progression linkage (Engine 7)

| Result | Meaning | Engine 7 effect | Scheduling effect |
|---|---|---|---|
| **Pass** | Met pass criteria | Promote assessed exercises +1 difficulty (Doc 18 §B.2); `consecutive_successes` reset to 0 at the new rung | Next phase curriculum opens (already open); achievement marked `verified` |
| **Partial** | Some criteria met | Hold difficulty; targeted practice block inserted into next 2 weeks' plans | Reassessment auto-scheduled in 14 days |
| **Retry** | Below criteria or stopped early | Hold difficulty; composer favors easier variants of the tested movements | Reassessment auto-scheduled in 14 days; user may also request earlier (7-day cooldown) |
| **Stopped (pain/safety)** | R3 pathway | Exercise withheld; safety event logged | Reassessment only after withhold clears + reviewer-set days |

Hard rules:
- A failed assessment never lowers existing difficulty — it holds. Regression comes only from the §B.2 regress triggers (2 failed sessions or pain).
- Phase boundaries open curriculum regardless of results. The user is never "held back a month."
- Assessment results are versioned: a rubric MAJOR bump does not invalidate prior passes, but the next checkpoint uses the new rubric.
- `POST /assessments/:id/complete` (Doc 18 §E) is the single write path; it runs the safety engine, updates `progression_state`, and emits achievements.

---

## F. Data model (extends Docs 17–18)

```ts
// assessments: the reviewed protocol (content item of type `assessment`)
assessments {
  id uuid PK, assessment_id text unique,        // asmt.office-worker.baseline-screen
  specialization_id FK, phase int nullable,    // null = baseline/final
  name text, standard_json jsonb,              // §C fields: setup, instructions, stop conditions
  scoring_rubric jsonb, pass_criteria jsonb,
  required_evidence jsonb, reviewer_involvement text,  // self_scored | ai_assisted | reviewer_required
  safety_gates jsonb, time_limit_s int nullable,
  version text, review_status text,            // Doc 17 lifecycle
  created_at timestamp
}

// assessment_results: one row per attempt
assessment_results {
  id uuid PK, user_id FK, assessment_id FK,
  attempt int,                                // 1, 2, 3…
  trigger text,                               // baseline | phase_boundary | user_request | scheduled_retry
  scores jsonb,                               // per-criterion scores
  total int, result text,                     // pass | partial | retry | stopped_safety
  ai_prescore jsonb nullable,                 // present only when reviewer_involvement = ai_assisted
  user_confirmed bool, reviewer_id text nullable, reviewed_at timestamp nullable,
  evidence_ids uuid[],                        // → evidence store (Doc 18: videos/photos/logs)
  progression_applied bool default false,     // Engine 7 promotion written
  version_scored text,                        // rubric version used
  created_at timestamp
}

// evidence links: assessment_results.evidence_ids → evidence table (Engine 15 store)
// achievements reference assessment_results.id (Doc 17 §B.2: achievement → assessment evidence)
```

Key queries:
- "User's verified achievements": `assessment_results WHERE result='pass' AND (reviewer_involvement='self_scored' OR reviewed_at IS NOT NULL)`.
- "Due reassessments": results with `result IN ('partial','retry')` and no newer attempt within 14 days.
- "Rubric drift check": results grouped by `version_scored` per `assessment_id` (flags when a MAJOR bump changed pass rates — feeds Doc 24 content intelligence).

---

## Decision log

- **Three result states, no fail-as-punishment.** Pass / partial / retry keeps assessments coaching-shaped and avoids dropout after a bad day.
- **Phase opens on calendar; difficulty moves on evidence.** The single most important invariant — stated in three places so no implementation can miss it.
- **AI pre-scores, never adjudicates.** `ai_assisted` still requires user confirmation; `reviewer_required` for finals and elevated tiers. No AI-only pass/fail on anything that grants a verified achievement.
- **Rubric changes are MAJOR versions** with prior results grandfathered — prevents retroactive invalidation and keeps the audit trail clean.
- **Assessments require `proceed` readiness.** Testing on a compromised day measures the bad day, not the user.

## Next

- **24 — Content Studio Admin** (engines 17–20 tooling): authoring, review queues, publishing dashboard, content intelligence.
- **25 — Platform Operations** (engines 21–24): notifications, analytics, safety/privacy/eligibility, admin & QA.
- **26 — Technical Consolidation**: mobile + backend + AI services + data/media + admin topology.
- Also queued: **19** Office-Worker curriculum, **20** nutrition engines, **21** education & portfolio, **22** onboarding & scheduling.
