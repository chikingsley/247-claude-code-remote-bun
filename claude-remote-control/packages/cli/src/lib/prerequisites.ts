import { execSync } from 'child_process';
import { platform } from 'os';
import * as net from 'net';

export interface PrerequisiteCheck {
  name: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
  required: boolean;
}

/**
 * Check if Bun is available (required for agent runtime)
 */
export function checkBun(): PrerequisiteCheck {
  try {
    const output = execSync('bun --version', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return {
      name: 'Bun',
      status: 'ok',
      message: output.trim(),
      required: true,
    };
  } catch {
    return {
      name: 'Bun',
      status: 'error',
      message: 'Not installed. See: https://bun.sh',
      required: true,
    };
  }
}

/**
 * Check if Node.js version is sufficient
 */
export function checkNodeVersion(): PrerequisiteCheck {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);

  if (major >= 22) {
    return {
      name: 'Node.js',
      status: 'ok',
      message: version,
      required: true,
    };
  }

  if (major >= 18) {
    return {
      name: 'Node.js',
      status: 'warn',
      message: `${version} (recommended: >=22)`,
      required: true,
    };
  }

  return {
    name: 'Node.js',
    status: 'error',
    message: `${version} (required: >=22)`,
    required: true,
  };
}

/**
 * Check if tmux is installed
 */
export function checkTmux(): PrerequisiteCheck {
  try {
    const output = execSync('tmux -V', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return {
      name: 'tmux',
      status: 'ok',
      message: output.trim(),
      required: true,
    };
  } catch {
    const os = platform();
    const installCmd = os === 'darwin' ? 'brew install tmux' : 'sudo apt install tmux';

    return {
      name: 'tmux',
      status: 'error',
      message: `Not installed. Run: ${installCmd}`,
      required: true,
    };
  }
}

/**
 * Check platform compatibility
 */
export function checkPlatform(): PrerequisiteCheck {
  const os = platform();

  if (os === 'darwin') {
    return {
      name: 'Platform',
      status: 'ok',
      message: 'macOS',
      required: true,
    };
  }

  if (os === 'linux') {
    return {
      name: 'Platform',
      status: 'ok',
      message: 'Linux',
      required: true,
    };
  }

  return {
    name: 'Platform',
    status: 'error',
    message: `Unsupported: ${os}. Only macOS and Linux are supported.`,
    required: true,
  };
}

/**
 * Check if a port is available
 */
export async function checkPort(port: number): Promise<PrerequisiteCheck> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve({
          name: `Port ${port}`,
          status: 'error',
          message: 'Port is already in use',
          required: false,
        });
      } else {
        resolve({
          name: `Port ${port}`,
          status: 'warn',
          message: `Could not check: ${err.message}`,
          required: false,
        });
      }
    });

    server.once('listening', () => {
      server.close();
      resolve({
        name: `Port ${port}`,
        status: 'ok',
        message: 'Available',
        required: false,
      });
    });

    server.listen(port, '127.0.0.1');
  });
}

/**
 * Run all prerequisite checks
 */
export async function checkAllPrerequisites(port?: number): Promise<PrerequisiteCheck[]> {
  const checks: PrerequisiteCheck[] = [checkPlatform(), checkNodeVersion(), checkTmux(), checkBun()];

  if (port) {
    checks.push(await checkPort(port));
  }

  return checks;
}

/**
 * Check if all required prerequisites are met
 */
export function allRequiredMet(checks: PrerequisiteCheck[]): boolean {
  return checks.filter((c) => c.required).every((c) => c.status !== 'error');
}

// Aliases for backwards compatibility
export const checkNode = checkNodeVersion;
