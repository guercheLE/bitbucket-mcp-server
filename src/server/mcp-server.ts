import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { MCPTool } from '@/types/mcp';
import { loggerService } from '@/services/logger.service';
import { createToolError } from '@/services/error-handler.service';

// Import Cloud Tools
import { authenticateTool as cloudAuthTool } from '@/tools/cloud/auth/authentication.tool';
import { getCurrentUserTool as cloudGetCurrentUserTool } from '@/tools/cloud/auth/get-current-user.tool';
import {
  listRepositoriesTool as cloudListReposTool,
  getRepositoryTool as cloudGetRepoTool,
  createRepositoryTool as cloudCreateRepoTool,
} from '@/tools/cloud/repository/repository-management.tool';

// Import Data Center Tools
import { authenticateTool as datacenterAuthTool } from '@/tools/datacenter/auth/authentication.tool';
// import { getCurrentUserTool as datacenterGetCurrentUserTool } from '@/tools/datacenter/auth/get-current-user.tool';
import {
  listRepositoriesTool as datacenterListReposTool,
  getRepositoryTool as datacenterGetRepoTool,
  createRepositoryTool as datacenterCreateRepoTool,
} from '@/tools/datacenter/repository/repository-management.tool';
import { listProjectsTool as datacenterListProjectsTool } from '@/tools/datacenter/project/project-management.tool';
import { getProjectPermissionsTool as datacenterGetProjectPermissionsTool } from '@/tools/datacenter/project/project-permissions.tool';
import { getProjectSettingsTool as datacenterGetProjectSettingsTool } from '@/tools/datacenter/project/project-settings.tool';
import { getProjectHooksTool as datacenterGetProjectHooksTool } from '@/tools/datacenter/project/project-hooks.tool';
import { getProjectAvatarTool as datacenterGetProjectAvatarTool } from '@/tools/datacenter/project/project-avatar.tool';
import { updateProjectTool as datacenterUpdateProjectTool } from '@/tools/datacenter/project/project-update.tool';
import { listProjectRepositoriesTool as datacenterListProjectReposTool } from '@/tools/datacenter/project/project-repositories.tool';
import { listProjectGroupsTool as datacenterListProjectGroupsTool } from '@/tools/datacenter/project/project-groups.tool';
import { listProjectUsersTool as datacenterListProjectUsersTool } from '@/tools/datacenter/project/project-users.tool';

export class BitbucketMCPServer {
  private server: Server;
  private tools: Map<string, MCPTool> = new Map();
  private logger = loggerService.getLogger('mcp-server');

  constructor() {
    this.server = new Server({
      name: 'bitbucket-mcp-server',
      version: '1.0.0',
    });

    this.setupHandlers();
    this.loadTools();
  }

  private setupHandlers(): void {
    // List Tools Handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.info('Listing available tools', {
        toolCount: this.tools.size,
      });

      const tools: Tool[] = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      return { tools };
    });

    // Call Tool Handler
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      this.logger.info('Tool called', {
        toolName: name,
        hasArgs: !!args,
      });

      const tool = this.tools.get(name);
      if (!tool) {
        const error = createToolError('mcp-server', 'call', new Error(`Tool not found: ${name}`), {
          name,
          args,
        });

        this.logger.error('Tool not found', {
          toolName: name,
          error: error.message,
        });

        throw new Error(`Tool not found: ${name}`);
      }

      try {
        const result = await tool.handler(args || {});

        this.logger.info('Tool executed successfully', {
          toolName: name,
          isError: result.isError,
        });

        return result;
      } catch (error) {
        const toolError = createToolError('mcp-server', 'call', error, { name, args });

        this.logger.error('Tool execution failed', {
          toolName: name,
          error: toolError.message,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: toolError.code,
                    message: toolError.message,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  private loadTools(): void {
    this.logger.info('Loading MCP tools');

    // Load Cloud Tools
    this.loadCloudTools();

    // Load Data Center Tools
    this.loadDataCenterTools();

    this.logger.info('Tools loaded successfully', {
      totalTools: this.tools.size,
      cloudTools: this.getToolsByServerType('cloud').length,
      datacenterTools: this.getToolsByServerType('datacenter').length,
    });
  }

  private loadCloudTools(): void {
    const cloudTools: MCPTool[] = [
      cloudAuthTool,
      cloudGetCurrentUserTool,
      cloudListReposTool,
      cloudGetRepoTool,
      cloudCreateRepoTool,
    ];

    cloudTools.forEach(tool => {
      this.tools.set(tool.name, tool);
      this.logger.debug('Loaded Cloud tool', { toolName: tool.name });
    });
  }

  private loadDataCenterTools(): void {
    const datacenterTools: MCPTool[] = [
      datacenterAuthTool,
      // datacenterGetCurrentUserTool, // Commented out - tool doesn't exist
      datacenterListReposTool,
      datacenterGetRepoTool,
      datacenterCreateRepoTool,
      datacenterListProjectsTool,
      datacenterGetProjectPermissionsTool,
      datacenterGetProjectSettingsTool,
      datacenterGetProjectHooksTool,
      datacenterGetProjectAvatarTool,
      datacenterUpdateProjectTool,
      datacenterListProjectReposTool,
      datacenterListProjectGroupsTool,
      datacenterListProjectUsersTool,
    ];

    datacenterTools.forEach(tool => {
      this.tools.set(tool.name, tool);
      this.logger.debug('Loaded Data Center tool', { toolName: tool.name });
    });
  }

  private getToolsByServerType(serverType: 'cloud' | 'datacenter'): MCPTool[] {
    return Array.from(this.tools.values()).filter(tool => tool.serverType.includes(serverType));
  }

  public async start(): Promise<void> {
    this.logger.info('Starting Bitbucket MCP Server');

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.logger.info('Bitbucket MCP Server started successfully');
  }

  public async stop(): Promise<void> {
    this.logger.info('Stopping Bitbucket MCP Server');

    // Cleanup resources if needed
    this.tools.clear();

    this.logger.info('Bitbucket MCP Server stopped');
  }

  public getToolCount(): number {
    return this.tools.size;
  }

  public getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  public getToolsByCategory(category: string): MCPTool[] {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  public getToolsByOperation(operation: string): MCPTool[] {
    return Array.from(this.tools.values()).filter(tool => tool.operation === operation);
  }
}
