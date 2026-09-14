---
name: Shared React Query context
description: Prevent provider failures when shared generated hooks are consumed by web and mobile apps with different React versions.
---

Treat React Query as a peer runtime of the shared API client, while retaining it as a development dependency for type generation. Dedupe it in web bundler resolution.

**Why:** When the shared client owned its runtime dependency, pnpm resolved separate React Query builds against different React peer versions. The app mounted one context while generated hooks read another, producing “No QueryClient set” despite a visible provider. Peer-only removed the duplicate runtime but also removed local type inference for mobile.

**How to apply:** Keep runtime ownership with each consuming app, keep development-only type support in the shared client, and preserve the bundler dedupe entry when changing React, React Query, generated-client, or workspace dependency versions.