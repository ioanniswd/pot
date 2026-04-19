# pot

Bun-native TypeScript CLI for GitHub PR overview and team workload distribution. Uses the GitHub CLI (`gh`) for all API access.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `POT_CONFIG_PATH` | Override config file location (default: `~/.config/pot/config.json`) |
| `POT_DEBUG` | Set to `1` for verbose gh command logging |

## Commands

```bash
# Setup
bun install                          # Install dependencies
task build                           # Compile TypeScript to build/
task clean                           # Remove build/ and dist/

# Quality
task lint                            # Lint with Biome
task format                          # Format with Biome (write)
task test                            # Run tests (bun test)
task check                           # Lint + typecheck + tests (parallel)

# Pipelines
task ci                              # Full CI locally: clean -> install -> format:check -> check -> build

# Release
task compile                         # Build standalone binary for current platform
task compile:all                     # Build binaries for all 6 platforms

# Auth (delegates to gh)
gh auth login                        # Authenticate with GitHub (required before using pot)
gh auth status                       # Verify authentication

# Run (dev, without compiling)
bun run src/index.ts config          # Interactive setup (owner, repos, cache)
bun run src/index.ts                 # Show PR overview table
bun run src/index.ts --user=john     # Show user-specific PR breakdown
bun run src/index.ts --users=a,b     # Filter table to specific users
bun run src/index.ts --cached        # Use cached data from previous run
bun run src/index.ts --json          # Output raw JSON
```

## Architecture

```text
src/
├── index.ts              # CLI entry point (shebang + run)
├── logger.ts             # Logger (stderr, enabled via POT_DEBUG=1)
├── types.ts              # Domain types (PR, PrUser, ReviewStatus, etc.)
├── errors.ts             # Error type hierarchy
├── cli/
│   ├── app.ts            # Clerc command registration + global flags
│   ├── format.ts         # Table and text formatters for PR data
│   └── commands/
│       ├── config.ts     # `pot config` — interactive setup wizard
│       └── overview.ts   # `pot` (default) — aggregate PR overview table
├── lib/
│   ├── pr.ts             # Pr class — review state logic (pure)
│   └── aggregator.ts     # Aggregates raw PRs into per-user metrics (pure)
└── services/
    ├── github.ts         # gh CLI wrapper (fetch PRs, reviews, approval status)
    ├── cache.ts          # File-based response cache (~/.config/pot/cache/)
    └── config.ts         # Config file management (~/.config/pot/config.json)
tests/
├── unit/
│   └── services/
│       ├── pr.test.ts    # Pr class review-state logic
│       └── github.test.ts # fetchPrs — gh command, parsing, errors
├── e2e/                  # Real gh CLI (requires gh auth)
└── helpers/
    ├── fixtures/         # Real gh JSON payloads (9 scenarios)
    ├── setup.ts          # Sets POT_CONFIG_PATH for test isolation
    ├── test-data.ts      # Factories: makeRawPr(), makeConfig()
    └── test-utils.ts     # mockGh(), restoreGh()
```

## Prerequisites

- **Bun** — runtime and package manager (`curl -fsSL https://bun.com/install | bash`)
- **go-task** — task runner (`sh -c "$(curl -L https://taskfile.dev/install.sh)" -- -d -b ~/.local/bin`)
- **GitHub CLI (`gh`)** v2.0+ — handles all GitHub API access and authentication (`https://cli.github.com`)

## Principles

- Never implement backward compatibility — refactor boldly
- Be concise and direct — let the code speak for itself
- Do not generate documentation files unless explicitly asked
- Document current state only, never changes or history
- When moving a source file to a different directory, check the tree and move its test file to the matching location under `tests/`
