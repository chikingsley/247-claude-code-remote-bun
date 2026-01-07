import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { installHooks, uninstallHooks, getHooksStatus } from '../hooks/installer.js';

export const hooksCommand = new Command('hooks')
  .description('Manage Claude Code hooks');

hooksCommand
  .command('install')
  .description('Install Claude Code hooks')
  .option('-f, --force', 'Force reinstallation even if already installed')
  .action(async (options) => {
    const spinner = ora('Installing Claude Code hooks...').start();

    try {
      const status = getHooksStatus();

      if (status.installed && !options.force) {
        spinner.info('Hooks are already installed');
        console.log(chalk.dim(`  Path: ${status.path}`));
        console.log(chalk.dim(`  Type: ${status.isSymlink ? 'Symlink (dev)' : 'Copy'}`));

        if (status.needsUpdate) {
          console.log(chalk.yellow('\n  An update is available. Run with --force to update.'));
        }
        return;
      }

      const result = installHooks();

      if (result.success) {
        spinner.succeed('Hooks installed successfully');
        console.log(chalk.dim(`  Path: ${result.path}`));
      } else {
        spinner.fail(`Failed to install hooks: ${result.error}`);
        process.exit(1);
      }
    } catch (err) {
      spinner.fail(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

hooksCommand
  .command('uninstall')
  .description('Uninstall Claude Code hooks')
  .action(async () => {
    const spinner = ora('Uninstalling Claude Code hooks...').start();

    try {
      const status = getHooksStatus();

      if (!status.installed) {
        spinner.info('Hooks are not installed');
        return;
      }

      const result = uninstallHooks();

      if (result.success) {
        spinner.succeed('Hooks uninstalled successfully');
      } else {
        spinner.fail(`Failed to uninstall hooks: ${result.error}`);
        process.exit(1);
      }
    } catch (err) {
      spinner.fail(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

hooksCommand
  .command('status')
  .description('Show hooks installation status')
  .action(async () => {
    try {
      const status = getHooksStatus();

      console.log(chalk.bold('\nClaude Code Hooks Status\n'));

      if (!status.installed) {
        console.log(chalk.yellow('● Not installed'));
        console.log(chalk.dim('\nRun "247 hooks install" to install the hooks.\n'));
        return;
      }

      console.log(chalk.green('● Installed'));
      console.log(`  Path: ${status.path}`);
      console.log(`  Type: ${status.isSymlink ? 'Symlink (dev mode)' : 'File copy'}`);

      if (status.needsUpdate) {
        console.log(chalk.yellow('\n  Update available!'));
        console.log(chalk.dim('  Run "247 hooks install --force" to update.'));
      } else {
        console.log(chalk.green('  Up to date'));
      }

      console.log();
      console.log(chalk.dim('The hooks notify the 247 agent when Claude Code sessions stop,'));
      console.log(chalk.dim('enabling automatic status updates in the dashboard.'));
      console.log();
    } catch (err) {
      console.error(chalk.red(`Error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

hooksCommand
  .command('update')
  .description('Update hooks if a new version is available')
  .action(async () => {
    const spinner = ora('Checking for updates...').start();

    try {
      const status = getHooksStatus();

      if (!status.installed) {
        spinner.info('Hooks are not installed');
        console.log(chalk.dim('\nRun "247 hooks install" to install them.\n'));
        return;
      }

      if (!status.needsUpdate) {
        spinner.succeed('Hooks are already up to date');
        return;
      }

      spinner.text = 'Updating hooks...';
      const result = installHooks();

      if (result.success) {
        spinner.succeed('Hooks updated successfully');
      } else {
        spinner.fail(`Failed to update hooks: ${result.error}`);
        process.exit(1);
      }
    } catch (err) {
      spinner.fail(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });
