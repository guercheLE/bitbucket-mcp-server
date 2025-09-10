#!/usr/bin/env node

import { Command } from 'commander';
import { Logger } from './utils/logger.util.js';
import { config } from './utils/config.util.js';
import { VERSION, PACKAGE_NAME } from './utils/constants.util.js';

// Import Cloud Commands
import { CloudCommitCommands } from './commands/cloud/commit.command.js';
import { DiffCommands as CloudDiffCommands } from './commands/cloud/diff.command.js';
import { CloudPullRequestCommands } from './commands/cloud/pull-request.command.js';
import { CloudRepositoryCommands } from './commands/cloud/repository.command.js';
import { CloudProjectCommands } from './commands/cloud/project.command.js';
import { CloudWorkspaceCommands } from './commands/cloud/workspace.command.js';
import { CloudUserCommands } from './commands/cloud/user.command.js';
import { CloudIssueCommands } from './commands/cloud/issue.command.js';
import { CloudSearchCommands } from './commands/cloud/search.command.js';
import { CloudSnippetCommands } from './commands/cloud/snippet.command.js';
import { CloudAuthenticationCommands } from './commands/cloud/authentication.command.js';
import { CloudBranchRestrictionCommands } from './commands/cloud/branch-restriction.command.js';
import { CloudPipelineCommands } from './commands/cloud/pipeline.command.js';
import { CloudRefCommands } from './commands/cloud/ref.command.js';
import { CloudSourceCommands } from './commands/cloud/source.command.js';
import { CloudSSHCommands } from './commands/cloud/ssh.command.js';
import { CloudWebhookCommands } from './commands/cloud/webhook.command.js';
import { CloudOAuthCommands } from './commands/cloud/oauth.command.js';
import { CloudTokenManagementCommands } from './commands/cloud/token-management.command.js';
import { CloudScopeValidatorCommands } from './commands/cloud/scope-validator.command.js';

// Import Data Center Commands
import { DataCenterRepositoryCommands } from './commands/datacenter/repository.command.js';
import { DataCenterProjectCommands } from './commands/datacenter/project.command.js';
import { DataCenterAuthenticationCommands } from './commands/datacenter/authentication.command.js';
import { DataCenterBuildsCommands } from './commands/datacenter/builds.command.js';
import { DataCenterCapabilitiesCommands } from './commands/datacenter/capabilities.command.js';
import { DataCenterSearchCommands } from './commands/datacenter/search.command.js';
import { DataCenterPullRequestCommands } from './commands/datacenter/pull-request.command.js';
import { DataCenterDashboardCommands } from './commands/datacenter/dashboard.command.js';
import { DataCenterSecurityCommands } from './commands/datacenter/security.command.js';
import { DataCenterPermissionManagementCommands } from './commands/datacenter/permission-management.command.js';
import { DataCenterDeprecatedCommands } from './commands/datacenter/deprecated.command.js';
import { DataCenterJiraIntegrationCommands } from './commands/datacenter/jira-integration.command.js';
import { DataCenterMarkupCommands } from './commands/datacenter/markup.command.js';
import { DataCenterMirroringCommands } from './commands/datacenter/mirroring.command.js';
import { DataCenterOtherOperationsCommands } from './commands/datacenter/other-operations.command.js';
import { DataCenterRollingUpgradesCommands } from './commands/datacenter/rolling-upgrades.command.js';
import { DataCenterSamlConfigurationCommands } from './commands/datacenter/saml-configuration.command.js';
import { DataCenterSystemMaintenanceCommands } from './commands/datacenter/system-maintenance.command.js';

/**
 * Command Line Interface for Bitbucket MCP Server
 *
 * Provides direct access to MCP tools through command line
 * for testing, automation, and direct usage scenarios.
 */
export async function runCli(args: string[]): Promise<void> {
  const cliLogger = Logger.forContext('CLI');

  // Handle version command explicitly for Commander v14 compatibility
  // This must be checked before any other processing
  if (args.includes('--version') || args.includes('-V')) {
    console.log(`v${VERSION}`);
    return;
  }

  // Show startup banner
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🖥️  ${PACKAGE_NAME} v${VERSION} - CLI Mode`);
  console.log(`🔧 Command Line Interface`);
  console.log(`${'='.repeat(50)}\n`);

  try {
    // Load configuration
    config.load();

    // Create CLI program
    const program = new Command();

    program
      .name(PACKAGE_NAME)
      .description('Bitbucket MCP Server - Command Line Interface')
      .version(VERSION)
      .option('-d, --debug', 'Enable debug mode')
      .option('-v, --verbose', 'Enable verbose output');

    // Determine Bitbucket type and register appropriate tools
    const bitbucketType = config.getBitbucketType();

    if (bitbucketType === 'cloud') {
      // Cloud commands - ordered by importance (core to advanced)

      // Core Commands (Most Important)
      CloudAuthenticationCommands.register(program);
      CloudRepositoryCommands.register(program);
      CloudPullRequestCommands.register(program);
      CloudCommitCommands.register(program);
      CloudProjectCommands.register(program);
      CloudWorkspaceCommands.register(program);

      // Secondary Commands (Medium Importance)
      CloudUserCommands.register(program);
      CloudSearchCommands.register(program);
      CloudIssueCommands.register(program);
      CloudDiffCommands.register(program);
      CloudPipelineCommands.register(program);
      CloudBranchRestrictionCommands.register(program);

      // Advanced Commands (Least Important)
      CloudWebhookCommands.register(program);
      CloudOAuthCommands.register(program);
      CloudSSHCommands.register(program);
      CloudSourceCommands.register(program);
      CloudRefCommands.register(program);
      CloudSnippetCommands.register(program);
      CloudTokenManagementCommands.register(program);
      CloudScopeValidatorCommands.register(program);
    } else {
      // Data Center commands - ordered by importance (core to advanced)

      // Core Commands (Most Important)
      DataCenterAuthenticationCommands.register(program);
      DataCenterRepositoryCommands.register(program);
      DataCenterPullRequestCommands.register(program);
      DataCenterProjectCommands.register(program);
      DataCenterSearchCommands.register(program);
      DataCenterDashboardCommands.register(program);

      // Secondary Commands (Medium Importance)
      DataCenterSecurityCommands.register(program);
      DataCenterPermissionManagementCommands.register(program);
      DataCenterBuildsCommands.register(program);
      DataCenterCapabilitiesCommands.register(program);
      DataCenterJiraIntegrationCommands.register(program);
      DataCenterSamlConfigurationCommands.register(program);

      // Advanced Commands (Least Important)
      DataCenterMarkupCommands.register(program);
      DataCenterMirroringCommands.register(program);
      DataCenterOtherOperationsCommands.register(program);
      DataCenterRollingUpgradesCommands.register(program);
      DataCenterSystemMaintenanceCommands.register(program);
      DataCenterDeprecatedCommands.register(program);
    }

    // Parse arguments
    program.parse(args);

    // If no command specified, show help
    if (!args.length) {
      program.help();
    }
  } catch (error) {
    cliLogger.error('CLI execution failed:', error);
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
