# 📝 Style Guide

This document outlines the coding standards, conventions, and best practices for the Bitbucket MCP Server project. Following these guidelines ensures consistent, maintainable, and high-quality code across the entire codebase.

## Table of Contents

- [General Principles](#general-principles)
- [TypeScript Guidelines](#typescript-guidelines)
- [Code Formatting](#code-formatting)
- [Naming Conventions](#naming-conventions)
- [File Organization](#file-organization)
- [Documentation Standards](#documentation-standards)
- [Error Handling](#error-handling)
- [Testing Standards](#testing-standards)
- [Performance Guidelines](#performance-guidelines)
- [Security Guidelines](#security-guidelines)

## 🎯 General Principles

### Code Quality

- **Readability**: Code should be self-documenting and easy to understand
- **Consistency**: Follow established patterns and conventions
- **Maintainability**: Write code that is easy to modify and extend
- **Performance**: Consider performance implications of code decisions
- **Security**: Implement security best practices throughout
- **Testability**: Write code that is easy to test and verify

### Development Workflow

- **Code Reviews**: All code must be reviewed before merging
- **Testing**: Write tests for all new functionality
- **Documentation**: Document public APIs and complex logic
- **Refactoring**: Continuously improve code quality
- **Standards**: Follow established coding standards

## 🔷 TypeScript Guidelines

### Type Safety

#### Use Strict TypeScript

```typescript
// Good: Explicit typing
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // Implementation
}

// Bad: Any types
function getUser(id: any): any {
  // Implementation
}
```

#### Prefer Interfaces over Types

```typescript
// Good: Use interfaces for object shapes
interface RepositoryConfig {
  name: string;
  description?: string;
  isPrivate: boolean;
}

// Good: Use types for unions and primitives
type Status = 'active' | 'inactive' | 'pending';
type ID = string | number;
```

#### Use Enums for Constants

```typescript
// Good: Use enums for related constants
enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

// Good: Use const enums for performance
const enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}
```

### Generic Types

#### Use Generics for Reusable Code

```typescript
// Good: Generic interface
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Good: Generic function
function createApiResponse<T>(data: T, status: number): ApiResponse<T> {
  return {
    data,
    status,
    message: 'Success',
  };
}
```

#### Constrain Generic Types

```typescript
// Good: Constrained generic
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
```

### Utility Types

#### Use Built-in Utility Types

```typescript
// Good: Use utility types
type PartialUser = Partial<User>;
type RequiredUser = Required<User>;
type UserEmail = Pick<User, 'email'>;
type UserWithoutId = Omit<User, 'id'>;

// Good: Custom utility types
type NonNullable<T> = T extends null | undefined ? never : T;
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

## 🎨 Code Formatting

### Indentation and Spacing

#### Use 2 Spaces for Indentation

```typescript
// Good: 2 spaces (project standard)
function processData(data: any[]): any[] {
  return data.map(item => {
    if (item.isValid) {
      return transformItem(item);
    }
    return item;
  });
}

// Bad: 4 spaces or tabs (not project standard)
function processData(data: any[]): any[] {
  return data.map(item => {
    if (item.isValid) {
      return transformItem(item);
    }
    return item;
  });
}
```

#### Consistent Spacing

```typescript
// Good: Consistent spacing
const user = { name: 'John', email: 'john@example.com' };
const numbers = [1, 2, 3, 4, 5];

// Good: Spacing around operators
const result = a + b * c;
const isValid = status === 'active' && count > 0;

// Good: Spacing in function calls
processData(data, options);
```

### Line Length and Breaking

#### Maximum Line Length: 100 Characters

```typescript
// Good: Break long lines appropriately
const result = await apiClient.post(
  '/repositories',
  {
    name: repositoryName,
    description: repositoryDescription,
    isPrivate: isPrivateRepository,
  },
  { timeout: 30000 }
);

// Good: Break long conditionals
if (user.isActive && user.hasPermission('repository:write') && repository.isAccessible(user.id)) {
  // Implementation
}
```

#### Consistent Breaking Patterns

```typescript
// Good: Consistent parameter breaking
function createRepository(
  name: string,
  description: string,
  isPrivate: boolean,
  options: RepositoryOptions
): Promise<Repository> {
  // Implementation
}

// Good: Consistent object breaking
const config = {
  apiUrl: process.env.API_URL,
  timeout: 30000,
  retries: 3,
  debug: process.env.DEBUG === 'true',
};
```

### Semicolons and Commas

#### Always Use Semicolons

```typescript
// Good: Always use semicolons
const name = 'John';
const age = 30;
const user = { name, age };

// Bad: Missing semicolons
const name = 'John';
const age = 30;
const user = { name, age };
```

#### Trailing Commas

```typescript
// Good: Use trailing commas in objects and arrays
const user = {
  name: 'John',
  email: 'john@example.com',
  age: 30, // trailing comma
};

const numbers = [
  1,
  2,
  3,
  4, // trailing comma
];
```

## 🏷️ Naming Conventions

### Variables and Functions

#### Use camelCase for Variables and Functions

```typescript
// Good: camelCase
const userName = 'john_doe';
const isUserActive = true;
const getUserById = (id: string) => {
  /* implementation */
};

// Bad: snake_case or PascalCase
const user_name = 'john_doe';
const IsUserActive = true;
const GetUserById = (id: string) => {
  /* implementation */
};
```

#### Use Descriptive Names

```typescript
// Good: Descriptive names
const activeUserCount = users.filter(user => user.isActive).length;
const repositoryAccessToken = await generateRepositoryToken();

// Bad: Abbreviated or unclear names
const auc = users.filter(u => u.ia).length;
const rat = await grt();
```

#### Use Boolean Prefixes

```typescript
// Good: Boolean prefixes
const isActive = true;
const hasPermission = false;
const canEdit = true;
const shouldRetry = false;

// Bad: Non-descriptive boolean names
const active = true;
const permission = false;
const edit = true;
const retry = false;
```

### Classes and Interfaces

#### Use PascalCase for Classes and Interfaces

```typescript
// Good: PascalCase
class UserService {
  // Implementation
}

interface RepositoryConfig {
  // Implementation
}

// Bad: camelCase
class userService {
  // Implementation
}

interface repositoryConfig {
  // Implementation
}
```

#### Use Descriptive Class Names

```typescript
// Good: Descriptive class names
class BitbucketApiClient {
  // Implementation
}

class RepositoryManager {
  // Implementation
}

// Bad: Generic or unclear names
class Client {
  // Implementation
}

class Manager {
  // Implementation
}
```

### Constants

#### Use UPPER_SNAKE_CASE for Constants

```typescript
// Good: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.bitbucket.org/2.0';
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 30000;

// Bad: camelCase or other cases
const apiBaseUrl = 'https://api.bitbucket.org/2.0';
const maxRetryAttempts = 3;
const defaultTimeout = 30000;
```

#### Group Related Constants

```typescript
// Good: Grouped constants
const API_ENDPOINTS = {
  REPOSITORIES: '/repositories',
  PULL_REQUESTS: '/pullrequests',
  USERS: '/users',
  WORKSPACES: '/workspaces',
} as const;

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
} as const;
```

### Files and Directories

#### Use kebab-case for Files and Directories

```
// Good: kebab-case
src/
  services/
    repository.service.ts
    pull-request.service.ts
    user.service.ts
  tools/
    cloud/
      repository.tool.ts
      pull-request.tool.ts
    datacenter/
      repository.tool.ts
      pull-request.tool.ts
```

#### Use Descriptive File Names

```
// Good: Descriptive file names
authentication.service.ts
repository-manager.tool.ts
bitbucket-api-client.util.ts

// Bad: Generic or unclear names
service.ts
tool.ts
client.ts
```

## 📁 File Organization

### Project Structure

#### Follow Established Structure

```
src/
├── commands/           # CLI command implementations
│   ├── cloud/         # Cloud-specific commands (19 files)
│   └── datacenter/    # Data Center-specific commands (15 files)
├── services/          # Business logic services
│   ├── cloud/         # Cloud service implementations (41 files)
│   ├── datacenter/    # Data Center service implementations (39 files)
│   └── types/         # Shared type definitions (1 file)
├── tools/             # MCP tool implementations
│   ├── cloud/         # Cloud tool modules (19 files)
│   └── datacenter/    # Data Center tool modules (19 files)
├── utils/             # Utility functions (5 files)
├── client.ts          # CLI client implementation
├── server.ts          # MCP server implementation
└── index.ts           # Main entry point
```

### Import Organization

#### Group and Order Imports

```typescript
// Good: Organized imports (project standard)
// 1. Node.js built-in modules
import { readFileSync } from 'fs';
import { join } from 'path';

// 2. External dependencies
import { Command } from 'commander';
import axios from 'axios';
import { z } from 'zod';

// 3. Internal modules (absolute paths)
import { Logger } from './utils/logger.util.js';
import { config } from './utils/config.util.js';
import { constants } from './utils/constants.util.js';

// 4. Internal modules (relative paths)
import { RepositoryService } from '../services/cloud/repository.service.js';
import { UserService } from '../services/cloud/user.service.js';
```

#### Use Consistent Import Styles

```typescript
// Good: Consistent import styles
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from './utils/logger.util.js';
import { config } from './utils/config.util.js';

// Good: Destructured imports
import { RepositoryConfig, PullRequestConfig, UserConfig } from './types/config.types.js';

// Good: Default imports
import express from 'express';
import cors from 'cors';
```

### Export Organization

#### Use Named Exports

```typescript
// Good: Named exports
export class RepositoryService {
  // Implementation
}

export interface RepositoryConfig {
  // Implementation
}

export const DEFAULT_CONFIG = {
  // Implementation
};

// Bad: Default exports (except for main entry points)
export default class RepositoryService {
  // Implementation
}
```

#### Group Related Exports

```typescript
// Good: Grouped exports
export { RepositoryService, PullRequestService, UserService } from './services';

export { RepositoryConfig, PullRequestConfig, UserConfig } from './types';

export { createApiClient, validateConfig, formatError } from './utils';
```

## 📚 Documentation Standards

### JSDoc Comments

#### Document Public APIs

````typescript
/**
 * Creates a new repository in the specified workspace
 *
 * @param workspace - The workspace slug
 * @param repository - Repository configuration
 * @param options - Additional options for repository creation
 * @returns Promise that resolves to the created repository
 * @throws {ValidationError} When repository configuration is invalid
 * @throws {AuthenticationError} When authentication fails
 * @throws {PermissionError} When user lacks required permissions
 *
 * @example
 * ```typescript
 * const repository = await repositoryService.createRepository(
 *   'my-workspace',
 *   {
 *     name: 'my-repo',
 *     description: 'My new repository',
 *     isPrivate: true
 *   }
 * );
 * ```
 */
async createRepository(
  workspace: string,
  repository: RepositoryConfig,
  options?: CreateRepositoryOptions
): Promise<Repository> {
  // Implementation
}
````

#### Document Complex Logic

```typescript
/**
 * Validates and processes webhook payload
 *
 * This function performs the following steps:
 * 1. Validates the webhook signature
 * 2. Parses the JSON payload
 * 3. Validates the event type
 * 4. Processes the event data
 *
 * @param payload - Raw webhook payload
 * @param signature - Webhook signature for validation
 * @returns Processed webhook event
 */
function processWebhookPayload(payload: string, signature: string): WebhookEvent {
  // Implementation
}
```

### Inline Comments

#### Explain Complex Logic

```typescript
// Good: Explain complex logic
function calculateRepositoryScore(repository: Repository): number {
  // Weight factors for different metrics
  const STAR_WEIGHT = 0.4;
  const FORK_WEIGHT = 0.3;
  const COMMIT_WEIGHT = 0.2;
  const ISSUE_WEIGHT = 0.1;

  // Calculate weighted score
  const score =
    repository.stars * STAR_WEIGHT +
    repository.forks * FORK_WEIGHT +
    repository.commits * COMMIT_WEIGHT +
    repository.issues * ISSUE_WEIGHT;

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}
```

#### Document Non-Obvious Decisions

```typescript
// Good: Document non-obvious decisions
function processApiResponse(response: ApiResponse): ProcessedData {
  // Use exponential backoff for rate limit errors
  if (response.status === 429) {
    const delay = Math.pow(2, response.retryCount) * 1000;
    return { shouldRetry: true, delay };
  }

  // Parse response data with error handling
  try {
    return JSON.parse(response.data);
  } catch (error) {
    // Log error but don't throw - return empty data instead
    logger.warn('Failed to parse API response', { error, response });
    return { data: null, error: 'ParseError' };
  }
}
```

### README and Documentation

#### Document Setup and Usage

````markdown
## Installation

```bash
npm install -g @guerchele/bitbucket-mcp-server
```
````

## Configuration

Create a `.env` file with your Bitbucket credentials:

```env
ATLASSIAN_USER_EMAIL=your_email@company.com
ATLASSIAN_API_TOKEN=your_token
```

## Usage

### Basic Usage

```bash
# Start the server
bitbucket-mcp-server

# List repositories
bitbucket-mcp-server repository list
```

### Advanced Usage

```bash
# Create a new repository
bitbucket-mcp-server repository create \
  --workspace my-workspace \
  --name my-repo \
  --description "My new repository" \
  --private
```

````

## ⚠️ Error Handling

### Error Types

#### Use Custom Error Classes
```typescript
// Good: Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
````

#### Consistent Error Handling

```typescript
// Good: Consistent error handling
async function createRepository(config: RepositoryConfig): Promise<Repository> {
  try {
    // Validate input
    if (!config.name || !config.workspace) {
      throw new ValidationError('Repository name and workspace are required');
    }

    // Make API call
    const response = await apiClient.post('/repositories', config);
    return response.data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error; // Re-throw validation errors
    }

    if (error.response?.status === 401) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (error.response?.status === 403) {
      throw new PermissionError('Insufficient permissions');
    }

    // Log unexpected errors
    logger.error('Unexpected error creating repository', { error, config });
    throw new ApiError('Failed to create repository', 500, error);
  }
}
```

### Error Messages

#### Use Clear, Actionable Error Messages

```typescript
// Good: Clear, actionable error messages
throw new ValidationError('Repository name must be between 1 and 100 characters', 'name');

throw new AuthenticationError(
  'Invalid API token. Please check your ATLASSIAN_API_TOKEN environment variable'
);

throw new PermissionError('You do not have permission to create repositories in this workspace');

// Bad: Vague or unhelpful error messages
throw new Error('Invalid input');
throw new Error('Authentication failed');
throw new Error('Permission denied');
```

## 🧪 Testing Standards

### Test Structure

#### Use Descriptive Test Names

```typescript
// Good: Descriptive test names
describe('RepositoryService', () => {
  describe('createRepository', () => {
    it('should create a public repository with valid configuration', async () => {
      // Test implementation
    });

    it('should create a private repository when isPrivate is true', async () => {
      // Test implementation
    });

    it('should throw ValidationError when repository name is missing', async () => {
      // Test implementation
    });

    it('should throw AuthenticationError when API token is invalid', async () => {
      // Test implementation
    });
  });
});
```

#### Follow AAA Pattern

```typescript
// Good: Arrange, Act, Assert pattern
it('should return user repositories when valid workspace is provided', async () => {
  // Arrange
  const workspace = 'test-workspace';
  const mockRepositories = [
    { name: 'repo1', isPrivate: false },
    { name: 'repo2', isPrivate: true },
  ];
  jest.spyOn(apiClient, 'get').mockResolvedValue({ data: mockRepositories });

  // Act
  const result = await repositoryService.getRepositories(workspace);

  // Assert
  expect(result).toEqual(mockRepositories);
  expect(apiClient.get).toHaveBeenCalledWith(`/repositories/${workspace}`);
});
```

### Mocking

#### Mock External Dependencies

```typescript
// Good: Mock external dependencies
jest.mock('axios');
jest.mock('../utils/logger.util.js');

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let mockAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    mockAxios = axios as jest.Mocked<typeof axios>;
    apiClient = new ApiClient();
  });

  it('should make GET request with correct parameters', async () => {
    // Arrange
    const mockResponse = { data: { id: 1, name: 'test' } };
    mockAxios.get.mockResolvedValue(mockResponse);

    // Act
    const result = await apiClient.get('/test');

    // Assert
    expect(mockAxios.get).toHaveBeenCalledWith('/test');
    expect(result).toEqual(mockResponse.data);
  });
});
```

### Test Coverage

#### Aim for High Coverage

```typescript
// Good: Test all code paths
describe('validateRepositoryConfig', () => {
  it('should return true for valid configuration', () => {
    const config = { name: 'test-repo', workspace: 'test-workspace' };
    expect(validateRepositoryConfig(config)).toBe(true);
  });

  it('should return false when name is missing', () => {
    const config = { workspace: 'test-workspace' };
    expect(validateRepositoryConfig(config)).toBe(false);
  });

  it('should return false when workspace is missing', () => {
    const config = { name: 'test-repo' };
    expect(validateRepositoryConfig(config)).toBe(false);
  });

  it('should return false when name is too long', () => {
    const config = {
      name: 'a'.repeat(101),
      workspace: 'test-workspace',
    };
    expect(validateRepositoryConfig(config)).toBe(false);
  });
});
```

## ⚡ Performance Guidelines

### Async/Await

#### Use Async/Await Consistently

```typescript
// Good: Use async/await
async function processRepositories(repositories: Repository[]): Promise<ProcessedRepository[]> {
  const results: ProcessedRepository[] = [];

  for (const repo of repositories) {
    try {
      const processed = await processRepository(repo);
      results.push(processed);
    } catch (error) {
      logger.warn('Failed to process repository', { repo: repo.name, error });
    }
  }

  return results;
}

// Bad: Mix promises and async/await
function processRepositories(repositories: Repository[]): Promise<ProcessedRepository[]> {
  return Promise.all(
    repositories.map(repo =>
      processRepository(repo)
        .then(processed => processed)
        .catch(error => {
          logger.warn('Failed to process repository', { repo: repo.name, error });
          return null;
        })
    )
  );
}
```

### Memory Management

#### Avoid Memory Leaks

```typescript
// Good: Clean up resources
class RepositoryService {
  private timers: NodeJS.Timeout[] = [];

  startPeriodicSync(interval: number): void {
    const timer = setInterval(() => {
      this.syncRepositories();
    }, interval);

    this.timers.push(timer);
  }

  cleanup(): void {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers = [];
  }
}

// Good: Use weak references when appropriate
class Cache {
  private cache = new WeakMap<object, any>();

  set(key: object, value: any): void {
    this.cache.set(key, value);
  }

  get(key: object): any {
    return this.cache.get(key);
  }
}
```

### Optimization

#### Use Efficient Data Structures

```typescript
// Good: Use appropriate data structures
class RepositoryManager {
  private repositories = new Map<string, Repository>();
  private userRepositories = new Map<string, Set<string>>();

  addRepository(repo: Repository): void {
    this.repositories.set(repo.id, repo);

    if (!this.userRepositories.has(repo.ownerId)) {
      this.userRepositories.set(repo.ownerId, new Set());
    }

    this.userRepositories.get(repo.ownerId)!.add(repo.id);
  }

  getRepositoriesByUser(userId: string): Repository[] {
    const repoIds = this.userRepositories.get(userId) || new Set();
    return Array.from(repoIds).map(id => this.repositories.get(id)!);
  }
}
```

## 🔒 Security Guidelines

### Input Validation

#### Validate All Inputs

```typescript
// Good: Validate all inputs
import { z } from 'zod';

const RepositorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
  workspace: z.string().min(1).max(100),
});

function createRepository(input: unknown): Promise<Repository> {
  // Validate input
  const config = RepositorySchema.parse(input);

  // Process validated input
  return repositoryService.create(config);
}
```

#### Sanitize User Input

```typescript
// Good: Sanitize user input
function sanitizeRepositoryName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Secure Coding Practices

#### Use Secure Defaults

```typescript
// Good: Secure defaults
interface SecurityConfig {
  requireAuthentication: boolean;
  allowCORS: boolean;
  rateLimit: number;
  maxRequestSize: number;
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  requireAuthentication: true,
  allowCORS: false,
  rateLimit: 100,
  maxRequestSize: 1024 * 1024, // 1MB
};
```

#### Handle Sensitive Data

```typescript
// Good: Handle sensitive data securely
class TokenManager {
  private tokens = new Map<string, string>();

  storeToken(key: string, token: string): void {
    // Hash the token before storing
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    this.tokens.set(key, hashedToken);
  }

  validateToken(key: string, token: string): boolean {
    const storedHash = this.tokens.get(key);
    if (!storedHash) return false;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return storedHash === tokenHash;
  }

  // Never log sensitive data
  logTokenOperation(operation: string, key: string): void {
    logger.info('Token operation', { operation, key: key.substring(0, 8) + '...' });
  }
}
```

## 🎯 Best Practices Summary

### Code Quality Checklist

- [ ] **TypeScript**: Use strict typing, avoid `any` types
- [ ] **Naming**: Use descriptive, consistent naming conventions
- [ ] **Formatting**: Follow 2-space indentation, 100-character line limit
- [ ] **Documentation**: Document public APIs with JSDoc
- [ ] **Error Handling**: Use custom error classes, provide clear messages
- [ ] **Testing**: Write comprehensive tests with good coverage
- [ ] **Security**: Validate inputs, handle sensitive data securely
- [ ] **Performance**: Use async/await, avoid memory leaks

### Quick Reference

```typescript
// ✅ Good practices
interface UserConfig {
  name: string;
  email: string;
  isActive: boolean;
}

async function createUser(config: UserConfig): Promise<User> {
  // Implementation
}

// ❌ Avoid these patterns
function createUser(config: any): any {
  // Implementation
}
```

This style guide ensures consistent, maintainable, and secure code across the Bitbucket MCP Server project. Follow these guidelines to contribute high-quality code that integrates seamlessly with the existing codebase.

For additional guidance, refer to the [Contributing Guide](CONTRIBUTING.md) and [Testing Guide](TESTING.md).
