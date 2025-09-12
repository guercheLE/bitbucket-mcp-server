import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { MCPTool } from '@/types/mcp';
import { loggerService } from '@/services/logger.service';
import { SelectiveToolLoader } from './selective-loader';
import { HealthChecker, HealthStatus } from './health-check';
import { MetricsCollector } from './metrics';
import { RateLimiter } from './rate-limiter';
import { MiddlewareManager } from './middleware';
import { createToolError } from '@/services/error-handler.service';
import { v4 as uuidv4 } from 'uuid';

export class EnhancedBitbucketMCPServer {
  private server: Server;
  private toolLoader: SelectiveToolLoader;
  private healthChecker: HealthChecker;
  private metricsCollector: MetricsCollector;
  private rateLimiter: RateLimiter;
  private middlewareManager: MiddlewareManager;
  private logger = loggerService.getLogger('enhanced-mcp-server');
  private isRunning = false;

  constructor() {
    this.server = new Server({
      name: 'bitbucket-mcp-server',
      version: '1.0.0',
    });

    // Initialize components
    this.toolLoader = new SelectiveToolLoader();
    this.healthChecker = new HealthChecker();
    this.metricsCollector = new MetricsCollector();
    this.rateLimiter = new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
    });
    this.middlewareManager = new MiddlewareManager(this.metricsCollector, this.rateLimiter);

    this.setupHandlers();
    this.setupPeriodicTasks();
  }

  private setupHandlers(): void {
    // List Tools Handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.info('Listing available tools', {
        toolCount: this.toolLoader.getToolCount(),
      });

      const tools: Tool[] = this.toolLoader.getLoadedTools().map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      return { tools };
    });

    // Call Tool Handler with middleware
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;
      const requestId = uuidv4();
      const startTime = Date.now();

      this.logger.info('Tool called', {
        toolName: name,
        requestId,
        hasArgs: !!args,
      });

      const tool = this.toolLoader.getTool(name);
      if (!tool) {
        const error = createToolError(
          'enhanced-mcp-server',
          'call',
          new Error(`Tool not found: ${name}`),
          { name, args }
        );

        this.logger.error('Tool not found', {
          toolName: name,
          requestId,
          error: error.message,
        });

        throw new Error(`Tool not found: ${name}`);
      }

      const context = {
        toolName: name,
        startTime,
        requestId,
        userId: (args?.['username'] as string) || 'anonymous',
        serverType: (args?.['serverType'] as string) || 'unknown',
      };

      try {
        const result = await this.middlewareManager.executeMiddleware(context, async () => {
          return await tool.handler(args || {});
        });

        if (result && typeof result === 'object' && 'success' in result) {
          if (result.success) {
            this.logger.info('Tool executed successfully', {
              toolName: name,
              requestId,
              duration: (result as any).duration,
            });
          } else {
            this.logger.warn('Tool execution failed', {
              toolName: name,
              requestId,
              error: (result as any).error,
              duration: (result as any).duration,
            });
          }
        }

        return result as any;
      } catch (error) {
        const toolError = createToolError('enhanced-mcp-server', 'call', error, { name, args });

        this.logger.error('Tool execution failed', {
          toolName: name,
          requestId,
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

  private setupPeriodicTasks(): void {
    // Health check every 30 seconds
    setInterval(async () => {
      try {
        const health = await this.getHealthStatus();
        if (health.status !== 'healthy') {
          this.logger.warn('Health check failed', { status: health.status });
        }
      } catch (error) {
        this.logger.error('Health check error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, 30 * 1000);

    // Metrics cleanup every 5 minutes
    setInterval(
      () => {
        this.rateLimiter.cleanup();
      },
      5 * 60 * 1000
    );
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Server is already running');
      return;
    }

    this.logger.info('Starting Enhanced Bitbucket MCP Server');

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.isRunning = true;

    this.logger.info('Enhanced Bitbucket MCP Server started successfully', {
      toolCount: this.toolLoader.getToolCount(),
    });
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Server is not running');
      return;
    }

    this.logger.info('Stopping Enhanced Bitbucket MCP Server');

    this.toolLoader.clearLoadedTools();
    this.isRunning = false;

    this.logger.info('Enhanced Bitbucket MCP Server stopped');
  }

  public async loadToolsForServer(config: any): Promise<void> {
    this.logger.info('Loading tools for server', {
      serverUrl: config.baseUrl,
      serverType: config.serverType,
    });

    await this.toolLoader.loadToolsForServer(config);

    this.logger.info('Tools loaded successfully', {
      toolCount: this.toolLoader.getToolCount(),
    });
  }

  public async getHealthStatus(): Promise<HealthStatus> {
    const toolsByCategory = this.getToolsByCategoryCount();
    const toolsByServerType = this.getToolsByServerType();

    return await this.healthChecker.checkHealth(
      this.toolLoader.getToolCount(),
      toolsByCategory,
      toolsByServerType
    );
  }

  public getMetrics(): any {
    return this.metricsCollector.getMetrics();
  }

  public getToolCount(): number {
    return this.toolLoader.getToolCount();
  }

  public getTools(): MCPTool[] {
    return this.toolLoader.getLoadedTools();
  }

  public getToolsByCategoryCount(): Record<string, number> {
    const tools = this.toolLoader.getLoadedTools();
    const categories: Record<string, number> = {};

    tools.forEach(tool => {
      categories[tool.category] = (categories[tool.category] || 0) + 1;
    });

    return categories;
  }

  public getToolsByServerType(): Record<string, number> {
    const tools = this.toolLoader.getLoadedTools();
    const serverTypes: Record<string, number> = {};

    tools.forEach(tool => {
      tool.serverType.forEach(type => {
        serverTypes[type] = (serverTypes[type] || 0) + 1;
      });
    });

    return serverTypes;
  }

  public getToolsByCategory(category: string): MCPTool[] {
    return this.toolLoader.getLoadedToolsByCategory(category);
  }

  public getToolsByOperation(operation: string): MCPTool[] {
    return this.toolLoader.getLoadedToolsByOperation(operation);
  }

  public getRateLimitInfo(key: string = 'default'): any {
    return this.rateLimiter.getInfo(key);
  }

  public resetMetrics(): void {
    this.middlewareManager.resetMetrics();
  }

  public resetRateLimits(key?: string): void {
    this.middlewareManager.resetRateLimits(key);
  }

  public updateRateLimitConfig(config: any): void {
    this.middlewareManager.updateRateLimitConfig(config);
  }
}
