import { MCPTool } from '@/types/mcp';
import { loggerService } from '@/services/logger.service';
import { serverTypeDetectorService } from '@/services/server-type-detector.service';
import { BitbucketConfig } from '@/types/config';

export class SelectiveToolLoader {
  private logger = loggerService.getLogger('selective-loader');
  // private _availableTools: Map<string, MCPTool> = new Map();
  private loadedTools: Map<string, MCPTool> = new Map();

  constructor() {
    this.initializeAvailableTools();
  }

  private initializeAvailableTools(): void {
    // This would be populated with all available tools
    // For now, we'll use a placeholder approach
    this.logger.info('Initializing available tools registry');
  }

  public async loadToolsForServer(config: BitbucketConfig): Promise<MCPTool[]> {
    const startTime = Date.now();

    try {
      this.logger.info('Loading tools for server', {
        serverUrl: config.baseUrl,
        serverType: config.serverType,
      });

      // Detect server type if not specified
      let serverType = config.serverType;
      if (!serverType) {
        const detection = await serverTypeDetectorService.detectServerType(config.baseUrl);
        serverType = detection.serverType || 'cloud';
        this.logger.info('Detected server type', { serverType });
      }

      // Load tools based on server type
      const tools = await this.loadToolsByServerType(serverType);

      const duration = Date.now() - startTime;

      this.logger.info('Tools loaded successfully', {
        serverType,
        toolCount: tools.length,
        duration,
      });

      return tools;
    } catch (error) {
      this.logger.error('Failed to load tools for server', {
        error: error instanceof Error ? error.message : 'Unknown error',
        serverUrl: config.baseUrl,
      });
      throw error;
    }
  }

  private async loadToolsByServerType(serverType: 'cloud' | 'datacenter'): Promise<MCPTool[]> {
    const tools: MCPTool[] = [];

    if (serverType === 'cloud') {
      tools.push(...(await this.getCloudTools()));
    } else if (serverType === 'datacenter') {
      tools.push(...(await this.getDataCenterTools()));
    }

    // Mark tools as loaded
    tools.forEach(tool => {
      this.loadedTools.set(tool.name, tool);
    });

    return tools;
  }

  private async getCloudTools(): Promise<MCPTool[]> {
    // Import Cloud tools dynamically
    const cloudTools: MCPTool[] = [];

    try {
      // Authentication tools
      const { authenticateTool } = await import('@/tools/cloud/auth/authentication.tool');
      const { getCurrentUserTool } = await import('@/tools/cloud/auth/get-current-user.tool');

      // Repository tools
      const { listRepositoriesTool, getRepositoryTool, createRepositoryTool } = await import(
        '@/tools/cloud/repository/repository-management.tool'
      );

      cloudTools.push(
        authenticateTool,
        getCurrentUserTool,
        listRepositoriesTool,
        getRepositoryTool,
        createRepositoryTool
      );

      this.logger.debug('Loaded Cloud tools', {
        count: cloudTools.length,
        tools: cloudTools.map(t => t.name),
      });
    } catch (error) {
      this.logger.error('Failed to load Cloud tools', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return cloudTools;
  }

  private async getDataCenterTools(): Promise<MCPTool[]> {
    // Import Data Center tools dynamically
    const datacenterTools: MCPTool[] = [];

    try {
      // Authentication tools
      const { authenticateTool } = await import('@/tools/datacenter/auth/authentication.tool');

      // Repository tools
      const {
        listRepositoriesTool,
        getRepositoryTool,
        createRepositoryTool,
        updateRepositoryTool,
        deleteRepositoryTool,
      } = await import('@/tools/datacenter/repository/repository-management.tool');

      // Project tools
      const { listProjectsTool, getProjectTool, createProjectTool } = await import(
        '@/tools/datacenter/project/project-management.tool'
      );
      const { getProjectPermissionsTool, addProjectPermissionTool, removeProjectPermissionTool } =
        await import('@/tools/datacenter/project/project-permissions.tool');
      const { getProjectSettingsTool, updateProjectSettingsTool } = await import(
        '@/tools/datacenter/project/project-settings.tool'
      );
      const {
        getProjectHooksTool,
        createProjectHookTool,
        getProjectHookTool,
        updateProjectHookTool,
        deleteProjectHookTool,
      } = await import('@/tools/datacenter/project/project-hooks.tool');
      const { getProjectAvatarTool, uploadProjectAvatarTool, deleteProjectAvatarTool } =
        await import('@/tools/datacenter/project/project-avatar.tool');
      const { updateProjectTool, deleteProjectTool } = await import(
        '@/tools/datacenter/project/project-update.tool'
      );
      const { listProjectRepositoriesTool } = await import(
        '@/tools/datacenter/project/project-repositories.tool'
      );
      const { listProjectGroupsTool, addProjectGroupTool, removeProjectGroupTool } = await import(
        '@/tools/datacenter/project/project-groups.tool'
      );
      const { listProjectUsersTool, addProjectUserTool, removeProjectUserTool } = await import(
        '@/tools/datacenter/project/project-users.tool'
      );

      datacenterTools.push(
        authenticateTool,
        listRepositoriesTool,
        getRepositoryTool,
        createRepositoryTool,
        updateRepositoryTool,
        deleteRepositoryTool,
        listProjectsTool,
        getProjectTool,
        createProjectTool,
        getProjectPermissionsTool,
        addProjectPermissionTool,
        removeProjectPermissionTool,
        getProjectSettingsTool,
        updateProjectSettingsTool,
        getProjectHooksTool,
        createProjectHookTool,
        getProjectHookTool,
        updateProjectHookTool,
        deleteProjectHookTool,
        getProjectAvatarTool,
        uploadProjectAvatarTool,
        deleteProjectAvatarTool,
        updateProjectTool,
        deleteProjectTool,
        listProjectRepositoriesTool,
        listProjectGroupsTool,
        addProjectGroupTool,
        removeProjectGroupTool,
        listProjectUsersTool,
        addProjectUserTool,
        removeProjectUserTool
      );

      this.logger.debug('Loaded Data Center tools', {
        count: datacenterTools.length,
        tools: datacenterTools.map(t => t.name),
      });
    } catch (error) {
      this.logger.error('Failed to load Data Center tools', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return datacenterTools;
  }

  public getLoadedTools(): MCPTool[] {
    return Array.from(this.loadedTools.values());
  }

  public getLoadedToolsByCategory(category: string): MCPTool[] {
    return Array.from(this.loadedTools.values()).filter(tool => tool.category === category);
  }

  public getLoadedToolsByOperation(operation: string): MCPTool[] {
    return Array.from(this.loadedTools.values()).filter(tool => tool.operation === operation);
  }

  public getLoadedToolsByServerType(serverType: 'cloud' | 'datacenter'): MCPTool[] {
    return Array.from(this.loadedTools.values()).filter(tool =>
      tool.serverType.includes(serverType)
    );
  }

  public clearLoadedTools(): void {
    this.logger.info('Clearing loaded tools');
    this.loadedTools.clear();
  }

  public getToolCount(): number {
    return this.loadedTools.size;
  }

  public isToolLoaded(toolName: string): boolean {
    return this.loadedTools.has(toolName);
  }

  public getTool(toolName: string): MCPTool | undefined {
    return this.loadedTools.get(toolName);
  }
}
