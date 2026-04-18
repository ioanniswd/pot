export interface RawReview {
  author: { login: string };
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
  submittedAt: string;
}

export interface RawReviewRequest {
  login: string;
}

export interface RawPr {
  number: number;
  title: string;
  url: string;
  author: { login: string };
  additions: number;
  deletions: number;
  reviews: RawReview[];
  reviewRequests: RawReviewRequest[];
}

export interface Config {
  ownerName: string;
  repositoryNames: string[];
  cacheEnabled: boolean;
  user?: string;
  registered: Record<string, RegisteredPreset>;
}

export interface RegisteredPreset {
  ownerName?: string;
  repositoryNames?: string;
  users?: string;
  user?: string;
}

export interface OverviewOptions {
  ownerName?: string;
  repositoryNames?: string;
  users?: string;
  user?: string;
  urlOnly?: boolean;
  actionable?: boolean;
  registerNew?: string;
  registered?: string;
  cached?: boolean;
  json?: boolean;
}

export interface LocStats {
  additions: number;
  deletions: number;
}

export interface UserLoc {
  total: LocStats;
  actionable: LocStats;
}

export interface AuthoredPrEntry {
  title: string;
  url: string;
  actionable: boolean;
  numOfApprovals: number;
  numOfReviewers: number;
  additions: number;
  deletions: number;
}

export interface ReviewingPrEntry {
  title: string;
  url: string;
  actionable: boolean;
  author: string;
  untouched: boolean;
  numOfApprovals: number;
  numOfReviewers: number;
  additions: number;
  deletions: number;
}

export interface PrUrlEntry {
  url: string;
  actionable: boolean;
}
