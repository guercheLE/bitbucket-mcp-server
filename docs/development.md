# Guia de Desenvolvimento - Bitbucket MCP Server

Este documento fornece um guia completo para desenvolvedores que desejam contribuir ou estender o Bitbucket MCP Server.

## 📋 Índice

- [Configuração do Ambiente](#configuração-do-ambiente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Padrões de Código](#padrões-de-código)
- [Testes](#testes)
- [Constituição do Projeto](#constituição-do-projeto)
- [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
- [Adicionando Novas Ferramentas](#adicionando-novas-ferramentas)
- [Debugging](#debugging)
- [Performance](#performance)
- [Contribuição](#contribuição)

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn
- Git
- Editor de código (VS Code recomendado)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/guercheLE/bitbucket-mcp-server.git
cd bitbucket-mcp-server

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example .env
# Edite o arquivo .env com suas configurações
```

### Configuração do VS Code

Recomendamos as seguintes extensões:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-jest"
  ]
}
```

## 📁 Estrutura do Projeto

```
src/
├── server/              # Servidor MCP principal
│   ├── index.ts         # Ponto de entrada do servidor
│   └── transports/      # Implementações de transporte
│       ├── stdio.ts     # Transporte STDIO
│       ├── http.ts      # Transporte HTTP
│       ├── sse.ts       # Transporte Server-Sent Events
│       └── streaming.ts # Transporte HTTP Streaming
├── client/              # Cliente CLI
│   └── cli/             # Interface de linha de comando
│       └── index.ts     # Ponto de entrada do CLI
├── tools/               # Ferramentas MCP
│   ├── cloud/           # Ferramentas específicas do Cloud
│   ├── datacenter/      # Ferramentas específicas do Data Center
│   └── shared/          # Ferramentas compartilhadas
├── services/            # Serviços de negócio
│   ├── authentication.ts # Gerenciamento de autenticação
│   ├── cache.ts         # Sistema de cache
│   └── server-detection.ts # Detecção de servidor
├── types/               # Definições TypeScript
│   └── index.ts         # Tipos principais
├── utils/               # Utilitários
│   ├── logger.ts        # Sistema de logging
│   └── performance.ts   # Monitoramento de performance
└── config/              # Configurações
    └── environment.ts   # Configuração de ambiente

tests/
├── unit/                # Testes unitários
├── integration/         # Testes de integração
└── contract/            # Testes de contrato

docs/                    # Documentação
├── installation.md      # Guia de instalação
├── configuration.md     # Guia de configuração
├── api-reference.md     # Referência da API
├── development.md       # Este arquivo
├── constitution.md      # Constituição do projeto
└── troubleshooting.md   # Guia de solução de problemas
```

## 📝 Padrões de Código

### TypeScript

- Use TypeScript strict mode
- Defina tipos explícitos para todas as funções públicas
- Use interfaces para estruturas de dados
- Prefira `const` e `let` sobre `var`
- Use arrow functions quando apropriado

```typescript
// ✅ Bom
interface UserConfig {
  name: string;
  email: string;
  permissions: string[];
}

const createUser = async (config: UserConfig): Promise<User> => {
  // implementação
};

// ❌ Ruim
const createUser = async (config) => {
  // implementação sem tipos
};
```

### Validação com Zod

Todas as entradas devem ser validadas com schemas Zod:

```typescript
import { z } from 'zod';

const CreateRepositorySchema = z.object({
  projectKey: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export const createRepository = async (input: unknown) => {
  const validatedInput = CreateRepositorySchema.parse(input);
  // usar validatedInput que é type-safe
};
```

### Logging

Use o sistema de logging estruturado:

```typescript
import { logger } from '../utils/logger';

// ✅ Bom
logger.info('Repository created', {
  projectKey: 'PROJ',
  repositoryName: 'my-repo',
  userId: 'user123'
});

// ❌ Ruim
console.log('Repository created');
```

### Tratamento de Erros

Sempre trate erros adequadamente:

```typescript
// ✅ Bom
try {
  const result = await bitbucketApi.createRepository(data);
  logger.info('Repository created successfully', { repositoryId: result.id });
  return result;
} catch (error) {
  logger.error('Failed to create repository', {
    error: error instanceof Error ? error.message : 'Unknown error',
    data
  });
  throw new Error(`Failed to create repository: ${error.message}`);
}

// ❌ Ruim
const result = await bitbucketApi.createRepository(data);
return result;
```

## 🧪 Testes

### TDD (Test-Driven Development)

Este projeto segue TDD rigorosamente (Article V da Constituição):

1. **Red**: Escreva o teste primeiro (deve falhar)
2. **Green**: Implemente o código mínimo para passar
3. **Refactor**: Melhore o código mantendo os testes passando

### Estrutura de Testes

```typescript
// tests/unit/services/authentication.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AuthenticationService } from '../../../src/services/authentication';

describe('AuthenticationService', () => {
  let authService: AuthenticationService;

  beforeEach(() => {
    authService = new AuthenticationService();
  });

  afterEach(() => {
    // cleanup
  });

  describe('OAuth2 authentication', () => {
    it('should authenticate with valid OAuth2 credentials', async () => {
      // Arrange
      const credentials = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      };

      // Act
      const result = await authService.authenticateOAuth2(credentials);

      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should reject invalid OAuth2 credentials', async () => {
      // Arrange
      const credentials = {
        clientId: 'invalid-client-id',
        clientSecret: 'invalid-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      };

      // Act & Assert
      await expect(authService.authenticateOAuth2(credentials))
        .rejects
        .toThrow('Invalid credentials');
    });
  });
});
```

### Executando Testes

```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes de contrato
npm run test:contract

# Cobertura de testes
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

### Cobertura de Testes

- **Mínimo obrigatório**: 80% (Article V)
- **Meta**: 90%+
- **Crítico**: 100% para funções de autenticação e validação

## 📜 Constituição do Projeto

Este projeto segue rigorosamente a Constituição do Bitbucket MCP Server:

### Article I: MCP Protocol First
- Use apenas o SDK oficial `@modelcontextprotocol/sdk`
- Não implemente protocolos customizados
- Siga as especificações MCP rigorosamente

### Article II: Multi-Transport Protocol
- Implemente suporte para todos os transportes
- Use fallback automático entre transportes
- Configure prioridades de transporte

### Article III: Selective Tool Registration
- Detecte automaticamente o tipo de servidor
- Registre apenas ferramentas compatíveis
- Use cache para capacidades do servidor

### Article IV: Complete API Coverage
- Implemente todos os endpoints da API do Bitbucket
- Organize por categoria funcional
- Mantenha compatibilidade com versões

### Article V: Test-First
- **NON-NEGOTIABLE**: TDD obrigatório
- Cobertura mínima de 80%
- Testes devem ser escritos antes da implementação

### Article VI: Versioning
- Use versionamento semântico
- Mantenha compatibilidade com versões anteriores
- Documente breaking changes

### Article VII: Simplicity
- Mantenha código simples e legível
- Use padrões estabelecidos
- Documente adequadamente

## 🔄 Fluxo de Desenvolvimento

### 1. Setup do Branch

```bash
# Crie uma branch para sua feature
git checkout -b feature/nova-funcionalidade

# Sincronize com main
git pull origin main
```

### 2. Desenvolvimento TDD

```bash
# 1. Escreva os testes primeiro (Red phase)
npm run test:watch

# 2. Implemente o código mínimo (Green phase)
# 3. Refatore mantendo os testes passando (Refactor phase)
```

### 3. Qualidade de Código

```bash
# Linting
npm run lint

# Formatação
npm run format

# Validação constitucional
npm run validate:constitution
```

### 4. Commit

```bash
# Use conventional commits
git add .
git commit -m "feat(auth): add OAuth2 authentication support"

# Push
git push origin feature/nova-funcionalidade
```

### 5. Pull Request

- Crie um PR com descrição detalhada
- Inclua testes e documentação
- Aguarde review e aprovação

## 🔧 Adicionando Novas Ferramentas

### 1. Criar Schema de Validação

```typescript
// src/tools/shared/schemas/repository.ts
import { z } from 'zod';

export const CreateRepositorySchema = z.object({
  projectKey: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export type CreateRepositoryInput = z.infer<typeof CreateRepositorySchema>;
```

### 2. Implementar Ferramenta

```typescript
// src/tools/shared/repository.ts
import { Tool } from '@modelcontextprotocol/sdk/types';
import { CreateRepositorySchema, type CreateRepositoryInput } from './schemas/repository';
import { logger } from '../../utils/logger';

export const createRepositoryTool: Tool = {
  name: 'mcp_bitbucket_repository_create',
  description: 'Cria um novo repositório no Bitbucket Data Center',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Chave do projeto',
        minLength: 1,
        maxLength: 50
      },
      name: {
        type: 'string',
        description: 'Nome do repositório',
        minLength: 1,
        maxLength: 100
      },
      description: {
        type: 'string',
        description: 'Descrição do repositório'
      },
      isPublic: {
        type: 'boolean',
        description: 'Se o repositório é público',
        default: false
      }
    },
    required: ['projectKey', 'name']
  }
};

export const createRepository = async (input: unknown) => {
  try {
    // Validar entrada
    const validatedInput = CreateRepositorySchema.parse(input);
    
    logger.info('Creating repository', {
      projectKey: validatedInput.projectKey,
      name: validatedInput.name
    });

    // Implementar lógica de criação
    const result = await bitbucketApi.createRepository(validatedInput);
    
    logger.info('Repository created successfully', {
      repositoryId: result.id,
      projectKey: validatedInput.projectKey
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    logger.error('Failed to create repository', {
      error: error instanceof Error ? error.message : 'Unknown error',
      input
    });
    
    throw new Error(`Failed to create repository: ${error.message}`);
  }
};
```

### 3. Registrar Ferramenta

```typescript
// src/server/index.ts
import { createRepositoryTool, createRepository } from '../tools/shared/repository';

// Registrar ferramenta
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      createRepositoryTool,
      // outras ferramentas...
    ]
  };
});

// Registrar handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'mcp_bitbucket_repository_create':
      return await createRepository(request.params.arguments);
    // outros casos...
  }
});
```

### 4. Criar Testes

```typescript
// tests/unit/tools/repository.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createRepository } from '../../../src/tools/shared/repository';

describe('createRepository', () => {
  beforeEach(() => {
    // Setup mocks
  });

  it('should create repository with valid input', async () => {
    // Test implementation
  });

  it('should reject invalid input', async () => {
    // Test validation
  });
});
```

## 🐛 Debugging

### Logs de Debug

```bash
# Habilitar logs detalhados
LOG_LEVEL=debug npm run dev
```

### VS Code Debug Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server/index.ts",
      "runtimeArgs": ["-r", "tsx/esm"],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Debugging de Testes

```bash
# Debug testes específicos
npm run test -- --testNamePattern="AuthenticationService" --verbose
```

## ⚡ Performance

### Monitoramento

```typescript
import { performanceManager } from '../utils/performance';

// Iniciar monitoramento de requisição
const requestId = performanceManager.getMonitor().startRequest();

try {
  // Sua operação
  const result = await someOperation();
  
  // Finalizar com sucesso
  performanceManager.getMonitor().endRequest(requestId, true, duration);
  return result;
} catch (error) {
  // Finalizar com erro
  performanceManager.getMonitor().endRequest(requestId, false, duration);
  throw error;
}
```

### Cache

```typescript
import { cache } from '../services/cache';

// Cache automático
const result = await cache.getOrSet(
  `repository:${projectKey}:${repositorySlug}`,
  () => bitbucketApi.getRepository(projectKey, repositorySlug),
  { ttl: 300 } // 5 minutos
);
```

### Rate Limiting

```typescript
import { createRateLimiter } from '../utils/performance';

const rateLimiter = createRateLimiter('api', {
  windowMs: 60000, // 1 minuto
  maxRequests: 100 // 100 requisições por minuto
});

if (!rateLimiter.isAllowed('user123')) {
  throw new Error('Rate limit exceeded');
}
```

## 🤝 Contribuição

### Processo de Contribuição

1. **Fork** o repositório
2. **Clone** seu fork
3. **Crie** uma branch para sua feature
4. **Desenvolva** seguindo TDD
5. **Teste** completamente
6. **Documente** suas mudanças
7. **Submeta** um Pull Request

### Padrões de Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Tipos:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

Exemplos:
```
feat(auth): add OAuth2 authentication support
fix(cache): resolve memory leak in cache service
docs(api): update API reference documentation
test(repository): add integration tests for repository creation
```

### Checklist de Pull Request

- [ ] Testes passam com cobertura >80%
- [ ] Código segue padrões estabelecidos
- [ ] Documentação atualizada
- [ ] Validação constitucional passa
- [ ] Linting e formatação OK
- [ ] Commits seguem conventional commits
- [ ] Descrição clara do PR

### Code Review

- Foque na lógica e arquitetura
- Verifique conformidade constitucional
- Confirme cobertura de testes
- Valide documentação
- Teste manualmente se necessário

## 📚 Recursos Adicionais

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Zod Documentation](https://zod.dev/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Bitbucket REST API](https://developer.atlassian.com/cloud/bitbucket/rest/)

## 🆘 Suporte

Para dúvidas sobre desenvolvimento:

- 📖 [Documentação](docs/)
- 🐛 [Issues](https://github.com/guercheLE/bitbucket-mcp-server/issues)
- 💬 [Discussões](https://github.com/guercheLE/bitbucket-mcp-server/discussions)
- 📧 [Email](mailto:support@bitbucket-mcp-server.com)
