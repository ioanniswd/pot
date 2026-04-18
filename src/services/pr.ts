import type { RawPr, RawReview } from '../types.js';

interface NormalizedReview {
  author: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';
  submittedAt: Date;
}

type EffectiveState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';

export class Pr {
  constructor(private readonly raw: RawPr) {}

  get author(): string {
    return this.raw.author.login;
  }

  get title(): string {
    return this.raw.title;
  }

  get url(): string {
    return this.raw.url;
  }

  get additions(): number {
    return this.raw.additions;
  }

  get deletions(): number {
    return this.raw.deletions;
  }

  get requestedReviewers(): string[] {
    return (this.raw.reviewRequests ?? []).map((r) => r.login);
  }

  get activeReviewers(): string[] {
    return [
      ...new Set([
        ...this.requestedReviewers,
        ...this.reviewersWithChangesRequested,
      ]),
    ];
  }

  get authorActionable(): boolean {
    // Author must act when: a reviewer left CHANGES_REQUESTED and is no longer
    // in requestedReviewers (ball is back in author's court), or nobody has
    // reviewed and nobody is requested.
    return (
      this.reviewersWithChangesRequested.some(
        (r) => !this.requestedReviewers.includes(r)
      ) ||
      (this.reviews.length === 0 && this.requestedReviewers.length === 0)
    );
  }

  reviewerActionable(user: string): boolean {
    return this.requestedReviewers.includes(user);
  }

  untouchedBy(user: string): boolean {
    return !this.allPastReviewers.includes(user);
  }

  get numOfApprovals(): number {
    return this.approvedReviewers.length;
  }

  get numOfReviewers(): number {
    return new Set([...this.allPastReviewers, ...this.requestedReviewers]).size;
  }

  private get reviews(): NormalizedReview[] {
    return (this.raw.reviews ?? []).map((r: RawReview) => ({
      author: r.author.login,
      state: r.state === 'DISMISSED' ? 'COMMENTED' : r.state,
      submittedAt: new Date(r.submittedAt),
    }));
  }

  private get allPastReviewers(): string[] {
    return [
      ...new Set(
        this.reviews.map((r) => r.author).filter((a) => a !== this.author)
      ),
    ];
  }

  private effectiveState(reviewer: string): EffectiveState {
    const byReviewer = this.reviews
      .filter((r) => r.author === reviewer)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

    const approvedIdx = byReviewer.findIndex((r) => r.state === 'APPROVED');
    const limit = approvedIdx === -1 ? byReviewer.length : approvedIdx + 1;
    const lastChanges = byReviewer
      .slice(0, limit)
      .find((r) => r.state === 'CHANGES_REQUESTED');

    if (lastChanges) return 'CHANGES_REQUESTED';
    if (approvedIdx !== -1) return 'APPROVED';
    return 'COMMENTED';
  }

  private get reviewersWithChangesRequested(): string[] {
    return this.allPastReviewers.filter(
      (r) => this.effectiveState(r) === 'CHANGES_REQUESTED'
    );
  }

  private get approvedReviewers(): string[] {
    return this.allPastReviewers.filter(
      (r) =>
        this.effectiveState(r) === 'APPROVED' &&
        !this.requestedReviewers.includes(r)
    );
  }
}
