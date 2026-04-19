type MockResponse = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export type GhMockHandler = (cmd: string[]) => MockResponse;

type BunSpawnMock = {
  spawn: (
    cmd: string[],
    opts?: unknown
  ) => {
    exited: Promise<number>;
    exitCode: number;
    stdout: ReadableStream<Uint8Array>;
    stderr: ReadableStream<Uint8Array>;
  };
};

let _savedSpawn: typeof Bun.spawn | undefined;

function toStream(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(ctrl) {
      ctrl.enqueue(new TextEncoder().encode(text));
      ctrl.close();
    },
  });
}

export function mockGh(handler: GhMockHandler): void {
  _savedSpawn = Bun.spawn;
  (Bun as unknown as BunSpawnMock).spawn = (cmd: string[]) => {
    const { stdout, stderr, exitCode } = handler(cmd);
    return {
      exited: Promise.resolve(exitCode),
      exitCode,
      stdout: toStream(stdout),
      stderr: toStream(stderr),
    };
  };
}

export function restoreGh(): void {
  if (_savedSpawn !== undefined) {
    (Bun as unknown as { spawn: typeof Bun.spawn }).spawn = _savedSpawn;
    _savedSpawn = undefined;
  }
}
