# Master Exercise Library (seed)

The structured seed of the Practice-Engine exercise library, converted from the
525-entry proposed catalog (20 families) into **508 deduplicated records**:
276 canonical exercises + 232 variants.

- `types.ts` — `ExerciseSeed` interface (matches the doc-17 exercise record, seed subset).
- `seed-a-core-upper.ts` — families 1–5 (core, push, pull, shoulders, arms).
- `seed-b-lower-cardio-mobility.ts` — families 6–10 (legs, glutes, calves, cardio, mobility).
- `seed-c-balance-speed-power-sport.ts` — families 11–15 (balance, agility, power, soccer, american football).
- `seed-d-tracks.ts` — families 16–20 (athletics, office_worker, blue_collar, older_adult, kids).
- `index.ts` — barrel export + `ALL_EXERCISES`.

## Status

**Every record is `reviewStatus: "draft"`.** Per the brief and doc 17, no record
is selectable by the Workout Composer until a qualified reviewer validates it
through the content lifecycle (Draft → Technical Review → Safety Review →
Approved → Published). The seed is the *starting point* for the content factory,
not a validated library.

## How to use

1. Import the seed into the content-management database (doc 17 tables:
   `exercises`, `exercise_variants`, `exercise_contraindications`).
2. Reviewers work through the queue by family; each approval flips the record
   through the lifecycle. `catalogRefs` trace every record back to the original
   catalog numbers.
3. `variantOf` links variants to their canonical exercise (variant ladders for
   Engine 7 progression, doc 18 §B.3).
4. `specializations` uses the 13 base-track slugs; the 40 user-facing
   specializations map onto these via `content/specializations` (doc 28).

## Validation

A validation script checks: slug uniqueness, `variantOf` targets resolve,
catalog numbers 1–525 covered exactly once, and all enum values against
`types.ts`. Run it before any re-import.
