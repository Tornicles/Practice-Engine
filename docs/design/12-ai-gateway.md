# Batch 12 — AI Gateway

Status: design. Engine 12. Push D.

```
Request → Intent → Engine → Context → Evidence → Knowledge
  → Prompt → Model → Validation → Proposed command → Coach/engine write
```

Prompts are a hidden versioned registry, not a menu. Knowledge units are neutralized. No runtime management volumes. Context is a capped package, not the whole store. Chat is not the system of record.

Source priority: rules > evidence > validated coach knowledge > curated units > AI interpretation > suggestion.

Before the model: challenge vague multi-win input; refuse new orders at WIP cap; refuse views-as-signal; do not open cases from Insufficient Evidence.

High risk (lock, validate, win, publish, effective) requires coach approval which then calls the real engine command. Existing five server functions become intents.

POST /api/ai returns proposed_command. It never writes a condition.

No AI dashboard.

Done when “do everything” is challenged, one approved draft creates a row through an engine, and the prompt version is on the audit line.
