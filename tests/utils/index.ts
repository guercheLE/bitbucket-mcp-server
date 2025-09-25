/**
 * Test Utilities Index
 * 
 * Central export point for all test utilities and fixtures
 */

// Core test utilities
export { default as AuthMockUtils, MockAuthState } from './auth-mock-utils';
export { default as MCPTestUtils } from './mcp-test-utils';

// MCP Protocol helpers
export { default as MCPProtocolHelpers } from './mcp-protocol-helpers';
// Export protocol helpers
export {
    MCPClientTestHelper, MCPErrorCodes, MCPErrorTestHelper, MCPProtocolValidator, MCPSchemas, MockMCPTransport, ToolRegistrationTestHelper
} from './mcp-protocol-helpers';

// Mock Server Infrastructure
export {
    MockBitbucketServer, MockEndpointConfigSchema,
    MockRequestSchema,
    MockResponseSchema, MockServerConfigSchema, MockServerFactory,
    MockServerTestUtils, type MockEndpointConfig,
    type MockRequest,
    type MockResponse, type MockServerConfig
} from './mock-server-infrastructure';

// Contract Testing Framework
export {
    ContractTestSuite,
    ContractTestUtils, MCPContractValidator, type ContractTestConfig,
    type ContractTestResult
} from './mcp-contract-testing';

// Test fixtures
export { default as BitbucketAPIFixtures } from './bitbucket-api-fixtures';
export { default as MCPFixtures } from './mcp-fixtures';

// Test data factories
export {
    IssueFactory, MCPToolFactory, PullRequestFactory, RepositoryFactory, default as TestFactoryManager, UserFactory,
    WorkspaceFactory
} from './test-data-factories';

// Re-export commonly used types and interfaces
export type {
    MockOAuthToken,
    MockUserProfile
} from './auth-mock-utils';

// Import for internal use
import AuthMockUtils from './auth-mock-utils';
import BitbucketAPIFixtures from './bitbucket-api-fixtures';
import {
    ContractTestSuite,
    ContractTestUtils,
    MCPContractValidator
} from './mcp-contract-testing';
import MCPFixtures from './mcp-fixtures';
import MCPProtocolHelpers from './mcp-protocol-helpers';
import MCPTestUtils from './mcp-test-utils';
import {
    MockBitbucketServer,
    MockServerFactory,
    MockServerTestUtils
} from './mock-server-infrastructure';
import TestFactoryManager from './test-data-factories';

/**
 * Quick access to all test utilities
 */
export const TestUtils = {
    // Core utilities
    Auth: AuthMockUtils,
    MCP: MCPTestUtils,
    Protocol: MCPProtocolHelpers,

    // Test data and fixtures
    Fixtures: {
        Bitbucket: BitbucketAPIFixtures,
        MCP: MCPFixtures
    },

    // Factories
    Factory: TestFactoryManager,

    // Contract testing
    Contracts: {
        MCPContractValidator,
        ContractTestSuite,
        ContractTestUtils
    },

    // Mock server infrastructure
    MockServer: {
        MockBitbucketServer,
        MockServerFactory,
        MockServerTestUtils
    }
};

export default TestUtils;