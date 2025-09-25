/**
 * Mock Server Infrastructure for Testing
 * 
 * Provides a configurable mock Bitbucket API server for comprehensive testing
 * of the MCP server integration with Bitbucket APIs.
 * 
 * Features:
 * - Complete Bitbucket API endpoint simulation
 * - Configurable response patterns and data
 * - Authentication flow mocking
 * - Error simulation and edge cases
 * - Request/response logging and validation
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Mock server configuration schemas
export const MockServerConfigSchema = z.object({
    name: z.string().default('mock-bitbucket-server'),
    version: z.string().default('1.0.0'),
    port: z.number().optional().default(3001),
    baseUrl: z.string().optional().default('https://api.bitbucket.org/2.0'),
    enableAuth: z.boolean().default(true),
    enableLogging: z.boolean().default(true),
    responseDelay: z.number().default(0), // Milliseconds to simulate network delay
    errorRate: z.number().min(0).max(1).default(0), // Percentage of requests that should fail
    features: z.object({
        repositories: z.boolean().default(true),
        pullRequests: z.boolean().default(true),
        issues: z.boolean().default(true),
        pipelines: z.boolean().default(true),
        webhooks: z.boolean().default(true),
        users: z.boolean().default(true)
    }).default({})
});

export const MockEndpointConfigSchema = z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    path: z.string(),
    responseStatus: z.number().default(200),
    responseData: z.any().optional(),
    responseHeaders: z.record(z.string()).default({}),
    requiredAuth: z.boolean().default(false),
    requiredPermissions: z.array(z.string()).default([]),
    simulateError: z.boolean().default(false),
    errorType: z.enum(['network', 'auth', 'validation', 'server']).optional(),
    delay: z.number().default(0)
});

export const MockRequestSchema = z.object({
    method: z.string(),
    path: z.string(),
    query: z.record(z.any()).default({}),
    headers: z.record(z.string()).default({}),
    body: z.any().optional(),
    timestamp: z.date().default(() => new Date())
});

export const MockResponseSchema = z.object({
    status: z.number(),
    headers: z.record(z.string()).default({}),
    data: z.any().optional(),
    duration: z.number(),
    timestamp: z.date().default(() => new Date())
});

// Type definitions
export type MockServerConfig = z.infer<typeof MockServerConfigSchema>;
export type MockEndpointConfig = z.infer<typeof MockEndpointConfigSchema>;
export type MockRequest = z.infer<typeof MockRequestSchema>;
export type MockResponse = z.infer<typeof MockResponseSchema>;

/**
 * Mock Bitbucket API Server
 * 
 * Simulates Bitbucket API endpoints for testing purposes.
 * Provides configurable responses, error simulation, and request logging.
 */
export class MockBitbucketServer extends EventEmitter {
    private config: MockServerConfig;
    private endpoints: Map<string, MockEndpointConfig>;
    private requestHistory: MockRequest[];
    private responseHistory: MockResponse[];
    private isRunning: boolean;

    constructor(config: Partial<MockServerConfig> = {}) {
        super();
        this.config = MockServerConfigSchema.parse(config);
        this.endpoints = new Map();
        this.requestHistory = [];
        this.responseHistory = [];
        this.isRunning = false;

        this.setupDefaultEndpoints();
    }

    /**
     * Start the mock server
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            throw new Error('Mock server is already running');
        }

        this.isRunning = true;
        this.log('Mock Bitbucket server started', {
            baseUrl: this.config.baseUrl,
            features: this.config.features
        });
        this.emit('started');
    }

    /**
     * Stop the mock server
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            throw new Error('Mock server is not running');
        }

        this.isRunning = false;
        this.log('Mock Bitbucket server stopped');
        this.emit('stopped');
    }

    /**
     * Register a custom endpoint
     */
    registerEndpoint(key: string, config: Partial<MockEndpointConfig>): void {
        const validatedConfig = MockEndpointConfigSchema.parse(config);
        this.endpoints.set(key, validatedConfig);
        this.log('Endpoint registered', { key, method: config.method, path: config.path });
    }

    /**
     * Clear endpoints (for testing)
     */
    clearEndpoints(): void {
        this.endpoints.clear();
    }

    /**
     * Simulate an API request
     */
    async simulateRequest(request: Partial<MockRequest>): Promise<MockResponse> {
        if (!this.isRunning) {
            throw new Error('Mock server is not running');
        }

        const validatedRequest = MockRequestSchema.parse(request);
        const startTime = Date.now();

        // Record request
        this.requestHistory.push(validatedRequest);
        this.emit('request', validatedRequest);

        // Find matching endpoint
        const endpointKey = this.findMatchingEndpoint(validatedRequest);
        const endpoint = endpointKey ? this.endpoints.get(endpointKey) : null;

        // Simulate network delay
        const delay = endpoint?.delay || this.config.responseDelay;
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Check for global error simulation
        if (this.config.errorRate > 0 && Math.random() < this.config.errorRate) {
            return this.createErrorResponse(validatedRequest, startTime, 'random');
        }

        // Handle endpoint-specific error simulation
        if (endpoint?.simulateError) {
            return this.createErrorResponse(validatedRequest, startTime, endpoint.errorType || 'server');
        }

        // Generate successful response
        const response = this.createSuccessResponse(validatedRequest, endpoint, startTime);
        this.responseHistory.push(response);
        this.emit('response', response);

        return response;
    }

    /**
     * Get request history
     */
    getRequestHistory(): MockRequest[] {
        return [...this.requestHistory];
    }

    /**
     * Get response history
     */
    getResponseHistory(): MockResponse[] {
        return [...this.responseHistory];
    }

    /**
     * Clear request/response history
     */
    clearHistory(): void {
        this.requestHistory = [];
        this.responseHistory = [];
        this.log('Request/response history cleared');
    }

    /**
     * Get server statistics
     */
    getStats() {
        const totalRequests = this.requestHistory.length;
        const totalResponses = this.responseHistory.length;
        const errorResponses = this.responseHistory.filter(r => r.status >= 400).length;
        const successResponses = totalResponses - errorResponses;
        const averageResponseTime = totalResponses > 0
            ? this.responseHistory.reduce((sum, r) => sum + r.duration, 0) / totalResponses
            : 0;

        return {
            totalRequests,
            totalResponses,
            successResponses,
            errorResponses,
            successRate: totalResponses > 0 ? (successResponses / totalResponses) * 100 : 0,
            averageResponseTime,
            endpointsRegistered: this.endpoints.size,
            isRunning: this.isRunning
        };
    }

    /**
     * Setup default Bitbucket API endpoints
     */
    private setupDefaultEndpoints(): void {
        // User endpoints
        this.registerEndpoint('get-user', {
            method: 'GET',
            path: '/user',
            requiredAuth: true,
            responseData: {
                uuid: '{user-uuid}',
                username: 'testuser',
                display_name: 'Test User',
                account_id: 'test-account-id',
                links: {
                    self: { href: 'https://api.bitbucket.org/2.0/user' },
                    repositories: { href: 'https://api.bitbucket.org/2.0/repositories/testuser' }
                }
            }
        });

        // Repository endpoints
        this.registerEndpoint('list-repositories', {
            method: 'GET',
            path: '/repositories',
            requiredAuth: true,
            responseData: {
                pagelen: 10,
                values: [
                    {
                        uuid: '{repo-uuid}',
                        full_name: 'testuser/test-repo',
                        name: 'test-repo',
                        description: 'Test repository',
                        is_private: false,
                        created_on: '2024-01-01T00:00:00Z',
                        updated_on: '2024-01-01T00:00:00Z',
                        language: 'typescript',
                        size: 1024,
                        links: {
                            self: { href: 'https://api.bitbucket.org/2.0/repositories/testuser/test-repo' },
                            html: { href: 'https://bitbucket.org/testuser/test-repo' }
                        }
                    }
                ],
                page: 1,
                next: null
            }
        });

        // Pull request endpoints
        this.registerEndpoint('list-pull-requests', {
            method: 'GET',
            path: '/repositories/{workspace}/{repo_slug}/pullrequests',
            requiredAuth: true,
            responseData: {
                pagelen: 10,
                values: [
                    {
                        id: 1,
                        title: 'Test Pull Request',
                        description: 'This is a test pull request',
                        state: 'OPEN',
                        created_on: '2024-01-01T00:00:00Z',
                        updated_on: '2024-01-01T00:00:00Z',
                        source: {
                            branch: { name: 'feature/test' },
                            commit: { hash: 'abc123' }
                        },
                        destination: {
                            branch: { name: 'main' },
                            commit: { hash: 'def456' }
                        },
                        author: {
                            uuid: '{user-uuid}',
                            username: 'testuser',
                            display_name: 'Test User'
                        },
                        links: {
                            self: { href: 'https://api.bitbucket.org/2.0/repositories/testuser/test-repo/pullrequests/1' },
                            html: { href: 'https://bitbucket.org/testuser/test-repo/pull-requests/1' }
                        }
                    }
                ],
                page: 1,
                next: null
            }
        });

        // Issue endpoints
        this.registerEndpoint('list-issues', {
            method: 'GET',
            path: '/repositories/{workspace}/{repo_slug}/issues',
            requiredAuth: true,
            responseData: {
                pagelen: 10,
                values: [
                    {
                        id: 1,
                        title: 'Test Issue',
                        content: { raw: 'This is a test issue', markup: 'markdown' },
                        state: 'new',
                        kind: 'bug',
                        priority: 'major',
                        created_on: '2024-01-01T00:00:00Z',
                        updated_on: '2024-01-01T00:00:00Z',
                        reporter: {
                            uuid: '{user-uuid}',
                            username: 'testuser',
                            display_name: 'Test User'
                        },
                        links: {
                            self: { href: 'https://api.bitbucket.org/2.0/repositories/testuser/test-repo/issues/1' },
                            html: { href: 'https://bitbucket.org/testuser/test-repo/issues/1' }
                        }
                    }
                ],
                page: 1,
                next: null
            }
        });

        // Pipeline endpoints
        this.registerEndpoint('list-pipelines', {
            method: 'GET',
            path: '/repositories/{workspace}/{repo_slug}/pipelines',
            requiredAuth: true,
            responseData: {
                pagelen: 10,
                values: [
                    {
                        uuid: '{pipeline-uuid}',
                        build_number: 1,
                        state: { name: 'SUCCESSFUL' },
                        created_on: '2024-01-01T00:00:00Z',
                        completed_on: '2024-01-01T00:00:01Z',
                        target: {
                            ref_type: 'branch',
                            ref_name: 'main',
                            commit: { hash: 'abc123' }
                        },
                        trigger: { name: 'PUSH' },
                        links: {
                            self: { href: 'https://api.bitbucket.org/2.0/repositories/testuser/test-repo/pipelines/1' }
                        }
                    }
                ],
                page: 1,
                next: null
            }
        });

        this.log('Default endpoints registered', { count: this.endpoints.size });
    }

    /**
     * Find matching endpoint for a request
     */
    private findMatchingEndpoint(request: MockRequest): string | null {
        for (const [key, endpoint] of this.endpoints.entries()) {
            if (this.matchesEndpoint(request, endpoint)) {
                return key;
            }
        }
        return null;
    }

    /**
     * Check if request matches endpoint configuration
     */
    private matchesEndpoint(request: MockRequest, endpoint: MockEndpointConfig): boolean {
        // Method must match
        if (request.method.toLowerCase() !== endpoint.method.toLowerCase()) {
            return false;
        }

        // Path matching (supports basic path parameters)
        const requestPathSegments = request.path.split('/').filter(Boolean);
        const endpointPathSegments = endpoint.path.split('/').filter(Boolean);

        if (requestPathSegments.length !== endpointPathSegments.length) {
            return false;
        }

        for (let i = 0; i < requestPathSegments.length; i++) {
            const requestSegment = requestPathSegments[i];
            const endpointSegment = endpointPathSegments[i];

            // Skip path parameters (enclosed in {})
            if (endpointSegment.startsWith('{') && endpointSegment.endsWith('}')) {
                continue;
            }

            // Exact match required for non-parameter segments
            if (requestSegment !== endpointSegment) {
                return false;
            }
        }

        return true;
    }

    /**
     * Create successful response
     */
    private createSuccessResponse(
        request: MockRequest,
        endpoint: MockEndpointConfig | null | undefined,
        startTime: number
    ): MockResponse {
        const duration = Date.now() - startTime;
        const status = endpoint?.responseStatus || 200;
        const headers = {
            'Content-Type': 'application/json',
            ...endpoint?.responseHeaders
        };
        const data = endpoint?.responseData || { message: 'Success' };

        return {
            status,
            headers,
            data,
            duration,
            timestamp: new Date()
        };
    }

    /**
     * Create error response
     */
    private createErrorResponse(
        request: MockRequest,
        startTime: number,
        errorType: string
    ): MockResponse {
        const duration = Date.now() - startTime;

        const errorResponses = {
            network: {
                status: 503,
                data: { error: { message: 'Network timeout' } }
            },
            auth: {
                status: 401,
                data: { error: { message: 'Unauthorized' } }
            },
            validation: {
                status: 400,
                data: { error: { message: 'Bad request' } }
            },
            server: {
                status: 500,
                data: { error: { message: 'Internal server error' } }
            },
            random: {
                status: 500,
                data: { error: { message: 'Random server error' } }
            }
        };

        const errorConfig = errorResponses[errorType as keyof typeof errorResponses] || errorResponses.server;

        return {
            status: errorConfig.status,
            headers: { 'Content-Type': 'application/json' },
            data: errorConfig.data,
            duration,
            timestamp: new Date()
        };
    }

    /**
     * Log message with timestamp
     */
    private log(message: string, data?: any): void {
        if (this.config.enableLogging) {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] MockBitbucketServer: ${message}`, data || '');
        }
    }
}

/**
 * Mock Server Factory
 * 
 * Provides convenient factory methods for creating pre-configured mock servers
 */
export class MockServerFactory {
    /**
     * Create a standard mock server for general testing
     */
    static createStandard(overrides: Partial<MockServerConfig> = {}): MockBitbucketServer {
        const config = {
            name: 'standard-mock-server',
            enableAuth: true,
            enableLogging: false, // Disable logging for tests
            responseDelay: 0,
            errorRate: 0,
            features: {
                repositories: true,
                pullRequests: true,
                issues: true,
                pipelines: true,
                webhooks: true,
                users: true
            },
            ...overrides
        };

        return new MockBitbucketServer(config);
    }

    /**
     * Create a mock server that simulates network issues
     */
    static createWithNetworkIssues(overrides: Partial<MockServerConfig> = {}): MockBitbucketServer {
        const config = {
            name: 'network-issues-mock-server',
            enableAuth: true,
            enableLogging: false,
            responseDelay: 100, // 100ms delay
            errorRate: 0.2, // 20% error rate
            ...overrides
        };

        return new MockBitbucketServer(config);
    }

    /**
     * Create a mock server without authentication for basic testing
     */
    static createNoAuth(overrides: Partial<MockServerConfig> = {}): MockBitbucketServer {
        const config = {
            name: 'no-auth-mock-server',
            enableAuth: false,
            enableLogging: false,
            responseDelay: 0,
            errorRate: 0,
            ...overrides
        };

        const server = new MockBitbucketServer(config);

        // Override auth requirements for all endpoints
        server.registerEndpoint('get-user', {
            method: 'GET',
            path: '/user',
            requiredAuth: false,
            responseData: { username: 'testuser', display_name: 'Test User' }
        });

        return server;
    }

    /**
     * Create minimal mock server for unit tests
     */
    static createMinimal(overrides: Partial<MockServerConfig> = {}): MockBitbucketServer {
        const config = {
            name: 'minimal-mock-server',
            enableAuth: false,
            enableLogging: false,
            responseDelay: 0,
            errorRate: 0,
            features: {
                repositories: false,
                pullRequests: false,
                issues: false,
                pipelines: false,
                webhooks: false,
                users: true
            },
            ...overrides
        };

        const server = new MockBitbucketServer(config);

        // Clear default endpoints and add only basic ping
        server.clearEndpoints();
        server.registerEndpoint('ping', {
            method: 'GET',
            path: '/ping',
            responseData: { pong: true }
        });

        return server;
    }
}

/**
 * Mock Server Test Utilities
 * 
 * Convenience methods for testing with mock servers
 */
export class MockServerTestUtils {
    /**
     * Run a test with a mock server
     */
    static async withMockServer<T>(
        serverFactory: () => MockBitbucketServer,
        testFn: (server: MockBitbucketServer) => Promise<T>
    ): Promise<T> {
        const server = serverFactory();

        try {
            await server.start();
            const result = await testFn(server);
            return result;
        } finally {
            await server.stop();
        }
    }

    /**
     * Create a request validator
     */
    static createRequestValidator(expectedRequests: Partial<MockRequest>[]): (server: MockBitbucketServer) => boolean {
        return (server: MockBitbucketServer): boolean => {
            const history = server.getRequestHistory();

            if (history.length !== expectedRequests.length) {
                return false;
            }

            for (let i = 0; i < expectedRequests.length; i++) {
                const expected = expectedRequests[i];
                const actual = history[i];

                if (expected.method && expected.method !== actual.method) {
                    return false;
                }
                if (expected.path && expected.path !== actual.path) {
                    return false;
                }
            }

            return true;
        };
    }

    /**
     * Wait for specific number of requests
     */
    static async waitForRequests(server: MockBitbucketServer, count: number, timeoutMs: number = 1000): Promise<boolean> {
        return new Promise((resolve) => {
            const startTime = Date.now();

            const check = () => {
                if (server.getRequestHistory().length >= count) {
                    resolve(true);
                    return;
                }

                if (Date.now() - startTime > timeoutMs) {
                    resolve(false);
                    return;
                }

                setTimeout(check, 10);
            };

            check();
        });
    }

    /**
     * Get response statistics
     */
    static getResponseStats(server: MockBitbucketServer) {
        const responses = server.getResponseHistory();
        const statusCodes = responses.reduce((acc, response) => {
            acc[response.status] = (acc[response.status] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        return {
            total: responses.length,
            statusCodes,
            averageResponseTime: responses.length > 0
                ? responses.reduce((sum, r) => sum + r.duration, 0) / responses.length
                : 0,
            maxResponseTime: responses.length > 0
                ? Math.max(...responses.map(r => r.duration))
                : 0,
            minResponseTime: responses.length > 0
                ? Math.min(...responses.map(r => r.duration))
                : 0
        };
    }
}