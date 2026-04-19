# Tests

## Structure

```text
tests/
├── unit/
│   └── services/
│       ├── pr.test.ts               # Pr class review-state logic (mocked Bun.spawn)
│       └── github.test.ts           # fetchPrs — gh command, parsing, errors
├── e2e/                             # Real gh CLI (requires gh auth)
└── helpers/
    ├── fixtures/                    # Real gh JSON payloads (9 scenarios)
    ├── setup.ts                     # Sets POT_CONFIG_PATH=/tmp/pot-test-config.json
    ├── test-data.ts                 # Factories: makeRawPr(), makeConfig()
    └── test-utils.ts                # mockGh(), restoreGh()
```

## Helpers

- **test-data.ts** — Factory functions. Use `makeRawPr({ title: 'custom' })` or `makeConfig({ ownerName: 'x' })` to override specific fields.
- **test-utils.ts** — `mockGh(handler)` intercepts `Bun.spawn` calls to `gh`. `restoreGh()` cleans up after each test.
- **fixtures/** — Real `gh pr list --json` payloads captured from actual PRs. One file per review-state scenario.

## Conventions

- Framework: `bun:test` (Jest-compatible `describe`/`it`/`expect`)
- Test files: `*.test.ts` mirroring `src/` structure
- Test behavior and outcomes, not implementation details
- Add a unit test for every bug fix
- Tests are production code: strict types, no `any`, no shortcuts
- Unit tests must not invoke real `gh` or make network calls
- Integration tests mock `gh` at the `Bun.spawn` level
- E2E tests are gated by `gh auth status` success
- Always restore global state (`restoreGh()`) in `afterEach`
