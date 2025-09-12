#!/usr/bin/env node

import { BitbucketCLI } from './cli';

// Export the CLI class for programmatic use
export { BitbucketCLI } from './cli';
export * from './commands/auth';
export * from './commands/repository';
export * from './commands/project';
export * from './commands/pullrequest';
export * from './commands/server';
export * from './commands/mcp';

// If this file is run directly, start the CLI
if (require.main === module) {
  const cli = new BitbucketCLI();
  cli.run().catch((error: any) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
