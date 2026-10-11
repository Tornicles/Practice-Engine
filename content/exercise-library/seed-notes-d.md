# Seed D — Dedup Notes (families 16–20, catalog entries 401–525)

## Counts

| Family | Records | Canonicals | Variants |
|---|---|---|---|
| athletics (401–425) | 25 | 15 | 10 |
| office_worker (426–450) | 25 | 5 | 20 |
| blue_collar (451–475) | 25 | 6 | 19 |
| older_adult (476–500) | 25 | 3 | 22 |
| kids (501–525) | 25 | 18 | 7 |
| **Total** | **125** | **47** | **78** |

All catalogRefs 401–525 present exactly once. No duplicate slugs. TypeScript strict compile passes against `types.ts`.

## Dedup decisions

**Rule applied:** entries duplicating general movements from families 1–15 became `variantOf` records pointing at the canonical slug; genuinely new drills, games, and occupational patterns became canonicals in their own family.

**New canonicals introduced (47):**
- athletics: `a-march`, `a-skip`, `b-skip`, `ankling-drill`, `wall-drive-drill`, `wall-switch-drill`, `acceleration-mechanics`, `sprint-start`, `flying-sprint`, `stride-drill`, `bounding`, `landing-mechanics`, `calf-stiffness-drill`, `hamstring-strength-drill`, `running-mobility`
- office_worker: `seated-knee-extension`, `chin-tuck`, `wall-slide`, `movement-break-circuit`, `glute-squeeze`
- blue_collar: `front-loaded-carry`, `loaded-balance`, `floor-to-stand`, `kneeling-to-stand`, `occupational-circuit`, `shoulder-stability-drill`
- older_adult: `backward-stepping`, `seated-ankle-mobility`, `functional-reach-drill`
- kids: `animal-walks`, `crab-walk`, `frog-jump`, `bunny-hop`, `line-walking`, `hopscotch`, `skipping`, `galloping`, `tag-games`, `obstacle-course`, `ball-toss`, `ball-catch`, `follow-the-leader`, `coordination-stepping`, `dance-games`, `relay-races`, `target-throwing`, `imitation-games`

**Notable calls:**
- `seated-knee-extension` is canonical in `office_worker` (entry 429); the older-adult `seated-knee-extension-older` (480) is a variant of it — cross-family reuse, single canonical.
- `floor-to-stand` is canonical in `blue_collar` (471); older-adult `floor-to-stand-older` (498) variants it with `SUP` equipment and supervision flags.
- `obstacle-course` is canonical in `kids` (513); `crawling-obstacle-course` (521) variants it.
- 498 "Floor-to-stand practice" carries `["older_adult_screen", "fall_risk", "needs_supervision"]` and equipment `["BW", "SUP"]`.
- All kids records carry `["kids"]` specialization and `youth_only` flag; difficulty ≤ 2; no loading progressions.
- All older-adult records carry `older_adult_screen`; balance/gait items add `fall_risk`; difficulty ≤ 2.
- Prenatal is not in these families — skipped per brief.

## variantOf slugs referenced from OTHER groups (reconciliation needed)

These canonical slugs live in families 1–15 (other seed groups). Verify the other groups emit exactly these slugs, or reconcile:

`walking`, `running`, `high-knee-running`, `butt-kicks`, `walk-run-intervals`, `shuttle-run`, `broad-jump`, `single-leg-hop`, `squat`, `sit-to-stand`, `marching`, `calf-raise`, `push-up`, `scapular-retraction`, `thoracic-rotation`, `hip-flexor-stretch`, `figure-four-stretch`, `wrist-mobility`, `lateral-step`, `hip-hinge`, `stair-walking`, `abdominal-bracing`, `doorway-chest-stretch`, `mobility-flow`, `split-squat`, `deadlift`, `romanian-deadlift`, `farmer-carry`, `suitcase-carry`, `stair-climbing`, `step-up`, `lunge`, `grip-hold`, `row`, `pallof-press`, `hip-circles`, `toe-raise`, `biceps-curl`, `shoulder-press`, `hip-abduction`, `hip-extension`, `seated-trunk-rotation`, `bear-crawl`, `jump-and-stick`

**In-group cross references (already consistent):** `seated-knee-extension` (480 → 429), `floor-to-stand` (498 → 471), `obstacle-course` (521 → 513).
