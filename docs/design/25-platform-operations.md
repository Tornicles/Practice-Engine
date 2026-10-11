# 25 — Platform Operations

**Status:** Design draft · **Date:** 2026-10-11
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11)
**Depends on:** Doc 17 (safety rules R1–R8, content lifecycle), Doc 18 (composer, readiness, progression); Docs 19–24 (curricula, nutrition, education, onboarding/scheduling, assessments, content studio)
**Engines covered:** 21 (Notifications & Engagement), 22 (Analytics & Recommendations), 23 (Safety, Privacy & Eligibility), 24 (Administration & QA)

> Operations keep the system trustworthy: the right nudge at the right time, numbers that say what was measured, privacy that defaults to closed, and an audit trail for everything staff touch.

---

## A. Engine 21 — Notifications & Engagement

### A.1 Notification types

| Type | Trigger | Priority | Default |
|---|---|---|---|
| `workout_reminder` | Scheduled session in 60 min (Engine 4 schedule) | normal | on |
| `lesson_reminder` | Lesson uncompleted 24h after unlock | normal | on |
| `weekly_review` | Weekly review job completes | normal | on |
| `assessment_due` | Phase assessment scheduled / due in 48h | normal | on |
| `milestone` | Streak, achievement earned, phase completed | normal | on |
| `safety_notice` | Exercise withdrawn affecting user's plan; referral guidance issued | **urgent** | on, not mutable |
| `plan_regenerated` | Plan changed by an event (brief §8) | normal | on |
| `winback` | 7-day lapse with no session | normal | on, separate marketing toggle |

Safety notices are the only urgent type. Everything else waits for quiet hours.

### A.2 Timezone & quiet hours

- Every user has a `tz` (IANA) from onboarding; all scheduling and delivery computed in local time.
- Quiet hours default **21:00–07:00 local**, user-editable. Non-urgent notifications scheduled inside quiet hours are queued and released at quiet-hours end.
- The daily digest (A.4) is delivered at the user's preferred morning time (default 07:30 local).

### A.3 Preference controls

- Per-type toggles: workout reminders, lesson reminders, milestones, weekly reviews, winback.
- Channel selection per type: push / in-app / email (email only for weekly review + safety notices).
- Daily cap: max 3 non-urgent per day (user-adjustable 0–10). Urgent safety notices bypass the cap.
- "Pause all for 7 days" one-tap vacation mode (urgent safety still delivered).
- Preferences live in Profile; changes apply immediately to queued (unsent) items.

### A.4 Delivery rules (anti-spam)

- **Batching:** if >1 non-urgent notification is pending, collapse into a single daily digest ("3 things for today") instead of separate pushes.
- **Dedupe:** same `type + entity` within 24h updates the queued item in place; never resends.
- **Seen-in-app suppression:** no push for an event the user already viewed in-app in the last 15 min (e.g. don't push `plan_regenerated` while they're looking at the new plan).
- **Fan-out:** timezone-aware cron; per-user release, not a global blast.
- Every notification carries a deep link to the relevant screen (`today`, `session/:id`, `assessment/:id`, `profile/notifications`).

### A.5 Data model (notifications)

```
notification_prefs {
  id uuid PK, user_id FK UNIQUE,
  tz text not null, quiet_start time default '21:00', quiet_end time default '07:00',
  toggles jsonb,          // { workout_reminder: true, winback: false, ... }
  channels jsonb,         // { weekly_review: ["push","email"], ... }
  daily_cap int default 3, digest_time time default '07:30',
  paused_until timestamptz nullable
}

notifications {
  id uuid PK, user_id FK,
  type text not null, title text, body text, deep_link text,
  priority text default 'normal',               // normal | urgent
  status text default 'queued',                // queued | sent | read | dismissed | expired
  dedupe_key text UNIQUE,                      // type:entity:day
  batch_group uuid nullable,                   // digest grouping
  scheduled_for timestamptz, sent_at timestamptz nullable,
  created_at timestamptz default now()
}
```

---

## B. Engine 22 — Analytics & Recommendations

### B.1 Metric catalog

| Metric | Definition | Source tables |
|---|---|---|
| Workout adherence | completed ÷ planned sessions, rolling 7/30d | `scheduled_sessions` |
| Learning completion | lessons + quizzes completed ÷ unlocked | education tables (Doc 21) |
| Physical performance | assessment scores over time; promotions granted | `assessments`, `progression_state` |
| Food-journal usage | entries/week; AI-suggestion confirmation rate | nutrition tables (Doc 20) |
| Specialization retention | % active at day 30 / 90 / 180, per track | `events`, sessions |
| Content effectiveness | per-content completion, confusion flags, quiz pass rates | `completed_sets`, feedback, quizzes → feeds Engine 20 |
| Safety load | pain reports per 1,000 sessions; referral rate; withdrawals | `safety_events` |

### B.2 Measured vs. predicted — hard rule

- Every number on every dashboard is labeled **MEASURED** (from `completed_sets`, assessments, check-ins, confirmed food entries) or **PREDICTED / ESTIMATED** (AI projections, e.g. "at this pace you'll…").
- The two are never mixed on one trend line. AI "progress interpretation" outputs render with an "estimated" badge and a confidence note.
- Achievements and promotions consume MEASURED only (Doc 17, R8). No credential, rank, or difficulty change is ever granted on a prediction.

### B.3 Dashboards: staff vs. user

**User-facing (Progress tab):** adherence ring, streak, assessment trend lines (measured), per-exercise progression, portfolio highlights. No raw event streams, no other users' data, no predictions presented as facts.

**Staff:** aggregate retention by track/phase, content-effectiveness tables (drives Engine 20 review tasks), safety-load monitors, cohort comparisons. Per-user support view exists but every view is access-logged (see §D.4) and requires an open ticket.

### B.4 Recommendations

Analytics produces *recommendations to review queues*, never auto-applied changes:
- "Office-Worker track stalls at week 5 (adherence −22%)" → curriculum review task.
- "Quiz `qz.protein-basics` pass rate 41%" → lesson review task.
- "Pain reports 3× baseline on `ex.overhead-press`" → immediate safety triage (Doc 17, A.6).

---

## C. Engine 23 — Safety, Privacy & Eligibility

### C.1 Age gates & guardian consent

- Age band collected at onboarding; `risk_tier = elevated` tracks (kids, prenatal, older-adult, medically complex) get extra gates everywhere (Doc 17, R1).
- Under-13: kids track only. 13–17: **guardian consent required before training starts** — consent record `{ guardian_id, relationship, scope, granted_at, method }`.
- Consent states: `pending | granted | withdrawn`. Withdrawn → training features paused immediately; account keeps access to settings/deletion.
- Elevated-tier users re-confirm eligibility at each phase boundary (one tap, logged).

### C.2 Media privacy controls

- Progress photos/videos default **PRIVATE**. Sharing is opt-in **per item**: `private | coach_visible | community_visible`.
- Switching an item back to private revokes all derived shares immediately (signed URLs invalidated).
- No facial recognition anywhere; optional background blur on capture. Other people in frame → user warned at capture time.

### C.3 Data retention

| Data | Retention |
|---|---|
| Training history (sets, reps, assessments, progression) | Account lifetime + 30d after deletion request; anonymized aggregates may persist |
| Evidence media (photos/videos) | Until user deletes; auto-purge after 2y inactive with 30d notice |
| Safety events | 7y (safety/legal audit), access-logged, never user-deletable |
| Notification log | 90d |
| Audit logs | 7y, immutable, append-only |

### C.4 Deletion flows

- **Single evidence item:** media bytes + thumbnails + CDN copies deleted ≤ 24h; derived counts (e.g. "12 sessions") retained; audit entry records the deletion. User gets a receipt.
- **Full account deletion:** profile, media, notifications, prefs deleted ≤ 30d; safety events and audit logs retained in anonymized/legal-hold form; training aggregates anonymized. Deletion is a **job with visible states** (`requested → processing → verified → confirmed`), not a flag flip.
- Deletion of a guardian-consented minor's account can be initiated by the guardian.

### C.5 Access permissions

| Role | Sees | Constraint |
|---|---|---|
| user | own data | — |
| guardian | minor's training + media | consent scope only |
| coach (trainer pathway) | explicitly shared items | per-item share grants |
| support | per-user view | open ticket required; time-boxed; every view logged |
| content reviewer | content only | no user PII |
| admin | all | MFA required; every access logged |

Least privilege by default; support access expires with the ticket.

---

## D. Engine 24 — Administration & QA

### D.1 Subscriptions & entitlements

- Products defined as data (not hardcoded): Free / Plus / Pro with feature flags.
- `entitlements` checked at request time (cached ≤ 5 min): e.g. `ai_personalization`, `offline_downloads`, `advanced_assessments`, `priority_support`.
- Cancel → downgrade at period end; grace period 7d on failed payment before entitlement loss; proration handled by the payment provider, reflected in `subscriptions`.

### D.2 AI usage & cost monitoring

- Every AI call logged: capability, model, tokens in/out, latency, cost, cache hit/miss, (hashed) user_id.
- Budgets per capability (daily/monthly); alerts at 70 / 90 / 100%; at 100% the circuit breaker trips → templates/cache fallback (Doc 17, C.5), admin paged.
- Dashboard: cost per user, per capability, cache-hit rate, anomaly detection on spend spikes.

### D.3 System health

- Checks: API p95 latency, composer generation time, job queue depth/lag, CDN error rate, DB replication lag, AI provider status, storage quota.
- Failing checks page on-call and feed the failsafe behaviors (AI down → cached plans; queue lag → shed non-urgent notifications first).
- Public status page for provider-level incidents.

### D.4 Audit logs

Append-only, DB-enforced (revoke UPDATE/DELETE on the table):

```
audit_logs {
  id uuid PK, occurred_at timestamptz default now(),
  actor_id uuid, actor_role text, action text,
  entity_type text, entity_id text, diff jsonb,
  ip inet nullable
}
```

Covered: content lifecycle transitions, withdrawals, safety overrides, plan regenerations, entitlement changes, support access grants, privacy/share changes, deletion jobs, consent grants/withdrawals.

### D.5 Support & safety escalation queues

- **Support queue:** ticket-scoped access (§C.5), SLA by severity (P1 4h / P2 1d / P3 3d).
- **Safety escalation queue:** pain-report clusters, referral events, content flags. Triaged by the safety reviewer per Doc 17 §A.4 SLAs; **bypasses normal support priority** — safety-critical items go same-business-day regardless of queue depth.

---

## E. Operations data model (summary)

```
events {                       // domain event log — system of record for cross-engine comms
  id uuid PK, type text, actor text,            // user | system | reviewer
  entity_type text, entity_id text,
  payload jsonb, occurred_at timestamptz default now()
}
// index: (type, occurred_at), (entity_type, entity_id)

subscriptions {
  id uuid PK, user_id FK, product text, status text,   // active | past_due | canceled
  current_period_start timestamptz, current_period_end timestamptz,
  cancel_at_period_end bool default false
}

entitlements {
  user_id FK, feature text, granted_at timestamptz, expires_at timestamptz nullable,
  source text,                              // subscription | promo | manual
  PRIMARY KEY (user_id, feature)
}
```

Relations: users 1—1 `notification_prefs`; users 1—N `notifications`, `subscriptions`, `events`; `audit_logs` references entities polymorphically and is never updated or deleted.

## F. Decision log

- **Quiet hours default ON; urgent = safety only.** A fitness app that buzzes at 2am loses trust permanently.
- **Digest batching over per-event pushes.** One useful morning summary beats five interruptions.
- **Measured vs. predicted is a hard product rule**, enforced in the analytics pipeline — not a copy guideline.
- **Deletion is a verifiable job with a receipt**, not a flag flip the user has to trust.
- **Audit logs are DB-enforced append-only** (revoked UPDATE/DELETE), not application convention.
- **Safety queue bypasses support priority.** A pain-report cluster never waits behind billing tickets.

## G. Next

- **26 — Technical Architecture:** job catalog (notification fan-out, analytics rollup, deletion verification), event-log infrastructure, admin interface topology implementing the dashboards and queues above.
