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
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BitbucketToolsIntegration } from '../auth/bitbucket-tools-integration.js';
import { ServerDetector } from '../services/server-detector';
import { UserSession } from '../../types/auth.js';
/**
 * Call ID tool implementation
 */
export declare class CallIdTool {
    private toolsIntegration;
    private serverDetector;
    constructor(toolsIntegration: BitbucketToolsIntegration, serverDetector: ServerDetector);
    /**
     * Get the MCP tool definition
     */
    getTool(): Tool;
    /**
     * Execute Bitbucket API operation
     */
    execute(params: {
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
    }>;
    /**
     * Validate operation exists and is compatible with current server
     */
    private validateOperation;
    /**
     * Build pagination parameters for Bitbucket API
     */
    private buildPaginationParams;
    /**
     * Check if operation version is compatible with server version
     */
    private isVersionCompatible;
    /**
     * Validate authentication requirements for operation execution
     */
    private validateAuthentication;
}
//# sourceMappingURL=call-id.d.ts.map