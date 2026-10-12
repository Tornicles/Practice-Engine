# 21 — Education, Mastery & Trainer Development

**Status:** Design draft · **Date:** 2026-10-11
**Amendment (2026-10-11):** aligned to the Elite Mastery OS spec ("Complete Application Sequence and Elite Mastery Operating System") — §C rewritten to the spec's mastery model: three independent progress systems, the exact 7-rank ladder, per-specialization mastery domains, and the gate model; §D trainer pathway follows the spec's Month 1–6 task table.
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11) + Elite Mastery OS spec (2026-10-11)
**Depends on:** Doc 17 (content standards, exercise DB, safety rules), Doc 18 (composer plan contract carries one lesson per session)
**Engines covered:** 13 (Learning Delivery), 14 (Knowledge Assessment), 15 (Mastery & Portfolio), 16 (Trainer Development)

> Learning is the other half of the product promise ("document your development", "learn to guide others"). It runs on the same content lifecycle as exercises (Doc 17, §A): every lesson, quiz, and assignment is a reviewed content item with a pinned version.

---

## A. Learning Delivery (Engine 13)

### A.1 Lesson formats

Every lesson ships in up to four formats from one reviewed script. The user picks a default; all formats stay available.

| Format | Target length | Max | Notes |
|---|---|---|---|
| Text | 200–400 words | 600 words | One concept per lesson; plain language, no jargon without definition |
| Illustrated sequence | 3–6 frames | 8 frames | Stills pulled from approved `demo_video` media; numbered steps with one cue each |
| Audio | 60–120 s | 180 s | Same script as text, narrated; for during-warmup listening |
| Short video | 30–90 s | 120 s | Technique focus; captions mandatory; compressed for offline |

Length targets are reviewer-enforced at Technical Review (Doc 17, §A.2), not suggestions.

### A.2 Lesson content contract

```json
{
  "content_id": "les.squat-mechanics-01",
  "version": "1.0",
  "title": "How the squat works: knees, hips, balance",
  "objective_ids": ["obj.squat.pattern", "obj.squat.balance"],
  "specializations": ["office-worker", "soccer", "weight-loss"],
  "phase": 1,
  "formats": ["text", "illustrated", "audio", "video"],
  "estimated_min": 3,
  "prerequisites": ["les.movement-basics-01"]
}
```

Lessons reference curriculum objectives (`objective_ids`); the composer pairs them into session plans (Doc 18, §A.2).

### A.3 Pairing rules — lesson ↔ day's physical activity

Pairing is deterministic; AI handles only tone and framing, never selection.

1. Each session plan carries exactly one lesson (Doc 18, §A.2).
2. Candidate lessons = published lessons whose `objective_ids` intersect today's exercises (movement patterns, common errors, or coaching focus).
3. Order: **pre-teach before first exposure** (lesson on squat mechanics pairs with the first session containing squats), **reinforce after** (same lesson may re-pair once at higher difficulty).
4. One lesson per day maximum. Missed lessons queue; at most 2 catch-up lessons per day, oldest first — never a pile-up.
5. If the user failed the lesson's quiz, the lesson re-pairs before any re-test (see §B.4).
6. Trainer-pathway users (Engine 16) additionally get one coaching-strand micro-lesson per week, paired on rest days.

### A.4 Worked example (from the brief)

Beginner learning squats → session includes `les.squat-mechanics-01` (knee/hip movement, balance, common errors) in the user's preferred format → post-session quiz unlocks → practical assignment ("film 5 chair squats") lands in the portfolio at phase checkpoint.

---

## B. Knowledge Assessment (Engine 14)

### B.1 Assessment types

| Type | Format | Scoring | Evidence |
|---|---|---|---|
| Quiz | 3–7 tap-based questions per lesson/module | Auto-scored; pass ≥ 70% | `quiz_attempts` |
| Movement explanation | "Explain the squat in your own words" — text or 60 s audio | AI pre-scores against reviewer rubric → human spot-checks 10% | `quiz_attempts` (type=explanation) |
| Practical assignment | Film the movement / coach someone through it / build a 1-week plan for a persona | Checklist review (AI pre-score + human for trainer-pathway) | `portfolio_items` + reviewer sign-off |

Quiz questions are authored content (Doc 17 lifecycle), each tagged with one `objective_id`. AI never invents questions.

### B.2 Triggers

| Trigger | Action |
|---|---|
| Lesson completed | Its quiz unlocks |
| Module / phase end | Module quiz (covers the module's objectives) |
| Quiz failed (< 70%) | Spaced review scheduled (§B.4); lesson re-paired |
| Quiz failed twice | Lesson re-paired + a plain-language explainer shown; objective flagged `misunderstood` |
| Phase checkpoint | Practical assignment issued (Engine 15 evidence) |
| Incorrect pattern across users | Content flag → review task (Doc 17, §A.6) — the lesson may be the problem, not the user |

### B.3 Outputs

- `knowledge_score` 0–100 per `objective_id` (rolling: weighted 70% latest, 30% history).
- `misunderstood_concepts[]` — objective_ids below 60 after two attempts.
- `recommended_review[]` — lesson content_ids, ordered by dependency (prerequisites first).
- Spaced review schedule (§B.4).

These feed the **knowledge gate component** of mastery gates (§C.4).

### B.4 Spaced review (deterministic, SM-2-lite)

```
interval_days = [1, 3, 7, 14, 30]
on pass:  streak += 1; next_review = today + interval_days[min(streak, 4)]
on fail:  streak = 0;  next_review = tomorrow; lesson re-paired
```

Active review queue capped at 10 items; oldest-due first. This is code, not an LLM scheduler.

---

## C. Mastery System (Engine 15) — Elite Mastery OS model

### C.1 Three independent progress systems

| # | System | What it tracks | Advances on |
|---|---|---|---|
| 1 | Calendar progression | Day 1 → Day 180; phases open on schedule | Elapsed program days |
| 2 | Competency progression | Skills the user can actually demonstrate, per domain | Assessment evidence + logged performance |
| 3 | Earned mastery status | Ranks granted against defined standards | Gate completion (§C.4) |

**Hard rule:** the three systems are displayed separately — e.g. "Day 42 · 3 competencies demonstrated · Rank: Foundation (balance)". They are **never combined into a single percentage or score**. One blended number is a misleading-progress anti-pattern: it is banned from product copy, UI, and AI-generated summaries.

### C.2 The seven ranks (exact)

| Rank | Meaning |
|---|---|
| Entry | User is assessed and introduced to the discipline |
| Foundation | Demonstrates essential movements and basic knowledge |
| Beginner | Performs foundational routines consistently and competently |
| Practitioner | Applies techniques independently across varied situations |
| Specialist | Demonstrates strong discipline-specific performance and understanding |
| Expert Track | Meets advanced standards within the defined specialization |
| Mastery Achievement | Passes the program's highest published assessment standards |

- Ranks are earned **per domain** (§C.3), not as one global title. A user can hold Practitioner in one domain and Foundation in another — the product shows both truths.
- **Mastery Achievement is an internal program distinction.** It is not a claim of universal elite athletic status and not a professional license. Every rank display carries the **"Practice-Engine achievement"** label (Doc 17, R7).
- Ranks are granted only on gate completion (§C.4) — never on calendar time, day count, streak length, or AI prediction. A user reaching Day 180 without passing gates holds only the ranks their evidence supports.

### C.3 Mastery domains (per specialization)

Each specialization defines its mastery domains — the competency map the user sees from day one and works toward across the 180 days. Domains are discipline-specific; the rank ladder (§C.2) applies within each domain.

Worked examples (Elite Mastery OS spec):

- **Soccer Fitness:** acceleration, deceleration, lower-body strength, endurance, agility, movement knowledge.
- **Muscle Building Fitness:** resistance technique, progressive overload, exercise selection, recovery knowledge, measurable strength development.
- **Older Adult Fitness:** functional strength, balance, mobility, walking capacity, confidence with everyday movement.

A user may be advanced in one domain and still foundational in another. Domain definitions — including which assessments gate each domain — are reviewed curriculum content (Doc 17 lifecycle). A specialization cannot ship without its domain map.

### C.4 Mastery gates

Every rank in every domain requires **all** of the following. A gate is a deterministic checklist; partial completion grants nothing.

| # | Gate component | Evidence source |
|---|---|---|
| 1 | Completed prerequisites | Prior rank in the domain (or Entry baseline assessment); required lessons completed |
| 2 | Knowledge assessment | Quiz / module assessment at the rank's threshold (Engine 14, §B) |
| 3 | Physical / functional assessment | Phase or rank assessment scored against the published rubric (Engine 9, Doc 23) |
| 4 | Demonstration evidence | Video / photo / log where the protocol requires it (portfolio-linked) |
| 5 | Consistency & safe execution | Adherence window met; no unresolved safety flags; safe execution observed |

Gate evaluation is deterministic code (`POST /mastery/gates/evaluate` consumes assessment results, quiz attempts, adherence, and safety state; returns pass/fail per component with reasons). AI may draft feedback text; it never adjudicates a gate.

**On fail:** the user receives a **targeted improvement plan** — which components failed, which lessons and drills address them, and a reassessment date — plus an **opportunity to reassess**. Failing a gate never removes access to safe daily activity: training continues at the demonstrated level.

### C.5 Achievement records

```json
{
  "achievement_id": "ach.soccer-fitness.agility.practitioner",
  "user_id": "u_123",
  "specialization": "soccer-fitness",
  "domain": "agility",
  "rank": "Practitioner",
  "gate_evidence": {
    "prerequisites": ["rank.foundation.agility"],
    "knowledge": ["qa_456"],
    "physical": ["asmt_abc123"],
    "demonstration": ["port_vid789"],
    "consistency": {"window_days": 28, "adherence": 0.82}
  },
  "label": "Practice-Engine achievement",
  "granted_at": "2026-10-11T14:00:00Z",
  "revoked_at": null
}
```

- Achievements reference evidence IDs — auditable and revocable; withdrawing evidence revokes the achievement with the audit trail retained.
- Verified vs. unverified (Doc 23): `verified` only when scored against the published rubric.
- Anti-gaming: evidence must come from distinct sessions; practical assignments get human spot-checks; streaks and day counts never grant ranks.

### C.6 Portfolio artifact types

| Kind | Contents | Privacy |
|---|---|---|
| `assessment` | Protocol ref, score, rubric breakdown, date | Private default |
| `demo_video` | User performing a movement | Private default |
| `coaching_video` | User explaining / coaching a movement | Private default |
| `journal` | Text entries, reflections | Private default |
| `photo` | Progress photos | Private default, share is explicit opt-in per item |
| `coursework` | Completed lessons + quiz history | Private |
| `assignment` | Practical assignments + reviewer feedback | Private |

Portfolio is user-owned: exportable (zip of media + JSON manifest) and deletable. Deletion honors Doc 18 §F.10 — media removed; anonymized training history retained per retention policy.

---

## D. Trainer Development (Engine 16) — Elite Mastery OS pathway

The 20% pathway. Opt-in at onboarding (`trainer_ambitions`, Doc 22); can be joined later. It never gates the 80% fitness track.

### D.1 Month-by-month pathway (Elite Mastery OS spec)

| Month | Task | Focus | Evidence |
|---|---|---|---|
| 1 | Learn exercise names, purposes, and fundamental safety | Demonstration basics | Self-review against approved checklists |
| 2 | Explain basic technique and common errors | Communication | 3-cue video/audio explanation per movement |
| 3 | Understand exercise variations and progression | Modification | Case-study quizzes: pick the safe variant and justify |
| 4 | Build simple example training sessions | Programming | 1-week plan built from approved content only; rules-engine validation must pass |
| 5 | Practice coaching explanations and case scenarios | Communication + referral | Coaching drills; referral-scenario quizzes |
| 6 | Assemble a coaching portfolio and complete a knowledge assessment | Portfolio | Portfolio + final knowledge assessment |

Supporting details (preserved):
- **Demonstration:** perform a movement to standard; film; self-review against the approved checklist.
- **Communication:** deliver 3 cues, watch an attempt, correct one error — in plain language.
- **Modification:** "client with knee flag wants to squat — pick the safe variant and justify" (auto-scored against reviewer key).
- **Programming:** the safety filter must pass on any user-built plan, or it is rejected with reasons.
- **Scope of practice:** study the hard-boundary list (§D.3); the boundaries quiz requires ≥ 90%.
- **Referral boundaries:** scenario drills — pain, dizziness, chest pain, prenatal warning signs → choose "refer" with the right script. Failing any referral scenario blocks month-5 completion.

### D.2 Assignment review

AI pre-scores against reviewer checklists; humans review 100% of referral scenarios and spot-check 10% of the rest. Feedback is specific and tied to checklist items — never generic praise.

### D.3 Hard boundary (Doc 17, R7)

- Every certificate, badge, and portfolio entry is labeled **"Practice-Engine achievement"**.
- Banned copy: "certified", "qualified", "accredited", "licensed", or any implication of professional credential.
- Required copy on the pathway page: "Practice-Engine achievements recognize your progress inside this program. They are not professional fitness credentials."
- Badge design must be visually distinct from credential-style seals.

### D.4 Scope-of-practice rule

Completing the internal pathway does **not** authorize the user to coach vulnerable populations (children, prenatal/postpartum users, older adults with fall risk, adaptive-needs users) or to practice beyond recognized professional scope. The product never presents pathway completion as a qualification to coach others professionally.

---

## E. Data model

```ts
// lessons: reviewed content refs (Doc 17 content_items); this table is the learning index
lessons {
  id uuid PK, content_id text unique, version text,
  title text, objective_ids text[], specializations text[],
  phase int, formats text[], estimated_min int,
  prerequisites text[]            // lesson content_ids
}

// quizzes: authored question sets
quizzes {
  id uuid PK, content_id text unique, version text,
  lesson_id FK nullable,          // null for module-level quizzes
  questions jsonb,               // [{stem, options[], correct_index, objective_id}]
  pass_threshold int default 70
}

// quiz_attempts: every attempt is evidence (feeds the knowledge gate, §C.4)
quiz_attempts {
  id uuid PK, quiz_id FK, user_id FK,
  kind text default 'quiz',       // quiz | explanation
  answers jsonb, score int, passed bool,
  ai_prescore jsonb nullable,     // explanations only
  attempted_at timestamp
}

// competencies: rolling knowledge state per objective
competencies {
  user_id FK, objective_id text,
  knowledge_score int,            // 0-100, weighted rolling
  streak int default 0, next_review date nullable,
  misunderstood bool default false,
  PRIMARY KEY (user_id, objective_id)
}

// mastery_gates: reviewed content — rank requirements per specialization/domain (Doc 17 lifecycle)
mastery_gates {
  id uuid PK, specialization_id FK,
  domain text,                   // mastery domain slug, e.g. "agility"
  rank text,                     // one of the 7 ranks (§C.2)
  prerequisites jsonb,           // prior ranks / lessons required
  knowledge_assessment_ids text[],  // Engine 14 quiz/module ids at threshold
  physical_assessment_ids text[],   // Engine 9 assessment content_ids
  demo_evidence_required bool,
  consistency_rule jsonb,        // {window_days, min_adherence}
  version text
}

// portfolio_items: user-owned artifacts
portfolio_items {
  id uuid PK, user_id FK,
  kind text,                     // assessment | demo_video | coaching_video | journal | photo | coursework | assignment
  title text, media_urls text[], privacy text default 'private',
  evidence_refs text[],          // links to quiz_attempts / assessments / scheduled_sessions
  reviewer_feedback text nullable,
  created_at timestamp
}

// achievements: rank grants, evidence-linked, per domain
achievements {
  id uuid PK, user_id FK,
  specialization text, domain text,
  rank text,                     // one of the 7 ranks (§C.2)
  gate_evidence jsonb,           // per-component evidence refs (§C.5)
  label text default 'Practice-Engine achievement',
  granted_at timestamp,
  revoked_at timestamp nullable
}

// trainer_assignments: Engine 16 coursework
trainer_assignments {
  id uuid PK, user_id FK, month int,   // 1–6 (§D.1)
  status text default 'assigned', // assigned | submitted | reviewed | passed | failed
  submission_refs text[], ai_prescore jsonb nullable,
  reviewer text nullable, reviewer_notes text nullable,
  reviewed_at timestamp nullable
}
```

Relations: `quizzes.lesson_id → lessons`; `quiz_attempts → competencies` (score aggregation); `mastery_gates` join `assessments` (physical) and `quizzes` (knowledge); `achievements.gate_evidence` references `quiz_attempts` / `portfolio_items` / `assessment_results`; `portfolio_items.evidence_refs` link back to training and learning records. Privacy is enforced at read time — `private` items never leave the user's account without explicit per-item opt-in.

---

## Decision log

- **One lesson per day, paired deterministically.** AI personalizes tone, never selection — same principle as the workout composer (Doc 18).
- **Spaced review is code (SM-2-lite), not an LLM scheduler.** Predictable, testable, cheap.
- **Three progress systems, never one percentage.** Calendar, competency, and earned status are displayed separately; blending them is banned.
- **Exact 7-rank ladder, earned per domain.** Ranks come from gates, never from time served; a user can be Practitioner in one domain and Foundation in another.
- **Gates are deterministic checklists.** Fail → targeted improvement plan + reassessment; never loss of access to safe activity.
- **Achievements reference gate evidence.** Auditable and revocable; withdrawing evidence revokes the rank with a retained audit trail.
- **Portfolio private by default, user-owned, exportable, deletable.** Documentation is for the user first.
- **Trainer pathway is opt-in and never gates fitness progress.** The 80/20 split is structural, not just copy.
- **Trainer pathway follows the spec's Month 1–6 table.** Internal completion never authorizes coaching vulnerable populations or professional-scope practice.
- **Credential boundary is a copy + design rule, not just a disclaimer** (Doc 17, R7).

## Next

- **27 — Master exercise library** (in progress): dedup methodology, catalog stats, review workflow.
- **28 — Forty specializations** (in progress): catalog + composition model; specialization domain maps feed §C.3.
- **29 — Elite Mastery OS alignment** (planned): requirement inventory mapping the Elite Mastery OS spec across docs 17–28.
- **30 — Exercise player & Daily Command Center** (planned): guided session UX, per-set feedback, Today dashboard.
- Then: implementation per the build roadmap (100 prompts / 20 phases).
