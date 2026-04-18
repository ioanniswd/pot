---
paths:
  - "**/*.ts"
---

## TypeScript

- Strict mode, ES2022 target, NodeNext modules
- No `any` — use `unknown` + type narrowing
- No default exports — named exports only
- Prefer `interface` over `type` for object shapes
- Prefer functional style, composition over inheritance
- Export types alongside consuming functions

## Runtime

- Bun only — no Node.js polyfills, no `@types/node`, no `node-fetch`
- Use `Bun.spawn` for shelling out to `gh`, global `fetch` for any HTTP
- Use Bun built-in APIs (file I/O, secrets, etc.)

## Formatting

- Biome (indent 2, single quotes, semicolons, trailing commas es5)
- Run `task check` before committing (lint + typecheck + test)
