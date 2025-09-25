# Troubleshooting de Testes - Bitbucket MCP Server

Este guia ajuda a diagnosticar e resolver problemas comuns encontrados durante a execução e desenvolvimento de testes.

## Problemas Comuns

### 1. Testes Falhando com Timeout

#### Sintomas
```
Timeout - Async callback was not invoked within the 5000ms timeout
```

#### Causas Possíveis
- Operações assíncronas não estão sendo aguardadas
- Mocks não estão retornando promises
- Dependências externas estão demorando para responder

#### Soluções

**Aumentar timeout para testes específicos:**
```typescript
it('should handle long operation', async () => {
  // Test implementation
}, 10000); // 10 segundos
```

**Verificar se operações assíncronas estão sendo aguardadas:**
```typescript
// ❌ Errado - não aguarda a promise
it('should process data', () => {
  processData().then(result => {
    expect(result).toBeDefined();
  });
});

// ✅ Correto - aguarda a promise
it('should process data', async () => {
  const result = await processData();
  expect(result).toBeDefined();
});
```

**Verificar mocks de promises:**
```typescript
// ❌ Errado - mock não retorna promise
mockAPI.getData.mockReturnValue({ data: 'test' });

// ✅ Correto - mock retorna promise
mockAPI.getData.mockResolvedValue({ data: 'test' });
```

### 2. Mocks Não Funcionando

#### Sintomas
- Testes chamam implementações reais em vez de mocks
- Assertions sobre chamadas de mock falham
- Comportamento inesperado em testes

#### Causas Possíveis
- Mocks não estão sendo aplicados corretamente
- Módulos não estão sendo mockados antes da importação
- Jest não está encontrando os mocks

#### Soluções

**Verificar ordem de imports:**
```typescript
// ❌ Errado - mock após import
import { MyService } from '../src/services/my-service';
jest.mock('../src/services/my-service');

// ✅ Correto - mock antes do import
jest.mock('../src/services/my-service');
import { MyService } from '../src/services/my-service';
```

**Usar jest.doMock para mocks dinâmicos:**
```typescript
it('should use mocked service', async () => {
  jest.doMock('../src/services/my-service', () => ({
    MyService: jest.fn().mockImplementation(() => ({
      process: jest.fn().mockResolvedValue('mocked result')
    }))
  }));
  
  const { MyService } = await import('../src/services/my-service');
  const service = new MyService();
  const result = await service.process();
  
  expect(result).toBe('mocked result');
});
```

**Verificar se mocks estão sendo limpos:**
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});
```

### 3. Testes Flaky (Inconsistentes)

#### Sintomas
- Testes passam às vezes e falham outras vezes
- Resultados diferentes em execuções consecutivas
- Dependência de timing ou estado externo

#### Causas Possíveis
- Dependência de data/hora atual
- Estado compartilhado entre testes
- Operações assíncronas com timing não determinístico
- Dependências de recursos externos

#### Soluções

**Usar datas fixas:**
```typescript
// ❌ Flaky - depende de data atual
it('should create token with current date', () => {
  const token = createToken();
  expect(token.createdAt).toBe(new Date());
});

// ✅ Determinístico - data fixa
it('should create token with specified date', () => {
  const fixedDate = new Date('2024-01-01T00:00:00Z');
  const token = createToken(fixedDate);
  expect(token.createdAt).toBe(fixedDate);
});
```

**Isolar estado entre testes:**
```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockDatabase: jest.Mocked<Database>;
  
  beforeEach(() => {
    // Criar nova instância para cada teste
    mockDatabase = createMockDatabase();
    userService = new UserService(mockDatabase);
    
    // Limpar estado
    jest.clearAllMocks();
  });
});
```

**Usar waitFor para operações assíncronas:**
```typescript
import { waitFor } from '../utils/helpers/test-helpers';

it('should update user status', async () => {
  await userService.updateStatus('active');
  
  await waitFor(() => {
    expect(mockDatabase.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' })
    );
  });
});
```

### 4. Problemas de Cobertura

#### Sintomas
- Cobertura de código abaixo do esperado
- Linhas não cobertas que deveriam estar cobertas
- Relatórios de cobertura inconsistentes

#### Soluções

**Verificar configuração do Jest:**
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
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

**Adicionar testes para branches não cobertos:**
```typescript
// Se uma função tem if/else, testar ambos os casos
describe('validateInput', () => {
  it('should return true for valid input', () => {
    expect(validateInput('valid')).toBe(true);
  });
  
  it('should return false for invalid input', () => {
    expect(validateInput('')).toBe(false);
  });
});
```

### 5. Problemas de Memória

#### Sintomas
```
JavaScript heap out of memory
```

#### Causas Possíveis
- Vazamentos de memória em testes
- Muitos testes executando em paralelo
- Objetos não sendo limpos adequadamente

#### Soluções

**Limpar recursos após testes:**
```typescript
describe('Database Tests', () => {
  let database: Database;
  
  afterEach(async () => {
    if (database) {
      await database.close();
      await database.clear();
    }
  });
});
```

**Reduzir paralelismo:**
```bash
# Executar testes em sequência
npm test -- --runInBand

# Ou reduzir workers
npm test -- --maxWorkers=2
```

**Forçar garbage collection:**
```typescript
afterEach(() => {
  if (global.gc) {
    global.gc();
  }
});
```

### 6. Problemas de Configuração

#### Sintomas
- Testes não encontram módulos
- Variáveis de ambiente não configuradas
- Configurações de Jest não aplicadas

#### Soluções

**Verificar setup de testes:**
```typescript
// tests/setup.ts
import { config } from 'dotenv';

// Carregar variáveis de ambiente de teste
config({ path: '.env.test' });

// Configurar mocks globais
jest.mock('../src/config', () => ({
  getConfig: () => ({
    bitbucketUrl: 'http://localhost:3001',
    mcpPort: 3000,
    logLevel: 'error'
  })
}));
```

**Verificar paths no Jest:**
```javascript
// jest.config.js
module.exports = {
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  }
};
```

## Debug de Testes

### 1. Executar Teste Específico

```bash
# Por nome
npm test -- --testNamePattern="should authenticate user"

# Por arquivo
npm test -- tests/unit/auth.test.ts

# Por padrão
npm test -- --testPathPattern="auth"
```

### 2. Debug com Node.js

```bash
# Debug com breakpoints
node --inspect-brk node_modules/.bin/jest --runInBand --testNamePattern="specific test"

# Debug com Chrome DevTools
node --inspect node_modules/.bin/jest --runInBand
```

### 3. Logs Detalhados

```bash
# Verbose output
npm test -- --verbose

# Mostrar console.log
npm test -- --silent=false

# Debug Jest
DEBUG=jest* npm test
```

### 4. Usar console.log para Debug

```typescript
it('should process data correctly', async () => {
  console.log('Starting test...');
  
  const result = await processData();
  console.log('Result:', result);
  
  expect(result).toBeDefined();
});
```

## Ferramentas de Debug

### 1. Jest Debugger

```typescript
// Adicionar breakpoint no código
it('should debug this test', () => {
  debugger; // Breakpoint aqui
  const result = someFunction();
  expect(result).toBeDefined();
});
```

### 2. Custom Debug Helpers

```typescript
// tests/utils/debug-helpers.ts
export const debugTest = (label: string, data: any) => {
  if (process.env.DEBUG_TESTS) {
    console.log(`[DEBUG] ${label}:`, JSON.stringify(data, null, 2));
  }
};

// Uso nos testes
it('should process data', async () => {
  const input = { test: 'data' };
  debugTest('Input', input);
  
  const result = await processData(input);
  debugTest('Result', result);
  
  expect(result).toBeDefined();
});
```

### 3. Snapshot Debugging

```typescript
it('should match snapshot', () => {
  const result = generateComplexObject();
  
  // Para debug, salvar snapshot manualmente
  if (process.env.DEBUG_SNAPSHOT) {
    require('fs').writeFileSync(
      'debug-snapshot.json',
      JSON.stringify(result, null, 2)
    );
  }
  
  expect(result).toMatchSnapshot();
});
```

## Monitoramento de Testes

### 1. Testes Flaky Detection

```typescript
// tests/utils/flaky-detector.ts
export class FlakyTestDetector {
  private static results = new Map<string, boolean[]>();
  
  static recordTest(testName: string, passed: boolean) {
    if (!this.results.has(testName)) {
      this.results.set(testName, []);
    }
    this.results.get(testName)!.push(passed);
  }
  
  static getFlakyTests(): string[] {
    const flakyTests: string[] = [];
    
    for (const [testName, results] of this.results) {
      const passRate = results.filter(Boolean).length / results.length;
      if (passRate < 0.9 && results.length > 5) {
        flakyTests.push(testName);
      }
    }
    
    return flakyTests;
  }
}
```

### 2. Performance Monitoring

```typescript
// tests/utils/performance-monitor.ts
export class TestPerformanceMonitor {
  private static timings = new Map<string, number[]>();
  
  static startTimer(testName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      
      if (!this.timings.has(testName)) {
        this.timings.set(testName, []);
      }
      this.timings.get(testName)!.push(duration);
    };
  }
  
  static getSlowTests(threshold: number = 1000): Array<{ test: string; avgTime: number }> {
    const slowTests: Array<{ test: string; avgTime: number }> = [];
    
    for (const [testName, timings] of this.timings) {
      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      if (avgTime > threshold) {
        slowTests.push({ test: testName, avgTime });
      }
    }
    
    return slowTests.sort((a, b) => b.avgTime - a.avgTime);
  }
}
```

## Checklist de Troubleshooting

### Antes de Reportar um Bug

- [ ] Verificar se o problema é reproduzível
- [ ] Executar testes em ambiente limpo
- [ ] Verificar logs de erro detalhados
- [ ] Confirmar que dependências estão atualizadas
- [ ] Verificar configuração do ambiente

### Para Resolver Problemas

- [ ] Identificar o tipo de problema (timeout, mock, flaky, etc.)
- [ ] Aplicar soluções específicas para o tipo
- [ ] Verificar se a solução resolve o problema
- [ ] Documentar a solução para referência futura
- [ ] Atualizar testes se necessário

### Para Prevenir Problemas

- [ ] Seguir boas práticas de teste
- [ ] Usar utilitários de teste consistentemente
- [ ] Manter testes isolados e determinísticos
- [ ] Monitorar performance e flakiness
- [ ] Revisar e refatorar testes regularmente

---

**Dica**: Mantenha este guia atualizado com novos problemas e soluções encontradas durante o desenvolvimento. Isso ajudará toda a equipe a resolver problemas mais rapidamente.
