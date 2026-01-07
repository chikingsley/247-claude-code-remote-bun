import { platform } from 'os';
import { LaunchdService } from './launchd.js';
import { SystemdService } from './systemd.js';

export interface ServiceStatus {
  installed: boolean;
  running: boolean;
  enabled: boolean;
  pid?: number;
  configPath?: string;
}

export interface ServiceInstallOptions {
  startNow?: boolean;
  enableAtBoot?: boolean;
}

export interface ServiceResult {
  success: boolean;
  error?: string;
  configPath?: string;
}

export interface ServiceManager {
  /** Platform identifier */
  platform: 'macos' | 'linux';

  /** Service identifier */
  serviceName: string;

  /** Get current service status */
  status(): Promise<ServiceStatus>;

  /** Install service configuration */
  install(options?: ServiceInstallOptions): Promise<ServiceResult>;

  /** Uninstall service configuration */
  uninstall(): Promise<ServiceResult>;

  /** Start the service */
  start(): Promise<ServiceResult>;

  /** Stop the service */
  stop(): Promise<ServiceResult>;

  /** Restart the service */
  restart(): Promise<ServiceResult>;

  /** Get log file paths */
  getLogPaths(): { stdout: string; stderr: string };
}

/**
 * Create platform-appropriate service manager
 */
export function createServiceManager(): ServiceManager {
  const os = platform();

  switch (os) {
    case 'darwin':
      return new LaunchdService();
    case 'linux':
      return new SystemdService();
    default:
      throw new Error(`Unsupported platform: ${os}. Only macOS and Linux are supported.`);
  }
}
