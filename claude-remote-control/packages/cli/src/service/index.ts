import { platform } from "os";
import { LaunchdService } from "./launchd.js";
import { SystemdService } from "./systemd.js";

export interface ServiceStatus {
  configPath?: string;
  enabled: boolean;
  installed: boolean;
  pid?: number;
  running: boolean;
}

export interface ServiceInstallOptions {
  enableAtBoot?: boolean;
  startNow?: boolean;
}

export interface ServiceResult {
  configPath?: string;
  error?: string;
  success: boolean;
}

export interface ServiceManager {
  /** Get log file paths */
  getLogPaths(): { stdout: string; stderr: string };

  /** Install service configuration */
  install(options?: ServiceInstallOptions): Promise<ServiceResult>;
  /** Platform identifier */
  platform: "macos" | "linux";

  /** Restart the service */
  restart(): Promise<ServiceResult>;

  /** Service identifier */
  serviceName: string;

  /** Start the service */
  start(): Promise<ServiceResult>;

  /** Get current service status */
  status(): Promise<ServiceStatus>;

  /** Stop the service */
  stop(): Promise<ServiceResult>;

  /** Uninstall service configuration */
  uninstall(): Promise<ServiceResult>;
}

/**
 * Create platform-appropriate service manager
 */
export function createServiceManager(): ServiceManager {
  const os = platform();

  switch (os) {
    case "darwin":
      return new LaunchdService();
    case "linux":
      return new SystemdService();
    default:
      throw new Error(
        `Unsupported platform: ${os}. Only macOS and Linux are supported.`
      );
  }
}
