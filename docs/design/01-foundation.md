# Batch 1 — Foundation

Status: design  
Owner engine: Practice OS (Engine 1)  
Depends on: nothing  
Unlocks: Batches 2–14  
Push: A  
Repo: evolve `lib/db` + `artifacts/api-server`. Do not rewrite. Do not put truth in `os/` localStorage.

## 1. Purpose

Make PostgreSQL the only system of record, with the coach as the tenant boundary.

After this batch:

- Every row is owned by a coach
- Clerk identity maps to one coach
- Passport exists as a first-class object
- Mutations are validated, authorized, auditable, and idempotent
- Invalid state transitions return `409`
- Dashboards still may read demo data. They must not become the source of truth.

## 2. What exists today (keep)

From `lib/db/src/schema/practice.ts`:

| Table | Keep | Note |
|---|---|---|
| `coach_profiles` | Yes | Becomes the coach row. `user_id` is Clerk id. |
| `experiences` | Yes | Ownership already via `user_id`. Status strings stay until Batch 5. |
| `practice_sessions` | Yes | Same. Completion rules tighten in Batch 3. |
| `knowledge_assets` | Yes | Draft-until-validated stays. |
| `prompt_runs` | Yes | Becomes the seed of AI audit (Batch 12). |
| Intelligence ops / rollups / alerts / rate limits | Yes | Operator telemetry. Not coach truth. |

Already good and must be preserved:

- `user_id` on coach-owned tables
- `client_request_id` unique per user on experiences and practice sessions (idempotency seed)
- Clerk `requireAuth` / `authenticatedUserId`
- Onboarding JSON is additive and optional

Already wrong and must be demoted in this batch (not deleted):

- `practice_score` and `streak` on `coach_profiles` are cached display fields, not source of truth
- Onboarding JSON must not silently become validated expertise
- `os/` Zustand persist is a preview cache only

## 3. Tenant model

```
Clerk user_id
    ↓  1:1
coach_profiles.id          (internal coach_id)
    ↓
every coach-owned row
```

- Practice Engine is individual-first. One Clerk user = one coach.
- `coach_id` in design language = `coach_profiles.id`.
- `user_id` in the database = Clerk subject. Never a display name.
- No org / team tenancy in Batch 1.
- Operators (`requireOperator`) may read intelligence telemetry. They may not write another coach's evidence, scores, or passport.

### Ownership rule

Every protected command:

1. Authenticate (401 if no Clerk user)
2. Resolve `coach_profiles` by `user_id` (404 if missing; create-on-first-login is allowed)
3. Verify the target row's `user_id` equals the session (403 if not)
4. Validate input (400)
5. Apply transition rules (409)
6. Write in a transaction
7. Write audit row in the same transaction
8. Return

Frontend hiding a button is not authorization.

## 4. New and evolved objects

### 4.1 Coach (`coach_profiles`)

Keep current columns. Add only what Foundation requires.

Add:

| Column | Type | Rule |
|---|---|---|
| `status` | `active \| suspended \| closed` | default `active` |
| `capacity_minutes_per_day` | int nullable | from onboarding `development.dailyTimeCommitment` when present |
| `timezone` | text nullable | |
| `created_at` | timestamptz | default now |

Do not add winning definition, advantage, or plan tree here. Those are Batch 2.

Do not treat `practice_score` / `streak` as writable by Settings. Settings may change name, niche, audience, working preferences, timezone, capacity. Settings may not change score, streak, onboarding-completed evidence, or later conditions.

### 4.2 Coach Passport (`coach_passports`)

Passport is not the profile and not onboarding JSON.

Onboarding JSON is a capture buffer.  
Passport is the current operating picture.

```
coach_passports
  id
  coach_id                 unique, FK coach_profiles.id
  user_id                  denormalized for row-level checks
  identity_summary         text
  specialty                text
  audience                 text
  experience_summary       text
  existing_methodology     text
  existing_clients_note    text
  existing_content_note    text
  existing_offers_note     text
  confidence_areas         jsonb string[]
  uncertainty_areas        jsonb string[]
  development_focus        text
  version                  int not null default 1
  source                   'onboarding' | 'coach_edit' | 'system_accrual'
  updated_at
```

Rules:

- One passport per coach
- Created when onboarding completes, or on first login if profile already exists
- Coach may edit narrative fields
- System accrual (skills, evidence counts, maturity) is Batch 13. In Batch 1 the passport does not accrue automatically.
- Deleting a coach closes the account. Passport is not deleted while investigations or evidence exist later. Batch 1: `status = closed` on profile; passport remains.

Seed from existing columns on first create:

```
name, niche, audience, experience_level, goal, development_focus
+ onboarding_data.profileDetails / goals / methodology.discovery
```

### 4.3 Audit log (`audit_log`)

```
audit_log
  id
  coach_id                 nullable (null = operator / system)
  user_id                  nullable
  actor_type               'coach' | 'operator' | 'system' | 'ai'
  action                   text          -- e.g. passport.update
  entity_type              text          -- coach | passport | practice_session | ...
  entity_id                text
  before                   jsonb nullable
  after                    jsonb nullable
  idempotency_key          text nullable
  request_id               text nullable
  created_at
```

Indexes: `(coach_id, created_at desc)`, `(entity_type, entity_id)`, `(idempotency_key)`.

Rules:

- Audit is append-only
- No UPDATE or DELETE from application code
- AI actor is allowed only for draft operations. AI cannot be the actor that validates expertise or changes scores.
- Do not store raw prompts or raw client session transcripts in `before`/`after`. Store field-level diffs and ids.

### 4.4 Idempotency keys (`idempotency_keys`)

Generalize `client_request_id`.

```
idempotency_keys
  user_id
  key                      text
  command                  text          -- e.g. practice.complete
  entity_type
  entity_id
  response_hash            text          -- optional snapshot of result code
  created_at
  primary key (user_id, key)
```

Keep existing unique indexes on `(user_id, client_request_id)` for experiences and practice sessions.

Rule: the same `(user_id, key)` returns the original result. It does not insert a second row, a second audit event, or a second completion.

## 5. Shared schemas

Location (evolve, do not invent a new monorepo):

```
lib/db/src/schema/          tables
lib/shared/src/schemas/     zod contracts used by API + future os/
  ids.ts
  errors.ts
  transitions.ts
  passport.ts
  audit.ts
```

`os/` may import types later. It may not write its own coach table.

### IDs

- Public API ids: string or number matching current serials. Do not migrate serial → uuid in Batch 1.
- All commands accept `idempotency-key` header or `clientRequestId` body. Treat them as the same key.

### Errors

```
400 VALIDATION
401 UNAUTHENTICATED
403 FORBIDDEN
404 NOT_FOUND
409 INVALID_STATE_TRANSITION
409 IDEMPOTENT_REPLAY          -- optional distinct; or return original 200
422 BUSINESS_RULE
429 RATE_LIMITED
500 INTERNAL
```

Body:

```
{
  "error": "INVALID_STATE_TRANSITION",
  "message": "Passport cannot accrue from unvalidated onboarding JSON",
  "entity": "passport",
  "from": "draft_capture",
  "to": "validated_expertise"
}
```

## 6. State transitions (Batch 1)

### Coach

```
active → suspended → active
active → closed
suspended → closed
closed  → (no reopen in Batch 1)
```

### Passport

```
missing → exists          (create)
exists  → exists          (coach_edit | system seed from profile)
```

Forbidden in Batch 1:

```
onboarding_data.methodology.candidates → knowledge_assets.status = validated
onboarding mini-scenario score → practice_score write
Settings PATCH → practice_score | streak
AI output → passport.version bump as "system_accrual"
```

### Existing rows (do not expand until their batch)

Practice session: `created` → `completed` only if `completed_at` was null. Second complete with same idempotency key is replay. Second complete with a new key is `409`.

Experience / knowledge asset status strings stay as-is until Batches 5–6. Batch 1 only enforces ownership and idempotency on them.

## 7. Commands and queries

### Commands

| Command | Who | Writes |
|---|---|---|
| `coach.ensure` | system on first authenticated request | profile if missing |
| `coach.updateProfile` | coach | name, niche, audience, workingPreferences, timezone, capacity |
| `coach.suspend` / `coach.close` | coach or operator | status |
| `passport.create` | system | one row |
| `passport.update` | coach | narrative fields, version += 1, source = coach_edit |
| `audit.append` | system only | never exposed as a public write |

### Queries

| Query | Returns |
|---|---|
| `coach.getMe` | profile + passport summary |
| `passport.get` | current passport |
| `audit.listMine` | coach's own audit, newest first, paged |

No `PATCH /conditions`. No score writes.

## 8. API surface (Foundation only)

Existing Clerk-protected routes stay.

Add or wrap:

```
GET   /api/me
PATCH /api/me
GET   /api/me/passport
PATCH /api/me/passport
GET   /api/me/audit
```

Every mutation requires `Idempotency-Key` when it creates or completes. Profile narrative patches may omit it; repeats are last-write-wins on narrative only.

`GET /home` is Batch 13. Do not add it here.

## 9. Transaction rule

Any command that changes coach or passport:

```
BEGIN
  lock coach row
  apply transition
  write row
  insert audit_log
COMMIT
```

When later batches add events:

```
write entity + event + audit in one transaction
```

Batch 1 does not introduce the event store. It introduces the discipline that will make the event store safe.

## 10. Auth mapping

Keep Replit Clerk.

```
Authorization: Clerk session
user_id = authenticatedUserId(req)
coach = coach_profiles where user_id = that
```

`os/` preview stays auth-off. Preview data is not production truth. When `os/` is pointed at APIs (Batch 13), it uses the same Clerk boundary.

## 11. Framework laws that already apply

From the six individual frameworks, Batch 1 only installs constraints that Foundation can enforce:

- Strategy: do not invent a second coach direction on the profile. One profile, one passport.
- Control: capacity_minutes_per_day is stored, not enforced as WIP yet (Batch 9).
- Execution: hidden work does not exist — audit makes writes visible.
- Reset: `closed` is an end state, not a soft delete of evidence.

Winning definition, WIP cap, and reset inventory are later batches.

## 12. AI limits (Foundation)

AI may not:

- Create a coach
- Close a coach
- Write practice_score or streak
- Mark onboarding JSON as validated expertise
- Append audit as a substitute for a coach action

`prompt_runs` may record that AI drafted passport language. The coach command still has to save it.

## 13. Dashboard reads (no new screens)

| Dashboard | What it may show after Batch 1 |
|---|---|
| Settings → Profile | coach + passport narrative |
| Settings → Account | status, close |
| Help | why 409 / 403 happened |
| Home | nothing new; still preview compute until Batch 13 |

No Foundation dashboard. No Audit dashboard.

## 14. Tests required before Batch 1 is considered designed-complete

- Unauthenticated request → 401
- Coach A cannot PATCH coach B passport → 403
- Second `practice complete` with same `client_request_id` does not insert a second row
- Settings cannot write `practice_score`
- Audit row exists after passport update
- Audit has no update path
- Closed coach cannot `passport.update`
- Operator cannot write another coach's passport
- `coach.ensure` is idempotent per `user_id`

## 15. Out of scope (do not sneak in)

- Event store (Batch 5)
- Objectives / win / plan tree (Batch 2)
- Skills, practice engine rules (Batch 3)
- Clients (Batch 4)
- Conditions (Batch 7)
- Workflows (Batch 9)
- AI gateway (Batch 12)
- `GET /home` (Batch 13)
- Migrating `os/` off localStorage (Batch 13)
- UUID rewrite of existing serial ids

## 16. Implementation note

When code starts (after Push A design is accepted):

1. Additive Drizzle columns + two new tables (`coach_passports`, `audit_log`) + `idempotency_keys`
2. Shared zod in `lib/shared` or next to `lib/db` if a new package is too heavy
3. Wrap existing practice routes with ownership + idempotency checks
4. Do not move `os/` onto these APIs until Batch 13

Batch 1 is done when a coach can load `/api/me`, edit a passport, see an audit line, and fail loudly on a forbidden write.
