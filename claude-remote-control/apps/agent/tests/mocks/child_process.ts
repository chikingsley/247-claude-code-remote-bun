import { vi } from 'vitest';
import { EventEmitter } from 'events';

export interface CommandResponse {
  stdout: string;
  stderr: string;
}

export type CommandResponses = Record<string, CommandResponse | Error>;

// Create a mock exec function that responds based on command patterns
export function createExecMock(responses: CommandResponses = {}) {
  return vi.fn((cmd: string, optionsOrCallback?: any, callback?: any) => {
    const cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;

    // Find matching response based on command pattern
    const matchingKey = Object.keys(responses).find((pattern) =>
      cmd.includes(pattern)
    );

    if (matchingKey) {
      const response = responses[matchingKey];
      if (response instanceof Error) {
        if (cb) {
          cb(response, null, response.message);
        }
        return;
      }
      if (cb) {
        cb(null, response.stdout, response.stderr);
      }
    } else {
      // Default response
      if (cb) {
        cb(null, '', '');
      }
    }
  });
}

// Create a mock execSync function
export function createExecSyncMock(responses: Record<string, string | Error> = {}) {
  return vi.fn((cmd: string) => {
    const matchingKey = Object.keys(responses).find((pattern) =>
      cmd.includes(pattern)
    );

    if (matchingKey) {
      const response = responses[matchingKey];
      if (response instanceof Error) {
        throw response;
      }
      return response;
    }

    return '';
  });
}

// Create a mock spawn function
export function createSpawnMock() {
  const mockProcess = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    stdin: { write: ReturnType<typeof vi.fn> };
    pid: number;
    kill: ReturnType<typeof vi.fn>;
  };

  mockProcess.stdout = new EventEmitter();
  mockProcess.stderr = new EventEmitter();
  mockProcess.stdin = { write: vi.fn() };
  mockProcess.pid = 12345;
  mockProcess.kill = vi.fn();

  return {
    spawn: vi.fn(() => mockProcess),
    _mockProcess: mockProcess,
  };
}

// Promisified exec mock
export function createExecAsyncMock(responses: CommandResponses = {}) {
  return vi.fn(async (cmd: string) => {
    const matchingKey = Object.keys(responses).find((pattern) =>
      cmd.includes(pattern)
    );

    if (matchingKey) {
      const response = responses[matchingKey];
      if (response instanceof Error) {
        throw response;
      }
      return response;
    }

    return { stdout: '', stderr: '' };
  });
}
