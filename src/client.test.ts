import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock dependencies
jest.mock('commander', () => ({
  Command: jest.fn().mockImplementation(() => ({
    name: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    version: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    parse: jest.fn(),
    help: jest.fn(),
  })),
}));

jest.mock('./utils/logger.util.js', () => ({
  Logger: {
    forContext: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    }),
  },
}));

jest.mock('./utils/config.util.js', () => ({
  config: {
    load: jest.fn(),
    getBitbucketType: jest.fn().mockReturnValue('cloud'),
    getBoolean: jest.fn().mockReturnValue(false),
  },
}));

jest.mock('./utils/constants.util.js', () => ({
  VERSION: '1.0.0',
  PACKAGE_NAME: 'bitbucket-mcp-server',
}));

// Mock all command modules
jest.mock('./commands/cloud/authentication.command.js', () => ({
  CloudAuthenticationCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/repository.command.js', () => ({
  CloudRepositoryCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/pull-request.command.js', () => ({
  CloudPullRequestCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/commit.command.js', () => ({
  CloudCommitCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/project.command.js', () => ({
  CloudProjectCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/workspace.command.js', () => ({
  CloudWorkspaceCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/user.command.js', () => ({
  CloudUserCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/search.command.js', () => ({
  CloudSearchCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/issue.command.js', () => ({
  CloudIssueCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/diff.command.js', () => ({
  DiffCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/pipeline.command.js', () => ({
  CloudPipelineCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/branch-restriction.command.js', () => ({
  CloudBranchRestrictionCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/webhook.command.js', () => ({
  CloudWebhookCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/oauth.command.js', () => ({
  CloudOAuthCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/ssh.command.js', () => ({
  CloudSSHCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/source.command.js', () => ({
  CloudSourceCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/ref.command.js', () => ({
  CloudRefCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/snippet.command.js', () => ({
  CloudSnippetCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/token-management.command.js', () => ({
  CloudTokenManagementCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/cloud/scope-validator.command.js', () => ({
  CloudScopeValidatorCommands: {
    register: jest.fn(),
  },
}));

// Mock Data Center commands
jest.mock('./commands/datacenter/authentication.command.js', () => ({
  DataCenterAuthenticationCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/repository.command.js', () => ({
  DataCenterRepositoryCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/pull-request.command.js', () => ({
  DataCenterPullRequestCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/project.command.js', () => ({
  DataCenterProjectCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/search.command.js', () => ({
  DataCenterSearchCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/dashboard.command.js', () => ({
  DataCenterDashboardCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/security.command.js', () => ({
  DataCenterSecurityCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/permission-management.command.js', () => ({
  DataCenterPermissionManagementCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/builds.command.js', () => ({
  DataCenterBuildsCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/capabilities.command.js', () => ({
  DataCenterCapabilitiesCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/jira-integration.command.js', () => ({
  DataCenterJiraIntegrationCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/saml-configuration.command.js', () => ({
  DataCenterSamlConfigurationCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/markup.command.js', () => ({
  DataCenterMarkupCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/mirroring.command.js', () => ({
  DataCenterMirroringCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/other-operations.command.js', () => ({
  DataCenterOtherOperationsCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/rolling-upgrades.command.js', () => ({
  DataCenterRollingUpgradesCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/system-maintenance.command.js', () => ({
  DataCenterSystemMaintenanceCommands: {
    register: jest.fn(),
  },
}));

jest.mock('./commands/datacenter/deprecated.command.js', () => ({
  DataCenterDeprecatedCommands: {
    register: jest.fn(),
  },
}));

describe('Client CLI', () => {
  let runCli: any;
  let mockLogger: any;
  let mockConfig: any;
  let mockCommand: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    };

    mockConfig = {
      load: jest.fn(),
      getBitbucketType: jest.fn().mockReturnValue('cloud'),
      getBoolean: jest.fn().mockReturnValue(false),
    };

    mockCommand = {
      name: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      version: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      parse: jest.fn(),
      help: jest.fn(),
    };

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => process.exit(0));

    // Import the function after mocking
    const { runCli: runCliFunction } = require('./client');
    runCli = runCliFunction;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('runCli', () => {
    it('should handle version command', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      await runCli(['--version']);

      expect(consoleSpy).toHaveBeenCalledWith('v1.0.0');
    });

    it('should handle short version command', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      await runCli(['-V']);

      expect(consoleSpy).toHaveBeenCalledWith('v1.0.0');
    });

    it('should show startup banner for non-version commands', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      await runCli(['help']);

      expect(consoleSpy).toHaveBeenCalledWith(
        '\n=================================================='
      );
      expect(consoleSpy).toHaveBeenCalledWith('🖥️  bitbucket-mcp-server v1.0.0 - CLI Mode');
      expect(consoleSpy).toHaveBeenCalledWith('🔧 Command Line Interface');
      expect(consoleSpy).toHaveBeenCalledWith(
        '==================================================\n'
      );
    });

    it('should load configuration', async () => {
      await runCli(['help']);

      expect(mockConfig.load).toHaveBeenCalled();
    });

    it('should register cloud commands when bitbucket type is cloud', async () => {
      mockConfig.getBitbucketType.mockReturnValue('cloud');

      await runCli(['help']);

      // Verify that cloud commands are registered
      const { CloudAuthenticationCommands } = require('./commands/cloud/authentication.command.js');
      const { CloudRepositoryCommands } = require('./commands/cloud/repository.command.js');
      const { CloudPullRequestCommands } = require('./commands/cloud/pull-request.command.js');

      expect(CloudAuthenticationCommands.register).toHaveBeenCalled();
      expect(CloudRepositoryCommands.register).toHaveBeenCalled();
      expect(CloudPullRequestCommands.register).toHaveBeenCalled();
    });

    it('should register datacenter commands when bitbucket type is datacenter', async () => {
      mockConfig.getBitbucketType.mockReturnValue('datacenter');

      await runCli(['help']);

      // Verify that datacenter commands are registered
      const {
        DataCenterAuthenticationCommands,
      } = require('./commands/datacenter/authentication.command.js');
      const {
        DataCenterRepositoryCommands,
      } = require('./commands/datacenter/repository.command.js');
      const {
        DataCenterPullRequestCommands,
      } = require('./commands/datacenter/pull-request.command.js');

      expect(DataCenterAuthenticationCommands.register).toHaveBeenCalled();
      expect(DataCenterRepositoryCommands.register).toHaveBeenCalled();
      expect(DataCenterPullRequestCommands.register).toHaveBeenCalled();
    });

    it('should show help when no arguments provided', async () => {
      await runCli([]);

      expect(mockCommand.help).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Test error');
      mockConfig.load.mockImplementation(() => {
        throw error;
      });

      const consoleErrorSpy = jest.spyOn(console, 'error');
      const processExitSpy = jest.spyOn(process, 'exit');

      await runCli(['help']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', 'Test error');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle unknown errors', async () => {
      mockConfig.load.mockImplementation(() => {
        throw 'Unknown error';
      });

      const consoleErrorSpy = jest.spyOn(console, 'error');
      const processExitSpy = jest.spyOn(process, 'exit');

      await runCli(['help']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', 'Unknown error');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should parse command arguments', async () => {
      const args = ['help', '--debug'];

      await runCli(args);

      expect(mockCommand.parse).toHaveBeenCalledWith(args);
    });
  });
});
