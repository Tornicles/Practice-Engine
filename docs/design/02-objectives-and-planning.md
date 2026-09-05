# Batch 2 — Objectives and Planning

Status: design  
Owner engine: Practice OS (Engine 1) owns direction lock  
Supporting engines: Development reads focus; Content/Commercial read marketing plan later  
Depends on: Batch 1 (coach, passport, audit, idempotency, 409)  
Unlocks: Batches 3, 9, 10, 11  
Push: A

## 1. Purpose

Give the coach one locked direction and a nested planning tree.

After this batch the system can answer:

- What does winning look like?
- Where are we allowed to operate?
- Why would someone choose this coach?
- Can they actually execute this?
- What program, target, and production output sit under that win?

This batch stores plans. It does not execute them. Orders, WIP, and blockers are Batch 9.

## 2. Core law

**If direction is unclear, execution is waste.**

Also:

- One active winning definition per coach
- Two readings of the win = invalid
- Advantage must be current capability, not branding
- Strategy does not lock if the capability check fails
- Settings cannot rewrite a locked win without a reset path (Batch 8)
- AI may propose a win. The coach command locks it
- Planning templates become objects. They are not left-nav and not runtime volumes

## 3. Object graph

```
Coach
 └── StrategyLock            (0..1 active)
      ├── WinningDefinition
      ├── FocusArena
      ├── AdvantageChoice[]  (1..2)
      ├── CapabilityCheck
      └── Policy
Coach
 └── Objective[] → Target[] → SuccessIndicator[]
Coach
 └── Program[] → Plan[] → Phase[] → Project[] → Action[]
      Orders are Batch 9
Coach
 └── OperationsBlueprint
 └── MarketingPlan → ConversionPath + RetentionMechanism + SignalDefinition
```

## 4. Strategy lock

Winning definition: one statement, metric, target, unit, deadline, visible result. Status `draft | active | superseded | failed`. Active count = 0 or 1. Two interpretations → 400. Active win cannot be PATCHed.

Focus arena: who, offer, where, how_reach (1–2 channels), exclusions required (min 1).

Advantage: 1–2 of speed | quality | niche | trust | cost. Must match capability strengths.

Capability check: strengths / weaknesses / missing. Verdict `keep_strategy | adjust_strategy`. Adjust blocks lock (409).

Policy: focus | capacity | commercial | quality. Protects focus. Does not write scores.

`strategy.lock` requires valid win, exclusions, 1–2 matched advantages, keep_strategy, one focus policy.

## 5. Objectives and targets

Objectives: type development | client | content | commercial | product | practice. Role primary | supporting. Status draft → active → done | blocked | cancelled. No draft → done. One primary. Must serve the win.

`declareDone` is a coach declaration. Not a measurement. Production targets cannot be `met` until Batch 7.

Target levels: purpose → major → primary → vital[] + operating[] → production[]. One purpose and one major per objective. Production names a tangible output.

Success indicators define metric/unit/direction/target. They do not store measured values.

## 6. Programs and plan tree

Program domain: development | client | content | commercial | product | operations. Tier basic | advanced | premium.

Plan intent: foundation | proof | growth | other. Actions require `expected_output`. `action.markReady` only. Orders wait for Batch 9.

Tier completeness to activate:

- Basic: win + arena + purpose + major + primary
- Advanced: + vital + operating + production + indicators + stakeholders
- Premium: + risks + milestones + budget_note + governance_note

## 7. Operations and marketing

Operations blueprint: at most one `current`. Narrative only. Settings cannot mark KPIs achieved.

Marketing plan: max 2 channels while current. Conversion path has entry, steps, final_action (follow | book | buy | join). Retention has cadence + mechanism.

Signal definitions: message | sale | booking | return | commit may count. Likes/views `counts_as_signal = false`.

## 8. API

```
GET/POST /api/strategy
POST /api/strategy/check
POST /api/strategy/lock
GET/POST /api/objectives
POST /api/objectives/:id/activate
POST /api/objectives/:id/declare-done
GET/POST /api/programs
GET /api/programs/:id/tree
POST /api/programs/:id/activate
GET/PATCH /api/operations
GET/PATCH /api/marketing
```

No Strategy dashboard.

## 9. AI limits

May propose a single-reading win, exclusions, and a Basic tree. May not lock, activate, declare done, invent an unmatched advantage, or publish marketing.

Triple-win input is rejected by the rule engine.

## 10. Tests

Two-outcome win → 400. Empty exclusions → 400. Three advantages → 409. Adjust capability → 409. Second active win → 409. Objective ignores win → 422. Premium without risks → 409. Three channels → 422. AI cannot lock. Settings cannot PATCH active win. Production target cannot be met. Audit on lock and supersede.

## 11. Done when

A coach can lock one strategy, hang a Basic program under it, and be refused a vague or double win. No work has been executed yet.
