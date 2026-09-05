# Practice Engine design

Design-only. Engines and rules first. Dashboards last.

Seven coach-facing systems stay: Home, Development, Clients, Content, Messages, Help, Settings.

## Cadence

Push to `Tornicles/Practice-Engine` `main` after every three batches.

| Push | Batches | Status |
|---|---|---|
| A | 1 Foundation, 2 Objectives and planning, 3 Development core | on main |
| B | 4 Clients, 5 Evidence, 6 Methodology | on main |
| C | 7 Conditions, 8 Investigation, 9 Workflows | not started |
| D | 10 Commercial, 11 Products, 12 AI gateway | not started |
| E | 13 Dashboards as interfaces, 14 Proof | not started |

## Law

- Dashboards do not contain business truth
- AI drafts; rules block
- Settings cannot write scores, conditions, evidence, or investigations
- Insufficient evidence is not poor performance
- One winning definition; WIP and definition of done come later
- Evolve `lib/db` and `artifacts/api-server`. Do not wipe Replit. Do not treat `os/` localStorage as production.

## Frameworks

The six individual control laws are constraints inside batches 2, 3, 5, 7, 8, 9, and 12. They are not a Torgima product and not a left menu.
