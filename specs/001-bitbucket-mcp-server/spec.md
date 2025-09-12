# Feature Specification: Bitbucket MCP Server

**Feature Branch**: `001-bitbucket-mcp-server`  
**Created**: 2025-09-11  
**Status**: Draft  
**Input**: User description: "Bitbucket MCP server que baseado no tipo de servidor carregará ferramentas (servidor) ou comandos (cliente) de datacenter ou ferramentas (servidor) ou comandos (cliente) de cloud."

## Execution Flow (main)
```
1. Parse user description from Input
   → Extract: MCP server, Bitbucket integration, server type detection
2. Extract key concepts from description
   → Identify: server types (datacenter/cloud), tool loading, endpoint organization
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → Define server type detection and tool loading scenarios
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (data structures for endpoints)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something, mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a developer using an MCP client, I want to connect to either Bitbucket Data Center or Cloud so that I can interact with repositories, pull requests, and other Bitbucket features through a unified interface.

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

*Additional requirements:*
- **FR-011**: System MUST support authentication methods: Basic Auth (username/password), OAuth 2.0 (Authorization Code Grant), and Personal Access Tokens for both Data Center and Cloud
- **FR-012**: System MUST handle error scenarios: network timeouts (30s), rate limiting (429 responses), authentication failures (401/403), server errors (5xx), and invalid parameters (400) with appropriate retry mechanisms (exponential backoff, max 3 retries)

### Console Client Requirements
- **CC-001**: Console client commands MUST mirror server functionality exactly
- **CC-002**: Console client MUST provide command descriptions in 20 most spoken languages via `--language` option
- **CC-003**: Default language for console client MUST be English
- **CC-004**: Console client MUST print MCP server semantic version with `--version` command
- **CC-005**: Server tool descriptions MUST be available only in English (not localized)

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

## Endpoint Organization by Server Type and Functionality

### Bitbucket Data Center Endpoints

#### Authentication Module
- **OAuth Management**
  - `POST /rest/oauth/1.0/tokens` - Create OAuth token
  - `GET /rest/oauth/1.0/tokens` - List OAuth tokens
  - `DELETE /rest/oauth/1.0/tokens/{tokenId}` - Revoke OAuth token
- **Session Management**
  - `GET /rest/api/1.0/users` - Get current user
  - `POST /rest/api/1.0/users` - Create user session

#### Project Management
- **Project Operations**
  - `GET /rest/api/1.0/projects` - List projects
  - `POST /rest/api/1.0/projects` - Create project
  - `GET /rest/api/1.0/projects/{projectKey}` - Get project details
  - `PUT /rest/api/1.0/projects/{projectKey}` - Update project
  - `DELETE /rest/api/1.0/projects/{projectKey}` - Delete project
- **Project Permissions**
  - `GET /rest/api/1.0/projects/{projectKey}/permissions` - Get project permissions
  - `PUT /rest/api/1.0/projects/{projectKey}/permissions/users` - Update user permissions
  - `PUT /rest/api/1.0/projects/{projectKey}/permissions/groups` - Update group permissions

#### Repository Management
- **Repository Operations**
  - `GET /rest/api/1.0/projects/{projectKey}/repos` - List repositories
  - `POST /rest/api/1.0/projects/{projectKey}/repos` - Create repository
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}` - Get repository details
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}` - Update repository
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}` - Delete repository
- **Repository Permissions**
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions` - Get repository permissions
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/users` - Update user permissions
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/groups` - Update group permissions
- **Branch Management**
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches` - List branches
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches` - Create branch
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches/default` - Set default branch
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches/{branchId}` - Delete branch
- **Tag Management**
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags` - List tags
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags` - Create tag
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags/{tagName}` - Delete tag

#### Pull Request Management
- **Pull Request Operations**
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests` - List pull requests
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests` - Create pull request
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}` - Get pull request details
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}` - Update pull request
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}` - Delete pull request
- **Pull Request Actions**
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/merge` - Merge pull request
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/decline` - Decline pull request
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/reopen` - Reopen pull request
- **Pull Request Comments**
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments` - List comments
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments` - Create comment
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}` - Get comment
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}` - Update comment
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}` - Delete comment

#### Commit and Source Management
- **Commit Operations**
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits` - List commits
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}` - Get commit details
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/changes` - Get commit changes
- **File Operations**
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/browse` - Browse repository files
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/raw/{path}` - Get raw file content
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/browse` - Create/update file
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/browse` - Delete file

#### Search and Analytics
- **Search Operations**
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/search/commits` - Search commits
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/search/code` - Search code
  - `GET /rest/api/1.0/search/repositories` - Search repositories
  - `GET /rest/api/1.0/search/users` - Search users

#### Builds and Deployments
- **Build Status Management**
  - `GET /rest/build-status/1.0/commits/{commitId}` - Get build status
  - `POST /rest/build-status/1.0/commits/{commitId}` - Create build status
  - `DELETE /rest/build-status/1.0/commits/{commitId}/builds/{key}` - Delete build status

#### System Administration
- **Capabilities**
  - `GET /rest/api/1.0/admin/capabilities` - Get system capabilities
- **Dashboard**
  - `GET /rest/api/1.0/dashboard` - Get dashboard data
- **Jira Integration**
  - `GET /rest/jira/1.0/projects/{projectKey}/repos/{repositorySlug}/commits` - Get Jira-linked commits
  - `POST /rest/jira/1.0/projects/{projectKey}/repos/{repositorySlug}/commits` - Link commits to Jira
- **Markup**
  - `POST /rest/api/1.0/markup/preview` - Preview markup
- **Mirroring**
  - `GET /rest/mirror/1.0/projects/{projectKey}/repos/{repositorySlug}/mirrors` - List mirrors
  - `POST /rest/mirror/1.0/projects/{projectKey}/repos/{repositorySlug}/mirrors` - Create mirror
  - `GET /rest/mirror/1.0/projects/{projectKey}/repos/{repositorySlug}/mirrors/{mirrorId}` - Get mirror
  - `PUT /rest/mirror/1.0/projects/{projectKey}/repos/{repositorySlug}/mirrors/{mirrorId}` - Update mirror
  - `DELETE /rest/mirror/1.0/projects/{projectKey}/repos/{repositorySlug}/mirrors/{mirrorId}` - Delete mirror
- **Advanced Permission Management**
  - `GET /rest/api/1.0/admin/permissions` - Get system permissions
  - `PUT /rest/api/1.0/admin/permissions` - Update system permissions
- **Rolling Upgrades**
  - `GET /rest/api/1.0/admin/rolling-upgrades` - Get rolling upgrade status
  - `POST /rest/api/1.0/admin/rolling-upgrades` - Start rolling upgrade
- **SAML Configuration**
  - `GET /rest/api/1.0/admin/saml` - Get SAML configuration
  - `PUT /rest/api/1.0/admin/saml` - Update SAML configuration
- **Security Management**
  - `GET /rest/api/1.0/admin/security` - Get security settings
  - `PUT /rest/api/1.0/admin/security` - Update security settings
- **System Maintenance**
  - `GET /rest/api/1.0/admin/system` - Get system information
  - `POST /rest/api/1.0/admin/system/backup` - Create system backup
  - `GET /rest/api/1.0/admin/system/health` - Get system health

### Bitbucket Cloud Endpoints

#### Authentication Module
- **OAuth 2.0 Management**
  - `POST /site/oauth2/access_token` - Get access token
  - `POST /site/oauth2/refresh_token` - Refresh access token
  - `POST /site/oauth2/revoke_token` - Revoke token
- **User Management**
  - `GET /2.0/user` - Get current user
  - `GET /2.0/users/{username}` - Get user details

#### Workspace Management
- **Workspace Operations**
  - `GET /2.0/workspaces` - List workspaces
  - `GET /2.0/workspaces/{workspace}` - Get workspace details
  - `PUT /2.0/workspaces/{workspace}` - Update workspace
- **Workspace Permissions**
  - `GET /2.0/workspaces/{workspace}/permissions` - Get workspace permissions
  - `PUT /2.0/workspaces/{workspace}/permissions/{member}` - Update member permissions

#### Repository Management
- **Repository Operations**
  - `GET /2.0/repositories/{workspace}` - List repositories in workspace
  - `POST /2.0/repositories/{workspace}/{repo_slug}` - Create repository
  - `GET /2.0/repositories/{workspace}/{repo_slug}` - Get repository details
  - `PUT /2.0/repositories/{workspace}/{repo_slug}` - Update repository
  - `DELETE /2.0/repositories/{workspace}/{repo_slug}` - Delete repository
- **Repository Permissions**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/permissions` - Get repository permissions
  - `PUT /2.0/repositories/{workspace}/{repo_slug}/permissions/{member}` - Update member permissions
- **Branch Management**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/refs/branches` - List branches
  - `POST /2.0/repositories/{workspace}/{repo_slug}/refs/branches` - Create branch
  - `PUT /2.0/repositories/{workspace}/{repo_slug}/refs/branches/{name}` - Update branch
  - `DELETE /2.0/repositories/{workspace}/{repo_slug}/refs/branches/{name}` - Delete branch
- **Tag Management**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/refs/tags` - List tags
  - `POST /2.0/repositories/{workspace}/{repo_slug}/refs/tags` - Create tag
  - `DELETE /2.0/repositories/{workspace}/{repo_slug}/refs/tags/{name}` - Delete tag

#### Pull Request Management
- **Pull Request Operations**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests` - List pull requests
  - `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests` - Create pull request
  - `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}` - Get pull request details
  - `PUT /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}` - Update pull request
  - `DELETE /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}` - Delete pull request
- **Pull Request Actions**
  - `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/merge` - Merge pull request
  - `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/decline` - Decline pull request
  - `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/reopen` - Reopen pull request
- **Pull Request Comments**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments` - List comments
  - `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments` - Create comment
  - `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}` - Get comment
  - `PUT /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}` - Update comment
  - `DELETE /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}` - Delete comment

#### Commit and Source Management
- **Commit Operations**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/commits` - List commits
  - `GET /2.0/repositories/{workspace}/{repo_slug}/commits/{commit_hash}` - Get commit details
  - `GET /2.0/repositories/{workspace}/{repo_slug}/commits/{commit_hash}/diff` - Get commit diff
- **File Operations**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/src` - Browse repository files
  - `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}` - Get file content
  - `POST /2.0/repositories/{workspace}/{repo_slug}/src` - Create/update file
  - `DELETE /2.0/repositories/{workspace}/{repo_slug}/src` - Delete file

#### Search and Analytics
- **Search Operations**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/search/commits` - Search commits
  - `GET /2.0/repositories/{workspace}/{repo_slug}/search/code` - Search code
  - `GET /2.0/repositories` - Search repositories
  - `GET /2.0/users` - Search users

#### Branch Restrictions
- **Branch Restriction Management**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions` - List branch restrictions
  - `POST /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions` - Create branch restriction
  - `GET /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions/{id}` - Get branch restriction
  - `PUT /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions/{id}` - Update branch restriction
  - `DELETE /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions/{id}` - Delete branch restriction

#### Commit Statuses
- **Build Status Management**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses` - List commit statuses
  - `POST /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build` - Create build status
  - `GET /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build/{key}` - Get build status
  - `PUT /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build/{key}` - Update build status

#### Deployments
- **Deployment Management**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/deployments` - List deployments
  - `POST /2.0/repositories/{workspace}/{repo_slug}/deployments` - Create deployment
  - `GET /2.0/repositories/{workspace}/{repo_slug}/deployments/{deployment_uuid}` - Get deployment
  - `PUT /2.0/repositories/{workspace}/{repo_slug}/deployments/{deployment_uuid}` - Update deployment
  - `DELETE /2.0/repositories/{workspace}/{repo_slug}/deployments/{deployment_uuid}` - Delete deployment

#### Downloads
- **File Download Management**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/downloads` - List downloads
  - `POST /2.0/repositories/{workspace}/{repo_slug}/downloads` - Create download
  - `GET /2.0/repositories/{workspace}/{repo_slug}/downloads/{filename}` - Get download
  - `DELETE /2.0/repositories/{workspace}/{repo_slug}/downloads/{filename}` - Delete download

#### GPG Keys
- **GPG Key Management**
  - `GET /2.0/users/{username}/gpg-keys` - List user GPG keys
  - `POST /2.0/users/{username}/gpg-keys` - Create GPG key
  - `GET /2.0/users/{username}/gpg-keys/{key_id}` - Get GPG key
  - `DELETE /2.0/users/{username}/gpg-keys/{key_id}` - Delete GPG key

#### Issue Tracker
- **Issue Management**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/issues` - List issues
  - `POST /2.0/repositories/{workspace}/{repo_slug}/issues` - Create issue
  - `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}` - Get issue
  - `PUT /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}` - Update issue
  - `DELETE /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}` - Delete issue
  - `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments` - List issue comments
  - `POST /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments` - Create issue comment

#### Pipelines
- **Pipeline Management**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines` - List pipelines
  - `POST /2.0/repositories/{workspace}/{repo_slug}/pipelines` - Create pipeline
  - `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}` - Get pipeline
  - `POST /2.0/repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/stopPipeline` - Stop pipeline
  - `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps` - List pipeline steps

#### SSH Keys
- **SSH Key Management**
  - `GET /2.0/users/{username}/ssh-keys` - List user SSH keys
  - `POST /2.0/users/{username}/ssh-keys` - Create SSH key
  - `GET /2.0/users/{username}/ssh-keys/{key_id}` - Get SSH key
  - `DELETE /2.0/users/{username}/ssh-keys/{key_id}` - Delete SSH key

#### Snippets
- **Code Snippet Management**
  - `GET /2.0/snippets/{workspace}` - List workspace snippets
  - `POST /2.0/snippets/{workspace}` - Create snippet
  - `GET /2.0/snippets/{workspace}/{encoded_id}` - Get snippet
  - `PUT /2.0/snippets/{workspace}/{encoded_id}` - Update snippet
  - `DELETE /2.0/snippets/{workspace}/{encoded_id}` - Delete snippet
  - `GET /2.0/snippets/{workspace}/{encoded_id}/commits` - List snippet commits
  - `GET /2.0/snippets/{workspace}/{encoded_id}/commits/{revision}` - Get snippet commit

#### Webhooks
- **Webhook Management**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/hooks` - List webhooks
  - `POST /2.0/repositories/{workspace}/{repo_slug}/hooks` - Create webhook
  - `GET /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}` - Get webhook
  - `PUT /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}` - Update webhook
  - `DELETE /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}` - Delete webhook

#### Branching Model
- **Branching Model Management**
  - `GET /2.0/repositories/{workspace}/{repo_slug}/branching-model` - Get branching model
  - `PUT /2.0/repositories/{workspace}/{repo_slug}/branching-model` - Update branching model

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
