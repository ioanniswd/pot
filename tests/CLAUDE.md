# Tests

## Structure

```text
tests/
├── unit/                            # No external dependencies, fast
│   ├── cli/
│   │   ├── format.test.ts           # Table and text output formatting
│   │   └── commands/
│   │       ├── config.test.ts       # Config command behavior
│   │       └── overview.test.ts     # Overview command aggregation logic
│   └── services/
│       ├── github.test.ts           # gh CLI wrapper (mocked Bun.spawn)
│       └── cache.test.ts            # Cache read/write/invalidation
├── integration/                     # Mocked gh CLI, full command flow
│   └── overview.test.ts             # End-to-end overview with mock gh output
├── e2e/                             # Real gh CLI (requires gh auth)
│   └── cli.test.ts                  # Smoke test against real GitHub
└── helpers/
    ├── test-data.ts                 # Factories: makePR(), makePrUser(), makeConfig()
    └── test-utils.ts                # captureOutput(), mockGh(), restoreGh(), suppressOutput()
```

## Running Tests

```bash
task test              # Unit + integration tests
task test:unit         # Unit tests only
task test:e2e          # E2E tests (requires gh auth)
```

## Helpers

- **test-data.ts** — Factory functions that create valid domain objects with sensible defaults. Use `makePR({ title: 'custom' })` to override specific fields.
- **test-utils.ts** — `mockGh(responses)` intercepts `Bun.spawn` calls to `gh`. `restoreGh()` cleans up after each test. `captureOutput()` intercepts stdout/stderr for assertions.

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
