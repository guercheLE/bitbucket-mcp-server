/**
 * Server-Sent Events (SSE) Transport Implementation
 * SSE transport for real-time MCP server communication
 */

import { Server } from '@modelcontextprotocol/sdk/server/index';
import { TransportType, TransportConfig } from '../../types/index';
import { logger } from '../../utils/logger';
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';

export class SseTransport {
  private app: Express;
  private server: any;
  private config: TransportConfig;
  private clients: Map<string, Response> = new Map();

  constructor(config: TransportConfig = {}) {
    this.config = {
      host: 'localhost',
      port: 3001,
      path: '/mcp/sse',
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
      logger.info('SSE request received', {
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
        transport: 'sse',
        version: process.env['npm_package_version'] || '1.0.0',
        connectedClients: this.clients.size,
      });
    });

    // SSE connection endpoint
    this.app.get(this.config.path || '/mcp/sse', (req: Request, res: Response) => {
      const clientId = (req.query['clientId'] as string) || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.info('SSE client connected', {
        clientId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      // Send initial connection event
      res.write(`data: ${JSON.stringify({
        type: 'connected',
        clientId,
        timestamp: new Date().toISOString(),
      })}\n\n`);

      // Store client connection
      this.clients.set(clientId, res);

      // Handle client disconnect
      req.on('close', () => {
        logger.info('SSE client disconnected', { clientId });
        this.clients.delete(clientId);
      });

      req.on('error', (error) => {
        logger.error('SSE client error', {
          clientId,
          error: error.message,
        });
        this.clients.delete(clientId);
      });

      // Send periodic heartbeat
      const heartbeat = setInterval(() => {
        if (this.clients.has(clientId)) {
          try {
            res.write(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            })}\n\n`);
          } catch (error) {
            logger.error('Error sending heartbeat', {
              clientId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            clearInterval(heartbeat);
            this.clients.delete(clientId);
          }
        } else {
          clearInterval(heartbeat);
        }
      }, 30000); // 30 seconds
    });

    // MCP message endpoint
    this.app.post('/mcp/sse/message', (req: Request, res: Response) => {
      const { clientId, message } = req.body;
      
      if (!clientId || !message) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'clientId and message are required',
        });
        return;
      }

      const client = this.clients.get(clientId);
      if (!client) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Client not found',
        });
        return;
      }

      try {
        client.write(`data: ${JSON.stringify({
          type: 'message',
          message,
          timestamp: new Date().toISOString(),
        })}\n\n`);
        
        res.json({ success: true });
      } catch (error) {
        logger.error('Error sending SSE message', {
          clientId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.clients.delete(clientId);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to send message',
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
      logger.error('SSE request error', {
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
      logger.info('Initializing SSE transport', {
        transport: 'sse',
        host: this.config.host,
        port: this.config.port,
        path: this.config.path,
      });

      // Start SSE server
      this.server = this.app.listen(this.config.port || 3001, this.config.host || 'localhost', () => {
        logger.info('SSE transport initialized successfully', {
          transport: 'sse',
          host: this.config.host,
          port: this.config.port,
          path: this.config.path,
        });
      });

      // Handle server errors
      this.server.on('error', (error: Error) => {
        logger.error('SSE server error', {
          error: error.message,
          transport: 'sse',
        });
      });

    } catch (error) {
      logger.error('Failed to initialize SSE transport', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transport: 'sse',
      });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down SSE transport');
      
      // Close all client connections
      for (const [clientId, client] of this.clients) {
        try {
          client.write(`data: ${JSON.stringify({
            type: 'disconnected',
            message: 'Server shutting down',
            timestamp: new Date().toISOString(),
          })}\n\n`);
          client.end();
        } catch (error) {
          logger.error('Error closing SSE client', {
            clientId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      this.clients.clear();
      
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
      
      logger.info('SSE transport shutdown completed');
    } catch (error) {
      logger.error('Error during SSE transport shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transport: 'sse',
      });
      throw error;
    }
  }

  public getType(): TransportType {
    return 'sse';
  }

  public getConfig(): TransportConfig {
    return this.config;
  }

  public isAvailable(): boolean {
    // SSE transport is available if port is not in use
    return true;
  }

  public getPriority(): number {
    // SSE has medium priority
    return 2;
  }

  public getApp(): Express {
    return this.app;
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public broadcast(message: any): void {
    const data = JSON.stringify({
      type: 'broadcast',
      message,
      timestamp: new Date().toISOString(),
    });

    for (const [clientId, client] of this.clients) {
      try {
        client.write(`data: ${data}\n\n`);
      } catch (error) {
        logger.error('Error broadcasting to SSE client', {
          clientId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.clients.delete(clientId);
      }
    }
  }
}