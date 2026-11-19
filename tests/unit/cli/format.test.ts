import { describe, expect, it } from 'bun:test';
import {
  formatAuthoredTable,
  formatReviewingTable,
  hyperlink,
  visibleWidth,
} from '../../../src/cli/format.js';
import type { AuthoredPrEntry, ReviewingPrEntry } from '../../../src/types.js';

const URL_A = 'https://github.com/acme/repo/pull/1';
const URL_B = 'https://github.com/acme/repo/pull/22';

function makeAuthored(overrides: Partial<AuthoredPrEntry>): AuthoredPrEntry {
  return {
    title: 'Add feature',
    url: URL_A,
    actionable: true,
    numOfApprovals: 0,
    numOfReviewers: 1,
    additions: 10,
    deletions: 2,
    untouchedReviewers: [],
    ...overrides,
  };
}

function makeReviewing(overrides: Partial<ReviewingPrEntry>): ReviewingPrEntry {
  return {
    title: 'Fix bug',
    url: URL_A,
    actionable: true,
    author: 'alice',
    untouched: false,
    numOfApprovals: 0,
    numOfReviewers: 2,
    additions: 5,
    deletions: 1,
    ...overrides,
  };
}

describe('hyperlink', () => {
  it('wraps the text in an OSC 8 sequence with the URL', () => {
    expect(hyperlink('Add feature', URL_A)).toBe(
      `\x1b]8;;${URL_A}\x1b\\Add feature\x1b]8;;\x1b\\`
    );
  });
});

describe('visibleWidth', () => {
  it('counts only the text of a link', () => {
    expect(visibleWidth(hyperlink('Add feature', URL_A))).toBe(11);
  });

  it('counts plain text as is', () => {
    expect(visibleWidth(`Add feature (${URL_A})`)).toBe(
      `Add feature (${URL_A})`.length
    );
  });
});

/** Visible width of each table line, without the caption. */
function visibleLineWidths(table: string): number[] {
  return table.split('\n').slice(1).map(visibleWidth);
}

describe('formatAuthoredTable', () => {
  const prs = [
    makeAuthored({ title: 'Short', url: URL_A }),
    makeAuthored({ title: 'A much longer title', url: URL_B }),
  ];

  it('shows the title and the URL when hyperlinks are off', () => {
    const out = formatAuthoredTable(prs, false);
    expect(out).toContain(`Short (${URL_A})`);
    expect(out).not.toContain('\x1b');
  });

  it('links the title and hides the URL when hyperlinks are on', () => {
    const out = formatAuthoredTable(prs, true);
    expect(out).toContain(hyperlink('Short', URL_A));
    expect(out).not.toContain(`(${URL_A})`);
  });

  it('aligns the borders by the visible width when hyperlinks are on', () => {
    const out = formatAuthoredTable(prs, true);
    expect(new Set(visibleLineWidths(out)).size).toBe(1);
    expect(out).toContain(`+${'-'.repeat('A much longer title'.length + 2)}+`);
  });
});

describe('formatReviewingTable', () => {
  const prs = [
    makeReviewing({ title: 'Fix bug', url: URL_A }),
    makeReviewing({ title: 'Improve styles', url: URL_B }),
  ];
  const counts = new Map([['alice', 1]]);

  it('shows the title and the URL when hyperlinks are off', () => {
    const out = formatReviewingTable(prs, counts, false);
    expect(out).toContain(`Fix bug (${URL_A})`);
    expect(out).not.toContain('\x1b');
  });

  it('aligns the borders by the visible width when hyperlinks are on', () => {
    const out = formatReviewingTable(prs, counts, true);
    expect(out).toContain(hyperlink('Improve styles', URL_B));
    expect(new Set(visibleLineWidths(out)).size).toBe(1);
  });
});
