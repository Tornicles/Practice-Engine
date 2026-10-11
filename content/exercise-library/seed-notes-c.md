# Seed notes — batch C: families 11–15 (catalog entries 281–400)

File: `seed-c-balance-speed-power-sport.ts`

## Counts

| Family | Catalog entries | Records | Canonical | Variants |
|---|---|---|---|---|
| 11 balance & coordination | 281–300 (20) | 20 | 15 | 5 |
| 12 agility & speed | 301–330 (30) | 30 | 22 | 8 |
| 13 power & plyometrics | 331–350 (20) | 20 | 16 | 4 |
| 14 soccer fitness | 351–375 (25) | 25 | 16 | 9 |
| 15 american football fitness | 376–399 (24 of 25) | 24 | 16 | 8 |
| **Total** | **119 of 120** | **119** | **85** | **34** |

Entry **392 (farmer carries)** intentionally omitted — duplicate of catalog entry 127
(family 5, arms); ownership left to that batch.

All 119 slugs unique; all 34 `variantOf` targets resolve; all `reviewStatus: "draft"`.
Variants keep the **family of their catalog context** (e.g. `quick-feet-soccer` is family
`soccer`, variant of agility-family `quick-feet`) so family-scoped queries keep working
while technique stays canonical.

## Dedup decisions (in-scope merges)

- Stance progressions → one canonical each: `tandem-stance` (281/282/283),
  `single-leg-stance` (284/285/286), `heel-to-toe-walk` (287/288).
- `line-hop` ← two-foot [308] canonical; lateral [309], single-leg [310] variants.
- `acceleration-start` [311] ← falling [312], split-stance [313], soccer forward-accel [353],
  football first-step [379], football short-sprint-start [380].
- `shuttle-run` [316] ← 10m [317], five-ten-five [319], soccer conditioning [365].
- `backpedal` [325] ← to-sprint [326], soccer backpedal-forward-run [355],
  football backpedaling [381].
- `lateral-shuffle` [304] ← soccer [354], football [382] (ONE canonical across families).
- `cutting-drill` [329] ← soccer direction-change [356], football change-of-direction [386].
- `hop-and-stick` [342] ← jump-and-stick [343], lateral hop-and-stick [344],
  soccer jump-and-land [367], football jump-landing [395].
- `broad-jump` [336] ← repeated [345], football practice [393].
- `vertical-jump` [335] ← football practice [394].
- `lateral-bound` [327] ← soccer bound-and-stick [368].
- `plyometric-push-up` [347] ← explosive incline [348].
- `quick-feet` [301] ← fast-feet-in-place [302], soccer ball-free [352].
- `single-leg-stance` ← soccer single-leg balance [357] (context variant, not new technique).
- 333 squat jump vs 157 (family 6) and 339 split jump vs 158 (family 6): kept as
  family-13 canonicals (power context, D4–5); family-6 batch should cross-check.
- 328 skater jump (agility, quick/continuous) vs 338 skater bound (power, maximal):
  kept separate — near-duplicates; reviewer to confirm the distinction holds.
- 337 lateral jump (quick hops) vs 327 lateral bound (maximal): kept separate, same note.
- 314 short accelerations (the run) vs 311 acceleration starts (the start technique):
  kept separate.
- 323 reaction sprint start vs 311: kept separate (reactive cue vs self-initiated).

## Suspected cross-group duplicates (other batches — do not dedupe here)

| This batch | Other entry | Note |
|---|---|---|
| 289 side stepping | 230 grapevine steps (fam 9), 487 supported side steps (fam 19) | same pattern, different support |
| 295 standing knee raise | 224 high-knee marching (fam 9) | near-duplicate |
| 333 squat jump | 157 squat jumps (fam 6) | likely same; fam 6 owns beginner context |
| 339 split jump | 158 split-squat jumps (fam 6) | likely same |
| 347 plyometric push-up | 52 plyometric push-ups (fam 2) | likely same |
| 392 farmer carries | 127 farmer carries (fam 5) | **skipped here**; fam 5 owns it |
| 341 single-leg hop | 421 single-leg hop progressions (fam 16) | likely same |
| 240 skater hops (fam 9) | 328 skater jump | near-duplicate, different intensity |

## Specialization policy applied

- Balance/agility basics (low impact): `["all"]`.
- Power, plyometrics, sprint/agility-outdoor work: `["soccer","american_football","athletics","lean","body_shape","weight_loss"]`
  (kids, prenatal, older_adult, obesity, office_worker, blue_collar excluded).
- DB power moves (push press, squat-to-press): strength-appropriate list incl. `weight_gain`.
- Soccer skill/ball work: `["soccer"]`; general movements (shuttle-run variants, recovery mobility): `["all"]`.
- Football: `["american_football"]`; `core-anti-rotation` also `soccer`.
- Power/plyo difficulty skews 4–5 per the catalog's own "advanced, not default beginner" note;
  `hop-and-stick` kept at 3 (landing mechanics are teachable earlier).

## Vocabulary gap (for types.ts owner)

`SafetyFlag` has no hamstring-specific flag. Sprint/hinge/nordic records needed one;
`hamstring_load` was removed to match the type exactly. Recommend adding
`"hamstring_load"` to `SafetyFlag` — hamstring strain risk is the primary safety
concern for sprint and Nordic work.
