/**
 * @fileoverview Vector database service for semantic search
 *
 * This service implements the vector database requirements from the Constitution.
 * It provides semantic search across Bitbucket API operations using embeddings
 * stored in a file-based embedded vector database.
 *
 * @author Bitbucket MCP Server
 * @version 1.0.0
 * @license LGPL-3.0
 */
/**
 * Search result interface
 */
export interface SearchResult {
    id: string;
    score: number;
    metadata: {
        operationId: string;
        name: string;
        description: string;
        category: string;
        version: string;
        serverType: 'datacenter' | 'cloud';
        parameters?: string[];
        authentication?: {
            required: boolean;
            permissions: string[];
        };
        examples?: Array<{
            name: string;
            description: string;
            input: Record<string, any>;
            output?: Record<string, any>;
        }>;
        rateLimiting?: {
            requestsPerMinute?: number;
            requestsPerHour?: number;
            notes?: string;
        };
        pagination?: {
            supported: boolean;
            parameters?: string[];
            responseFormat?: string;
        };
    };
}
/**
 * Search filters interface
 */
export interface SearchFilters {
    serverType?: 'datacenter' | 'cloud';
    version?: string;
    category?: string;
}
/**
 * Search options interface
 */
export interface SearchOptions {
    query: string;
    filters?: SearchFilters;
    limit?: number;
    offset?: number;
}
/**
 * Search response interface
 */
export interface SearchResponse {
    results: SearchResult[];
    total: number;
    query: string;
    filters?: SearchFilters;
}
/**
 * Operation details interface
 */
export interface OperationDetails {
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    serverType: 'datacenter' | 'cloud';
    parameters?: string[];
    authentication?: {
        required: boolean;
        permissions: string[];
    };
    examples?: Array<{
        name: string;
        description: string;
        input: Record<string, any>;
        output?: Record<string, any>;
    }>;
    rateLimiting?: {
        requestsPerMinute?: number;
        requestsPerHour?: number;
        notes?: string;
    };
    pagination?: {
        supported: boolean;
        parameters?: string[];
        responseFormat?: string;
    };
}
/**
 * Vector database service implementation
 */
export declare class VectorDatabase {
    private db;
    private dbPath;
    private initialized;
    constructor(dataDir?: string);
    /**
     * Initialize the vector database
     */
    initialize(): Promise<void>;
    /**
     * Create database tables
     */
    private createTables;
    /**
     * Load initial operation data
     */
    private loadInitialData;
    /**
     * Add operation to database
     */
    addOperation(operation: OperationDetails): Promise<void>;
    /**
     * Generate and store embedding for operation
     */
    private generateAndStoreEmbedding;
    /**
     * Generate embedding for text (placeholder implementation)
     */
    private generateEmbedding;
    /**
     * Simple hash function for placeholder embeddings
     */
    private simpleHash;
    /**
     * Search operations using semantic similarity
     */
    search(options: SearchOptions): Promise<SearchResponse>;
    /**
     * Get operation details by ID
     */
    getOperationDetails(operationId: string): Promise<OperationDetails | null>;
    /**
     * Get total number of operations
     */
    getOperationCount(): Promise<number>;
    /**
     * Close database connection
     */
    close(): Promise<void>;
}
//# sourceMappingURL=vector-database.d.ts.map