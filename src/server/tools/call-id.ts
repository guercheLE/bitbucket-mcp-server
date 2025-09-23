/**
 * @fileoverview Execute Bitbucket API operation tool
 * 
 * This tool implements the call-id MCP tool as specified in the Constitution.
 * It executes Bitbucket API operations with dynamic parameter validation and authentication.
 * 
 * @author Bitbucket MCP Server
 * @version 1.0.0
 * @license LGPL-3.0
 */

import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BitbucketToolsIntegration } from '../auth/bitbucket-tools-integration.js';
import { ServerDetector } from '../services/server-detector';
import { UserSession } from '../../types/auth.js';

/**
 * Pagination parameters schema
 */
const PaginationParamsSchema = z.object({
  page: z.number().min(1).default(1).describe('Page number (1-based)'),
  limit: z.number().min(1).max(100).default(25).describe('Items per page (max 100)'),
  start: z.number().min(0).optional().describe('Bitbucket-style start index')
});

/**
 * Call ID tool implementation
 */
export class CallIdTool {
  private toolsIntegration: BitbucketToolsIntegration;
  private serverDetector: ServerDetector;

  constructor(
    toolsIntegration: BitbucketToolsIntegration,
    serverDetector: ServerDetector
  ) {
    this.toolsIntegration = toolsIntegration;
    this.serverDetector = serverDetector;
  }

  /**
   * Get the MCP tool definition
   */
  getTool(): Tool {
    return {
      name: 'call-id',
      description: 'Execute Bitbucket API operation with dynamic parameter validation and authentication. Supports all Bitbucket operations through internal operation IDs.',
      inputSchema: {
        type: 'object',
        properties: {
          endpoint_id: {
            type: 'string',
            description: 'Internal operation ID from search-ids results (e.g., "bitbucket.list-repos", "bitbucket.create-pr")'
          },
          params: {
            type: 'object',
            description: 'Operation parameters (schema depends on the specific operation)',
            additionalProperties: true
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                minimum: 1,
                default: 1,
                description: 'Page number (1-based)'
              },
              limit: {
                type: 'number',
                minimum: 1,
                maximum: 100,
                default: 25,
                description: 'Items per page (max 100)'
              },
              start: {
                type: 'number',
                minimum: 0,
                description: 'Bitbucket-style start index'
              }
            },
            description: 'Pagination parameters for list operations'
          }
        },
        required: ['endpoint_id', 'params']
      }
    };
  }

  /**
   * Execute Bitbucket API operation
   */
  async execute(params: {
    endpoint_id: string;
    params: Record<string, any>;
    pagination?: {
      page?: number;
      limit?: number;
      start?: number;
    };
  }, userSession?: UserSession): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    pagination?: {
      current_page: number;
      total_pages: number;
      has_next: boolean;
      has_previous: boolean;
      total_count?: number;
    };
    metadata?: {
      operation_id: string;
      execution_time_ms: number;
      server_type: string;
      server_version: string;
      user_context?: {
        authenticated: boolean;
        user_id?: string;
        user_name?: string;
        user_email?: string;
        permissions?: string[];
        session_active?: boolean;
      };
    };
  }> {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedParams = z.object({
        endpoint_id: z.string().min(1),
        params: z.record(z.any()),
        pagination: PaginationParamsSchema.optional()
      }).parse(params);

      const { endpoint_id, params: operationParams, pagination } = validatedParams;

      // Get server information
      const serverInfo = await this.serverDetector.detectServer();

      // Validate operation exists and is compatible
      await this.validateOperation(endpoint_id, serverInfo);

      // Check authentication requirements
      await this.validateAuthentication(endpoint_id, userSession);

      // Create execution context
      const executionContext = {
        session: {
          id: 'mcp-session',
          transport: { type: 'stdio' as const },
          connectedAt: new Date(),
          lastActivity: new Date(),
          metadata: {}
        },
        server: {} as any,
        request: {
          id: `req-${Date.now()}`,
          timestamp: new Date(),
          transport: 'mcp'
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage()
        },
        authentication: userSession ? {
          userSession,
          userId: userSession.userId,
          userName: userSession.userName,
          isAuthenticated: true
        } : undefined
      };

      // Execute the operation through tools integration with user context
      const result = await this.toolsIntegration.executeTool(endpoint_id, {
        ...operationParams,
        ...(pagination && this.buildPaginationParams(pagination))
      }, executionContext);

      const executionTime = Date.now() - startTime;

      // Format response
      const response: any = {
        success: true,
        data: result.data,
        metadata: {
          operation_id: endpoint_id,
          execution_time_ms: executionTime,
          server_type: serverInfo.type,
          server_version: serverInfo.version,
          user_context: {
            authenticated: !!userSession,
            user_id: userSession?.userId,
            user_name: userSession?.userName,
            user_email: userSession?.userEmail,
            permissions: userSession?.permissions || [],
            session_active: userSession?.isActive() || false
          }
        }
      };

      // Note: Pagination metadata would be added here if available in the result
      // For now, we'll skip pagination metadata as it's not available in the current result type

      return response;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operation_id: params.endpoint_id,
          execution_time_ms: executionTime,
          server_type: 'unknown',
          server_version: 'unknown',
          user_context: {
            authenticated: !!userSession,
            user_id: userSession?.userId,
            user_name: userSession?.userName,
            user_email: userSession?.userEmail,
            permissions: userSession?.permissions || [],
            session_active: userSession?.isActive() || false
          }
        }
      };
    }
  }

  /**
   * Validate operation exists and is compatible with current server
   */
  private async validateOperation(endpointId: string, serverInfo: any): Promise<void> {
    // Basic validation - in a real implementation, this would check against
    // a registry of available operations
    if (!endpointId || endpointId.trim().length === 0) {
      throw new Error(`Invalid operation ID: ${endpointId}`);
    }

    // For now, we'll assume all operations are compatible
    // In a real implementation, this would check against operation metadata
    console.log(`Validating operation ${endpointId} for ${serverInfo.type} server`);
  }

  /**
   * Build pagination parameters for Bitbucket API
   */
  private buildPaginationParams(pagination: {
    page?: number;
    limit?: number;
    start?: number;
  }): Record<string, any> {
    const params: Record<string, any> = {};

    if (pagination.start !== undefined) {
      // Use Bitbucket-style pagination
      params.start = pagination.start;
      params.limit = pagination.limit || 25;
    } else if (pagination.page !== undefined) {
      // Convert page-based to Bitbucket-style
      const limit = pagination.limit || 25;
      params.start = (pagination.page - 1) * limit;
      params.limit = limit;
    }

    return params;
  }

  /**
   * Check if operation version is compatible with server version
   */
  private isVersionCompatible(requiredVersion: string, serverVersion: string): boolean {
    // Simple version comparison - in production, use proper semver comparison
    const required = requiredVersion.split('.').map(Number);
    const server = serverVersion.split('.').map(Number);
    
    for (let i = 0; i < Math.max(required.length, server.length); i++) {
      const req = required[i] || 0;
      const srv = server[i] || 0;
      
      if (srv > req) return true;
      if (srv < req) return false;
    }
    
    return true;
  }

  /**
   * Validate authentication requirements for operation execution
   */
  private async validateAuthentication(endpointId: string, userSession?: UserSession): Promise<void> {
    // For now, we'll do basic validation
    // In a real implementation, this would check against operation metadata
    
    // Check if operation requires authentication (basic check based on endpoint pattern)
    const requiresAuth = endpointId.includes('admin.') || endpointId.includes('user.') || endpointId.includes('security.');
    
    if (requiresAuth) {
      if (!userSession) {
        throw new Error(`Operation ${endpointId} requires authentication`);
      }

      // Check if user session is active
      if (!userSession.isActive()) {
        throw new Error(`User session has expired for operation ${endpointId}`);
      }
    }
  }
}
