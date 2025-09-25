# Checklist Específico por Tipo de Teste - Bitbucket MCP Server

Este documento fornece checklists detalhados e específicos para cada tipo de teste no projeto.

## 🧪 Testes Unitários

### Estrutura e Organização
- [ ] **Arquivo de Teste**
  - [ ] Nome segue convenção `*.test.ts`
  - [ ] Localizado em `tests/unit/`
  - [ ] Organizado por módulo/funcionalidade
  - [ ] Importa apenas o necessário

- [ ] **Describe Blocks**
  - [ ] Agrupa testes relacionados
  - [ ] Nome descreve a classe/função testada
  - [ ] Sub-describes para métodos específicos
  - [ ] Estrutura hierárquica clara

- [ ] **Setup e Teardown**
  - [ ] `beforeEach` limpa estado
  - [ ] `afterEach` limpa recursos
  - [ ] Mocks são resetados
  - [ ] Não há estado compartilhado

### Isolamento e Dependências
- [ ] **Mocks Completos**
  - [ ] Todas as dependências são mockadas
  - [ ] Nenhuma chamada externa é feita
  - [ ] Mocks retornam dados consistentes
  - [ ] Comportamento de erro é mockado

- [ ] **Verificação de Mocks**
  - [ ] Chamadas são verificadas quando relevante
  - [ ] Parâmetros são validados
  - [ ] Número de chamadas é verificado
  - [ ] Ordem de chamadas é validada

### Cobertura de Código
- [ ] **Linhas de Código**
  - [ ] Todas as linhas são executadas
  - [ ] Branches condicionais são testados
  - [ ] Loops são testados
  - [ ] Early returns são testados

- [ ] **Casos de Sucesso**
  - [ ] Cenário principal funciona
  - [ ] Diferentes tipos de entrada
  - [ ] Valores válidos em diferentes formatos
  - [ ] Casos extremos válidos

- [ ] **Casos de Erro**
  - [ ] Exceções são lançadas corretamente
  - [ ] Mensagens de erro são apropriadas
  - [ ] Códigos de erro são corretos
  - [ ] Stack traces são úteis

### Performance
- [ ] **Velocidade**
  - [ ] Executa em < 100ms
  - [ ] Sem delays desnecessários
  - [ ] Mocks são eficientes
  - [ ] Setup é mínimo

- [ ] **Recursos**
  - [ ] Sem vazamentos de memória
  - [ ] Sem conexões abertas
  - [ ] Recursos são limpos
  - [ ] Sem loops infinitos

### Exemplo de Teste Unitário
```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockRepository = createMockUserRepository();
    mockLogger = createMockLogger();
    userService = new UserService(mockRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '123';
      const mockUser = { id: userId, name: 'Test User' };
      mockRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockLogger.info).toHaveBeenCalledWith(`Retrieved user ${userId}`);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 'nonexistent';
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(userId))
        .rejects.toThrow('User not found');
      
      expect(mockLogger.error).toHaveBeenCalledWith(`User ${userId} not found`);
    });
  });
});
```

## 🔗 Testes de Integração

### Configuração de Ambiente
- [ ] **Setup de Teste**
  - [ ] Ambiente de teste é isolado
  - [ ] Dados de teste são consistentes
  - [ ] Configuração é versionada
  - [ ] Limpeza é automática

- [ ] **Dependências Externas**
  - [ ] Apenas serviços externos são mockados
  - [ ] Componentes internos são reais
  - [ ] Mocks simulam comportamento real
  - [ ] Dados de mock são consistentes

### Fluxos de Trabalho
- [ ] **Integração Real**
  - [ ] Componentes são integrados
  - [ ] Dados fluem entre componentes
  - [ ] Contratos são respeitados
  - [ ] Estado é mantido

- [ ] **Cenários Completos**
  - [ ] Fluxos de usuário são testados
  - [ ] Múltiplas etapas são validadas
  - [ ] Dados persistem entre etapas
  - [ ] Rollback é testado

### Tratamento de Erro
- [ ] **Propagação de Erro**
  - [ ] Erros são propagados corretamente
  - [ ] Stack traces são úteis
  - [ ] Logs são apropriados
  - [ ] Recuperação é testada

- [ ] **Fallbacks**
  - [ ] Fallbacks são executados
  - [ ] Degradação é graceful
  - [ ] Usuário é notificado
  - [ ] Estado é consistente

### Exemplo de Teste de Integração
```typescript
describe('Authentication Integration', () => {
  let testServer: TestServer;
  let mcpClient: MCPTestClient;
  let mockBitbucketAPI: MockBitbucketAPI;

  beforeAll(async () => {
    testServer = await createTestServer();
    mcpClient = new MCPTestClient(testServer.getUrl());
    mockBitbucketAPI = testServer.getMockAPI();
  });

  afterAll(async () => {
    await testServer.close();
  });

  beforeEach(async () => {
    await testServer.reset();
    jest.clearAllMocks();
  });

  it('should complete OAuth flow successfully', async () => {
    // Arrange
    const authRequest = {
      grantType: 'authorization_code',
      code: 'test_auth_code',
      redirectUri: 'http://localhost:3000/callback'
    };
    
    mockBitbucketAPI.authenticate.mockResolvedValue({
      access_token: 'valid_token',
      refresh_token: 'refresh_token',
      expires_in: 3600
    });

    // Act
    const authResponse = await mcpClient.callTool('mcp_bitbucket_auth_get_oauth_token', authRequest);

    // Assert
    expect(authResponse.access_token).toBe('valid_token');
    expect(mockBitbucketAPI.authenticate).toHaveBeenCalledWith(authRequest);
  });

  it('should handle authentication failure gracefully', async () => {
    // Arrange
    mockBitbucketAPI.authenticate.mockRejectedValue(new Error('Invalid credentials'));

    // Act & Assert
    await expect(mcpClient.callTool('mcp_bitbucket_auth_get_oauth_token', {
      grantType: 'authorization_code',
      code: 'invalid_code'
    })).rejects.toThrow('Authentication failed');
  });
});
```

## 📋 Testes de Contrato

### Conformidade com Protocolo
- [ ] **Protocolo MCP**
  - [ ] Mensagens seguem especificação
  - [ ] Formatos JSON-RPC são válidos
  - [ ] Códigos de erro são apropriados
  - [ ] Versões são compatíveis

- [ ] **Esquemas de Dados**
  - [ ] Estrutura de dados é válida
  - [ ] Tipos de dados são corretos
  - [ ] Campos obrigatórios estão presentes
  - [ ] Campos opcionais são tratados

### Validação de API
- [ ] **Endpoints**
  - [ ] URLs são corretas
  - [ ] Métodos HTTP são apropriados
  - [ ] Headers são válidos
  - [ ] Parâmetros são corretos

- [ ] **Respostas**
  - [ ] Status codes são apropriados
  - [ ] Estrutura de resposta é válida
  - [ ] Dados são consistentes
  - [ ] Erros são informativos

### Compatibilidade
- [ ] **Versões**
  - [ ] Retrocompatibilidade é mantida
  - [ ] Mudanças breaking são detectadas
  - [ ] Evolução é suportada
  - [ ] Deprecação é gerenciada

### Exemplo de Teste de Contrato
```typescript
describe('MCP Protocol Compliance', () => {
  let mcpServer: MCPServer;
  let client: MCPTestClient;

  beforeAll(async () => {
    mcpServer = await createMCPServer();
    client = new MCPTestClient(mcpServer.getUrl());
  });

  afterAll(async () => {
    await mcpServer.close();
  });

  describe('Initialize Protocol', () => {
    it('should respond with valid MCP initialization', async () => {
      // Arrange
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      };

      // Act
      const response = await client.sendRequest('initialize', initRequest.params);

      // Assert
      expect(response).toHaveProperty('jsonrpc', '2.0');
      expect(response).toHaveProperty('id', 1);
      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('protocolVersion', '2024-11-05');
      expect(response.result).toHaveProperty('capabilities');
      expect(response.result).toHaveProperty('serverInfo');
    });

    it('should reject invalid initialization request', async () => {
      // Arrange
      const invalidRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'initialize',
        params: {
          // Missing required fields
        }
      };

      // Act & Assert
      await expect(client.sendRequest('initialize', invalidRequest.params))
        .rejects.toThrow('Invalid initialization request');
    });
  });

  describe('Tool Execution Protocol', () => {
    it('should execute tool with valid parameters', async () => {
      // Arrange
      const toolRequest = {
        name: 'mcp_bitbucket_repository_list',
        arguments: { projectKey: 'TEST' }
      };

      // Act
      const response = await client.callTool(toolRequest.name, toolRequest.arguments);

      // Assert
      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);
    });

    it('should return error for invalid tool', async () => {
      // Act & Assert
      await expect(client.callTool('nonexistent_tool', {}))
        .rejects.toThrow('Tool not found');
    });
  });
});
```

## 🌐 Testes End-to-End

### Configuração de Ambiente
- [ ] **Ambiente de Teste**
  - [ ] Ambiente é isolado
  - [ ] Dados de teste são consistentes
  - [ ] Configuração é versionada
  - [ ] Limpeza é automática

- [ ] **Dados de Teste**
  - [ ] Dados são apropriados
  - [ ] Não há dados sensíveis
  - [ ] Dados são consistentes
  - [ ] Limpeza é feita adequadamente

### Cenários Completos
- [ ] **Fluxos de Usuário**
  - [ ] Cenários são realistas
  - [ ] Múltiplas etapas são testadas
  - [ ] Dados persistem entre etapas
  - [ ] Estado é mantido

- [ ] **Integração Completa**
  - [ ] Todos os componentes são envolvidos
  - [ ] Dados fluem corretamente
  - [ ] Contratos são respeitados
  - [ ] Performance é aceitável

### Robustez
- [ ] **Resistência a Falhas**
  - [ ] Falhas temporárias são tratadas
  - [ ] Timeouts são apropriados
  - [ ] Retry logic é implementada
  - [ ] Fallbacks são testados

- [ ] **Recuperação**
  - [ ] Sistema se recupera de falhas
  - [ ] Estado é consistente
  - [ ] Dados não são perdidos
  - [ ] Usuário é notificado

### Exemplo de Teste E2E
```typescript
describe('Complete Pull Request Workflow', () => {
  let testEnvironment: TestEnvironment;
  let mcpClient: MCPTestClient;

  beforeAll(async () => {
    testEnvironment = await createTestEnvironment();
    mcpClient = testEnvironment.getClient();
    
    // Setup test data
    await testEnvironment.createTestProject('E2E-TEST');
    await testEnvironment.createTestRepository('test-repo');
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it('should complete full pull request lifecycle', async () => {
    // Step 1: Create pull request
    const prResponse = await mcpClient.callTool('mcp_bitbucket_pull_request_create', {
      project_key: 'E2E-TEST',
      repo_slug: 'test-repo',
      title: 'E2E Test PR',
      description: 'This is an end-to-end test pull request',
      source_branch: 'feature/e2e-test',
      destination_branch: 'main'
    });

    expect(prResponse.id).toBeDefined();
    const prId = prResponse.id;

    // Step 2: Add comment
    const commentResponse = await mcpClient.callTool('mcp_bitbucket_pull_request_create_comment', {
      projectKey: 'E2E-TEST',
      repositorySlug: 'test-repo',
      pullRequestId: prId,
      text: 'This is a test comment'
    });

    expect(commentResponse.id).toBeDefined();

    // Step 3: Get pull request details
    const prDetails = await mcpClient.callTool('mcp_bitbucket_pull_request_get', {
      project_key: 'E2E-TEST',
      repo_slug: 'test-repo',
      pull_request_id: prId
    });

    expect(prDetails.title).toBe('E2E Test PR');
    expect(prDetails.state).toBe('OPEN');

    // Step 4: Merge pull request
    const mergeResponse = await mcpClient.callTool('mcp_bitbucket_pull_request_merge', {
      project_key: 'E2E-TEST',
      repo_slug: 'test-repo',
      pull_request_id: prId
    });

    expect(mergeResponse.status).toBe('merged');
  });
});
```

## ⚡ Testes de Performance

### Métricas e Benchmarks
- [ ] **Tempo de Resposta**
  - [ ] Latência é medida
  - [ ] Throughput é validado
  - [ ] Percentis são calculados
  - [ ] Baselines são estabelecidos

- [ ] **Uso de Recursos**
  - [ ] Memória é monitorada
  - [ ] CPU é medido
  - [ ] I/O é rastreado
  - [ ] Conexões são contadas

### Carga e Stress
- [ ] **Carga Normal**
  - [ ] Carga esperada é testada
  - [ ] Performance é aceitável
  - [ ] Recursos são adequados
  - [ ] Estabilidade é mantida

- [ ] **Picos de Carga**
  - [ ] Picos são simulados
  - [ ] Comportamento é validado
  - [ ] Recuperação é testada
  - [ ] Degradação é gerenciada

### Exemplo de Teste de Performance
```typescript
describe('Performance Tests', () => {
  let mcpServer: MCPServer;
  let clients: MCPTestClient[];

  beforeAll(async () => {
    mcpServer = await createMCPServer();
  });

  afterAll(async () => {
    await mcpServer.close();
  });

  describe('Response Time Benchmarks', () => {
    it('should respond to repository list within 500ms', async () => {
      // Arrange
      const client = new MCPTestClient(mcpServer.getUrl());
      const iterations = 100;
      const measurements: number[] = [];

      // Act
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await client.callTool('mcp_bitbucket_repository_list', { projectKey: 'TEST' });
        const endTime = Date.now();
        measurements.push(endTime - startTime);
      }

      // Assert
      const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const p95Time = measurements.sort((a, b) => a - b)[Math.floor(measurements.length * 0.95)];
      
      expect(avgTime).toBeLessThan(200); // Average < 200ms
      expect(p95Time).toBeLessThan(500); // 95th percentile < 500ms
    });

    it('should handle concurrent requests efficiently', async () => {
      // Arrange
      const concurrentClients = 50;
      const requestsPerClient = 10;
      clients = Array.from({ length: concurrentClients }, () => 
        new MCPTestClient(mcpServer.getUrl())
      );

      // Act
      const startTime = Date.now();
      const promises = clients.flatMap(client =>
        Array.from({ length: requestsPerClient }, () =>
          client.callTool('mcp_bitbucket_repository_list', { projectKey: 'TEST' })
        )
      );
      
      await Promise.all(promises);
      const endTime = Date.now();

      // Assert
      const totalTime = endTime - startTime;
      const totalRequests = concurrentClients * requestsPerClient;
      const requestsPerSecond = totalRequests / (totalTime / 1000);
      
      expect(requestsPerSecond).toBeGreaterThan(100); // > 100 RPS
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory with repeated operations', async () => {
      // Arrange
      const client = new MCPTestClient(mcpServer.getUrl());
      const initialMemory = process.memoryUsage().heapUsed;

      // Act
      for (let i = 0; i < 1000; i++) {
        await client.callTool('mcp_bitbucket_repository_list', { projectKey: 'TEST' });
      }

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      // Assert
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // < 10MB increase
    });
  });
});
```

## Checklist de Validação Final

### ✅ Critérios de Aprovação por Tipo

#### Testes Unitários
- [ ] Isolamento completo
- [ ] Cobertura de código > 90%
- [ ] Execução < 100ms
- [ ] Mocks apropriados
- [ ] Casos de erro testados

#### Testes de Integração
- [ ] Componentes reais integrados
- [ ] Fluxos de trabalho testados
- [ ] Tratamento de erro validado
- [ ] Setup/teardown apropriado
- [ ] Dados consistentes

#### Testes de Contrato
- [ ] Protocolo MCP seguido
- [ ] Esquemas validados
- [ ] Compatibilidade mantida
- [ ] Erros apropriados
- [ ] Versões suportadas

#### Testes E2E
- [ ] Cenários completos
- [ ] Ambiente isolado
- [ ] Dados apropriados
- [ ] Robustez testada
- [ ] Limpeza automática

#### Testes de Performance
- [ ] Métricas estabelecidas
- [ ] Benchmarks definidos
- [ ] Carga testada
- [ ] Recursos monitorados
- [ ] Degradação gerenciada

---

**Nota**: Use estes checklists específicos em conjunto com o checklist geral para garantir cobertura completa e qualidade consistente em todos os tipos de teste.
