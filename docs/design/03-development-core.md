# Batch 3 — Development Core

Status: design  
Owner engine: Coach Development (Engine 2)  
Depends on: Batch 1 (coach, audit, idempotency), Batch 2 (strategy lock, development objectives)  
Unlocks: Batches 4, 5, 7  
Push: Push A (with Batches 1–2)

## 1. Purpose

Turn direction into capability work the system can score without lying.

After this batch:

- Skills have current level, target, evidence count, confidence
- Development focus is the largest proven gap, or a coach override that is labeled as override
- Practice and simulation are stored attempts with scores
- Assessment is a distinct object, not a synonym for a practice score
- Score, confidence, and evidence sufficiency are three different fields
- A high score with weak evidence is not competence

This batch does not create experience lineage, conditions, or workflows.

## 2. Core laws

- No data is not poor performance
- One attempt is an observation, not a pattern
- Settings cannot write skill scores
- AI may simulate and propose scores; the engine records them as `ai_draft` until accepted or replaced by rubric
- `practice_score` and `streak` on `coach_profiles` remain cached display fields. Development Engine is the source of skill truth
- Development focus must serve the active win when a strategy is locked (Batch 2). If no lock exists, focus may be set from gaps alone

## 3. What exists today

Keep and wrap:

- `practice_sessions` (`scenario`, `category`, `score`, `feedback`, `completed_at`, `client_request_id`)
- Profile `development_focus`
- Onboarding `skillRatings` (1–5) as **self-report baseline only**
- `os/` keys: `listening`, `questioning`, `reframing`, `challenge`

Add accountability as an optional catalog skill. Do not drop the four core keys.

Self-report is `source = self_report`. It never sets `confidence = high`.

## 4. Objects

### 4.1 Skill catalog

Platform-defined. Not coach-authored in Batch 3.

```
skill_definitions
  key                       listening | questioning | reframing | challenge | accountability
  label
  default_target            int 0–100
  active                    bool
```

### 4.2 Skill state (per coach)

```
skill_states
  id
  coach_id
  skill_key
  current_level             int 0–100
  previous_level            int 0–100
  target_level              int 0–100
  evidence_count            int
  confidence                none | low | medium | high
  sufficiency               insufficient | weak | moderate | strong
  trend                     insufficient_data | improving | declining | stable
  last_observation_at
  unique (coach_id, skill_key)
```

`current_level` is a projection from observations, not a Settings field.

Confidence vs sufficiency:

| Evidence count | confidence | sufficiency |
|---|---|---|
| 0 | none | insufficient |
| 1–2 | low | weak |
| 3–7 | medium | moderate |
| 8+ | high | strong |

Trend requires at least two observations. Otherwise `insufficient_data`.  
Do not invent `volatile` / `recovering` until Batch 7.

### 4.3 Competency

A competency is a bundle of skills used in a context. Optional in Batch 3; schema exists so Client delivery can attach later.

```
competencies
  id
  coach_id
  name                      e.g. Discovery under resistance
  skill_keys                jsonb
  target_level
  status                    draft | active
```

### 4.4 Development focus

```
development_foci
  id
  coach_id
  skill_key
  source                    gap | coach_override | objective
  objective_id              nullable
  reason
  active                    bool
  set_at
```

At most one `active` row.

Command `development.setFocus`:

- Default: skill with max `(target - current)` among those with sufficiency ≥ weak
- If all insufficient, source must be `coach_override` or `objective`. Gap algorithm must not pretend a winner
- If strategy is locked, focus that cannot serve the win → `422`

Sync `coach_profiles.development_focus` as a label copy only.

### 4.5 Practice attempt

Evolve `practice_sessions`. Do not fork a second practice table.

Add columns (additive):

```
kind                        practice | simulation     default practice
skill_key                   text nullable
difficulty                  int 1–5
status                      draft | in_progress | completed | abandoned
scores                      jsonb    { listening, questioning, reframing, challenge, overall }
strengths                   text
weaknesses                  text
transcript                  jsonb    [{ role, text }] nullable
score_source                rubric | heuristic | ai_draft | coach
assessment_id               nullable FK
```

Existing `score` remains overall cache. Existing `category` maps to `skill_key` when possible.

Transitions:

```
draft → in_progress → completed
draft → in_progress → abandoned
```

Forbidden:

```
draft → completed without in_progress unless kind = practice and no turns required
completed → completed with a new idempotency key   (409)
abandoned → completed
```

Complete requires:

- `idempotency-key` / `client_request_id`
- at least one score or an explicit `skipped` path from onboarding only
- `score_source` set

Completing writes:

- session row
- one `skill_observation` per scored skill
- audit
- idempotency key

No event store yet. Observation row is the stand-in until Batch 5 promotes it to an Event.

### 4.6 Simulation

Same table, `kind = simulation`.

Rules:

- AI may play the client and propose scores (`score_source = ai_draft`)
- Coach or rubric must accept before observations affect `confidence = high`
- `ai_draft` observations count toward evidence_count but cap confidence at `low` until accepted

Command `simulation.acceptScores` flips `ai_draft` → `rubric` or `coach` and recomputes state.

### 4.7 Assessment

Distinct from a practice row.

```
assessments
  id
  coach_id
  type                      knowledge | simulation | practice | live_session
  skill_key                 nullable
  status                    draft | ready | started | completed | evaluated
  source_session_id         nullable FK practice_sessions
  overall_score             int nullable
  confidence
  sufficiency
  evaluator                 rubric | coach | ai_draft
  notes
  created_at
  evaluated_at
```

Transitions:

```
draft → ready → started → completed → evaluated
```

Forbidden:

```
draft → evaluated
completed → evaluated if evaluator = ai_draft and type = live_session
AI cannot move an assessment to evaluated for live_session
```

A completed simulation may spawn `type = simulation` assessment. That is a link, not a duplicate score owner. Skill state reads observations, not the assessment row. Assessment is the judgment record.

### 4.8 Observation

```
skill_observations
  id
  coach_id
  skill_key
  score                     int 0–100
  source_type               self_report | practice | simulation | assessment | session
  source_id
  score_source              rubric | heuristic | ai_draft | coach
  note
  created_at
```

Batch 4 will add `session`. Do not attach live client observations here yet.

Projection rule for `skill_states.current_level`:

- Use accepted observations only (`score_source != ai_draft`) when any accepted exist
- Else use `ai_draft` and keep confidence ≤ low
- Current = most recent accepted score
- Previous = second most recent accepted score

Do not average all history into current. History is for Batch 7 trends.

## 5. Development focus algorithm

```
for each skill_state:
  gap = max(0, target - current)
  if sufficiency == insufficient: skip
pick max gap
if none: require override
if strategy locked: reject if focus arena exclusions say this work is out of bounds
```

Focus does not create practice rows. It only names what Batch 9 will later turn into a workflow.

## 6. Commands and queries

```
skills.list
skills.recompute           -- system; after observation write

focus.set
focus.getActive

practice.start
practice.complete
simulation.start
simulation.turn            -- append transcript; AI client is Batch 12 plumbing
simulation.complete
simulation.acceptScores

assessment.create
assessment.start
assessment.complete
assessment.evaluate
```

Queries:

```
GET /api/development/skills
GET /api/development/focus
GET /api/development/practice
GET /api/development/simulations
GET /api/development/assessments
```

Dashboard aggregation `GET /api/development` is Batch 13. These list endpoints are enough for Development tabs.

## 7. API errors

- Complete already-completed session with new key → `409 INVALID_STATE_TRANSITION`
- Replay same key → original result
- Evaluate live assessment as AI → `422`
- Set focus while all skills insufficient without override → `422`
- Settings PATCH skill current_level → `403` / no route
- Score > 100 or < 0 → `400`

## 8. Transaction

`practice.complete`:

```
BEGIN
  lock session
  transition to completed
  insert observations
  recompute skill_states for those keys
  insert audit
  insert idempotency_keys
COMMIT
```

If Batch 5 event store exists later, `PRACTICE_COMPLETED` joins this transaction. Do not add the events table now.

## 9. Dashboard reads

| Area | Reads |
|---|---|
| Development → Overview | skill states, active focus, latest assessment |
| Development → Practice | practice rows |
| Development → Assessments | assessment rows |
| Home | active focus + weakest skill with sufficiency |
| Settings → Development | target_level and override focus only |
| Help | difference between score, confidence, sufficiency |

No Skills dashboard. No Simulation dashboard. Simulation is a Practice tab filter (`kind`).

## 10. AI limits

May:

- Play simulated client
- Propose scores as `ai_draft`
- Draft assessment notes

May not:

- Write `skill_states.current_level` directly
- Set confidence high
- Evaluate a live_session assessment
- Mark development focus as “mastered”
- Treat onboarding 1–5 ratings as current_level

## 11. Framework map

| Framework | Installed now |
|---|---|
| Strategy | Focus must serve locked win |
| Execution | Practice has a finish condition (`completed`) |
| Intelligence | Observation ≠ pattern. Trend needs two points |
| Control | No score writes from Settings |
| Growth | Not used |
| Reset | Abandoned practice is an end. It does not delete observations |

## 12. Tests

- Self-report does not yield confidence high
- Zero observations → sufficiency insufficient, not declining
- One simulation ai_draft → evidence_count 1, confidence low
- acceptScores then second accepted observation → trend computes
- Double complete same key → one row
- Double complete different key → 409
- Settings cannot change current_level
- AI cannot evaluate live_session
- Focus gap picker skips insufficient skills
- Locked strategy rejects a focus outside arena exclusions
- Cached `coach_profiles.practice_score` changing does not change skill_states

## 13. Out of scope

- Client session observations (Batch 4)
- Experience / evidence objects (Batch 5)
- Condition rules (Batch 7)
- Practice workflows and WIP (Batch 9)
- AI gateway routing (Batch 12)

## 14. Done when

A coach can run a simulation, accept scores, see four skill states with separate confidence, and set a development focus from a real gap. Home still uses preview compute until Batch 13, but the API already holds the truth.

## 15. Push A contents

This file ships with:

- `docs/design/01-foundation.md`
- `docs/design/02-objectives-and-planning.md`
- `docs/design/03-development-core.md`
- `docs/design/README.md`

No schema migration in Push A unless already approved. Push A is design only.
