import { EnhancedBitbucketMCPServer } from './enhanced-mcp-server';
import { loggerService } from '@/services/logger.service';
import { configService } from '@/services/config.service';
import { BitbucketConfig } from '@/types/config';

export class EnhancedServerManager {
  private server: EnhancedBitbucketMCPServer | null = null;
  private logger = loggerService.getLogger('enhanced-server-manager');
  private isRunning = false;
  private currentConfig: BitbucketConfig | null = null;

  constructor() {
    this.setupGracefulShutdown();
  }

  public async start(config?: BitbucketConfig): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Server is already running');
      return;
    }

    try {
      this.logger.info('Initializing Enhanced Bitbucket MCP Server Manager');

      // Initialize configuration
      await this.initializeConfiguration();

      // Create and start server
      this.server = new EnhancedBitbucketMCPServer();
      await this.server.start();

      // Load tools if config is provided
      if (config) {
        await this.loadToolsForConfig(config);
      }

      this.isRunning = true;

      this.logger.info('Enhanced Server Manager started successfully', {
        toolCount: this.server.getToolCount(),
        hasConfig: !!config,
      });
    } catch (error) {
      this.logger.error('Failed to start Enhanced Server Manager', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      this.logger.warn('Server is not running');
      return;
    }

    try {
      this.logger.info('Stopping Enhanced Server Manager');

      await this.server.stop();
      this.server = null;
      this.isRunning = false;
      this.currentConfig = null;

      this.logger.info('Enhanced Server Manager stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop Enhanced Server Manager', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async restart(config?: BitbucketConfig): Promise<void> {
    this.logger.info('Restarting Enhanced Server Manager');

    await this.stop();
    await this.start(config);
  }

  public async loadToolsForConfig(config: BitbucketConfig): Promise<void> {
    if (!this.server) {
      throw new Error('Server is not running');
    }

    this.logger.info('Loading tools for configuration', {
      serverUrl: config.baseUrl,
      serverType: config.serverType,
    });

    await this.server.loadToolsForServer(config);
    this.currentConfig = config;

    this.logger.info('Tools loaded for configuration', {
      toolCount: this.server.getToolCount(),
    });
  }

  public getStatus(): {
    isRunning: boolean;
    toolCount: number;
    tools: any[];
    health: any;
    metrics: any;
    config: BitbucketConfig | null;
  } {
    return {
      isRunning: this.isRunning,
      toolCount: this.server?.getToolCount() || 0,
      tools: this.server?.getTools() || [],
      health: null, // Will be populated by health check
      metrics: this.server?.getMetrics() || null,
      config: this.currentConfig,
    };
  }

  public async getHealthStatus(): Promise<any> {
    if (!this.server) {
      return {
        status: 'unhealthy',
        message: 'Server is not running',
      };
    }

    return await this.server.getHealthStatus();
  }

  public getMetrics(): any {
    return this.server?.getMetrics() || null;
  }

  public getToolsByCategory(category: string): any[] {
    return this.server?.getToolsByCategory(category) || [];
  }

  public getToolsByOperation(operation: string): any[] {
    return this.server?.getToolsByOperation(operation) || [];
  }

  public getToolsByServerType(): Record<string, number> {
    return this.server?.getToolsByServerType() || {};
  }

  public getRateLimitInfo(key: string = 'default'): any {
    return this.server?.getRateLimitInfo(key) || null;
  }

  public resetMetrics(): void {
    this.server?.resetMetrics();
    this.logger.info('Metrics reset');
  }

  public resetRateLimits(key?: string): void {
    this.server?.resetRateLimits(key);
    this.logger.info('Rate limits reset', { key });
  }

  public updateRateLimitConfig(config: any): void {
    this.server?.updateRateLimitConfig(config);
    this.logger.info('Rate limit config updated', { config });
  }

  private async initializeConfiguration(): Promise<void> {
    this.logger.info('Initializing configuration');

    // Load environment variables
    const config = configService.getConfig();

    this.logger.info('Configuration loaded', {
      logLevel: 'info', // Default log level
      timeout: config.timeouts.read,
      rateLimit: config.rateLimit.requestsPerMinute,
    });
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach(signal => {
      process.on(signal, async () => {
        this.logger.info(`Received ${signal}, shutting down gracefully`);

        try {
          await this.stop();
          process.exit(0);
        } catch (error) {
          this.logger.error('Error during graceful shutdown', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          process.exit(1);
        }
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      this.logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });

      this.stop().finally(() => {
        process.exit(1);
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled promise rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: promise.toString(),
      });

      this.stop().finally(() => {
        process.exit(1);
      });
    });
  }
}
