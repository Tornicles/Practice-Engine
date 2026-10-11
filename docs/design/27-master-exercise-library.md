# 27 — Master Exercise Library

**Status:** Design draft · **Date:** 2026-10-11
**Source brief:** "PRACTICE-ENGINE — MASTER EXERCISE LIBRARY" (525 entries, 20 families)
**Depends on:** Doc 17 (exercise record spec, content lifecycle), Doc 18 (variant ladders, composer filter), Doc 28 (13 base tracks)
**Engines covered:** 5 (Exercise Library), 17 (Curriculum Production — content input), 18 (Exercise Media Production — queue input)

> The 525 numbered entries are a proposed starting catalog, not 525 validated demonstrations. This doc defines how they become a structured, reviewable library.

---

## A. Dedup methodology

1. **Canonical + variant model.** Entries that are the same movement at different access points collapse into one canonical exercise plus variant records. Example: 17 push-up entries (wall → plyometric) → canonical `push-up` + 15 variants.
2. **Canonical slug rule.** Simplest base name, kebab-case (`squat`, `lunge`, `pallof-press`, `farmer-carry`). Variants keep their catalog context via `family` (e.g. `quick-feet-soccer` stays in the soccer family) so family queries keep working.
3. **Cross-family duplicates merged once.** Movements appearing in multiple families (wall push-ups in chest/office/older-adult, farmer carries in arms/football/blue-collar, seated marching in cardio/office/older-adult) exist as a single record; `catalogRefs` preserves every original number for traceability.
4. **Validation gates.** Automated checks before any import: slug uniqueness, every `variantOf` target resolves, catalog numbers 1–525 covered exactly once, all enum values against the type vocabulary.

## B. Catalog stats (seed v1)

| Metric | Value |
|---|---|
| Source entries | 525 (20 families) |
| Seed records | 508 |
| Canonical exercises | 276 |
| Variants | 232 |
| Records with `reviewStatus: "draft"` | 508 (100%) |
| Difficulty spread | 1–5 (family-appropriate; power/plyo skews 4–5, kids/older-adult skew 1–2) |

Notable merges: push-up (17→16 records), squat ladder, lunge ladder, glute-bridge ladder, marching/jumping-jack/jogging ladders, band-row cluster, scapular cluster, ankle band-work (4 directions → 1 canonical + variants).

## C. Record fields (seed subset of doc 17)

`slug, name, family, variantOf?, equipment[], space, difficulty 1–5, movementPattern, primaryMuscles[], secondaryMuscles?[], prerequisites?, specializations[] (13 base-track slugs or "all"), safetyFlags[], reviewStatus, catalogRefs[]`.

Equipment codes: `BW DB RB CH OUT MAT` from the catalog, extended with `TWL STR DRW WALL ANCH DESK BALL BALL_S BALL_F PART MARK HOUSE SUP` (defined in `content/exercise-library/types.ts`).

Safety-flag vocabulary: `knee_load back_load shoulder_load wrist_load ankle_load hamstring_load balance_risk fall_risk high_impact overhead spinal_flexion breath_hold grip_demand needs_anchor needs_partner needs_supervision pregnancy_review youth_only older_adult_screen`.

## D. From seed to selectable (review workflow)

1. Seed imports into `exercises` / `exercise_variants` / `exercise_contraindications` (doc 17 §B) with status `draft`.
2. Reviewers work the queue by family: Technical Review (exercise specialist verifies technique fields, cues, progressions) → Safety Review (flags, contraindications, elevated-track restrictions).
3. Approved records become `published` and enter the composer's candidate set (doc 18 §A.3). Nothing unpublished is ever selectable — the composer filters on `review_status = 'published'`.
4. Media production (doc 24) attaches demonstrations per record; the record's `reviewStatus` gates media shoots (no filming unreviewed technique).

## E. Specialization eligibility

`specializations` keys off the 13 base tracks. Rules applied in the seed:
- General safe movements → `["all"]`.
- Power/plyometric/sprint work → sport + strength tracks only (kids, prenatal, older_adult, obesity excluded; `high_impact` flagged).
- Prenatal → low-impact walking/seated/gentle mobility + basic supported strength only, `pregnancy_review` on judgment calls.
- Older adult → no unsupported advanced balance, jumps, or running; `older_adult_screen` on borderline records.
- Kids → `["kids"]` + `youth_only`, difficulty ≤ 2, no loading progressions.
- Reviewers own the final eligibility per record; the seed's assignments are starting points.

## F. Decision log

- **Deduplicate before review.** Reviewing 525 overlapping entries wastes specialist time; 508 clean records is the reviewable unit.
- **Variants keep catalog-context family.** A variant's `family` records where it was proposed (e.g. office_worker), while `variantOf` preserves the technique lineage. Family browsing and technique ladders both work.
- **Seed stays in the repo as TypeScript.** Typed, diffable, importable by the future backend; the DB remains the system of record after import.
- **`hamstring_load` added** to the safety vocabulary for sprint/Nordic work (raised during conversion).

## G. Next

- Reviewer queue: families 1–10 first (foundation movements unblock the most curricula).
- Media production order follows review completion (doc 24).
- Tier-2 specialization blueprints (doc 28) consume the published subset.
