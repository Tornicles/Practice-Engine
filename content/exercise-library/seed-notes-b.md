# Seed notes B — families 6–10 (catalog entries 133–280)

## Counts

| Family | Catalog entries | Records | Canonical | Variants |
|---|---|---|---|---|
| 6 legs | 30 (133–162) | 28 | 8 | 20 |
| 7 glutes/hips/hamstrings | 28 (163–190) | 28 | 17 | 11 |
| 8 calves/ankles/feet | 20 (191–210) | 20 | 8 | 12 |
| 9 cardio/endurance | 35 (211–245) | 33 | 16 | 17 |
| 10 flexibility/mobility | 35 (246–280) | 35 | 27 | 8 |
| **Total** | **148** | **144** | **76** | **68** |

All 148 catalog numbers 133–280 are covered exactly once (verified by script).
File type-checks clean against `types.ts` (`tsc --strict`).

## Dedup decisions

- **133/134/135 → one record** (`sit-to-stand`, CH, d1): sit-to-stand, assisted squats, and chair squats are the same assisted-squat pattern. Kept canonical (not a squat variant) because it is the d1 entry point for older_adult/obesity tracks.
- **Squat ladder**: canonical `squat` [136] + 10 variants (tempo, pause, narrow/wide stance, sumo, goblet, dumbbell, band, pulse, jump). Stance variants kept separate (they change muscle emphasis) rather than folded into parameters.
- **Lunge ladder**: canonical `lunge` (forward) + reverse/lateral/walking/curtsy/dumbbell variants. `dynamic-lunge` [278] lives in mobility but is `variantOf: "lunge"` (cross-family variant).
- **212/213 merged** (`marching`): "standing marching" and "marching in place" are the same movement.
- **214/215 merged** (`walking`): "walking in place" and "indoor walking circuits" are the same pattern; outdoor/brisk/incline are variants with `space: "outdoor"`.
- **174 → variant of `hip-abduction`** (`side-lying-hip-abduction`): side-lying leg raise is the supported form of the standing abduction.
- **190 → variant of `glute-bridge`** (`hamstring-bridge-hold`): isometric bridge with hamstring emphasis, not a distinct technique.
- **202 → variant of `calf-raise`** (`toe-walk`): loaded plantarflexion gait.
- **200 → variant of `ankle-circle`** (`ankle-pump`); **204 → variant of `short-foot`** (`toe-spreading`); **198 → variant of `toe-raise`** (`wall-tibialis-raise`).
- **206–209 → one canonical + 3 variants** (`ankle-dorsiflexion` + plantarflexion/inversion/eversion): directional variants of banded ankle work.
- **241/242/244 → variants of `burpee`** (walkout, modified, squat-thrust — the no-jump regressions).
- **245 → `mountain-climber-interval`, `variantOf: "mountain-climber"`**: the canonical lives in seed-a (family 1, entries 27–29) — cross-file reference, intentional.
- **278 → `dynamic-lunge`, `variantOf: "lunge"`**: cross-family variant (mobility family, legs canonical).

## Specialization policy applied

- Default `["all"]` for general safe movements.
- **High-impact plyometrics** (squat-jump, split-squat-jump, skater-squat, pistol-squat, assisted-pistol-squat): excluded kids, prenatal, older_adult, obesity.
- **High-impact cardio** (jogging/outdoor-jog/outdoor-run, shuttle-run, high-knee run, skater-hop, pogo-hop, standard burpee): excluded prenatal, older_adult; obesity excluded except walk-run intervals (kept — the classic weight-loss protocol).
- **Prenatal**: included only for low-impact walking/seated/gentle mobility and basic d1–d2 supported strength; everything else excluded, with `pregnancy_review` flag on judgment-call records (loaded hinges, lunges, bridges, step-ups) so a qualified reviewer adjudicates.
- **Older adult**: excluded from unsupported advanced balance (single-leg RDL, pistol family), jumps, running, shuttle, standard burpee; `older_adult_screen` flag on borderline balance records (toe-walk, heel-walk, grapevine, skater-step, leg-swing) that stay eligible.
- **Kids**: excluded only from the plyometric set per guidance; play-based cardio (jacks, dance, marching) kept.

## Suspected cross-group duplicates (for the other seed authors / reviewer)

1. **`pike-push-up`** (family 4, #94) vs **`pike-hold`** (#93) — likely canonical+variant; not mine, flagging.
2. **`mountain-climber` canonical** (family 1, #27–29) ↔ my `mountain-climber-interval` [245] — variant reference created; ensure the canonical slug is exactly `mountain-climber`.
3. **`seated-marching`** appears in family 9 [211] (mine, variant of `marching`) AND family 17 [428] / family 19 [478] — same movement; seed-d should reference, not duplicate.
4. **`wall-sit`** [155] (mine) vs family 6 has no other; fine.
5. **`superman` / `back-extension`** [182–185 in family 3] — out of my scope; my `hip-extension` [173] is standing hip extension, distinct.
6. **`hip-hinge` [181]** (mine, glutes) vs **`hip-hinge-technique-drills` [451]** (family 18, seed-d scope) — likely the same pattern; seed-d should make 451 a variant of `hip-hinge`.
7. **`farmer-carry` / `suitcase-carry`** [127–128] (family 5, seed-a) vs [392, 456–457] (families 15/18, seed-c/d) — same movements, dedupe to seed-a canonicals.
8. **`resistance-band-row` variants** [73–75] (family 3, seed-a) vs [466] (family 18, seed-d) — same; seed-d should reference.
9. **`wall-push-up`** [36] (family 2, seed-a) vs [433, 467, 483] (families 17/18/19, seed-d) — same; reference, don't duplicate.
10. **`tandem-stance` / `single-leg-stance`** [283–285] (family 11, seed-c) vs [488–489] (family 19, seed-d) — same; reference.
11. **`stair-walk` [219]** (mine) vs **`stair-walking-breaks` [446]** (family 17, seed-d) — 446 is a usage pattern (break), not a new exercise; recommend variant or context note, not a new canonical.
12. **`seated-knee-extension`** [429] (family 17) / [480] (family 19) — leg-extension pattern not in my scope; seed-d should create one canonical and cross-reference.
13. **`calf-raise`** [191] (mine) vs [431] (family 17), [462] (family 18), [481] (family 19) — same movement; seed-d must reference my canonical, not duplicate.
14. **`chin-tuck`** [248] (mine) vs [435] (family 17) — same; reference.
15. **`wall-slide`** [89–90] (family 4, seed-a) vs [436] (family 17, seed-d) — same; reference.
16. **`seated-thoracic-rotation`** [258] (mine) vs [437] (family 17, seed-d) — same; reference.
17. **`seated-figure-four-stretch`** [263] (mine) vs [439] (family 17, seed-d) — same; reference.
18. **`doorway-chest-stretch`** [250] (mine) vs [449] (family 17, seed-d) — same; reference.
19. **`pallof-press`** [35] (family 1, seed-a) vs [469] (family 18, seed-d) — same; reference.
20. **`lateral-band-walk`** [177] (mine) — no duplicates elsewhere; clean.

**Rule for seed-d (track-specific families 17–20):** those families are mostly *usage contexts* of central-library movements. Prefer `variantOf` references to these canonicals over new records.
