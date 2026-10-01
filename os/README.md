# Forge — AI Personal Trainer

Forge is an AI personal trainer for home fitness: adaptive home workouts, grocery-photo meal plans, work-aware programming, and run training — all on one adaptive plan.

This is the `os/` surface of Practice-Engine, reshaped into Forge. AI suggests, you decide: every AI output starts as a draft and nothing becomes active until the user confirms it. Templates work offline and are labeled clearly.

## Run it

```bash
cd os
npm install
npm run dev
```

The app boots with a rich demo persona (**Alex Rivera** — sedentary WFH engineer, dumbbells + bands, goal: lose 8kg + run 5K) so every page has data on first load. Use **Settings → Data → Reset demo data** to restore it, or **Export all data (JSON)** for a full backup.

## Pages (7 nav items)

- **Home** (`/`) — Today's training + fuel, nudges, streak/readiness KPIs
- **Train** (`/train`) — Today's session with an adapt gate (15-min / low-impact / bodyweight), session logging with difficulty ratings, AI + template plan generation, exercise library
- **Fuel** (`/fuel`) — Grocery photo → AI vision ingredient extraction → meal plans from what's actually there
- **Run** (`/run`) — Walk/run progression plans (5K/10K/habit), run logging with pace
- **Progress** (`/progress`) — Weekly volume charts, difficulty-rating distribution, evolving avatar
- **Coach** (`/coach`) — AI chat with your trainer, work-adaptation panel, draft review hub
- **Settings** (`/settings`) — Profile, occupation/work type, equipment, coach persona, data export

## Key systems

- `src/lib/types.ts` — fitness domain model (profiles, plans, sessions, scans, meals, runs, avatar)
- `src/lib/exercises.ts` — 40-exercise home-workout library with filters + template session builder
- `src/lib/engine-loop.ts` — streaks, avatar XP stages (spark → ember → forge → titan), today's schedule, nudges, readiness
- `src/lib/ai.ts` — xAI (Grok) server functions: `generateWorkout`, `extractGroceries` (vision), `planMeals`, `planRunProgression`, `adaptForOccupation`, `coachChat`. All degrade without `XAI_API_KEY` to labeled deterministic templates.
- `src/lib/store.ts` — Zustand store, persisted under `forge-v1`
- `src/lib/seed.ts` — Alex Rivera demo persona
- `src/lib/export.ts` — full-data JSON export

## Conventions

- Exactly 7 nav items (`src/lib/nav.ts`)
- AI drafts only — confirm before activate; templates labeled
- Non-medical disclaimer in Coach and Settings
- Small, portable components so pages can later move to the Expo app
