import { BitbucketMCPServer } from './mcp-server';
import { loggerService } from '@/services/logger.service';
import { configService } from '@/services/config.service';

export class ServerManager {
  private server: BitbucketMCPServer | null = null;
  private logger = loggerService.getLogger('server-manager');
  private isRunning = false;

  constructor() {
    this.setupGracefulShutdown();
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Server is already running');
      return;
    }

    try {
      this.logger.info('Initializing Bitbucket MCP Server Manager');

      // Initialize configuration
      await this.initializeConfiguration();

      // Create and start server
      this.server = new BitbucketMCPServer();
      await this.server.start();

      this.isRunning = true;

      this.logger.info('Server Manager started successfully', {
        toolCount: this.server.getToolCount(),
      });
    } catch (error) {
      this.logger.error('Failed to start Server Manager', {
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
      this.logger.info('Stopping Server Manager');

      await this.server.stop();
      this.server = null;
      this.isRunning = false;

      this.logger.info('Server Manager stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop Server Manager', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async restart(): Promise<void> {
    this.logger.info('Restarting Server Manager');

    await this.stop();
    await this.start();
  }

  public getStatus(): {
    isRunning: boolean;
    toolCount: number;
    tools: any[];
  } {
    return {
      isRunning: this.isRunning,
      toolCount: this.server?.getToolCount() || 0,
      tools: this.server?.getTools() || [],
    };
  }

  public getToolsByCategory(category: string): any[] {
    return this.server?.getToolsByCategory(category) || [];
  }

  public getToolsByOperation(operation: string): any[] {
    return this.server?.getToolsByOperation(operation) || [];
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
