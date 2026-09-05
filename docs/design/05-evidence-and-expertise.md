# Batch 5 — Evidence and Expertise

Status: design. Owner: Experience → Expertise (Engine 4). Depends on Batches 1, 3, 4. Push B.

## Purpose

Completed work becomes proof. AI extracts. Rules validate.

## Event store

Entity write + event + audit + idempotency in one transaction. Failed event rolls back the completion.

Batch 5 types include PRACTICE_COMPLETED, SIMULATION_COMPLETED, ASSESSMENT_EVALUATED, SESSION_COMPLETED, EXPERIENCE_CAPTURED, LESSON_CREATED, PATTERN_PROPOSED, PRINCIPLE_PROPOSED, HYPOTHESIS_TESTED, EXPERTISE_VALIDATED, EVIDENCE_RECORDED.

## Evidence kinds

fact | observation | interpretation | assumption | ai_hypothesis.

Only fact and observation may support validation. ai_hypothesis reliability is never high. Deleted source → evidence orphaned → cannot validate.

## Lineage

experience → lesson → pattern (≥2 instances) → principle → hypothesis → expertise.

One result is an observation. Repeated results may become a pattern.
Adapt only on accepted patterns or supported hypotheses.

Existing experiences.status = Principle extracted imports as captured + draft principle, not validated expertise.

## Validate expertise requires

- accepted principle
- accepted pattern with min instances
- ≥2 active fact/observation evidence
- no orphaned support
- actor is not AI

## API

```
GET /api/experience/:id/lineage
GET /api/expertise
GET /api/evidence/:id
GET /api/events?entity_type=&entity_id=
```

No Evidence dashboard. Lineage answer: why does Practice Engine believe this?

## Done when

Coach can capture after a session, extract a lesson, attach a second pattern instance, and still be refused if they stamp expertise validated without facts. The event exists even if they never capture.
