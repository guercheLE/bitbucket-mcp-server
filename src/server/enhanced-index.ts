#!/usr/bin/env node

import { EnhancedServerManager } from './enhanced-server-manager';
import { loggerService } from '@/services/logger.service';
import { configService } from '@/services/config.service';
import { BitbucketConfig } from '@/types/config';

async function main(): Promise<void> {
  const logger = loggerService.getLogger('enhanced-main');

  try {
    logger.info('Starting Enhanced Bitbucket MCP Server');

    const serverManager = new EnhancedServerManager();

    // Get configuration from environment or command line
    const config = getConfiguration();

    await serverManager.start(config);

    logger.info('Enhanced Bitbucket MCP Server is running', {
      toolCount: serverManager.getStatus().toolCount,
      hasConfig: !!config,
    });

    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    logger.error('Failed to start Enhanced Bitbucket MCP Server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

function getConfiguration(): BitbucketConfig | undefined {
  const serverUrl = process.env['BITBUCKET_SERVER_URL'];
  const username = process.env['BITBUCKET_USERNAME'];
  const token = process.env['BITBUCKET_TOKEN'];
  const password = process.env['BITBUCKET_PASSWORD'];
  const authType = process.env['BITBUCKET_AUTH_TYPE'] as
    | 'oauth'
    | 'api_token'
    | 'basic'
    | undefined;

  if (!serverUrl) {
    return undefined;
  }

  let authConfig;

  if (authType === 'oauth') {
    authConfig = {
      type: 'oauth' as const,
      credentials: {
        clientId: process.env['BITBUCKET_CLIENT_ID'] || 'dummy',
        clientSecret: process.env['BITBUCKET_CLIENT_SECRET'] || 'dummy',
        tokenType: 'Bearer',
        accessToken: token,
      },
    };
  } else if (authType === 'api_token') {
    authConfig = {
      type: 'api_token' as const,
      credentials: {
        username: username || 'dummy',
        token: token || 'dummy',
      },
    };
  } else {
    authConfig = {
      type: 'basic' as const,
      credentials: {
        username: username || 'dummy',
        password: password || 'dummy',
      },
    };
  }

  return {
    baseUrl: serverUrl,
    serverType: (process.env['BITBUCKET_SERVER_TYPE'] as 'cloud' | 'datacenter') || 'cloud',
    auth: authConfig,
    timeouts: configService.getTimeoutConfig(),
    rateLimit: configService.getRateLimitConfig(),
  };
}

// Handle command line arguments
if (process.argv.includes('--version')) {
  console.log('1.0.0');
  process.exit(0);
}

if (process.argv.includes('--help')) {
  console.log(`
Enhanced Bitbucket MCP Server

A Model Context Protocol server for Bitbucket Cloud and Data Center with advanced features.

Usage:
  bitbucket-mcp-server [options]

Options:
  --version    Show version number
  --help       Show this help message

Environment Variables:
  BITBUCKET_SERVER_URL      Bitbucket server URL (required for tool loading)
  BITBUCKET_USERNAME        Username for authentication
  BITBUCKET_TOKEN           API token or password
  BITBUCKET_PASSWORD        Password for basic auth
  BITBUCKET_AUTH_TYPE       Authentication type (oauth, api_token, basic)
  BITBUCKET_CLIENT_ID       OAuth client ID
  BITBUCKET_CLIENT_SECRET   OAuth client secret
  BITBUCKET_SERVER_TYPE     Server type (cloud, datacenter)
  LOG_LEVEL                 Logging level (debug, info, warn, error)
  NODE_ENV                  Environment (development, production, test)

Features:
  - Selective tool loading based on server type
  - Health monitoring and metrics collection
  - Rate limiting and request throttling
  - Comprehensive error handling and logging
  - Graceful shutdown handling

Examples:
  # Start server with environment variables
  BITBUCKET_SERVER_URL=https://bitbucket.company.com \\
  BITBUCKET_USERNAME=user \\
  BITBUCKET_TOKEN=token \\
  BITBUCKET_AUTH_TYPE=api_token \\
  bitbucket-mcp-server

  # Start with OAuth authentication
  BITBUCKET_SERVER_URL=https://api.bitbucket.org \\
  BITBUCKET_CLIENT_ID=your_client_id \\
  BITBUCKET_CLIENT_SECRET=your_client_secret \\
  BITBUCKET_AUTH_TYPE=oauth \\
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
