import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { ConfigError } from './errors.js';
import type { Config, RegisteredPreset } from './types.js';

const CONFIG_PATH =
  process.env.POT_CONFIG_PATH ??
  join(homedir(), '.config', 'pot', 'config.json');

const CACHE_DIR = join(dirname(CONFIG_PATH), 'cache');

const DEFAULT_CONFIG: Config = {
  ownerName: '',
  repositoryNames: [],
  cacheEnabled: false,
  registered: {},
};

export async function readConfig(): Promise<Config | null> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf8');
    return JSON.parse(raw) as Config;
  } catch {
    return null;
  }
}

export async function writeConfig(config: Config): Promise<void> {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function requireConfig(): Promise<Config> {
  const config = await readConfig();
  if (!config) {
    throw new ConfigError(
      'No config found. Run `pot config` to set up owner and repositories.'
    );
  }
  return config;
}

export async function savePreset(
  name: string,
  preset: RegisteredPreset
): Promise<void> {
  const config = (await readConfig()) ?? { ...DEFAULT_CONFIG };
  config.registered[name] = preset;
  await writeConfig(config);
}

export async function readCached(key: string): Promise<unknown[] | null> {
  try {
    const raw = await readFile(
      join(CACHE_DIR, `${sanitizeKey(key)}.json`),
      'utf8'
    );
    return JSON.parse(raw) as unknown[];
  } catch {
    return null;
  }
}

export async function writeCached(key: string, data: unknown[]): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(
    join(CACHE_DIR, `${sanitizeKey(key)}.json`),
    JSON.stringify(data)
  );
}

function sanitizeKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '_');
}
