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
import { Database } from 'sqlite-vec';
import path from 'path';
import fs from 'fs';
/**
 * Vector database service implementation
 */
export class VectorDatabase {
    db = null;
    dbPath;
    initialized = false;
    constructor(dataDir = './data/vectors') {
        this.dbPath = path.join(dataDir, 'bitbucket.db');
    }
    /**
     * Initialize the vector database
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            // Initialize SQLite database with vector extension
            this.db = new Database(this.dbPath);
            // Enable vector extension
            await this.db.exec('SELECT sqlite_extension("sqlite-vec")');
            // Create tables if they don't exist
            await this.createTables();
            // Load initial data if database is empty
            const count = await this.getOperationCount();
            if (count === 0) {
                await this.loadInitialData();
            }
            this.initialized = true;
        }
        catch (error) {
            throw new Error(`Failed to initialize vector database: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Create database tables
     */
    async createTables() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        // Create operations table
        await this.db.exec(`
      CREATE TABLE IF NOT EXISTS operations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        version TEXT NOT NULL,
        server_type TEXT NOT NULL,
        parameters TEXT,
        authentication TEXT,
        examples TEXT,
        rate_limiting TEXT,
        pagination TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Create vector table for embeddings
        await this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS operation_embeddings USING vec0(
        embedding float[384],
        operation_id TEXT
      )
    `);
        // Create indexes
        await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_operations_category ON operations(category);
      CREATE INDEX IF NOT EXISTS idx_operations_server_type ON operations(server_type);
      CREATE INDEX IF NOT EXISTS idx_operations_version ON operations(version);
    `);
    }
    /**
     * Load initial operation data
     */
    async loadInitialData() {
        // This would load all Bitbucket API operations from a predefined dataset
        // For now, we'll create a minimal set of operations
        const operations = [
            {
                id: 'bitbucket.list-repos',
                name: 'List Repositories',
                description: 'List repositories in a project or across all projects',
                category: 'repository',
                version: '7.16',
                serverType: 'datacenter',
                parameters: ['projectKey'],
                authentication: {
                    required: true,
                    permissions: ['REPO_READ']
                }
            },
            {
                id: 'bitbucket.create-repo',
                name: 'Create Repository',
                description: 'Create a new repository in a project',
                category: 'repository',
                version: '7.16',
                serverType: 'datacenter',
                parameters: ['projectKey', 'name'],
                authentication: {
                    required: true,
                    permissions: ['REPO_ADMIN']
                }
            },
            {
                id: 'bitbucket.list-pull-requests',
                name: 'List Pull Requests',
                description: 'List pull requests in a repository',
                category: 'pull-request',
                version: '7.16',
                serverType: 'datacenter',
                parameters: ['projectKey', 'repositorySlug'],
                authentication: {
                    required: true,
                    permissions: ['REPO_READ']
                }
            }
        ];
        for (const operation of operations) {
            await this.addOperation(operation);
        }
    }
    /**
     * Add operation to database
     */
    async addOperation(operation) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const stmt = await this.db.prepare(`
      INSERT OR REPLACE INTO operations (
        id, name, description, category, version, server_type,
        parameters, authentication, examples, rate_limiting, pagination
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        await stmt.run([
            operation.id,
            operation.name,
            operation.description,
            operation.category,
            operation.version,
            operation.serverType,
            JSON.stringify(operation.parameters || []),
            JSON.stringify(operation.authentication || {}),
            JSON.stringify(operation.examples || []),
            JSON.stringify(operation.rateLimiting || {}),
            JSON.stringify(operation.pagination || {})
        ]);
        await stmt.finalize();
        // Generate and store embedding
        await this.generateAndStoreEmbedding(operation);
    }
    /**
     * Generate and store embedding for operation
     */
    async generateAndStoreEmbedding(operation) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        // Generate embedding from operation text
        const text = `${operation.name} ${operation.description} ${operation.category}`;
        const embedding = await this.generateEmbedding(text);
        const stmt = await this.db.prepare(`
      INSERT OR REPLACE INTO operation_embeddings (embedding, operation_id)
      VALUES (?, ?)
    `);
        await stmt.run([JSON.stringify(embedding), operation.id]);
        await stmt.finalize();
    }
    /**
     * Generate embedding for text (placeholder implementation)
     */
    async generateEmbedding(text) {
        // In production, this would use a proper embedding model
        // For now, return a placeholder embedding
        const embedding = new Array(384).fill(0);
        const hash = this.simpleHash(text);
        for (let i = 0; i < 384; i++) {
            embedding[i] = Math.sin(hash + i) * 0.1;
        }
        return embedding;
    }
    /**
     * Simple hash function for placeholder embeddings
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }
    /**
     * Search operations using semantic similarity
     */
    async search(options) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const { query, filters = {}, limit = 10, offset = 0 } = options;
        // Generate query embedding
        const queryEmbedding = await this.generateEmbedding(query);
        // Build search query with filters
        let whereClause = '1=1';
        const params = [JSON.stringify(queryEmbedding)];
        if (filters.serverType) {
            whereClause += ' AND o.server_type = ?';
            params.push(filters.serverType);
        }
        if (filters.version) {
            whereClause += ' AND o.version <= ?';
            params.push(filters.version);
        }
        if (filters.category) {
            whereClause += ' AND o.category = ?';
            params.push(filters.category);
        }
        // Perform vector search
        const searchQuery = `
      SELECT 
        o.id,
        o.name,
        o.description,
        o.category,
        o.version,
        o.server_type,
        o.parameters,
        o.authentication,
        o.examples,
        o.rate_limiting,
        o.pagination,
        vec_distance_cosine(e.embedding, ?) as distance
      FROM operations o
      JOIN operation_embeddings e ON o.id = e.operation_id
      WHERE ${whereClause}
      ORDER BY distance ASC
      LIMIT ? OFFSET ?
    `;
        const stmt = await this.db.prepare(searchQuery);
        const rows = await stmt.all([...params, limit, offset]);
        await stmt.finalize();
        // Get total count
        const countQuery = `
      SELECT COUNT(*) as total
      FROM operations o
      WHERE ${whereClause}
    `;
        const countStmt = await this.db.prepare(countQuery);
        const countResult = await countStmt.get(params);
        await countStmt.finalize();
        const total = countResult?.total || 0;
        // Transform results
        const results = rows.map((row) => ({
            id: row.id,
            score: 1 - row.distance, // Convert distance to similarity score
            metadata: {
                operationId: row.id,
                name: row.name,
                description: row.description,
                category: row.category,
                version: row.version,
                serverType: row.server_type,
                parameters: JSON.parse(row.parameters || '[]'),
                authentication: JSON.parse(row.authentication || '{}'),
                examples: JSON.parse(row.examples || '[]'),
                rateLimiting: JSON.parse(row.rate_limiting || '{}'),
                pagination: JSON.parse(row.pagination || '{}')
            }
        }));
        return {
            results,
            total,
            query,
            filters
        };
    }
    /**
     * Get operation details by ID
     */
    async getOperationDetails(operationId) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const stmt = await this.db.prepare(`
      SELECT * FROM operations WHERE id = ?
    `);
        const row = await stmt.get(operationId);
        await stmt.finalize();
        if (!row) {
            return null;
        }
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            category: row.category,
            version: row.version,
            serverType: row.server_type,
            parameters: JSON.parse(row.parameters || '[]'),
            authentication: JSON.parse(row.authentication || '{}'),
            examples: JSON.parse(row.examples || '[]'),
            rateLimiting: JSON.parse(row.rate_limiting || '{}'),
            pagination: JSON.parse(row.pagination || '{}')
        };
    }
    /**
     * Get total number of operations
     */
    async getOperationCount() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const stmt = await this.db.prepare('SELECT COUNT(*) as count FROM operations');
        const result = await stmt.get();
        await stmt.finalize();
        return result?.count || 0;
    }
    /**
     * Close database connection
     */
    async close() {
        if (this.db) {
            await this.db.close();
            this.db = null;
            this.initialized = false;
        }
    }
}
//# sourceMappingURL=vector-database.js.map