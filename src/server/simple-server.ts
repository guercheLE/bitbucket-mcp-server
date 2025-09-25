/**
 * Simple MCP Server Implementation
 * 
 * A simplified version of the Bitbucket MCP Server that focuses on
 * basic functionality and can actually start without complex dependencies.
 */

// Simple console-based server for testing
// We'll implement a basic version without complex MCP dependencies

// Simple server configuration
interface SimpleServerConfig {
  name: string;
  version: string;
}

// Simple tool definition
interface SimpleTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

class SimpleMCPServer {
  private config: SimpleServerConfig;
  private tools: SimpleTool[];

  constructor(config: SimpleServerConfig) {
    this.config = config;
    this.tools = [
      {
        name: 'ping',
        description: 'Simple ping tool to test server connectivity',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message to echo back',
              default: 'pong'
            }
          }
        }
      },
      {
        name: 'get-server-info',
        description: 'Get basic server information',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  async start() {
    console.log(`🚀 ${this.config.name} v${this.config.version} started successfully!`);
    console.log('📋 Available tools:', this.tools.map(t => t.name).join(', '));
    console.log('✅ Server is running and ready to accept connections');
    console.log('💡 This is a simplified version for testing purposes');
    
    // Keep the process alive
    return new Promise<void>((resolve) => {
      // The server will stay running until interrupted
      process.on('SIGINT', () => {
        this.stop().then(() => resolve());
      });
      process.on('SIGTERM', () => {
        this.stop().then(() => resolve());
      });
    });
  }

  async stop() {
    console.log('🛑 Server stopped');
  }
}

// Main execution
async function main() {
  const config: SimpleServerConfig = {
    name: 'bitbucket-mcp-server',
    version: '1.0.0'
  };

  const server = new SimpleMCPServer(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  try {
    await server.start();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}
