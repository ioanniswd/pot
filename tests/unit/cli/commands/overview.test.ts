import '../../../helpers/setup.js'; // must be first — sets POT_CONFIG_PATH before config.ts loads
import { describe, expect, it } from 'bun:test';
import { applyPreset } from '../../../../src/cli/commands/overview.js';
import type {
  OverviewOptions,
  RegisteredPreset,
} from '../../../../src/types.js';

function makeOptions(
  overrides: Partial<OverviewOptions> = {}
): OverviewOptions {
  return {
    users: undefined,
    user: undefined,
    urlOnly: undefined,
    actionable: undefined,
    ownerName: undefined,
    repositoryNames: undefined,
    registerNew: undefined,
    registered: 'team',
    cached: undefined,
    json: undefined,
    ...overrides,
  };
}

const PRESET: RegisteredPreset = {
  users: 'john-doe,jane-doe,jack-doe',
  ownerName: 'test-owner',
};

describe('applyPreset', () => {
  it('keeps preset values when the matching flags were not passed', () => {
    const result = applyPreset(PRESET, makeOptions());

    expect(result.users).toBe('john-doe,jane-doe,jack-doe');
    expect(result.ownerName).toBe('test-owner');
  });

  it('gives passed flags precedence over preset values', () => {
    const result = applyPreset(PRESET, makeOptions({ users: 'jane-doe' }));

    expect(result.users).toBe('jane-doe');
    expect(result.ownerName).toBe('test-owner');
  });

  it('keeps passed flags that the preset does not define', () => {
    const result = applyPreset(PRESET, makeOptions({ json: true }));

    expect(result.json).toBe(true);
    expect(result.users).toBe('john-doe,jane-doe,jack-doe');
  });

  it('clears registered so the preset is not resolved twice', () => {
    const result = applyPreset(PRESET, makeOptions());

    expect(result.registered).toBeUndefined();
  });

  it('keeps a false flag value instead of falling back to the preset', () => {
    const result = applyPreset(
      { ...PRESET, user: 'john-doe' },
      makeOptions({ actionable: false })
    );

    expect(result.actionable).toBe(false);
    expect(result.user).toBe('john-doe');
  });
});
