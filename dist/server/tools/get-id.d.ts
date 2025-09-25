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
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BitbucketToolsIntegration } from '../auth/bitbucket-tools-integration.js';
import { VectorDatabase } from '../services/vector-database.js';
import { ServerDetector } from '../services/server-detector';
import { UserSession } from '../../types/auth.js';
/**
 * Get ID tool implementation
 */
export declare class GetIdTool {
    private vectorDatabase;
    private serverDetector;
    private toolsIntegration;
    constructor(vectorDatabase: VectorDatabase, serverDetector: ServerDetector, toolsIntegration: BitbucketToolsIntegration);
    /**
     * Get the MCP tool definition
     */
    getTool(): Tool;
    /**
     * Get detailed operation information
     */
    execute(params: {
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
    }>;
    /**
     * Check if operation version is compatible with server version
     */
    private isVersionCompatible;
    /**
     * Check if user has required permissions for an operation
     */
    private checkUserPermissions;
}
//# sourceMappingURL=get-id.d.ts.map