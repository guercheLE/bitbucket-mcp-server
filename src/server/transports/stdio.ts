/**
 * STDIO Transport Implementation
 * Standard input/output transport for MCP server
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TransportType, TransportConfig } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class StdioTransport {
  private transport: StdioServerTransport;
  private config: TransportConfig;

  constructor(config: TransportConfig = {}) {
    this.config = {
      timeout: 30000,
      ...config,
    };
    this.transport = new StdioServerTransport();
  }

  public async initialize(_server: Server): Promise<void> {
    try {
      logger.info('Initializing STDIO transport', {
        transport: 'stdio',
        timeout: this.config.timeout,
      });

      await this.transport.start();
      
      logger.info('STDIO transport initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize STDIO transport', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transport: 'stdio',
      });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down STDIO transport');
      // STDIO transport doesn't have explicit shutdown method
      logger.info('STDIO transport shutdown completed');
    } catch (error) {
      logger.error('Error during STDIO transport shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transport: 'stdio',
      });
      throw error;
    }
  }

  public getType(): TransportType {
    return 'stdio';
  }

  public getConfig(): TransportConfig {
    return this.config;
  }

  public isAvailable(): boolean {
    // STDIO is always available in Node.js environments
    return true;
  }

  public getPriority(): number {
    // STDIO has highest priority for CLI usage
    return 1;
  }
}
