# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-04-18

### Added
- Full rewrite in TypeScript with Bun as the runtime and package manager
- Standalone binary releases for 5 platforms (linux/darwin × x64/arm64, windows x64) via `bun build --compile`
- `pot config` interactive setup wizard (replaces `--config` flag)
- `--json` flag for raw JSON output — useful for scripting and `jq` pipelines
- Named preset system: `--register-new=<name>` saves options, `--registered=<name>` restores them
- GitHub Actions CI (lint, typecheck, unit tests, build) and automated release workflow
- Biome for linting and formatting; Lefthook for pre-commit hooks; go-task as task runner

### Changed
- **BREAKING**: CLI rewritten from Ruby gem to standalone binary — install via binary download or `bun link`
- **BREAKING**: `--config` flag replaced by `pot config` subcommand
- **BREAKING**: Config file moved to `~/.config/pot/config.json` (JSON format)
- **BREAKING**: Cache stored at `~/.config/pot/cache/` (was `pot_root_folder/cached_response`)
- **BREAKING**: `--register_new` / `--registered` renamed to `--register-new` / `--registered`
- **BREAKING**: `--owner_name` / `--repository_names` renamed to `--owner-name` / `--repository-names`

### Removed
- Ruby gem packaging and `Gemfile` — no longer a gem
- `install.sh` — replaced by binary download from GitHub Releases

## [2.0.0] - 2026-01-10

### Added
- Comprehensive unit tests with RSpec

### Changed
- **BREAKING**: Replaced direct GitHub GraphQL HTTP API with GitHub CLI (`gh`)
- **BREAKING**: Requires GitHub CLI (`gh`) v2.0+ installed and authenticated
- Authentication now managed by `gh auth login` instead of environment variables
- Significantly improved reliability — eliminated timeout issues with the deprecated GraphQL API
- Built-in rate limit handling via GitHub CLI
- Better error messages and automatic error handling

### Removed
- `GAT` environment variable — no longer used or required
- Direct HTTP/GraphQL implementation

## [1.2.1] - 2022-06-21

### Changed
- Make specified user more visible in aggregated view

## [1.2.0] - 2022-06-21

### Removed
- Enterprise GitHub URL config option — uses `github.com` by default

## [1.1.1] - 2020-09-16

### Fixed
- Defaults not being used properly
- `--users` option not specified edge case

## [1.1.0] - 2020-09-14

### Added
- Basic UI
- `--cached` flag for speed improvements

### Changed
- Refactored for readability and easier contributions

[Unreleased]: https://github.com/ioanniswd/pot/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/ioanniswd/pot/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/ioanniswd/pot/compare/v1.2.1...v2.0.0
[1.2.1]: https://github.com/ioanniswd/pot/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/ioanniswd/pot/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/ioanniswd/pot/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/ioanniswd/pot/releases/tag/v1.1.0
