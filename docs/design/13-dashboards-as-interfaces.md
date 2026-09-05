# Batch 13 — Dashboards as Interfaces

Status: design. Push E.

GET /api/home, /today, /week, /month, /development, /clients, /content, /messages, /help, /settings are DTO reads. Writes stay on domain APIs.

Home surfaces existing ready steps, recommendations, follow-ups, conditions. It does not invent next actions or recompute levels. Home level must equal GET /conditions.

Maturity is a projection from events. Passport accrual copies focus/counts and bumps version. It does not overwrite narrative.

Messages may complete a follow-up or draft experience. They are not the commitment store.

os/ gains preview vs live. compute.ts is preview only. Live uses Clerk and APIs. Preview does not write Postgres.

No eighth nav item.

Done when live Home shows the same Declining word as the condition API, Today matches ready steps, and preview Maya still boots offline.
