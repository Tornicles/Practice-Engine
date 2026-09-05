# Batch 4 — Client Delivery

Status: design. Owner: Client Delivery (Engine 3). Depends on Batches 1 and 3. Push B.

## Purpose

Real coaching as structured work, not a notes blob.

Client statuses: prospect → new → active → at_risk | paused | completed | dropped.

Objects: Client, Intake, Diagnosis, ClientObjective, Session (prep / workspace / interventions), Commitment, FollowUp, Outcome (baseline | progress | final), Feedback.

## Hard rules

- One coach owns the client. No shared caseload.
- Intake completed or skipped-with-reason before new → active.
- One active client objective.
- Outcomes are `declared` only. `verified` writes 409 until Batch 7.
- `source = sale` 409 until Batch 10.
- AI drafts diagnosis and prep. Cannot transition status, declare outcome, or close a commitment.
- Session complete may write skill_observations with source_type = session. Same confidence caps as Batch 3.
- Negative feedback does not open an investigation.

## Session machine

prep → in_progress → completed | cancelled.
Idempotent complete. New key on already completed → 409.
Open commitments with due_on ≤ today are follow-ups.

## API

```
GET/POST /api/clients
GET /api/clients/:id
POST /api/clients/:id/intake
POST /api/clients/:id/sessions
POST /api/sessions/:id/complete
GET /api/clients/:id/outcomes
GET /api/clients/:id/follow-ups
```

No Intake or Outcomes dashboard. Tabs inside Clients.

## Done when

Coach can add a client, complete intake, run a session with a commitment and a declared outcome, and see that session on the skill record as live evidence. Nothing is verified.
