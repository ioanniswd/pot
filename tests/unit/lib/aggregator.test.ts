import { describe, expect, it } from 'bun:test';
import { aggregate } from '../../../src/lib/aggregator.js';
import { makeRawPr } from '../../helpers/test-data.js';

describe('aggregate — userPrCounts', () => {
  it('counts authored PRs per user', () => {
    const prs = [
      makeRawPr({ author: { login: 'alice' } }),
      makeRawPr({ author: { login: 'alice' } }),
      makeRawPr({ author: { login: 'bob' } }),
    ];

    const { userPrCounts } = aggregate(prs, undefined, false);

    expect(userPrCounts.get('alice')?.author).toBe(2);
    expect(userPrCounts.get('bob')?.author).toBe(1);
  });

  it('counts active reviewer PRs per user', () => {
    const prs = [
      makeRawPr({ reviewRequests: [{ login: 'bob' }] }),
      makeRawPr({ reviewRequests: [{ login: 'bob' }] }),
    ];

    const { userPrCounts } = aggregate(prs, undefined, false);

    expect(userPrCounts.get('bob')?.activeReviewer).toBe(2);
  });
});

describe('aggregate — actionablesCountPerAuthor', () => {
  it('counts actionable PRs for authors', () => {
    const prs = [
      makeRawPr({
        author: { login: 'alice' },
        reviews: [],
        reviewRequests: [],
      }),
      makeRawPr({
        author: { login: 'alice' },
        reviews: [],
        reviewRequests: [],
      }),
      makeRawPr({
        author: { login: 'alice' },
        reviews: [],
        reviewRequests: [{ login: 'bob' }],
      }),
    ];

    const { actionablesCountPerAuthor } = aggregate(prs, undefined, false);

    expect(actionablesCountPerAuthor.get('alice')).toBe(2);
  });

  it('counts actionable PRs for requested reviewers', () => {
    const prs = [
      makeRawPr({ reviewRequests: [{ login: 'bob' }] }),
      makeRawPr({ reviewRequests: [{ login: 'bob' }] }),
    ];

    const { actionablesCountPerAuthor } = aggregate(prs, undefined, false);

    expect(actionablesCountPerAuthor.get('bob')).toBe(2);
  });
});

describe('aggregate — untouchedCountPerAuthor', () => {
  it('counts untouched PRs for requested reviewers who have not yet reviewed', () => {
    const prs = [
      makeRawPr({ reviewRequests: [{ login: 'bob' }], reviews: [] }),
      makeRawPr({ reviewRequests: [{ login: 'bob' }], reviews: [] }),
    ];

    const { untouchedCountPerAuthor } = aggregate(prs, undefined, false);

    expect(untouchedCountPerAuthor.get('bob')).toBe(2);
  });

  it('does not count as untouched when reviewer has already reviewed', () => {
    const prs = [
      makeRawPr({
        reviewRequests: [{ login: 'bob' }],
        reviews: [
          {
            author: { login: 'bob' },
            state: 'COMMENTED',
            submittedAt: '2025-01-01T00:00:00Z',
          },
        ],
      }),
    ];

    const { untouchedCountPerAuthor } = aggregate(prs, undefined, false);

    expect(untouchedCountPerAuthor.get('bob')).toBeUndefined();
  });
});

describe('aggregate — specifiedUserPrs', () => {
  it('populates authored entries for specified user', () => {
    const prs = [
      makeRawPr({ author: { login: 'alice' }, title: 'My PR' }),
      makeRawPr({ author: { login: 'bob' }, title: 'Other PR' }),
    ];

    const { specifiedUserPrs } = aggregate(prs, 'alice', false);

    expect(specifiedUserPrs.authored).toHaveLength(1);
    expect(specifiedUserPrs.authored[0].title).toBe('My PR');
  });

  it('includes untouchedReviewers for authored PRs with untouched requested reviewers', () => {
    const prs = [
      makeRawPr({
        author: { login: 'alice' },
        reviewRequests: [{ login: 'bob' }, { login: 'charlie' }],
        reviews: [
          {
            author: { login: 'bob' },
            state: 'COMMENTED',
            submittedAt: '2025-01-01T00:00:00Z',
          },
        ],
      }),
    ];

    const { specifiedUserPrs } = aggregate(prs, 'alice', false);

    expect(specifiedUserPrs.authored[0].untouchedReviewers).toEqual([
      'charlie',
    ]);
  });

  it('returns empty untouchedReviewers when all requested reviewers have reviewed', () => {
    const prs = [
      makeRawPr({
        author: { login: 'alice' },
        reviewRequests: [{ login: 'bob' }],
        reviews: [
          {
            author: { login: 'bob' },
            state: 'APPROVED',
            submittedAt: '2025-01-01T00:00:00Z',
          },
        ],
      }),
    ];

    const { specifiedUserPrs } = aggregate(prs, 'alice', false);

    expect(specifiedUserPrs.authored[0].untouchedReviewers).toEqual([]);
  });

  it('returns empty untouchedReviewers when no reviewers are requested', () => {
    const prs = [
      makeRawPr({
        author: { login: 'alice' },
        reviewRequests: [],
        reviews: [],
      }),
    ];

    const { specifiedUserPrs } = aggregate(prs, 'alice', false);

    expect(specifiedUserPrs.authored[0].untouchedReviewers).toEqual([]);
  });

  it('populates reviewing entries for specified user', () => {
    const prs = [
      makeRawPr({
        author: { login: 'bob' },
        title: 'Bob PR',
        reviewRequests: [{ login: 'alice' }],
      }),
    ];

    const { specifiedUserPrs } = aggregate(prs, 'alice', false);

    expect(specifiedUserPrs.reviewing).toHaveLength(1);
    expect(specifiedUserPrs.reviewing[0].title).toBe('Bob PR');
    expect(specifiedUserPrs.reviewing[0].author).toBe('bob');
  });
});

describe('aggregate — relevantUsersForSpecifiedUser', () => {
  it('includes active reviewers of specified user authored PRs', () => {
    const prs = [
      makeRawPr({
        author: { login: 'alice' },
        reviewRequests: [{ login: 'bob' }, { login: 'charlie' }],
      }),
    ];

    const { relevantUsersForSpecifiedUser } = aggregate(prs, 'alice', false);

    expect(relevantUsersForSpecifiedUser).toContain('bob');
    expect(relevantUsersForSpecifiedUser).toContain('charlie');
  });

  it('includes authors of PRs that specified user is reviewing', () => {
    const prs = [
      makeRawPr({
        author: { login: 'bob' },
        reviewRequests: [{ login: 'alice' }],
      }),
    ];

    const { relevantUsersForSpecifiedUser } = aggregate(prs, 'alice', false);

    expect(relevantUsersForSpecifiedUser).toContain('bob');
  });
});

describe('aggregate — prUrls', () => {
  it('populates prUrls when urlOnly is true and user is involved', () => {
    const prs = [
      makeRawPr({
        author: { login: 'alice' },
        url: 'https://github.com/test/repo/pull/1',
        reviews: [],
        reviewRequests: [],
      }),
    ];

    const { prUrls } = aggregate(prs, 'alice', true);

    expect(prUrls).toHaveLength(1);
    expect(prUrls[0].url).toBe('https://github.com/test/repo/pull/1');
  });

  it('does not populate prUrls when urlOnly is false', () => {
    const prs = [makeRawPr({ author: { login: 'alice' } })];

    const { prUrls } = aggregate(prs, 'alice', false);

    expect(prUrls).toHaveLength(0);
  });
});

describe('aggregate — locPerUser', () => {
  it('tracks total LOC for authors', () => {
    const prs = [
      makeRawPr({ author: { login: 'alice' }, additions: 100, deletions: 50 }),
    ];

    const { locPerUser } = aggregate(prs, undefined, false);

    expect(locPerUser.get('alice')?.total.additions).toBe(100);
    expect(locPerUser.get('alice')?.total.deletions).toBe(50);
  });

  it('tracks actionable LOC for authors with actionable PRs', () => {
    const prs = [
      makeRawPr({
        author: { login: 'alice' },
        additions: 100,
        deletions: 50,
        reviews: [],
        reviewRequests: [],
      }),
    ];

    const { locPerUser } = aggregate(prs, undefined, false);

    expect(locPerUser.get('alice')?.actionable.additions).toBe(100);
    expect(locPerUser.get('alice')?.actionable.deletions).toBe(50);
  });
});
