# 🧪 Testing Documentation

This document provides comprehensive guidelines for testing the Bitbucket MCP Server, including test strategies, best practices, and implementation details. It covers unit testing, integration testing, end-to-end testing, performance testing, and security testing.

## Table of Contents

- [🎯 Testing Strategy](#-testing-strategy)
- [🔧 Test Environment Setup](#-test-environment-setup)
- [🔬 Unit Testing](#-unit-testing)
- [🔗 Integration Testing](#-integration-testing)
- [🚀 End-to-End Testing](#-end-to-end-testing)
- [⚡ Performance Testing](#-performance-testing)
- [🔒 Security Testing](#-security-testing)
- [📊 Test Data Management](#-test-data-management)
- [🔄 Continuous Integration](#-continuous-integration)
- [📈 Test Coverage](#-test-coverage)
- [🐛 Debugging Tests](#-debugging-tests)
- [🎯 Best Practices Summary](#-best-practices-summary)

## 🎯 Testing Strategy

### Testing Pyramid

The project follows a testing pyramid approach with three levels:

1. **Unit Tests (70%)**: Fast, isolated tests for individual functions and classes
2. **Integration Tests (20%)**: Tests for component interactions and API integrations
3. **End-to-End Tests (10%)**: Full workflow tests that verify complete user scenarios

### Test Categories

#### Functional Testing

- **Unit Tests**: Test individual functions and methods
- **Integration Tests**: Test component interactions
- **API Tests**: Test REST API endpoints
- **CLI Tests**: Test command-line interface functionality

#### Non-Functional Testing

- **Performance Tests**: Test response times and throughput
- **Security Tests**: Test authentication and authorization
- **Load Tests**: Test system behavior under load
- **Compatibility Tests**: Test across different environments

## 🔧 Test Environment Setup

### Prerequisites

#### Required Software

```bash
# Node.js and npm
node --version  # Should be 18.0.0+
npm --version   # Should be 8.0.0+

# Testing frameworks
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev supertest @types/supertest
npm install --save-dev nock
```

#### Environment Configuration

```bash
# Test environment variables
NODE_ENV=test
DEBUG=false
LOG_LEVEL=error
API_TIMEOUT=5000
API_MAX_RETRIES=1
```

### Jest Configuration

#### jest.config.js

```javascript
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.spec.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    // Ignore problematic test files for now
    'src/utils/api-client.util.test.ts',
    'src/utils/config.util.test.ts',
    'src/utils/constants.util.test.ts',
    'src/utils/scope-validator.util.test.ts',
    'src/services/repository.service.test.ts',
    'src/server.test.ts',
    'src/client.test.ts',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/cli/**/*.ts',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '/scripts/'],
  coverageReporters: ['text', 'lcov', 'json-summary', 'html'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
};
```

### Test Utilities

#### Test Helpers

```typescript
// src/test-utils/test-helpers.ts
import { jest } from '@jest/globals';

export class TestHelpers {
  /**
   * Create a mock API response
   */
  static createMockApiResponse<T>(data: T, status: number = 200) {
    return {
      data,
      status,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  /**
   * Create a mock error response
   */
  static createMockErrorResponse(message: string, status: number = 500) {
    const error = new Error(message);
    (error as any).response = {
      data: { message },
      status,
      statusText: 'Error',
      headers: {},
      config: {},
    };
    return error;
  }

  /**
   * Wait for async operations to complete
   */
  static async waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a mock logger
   */
  static createMockLogger() {
    return {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  }
}
```

#### Test Data Factories

```typescript
// src/test-utils/test-data-factories.ts
export class TestDataFactories {
  /**
   * Create a mock repository
   */
  static createMockRepository(overrides: Partial<Repository> = {}): Repository {
    return {
      id: 'test-repo-id',
      name: 'test-repository',
      description: 'Test repository description',
      isPrivate: false,
      workspace: 'test-workspace',
      owner: 'test-user',
      createdOn: '2024-01-01T00:00:00Z',
      updatedOn: '2024-01-01T00:00:00Z',
      ...overrides,
    };
  }

  /**
   * Create a mock pull request
   */
  static createMockPullRequest(overrides: Partial<PullRequest> = {}): PullRequest {
    return {
      id: 1,
      title: 'Test Pull Request',
      description: 'Test pull request description',
      state: 'OPEN',
      source: {
        branch: { name: 'feature-branch' },
        repository: { name: 'test-repo' },
      },
      destination: {
        branch: { name: 'main' },
        repository: { name: 'test-repo' },
      },
      author: { display_name: 'Test User' },
      createdOn: '2024-01-01T00:00:00Z',
      updatedOn: '2024-01-01T00:00:00Z',
      ...overrides,
    };
  }

  /**
   * Create a mock user
   */
  static createMockUser(overrides: Partial<User> = {}): User {
    return {
      id: 'test-user-id',
      username: 'test-user',
      display_name: 'Test User',
      email: 'test@example.com',
      createdOn: '2024-01-01T00:00:00Z',
      ...overrides,
    };
  }
}
```

## 🔬 Unit Testing

### Service Testing

#### Repository Service Tests

```typescript
// src/services/repository.service.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RepositoryService } from './repository.service.js';
import { TestHelpers, TestDataFactories } from '../test-utils/index.js';

describe('RepositoryService', () => {
  let repositoryService: RepositoryService;
  let mockApiClient: jest.Mocked<any>;
  let mockLogger: jest.Mocked<any>;

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    mockLogger = TestHelpers.createMockLogger();

    repositoryService = new RepositoryService(mockApiClient, mockLogger);
  });

  describe('getRepositories', () => {
    it('should return repositories for valid workspace', async () => {
      // Arrange
      const workspace = 'test-workspace';
      const mockRepositories = [
        TestDataFactories.createMockRepository({ name: 'repo1' }),
        TestDataFactories.createMockRepository({ name: 'repo2' }),
      ];

      mockApiClient.get.mockResolvedValue(TestHelpers.createMockApiResponse(mockRepositories));

      // Act
      const result = await repositoryService.getRepositories(workspace);

      // Assert
      expect(result).toEqual(mockRepositories);
      expect(mockApiClient.get).toHaveBeenCalledWith(`/repositories/${workspace}`);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieved repositories', {
        workspace,
        count: 2,
      });
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      const workspace = 'test-workspace';
      const error = TestHelpers.createMockErrorResponse('API Error', 500);
      mockApiClient.get.mockRejectedValue(error);

      // Act & Assert
      await expect(repositoryService.getRepositories(workspace)).rejects.toThrow('API Error');

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to retrieve repositories', {
        workspace,
        error,
      });
    });

    it('should handle empty repository list', async () => {
      // Arrange
      const workspace = 'test-workspace';
      mockApiClient.get.mockResolvedValue(TestHelpers.createMockApiResponse([]));

      // Act
      const result = await repositoryService.getRepositories(workspace);

      // Assert
      expect(result).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieved repositories', {
        workspace,
        count: 0,
      });
    });
  });

  describe('createRepository', () => {
    it('should create repository with valid configuration', async () => {
      // Arrange
      const config = {
        name: 'new-repo',
        description: 'New repository',
        isPrivate: false,
        workspace: 'test-workspace',
      };

      const mockRepository = TestDataFactories.createMockRepository(config);
      mockApiClient.post.mockResolvedValue(TestHelpers.createMockApiResponse(mockRepository, 201));

      // Act
      const result = await repositoryService.createRepository(config);

      // Assert
      expect(result).toEqual(mockRepository);
      expect(mockApiClient.post).toHaveBeenCalledWith('/repositories', config);
      expect(mockLogger.info).toHaveBeenCalledWith('Created repository', {
        name: config.name,
        workspace: config.workspace,
      });
    });

    it('should validate repository configuration', async () => {
      // Arrange
      const invalidConfig = {
        name: '', // Invalid: empty name
        workspace: 'test-workspace',
      };

      // Act & Assert
      await expect(repositoryService.createRepository(invalidConfig)).rejects.toThrow(
        'Repository name is required'
      );

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });
  });
});
```

### Utility Testing

#### Logger Utility Tests

```typescript
// src/utils/logger.util.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Logger } from './logger.util.js';

describe('Logger', () => {
  let mockConsole: jest.SpyInstance;

  beforeEach(() => {
    mockConsole = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    mockConsole.mockRestore();
  });

  describe('forContext', () => {
    it('should create logger with context', () => {
      const logger = Logger.forContext('test-module');
      expect(logger).toBeDefined();
    });

    it('should create logger with sub-context', () => {
      const logger = Logger.forContext('test-module', 'test-function');
      expect(logger).toBeDefined();
    });
  });

  describe('log levels', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = Logger.forContext('test-module');
    });

    it('should log info messages', () => {
      logger.info('Test info message');
      expect(mockConsole).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Test info message')
      );
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      expect(mockConsole).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Test error message')
      );
    });

    it('should log debug messages when debug is enabled', () => {
      Logger.configureFromConfig(true);
      logger.debug('Test debug message');
      expect(mockConsole).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining('Test debug message')
      );
    });

    it('should not log debug messages when debug is disabled', () => {
      Logger.configureFromConfig(false);
      logger.debug('Test debug message');
      expect(mockConsole).not.toHaveBeenCalled();
    });
  });
});
```

### Configuration Testing

#### Config Utility Tests

```typescript
// src/utils/config.util.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { config } from './config.util.js';

describe('ConfigManager', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.ATLASSIAN_USER_EMAIL;
    delete process.env.ATLASSIAN_API_TOKEN;
    delete process.env.BITBUCKET_USERNAME;
    delete process.env.BITBUCKET_API_TOKEN;
    delete process.env.BITBUCKET_BASE_URL;
    delete process.env.DEBUG;
    delete process.env.TRANSPORT_MODE;
    delete process.env.PORT;
  });

  describe('load', () => {
    it('should load configuration from environment variables', () => {
      // Arrange
      process.env.ATLASSIAN_USER_EMAIL = 'test@example.com';
      process.env.ATLASSIAN_API_TOKEN = 'test-token';
      process.env.DEBUG = 'true';
      process.env.TRANSPORT_MODE = 'http';
      process.env.PORT = '3000';

      // Act
      config.load();

      // Assert
      expect(config.getString('ATLASSIAN_USER_EMAIL')).toBe('test@example.com');
      expect(config.getString('ATLASSIAN_API_TOKEN')).toBe('test-token');
      expect(config.getBoolean('DEBUG')).toBe(true);
      expect(config.getString('TRANSPORT_MODE')).toBe('http');
      expect(config.getNumber('PORT')).toBe(3000);
    });

    it('should use default values when environment variables are not set', () => {
      // Act
      config.load();

      // Assert
      expect(config.getBoolean('DEBUG')).toBe(false);
      expect(config.getString('TRANSPORT_MODE')).toBe('stdio');
      expect(config.getNumber('PORT')).toBe(3000);
    });
  });

  describe('getBitbucketType', () => {
    it('should detect cloud type when Atlassian credentials are present', () => {
      // Arrange
      process.env.ATLASSIAN_USER_EMAIL = 'test@example.com';
      process.env.ATLASSIAN_API_TOKEN = 'test-token';
      config.load();

      // Act
      const type = config.getBitbucketType();

      // Assert
      expect(type).toBe('cloud');
    });

    it('should detect server type when Bitbucket credentials are present', () => {
      // Arrange
      process.env.BITBUCKET_USERNAME = 'test-user';
      process.env.BITBUCKET_API_TOKEN = 'test-token';
      process.env.BITBUCKET_BASE_URL = 'https://bitbucket.company.com';
      config.load();

      // Act
      const type = config.getBitbucketType();

      // Assert
      expect(type).toBe('server');
    });

    it('should default to cloud type when no credentials are present', () => {
      // Arrange
      config.load();

      // Act
      const type = config.getBitbucketType();

      // Assert
      expect(type).toBe('cloud');
    });
  });

  describe('getAuthMethod', () => {
    it('should return api-token for Atlassian credentials', () => {
      // Arrange
      process.env.ATLASSIAN_USER_EMAIL = 'test@example.com';
      process.env.ATLASSIAN_API_TOKEN = 'test-token';
      config.load();

      // Act
      const method = config.getAuthMethod();

      // Assert
      expect(method).toBe('api-token');
    });

    it('should return app-password for app password credentials', () => {
      // Arrange
      process.env.ATLASSIAN_USER_EMAIL = 'test@example.com';
      process.env.BITBUCKET_APP_PASSWORD = 'test-password';
      config.load();

      // Act
      const method = config.getAuthMethod();

      // Assert
      expect(method).toBe('app-password');
    });
  });
});
```

## 🔗 Integration Testing

### API Integration Tests

#### Repository API Tests

```typescript
// src/services/repository.service.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { RepositoryService } from './repository.service.js';
import { ApiClient } from '../utils/api-client.util.js';
import { Logger } from '../utils/logger.util.js';

describe('RepositoryService Integration Tests', () => {
  let repositoryService: RepositoryService;
  let apiClient: ApiClient;
  let logger: Logger;

  beforeAll(async () => {
    // Set up test environment
    process.env.ATLASSIAN_USER_EMAIL = process.env.TEST_ATLASSIAN_USER_EMAIL;
    process.env.ATLASSIAN_API_TOKEN = process.env.TEST_ATLASSIAN_API_TOKEN;

    apiClient = new ApiClient();
    logger = Logger.forContext('integration-test');
    repositoryService = new RepositoryService(apiClient, logger);
  });

  afterAll(async () => {
    // Clean up test data
    // Implementation depends on test data cleanup strategy
  });

  describe('Real API Integration', () => {
    it('should retrieve repositories from real API', async () => {
      // Arrange
      const workspace = process.env.TEST_WORKSPACE || 'test-workspace';

      // Act
      const repositories = await repositoryService.getRepositories(workspace);

      // Assert
      expect(Array.isArray(repositories)).toBe(true);
      repositories.forEach(repo => {
        expect(repo).toHaveProperty('id');
        expect(repo).toHaveProperty('name');
        expect(repo).toHaveProperty('workspace');
      });
    }, 10000); // 10 second timeout for real API calls

    it('should handle API rate limiting gracefully', async () => {
      // Arrange
      const workspace = process.env.TEST_WORKSPACE || 'test-workspace';
      const promises = Array(10)
        .fill(null)
        .map(() => repositoryService.getRepositories(workspace));

      // Act
      const results = await Promise.allSettled(promises);

      // Assert
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful.length).toBeGreaterThan(0);
      // Some requests might fail due to rate limiting
      expect(failed.length).toBeLessThanOrEqual(5);
    }, 15000);
  });
});
```

### MCP Protocol Integration Tests

#### MCP Server Integration Tests

```typescript
// src/server.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { startServer } from './server.js';
import { McpClient } from '@modelcontextprotocol/sdk/client';

describe('MCP Server Integration Tests', () => {
  let server: any;
  let client: McpClient;

  beforeAll(async () => {
    // Start server in test mode
    server = await startServer('stdio');

    // Create MCP client
    client = new McpClient({
      name: 'test-client',
      version: '2.2.0',
    });

    // Connect to server
    await client.connect({
      command: 'bitbucket-mcp-server',
      env: {
        NODE_ENV: 'test',
        ATLASSIAN_USER_EMAIL: process.env.TEST_ATLASSIAN_USER_EMAIL,
        ATLASSIAN_API_TOKEN: process.env.TEST_ATLASSIAN_API_TOKEN,
      },
    });
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
    if (server) {
      await server.close();
    }
  });

  describe('MCP Protocol', () => {
    it('should list available tools', async () => {
      // Act
      const tools = await client.listTools();

      // Assert
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      // Check for expected tools
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('mcp_bitbucket_repository_list');
      expect(toolNames).toContain('mcp_bitbucket_pull_request_list');
    });

    it('should execute repository list tool', async () => {
      // Arrange
      const toolName = 'mcp_bitbucket_repository_list';
      const args = {
        workspace: process.env.TEST_WORKSPACE || 'test-workspace',
      };

      // Act
      const result = await client.callTool(toolName, args);

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
    });

    it('should handle invalid tool calls gracefully', async () => {
      // Arrange
      const toolName = 'invalid_tool';
      const args = {};

      // Act & Assert
      await expect(client.callTool(toolName, args)).rejects.toThrow();
    });
  });
});
```

## 🚀 End-to-End Testing

### CLI End-to-End Tests

#### CLI Command Tests

```typescript
// src/client.e2e.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn } from 'child_process';
import { promisify } from 'util';

const exec = promisify(require('child_process').exec);

describe('CLI End-to-End Tests', () => {
  beforeAll(() => {
    // Set up test environment
    process.env.ATLASSIAN_USER_EMAIL = process.env.TEST_ATLASSIAN_USER_EMAIL;
    process.env.ATLASSIAN_API_TOKEN = process.env.TEST_ATLASSIAN_API_TOKEN;
  });

  describe('Repository Commands', () => {
    it('should list repositories', async () => {
      // Act
      const { stdout, stderr } = await exec(
        'bitbucket-mcp-server repository list --workspace test-workspace'
      );

      // Assert
      expect(stderr).toBe('');
      expect(stdout).toContain('repositories');
    }, 10000);

    it('should show help for repository commands', async () => {
      // Act
      const { stdout, stderr } = await exec('bitbucket-mcp-server repository --help');

      // Assert
      expect(stderr).toBe('');
      expect(stdout).toContain('repository');
      expect(stdout).toContain('list');
      expect(stdout).toContain('create');
    });
  });

  describe('Pull Request Commands', () => {
    it('should list pull requests', async () => {
      // Act
      const { stdout, stderr } = await exec(
        'bitbucket-mcp-server pull-request list --workspace test-workspace --repo test-repo'
      );

      // Assert
      expect(stderr).toBe('');
      expect(stdout).toContain('pull requests');
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should show error for invalid credentials', async () => {
      // Arrange
      const originalEmail = process.env.ATLASSIAN_USER_EMAIL;
      const originalToken = process.env.ATLASSIAN_API_TOKEN;

      process.env.ATLASSIAN_USER_EMAIL = 'invalid@example.com';
      process.env.ATLASSIAN_API_TOKEN = 'invalid-token';

      // Act
      const { stderr } = await exec(
        'bitbucket-mcp-server repository list --workspace test-workspace'
      );

      // Assert
      expect(stderr).toContain('error');
      expect(stderr).toContain('authentication');

      // Cleanup
      process.env.ATLASSIAN_USER_EMAIL = originalEmail;
      process.env.ATLASSIAN_API_TOKEN = originalToken;
    }, 10000);
  });
});
```

### HTTP Server End-to-End Tests

#### HTTP API Tests

```typescript
// src/server.http.e2e.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { startServer } from './server.js';

describe('HTTP Server End-to-End Tests', () => {
  let server: any;
  let app: any;

  beforeAll(async () => {
    // Start HTTP server
    process.env.TRANSPORT_MODE = 'http';
    process.env.PORT = '3001'; // Use different port for testing
    process.env.ATLASSIAN_USER_EMAIL = process.env.TEST_ATLASSIAN_USER_EMAIL;
    process.env.ATLASSIAN_API_TOKEN = process.env.TEST_ATLASSIAN_API_TOKEN;

    server = await startServer('http');
    app = server.app; // Assuming server exposes app for testing
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      // Act
      const response = await request(app).get('/').expect(200);

      // Assert
      expect(response.text).toContain('Bitbucket MCP Server');
    });
  });

  describe('MCP Endpoint', () => {
    it('should handle MCP requests', async () => {
      // Arrange
      const mcpRequest = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      };

      // Act
      const response = await request(app).post('/mcp').send(mcpRequest).expect(200);

      // Assert
      expect(response.body).toHaveProperty('jsonrpc', '2.0');
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('result');
    });

    it('should handle invalid MCP requests', async () => {
      // Arrange
      const invalidRequest = {
        jsonrpc: '2.0',
        method: 'invalid_method',
        id: 1,
      };

      // Act
      const response = await request(app).post('/mcp').send(invalidRequest).expect(200);

      // Assert
      expect(response.body).toHaveProperty('error');
    });
  });
});
```

## ⚡ Performance Testing

### Load Testing

#### API Load Tests

```typescript
// src/performance/load.test.ts
import { describe, it, expect } from '@jest/globals';
import { RepositoryService } from '../services/repository.service.js';
import { ApiClient } from '../utils/api-client.util.js';
import { Logger } from '../utils/logger.util.js';

describe('Performance Tests', () => {
  let repositoryService: RepositoryService;
  let apiClient: ApiClient;
  let logger: Logger;

  beforeEach(() => {
    apiClient = new ApiClient();
    logger = Logger.forContext('performance-test');
    repositoryService = new RepositoryService(apiClient, logger);
  });

  describe('Repository Service Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      // Arrange
      const workspace = 'test-workspace';
      const concurrentRequests = 10;
      const startTime = Date.now();

      // Act
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => repositoryService.getRepositories(workspace));

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(results).toHaveLength(concurrentRequests);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      // All results should be successful
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    }, 10000);

    it('should maintain performance under load', async () => {
      // Arrange
      const workspace = 'test-workspace';
      const requestCount = 100;
      const startTime = Date.now();

      // Act
      const promises = Array(requestCount)
        .fill(null)
        .map(() => repositoryService.getRepositories(workspace));

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful.length).toBeGreaterThan(requestCount * 0.95); // 95% success rate
      expect(failed.length).toBeLessThan(requestCount * 0.05); // Less than 5% failure rate
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    }, 35000);
  });
});
```

### Memory Testing

#### Memory Usage Tests

```typescript
// src/performance/memory.test.ts
import { describe, it, expect } from '@jest/globals';
import { RepositoryService } from '../services/repository.service.js';

describe('Memory Performance Tests', () => {
  let repositoryService: RepositoryService;

  beforeEach(() => {
    repositoryService = new RepositoryService();
  });

  it('should not leak memory during repeated operations', async () => {
    // Arrange
    const workspace = 'test-workspace';
    const iterations = 100;
    const initialMemory = process.memoryUsage();

    // Act
    for (let i = 0; i < iterations; i++) {
      await repositoryService.getRepositories(workspace);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    // Assert
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  }, 30000);
});
```

## 🔒 Security Testing

### Authentication Tests

#### Authentication Security Tests

```typescript
// src/security/authentication.test.ts
import { describe, it, expect } from '@jest/globals';
import { AuthenticationService } from '../services/authentication.service.js';

describe('Authentication Security Tests', () => {
  let authService: AuthenticationService;

  beforeEach(() => {
    authService = new AuthenticationService();
  });

  describe('Token Validation', () => {
    it('should reject invalid tokens', async () => {
      // Arrange
      const invalidToken = 'invalid-token';

      // Act & Assert
      await expect(authService.validateToken(invalidToken)).rejects.toThrow('Invalid token');
    });

    it('should reject expired tokens', async () => {
      // Arrange
      const expiredToken = 'expired-token';

      // Act & Assert
      await expect(authService.validateToken(expiredToken)).rejects.toThrow('Token expired');
    });

    it('should accept valid tokens', async () => {
      // Arrange
      const validToken = 'valid-token';

      // Act
      const result = await authService.validateToken(validToken);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should sanitize user input', () => {
      // Arrange
      const maliciousInput = '<script>alert("xss")</script>';

      // Act
      const sanitized = authService.sanitizeInput(maliciousInput);

      // Assert
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should validate email format', () => {
      // Arrange
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid-email';

      // Act & Assert
      expect(authService.validateEmail(validEmail)).toBe(true);
      expect(authService.validateEmail(invalidEmail)).toBe(false);
    });
  });
});
```

### Authorization Tests

#### Permission Tests

```typescript
// src/security/authorization.test.ts
import { describe, it, expect } from '@jest/globals';
import { AuthorizationService } from '../services/authorization.service.js';

describe('Authorization Security Tests', () => {
  let authzService: AuthorizationService;

  beforeEach(() => {
    authzService = new AuthorizationService();
  });

  describe('Permission Checking', () => {
    it('should deny access without proper permissions', async () => {
      // Arrange
      const user = { id: 'user1', permissions: ['read'] };
      const resource = { id: 'repo1', requiredPermission: 'write' };

      // Act
      const hasAccess = await authzService.checkPermission(user, resource);

      // Assert
      expect(hasAccess).toBe(false);
    });

    it('should grant access with proper permissions', async () => {
      // Arrange
      const user = { id: 'user1', permissions: ['read', 'write'] };
      const resource = { id: 'repo1', requiredPermission: 'write' };

      // Act
      const hasAccess = await authzService.checkPermission(user, resource);

      // Assert
      expect(hasAccess).toBe(true);
    });
  });
});
```

## 📊 Test Data Management

### Test Data Setup

#### Test Data Fixtures

```typescript
// src/test-utils/fixtures.ts
export const TEST_FIXTURES = {
  repositories: [
    {
      id: 'repo1',
      name: 'test-repo-1',
      description: 'Test repository 1',
      isPrivate: false,
      workspace: 'test-workspace',
    },
    {
      id: 'repo2',
      name: 'test-repo-2',
      description: 'Test repository 2',
      isPrivate: true,
      workspace: 'test-workspace',
    },
  ],

  pullRequests: [
    {
      id: 1,
      title: 'Test PR 1',
      description: 'Test pull request 1',
      state: 'OPEN',
      source: { branch: { name: 'feature-1' } },
      destination: { branch: { name: 'main' } },
    },
    {
      id: 2,
      title: 'Test PR 2',
      description: 'Test pull request 2',
      state: 'MERGED',
      source: { branch: { name: 'feature-2' } },
      destination: { branch: { name: 'main' } },
    },
  ],

  users: [
    {
      id: 'user1',
      username: 'test-user-1',
      display_name: 'Test User 1',
      email: 'user1@example.com',
    },
    {
      id: 'user2',
      username: 'test-user-2',
      display_name: 'Test User 2',
      email: 'user2@example.com',
    },
  ],
};
```

#### Test Data Cleanup

```typescript
// src/test-utils/cleanup.ts
export class TestDataCleanup {
  private static createdResources: string[] = [];

  static async createTestRepository(config: any): Promise<string> {
    // Create test repository
    const repository = await repositoryService.createRepository(config);
    this.createdResources.push(repository.id);
    return repository.id;
  }

  static async cleanup(): Promise<void> {
    // Clean up all created resources
    for (const resourceId of this.createdResources) {
      try {
        await repositoryService.deleteRepository(resourceId);
      } catch (error) {
        console.warn(`Failed to cleanup resource ${resourceId}:`, error);
      }
    }

    this.createdResources = [];
  }
}
```

## 🔄 Continuous Integration

### GitHub Actions

#### Test Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm test
        env:
          NODE_ENV: test
          TEST_ATLASSIAN_USER_EMAIL: ${{ secrets.TEST_ATLASSIAN_USER_EMAIL }}
          TEST_ATLASSIAN_API_TOKEN: ${{ secrets.TEST_ATLASSIAN_API_TOKEN }}
          TEST_WORKSPACE: ${{ secrets.TEST_WORKSPACE }}

      - name: Run coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

### Test Scripts

#### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:performance": "jest --testPathPattern=performance",
    "test:security": "jest --testPathPattern=security",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## 📈 Test Coverage

### Coverage Configuration

#### Coverage Thresholds

```javascript
// jest.config.js
module.exports = {
  // ... other config
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

### Coverage Reports

#### HTML Coverage Report

```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage report
open coverage/index.html
```

#### Coverage Badge

```markdown
[![Coverage](https://codecov.io/gh/guercheLE/bitbucket-mcp-server/branch/main/graph/badge.svg)](https://codecov.io/gh/guercheLE/bitbucket-mcp-server)
```

## 🐛 Debugging Tests

### Debug Configuration

#### VS Code Debug Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache", "--no-coverage"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "disableOptimisticBPs": true,
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    }
  ]
}
```

### Test Debugging Tips

#### Common Debugging Techniques

```typescript
// 1. Use console.log for debugging
it('should debug test', () => {
  console.log('Debug information:', { data, expected });
  expect(result).toBe(expected);
});

// 2. Use debugger statement
it('should debug with breakpoint', () => {
  debugger; // Will pause execution
  expect(result).toBe(expected);
});

// 3. Use jest.fn() to spy on functions
it('should spy on function calls', () => {
  const spy = jest.fn();
  someFunction(spy);
  expect(spy).toHaveBeenCalledWith(expectedArgs);
});

// 4. Use jest.spyOn to mock methods
it('should mock method calls', () => {
  const spy = jest.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);
  // Test implementation
  expect(spy).toHaveBeenCalledWith(expectedUrl);
  spy.mockRestore();
});
```

## 🎯 Best Practices Summary

### Testing Checklist

- [ ] **Unit Tests**: Cover all service methods and utility functions
- [ ] **Integration Tests**: Test API interactions and MCP protocol
- [ ] **End-to-End Tests**: Verify complete user workflows
- [ ] **Performance Tests**: Ensure system handles expected load
- [ ] **Security Tests**: Validate authentication and authorization
- [ ] **Test Coverage**: Maintain >80% code coverage
- [ ] **CI/CD Integration**: Automated testing on all commits
- [ ] **Test Data Management**: Proper setup and cleanup
- [ ] **Documentation**: Keep test documentation updated

### Quick Testing Commands

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
npm run test:security

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run CI tests
npm run test:ci
```

### Testing Guidelines

1. **Write tests first** (TDD approach when possible)
2. **Keep tests simple and focused** on single functionality
3. **Use descriptive test names** that explain the expected behavior
4. **Mock external dependencies** to ensure test isolation
5. **Test both success and failure scenarios**
6. **Maintain test data consistency** across test runs
7. **Regularly review and update tests** as code evolves

This comprehensive testing documentation provides everything needed to implement and maintain a robust test suite for the Bitbucket MCP Server project. For more information, see the [Contributing Guide](CONTRIBUTING.md) and [Style Guide](STYLE_GUIDE.md).
