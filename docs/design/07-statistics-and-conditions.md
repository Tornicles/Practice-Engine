# Batch 7 — Statistics and Conditions

Status: design. Owner: Statistics & Condition (Engine 10). Push C.

```
Event → Measurement → Statistic → Trend → Sufficiency → Versioned rule → Condition
```

Levels only: Healthy, Stable, Improving, Declining, At Risk, Critical, Insufficient Evidence.

No PATCH /conditions. No Poor Performance. Zero events = Insufficient Evidence, not Declining. One point is never a decline.

Rules are versioned JSON. Sufficiency guard is the first branch. Settings may override numeric thresholds only and cannot remove the guard.

Views/likes increment noise_count unless a Batch 2 signal definition has counts_as_signal = true. Growth conditions use signal_count.

Overall rollup: Critical beats At Risk beats Declining. Do not average levels.

AI may explain into audit. It may not write the condition row.

GET /api/conditions and GET /api/statistics only. System recompute after events.

Done when a coach with no history sees Insufficient Evidence, and three accepted declining skill observations produce Declining with a rule version they cannot edit.
