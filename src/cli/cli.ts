#!/usr/bin/env node

import { Command } from 'commander';
import { loggerService } from '@/services/logger.service';
import { createAuthCommands } from './commands/auth';
import { createRepositoryCommands } from './commands/repository';
import { createProjectCommands } from './commands/project';
import { createPullRequestCommands } from './commands/pullrequest';
import { createServerCommands } from './commands/server';
import { createMCPCommands } from './commands/mcp';

export class BitbucketCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
    this.setupCommands();
  }

  private setupProgram(): void {
    this.program
      .name('bitbucket-cli')
      .description('Bitbucket MCP Server CLI - Command line interface for Bitbucket operations')
      .version('1.0.0')
      .option('-v, --verbose', 'Enable verbose logging')
      .option('-q, --quiet', 'Suppress output except errors')
      .option('--log-level <level>', 'Set log level (debug, info, warn, error)', 'info')
      .hook('preAction', thisCommand => {
        const options = thisCommand.opts();

        // Configure logging based on CLI options
        if (options['verbose']) {
          process.env['LOG_LEVEL'] = 'debug';
        } else if (options['quiet']) {
          process.env['LOG_LEVEL'] = 'error';
        } else if (options['logLevel']) {
          process.env['LOG_LEVEL'] = options['logLevel'];
        }

        // Initialize logger with new level
        const logger = loggerService.getLogger('cli');
        logger.info('CLI started', {
          verbose: options['verbose'],
          quiet: options['quiet'],
          logLevel: process.env['LOG_LEVEL'],
        });
      });
  }

  private setupCommands(): void {
    // Add command groups
    this.program.addCommand(createAuthCommands());
    this.program.addCommand(createRepositoryCommands());
    this.program.addCommand(createProjectCommands());
    this.program.addCommand(createPullRequestCommands());
    this.program.addCommand(createServerCommands());
    this.program.addCommand(createMCPCommands());

    // Add global options and help
    this.program
      .option('--config <file>', 'Configuration file path')
      .option('--server-url <url>', 'Default Bitbucket server URL')
      .option('--auth-type <type>', 'Default authentication type')
      .option('--username <username>', 'Default username')
      .option('--token <token>', 'Default token/password')
      .hook('preAction', thisCommand => {
        const options = thisCommand.opts();

        // Set global configuration from CLI options
        if (options['serverUrl']) {
          process.env['BITBUCKET_SERVER_URL'] = options['serverUrl'];
        }
        if (options['authType']) {
          process.env['BITBUCKET_AUTH_TYPE'] = options['authType'];
        }
        if (options['username']) {
          process.env['BITBUCKET_USERNAME'] = options['username'];
        }
        if (options['token']) {
          process.env['BITBUCKET_TOKEN'] = options['token'];
        }
      });
  }

  public async run(): Promise<void> {
    try {
      await this.program.parseAsync();
    } catch (error) {
      const logger = loggerService.getLogger('cli');
      logger.error('CLI execution failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error('❌ Command failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }
}

// Handle command line arguments
if (process.argv.includes('--version')) {
  console.log('1.0.0');
  process.exit(0);
}

if (process.argv.includes('--help') && process.argv.length === 2) {
  console.log(`
Bitbucket MCP Server CLI

A comprehensive command line interface for Bitbucket operations.

Usage:
  bitbucket-cli <command> [options]

Commands:
  auth        Authentication commands
  repo        Repository management commands
  project     Project management commands (Data Center only)
  pr          Pull request management commands
  server      Server information and management commands
  mcp         MCP server management commands

Global Options:
  -v, --verbose              Enable verbose logging
  -q, --quiet                Suppress output except errors
  --log-level <level>        Set log level (debug, info, warn, error)
  --config <file>            Configuration file path
  --server-url <url>         Default Bitbucket server URL
  --auth-type <type>         Default authentication type
  --username <username>      Default username
  --token <token>            Default token/password

Examples:
  # Authenticate with Bitbucket
  bitbucket-cli auth login --url https://bitbucket.company.com --type api_token --username user --token token

  # List repositories
  bitbucket-cli repo list --url https://bitbucket.company.com --project MYPROJ

  # Create a pull request
  bitbucket-cli pr create --url https://bitbucket.company.com --project MYPROJ --repo myrepo --title "Fix bug" --from feature-branch --to main

  # Start MCP server
  bitbucket-cli mcp start --url https://bitbucket.company.com

  # Get server information
  bitbucket-cli server info --url https://bitbucket.company.com

Environment Variables:
  BITBUCKET_SERVER_URL       Default Bitbucket server URL
  BITBUCKET_AUTH_TYPE        Default authentication type
  BITBUCKET_USERNAME         Default username
  BITBUCKET_TOKEN            Default token/password
  LOG_LEVEL                  Logging level

For more information about a specific command, use:
  bitbucket-cli <command> --help
`);
  process.exit(0);
}

// Start the CLI
const cli = new BitbucketCLI();
cli.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
