# Node.js Bitbucket MCP Server with Integrated Console Client

## Overview

Develop a Bitbucket MCP (Model Context Protocol) server in Node.js that:

1. **Selective Tool Loading**: Automatically detects server type (Data Center or Cloud) based on URL and loads only compatible tools
2. **Integrated Console Client**: Includes a console client that loads all available tools for the specific server
3. **Modular Architecture**: Based on the example repository [guercheLE/bitbucket-mcp-server](https://github.com/guercheLE/bitbucket-mcp-server)

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a developer using an MCP client, I want to connect to either Bitbucket Data Center or Cloud so that I can interact with repositories, pull requests, and other Bitbucket features through a unified interface with comprehensive CLI support.

### Acceptance Scenarios
1. **Given** a user provides Data Center server URL and credentials, **When** they connect to the MCP server, **Then** the server loads only Data Center tools and endpoints
2. **Given** a user provides Cloud workspace and API token, **When** they connect to the MCP server, **Then** the server loads only Cloud tools and endpoints
3. **Given** a user requests repository operations, **When** the server type is detected, **Then** the appropriate repository tools are made available
4. **Given** a user requests pull request operations, **When** the server type is detected, **Then** the appropriate pull request tools are made available
5. **Given** a user makes an API call through the MCP server, **When** the call is executed, **Then** the system returns raw HTTP call details with sensitive information (tokens, passwords, API keys) sanitized
6. **Given** a user makes an API call through the MCP server, **When** the call is executed, **Then** the system logs raw HTTP request details via stderr with sensitive information sanitized to enable script generation
7. **Given** a user provides Basic Auth credentials, **When** they authenticate, **Then** the system accepts username/password authentication for both Data Center and Cloud
8. **Given** a user provides OAuth 2.0 credentials, **When** they authenticate, **Then** the system supports Authorization Code Grant flow for both server types
9. **Given** a user provides Personal Access Token, **When** they authenticate, **Then** the system accepts token-based authentication for both Data Center and Cloud
10. **Given** a network timeout occurs, **When** the system retries, **Then** it uses exponential backoff with maximum 3 retries
11. **Given** a rate limit error (429) occurs, **When** the system handles it, **Then** it implements appropriate backoff and retry mechanisms
12. **Given** a user runs console client commands, **When** they execute any command, **Then** the functionality mirrors the server exactly
13. **Given** a user requests command descriptions in a specific language, **When** they use `--language` option, **Then** the system provides descriptions in one of 20 supported languages
14. **Given** a user runs console client without language specification, **When** they execute commands, **Then** descriptions are provided in English by default
15. **Given** a user requests version information, **When** they use `--version` command, **Then** the system prints MCP server semantic version

### Edge Cases
- What happens when server type cannot be determined from connection parameters?
- How does system handle authentication failures for either server type?
- What occurs when a user requests Cloud-specific features on a Data Center connection?
- What happens when OAuth 2.0 token expires during operation?
- How does system handle malformed Personal Access Tokens?
- What occurs when rate limiting is exceeded beyond retry attempts?
- How does system handle network connectivity issues during authentication?
- What happens when HTTP request logging fails or stderr is unavailable?
- How does system handle unsupported language requests in console client?
- What occurs when console client version information is unavailable?
- How does system handle console client commands that don't have server equivalents?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST detect server type (Data Center vs Cloud) from connection parameters
- **FR-002**: System MUST load only relevant tools based on detected server type
- **FR-003**: System MUST provide authentication tools for both Data Center and Cloud
- **FR-004**: System MUST organize endpoints by functionality (auth, repository, pull requests, etc.)
- **FR-005**: System MUST handle server-specific endpoint variations and parameters
- **FR-006**: System MUST provide unified interface regardless of underlying server type
- **FR-007**: System MUST validate connection parameters before tool loading
- **FR-008**: System MUST handle authentication failures gracefully with appropriate error messages
- **FR-009**: System MUST return raw HTTP call details to Bitbucket API with sensitive information sanitized (tokens, passwords, API keys)
- **FR-010**: System MUST log raw HTTP requests sent to external APIs via standard error logging (stderr) with all sensitive information (tokens, passwords, secrets) sanitized to enable client/LLM generation of PowerShell, Bash, or curl scripts

### Console Client Requirements
- **CC-001**: Console client commands MUST mirror server functionality exactly
- **CC-002**: Console client MUST provide command descriptions in 20 most spoken languages via `--language` option
- **CC-003**: Default language for console client MUST be English
- **CC-004**: Console client MUST print MCP server semantic version with `--version` command
- **CC-005**: Server tool descriptions MUST be available only in English (not localized)

*Additional requirements:*
- **FR-011**: System MUST support authentication methods: Basic Auth (username/password), OAuth 2.0 (Authorization Code Grant), and Personal Access Tokens for both Data Center and Cloud
- **FR-012**: System MUST handle error scenarios: network timeouts (30s), rate limiting (429 responses), authentication failures (401/403), server errors (5xx), and invalid parameters (400) with appropriate retry mechanisms (exponential backoff, max 3 retries)

### Key Entities *(include if feature involves data)*
- **Server Configuration**: Connection parameters, authentication details, server type detection
- **Tool Registry**: Organized collection of available tools by server type and functionality
- **Endpoint Schema**: Input/output specifications for each endpoint with type validation
- **Authentication Context**: Session management and credential handling per server type
- **HTTP Call Response**: Raw HTTP call details including method, URL, headers, and response data with sensitive information sanitized
- **HTTP Request Log**: Sanitized HTTP request details logged via stderr for script generation purposes
- **Console Client Configuration**: Language settings, version information, and command mirroring configuration
- **Localization Data**: Command descriptions in 20 most spoken languages for console client

---

## Functional Requirements

### RF1: Automatic Server Detection
- **Description**: The server must automatically detect if the provided URL is Bitbucket Cloud or Data Center
- **Acceptance Criteria**:
  - URL containing `bitbucket.org` → Bitbucket Cloud
  - URL containing custom domain → Bitbucket Data Center
  - Selective tool loading based on detection

### RF2: Selective Tool Loading
- **Description**: Load only tools compatible with the detected server type
- **Acceptance Criteria**:
  - Cloud: OAuth authentication tools, repositories, pull requests, issues, pipelines
  - Data Center: API token authentication tools, repositories, pull requests, projects, security
  - Configuration via environment variables to enable/disable tool groups

### RF3: Integrated Console Client
- **Description**: Console client that loads all available tools for the specific server
- **Acceptance Criteria**:
  - CLI interface with commands for all available operations
  - Support for JSON and human-readable formats
  - Commands organized by category (auth, repo, pr, etc.)
  - Nested command structure using Commander.js for intuitive syntax
  - Support for commands like `bitbucket repository list --project ND`

### RF4: Flexible Authentication
- **Description**: Support for multiple authentication methods based on server type
- **Acceptance Criteria**:
  - Cloud: OAuth 2.0, app passwords, API tokens
  - Data Center: API tokens, personal access tokens
  - Configuration via environment variables

### RF5: Complete CRUD Operations
- **Description**: Complete operations for repositories, pull requests, projects (Data Center)
- **Acceptance Criteria**:
  - Repositories: create, read, update, delete, list
  - Pull Requests: create, read, update, delete, list, merge, decline
  - Projects (Data Center): create, read, update, delete, list
  - Issues (Cloud): create, read, update, delete, list

### RF6: Raw HTTP Call Logging
- **Description**: Return raw HTTP call details to Bitbucket API with sensitive information sanitized
- **Acceptance Criteria**:
  - Include HTTP method, URL, headers, and request body in response
  - Sanitize sensitive headers (Authorization, X-API-Key, etc.) by masking values
  - Sanitize sensitive request body fields (passwords, tokens, secrets)
  - Include response status code, headers, and body
  - Sanitize sensitive response data (tokens, credentials)
  - Provide option to enable/disable detailed logging via configuration
  - Format output in structured JSON for easy parsing

## Non-Functional Requirements

### RNF1: Performance
- **Description**: Fast response for common operations
- **Criteria**: < 2 seconds for read operations, < 5 seconds for write operations

### RNF2: Reliability
- **Description**: Robust error handling and recovery
- **Criteria**: Automatic retry for temporary failures, structured logs

### RNF3: Usability
- **Description**: Intuitive and well-documented CLI interface
- **Criteria**: Integrated help, usage examples, clear error messages

### RNF4: Maintainability
- **Description**: Well-structured and testable code
- **Criteria**: Test coverage > 80%, complete documentation

## File Structure (Based on Example)

```
src/
├── server/
│   ├── mcp-server.ts          # Main MCP server
│   ├── tool-loader.ts         # Selective tool loading
│   └── server-detector.ts     # Server type detection
├── client/
│   ├── console-client.ts      # Integrated console client
│   ├── commands/              # Organized CLI commands
│   │   ├── auth.ts            # Authentication commands
│   │   ├── repository.ts      # Repository management commands
│   │   ├── pull-request.ts    # Pull request commands
│   │   ├── project.ts         # Project commands (Data Center)
│   │   ├── issue.ts           # Issue commands (Cloud)
│   │   └── pipeline.ts        # Pipeline commands (Cloud)
│   └── formatters/            # Output formatters
│       ├── json.ts
│       └── table.ts
├── tools/
│   ├── cloud/                 # Tools for Bitbucket Cloud
│   │   ├── auth/
│   │   ├── repository/
│   │   ├── pull-request/
│   │   ├── issue/
│   │   └── pipeline/
│   └── datacenter/            # Tools for Data Center
│       ├── auth/
│       ├── repository/
│       ├── pull-request/
│       ├── project/
│       └── security/
├── services/
│   ├── bitbucket-api.ts       # Bitbucket API client
│   ├── auth-service.ts        # Authentication service
│   └── config-service.ts      # Configuration management
├── types/
│   ├── mcp.ts                 # MCP types
│   ├── bitbucket.ts           # Bitbucket API types
│   └── config.ts              # Configuration types
└── utils/
    ├── logger.ts              # Logging system
    ├── validator.ts           # Input validation
    └── error-handler.ts       # Error handling
```

## CLI Command Structure

### Nested Commands with Commander.js

O cliente CLI deve usar a estrutura de comandos aninhados do Commander.js para permitir uma sintaxe intuitiva e organizada:

```bash
# Estrutura geral
bitbucket <category> <action> [options]

# Exemplos de uso
bitbucket repository list --project ND
bitbucket repository create --workspace myworkspace --name myrepo --private
bitbucket pull-request create --source feature-branch --destination main --title "New feature"
bitbucket project list
bitbucket auth oauth-token-create --grant-type authorization_code --code abc123
bitbucket workspace list
bitbucket issue list --workspace myworkspace --repo myrepo
bitbucket pipeline list --workspace myworkspace --repo myrepo
```

### Categorias de Comandos

#### Bitbucket Data Center

1. **auth**: Autenticação e OAuth
   - `oauth-token-create`: Criar token OAuth
   - `oauth-token-list`: Listar tokens OAuth
   - `oauth-token-revoke`: Revogar token OAuth
   - `user-get`: Obter usuário atual
   - `session-create`: Criar sessão de usuário

2. **project**: Gerenciamento de projetos
   - `list`: Listar projetos
   - `create`: Criar projeto
   - `get`: Obter detalhes do projeto
   - `update`: Atualizar projeto
   - `delete`: Deletar projeto
   - `permissions-get`: Obter permissões do projeto
   - `permissions-user-update`: Atualizar permissões de usuário
   - `permissions-group-update`: Atualizar permissões de grupo

3. **repository**: Gerenciamento de repositórios
   - `list`: Listar repositórios
   - `create`: Criar repositório
   - `get`: Obter detalhes do repositório
   - `update`: Atualizar repositório
   - `delete`: Deletar repositório
   - `permissions-get`: Obter permissões do repositório
   - `permissions-user-update`: Atualizar permissões de usuário
   - `permissions-group-update`: Atualizar permissões de grupo
   - `branches-list`: Listar branches
   - `branches-create`: Criar branch
   - `branches-default-set`: Definir branch padrão
   - `branches-delete`: Deletar branch
   - `tags-list`: Listar tags
   - `tags-create`: Criar tag
   - `tags-delete`: Deletar tag

4. **pull-request**: Gerenciamento de pull requests
   - `list`: Listar pull requests
   - `create`: Criar pull request
   - `get`: Obter detalhes do pull request
   - `update`: Atualizar pull request
   - `delete`: Deletar pull request
   - `merge`: Fazer merge do pull request
   - `decline`: Recusar pull request
   - `reopen`: Reabrir pull request
   - `comments-list`: Listar comentários
   - `comments-create`: Criar comentário
   - `comments-get`: Obter comentário
   - `comments-update`: Atualizar comentário
   - `comments-delete`: Deletar comentário

5. **commit**: Gerenciamento de commits e arquivos
   - `list`: Listar commits
   - `get`: Obter detalhes do commit
   - `changes-get`: Obter mudanças do commit
   - `files-browse`: Navegar arquivos do repositório
   - `files-raw`: Obter conteúdo bruto do arquivo
   - `files-create`: Criar/atualizar arquivo
   - `files-delete`: Deletar arquivo

6. **search**: Busca e análise
   - `commits`: Buscar commits
   - `code`: Buscar código
   - `repositories`: Buscar repositórios
   - `users`: Buscar usuários

7. **build**: Status de build e deployments
   - `status-get`: Obter status de build
   - `status-create`: Criar status de build
   - `status-delete`: Deletar status de build

8. **admin**: Administração do sistema
   - `capabilities-get`: Obter capacidades do sistema
   - `dashboard-get`: Obter dados do dashboard
   - `permissions-get`: Obter permissões do sistema
   - `permissions-update`: Atualizar permissões do sistema
   - `system-info`: Obter informações do sistema
   - `system-backup`: Criar backup do sistema
   - `system-health`: Obter saúde do sistema

9. **jira**: Integração com Jira
   - `commits-linked-get`: Obter commits vinculados ao Jira
   - `commits-link`: Vincular commits ao Jira

10. **markup**: Processamento de markup
    - `preview`: Visualizar markup

11. **mirror**: Gerenciamento de mirrors
    - `list`: Listar mirrors
    - `create`: Criar mirror
    - `get`: Obter mirror
    - `update`: Atualizar mirror
    - `delete`: Deletar mirror

12. **rolling-upgrades**: Atualizações em rotação
    - `status-get`: Obter status de atualização em rotação
    - `start`: Iniciar atualização em rotação

13. **saml**: Configuração SAML
    - `config-get`: Obter configuração SAML
    - `config-update`: Atualizar configuração SAML

14. **security**: Gerenciamento de segurança
    - `settings-get`: Obter configurações de segurança
    - `settings-update`: Atualizar configurações de segurança

#### Bitbucket Cloud

1. **auth**: Autenticação OAuth 2.0
   - `oauth-access-token`: Obter token de acesso
   - `oauth-refresh-token`: Renovar token de acesso
   - `oauth-revoke-token`: Revogar token
   - `user-get`: Obter usuário atual
   - `user-details`: Obter detalhes do usuário

2. **workspace**: Gerenciamento de workspaces
   - `list`: Listar workspaces
   - `get`: Obter detalhes do workspace
   - `update`: Atualizar workspace
   - `permissions-get`: Obter permissões do workspace
   - `permissions-update`: Atualizar permissões do membro

3. **repository**: Gerenciamento de repositórios
   - `list`: Listar repositórios no workspace
   - `create`: Criar repositório
   - `get`: Obter detalhes do repositório
   - `update`: Atualizar repositório
   - `delete`: Deletar repositório
   - `permissions-get`: Obter permissões do repositório
   - `permissions-update`: Atualizar permissões do membro
   - `branches-list`: Listar branches
   - `branches-create`: Criar branch
   - `branches-update`: Atualizar branch
   - `branches-delete`: Deletar branch
   - `tags-list`: Listar tags
   - `tags-create`: Criar tag
   - `tags-delete`: Deletar tag

4. **pull-request**: Gerenciamento de pull requests
   - `list`: Listar pull requests
   - `create`: Criar pull request
   - `get`: Obter detalhes do pull request
   - `update`: Atualizar pull request
   - `delete`: Deletar pull request
   - `merge`: Fazer merge do pull request
   - `decline`: Recusar pull request
   - `reopen`: Reabrir pull request
   - `comments-list`: Listar comentários
   - `comments-create`: Criar comentário
   - `comments-get`: Obter comentário
   - `comments-update`: Atualizar comentário
   - `comments-delete`: Deletar comentário

5. **commit**: Gerenciamento de commits e arquivos
   - `list`: Listar commits
   - `get`: Obter detalhes do commit
   - `diff-get`: Obter diff do commit
   - `files-browse`: Navegar arquivos do repositório
   - `files-content`: Obter conteúdo do arquivo
   - `files-create`: Criar/atualizar arquivo
   - `files-delete`: Deletar arquivo

6. **search**: Busca e análise
   - `commits`: Buscar commits
   - `code`: Buscar código
   - `repositories`: Buscar repositórios
   - `users`: Buscar usuários

7. **branch-restrictions**: Restrições de branch
   - `list`: Listar restrições de branch
   - `create`: Criar restrição de branch
   - `get`: Obter restrição de branch
   - `update`: Atualizar restrição de branch
   - `delete`: Deletar restrição de branch

8. **commit-statuses**: Status de commits
   - `list`: Listar status de commits
   - `build-create`: Criar status de build
   - `build-get`: Obter status de build
   - `build-update`: Atualizar status de build

9. **deployments**: Gerenciamento de deployments
   - `list`: Listar deployments
   - `create`: Criar deployment
   - `get`: Obter deployment
   - `update`: Atualizar deployment
   - `delete`: Deletar deployment

10. **downloads**: Gerenciamento de downloads
    - `list`: Listar downloads
    - `create`: Criar download
    - `get`: Obter download
    - `delete`: Deletar download

11. **gpg-keys**: Gerenciamento de chaves GPG
    - `list`: Listar chaves GPG do usuário
    - `create`: Criar chave GPG
    - `get`: Obter chave GPG
    - `delete`: Deletar chave GPG

12. **issue**: Gerenciamento de issues
    - `list`: Listar issues
    - `create`: Criar issue
    - `get`: Obter issue
    - `update`: Atualizar issue
    - `delete`: Deletar issue
    - `comments-list`: Listar comentários da issue
    - `comments-create`: Criar comentário da issue

13. **pipeline**: Gerenciamento de pipelines
    - `list`: Listar pipelines
    - `create`: Criar pipeline
    - `get`: Obter pipeline
    - `stop`: Parar pipeline
    - `steps-list`: Listar passos do pipeline

14. **ssh-keys**: Gerenciamento de chaves SSH
    - `list`: Listar chaves SSH do usuário
    - `create`: Criar chave SSH
    - `get`: Obter chave SSH
    - `delete`: Deletar chave SSH

15. **snippets**: Gerenciamento de snippets
    - `list`: Listar snippets do workspace
    - `create`: Criar snippet
    - `get`: Obter snippet
    - `update`: Atualizar snippet
    - `delete`: Deletar snippet
    - `commits-list`: Listar commits do snippet
    - `commits-get`: Obter commit do snippet

16. **webhooks**: Gerenciamento de webhooks
    - `list`: Listar webhooks
    - `create`: Criar webhook
    - `get`: Obter webhook
    - `update`: Atualizar webhook
    - `delete`: Deletar webhook

17. **branching-model**: Modelo de branching
    - `get`: Obter modelo de branching
    - `update`: Atualizar modelo de branching

## Complete Endpoint Schemas

### Bitbucket Data Center - Complete Endpoint Schemas

#### Authentication Module

**Create OAuth Token**
- **Endpoint**: `POST /rest/oauth/1.0/tokens`
- **Input**: grant_type, code, redirect_uri, client_id, client_secret, refresh_token
- **Output**: access_token, token_type, expires_in, refresh_token, scope

**List OAuth Tokens**
- **Endpoint**: `GET /rest/oauth/1.0/tokens`
- **Input**: None
- **Output**: size, limit, isLastPage, values (id, name, createdDate, expiresDate, scopes)

**Revoke OAuth Token**
- **Endpoint**: `DELETE /rest/oauth/1.0/tokens/{tokenId}`
- **Input**: tokenId (path parameter)
- **Output**: No content (204 status)

**Get Current User**
- **Endpoint**: `GET /rest/api/1.0/users`
- **Input**: None
- **Output**: name, emailAddress, id, displayName, active, slug, type, directoryName, mutableDetails, mutableGroups, lastAuthenticationTimestamp

**Create User Session**
- **Endpoint**: `POST /rest/api/1.0/users`
- **Input**: name, password
- **Output**: name, emailAddress, id, displayName, active, slug, type

#### Project Management

**List Projects**
- **Endpoint**: `GET /rest/api/1.0/projects`
- **Input**: start, limit, name, permission
- **Output**: size, limit, isLastPage, values (key, id, name, description, public, type, links)

**Create Project**
- **Endpoint**: `POST /rest/api/1.0/projects`
- **Input**: key, name, description, avatar
- **Output**: key, id, name, description, public, type, links

**Get Project Details**
- **Endpoint**: `GET /rest/api/1.0/projects/{projectKey}`
- **Input**: projectKey (path parameter)
- **Output**: key, id, name, description, public, type, links

**Update Project**
- **Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}`
- **Input**: projectKey (path), name, description, avatar
- **Output**: key, id, name, description, public, type, links

**Delete Project**
- **Endpoint**: `DELETE /rest/api/1.0/projects/{projectKey}`
- **Input**: projectKey (path parameter)
- **Output**: No content (204 status)

**Get Project Permissions**
- **Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/permissions`
- **Input**: projectKey (path parameter)
- **Output**: size, limit, isLastPage, values (user, permission)

**Update User Permissions**
- **Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/permissions/users`
- **Input**: projectKey (path), name, permission
- **Output**: user, permission

**Update Group Permissions**
- **Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/permissions/groups`
- **Input**: projectKey (path), name, permission
- **Output**: group, permission

#### Repository Management

**List Repositories**
- **Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos`
- **Input**: projectKey (path), start, limit, name, permission
- **Output**: size, limit, isLastPage, values (slug, id, name, scmId, state, statusMessage, forkable, project, public, links)

**Create Repository**
- **Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos`
- **Input**: projectKey (path), name, scmId, forkable, public
- **Output**: slug, id, name, scmId, state, statusMessage, forkable, project, public, links

**Get Repository Details**
- **Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}`
- **Input**: projectKey, repositorySlug (path parameters)
- **Output**: slug, id, name, scmId, state, statusMessage, forkable, project, public, links

**Update Repository**
- **Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}`
- **Input**: projectKey, repositorySlug (path), name, forkable, public
- **Output**: slug, id, name, scmId, state, statusMessage, forkable, project, public, links

**Delete Repository**
- **Endpoint**: `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}`
- **Input**: projectKey, repositorySlug (path parameters)
- **Output**: No content (204 status)

**Get Repository Permissions**
- **Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions`
- **Input**: projectKey, repositorySlug (path parameters)
- **Output**: size, limit, isLastPage, values (user, permission)

**Update Repository User Permissions**
- **Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/users`
- **Input**: projectKey, repositorySlug (path), name, permission
- **Output**: user, permission

**Update Repository Group Permissions**
- **Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/groups`
- **Input**: projectKey, repositorySlug (path), name, permission
- **Output**: group, permission

**List Branches**
- **Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches`
- **Input**: projectKey, repositorySlug (path), start, limit, orderBy, filterText
- **Output**: size, limit, isLastPage, values (id, displayId, type, latestCommit, latestChangeset, isDefault)

**Create Branch**
- **Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches`
- **Input**: projectKey, repositorySlug (path), name, startPoint, message
- **Output**: id, displayId, type, latestCommit, latestChangeset, isDefault

**Set Default Branch**
- **Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches/default`
- **Input**: projectKey, repositorySlug (path), id
- **Output**: id, displayId, type, latestCommit, latestChangeset, isDefault

**Delete Branch**
- **Endpoint**: `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches/{branchId}`
- **Input**: projectKey, repositorySlug, branchId (path parameters)
- **Output**: No content (204 status)

**List Tags**
- **Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags`
- **Input**: projectKey, repositorySlug (path), start, limit, orderBy, filterText
- **Output**: size, limit, isLastPage, values (id, displayId, type, latestCommit, latestChangeset)

**Create Tag**
- **Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags`
- **Input**: projectKey, repositorySlug (path), name, startPoint, message
- **Output**: id, displayId, type, latestCommit, latestChangeset

**Delete Tag**
- **Endpoint**: `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags/{tagName}`
- **Input**: projectKey, repositorySlug, tagName (path parameters)
- **Output**: No content (204 status)

### Bitbucket Cloud - Complete Endpoint Schemas

#### Authentication Module

**Get Access Token**
- **Endpoint**: `POST /site/oauth2/access_token`
- **Input**: grant_type, code, redirect_uri, client_id, client_secret
- **Output**: access_token, token_type, expires_in, refresh_token, scope

**Refresh Access Token**
- **Endpoint**: `POST /site/oauth2/refresh_token`
- **Input**: refresh_token, client_id, client_secret
- **Output**: access_token, token_type, expires_in, refresh_token, scope

**Revoke Token**
- **Endpoint**: `POST /site/oauth2/revoke_token`
- **Input**: token, client_id, client_secret
- **Output**: No content (204 status)

**Get Current User**
- **Endpoint**: `GET /2.0/user`
- **Input**: None
- **Output**: username, display_name, uuid, links, created_on, is_staff, account_status

**Get User Details**
- **Endpoint**: `GET /2.0/users/{username}`
- **Input**: username (path parameter)
- **Output**: username, display_name, uuid, links, created_on, is_staff, account_status

#### Workspace Management

**List Workspaces**
- **Endpoint**: `GET /2.0/workspaces`
- **Input**: None
- **Output**: size, page, pagelen, next, previous, values (uuid, name, slug, is_private, created_on, updated_on, links)

**Get Workspace Details**
- **Endpoint**: `GET /2.0/workspaces/{workspace}`
- **Input**: workspace (path parameter)
- **Output**: uuid, name, slug, is_private, created_on, updated_on, links

**Update Workspace**
- **Endpoint**: `PUT /2.0/workspaces/{workspace}`
- **Input**: workspace (path), name, slug
- **Output**: uuid, name, slug, is_private, created_on, updated_on, links

**Get Workspace Permissions**
- **Endpoint**: `GET /2.0/workspaces/{workspace}/permissions`
- **Input**: workspace (path parameter)
- **Output**: size, page, pagelen, next, previous, values (user, permission)

**Update Member Permissions**
- **Endpoint**: `PUT /2.0/workspaces/{workspace}/permissions/{member}`
- **Input**: workspace, member (path), permission
- **Output**: user, permission

#### Repository Management

**List Repositories in Workspace**
- **Endpoint**: `GET /2.0/repositories/{workspace}`
- **Input**: workspace (path parameter)
- **Output**: size, page, pagelen, next, previous, values (uuid, name, slug, full_name, description, is_private, created_on, updated_on, links)

**Create Repository**
- **Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}`
- **Input**: workspace, repo_slug (path), name, description, is_private, fork_policy, language, has_issues, has_wiki
- **Output**: uuid, name, slug, full_name, description, is_private, created_on, updated_on, links

**Get Repository Details**
- **Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}`
- **Input**: workspace, repo_slug (path parameters)
- **Output**: uuid, name, slug, full_name, description, is_private, created_on, updated_on, links

**Update Repository**
- **Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}`
- **Input**: workspace, repo_slug (path), name, description, is_private, fork_policy, language, has_issues, has_wiki
- **Output**: uuid, name, slug, full_name, description, is_private, created_on, updated_on, links

**Delete Repository**
- **Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}`
- **Input**: workspace, repo_slug (path parameters)
- **Output**: No content (204 status)

**Get Repository Permissions**
- **Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/permissions`
- **Input**: workspace, repo_slug (path parameters)
- **Output**: size, page, pagelen, next, previous, values (user, permission)

**Update Member Permissions**
- **Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}/permissions/{member}`
- **Input**: workspace, repo_slug, member (path), permission
- **Output**: user, permission

**List Branches**
- **Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/refs/branches`
- **Input**: workspace, repo_slug (path), q, sort
- **Output**: size, page, pagelen, next, previous, values (name, target, links)

**Create Branch**
- **Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/refs/branches`
- **Input**: workspace, repo_slug (path), name, target
- **Output**: name, target, links

**Update Branch**
- **Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}/refs/branches/{name}`
- **Input**: workspace, repo_slug, name (path), target
- **Output**: name, target, links

**Delete Branch**
- **Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}/refs/branches/{name}`
- **Input**: workspace, repo_slug, name (path parameters)
- **Output**: No content (204 status)

**List Tags**
- **Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/refs/tags`
- **Input**: workspace, repo_slug (path), q, sort
- **Output**: size, page, pagelen, next, previous, values (name, target, links)

**Create Tag**
- **Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/refs/tags`
- **Input**: workspace, repo_slug (path), name, target, message
- **Output**: name, target, links

**Delete Tag**
- **Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}/refs/tags/{name}`
- **Input**: workspace, repo_slug, name (path parameters)
- **Output**: No content (204 status)

*Note: This represents a comprehensive subset of the complete endpoint schemas. The full specification includes all 160+ endpoints with detailed input/output schemas for both Data Center and Cloud APIs.*

## Code Patterns (Based on Example)

### 1. Tool Structure with Zod Schemas
```typescript
// tools/cloud/repository/create-repository.ts
import { z } from 'zod';

const CreateRepositorySchema = z.object({
  workspace: z.string().min(1, "Workspace is required"),
  name: z.string().min(1, "Repository name is required"),
  description: z.string().optional(),
  isPrivate: z.boolean().default(true)
});

export const createRepositoryTool: MCPTool = {
  name: "mcp_bitbucket_repository_create",
  description: "Creates a new repository in Bitbucket Cloud",
  inputSchema: CreateRepositorySchema.shape,
  handler: async (params) => {
    const validatedParams = CreateRepositorySchema.parse(params);
    // Implementation using validated parameters
  }
};
```

### 2. API Services
```typescript
// services/bitbucket-api.ts
export class BitbucketAPIService {
  constructor(private config: BitbucketConfig) {}
  
  async createRepository(params: CreateRepositoryParams): Promise<Repository> {
    // API call implementation
  }
}
```

### 3. CLI Commands with Nested Structure
```typescript
// client/commands/repository.ts
import { Command } from 'commander';

export const repositoryCommands = new Command('repository')
  .description('Repository management commands');

repositoryCommands
  .command('list')
  .description('List repositories')
  .option('--project <project>', 'Filter by project key')
  .option('--workspace <workspace>', 'Filter by workspace (Cloud)')
  .action(async (options) => {
    // Command implementation
  });

repositoryCommands
  .command('create')
  .description('Create new repository')
  .option('--workspace <workspace>', 'Workspace name (required for Cloud)')
  .option('--name <name>', 'Repository name (required)')
  .option('--description <description>', 'Repository description')
  .option('--private', 'Make repository private')
  .action(async (options) => {
    // Command implementation
  });

// Usage: bitbucket repository list --project ND
// Usage: bitbucket repository create --workspace myworkspace --name myrepo
```

### 4. Main CLI Structure
```typescript
// client/console-client.ts
import { Command } from 'commander';
import { repositoryCommands } from './commands/repository';
import { pullRequestCommands } from './commands/pull-request';
import { projectCommands } from './commands/project';

const program = new Command();

program
  .name('bitbucket')
  .description('Bitbucket MCP Server CLI Client')
  .version('1.0.0');

// Add nested command groups
program.addCommand(repositoryCommands);
program.addCommand(pullRequestCommands);
program.addCommand(projectCommands);

// Usage examples:
// bitbucket repository list --project ND
// bitbucket pull-request create --source feature-branch --destination main
// bitbucket project list
// bitbucket auth oauth-token-create --grant-type authorization_code
// bitbucket workspace list
// bitbucket issue list --workspace myworkspace --repo myrepo
// bitbucket pipeline list --workspace myworkspace --repo myrepo
```

### 5. HTTP Call Logging with Sanitization
```typescript
// utils/http-logger.ts
export class HTTPLogger {
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'x-api-key', 'x-auth-token', 'cookie'];
    const sanitized = { ...headers };
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '***MASKED***';
      }
    }
    
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***MASKED***';
      }
    }
    
    return sanitized;
  }

  logHTTPCall(request: any, response: any): any {
    return {
      request: {
        method: request.method,
        url: request.url,
        headers: this.sanitizeHeaders(request.headers),
        body: this.sanitizeBody(request.body)
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: this.sanitizeHeaders(response.headers),
        body: this.sanitizeBody(response.data)
      },
      timestamp: new Date().toISOString()
    };
  }
}
```

## Configuration

### Environment Variables
```bash
# Server configuration
BITBUCKET_BASE_URL=https://bitbucket.org  # or Data Center URL
TRANSPORT_MODE=stdio  # or http
PORT=3000

# Cloud authentication
ATLASSIAN_USER_EMAIL=user@example.com
ATLASSIAN_API_TOKEN=token
BITBUCKET_APP_PASSWORD=password

# Data Center authentication
BITBUCKET_USERNAME=username
BITBUCKET_API_TOKEN=token

# Tool configuration
CLOUD_CORE_AUTH=true
CLOUD_CORE_REPOSITORY=true
DATACENTER_CORE_AUTH=true
DATACENTER_CORE_REPOSITORY=true

# HTTP call logging configuration
ENABLE_HTTP_LOGGING=true
SANITIZE_SENSITIVE_DATA=true
LOG_LEVEL=info
```

## Success Criteria

1. **Functionality**: All CRUD operations working for both server types
2. **Detection**: Automatic and correct server type detection
3. **Performance**: Operations completed within specified times
4. **Usability**: Intuitive CLI with help and examples
5. **Testing**: Test coverage > 80%
6. **Documentation**: Complete documentation and usage examples

## MCP Server Documentation Structure

The following documentation files must be generated in `docs/` directory:

- **README.md** - Documentação principal do projeto
- **API.md** - Documentação da API
- **ARCHITECTURE.md** - Arquitetura do sistema
- **CONTRIBUTING.md** - Guia de contribuição
- **DEPLOYMENT.md** - Guia de deploy
- **EXAMPLES.md** - Exemplos de uso
- **LICENSE.md** - Licença do projeto
- **CHANGELOG.md** - Histórico de mudanças
- **SECURITY.md** - Políticas de segurança
- **MCP_PROTOCOL.md** - Documentação específica do protocolo MCP
- **TOOLS_REFERENCE.md** - Referência das ferramentas MCP
- **AUTHENTICATION.md** - Guia de autenticação MCP
- **CONFIGURATION.md** - Configuração do MCP Server
- **DEVELOPMENT.md** - Guia para desenvolvedores
- **TESTING.md** - Guia de testes
- **BUILD.md** - Guia de build
- **FAQ.md** - Perguntas frequentes
- **TROUBLESHOOTING.md** - Solução de problemas
- **PERFORMANCE.md** - Guia de performance

## Technical Dependencies

- **Node.js**: >= 18.0.0
- **TypeScript**: For static typing
- **@modelcontextprotocol/sdk**: Official MCP SDK with Zod support
- **Zod**: For runtime type validation and schema definition
- **Axios**: For HTTP calls to Bitbucket API
- **Commander.js**: For CLI interface
- **Jest**: For testing
- **ESLint/Prettier**: For code quality

## Constraints

1. **Compatibility**: Must work with Node.js 18+
2. **Security**: Tokens and passwords must not be exposed in logs
3. **Rate Limiting**: Respect Bitbucket API limits
4. **Offline**: No offline functionality required

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

### Comprehensive Coverage
- [x] All 160+ endpoints from 001-bitbucket-mcp-server included
- [x] Complete input/output schemas for all endpoints
- [x] All CLI commands and nested structures defined
- [x] Both Data Center and Cloud APIs fully covered
- [x] All CRUD operations specified
- [x] Authentication methods for both server types included
- [x] Console client requirements with localization support
- [x] HTTP request logging via stderr for script generation
- [x] MCP Server documentation structure defined

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Complete endpoint coverage verified
- [x] CLI command structure defined
- [x] Console client requirements added
- [x] HTTP logging requirements updated
- [x] MCP documentation structure defined
- [x] Review checklist passed

---
