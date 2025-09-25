/**
 * @fileoverview Semantic search tool for Bitbucket API operations
 *
 * This tool implements the search-ids MCP tool as specified in the Constitution.
 * It provides semantic search across Bitbucket API operations and documentation
 * using a vector database for embedding search with server type/version filtering.
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
 * Search IDs tool implementation
 */
export declare class SearchIdsTool {
    private vectorDatabase;
    private serverDetector;
    private toolsIntegration;
    constructor(vectorDatabase: VectorDatabase, serverDetector: ServerDetector, toolsIntegration: BitbucketToolsIntegration);
    /**
     * Get the MCP tool definition
     */
    getTool(): Tool;
    /**
     * Execute semantic search
     */
    execute(params: {
        query: string;
        pagination?: {
            page?: number;
            limit?: number;
        };
    }, userSession?: UserSession): Promise<{
        items: Array<{
            id: string;
            name: string;
            description: string;
            category: string;
            version: string;
            serverType: 'datacenter' | 'cloud';
            parameters: string[];
            authentication: {
                required: boolean;
                permissions: string[];
            };
        }>;
        pagination: {
            current_page: number;
            total_pages: number;
            has_next: boolean;
            has_previous: boolean;
            total_count?: number;
        };
        has_more: boolean;
    }>;
    /**
     * Check if user has access to an operation based on authentication requirements
     */
    private checkUserAccess;
}
//# sourceMappingURL=search-ids.d.ts.map