import { afterEach, describe, expect, it } from 'bun:test';
import { GhError } from '../../../src/errors.js';
import { fetchPrs } from '../../../src/services/github.js';
import complexFixture from '../../helpers/fixtures/gh_prs_complex.json';
import simpleFixture from '../../helpers/fixtures/gh_prs_simple.json';
import { makeConfig, makeRawPr } from '../../helpers/test-data.js';
import { mockGh, restoreGh } from '../../helpers/test-utils.js';

afterEach(() => {
  restoreGh();
});

describe('fetchPrs', () => {
  it('parses gh JSON output correctly', async () => {
    mockGh(() => ({
      stdout: JSON.stringify(complexFixture),
      stderr: '',
      exitCode: 0,
    }));

    const result = await fetchPrs(makeConfig(), {});

    expect(result).toHaveLength(3);
    expect(result[0].author.login).toBe('alice');
    expect(result[0].title).toBe('Add feature X');
    expect(result[0].additions).toBe(120);
  });

  it('handles empty PR list', async () => {
    mockGh(() => ({ stdout: '[]', stderr: '', exitCode: 0 }));

    const result = await fetchPrs(makeConfig(), {});

    expect(result).toEqual([]);
  });

  it('throws GhError on gh command failure', async () => {
    mockGh(() => ({
      stdout: '',
      stderr: 'Error: not found',
      exitCode: 1,
    }));

    await expect(fetchPrs(makeConfig(), {})).rejects.toBeInstanceOf(GhError);
  });

  it('throws GhError on invalid JSON output', async () => {
    mockGh(() => ({
      stdout: 'invalid json {',
      stderr: '',
      exitCode: 0,
    }));

    await expect(fetchPrs(makeConfig(), {})).rejects.toBeInstanceOf(GhError);
  });

  it('constructs correct gh command', async () => {
    let capturedCmd: string[] = [];

    mockGh((cmd) => {
      capturedCmd = cmd;
      return { stdout: '[]', stderr: '', exitCode: 0 };
    });

    await fetchPrs(
      makeConfig({ ownerName: 'test-owner', repositoryNames: ['test-repo'] }),
      {}
    );

    expect(capturedCmd).toContain('gh');
    expect(capturedCmd).toContain('pr');
    expect(capturedCmd).toContain('list');
    expect(capturedCmd).toContain('--repo');
    expect(capturedCmd).toContain('test-owner/test-repo');
    expect(capturedCmd).toContain('--state');
    expect(capturedCmd).toContain('open');
    expect(capturedCmd).toContain('--json');
    expect(capturedCmd).toContain(
      'number,title,url,author,additions,deletions,isDraft,reviews,reviewRequests'
    );
    expect(capturedCmd).toContain('--limit');
    expect(capturedCmd).toContain('100');
  });

  it('flattens PRs from multiple repositories', async () => {
    const repos = ['repo-a', 'repo-b'];
    let callCount = 0;

    mockGh((cmd) => {
      callCount++;
      const isRepoA = cmd.includes('test-owner/repo-a');
      return {
        stdout: JSON.stringify(isRepoA ? simpleFixture : complexFixture),
        stderr: '',
        exitCode: 0,
      };
    });

    const result = await fetchPrs(makeConfig({ repositoryNames: repos }), {});

    expect(callCount).toBe(2);
    expect(result).toHaveLength(4); // 1 from repo-a + 3 from repo-b
  });

  describe('draft PRs', () => {
    const prs = [
      makeRawPr({ number: 1, isDraft: false }),
      makeRawPr({ number: 2, isDraft: true }),
    ];

    function mockPrs(): void {
      mockGh(() => ({ stdout: JSON.stringify(prs), stderr: '', exitCode: 0 }));
    }

    it('keeps draft PRs when ignoreDrafts is not set', async () => {
      mockPrs();

      const result = await fetchPrs(makeConfig(), {});

      expect(result.map((pr) => pr.number)).toEqual([1, 2]);
    });

    it('removes draft PRs when ignoreDrafts is true', async () => {
      mockPrs();

      const result = await fetchPrs(makeConfig({ ignoreDrafts: true }), {});

      expect(result.map((pr) => pr.number)).toEqual([1]);
    });

    it('removes draft PRs from cached data when ignoreDrafts is true', async () => {
      mockPrs();
      await fetchPrs(
        makeConfig({ cacheEnabled: true, repositoryNames: ['drafts-repo'] }),
        {}
      );
      restoreGh();
      mockGh(() => {
        throw new Error('gh must not run when the cache has the data');
      });

      const result = await fetchPrs(
        makeConfig({ ignoreDrafts: true, repositoryNames: ['drafts-repo'] }),
        { cached: true }
      );

      expect(result.map((pr) => pr.number)).toEqual([1]);
    });
  });
});
