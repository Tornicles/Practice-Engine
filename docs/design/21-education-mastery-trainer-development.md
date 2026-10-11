# 21 — Education, Mastery & Trainer Development

**Status:** Design draft · **Date:** 2026-10-11
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11)
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

### B.4 Spaced review (deterministic, SM-2-lite)

```
interval_days = [1, 3, 7, 14, 30]
on pass:  streak += 1; next_review = today + interval_days[min(streak, 4)]
on fail:  streak = 0;  next_review = tomorrow; lesson re-paired
```

Active review queue capped at 10 items; oldest-due first. This is code, not an LLM scheduler.

---

## C. Mastery & Portfolio (Engine 15)

### C.1 Four dimensions

| Dimension | Evidence sources | Measured by |
|---|---|---|
| 1. Physical performance | Assessment results, `progression_state` (Doc 18) | Phase assessments (Engine 9 protocols) |
| 2. Exercise knowledge | `quiz_attempts`, `competencies` | Knowledge scores per objective |
| 3. Consistency & documentation | Adherence, journal entries, evidence uploads | Completion rate, documentation streaks |
| 4. Coaching skills | Practical assignments, demo/coaching videos | Reviewer checklists (feeds Engine 16) |

A user can be advanced in one dimension and beginner in another — dimensions never average into a single score.

### C.2 Achievement rules

- Achievements and ranks are granted **only on assessment evidence** (assessment pass records, checklist sign-offs). **Never on calendar time, day count, streak length, or AI prediction.**
- A user reaching Day 120 without passing assessments holds no rank beyond what evidence supports (brief §3).
- Achievement record references its evidence:

```json
{
  "achievement_id": "ach.squat.practitioner",
  "user_id": "u_123",
  "dimension": "physical_performance",
  "rank": "Practitioner",
  "evidence_ids": ["asmt_abc123", "qa_456"],
  "label": "Practice-Engine achievement",
  "granted_at": "2026-10-11T14:00:00Z"
}
```

- Rank ladder per dimension (reviewer-defined per specialization), e.g. physical: `Foundation → Practitioner → Specialist → Expert-track`. Each rank lists its required evidence explicitly.
- Anti-gaming: evidence must come from distinct sessions; practical assignments get human spot-checks; withdrawn evidence revokes the achievement (audit trail retained).
- All achievements carry the label **"Practice-Engine achievement"** (Doc 17, R7).

### C.3 Portfolio artifact types

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

## D. Trainer Development (Engine 16)

The 20% pathway. Opt-in at onboarding (`trainer_ambitions`, Doc 22); can be joined later. It never gates the 80% fitness track.

### D.1 Curriculum strands

| Strand | What the user does | Evidence |
|---|---|---|
| 1. Demonstration | Perform a movement to standard; film; self-review against the approved checklist | `coaching_video` + self-review |
| 2. Communication | Deliver 3 cues for a movement; watch a partner attempt; correct one error — in plain language | Video or audio submission |
| 3. Exercise modification | Case studies (tap-based): "client with knee flag wants to squat — pick the safe variant and justify" | Quiz-type, auto-scored against reviewer key |
| 4. Basic programming | Build a 1-week plan for a given persona from approved content only; the rules engine validates it (safety filter must pass) | Plan JSON + validation report |
| 5. Scope of practice | Study the hard-boundary list (§D.3); pass the boundaries quiz | Quiz ≥ 90% required |
| 6. Referral boundaries | Scenario drills: pain, dizziness, chest pain, prenatal warning signs → choose "refer" with the right script | Scenario quiz; failing any referral scenario blocks strand completion |

### D.2 Assignment review

AI pre-scores against reviewer checklists; humans review 100% of strand-6 scenarios and spot-check 10% of the rest. Feedback is specific and tied to checklist items — never generic praise.

### D.3 Hard boundary (Doc 17, R7)

- Every certificate, badge, and portfolio entry is labeled **"Practice-Engine achievement"**.
- Banned copy: "certified", "qualified", "accredited", "licensed", or any implication of professional credential.
- Required copy on the pathway page: "Practice-Engine achievements recognize your progress inside this program. They are not professional fitness credentials."
- Badge design must be visually distinct from credential-style seals.

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

// quiz_attempts: every attempt is evidence
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

// portfolio_items: user-owned artifacts
portfolio_items {
  id uuid PK, user_id FK,
  kind text,                     // assessment | demo_video | coaching_video | journal | photo | coursework | assignment
  title text, media_urls text[], privacy text default 'private',
  evidence_refs text[],          // links to quiz_attempts / assessments / scheduled_sessions
  reviewer_feedback text nullable,
  created_at timestamp
}

// achievements: rank grants, evidence-linked
achievements {
  id uuid PK, user_id FK,
  dimension text, rank text,
  evidence_ids text[],           // FKs into quiz_attempts / portfolio_items / assessments
  label text default 'Practice-Engine achievement',
  granted_at timestamp,
  revoked_at timestamp nullable
}

// trainer_assignments: Engine 16 coursework
trainer_assignments {
  id uuid PK, user_id FK, strand int,
  status text default 'assigned', // assigned | submitted | reviewed | passed | failed
  submission_refs text[], ai_prescore jsonb nullable,
  reviewer text nullable, reviewer_notes text nullable,
  reviewed_at timestamp nullable
}
```

Relations: `quizzes.lesson_id → lessons`; `quiz_attempts → competencies` (score aggregation); `achievements.evidence_ids` reference `quiz_attempts` / `portfolio_items` / `assessments`; `portfolio_items.evidence_refs` link back to training and learning records. Privacy is enforced at read time — `private` items never leave the user's account without explicit per-item opt-in.

---

## Decision log

- **One lesson per day, paired deterministically.** AI personalizes tone, never selection — same principle as the workout composer (Doc 18).
- **Spaced review is code (SM-2-lite), not an LLM scheduler.** Predictable, testable, cheap.
- **Achievements reference evidence IDs.** Auditable and revocable; withdrawing evidence revokes the rank with a retained audit trail.
- **Dimensions never average.** A D4 athlete with D1 coaching skills sees both truths, not a blended score.
- **Portfolio private by default, user-owned, exportable, deletable.** Documentation is for the user first.
- **Trainer pathway is opt-in and never gates fitness progress.** The 80/20 split is structural, not just copy.
- **Credential boundary is a copy + design rule, not just a disclaimer** (Doc 17, R7).

## Next

- **19 — Office-Worker Fitness curriculum** (V1): 6 phases, weekly themes, lesson map (feeds §A.3 pairing), assessment checkpoints, trainer-development assignments.
- **20 — Nutrition engines** (10–12).
- **22 — Onboarding & Scheduling** (written in parallel with this doc).
- **23 — Performance assessment protocols** (Engine 9): per-specialization benchmark protocols and scoring rubrics — the evidence §C.2 depends on.
- **24 — Content studio admin** (Engines 17–20 tooling).
- **25 — Platform operations** (Engines 21–24).
- **26 — Technical consolidation** (brief §10).
