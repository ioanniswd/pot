---
name: pot
description: GitHub PR overview and team workload distribution via CLI. Activate when user mentions "PR overview", "pull request distribution", "team workload", "code review load", "who should review", "pot", "actionables", "blocked PRs", "untouched reviews", or "what should I work on next". Examples: "Show PR overview", "Who has the most PRs?", "Show John's PRs", "What's actionable for my team?", "Should I start a new PR or help someone?".
---

# pot

## Purpose

Keep releases fast, idle time zero, and context switching minimal.

In larger teams, PRs stall because reviewers open new PRs instead of unblocking others. This compounds: more concurrent open PRs → more context switching → slower releases. Developers do this for two reasons: they don't want idle time, and they lack a clear picture of what they are blocking. `pot` solves the latter.

## How to Interpret the Output

```
+---------------+----------+-----------+-------+-------------+-------------+----------------+-----------+
| User          | Authored | Reviewing | Total | Total +/-   | Actionables | Actionable +/- | Untouched |
+---------------+----------+-----------+-------+-------------+-------------+----------------+-----------+
| -- ioanniswd--| 1        | 0         | 1     | 1954 / 1943 | 1           | 1954 / 1943    | 0         |
| bob           | 0        | 2         | 2     | 200 / 100   | 0           | 0 / 0          | 1         |
| alice         | 2        | 3         | 5     | 820 / 340   | 3           | 600 / 200      | 1         |
+---------------+----------+-----------+-------+-------------+-------------+----------------+-----------+
```

**Columns:**

- **Authored** — PRs this user opened and is responsible for
- **Reviewing** — PRs this user is an active reviewer on (requested, or has commented but not approved/rejected)
- **Total** — Authored + Reviewing; the user's total current workload
- **Total +/-** — Lines added / deleted across all active PRs (size signal)
- **Actionables** — PRs where **this user is blocking someone else** and can act right now. For an author: reviewer left comments, ball is in their court. For a reviewer: PR is waiting on them.
- **Actionable +/-** — Lines added / deleted for actionable PRs only
- **Untouched** — PRs where this user was requested as a reviewer but has not yet placed a single comment. They haven't started the review.

**Sorting:** rows are sorted by Total, then Actionables, then Untouched (ascending). The user at the top has the lightest load — a natural candidate for new PR assignments. The user at the bottom is the most loaded.

**Highlighted user** (`-- name --`): the user configured as default (via `pot config`) or passed via `--user`. Their detailed authored and reviewing tables are shown below the overview when `--user` is active.

## Decision Process

Keep releases fast, idle time zero, and context switching minimal. In larger teams,
PRs stall because reviewers open new PRs instead of clearing their actionables. This
compounds: more concurrent open PRs → more context switching → slower releases.

### Column Reference

- **Authored** — PRs this user opened and is responsible for
- **Reviewing** — PRs where this user is an active reviewer (requested, or has commented but not approved/rejected)
- **Total** — Authored + Reviewing; total current workload
- **Total +/-** — Lines added / deleted across all active PRs (size signal)
- **Actionables** — PRs where this user is blocking someone else right now
- **Actionable +/-** — Lines added / deleted for actionable PRs only
- **Untouched** — Reviews requested from this user that they haven't started

Rows are sorted by Total → Actionables → Untouched (ascending).
The top row has the lightest load; the bottom row is the most loaded.
Your row is highlighted (-- username --) when configured via `pot config`.

### Step 1 — Clear your own actionables first

Run `pot`. If your Actionables > 0, address those before anything else (--user=<you> is optional if already set by pot config):
hurt to be explicit):

    pot --user=<you>

Look at your Reviewing table. The "Author: Actionables" column shows how many
actionables the person you are blocking currently has. Start with the PR whose
author has the fewest actionables — they are closest to done, and unblocking them
before they open a new PR keeps context switching minimal.

### Step 2 — Decide: new PR or help a teammate?

- ≤ 3 actionables per person across the team → opening a new PR is fine
- ≥ 4 actionables for someone → consider taking one of their reviews instead

Taking a review instead of opening a new PR:
  - reduces open PRs by 1 instead of adding 1 (a differential of 2)
  - unblocks whatever that PR is blocking
  - keeps releases moving

### Step 3 — Find a review to take

    pot --user=<swamped-teammate>

In their Reviewing table, look for Untouched = Yes. These reviews haven't been
started — they can be handed off cleanly with no lost context on their side.

Contact them politely. You are helping, not judging:
  "Hey, looks like you have a lot on your plate — want me to pick up [PR title]?"

Only do this when they are genuinely swamped. If their actionable count is low,
opening a new PR is the right call.

### Step 4 — Repeat

After each action (review submitted, PR updated, review taken), re-run `pot` and
start from Step 1.

### Step 5 — Assigning Reviewers

When opening a new PR, use the same overview to pick who to request a review from.

    pot

Look at the top of the table — the devs with the lowest Total and fewest Actionables
are closest to idle. They are the closest to opening a new PR themselves, requesting
a review from them again helps reduce the number of concurrent open PRs and keeps
releases moving.

Avoid assigning reviews to devs already at the bottom of the table (high Total or
high Actionables) — they are loaded and adding a review only adds more context
switching for them and slows releases.

### This Tool Is For Everyone, Not Just the Lead

`pot` is designed to be used by each team member individually. It does not require
a team meeting, a manager, or a tech lead to interpret and assign work. Each
team member can use it independently to answer one question: **What should I do next?**
It can still be used by leads to get a quick pulse on the team, but that is not
the intended use case.

## Rules

1. Only activate when GitHub PR workload or code review distribution is mentioned
2. Ensure `gh auth status` succeeds before running pot
3. Use `--user=name` to drill into a specific person's authored and reviewing PRs
4. Use `--cached` only when fresh data isn't needed — default always fetches live
5. When advising on what to do next, follow the decision process from `pot guide`

## Output

Default: terminal table. Use `--json` for raw aggregated JSON (useful for scripting).

```bash
pot                       # full team overview
pot --user=john           # drill into a specific user (overview + authored + reviewing tables)
pot --json                # raw JSON
pot --user=john --json    # raw JSON with authored and reviewing arrays
```

## Common Patterns

```bash
# Filter table to specific users
pot --users=alice,bob

# Only actionable PR URLs for a user (pipe to xdg-open, etc.)
pot --user=alice --url-only --actionable=true

# Non-actionable PR URLs (waiting on others)
pot --user=alice --url-only --actionable=false

# Use specific owner and repos (overriding config)
pot --owner-name=myorg --repository-names=repo1,repo2

# Use a saved preset
pot --registered=myteam

# Speed up with cached data
pot --cached
```

## Setup

```bash
# First-time setup (sets owner, repos, cache preference, and your GitHub username)
pot config

# Save a preset for quick reuse
pot --owner-name=myorg --repository-names=api,frontend --register-new=myteam

# Verify gh is authenticated
gh auth status
```

## References

- **Full help:** `pot --help`
- **README:** see the *How It Works* and *Decision Process* sections
