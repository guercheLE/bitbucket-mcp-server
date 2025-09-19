# Quickstart: Sistema de Busca

**Feature**: Sistema de Busca  
**Date**: 2024-12-19  
**Status**: Complete

## Overview

Este quickstart demonstra como usar o Sistema de Busca do Bitbucket MCP Server para encontrar repositórios, commits, pull requests e código através de uma interface unificada.

## Prerequisites

- Bitbucket MCP Server configurado e executando
- Autenticação válida com Bitbucket (Data Center 7.16+ ou Cloud)
- Cliente MCP compatível (ex: Cursor, Claude Desktop)

## Basic Usage

### 1. Buscar Repositórios

```bash
# Buscar repositórios por nome
mcp_bitbucket_search_repositories --query "api"

# Buscar repositórios em projeto específico
mcp_bitbucket_search_repositories --query "microservice" --projectKey "PROJ"

# Buscar repositórios públicos em TypeScript
mcp_bitbucket_search_repositories --query "react" --language "typescript" --isPublic true
```

**Expected Output**:
```json
{
  "results": [
    {
      "type": "repository",
      "id": "PROJ_api-gateway",
      "title": "API Gateway Service",
      "description": "Microservice for API gateway functionality",
      "url": "https://bitbucket.company.com/projects/PROJ/repos/api-gateway",
      "metadata": {
        "projectKey": "PROJ",
        "repositorySlug": "api-gateway",
        "isPublic": false,
        "language": "typescript",
        "size": 2048000,
        "lastModified": "2024-12-19T10:30:00Z"
      },
      "relevanceScore": 0.95
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 25,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  },
  "totalCount": 1,
  "searchTime": 150,
  "suggestions": ["api", "gateway", "microservice"]
}
```

### 2. Buscar Commits

```bash
# Buscar commits por autor
mcp_bitbucket_search_commits --query "bug fix" --author "joao.silva"

# Buscar commits em período específico
mcp_bitbucket_search_commits --query "security" --fromDate "2024-01-01T00:00:00Z" --toDate "2024-12-31T23:59:59Z"

# Buscar commits em repositório específico
mcp_bitbucket_search_commits --query "authentication" --projectKey "PROJ" --repositorySlug "auth-service"
```

**Expected Output**:
```json
{
  "results": [
    {
      "type": "commit",
      "id": "abc123def456",
      "title": "Fix authentication bug in login flow",
      "description": "Fixed issue where users couldn't login with special characters in password",
      "url": "https://bitbucket.company.com/projects/PROJ/repos/auth-service/commits/abc123def456",
      "metadata": {
        "projectKey": "PROJ",
        "repositorySlug": "auth-service",
        "author": "joao.silva",
        "committer": "joao.silva",
        "commitDate": "2024-12-19T10:30:00Z",
        "message": "Fix authentication bug in login flow\n\n- Updated password validation regex\n- Added tests for special characters\n- Fixed edge case in token generation"
      },
      "relevanceScore": 0.92
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 25,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  },
  "totalCount": 1,
  "searchTime": 200,
  "suggestions": ["fix", "bug", "authentication", "login"]
}
```

### 3. Buscar Pull Requests

```bash
# Buscar pull requests abertos
mcp_bitbucket_search_pull_requests --query "bug fix" --state "OPEN"

# Buscar pull requests por revisor
mcp_bitbucket_search_pull_requests --query "feature" --reviewer "maria.santos"

# Buscar pull requests por autor e estado
mcp_bitbucket_search_pull_requests --query "refactor" --author "pedro.oliveira" --state "MERGED"
```

**Expected Output**:
```json
{
  "results": [
    {
      "type": "pullrequest",
      "id": "123",
      "title": "Fix critical authentication bug",
      "description": "This PR fixes a critical bug in the authentication system that was causing login failures for users with special characters in their passwords.",
      "url": "https://bitbucket.company.com/projects/PROJ/repos/auth-service/pull-requests/123",
      "metadata": {
        "projectKey": "PROJ",
        "repositorySlug": "auth-service",
        "state": "OPEN",
        "author": "joao.silva",
        "createdDate": "2024-12-19T10:30:00Z",
        "updatedDate": "2024-12-19T15:45:00Z",
        "reviewers": ["maria.santos", "pedro.oliveira"]
      },
      "relevanceScore": 0.88
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 25,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  },
  "totalCount": 1,
  "searchTime": 180,
  "suggestions": ["fix", "bug", "authentication", "critical"]
}
```

### 4. Buscar Código

```bash
# Buscar função específica
mcp_bitbucket_search_code --query "function authenticate"

# Buscar código em arquivos TypeScript
mcp_bitbucket_search_code --query "JWT token" --fileExtension ".ts"

# Buscar código em diretório específico
mcp_bitbucket_search_code --query "validation" --filePath "src/auth/"

# Buscar código por linguagem
mcp_bitbucket_search_code --query "async function" --language "typescript"
```

**Expected Output**:
```json
{
  "results": [
    {
      "type": "code",
      "id": "src/auth/authenticate.ts:45",
      "title": "authenticate function in src/auth/authenticate.ts",
      "description": "function authenticate(user: User, password: string): Promise<AuthResult>",
      "url": "https://bitbucket.company.com/projects/PROJ/repos/auth-service/src/src/auth/authenticate.ts",
      "metadata": {
        "projectKey": "PROJ",
        "repositorySlug": "auth-service",
        "filePath": "src/auth/authenticate.ts",
        "lineNumber": 45,
        "language": "typescript",
        "context": "export async function authenticate(user: User, password: string): Promise<AuthResult> {\n  // Validate user credentials\n  const isValid = await validateCredentials(user, password);\n  if (!isValid) {\n    throw new AuthenticationError('Invalid credentials');\n  }\n  \n  // Generate JWT token\n  const token = await generateToken(user);\n  return { token, user };\n}"
      },
      "relevanceScore": 0.95
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 25,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  },
  "totalCount": 1,
  "searchTime": 300,
  "suggestions": ["function", "authenticate", "auth", "login"]
}
```

## Advanced Usage

### Filtros Combinados

```bash
# Buscar commits de autor específico em período e repositório
mcp_bitbucket_search_commits \
  --query "security" \
  --author "joao.silva" \
  --projectKey "PROJ" \
  --repositorySlug "auth-service" \
  --fromDate "2024-01-01T00:00:00Z" \
  --toDate "2024-12-31T23:59:59Z"
```

### Paginação

```bash
# Buscar segunda página de resultados
mcp_bitbucket_search_repositories --query "api" --page 1 --limit 50

# Buscar com limite personalizado
mcp_bitbucket_search_code --query "function" --limit 100
```

### Ordenação

```bash
# Ordenar por data de modificação (mais recente primeiro)
mcp_bitbucket_search_repositories --query "service" --sortBy "lastModified" --sortOrder "desc"

# Ordenar por nome (alfabética)
mcp_bitbucket_search_repositories --query "api" --sortBy "name" --sortOrder "asc"
```

## Error Handling

### Erro de Autenticação
```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required",
  "timestamp": "2024-12-19T10:30:00Z",
  "correlationId": "req-123456"
}
```

### Erro de Parâmetros Inválidos
```json
{
  "error": "BAD_REQUEST",
  "message": "Invalid query parameters",
  "timestamp": "2024-12-19T10:30:00Z",
  "details": {
    "query": "Query string is required and must be between 1 and 500 characters"
  },
  "correlationId": "req-123456"
}
```

### Erro de Permissão
```json
{
  "error": "FORBIDDEN",
  "message": "Insufficient permissions to access repository",
  "timestamp": "2024-12-19T10:30:00Z",
  "correlationId": "req-123456"
}
```

## Performance Tips

1. **Use filtros específicos**: Adicione filtros como `projectKey`, `repositorySlug` para reduzir o escopo da busca
2. **Limite resultados**: Use `limit` para controlar o número de resultados retornados
3. **Cache de resultados**: Resultados são cacheados por 5 minutos para melhorar performance
4. **Paginação**: Use paginação para grandes volumes de dados

## Integration Examples

### Com Cursor/Claude Desktop

```typescript
// Buscar repositórios via MCP
const repositories = await mcp_bitbucket_search_repositories({
  query: "api",
  projectKey: "PROJ",
  limit: 10
});

// Processar resultados
repositories.results.forEach(repo => {
  console.log(`${repo.title}: ${repo.description}`);
});
```

### Com Console Client

```bash
# Usar comandos do console client
bitbucket search repositories "api" --project PROJ --limit 10
bitbucket search commits "bug fix" --author joao.silva
bitbucket search pullrequests "feature" --state OPEN
bitbucket search code "function authenticate" --language typescript
```

## Troubleshooting

### Busca sem resultados
- Verifique se o termo de busca está correto
- Confirme se você tem permissão para acessar os repositórios
- Tente termos de busca mais genéricos

### Busca lenta
- Adicione filtros específicos (projeto, repositório)
- Reduza o limite de resultados
- Verifique a conectividade com o Bitbucket

### Erro de autenticação
- Verifique se as credenciais estão configuradas corretamente
- Confirme se o token de acesso não expirou
- Teste a conectividade com o Bitbucket

## Next Steps

1. **Explore filtros avançados**: Experimente diferentes combinações de filtros
2. **Use sugestões**: Aproveite as sugestões retornadas para refinar buscas
3. **Integre com workflows**: Use as buscas em scripts e automações
4. **Monitore performance**: Acompanhe tempos de busca e otimize consultas

## Support

Para suporte adicional:
- Consulte a documentação da API: [docs/api-reference.md](../../docs/api-reference.md)
- Verifique logs de erro para detalhes específicos
- Reporte problemas no repositório: [GitHub Issues](https://github.com/guercheLE/bitbucket-mcp-server/issues)
