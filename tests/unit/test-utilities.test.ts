/**
 * Test Utilities Validation Tests
 * 
 * Ensures all test utility modules are properly exported and functional
 */

import TestUtils, {
    AuthMockUtils,
    BitbucketAPIFixtures,
    MCPFixtures,
    MCPTestUtils,
    TestFactoryManager
} from '../utils';

describe('Test Utilities', () => {
    describe('Module Exports', () => {
        it('should export TestUtils as default', () => {
            expect(TestUtils).toBeDefined();
            expect(typeof TestUtils).toBe('object');
        });

        it('should export MCPTestUtils', () => {
            expect(MCPTestUtils).toBeDefined();
            expect(typeof MCPTestUtils).toBe('function');
        });

        it('should export AuthMockUtils', () => {
            expect(AuthMockUtils).toBeDefined();
            expect(typeof AuthMockUtils).toBe('function');
        });

        it('should export MCPFixtures', () => {
            expect(MCPFixtures).toBeDefined();
            expect(typeof MCPFixtures).toBe('object');
        });

        it('should export BitbucketAPIFixtures', () => {
            expect(BitbucketAPIFixtures).toBeDefined();
            expect(typeof BitbucketAPIFixtures).toBe('object');
        });

        it('should export TestFactoryManager', () => {
            expect(TestFactoryManager).toBeDefined();
            expect(typeof TestFactoryManager).toBe('function');
        });
    });

    describe('TestUtils Object Structure', () => {
        it('should have MCP property', () => {
            expect(TestUtils.MCP).toBeDefined();
            expect(TestUtils.MCP).toBe(MCPTestUtils);
        });

        it('should have Auth property', () => {
            expect(TestUtils.Auth).toBeDefined();
            expect(TestUtils.Auth).toBe(AuthMockUtils);
        });

        it('should have Fixtures property', () => {
            expect(TestUtils.Fixtures).toBeDefined();
            expect(TestUtils.Fixtures.MCP).toBe(MCPFixtures);
            expect(TestUtils.Fixtures.BitbucketAPI).toBe(BitbucketAPIFixtures);
        });

        it('should have Factories property', () => {
            expect(TestUtils.Factories).toBeDefined();
            expect(TestUtils.Factories).toBe(TestFactoryManager);
        });
    });

    describe('Basic Functionality', () => {
        it('should access MCP test helpers static methods', () => {
            expect(typeof MCPTestUtils.createMockRequest).toBe('function');
            expect(typeof MCPTestUtils.createMockResponse).toBe('function');
        });

        it('should access auth mock utilities static methods', () => {
            expect(typeof AuthMockUtils.createMockToken).toBe('function');
            expect(typeof AuthMockUtils.createMockUserProfile).toBe('function');
        });

        it('should access MCP fixtures', () => {
            expect(MCPFixtures.MCPToolFixtures).toBeDefined();
            expect(MCPFixtures.MCPToolFixtures.repositoryTools).toBeDefined();
        });

        it('should access Bitbucket API fixtures', () => {
            expect(BitbucketAPIFixtures.BitbucketRepositoryFixtures).toBeDefined();
            expect(BitbucketAPIFixtures.BitbucketPullRequestFixtures).toBeDefined();
        });

        it('should access factory manager static methods', () => {
            expect(typeof TestFactoryManager.repository).toBe('function');
            expect(typeof TestFactoryManager.pullRequest).toBe('function');
            expect(typeof TestFactoryManager.user).toBe('function');
        });
    });
});