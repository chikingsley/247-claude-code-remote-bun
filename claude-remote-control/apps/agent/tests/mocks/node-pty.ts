import { vi } from 'vitest';
import { EventEmitter } from 'events';

export interface MockPtyProcess extends EventEmitter {
  write: ReturnType<typeof vi.fn>;
  resize: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  pid: number;
  _emit: (event: string, data: unknown) => void;
}

export function createMockPty(): MockPtyProcess {
  const emitter = new EventEmitter() as MockPtyProcess;
  emitter.write = vi.fn();
  emitter.resize = vi.fn();
  emitter.kill = vi.fn();
  emitter.pid = 12345;
  emitter._emit = (event: string, data: unknown) => emitter.emit(event, data);

  // Add onData and onExit as aliases for addEventListener pattern
  (emitter as any).onData = (cb: (data: string) => void) => {
    emitter.on('data', cb);
    return { dispose: () => emitter.off('data', cb) };
  };
  (emitter as any).onExit = (cb: (info: { exitCode: number; signal?: number }) => void) => {
    emitter.on('exit', cb);
    return { dispose: () => emitter.off('exit', cb) };
  };

  return emitter;
}

// Factory for creating the mock module
export const createNodePtyMock = () => {
  const mockProcess = createMockPty();

  return {
    spawn: vi.fn(() => mockProcess),
    _mockProcess: mockProcess,
  };
};
