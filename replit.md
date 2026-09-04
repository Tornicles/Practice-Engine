# Practice Engine

A connected coach-development workspace that turns learning, simulation, real delivery, reflection, and evidence into stronger coaching ability, distinctive methodology, and reusable intellectual property.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/practice-engine run dev` — run the Practice Engine web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/practice-engine/` — React frontend
- `artifacts/api-server/src/routes/practice.ts` — Practice Engine API routes
- `lib/api-spec/openapi.yaml` — API contract and generated-client source of truth
- `lib/db/src/schema/practice.ts` — coach profile, experience, and practice-session data

## Architecture decisions

- Treat the product as one coach-development flywheel with connected engines, not a bundle of unrelated AI tools.
- The Coach Passport is the shared context layer; experiences and practice history feed every later engine.
- Preserve evidence lineage: methodology, content, courses, and products should trace back to lived experience and validation.
- Build the core loop first: develop → practice → reflect → capture → structure → prove. Expand downstream engines on that foundation.

## Product

- Guided onboarding and persistent Coach Passport
- Daily development focus and skill tracking
- Scenario practice with saved performance feedback
- Experience capture that extracts lessons and principles
- Connected workspaces for delivery, methodology, brand, content, courses, products, proof, and authority

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
