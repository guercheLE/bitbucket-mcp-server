# 🤝 Guia de Contribuição

Obrigado por considerar contribuir para o Bitbucket MCP Server! Este documento fornece diretrizes e informações para ajudar você a contribuir de forma eficaz.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Testes](#testes)
- [Documentação](#documentação)
- [Pull Requests](#pull-requests)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Melhorias](#sugerir-melhorias)

## 📜 Código de Conduta

Este projeto segue um código de conduta para garantir um ambiente acolhedor e inclusivo para todos os contribuidores. Ao participar, você concorda em:

- Ser respeitoso e inclusivo
- Aceitar críticas construtivas
- Focar no que é melhor para a comunidade
- Mostrar empatia com outros membros da comunidade

## 🚀 Como Contribuir

### Tipos de Contribuição

1. **🐛 Reportar Bugs**
   - Use o template de issue para bugs
   - Inclua informações de reprodução
   - Forneça logs e screenshots quando relevante

2. **💡 Sugerir Melhorias**
   - Use o template de issue para melhorias
   - Descreva o problema e a solução proposta
   - Considere alternativas e trade-offs

3. **🔧 Contribuir com Código**
   - Fork o repositório
   - Crie uma branch para sua feature
   - Siga os padrões de código
   - Adicione testes
   - Atualize documentação

4. **📚 Melhorar Documentação**
   - Corrija erros de digitação
   - Adicione exemplos
   - Melhore clareza e estrutura

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- **Node.js**: v18.0.0 ou superior
- **npm**: v9.0.0 ou superior
- **Git**: v2.30.0 ou superior
- **Docker**: v20.10.0 ou superior (opcional)

### Instalação

1. **Fork e Clone**
   ```bash
   git clone https://github.com/seu-usuario/bitbucket-mcp-server.git
   cd bitbucket-mcp-server
   ```

2. **Instalar Dependências**
   ```bash
   npm install
   ```

3. **Configurar Ambiente**
   ```bash
   cp env.example .env
   # Edite .env com suas configurações
   ```

4. **Verificar Instalação**
   ```bash
   npm run test
   npm run build
   ```

### Desenvolvimento com Docker

```bash
# Construir imagem
docker build -t bitbucket-mcp-server .

# Executar container
docker run -p 3000:3000 bitbucket-mcp-server
```

## 📏 Padrões de Código

### TypeScript

- **Versão**: 5.0+
- **Configuração**: `tsconfig.json`
- **Linting**: ESLint + Prettier
- **Formatação**: Prettier

### Convenções de Nomenclatura

```typescript
// Classes: PascalCase
class AuthenticationService {}

// Interfaces: PascalCase com prefixo I (opcional)
interface IAuthConfig {}

// Funções: camelCase
function validateCredentials() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Arquivos: kebab-case
// authentication-service.ts
// rate-limiter.ts
```

### Estrutura de Arquivos

```
src/
├── config/          # Configurações
├── services/        # Serviços de negócio
│   ├── auth/        # Serviços de autenticação
│   ├── issues-validation-service.ts  # Validação de Issues
│   ├── comments-service.ts           # Serviço de comentários
│   └── transitions-service.ts        # Serviço de transições
├── server/          # Servidor MCP
├── tools/           # Ferramentas MCP
│   ├── cloud/       # Ferramentas Cloud
│   │   ├── auth/    # Autenticação Cloud
│   │   └── issues/  # Issues Cloud
│   ├── datacenter/  # Ferramentas Data Center
│   └── shared/      # Ferramentas compartilhadas
├── types/           # Definições de tipos
│   ├── issues.ts    # Tipos de Issues
│   ├── comments.ts  # Tipos de comentários
│   ├── issue-relationships.ts  # Tipos de relacionamentos
│   └── attachments.ts  # Tipos de anexos
└── utils/           # Utilitários
```

### Comentários e Documentação

```typescript
/**
 * Serviço de autenticação para Bitbucket
 * 
 * @description Gerencia autenticação OAuth 2.0, Personal Access Tokens,
 * App Passwords e Basic Auth com fallback automático
 * 
 * @example
 * ```typescript
 * const authService = new AuthenticationService();
 * const token = await authService.authenticate({
 *   type: 'oauth2',
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret'
 * });
 * ```
 */
class AuthenticationService {
  /**
   * Autentica com o Bitbucket usando o método especificado
   * 
   * @param config - Configuração de autenticação
   * @returns Token de acesso
   * @throws {AuthenticationError} Quando a autenticação falha
   */
  async authenticate(config: AuthConfig): Promise<string> {
    // Implementação...
  }
}
```

## 🏗️ Estrutura do Projeto

### Diretórios Principais

- **`src/`**: Código fonte
- **`tests/`**: Testes (unit, integration, contract)
- **`docs/`**: Documentação
- **`specs/`**: Especificações e features
- **`scripts/`**: Scripts de build e deploy

### Arquivos Importantes

- **`package.json`**: Dependências e scripts
- **`tsconfig.json`**: Configuração TypeScript
- **`jest.config.js`**: Configuração de testes
- **`.env.example`**: Exemplo de variáveis de ambiente

## 🔀 Desenvolvimento de Funcionalidades de Pull Request

### Visão Geral
O sistema de pull requests implementa 18 ferramentas MCP organizadas em 4 categorias principais. Este guia fornece diretrizes específicas para contribuir com funcionalidades relacionadas a pull requests.

## 🎯 Desenvolvimento de Funcionalidades de Issues (Cloud)

### Visão Geral
O sistema de issues implementa 15 ferramentas MCP organizadas em 5 categorias principais, com suporte exclusivo para Bitbucket Cloud. Este guia fornece diretrizes específicas para contribuir com funcionalidades relacionadas a issues.

### Estrutura de Arquivos

#### Serviços (`src/services/`)
- **`issues-service.ts`**: Gestão completa de issues, comentários, transições, relacionamentos e anexos
- **`issues-validation-service.ts`**: Validação de regras de negócio e transições de estado

#### Ferramentas MCP (`src/tools/cloud/issues/`)
- **`mcp-tools.ts`**: Todas as 15 ferramentas MCP organizadas por categoria
- **`IssuesMcpHandlers`**: Handlers que fazem a ponte entre MCP e IssuesService

#### Testes (`tests/`)
- **`unit/services/issues/`**: Testes unitários dos serviços de issues
- **`unit/tools/issues/`**: Testes unitários das ferramentas MCP de issues
- **`integration/issues/`**: Testes de integração com APIs reais

### Padrões de Desenvolvimento

#### 1. **Test-Driven Development (TDD)**
```typescript
// 1. Escreva o teste primeiro (DEVE FALHAR)
describe('IssuesService', () => {
  it('should create an issue successfully', async () => {
    const result = await service.createIssue({
      workspace: 'test-workspace',
      repoSlug: 'test-repo',
      title: 'Test Issue',
      content: 'Test issue description',
      kind: 'bug',
      priority: 'high'
    });
    
    expect(result.id).toBeDefined();
    expect(result.title).toBe('Test Issue');
    expect(result.kind).toBe('bug');
  });
});

// 2. Implemente a funcionalidade
class IssuesService {
  async createIssue(request: CreateIssueRequest): Promise<Issue> {
    // Validação de regras de negócio
    const validation = await this.validationService.validateCreateIssue(request);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    
    // Implementação...
  }
}

// 3. Refatore se necessário
```

#### 2. **Validação com Zod e Regras de Negócio**
```typescript
import { z } from 'zod';

// Schema de validação
const CreateIssueSchema = z.object({
  workspace: z.string().min(1),
  repoSlug: z.string().min(1),
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  kind: z.enum(['bug', 'enhancement', 'proposal', 'task']).optional(),
  priority: z.enum(['trivial', 'minor', 'major', 'critical', 'blocker']).optional(),
  assignee: z.string().optional(),
  component: z.string().optional(),
  milestone: z.string().optional(),
  version: z.string().optional()
});

// Validação de regras de negócio
class IssuesValidationService {
  validateCreateIssue(request: CreateIssueRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!request.title || request.title.trim() === '') {
      errors.push('Issue title cannot be empty.');
    }
    
    if (request.title && request.title.length > 255) {
      warnings.push('Issue title is very long, consider shortening it.');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}
```

#### 3. **Suporte Exclusivo Cloud**
```typescript
class IssuesService {
  private buildApiUrl(workspace: string, repoSlug: string, issueId?: string): string {
    const baseUrl = 'https://api.bitbucket.org/2.0';
    if (issueId) {
      return `${baseUrl}/repositories/${workspace}/${repoSlug}/issues/${issueId}`;
    } else {
      return `${baseUrl}/repositories/${workspace}/${repoSlug}/issues`;
    }
  }
}
```

#### 4. **Cache Inteligente**
```typescript
class IssuesService {
  async getIssue(request: GetIssueRequest): Promise<Issue> {
    const cacheKey = `issue:${request.workspace}:${request.repoSlug}:${request.issueId}`;
    
    // Verificar cache primeiro
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Buscar da API
    const result = await this.fetchFromAPI(request);
    
    // Armazenar no cache (TTL 5 minutos)
    await this.cache.set(cacheKey, result, 300);
    
    return result;
  }
}
```

#### 5. **Error Handling Robusto**
```typescript
class IssuesService {
  async createIssue(request: CreateIssueRequest): Promise<Issue> {
    try {
      return await this.executeWithRetry(async () => {
        const response = await axios.post(this.buildApiUrl(request.workspace, request.repoSlug), {
          title: request.title,
          content: request.content,
          kind: request.kind,
          priority: request.priority,
          assignee: request.assignee ? { username: request.assignee } : undefined,
          component: request.component,
          milestone: request.milestone,
          version: request.version
        }, {
          headers: {
            'Authorization': `Bearer ${request.auth.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      });
    } catch (error) {
      if (error.response?.status === 409) {
        throw new ConflictError('Issue already exists');
      } else if (error.response?.status === 401) {
        throw new AuthenticationError('Invalid credentials');
      } else if (error.response?.status === 403) {
        throw new PermissionError('Insufficient permissions');
      } else {
        throw new IssuesError('Failed to create issue', error);
      }
    }
  }
}
```

### Checklist de Desenvolvimento para Issues

#### Antes de Começar
- [ ] Issue criada e aprovada
- [ ] Especificações claras definidas
- [ ] Testes de contrato escritos (TDD)
- [ ] Ambiente de desenvolvimento configurado
- [ ] Acesso ao Bitbucket Cloud configurado

#### Durante o Desenvolvimento
- [ ] Testes unitários implementados (>80% cobertura)
- [ ] Testes de integração com APIs reais do Cloud
- [ ] Validação com schemas Zod
- [ ] Validação de regras de negócio implementada
- [ ] Suporte exclusivo para Cloud
- [ ] Cache implementado com TTL apropriado
- [ ] Error handling robusto
- [ ] Logs estruturados com sanitização
- [ ] Rate limiting configurado

#### Antes do Pull Request
- [ ] Todos os testes passando
- [ ] Linting sem erros
- [ ] Build sem erros
- [ ] Documentação atualizada
- [ ] Exemplos de uso adicionados
- [ ] Performance testada (<2s para 95% das requisições)
- [ ] Validação de regras de negócio testada

### Exemplos de Implementação para Issues

#### Criando uma Nova Ferramenta MCP de Issues
```typescript
// 1. Defina o schema de entrada
const createIssueTool = {
  name: 'mcp_bitbucket_cloud_issues_create',
  description: 'Cria uma nova issue no Bitbucket Cloud',
  inputSchema: {
    type: 'object',
    properties: {
      workspace: { type: 'string' },
      repo_slug: { type: 'string' },
      title: { type: 'string' },
      content: { type: 'string' },
      kind: { type: 'string', enum: ['bug', 'enhancement', 'proposal', 'task'] },
      priority: { type: 'string', enum: ['trivial', 'minor', 'major', 'critical', 'blocker'] },
      assignee: { type: 'string' },
      component: { type: 'string' },
      milestone: { type: 'string' },
      version: { type: 'string' }
    },
    required: ['workspace', 'repo_slug', 'title']
  }
};

// 2. Implemente o handler
export async function createIssue(args: CreateIssueArgs): Promise<MCPResponse> {
  try {
    const service = new IssuesService();
    const result = await service.createIssue({
      workspace: args.workspace,
      repoSlug: args.repo_slug,
      title: args.title,
      content: args.content,
      kind: args.kind,
      priority: args.priority,
      assignee: args.assignee,
      component: args.component,
      milestone: args.milestone,
      version: args.version
    });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    throw new MCPError('Failed to create issue', error);
  }
}

// 3. Registre a ferramenta
toolRegistry.registerTool({
  name: createIssueTool.name,
  description: createIssueTool.description,
  inputSchema: createIssueTool.inputSchema,
  handler: createIssue,
  rateLimitType: 'api:heavy',
  cacheKey: () => '' // No caching for create operations
});
```

### Troubleshooting para Issues

#### Problemas Comuns

1. **Erro de Autenticação OAuth 2.0**
   - Verifique se o token OAuth está válido
   - Confirme se o usuário tem permissões adequadas no workspace
   - Teste com diferentes escopos de OAuth

2. **Erro de Validação de Regras de Negócio**
   - Verifique se as regras de validação estão corretas
   - Confirme se os dados de entrada atendem aos critérios
   - Teste com diferentes cenários de validação

3. **Diferenças entre Workspaces**
   - Use detecção automática de configurações do workspace
   - Implemente fallbacks quando necessário
   - Teste com diferentes workspaces

4. **Problemas de Performance**
   - Implemente cache inteligente
   - Use paginação para listas grandes
   - Otimize queries e filtros

5. **Problemas de Transições de Estado**
   - Verifique se as transições são válidas para o estado atual
   - Confirme se o usuário tem permissões para a transição
   - Teste com diferentes fluxos de trabalho

### Estrutura de Arquivos

#### Serviços (`src/services/`)
- **`pullrequest-service.ts`**: Operações CRUD e operações de merge/decline/reopen
- **`pullrequest-comments-service.ts`**: Gestão de comentários
- **`pullrequest-analysis-service.ts`**: Análise e atividade

#### Ferramentas MCP (`src/tools/datacenter/pullrequest/`)
- **`crud.ts`**: Ferramentas CRUD (create, get, update, delete, list)
- **`operations.ts`**: Ferramentas de operações (merge, decline, reopen)
- **`comments.ts`**: Ferramentas de comentários (create, get, update, delete)
- **`analysis.ts`**: Ferramentas de análise (activity, diff, changes)

#### Testes (`tests/`)
- **`unit/pullrequest/`**: Testes unitários dos serviços
- **`integration/`**: Testes de integração com APIs reais
- **`contract/`**: Testes de contrato para validação de APIs

### Padrões de Desenvolvimento

#### 1. **Test-Driven Development (TDD)**
```typescript
// 1. Escreva o teste primeiro (DEVE FALHAR)
describe('PullRequestService', () => {
  it('should create a pull request successfully', async () => {
    const result = await service.createPullRequest({
      projectKey: 'TEST',
      repositorySlug: 'test-repo',
      title: 'Test PR',
      fromRef: 'feature/branch',
      toRef: 'main'
    });
    
    expect(result.id).toBeDefined();
    expect(result.title).toBe('Test PR');
  });
});

// 2. Implemente a funcionalidade
class PullRequestService {
  async createPullRequest(request: CreatePullRequestRequest): Promise<PullRequest> {
    // Implementação...
  }
}

// 3. Refatore se necessário
```

#### 2. **Validação com Zod**
```typescript
import { z } from 'zod';

// Schema de validação
const CreatePullRequestSchema = z.object({
  projectKey: z.string().min(1),
  repositorySlug: z.string().min(1),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  fromRef: z.string().min(1),
  toRef: z.string().min(1),
  reviewers: z.array(z.string()).optional(),
  closeSourceBranch: z.boolean().optional()
});

// Uso no serviço
async createPullRequest(request: unknown): Promise<PullRequest> {
  const validatedRequest = CreatePullRequestSchema.parse(request);
  // Implementação...
}
```

#### 3. **Suporte Dual (Data Center + Cloud)**
```typescript
class PullRequestService {
  private buildApiUrl(serverInfo: ServerInfo, projectKey: string, repoSlug: string): string {
    if (serverInfo.serverType === 'datacenter') {
      return `${serverInfo.baseUrl}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`;
    } else {
      return `${serverInfo.baseUrl}/2.0/repositories/${projectKey}/${repoSlug}/pullrequests`;
    }
  }
}
```

#### 4. **Cache Inteligente**
```typescript
class PullRequestService {
  async getPullRequest(request: GetPullRequestRequest): Promise<PullRequest> {
    const cacheKey = `pr:${request.projectKey}:${request.repositorySlug}:${request.pullRequestId}`;
    
    // Verificar cache primeiro
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Buscar da API
    const result = await this.fetchFromAPI(request);
    
    // Armazenar no cache (TTL 5 minutos)
    await this.cache.set(cacheKey, result, 300);
    
    return result;
  }
}
```

#### 5. **Error Handling Robusto**
```typescript
class PullRequestService {
  async createPullRequest(request: CreatePullRequestRequest): Promise<PullRequest> {
    try {
      return await this.executeWithRetry(async () => {
        const response = await axios.post(this.buildApiUrl(request.serverInfo, request.projectKey, request.repositorySlug), {
          title: request.title,
          description: request.description,
          fromRef: { id: request.fromRef },
          toRef: { id: request.toRef }
        }, {
          headers: {
            'Authorization': `Bearer ${request.auth.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      });
    } catch (error) {
      if (error.response?.status === 409) {
        throw new ConflictError('Pull request already exists');
      } else if (error.response?.status === 401) {
        throw new AuthenticationError('Invalid credentials');
      } else {
        throw new PullRequestError('Failed to create pull request', error);
      }
    }
  }
}
```

### Checklist de Desenvolvimento

#### Antes de Começar
- [ ] Issue criada e aprovada
- [ ] Especificações claras definidas
- [ ] Testes de contrato escritos (TDD)
- [ ] Ambiente de desenvolvimento configurado

#### Durante o Desenvolvimento
- [ ] Testes unitários implementados (>80% cobertura)
- [ ] Testes de integração com APIs reais
- [ ] Validação com schemas Zod
- [ ] Suporte para Data Center e Cloud
- [ ] Cache implementado com TTL apropriado
- [ ] Error handling robusto
- [ ] Logs estruturados com sanitização
- [ ] Rate limiting configurado

#### Antes do Pull Request
- [ ] Todos os testes passando
- [ ] Linting sem erros
- [ ] Build sem erros
- [ ] Documentação atualizada
- [ ] Exemplos de uso adicionados
- [ ] Performance testada (<2s para 95% das requisições)

### Exemplos de Implementação

#### Criando uma Nova Ferramenta MCP
```typescript
// 1. Defina o schema de entrada
const createPullRequestTool = {
  name: 'mcp_bitbucket_pull_request_create',
  description: 'Cria um novo pull request no Bitbucket Data Center',
  inputSchema: {
    type: 'object',
    properties: {
      project_key: { type: 'string' },
      repo_slug: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      source_branch: { type: 'string' },
      destination_branch: { type: 'string' },
      reviewers: { type: 'array', items: { type: 'string' } }
    },
    required: ['project_key', 'repo_slug', 'title', 'source_branch', 'destination_branch']
  }
};

// 2. Implemente o handler
export async function createPullRequest(args: CreatePullRequestArgs): Promise<MCPResponse> {
  try {
    const service = new PullRequestService();
    const result = await service.createPullRequest({
      serverInfo: await detectServer(args.serverUrl),
      auth: await authenticate(args),
      projectKey: args.project_key,
      repositorySlug: args.repo_slug,
      title: args.title,
      description: args.description,
      fromRef: args.source_branch,
      toRef: args.destination_branch,
      reviewers: args.reviewers
    });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    throw new MCPError('Failed to create pull request', error);
  }
}

// 3. Registre a ferramenta
toolRegistry.registerTool({
  name: createPullRequestTool.name,
  description: createPullRequestTool.description,
  inputSchema: createPullRequestTool.inputSchema,
  handler: createPullRequest,
  rateLimitType: 'api:heavy',
  cacheKey: () => '' // No caching for create operations
});
```

### Troubleshooting

#### Problemas Comuns

1. **Erro de Autenticação**
   - Verifique se o token está válido
   - Confirme se o usuário tem permissões adequadas
   - Teste com diferentes métodos de autenticação

2. **Erro de Rate Limiting**
   - Implemente backoff exponencial
   - Use cache para reduzir chamadas à API
   - Configure rate limiting apropriado

3. **Diferenças entre Data Center e Cloud**
   - Use detecção automática de servidor
   - Implemente fallbacks quando necessário
   - Teste com ambos os tipos de servidor

4. **Problemas de Performance**
   - Implemente cache inteligente
   - Use paginação para listas grandes
   - Otimize queries e filtros

## 🔄 Processo de Desenvolvimento

### 1. **Planejamento**
- Crie uma issue descrevendo o problema/feature
- Discuta a abordagem com a comunidade
- Aguarde aprovação antes de começar

### 2. **Desenvolvimento**
- Crie uma branch a partir de `main`
- Implemente a solução seguindo os padrões
- Adicione testes abrangentes
- Atualize documentação

### 3. **Testes**
- Execute todos os testes: `npm test`
- Verifique cobertura: `npm run test:coverage`
- Teste manualmente se necessário

### 4. **Pull Request**
- Crie PR com descrição detalhada
- Referencie issues relacionadas
- Aguarde revisão e feedback

### 5. **Merge**
- Aguarde aprovação de pelo menos 2 revisores
- Resolva conflitos se necessário
- Merge após aprovação

## 🧪 Testes

### Estrutura de Testes

```
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
├── contract/       # Testes de contrato
└── setup.ts        # Configuração global
```

### Executar Testes

```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes com cobertura
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

### Padrões de Teste

```typescript
describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let mockBitbucketApi: jest.Mocked<BitbucketApi>;

  beforeEach(() => {
    mockBitbucketApi = createMockBitbucketApi();
    authService = new AuthenticationService(mockBitbucketApi);
  });

  describe('authenticate', () => {
    it('should authenticate with OAuth 2.0 successfully', async () => {
      // Arrange
      const config: AuthConfig = {
        type: 'oauth2',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };
      
      mockBitbucketApi.authenticate.mockResolvedValue('access-token');

      // Act
      const result = await authService.authenticate(config);

      // Assert
      expect(result).toBe('access-token');
      expect(mockBitbucketApi.authenticate).toHaveBeenCalledWith(config);
    });

    it('should throw AuthenticationError when credentials are invalid', async () => {
      // Arrange
      const config: AuthConfig = {
        type: 'oauth2',
        clientId: 'invalid-id',
        clientSecret: 'invalid-secret'
      };
      
      mockBitbucketApi.authenticate.mockRejectedValue(
        new Error('Invalid credentials')
      );

      // Act & Assert
      await expect(authService.authenticate(config))
        .rejects
        .toThrow(AuthenticationError);
    });
  });
});
```

### Cobertura de Testes

- **Mínimo**: 80% de cobertura
- **Ideal**: 90%+ de cobertura
- **Crítico**: 100% para código de segurança

## 📚 Documentação

### Tipos de Documentação

1. **API Reference** (`docs/api-reference.md`)
   - Documentação completa da API
   - Exemplos de uso
   - Códigos de erro

2. **Architecture** (`docs/architecture.md`)
   - Visão geral da arquitetura
   - Diagramas e fluxos
   - Decisões de design

3. **Configuration** (`docs/configuration.md`)
   - Variáveis de ambiente
   - Configurações avançadas
   - Exemplos de setup

4. **Development** (`docs/development.md`)
   - Guia de desenvolvimento
   - Debugging
   - Troubleshooting

### Atualizando Documentação

- Mantenha documentação sincronizada com código
- Use exemplos práticos e claros
- Inclua diagramas quando apropriado
- Revise regularmente para precisão

## 🔀 Pull Requests

### Template de PR

```markdown
## 📝 Descrição
Breve descrição das mudanças implementadas.

## 🔗 Issues Relacionadas
Fixes #123
Closes #456

## 🧪 Testes
- [ ] Testes unitários adicionados/atualizados
- [ ] Testes de integração executados
- [ ] Cobertura de testes mantida (>80%)

## 📚 Documentação
- [ ] Documentação atualizada
- [ ] Exemplos adicionados se necessário
- [ ] README atualizado se necessário

## 🔍 Checklist
- [ ] Código segue padrões do projeto
- [ ] Linting passou sem erros
- [ ] Build passou sem erros
- [ ] Testes passaram
- [ ] Documentação atualizada
```

### Processo de Revisão

1. **Revisão Automática**
   - Linting e formatação
   - Testes automatizados
   - Build e deploy

2. **Revisão Manual**
   - Código e arquitetura
   - Testes e cobertura
   - Documentação

3. **Aprovação**
   - Pelo menos 2 aprovações
   - Sem conflitos
   - Todos os checks passando

## 🐛 Reportar Bugs

### Template de Bug Report

```markdown
## 🐛 Descrição do Bug
Descrição clara e concisa do bug.

## 🔄 Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## 🎯 Comportamento Esperado
Descrição do que deveria acontecer.

## 📸 Screenshots
Se aplicável, adicione screenshots.

## 🖥️ Ambiente
- OS: [e.g. Windows 10, macOS 12.0, Ubuntu 20.04]
- Node.js: [e.g. 18.17.0]
- Versão: [e.g. 1.0.0]

## 📋 Logs
```
Cole logs relevantes aqui
```

## 🔍 Informações Adicionais
Qualquer informação adicional sobre o problema.
```

## 💡 Sugerir Melhorias

### Template de Feature Request

```markdown
## 🚀 Feature Request
Descrição clara da feature solicitada.

## 🎯 Problema
Qual problema esta feature resolve?

## 💡 Solução Proposta
Descrição detalhada da solução proposta.

## 🔄 Alternativas Consideradas
Outras soluções que foram consideradas.

## 📋 Critérios de Aceitação
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## 📸 Mockups/Exemplos
Se aplicável, adicione mockups ou exemplos.

## 🔍 Informações Adicionais
Qualquer informação adicional sobre a feature.
```

## 🏷️ Versionamento

### Semantic Versioning

- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs

### Changelog

- Mantenha `CHANGELOG.md` atualizado
- Use formato convencional
- Inclua breaking changes

## 🚀 Release Process

### 1. **Preparação**
- Atualize versão em `package.json`
- Atualize `CHANGELOG.md`
- Execute testes completos

### 2. **Release**
- Crie tag de versão
- Gere release notes
- Publique no npm

### 3. **Pós-Release**
- Atualize documentação
- Comunique mudanças
- Monitore feedback

## 🤝 Comunidade

### Canais de Comunicação

- **GitHub Issues**: Bugs e features
- **GitHub Discussions**: Perguntas e discussões
- **Discord**: Chat em tempo real (se disponível)

### Reconhecimento

- Contribuidores listados no README
- Menção em release notes
- Badges de contribuição

## ❓ FAQ

### Como começar a contribuir?

1. Leia este guia completamente
2. Configure o ambiente de desenvolvimento
3. Escolha uma issue marcada como "good first issue"
4. Crie uma branch e comece a trabalhar

### Como escolher uma issue?

- Procure por labels como "good first issue"
- Escolha algo dentro da sua área de expertise
- Pergunte na issue se tiver dúvidas

### Como obter ajuda?

- Abra uma issue com label "question"
- Participe das discussões no GitHub
- Entre em contato com mantenedores

### Como reportar problemas de segurança?

- **NÃO** abra issues públicas para problemas de segurança
- Envie email para security@example.com
- Aguarde resposta antes de divulgar

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto.

---

**Obrigado por contribuir! 🎉**

Sua contribuição é valiosa e ajuda a tornar este projeto melhor para todos.
