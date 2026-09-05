# Operate

Design and engine code for batches 1-14 are on `main`.
`os/` still defaults to preview localStorage (`practice-engine-v3`).

## 1. Push schema

```
cd lib/db && pnpm drizzle-kit push
```

## 2. Run tests

```
cd artifacts/api-server && pnpm test
```

Need `DATABASE_URL`. Critical files:

- `test/foundation-me.test.ts`
- `test/strategy-lock.test.ts`
- `test/objectives-programs.test.ts`
- `test/development-skills.test.ts`
- `test/clients-delivery.test.ts`
- `test/expertise-evidence.test.ts`
- `test/methods.test.ts`
- `test/conditions.test.ts`
- `test/investigations.test.ts`
- `test/workflows.test.ts`
- `test/commercial.test.ts`
- `test/products.test.ts`
- `test/ai-gateway.test.ts`
- `test/home.test.ts`
- `test/golden-path.test.ts`

## 3. Live UI flag

`os/src/lib/live-api.ts` is opt-in.

```
VITE_PRACTICE_LIVE=1
```

Without the flag, Maya preview still boots offline.
Do not point Zustand writes at these APIs until the suite is green.

## 4. Still not done

- Home page still reads `compute.ts` in preview
- Live Home/Today fetchers are not wired into the route files yet
- Clerk session must already work for `/api/practice/*`
