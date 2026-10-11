# Specialization Catalog

The 40 user-facing Practice-Engine specializations across 8 categories.

- `types.ts` — `SpecializationRecord` interface, category/base-track/family vocabularies.
- `catalog.ts` — all 40 records in guide order. **Status: draft** — records are transcribed from the product guide; positioning and safeguards need product-owner sign-off, and elevated-risk tracks need specialist reviewer sign-off before selectability.
- `index.ts` — barrel export.

## The two-layer model (doc 28)

The 40 specializations are the **user-facing catalog**. Exercise eligibility keys off the **13 base movement tracks** (`baseTracks`): `obesity, weight_gain, weight_loss, soccer, american_football, athletics, office_worker, prenatal, lean, body_shape, blue_collar, kids, older_adult` — the same vocabulary the exercise library (`content/exercise-library`) uses. `priorityFamilies` carries the specialization-specific emphasis.

At enrollment the user sets **primary** (1 of 40) + optional **secondary** (specialization or capability objective) + **characteristics** (age, experience, limitations, equipment, space, schedule). Engine 2 resolves these into one profile; precedence is **safety > characteristics > primary > secondary** (doc 28 §B).
