---
name: pot
description: GitHub PR overview and team workload distribution via CLI. Activate when user mentions "PR overview", "pull request distribution", "team workload", "code review load", "who should review", or "pot". Examples: "Show PR overview", "Who has the most PRs?", "Show John's PRs", "What's actionable for my team?".
---

# pot

## Rules

1. Only activate when GitHub PR workload or code review distribution is mentioned
2. Always use `--json` and pipe through `jq` to keep context small
3. Ensure `gh auth status` succeeds before running pot
4. Use `--user=name` to drill into a specific person's authored and reviewing PRs
5. Use `--cached` only when fresh data isn't needed — default always fetches live

## Output

Default: terminal table. With `--json`: raw aggregated JSON.

```bash
# JSON output for scripting
pot --json | jq '.users[] | {username, authored, reviewing, actionable}'
pot --user=john --json | jq '{authored: .authored[], reviewing: .reviewing[]}'
```

## Primary Workflow: Team PR Overview

```bash
# 1. Show full team overview
pot --json | jq '.users[] | {username, total, actionable}'

# 2. Drill into a specific user
pot --user=john --json | jq '{authored: [.authored[] | {title, actionable}]}'

# 3. Get just actionable PR URLs for a user
pot --user=john --url-only --actionable=true
```

## Common Patterns

```bash
# Filter table to specific users
pot --users=alice,bob --json | jq '.users[] | {username, total, actionable}'

# Show all PRs for a user (authored + reviewing)
pot --user=alice --json

# Only actionable PR URLs for a user
pot --user=alice --url-only --actionable=true

# Non-actionable PR URLs (waiting on others)
pot --user=alice --url-only --actionable=false

# Use specific owner and repos (overriding config)
pot --owner_name=myorg --repository_names=repo1,repo2 --json

# Use a saved preset
pot --registered=myteam --json

# Speed up with cached data
pot --cached --json | jq '.users[] | {username, actionable}'
```

## Setup

```bash
# First-time setup
pot config                           # Interactive: owner, repos, cache preference

# Save a preset for quick reuse
pot --owner_name=myorg --repository_names=api,frontend --register-new=myteam

# Verify gh is authenticated
gh auth status
```

## References

- **Full help:** `pot --help`
