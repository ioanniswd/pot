import { Cli } from 'clerc';
import packageJson from '../../package.json' with { type: 'json' };
import { PotError } from '../errors.js';
import { checkGhInstalled } from '../services/github.js';
import { configCommand } from './commands/config.js';
import { overviewCommand } from './commands/overview.js';

export async function run(
  argv: string[] = process.argv.slice(2)
): Promise<void> {
  await checkGhInstalled();

  const normalizedArgv = argv.map((a) => (a === '-v' ? '--version' : a));

  await Cli()
    .scriptName('pot')
    .version(packageJson.version)
    .description('GitHub PR overview and team workload distribution')
    .errorHandler((error: unknown) => {
      if (error instanceof PotError) {
        process.stderr.write(`Error: ${error.message}\n`);
      } else {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`Error: ${message}\n`);
      }
      process.exit(error instanceof PotError ? error.exitCode : 1);
    })
    .command(overviewCommand)
    .command(configCommand)
    .parse(normalizedArgv.length === 0 ? [] : normalizedArgv);
}
