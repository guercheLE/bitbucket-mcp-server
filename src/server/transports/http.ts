/**
 * HTTP Transport Implementation
 * HTTP transport for MCP server with REST API support
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TransportType, TransportConfig } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export class HttpTransport {
  private app: Express;
  private server: any;
  private config: TransportConfig;
  private rateLimiter: RateLimiterMemory;

  constructor(config: TransportConfig = {}) {
    this.config = {
      host: 'localhost',
      port: 3000,
      path: '/mcp',
      timeout: 30000,
      ...config,
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    
    // Rate limiting configuration
    this.rateLimiter = new RateLimiterMemory({
      keyPrefix: 'mcp_http',
      points: 100, // Number of requests
      duration: 900, // Per 15 minutes
    });
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

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      logger.info('HTTP request received', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
      next();
    });

    // Rate limiting middleware
    this.app.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        await this.rateLimiter.consume(req.ip || 'unknown');
        next();
      } catch (rejRes: any) {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          url: req.url,
        });
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
        });
      }
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        transport: 'http',
        version: process.env['npm_package_version'] || '1.0.0',
      });
    });

    // MCP endpoint
    this.app.post(this.config.path || '/mcp', (req: Request, res: Response) => {
      // This will be connected to the MCP server handler
      res.json({
        message: 'MCP HTTP endpoint ready',
        method: req.method,
        body: req.body,
      });
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
      logger.error('HTTP request error', {
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
      logger.info('Initializing HTTP transport', {
        transport: 'http',
        host: this.config.host,
        port: this.config.port,
        path: this.config.path,
      });

      // Start HTTP server
      this.server = this.app.listen(this.config.port || 3000, this.config.host || 'localhost', () => {
        logger.info('HTTP transport initialized successfully', {
          transport: 'http',
          host: this.config.host,
          port: this.config.port,
          path: this.config.path,
        });
      });

      // Handle server errors
      this.server.on('error', (error: Error) => {
        logger.error('HTTP server error', {
          error: error.message,
          transport: 'http',
        });
      });

    } catch (error) {
      logger.error('Failed to initialize HTTP transport', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transport: 'http',
      });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down HTTP transport');
      
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
      
      logger.info('HTTP transport shutdown completed');
    } catch (error) {
      logger.error('Error during HTTP transport shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transport: 'http',
      });
      throw error;
    }
  }

  public getType(): TransportType {
    return 'http';
  }

  public getConfig(): TransportConfig {
    return this.config;
  }

  public isAvailable(): boolean {
    // HTTP transport is available if port is not in use
    return true;
  }

  public getPriority(): number {
    // HTTP has medium priority
    return 3;
  }

  public getApp(): Express {
    return this.app;
  }
}
