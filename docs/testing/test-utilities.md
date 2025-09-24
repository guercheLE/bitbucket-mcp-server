# Utilitários de Teste - Bitbucket MCP Server

Este documento descreve os utilitários, helpers e ferramentas disponíveis para facilitar a escrita e execução de testes.

## Visão Geral

O projeto inclui uma coleção abrangente de utilitários de teste que simplificam a criação de mocks, fixtures, helpers e ferramentas de validação para diferentes tipos de teste.

## Estrutura de Utilitários

```
tests/utils/
├── mocks/              # Mocks e stubs
│   ├── bitbucket-api.mock.ts
│   ├── mcp-server.mock.ts
│   ├── auth-service.mock.ts
│   └── logger.mock.ts
├── fixtures/           # Dados de teste
│   ├── auth/
│   ├── api-responses/
│   ├── mcp-messages/
│   └── users/
├── helpers/            # Funções auxiliares
│   ├── mcp-client.helper.ts
│   ├── test-server.helper.ts
│   ├── data-factory.helper.ts
│   └── assertion.helper.ts
├── setup/              # Configuração de testes
│   ├── test-environment.ts
│   ├── database-setup.ts
│   └── mock-setup.ts
└── custom-matchers/    # Matchers personalizados
    ├── jwt.matchers.ts
    ├── api-response.matchers.ts
    └── mcp-protocol.matchers.ts
```

## Mocks e Stubs

### 1. Mock do Bitbucket API

```typescript
// tests/utils/mocks/bitbucket-api.mock.ts
import { BitbucketAPI } from '../../src/types/bitbucket-api';

export interface MockBitbucketAPI extends jest.Mocked<BitbucketAPI> {
  // Métodos adicionais para controle de mock
  resetMocks(): void;
  setAuthToken(token: string): void;
  simulateError(error: Error): void;
}

export const createMockBitbucketAPI = (): MockBitbucketAPI => {
  const mockAPI = {
    // Authentication
    authenticate: jest.fn(),
    refreshToken: jest.fn(),
    revokeToken: jest.fn(),
    
    // Repositories
    getRepositories: jest.fn(),
    createRepository: jest.fn(),
    updateRepository: jest.fn(),
    deleteRepository: jest.fn(),
    
    // Pull Requests
    createPullRequest: jest.fn(),
    getPullRequest: jest.fn(),
    updatePullRequest: jest.fn(),
    deletePullRequest: jest.fn(),
    listPullRequests: jest.fn(),
    mergePullRequest: jest.fn(),
    declinePullRequest: jest.fn(),
    reopenPullRequest: jest.fn(),
    
    // Comments
    createComment: jest.fn(),
    getComment: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
    
    // Activity and Changes
    getActivity: jest.fn(),
    getDiff: jest.fn(),
    getChanges: jest.fn(),
    
    // Utility methods
    resetMocks: () => {
      Object.values(mockAPI).forEach(mock => {
        if (jest.isMockFunction(mock)) {
          mock.mockReset();
        }
      });
    },
    
    setAuthToken: (token: string) => {
      mockAPI.authenticate.mockResolvedValue({ access_token: token });
    },
    
    simulateError: (error: Error) => {
      Object.values(mockAPI).forEach(mock => {
        if (jest.isMockFunction(mock)) {
          mock.mockRejectedValue(error);
        }
      });
    }
  };
  
  return mockAPI as MockBitbucketAPI;
};
```

### 2. Mock do MCP Server

```typescript
// tests/utils/mocks/mcp-server.mock.ts
import { MCPServer } from '../../src/server/mcp-server';

export interface MockMCPServer extends jest.Mocked<MCPServer> {
  simulateToolExecution(toolName: string, result: any): void;
  simulateError(error: Error): void;
  getToolCalls(): Array<{ tool: string; params: any }>;
}

export const createMockMCPServer = (): MockMCPServer => {
  const toolCalls: Array<{ tool: string; params: any }> = [];
  
  const mockServer = {
    initialize: jest.fn(),
    registerTool: jest.fn(),
    executeTool: jest.fn().mockImplementation((tool: string, params: any) => {
      toolCalls.push({ tool, params });
      return Promise.resolve({ result: 'mock_result' });
    }),
    getAvailableTools: jest.fn(),
    shutdown: jest.fn(),
    
    simulateToolExecution: (toolName: string, result: any) => {
      mockServer.executeTool.mockImplementation((tool: string, params: any) => {
        if (tool === toolName) {
          return Promise.resolve(result);
        }
        return Promise.resolve({ result: 'default_mock_result' });
      });
    },
    
    simulateError: (error: Error) => {
      mockServer.executeTool.mockRejectedValue(error);
    },
    
    getToolCalls: () => [...toolCalls]
  };
  
  return mockServer as MockMCPServer;
};
```

### 3. Mock do Logger

```typescript
// tests/utils/mocks/logger.mock.ts
import { Logger } from '../../src/types/logger';

export interface MockLogger extends jest.Mocked<Logger> {
  getLogs(): Array<{ level: string; message: string; meta?: any }>;
  clearLogs(): void;
  hasLogged(level: string, message: string): boolean;
}

export const createMockLogger = (): MockLogger => {
  const logs: Array<{ level: string; message: string; meta?: any }> = [];
  
  const mockLogger = {
    info: jest.fn().mockImplementation((message: string, meta?: any) => {
      logs.push({ level: 'info', message, meta });
    }),
    warn: jest.fn().mockImplementation((message: string, meta?: any) => {
      logs.push({ level: 'warn', message, meta });
    }),
    error: jest.fn().mockImplementation((message: string, meta?: any) => {
      logs.push({ level: 'error', message, meta });
    }),
    debug: jest.fn().mockImplementation((message: string, meta?: any) => {
      logs.push({ level: 'debug', message, meta });
    }),
    
    getLogs: () => [...logs],
    clearLogs: () => logs.length = 0,
    hasLogged: (level: string, message: string) => {
      return logs.some(log => log.level === level && log.message.includes(message));
    }
  };
  
  return mockLogger as MockLogger;
};
```

## Fixtures e Dados de Teste

### 1. Fixtures de Autenticação

```typescript
// tests/fixtures/auth/oauth-token.json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_12345",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "read write"
}

// tests/fixtures/auth/user-profile.json
{
  "id": "test-user-123",
  "username": "testuser",
  "display_name": "Test User",
  "email": "test@example.com",
  "account_status": "active",
  "created_on": "2024-01-01T00:00:00Z"
}
```

### 2. Fixtures de API Responses

```typescript
// tests/fixtures/api-responses/repositories.json
[
  {
    "id": 1,
    "name": "test-repository",
    "slug": "test-repository",
    "description": "A test repository",
    "is_private": false,
    "created_on": "2024-01-01T00:00:00Z",
    "updated_on": "2024-01-01T00:00:00Z",
    "size": 1024,
    "language": "TypeScript"
  }
]

// tests/fixtures/api-responses/pull-requests.json
[
  {
    "id": 1,
    "title": "Test Pull Request",
    "description": "This is a test pull request",
    "state": "OPEN",
    "author": {
      "username": "testuser",
      "display_name": "Test User"
    },
    "source": {
      "branch": {
        "name": "feature/test-branch"
      }
    },
    "destination": {
      "branch": {
        "name": "main"
      }
    },
    "created_on": "2024-01-01T00:00:00Z",
    "updated_on": "2024-01-01T00:00:00Z"
  }
]
```

### 3. Fixtures de Mensagens MCP

```typescript
// tests/fixtures/mcp-messages/initialize-request.json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "clientInfo": {
      "name": "test-client",
      "version": "1.0.0"
    }
  }
}

// tests/fixtures/mcp-messages/tool-execution-request.json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "mcp_bitbucket_repository_list",
    "arguments": {
      "projectKey": "TEST"
    }
  }
}
```

## Helpers de Teste

### 1. MCP Client Helper

```typescript
// tests/utils/helpers/mcp-client.helper.ts
export class MCPTestClient {
  private serverUrl: string;
  private requestId = 0;
  
  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }
  
  async sendRequest(method: string, params: any = {}): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params
    };
    
    const response = await fetch(this.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return result.result;
  }
  
  async initialize(): Promise<any> {
    return this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      clientInfo: { name: 'test-client', version: '1.0.0' }
    });
  }
  
  async listTools(): Promise<any> {
    return this.sendRequest('tools/list');
  }
  
  async callTool(name: string, arguments_: any = {}): Promise<any> {
    return this.sendRequest('tools/call', { name, arguments: arguments_ });
  }
}
```

### 2. Test Server Helper

```typescript
// tests/utils/helpers/test-server.helper.ts
import { MCPServer } from '../../src/server/mcp-server';
import { createMockBitbucketAPI } from '../mocks/bitbucket-api.mock';

export class TestServer {
  private server: MCPServer;
  private port: number;
  private url: string;
  
  constructor(port: number = 0) {
    this.port = port;
    this.url = `http://localhost:${this.port}`;
  }
  
  async start(): Promise<void> {
    const mockAPI = createMockBitbucketAPI();
    this.server = new MCPServer(mockAPI);
    
    await this.server.start(this.port);
    this.port = this.server.getPort();
    this.url = `http://localhost:${this.port}`;
  }
  
  async stop(): Promise<void> {
    if (this.server) {
      await this.server.stop();
    }
  }
  
  getUrl(): string {
    return this.url;
  }
  
  getPort(): number {
    return this.port;
  }
  
  getServer(): MCPServer {
    return this.server;
  }
}

export const createTestServer = async (port?: number): Promise<TestServer> => {
  const server = new TestServer(port);
  await server.start();
  return server;
};
```

### 3. Data Factory Helper

```typescript
// tests/utils/helpers/data-factory.helper.ts
export class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      username: `testuser-${Math.random().toString(36).substr(2, 5)}`,
      display_name: 'Test User',
      email: 'test@example.com',
      account_status: 'active',
      created_on: new Date().toISOString(),
      ...overrides
    };
  }
  
  static createRepository(overrides: Partial<Repository> = {}): Repository {
    return {
      id: Math.floor(Math.random() * 1000),
      name: `test-repo-${Math.random().toString(36).substr(2, 5)}`,
      slug: `test-repo-${Math.random().toString(36).substr(2, 5)}`,
      description: 'A test repository',
      is_private: false,
      created_on: new Date().toISOString(),
      updated_on: new Date().toISOString(),
      size: Math.floor(Math.random() * 10000),
      language: 'TypeScript',
      ...overrides
    };
  }
  
  static createPullRequest(overrides: Partial<PullRequest> = {}): PullRequest {
    return {
      id: Math.floor(Math.random() * 1000),
      title: `Test PR ${Math.random().toString(36).substr(2, 5)}`,
      description: 'This is a test pull request',
      state: 'OPEN',
      author: this.createUser(),
      source: {
        branch: { name: `feature/test-${Math.random().toString(36).substr(2, 5)}` }
      },
      destination: {
        branch: { name: 'main' }
      },
      created_on: new Date().toISOString(),
      updated_on: new Date().toISOString(),
      ...overrides
    };
  }
  
  static createOAuthToken(overrides: Partial<OAuthToken> = {}): OAuthToken {
    return {
      access_token: `token_${Math.random().toString(36).substr(2, 20)}`,
      refresh_token: `refresh_${Math.random().toString(36).substr(2, 20)}`,
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'read write',
      ...overrides
    };
  }
}
```

### 4. Assertion Helper

```typescript
// tests/utils/helpers/assertion.helper.ts
export class TestAssertions {
  static expectValidJWT(token: string): void {
    expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
  }
  
  static expectValidUUID(uuid: string): void {
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  }
  
  static expectValidISO8601(dateString: string): void {
    expect(new Date(dateString).toISOString()).toBe(dateString);
  }
  
  static expectMCPResponse(response: any): void {
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('result');
  }
  
  static expectMCPError(response: any): void {
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('code');
    expect(response.error).toHaveProperty('message');
  }
  
  static expectBitbucketAPIResponse(response: any): void {
    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
  }
}
```

## Custom Matchers

### 1. JWT Matchers

```typescript
// tests/utils/custom-matchers/jwt.matchers.ts
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidJWT(): R;
      toHaveValidExpiration(): R;
    }
  }
}

expect.extend({
  toBeValidJWT(received: string) {
    const parts = received.split('.');
    const isValid = parts.length === 3 && parts.every(part => part.length > 0);
    
    return {
      message: () => `expected ${received} to be a valid JWT token`,
      pass: isValid
    };
  },
  
  toHaveValidExpiration(received: string) {
    try {
      const payload = JSON.parse(atob(received.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const isValid = payload.exp && payload.exp > now;
      
      return {
        message: () => `expected token to have valid expiration (exp: ${payload.exp}, now: ${now})`,
        pass: isValid
      };
    } catch (error) {
      return {
        message: () => `expected valid JWT token, but got error: ${error}`,
        pass: false
      };
    }
  }
});
```

### 2. API Response Matchers

```typescript
// tests/utils/custom-matchers/api-response.matchers.ts
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidBitbucketResponse(): R;
      toHavePagination(): R;
    }
  }
}

expect.extend({
  toBeValidBitbucketResponse(received: any) {
    const hasRequiredFields = received && typeof received === 'object';
    const hasValues = Array.isArray(received.values) || received.values === undefined;
    
    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid Bitbucket API response`,
      pass: hasRequiredFields && hasValues
    };
  },
  
  toHavePagination(received: any) {
    const hasPagination = received && 
      typeof received.size === 'number' &&
      typeof received.page === 'number' &&
      typeof received.pagelen === 'number';
    
    return {
      message: () => `expected response to have pagination fields (size, page, pagelen)`,
      pass: hasPagination
    };
  }
});
```

## Setup de Ambiente de Teste

### 1. Test Environment Setup

```typescript
// tests/utils/setup/test-environment.ts
import { TestServer } from '../helpers/test-server.helper';
import { MCPTestClient } from '../helpers/mcp-client.helper';

export class TestEnvironment {
  private server: TestServer;
  private client: MCPTestClient;
  
  async setup(): Promise<void> {
    this.server = await createTestServer();
    this.client = new MCPTestClient(this.server.getUrl());
    
    // Configurar variáveis de ambiente de teste
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error';
    process.env.BITBUCKET_API_URL = 'http://localhost:3001';
  }
  
  async teardown(): Promise<void> {
    if (this.server) {
      await this.server.stop();
    }
    
    // Limpar variáveis de ambiente
    delete process.env.NODE_ENV;
    delete process.env.LOG_LEVEL;
    delete process.env.BITBUCKET_API_URL;
  }
  
  getServer(): TestServer {
    return this.server;
  }
  
  getClient(): MCPTestClient {
    return this.client;
  }
}

export const createTestEnvironment = async (): Promise<TestEnvironment> => {
  const env = new TestEnvironment();
  await env.setup();
  return env;
};
```

### 2. Global Test Setup

```typescript
// tests/setup.ts
import './utils/custom-matchers/jwt.matchers';
import './utils/custom-matchers/api-response.matchers';

// Configuração global de timeout
jest.setTimeout(30000);

// Mock global do console para reduzir ruído nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Cleanup após cada teste
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
```

## Exemplos de Uso

### 1. Teste Unitário com Mocks

```typescript
import { createMockBitbucketAPI } from '../utils/mocks/bitbucket-api.mock';
import { createMockLogger } from '../utils/mocks/logger.mock';
import { TestDataFactory } from '../utils/helpers/data-factory.helper';

describe('RepositoryService', () => {
  let repositoryService: RepositoryService;
  let mockAPI: MockBitbucketAPI;
  let mockLogger: MockLogger;
  
  beforeEach(() => {
    mockAPI = createMockBitbucketAPI();
    mockLogger = createMockLogger();
    repositoryService = new RepositoryService(mockAPI, mockLogger);
  });
  
  it('should fetch repositories successfully', async () => {
    // Arrange
    const mockRepos = [TestDataFactory.createRepository()];
    mockAPI.getRepositories.mockResolvedValue(mockRepos);
    
    // Act
    const result = await repositoryService.getRepositories('PROJ');
    
    // Assert
    expect(result).toEqual(mockRepos);
    expect(mockAPI.getRepositories).toHaveBeenCalledWith('PROJ');
    expect(mockLogger.info).toHaveBeenCalledWith('Fetching repositories for project PROJ');
  });
});
```

### 2. Teste de Integração

```typescript
import { createTestEnvironment } from '../utils/setup/test-environment';

describe('MCP Server Integration', () => {
  let testEnv: TestEnvironment;
  
  beforeAll(async () => {
    testEnv = await createTestEnvironment();
  });
  
  afterAll(async () => {
    await testEnv.teardown();
  });
  
  it('should handle complete authentication flow', async () => {
    // Arrange
    const client = testEnv.getClient();
    await client.initialize();
    
    // Act
    const result = await client.callTool('mcp_bitbucket_auth_get_oauth_token', {
      grantType: 'authorization_code',
      code: 'test_code'
    });
    
    // Assert
    expect(result.access_token).toBeValidJWT();
    expect(result.expires_in).toBeGreaterThan(0);
  });
});
```

---

**Nota**: Estes utilitários são projetados para serem reutilizáveis e consistentes em todo o projeto. Sempre use os helpers e mocks fornecidos para manter a consistência e facilitar a manutenção dos testes.
