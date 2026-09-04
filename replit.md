# Startup Man

A connected coach-development workspace that turns learning, simulation, real delivery, reflection, and evidence into stronger coaching ability, distinctive methodology, and reusable intellectual property.

Public brand details:
- Website: `https://startupmans.com`
- Office: Dallas, Texas, USA
- Contact: `info@startupmans.com`

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/practice-engine run dev` — run the Startup Man web app
- `pnpm --filter @workspace/practice-engine-mobile run dev` — run the iOS/Android Expo app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `scripts/post-merge.sh` runs the non-interactive Drizzle schema push after task merges; Replit Publish diffs development against production and applies the reviewed production schema change
- Required env: `DATABASE_URL` — Postgres connection string
- AI access uses Replit AI Integrations for OpenAI through the managed `AI_INTEGRATIONS_OPENAI_*` environment variables.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/practice-engine/` — React frontend
- `artifacts/practice-engine-mobile/` — primary mobile experience for iOS and Android
- `artifacts/api-server/src/routes/practice.ts` — Startup Man API routes
- `artifacts/api-server/src/routes/intelligence.ts` — grounded AI simulation, extraction, asset generation, and orchestration
- `artifacts/api-server/src/lib/practice-intelligence.ts` — shared AI client, prompt governance, and strategy routing
- `lib/api-spec/openapi.yaml` — API contract and generated-client source of truth
- `lib/db/src/schema/practice.ts` — coach profile, experience, practice-session, IP asset, and prompt-run data

## Authentication deployment

- Startup Man uses Replit-managed Clerk. `VITE_CLERK_PROXY_URL` is intentionally empty in development and is injected by Replit for published builds.
- Keep `proxyUrl={clerkProxyUrl}` unconditional. Do not hardcode `/api/__clerk`, add production gates, or manually configure Clerk proxy secrets; those changes break Replit's automatic development/production switching.

## Architecture decisions

- Treat the product as one coach-development flywheel with connected engines, not a bundle of unrelated AI tools.
- Treat mobile as the primary product experience; keep the web app as a connected companion using the same accounts, API, and coach-owned data.
- The Coach Passport is the shared context layer; experiences and practice history feed every later engine.
- Preserve evidence lineage: methodology, content, courses, and products should trace back to lived experience and validation.
- Treat broad prompt libraries as hidden strategy inputs, never as expertise or proof. Select and adapt strategies from live context instead of exposing raw prompt lists.
- Organizational intelligence uses a curated, versioned neutral strategy layer only. Never load the management volumes at runtime or reproduce their source-specific doctrine, terminology, attribution, coercive practices, punitive personnel systems, recruitment methods, or high-impact employment decisions.
- AI generation uses route-specific strategy selection followed by a separate evidence and source-safety review. Prompt-run audits store strategy metadata and generic summaries, not raw prompts or sensitive free-form coach content.
- AI-generated methodology and market assets remain drafts until their validation gaps are resolved.
- Build the core loop first: develop → practice → reflect → capture → structure → prove. Expand downstream engines on that foundation.

## Visual direction

- Use `attached_assets/practice_engine_complete_1788517743907.html` as the visual source of truth.
- The interface is a compact dark coaching operating system: charcoal surfaces, fine borders, amber/gold signals, grouped fixed navigation, sticky utility bar, dense cards, KPI rows, timelines, and restrained radii.
- Preserve information density and the Experience → Expertise → IP hierarchy. Avoid glossy gradients, oversized empty hero areas, excessive pills, and generic light SaaS styling.

## Product

- Guided onboarding and persistent Coach Passport
- Daily development focus and skill tracking
- Multi-turn AI client simulation with per-turn observations, skill focus, scores, reflections, and saved history
- AI-assisted experience capture that extracts editable lessons, principles, insights, framework candidates, and evidence gaps
- Traceable Experience → Expertise → IP generation with persisted source lineage and validation status
- Context-aware next-best-action orchestration based on the Coach Passport, recent practice, experiences, assets, objective, and available time
- Connected generation workspaces for methodology, brand, content, courses, products, proof, and authority

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
