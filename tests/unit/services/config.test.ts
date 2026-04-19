import '../../helpers/setup.js'; // must be first — sets POT_CONFIG_PATH before config.ts loads
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { rm, unlink } from 'node:fs/promises';
import { ConfigError } from '../../../src/errors.js';
import {
  readCached,
  readConfig,
  requireConfig,
  savePreset,
  writeCached,
  writeConfig,
} from '../../../src/services/config.js';
import { makeConfig } from '../../helpers/test-data.js';

const TEST_CONFIG = '/tmp/pot-test-config.json';
const TEST_CACHE_DIR = '/tmp/cache';

async function cleanup(): Promise<void> {
  await unlink(TEST_CONFIG).catch(() => {});
  await rm(TEST_CACHE_DIR, { recursive: true, force: true });
}

beforeEach(cleanup);
afterEach(cleanup);

describe('readConfig', () => {
  it('returns null when config file does not exist', async () => {
    const result = await readConfig();
    expect(result).toBeNull();
  });

  it('returns parsed config when file exists', async () => {
    const config = makeConfig({
      ownerName: 'myorg',
      repositoryNames: ['repo1', 'repo2'],
    });
    await writeConfig(config);

    const result = await readConfig();
    expect(result).toEqual(config);
  });
});

describe('writeConfig', () => {
  it('writes config and can be read back', async () => {
    const config = makeConfig({ ownerName: 'myorg' });
    await writeConfig(config);

    const result = await readConfig();
    expect(result).toEqual(config);
  });

  it('creates parent directories if they do not exist', async () => {
    const config = makeConfig();
    await expect(writeConfig(config)).resolves.toBeUndefined();
  });
});

describe('requireConfig', () => {
  it('returns config when file exists', async () => {
    const config = makeConfig({ ownerName: 'myorg' });
    await writeConfig(config);

    const result = await requireConfig();
    expect(result).toEqual(config);
  });

  it('throws ConfigError when config file does not exist', async () => {
    await expect(requireConfig()).rejects.toBeInstanceOf(ConfigError);
  });
});

describe('savePreset', () => {
  it('adds preset to existing config', async () => {
    const config = makeConfig({ ownerName: 'myorg' });
    await writeConfig(config);

    await savePreset('work', {
      ownerName: 'work-org',
      repositoryNames: 'api,web',
    });

    const result = await readConfig();
    expect(result?.registered.work).toEqual({
      ownerName: 'work-org',
      repositoryNames: 'api,web',
    });
    expect(result?.ownerName).toBe('myorg');
  });

  it('creates default config when none exists and saves preset', async () => {
    await savePreset('personal', { ownerName: 'my-user' });

    const result = await readConfig();
    expect(result?.registered.personal).toEqual({ ownerName: 'my-user' });
  });

  it('overwrites existing preset with the same name', async () => {
    await writeConfig(makeConfig());
    await savePreset('work', { ownerName: 'old-org' });
    await savePreset('work', { ownerName: 'new-org' });

    const result = await readConfig();
    expect(result?.registered.work?.ownerName).toBe('new-org');
  });
});

describe('writeCached / readCached', () => {
  it('returns null when cache file does not exist', async () => {
    const result = await readCached('missing-key');
    expect(result).toBeNull();
  });

  it('writes and reads back cached data', async () => {
    const data = [{ number: 1, title: 'PR' }];
    await writeCached('my-key', data);

    const result = await readCached('my-key');
    expect(result).toEqual(data);
  });

  it('sanitizes cache key — replaces non-alphanumeric with underscores', async () => {
    const data = [{ number: 1 }];
    await writeCached('owner/repo,other', data);

    const result = await readCached('owner/repo,other');
    expect(result).toEqual(data);
  });
});
