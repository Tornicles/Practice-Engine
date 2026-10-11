# 24 — Content Studio Admin

**Status:** Design draft · **Date:** 2026-10-11
**Source brief:** "Practice-Engine — Complete Product and Operating Architecture" (2026-10-11)
**Depends on:** Doc 17 (content lifecycle, review SLAs, versioning, content intelligence flags), Doc 18 (pinned plan references, withdrawal regeneration)
**Engines covered:** 17 (Curriculum Production), 18 (Exercise Media Production), 19 (Content Management), 20 (Content Intelligence & Maintenance) — tooling layer

> The studio is where reviewed content gets made. It enforces the Doc 17 lifecycle in software: the right people, the right gates, no shortcuts.

---

## A. Roles & permissions

Lifecycle stages (Doc 17 §A.2): `draft → technical_review → safety_review → approved → published → revised / archived / withdrawn`.

| Capability | Author | Technical reviewer | Safety reviewer | Content editor | Admin |
|---|---|---|---|---|---|
| Create / edit draft | ✅ | — | — | ✅ | ✅ |
| Submit draft → technical review | ✅ (own items) | — | — | ✅ | ✅ |
| Technical review → safety review (sign off / request changes) | — | ✅ (assigned types) | — | — | ✅ |
| Safety review → approved (sign off / request changes) | — | — | ✅ | — | ✅ |
| Schedule publish (set `effective_date` on approved) | — | — | — | ✅ | ✅ |
| Create revision from published (new draft version) | ✅ | — | — | ✅ | ✅ |
| Archive superseded version | — | — | — | ✅ | ✅ |
| Withdraw (any → withdrawn) | — | — | ✅ | — (request only) | ✅ |
| Assign reviewers / reassign queue items | — | — | — | ✅ | ✅ |
| Manage users, roles, SLA targets | — | — | — | — | ✅ |
| Edit published content in place | ❌ | ❌ | ❌ | ❌ | ❌ |

Rules:
- No self-review: the author of an item cannot be its technical or safety reviewer.
- Safety review is mandatory (not skippable in UI) for: exercises with contraindication flags, all prenatal/youth/older-adult content, nutrition notes touching restricted groups (Doc 17 §A.2).
- Withdraw is the only transition that bypasses the queue — it is immediate and always available to safety reviewers. Withdrawing triggers the blast-radius flow (§D).
- Every transition writes to `content_reviews` (who, when, from→to, note). The audit trail is append-only.

---

## B. Authoring UX

### B.1 Curriculum builder
- Assemble phases (1–6) → modules → lesson templates → assessment checkpoints from the content library; drag-and-drop ordering with prerequisite validation (a module can't require an assessment that doesn't exist yet).
- Weekly theme editor: theme per week per phase, with the daily lesson templates that realize it.
- Gap view: "Phase 3 has 4 lessons but the plan calls for 12" — missing pieces become content tasks, assigned to authors.

### B.2 Exercise editor
- Single form covering every Doc 17 §B field: slug, family, muscle groups, movement pattern, equipment, space, difficulty, entry criteria, coaching cues, common errors, permitted specializations.
- Variant manager: ordered ladder (D1–D5) with per-variant equipment deltas and cue overrides; validates the "support/range/load, never new technique" rule.
- Contraindication picker: flag + severity (`withhold`/`modify`/`screen`) + guidance text; severity `withhold` auto-marks the item as safety-review-mandatory.
- Media slots per kind (demo / modification / coaching / equipment variation) with required/optional markers per family.

### B.3 Media upload & shot list
- Upload flow generates the shot list from the exercise record (angles, tempo, reps to film) — the brief's production workflow: spec → script/shot list → review → film → edit/caption/compress/tag → final review.
- Checklist gates upload completion: captions file present, thumbnail set, duration within bounds, checksum recorded. Incomplete media blocks submission to technical review.
- AI assistance: auto-generate captions draft, suggest tags, detect missing angles. Drafts only — the producer confirms.

### B.4 AI-draft assistance (all content types)
- "Draft from brief": author supplies bullet inputs → AI produces a draft lesson/quiz/cues/script in the content schema.
- Every AI draft is stamped `ai_drafted: true` with the model and prompt version; a named human author must claim ownership before it can leave `draft`. Unclaimed AI drafts never enter review.
- AI may not: submit for review, approve, publish, or edit published content.

---

## C. Review queues

### C.1 Triage views
- **My queue** (per reviewer): items assigned, sorted by SLA urgency.
- **Safety triage** (safety reviewers): safety-critical flags first — pain-report clusters, withdrawal requests, elevated-risk-tier items.
- **Stale & aging**: items past 50% / 100% of their SLA target, with assignee and waiting-since.
- **Batch view** (content editors): MINOR revisions eligible for bundled technical review.

### C.2 SLA timers (Doc 17 §A.4)

| Trigger | Timer starts | Target | On breach |
|---|---|---|---|
| Safety-critical flag | Flag raised | Same business day | Escalate to all safety reviewers + admin; item locked from publishing until triaged |
| Reported content error | Report filed | 1–2 business days | Escalate to assignee's backup; notify content editor |
| Demo re-review due | 6/12-month mark | 30-day grace | Auto-create review task; item stays published but flagged "review overdue" in dashboards |
| Curriculum re-review due | 3/6-month mark | 30-day grace | Same as above |
| Standard review (technical/safety) | Submitted to stage | 5 business days (studio default) | Reassign to backup reviewer; notify editor |

Timers pause when an item is sent back for changes and restart on resubmission. All breaches are logged.

---

## D. Publishing dashboard

### D.1 Scheduled publishing
- Approved items with `effective_date` in the future sit in "Scheduled"; a publisher job flips them to `published` at the effective time. Manual "publish now" is allowed for content editors+ but still requires: approved status, no open safety flags, effective date set (can be now).
- Publishing is per-item and per-locale: a translation publishes independently when its own review completes.

### D.2 Version diff view
- Side-by-side diff of the new version vs. the published version, with the system classifying MAJOR vs MINOR per Doc 17 §A.5 (technique/safety/eligibility/rubric change = MAJOR).
- MAJOR diff view shows the consequence preview before confirm: number of future scheduled plans referencing the old version (query from Doc 18 §D), whether regeneration will run, and whether current-week users get notified.
- MINOR publishes without plan regeneration; still requires technical review sign-off.

### D.3 Withdrawal flow & blast radius (Doc 17 §C.5)
Withdrawing an item opens a confirmation showing:
1. **Affected future plans:** count + list (from `session_exercises` pinned references, Doc 18 §D).
2. **Current-week users:** count to notify, with the notification copy preview ("We've replaced an exercise in your plan…").
3. **Replacement mapping:** suggested approved alternatives per affected plan (composer re-runs with the withdrawn item excluded; a human confirms the mapping for the top-used plans).
4. On confirm: plans regenerate, notifications queue, safety event logged, item → `withdrawn`. The withdrawn version remains queryable for audit but can never be selected again.

### D.4 Archive & rollback
- Archiving a superseded version keeps it readable; rollback = create a new revision from the archived version's content (goes through review again — no silent restores).

---

## E. Content intelligence dashboards (Engine 20)

Each Doc 17 §A.6 auto-flag surfaces as a review task with context and a recommended alternative:

| Signal | Dashboard view | Recommended alternative (system-suggested, human-confirmed) |
|---|---|---|
| Repeated confusion (low completion, "too hard") | Exercise detail: completion funnel, feedback tags | Easier variant already in the ladder, or rewrite cues |
| Demo abandonment spike | Media analytics: drop-off timestamps | Re-edit (cut to the drop-off point), or re-shoot flagged segment |
| Quiz < 60% pass after 2 attempts | Lesson → quiz linkage, wrong-answer distribution | Revise the lesson section matching the missed questions |
| Specialization lacks beginner modifications | Coverage matrix: families × difficulties per track | Authoring tasks for the missing D1/D2 variants |
| Repeated pain reports | Safety view: reports per exercise, locations | Immediate triage; likely withdrawal or severity bump |
| Stale review past SLA | Aging report | One-click "create re-review task" |

Dashboards are read-only analytics; every action they suggest creates a task or draft — nothing auto-publishes, nothing auto-edits.

---

## F. What the studio does NOT do

- No direct publishing without completing review. There is no "skip" button; the UI literally lacks the affordance.
- No in-place edits of published content. Edits create a new draft version (Doc 17 §A.2).
- No AI auto-publish, auto-approve, or auto-withdraw. AI drafts, flags, and suggests; humans decide.
- No bypassing safety review for elevated-risk tiers (kids, prenatal, older-adult, medically complex) — the gate is enforced in code, not policy text.
- No silent content swaps under pinned plans. A published plan's `content_pins` (Doc 18 §A.2) are immutable; only regeneration with user notification changes what a user sees.
- No reviewer self-assignment to their own authored items.

---

## G. Studio data model (additions)

```ts
// review_tasks: queue items (reviews, intelligence flags, re-review dues)
review_tasks {
  id uuid PK, content_id text, version text,
  kind text,              // technical_review | safety_review | intelligence_flag | rereview_due | withdrawal_request
  assignee text nullable, status text,        // open | in_progress | done | escalated
  sla_due_at timestamp, breached bool default false,
  payload jsonb,                               // flag details, signal snapshots
  created_at timestamp
}

// publish_schedule: approved items awaiting effective_date
publish_schedule {
  id uuid PK, content_id text, version text,
  effective_at timestamp, locales text[],
  status text,              // scheduled | published | cancelled
  published_at timestamp nullable
}

// withdrawal_impacts: audit of a withdrawal's blast radius
withdrawal_impacts {
  id uuid PK, content_id text, version text,
  affected_plans int, notified_users int,
  replacement_map jsonb, withdrawn_by text, withdrawn_at timestamp
}
```

---

## Decision log

- **Permissions mirror the lifecycle exactly.** If Doc 17 says a transition needs a safety reviewer, the studio won't render the button for anyone else. Policy and UI can't drift.
- **Withdrawal is the only fast path** — everything safety-critical must be one click away; everything else goes through the queue. Speed for danger, deliberation for quality.
- **Blast radius before confirm.** Nobody withdraws content without seeing the user impact first; the regeneration plan is part of the confirmation, not an afterthought.
- **Intelligence suggests, never acts.** The moment a dashboard can change user-facing content on its own, you've rebuilt the unreviewed-AI problem the whole architecture exists to prevent.
- **Append-only audit.** Transitions, breaches, withdrawals, and AI-draft stamps are never edited or deleted — the studio's memory is the compliance record.

## Next

- **25 — Platform Operations** (engines 21–24): notifications, analytics, safety/privacy/eligibility, admin & QA.
- **26 — Technical Consolidation**: mobile + backend + AI services + data/media + admin topology.
- Also queued: **19** Office-Worker curriculum, **20** nutrition engines, **21** education & portfolio, **22** onboarding & scheduling.
