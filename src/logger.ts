const debug = process.env.POT_DEBUG === '1';

export function log(message: string): void {
  if (debug) process.stderr.write(`[pot] ${message}\n`);
}
