# Batch 9 — Workflows, Triggers, Execution, Control

Status: design. Owner: Practice OS workflow runtime. Push C.

```
Event → Trigger → Template → Workflow → Steps → Evidence + Event
```

Recommendation accepted instantiates a template. Done requires expected_output and, if flagged, active non-orphaned evidence. Checkbox alone → 409.

WIP: max_active_orders (default 3). New ready work at cap → 409 WORKLOAD_CAP. AI has no bypass.

Blockers: clarity | skill | time | dependency | evidence | policy. Open blocker → step and workflow blocked.

Decision gate before create: aligned to the win, affordable in remaining minutes, survivable (not marked end on a reset review).

Correction workflow last step = executed, not effective (Batch 8 verify still owns that word).

No Workflows dashboard. Home Today will list ready steps in Batch 13.

Done when a coach can accept a recommendation, run two steps under a cap of three, get refused a fourth, and cannot complete a step that still needs evidence.
