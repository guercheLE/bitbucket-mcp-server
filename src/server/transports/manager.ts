/**
 * Transport Manager
 * Manages multiple transport types with automatic fallback and priority handling
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TransportType, TransportConfig } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { StdioTransport } from './stdio.js';
import { HttpTransport } from './http.js';
import { SseTransport } from './sse.js';
import { StreamingTransport } from './streaming.js';

export interface TransportManagerConfig {
  transports: TransportType[];
  fallbackEnabled: boolean;
  priorityOrder: TransportType[];
}

export class TransportManager {
  private transports: Map<TransportType, any> = new Map();
  private activeTransport: TransportType | null = null;
  private config: TransportManagerConfig;
  private server: Server | null = null;

  constructor(config: TransportManagerConfig) {
    this.config = {
      ...config,
      transports: config.transports || ['stdio', 'http', 'sse', 'streaming'],
      fallbackEnabled: config.fallbackEnabled ?? true,
      priorityOrder: config.priorityOrder || ['stdio', 'sse', 'http', 'streaming'],
    };

    this.initializeTransports();
  }

  private initializeTransports(): void {
    logger.info('Initializing transport manager', {
      transports: this.config.transports,
      fallbackEnabled: this.config.fallbackEnabled,
      priorityOrder: this.config.priorityOrder,
    });

    // Initialize available transports
    for (const transportType of this.config.transports) {
      try {
        const transport = this.createTransport(transportType);
        this.transports.set(transportType, transport);
        logger.info('Transport initialized', {
          type: transportType,
          available: transport.isAvailable(),
          priority: transport.getPriority(),
        });
      } catch (error) {
        logger.error('Failed to initialize transport', {
          type: transportType,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private createTransport(type: TransportType): any {
    const config: TransportConfig = this.getTransportConfig(type);

    switch (type) {
      case 'stdio':
        return new StdioTransport(config);
      case 'http':
        return new HttpTransport(config);
      case 'sse':
        return new SseTransport(config);
      case 'streaming':
        return new StreamingTransport(config);
      default:
        throw new Error(`Unsupported transport type: ${type}`);
    }
  }

  private getTransportConfig(type: TransportType): TransportConfig {
    const baseConfig: TransportConfig = {
      timeout: 30000,
    };

    switch (type) {
      case 'stdio':
        return baseConfig;
      case 'http':
        return {
          ...baseConfig,
          host: process.env['SERVER_HOST'] || 'localhost',
          port: parseInt(process.env['SERVER_PORT'] || '3000'),
          path: '/mcp',
        };
      case 'sse':
        return {
          ...baseConfig,
          host: process.env['SERVER_HOST'] || 'localhost',
          port: parseInt(process.env['SSE_PORT'] || '3001'),
          path: '/mcp/sse',
        };
      case 'streaming':
        return {
          ...baseConfig,
          host: process.env['SERVER_HOST'] || 'localhost',
          port: parseInt(process.env['STREAMING_PORT'] || '3002'),
          path: '/mcp/stream',
        };
      default:
        return baseConfig;
    }
  }

  public async initialize(server: Server): Promise<void> {
    this.server = server;
    
    try {
      // Try to initialize transports in priority order
      for (const transportType of this.config.priorityOrder) {
        if (this.config.transports.includes(transportType)) {
          const transport = this.transports.get(transportType);
          if (transport && transport.isAvailable()) {
            try {
              await transport.initialize(server);
              this.activeTransport = transportType;
              logger.info('Active transport set', {
                type: transportType,
                priority: transport.getPriority(),
              });
              break;
            } catch (error) {
              logger.warn('Failed to initialize transport, trying next', {
                type: transportType,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
              
              if (this.config.fallbackEnabled) {
                continue;
              } else {
                throw error;
              }
            }
          }
        }
      }

      if (!this.activeTransport) {
        throw new Error('No transport could be initialized');
      }

      logger.info('Transport manager initialized successfully', {
        activeTransport: this.activeTransport,
        availableTransports: Array.from(this.transports.keys()),
      });

    } catch (error) {
      logger.error('Failed to initialize transport manager', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down transport manager');

      // Shutdown all transports
      for (const [type, transport] of this.transports) {
        try {
          await transport.shutdown();
          logger.info('Transport shutdown completed', { type });
        } catch (error) {
          logger.error('Error during transport shutdown', {
            type,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      this.activeTransport = null;
      this.server = null;
      
      logger.info('Transport manager shutdown completed');
    } catch (error) {
      logger.error('Error during transport manager shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public getActiveTransport(): TransportType | null {
    return this.activeTransport;
  }

  public getTransport(type: TransportType): any {
    return this.transports.get(type);
  }

  public getAvailableTransports(): TransportType[] {
    return Array.from(this.transports.entries())
      .filter(([_, transport]) => transport.isAvailable())
      .map(([type, _]) => type);
  }

  public async switchTransport(type: TransportType): Promise<void> {
    if (!this.server) {
      throw new Error('Server not initialized');
    }

    const transport = this.transports.get(type);
    if (!transport) {
      throw new Error(`Transport ${type} not available`);
    }

    if (!transport.isAvailable()) {
      throw new Error(`Transport ${type} is not available`);
    }

    try {
      // Shutdown current transport
      if (this.activeTransport) {
        const currentTransport = this.transports.get(this.activeTransport);
        if (currentTransport) {
          await currentTransport.shutdown();
        }
      }

      // Initialize new transport
      await transport.initialize(this.server);
      this.activeTransport = type;

      logger.info('Transport switched successfully', {
        from: this.activeTransport,
        to: type,
      });
    } catch (error) {
      logger.error('Failed to switch transport', {
        from: this.activeTransport,
        to: type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public getTransportStatus(): Record<TransportType, any> {
    const status: Record<string, any> = {};

    for (const [type, transport] of this.transports) {
      status[type] = {
        available: transport.isAvailable(),
        priority: transport.getPriority(),
        active: type === this.activeTransport,
        config: transport.getConfig(),
      };
    }

    return status as Record<TransportType, any>;
  }

  public isTransportAvailable(type: TransportType): boolean {
    const transport = this.transports.get(type);
    return transport ? transport.isAvailable() : false;
  }

  public getTransportPriority(type: TransportType): number {
    const transport = this.transports.get(type);
    return transport ? transport.getPriority() : 999;
  }

  public async healthCheck(): Promise<Record<string, any>> {
    const health: Record<string, any> = {
      activeTransport: this.activeTransport,
      timestamp: new Date().toISOString(),
      transports: {},
    };

    for (const [type, transport] of this.transports) {
      try {
        health['transports'][type] = {
          available: transport.isAvailable(),
          priority: transport.getPriority(),
          active: type === this.activeTransport,
        };

        // Add transport-specific health data
        if (type === 'http' && transport.getApp) {
          health['transports'][type].app = 'express';
        }
        if (type === 'sse' && transport.getConnectedClients) {
          health['transports'][type].connectedClients = transport.getConnectedClients();
        }
        if (type === 'streaming' && transport.getActiveStreams) {
          health['transports'][type].activeStreams = transport.getActiveStreams();
        }
      } catch (error) {
        health['transports'][type] = {
          available: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return health;
  }
}
