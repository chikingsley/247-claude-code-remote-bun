import chalk from "chalk";
import { Command } from "commander";

const PACKAGE_NAME = "247-cli";

export const versionCommand = new Command("version")
  .description("Show version and check for updates")
  .action(async () => {
    // Get current version from package.json
    const pkg = await import("../../package.json", {
      with: { type: "json" },
    });
    const currentVersion = pkg.default.version;

    // Check registry for latest version
    let latestVersion: string | null = null;
    try {
      const res = await fetch(
        `https://registry.npmjs.org/${PACKAGE_NAME}/latest`
      );
      if (!res.ok) {
        throw new Error(`Registry returned ${res.status}`);
      }
      const data = (await res.json()) as { version: string };
      latestVersion = data.version;
    } catch {
      // Network error or package not found - silently ignore
    }

    // Display version
    if (latestVersion && currentVersion !== latestVersion) {
      console.log(`247 v${currentVersion}`);
      console.log();
      console.log(
        chalk.yellow(`Update available: ${currentVersion} → ${latestVersion}`)
      );
      console.log(chalk.dim('Run "247 update" to install.'));
    } else if (latestVersion) {
      console.log(`247 v${currentVersion} ${chalk.green("(latest)")}`);
    } else {
      console.log(`247 v${currentVersion}`);
      console.log(chalk.dim("Could not check for updates."));
    }
  });
