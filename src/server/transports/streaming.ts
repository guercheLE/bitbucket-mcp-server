/**
 * HTTP Streaming Transport Implementation
 * HTTP streaming transport for MCP server with chunked transfer encoding
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TransportType, TransportConfig } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { Transform } from 'stream';

export class StreamingTransport {
  private app: Express;
  private server: any;
  private config: TransportConfig;
  private activeStreams: Map<string, Response> = new Map();

  constructor(config: TransportConfig = {}) {
    this.config = {
      host: 'localhost',
      port: 3002,
      path: '/mcp/stream',
      timeout: 30000,
      ...config,
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }));

    // CORS middleware
    this.app.use(cors({
      origin: process.env['CORS_ORIGIN'] || '*',
      credentials: process.env['CORS_CREDENTIALS'] === 'true',
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      logger.info('Streaming request received', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        transport: 'streaming',
        version: process.env['npm_package_version'] || '1.0.0',
        activeStreams: this.activeStreams.size,
      });
    });

    // Streaming endpoint
    this.app.get(this.config.path || '/mcp/stream', (req: Request, res: Response) => {
      const streamId = (req.query['streamId'] as string) || `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.info('Streaming client connected', {
        streamId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Set streaming headers
      res.writeHead(200, {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      // Send initial stream event
      res.write(JSON.stringify({
        type: 'stream_started',
        streamId,
        timestamp: new Date().toISOString(),
      }) + '\n');

      // Store stream connection
      this.activeStreams.set(streamId, res);

      // Handle client disconnect
      req.on('close', () => {
        logger.info('Streaming client disconnected', { streamId });
        this.activeStreams.delete(streamId);
      });

      req.on('error', (error) => {
        logger.error('Streaming client error', {
          streamId,
          error: error.message,
        });
        this.activeStreams.delete(streamId);
      });

      // Send periodic heartbeat
      const heartbeat = setInterval(() => {
        if (this.activeStreams.has(streamId)) {
          try {
            res.write(JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            }) + '\n');
          } catch (error) {
            logger.error('Error sending heartbeat', {
              streamId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            clearInterval(heartbeat);
            this.activeStreams.delete(streamId);
          }
        } else {
          clearInterval(heartbeat);
        }
      }, 30000); // 30 seconds
    });

    // Stream data endpoint
    this.app.post('/mcp/stream/data', (req: Request, res: Response) => {
      const { streamId, data } = req.body;
      
      if (!streamId || !data) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'streamId and data are required',
        });
        return;
      }

      const stream = this.activeStreams.get(streamId);
      if (!stream) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Stream not found',
        });
        return;
      }

      try {
        stream.write(JSON.stringify({
          type: 'data',
          data,
          timestamp: new Date().toISOString(),
        }) + '\n');
        
        res.json({ success: true });
      } catch (error) {
        logger.error('Error sending stream data', {
          streamId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.activeStreams.delete(streamId);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to send data',
        });
      }
    });

    // Stream end endpoint
    this.app.post('/mcp/stream/end', (req: Request, res: Response) => {
      const { streamId, reason } = req.body;
      
      if (!streamId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'streamId is required',
        });
        return;
      }

      const stream = this.activeStreams.get(streamId);
      if (!stream) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Stream not found',
        });
        return;
      }

      try {
        stream.write(JSON.stringify({
          type: 'stream_ended',
          reason: reason || 'Client requested end',
          timestamp: new Date().toISOString(),
        }) + '\n');
        
        stream.end();
        this.activeStreams.delete(streamId);
        
        res.json({ success: true });
      } catch (error) {
        logger.error('Error ending stream', {
          streamId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.activeStreams.delete(streamId);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to end stream',
        });
      }
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    });

    // Error handler
    this.app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
      logger.error('Streaming request error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env['NODE_ENV'] === 'development' ? error.message : 'Something went wrong',
      });
    });
  }

  public async initialize(_server: Server): Promise<void> {
    try {
      logger.info('Initializing Streaming transport', {
        transport: 'streaming',
        host: this.config.host,
        port: this.config.port,
        path: this.config.path,
      });

      // Start streaming server
      this.server = this.app.listen(this.config.port || 3002, this.config.host || 'localhost', () => {
        logger.info('Streaming transport initialized successfully', {
          transport: 'streaming',
          host: this.config.host,
          port: this.config.port,
          path: this.config.path,
        });
      });

      // Handle server errors
      this.server.on('error', (error: Error) => {
        logger.error('Streaming server error', {
          error: error.message,
          transport: 'streaming',
        });
      });

    } catch (error) {
      logger.error('Failed to initialize Streaming transport', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transport: 'streaming',
      });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down Streaming transport');
      
      // Close all active streams
      for (const [streamId, stream] of this.activeStreams) {
        try {
          stream.write(JSON.stringify({
            type: 'stream_ended',
            reason: 'Server shutting down',
            timestamp: new Date().toISOString(),
          }) + '\n');
          stream.end();
        } catch (error) {
          logger.error('Error closing stream', {
            streamId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      this.activeStreams.clear();
      
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server.close((error: Error | undefined) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }
      
      logger.info('Streaming transport shutdown completed');
    } catch (error) {
      logger.error('Error during Streaming transport shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transport: 'streaming',
      });
      throw error;
    }
  }

  public getType(): TransportType {
    return 'streaming';
  }

  public getConfig(): TransportConfig {
    return this.config;
  }

  public isAvailable(): boolean {
    // Streaming transport is available if port is not in use
    return true;
  }

  public getPriority(): number {
    // Streaming has low priority
    return 4;
  }

  public getApp(): Express {
    return this.app;
  }

  public getActiveStreams(): number {
    return this.activeStreams.size;
  }

  public broadcast(data: any): void {
    const message = JSON.stringify({
      type: 'broadcast',
      data,
      timestamp: new Date().toISOString(),
    });

    for (const [streamId, stream] of this.activeStreams) {
      try {
        stream.write(message + '\n');
      } catch (error) {
        logger.error('Error broadcasting to stream', {
          streamId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.activeStreams.delete(streamId);
      }
    }
  }

  public createDataTransform(): Transform {
    return new Transform({
      objectMode: true,
      transform(chunk: any, _encoding: string, callback: Function) {
        try {
          const data = JSON.stringify(chunk) + '\n';
          callback(null, data);
        } catch (error) {
          callback(error);
        }
      }
    });
  }
}