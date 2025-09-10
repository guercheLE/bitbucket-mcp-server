// Server module - no shebang needed
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Logger } from './utils/logger.util.js';
import { config } from './utils/config.util.js';
import { VERSION, PACKAGE_NAME } from './utils/constants.util.js';
import express, { type Request, type Response } from 'express';
import cors from 'cors';

// Import all tool modules
// Cloud tools
import { CloudPullRequestTools } from './tools/cloud/pull-request.tool.js';
import { CloudCommitTools } from './tools/cloud/commit.tool.js';
import { CloudDiffTools } from './tools/cloud/diff.tool.js';
import { CloudBranchRestrictionTools } from './tools/cloud/branch-restriction.tool.js';
import { CloudRefTools } from './tools/cloud/ref.tool.js';
import { CloudSSHTools } from './tools/cloud/ssh.tool.js';
import { CloudSourceTools } from './tools/cloud/source.tool.js';
import { CloudTokenManagementTools } from './tools/cloud/token-management.tool.js';
import { CloudAuthenticationTools } from './tools/cloud/authentication.tool.js';
import { CloudIssueTools } from './tools/cloud/issue.tool.js';
import { CloudProjectTools } from './tools/cloud/project.tool.js';
import { CloudRepositoryTools } from './tools/cloud/repository.tool.js';
import { CloudUserTools } from './tools/cloud/user.tool.js';
import { CloudWorkspaceTools } from './tools/cloud/workspace.tool.js';
import { CloudWebhookTools } from './tools/cloud/webhook.tool.js';

// Data Center tools
import { DataCenterAuthenticationTools } from './tools/datacenter/authentication.tool.js';
import { DataCenterBuildsTools } from './tools/datacenter/builds.tool.js';
import { DataCenterCapabilitiesTools } from './tools/datacenter/capabilities.tool.js';
import { DataCenterProjectTools } from './tools/datacenter/project.tool.js';
import { DataCenterRepositoryTools } from './tools/datacenter/repository.tool.js';
import { DataCenterPullRequestTools } from './tools/datacenter/pull-request.tool.js';
import { DataCenterDashboardTools } from './tools/datacenter/dashboard.tool.js';
import { DataCenterSearchTools } from './tools/datacenter/search.tool.js';
import { DataCenterSecurityTools } from './tools/datacenter/security.tool.js';
import { DataCenterPermissionManagementTools } from './tools/datacenter/permission-management.tool.js';
import { DataCenterSystemMaintenanceTools } from './tools/datacenter/system-maintenance.tool.js';
import { DataCenterMarkupTools } from './tools/datacenter/markup.tool.js';
import { DataCenterOtherOperationsTools } from './tools/datacenter/other-operations.tool.js';
import { DataCenterDeprecatedTools } from './tools/datacenter/deprecated.tool.js';
import { DataCenterJiraIntegrationTools } from './tools/datacenter/jira-integration.tool.js';
import { DataCenterMirroringTools } from './tools/datacenter/mirroring.tool.js';
import { DataCenterRollingUpgradesTools } from './tools/datacenter/rolling-upgrades.tool.js';
import { DataCenterSamlConfigurationTools } from './tools/datacenter/saml-configuration.tool.js';
import { CloudOAuthTools } from './tools/cloud/oauth.tool.js';
import { CloudPipelineTools } from './tools/cloud/pipeline.tool.js';
import { CloudScopeValidatorTools } from './tools/cloud/scope-validator.tool.js';
import { CloudSearchTools } from './tools/cloud/search.tool.js';
import { CloudSnippetTools } from './tools/cloud/snippet.tool.js';

// Create a contextualized logger for this file
const serverLogger = Logger.forContext('server.ts');

let serverInstance: McpServer | null = null;
let transportInstance: StreamableHTTPServerTransport | StdioServerTransport | null = null;

/**
 * Start the MCP server with the specified transport mode
 *
 * @param mode The transport mode to use (stdio or http)
 * @returns Promise that resolves to the server instance when started successfully
 */
export async function startServer(mode: 'stdio' | 'http' = 'stdio'): Promise<McpServer> {
  // Load configuration
  serverLogger.info('Starting MCP server initialization...');
  config.load();

  // Log initialization at debug level (after config is loaded)
  serverLogger.debug('Bitbucket MCP server module loaded');

  if (config.getBoolean('DEBUG')) {
    serverLogger.debug('Debug mode enabled');
  }

  serverLogger.info(`🚀 Initializing ${PACKAGE_NAME} v${VERSION}`);
  serverLogger.info(`\n${'='.repeat(50)}`);
  serverLogger.info(`🚀 ${PACKAGE_NAME} v${VERSION}`);
  serverLogger.info(`📡 Transport Mode: ${mode.toUpperCase()}`);
  serverLogger.info(`🔧 Debug Mode: ${config.getBoolean('DEBUG') ? 'ON' : 'OFF'}`);
  serverLogger.info(`${'='.repeat(50)}\n`);
  serverInstance = new McpServer({
    name: PACKAGE_NAME,
    version: VERSION,
  });

  // Determine Bitbucket type and register appropriate tools
  const bitbucketType = config.getBitbucketType();
  serverLogger.info(`Detected Bitbucket type: ${bitbucketType}`);
  serverLogger.info('Registering MCP tools...');

  if (bitbucketType === 'cloud') {
    // Cloud tools - registrados seletivamente baseado em variáveis de ambiente
    serverLogger.info('Registering Cloud tools...');

    // Core Tools (Most Important)
    if (config.getBoolean('CLOUD_CORE_AUTH')) {
      serverLogger.debug('Registering CloudAuthenticationTools');
      CloudAuthenticationTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_CORE_REPOSITORY')) {
      serverLogger.debug('Registering CloudRepositoryTools');
      CloudRepositoryTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_CORE_PULL_REQUEST')) {
      serverLogger.debug('Registering CloudPullRequestTools');
      CloudPullRequestTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_CORE_COMMIT')) {
      serverLogger.debug('Registering CloudCommitTools');
      CloudCommitTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_CORE_PROJECT')) {
      serverLogger.debug('Registering CloudProjectTools');
      CloudProjectTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_CORE_WORKSPACE')) {
      serverLogger.debug('Registering CloudWorkspaceTools');
      CloudWorkspaceTools.register(serverInstance);
    }

    // Secondary Tools (Medium Importance)
    if (config.getBoolean('CLOUD_SECONDARY_USER')) {
      serverLogger.debug('Registering CloudUserTools');
      CloudUserTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_SECONDARY_SEARCH')) {
      serverLogger.debug('Registering CloudSearchTools');
      CloudSearchTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_SECONDARY_ISSUE')) {
      serverLogger.debug('Registering CloudIssueTools');
      CloudIssueTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_SECONDARY_DIFF')) {
      serverLogger.debug('Registering CloudDiffTools');
      CloudDiffTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_SECONDARY_PIPELINE')) {
      serverLogger.debug('Registering CloudPipelineTools');
      CloudPipelineTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_SECONDARY_BRANCH_RESTRICTION')) {
      serverLogger.debug('Registering CloudBranchRestrictionTools');
      CloudBranchRestrictionTools.register(serverInstance);
    }

    // Advanced Tools (Least Important)
    if (config.getBoolean('CLOUD_ADVANCED_WEBHOOK')) {
      serverLogger.debug('Registering CloudWebhookTools');
      CloudWebhookTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_ADVANCED_OAUTH')) {
      serverLogger.debug('Registering CloudOAuthTools');
      CloudOAuthTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_ADVANCED_SSH')) {
      serverLogger.debug('Registering CloudSSHTools');
      CloudSSHTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_ADVANCED_SOURCE')) {
      serverLogger.debug('Registering CloudSourceTools');
      CloudSourceTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_ADVANCED_REF')) {
      serverLogger.debug('Registering CloudRefTools');
      CloudRefTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_ADVANCED_SNIPPET')) {
      serverLogger.debug('Registering CloudSnippetTools');
      CloudSnippetTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_ADVANCED_TOKEN_MANAGEMENT')) {
      serverLogger.debug('Registering CloudTokenManagementTools');
      CloudTokenManagementTools.register(serverInstance);
    }
    if (config.getBoolean('CLOUD_ADVANCED_SCOPE_VALIDATOR')) {
      serverLogger.debug('Registering CloudScopeValidatorTools');
      CloudScopeValidatorTools.register(serverInstance);
    }

    serverLogger.info('Cloud MCP tools registered successfully');
  } else {
    // Data Center tools - registrados seletivamente baseado em variáveis de ambiente
    serverLogger.info('Registering Data Center tools...');

    // Core Tools (Most Important)
    if (config.getBoolean('DATACENTER_CORE_AUTH')) {
      serverLogger.debug('Registering DataCenterAuthenticationTools');
      DataCenterAuthenticationTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_CORE_REPOSITORY')) {
      serverLogger.debug('Registering DataCenterRepositoryTools');
      DataCenterRepositoryTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_CORE_PULL_REQUEST')) {
      serverLogger.debug('Registering DataCenterPullRequestTools');
      DataCenterPullRequestTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_CORE_PROJECT')) {
      serverLogger.debug('Registering DataCenterProjectTools');
      DataCenterProjectTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_CORE_SEARCH')) {
      serverLogger.debug('Registering DataCenterSearchTools');
      DataCenterSearchTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_CORE_DASHBOARD')) {
      serverLogger.debug('Registering DataCenterDashboardTools');
      DataCenterDashboardTools.register(serverInstance);
    }

    // Secondary Tools (Medium Importance)
    if (config.getBoolean('DATACENTER_SECONDARY_SECURITY')) {
      serverLogger.debug('Registering DataCenterSecurityTools');
      DataCenterSecurityTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_SECONDARY_PERMISSION_MANAGEMENT')) {
      serverLogger.debug('Registering DataCenterPermissionManagementTools');
      DataCenterPermissionManagementTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_SECONDARY_BUILDS')) {
      serverLogger.debug('Registering DataCenterBuildsTools');
      DataCenterBuildsTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_SECONDARY_CAPABILITIES')) {
      serverLogger.debug('Registering DataCenterCapabilitiesTools');
      DataCenterCapabilitiesTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_SECONDARY_JIRA_INTEGRATION')) {
      serverLogger.debug('Registering DataCenterJiraIntegrationTools');
      DataCenterJiraIntegrationTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_SECONDARY_SAML_CONFIGURATION')) {
      serverLogger.debug('Registering DataCenterSamlConfigurationTools');
      DataCenterSamlConfigurationTools.register(serverInstance);
    }

    // Advanced Tools (Least Important)
    if (config.getBoolean('DATACENTER_ADVANCED_MARKUP')) {
      serverLogger.debug('Registering DataCenterMarkupTools');
      DataCenterMarkupTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_ADVANCED_MIRRORING')) {
      serverLogger.debug('Registering DataCenterMirroringTools');
      DataCenterMirroringTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_ADVANCED_OTHER_OPERATIONS')) {
      serverLogger.debug('Registering DataCenterOtherOperationsTools');
      DataCenterOtherOperationsTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_ADVANCED_ROLLING_UPGRADES')) {
      serverLogger.debug('Registering DataCenterRollingUpgradesTools');
      DataCenterRollingUpgradesTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_ADVANCED_SYSTEM_MAINTENANCE')) {
      serverLogger.debug('Registering DataCenterSystemMaintenanceTools');
      DataCenterSystemMaintenanceTools.register(serverInstance);
    }
    if (config.getBoolean('DATACENTER_ADVANCED_DEPRECATED')) {
      serverLogger.debug('Registering DataCenterDeprecatedTools');
      DataCenterDeprecatedTools.register(serverInstance);
    }

    serverLogger.info('Data Center MCP tools registered successfully');
  }

  if (mode === 'stdio') {
    // STDIO Transport
    serverLogger.info('Using STDIO transport for MCP communication');
    transportInstance = new StdioServerTransport();

    try {
      await serverInstance.connect(transportInstance);
      serverLogger.info('MCP server started successfully on STDIO transport');
      setupGracefulShutdown();
      return serverInstance;
    } catch (err) {
      serverLogger.error('Failed to start server on STDIO transport', err);
      process.exit(1);
    }
  } else {
    // HTTP Transport with Express
    serverLogger.info('Using Streamable HTTP transport for MCP communication');

    const app = express();
    app.use(cors());
    app.use(express.json());

    // Create HTTP transport
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => Math.random().toString(36).substring(2, 15),
    });
    const mcpEndpoint = '/mcp';

    // Register MCP endpoint
    app.all(mcpEndpoint, (req: Request, res: Response) => {
      transport.handleRequest(req, res, req.body).catch(err => {
        serverLogger.error('Error in transport.handleRequest', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Internal Server Error',
          });
        }
      });
    });

    // Health check endpoint
    app.get('/', (_req: Request, res: Response) => {
      res.send(`Bitbucket MCP Server v${VERSION} is running`);
    });

    // Start HTTP server
    const PORT = Number(process.env.PORT ?? 3000);
    await new Promise<void>(resolve => {
      app.listen(PORT, () => {
        serverLogger.info(`HTTP transport listening on http://localhost:${PORT}${mcpEndpoint}`);
        resolve();
      });
    });

    setupGracefulShutdown();
    return serverInstance;
  }
}

/**
 * Set up graceful shutdown handlers for the server
 */
function setupGracefulShutdown() {
  const shutdownLogger = Logger.forContext('server.ts', 'shutdown');

  const shutdown = async () => {
    try {
      shutdownLogger.info('Shutting down gracefully...');

      if (
        transportInstance &&
        'close' in transportInstance &&
        typeof transportInstance.close === 'function'
      ) {
        await transportInstance.close();
      }

      if (serverInstance && typeof serverInstance.close === 'function') {
        await serverInstance.close();
      }

      process.exit(0);
    } catch (err) {
      shutdownLogger.error('Error during shutdown', err);
      process.exit(1);
    }
  };

  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, shutdown);
  });
}
