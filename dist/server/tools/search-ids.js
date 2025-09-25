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
import { z } from 'zod';
/**
 * Pagination parameters schema
 */
const PaginationParamsSchema = z.object({
    page: z.number().min(1).default(1).describe('Page number (1-based)'),
    limit: z.number().min(1).max(50).default(10).describe('Items per page (max 50)')
});
/**
 * Endpoint summary schema
 */
const EndpointSummarySchema = z.object({
    id: z.string().describe('Internal operation ID'),
    name: z.string().describe('Human-readable operation name'),
    description: z.string().describe('Short description of the operation'),
    category: z.string().describe('Operation category (e.g., repository, pull-request)'),
    version: z.string().describe('Bitbucket version compatibility'),
    serverType: z.enum(['datacenter', 'cloud']).describe('Server type compatibility'),
    parameters: z.array(z.string()).describe('Key parameter hints'),
    authentication: z.object({
        required: z.boolean(),
        permissions: z.array(z.string()),
        userCanAccess: z.boolean().optional(),
        userPermissions: z.array(z.string()).optional()
    }).describe('Authentication requirements and user access status')
});
/**
 * Paginated response schema
 */
const PaginatedResponseSchema = z.object({
    items: z.array(EndpointSummarySchema),
    pagination: z.object({
        current_page: z.number(),
        total_pages: z.number(),
        has_next: z.boolean(),
        has_previous: z.boolean(),
        total_count: z.number().optional()
    }),
    has_more: z.boolean()
});
/**
 * Search IDs tool implementation
 */
export class SearchIdsTool {
    vectorDatabase;
    serverDetector;
    toolsIntegration;
    constructor(vectorDatabase, serverDetector, toolsIntegration) {
        this.vectorDatabase = vectorDatabase;
        this.serverDetector = serverDetector;
        this.toolsIntegration = toolsIntegration;
    }
    /**
     * Get the MCP tool definition
     */
    getTool() {
        return {
            name: 'search-ids',
            description: 'Semantic search across Bitbucket API operations and documentation. Find operations by natural language query with server type/version filtering.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Natural language query describing desired Bitbucket functionality (e.g., "list repositories", "create pull request", "manage users")'
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
                                maximum: 50,
                                default: 10,
                                description: 'Items per page (max 50)'
                            }
                        },
                        description: 'Pagination parameters'
                    }
                },
                required: ['query']
            }
        };
    }
    /**
     * Execute semantic search
     */
    async execute(params, userSession) {
        // Validate input
        const validatedParams = z.object({
            query: z.string().min(1),
            pagination: PaginationParamsSchema.optional()
        }).parse(params);
        const { query, pagination = {} } = validatedParams;
        const { page = 1, limit = 10 } = pagination;
        // Get server information for filtering
        const serverInfo = await this.serverDetector.detectServer();
        // Build search filters including authentication context
        const searchFilters = {
            serverType: serverInfo.type,
            version: serverInfo.version
        };
        // Add user-specific filters if authenticated
        if (userSession) {
            searchFilters.userPermissions = userSession.permissions;
        }
        // Perform semantic search with server type/version and user filtering
        const searchResults = await this.vectorDatabase.search({
            query,
            filters: searchFilters,
            limit,
            offset: (page - 1) * limit
        });
        // Transform results to endpoint summaries with user-specific authentication info
        const items = searchResults.results.map(result => {
            const authInfo = result.metadata.authentication || { required: false, permissions: [] };
            const userCanAccess = userSession ?
                this.checkUserAccess(userSession, authInfo) :
                !authInfo.required;
            return {
                id: result.metadata.operationId,
                name: result.metadata.name,
                description: result.metadata.description,
                category: result.metadata.category,
                version: result.metadata.version,
                serverType: result.metadata.serverType,
                parameters: result.metadata.parameters || [],
                authentication: {
                    required: authInfo.required || false,
                    permissions: authInfo.permissions || [],
                    userCanAccess,
                    userPermissions: userSession?.permissions || []
                }
            };
        });
        // Calculate pagination metadata
        const totalPages = Math.ceil(searchResults.total / limit);
        const hasNext = page < totalPages;
        const hasPrevious = page > 1;
        return {
            items,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                has_next: hasNext,
                has_previous: hasPrevious,
                total_count: searchResults.total
            },
            has_more: hasNext
        };
    }
    /**
     * Check if user has access to an operation based on authentication requirements
     */
    checkUserAccess(userSession, authInfo) {
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
        const hasDirectPermission = authInfo.permissions.some((permission) => userPermissions.includes(permission));
        return hasDirectPermission;
    }
}
//# sourceMappingURL=search-ids.js.map