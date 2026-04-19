import { describe, expect, it } from 'bun:test';
import { Pr } from '../../../src/lib/pr.js';
import type { RawPr } from '../../../src/types.js';
import approvalAfterReviewRequestAfterApproval from '../../helpers/fixtures/approval_after_review_request_after_approval.json';
import approvedAfterRequestedChanges from '../../helpers/fixtures/approved_after_requested_changes.json';
import reRequestReviewAfterApproval from '../../helpers/fixtures/re_request_review_after_approval.json';
import reRequestingChangesAfterReRequestingReview from '../../helpers/fixtures/re_requesting_changes_after_re_requesting_review.json';
import reRequestingReviewAfterRequestedChanges from '../../helpers/fixtures/re_requesting_review_after_requested_changes.json';
import requestedChangesFirstTime from '../../helpers/fixtures/requested_changes_first_time.json';
import requestedReviewOpenPr from '../../helpers/fixtures/requested_review_open_pr.json';

function prFromFixture(fixture: unknown[]): Pr {
  return new Pr(fixture[0] as RawPr);
}

describe('Pr — requested_review_open_pr', () => {
  const pr = prFromFixture(requestedReviewOpenPr);

  it('returns correct author', () => {
    expect(pr.author).toBe('ioanniswd');
  });

  it('has review request with no reviews', () => {
    expect(pr.requestedReviewers).toEqual(['ioanniswd-bot']);
  });

  it('activeReviewers includes requested reviewer', () => {
    expect(pr.activeReviewers).toEqual(['ioanniswd-bot']);
  });

  it('reviewer is actionable (in review request)', () => {
    expect(pr.reviewerActionable('ioanniswd-bot')).toBe(true);
  });

  it('author is not actionable (waiting for review)', () => {
    expect(pr.authorActionable).toBe(false);
  });

  it('untouchedRequestedReviewers includes reviewer who has not yet reviewed', () => {
    expect(pr.untouchedRequestedReviewers).toEqual(['ioanniswd-bot']);
  });
});

describe('Pr — requested_changes_first_time', () => {
  const pr = prFromFixture(requestedChangesFirstTime);

  it('has no review requests', () => {
    expect(pr.requestedReviewers).toEqual([]);
  });

  it('reviewer has requested changes in activeReviewers', () => {
    expect(pr.activeReviewers).toEqual(['ioanniswd-bot']);
  });

  it('reviewer is not actionable (not in request list)', () => {
    expect(pr.reviewerActionable('ioanniswd-bot')).toBe(false);
  });

  it('author is actionable (changes requested)', () => {
    expect(pr.authorActionable).toBe(true);
  });

  it('reviewer is not untouched', () => {
    expect(pr.untouchedBy('ioanniswd-bot')).toBe(false);
  });

  it('untouchedRequestedReviewers is empty (no review requests)', () => {
    expect(pr.untouchedRequestedReviewers).toEqual([]);
  });
});

describe('Pr — re_requesting_review_after_requested_changes', () => {
  const pr = prFromFixture(reRequestingReviewAfterRequestedChanges);

  it('has review request after CHANGES_REQUESTED review', () => {
    expect(pr.requestedReviewers).toEqual(['ioanniswd-bot']);
  });

  it('activeReviewers includes re-requested reviewer', () => {
    expect(pr.activeReviewers).toEqual(['ioanniswd-bot']);
  });

  it('reviewer is actionable (re-requested for review)', () => {
    expect(pr.reviewerActionable('ioanniswd-bot')).toBe(true);
  });

  it('author is not actionable (awaiting re-review)', () => {
    expect(pr.authorActionable).toBe(false);
  });

  it('untouchedRequestedReviewers is empty (reviewer has past reviews)', () => {
    expect(pr.untouchedRequestedReviewers).toEqual([]);
  });
});

describe('Pr — re_requesting_changes_after_re_requesting_review', () => {
  const pr = prFromFixture(reRequestingChangesAfterReRequestingReview);

  it('has no review requests', () => {
    expect(pr.requestedReviewers).toEqual([]);
  });

  it('latest review is CHANGES_REQUESTED in activeReviewers', () => {
    expect(pr.activeReviewers).toEqual(['ioanniswd-bot']);
  });

  it('reviewer is not actionable (not in request, just reviewed)', () => {
    expect(pr.reviewerActionable('ioanniswd-bot')).toBe(false);
  });

  it('author is actionable (changes requested again)', () => {
    expect(pr.authorActionable).toBe(true);
  });

  it('untouchedRequestedReviewers is empty (no review requests)', () => {
    expect(pr.untouchedRequestedReviewers).toEqual([]);
  });
});

describe('Pr — approved_after_requested_changes', () => {
  const pr = prFromFixture(approvedAfterRequestedChanges);

  it('has no review requests (already approved)', () => {
    expect(pr.requestedReviewers).toEqual([]);
  });

  it('has no activeReviewers (latest review state is APPROVED)', () => {
    expect(pr.activeReviewers).toEqual([]);
  });

  it('author is actionable (approved)', () => {
    expect(pr.authorActionable).toBe(true);
  });

  it('has one approval', () => {
    expect(pr.numOfApprovals).toBe(1);
  });

  it('has one reviewer', () => {
    expect(pr.numOfReviewers).toBe(1);
  });

  it('untouchedRequestedReviewers is empty (no review requests)', () => {
    expect(pr.untouchedRequestedReviewers).toEqual([]);
  });
});

describe('Pr — re_request_review_after_approval', () => {
  const pr = prFromFixture(reRequestReviewAfterApproval);

  it('has review request after APPROVED review', () => {
    expect(pr.requestedReviewers).toEqual(['ioanniswd-bot']);
  });

  it('activeReviewers includes re-requested reviewer', () => {
    expect(pr.activeReviewers).toEqual(['ioanniswd-bot']);
  });

  it('reviewer is actionable (re-requested despite approval)', () => {
    expect(pr.reviewerActionable('ioanniswd-bot')).toBe(true);
  });

  it('author is not actionable (awaiting re-review)', () => {
    expect(pr.authorActionable).toBe(false);
  });

  it('has no approvals', () => {
    expect(pr.numOfApprovals).toBe(0);
  });

  it('untouchedRequestedReviewers is empty (reviewer has past reviews)', () => {
    expect(pr.untouchedRequestedReviewers).toEqual([]);
  });
});

describe('Pr — approval_after_review_request_after_approval', () => {
  const pr = prFromFixture(approvalAfterReviewRequestAfterApproval);

  it('has no review requests', () => {
    expect(pr.requestedReviewers).toEqual([]);
  });

  it('has no activeReviewers (latest review state is APPROVED)', () => {
    expect(pr.activeReviewers).toEqual([]);
  });

  it('reviewer is not actionable', () => {
    expect(pr.reviewerActionable('ioanniswd-bot')).toBe(false);
  });

  it('author is actionable (approved)', () => {
    expect(pr.authorActionable).toBe(true);
  });

  it('has one approval (same user, multiple approval reviews)', () => {
    expect(pr.numOfApprovals).toBe(1);
  });

  it('has one reviewer (same person, multiple reviews)', () => {
    expect(pr.numOfReviewers).toBe(1);
  });

  it('untouchedRequestedReviewers is empty (no review requests)', () => {
    expect(pr.untouchedRequestedReviewers).toEqual([]);
  });
});

describe('Pr — edge cases', () => {
  it('handles PR with empty reviews and reviewRequests gracefully', () => {
    const pr = new Pr({
      number: 100,
      title: 'Test',
      url: 'http://example.com',
      author: { login: 'test' },
      additions: 10,
      deletions: 5,
      reviews: [],
      reviewRequests: [],
    });
    expect(pr.requestedReviewers).toEqual([]);
    expect(pr.activeReviewers).toEqual([]);
    expect(pr.authorActionable).toBe(true);
    expect(pr.untouchedRequestedReviewers).toEqual([]);
  });
});
