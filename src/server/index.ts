/**
 * Bitbucket MCP Server
 * Main server implementation using official MCP SDK with comprehensive integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListToolsResult,
  CallToolResult
} from '@modelcontextprotocol/sdk/types.js';

// Import services
import { logger } from '../utils/logger.js';
import { environment } from '../config/environment.js';
import { TransportManager } from './transports/manager.js';
import { healthCheckService } from '../services/health-check.js';
import { rateLimitAndCircuitBreaker } from '../services/rate-limiter.js';
import { errorHandlerService } from '../services/error-handling.js';
import { cache } from '../services/cache.js';
import { serverDetectionService } from '../services/server-detection.js';
import { toolRegistry } from '../mcp/tool-registry.js';

// Health check tool schema
const HealthCheckSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

// Server info tool schema (simplified for MCP tool)
const ServerInfoToolSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

/**
 * Create and configure MCP server with full integration
 */
export function createMCPServer(): Server {
  // Create server with metadata
  const server = new Server(
    {
      name: 'bitbucket-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Configure tools/list handler
  server.setRequestHandler(ListToolsRequestSchema, (): ListToolsResult => {
    // Get all tools from registry plus system tools
    const systemTools = [
      {
        name: 'health_check',
        description: 'Check Bitbucket server health and connectivity',
        inputSchema: {
          type: 'object' as const,
          properties: {
            url: {
              type: 'string' as const,
              description: 'Bitbucket server URL',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'server_info',
        description: 'Get Bitbucket server information and type detection',
        inputSchema: {
          type: 'object' as const,
          properties: {
            url: {
              type: 'string' as const,
              description: 'Bitbucket server URL',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'system_health',
        description: 'Get comprehensive system health status',
        inputSchema: {
          type: 'object' as const,
          properties: {},
        },
      },
      {
        name: 'cache_stats',
        description: 'Get cache statistics and performance metrics',
        inputSchema: {
          type: 'object' as const,
          properties: {},
        },
      },
      {
        name: 'rate_limit_status',
        description: 'Get rate limiting and circuit breaker status',
        inputSchema: {
          type: 'object' as const,
          properties: {},
        },
      },
      {
        name: 'tool_registry_stats',
        description: 'Get tool registry statistics and information',
        inputSchema: {
          type: 'object' as const,
          properties: {},
        },
      },
    ];

    // Combine system tools with registered tools
    const allTools = [...systemTools, ...toolRegistry.getTools()];

    logger.debug('Tools list requested', {
      systemTools: systemTools.length,
      registeredTools: toolRegistry.getTools().length,
      totalTools: allTools.length
    });

    return {
      tools: allTools,
    };
  });

  // Configure tools/call handler with error handling and rate limiting
  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;
    const context = errorHandlerService.createContext(`tool:${name}`, {
      tool: name,
      args: Object.keys(args || {})
    });

    try {
      // Apply rate limiting
      const rateLimitResult = await rateLimitAndCircuitBreaker.getRateLimiter().consume(
        `tool:${name}`,
        'global',
        1
      );

      if (!rateLimitResult.success) {
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.msBeforeNext / 1000)} seconds`);
      }

      // Execute tool with error handling
      return await errorHandlerService.executeWithErrorHandling(async () => {
        // Check if it's a system tool first
        switch (name) {
          case 'health_check':
            return handleHealthCheck(args);
          case 'server_info':
            return handleServerInfo(args);
          case 'system_health':
            return handleSystemHealth();
          case 'cache_stats':
            return handleCacheStats();
          case 'rate_limit_status':
            return handleRateLimitStatus();
          case 'tool_registry_stats':
            return handleToolRegistryStats();
          default:
            // Check if it's a registered tool
            if (toolRegistry.hasTool(name)) {
              return await toolRegistry.executeTool(name, args);
            }
            throw new Error(`Unknown tool: ${name}`);
        }
      }, context);
    } catch (error) {
      logger.error('Tool execution failed', {
        tool: name,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: context.requestId
      });
      throw error;
    }
  });

  return server;
}

/**
 * Handle health check tool
 */
async function handleHealthCheck(args: unknown): Promise<CallToolResult> {
  try {
    // Validate input
    const validatedArgs = HealthCheckSchema.parse(args);
    
    // Use circuit breaker for external health check
    const result = await rateLimitAndCircuitBreaker.executeWithProtection(
      async () => {
        // Perform actual health check
        const serverInfo = await serverDetectionService.detectServerType(validatedArgs.url);
        
        return {
          url: validatedArgs.url,
          status: serverInfo.healthStatus || 'unknown',
          serverType: serverInfo.serverType,
          version: serverInfo.version,
          isSupported: serverInfo.isSupported,
          fallbackUsed: serverInfo.fallbackUsed,
          lastHealthCheck: serverInfo.lastHealthCheck,
          error: serverInfo.error
        };
      },
      {
        rateLimitKey: `health-check:${validatedArgs.url}`,
        rateLimitType: 'api:heavy',
        circuitBreakerName: 'bitbucket-api'
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Handle server info tool
 */
async function handleServerInfo(args: unknown): Promise<CallToolResult> {
  try {
    // Validate input
    const validatedArgs = ServerInfoToolSchema.parse(args);
    
    // Use circuit breaker for server detection
    const result = await rateLimitAndCircuitBreaker.executeWithProtection(
      async () => {
        const serverInfo = await serverDetectionService.detectServerType(validatedArgs.url);
        return serverInfo;
      },
      {
        rateLimitKey: `server-info:${validatedArgs.url}`,
        rateLimitType: 'api:heavy',
        circuitBreakerName: 'bitbucket-api'
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Handle system health tool
 */
async function handleSystemHealth(): Promise<CallToolResult> {
  try {
    const systemHealth = await healthCheckService.getSystemHealth();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(systemHealth, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`System health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle cache stats tool
 */
async function handleCacheStats(): Promise<CallToolResult> {
  try {
    const stats = await cache.getStats();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Cache stats retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle rate limit status tool
 */
async function handleRateLimitStatus(): Promise<CallToolResult> {
  try {
    const status = rateLimitAndCircuitBreaker.getStatus();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Rate limit status retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle tool registry stats tool
 */
async function handleToolRegistryStats(): Promise<CallToolResult> {
  try {
    const stats = toolRegistry.getStats();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Tool registry stats retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main function to start the server with full integration
 */
export async function main(): Promise<void> {
  try {
    logger.info('Starting Bitbucket MCP Server', {
      version: '1.0.0',
      environment: environment.getConfig().node.env,
      host: environment.getConfig().server.host,
      port: environment.getConfig().server.port
    });

    // Create MCP server
    const server = createMCPServer();
    
    // Initialize transport manager
    const transportManager = new TransportManager({
      transports: ['stdio', 'http', 'sse'],
      fallbackEnabled: true,
      priorityOrder: ['stdio', 'sse', 'http']
    });

    // Initialize transport manager with server
    await transportManager.initialize(server);
    
    logger.info('MCP Server started successfully', {
      activeTransport: transportManager.getActiveTransport(),
      availableTransports: transportManager.getAvailableTransports(),
      registeredTools: toolRegistry.getStats()
    });

    // Start health check service
    logger.info('Health check service started');
    
    // Handle graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      try {
        // Stop health checks
        healthCheckService.stop();
        
        // Shutdown transport manager
        await transportManager.shutdown();
        
        // Close server
        await server.close();
        
        // Destroy cache
        await cache.destroy();
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: promise.toString()
      });
      gracefulShutdown('unhandledRejection');
    });
    
  } catch (error) {
    logger.error('Failed to start MCP server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
