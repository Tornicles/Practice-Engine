# Seed notes — families 1–5 (catalog entries 1–132)

File: `seed-a-core-upper.ts` → `export const EXERCISES: ExerciseSeed[]`

## Counts

| Family | Catalog entries | Records | Canonical | Variants |
|---|---|---|---|---|
| 1. Core | 1–35 | 35 | 21 | 14 |
| 2. Push | 36–60 | 24 | 6 | 18 |
| 3. Pull | 61–85 | 25 | 11 | 14 |
| 4. Shoulders | 86–110 | 25 | 15 | 10 |
| 5. Arms | 111–132 | 22 | 15 | 7 |
| **Total** | **1–132** | **131** | **68** | **63** |

132 catalog entries → 131 records (entry 50 and entry 94 are the same movement,
merged into one record with `catalogRefs: [50, 94]`). Every record: `reviewStatus: "draft"`,
all catalog numbers 1–132 covered, all slugs unique, all `variantOf` targets exist.

## Dedup decisions (entries → canonical)

**Push-up ladder (17 entries → 1 canonical + 15 variants).** Canonical `push-up` = standard (40).
Variants: wall (36), countertop (37), incline (38), knee (39), wide (41), close-grip (42),
diamond (43), tempo (44), paused (45), eccentric (46), archer (47), staggered (48),
decline (49), explosive (51), plyometric (52). Pike push-up (50) split out — it is
primarily a shoulder movement, canonicalized once under shoulders with refs [50, 94].

**Plank family (8 → 1 + 5).** Canonical `plank` = forearm (11). Variants: high (12),
knee (13), shoulder-tap (16), knee-drive (17), up-down (18). Side plank kept as its own
canonical (14) with knee variant (15) — different movement pattern.

**Dead bug (6, 7), bird dog (8, 9, 10), mountain climber (27, 28, 29), hollow (25, 26),
bear (30, 31, 32)** — canonical + regression/progression variants each.

**Prone raises (63, 64, 65).** Canonical `prone-y-raise`; T and W are arm-position
variants of the same pattern.

**Rows.** `row` = bent-over DB row (68) with variants single-arm (69), supported (70),
alternating (71), bird-dog row (67). `band-row` (73) is its own canonical (different
implement) with seated (74) / standing (75) variants. `reverse-fly` (72) canonical with
`band-reverse-fly` (80) variant.

**Back-extension cluster (82–85).** Canonical `back-extension` (82); variants:
alternating arm-leg raise (83), superman hold (84), superman rep (85).

**Pulldown (78, 79).** Canonical `band-lat-pulldown`; straight-arm version is a variant.

**Shoulder mobility (86, 87, 88).** Canonical `shoulder-circle`; arm circles and
shoulder rolls are near-identical variants.

**Wall slide (89, 90), scapular push-up (91, 92)** — canonical + easier wall variant each.

**Overhead press (95, 96, 103).** Canonical `shoulder-press` (DB); alternating and
band versions are variants. Arnold press (97) kept canonical — the rotation makes it a
distinct technique.

**Front raise (98, 105), lateral raise (99, 104)** — DB canonical + band variant each.

**Rotations (106, 107).** Canonical `band-external-rotation`; internal is a variant
(same setup, opposite direction).

**Handstand (109, 110).** Canonical `handstand-prep`; wall hold is the progression variant.
Flagged `fall_risk` + `older_adult_screen`.

**Curls.** `biceps-curl` (111) with alternating (114), concentration (113), band (116)
variants. `hammer-curl` (112) and `zottman-curl` (115) kept canonical — distinct grips.

**Triceps.** `triceps-extension` = overhead (118) with lying (120) and band (122) variants.
Kickback (119), close-grip floor press (121), band pressdown (123) kept canonical —
different patterns/implements.

**Wrist/grip.** `wrist-curl` (124) + reverse variant (125); rotation (126) and mobility
circles (132) canonical (different intent: strength vs mobility). `farmer-carry` (127)
canonical + `suitcase-carry` (128) variant.

## Judgment calls worth reviewing

- **WALL equipment code** added to wall-dependent moves (wall push-up, wall slide/angel,
  scapular wall push-up, handstand prep/hold) even though the catalog lists them as BW —
  a wall is genuinely required.
- **ANCH** used for the two "secure anchor" band moves (lat pulldown, triceps pressdown).
- **Specializations:** everything is `["all"]` except `plyometric-push-up`, which excludes
  `"prenatal"` (high_impact). Elevated-risk gating for the rest is left to safety flags
  (`older_adult_screen` on handstand, `fall_risk`, `wrist_load`, etc.) per doc 17's
  rules engine — the catalog itself doesn't justify harder exclusions here.
- **Pike push-up family = "shoulders"** (not "push") — matches its training effect.

## Suspected duplicates in OTHER family groups (11–20) — for sibling seed authors

These catalog entries look like duplicates or near-duplicates of records in this file
(or of each other). Recommend merging into the canonical slugs listed:

- **347** plyometric push-ups (power) = `plyometric-push-up` (52) — variant, not new.
- **127/128** farmer/suitcase carries = **456/457** (blue collar) — same.
- **36** wall push-ups = **433** (office) = **467** (blue collar) = **483** (older adult).
- **61/62** scapular retractions = **434** shoulder blade squeezes (office).
- **89** wall slides = **436** (office). **248** chin tucks (mobility) = **435** (office).
- **258** seated thoracic rotations (mobility) = **437** (office).
- **263** seated figure-four (mobility) = **439** (office).
- **250** doorway chest stretches (mobility) = **449** (office).
- **132** wrist mobility drills = **440** (office) = **464** (blue collar).
- **1** abdominal bracing = **448** seated abdominal bracing (office) ≈ **468** core bracing drills (blue collar).
- **35** pallof presses = **469** (blue collar); **400** core anti-rotation drills (am. football) is related.
- **73** resistance-band rows = **466** (blue collar).
- **181** hip hinges (glutes) = **443** standing hip hinges (office) = **451** hip-hinge technique drills (blue collar).
- **182** DB Romanian deadlifts = **455** (blue collar). **185** DB deadlifts = **454** (blue collar).
- **191** standing calf raises (calves) = **431** (office) = **462** (blue collar).
- **192** supported calf raises = **481** (older adult). **197** toe raises = **482** (older adult).
- **211** seated marching (cardio) = **428** (office) = **478** (older adult).
- **212** standing marching (cardio) = **479** (older adult).
- **283** tandem stance (balance) = **488** (older adult). **284** single-leg stance = **516** single-leg balance games (kids, variant).
- **285** supported single-leg stance (balance) = **489** (older adult) ≈ **444** supported single-leg balance (office).
- **288** heel-to-toe walking (balance) = **490** (older adult).
- **289** side stepping (balance) ≈ **487** supported side steps (older adult).
- **290** backward walking (balance) = **491** controlled backward stepping (older adult).
- **133/134/135** sit-to-stand / assisted squats / chair squats (legs) = **426/427** (office) = **476/477** (older adult).
- **152** step-ups (legs) ≈ **492** step-ups on low platforms (older adult).
- **173/179** standing hip extensions/abductions (glutes) = **494/493** (older adult).
- **33** seated trunk rotations (core) = **495** (older adult).
- **74** seated band rows (pull) = **484** (older adult).
- **111** DB biceps curls ≈ **485** light DB curls (older adult). **95** DB shoulder press ≈ **486** (older adult).
- **32** bear crawls (core) = **502** bear crawls (kids).
- **234** walk-run intervals (cardio) = **415** walk-run intervals (athletics).
- **364/365/366** repeated sprint / shuttle-run / aerobic intervals (soccer) ≈ **234/235/233** (cardio).
- **336** broad jumps (power) = **393** broad jump practice (am. football) = **419** standing long jumps (athletics).
- **335** vertical reach jumps (power) = **394** vertical jump practice (am. football).
- **342/343** hop-and-stick / jump-and-stick (power) ≈ **395** jump landing mechanics (am. football) ≈ **422** landing mechanics (athletics) ≈ **367** jump-and-land drills (soccer).
- **224/225/226** high-knee marching/running, butt kicks (cardio) ≈ **407/408** high-knee / butt-kick drills (athletics).
- **219** stair walking (cardio) ≈ **446** stair-walking breaks (office). **236** stair climbing intervals ≈ **459** (blue collar).
- **215** indoor walking circuits (cardio) ≈ **474** work-break recovery walking (blue collar).
- **199/200** ankle circles/pumps (calves) ≈ **496** seated ankle mobility (older adult).
- **497** gentle walking intervals (older adult) ≈ **216** outdoor walking (cardio).
- **471** controlled floor-to-stand (blue collar) = **498** floor-to-stand practice (older adult).
- **260** hip circles (mobility) ≈ **473** hip mobility drills (blue collar).
- **301** quick-feet drills ≈ **302** fast feet in place (agility) — near-duplicates.
- **213** marching in place ≈ **214** walking in place (cardio) — near-duplicates.
- **309/310** lateral / single-leg line hops (agility) ≈ **343/344** lateral hop-and-stick drills (power).
- **163–166** glute bridges (glutes) ≈ **360** hamstring bridge progressions (soccer).
- **157** squat jumps (legs) = **333** squat jumps (power). **158** split-squat jumps ≈ **339** split jumps (power).
- **240** skater hops (cardio) = **328** skater jumps (agility).
