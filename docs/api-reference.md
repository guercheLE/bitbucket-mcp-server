# Referência da API - Bitbucket MCP Server

Este documento descreve todas as ferramentas e endpoints disponíveis no Bitbucket MCP Server.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Ferramentas de Autenticação](#ferramentas-de-autenticação)
- [Ferramentas de Repositório](#ferramentas-de-repositório)
- [Ferramentas de Pull Request](#ferramentas-de-pull-request)
- [Ferramentas de Issues (Cloud)](#ferramentas-de-issues-cloud)
- [Ferramentas de Projeto](#ferramentas-de-projeto)
- [Ferramentas de Busca](#ferramentas-de-busca)
- [Ferramentas de Dashboard](#ferramentas-de-dashboard)
- [Ferramentas de Sistema](#ferramentas-de-sistema)
- [Códigos de Erro](#códigos-de-erro)
- [Exemplos de Uso](#exemplos-de-uso)

## 🌟 Visão Geral

O Bitbucket MCP Server implementa mais de 250 endpoints da API do Bitbucket, organizados em categorias funcionais. Todas as ferramentas seguem o padrão MCP e incluem validação rigorosa de entrada com Zod.

### Características

- **Detecção Automática**: Detecta automaticamente o tipo de servidor (Data Center vs Cloud)
- **Validação Rigorosa**: Todos os parâmetros são validados com schemas Zod
- **Cache Inteligente**: Cache automático com TTL configurável (5 minutos)
- **Rate Limiting**: Proteção contra abuso com rate limiting e circuit breakers
- **Multi-Transport**: Suporte a stdio, HTTP, SSE e streaming
- **Health Monitoring**: Monitoramento completo de saúde do sistema
- **Error Handling**: Tratamento robusto de erros com retry automático
- **Logs Estruturados**: Logs detalhados com sanitização de dados sensíveis
- **OAuth 2.0**: Suporte completo a OAuth 2.0, Personal Access Tokens, App Passwords e Basic Auth

## 🔐 Autenticação

O servidor suporta múltiplos métodos de autenticação em ordem de prioridade:

1. **OAuth 2.0** (Prioridade máxima)
2. **Personal Access Token**
3. **App Password**
4. **Basic Auth** (Fallback)

### Configuração de Autenticação

```typescript
// OAuth 2.0 (Recomendado)
{
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret",
  "redirectUri": "http://localhost:3000/auth/callback"
}

// Personal Access Token
{
  "token": "your_personal_token"
}

// App Password
{
  "password": "your_app_password"
}

// Basic Auth (Fallback)
{
  "username": "your_username",
  "password": "your_password"
}
```

## 🔑 Ferramentas de Autenticação

### OAuth 2.0

#### `mcp_bitbucket_auth_get_oauth_token`
Obtém um token OAuth no Bitbucket Data Center.

**Parâmetros:**
- `grantType`: Tipo de concessão (`authorization_code` ou `refresh_token`)
- `code`: Código de autorização (opcional)
- `redirectUri`: URI de redirecionamento (opcional)
- `clientId`: ID do cliente (opcional)
- `clientSecret`: Segredo do cliente (opcional)
- `refreshToken`: Token de refresh (opcional)

**Retorna:** Token OAuth com informações de acesso.

## 🐛 Ferramentas de Issues (Cloud)

> **Nota:** As ferramentas de Issues estão disponíveis apenas para Bitbucket Cloud.

### Gestão de Issues

#### `mcp_bitbucket_issues_create`
Cria uma nova issue no Bitbucket Cloud.

**Parâmetros:**
- `title`: Título da issue (obrigatório)
- `content`: Conteúdo da issue (opcional)
- `kind`: Tipo da issue (`bug`, `enhancement`, `proposal`, `task`)
- `priority`: Prioridade (`trivial`, `minor`, `major`, `critical`, `blocker`)
- `assignee`: UUID do responsável (opcional)
- `component`: Nome do componente (opcional)
- `milestone`: Nome do milestone (opcional)
- `version`: Nome da versão (opcional)

**Retorna:** Issue criada com todas as informações.

#### `mcp_bitbucket_issues_get`
Obtém uma issue específica no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)

**Retorna:** Informações detalhadas da issue.

#### `mcp_bitbucket_issues_update`
Atualiza uma issue existente no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)
- `title`: Novo título (opcional)
- `content`: Novo conteúdo (opcional)
- `kind`: Novo tipo (opcional)
- `priority`: Nova prioridade (opcional)
- `assignee`: Novo responsável (opcional)
- `component`: Novo componente (opcional)
- `milestone`: Novo milestone (opcional)
- `version`: Nova versão (opcional)

**Retorna:** Issue atualizada com novas informações.

#### `mcp_bitbucket_issues_delete`
Remove uma issue do Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)

**Retorna:** Confirmação de remoção da issue.

#### `mcp_bitbucket_issues_list`
Lista issues no Bitbucket Cloud.

**Parâmetros:**
- `state`: Estado da issue (opcional)
- `kind`: Tipo da issue (opcional)
- `priority`: Prioridade (opcional)
- `assignee`: UUID do responsável (opcional)
- `reporter`: UUID do reporter (opcional)
- `component`: Nome do componente (opcional)
- `milestone`: Nome do milestone (opcional)
- `version`: Nome da versão (opcional)
- `page`: Página (opcional, padrão: 1)
- `pagelen`: Tamanho da página (opcional, padrão: 50)

**Retorna:** Lista de issues com informações básicas.

#### `mcp_bitbucket_issues_search`
Busca issues no Bitbucket Cloud.

**Parâmetros:**
- `q`: Query de busca (obrigatório)
- `sort`: Campo de ordenação (opcional)
- `state`: Estado da issue (opcional)
- `kind`: Tipo da issue (opcional)
- `priority`: Prioridade (opcional)
- `assignee`: UUID do responsável (opcional)
- `reporter`: UUID do reporter (opcional)
- `component`: Nome do componente (opcional)
- `milestone`: Nome do milestone (opcional)
- `version`: Nome da versão (opcional)
- `created_on`: Data de criação (formato ISO, opcional)
- `updated_on`: Data de atualização (formato ISO, opcional)
- `page`: Página (opcional, padrão: 1)
- `pagelen`: Tamanho da página (opcional, padrão: 50)

**Retorna:** Resultados da busca com issues correspondentes.

### Gestão de Comentários

#### `mcp_bitbucket_issues_get_comments`
Obtém comentários de uma issue no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)
- `page`: Página (opcional, padrão: 1)
- `pagelen`: Tamanho da página (opcional, padrão: 50)

**Retorna:** Lista de comentários da issue.

#### `mcp_bitbucket_issues_create_comment`
Cria um comentário em uma issue no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)
- `content`: Conteúdo do comentário (obrigatório)

**Retorna:** Comentário criado com informações.

#### `mcp_bitbucket_issues_update_comment`
Atualiza um comentário de uma issue no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)
- `commentId`: ID do comentário (obrigatório)
- `content`: Novo conteúdo do comentário (obrigatório)

**Retorna:** Comentário atualizado com informações.

#### `mcp_bitbucket_issues_delete_comment`
Remove um comentário de uma issue no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)
- `commentId`: ID do comentário (obrigatório)

**Retorna:** Confirmação da remoção do comentário.

### Gestão de Transições

#### `mcp_bitbucket_issues_get_transitions`
Obtém transições disponíveis para uma issue no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)

**Retorna:** Lista de transições disponíveis.

#### `mcp_bitbucket_issues_transition`
Transiciona uma issue para um novo estado no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)
- `transition`: ID da transição (obrigatório)
- `fields`: Campos adicionais para a transição (opcional)

**Retorna:** Confirmação da transição.

### Gestão de Relacionamentos

#### `mcp_bitbucket_issues_get_relationships`
Obtém relacionamentos de uma issue no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)
- `page`: Página (opcional, padrão: 1)
- `pagelen`: Tamanho da página (opcional, padrão: 50)

**Retorna:** Lista de relacionamentos da issue.

#### `mcp_bitbucket_issues_create_relationship`
Cria um relacionamento entre issues no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)
- `type`: Tipo do relacionamento (`relates`, `duplicates`, `duplicated_by`, `blocks`, `blocked_by`, `clones`, `cloned_by`)
- `relatedIssueId`: ID da issue relacionada (obrigatório)

**Retorna:** Relacionamento criado com informações.

#### `mcp_bitbucket_issues_delete_relationship`
Remove um relacionamento entre issues no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)
- `relationshipId`: ID do relacionamento (obrigatório)

**Retorna:** Confirmação da remoção do relacionamento.

### Gestão de Anexos

#### `mcp_bitbucket_issues_get_attachments`
Obtém anexos de uma issue no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)
- `page`: Página (opcional, padrão: 1)
- `pagelen`: Tamanho da página (opcional, padrão: 50)

**Retorna:** Lista de anexos da issue.

#### `mcp_bitbucket_issues_upload_attachment`
Faz upload de um anexo para uma issue no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)
- `name`: Nome do arquivo (obrigatório)
- `content`: Conteúdo do arquivo em base64 (obrigatório)
- `type`: Tipo MIME do arquivo (opcional)

**Retorna:** Anexo criado com informações.

#### `mcp_bitbucket_issues_delete_attachment`
Remove um anexo de uma issue no Bitbucket Cloud.

**Parâmetros:**
- `issueId`: ID da issue (obrigatório)
- `attachmentId`: ID do anexo (obrigatório)

**Retorna:** Confirmação da remoção do anexo.

#### `mcp_bitbucket_auth_refresh_oauth_token`
Atualiza um token OAuth no Bitbucket Data Center.

**Parâmetros:**
- `refreshToken`: Token de refresh atual
- `clientId`: ID do cliente OAuth
- `clientSecret`: Segredo do cliente OAuth

**Retorna:** Novo token OAuth com informações atualizadas.

#### `mcp_bitbucket_auth_get_oauth_authorization_url`
Gera URL de autorização OAuth no Bitbucket Data Center.

**Parâmetros:**
- `responseType`: Tipo de resposta (`code`)
- `clientId`: ID do cliente OAuth
- `redirectUri`: URI de redirecionamento
- `scope`: Escopo de permissões
- `state`: Estado de segurança (opcional)

**Retorna:** URL completa de autorização OAuth.

#### `mcp_bitbucket_auth_get_access_token_info`
Obtém informações de um token de acesso no Bitbucket Data Center.

**Parâmetros:**
- `accessToken`: Token de acesso

**Retorna:** Informações detalhadas do token de acesso.

#### `mcp_bitbucket_auth_revoke_access_token`
Revoga um token de acesso no Bitbucket Data Center.

**Parâmetros:**
- `accessToken`: Token de acesso a ser revogado

**Retorna:** Confirmação de revogação do token.

### Aplicações OAuth

#### `mcp_bitbucket_auth_create_oauth_application`
Cria uma aplicação OAuth no Bitbucket Data Center.

**Parâmetros:**
- `name`: Nome da aplicação
- `description`: Descrição da aplicação (opcional)
- `url`: URL da aplicação (opcional)
- `callbackUrl`: URL de callback (opcional)

**Retorna:** Aplicação OAuth criada com credenciais.

#### `mcp_bitbucket_auth_get_oauth_application`
Obtém uma aplicação OAuth no Bitbucket Data Center.

**Parâmetros:**
- `applicationId`: ID da aplicação OAuth

**Retorna:** Informações detalhadas da aplicação OAuth.

#### `mcp_bitbucket_auth_update_oauth_application`
Atualiza uma aplicação OAuth no Bitbucket Data Center.

**Parâmetros:**
- `applicationId`: ID da aplicação OAuth
- `name`: Novo nome da aplicação (opcional)
- `description`: Nova descrição (opcional)
- `url`: Nova URL (opcional)
- `callbackUrl`: Nova URL de callback (opcional)

**Retorna:** Aplicação OAuth atualizada.

#### `mcp_bitbucket_auth_delete_oauth_application`
Remove uma aplicação OAuth no Bitbucket Data Center.

**Parâmetros:**
- `applicationId`: ID da aplicação OAuth

**Retorna:** Confirmação de remoção da aplicação.

#### `mcp_bitbucket_auth_list_oauth_applications`
Lista todas as aplicações OAuth no Bitbucket Data Center.

**Retorna:** Lista de todas as aplicações OAuth.

### Sessões

#### `mcp_bitbucket_auth_get_current_session`
Obtém a sessão atual do usuário no Bitbucket Data Center.

**Retorna:** Informações da sessão atual do usuário.

#### `mcp_bitbucket_auth_create_session`
Cria uma nova sessão de usuário no Bitbucket Data Center.

**Parâmetros:**
- `userId`: ID do usuário

**Retorna:** Nova sessão criada com informações do usuário.

#### `mcp_bitbucket_auth_refresh_session`
Atualiza uma sessão de usuário no Bitbucket Data Center.

**Parâmetros:**
- `sessionId`: ID da sessão

**Retorna:** Sessão atualizada com novo tempo de vida.

#### `mcp_bitbucket_auth_revoke_session`
Revoga uma sessão de usuário no Bitbucket Data Center.

**Parâmetros:**
- `sessionId`: ID da sessão

**Retorna:** Confirmação de revogação da sessão.

#### `mcp_bitbucket_auth_list_active_sessions`
Lista sessões ativas de um usuário no Bitbucket Data Center.

**Parâmetros:**
- `userId`: ID do usuário

**Retorna:** Lista de todas as sessões ativas do usuário.

## 📁 Ferramentas de Repositório

### Gerenciamento de Repositórios

#### `mcp_bitbucket_repository_create`
Cria um novo repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `name`: Nome do repositório
- `description`: Descrição do repositório (opcional)
- `forkable`: Se pode ser forkado (opcional)
- `isPublic`: Se é público (opcional)

**Retorna:** Repositório criado com todas as informações.

#### `mcp_bitbucket_repository_get`
Obtém um repositório específico no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório

**Retorna:** Informações detalhadas do repositório.

#### `mcp_bitbucket_repository_update`
Atualiza um repositório existente no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `name`: Novo nome (opcional)
- `description`: Nova descrição (opcional)
- `forkable`: Nova configuração de fork (opcional)
- `isPublic`: Nova visibilidade (opcional)

**Retorna:** Repositório atualizado com novas informações.

#### `mcp_bitbucket_repository_delete`
Remove um repositório do Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório

**Retorna:** Confirmação de remoção do repositório.

#### `mcp_bitbucket_repository_list`
Lista todos os repositórios de um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `start`: Índice inicial (opcional)
- `limit`: Limite de resultados (opcional)
- `name`: Filtro por nome (opcional)
- `permission`: Filtro por permissão (opcional)

**Retorna:** Lista de repositórios com informações básicas.

### Permissões de Repositório

#### `mcp_bitbucket_repository_get_permissions`
Obtém permissões de um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório

**Retorna:** Lista de permissões do repositório.

#### `mcp_bitbucket_repository_add_permission`
Adiciona permissão a um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `user`: Nome do usuário (opcional)
- `group`: Nome do grupo (opcional)
- `permission`: Nível de permissão (padrão: `REPO_READ`)

**Retorna:** Confirmação de adição de permissão.

#### `mcp_bitbucket_repository_remove_permission`
Remove permissão de um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `user`: Nome do usuário (opcional)
- `group`: Nome do grupo (opcional)
- `permission`: Nível de permissão (padrão: `REPO_READ`)

**Retorna:** Confirmação de remoção de permissão.

### Branches e Tags

#### `mcp_bitbucket_repository_get_branches`
Obtém branches de um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `start`: Índice inicial (opcional)
- `limit`: Limite de resultados (opcional)

**Retorna:** Lista de branches do repositório.

#### `mcp_bitbucket_repository_create_branch`
Cria uma nova branch em um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `name`: Nome da branch
- `startPoint`: Ponto de partida (commit ou branch)
- `message`: Mensagem de commit (opcional)

**Retorna:** Branch criada com informações.

#### `mcp_bitbucket_repository_get_tags`
Obtém tags de um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `start`: Índice inicial (opcional)
- `limit`: Limite de resultados (opcional)

**Retorna:** Lista de tags do repositório.

#### `mcp_bitbucket_repository_create_tag`
Cria uma nova tag em um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `name`: Nome da tag
- `startPoint`: Ponto de partida (commit ou branch)
- `message`: Mensagem da tag (opcional)

**Retorna:** Tag criada com informações.

### Configurações de Repositório

#### `mcp_bitbucket_repository_get_settings`
Obtém configurações de um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório

**Retorna:** Configurações do repositório.

#### `mcp_bitbucket_repository_update_settings`
Atualiza configurações de um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `settings`: Objeto com as configurações

**Retorna:** Configurações atualizadas do repositório.

### Hooks de Repositório

#### `mcp_bitbucket_repository_get_hooks`
Obtém hooks de um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório

**Retorna:** Lista de hooks do repositório.

#### `mcp_bitbucket_repository_create_hook`
Cria um novo hook em um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `hook`: Objeto com as configurações do hook

**Retorna:** Hook criado com informações.

#### `mcp_bitbucket_repository_get_hook`
Obtém um hook específico de um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `hookId`: ID do hook

**Retorna:** Detalhes do hook.

#### `mcp_bitbucket_repository_update_hook`
Atualiza um hook de um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `hookId`: ID do hook
- `hook`: Objeto com as configurações atualizadas

**Retorna:** Hook atualizado com informações.

#### `mcp_bitbucket_repository_delete_hook`
Remove um hook de um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `hookId`: ID do hook

**Retorna:** Confirmação da remoção do hook.

### Forks

#### `mcp_bitbucket_repository_get_forks`
Obtém forks de um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório

**Retorna:** Lista de forks do repositório.

#### `mcp_bitbucket_repository_create_fork`
Cria um fork de um repositório no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `fork`: Objeto com as configurações do fork

**Retorna:** Fork criado com informações.

## 🔀 Ferramentas de Pull Request

O Bitbucket MCP Server implementa 18 ferramentas completas para gestão de pull requests, incluindo operações CRUD, comentários, análise de diffs e operações de merge/decline/reopen. Todas as ferramentas suportam tanto Bitbucket Data Center 7.16+ quanto Cloud.

### Gerenciamento de Pull Requests (CRUD)

#### `mcp_bitbucket_pull_request_create`
Cria um novo pull request no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Criação de pull requests
- Configuração de revisores
- Metadados do pull request

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `title`: Título do pull request
- `description`: Descrição do pull request (opcional)
- `source_branch`: Branch de origem
- `destination_branch`: Branch de destino
- `reviewers`: Lista de revisores (opcional)
- `closeSourceBranch`: Se deve fechar a branch de origem após merge (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do pull request criado.

**Exemplo:**
```typescript
const result = await mcp_bitbucket_pull_request_create({
  project_key: "PROJ",
  repo_slug: "meu-repositorio",
  title: "Nova feature",
  description: "Implementa nova funcionalidade",
  source_branch: "feature/nova-funcionalidade",
  destination_branch: "main",
  reviewers: ["usuario1", "usuario2"]
});
```

#### `mcp_bitbucket_pull_request_get`
Obtém um pull request específico no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Detalhes do pull request
- Metadados e configurações
- Informações de revisores

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do pull request.

#### `mcp_bitbucket_pull_request_update`
Atualiza um pull request existente no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Atualização de metadados
- Modificação de revisores
- Alteração de configurações

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request
- `updates`: Objeto com as atualizações a serem aplicadas

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do pull request atualizado.

#### `mcp_bitbucket_pull_request_delete`
Exclui um pull request no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Remoção de pull requests
- Limpeza de recursos
- Verificação de dependências

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da exclusão.

#### `mcp_bitbucket_pull_request_list`
Lista pull requests no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Listagem de pull requests
- Filtros e paginação
- Informações resumidas

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `state`: Estado do pull request (opcional)
- `start`: Índice de início para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de pull requests.

### Operações de Pull Request

#### `mcp_bitbucket_pull_request_merge`
Faz merge de um pull request no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Merge de pull requests
- Configuração de estratégias
- Fechamento de branches

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request
- `merge_strategy`: Estratégia de merge (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do merge.

#### `mcp_bitbucket_pull_request_decline`
Recusa um pull request no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Recusa de pull requests
- Configuração de motivos
- Notificações

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request
- `reason`: Motivo da recusa (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da recusa.

#### `mcp_bitbucket_pull_request_reopen`
Reabre um pull request no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Reabertura de pull request
- Restauração de estado
- Aplicação de mudanças

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `pullRequestId`: ID do pull request

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do pull request reaberto.

### Comentários de Pull Request

#### `mcp_bitbucket_pull_request_create_comment`
Cria um comentário em um pull request no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Criação de comentário
- Discussão de código
- Feedback de revisão

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `pullRequestId`: ID do pull request
- `text`: Texto do comentário
- `parent`: Comentário pai (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do comentário criado.

#### `mcp_bitbucket_pull_request_get_comment`
Obtém um comentário específico de um pull request no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Detalhes do comentário
- Informações de autor
- Histórico de edições

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `pullRequestId`: ID do pull request
- `commentId`: ID do comentário

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do comentário.

#### `mcp_bitbucket_pull_request_update_comment`
Atualiza um comentário de um pull request no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Atualização de comentário
- Edição de texto
- Aplicação de mudanças

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `pullRequestId`: ID do pull request
- `commentId`: ID do comentário
- `version`: Versão do comentário
- `text`: Novo texto do comentário

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do comentário atualizado.

#### `mcp_bitbucket_pull_request_delete_comment`
Remove um comentário de um pull request no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Remoção de comentário
- Limpeza de dados
- Confirmação de operação

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `pullRequestId`: ID do pull request
- `commentId`: ID do comentário

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resultado da operação.

### Análise e Atividade de Pull Request

#### `mcp_bitbucket_pull_request_get_activity`
Obtém a atividade de um pull request no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Histórico de atividades
- Log de eventos
- Rastreamento de mudanças

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `pullRequestId`: ID do pull request
- `start`: Índice inicial para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a atividade do pull request.

#### `mcp_bitbucket_pull_request_get_diff`
Obtém o diff de um pull request no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Diferenças de código
- Comparação de arquivos
- Visualização de mudanças

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request
- `context_lines`: Linhas de contexto (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o diff do pull request.

#### `mcp_bitbucket_pull_request_get_changes`
Obtém as mudanças de um pull request no Bitbucket Data Center ou Cloud.

**Funcionalidades:**
- Lista de arquivos alterados
- Estatísticas de mudanças
- Informações de commits

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request
- `start`: Índice inicial para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as mudanças do pull request.

### Características Técnicas das Ferramentas de Pull Request

- **Suporte Dual**: Todas as ferramentas funcionam com Bitbucket Data Center 7.16+ e Cloud
- **Validação Rigorosa**: Parâmetros validados com schemas Zod
- **Cache Inteligente**: Cache automático com TTL de 5 minutos para operações de leitura
- **Rate Limiting**: Proteção contra abuso com diferentes limites para operações leves e pesadas
- **Error Handling**: Tratamento robusto de erros com retry automático
- **Logs Estruturados**: Logs detalhados com sanitização de dados sensíveis
- **Performance**: Operações otimizadas para <2s de resposta em 95% dos casos

## 🎯 Ferramentas de Issues (Cloud)

O Bitbucket MCP Server implementa 15 ferramentas completas para gestão de issues no Bitbucket Cloud, incluindo operações CRUD, comentários, transições de estado, relacionamentos e anexos. Todas as ferramentas suportam apenas Bitbucket Cloud.

### Gerenciamento de Issues (CRUD)

#### `mcp_bitbucket_cloud_issues_list`
Lista issues de um repositório no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de issues com filtros
- Paginação e ordenação
- Filtros por estado, prioridade e tipo

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `state`: Estado das issues (opcional)
- `kind`: Tipo das issues (opcional)
- `priority`: Prioridade das issues (opcional)
- `assignee`: Usuário responsável (opcional)
- `reporter`: Usuário que reportou (opcional)
- `start`: Índice inicial para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Lista de issues com informações básicas.

#### `mcp_bitbucket_cloud_issues_create`
Cria uma nova issue no Bitbucket Cloud.

**Funcionalidades:**
- Criação de issues
- Configuração de metadados
- Validação de regras de negócio

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `title`: Título da issue
- `content`: Conteúdo da issue (opcional)
- `kind`: Tipo da issue (opcional)
- `priority`: Prioridade da issue (opcional)
- `assignee`: Usuário responsável (opcional)
- `component`: Componente (opcional)
- `milestone`: Milestone (opcional)
- `version`: Versão (opcional)

**Retorna:** Issue criada com informações completas.

#### `mcp_bitbucket_cloud_issues_get`
Obtém uma issue específica no Bitbucket Cloud.

**Funcionalidades:**
- Detalhes completos da issue
- Metadados e configurações
- Informações de relacionamentos

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue

**Retorna:** Detalhes completos da issue.

#### `mcp_bitbucket_cloud_issues_update`
Atualiza uma issue existente no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de metadados
- Modificação de campos
- Validação de transições

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue
- `title`: Novo título (opcional)
- `content`: Novo conteúdo (opcional)
- `kind`: Novo tipo (opcional)
- `priority`: Nova prioridade (opcional)
- `assignee`: Novo responsável (opcional)
- `component`: Novo componente (opcional)
- `milestone`: Novo milestone (opcional)
- `version`: Nova versão (opcional)

**Retorna:** Issue atualizada com novas informações.

#### `mcp_bitbucket_cloud_issues_delete`
Remove uma issue do Bitbucket Cloud.

**Funcionalidades:**
- Remoção de issues
- Limpeza de recursos
- Verificação de dependências

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue

**Retorna:** Confirmação da remoção da issue.

### Comentários de Issues

#### `mcp_bitbucket_cloud_issues_list_comments`
Lista comentários de uma issue no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de comentários
- Paginação e ordenação
- Informações de autores

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue
- `start`: Índice inicial para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Lista de comentários da issue.

#### `mcp_bitbucket_cloud_issues_create_comment`
Cria um comentário em uma issue no Bitbucket Cloud.

**Funcionalidades:**
- Criação de comentários
- Discussão de issues
- Feedback e colaboração

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue
- `content`: Conteúdo do comentário

**Retorna:** Comentário criado com informações.

#### `mcp_bitbucket_cloud_issues_update_comment`
Atualiza um comentário de uma issue no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de comentários
- Edição de conteúdo
- Histórico de mudanças

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue
- `comment_id`: ID do comentário
- `content`: Novo conteúdo do comentário

**Retorna:** Comentário atualizado.

#### `mcp_bitbucket_cloud_issues_delete_comment`
Remove um comentário de uma issue no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de comentários
- Limpeza de dados
- Confirmação de operação

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue
- `comment_id`: ID do comentário

**Retorna:** Confirmação da remoção do comentário.

### Transições de Estado

#### `mcp_bitbucket_cloud_issues_list_transitions`
Lista transições disponíveis para uma issue no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de transições
- Estados disponíveis
- Validação de regras

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue

**Retorna:** Lista de transições disponíveis.

#### `mcp_bitbucket_cloud_issues_transition`
Executa uma transição de estado em uma issue no Bitbucket Cloud.

**Funcionalidades:**
- Transição de estados
- Validação de regras de negócio
- Histórico de mudanças

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue
- `transition_id`: ID da transição
- `resolution`: Resolução (opcional)

**Retorna:** Issue com novo estado.

### Relacionamentos de Issues

#### `mcp_bitbucket_cloud_issues_list_relationships`
Lista relacionamentos de uma issue no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de relacionamentos
- Tipos de relacionamento
- Issues relacionadas

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue

**Retorna:** Lista de relacionamentos da issue.

#### `mcp_bitbucket_cloud_issues_create_relationship`
Cria um relacionamento entre issues no Bitbucket Cloud.

**Funcionalidades:**
- Criação de relacionamentos
- Tipos de relacionamento
- Validação de regras

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue
- `related_issue_id`: ID da issue relacionada
- `relationship_type`: Tipo do relacionamento

**Retorna:** Relacionamento criado.

#### `mcp_bitbucket_cloud_issues_delete_relationship`
Remove um relacionamento entre issues no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de relacionamentos
- Limpeza de dados
- Confirmação de operação

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue
- `relationship_id`: ID do relacionamento

**Retorna:** Confirmação da remoção do relacionamento.

### Anexos de Issues

#### `mcp_bitbucket_cloud_issues_list_attachments`
Lista anexos de uma issue no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de anexos
- Informações de arquivos
- Metadados de upload

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue

**Retorna:** Lista de anexos da issue.

#### `mcp_bitbucket_cloud_issues_upload_attachment`
Faz upload de um anexo para uma issue no Bitbucket Cloud.

**Funcionalidades:**
- Upload de anexos
- Validação de tipos
- Metadados de arquivo

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue
- `filename`: Nome do arquivo
- `content`: Conteúdo do arquivo (base64)

**Retorna:** Anexo criado com informações.

#### `mcp_bitbucket_cloud_issues_delete_attachment`
Remove um anexo de uma issue no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de anexos
- Limpeza de arquivos
- Confirmação de operação

**Parâmetros:**
- `workspace`: Workspace do Bitbucket
- `repo_slug`: Slug do repositório
- `issue_id`: ID da issue
- `attachment_id`: ID do anexo

**Retorna:** Confirmação da remoção do anexo.

### Características Técnicas das Ferramentas de Issues

- **Suporte Cloud**: Todas as ferramentas funcionam exclusivamente com Bitbucket Cloud
- **Validação Rigorosa**: Parâmetros validados com schemas Zod e regras de negócio
- **Cache Inteligente**: Cache automático com TTL de 5 minutos para operações de leitura
- **Rate Limiting**: Proteção contra abuso com diferentes limites para operações leves e pesadas
- **Error Handling**: Tratamento robusto de erros com retry automático
- **Logs Estruturados**: Logs detalhados com sanitização de dados sensíveis
- **Performance**: Operações otimizadas para <2s de resposta em 95% dos casos
- **Validação de Estado**: Validação automática de transições de estado e regras de negócio

## 📂 Ferramentas de Projeto

### Gerenciamento de Projetos

#### `mcp_bitbucket_project_create`
Cria um novo projeto no Bitbucket Data Center.

**Parâmetros:**
- `key`: Chave única do projeto
- `name`: Nome do projeto
- `description`: Descrição do projeto (opcional)
- `avatar`: Avatar do projeto (opcional)

**Retorna:** Projeto criado com detalhes.

#### `mcp_bitbucket_project_get`
Obtém um projeto específico no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto

**Retorna:** Informações detalhadas do projeto.

#### `mcp_bitbucket_project_update`
Atualiza um projeto existente no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `name`: Novo nome do projeto (opcional)
- `description`: Nova descrição (opcional)
- `avatar`: Novo avatar (opcional)

**Retorna:** Projeto atualizado.

#### `mcp_bitbucket_project_delete`
Remove um projeto do Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto

**Retorna:** Confirmação de remoção.

#### `mcp_bitbucket_project_list`
Lista todos os projetos no Bitbucket Data Center.

**Parâmetros:**
- `start`: Índice inicial (opcional)
- `limit`: Limite de resultados (opcional)
- `name`: Filtro por nome (opcional)
- `permission`: Filtro por permissão (opcional)

**Retorna:** Lista de projetos.

### Permissões de Projeto

#### `mcp_bitbucket_project_get_permissions`
Obtém permissões de um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto

**Retorna:** Lista de permissões.

#### `mcp_bitbucket_project_add_permission`
Adiciona permissão a um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `user`: Nome do usuário (opcional)
- `group`: Nome do grupo (opcional)
- `permission`: Nível de permissão (padrão: `PROJECT_READ`)

**Retorna:** Confirmação de adição.

#### `mcp_bitbucket_project_remove_permission`
Remove permissão de um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `user`: Nome do usuário (opcional)
- `group`: Nome do grupo (opcional)
- `permission`: Nível de permissão (padrão: `PROJECT_READ`)

**Retorna:** Confirmação de remoção.

### Avatar de Projeto

#### `mcp_bitbucket_project_get_avatar`
Obtém avatar de um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto

**Retorna:** Informações do avatar.

#### `mcp_bitbucket_project_upload_avatar`
Faz upload de avatar para um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `avatarData`: Dados do avatar (base64)

**Retorna:** Avatar atualizado.

#### `mcp_bitbucket_project_delete_avatar`
Remove avatar de um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto

**Retorna:** Confirmação de remoção.

### Hooks de Projeto

#### `mcp_bitbucket_project_get_hooks`
Obtém hooks de um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto

**Retorna:** Lista de hooks.

#### `mcp_bitbucket_project_create_hook`
Cria um hook para um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `name`: Nome do hook
- `url`: URL de callback
- `events`: Lista de eventos
- `active`: Status ativo (padrão: true)

**Retorna:** Hook criado.

#### `mcp_bitbucket_project_get_hook`
Obtém um hook específico de um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `hookId`: ID do hook

**Retorna:** Informações detalhadas do hook.

#### `mcp_bitbucket_project_update_hook`
Atualiza um hook de um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `hookId`: ID do hook
- `name`: Novo nome (opcional)
- `url`: Nova URL (opcional)
- `events`: Novos eventos (opcional)
- `active`: Novo status (opcional)

**Retorna:** Hook atualizado.

#### `mcp_bitbucket_project_delete_hook`
Remove um hook de um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `hookId`: ID do hook

**Retorna:** Confirmação de remoção.

### Configurações de Projeto

#### `mcp_bitbucket_project_get_settings`
Obtém configurações de um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto

**Retorna:** Configurações atuais.

#### `mcp_bitbucket_project_update_settings`
Atualiza configurações de um projeto no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `settings`: Configurações a serem atualizadas

**Retorna:** Configurações atualizadas.

## 🔍 Ferramentas de Busca

### Busca Geral

#### `mcp_bitbucket_search_repositories`
Busca repositórios no Bitbucket Data Center.

**Parâmetros:**
- `query`: Query de busca
- `projectKey`: Chave do projeto (opcional)
- `start`: Índice de início para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Resultados da busca de repositórios.

#### `mcp_bitbucket_search_commits`
Busca commits no Bitbucket Data Center.

**Parâmetros:**
- `query`: Query de busca
- `projectKey`: Chave do projeto (opcional)
- `repositorySlug`: Slug do repositório (opcional)
- `start`: Índice de início para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Resultados da busca de commits.

#### `mcp_bitbucket_search_pull_requests`
Busca pull requests no Bitbucket Data Center.

**Parâmetros:**
- `query`: Query de busca
- `projectKey`: Chave do projeto (opcional)
- `repositorySlug`: Slug do repositório (opcional)
- `start`: Índice de início para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Resultados da busca de pull requests.

#### `mcp_bitbucket_search_code`
Busca código no Bitbucket Data Center.

**Parâmetros:**
- `query`: Query de busca
- `projectKey`: Chave do projeto (opcional)
- `repositorySlug`: Slug do repositório (opcional)
- `start`: Índice de início para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Resultados da busca de código.

#### `mcp_bitbucket_search_users`
Busca usuários no Bitbucket Data Center.

**Parâmetros:**
- `query`: Query de busca
- `start`: Índice de início para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Resultados da busca de usuários.

### Sugestões e Configuração

#### `mcp_bitbucket_search_get_suggestions`
Obter sugestões de busca do Bitbucket Data Center.

**Parâmetros:**
- `query`: Query de busca para sugestões

**Retorna:** Sugestões de busca.

#### `mcp_bitbucket_search_get_configuration`
Obter configuração de busca do Bitbucket Data Center.

**Retorna:** Configuração de busca.

#### `mcp_bitbucket_search_update_configuration`
Update search configuration in Bitbucket Data Center.

**Parâmetros:**
- `configuration`: Search configuration to update

**Retorna:** Updated configuration.

### Índices de Busca

#### `mcp_bitbucket_search_get_indexes`
Get search indexes from Bitbucket Data Center.

**Retorna:** Search indexes.

#### `mcp_bitbucket_search_get_index`
Get specific search index from Bitbucket Data Center.

**Parâmetros:**
- `indexId`: Search index ID

**Retorna:** Search index details.

#### `mcp_bitbucket_search_rebuild_index`
Rebuild search index in Bitbucket Data Center.

**Parâmetros:**
- `indexId`: Search index ID to rebuild

**Retorna:** Rebuild result.

#### `mcp_bitbucket_search_stop_index`
Stop search index in Bitbucket Data Center.

**Parâmetros:**
- `indexId`: Search index ID to stop

**Retorna:** Stop result.

### Histórico de Busca

#### `mcp_bitbucket_search_get_history`
Get search history from Bitbucket Data Center.

**Retorna:** Search history.

#### `mcp_bitbucket_search_get_user_history`
Get user search history from Bitbucket Data Center.

**Parâmetros:**
- `userId`: User ID

**Retorna:** User search history.

#### `mcp_bitbucket_search_clear_history`
Clear search history in Bitbucket Data Center.

**Retorna:** Clear result.

#### `mcp_bitbucket_search_clear_user_history`
Clear user search history in Bitbucket Data Center.

**Parâmetros:**
- `userId`: User ID

**Retorna:** Clear result.

### Analytics de Busca

#### `mcp_bitbucket_search_get_analytics`
Get search analytics from Bitbucket Data Center.

**Retorna:** Search analytics.

#### `mcp_bitbucket_search_get_query_analytics`
Obter análise de query do Bitbucket Data Center.

**Parâmetros:**
- `query`: Query de busca

**Retorna:** Análise de query.

#### `mcp_bitbucket_search_get_statistics`
Obter estatísticas de busca do Bitbucket Data Center.

**Retorna:** Estatísticas de busca.

#### `mcp_bitbucket_search_get_statistics_for_range`
Obter estatísticas de busca por período do Bitbucket Data Center.

**Parâmetros:**
- `startDate`: Data de início (formato ISO)
- `endDate`: Data de fim (formato ISO)

**Retorna:** Estatísticas de busca por período.

#### `mcp_bitbucket_search_record_analytics`
Registrar análise de busca no Bitbucket Data Center.

**Parâmetros:**
- `analytics`: Dados de análise de busca para registrar

**Retorna:** Resultado do registro.

## 📊 Ferramentas de Dashboard

### Gerenciamento de Dashboards

#### `mcp_bitbucket_dashboard_create`
Cria um novo dashboard no Bitbucket Data Center.

**Parâmetros:**
- `name`: Nome do dashboard
- `description`: Descrição do dashboard (opcional)
- `is_public`: Se o dashboard é público (opcional)

**Retorna:** Dashboard criado com detalhes.

#### `mcp_bitbucket_dashboard_get`
Obtém um dashboard específico no Bitbucket Data Center.

**Parâmetros:**
- `dashboard_id`: ID do dashboard

**Retorna:** Detalhes do dashboard.

#### `mcp_bitbucket_dashboard_update`
Atualiza um dashboard existente no Bitbucket Data Center.

**Parâmetros:**
- `dashboard_id`: ID do dashboard
- `updates`: Objeto com as atualizações

**Retorna:** Dashboard atualizado com detalhes.

#### `mcp_bitbucket_dashboard_delete`
Exclui um dashboard no Bitbucket Data Center.

**Parâmetros:**
- `dashboard_id`: ID do dashboard

**Retorna:** Confirmação da exclusão.

#### `mcp_bitbucket_dashboard_list`
Lista dashboards no Bitbucket Data Center.

**Parâmetros:**
- `start`: Índice de início para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Lista de dashboards.

#### `mcp_bitbucket_dashboard_clone`
Clona um dashboard existente no Bitbucket Data Center.

**Parâmetros:**
- `dashboard_id`: ID do dashboard a ser clonado
- `new_name`: Nome do novo dashboard

**Retorna:** Dashboard clonado com detalhes.

### Widgets de Dashboard

#### `mcp_bitbucket_dashboard_add_widget`
Adiciona um widget a um dashboard no Bitbucket Data Center.

**Parâmetros:**
- `dashboard_id`: ID do dashboard
- `widget_type`: Tipo do widget
- `position`: Posição do widget (opcional)
- `config`: Configuração do widget (opcional)

**Retorna:** Widget adicionado com detalhes.

#### `mcp_bitbucket_dashboard_update_widget`
Atualiza um widget em um dashboard no Bitbucket Data Center.

**Parâmetros:**
- `dashboard_id`: ID do dashboard
- `widget_id`: ID do widget
- `updates`: Objeto com as atualizações

**Retorna:** Widget atualizado.

#### `mcp_bitbucket_dashboard_remove_widget`
Remove um widget de um dashboard no Bitbucket Data Center.

**Parâmetros:**
- `dashboard_id`: ID do dashboard
- `widget_id`: ID do widget

**Retorna:** Confirmação da remoção.

#### `mcp_bitbucket_dashboard_list_available_widgets`
Lista widgets disponíveis no Bitbucket Data Center.

**Retorna:** Lista de widgets disponíveis.

## 🔧 Ferramentas de Sistema

### Monitoramento e Saúde

#### `health_check`
Verifica a saúde e conectividade de um servidor Bitbucket.

**Parâmetros:**
- `url`: URL do servidor Bitbucket

**Retorna:** Status de saúde do servidor com informações detalhadas.

**Exemplo:**
```json
{
  "url": "https://bitbucket.company.com",
  "status": "healthy",
  "serverType": "datacenter",
  "version": "8.16.0",
  "isSupported": true,
  "fallbackUsed": false,
  "lastHealthCheck": "2024-01-27T10:30:00Z"
}
```

#### `server_info`
Obtém informações detalhadas sobre um servidor Bitbucket.

**Parâmetros:**
- `url`: URL do servidor Bitbucket

**Retorna:** Informações completas do servidor incluindo tipo, versão e capacidades.

**Exemplo:**
```json
{
  "serverType": "datacenter",
  "version": "8.16.0",
  "buildNumber": "816000",
  "baseUrl": "https://bitbucket.company.com",
  "isSupported": true,
  "fallbackUsed": false,
  "healthStatus": "healthy",
  "lastHealthCheck": "2024-01-27T10:30:00Z"
}
```

#### `system_health`
Obtém o status de saúde completo do sistema.

**Parâmetros:** Nenhum

**Retorna:** Status de saúde abrangente de todos os componentes do sistema.

**Exemplo:**
```json
{
  "overall": "healthy",
  "timestamp": "2024-01-27T10:30:00Z",
  "uptime": 3600000,
  "version": "1.0.0",
  "environment": "production",
  "checks": [
    {
      "name": "system",
      "status": "healthy",
      "message": "Memory usage: 45.2%",
      "responseTime": 12
    },
    {
      "name": "cache",
      "status": "healthy",
      "message": "Cache hit rate: 87.5%",
      "responseTime": 5
    }
  ],
  "summary": {
    "total": 6,
    "healthy": 6,
    "unhealthy": 0,
    "degraded": 0
  }
}
```

### Estatísticas e Métricas

#### `cache_stats`
Obtém estatísticas detalhadas do sistema de cache.

**Parâmetros:** Nenhum

**Retorna:** Estatísticas de performance do cache.

**Exemplo:**
```json
{
  "hits": 1250,
  "misses": 180,
  "sets": 200,
  "deletes": 15,
  "size": 1048576,
  "maxSize": 104857600,
  "hitRate": 87.41,
  "memoryUsage": 52428800,
  "entries": 150
}
```

#### `rate_limit_status`
Obtém status dos rate limiters e circuit breakers.

**Parâmetros:** Nenhum

**Retorna:** Status completo de rate limiting e circuit breakers.

**Exemplo:**
```json
{
  "rateLimiter": {
    "config": {
      "keyPrefix": "bitbucket-mcp:rate-limit:",
      "points": 100,
      "duration": 900
    },
    "limiters": ["global", "ip", "user", "api:heavy"]
  },
  "circuitBreaker": {
    "config": {
      "timeout": 10000,
      "errorThresholdPercentage": 50,
      "resetTimeout": 60000
    },
    "breakers": {
      "bitbucket-api": {
        "state": "closed",
        "stats": {
          "successes": 95,
          "failures": 2,
          "timeouts": 0
        }
      }
    }
  }
}
```

### Configuração e Diagnóstico

#### Logs Estruturados
O sistema gera logs estruturados com sanitização automática de dados sensíveis:

```json
{
  "timestamp": "2024-01-27T10:30:00.123Z",
  "level": "info",
  "message": "Request processed successfully",
  "type": "request",
  "method": "GET",
  "url": "/api/repositories",
  "statusCode": 200,
  "responseTime": 150,
  "requestId": "req_1706355000123_abc123def"
}
```

#### Rate Limiting
O sistema implementa rate limiting em múltiplas camadas:

- **Global**: 100 requisições por 15 minutos
- **Por IP**: 50 requisições por 15 minutos  
- **Por Usuário**: 100 requisições por 15 minutos
- **API Pesada**: 25 requisições por 15 minutos

#### Circuit Breakers
Circuit breakers protegem contra falhas em cascata:

- **Bitbucket API**: Timeout 10s, threshold 50%, reset 60s
- **Database**: Timeout 5s, threshold 30%, reset 30s
- **Cache**: Timeout 1s, threshold 40%, reset 15s

#### Cache Inteligente
Sistema de cache com TTL de 5 minutos e eviction LRU:

- **Memory Cache**: Cache em memória com limite de 100MB
- **Redis Cache**: Cache distribuído (opcional)
- **Partitioning**: Cache particionado por contexto
- **Pattern Invalidation**: Invalidação por padrões

#### Error Handling
Tratamento robusto de erros com retry automático:

- **Classificação Automática**: Erros classificados por tipo e severidade
- **Retry Inteligente**: Retry com backoff exponencial e jitter
- **Fallback**: Funções de fallback para circuit breakers
- **Contexto Rico**: Erros incluem contexto completo para debugging

## ❌ Códigos de Erro

### Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Proibido |
| 404 | Não encontrado |
| 409 | Conflito |
| 422 | Entidade não processável |
| 429 | Muitas requisições (Rate Limited) |
| 500 | Erro interno do servidor |
| 502 | Bad Gateway |
| 503 | Serviço indisponível |

### Códigos de Erro Específicos

| Código | Descrição |
|--------|-----------|
| `AUTH_REQUIRED` | Autenticação necessária |
| `AUTH_INVALID` | Credenciais inválidas |
| `AUTH_EXPIRED` | Token expirado |
| `PERMISSION_DENIED` | Permissão negada |
| `RESOURCE_NOT_FOUND` | Recurso não encontrado |
| `VALIDATION_ERROR` | Erro de validação |
| `RATE_LIMITED` | Rate limit excedido |
| `CIRCUIT_BREAKER_OPEN` | Circuit breaker aberto |
| `CACHE_ERROR` | Erro de cache |
| `NETWORK_ERROR` | Erro de rede |

## 💡 Exemplos de Uso

### Exemplo 1: Criar um Repositório

```typescript
const result = await mcp_bitbucket_repository_create({
  projectKey: "PROJ",
  name: "meu-repositorio",
  description: "Repositório de exemplo",
  isPublic: false
});
```

### Exemplo 2: Criar um Pull Request

```typescript
const result = await mcp_bitbucket_pull_request_create({
  project_key: "PROJ",
  repo_slug: "meu-repositorio",
  title: "Nova feature",
  description: "Implementa nova funcionalidade",
  source_branch: "feature/nova-funcionalidade",
  destination_branch: "main",
  reviewers: ["usuario1", "usuario2"]
});
```

### Exemplo 3: Buscar Repositórios

```typescript
const result = await mcp_bitbucket_search_repositories({
  query: "typescript",
  projectKey: "PROJ",
  limit: 10
});
```

### Exemplo 4: Criar uma Issue

```typescript
const result = await mcp_bitbucket_cloud_issues_create({
  workspace: "meu-workspace",
  repo_slug: "meu-repositorio",
  title: "Bug no sistema de login",
  content: "O sistema de login não está funcionando corretamente",
  kind: "bug",
  priority: "high",
  assignee: "usuario1"
});
```

### Exemplo 5: Listar Issues com Filtros

```typescript
const result = await mcp_bitbucket_cloud_issues_list({
  workspace: "meu-workspace",
  repo_slug: "meu-repositorio",
  state: "open",
  kind: "bug",
  priority: "high",
  limit: 20
});
```

### Exemplo 6: Adicionar Comentário a uma Issue

```typescript
const result = await mcp_bitbucket_cloud_issues_create_comment({
  workspace: "meu-workspace",
  repo_slug: "meu-repositorio",
  issue_id: "123",
  content: "Vou investigar este problema e retornar com uma solução."
});
```

### Exemplo 7: Fazer Transição de Estado

```typescript
const result = await mcp_bitbucket_cloud_issues_transition({
  workspace: "meu-workspace",
  repo_slug: "meu-repositorio",
  issue_id: "123",
  transition_id: "resolve",
  resolution: "fixed"
});
```

### Exemplo 8: Configurar OAuth

```typescript
const authUrl = await mcp_bitbucket_auth_get_oauth_authorization_url({
  responseType: "code",
  clientId: "seu_client_id",
  redirectUri: "http://localhost:3000/callback",
  scope: "repository:read repository:write"
});
```

### Exemplo 9: Monitorar Performance

```typescript
const metrics = await getMetrics();
const healthStatus = await getHealthStatus();

console.log('Métricas:', metrics);
console.log('Status de Saúde:', healthStatus);
```

## 🔧 Configuração Avançada

### Rate Limiting

```typescript
const rateLimiter = createRateLimiter('api', {
  windowMs: 60000, // 1 minuto
  maxRequests: 100 // 100 requisições por minuto
});
```

### Circuit Breaker

```typescript
const circuitBreaker = createCircuitBreaker('bitbucket-api', {
  threshold: 5, // 5 falhas
  timeout: 30000, // 30 segundos
  resetTimeout: 60000 // 1 minuto para reset
});
```

### Cache

```typescript
// Cache automático com TTL de 5 minutos
const result = await mcp_bitbucket_repository_get({
  projectKey: "PROJ",
  repositorySlug: "repo"
}); // Resultado será cacheado automaticamente
```

## 📚 Recursos Adicionais

- [Documentação do Bitbucket REST API](https://developer.atlassian.com/cloud/bitbucket/rest/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod Validation](https://zod.dev/)

## 🆘 Suporte

Para suporte e dúvidas:

- 📖 [Documentação](docs/)
- 🐛 [Issues](https://github.com/guercheLE/bitbucket-mcp-server/issues)
- 💬 [Discussões](https://github.com/guercheLE/bitbucket-mcp-server/discussions)
