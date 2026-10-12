# 26 — Technical Architecture

**Status:** Design draft · **Date:** 2026-10-11
**Amendment (2026-10-11):** aligned to the Elite Mastery OS spec — mobile navigation is the 5 primary destinations (§B); AI coach behavior table added (§D.1).
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11), §10 (Technical connections)
**Depends on:** Docs 17–25 (all engine designs)
**Engines covered:** Cross-cutting — consolidation target for all 24 logical engines

> One mobile product, one backend, one admin interface. The 24 engines are logical services inside that topology — not 24 servers, not 24 agents.

---

## A. Consolidation target

Current sprawl: `os/` (React web app), `artifacts/` (Express API + Drizzle, React web app, Expo mobile app), `forge-web/` prototype builds, standalone HTML prototypes. Target:

| Surface | Target | Notes |
|---|---|---|
| Mobile product | **One Expo app** (SDK 57 lineage from `artifacts/mobile/`) | The only user-facing client |
| Backend | **One API + worker fleet** (Express + Drizzle lineage from `artifacts/`) | All 24 engines as modules/services |
| Admin interface | **One web app** | Content studio (Doc 24) + ops dashboards (Doc 25) |

Migration principle (brief §12, batch 1): audit the repo, port features worth keeping, retire the rest. No parallel clients shipping the same feature twice. Prototype HTML builds stay as reference, not products.

## B. Mobile app — 5 primary destinations

| Destination | Contains | Key engines |
|---|---|---|
| Today | Daily mission, workout, lessons, food, recovery — the mission-control dashboard: day X of 180, phase, streak, journey %, primary mission + time, knowledge mission, evidence mission, nutrition nudge, recovery check-in | 4, 6, 8, 10, 13 |
| Masteries | 40 specializations browser, active blueprint, competency map, rank requirements, upcoming + completed assessments, achievements | 2, 9, 15 |
| Journal | Workout history, food photos, videos, notes, reflections | 10, 15 |
| Progress | Physical metrics (measured-only), milestones, knowledge progress, portfolio | 9, 15, 22 |
| Profile | Goals, equipment, schedule, safety preferences, notification prefs, privacy/sharing, subscription, consent, data deletion | 21, 23, 24 |

Rules:
- **Onboarding is a gated full-screen flow, not a destination** — the 8 screens (Doc 22, §A.1) show until the profile is complete; afterwards it is re-enterable only via Profile.
- **Once enrolled, the current mastery path is the center of the experience.** The app does not overwhelm the user with all 40 specializations every day. Masteries opens on the active discipline — competency tree, rank requirements, upcoming assessments, completed achievements — with the full catalog one tap away.
- Offline: downloaded workouts/lessons remain fully usable; evidence and feedback queue locally and sync on reconnect (last-write-wins, conflicts logged, never silent data loss).

## C. Backend services

| Service / module | Responsibility |
|---|---|
| Auth | Clerk (repo convention); session + MFA for admin roles |
| Users & profiles | Profile, eligibility, flags, equipment, schedule, prefs, consent records |
| Curriculum scheduling | Phase/week/day derivation, assessment scheduling, calendar (Engines 2, 4) |
| Exercise selection (Composer) | Doc 18 pipeline — deterministic filter → readiness → curriculum → variety → load → AI personalization |
| Safety rules engine | **Versioned library** embedded in API + workers (not a network hop — hot-path latency and testability). Evaluated at every Doc 17 §C.1 point; version pinned on plans |
| Evidence processing | Media ingest, thumbnails, privacy flags, checksums; queued jobs |
| Subscriptions | Products, entitlements, webhooks from payment provider |
| API gateway | Versioned REST (`/v1/...`), auth, rate limits, entitlement checks, request logging |

### C.1 Event-driven core — domain events (brief §8)

Single `events` table (Doc 25, §E) as the log; Postgres LISTEN/NOTIFY or a job queue for dispatch in V1 (no Kafka). At-least-once delivery; consumers idempotent on `event_id`. Envelope: `event_id, type, occurred_at, actor, entity_type, entity_id, payload, schema_version`.

| Domain event | Producer | Consumers | Payload keys |
|---|---|---|---|
| `equipment.updated` | Profile service | Composer (regenerate), Analytics | `user_id, equipment[]` |
| `schedule.changed` | Profile service | Scheduler, Composer (re-budget) | `user_id, time_available_min, days[]` |
| `pain.reported` | Workouts (feedback) | Safety engine (R3 pathway), Composer (regen), Notifications (urgent if severe), Analytics, Content intel (flag item) | `user_id, content_id, location, severity` |
| `sessions.missed` (5) | Weekly review job | Progression (restart plan), Notifications (winback) | `user_id, missed_count` |
| `performance.improved` | Progression eval | Progression (consider promotion at next review) | `user_id, exercise_id, evidence` |
| `specialization.changed` | Profile service | Curriculum loader, Composer (regen) | `user_id, old, new` |
| `food_prefs.changed` | Food service | Nutrition planning | `user_id, prefs` |
| `exercise.withdrawn` | Content studio | Plan-regeneration job, Notifications | `content_id, version, reason` |
| `ai_provider.down` | Health checks | Failsafe mode (cache/templates), Admin alerts | `capability, since` |
| `connectivity.offline` | Mobile client | Sync queue (local) | `queued_ops[]` |

## D. AI services — one orchestration layer

The 6 capabilities from brief §11 behind a single orchestrator:

| Capability | Used by | Fallback when AI down |
|---|---|---|
| Plan generation (personalization layer) | Composer §A.3.6 | Deterministic ordering + default cues |
| Coaching explanation | Workouts / Learning Q&A | Approved FAQ / lesson text |
| Food vision | Food capture | Manual entry form |
| Educational authoring | Content studio drafts | Human-authored templates |
| Progress interpretation | Progress summaries | Measured-only charts, no narrative |
| Content assistance | Studio (tagging, captions, gap detection) | Manual tagging; gaps from analytics |

Orchestrator duties: route by capability, inject **approved content IDs + structured user data only**, validate structured outputs against contracts (Doc 17, R8 — AI can never publish, override safety, grant achievements, or invent exercises), log every call (Doc 25, §D.2).

### D.1 AI coach behavior (Elite Mastery OS, Part 11)

The AI coach is integrated into the workflow, not a disconnected chatbot. It understands the user's selected specialization, approved exercise curriculum, recent sessions, learning progress, preferences, and documented limitations.

| Situation | AI action |
|---|---|
| User asks how to perform a movement | Retrieves the approved demonstration and explains the technique |
| Exercise is too difficult | Offers an eligible regression |
| Workout was missed | Rebuilds the schedule without stacking punishment workouts |
| User asks about food | Uses confirmed food preferences and relevant nutrition guidance |
| User wants to improve a skill | Explains the competency gap and available practice |
| User submits evidence | Produces a tentative structured analysis where supported |
| User asks about a milestone | Explains the exact assessment requirements |

**Hard boundary: the AI coach must not override exercise eligibility and safety rules** (Doc 17, R1–R8). Every coaching action — explanation, regression offer, schedule rebuild, food answer — runs through the safety filter before reaching the user. Tentative analyses are labeled as such and never substitute for professional assessment.

**Cost-control rules:**
- Deterministic templates + cache serve all routine ops (reminder copy, standard cues, cached plans, FAQ answers). AI is called only where interpretation or personalization is genuinely needed.
- Cache keys include content versions — a content update busts the cache; a software deploy does not.
- Per-capability budgets with 70/90/100% alerts and circuit breaker → fallback (Doc 25, §D.2).

## E. Data & media

- **Postgres** (Drizzle ORM, repo convention): Doc 17 schemas (specializations, exercises, variants, media, contraindications, content lifecycle, curricula, assessments) + Doc 18 (sessions, completed sets, progression state, check-ins, safety events) + Doc 25 (notifications, prefs, events, subscriptions, entitlements, audit logs). Migrations versioned with the backend.
- **Object storage** (S3-compatible): demo videos + images in public CDN-backed buckets (cache-busted on content version change); evidence media in **private buckets, signed URLs with short expiry**, per-item privacy flags enforced at URL issuance.
- **CDN** for public demo content; thumbnails generated at ingest.
- **Background jobs catalog:** `daily_summary`, `weekly_review`, `phase_boundary`, `scheduled_publishing`, `plan_regeneration`, `notification_fanout`, `deletion_verification`, `analytics_rollup`, `content_staleness_scan`, `ai_spend_rollup`.
- **Event log** (`events` table) is the system of record for cross-engine communication (§C.1).
- **Analytics pipeline:** events → rollup tables (V1, in Postgres) → dashboards; measured-vs-predicted labeling enforced at the pipeline (Doc 25, §B.2), not in the UI layer.

## F. Admin interface

Two halves, one login, role-gated (Doc 25, §C.5):

- **Content studio** (Doc 24): curriculum builder, exercise editor, media upload/management, review queues, publishing calendar, versioning, content-intelligence flags.
- **Ops dashboards** (Doc 25): subscriptions/entitlements, AI usage + cost + budgets, system health, audit log explorer, support queue, safety escalation queue.

## G. Update-type separation (brief §17)

| Update type | Trigger | Owner | Versioning rule |
|---|---|---|---|
| User-plan update | New performance, food log, schedule, limitation | Rules + AI | New `plan_id`; old plans immutable |
| Content update | New lesson, correction, curriculum revision | Content team + reviewer | Content versions; MAJOR triggers plan regeneration |
| Software update | Bug fix, feature, security | Dev team | Semver deploys |

**The rule: a software release never silently changes approved content.** Deploys don't touch published content versions; composer behavior changes are versioned and the `composer_version` + `rules_engine_version` are pinned on every plan, so any plan can be traced to the exact code and rules that generated it. The three update types move independently.

## H. Non-functional requirements

| Area | Target |
|---|---|
| Composer generation | 2–10 s server-side; cached plan served immediately when inputs unchanged |
| Food photo analysis | 3–15 s (provider-dependent) |
| API p95 | < 300 ms (excluding AI calls) |
| Notification fan-out | < 5 min from trigger |
| Offline | Full workout + lesson use; queued sync on reconnect |
| Failsafes | AI down → cache/templates; exercise withdrawn → regen + notify; offline → local (Docs 17 §C.5, 18 §B.4) |
| Security | MFA for admin/support roles; encryption at rest + in transit; signed media URLs; PII minimized in logs; audit logs append-only |

## I. Decision log

- **5 primary destinations, not 8 tabs** (Elite Mastery OS, Part 13). Today / Masteries / Journal / Progress / Profile; onboarding is a gated flow, not a destination; the enrolled mastery path is the center, not the 40-catalog.
- **Modular monolith first, not microservices.** The 24 engines are logical modules; splitting comes only with measured scaling pain.
- **Safety rules as a versioned library**, not a network service — it sits on the hottest paths (composer, check-in, feedback) and must be unit-testable in isolation.
- **AI coach integrated into the workflow** with the 7-situation behavior contract (§D.1) and the hard eligibility/safety boundary — never a disconnected chatbot, never an override path.
- **Postgres-backed event log + job queue for V1**, not Kafka — at-least-once with idempotent consumers is enough at this scale; revisit at 100k+ MAU.
- **Expo as the single client.** No second web client for training features; web is admin-only.
- **Evidence media private by default at the storage layer** (separate buckets, signed URLs) — privacy enforced by infrastructure, not just UI.
- **Plans pin code versions too** (`composer_version`, `rules_engine_version`), not just content versions — full reproducibility for safety audits.

## J. Next

- **Implementation, brief §12:** 60 prompts in 12 batches. Batch 1 (prompts 1–5): repo audit, consolidation plan, architecture sign-off — this doc plus Docs 17–25 are its input.
- Pilot scope stays V1: Office-Worker Fitness (Doc 19) on this topology before the remaining 12 tracks.
