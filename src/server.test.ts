import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: jest.fn().mockImplementation(() => ({
    handleRequest: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
  })),
}));

// Mock Express
jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    all: jest.fn(),
    get: jest.fn(),
    listen: jest.fn(),
  };
  return jest.fn(() => mockApp);
});

jest.mock('cors', () => jest.fn());

// Mock utilities
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
    getBoolean: jest.fn().mockReturnValue(true),
  },
}));

jest.mock('./utils/constants.util.js', () => ({
  VERSION: '1.0.0',
  PACKAGE_NAME: 'bitbucket-mcp-server',
}));

// Mock all tool modules
jest.mock('./tools/cloud/authentication.tool.js', () => ({
  CloudAuthenticationTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/repository.tool.js', () => ({
  CloudRepositoryTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/pull-request.tool.js', () => ({
  CloudPullRequestTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/commit.tool.js', () => ({
  CloudCommitTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/project.tool.js', () => ({
  CloudProjectTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/workspace.tool.js', () => ({
  CloudWorkspaceTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/user.tool.js', () => ({
  CloudUserTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/search.tool.js', () => ({
  CloudSearchTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/issue.tool.js', () => ({
  CloudIssueTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/diff.tool.js', () => ({
  CloudDiffTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/pipeline.tool.js', () => ({
  CloudPipelineTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/branch-restriction.tool.js', () => ({
  CloudBranchRestrictionTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/webhook.tool.js', () => ({
  CloudWebhookTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/oauth.tool.js', () => ({
  CloudOAuthTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/ssh.tool.js', () => ({
  CloudSSHTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/source.tool.js', () => ({
  CloudSourceTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/ref.tool.js', () => ({
  CloudRefTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/snippet.tool.js', () => ({
  CloudSnippetTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/token-management.tool.js', () => ({
  CloudTokenManagementTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/cloud/scope-validator.tool.js', () => ({
  CloudScopeValidatorTools: {
    register: jest.fn(),
  },
}));

// Mock Data Center tools
jest.mock('./tools/datacenter/authentication.tool.js', () => ({
  DataCenterAuthenticationTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/repository.tool.js', () => ({
  DataCenterRepositoryTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/pull-request.tool.js', () => ({
  DataCenterPullRequestTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/project.tool.js', () => ({
  DataCenterProjectTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/search.tool.js', () => ({
  DataCenterSearchTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/dashboard.tool.js', () => ({
  DataCenterDashboardTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/security.tool.js', () => ({
  DataCenterSecurityTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/permission-management.tool.js', () => ({
  DataCenterPermissionManagementTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/builds.tool.js', () => ({
  DataCenterBuildsTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/capabilities.tool.js', () => ({
  DataCenterCapabilitiesTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/jira-integration.tool.js', () => ({
  DataCenterJiraIntegrationTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/saml-configuration.tool.js', () => ({
  DataCenterSamlConfigurationTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/markup.tool.js', () => ({
  DataCenterMarkupTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/mirroring.tool.js', () => ({
  DataCenterMirroringTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/other-operations.tool.js', () => ({
  DataCenterOtherOperationsTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/rolling-upgrades.tool.js', () => ({
  DataCenterRollingUpgradesTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/system-maintenance.tool.js', () => ({
  DataCenterSystemMaintenanceTools: {
    register: jest.fn(),
  },
}));

jest.mock('./tools/datacenter/deprecated.tool.js', () => ({
  DataCenterDeprecatedTools: {
    register: jest.fn(),
  },
}));

describe('Server', () => {
  let startServer: any;
  let mockMcpServer: any;
  let mockLogger: any;
  let mockConfig: any;
  let mockExpress: any;
  let mockApp: any;

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
      getBoolean: jest.fn().mockReturnValue(true),
    };

    mockMcpServer = {
      connect: jest.fn(),
      close: jest.fn(),
    };

    mockApp = {
      use: jest.fn(),
      all: jest.fn(),
      get: jest.fn(),
      listen: jest.fn(),
    };

    mockExpress = jest.fn(() => mockApp);

    // Mock process methods
    jest.spyOn(process, 'exit').mockImplementation(() => process.exit(0));
    jest.spyOn(process, 'on').mockImplementation(() => process);

    // Mock environment variables
    process.env.PORT = '3000';

    // Import the function after mocking
    const { startServer: startServerFunction } = require('./server');
    startServer = startServerFunction;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.PORT;
  });

  describe('startServer', () => {
    it('should start server in stdio mode', async () => {
      const result = await startServer('stdio');

      expect(mockConfig.load).toHaveBeenCalled();
      expect(mockConfig.getBitbucketType).toHaveBeenCalled();
      expect(mockMcpServer.connect).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should start server in http mode', async () => {
      const result = await startServer('http');

      expect(mockConfig.load).toHaveBeenCalled();
      expect(mockConfig.getBitbucketType).toHaveBeenCalled();
      expect(mockApp.use).toHaveBeenCalled();
      expect(mockApp.all).toHaveBeenCalled();
      expect(mockApp.get).toHaveBeenCalled();
      expect(mockApp.listen).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should register cloud tools when bitbucket type is cloud', async () => {
      mockConfig.getBitbucketType.mockReturnValue('cloud');

      await startServer('stdio');

      // Verify that cloud tools are registered
      const { CloudAuthenticationTools } = require('./tools/cloud/authentication.tool.js');
      const { CloudRepositoryTools } = require('./tools/cloud/repository.tool.js');
      const { CloudPullRequestTools } = require('./tools/cloud/pull-request.tool.js');

      expect(CloudAuthenticationTools.register).toHaveBeenCalled();
      expect(CloudRepositoryTools.register).toHaveBeenCalled();
      expect(CloudPullRequestTools.register).toHaveBeenCalled();
    });

    it('should register datacenter tools when bitbucket type is datacenter', async () => {
      mockConfig.getBitbucketType.mockReturnValue('datacenter');

      await startServer('stdio');

      // Verify that datacenter tools are registered
      const {
        DataCenterAuthenticationTools,
      } = require('./tools/datacenter/authentication.tool.js');
      const { DataCenterRepositoryTools } = require('./tools/datacenter/repository.tool.js');
      const { DataCenterPullRequestTools } = require('./tools/datacenter/pull-request.tool.js');

      expect(DataCenterAuthenticationTools.register).toHaveBeenCalled();
      expect(DataCenterRepositoryTools.register).toHaveBeenCalled();
      expect(DataCenterPullRequestTools.register).toHaveBeenCalled();
    });

    it('should handle stdio transport connection errors', async () => {
      const error = new Error('Connection failed');
      mockMcpServer.connect.mockRejectedValue(error);

      const processExitSpy = jest.spyOn(process, 'exit');

      await startServer('stdio');

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should setup graceful shutdown handlers', async () => {
      const processOnSpy = jest.spyOn(process, 'on');

      await startServer('stdio');

      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });

    it('should use default stdio mode when no mode specified', async () => {
      const result = await startServer();

      expect(mockMcpServer.connect).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should log server initialization', async () => {
      await startServer('stdio');

      expect(mockLogger.info).toHaveBeenCalledWith('Starting MCP server initialization...');
      expect(mockLogger.info).toHaveBeenCalledWith('🚀 Initializing bitbucket-mcp-server v1.0.0');
    });

    it('should log debug information when debug mode is enabled', async () => {
      mockConfig.getBoolean.mockReturnValue(true);

      await startServer('stdio');

      expect(mockLogger.debug).toHaveBeenCalledWith('Bitbucket MCP server module loaded');
      expect(mockLogger.debug).toHaveBeenCalledWith('Debug mode enabled');
    });

    it('should handle http transport with custom port', async () => {
      process.env.PORT = '8080';

      await startServer('http');

      expect(mockApp.listen).toHaveBeenCalledWith(8080, expect.any(Function));
    });

    it('should handle http transport with default port', async () => {
      delete process.env.PORT;

      await startServer('http');

      expect(mockApp.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    });
  });

  describe('graceful shutdown', () => {
    it('should handle SIGINT signal', async () => {
      const processOnSpy = jest.spyOn(process, 'on');

      await startServer('stdio');

      const sigintHandler = processOnSpy.mock.calls.find(call => call[0] === 'SIGINT')?.[1];

      // Simulate SIGINT
      if (sigintHandler) {
        await sigintHandler();
      }

      expect(mockMcpServer.close).toHaveBeenCalled();
    });

    it('should handle SIGTERM signal', async () => {
      const processOnSpy = jest.spyOn(process, 'on');

      await startServer('stdio');

      const sigtermHandler = processOnSpy.mock.calls.find(call => call[0] === 'SIGTERM')?.[1];

      // Simulate SIGTERM
      if (sigtermHandler) {
        await sigtermHandler();
      }

      expect(mockMcpServer.close).toHaveBeenCalled();
    });

    it('should handle shutdown errors gracefully', async () => {
      const error = new Error('Shutdown error');
      mockMcpServer.close.mockRejectedValue(error);

      const processOnSpy = jest.spyOn(process, 'on');
      const processExitSpy = jest.spyOn(process, 'exit');

      await startServer('stdio');

      const sigintHandler = processOnSpy.mock.calls.find(call => call[0] === 'SIGINT')?.[1];

      // Simulate SIGINT with error
      if (sigintHandler) {
        await sigintHandler();
      }

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
