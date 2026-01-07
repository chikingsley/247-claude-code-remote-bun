import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import { getAgentPaths } from '../lib/paths.js';

export const logsCommand = new Command('logs')
  .description('View agent logs')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .option('-e, --errors', 'Show only error logs')
  .action(async (options) => {
    const paths = getAgentPaths();
    const logFile = options.errors
      ? join(paths.logDir, 'agent.error.log')
      : join(paths.logDir, 'agent.log');

    if (!existsSync(logFile)) {
      console.log(chalk.yellow('No logs found yet.'));
      console.log(chalk.dim(`Expected at: ${logFile}\n`));
      return;
    }

    const args = options.follow
      ? ['-f', '-n', options.lines, logFile]
      : ['-n', options.lines, logFile];

    const tail = spawn('tail', args, {
      stdio: 'inherit',
    });

    tail.on('error', (err) => {
      console.error(chalk.red(`Failed to read logs: ${err.message}`));
      process.exit(1);
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      tail.kill('SIGTERM');
      process.exit(0);
    });
  });
