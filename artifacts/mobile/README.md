# Forge — AI Personal Trainer (mobile)

Clean-room Expo (SDK 57) mobile app. Original code; no third-party app code or
assets reproduced. Competitive patterns (post-session feedback loops, adapt
gates, benchmark PBs, streak forgiveness) were studied from public sources and
reimplemented from scratch.

## Run

```bash
npm install
npx expo start        # scan the QR code with Expo Go
npx tsc --noEmit      # typecheck
```

First launch seeds **Alex Rivera** demo data (3 weeks of history) so every tab
feels alive. Reset anytime: Profile → Data → Reset demo data.

## Product

- **Onboarding quiz** — goals, equipment, fitness level + push-up benchmark,
  occupation/work type (sedentary / standing / physical / shift), schedule,
  injuries, running goal, diet, avatar.
- **Today** — readiness score, streak + streak lives, nudges, today's
  strength/run/fuel at a glance.
- **Train** — plan → **adapt gate** (15-min / low-impact / bodyweight-only) →
  session player (timers, rest screens, cues) → difficulty rating
  (too easy / just right / too hard) → next session adapts. Benchmark
  workouts with PB history.
- **Fuel** — grocery photo (expo-image-picker) → ingredient extraction →
  meal ideas from what's on hand; manual entry; dietary prefs; calorie
  target from occupation activity multiplier.
- **Run** — Couch-to-5K / 10K / habit progressions, run logging with pace,
  weekly mileage.
- **Progress** — Forge Score (multi-metric snapshot), **evolving avatar**
  (Spark → Ember → Forge → Titan), volume charts, rating distribution,
  benchmark PBs, 28-day activity calendar.
- **Coach** — AI chat + "AI suggests, you decide" draft-review hub.
  Non-medical disclaimer included.
- **Profile** — avatar studio (photo or generated SVG), occupation,
  equipment, diet, reminders, **one-tap full JSON export**.

## AI

All AI features work **without an API key** via labeled template/rule-based
fallbacks (never presented as AI output). To plug in xAI/Grok later, set
`EXPO_PUBLIC_XAI_API_KEY` — single config point in `lib/ai.ts` (`AI_CONFIG`).
Production should proxy through a server instead of shipping the key in the
client (noted in code).

## Avatars

`components/Avatar.tsx` — original generative SVG avatar. XP stages
(0/100/300/600) change aura rings, flame size, armor accents, and crown.
Photo upload overrides the SVG with a stage-colored ring.

## State

Zustand + AsyncStorage (`forge-state-v1`). Engine logic (streaks with
Seven-style 3-lives forgiveness, readiness, nudges, XP) in `lib/engine.ts`.

## Repo placement

When pushing to Practice-Engine, these files belong under
`artifacts/mobile/` (fresh Expo app; replaces nothing — the old
`artifacts/practice-engine-mobile` was the coach product).
`app.json` plugin `expo-notifications` icon references `./assets/icon.png` —
add a real icon asset before store submission (currently a placeholder path).
