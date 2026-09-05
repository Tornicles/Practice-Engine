# Batch 11 — Products and Courses

Status: design. Engine 9. Push D.

Batch 2 program = planning. Batch 11 product = sellable curriculum.

Product → modules → lessons → exercises → learning assessments. Enrollment invited → active → completed | dropped. Drop keeps the row and emits ENROLLMENT_DROPPED.

Publish requires lessons. Teaching a method requires commercial_eligible. Learner lesson complete does not change coach skill_states.

Win on an offer that points at a product creates client + invited enrollment atomically.

AI drafts curriculum. It cannot publish through a failed gate, complete a learner lesson, or verify an outcome.

No Products dashboard. Content → Courses & Products.

Done when a sold client can be enrolled, a lesson completes only with required output, and coach scores stay untouched.
