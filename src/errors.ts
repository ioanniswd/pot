export class PotError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number = 1
  ) {
    super(message);
    this.name = 'PotError';
  }
}

export class ConfigError extends PotError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class GhError extends PotError {
  constructor(message: string) {
    super(message);
    this.name = 'GhError';
  }
}
