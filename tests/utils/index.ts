/**
 * Test Utilities Index
 * 
 * Central export point for all test utilities and fixtures
 */

// Core test utilities
export { default as MCPTestUtils } from './mcp-test-utils';
export { default as AuthMockUtils, MockAuthState } from './auth-mock-utils';

// Test fixtures
export { default as MCPFixtures } from './mcp-fixtures';
export { default as BitbucketAPIFixtures } from './bitbucket-api-fixtures';

// Test data factories
export { default as TestFactoryManager } from './test-data-factories';
export {
  RepositoryFactory,
  PullRequestFactory,
  IssueFactory,
  UserFactory,
  WorkspaceFactory,
  MCPToolFactory
} from './test-data-factories';

// Re-export commonly used types and interfaces
export type {
  MockOAuthToken,
  MockUserProfile
} from './auth-mock-utils';

// Import for internal use
import MCPTestUtils from './mcp-test-utils';
import AuthMockUtils from './auth-mock-utils';
import MCPFixtures from './mcp-fixtures';
import BitbucketAPIFixtures from './bitbucket-api-fixtures';
import TestFactoryManager from './test-data-factories';

/**
 * Quick access to all test utilities
 */
export const TestUtils = {
  MCP: MCPTestUtils,
  Auth: AuthMockUtils,
  Fixtures: {
    MCP: MCPFixtures,
    BitbucketAPI: BitbucketAPIFixtures
  },
  Factories: TestFactoryManager
};

export default TestUtils;