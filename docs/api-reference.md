# Referência da API - Bitbucket MCP Server

Este documento descreve todas as ferramentas e endpoints disponíveis no Bitbucket MCP Server.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Ferramentas de Autenticação](#ferramentas-de-autenticação)
- [Ferramentas de Repositório](#ferramentas-de-repositório)
- [Ferramentas de Pull Request](#ferramentas-de-pull-request)
- [Ferramentas de Projeto](#ferramentas-de-projeto)
- [Ferramentas de Busca](#ferramentas-de-busca)
- [Ferramentas de Dashboard](#ferramentas-de-dashboard)
- [Códigos de Erro](#códigos-de-erro)
- [Exemplos de Uso](#exemplos-de-uso)

## 🌟 Visão Geral

O Bitbucket MCP Server implementa mais de 250 endpoints da API do Bitbucket, organizados em categorias funcionais. Todas as ferramentas seguem o padrão MCP e incluem validação rigorosa de entrada com Zod.

### Características

- **Detecção Automática**: Detecta automaticamente o tipo de servidor (Data Center vs Cloud)
- **Validação Rigorosa**: Todos os parâmetros são validados com schemas Zod
- **Cache Inteligente**: Cache automático com TTL configurável
- **Rate Limiting**: Proteção contra abuso com rate limiting
- **Circuit Breakers**: Resiliência com circuit breakers
- **Logs Estruturados**: Logs detalhados para debugging

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

### Gerenciamento de Pull Requests

#### `mcp_bitbucket_pull_request_create`
Cria um novo pull request no Bitbucket Data Center.

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `title`: Título do pull request
- `description`: Descrição do pull request (opcional)
- `source_branch`: Branch de origem
- `destination_branch`: Branch de destino
- `reviewers`: Lista de revisores (opcional)
- `closeSourceBranch`: Se deve fechar a branch de origem após merge (opcional)

**Retorna:** Pull request criado com detalhes.

#### `mcp_bitbucket_pull_request_get`
Obtém um pull request específico no Bitbucket Data Center.

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request

**Retorna:** Detalhes do pull request.

#### `mcp_bitbucket_pull_request_update`
Atualiza um pull request existente no Bitbucket Data Center.

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request
- `updates`: Objeto com as atualizações

**Retorna:** Pull request atualizado com detalhes.

#### `mcp_bitbucket_pull_request_delete`
Exclui um pull request no Bitbucket Data Center.

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request

**Retorna:** Confirmação da exclusão.

#### `mcp_bitbucket_pull_request_list`
Lista pull requests no Bitbucket Data Center.

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `state`: Estado do pull request (opcional)
- `start`: Índice de início para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Lista de pull requests.

### Operações de Pull Request

#### `mcp_bitbucket_pull_request_merge`
Faz merge de um pull request no Bitbucket Data Center.

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request
- `merge_strategy`: Estratégia de merge (opcional)

**Retorna:** Detalhes do merge.

#### `mcp_bitbucket_pull_request_decline`
Recusa um pull request no Bitbucket Data Center.

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request
- `reason`: Motivo da recusa (opcional)

**Retorna:** Detalhes da recusa.

#### `mcp_bitbucket_pull_request_reopen`
Reabre um pull request no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `pullRequestId`: ID do pull request

**Retorna:** Pull request reaberto com detalhes.

### Comentários de Pull Request

#### `mcp_bitbucket_pull_request_create_comment`
Cria um comentário em um pull request no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `pullRequestId`: ID do pull request
- `text`: Texto do comentário
- `parent`: Comentário pai (opcional)

**Retorna:** Comentário criado com detalhes.

#### `mcp_bitbucket_pull_request_get_comment`
Obtém um comentário específico de um pull request no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `pullRequestId`: ID do pull request
- `commentId`: ID do comentário

**Retorna:** Detalhes do comentário.

#### `mcp_bitbucket_pull_request_update_comment`
Atualiza um comentário de um pull request no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `pullRequestId`: ID do pull request
- `commentId`: ID do comentário
- `version`: Versão do comentário
- `text`: Novo texto do comentário

**Retorna:** Comentário atualizado com detalhes.

#### `mcp_bitbucket_pull_request_delete_comment`
Remove um comentário de um pull request no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `pullRequestId`: ID do pull request
- `commentId`: ID do comentário

**Retorna:** Resultado da operação.

### Atividade e Diferenças

#### `mcp_bitbucket_pull_request_get_activity`
Obtém a atividade de um pull request no Bitbucket Data Center.

**Parâmetros:**
- `projectKey`: Chave do projeto
- `repositorySlug`: Slug do repositório
- `pullRequestId`: ID do pull request
- `start`: Índice inicial para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Atividade do pull request.

#### `mcp_bitbucket_pull_request_get_diff`
Obtém o diff de um pull request no Bitbucket Data Center.

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request
- `context_lines`: Linhas de contexto (opcional)

**Retorna:** Diff do pull request.

#### `mcp_bitbucket_pull_request_get_changes`
Obtém as mudanças de um pull request no Bitbucket Data Center.

**Parâmetros:**
- `project_key`: Chave do projeto
- `repo_slug`: Slug do repositório
- `pull_request_id`: ID do pull request
- `start`: Índice inicial para paginação (opcional)
- `limit`: Número máximo de resultados (opcional)

**Retorna:** Mudanças do pull request.

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

### Exemplo 4: Configurar OAuth

```typescript
const authUrl = await mcp_bitbucket_auth_get_oauth_authorization_url({
  responseType: "code",
  clientId: "seu_client_id",
  redirectUri: "http://localhost:3000/callback",
  scope: "repository:read repository:write"
});
```

### Exemplo 5: Monitorar Performance

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
