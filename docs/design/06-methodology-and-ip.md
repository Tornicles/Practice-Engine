# Batch 6 — Methodology and IP

Status: design. Owner: Methodology & IP (Engine 5). Depends on Batch 5. Push B.

## Purpose

Validated expertise becomes a versioned, testable method.

```
Expertise → Method → Framework → Protocol → Tool
                → MethodVersion → MethodTest
                → Application → Result → Evidence
```

## Hard rules

- draft → validated without a passing test → 409
- Do not PATCH a current version. New version only.
- Test complete requires evidence. Assumption-only pass → 422.
- AI drafts methods. Cannot publish, test-complete, or set validated.
- `commercial_eligible` is computed: validated + passing test on current version + evidence. Batch 10 reads it. Settings cannot set it.
- Last passing test fails → method returns to in_test and commercial_eligible false.
- Failed test does not auto-open an investigation.

## Method machine

draft → in_test → validated → retired.
validated → in_test if current version loses all passing tests.

## API

```
GET/POST /api/methods
POST /api/methods/:id/versions
POST /api/methods/:id/tests
POST /api/methods/:id/applications
GET /api/frameworks
```

No Methodology dashboard. Lives under Development.

## Done when

Coach can draft a method, publish a version, apply it in a session, record a passing test with real evidence, and cannot call an untested draft validated.
