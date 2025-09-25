# Boas Práticas para Testes - Bitbucket MCP Server

Este documento detalha as melhores práticas para escrever testes eficazes, mantíveis e confiáveis no projeto.

## Princípios Fundamentais

### 1. FIRST - Características de Bons Testes

#### **F**ast (Rápido)
- Testes devem executar rapidamente
- Evitar operações I/O desnecessárias
- Usar mocks para dependências lentas

```typescript
// ❌ Lento - faz chamada real à API
it('should get user data', async () => {
  const user = await bitbucketAPI.getUser('test-user');
  expect(user).toBeDefined();
});

// ✅ Rápido - usa mock
it('should get user data', async () => {
  const mockUser = { id: 1, name: 'Test User' };
  bitbucketAPI.getUser = jest.fn().mockResolvedValue(mockUser);
  
  const user = await bitbucketAPI.getUser('test-user');
  expect(user).toEqual(mockUser);
});
```

#### **I**ndependent (Independente)
- Cada teste deve ser isolado
- Não depender de estado de outros testes
- Usar setup/teardown apropriados

```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockAPI: jest.Mocked<BitbucketAPI>;

  beforeEach(() => {
    // Setup limpo para cada teste
    mockAPI = createMockAPI();
    userService = new UserService(mockAPI);
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup após cada teste
    jest.restoreAllMocks();
  });
});
```

#### **R**epeatable (Repetível)
- Testes devem produzir resultados consistentes
- Evitar dependências de tempo/data
- Usar dados determinísticos

```typescript
// ❌ Não repetível - depende de data atual
it('should create token with current date', () => {
  const token = createToken();
  expect(token.expiresAt).toBe(new Date());
});

// ✅ Repetível - data fixa
it('should create token with specified date', () => {
  const fixedDate = new Date('2024-01-01T00:00:00Z');
  const token = createToken(fixedDate);
  expect(token.expiresAt).toBe(fixedDate);
});
```

#### **S**elf-Validating (Auto-validável)
- Testes devem ter resultado claro (pass/fail)
- Evitar validação manual
- Usar assertions específicas

```typescript
// ❌ Não auto-validável
it('should process data correctly', () => {
  const result = processData(input);
  console.log('Result:', result); // Requer inspeção manual
});

// ✅ Auto-validável
it('should process data correctly', () => {
  const result = processData(input);
  expect(result).toEqual(expectedOutput);
  expect(result.status).toBe('success');
  expect(result.data).toHaveLength(3);
});
```

#### **T**imely (Oportuno)
- Escrever testes junto com o código
- Testes devem ser escritos antes ou durante o desenvolvimento
- Manter testes atualizados

### 2. Estrutura AAA (Arrange, Act, Assert)

```typescript
it('should authenticate user with valid credentials', async () => {
  // Arrange - Preparar dados e mocks
  const credentials = { username: 'testuser', password: 'testpass' };
  const expectedToken = 'valid_jwt_token';
  const mockAuthService = {
    authenticate: jest.fn().mockResolvedValue({ token: expectedToken })
  };

  // Act - Executar a ação sendo testada
  const result = await mockAuthService.authenticate(credentials);

  // Assert - Verificar o resultado
  expect(result.token).toBe(expectedToken);
  expect(mockAuthService.authenticate).toHaveBeenCalledWith(credentials);
  expect(mockAuthService.authenticate).toHaveBeenCalledTimes(1);
});
```

## Padrões de Teste

### 1. Testes de Função Simples

```typescript
describe('calculateTotal', () => {
  it('should return sum of all items', () => {
    // Arrange
    const items = [10, 20, 30];
    
    // Act
    const total = calculateTotal(items);
    
    // Assert
    expect(total).toBe(60);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('should handle negative numbers', () => {
    const items = [-10, 20, -5];
    expect(calculateTotal(items)).toBe(5);
  });
});
```

### 2. Testes de Classe com Dependências

```typescript
describe('RepositoryService', () => {
  let repositoryService: RepositoryService;
  let mockAPI: jest.Mocked<BitbucketAPI>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockAPI = createMockBitbucketAPI();
    mockLogger = createMockLogger();
    repositoryService = new RepositoryService(mockAPI, mockLogger);
  });

  describe('getRepositories', () => {
    it('should return repositories from API', async () => {
      // Arrange
      const mockRepos = [
        { id: 1, name: 'repo1', slug: 'repo1' },
        { id: 2, name: 'repo2', slug: 'repo2' }
      ];
      mockAPI.getRepositories.mockResolvedValue(mockRepos);

      // Act
      const result = await repositoryService.getRepositories('PROJ');

      // Assert
      expect(result).toEqual(mockRepos);
      expect(mockAPI.getRepositories).toHaveBeenCalledWith('PROJ');
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching repositories for project PROJ');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const error = new Error('API Error');
      mockAPI.getRepositories.mockRejectedValue(error);

      // Act & Assert
      await expect(repositoryService.getRepositories('PROJ'))
        .rejects.toThrow('API Error');
      
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch repositories', error);
    });
  });
});
```

### 3. Testes de Integração

```typescript
describe('Authentication Flow Integration', () => {
  let testServer: TestServer;
  let mcpClient: MCPTestClient;

  beforeAll(async () => {
    testServer = await createTestServer();
    mcpClient = new MCPTestClient(testServer.url);
  });

  afterAll(async () => {
    await testServer.close();
  });

  it('should complete OAuth flow successfully', async () => {
    // Arrange
    const authRequest = {
      grantType: 'authorization_code',
      code: 'test_auth_code',
      redirectUri: 'http://localhost:3000/callback'
    };

    // Act
    const authResponse = await mcpClient.sendRequest('auth/get_oauth_token', authRequest);

    // Assert
    expect(authResponse.access_token).toBeDefined();
    expect(authResponse.refresh_token).toBeDefined();
    expect(authResponse.expires_in).toBeGreaterThan(0);
  });
});
```

## Mocking e Stubbing

### 1. Mocks de API Externa

```typescript
// tests/utils/mocks/bitbucket-api.mock.ts
export const createMockBitbucketAPI = (): jest.Mocked<BitbucketAPI> => ({
  authenticate: jest.fn(),
  getRepositories: jest.fn(),
  createPullRequest: jest.fn(),
  getPullRequest: jest.fn(),
  updatePullRequest: jest.fn(),
  deletePullRequest: jest.fn(),
  listPullRequests: jest.fn(),
  mergePullRequest: jest.fn(),
  declinePullRequest: jest.fn(),
  reopenPullRequest: jest.fn(),
  createComment: jest.fn(),
  getComment: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
  getActivity: jest.fn(),
  getDiff: jest.fn(),
  getChanges: jest.fn()
});

// Uso nos testes
const mockAPI = createMockBitbucketAPI();
mockAPI.getRepositories.mockResolvedValue([
  { id: 1, name: 'test-repo', slug: 'test-repo' }
]);
```

### 2. Mocks de Serviços Internos

```typescript
// Mock de Logger
export const createMockLogger = (): jest.Mocked<Logger> => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
});

// Mock de Config
export const createMockConfig = (): jest.Mocked<Config> => ({
  bitbucketUrl: 'http://localhost:3001',
  mcpPort: 3000,
  logLevel: 'error'
});
```

### 3. Spies para Verificação

```typescript
it('should log authentication attempts', async () => {
  // Arrange
  const logger = createMockLogger();
  const authService = new AuthService(logger);
  
  // Act
  await authService.authenticate({ username: 'test', password: 'test' });
  
  // Assert
  expect(logger.info).toHaveBeenCalledWith('Authentication attempt for user: test');
});
```

## Testes Assíncronos

### 1. Promises

```typescript
it('should resolve with user data', async () => {
  const userService = new UserService();
  const user = await userService.getUser('123');
  expect(user.id).toBe('123');
});

it('should reject with error', async () => {
  const userService = new UserService();
  await expect(userService.getUser('invalid'))
    .rejects.toThrow('User not found');
});
```

### 2. Callbacks

```typescript
it('should call callback with result', (done) => {
  const service = new AsyncService();
  
  service.processData('input', (error, result) => {
    expect(error).toBeNull();
    expect(result).toBe('processed_input');
    done();
  });
});
```

### 3. Timeouts

```typescript
it('should complete within timeout', async () => {
  const service = new SlowService();
  
  const result = await Promise.race([
    service.slowOperation(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    )
  ]);
  
  expect(result).toBeDefined();
}, 10000); // 10 segundos de timeout
```

## Testes de Erro

### 1. Validação de Input

```typescript
describe('validateInput', () => {
  it('should throw error for invalid input', () => {
    expect(() => validateInput(null))
      .toThrow('Input cannot be null');
    
    expect(() => validateInput(''))
      .toThrow('Input cannot be empty');
    
    expect(() => validateInput(123))
      .toThrow('Input must be a string');
  });
});
```

### 2. Tratamento de Exceções

```typescript
it('should handle network errors gracefully', async () => {
  const mockAPI = createMockBitbucketAPI();
  mockAPI.getRepositories.mockRejectedValue(new Error('Network error'));
  
  const service = new RepositoryService(mockAPI);
  
  await expect(service.getRepositories('PROJ'))
    .rejects.toThrow('Failed to fetch repositories: Network error');
});
```

## Testes de Performance

### 1. Benchmarks

```typescript
describe('Performance Tests', () => {
  it('should process 1000 items within 1 second', async () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
    
    const startTime = Date.now();
    const result = await processItems(items);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(1000);
    expect(result).toHaveLength(1000);
  });
});
```

### 2. Memory Leaks

```typescript
it('should not leak memory with repeated operations', async () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Executar operação múltiplas vezes
  for (let i = 0; i < 100; i++) {
    await performOperation();
  }
  
  // Forçar garbage collection
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;
  
  // Verificar que o aumento de memória é aceitável
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
});
```

## Organização de Testes

### 1. Estrutura de Describe

```typescript
describe('UserService', () => {
  describe('authentication', () => {
    describe('with valid credentials', () => {
      it('should return user token', () => {});
      it('should update last login', () => {});
    });
    
    describe('with invalid credentials', () => {
      it('should throw authentication error', () => {});
      it('should log failed attempt', () => {});
    });
  });
  
  describe('user management', () => {
    describe('createUser', () => {
      it('should create new user', () => {});
      it('should validate user data', () => {});
    });
  });
});
```

### 2. Setup e Teardown

```typescript
describe('Database Tests', () => {
  let testDb: TestDatabase;
  
  beforeAll(async () => {
    testDb = await createTestDatabase();
  });
  
  beforeEach(async () => {
    await testDb.clear();
    await testDb.seed();
  });
  
  afterAll(async () => {
    await testDb.close();
  });
});
```

## Ferramentas e Utilitários

### 1. Custom Matchers

```typescript
// tests/utils/custom-matchers.ts
expect.extend({
  toBeValidJWT(received: string) {
    const parts = received.split('.');
    const pass = parts.length === 3 && parts.every(part => part.length > 0);
    
    return {
      message: () => `expected ${received} to be a valid JWT token`,
      pass
    };
  }
});

// Uso
expect(token).toBeValidJWT();
```

### 2. Test Helpers

```typescript
// tests/utils/test-helpers.ts
export const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  ...overrides
});

export const waitFor = (condition: () => boolean, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 100);
      }
    };
    
    check();
  });
};
```

## Checklist de Qualidade

### Antes de Commitar

- [ ] Todos os testes passam
- [ ] Cobertura de código atende aos requisitos
- [ ] Testes são rápidos e independentes
- [ ] Nomes de teste são descritivos
- [ ] Mocks são apropriados e verificados
- [ ] Casos de erro são testados
- [ ] Documentação está atualizada

### Code Review

- [ ] Testes cobrem casos de sucesso e erro
- [ ] Estrutura AAA é seguida
- [ ] Mocks são usados corretamente
- [ ] Assertions são específicas
- [ ] Setup/teardown é apropriado
- [ ] Performance é considerada

---

**Lembre-se**: Bons testes são um investimento que paga dividendos em confiabilidade, manutenibilidade e velocidade de desenvolvimento.
