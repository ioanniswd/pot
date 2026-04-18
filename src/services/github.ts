import { readCached, writeCached } from '../config.js';
import { ConfigError, GhError } from '../errors.js';
import { log } from '../logger.js';
import type { Config, OverviewOptions, RawPr } from '../types.js';

const GH_FIELDS =
  'number,title,url,author,additions,deletions,reviews,reviewRequests';

export async function checkGhInstalled(): Promise<void> {
  const proc = Bun.spawn(['gh', '--version'], {
    stdout: 'ignore',
    stderr: 'ignore',
  });
  await proc.exited;
  if (proc.exitCode !== 0) {
    throw new GhError(
      'GitHub CLI (gh) is not installed or not in PATH.\n' +
        'Install from https://cli.github.com, then run: gh auth login'
    );
  }
}

export async function checkGhAuth(): Promise<void> {
  const proc = Bun.spawn(['gh', 'auth', 'status'], {
    stdout: 'ignore',
    stderr: 'ignore',
  });
  await proc.exited;
  if (proc.exitCode !== 0) {
    throw new GhError('Not authenticated with GitHub. Run: gh auth login');
  }
}

export async function fetchPrs(
  config: Config,
  options: OverviewOptions
): Promise<RawPr[]> {
  const ownerName = options.ownerName ?? config.ownerName;
  const repoNamesRaw =
    options.repositoryNames ?? config.repositoryNames.join(',');

  if (!ownerName) {
    throw new ConfigError(
      'owner_name must be set in config or passed via --owner-name'
    );
  }

  const repoNames = repoNamesRaw
    .toString()
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  if (repoNames.length === 0) {
    throw new ConfigError(
      'repository_names must be set in config or passed via --repository-names'
    );
  }

  const cacheKey = [...repoNames].sort().join(',');

  if (options.cached) {
    const hit = await readCached(cacheKey);
    if (hit) {
      log(`cache hit for ${cacheKey}`);
      return hit as RawPr[];
    }
  }

  const all: RawPr[] = [];
  for (const repo of repoNames) {
    const prs = await fetchReposPrs(`${ownerName}/${repo}`);
    all.push(...prs);
  }

  if (config.cacheEnabled) {
    await writeCached(cacheKey, all);
  }

  return all;
}

async function fetchReposPrs(repo: string): Promise<RawPr[]> {
  const cmd = [
    'gh',
    'pr',
    'list',
    '--repo',
    repo,
    '--state',
    'open',
    '--json',
    GH_FIELDS,
    '--limit',
    '100',
  ];
  log(`running: ${cmd.join(' ')}`);

  const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'pipe' });
  await proc.exited;

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();

  if (proc.exitCode !== 0) {
    throw new GhError(`gh pr list failed for ${repo}: ${stderr.trim()}`);
  }

  try {
    return JSON.parse(stdout) as RawPr[];
  } catch {
    throw new GhError(
      `Failed to parse gh output for ${repo}: ${stdout.slice(0, 200)}`
    );
  }
}
