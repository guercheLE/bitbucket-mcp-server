/**
 * Bitbucket MCP Server
 * Main server implementation using official MCP SDK
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

// Health check tool schema
const HealthCheckSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

/**
 * Create and configure MCP server
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
    return {
      tools: [
        {
          name: 'health_check',
          description: 'Check Bitbucket server health and connectivity',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'Bitbucket server URL',
              },
            },
            required: ['url'],
          },
        },
      ],
    };
  });

  // Configure tools/call handler
  server.setRequestHandler(CallToolRequestSchema, (request): CallToolResult => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'health_check':
        return handleHealthCheck(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  return server;
}

/**
 * Handle health check tool
 */
function handleHealthCheck(args: unknown): CallToolResult {
  try {
    // Validate input
    const validatedArgs = HealthCheckSchema.parse(args);
    
    // TODO: Implement actual health check logic
    // For now, return a placeholder response
    return {
      content: [
        {
          type: 'text',
          text: `Health check for ${validatedArgs.url} completed successfully`,
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
 * Main function to start the server
 */
export async function main(): Promise<void> {
  try {
    const server = createMCPServer();
    const transport = new StdioServerTransport();
    
    await server.connect(transport);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      void server.close().then(() => {
        process.exit(0);
      });
    });
    
    process.on('SIGTERM', () => {
      void server.close().then(() => {
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start MCP server:', error);
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
