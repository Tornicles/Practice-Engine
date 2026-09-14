---
name: Structured AI text fields
description: Handling semantically valid AI responses that wrap required text fields in nested JSON objects.
---

Normalize generated fields that are contractually strings when the model returns arrays or nested objects containing usable text, while preserving object labels. Continue to reject fields with no textual content.

**Why:** Structured generation and review can return a semantically useful field such as an insight as an object of observation and inference. Parsing that directly as a string turns a recoverable response variation into a user-visible 502.

**How to apply:** Normalize only at the AI-output boundary before strict contract validation. Do not weaken public API schemas or silently invent fallback content.