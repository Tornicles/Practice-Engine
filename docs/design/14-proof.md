# Batch 14 — Proof

Status: design. Push E. Design program complete.

Unit: condition sufficiency, skill projection, workflow transitions, commercial_eligible, single-reading win, signal vs noise.

Integration: command → event → statistic → condition; win → client; accept → workflow.

Critical cases: no unsourced facts; orphaned evidence cannot validate; no PATCH /conditions; AI cannot validate expertise or flip levels; draft method cannot skip tests; effective needs a later measurement; WIP cap holds; views are not signals; triple-win will not lock; coach isolation.

Golden path: locked win → gap → recommendation → practice → evidence → simulation → assessment → client session → experience → pattern → expertise → method test → content signal → eligible offer → SALE_WON → client new. No skipped arrows.

Tests live under artifacts/api-server/src/tests/. Live path never reads Zustand.

Done when golden-path.test.ts is green on a clean database.
Implementation starts at Batch 1 schema, not at a new dashboard.
