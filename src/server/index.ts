#!/usr/bin/env node

import { ServerManager } from './server-manager';
import { loggerService } from '@/services/logger.service';

async function main(): Promise<void> {
  const logger = loggerService.getLogger('main');

  try {
    logger.info('Starting Bitbucket MCP Server');

    const serverManager = new ServerManager();
    await serverManager.start();

    logger.info('Bitbucket MCP Server is running');

    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    logger.error('Failed to start Bitbucket MCP Server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--version')) {
  console.log('1.0.0');
  process.exit(0);
}

if (process.argv.includes('--help')) {
  console.log(`
Bitbucket MCP Server

A Model Context Protocol server for Bitbucket Cloud and Data Center.

Usage:
  bitbucket-mcp-server [options]

Options:
  --version    Show version number
  --help       Show this help message

Environment Variables:
  BITBUCKET_SERVER_URL    Bitbucket server URL
  BITBUCKET_USERNAME      Username for authentication
  BITBUCKET_TOKEN         API token or password
  LOG_LEVEL              Logging level (debug, info, warn, error)
  NODE_ENV               Environment (development, production, test)

Examples:
  # Start server with environment variables
  BITBUCKET_SERVER_URL=https://bitbucket.company.com \\
  BITBUCKET_USERNAME=user \\
  BITBUCKET_TOKEN=token \\
  bitbucket-mcp-server

  # Start with custom log level
  LOG_LEVEL=debug bitbucket-mcp-server
`);
  process.exit(0);
}

// Start the server
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
