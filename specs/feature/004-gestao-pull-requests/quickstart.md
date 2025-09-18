# Quickstart: Gestão de Pull Requests

**Feature**: 004-gestao-pull-requests  
**Date**: 2025-01-27  
**Status**: Complete

## Overview
Este guia demonstra como usar as ferramentas MCP para gestão completa de pull requests no Bitbucket, incluindo operações CRUD, comentários, análise de diffs, merge/decline/reopen, com suporte para Data Center 7.16+ e Cloud.

## Prerequisites
- Bitbucket MCP Server configurado e executando
- Autenticação configurada (OAuth 2.0, Personal Access Token, App Password, ou Basic Auth)
- Acesso a um repositório Bitbucket com permissões adequadas
- Cliente MCP compatível (Cursor, GitHub Copilot, etc.)

## Setup
1. **Configure a autenticação**:
   ```bash
   # OAuth 2.0 (recomendado)
   export BITBUCKET_OAUTH_CLIENT_ID="your_client_id"
   export BITBUCKET_OAUTH_CLIENT_SECRET="your_client_secret"
   
   # Personal Access Token (alternativa)
   export BITBUCKET_ACCESS_TOKEN="your_access_token"
   
   # App Password (legado)
   export BITBUCKET_USERNAME="your_username"
   export BITBUCKET_APP_PASSWORD="your_app_password"
   ```

2. **Configure o servidor Bitbucket**:
   ```bash
   # Data Center
   export BITBUCKET_BASE_URL="https://bitbucket.company.com"
   export BITBUCKET_SERVER_TYPE="datacenter"
   
   # Cloud
   export BITBUCKET_BASE_URL="https://api.bitbucket.org"
   export BITBUCKET_SERVER_TYPE="cloud"
   ```

3. **Inicie o servidor MCP**:
   ```bash
   npm start
   ```

## Basic Operations

### 1. Listar Pull Requests
Liste todos os pull requests de um repositório:

```typescript
// Listar pull requests abertos
const pullRequests = await mcp.callTool('mcp_bitbucket_pull_request_list', {
  project_key: 'PROJ',
  repo_slug: 'my-repo',
  state: 'OPEN',
  limit: 25
});

console.log(`Encontrados ${pullRequests.size} pull requests`);
pullRequests.values.forEach(pr => {
  console.log(`- #${pr.id}: ${pr.title} (${pr.state})`);
});
```

### 2. Criar Pull Request
Crie um novo pull request:

```typescript
const newPR = await mcp.callTool('mcp_bitbucket_pull_request_create', {
  project_key: 'PROJ',
  repo_slug: 'my-repo',
  title: 'Feature: Implementar nova funcionalidade',
  description: 'Esta PR implementa a nova funcionalidade solicitada pelo cliente.',
  source_branch: 'feature/nova-funcionalidade',
  destination_branch: 'main',
  reviewers: ['john.doe', 'jane.smith']
});

console.log(`Pull request criado: #${newPR.id}`);
console.log(`URL: ${newPR.links.html[0].href}`);
```

### 3. Obter Detalhes do Pull Request
Obtenha informações detalhadas de um pull request:

```typescript
const pr = await mcp.callTool('mcp_bitbucket_pull_request_get', {
  project_key: 'PROJ',
  repo_slug: 'my-repo',
  pull_request_id: 123
});

console.log(`Título: ${pr.title}`);
console.log(`Estado: ${pr.state}`);
console.log(`Autor: ${pr.author.displayName}`);
console.log(`Revisores: ${pr.reviewers.map(r => r.user.displayName).join(', ')}`);
console.log(`Criado em: ${pr.createdDate}`);
```

### 4. Atualizar Pull Request
Atualize um pull request existente:

```typescript
const updatedPR = await mcp.callTool('mcp_bitbucket_pull_request_update', {
  project_key: 'PROJ',
  repo_slug: 'my-repo',
  pull_request_id: 123,
  updates: {
    title: 'Feature: Implementar nova funcionalidade (atualizado)',
    description: 'Descrição atualizada com mais detalhes.',
    reviewers: ['john.doe', 'jane.smith', 'bob.wilson']
  }
});

console.log(`Pull request atualizado: #${updatedPR.id}`);
```

## Comment Management

### 5. Adicionar Comentário
Adicione um comentário a um pull request:

```typescript
const comment = await mcp.callTool('mcp_bitbucket_pull_request_create_comment', {
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  text: 'Ótimo trabalho! A implementação está muito bem estruturada. Apenas uma pequena sugestão na linha 45.'
});

console.log(`Comentário adicionado: #${comment.id}`);
```

### 6. Listar Comentários
Liste todos os comentários de um pull request:

```typescript
const comments = await mcp.callTool('mcp_bitbucket_pull_request_get_comments', {
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123
});

comments.values.forEach(comment => {
  console.log(`- ${comment.author.displayName}: ${comment.text}`);
  console.log(`  Criado em: ${comment.createdDate}`);
});
```

### 7. Atualizar Comentário
Atualize um comentário existente:

```typescript
const updatedComment = await mcp.callTool('mcp_bitbucket_pull_request_update_comment', {
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  commentId: 456,
  version: 1,
  text: 'Comentário atualizado com mais detalhes.'
});

console.log(`Comentário atualizado: #${updatedComment.id}`);
```

## Analysis and History

### 8. Obter Histórico de Atividades
Obtenha o histórico completo de atividades de um pull request:

```typescript
const activities = await mcp.callTool('mcp_bitbucket_pull_request_get_activity', {
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123
});

activities.values.forEach(activity => {
  console.log(`${activity.createdDate}: ${activity.user.displayName} ${activity.action}`);
  if (activity.comment) {
    console.log(`  Comentário: ${activity.comment.text}`);
  }
});
```

### 9. Obter Diff do Pull Request
Obtenha o diff entre as branches:

```typescript
const diff = await mcp.callTool('mcp_bitbucket_pull_request_get_diff', {
  project_key: 'PROJ',
  repo_slug: 'my-repo',
  pull_request_id: 123,
  context_lines: 3
});

console.log('Diff do pull request:');
console.log(diff.diff);
```

### 10. Obter Lista de Mudanças
Obtenha a lista de arquivos alterados:

```typescript
const changes = await mcp.callTool('mcp_bitbucket_pull_request_get_changes', {
  project_key: 'PROJ',
  repo_slug: 'my-repo',
  pull_request_id: 123
});

console.log('Arquivos alterados:');
changes.values.forEach(change => {
  console.log(`- ${change.path} (${change.type})`);
  if (change.percentUnchanged !== undefined) {
    console.log(`  ${change.percentUnchanged}% inalterado`);
  }
});
```

## Merge Operations

### 11. Fazer Merge do Pull Request
Faça merge de um pull request:

```typescript
const mergedPR = await mcp.callTool('mcp_bitbucket_pull_request_merge', {
  project_key: 'PROJ',
  repo_slug: 'my-repo',
  pull_request_id: 123,
  merge_strategy: 'merge-commit'
});

console.log(`Pull request mergeado: #${mergedPR.id}`);
console.log(`Estado: ${mergedPR.state}`);
```

### 12. Recusar Pull Request
Recuse um pull request:

```typescript
const declinedPR = await mcp.callTool('mcp_bitbucket_pull_request_decline', {
  project_key: 'PROJ',
  repo_slug: 'my-repo',
  pull_request_id: 123,
  reason: 'Implementação não atende aos requisitos especificados.'
});

console.log(`Pull request recusado: #${declinedPR.id}`);
console.log(`Estado: ${declinedPR.state}`);
```

### 13. Reabrir Pull Request
Reabra um pull request fechado:

```typescript
const reopenedPR = await mcp.callTool('mcp_bitbucket_pull_request_reopen', {
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123
});

console.log(`Pull request reaberto: #${reopenedPR.id}`);
console.log(`Estado: ${reopenedPR.state}`);
```

## Advanced Usage

### 14. Filtrar Pull Requests
Use filtros avançados para encontrar pull requests específicos:

```typescript
// Pull requests por autor
const authorPRs = await mcp.callTool('mcp_bitbucket_pull_request_list', {
  project_key: 'PROJ',
  repo_slug: 'my-repo',
  state: 'OPEN',
  // Filtro por autor seria implementado via query parameters
});

// Pull requests por revisor
const reviewerPRs = await mcp.callTool('mcp_bitbucket_pull_request_list', {
  project_key: 'PROJ',
  repo_slug: 'my-repo',
  state: 'OPEN',
  // Filtro por revisor seria implementado via query parameters
});
```

### 15. Comentários com Âncora no Código
Adicione comentários específicos em linhas de código:

```typescript
const anchoredComment = await mcp.callTool('mcp_bitbucket_pull_request_create_comment', {
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  text: 'Sugestão: considere usar uma constante aqui.',
  anchor: {
    line: 45,
    lineType: 'ADDED',
    fileType: 'TO',
    path: 'src/utils/helper.js'
  }
});

console.log(`Comentário ancorado criado: #${anchoredComment.id}`);
```

### 16. Threads de Comentários
Crie threads de comentários:

```typescript
// Comentário principal
const mainComment = await mcp.callTool('mcp_bitbucket_pull_request_create_comment', {
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  text: 'Tenho algumas dúvidas sobre esta implementação.'
});

// Resposta ao comentário
const replyComment = await mcp.callTool('mcp_bitbucket_pull_request_create_comment', {
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  text: 'Qual é sua dúvida específica?',
  parent: {
    id: mainComment.id
  }
});

console.log(`Thread criada: ${mainComment.id} -> ${replyComment.id}`);
```

## Error Handling

### 17. Tratamento de Erros
Implemente tratamento robusto de erros:

```typescript
try {
  const pr = await mcp.callTool('mcp_bitbucket_pull_request_get', {
    project_key: 'PROJ',
    repo_slug: 'my-repo',
    pull_request_id: 999
  });
} catch (error) {
  if (error.code === 404) {
    console.log('Pull request não encontrado');
  } else if (error.code === 403) {
    console.log('Sem permissão para acessar este pull request');
  } else if (error.code === 401) {
    console.log('Não autenticado - verifique suas credenciais');
  } else {
    console.log(`Erro inesperado: ${error.message}`);
  }
}
```

### 18. Validação de Conflitos de Merge
Verifique conflitos antes de fazer merge:

```typescript
try {
  const mergedPR = await mcp.callTool('mcp_bitbucket_pull_request_merge', {
    project_key: 'PROJ',
    repo_slug: 'my-repo',
    pull_request_id: 123
  });
} catch (error) {
  if (error.code === 409) {
    console.log('Conflitos de merge detectados:');
    console.log(error.details.conflicts);
  } else {
    console.log(`Erro no merge: ${error.message}`);
  }
}
```

## Performance Tips

### 19. Paginação Eficiente
Use paginação para grandes volumes de dados:

```typescript
async function getAllPullRequests(projectKey: string, repoSlug: string) {
  const allPRs = [];
  let start = 0;
  const limit = 100;
  let isLastPage = false;

  while (!isLastPage) {
    const response = await mcp.callTool('mcp_bitbucket_pull_request_list', {
      project_key: projectKey,
      repo_slug: repoSlug,
      start,
      limit
    });

    allPRs.push(...response.values);
    isLastPage = response.isLastPage;
    start += limit;
  }

  return allPRs;
}
```

### 20. Cache de Dados
Implemente cache para melhorar performance:

```typescript
const cache = new Map();

async function getCachedPullRequest(projectKey: string, repoSlug: string, prId: number) {
  const cacheKey = `${projectKey}/${repoSlug}/${prId}`;
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < 300000) { // 5 minutos
      return cached.data;
    }
  }

  const pr = await mcp.callTool('mcp_bitbucket_pull_request_get', {
    project_key: projectKey,
    repo_slug: repoSlug,
    pull_request_id: prId
  });

  cache.set(cacheKey, {
    data: pr,
    timestamp: Date.now()
  });

  return pr;
}
```

## Testing

### 21. Teste de Integração
Execute testes de integração para validar a funcionalidade:

```typescript
describe('Pull Request Management', () => {
  test('should create and retrieve pull request', async () => {
    // Criar PR
    const createdPR = await mcp.callTool('mcp_bitbucket_pull_request_create', {
      project_key: 'TEST',
      repo_slug: 'test-repo',
      title: 'Test PR',
      source_branch: 'feature/test',
      destination_branch: 'main'
    });

    expect(createdPR.id).toBeDefined();
    expect(createdPR.title).toBe('Test PR');

    // Recuperar PR
    const retrievedPR = await mcp.callTool('mcp_bitbucket_pull_request_get', {
      project_key: 'TEST',
      repo_slug: 'test-repo',
      pull_request_id: createdPR.id
    });

    expect(retrievedPR.id).toBe(createdPR.id);
    expect(retrievedPR.title).toBe('Test PR');
  });

  test('should handle merge conflicts gracefully', async () => {
    await expect(
      mcp.callTool('mcp_bitbucket_pull_request_merge', {
        project_key: 'TEST',
        repo_slug: 'test-repo',
        pull_request_id: 123
      })
    ).rejects.toThrow('Merge conflicts detected');
  });
});
```

## Conclusion
Este quickstart demonstra como usar todas as funcionalidades de gestão de pull requests do Bitbucket MCP Server. As ferramentas fornecem acesso completo às APIs do Bitbucket Data Center e Cloud, com suporte para operações CRUD, comentários, análise de diffs, merge/decline/reopen, e muito mais.

Para mais informações, consulte:
- [Data Model](./data-model.md) - Modelo de dados completo
- [API Contracts](./contracts/) - Contratos de API detalhados
- [Research](./research.md) - Análise de tecnologias e decisões
- [Tasks](./tasks.md) - Lista de tarefas de implementação

**Status**: Quickstart complete - Ready for implementation
