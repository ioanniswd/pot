# Source Code

## Module Guide

- **index.ts** — CLI entry point (shebang + `run()`)
- **logger.ts** — Debug logger (stderr only, enabled via `POT_DEBUG=1`)
- **types.ts** — Domain types: `PR`, `PrUser`, `ReviewStatus`, `Config`, `RegisteredPreset`
- **errors.ts** — Typed error hierarchy (`ConfigError`, `GhError`, `CacheError`)

### cli/

Clerc CLI framework:
- **app.ts** — Top-level command registration and global flags (`--json`, `--cached`, `--user`, `--users`)
- **format.ts** — PR overview table formatters, user-specific PR list formatters
- **commands/config.ts** — Interactive setup wizard (owner, repos, cache preference)
- **commands/overview.ts** — Default command: fetch PR data, aggregate by user, render table

### lib/

Pure logic, no I/O or side effects:
- **pr.ts** — `Pr` class: review state, actionability, approval counts
- **aggregator.ts** — Aggregates `RawPr[]` into per-user metrics (`AggregatedData`)

### services/

External integrations (I/O, network, filesystem):
- **github.ts** — `gh` CLI wrapper. Shells out to `gh pr list` with `--json` flag. All GitHub data flows through here.
- **config.ts** — Config file resolution and persistence (`~/.config/pot/config.json`).

## Key Patterns

- **gh CLI as the API layer** — No direct GitHub REST or GraphQL calls. All data fetched via `gh pr list --json ...` and `gh pr view --json ...`. Auth is handled entirely by `gh`.
- **Aggregate-then-render** — `github.ts` fetches raw PR data; `overview.ts` aggregates it into per-user metrics; `format.ts` renders the terminal table. Concerns are strictly separated.
- **Config resolution chain** — CLI flag → config file (`~/.config/pot/config.json`). No env vars for core config (owner/repos).
- **Named presets** — Stored in config file under `registered` key. `--register-new=name` saves current flags; `--registered=name` restores them.
- **Cache as opt-in** — `--cached` reads from disk cache; default always fetches fresh. Cache is stored per owner+repos combination.
- **JSON output mode** — `--json` flag bypasses table formatting and emits raw aggregated data. Useful for scripting and piping to `jq`.
