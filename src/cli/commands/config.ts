import { createInterface } from 'node:readline';
import { defineCommand } from 'clerc';
import { readConfig, writeConfig } from '../../config.js';

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export const configCommand = defineCommand(
  {
    name: 'config',
    description: 'Interactive setup: configure owner, repositories, and cache',
    flags: {},
  },
  async () => {
    const existing = await readConfig();

    const ownerName = await prompt(
      `Owner (org or user name)${existing?.ownerName ? ` [${existing.ownerName}]` : ''}: `
    );
    const repositoryNames = await prompt(
      `Repository names (comma-separated)${existing?.repositoryNames?.length ? ` [${existing.repositoryNames.join(',')}]` : ''}: `
    );
    const cacheAnswer = await prompt('Enable caching (y/n) [n]: ');
    const user = await prompt(
      `Your GitHub username (for highlighting)${existing?.user ? ` [${existing.user}]` : ''}: `
    );

    const config = {
      ownerName: ownerName || existing?.ownerName || '',
      repositoryNames: repositoryNames
        ? repositoryNames
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean)
        : (existing?.repositoryNames ?? []),
      cacheEnabled: cacheAnswer.toLowerCase().startsWith('y'),
      user: user || existing?.user,
      registered: existing?.registered ?? {},
    };

    await writeConfig(config);
    process.stdout.write('Config saved.\n');
  }
);
