import type {
  AuthoredPrEntry,
  PrUrlEntry,
  RawPr,
  ReviewingPrEntry,
  UserLoc,
} from '../types.js';
import { Pr } from './pr.js';

export interface AggregatedData {
  userPrCounts: Map<string, { author: number; activeReviewer: number }>;
  locPerUser: Map<string, UserLoc>;
  actionablesCountPerAuthor: Map<string, number>;
  untouchedCountPerAuthor: Map<string, number>;
  specifiedUserPrs: {
    authored: AuthoredPrEntry[];
    reviewing: ReviewingPrEntry[];
  };
  prUrls: PrUrlEntry[];
  relevantUsersForSpecifiedUser: string[];
}

export function aggregate(
  rawPrs: RawPr[],
  specifiedUser: string | undefined,
  urlOnly: boolean
): AggregatedData {
  const prs = rawPrs.map((r) => new Pr(r));

  const userPrCounts = new Map<
    string,
    { author: number; activeReviewer: number }
  >();
  const locPerUser = new Map<string, UserLoc>();
  const actionablesCountPerAuthor = new Map<string, number>();
  const untouchedCountPerAuthor = new Map<string, number>();
  const specifiedUserPrs: {
    authored: AuthoredPrEntry[];
    reviewing: ReviewingPrEntry[];
  } = {
    authored: [],
    reviewing: [],
  };
  const prUrls: PrUrlEntry[] = [];
  const relevantSet = new Set<string>();

  for (const pr of prs) {
    let actionable: boolean | undefined;

    if (pr.author === specifiedUser) {
      actionable = pr.authorActionable;
      specifiedUserPrs.authored.push({
        title: pr.title,
        url: pr.url,
        actionable,
        numOfApprovals: pr.numOfApprovals,
        numOfReviewers: pr.numOfReviewers,
        additions: pr.additions,
        deletions: pr.deletions,
      });
      for (const r of pr.activeReviewers) relevantSet.add(r);
    }

    if (specifiedUser && pr.activeReviewers.includes(specifiedUser)) {
      actionable = pr.reviewerActionable(specifiedUser);
      specifiedUserPrs.reviewing.push({
        title: pr.title,
        url: pr.url,
        actionable,
        author: pr.author,
        untouched: pr.untouchedBy(specifiedUser),
        numOfApprovals: pr.numOfApprovals,
        numOfReviewers: pr.numOfReviewers,
        additions: pr.additions,
        deletions: pr.deletions,
      });
      relevantSet.add(pr.author);
    }

    if (pr.authorActionable) {
      actionablesCountPerAuthor.set(
        pr.author,
        (actionablesCountPerAuthor.get(pr.author) ?? 0) + 1
      );
    }

    addLocForAuthor(locPerUser, pr);

    for (const reviewer of pr.requestedReviewers) {
      actionablesCountPerAuthor.set(
        reviewer,
        (actionablesCountPerAuthor.get(reviewer) ?? 0) + 1
      );
      if (pr.untouchedBy(reviewer)) {
        untouchedCountPerAuthor.set(
          reviewer,
          (untouchedCountPerAuthor.get(reviewer) ?? 0) + 1
        );
      }
      addLocForRequestedReviewer(locPerUser, pr, reviewer);
    }

    if (
      urlOnly &&
      specifiedUser &&
      (pr.activeReviewers.includes(specifiedUser) ||
        pr.author === specifiedUser)
    ) {
      prUrls.push({ url: pr.url, actionable: actionable ?? false });
    }

    const authorCounts = userPrCounts.get(pr.author) ?? {
      author: 0,
      activeReviewer: 0,
    };
    authorCounts.author += 1;
    userPrCounts.set(pr.author, authorCounts);

    for (const reviewer of pr.activeReviewers) {
      const counts = userPrCounts.get(reviewer) ?? {
        author: 0,
        activeReviewer: 0,
      };
      counts.activeReviewer += 1;
      userPrCounts.set(reviewer, counts);
      addLocForActiveReviewer(locPerUser, pr, reviewer);
    }
  }

  return {
    userPrCounts,
    locPerUser,
    actionablesCountPerAuthor,
    untouchedCountPerAuthor,
    specifiedUserPrs,
    prUrls,
    relevantUsersForSpecifiedUser: [...relevantSet],
  };
}

function getOrCreateLoc(map: Map<string, UserLoc>, user: string): UserLoc {
  let loc = map.get(user);
  if (!loc) {
    loc = {
      total: { additions: 0, deletions: 0 },
      actionable: { additions: 0, deletions: 0 },
    };
    map.set(user, loc);
  }
  return loc;
}

function addLocForAuthor(map: Map<string, UserLoc>, pr: Pr): void {
  const loc = getOrCreateLoc(map, pr.author);
  loc.total.additions += pr.additions;
  loc.total.deletions += pr.deletions;
  if (pr.authorActionable) {
    loc.actionable.additions += pr.additions;
    loc.actionable.deletions += pr.deletions;
  }
}

function addLocForRequestedReviewer(
  map: Map<string, UserLoc>,
  pr: Pr,
  reviewer: string
): void {
  const loc = getOrCreateLoc(map, reviewer);
  loc.actionable.additions += pr.additions;
  loc.actionable.deletions += pr.deletions;
}

function addLocForActiveReviewer(
  map: Map<string, UserLoc>,
  pr: Pr,
  reviewer: string
): void {
  const loc = getOrCreateLoc(map, reviewer);
  loc.total.additions += pr.additions;
  loc.total.deletions += pr.deletions;
}
