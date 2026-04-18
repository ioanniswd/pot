# GitHub Configuration

## SHA Pinning Policy

All actions pinned to **full 40-character commit SHAs**. Tags are mutable and can be hijacked — SHAs are immutable.

Format: `uses: owner/action@<full-sha>  # v1.2.3`

Resolve latest version and SHA:

```bash
for repo in actions/checkout actions/upload-artifact actions/download-artifact actions/cache oven-sh/setup-bun; do
  tag=$(gh api "repos/$repo/releases/latest" --jq '.tag_name')
  ref=$(gh api "repos/$repo/git/ref/tags/$tag" --jq '.object')
  type=$(echo "$ref" | jq -r '.type')
  sha=$(echo "$ref" | jq -r '.sha')
  if [ "$type" = "tag" ]; then
    sha=$(gh api "repos/$repo/git/tags/$sha" --jq '.object.sha')
  fi
  echo "$repo@$tag → $sha"
done
```

## CI Workflow (`workflows/ci.yml`)

- Triggers: push to any branch, PRs to `main`
- Permissions: `contents: read` only
- Jobs: lint-and-typecheck → [unit-tests, build] (parallel) → integration-tests
- Uses `task` commands for all CI steps

## Release Workflow (`workflows/release.yml`)

- Triggers: push of `v*` tags
- Permissions: `contents: write`, `actions: read`
- Verifies CI passed for the tagged commit before building
- 6-platform binary matrix: linux-x64, linux-arm64, darwin-x64, darwin-arm64, windows-x64, windows-arm64
- Binary naming: `pot-<os>-<arch>[.exe]`
- Creates GitHub release with compiled binaries

## Custom Actions

### `.github/actions/setup-bun-env/`

Installs Bun and caches dependencies via `bun install --frozen-lockfile`.
