/**
 * @fileoverview Get detailed operation schema tool
 * 
 * This tool implements the get-id MCP tool as specified in the Constitution.
 * It retrieves detailed schema and documentation for specific Bitbucket API operations.
 * 
 * @author Bitbucket MCP Server
 * @version 1.0.0
 * @license LGPL-3.0
 */

import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BitbucketToolsIntegration } from '../auth/bitbucket-tools-integration.js';
import { VectorDatabase } from '../services/vector-database.js';
import { ServerDetector } from '../services/server-detector';
import { UserSession } from '../../types/auth.js';

/**
 * Endpoint details schema
 */
const EndpointDetailsSchema = z.object({
  id: z.string().describe('Internal operation ID'),
  name: z.string().describe('Human-readable operation name'),
  description: z.string().describe('Detailed operation description'),
  category: z.string().describe('Operation category'),
  version: z.string().describe('Bitbucket version compatibility'),
  serverType: z.enum(['datacenter', 'cloud']).describe('Server type compatibility'),
  inputSchema: z.object({
    type: z.string(),
    properties: z.record(z.any()),
    required: z.array(z.string()).optional()
  }).describe('Zod-compatible JSON schema for input parameters'),
  outputSchema: z.object({
    type: z.string(),
    properties: z.record(z.any())
  }).describe('JSON schema for response format'),
  parameters: z.object({
    required: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string()
    })),
    optional: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
      default: z.any().optional()
    }))
  }).describe('Parameter details with Bitbucket data constraints'),
  examples: z.array(z.object({
    name: z.string(),
    description: z.string(),
    input: z.record(z.any()),
    output: z.record(z.any()).optional()
  })).describe('Usage examples'),
  authentication: z.object({
    required: z.boolean(),
    permissions: z.array(z.string()),
    methods: z.array(z.string()),
    userAuthenticated: z.boolean().optional(),
    userPermissions: z.array(z.string()).optional()
  }).describe('Authentication requirements, methods, and user status'),
  rateLimiting: z.object({
    requestsPerMinute: z.number().optional(),
    requestsPerHour: z.number().optional(),
    notes: z.string().optional()
  }).describe('Rate limiting information'),
  pagination: z.object({
    supported: z.boolean(),
    parameters: z.array(z.string()).optional(),
    responseFormat: z.string().optional()
  }).describe('Pagination support details')
});

/**
 * Get ID tool implementation
 */
export class GetIdTool {
  private vectorDatabase: VectorDatabase;
  private serverDetector: ServerDetector;
  private toolsIntegration: BitbucketToolsIntegration;

  constructor(
    vectorDatabase: VectorDatabase,
    serverDetector: ServerDetector,
    toolsIntegration: BitbucketToolsIntegration
  ) {
    this.vectorDatabase = vectorDatabase;
    this.serverDetector = serverDetector;
    this.toolsIntegration = toolsIntegration;
  }

  /**
   * Get the MCP tool definition
   */
  getTool(): Tool {
    return {
      name: 'get-id',
      description: 'Retrieve detailed schema and documentation for specific Bitbucket API operation. Get complete operation details including input/output schemas, parameters, examples, and authentication requirements.',
      inputSchema: {
        type: 'object',
        properties: {
          endpoint_id: {
            type: 'string',
            description: 'Internal operation ID from search-ids results (e.g., "bitbucket.list-repos", "bitbucket.create-pr")'
          }
        },
        required: ['endpoint_id']
      }
    };
  }

  /**
   * Get detailed operation information
   */
  async execute(params: {
    endpoint_id: string;
  }, userSession?: UserSession): Promise<{
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    serverType: 'datacenter' | 'cloud';
    inputSchema: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
    outputSchema: {
      type: string;
      properties: Record<string, any>;
    };
    parameters: {
      required: Array<{
        name: string;
        type: string;
        description: string;
      }>;
      optional: Array<{
        name: string;
        type: string;
        description: string;
        default?: any;
      }>;
    };
    examples: Array<{
      name: string;
      description: string;
      input: Record<string, any>;
      output?: Record<string, any>;
    }>;
    authentication: {
      required: boolean;
      permissions: string[];
      methods: string[];
    };
    rateLimiting: {
      requestsPerMinute?: number;
      requestsPerHour?: number;
      notes?: string;
    };
    pagination: {
      supported: boolean;
      parameters?: string[];
      responseFormat?: string;
    };
  }> {
    // Validate input
    const validatedParams = z.object({
      endpoint_id: z.string().min(1)
    }).parse(params);

    const { endpoint_id } = validatedParams;

    // Get server information for compatibility checking
    const serverInfo = await this.serverDetector.detectServer();

    // Get operation details from vector database
    const operationDetails = await this.vectorDatabase.getOperationDetails(endpoint_id);

    if (!operationDetails) {
      throw new Error(`Operation not found: ${endpoint_id}`);
    }

    // Check compatibility with current server
    if (operationDetails.serverType !== serverInfo.type) {
      throw new Error(`Operation ${endpoint_id} is not compatible with ${serverInfo.type} server type`);
    }

    if (operationDetails.version && !this.isVersionCompatible(operationDetails.version, serverInfo.version)) {
      throw new Error(`Operation ${endpoint_id} requires version ${operationDetails.version} or higher`);
    }

    // Check user permissions if authentication is required
    if (operationDetails.authentication?.required) {
      if (!userSession) {
        throw new Error(`Operation ${endpoint_id} requires authentication`);
      }

      if (!this.checkUserPermissions(userSession, operationDetails.authentication)) {
        throw new Error(`User does not have required permissions for operation ${endpoint_id}`);
      }
    }

    // Get detailed schema from tools integration
    const schemaDetails = await this.toolsIntegration.getOperationSchema(endpoint_id);

    // Get authentication context
    const authContext = await this.toolsIntegration.getAuthenticationContext();

    return {
      id: operationDetails.id,
      name: operationDetails.name,
      description: operationDetails.description,
      category: operationDetails.category,
      version: operationDetails.version,
      serverType: operationDetails.serverType,
      inputSchema: schemaDetails.inputSchema,
      outputSchema: schemaDetails.outputSchema,
      parameters: {
        required: schemaDetails.parameters.required,
        optional: schemaDetails.parameters.optional
      },
      examples: operationDetails.examples || [],
      authentication: {
        required: operationDetails.authentication.required,
        permissions: operationDetails.authentication.permissions,
        methods: authContext.availableMethods,
        userAuthenticated: !!userSession,
        userPermissions: userSession?.permissions || []
      },
      rateLimiting: operationDetails.rateLimiting || {},
      pagination: operationDetails.pagination || { supported: false }
    };
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
   * Check if user has required permissions for an operation
   */
  private checkUserPermissions(userSession: UserSession, authInfo: { required: boolean; permissions: string[] }): boolean {
    // If authentication is not required, user can access
    if (!authInfo.required) {
      return true;
    }

    // If no permissions required, authenticated user can access
    if (!authInfo.permissions || authInfo.permissions.length === 0) {
      return true;
    }

    // Check if user has any of the required permissions
    const userPermissions = userSession.permissions || [];

    // Check direct permissions
    const hasRequiredPermission = authInfo.permissions.some((permission: string) =>
      userPermissions.includes(permission)
    );

    return hasRequiredPermission;
  }
}
