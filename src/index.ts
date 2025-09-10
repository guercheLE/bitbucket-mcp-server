#!/usr/bin/env node
import { Logger } from './utils/logger.util.js';
import { config } from './utils/config.util.js';
import { VERSION } from './utils/constants.util.js';

import { runCli } from './client.js';
import { startServer } from './server.js';

// Create a contextualized logger for this file
const indexLogger = Logger.forContext('index.ts');

/**
 * Main entry point - this will run when executed directly
 * Determines whether to run in CLI or server mode based on command-line arguments
 */
export async function main() {
  const mainLogger = Logger.forContext('index.ts', 'main');

  // Load configuration
  config.load();

  // Log initialization at debug level (after config is loaded)
  indexLogger.debug('Bitbucket MCP entry point module loaded');

  // Check if we should run in CLI mode
  const isCLIMode = process.argv.length > 2;

  mainLogger.info(`Arguments: ${JSON.stringify(process.argv)}`);
  mainLogger.info(`isCLIMode: ${isCLIMode}`);

  // If we have any arguments (including help/version), run CLI
  if (isCLIMode) {
    mainLogger.info('Starting in CLI mode');
    await runCli(process.argv);
    mainLogger.info('CLI execution completed');
    return;
  }

  // Server mode - determine transport
  const transportMode = (process.env.TRANSPORT_MODE || 'stdio').toLowerCase();
  let mode: 'http' | 'stdio';

  if (transportMode === 'stdio') {
    mode = 'stdio';
  } else if (transportMode === 'http') {
    mode = 'http';
  } else {
    mainLogger.warn(`Unknown TRANSPORT_MODE "${transportMode}", defaulting to stdio`);
    mode = 'stdio';
  }

  mainLogger.info(`Starting server with ${mode.toUpperCase()} transport`);
  await startServer(mode);
  mainLogger.info('Server is now running');
}

// If this file is being executed directly (not imported), run the main function
// Check if this is the main module by looking at process.argv[1]
// Also check if we're in a test environment
const isMainModule =
  (process.argv[1]?.endsWith('index.js') ||
    process.argv[1]?.endsWith('index.ts') ||
    process.argv[1]?.includes('index')) &&
  !process.env.NODE_ENV?.includes('test');

if (isMainModule) {
  // Execute main function
  main().catch(err => {
    // Use console.error for critical errors before logger is configured
    console.error('Unhandled error in main process:', err);
    process.exit(1);
  });
}
