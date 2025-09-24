# Guia de Testes - Bitbucket MCP Server

Este documento fornece diretrizes abrangentes para escrever, executar e manter testes no projeto Bitbucket MCP Server.

## Visão Geral

O projeto implementa um framework de testes robusto que suporta múltiplos tipos de teste para garantir a qualidade e confiabilidade do servidor MCP (Model Context Protocol) para Bitbucket.

## Tipos de Teste

### 1. Testes Unitários
Testam funções e classes individuais em isolamento.

**Localização**: `tests/unit/`
**Execução**: `npm run test:unit`
**Características**:
- Execução rápida (< 100ms por teste)
- Sem dependências externas
- Uso de mocks para dependências
- Cobertura de casos de sucesso e erro

### 2. Testes de Integração
Testam a interação entre componentes e workflows completos.

**Localização**: `tests/integration/`
**Execução**: `npm run test:integration`
**Características**:
- Testam fluxos de trabalho reais
- Usam mocks para serviços externos
- Validam contratos entre componentes
- Tempo de execução moderado

### 3. Testes de Contrato
Verificam conformidade com protocolos e especificações.

**Localização**: `tests/contract/`
**Execução**: `npm run test:contract`
**Características**:
- Validam conformidade com MCP
- Testam formatos de resposta da API
- Verificam esquemas de dados
- Garantem compatibilidade

### 4. Testes End-to-End
Testam cenários completos do usuário.

**Localização**: `tests/e2e/`
**Execução**: `npm run test:e2e`
**Características**:
- Testam o stack completo
- Usam ambientes de teste reais
- Validam fluxos de usuário
- Tempo de execução mais longo

### 5. Testes de Performance
Avaliam performance e escalabilidade.

**Localização**: `tests/performance/`
**Execução**: `npm run test:performance`
**Características**:
- Medem tempos de resposta
- Testam carga e stress
- Monitoram uso de memória
- Validam benchmarks

## Estrutura de Arquivos de Teste

```
tests/
├── unit/                    # Testes unitários
│   ├── server/             # Testes do servidor
│   ├── auth/               # Testes de autenticação
│   └── utils/              # Testes de utilitários
├── integration/            # Testes de integração
│   ├── authentication/     # Fluxos de autenticação
│   ├── mcp-protocol/       # Protocolo MCP
│   └── bitbucket-api/      # Integração com API
├── contract/               # Testes de contrato
│   ├── mcp-compliance/     # Conformidade MCP
│   └── api-schemas/        # Esquemas de API
├── e2e/                    # Testes end-to-end
│   ├── workflows/          # Fluxos de trabalho
│   └── scenarios/          # Cenários de usuário
├── performance/            # Testes de performance
│   ├── benchmarks/         # Benchmarks
│   └── load-tests/         # Testes de carga
├── fixtures/               # Dados de teste
│   ├── auth/               # Fixtures de autenticação
│   ├── api-responses/      # Respostas da API
│   └── mcp-messages/       # Mensagens MCP
└── utils/                  # Utilitários de teste
    ├── mocks/              # Mocks e stubs
    ├── helpers/            # Funções auxiliares
    └── setup/              # Configuração de testes
```

## Convenções de Nomenclatura

### Arquivos de Teste
- **Unitários**: `*.test.ts`
- **Integração**: `*.integration.test.ts`
- **Contrato**: `*.contract.test.ts`
- **E2E**: `*.e2e.test.ts`
- **Performance**: `*.performance.test.ts`

### Descrições de Teste
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should return expected result when given valid input', () => {
      // Test implementation
    });
    
    it('should throw error when given invalid input', () => {
      // Test implementation
    });
  });
});
```

## Configuração de Testes

### Jest Configuration
O projeto usa Jest como framework de teste principal. A configuração está em `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Variáveis de Ambiente
```bash
# .env.test
NODE_ENV=test
BITBUCKET_API_URL=http://localhost:3001
MCP_SERVER_PORT=3000
LOG_LEVEL=error
```

## Utilitários de Teste

### Mocks e Fixtures
```typescript
// tests/utils/mocks/bitbucket-api.mock.ts
export const mockBitbucketAPI = {
  authenticate: jest.fn(),
  getRepositories: jest.fn(),
  createPullRequest: jest.fn()
};

// tests/fixtures/auth/oauth-token.json
{
  "access_token": "mock_access_token",
  "refresh_token": "mock_refresh_token",
  "expires_in": 3600
}
```

### Helpers de Teste
```typescript
// tests/utils/helpers/mcp-client.helper.ts
export class MCPTestClient {
  async sendRequest(method: string, params: any) {
    // Implementation for MCP client testing
  }
}
```

## Executando Testes

### Comandos Disponíveis
```bash
# Todos os testes
npm test

# Testes específicos
npm run test:unit
npm run test:integration
npm run test:contract
npm run test:e2e
npm run test:performance

# Com cobertura
npm run test:coverage

# Em modo watch
npm run test:watch

# Testes específicos por padrão
npm test -- --testNamePattern="authentication"
```

### Execução em CI/CD
```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    npm run test:unit
    npm run test:integration
    npm run test:contract
    npm run test:coverage
```

## Cobertura de Código

### Requisitos Mínimos
- **Cobertura Global**: 80%
- **Funções Críticas**: 100% (autenticação, segurança)
- **Protocolo MCP**: 100% (conformidade)

### Relatórios
```bash
# Gerar relatório HTML
npm run test:coverage:html

# Relatório no terminal
npm run test:coverage:terminal
```

## Boas Práticas

### 1. Estrutura AAA (Arrange, Act, Assert)
```typescript
it('should authenticate user with valid credentials', async () => {
  // Arrange
  const credentials = { username: 'test', password: 'test' };
  const mockResponse = { token: 'valid_token' };
  authService.authenticate = jest.fn().mockResolvedValue(mockResponse);

  // Act
  const result = await authService.authenticate(credentials);

  // Assert
  expect(result).toEqual(mockResponse);
  expect(authService.authenticate).toHaveBeenCalledWith(credentials);
});
```

### 2. Testes Isolados
- Cada teste deve ser independente
- Usar `beforeEach` e `afterEach` para setup/cleanup
- Não depender de estado de outros testes

### 3. Nomes Descritivos
```typescript
// ❌ Ruim
it('should work', () => {});

// ✅ Bom
it('should return user data when authentication succeeds', () => {});
```

### 4. Mocks Apropriados
```typescript
// Mock apenas o necessário
const mockAPI = {
  getUser: jest.fn().mockResolvedValue(mockUser)
};

// Verificar chamadas
expect(mockAPI.getUser).toHaveBeenCalledWith(userId);
```

## Troubleshooting

### Problemas Comuns

#### 1. Timeout em Testes
```typescript
// Aumentar timeout para testes lentos
it('should handle long operation', async () => {
  // Test implementation
}, 10000); // 10 segundos
```

#### 2. Mocks Não Funcionando
```typescript
// Verificar se o mock está sendo aplicado corretamente
jest.clearAllMocks();
jest.resetAllMocks();
```

#### 3. Testes Flaky
- Verificar dependências de tempo
- Usar `waitFor` para operações assíncronas
- Garantir isolamento entre testes

### Debug de Testes
```bash
# Executar teste específico com debug
npm test -- --testNamePattern="specific test" --verbose

# Debug com Node.js
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Manutenção de Testes

### 1. Refatoração
- Manter testes atualizados com mudanças no código
- Refatorar testes quando necessário
- Remover testes obsoletos

### 2. Monitoramento
- Acompanhar métricas de cobertura
- Identificar testes flaky
- Monitorar tempo de execução

### 3. Documentação
- Documentar casos de teste complexos
- Manter README atualizado
- Documentar mudanças em APIs de teste

## Recursos Adicionais

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Bitbucket API Documentation](https://developer.atlassian.com/bitbucket/api/2/reference/)

---

**Última atualização**: $(date)
**Versão**: 1.0.0
