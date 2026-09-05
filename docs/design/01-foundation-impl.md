# Batch 1 implementation

Shipped on `main` (code, not only design).

## Added

- `lib/db/src/schema/foundation.ts` — `coach_passports`, `audit_log`, `idempotency_keys`
- `artifacts/api-server/src/lib/coach-foundation.ts` — ensure coach/passport, append-only audit
- `GET/PATCH /api/me`
- `GET/PATCH /api/me/passport`
- `GET /api/me/audit`
- `artifacts/api-server/test/foundation-me.test.ts`

## Rules enforced now

- Unauthenticated `/me` → 401
- `practiceScore` / `streak` on PATCH `/me` → 403
- Passport edit bumps version, sets `source = coach_edit`, writes audit
- Coach A audit does not include Coach B

## Operator step

Run Drizzle against the provisioned database so the new tables exist:

```
cd lib/db && pnpm drizzle-kit push
```

Then run `artifacts/api-server` foundation tests with `DATABASE_URL`.

`os/` is still preview localStorage. Do not point it at these APIs until Batch 13.
