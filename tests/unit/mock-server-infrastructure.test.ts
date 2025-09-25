/**
 * Mock Server Infrastructure Tests
 * 
 * Validates the mock Bitbucket server functionality for testing purposes
 */

import { afterEach, describe, expect, test } from '@jest/globals';
import {
    MockBitbucketServer,
    MockServerFactory,
    MockServerTestUtils
} from '../utils/mock-server-infrastructure';

describe('Mock Server Infrastructure', () => {
    let server: MockBitbucketServer;

    afterEach(async () => {
        if (server) {
            await server.stop().catch(() => { }); // Ignore errors if already stopped
        }
    });

    describe('MockBitbucketServer', () => {
        test('should create server with default configuration', () => {
            server = new MockBitbucketServer();
            expect(server).toBeDefined();

            const stats = server.getStats();
            expect(stats.isRunning).toBe(false);
            expect(stats.endpointsRegistered).toBeGreaterThan(0);
        });

        test('should start and stop server', async () => {
            server = new MockBitbucketServer();

            // Start server
            await server.start();
            expect(server.getStats().isRunning).toBe(true);

            // Stop server
            await server.stop();
            expect(server.getStats().isRunning).toBe(false);
        });

        test('should simulate API requests', async () => {
            server = new MockBitbucketServer();
            await server.start();

            const response = await server.simulateRequest({
                method: 'GET',
                path: '/user'
            });

            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            expect(response.data.username).toBe('testuser');
            expect(response.duration).toBeGreaterThanOrEqual(0);
        });

        test('should track request history', async () => {
            server = new MockBitbucketServer();
            await server.start();

            await server.simulateRequest({ method: 'GET', path: '/user' });
            await server.simulateRequest({ method: 'GET', path: '/repositories' });

            const history = server.getRequestHistory();
            expect(history).toHaveLength(2);
            expect(history[0].path).toBe('/user');
            expect(history[1].path).toBe('/repositories');
        });

        test('should support custom endpoints', async () => {
            server = new MockBitbucketServer();
            await server.start();

            server.registerEndpoint('custom-test', {
                method: 'GET',
                path: '/custom',
                responseData: { message: 'Custom endpoint' }
            });

            const response = await server.simulateRequest({
                method: 'GET',
                path: '/custom'
            });

            expect(response.status).toBe(200);
            expect(response.data.message).toBe('Custom endpoint');
        });

        test('should simulate errors when configured', async () => {
            server = new MockBitbucketServer();
            await server.start();

            server.registerEndpoint('error-test', {
                method: 'GET',
                path: '/error',
                simulateError: true,
                errorType: 'server'
            });

            const response = await server.simulateRequest({
                method: 'GET',
                path: '/error'
            });

            expect(response.status).toBe(500);
            expect(response.data.error).toBeDefined();
        });

        test('should provide response statistics', async () => {
            server = new MockBitbucketServer();
            await server.start();

            // Make some requests
            await server.simulateRequest({ method: 'GET', path: '/user' });
            await server.simulateRequest({ method: 'GET', path: '/repositories' });

            const stats = server.getStats();
            expect(stats.totalRequests).toBe(2);
            expect(stats.totalResponses).toBe(2);
            expect(stats.successResponses).toBe(2);
            expect(stats.errorResponses).toBe(0);
            expect(stats.successRate).toBe(100);
        });

        test('should clear history', async () => {
            server = new MockBitbucketServer();
            await server.start();

            await server.simulateRequest({ method: 'GET', path: '/user' });
            expect(server.getRequestHistory()).toHaveLength(1);

            server.clearHistory();
            expect(server.getRequestHistory()).toHaveLength(0);
            expect(server.getResponseHistory()).toHaveLength(0);
        });
    });

    describe('MockServerFactory', () => {
        test('should create standard server', () => {
            server = MockServerFactory.createStandard();
            expect(server).toBeDefined();

            const stats = server.getStats();
            expect(stats.endpointsRegistered).toBeGreaterThan(0);
        });

        test('should create server with network issues', () => {
            server = MockServerFactory.createWithNetworkIssues();
            expect(server).toBeDefined();
        });

        test('should create server without auth', () => {
            server = MockServerFactory.createNoAuth();
            expect(server).toBeDefined();
        });

        test('should create minimal server', () => {
            server = MockServerFactory.createMinimal();
            expect(server).toBeDefined();

            const stats = server.getStats();
            expect(stats.endpointsRegistered).toBe(1); // Only ping endpoint
        });

        test('should override default configuration', () => {
            const customConfig = {
                name: 'test-server',
                responseDelay: 50
            };

            server = MockServerFactory.createStandard(customConfig);
            expect(server).toBeDefined();
        });
    });

    describe('MockServerTestUtils', () => {
        test('should run test with mock server', async () => {
            let serverInTest: MockBitbucketServer | undefined = undefined;

            const result = await MockServerTestUtils.withMockServer(
                () => MockServerFactory.createMinimal(),
                async (testServer) => {
                    serverInTest = testServer;
                    expect(testServer.getStats().isRunning).toBe(true);

                    const response = await testServer.simulateRequest({
                        method: 'GET',
                        path: '/ping'
                    });

                    return response.data.pong;
                }
            );

            expect(result).toBe(true);
            expect(serverInTest).toBeDefined();
        });

        test('should validate request patterns', async () => {
            server = MockServerFactory.createMinimal();
            await server.start();

            await server.simulateRequest({ method: 'GET', path: '/ping' });

            const validator = MockServerTestUtils.createRequestValidator([
                { method: 'GET', path: '/ping' }
            ]);

            expect(validator(server)).toBe(true);
        });

        test('should fail validation for wrong request patterns', async () => {
            server = MockServerFactory.createMinimal();
            await server.start();

            await server.simulateRequest({ method: 'GET', path: '/ping' });

            const validator = MockServerTestUtils.createRequestValidator([
                { method: 'POST', path: '/ping' }
            ]);

            expect(validator(server)).toBe(false);
        });

        test('should wait for requests', async () => {
            server = MockServerFactory.createMinimal();
            await server.start();

            // Simulate requests after a delay
            setTimeout(async () => {
                await server.simulateRequest({ method: 'GET', path: '/ping' });
                await server.simulateRequest({ method: 'GET', path: '/ping' });
            }, 50);

            const result = await MockServerTestUtils.waitForRequests(server, 2, 1000);
            expect(result).toBe(true);
        });

        test('should timeout waiting for requests', async () => {
            server = MockServerFactory.createMinimal();
            await server.start();

            const result = await MockServerTestUtils.waitForRequests(server, 5, 100);
            expect(result).toBe(false);
        });

        test('should get response statistics', async () => {
            server = MockServerFactory.createStandard();
            await server.start();

            // Make some requests with different response times
            await server.simulateRequest({ method: 'GET', path: '/user' });
            await server.simulateRequest({ method: 'GET', path: '/repositories' });

            const stats = MockServerTestUtils.getResponseStats(server);
            expect(stats.total).toBe(2);
            expect(stats.statusCodes[200]).toBe(2);
            expect(stats.averageResponseTime).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Integration Tests', () => {
        test('should handle concurrent requests', async () => {
            server = MockServerFactory.createStandard();
            await server.start();

            const requests = Array(10).fill(null).map((_, i) =>
                server.simulateRequest({
                    method: 'GET',
                    path: i % 2 === 0 ? '/user' : '/repositories'
                })
            );

            const responses = await Promise.all(requests);

            expect(responses).toHaveLength(10);
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.data).toBeDefined();
            });

            const stats = server.getStats();
            expect(stats.totalRequests).toBe(10);
            expect(stats.totalResponses).toBe(10);
        });

        test('should simulate realistic Bitbucket API workflow', async () => {
            server = MockServerFactory.createStandard();
            await server.start();

            // Get user profile
            const userResponse = await server.simulateRequest({
                method: 'GET',
                path: '/user'
            });
            expect(userResponse.status).toBe(200);
            expect(userResponse.data.username).toBe('testuser');

            // List repositories
            const reposResponse = await server.simulateRequest({
                method: 'GET',
                path: '/repositories'
            });
            expect(reposResponse.status).toBe(200);
            expect(reposResponse.data.values).toHaveLength(1);

            // Get pull requests
            const prsResponse = await server.simulateRequest({
                method: 'GET',
                path: '/repositories/testuser/test-repo/pullrequests'
            });
            expect(prsResponse.status).toBe(200);
            expect(prsResponse.data.values).toHaveLength(1);

            const history = server.getRequestHistory();
            expect(history).toHaveLength(3);
        });
    });
});