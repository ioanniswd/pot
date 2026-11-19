import type { AggregatedData } from '../lib/aggregator.js';
import type { AuthoredPrEntry, ReviewingPrEntry } from '../types.js';

interface PrUserRow {
  username: string;
  authored: number;
  reviewing: number;
  total: number;
  totalLoc: string;
  actionable: number;
  actionableLoc: string;
  untouched: number;
  highlight: boolean;
}

export function formatOverviewTable(
  data: AggregatedData,
  usersToInclude: string[],
  specifiedUser: string | undefined
): string {
  const rows: PrUserRow[] = usersToInclude.map((username) => {
    const counts = data.userPrCounts.get(username) ?? {
      author: 0,
      activeReviewer: 0,
    };
    const loc = data.locPerUser.get(username);
    const authored = counts.author;
    const reviewing = counts.activeReviewer;
    return {
      username,
      authored,
      reviewing,
      total: authored + reviewing,
      totalLoc: `${loc?.total.additions ?? 0} / ${loc?.total.deletions ?? 0}`,
      actionable: data.actionablesCountPerAuthor.get(username) ?? 0,
      actionableLoc: `${loc?.actionable.additions ?? 0} / ${loc?.actionable.deletions ?? 0}`,
      untouched: data.untouchedCountPerAuthor.get(username) ?? 0,
      highlight: username === specifiedUser,
    };
  });

  rows.sort(
    (a, b) =>
      a.total - b.total ||
      a.actionable - b.actionable ||
      a.untouched - b.untouched
  );

  const headers = [
    'User',
    'Authored',
    'Reviewing',
    'Total',
    'Total +/-',
    'Actionables',
    'Actionable +/-',
    'Untouched',
  ];
  const tableRows = rows.map((r) => [
    r.highlight ? `-- ${r.username} --` : r.username,
    String(r.authored),
    String(r.reviewing),
    String(r.total),
    r.totalLoc,
    String(r.actionable),
    r.actionableLoc,
    String(r.untouched),
  ]);

  return renderTable(headers, tableRows);
}

export function formatAuthoredTable(
  prs: AuthoredPrEntry[],
  hyperlinks: boolean
): string {
  const sorted = [...prs].sort(
    (a, b) => (a.actionable ? 0 : 1) - (b.actionable ? 0 : 1)
  );
  const headers = [
    'Actionable',
    'Approvals',
    '+/-',
    'PR',
    'Untouched Reviewers',
  ];
  const rows = sorted.map((p) => [
    p.actionable ? 'Yes' : 'No',
    `${p.numOfApprovals} / ${p.numOfReviewers}`,
    `${p.additions} / ${p.deletions}`,
    formatPrCell(p, hyperlinks),
    p.untouchedReviewers.length > 0 ? p.untouchedReviewers.join(', ') : '-',
  ]);
  return `Authored\n${renderTable(headers, rows)}`;
}

export function formatReviewingTable(
  prs: ReviewingPrEntry[],
  actionablesCountPerAuthor: Map<string, number>,
  hyperlinks: boolean
): string {
  const sorted = [...prs].sort((a, b) => {
    const aScore = a.actionable ? 0 : 1;
    const bScore = b.actionable ? 0 : 1;
    const aCount = actionablesCountPerAuthor.get(a.author) ?? 0;
    const bCount = actionablesCountPerAuthor.get(b.author) ?? 0;
    return aScore - bScore || aCount - bCount;
  });

  const headers = [
    'Actionable',
    'Untouched',
    'Author: Actionables',
    'Approvals',
    '+/-',
    'PR',
  ];
  const rows = sorted.map((p) => [
    p.actionable ? 'Yes' : 'No',
    p.untouched ? 'Yes' : 'No',
    `${p.author}: ${actionablesCountPerAuthor.get(p.author) ?? 0}`,
    `${p.numOfApprovals} / ${p.numOfReviewers}`,
    `${p.additions} / ${p.deletions}`,
    formatPrCell(p, hyperlinks),
  ]);
  return `Reviewing\n${renderTable(headers, rows)}`;
}

/**
 * Wrap the text in an OSC 8 escape sequence. A terminal that supports OSC 8
 * shows only the text and opens the URL when the user clicks the text.
 */
export function hyperlink(text: string, url: string): string {
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

function formatPrCell(
  pr: { title: string; url: string },
  hyperlinks: boolean
): string {
  return hyperlinks ? hyperlink(pr.title, pr.url) : `${pr.title} (${pr.url})`;
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: OSC 8 starts with ESC
const OSC8_PATTERN = /\x1b\]8;;[^\x1b]*\x1b\\/g;

/** Width of the text as the terminal shows it, without OSC 8 sequences. */
export function visibleWidth(text: string): number {
  return text.replace(OSC8_PATTERN, '').length;
}

function renderTable(headers: string[], rows: string[][]): string {
  const allRows = [headers, ...rows];
  const widths = headers.map((_, i) =>
    Math.max(...allRows.map((r) => visibleWidth(r[i] ?? '')))
  );

  const sep = `+${widths.map((w) => '-'.repeat(w + 2)).join('+')}+`;
  const pad = (cell: string, width: number) =>
    cell + ' '.repeat(width - visibleWidth(cell));
  const fmt = (row: string[]) =>
    `| ${row.map((cell, i) => pad(cell, widths[i])).join(' | ')} |`;

  return [sep, fmt(headers), sep, ...rows.map(fmt), sep].join('\n');
}
