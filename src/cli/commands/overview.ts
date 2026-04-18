import { defineCommand } from 'clerc';
import { readConfig, requireConfig, savePreset } from '../../config.js';
import { aggregate } from '../../services/aggregator.js';
import { checkGhAuth, fetchPrs } from '../../services/github.js';
import type { OverviewOptions } from '../../types.js';
import {
  formatAuthoredTable,
  formatOverviewTable,
  formatReviewingTable,
} from '../format.js';

export const overviewCommand = defineCommand(
  {
    name: '',
    description: 'Show PR overview and team workload',
    flags: {
      users: {
        type: String,
        description: 'Comma-separated list of users to display',
      },
      user: {
        type: String,
        description: 'Show detailed PR breakdown for this user',
      },
      'url-only': {
        type: Boolean,
        description: 'Print only PR URLs (requires --user)',
      },
      actionable: {
        type: String,
        description: 'Filter URLs by actionable status (true/false)',
      },
      'owner-name': { type: String, description: 'GitHub owner (org or user)' },
      'repository-names': {
        type: String,
        description: 'Comma-separated repository names',
      },
      'register-new': {
        type: String,
        description: 'Save current options under this name',
      },
      registered: { type: String, description: 'Use saved options by name' },
      cached: {
        type: Boolean,
        description: 'Use cached data from previous run',
      },
      json: { type: Boolean, description: 'Output raw JSON' },
    },
  },
  async (ctx) => {
    let options: OverviewOptions = {
      users: ctx.flags.users,
      user: ctx.flags.user,
      urlOnly: ctx.flags['url-only'],
      actionable:
        ctx.flags.actionable === 'true'
          ? true
          : ctx.flags.actionable === 'false'
            ? false
            : undefined,
      ownerName: ctx.flags['owner-name'],
      repositoryNames: ctx.flags['repository-names'],
      registerNew: ctx.flags['register-new'],
      registered: ctx.flags.registered,
      cached: ctx.flags.cached,
      json: ctx.flags.json,
    };

    // Restore saved preset (flags take precedence over preset values)
    if (options.registered) {
      const config = await readConfig();
      const preset = config?.registered[options.registered];
      if (!preset) {
        process.stderr.write(
          `Registered config "${options.registered}" was not found.\n`
        );
        process.exit(1);
      }
      options = { ...preset, ...options, registered: undefined };
    }

    // Save current options as a preset
    if (options.registerNew) {
      const { registerNew, registered, cached, json, ...presetFields } =
        options;
      await savePreset(registerNew, presetFields);
    }

    if (options.urlOnly && !options.user) {
      process.stderr.write('--url-only requires --user\n');
      process.exit(1);
    }

    await checkGhAuth();
    const config = await requireConfig();
    const specifiedUser = options.user ?? config.user;
    const rawPrs = await fetchPrs(config, options);
    const data = aggregate(rawPrs, specifiedUser, options.urlOnly ?? false);

    // URL-only mode
    if (options.urlOnly) {
      const urls =
        options.actionable === undefined
          ? data.prUrls
          : data.prUrls.filter((u) => u.actionable === options.actionable);
      for (const u of urls) process.stdout.write(`${u.url}\n`);
      return;
    }

    // Determine which users to show
    const explicitUsers =
      options.users
        ?.split(',')
        .map((u) => u.trim())
        .filter(Boolean) ?? [];

    const allRelevant = new Set([
      ...explicitUsers,
      ...(specifiedUser ? [specifiedUser] : []),
      ...data.relevantUsersForSpecifiedUser,
    ]);

    const usersToInclude =
      allRelevant.size > 0
        ? [...data.userPrCounts.keys()].filter((u) => allRelevant.has(u))
        : [...data.userPrCounts.keys()];

    if (options.json) {
      const out = usersToInclude.map((username) => {
        const counts = data.userPrCounts.get(username) ?? {
          author: 0,
          activeReviewer: 0,
        };
        const loc = data.locPerUser.get(username);
        return {
          username,
          authored: counts.author,
          reviewing: counts.activeReviewer,
          total: counts.author + counts.activeReviewer,
          actionable: data.actionablesCountPerAuthor.get(username) ?? 0,
          untouched: data.untouchedCountPerAuthor.get(username) ?? 0,
          totalAdditions: loc?.total.additions ?? 0,
          totalDeletions: loc?.total.deletions ?? 0,
          actionableAdditions: loc?.actionable.additions ?? 0,
          actionableDeletions: loc?.actionable.deletions ?? 0,
        };
      });
      process.stdout.write(
        `${JSON.stringify(
          specifiedUser
            ? {
                users: out,
                authored: data.specifiedUserPrs.authored,
                reviewing: data.specifiedUserPrs.reviewing,
              }
            : { users: out },
          null,
          2
        )}\n`
      );
      return;
    }

    // Text output
    process.stdout.write(
      `${formatOverviewTable(data, usersToInclude, specifiedUser)}\n`
    );

    if (specifiedUser) {
      process.stdout.write('\n');
      process.stdout.write(
        `${formatAuthoredTable(data.specifiedUserPrs.authored)}\n`
      );
      process.stdout.write('\n');
      process.stdout.write(
        `${formatReviewingTable(
          data.specifiedUserPrs.reviewing,
          data.actionablesCountPerAuthor
        )}\n`
      );
    }
  }
);
