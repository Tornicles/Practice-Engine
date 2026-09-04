---
name: Node 24 TypeScript ESM imports
description: How to keep source-run TypeScript tests compatible with the workspace compiler and Node 24 ESM resolution.
---

Use explicit `.ts` extensions for relative runtime imports reached by Node's built-in TypeScript test runner. For declaration-only composite libraries, enable `allowImportingTsExtensions`.

**Why:** Node 24 rejects directory imports and extensionless ESM imports when tests execute TypeScript source directly, while TypeScript otherwise rejects `.ts` extensions.

**How to apply:** When a database-backed or other integration test imports production source directly, ensure every runtime import in that path is explicit; type-only imports do not require changes. After OpenAPI regeneration, recheck generated runtime barrel exports because the generator may restore extensionless paths.