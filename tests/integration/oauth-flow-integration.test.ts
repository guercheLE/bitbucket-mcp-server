/**
 * OAuth Flow Integration Tests
 * 
 * Integration tests for OAuth authentication flows that focus on component
 * interactions and system integration points. These tests verify that OAuth
 * components work correctly together with other system components.
 * 
 * Tests cover:
 * - OAuth application registration integration
 * - Token storage and session management integration
 * - Error handling across component boundaries
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthenticationManager } from '../../src/server/auth/authentication-manager';
import { BitbucketApiClient } from '../../src/server/auth/bitbucket-api-client';
import { OAuthManager } from '../../src/server/auth/oauth-manager';
import { SessionManager } from '../../src/server/auth/session-manager';
import { MemoryTokenStorage } from '../../src/server/auth/token-storage';
import {
    AuthenticationConfig,
    OAuthApplicationRequest
} from '../../src/types/auth';

// Mock external dependencies
jest.mock('../../src/server/auth/bitbucket-api-client');
const MockedBitbucketApiClient = BitbucketApiClient as jest.MockedClass<typeof BitbucketApiClient>;

describe('OAuth Flow Integration Tests', () => {
    let oauthManager: OAuthManager;
    let sessionManager: SessionManager;
    let authManager: AuthenticationManager;
    let mockBitbucketApiClient: jest.Mocked<BitbucketApiClient>;
    let tokenStorage: MemoryTokenStorage;
    let testConfig: AuthenticationConfig;

    beforeEach(() => {
        // Setup test configuration
        testConfig = {
            defaultApplication: {
                name: 'Test MCP Server',
                description: 'OAuth application for MCP server testing',
                scopes: ['repository:read', 'repository:write']
            },
            tokens: {
                accessTokenLifetime: 3600000, // 1 hour
                refreshTokenLifetime: 86400000, // 24 hours
                refreshThreshold: 300000 // 5 minutes
            },
            sessions: {
                maxConcurrentSessions: 10,
                sessionTimeout: 3600000, // 1 hour
                activityTimeout: 1800000 // 30 minutes
            },
            security: {
                encryptTokens: false, // Disabled for testing
                requireHttps: false, // Disabled for testing
                csrfProtection: true,
                rateLimitRequests: false // Disabled for testing
            },
            storage: {
                type: 'memory' as const,
                encryptionKey: 'test-encryption-key-32-chars-long'
            },
            logging: {
                logAuthEvents: true,
                logTokenUsage: true,
                logSecurityEvents: true
            }
        };

        // Setup mock API client
        mockBitbucketApiClient = {
            exchangeCodeForToken: jest.fn(),
            refreshAccessToken: jest.fn(),
            getUserInfo: jest.fn(),
            testConnectivity: jest.fn()
        } as any;

        MockedBitbucketApiClient.mockImplementation(() => mockBitbucketApiClient);

        // Create service instances
        tokenStorage = new MemoryTokenStorage(testConfig);
        oauthManager = new OAuthManager(testConfig);
        authManager = new AuthenticationManager(testConfig);
    });

    afterEach(() => {
        // Clean up timers and resources
        if (tokenStorage) {
            tokenStorage.destroy();
        }

        // Clear any running timers
        jest.clearAllTimers();
        jest.clearAllMocks();
    });

    describe('OAuth Application Registration Integration', () => {
        it('should integrate OAuth application registration with authentication manager', async () => {
            // Create OAuth application request
            const appRequest: OAuthApplicationRequest = {
                name: 'Test MCP Server',
                description: 'OAuth application for MCP server testing',
                redirectUri: 'http://localhost:3000/auth/callback',
                instanceType: 'cloud',
                baseUrl: 'https://api.bitbucket.org/2.0',
                scopes: ['repository:read', 'repository:write']
            };

            // Register application through OAuth manager
            const registrationResult = await oauthManager.registerApplication(appRequest);

            expect(registrationResult.success).toBe(true);
            expect(registrationResult.data).toBeDefined();

            if (registrationResult.data) {
                expect(registrationResult.data.clientId).toBeDefined();
                expect(registrationResult.data.clientSecret).toBeDefined();
                expect(registrationResult.data.scopes).toEqual(['repository:read', 'repository:write']);

                // Verify application can be retrieved
                const retrievedApp = await oauthManager.getApplication(registrationResult.data.id);
                expect(retrievedApp.success).toBe(true);
                expect(retrievedApp.data).toBeDefined();

                if (retrievedApp.data) {
                    expect(retrievedApp.data.name).toBe('Test MCP Server');
                }
            }
        });

        it('should handle OAuth authorization URL generation', async () => {
            // First register an application
            const appRequest: OAuthApplicationRequest = {
                name: 'Test MCP Server',
                description: 'OAuth application for MCP server testing',
                redirectUri: 'http://localhost:3000/auth/callback',
                instanceType: 'cloud',
                baseUrl: 'https://api.bitbucket.org/2.0'
            };

            const appResult = await oauthManager.registerApplication(appRequest);
            expect(appResult.success).toBe(true);

            if (appResult.data) {
                // Generate authorization URL
                const authRequest = {
                    applicationId: appResult.data.id,
                    state: 'test-state'
                };

                const authResult = await oauthManager.generateAuthorizationUrl(authRequest);
                expect(authResult.success).toBe(true);
                expect(authResult.data).toBeDefined();

                if (authResult.data) {
                    expect(authResult.data.authorizationUrl).toContain('site/oauth2/authorize');
                    expect(authResult.data.authorizationUrl).toContain(appResult.data.clientId);
                    expect(authResult.data.state).toBe('test-state');
                }
            }
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle OAuth application registration errors', async () => {
            const invalidAppRequest: OAuthApplicationRequest = {
                name: '', // Invalid empty name
                description: 'Test application',
                redirectUri: 'invalid-uri', // Invalid URI
                instanceType: 'cloud',
                baseUrl: 'https://api.bitbucket.org/2.0'
            };

            const result = await oauthManager.registerApplication(invalidAppRequest);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();

            if (result.error) {
                expect(result.error.code).toBe('invalid_request');
            }
        });

        it('should handle invalid authorization requests', async () => {
            const invalidAuthRequest = {
                applicationId: 'non-existent-app-id',
                state: 'test-state'
            };

            const result = await oauthManager.generateAuthorizationUrl(invalidAuthRequest);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();

            if (result.error) {
                expect(result.error.code).toBe('application_not_found');
            }
        });
    });

    describe('Component Integration Health Checks', () => {
        it('should verify all OAuth components are properly initialized', async () => {
            expect(oauthManager).toBeDefined();
            expect(authManager).toBeDefined();
            expect(tokenStorage).toBeDefined();
        });

        it('should handle concurrent OAuth operations', async () => {
            const promises = [];

            // Create multiple OAuth applications concurrently
            for (let i = 0; i < 3; i++) {
                const appRequest: OAuthApplicationRequest = {
                    name: `Concurrent Test App ${i}`,
                    description: `Test app ${i}`,
                    redirectUri: `http://localhost:300${i}/callback`,
                    instanceType: 'cloud',
                    baseUrl: 'https://api.bitbucket.org/2.0'
                };

                promises.push(oauthManager.registerApplication(appRequest));
            }

            const results = await Promise.all(promises);

            // Verify all applications were created successfully
            results.forEach((result, index) => {
                expect(result.success).toBe(true);
                if (result.data) {
                    expect(result.data.name).toBe(`Concurrent Test App ${index}`);
                }
            });

            // Verify all applications have unique IDs
            const ids = results.map(r => r.data?.id).filter(id => id !== undefined);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(3);
        });
    });
});