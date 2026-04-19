import type { Config, RawPr } from '../../src/types.js';

export function makeRawPr(overrides: Partial<RawPr> = {}): RawPr {
  return {
    number: 1,
    title: 'Test PR',
    url: 'https://github.com/test/repo/pull/1',
    author: { login: 'alice' },
    additions: 10,
    deletions: 5,
    reviews: [],
    reviewRequests: [],
    ...overrides,
  };
}

export function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    ownerName: 'test-owner',
    repositoryNames: ['test-repo'],
    cacheEnabled: false,
    registered: {},
    ...overrides,
  };
}
