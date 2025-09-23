# Bitbucket MCP Server Constitution

## Core Principles

### I. MCP Protocol First
The entire server must be built following the official Model Context Protocol (MCP) rigorously. The official MCP SDK must be the single source of truth for protocol implementations. Any functionality must be exposed through standardized MCP tools, ensuring total compatibility with MCP clients.

**Official MCP SDK Documentation**: https://github.com/modelcontextprotocol/typescript-sdk

### II. Multi-Transport Protocol
The server must support multiple transports simultaneously: stdio, HTTP, Server-Sent Events (SSE), HTTP streaming, and other protocols as specified by MCP. Each transport must be implemented independently and testably, with automatic fallback between transports when necessary.

### III. Selective Tool Registration
Tools must be registered selectively based on server type (datacenter or cloud) and version (7.16+). The system must automatically detect the Bitbucket server type and version and load only compatible tools. Commands in the console client must also be registered selectively based on server capabilities. Graceful degradation is mandatory for unavailable features.

### IV. Complete API Coverage
All Bitbucket Data Center (7.16+) and Cloud APIs must be implemented as MCP tools. The console client must implement commands for all Bitbucket API endpoints. Official Atlassian documentation must be the single source of truth for API specifications.

**Official Atlassian Developer Documentation**: https://developer.atlassian.com/

### V. Test-First (NON-NEGOTIABLE)
TDD mandatory: Tests written → Project Lead approved → Tests fail → Then implement. Red-Green-Refactor cycle strictly enforced. Test coverage >80% mandatory (line coverage). Contract, integration, and unit tests must be implemented for each tool.

## Architecture and Technology

### Technology Stack
- **Runtime**: Node.js 18+
- **SDK**: @modelcontextprotocol/sdk official (latest version with Zod schema support)
- **Language**: TypeScript with strict typing
- **Testing**: Jest with complete coverage
- **Validation**: Zod for schemas (integrated with MCP SDK)
- **HTTP**: Axios with interceptors
- **Logging**: Winston with sanitization
- **CLI**: Commander.js
- **Authentication**: OAuth 2.0, App Passwords, API Tokens, Basic Auth
- **Security**: Helmet, CORS, rate limiting, circuit breakers
- **Vector Database**: LanceDB or ChromaDB (JS client) for semantic search
- **Embeddings**: OpenAI embeddings or local transformers.js for text embeddings
- **Schema Management**: Dynamic Zod schema generation from Bitbucket OpenAPI specs

### Project Structure
```
src/
├── server/          # Main MCP server
├── client/          # Console client (built-in application)
├── tools/           # MCP tools
│   ├── cloud/       # Cloud-specific tools
│   ├── datacenter/  # Data Center-specific tools
│   └── shared/      # Shared tools
├── services/        # Business services
├── types/           # TypeScript type definitions
└── utils/           # Utilities

tests/
├── contract/        # Contract tests
├── integration/     # Integration tests
└── unit/           # Unit tests
```

### Server Detection and Selective Registration
- Automatic type detection (cloud/datacenter) via `/rest/api/1.0/application-properties` endpoint
- **Fallback Strategy**: If `/rest/api/1.0/application-properties` is unavailable, default to Data Center 7.16
- Version detection with fallback (7.16+) using server response headers and API capabilities
- Server capabilities caching with 5-minute TTL
- Continuous health checks every 30 seconds
- Configuration validation with strict schema enforcement
- Selective tool registration based on server type and version
- Selective command registration in console client based on server capabilities
- **Default Behavior**: When detection fails, assume Data Center 7.16 with basic feature set

### Multi-Language Support
- **Default Language**: pt-BR
- **Supported Languages**: pt-BR, en-US, zh-CN, hi-IN, es-ES, fr-FR, ar-SA, bn-BD, ru-RU, pt-PT, id-ID, ur-PK, de-DE, ja-JP, mr-IN, te-IN, tr-TR, ta-IN, vi-VN, it-IT
- **Localization**: i18next with fs-backend and http-middleware

## Semantic Discovery & Tool Architecture

### Core Tool Pattern
The Bitbucket MCP server MUST implement a 3-tool semantic discovery pattern to efficiently manage 200+ Bitbucket API endpoints across both Data Center and Cloud versions:

**CRITICAL ARCHITECTURE REQUIREMENT**: Only these 3 tools are registered as public MCP tools. All other Bitbucket functionality is accessed indirectly through these tools.

#### 🔍 search-ids(query: string) → List[EndpointSummary]
- **Purpose**: Semantic search across Bitbucket API operations and documentation
- **Implementation**: Vector database (embedded solution for Node.js) for embedding search
- **Input**: Natural language query describing desired Bitbucket functionality
- **Output**: List of operation IDs with short descriptions, parameter hints, and version compatibility
- **Performance**: Response time < 100ms for search queries
- **Content**: Index API operations, repository management, pull requests, user management, and administrative tasks
- **Version Awareness**: Search results MUST indicate compatibility with detected Bitbucket version

#### 📋 get-id(endpoint_id: string) → EndpointDetails
- **Purpose**: Retrieve detailed schema and documentation for specific Bitbucket API operation
- **Input**: Operation ID from search-ids results
- **Output**: Complete operation details including:
  - Operation description and purpose
  - Input schema (Zod-compatible JSON schema) with Bitbucket-specific types
  - Output schema including response formats and pagination details
  - Required vs optional parameters with Bitbucket data constraints
  - Usage examples, authentication requirements, and rate limiting notes
  - Version compatibility information (Data Center vs Cloud)
- **Privacy**: Internal API implementation details (server URLs, internal tokens) MUST remain hidden
- **Authentication Context**: Schema details MUST reflect current user permissions and access levels

#### ⚡ call-id(endpoint_id: string, params: dict) → dict
- **Purpose**: Execute Bitbucket API operation with dynamic parameter validation and authentication
- **Input Schema**: Generic schema with endpoint_id (string) and params (Record<string, any>)
- **Runtime Validation**: Dynamic schema validation using Zod with Bitbucket API constraints
- **Authentication**: Automatic selection of appropriate auth method based on configuration priority
- **Rate Limiting**: Built-in rate limiting compliance with Bitbucket API limits
- **Performance**: Validation overhead < 10ms per operation call
- **Error Handling**: Comprehensive error mapping from Bitbucket API responses to MCP error format

### Vector Database Requirements
- **Storage**: Embedded vector database compatible with Node.js (e.g., LanceDB, ChromaDB JS client)
- **Embeddings**: Pre-computed embeddings for all Bitbucket API operations, examples, and troubleshooting guides
- **Search Performance**: Sub-100ms semantic search response time
- **API Content**: Index Bitbucket API documentation, common use cases, error handling patterns
- **Multi-Version Support**: Separate embeddings for Data Center vs Cloud API differences
- **Dynamic Updates**: Re-index capabilities when new API versions are detected

### Schema Management & API Integration
- **Dynamic Validation**: Runtime schema validation with Bitbucket API type awareness
- **Schema Generation**: Auto-generate Zod schemas from Bitbucket OpenAPI specifications
- **Version Compatibility**: Schema validation MUST account for API version differences
- **Authentication Integration**: Schema validation MUST consider current authentication context
- **Rate Limiting Integration**: Built-in awareness of Bitbucket API rate limits per endpoint

### Integration with Bitbucket Operations
- **ALL** Bitbucket capabilities (repository management, pull requests, user administration, etc.) MUST be accessible **EXCLUSIVELY** through the 3-tool pattern
- **NO** direct tool registration for specific operations (repository management, pull requests, etc.)
- Only `search-ids`, `get-id`, and `call-id` are registered as public MCP tools
- Legacy direct tool access is **PROHIBITED** - all functionality goes through semantic discovery
- Console client MUST support both direct commands and semantic discovery workflow
- Documentation MUST include examples of semantic discovery for common Bitbucket administration tasks
- Multi-version support MUST be maintained through the semantic discovery interface

### MCP Tool Naming Conventions
All MCP tools MUST follow standardized naming patterns for consistency and cross-platform compatibility:

#### Universal Naming Rules
- **Primary Pattern**: `kebab-case` for maximum cross-platform compatibility
- **Namespace Pattern**: `namespace.action` for grouping related tools (e.g., `bitbucket.list-repos`, `bitbucket.create-pr`)
- **Avoid**: PascalCase, camelCase, SCREAMING_CASE, or overly verbose names
- **Language Neutral**: Tool names must work regardless of server implementation language

#### Mandatory Tool Naming Examples
```typescript
// ✅ Semantic Discovery Pattern (REQUIRED)
"search-ids"     // Find operations by natural language query
"get-id"         // Get detailed operation schema
"call-id"        // Execute operation with validation

// ✅ Bitbucket API Operations (Namespaced)
"bitbucket.list-repos"        // List repositories in project
"bitbucket.create-pr"         // Create pull request
"bitbucket.get-user"          // Get user information
"bitbucket.manage-webhooks"   // Manage repository webhooks

// ✅ Administrative Operations
"admin.backup-config"         // Backup server configuration
"admin.health-check"          // Server health monitoring
"admin.user-management"       // User administration

// ❌ Avoid These Patterns
"BitbucketListRepos"          // PascalCase breaks convention
"getUserData"                 // camelCase not MCP standard
"do_bitbucket_operation"      // snake_case/verbose
"API_CALL"                    // SCREAMING_CASE not readable
```

#### File Organization Standards
File names MUST match operation names for internal organization (these are NOT registered as separate MCP tools):
```
tools/
├── search-ids.ts              # Contains search-ids tool (PUBLIC MCP TOOL)
├── get-id.ts                  # Contains get-id tool (PUBLIC MCP TOOL)
├── call-id.ts                 # Contains call-id tool (PUBLIC MCP TOOL)
├── operations/                # Internal operation implementations (NOT registered as tools)
│   ├── bitbucket/
│   │   ├── list-repos.ts          # Internal: bitbucket.list-repos operation
│   │   ├── create-pr.ts           # Internal: bitbucket.create-pr operation
│   │   └── get-user.ts            # Internal: bitbucket.get-user operation
│   └── admin/
│       ├── backup-config.ts       # Internal: admin.backup-config operation
│       └── health-check.ts        # Internal: admin.health-check operation
```

#### Tool Registration Requirements
- **ONLY** the semantic discovery pattern tools MUST be registered as public MCP tools:
  - `search-ids` (semantic search for Bitbucket operations)
  - `get-id` (get detailed operation schema)
  - `call-id` (execute operation with validation)
- **ALL OTHER** Bitbucket functionality (repository management, pull requests, user administration, etc.) MUST be accessible **INDIRECTLY** through the 3-tool pattern
- Direct tool registration for specific operations (e.g., `bitbucket.list-repos`, `bitbucket.create-pr`, `admin.user-management`) is **PROHIBITED**
- Tool descriptions MUST be concise but descriptive
- Tool schemas MUST use Zod validation integrated with MCP SDK
- Bitbucket operation schemas MUST include version compatibility metadata

## Quality and Testing

### Mandatory Tests
- **Unit**: Each tool and service
- **Integration**: Inter-service communication
- **Contract**: Bitbucket API compliance
- **E2E**: Complete user flows
- **Performance**: Response time and throughput

### Quality Metrics
- Code coverage >80% (line coverage)
- Zero security vulnerabilities
- **API Operations**: Response time <2s for 95% of requests
- **Administrative Operations**: Response time <30s for 95% of requests (backup, upgrade, maintenance)
- **Long-running Operations**: Response time <5min for 95% of requests (bulk operations, migrations)
- **Memory Usage**: <1GB per instance, efficient resource management
- **Semantic Search**: Sub-100ms response time for search-ids queries, <10ms validation overhead for call-id operations
- **Vector Database**: <100MB memory footprint for embedded vector storage with 200+ API endpoints
- Uptime >99.9%
- Structured logs with sanitization

### API Validation
- Zod schemas integrated with MCP SDK for all inputs/outputs
- API version validation using SDK schemas
- Sensitive data sanitization
- Rate limiting and circuit breakers
- Automatic retry with exponential backoff

## Security and Authentication

### Authentication Methods
- **Priority Order**: OAuth 2.0 → Personal Access Tokens → App Passwords → Basic Authentication
- OAuth 2.0 (preferred)
- Personal Access Tokens (second choice)
- App Passwords (third choice)
- Basic Authentication (fallback only)
- Automatic method detection with priority-based fallback

### Data Security
- Mandatory log sanitization
- Sensitive data encryption
- Rigorous input validation
- Rate limiting per user/IP
- Security headers (Helmet)

### SSL/TLS Configuration
- SSL certificate support (required in production)
- SSL key management with environment variables
- CA certificate validation
- Automatic HTTPS redirect in production
- **Environment Variable**: `FORCE_HTTPS=true` (default: true)
- **Fallback Strategy**: Set `FORCE_HTTPS=false` only in case of SSL configuration errors
- HTTP fallback disabled by default for security

## Configuration Management

### Environment Variables
- **Server Configuration**: Base URL, server type, API version, timeout
- **Authentication**: Username, password, app password, API token, OAuth credentials
- **MCP Server**: Port, host, protocol, path
- **Logging**: Level (default: info), format (JSON), console/file output, rotation (daily, max 30 days)
- **Cache**: TTL (default: 300s), max size (default: 100MB), enable/disable, Redis URL (optional)
  - **Partitioning**: Per-user cache with namespace isolation
  - **Storage**: In-memory with Redis fallback for distributed deployments
- **Rate Limiting**: Window (default: 15min), max requests (default: 1000), enable/disable
  - **Scope**: Per-user rate limiting with IP-based fallback
  - **Burst Allowance**: 20% additional requests during peak times
- **Circuit Breaker**: Threshold (default: 5 failures), timeout (default: 60s), reset timeout (default: 30s)
- **Retry**: Attempts (default: 3), delay (default: 1000ms), backoff factor (default: 2), max delay (default: 10000ms)
- **Security**: CORS, Helmet, compression
- **Development**: Node environment, debug, hot reload
- **Testing**: Timeout, environment, mock responses
- **Performance**: Metrics, profiling, sample rate
- **Health Checks**: Endpoint (default: /health), timeout (default: 5000ms), interval (default: 30000ms)
- **Webhooks**: Secret, endpoint, signature verification
- **Monitoring**: Endpoints for metrics, Prometheus, Grafana
- **Alerting**: Webhook URL, email SMTP configuration
- **Selective Registration**: Auto-detection, selective tool loading, selective command loading, HTTP logging, sanitization, circuit breaker, rate limiting, caching, metrics, health checks, webhooks, dashboard, CLI, localization

## Governance

### Development Process
1. **Specification**: Document Bitbucket API
2. **Tests**: Write contract tests
3. **Approval**: Project Lead approval required for test cases
4. **Implementation**: Develop MCP tool
5. **Validation**: Integration tests
6. **Review**: Mandatory code review by senior developer
7. **Deploy**: Automatic deployment via GitHub Actions after code review approval

### Version Control
- Semantic versioning (MAJOR.MINOR.PATCH)
- Mandatory changelog
- Documented breaking changes
- Automatic migration when possible
- Deprecation with advance notice

### Documentation
- Updated README for each release
- Complete API documentation
- Usage examples for each tool
- Troubleshooting guides
- Architecture documentation

### Compliance
- MCP official compliance
- Node.js best practices adherence
- ESLint/Prettier code standards
- Mandatory semantic commits

### LGPL License Compliance
All code MUST be licensed under GNU Lesser General Public License (LGPL) v3.0; Source code MUST be made available; Derivative works MUST maintain LGPL compatibility; Commercial use permitted with proper attribution; License headers MUST be included in all source files; License file MUST be present in project root; Documentation MUST reference LGPL terms; Third-party dependencies MUST be compatible with LGPL; License compliance verification in CI/CD pipeline

## Monitoring and Observability

### Logging
- Structured JSON logs
- Levels: error, warn, info, debug
- Automatic sensitive data sanitization
- Configurable log rotation
- Request correlation

### Metrics
- Response time per tool
- Error rate per endpoint
- Memory and CPU usage
- Request throughput
- Continuous health checks

### Alerts
- Authentication failures
- API timeouts
- Rate limiting errors
- Performance degradation
- Health check failures

### Health Checks
- Endpoint: `/health` (configurable via `HEALTH_CHECK_ENDPOINT`)
- Timeout: 5000ms (configurable via `HEALTH_CHECK_TIMEOUT`)
- Interval: 30000ms (configurable via `HEALTH_CHECK_INTERVAL`)
- Status monitoring

## API Coverage

### Data Center (200+ endpoints)
- **Authentication** (8 endpoints): OAuth, App Passwords, API Tokens, Basic Auth, Session Management, HTTP Tokens
- **Project Management** (12 endpoints): Create, Read, Update, Delete, Permissions, Settings, Hooks, Avatars
- **Repository Management** (20 endpoints): CRUD operations, Branches, Tags, Forks, Settings, Permissions, Hooks
- **Pull Request Management** (18 endpoints): CRUD, Comments, Activities, Diff, Changes, Merge, Decline, Reopen
- **System Administration** (25+ endpoints): Users, Groups, Permissions, Settings, Health Checks, Logs, Metrics
- **Search** (10 endpoints): Repositories, Commits, Pull Requests, Code, Users, Analytics, Configuration
- **Dashboard** (12 endpoints): Pull request suggestions, user pull requests, Create, Read, Update, Delete, Widgets, Clone, Available Widgets
- **Builds and Deployments** (15 endpoints): Build capabilities, deployment capabilities, build status, deployment status, required builds
- **Capabilities** (5 endpoints): Build, deployment, mirroring, security, system capabilities
- **Content Security Policy** (8 endpoints): CSP configuration, report URI, violations, whitelist
- **Deprecated** (13 endpoints): Deprecated endpoints for backward compatibility
- **Jira Integration** (8 endpoints): Issue creation, linking, tracking, issue trackers
- **Markup** (6 endpoints): Markup preview, supported formats, various markup types
- **Mirroring - Mirror** (12 endpoints): Mirror management, sync, status, logs, repositories
- **Mirroring - Upstream** (10 endpoints): Upstream mirror management, sync, status, logs
- **Security** (17 endpoints): GPG keys, SSH keys, access tokens, audit logs, security settings
- **System Maintenance** (20 endpoints): Cluster management, system info, performance, maintenance
- **SAML Certificate Configuration** (5 endpoints): SAML certificate management
- **Permission Management** (8 endpoints): User and group permission management
- **Other Operations** (25 endpoints): Application properties, configuration, permissions, audit

### Cloud (200+ endpoints)
- **Authentication** (5 endpoints): OAuth, App Passwords, API Tokens, Basic Auth, Session Management
- **Workspace Management** (14 endpoints): CRUD operations, Members, Permissions, Settings, Hooks, Testing
- **Repository Management** (20 endpoints): CRUD operations, Branches, Tags, Forks, Settings, Permissions, Hooks
- **Pull Request Management** (18 endpoints): CRUD, Comments, Activities, Diff, Changes, Merge, Decline, Reopen
- **Issue Tracking** (25 endpoints): CRUD operations, Comments, Transitions, Watchers, Components, Versions, Attachments, Voting
- **Pipeline Management** (20 endpoints): Builds, Steps, Variables, SSH Keys, Known Hosts, Cache, Configuration, Logs, Test Reports
- **Webhooks** (8 endpoints): Create, Read, Update, Delete, Events, Payloads, Secrets
- **Snippets** (12 endpoints): CRUD operations, Comments, Watchers, Commits, Public Snippets
- **SSH/GPG Keys** (12 endpoints): User SSH Keys, User GPG Keys, Workspace SSH Keys, Key Management
- **Branch Restrictions** (6 endpoints): Create, Read, Update, Delete, Bypass, Settings
- **Commit Status** (5 endpoints): Build Status, Deployment Status, Status Checks
- **Deployments** (6 endpoints): CRUD operations, Environment Variables, Status
- **Downloads** (5 endpoints): File Upload, Download, Management, Permissions
- **Cache** (6 endpoints): Repository Cache, Workspace Cache, Content URI, Cache Management
- **Search** (10 endpoints): Repositories, Commits, Pull Requests, Code, Users, Analytics
- **Dashboards** (10 endpoints): Create, Read, Update, Delete, Widgets, Clone, Available Widgets
- **Add-ons** (8 endpoints): Linkers, Values, CRUD operations, Integration Management
- **Reports** (6 endpoints): Report Generation, Annotations, Commit Reports, Analysis
- **Source** (12 endpoints): File Access, History, Annotations, Diff, Blame, Raw Content, Metadata
- **Refs** (15 endpoints): Branches, Tags, Forks, Commits, References Management
- **Branching Model** (8 endpoints): Model Configuration, Branch Types, Settings Management
- **Projects** (12 endpoints): CRUD operations, Permissions, Settings, Hooks, Repository Organization
- **Users** (10 endpoints): User Management, Permissions, SSH Keys, Repository Access
- **Teams** (8 endpoints): Team Management, Members, Permissions, Repository Access
- **Other Operations** (15 endpoints): Default Reviewers, Watchers, Forks, Commit Statuses, Approvals

## Detailed API Endpoints by Category and Version

### Data Center API Endpoints (REST API 1.0)

#### Authentication (8 endpoints) - Available since 7.16+
- `POST /rest/api/1.0/oauth/access_token` - OAuth token exchange
- `POST /rest/api/1.0/oauth/revoke` - OAuth token revocation
- `GET /rest/api/1.0/oauth/authorize` - OAuth authorization
- `GET /rest/api/1.0/users/current` - Current user info
- `POST /rest/api/1.0/session` - Session management
- `GET /access-tokens/latest/users/{userSlug}/{tokenId}` - Get HTTP token by ID
- `POST /access-tokens/latest/users/{userSlug}/{tokenId}` - Update HTTP token
- `DELETE /access-tokens/latest/users/{userSlug}/{tokenId}` - Delete HTTP token

#### Project Management (12 endpoints) - Available since 7.16+
- `GET /rest/api/1.0/projects` - List projects
- `POST /rest/api/1.0/projects` - Create project
- `GET /rest/api/1.0/projects/{projectKey}` - Get project
- `PUT /rest/api/1.0/projects/{projectKey}` - Update project
- `DELETE /rest/api/1.0/projects/{projectKey}` - Delete project
- `GET /rest/api/1.0/projects/{projectKey}/permissions` - Get permissions
- `POST /rest/api/1.0/projects/{projectKey}/permissions` - Add permission
- `DELETE /rest/api/1.0/projects/{projectKey}/permissions` - Remove permission
- `GET /rest/api/1.0/projects/{projectKey}/settings` - Get settings
- `PUT /rest/api/1.0/projects/{projectKey}/settings` - Update settings
- `GET /rest/api/1.0/projects/{projectKey}/hooks` - List hooks
- `POST /rest/api/1.0/projects/{projectKey}/hooks` - Create hook

#### Repository Management (20 endpoints) - Available since 7.16+
- `GET /rest/api/1.0/projects/{projectKey}/repos` - List repositories
- `POST /rest/api/1.0/projects/{projectKey}/repos` - Create repository
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}` - Get repository
- `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}` - Update repository
- `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}` - Delete repository
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches` - List branches
- `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches` - Create branch
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags` - List tags
- `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags` - Create tag
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/forks` - List forks
- `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/forks` - Create fork
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions` - Get permissions
- `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions` - Add permission
- `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions` - Remove permission
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings` - Get settings
- `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings` - Update settings
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/hooks` - List hooks
- `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/hooks` - Create hook
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits` - List commits
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}` - Get commit

#### Pull Request Management (18 endpoints) - Available since 7.16+
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests` - List pull requests
- `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests` - Create pull request
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}` - Get pull request
- `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}` - Update pull request
- `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}` - Delete pull request
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments` - List comments
- `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments` - Create comment
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/activities` - List activities
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/diff` - Get diff
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/changes` - Get changes
- `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/merge` - Merge pull request
- `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/decline` - Decline pull request
- `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/reopen` - Reopen pull request
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/approve` - Get approval
- `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/approve` - Approve pull request
- `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/approve` - Remove approval
- `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/participants` - List participants
- `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/participants` - Add participant

#### System Administration (25+ endpoints) - Available since 7.16+
- `GET /rest/api/1.0/admin/users` - List users
- `POST /rest/api/1.0/admin/users` - Create user
- `GET /rest/api/1.0/admin/users/{username}` - Get user
- `PUT /rest/api/1.0/admin/users/{username}` - Update user
- `DELETE /rest/api/1.0/admin/users/{username}` - Delete user
- `GET /rest/api/1.0/admin/groups` - List groups
- `POST /rest/api/1.0/admin/groups` - Create group
- `GET /rest/api/1.0/admin/groups/{groupName}` - Get group
- `PUT /rest/api/1.0/admin/groups/{groupName}` - Update group
- `DELETE /rest/api/1.0/admin/groups/{groupName}` - Delete group
- `GET /rest/api/1.0/admin/permissions` - List permissions
- `GET /rest/api/1.0/admin/settings` - Get settings
- `PUT /rest/api/1.0/admin/settings` - Update settings
- `GET /rest/api/1.0/admin/health` - Health check
- `GET /rest/api/1.0/admin/logs` - Get logs
- `GET /rest/api/1.0/admin/metrics` - Get metrics
- `GET /rest/api/1.0/admin/plugins` - List plugins
- `POST /rest/api/1.0/admin/plugins` - Install plugin
- `DELETE /rest/api/1.0/admin/plugins/{pluginKey}` - Uninstall plugin
- `GET /rest/api/1.0/admin/backup` - Backup status
- `POST /rest/api/1.0/admin/backup` - Start backup
- `GET /rest/api/1.0/admin/license` - License info
- `POST /rest/api/1.0/admin/license` - Update license
- `GET /rest/api/1.0/admin/upgrade` - Upgrade status
- `POST /rest/api/1.0/admin/upgrade` - Start upgrade

#### Search (10 endpoints) - Available since 7.16+
- `GET /rest/api/1.0/search/repositories` - Search repositories
- `GET /rest/api/1.0/search/commits` - Search commits
- `GET /rest/api/1.0/search/pull-requests` - Search pull requests
- `GET /rest/api/1.0/search/code` - Search code
- `GET /rest/api/1.0/search/users` - Search users
- `GET /rest/api/1.0/search/analytics` - Search analytics
- `GET /rest/api/1.0/search/configuration` - Search configuration
- `PUT /rest/api/1.0/search/configuration` - Update search configuration
- `GET /rest/api/1.0/search/indexes` - List search indexes
- `POST /rest/api/1.0/search/indexes/{indexId}/rebuild` - Rebuild search index

#### Dashboard (12 endpoints) - Available since 8.0+
- `GET /api/latest/dashboard/pull-request-suggestions` - Get pull request suggestions
- `GET /api/latest/dashboard/pull-requests` - Get pull requests for a user
- `GET /rest/api/1.0/dashboards` - List dashboards
- `POST /rest/api/1.0/dashboards` - Create dashboard
- `GET /rest/api/1.0/dashboards/{dashboardId}` - Get dashboard
- `PUT /rest/api/1.0/dashboards/{dashboardId}` - Update dashboard
- `DELETE /rest/api/1.0/dashboards/{dashboardId}` - Delete dashboard
- `POST /rest/api/1.0/dashboards/{dashboardId}/clone` - Clone dashboard
- `POST /rest/api/1.0/dashboards/{dashboardId}/widgets` - Add widget
- `PUT /rest/api/1.0/dashboards/{dashboardId}/widgets/{widgetId}` - Update widget
- `DELETE /rest/api/1.0/dashboards/{dashboardId}/widgets/{widgetId}` - Remove widget
- `GET /rest/api/1.0/dashboards/widgets/available` - List available widgets

#### Builds and Deployments (15 endpoints) - Available since 7.16+
- `GET /api/latest/build/capabilities` - Get build capabilities
- `GET /api/latest/deployment/capabilities` - Get deployment capabilities
- `GET /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/builds` - List builds for commit
- `POST /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/builds` - Create build status
- `GET /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/builds/{buildKey}` - Get build status
- `PUT /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/builds/{buildKey}` - Update build status
- `DELETE /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/builds/{buildKey}` - Delete build status
- `GET /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/deployments` - List deployments for commit
- `POST /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/deployments` - Create deployment
- `GET /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/deployments/{deploymentKey}` - Get deployment
- `PUT /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/deployments/{deploymentKey}` - Update deployment
- `DELETE /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/deployments/{deploymentKey}` - Delete deployment
- `PUT /required-builds/latest/projects/{projectKey}/repos/{repositorySlug}/condition/{id}` - Update required builds merge check
- `DELETE /required-builds/latest/projects/{projectKey}/repos/{repositorySlug}/condition/{id}` - Delete required builds merge check
- `GET /api/latest/projects/{projectKey}/repos/{repositorySlug}/required-builds` - List required builds

#### Capabilities (5 endpoints) - Available since 7.16+
- `GET /api/latest/build/capabilities` - Get build capabilities
- `GET /api/latest/deployment/capabilities` - Get deployment capabilities
- `GET /api/latest/mirroring/capabilities` - Get mirroring capabilities
- `GET /api/latest/security/capabilities` - Get security capabilities
- `GET /api/latest/system/capabilities` - Get system capabilities

#### Content Security Policy (8 endpoints) - Available since 7.16+
- `GET /api/latest/admin/security/content-security-policy` - Get CSP configuration
- `PUT /api/latest/admin/security/content-security-policy` - Update CSP configuration
- `GET /api/latest/admin/security/content-security-policy/report-uri` - Get CSP report URI
- `PUT /api/latest/admin/security/content-security-policy/report-uri` - Update CSP report URI
- `GET /api/latest/admin/security/content-security-policy/violations` - List CSP violations
- `POST /api/latest/admin/security/content-security-policy/violations` - Report CSP violation
- `GET /api/latest/admin/security/content-security-policy/whitelist` - Get CSP whitelist
- `PUT /api/latest/admin/security/content-security-policy/whitelist` - Update CSP whitelist

#### Deprecated (13 endpoints) - Available since 7.16+
- `GET /build-status/latest/commits/{commitId}` - Get build statuses for commit (deprecated)
- `PUT /api/latest/projects/{projectKey}/repos/{repositorySlug}/branches/default` - Update default branch (deprecated)
- `GET /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/builds` - List builds (deprecated)
- `POST /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/builds` - Create build (deprecated)
- `GET /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/deployments` - List deployments (deprecated)
- `POST /api/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/deployments` - Create deployment (deprecated)
- `GET /api/latest/projects/{projectKey}/repos/{repositorySlug}/settings/hooks` - List hooks (deprecated)
- `POST /api/latest/projects/{projectKey}/repos/{repositorySlug}/settings/hooks` - Create hook (deprecated)
- `GET /api/latest/projects/{projectKey}/repos/{repositorySlug}/settings/hooks/{hookKey}` - Get hook (deprecated)
- `PUT /api/latest/projects/{projectKey}/repos/{repositorySlug}/settings/hooks/{hookKey}` - Update hook (deprecated)
- `DELETE /api/latest/projects/{projectKey}/repos/{repositorySlug}/settings/hooks/{hookKey}` - Delete hook (deprecated)
- `GET /api/latest/projects/{projectKey}/repos/{repositorySlug}/settings/hooks/{hookKey}/enabled` - Get hook enabled status (deprecated)
- `PUT /api/latest/projects/{projectKey}/repos/{repositorySlug}/settings/hooks/{hookKey}/enabled` - Update hook enabled status (deprecated)

#### Jira Integration (8 endpoints) - Available since 7.16+
- `POST /jira/latest/comments/{commentId}/issues` - Create Jira issue from comment
- `GET /jira/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/issues` - List Jira issues for commit
- `POST /jira/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/issues` - Link Jira issue to commit
- `DELETE /jira/latest/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/issues/{issueKey}` - Unlink Jira issue from commit
- `GET /jira/latest/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/issues` - List Jira issues for pull request
- `POST /jira/latest/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/issues` - Link Jira issue to pull request
- `DELETE /jira/latest/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/issues/{issueKey}` - Unlink Jira issue from pull request
- `GET /jira/latest/issue-trackers` - List available Jira issue trackers

#### Markup (6 endpoints) - Available since 7.16+
- `POST /api/latest/markup/preview` - Preview markup
- `POST /api/latest/markup/preview/atlassian-wiki-markup` - Preview Atlassian Wiki markup
- `POST /api/latest/markup/preview/markdown` - Preview Markdown
- `POST /api/latest/markup/preview/creole` - Preview Creole
- `POST /api/latest/markup/preview/plain-text` - Preview plain text
- `GET /api/latest/markup/supported-formats` - List supported markup formats

#### Mirroring - Mirror (12 endpoints) - Available since 7.16+
- `GET /rest/mirroring/latest/mirrors` - List mirrors
- `POST /rest/mirroring/latest/mirrors` - Create mirror
- `GET /rest/mirroring/latest/mirrors/{mirrorId}` - Get mirror
- `PUT /rest/mirroring/latest/mirrors/{mirrorId}` - Update mirror
- `DELETE /rest/mirroring/latest/mirrors/{mirrorId}` - Delete mirror
- `POST /rest/mirroring/latest/mirrors/{mirrorId}/sync` - Sync mirror
- `GET /rest/mirroring/latest/mirrors/{mirrorId}/status` - Get mirror status
- `GET /rest/mirroring/latest/mirrors/{mirrorId}/logs` - Get mirror logs
- `GET /rest/mirroring/latest/mirrors/{mirrorId}/repositories` - List mirrored repositories
- `POST /rest/mirroring/latest/mirrors/{mirrorId}/repositories` - Add repository to mirror
- `DELETE /rest/mirroring/latest/mirrors/{mirrorId}/repositories/{repositoryId}` - Remove repository from mirror
- `GET /rest/mirroring/latest/supportInfo/out-of-sync-repos/content` - Get out-of-sync repositories

#### Mirroring - Upstream (10 endpoints) - Available since 7.16+
- `GET /rest/mirroring/latest/upstreams` - List upstream mirrors
- `POST /rest/mirroring/latest/upstreams` - Create upstream mirror
- `GET /rest/mirroring/latest/upstreams/{upstreamId}` - Get upstream mirror
- `PUT /rest/mirroring/latest/upstreams/{upstreamId}` - Update upstream mirror
- `DELETE /rest/mirroring/latest/upstreams/{upstreamId}` - Delete upstream mirror
- `POST /rest/mirroring/latest/upstreams/{upstreamId}/sync` - Sync upstream mirror
- `GET /rest/mirroring/latest/upstreams/{upstreamId}/status` - Get upstream mirror status
- `GET /rest/mirroring/latest/upstreams/{upstreamId}/logs` - Get upstream mirror logs
- `GET /rest/mirroring/latest/supportInfo/projects/{projectKey}/repos/{repositorySlug}/repo-lock-owner` - Get repository lock owner
- `GET /rest/mirroring/latest/capabilities` - Get mirroring capabilities

#### Security (17 endpoints) - Available since 7.16+
- `GET /gpg/latest/keys` - Get all GPG keys
- `POST /gpg/latest/keys` - Create a GPG key
- `GET /api/latest/security/gpg-keys` - List GPG keys
- `POST /api/latest/security/gpg-keys` - Create GPG key
- `GET /api/latest/security/gpg-keys/{keyId}` - Get GPG key
- `DELETE /api/latest/security/gpg-keys/{keyId}` - Delete GPG key
- `GET /api/latest/security/ssh-keys` - List SSH keys
- `POST /api/latest/security/ssh-keys` - Create SSH key
- `GET /api/latest/security/ssh-keys/{keyId}` - Get SSH key
- `DELETE /api/latest/security/ssh-keys/{keyId}` - Delete SSH key
- `GET /api/latest/security/access-tokens` - List access tokens
- `POST /api/latest/security/access-tokens` - Create access token
- `GET /api/latest/security/access-tokens/{tokenId}` - Get access token
- `DELETE /api/latest/security/access-tokens/{tokenId}` - Delete access token
- `GET /api/latest/security/audit-logs` - List audit logs
- `GET /api/latest/security/security-settings` - Get security settings
- `PUT /api/latest/security/security-settings` - Update security settings

#### System Maintenance (20 endpoints) - Available since 7.16+
- `GET /rest/api/latest/admin/cluster` - Get cluster information
- `GET /rest/api/latest/admin/cluster/nodes` - List cluster nodes
- `GET /rest/api/latest/admin/cluster/nodes/{nodeId}` - Get cluster node
- `POST /rest/api/latest/admin/cluster/nodes/{nodeId}/maintenance` - Enable maintenance mode
- `DELETE /rest/api/latest/admin/cluster/nodes/{nodeId}/maintenance` - Disable maintenance mode
- `GET /rest/api/latest/admin/system-info` - Get system information
- `GET /rest/api/latest/admin/system-info/thread-dump` - Get thread dump
- `GET /rest/api/latest/admin/system-info/heap-dump` - Get heap dump
- `GET /rest/api/latest/admin/system-info/gc-info` - Get garbage collection info
- `GET /rest/api/latest/admin/system-info/performance` - Get performance metrics
- `GET /rest/api/latest/admin/system-info/database` - Get database information
- `GET /rest/api/latest/admin/system-info/cache` - Get cache information
- `POST /rest/api/latest/admin/system-info/cache/clear` - Clear cache
- `GET /rest/api/latest/admin/system-info/disk-usage` - Get disk usage
- `GET /rest/api/latest/admin/system-info/memory-usage` - Get memory usage
- `GET /rest/api/latest/admin/system-info/cpu-usage` - Get CPU usage
- `GET /rest/api/latest/admin/system-info/network` - Get network information
- `GET /rest/api/latest/admin/system-info/processes` - Get process information
- `POST /rest/api/latest/admin/system-info/restart` - Restart system
- `GET /rest/api/latest/admin/system-info/version` - Get system version

#### SAML Certificate Configuration (5 endpoints) - Available since 7.16+
- `GET /api/latest/admin/security/saml/certificates` - List SAML certificates
- `POST /api/latest/admin/security/saml/certificates` - Create SAML certificate
- `GET /api/latest/admin/security/saml/certificates/{certificateId}` - Get SAML certificate
- `PUT /api/latest/admin/security/saml/certificates/{certificateId}` - Update SAML certificate
- `DELETE /api/latest/admin/security/saml/certificates/{certificateId}` - Delete SAML certificate

#### Permission Management (8 endpoints) - Available since 7.16+
- `GET /api/latest/admin/permissions` - List all permissions
- `GET /api/latest/admin/permissions/users` - List user permissions
- `GET /api/latest/admin/permissions/groups` - List group permissions
- `POST /api/latest/admin/permissions/users` - Grant user permission
- `DELETE /api/latest/admin/permissions/users/{userId}` - Revoke user permission
- `POST /api/latest/admin/permissions/groups` - Grant group permission
- `DELETE /api/latest/admin/permissions/groups/{groupId}` - Revoke group permission
- `GET /api/latest/admin/permissions/effective` - Get effective permissions

#### Other Operations (25 endpoints) - Available since 7.16+
- `GET /api/latest/application-properties` - Get application properties
- `PUT /api/latest/application-properties` - Update application properties
- `GET /api/latest/application-properties/{key}` - Get application property
- `PUT /api/latest/application-properties/{key}` - Update application property
- `GET /api/latest/application-properties/{key}/value` - Get application property value
- `PUT /api/latest/application-properties/{key}/value` - Update application property value
- `GET /api/latest/application-properties/{key}/default` - Get application property default
- `GET /api/latest/application-properties/{key}/description` - Get application property description
- `GET /api/latest/application-properties/{key}/type` - Get application property type
- `GET /api/latest/application-properties/{key}/validation` - Get application property validation
- `GET /api/latest/application-properties/{key}/dependencies` - Get application property dependencies
- `GET /api/latest/application-properties/{key}/dependents` - Get application property dependents
- `GET /api/latest/application-properties/{key}/history` - Get application property history
- `GET /api/latest/application-properties/{key}/permissions` - Get application property permissions
- `PUT /api/latest/application-properties/{key}/permissions` - Update application property permissions
- `GET /api/latest/application-properties/{key}/users` - Get application property users
- `POST /api/latest/application-properties/{key}/users` - Add application property user
- `DELETE /api/latest/application-properties/{key}/users/{userId}` - Remove application property user
- `GET /api/latest/application-properties/{key}/groups` - Get application property groups
- `POST /api/latest/application-properties/{key}/groups` - Add application property group
- `DELETE /api/latest/application-properties/{key}/groups/{groupId}` - Remove application property group
- `GET /api/latest/application-properties/{key}/roles` - Get application property roles
- `POST /api/latest/application-properties/{key}/roles` - Add application property role
- `DELETE /api/latest/application-properties/{key}/roles/{roleId}` - Remove application property role
- `GET /api/latest/application-properties/{key}/audit` - Get application property audit log

## API Payload Definitions

### Authentication Endpoints

#### OAuth Token Exchange
- **Endpoint**: `POST /rest/api/1.0/oauth/access_token`
- **Request Body**:
  ```json
  {
    "grant_type": "authorization_code",
    "code": "string",
    "redirect_uri": "string",
    "client_id": "string",
    "client_secret": "string"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "string",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "string",
    "scope": "string"
  }
  ```

#### HTTP Token Management
- **Endpoint**: `GET /access-tokens/latest/users/{userSlug}/{tokenId}`
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "permissions": ["string"],
    "expiryDays": 30,
    "createdDate": "2024-01-01T00:00:00Z",
    "lastAccessDate": "2024-01-01T00:00:00Z"
  }
  ```

### Project Management Endpoints

#### Create Project
- **Endpoint**: `POST /rest/api/1.0/projects`
- **Request Body**:
  ```json
  {
    "key": "string",
    "name": "string",
    "description": "string",
    "avatar": "string",
    "isPublic": true
  }
  ```
- **Response**:
  ```json
  {
    "key": "string",
    "name": "string",
    "description": "string",
    "avatar": "string",
    "isPublic": true,
    "links": {
      "self": [{"href": "string"}]
    }
  }
  ```

### Repository Management Endpoints

#### Create Repository
- **Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos`
- **Request Body**:
  ```json
  {
    "name": "string",
    "scmId": "git",
    "forkable": true,
    "isPublic": true
  }
  ```
- **Response**:
  ```json
  {
    "slug": "string",
    "name": "string",
    "scmId": "git",
    "forkable": true,
    "isPublic": true,
    "links": {
      "self": [{"href": "string"}],
      "clone": [{"href": "string", "name": "string"}]
    }
  }
  ```

### Pull Request Management Endpoints

#### Create Pull Request
- **Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests`
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "fromRef": {
      "id": "refs/heads/feature-branch",
      "repository": {
        "slug": "string",
        "project": {"key": "string"}
      }
    },
    "toRef": {
      "id": "refs/heads/main",
      "repository": {
        "slug": "string",
        "project": {"key": "string"}
      }
    },
    "reviewers": [{"user": {"name": "string"}}]
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "version": 0,
    "title": "string",
    "description": "string",
    "state": "OPEN",
    "open": true,
    "closed": false,
    "createdDate": "2024-01-01T00:00:00Z",
    "updatedDate": "2024-01-01T00:00:00Z",
    "fromRef": {
      "id": "refs/heads/feature-branch",
      "displayId": "feature-branch",
      "latestCommit": "string"
    },
    "toRef": {
      "id": "refs/heads/main",
      "displayId": "main",
      "latestCommit": "string"
    },
    "author": {
      "user": {
        "name": "string",
        "emailAddress": "string",
      }
    }
  }
  ```

### Security Endpoints

#### Create GPG Key
- **Endpoint**: `POST /gpg/latest/keys`
- **Request Body**:
  ```json
  {
    "key": "string"
  }
  ```
- **Response**:
  ```json
  {
    "id": "string",
    "key": "string",
    "fingerprint": "string",
    "createdDate": "2024-01-01T00:00:00Z"
  }
  ```

### Dashboard Endpoints

#### Get Pull Request Suggestions
- **Endpoint**: `GET /api/latest/dashboard/pull-request-suggestions`
- **Query Parameters**:
  - `limit`: number (optional, default: 25)
  - `start`: number (optional, default: 0)
- **Response**:
  ```json
  {
    "size": 25,
    "limit": 25,
    "isLastPage": true,
    "values": [
      {
        "id": 1,
        "title": "string",
        "description": "string",
        "state": "OPEN",
        "author": {
          "user": {
            "name": "string",
            "emailAddress": "string"
          }
        },
        "fromRef": {
          "id": "refs/heads/feature-branch",
          "displayId": "feature-branch"
        },
        "toRef": {
          "id": "refs/heads/main",
          "displayId": "main"
        }
      }
    ]
  }
  ```

### Cloud API Endpoints (REST API 2.0)

#### Authentication (5 endpoints) - Available since API 2.0
- `POST /2.0/oauth/access_token` - OAuth token exchange
- `POST /2.0/oauth/revoke` - OAuth token revocation
- `GET /2.0/oauth/authorize` - OAuth authorization
- `GET /2.0/user` - Current user info
- `POST /2.0/session` - Session management

#### Workspace Management (14 endpoints) - Available since API 2.0
- `GET /2.0/workspaces` - List workspaces
- `GET /2.0/workspaces/{workspace}` - Get workspace
- `PUT /2.0/workspaces/{workspace}` - Update workspace
- `DELETE /2.0/workspaces/{workspace}` - Delete workspace
- `GET /2.0/workspaces/{workspace}/members` - List members
- `POST /2.0/workspaces/{workspace}/members` - Add member
- `DELETE /2.0/workspaces/{workspace}/members/{member}` - Remove member
- `GET /2.0/workspaces/{workspace}/permissions` - Get permissions
- `GET /2.0/workspaces/{workspace}/hooks` - List workspace hooks
- `POST /2.0/workspaces/{workspace}/hooks` - Create workspace hook
- `GET /2.0/workspaces/{workspace}/hooks/{uid}` - Get workspace hook
- `PUT /2.0/workspaces/{workspace}/hooks/{uid}` - Update workspace hook
- `DELETE /2.0/workspaces/{workspace}/hooks/{uid}` - Delete workspace hook
- `POST /2.0/workspaces/{workspace}/hooks/{uid}/test` - Test workspace hook

#### Repository Management (20 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}` - List repositories
- `POST /2.0/repositories/{workspace}` - Create repository
- `GET /2.0/repositories/{workspace}/{repo_slug}` - Get repository
- `PUT /2.0/repositories/{workspace}/{repo_slug}` - Update repository
- `DELETE /2.0/repositories/{workspace}/{repo_slug}` - Delete repository
- `GET /2.0/repositories/{workspace}/{repo_slug}/branches` - List branches
- `POST /2.0/repositories/{workspace}/{repo_slug}/branches` - Create branch
- `GET /2.0/repositories/{workspace}/{repo_slug}/tags` - List tags
- `POST /2.0/repositories/{workspace}/{repo_slug}/tags` - Create tag
- `GET /2.0/repositories/{workspace}/{repo_slug}/forks` - List forks
- `POST /2.0/repositories/{workspace}/{repo_slug}/forks` - Create fork
- `GET /2.0/repositories/{workspace}/{repo_slug}/permissions` - Get permissions
- `POST /2.0/repositories/{workspace}/{repo_slug}/permissions` - Add permission
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/permissions` - Remove permission
- `GET /2.0/repositories/{workspace}/{repo_slug}/settings` - Get settings
- `PUT /2.0/repositories/{workspace}/{repo_slug}/settings` - Update settings
- `GET /2.0/repositories/{workspace}/{repo_slug}/hooks` - List hooks
- `POST /2.0/repositories/{workspace}/{repo_slug}/hooks` - Create hook
- `GET /2.0/repositories/{workspace}/{repo_slug}/commits` - List commits
- `GET /2.0/repositories/{workspace}/{repo_slug}/commits/{commit}` - Get commit

#### Pull Request Management (18 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests` - List pull requests
- `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests` - Create pull request
- `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}` - Get pull request
- `PUT /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}` - Update pull request
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}` - Delete pull request
- `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments` - List comments
- `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments` - Create comment
- `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/activity` - List activities
- `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/diff` - Get diff
- `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/changes` - Get changes
- `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/merge` - Merge pull request
- `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/decline` - Decline pull request
- `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/reopen` - Reopen pull request
- `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/approve` - Get approval
- `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/approve` - Approve pull request
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/approve` - Remove approval
- `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/participants` - List participants
- `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/participants` - Add participant

#### Issue Tracking (25 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues` - List issues
- `POST /2.0/repositories/{workspace}/{repo_slug}/issues` - Create issue
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}` - Get issue
- `PUT /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}` - Update issue
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}` - Delete issue
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments` - List comments
- `POST /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments` - Create comment
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments/{comment_id}` - Get comment
- `PUT /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments/{comment_id}` - Update comment
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments/{comment_id}` - Delete comment
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/transitions` - List transitions
- `POST /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/transitions` - Transition issue
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/watchers` - List watchers
- `POST /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/watchers` - Add watcher
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/watchers/{username}` - Remove watcher
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments` - List attachments
- `POST /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments` - Upload attachment
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments/{path}` - Get attachment
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments/{path}` - Delete attachment
- `POST /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/vote` - Vote for issue
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/vote` - Remove vote
- `GET /2.0/repositories/{workspace}/{repo_slug}/components` - List components
- `POST /2.0/repositories/{workspace}/{repo_slug}/components` - Create component
- `GET /2.0/repositories/{workspace}/{repo_slug}/versions` - List versions
- `GET /2.0/repositories/{workspace}/{repo_slug}/milestones` - List milestones

#### Pipeline Management (20 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines` - List pipelines
- `POST /2.0/repositories/{workspace}/{repo_slug}/pipelines` - Trigger pipeline
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}` - Get pipeline
- `POST /2.0/repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/stop` - Stop pipeline
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps` - List steps
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}` - Get step
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}/log` - Get step log
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}/test_reports` - Get step test reports
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines_config` - Get pipelines configuration
- `PUT /2.0/repositories/{workspace}/{repo_slug}/pipelines_config` - Update pipelines configuration
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/variables` - List variables
- `POST /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/variables` - Create variable
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/variables/{variable_uuid}` - Get variable
- `PUT /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/variables/{variable_uuid}` - Update variable
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/variables/{variable_uuid}` - Delete variable
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/ssh/key_pair` - Get SSH key pair
- `PUT /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/ssh/key_pair` - Update SSH key pair
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/ssh/key_pair` - Delete SSH key pair
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts` - List known hosts
- `POST /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts` - Create known host

#### Webhooks (8 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/hooks` - List webhooks
- `POST /2.0/repositories/{workspace}/{repo_slug}/hooks` - Create webhook
- `GET /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}` - Get webhook
- `PUT /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}` - Update webhook
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}` - Delete webhook
- `GET /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}/events` - List events
- `POST /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}/events` - Add event
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}/events/{event}` - Remove event

#### Snippets (12 endpoints) - Available since API 2.0
- `GET /2.0/snippets` - List all public snippets
- `GET /2.0/snippets/{workspace}` - List workspace snippets
- `POST /2.0/snippets/{workspace}` - Create snippet
- `GET /2.0/snippets/{workspace}/{encoded_id}` - Get snippet
- `PUT /2.0/snippets/{workspace}/{encoded_id}` - Update snippet
- `DELETE /2.0/snippets/{workspace}/{encoded_id}` - Delete snippet
- `GET /2.0/snippets/{workspace}/{encoded_id}/comments` - List comments
- `POST /2.0/snippets/{workspace}/{encoded_id}/comments` - Create comment
- `GET /2.0/snippets/{workspace}/{encoded_id}/comments/{comment_id}` - Get comment
- `PUT /2.0/snippets/{workspace}/{encoded_id}/comments/{comment_id}` - Update comment
- `DELETE /2.0/snippets/{workspace}/{encoded_id}/comments/{comment_id}` - Delete comment
- `GET /2.0/snippets/{workspace}/{encoded_id}/watchers` - List watchers

#### SSH/GPG Keys (12 endpoints) - Available since API 2.0
- `GET /2.0/users/{selected_user}/ssh-keys` - List user SSH keys
- `POST /2.0/users/{selected_user}/ssh-keys` - Create user SSH key
- `GET /2.0/users/{selected_user}/ssh-keys/{key_id}` - Get user SSH key
- `PUT /2.0/users/{selected_user}/ssh-keys/{key_id}` - Update user SSH key
- `DELETE /2.0/users/{selected_user}/ssh-keys/{key_id}` - Delete user SSH key
- `GET /2.0/users/{selected_user}/gpg-keys` - List user GPG keys
- `POST /2.0/users/{selected_user}/gpg-keys` - Create user GPG key
- `GET /2.0/users/{selected_user}/gpg-keys/{key_id}` - Get user GPG key
- `DELETE /2.0/users/{selected_user}/gpg-keys/{key_id}` - Delete user GPG key
- `GET /2.0/workspaces/{workspace}/ssh-keys` - List workspace SSH keys
- `POST /2.0/workspaces/{workspace}/ssh-keys` - Create workspace SSH key
- `DELETE /2.0/workspaces/{workspace}/ssh-keys/{key_id}` - Delete workspace SSH key

#### Branch Restrictions (6 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions` - List restrictions
- `POST /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions` - Create restriction
- `GET /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions/{id}` - Get restriction
- `PUT /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions/{id}` - Update restriction
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions/{id}` - Delete restriction
- `GET /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions/{id}/bypass` - List bypasses

#### Commit Status (5 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses` - List statuses
- `POST /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build` - Create build status
- `POST /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses` - Create status
- `GET /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build/{key}` - Get build status
- `PUT /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build/{key}` - Update build status

#### Deployments (6 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/deployments` - List deployments
- `POST /2.0/repositories/{workspace}/{repo_slug}/deployments` - Create deployment
- `GET /2.0/repositories/{workspace}/{repo_slug}/deployments/{deployment_uuid}` - Get deployment
- `PUT /2.0/repositories/{workspace}/{repo_slug}/deployments/{deployment_uuid}` - Update deployment
- `GET /2.0/repositories/{workspace}/{repo_slug}/deployments_config/environments` - List environments
- `POST /2.0/repositories/{workspace}/{repo_slug}/deployments_config/environments` - Create environment

#### Downloads (5 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/downloads` - List downloads
- `POST /2.0/repositories/{workspace}/{repo_slug}/downloads` - Upload file
- `GET /2.0/repositories/{workspace}/{repo_slug}/downloads/{filename}` - Get download
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/downloads/{filename}` - Delete download
- `GET /2.0/repositories/{workspace}/{repo_slug}/downloads/{filename}/links` - Get download links

#### Cache (6 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/caches` - List caches
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/caches/{cache_uuid}` - Delete cache
- `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines_config/caches/{cache_uuid}/content-uri` - Get cache content URI
- `GET /2.0/workspaces/{workspace}/pipelines-config/caches` - List workspace caches
- `DELETE /2.0/workspaces/{workspace}/pipelines-config/caches/{cache_uuid}` - Delete workspace cache
- `GET /2.0/workspaces/{workspace}/pipelines-config/caches/{cache_uuid}/content-uri` - Get workspace cache content URI

#### Search (10 endpoints) - Available since API 2.0
- `GET /2.0/repositories` - Search repositories
- `GET /2.0/commits` - Search commits
- `GET /2.0/pullrequests` - Search pull requests
- `GET /2.0/code` - Search code
- `GET /2.0/users` - Search users
- `GET /2.0/teams` - Search teams
- `GET /2.0/snippets` - Search snippets
- `GET /2.0/issues` - Search issues
- `GET /2.0/search` - General search
- `GET /2.0/search/suggestions` - Get search suggestions

#### Dashboards (10 endpoints) - Available since API 2.0
- `GET /2.0/dashboards` - List dashboards
- `POST /2.0/dashboards` - Create dashboard
- `GET /2.0/dashboards/{dashboard_id}` - Get dashboard
- `PUT /2.0/dashboards/{dashboard_id}` - Update dashboard
- `DELETE /2.0/dashboards/{dashboard_id}` - Delete dashboard
- `POST /2.0/dashboards/{dashboard_id}/clone` - Clone dashboard
- `POST /2.0/dashboards/{dashboard_id}/widgets` - Add widget
- `PUT /2.0/dashboards/{dashboard_id}/widgets/{widget-id}` - Update widget
- `DELETE /2.0/dashboards/{dashboard_id}/widgets/{widget-id}` - Remove widget
- `GET /2.0/dashboards/widgets/available` - List available widgets

#### Add-ons (8 endpoints) - Available since API 2.0
- `GET /2.0/addon` - Get add-on information
- `GET /2.0/addon/linkers` - List linkers
- `GET /2.0/addon/linkers/{linker_key}` - Get linker
- `GET /2.0/addon/linkers/{linker_key}/values` - List linker values
- `POST /2.0/addon/linkers/{linker_key}/values` - Create linker value
- `GET /2.0/addon/linkers/{linker_key}/values/{linker_value_id}` - Get linker value
- `PUT /2.0/addon/linkers/{linker_key}/values/{linker_value_id}` - Update linker value
- `DELETE /2.0/addon/linkers/{linker_key}/values/{linker_value_id}` - Delete linker value

#### Reports (6 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/reports` - List reports
- `GET /2.0/repositories/{workspace}/{repo_slug}/reports/{report_id}` - Get report
- `GET /2.0/repositories/{workspace}/{repo_slug}/reports/{report_id}/commits/{commit}` - Get commit report
- `GET /2.0/repositories/{workspace}/{repo_slug}/reports/{report_id}/commits/{commit}/annotations` - List annotations
- `POST /2.0/repositories/{workspace}/{repo_slug}/reports/{report_id}/commits/{commit}/annotations` - Create annotation
- `GET /2.0/repositories/{workspace}/{repo_slug}/reports/{report_id}/commits/{commit}/annotations/{annotation_id}` - Get annotation

#### Source (12 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/src` - Get source files
- `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}` - Get file content
- `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}/history` - Get file history
- `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}/annotate` - Annotate file
- `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}/annotate/{revision}` - Annotate specific revision
- `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}/diff` - Get file diff
- `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}/diff/{revision}` - Get specific revision diff
- `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}/blame` - Get file blame
- `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}/blame/{revision}` - Get specific revision blame
- `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}/raw` - Get raw file content
- `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}/raw/{revision}` - Get specific revision raw content
- `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}/meta` - Get file metadata

#### Refs (15 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/refs` - List refs
- `GET /2.0/repositories/{workspace}/{repo_slug}/refs/branches` - List branches
- `GET /2.0/repositories/{workspace}/{repo_slug}/refs/branches/{name}` - Get branch
- `POST /2.0/repositories/{workspace}/{repo_slug}/refs/branches` - Create branch
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/refs/branches/{name}` - Delete branch
- `GET /2.0/repositories/{workspace}/{repo_slug}/refs/tags` - List tags
- `GET /2.0/repositories/{workspace}/{repo_slug}/refs/tags/{name}` - Get tag
- `POST /2.0/repositories/{workspace}/{repo_slug}/refs/tags` - Create tag
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/refs/tags/{name}` - Delete tag
- `GET /2.0/repositories/{workspace}/{repo_slug}/refs/forks` - List forks
- `POST /2.0/repositories/{workspace}/{repo_slug}/refs/forks` - Create fork
- `GET /2.0/repositories/{workspace}/{repo_slug}/refs/forks/{name}` - Get fork
- `GET /2.0/repositories/{workspace}/{repo_slug}/refs/commits` - List commits
- `GET /2.0/repositories/{workspace}/{repo_slug}/refs/commits/{commit}` - Get commit
- `GET /2.0/repositories/{workspace}/{repo_slug}/refs/commits/{commit}/diff` - Get commit diff

#### Branching Model (8 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/branching-model` - Get branching model
- `GET /2.0/repositories/{workspace}/{repo_slug}/branching-model/settings` - Get branching model settings
- `PUT /2.0/repositories/{workspace}/{repo_slug}/branching-model/settings` - Update branching model settings
- `GET /2.0/repositories/{workspace}/{repo_slug}/branching-model/branch-types` - List branch types
- `POST /2.0/repositories/{workspace}/{repo_slug}/branching-model/branch-types` - Create branch type
- `GET /2.0/repositories/{workspace}/{repo_slug}/branching-model/branch-types/{kind}` - Get branch type
- `PUT /2.0/repositories/{workspace}/{repo_slug}/branching-model/branch-types/{kind}` - Update branch type
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/branching-model/branch-types/{kind}` - Delete branch type

#### Projects (12 endpoints) - Available since API 2.0
- `GET /2.0/workspaces/{workspace}/projects` - List projects
- `POST /2.0/workspaces/{workspace}/projects` - Create project
- `GET /2.0/workspaces/{workspace}/projects/{project_key}` - Get project
- `PUT /2.0/workspaces/{workspace}/projects/{project_key}` - Update project
- `DELETE /2.0/workspaces/{workspace}/projects/{project_key}` - Delete project
- `GET /2.0/workspaces/{workspace}/projects/{project_key}/repositories` - List project repositories
- `GET /2.0/workspaces/{workspace}/projects/{project_key}/permissions` - Get project permissions
- `POST /2.0/workspaces/{workspace}/projects/{project_key}/permissions` - Add project permission
- `DELETE /2.0/workspaces/{workspace}/projects/{project_key}/permissions` - Remove project permission
- `GET /2.0/workspaces/{workspace}/projects/{project_key}/settings` - Get project settings
- `PUT /2.0/workspaces/{workspace}/projects/{project_key}/settings` - Update project settings
- `GET /2.0/workspaces/{workspace}/projects/{project_key}/hooks` - List project hooks

#### Users (10 endpoints) - Available since API 2.0
- `GET /2.0/user` - Get current user
- `GET /2.0/users/{username}` - Get user
- `PUT /2.0/users/{username}` - Update user
- `GET /2.0/users/{username}/repositories` - List user repositories
- `GET /2.0/users/{username}/workspaces` - List user workspaces
- `GET /2.0/users/{username}/permissions` - Get user permissions
- `GET /2.0/users/{username}/ssh-keys` - List user SSH keys
- `POST /2.0/users/{username}/ssh-keys` - Create user SSH key
- `GET /2.0/users/{username}/ssh-keys/{key_id}` - Get user SSH key
- `DELETE /2.0/users/{username}/ssh-keys/{key_id}` - Delete user SSH key

#### Teams (8 endpoints) - Available since API 2.0
- `GET /2.0/teams` - List teams
- `GET /2.0/teams/{username}` - Get team
- `PUT /2.0/teams/{username}` - Update team
- `GET /2.0/teams/{username}/members` - List team members
- `POST /2.0/teams/{username}/members` - Add team member
- `DELETE /2.0/teams/{username}/members/{member}` - Remove team member
- `GET /2.0/teams/{username}/permissions` - Get team permissions
- `GET /2.0/teams/{username}/repositories` - List team repositories

#### Other Operations (15 endpoints) - Available since API 2.0
- `GET /2.0/repositories/{workspace}/{repo_slug}/default-reviewers` - List default reviewers
- `POST /2.0/repositories/{workspace}/{repo_slug}/default-reviewers` - Add default reviewer
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/default-reviewers/{target_username}` - Remove default reviewer
- `GET /2.0/repositories/{workspace}/{repo_slug}/default-reviewers/{target_username}` - Get default reviewer
- `GET /2.0/repositories/{workspace}/{repo_slug}/watchers` - List watchers
- `POST /2.0/repositories/{workspace}/{repo_slug}/watchers` - Add watcher
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/watchers/{username}` - Remove watcher
- `GET /2.0/repositories/{workspace}/{repo_slug}/forks` - List forks
- `POST /2.0/repositories/{workspace}/{repo_slug}/forks` - Create fork
- `GET /2.0/repositories/{workspace}/{repo_slug}/forks/{fork_workspace}/{fork_slug}` - Get fork
- `GET /2.0/repositories/{workspace}/{repo_slug}/commits/{commit}/statuses` - List commit statuses
- `POST /2.0/repositories/{workspace}/{repo_slug}/commits/{commit}/statuses/build` - Create build status
- `GET /2.0/repositories/{workspace}/{repo_slug}/commits/{commit}/statuses/build/{key}` - Get build status
- `PUT /2.0/repositories/{workspace}/{repo_slug}/commits/{commit}/statuses/build/{key}` - Update build status
- `GET /2.0/repositories/{workspace}/{repo_slug}/commits/{commit}/approve` - Get commit approval

## API Payload Definitions (Cloud)

### Common Request/Response Structures

#### Repository Object
```json
{
  "type": "repository",
  "uuid": "{repository-uuid}",
  "name": "repository-name",
  "full_name": "workspace/repository-name",
  "description": "Repository description",
  "scm": "git",
  "website": "https://example.com",
  "language": "javascript",
  "is_private": true,
  "has_issues": true,
  "has_wiki": false,
  "fork_policy": "allow_forks",
  "created_on": "2023-01-01T00:00:00.000000+00:00",
  "updated_on": "2023-01-01T00:00:00.000000+00:00",
  "size": 1024,
  "parent": null,
  "clone_links": [
    {
      "name": "https",
      "href": "https://bitbucket.org/workspace/repository.git"
    },
    {
      "name": "ssh",
      "href": "git@bitbucket.org:workspace/repository.git"
    }
  ],
  "links": {
    "self": {
      "href": "https://api.bitbucket.org/2.0/repositories/workspace/repository"
    },
    "html": {
      "href": "https://bitbucket.org/workspace/repository"
    }
  },
  "workspace": {
    "type": "workspace",
    "uuid": "{workspace-uuid}",
    "name": "workspace-name",
    "slug": "workspace"
  },
  "project": {
    "type": "project",
    "uuid": "{project-uuid}",
    "name": "project-name",
    "key": "PROJ"
  }
}
```

#### Pull Request Object
```json
{
  "type": "pullrequest",
  "id": 1,
  "title": "Pull request title",
  "description": "Pull request description",
  "state": "OPEN",
  "author": {
    "type": "user",
    "uuid": "{user-uuid}",
    "display_name": "User Name",
    "account_id": "account-id"
  },
  "source": {
    "branch": {
      "name": "feature-branch"
    },
    "commit": {
      "hash": "commit-hash"
    },
    "repository": {
      "type": "repository",
      "name": "repository-name",
      "full_name": "workspace/repository-name"
    }
  },
  "destination": {
    "branch": {
      "name": "main"
    },
    "commit": {
      "hash": "commit-hash"
    },
    "repository": {
      "type": "repository",
      "name": "repository-name",
      "full_name": "workspace/repository-name"
    }
  },
  "reviewers": [
    {
      "type": "user",
      "uuid": "{user-uuid}",
      "display_name": "Reviewer Name",
      "account_id": "reviewer-account-id"
    }
  ],
  "participants": [
    {
      "type": "participant",
      "user": {
        "type": "user",
        "uuid": "{user-uuid}",
        "display_name": "Participant Name"
      },
      "role": "PARTICIPANT",
      "approved": false,
      "state": null,
      "participated_on": "2023-01-01T00:00:00.000000+00:00"
    }
  ],
  "created_on": "2023-01-01T00:00:00.000000+00:00",
  "updated_on": "2023-01-01T00:00:00.000000+00:00",
  "merge_commit": null,
  "close_source_branch": true,
  "closed_by": null,
  "reason": "",
  "comment_count": 0,
  "task_count": 0,
  "links": {
    "self": {
      "href": "https://api.bitbucket.org/2.0/repositories/workspace/repository/pullrequests/1"
    },
    "html": {
      "href": "https://bitbucket.org/workspace/repository/pull-requests/1"
    }
  }
}
```

#### Pipeline Object
```json
{
  "type": "pipeline",
  "uuid": "{pipeline-uuid}",
  "build_number": 1,
  "creator": {
    "type": "user",
    "uuid": "{user-uuid}",
    "display_name": "User Name",
    "account_id": "account-id"
  },
  "repository": {
    "type": "repository",
    "name": "repository-name",
    "full_name": "workspace/repository-name"
  },
  "target": {
    "type": "pipeline_ref_target",
    "ref_type": "branch",
    "ref_name": "main",
    "selector": {
      "type": "branches",
      "pattern": "main"
    }
  },
  "trigger": {
    "type": "pipeline_trigger_push",
    "name": "PUSH"
  },
  "state": {
    "type": "pipeline_state",
    "name": "IN_PROGRESS",
    "stage": {
      "type": "pipeline_stage",
      "name": "BUILDING"
    }
  },
  "created_on": "2023-01-01T00:00:00.000000+00:00",
  "completed_on": null,
  "run_number": 1,
  "duration_in_seconds": 0,
  "build_seconds_used": 0,
  "first_successful": true,
  "expired": false,
  "has_variables": false,
  "links": {
    "self": {
      "href": "https://api.bitbucket.org/2.0/repositories/workspace/repository/pipelines/{uuid}"
    }
  }
}
```

#### Webhook Object
```json
{
  "type": "webhook_subscription",
  "uuid": "{webhook-uuid}",
  "url": "https://example.com/webhook",
  "description": "Webhook description",
  "subject_type": "repository",
  "subject": {
    "type": "repository",
    "name": "repository-name",
    "full_name": "workspace/repository-name"
  },
  "active": true,
  "created_at": "2023-01-01T00:00:00.000000+00:00",
  "events": [
    "repo:push",
    "pullrequest:created",
    "pullrequest:updated",
    "pullrequest:approved",
    "pullrequest:unapproved",
    "pullrequest:fulfilled",
    "pullrequest:rejected"
  ],
  "links": {
    "self": {
      "href": "https://api.bitbucket.org/2.0/repositories/workspace/repository/hooks/{uuid}"
    }
  }
}
```

## API Features and Capabilities

### Authentication Methods
- **OAuth 2.0**: Authorization code flow, client credentials, refresh tokens
- **App Passwords**: User-specific tokens for API access
- **API Tokens**: Personal access tokens with scoped permissions
- **Basic Authentication**: Username/password for legacy systems
- **Session Management**: Cookie-based authentication for web applications

### Filter and Sort API Objects
- **Bitbucket Query Language (BBQL)**: Advanced filtering and sorting capabilities
- **Query Parameters**: Standard filtering using `q`, `sort`, `order` parameters
- **Field Selection**: Partial responses using `fields` parameter
- **Custom Filters**: Repository-specific and workspace-specific filtering

### Pagination
- **Standard Pagination**: Using `page` and `pagelen` parameters
- **Cursor-based Pagination**: For large datasets with `page` and `pagelen`
- **Response Metadata**: Includes `next`, `previous`, `size`, `page` information
- **Maximum Page Size**: Configurable limits per endpoint

### Partial Responses
- **Field Selection**: Request specific fields using `fields` parameter
- **Nested Field Access**: Access nested object properties
- **Performance Optimization**: Reduce payload size and improve response times
- **Default Fields**: Sensible defaults when no fields specified

### Schemas and Serialization
- **JSON Format**: All requests and responses use JSON
- **Content-Type**: `application/json` for all API interactions
- **Schema Validation**: Zod schemas for input/output validation
- **Error Format**: Consistent error response structure

### URI, UUID, and Structures
- **Resource URIs**: RESTful resource identification
- **UUID Support**: 64-bit integer IDs (currently supported)
- **Hierarchical Structure**: Workspace → Repository → Resource hierarchy
- **Slug-based URLs**: Human-readable resource identifiers

### CORS and Hypermedia
- **CORS Support**: Cross-origin resource sharing enabled
- **Hypermedia Links**: Self-describing API responses with navigation links
- **HATEOAS**: Hypermedia as the Engine of Application State
- **Link Relations**: Standard link relationship types

### Integrating with Bitbucket Cloud
- **REST API**: Full RESTful API access
- **Webhooks**: Event-driven notifications
- **OAuth Apps**: Third-party application integration
- **Rate Limiting**: API usage limits and quotas

## Version Compatibility

### Data Center
- **Supported Versions**: 7.16, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 8.13, 8.14, 8.15, 8.16, 8.17, 8.18, 8.19, 8.20, 8.21, 9.0, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.0
- **API Version**: 1.0
- **Features**: Projects, hooks, admin, advanced search (7.16+), enhanced admin (8.0+), dashboards (8.0+), builds and deployments (7.16+), capabilities (7.16+), content security policy (7.16+), deprecated endpoints (7.16+), Jira integration (7.16+), markup (7.16+), mirroring (7.16+), security (7.16+), system maintenance (7.16+), other operations (7.16+)

### Cloud
- **API Version**: 2.0
- **Updates**: 2024-2025 features
- **64-bit Integer IDs**: Supported (effective September 2025)
- **Features**: Workspaces, pipelines, issues, snippets, webhooks, SSH/GPG keys, branch restrictions, commit status, deployments, downloads, search, dashboards, add-ons, reports, source management, refs, branching model, projects, users, teams, default reviewers, watchers, forks

## Development Commands

```bash
# Install dependencies
npm install

# Build project
npm run build

# Development mode
npm run dev

# Start MCP server
npm start

# Run CLI client
npm run cli

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:contract

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Clean build artifacts
npm run clean

# Publishing
npm publish
```

## Package Configuration

### Dependencies
- **@modelcontextprotocol/sdk**: latest (official with Zod support)
- **axios**: ^1.7.0 (HTTP client)
- **zod**: ^3.23.0 (schema validation)
- **winston**: ^3.13.0 (logging)
- **commander**: ^12.0.0 (CLI)
- **express**: ^4.19.0 (HTTP server)
- **helmet**: ^7.1.0 (security)
- **cors**: ^2.8.5 (CORS support)
- **compression**: ^1.7.4 (response compression)
- **dotenv**: ^16.4.0 (environment variables)
- **i18next**: ^23.15.0 (internationalization)
- **lodash**: ^4.17.21 (utilities)
- **date-fns**: ^3.6.0 (date handling)
- **opossum**: ^8.0.0 (circuit breaker)
- **rate-limiter-flexible**: ^3.0.0 (rate limiting)
- **uuid**: ^10.0.0 (UUID generation)

### Development Dependencies
- **typescript**: ^5.3.0
- **jest**: ^29.7.0
- **eslint**: ^8.55.0
- **prettier**: ^3.1.0
- **husky**: ^9.1.7
- **lint-staged**: ^16.1.6
- **tsx**: ^4.6.0
- **supertest**: ^6.3.3

### Scripts
- **build**: TypeScript compilation
- **dev**: Development mode with hot reload
- **start**: Production server start
- **cli**: Console client execution
- **test**: Test suite execution
- **lint**: Code linting
- **format**: Code formatting
- **clean**: Build artifact cleanup
- **publish**: Package publishing

## License and Repository

- **License**: LGPL-3.0
- **Repository**: https://github.com/guercheLE/bitbucket-mcp-server.git
- **Issues**: https://github.com/guercheLE/bitbucket-mcp-server/issues
- **Homepage**: https://github.com/guercheLE/bitbucket-mcp-server#readme

## Policies and Procedures

### Fallback Procedures
- **Server Detection Failure**: Default to Data Center 7.16 with basic feature set
- **Authentication Failure**: Retry with next method in priority order, then fail gracefully
- **SSL Configuration Error**: Log error and continue with HTTP if `FORCE_HTTPS=false`
- **Cache Failure**: Fallback to direct API calls without caching
- **Rate Limit Exceeded**: Queue requests and retry with exponential backoff
- **Circuit Breaker Open**: Return cached responses or default error messages

### Deprecated Endpoints Policy
- **Maintenance Period**: Deprecated endpoints maintained for 12 months minimum
- **Removal Notice**: 6 months advance notice before removal
- **Migration Support**: Automatic migration tools provided when possible
- **Documentation**: Clear migration guides for breaking changes
- **Compatibility**: Backward compatibility maintained for at least 2 major versions

### Error Handling Policies
- **API Errors**: Return structured error responses with correlation IDs
- **Network Errors**: Automatic retry with exponential backoff (max 3 attempts)
- **Authentication Errors**: Clear error messages without exposing sensitive data
- **Rate Limit Errors**: Include retry-after headers and clear messaging
- **Validation Errors**: Detailed field-level error messages with examples

## Glossary of Technical Terms

### Core Concepts
- **MCP (Model Context Protocol)**: Official protocol for AI-tool communication
- **Tool Registration**: Process of making API endpoints available as MCP tools
- **Selective Registration**: Loading only compatible tools based on server capabilities
- **Server Detection**: Automatic identification of Bitbucket server type and version
- **Graceful Degradation**: System continues functioning with reduced capabilities

### Authentication Terms
- **OAuth 2.0**: Industry-standard authorization framework
- **App Passwords**: User-specific tokens for API access
- **Personal Access Tokens**: Scoped tokens with specific permissions
- **Basic Authentication**: Username/password authentication (legacy)

### Performance Terms
- **SLA (Service Level Agreement)**: Performance guarantees and metrics
- **TTL (Time To Live)**: Cache expiration time
- **Circuit Breaker**: Pattern to prevent cascading failures
- **Rate Limiting**: Control of request frequency per user/IP
- **Exponential Backoff**: Increasing delay between retry attempts

### Testing Terms
- **TDD (Test-Driven Development)**: Write tests before implementation
- **Contract Tests**: Verify API compliance and schema validation
- **Integration Tests**: Test inter-service communication
- **Unit Tests**: Test individual components in isolation
- **Line Coverage**: Percentage of code lines executed during tests

## Practical Configuration Examples

### Environment Configuration
```bash
# Production Configuration
BITBUCKET_BASE_URL=https://bitbucket.company.com
BITBUCKET_SERVER_TYPE=datacenter
BITBUCKET_API_VERSION=1.0
FORCE_HTTPS=true
CACHE_TTL=300
CACHE_MAX_SIZE=100MB
RATE_LIMIT_WINDOW=900
RATE_LIMIT_MAX_REQUESTS=1000
LOG_LEVEL=info
LOG_FORMAT=json

# Development Configuration
BITBUCKET_BASE_URL=http://localhost:7990
BITBUCKET_SERVER_TYPE=datacenter
FORCE_HTTPS=false
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

### Authentication Configuration
```bash
# OAuth 2.0 (Preferred)
BITBUCKET_OAUTH_CLIENT_ID=your_client_id
BITBUCKET_OAUTH_CLIENT_SECRET=your_client_secret
BITBUCKET_OAUTH_REDIRECT_URI=https://your-app.com/callback

# Personal Access Token (Fallback)
BITBUCKET_ACCESS_TOKEN=your_access_token

# App Password (Legacy)
BITBUCKET_USERNAME=your_username
BITBUCKET_APP_PASSWORD=your_app_password
```

### Cache Configuration
```bash
# In-Memory Cache
CACHE_ENABLED=true
CACHE_TTL=300
CACHE_MAX_SIZE=100MB

# Redis Cache (Distributed)
CACHE_ENABLED=true
CACHE_REDIS_URL=redis://localhost:6379
CACHE_TTL=300
CACHE_MAX_SIZE=100MB
```

## Detailed SLA Metrics

### Response Time Targets
- **CRUD Operations**: < 500ms (95th percentile)
- **Search Operations**: < 2s (95th percentile)
- **Bulk Operations**: < 30s (95th percentile)
- **Administrative Operations**: < 5min (95th percentile)
- **Long-running Operations**: < 15min (95th percentile)

### Availability Targets
- **API Endpoints**: 99.9% uptime
- **Authentication Service**: 99.95% uptime
- **Health Checks**: 99.99% uptime
- **Scheduled Maintenance**: < 4 hours per month

### Error Rate Targets
- **4xx Client Errors**: < 5% of total requests
- **5xx Server Errors**: < 0.1% of total requests
- **Authentication Failures**: < 1% of auth attempts
- **Rate Limit Hits**: < 2% of total requests

## Compatibility Matrix

### Data Center Version Support
| Version | API 1.0 | Features | Status |
|---------|---------|----------|--------|
| 7.16    | ✅      | Basic    | Supported |
| 8.0-8.5 | ✅      | Enhanced | Supported |
| 8.6-8.15| ✅      | Advanced | Supported |
| 8.16-8.21| ✅     | Latest   | Supported |
| 9.0-9.6 | ✅      | Latest   | Supported |
| 10.0    | ✅      | Latest   | Supported |

### Cloud API Support
| Feature | API 2.0 | 64-bit IDs | Status |
|---------|---------|------------|--------|
| Workspaces | ✅ | ✅ | Supported |
| Repositories | ✅ | ✅ | Supported |
| Pull Requests | ✅ | ✅ | Supported |
| Pipelines | ✅ | ✅ | Supported |
| Issues | ✅ | ✅ | Supported |
| Webhooks | ✅ | ✅ | Supported |

**Version**: 1.0.0 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-01-27

## Amendment History

### Amendment 1.0.1 - Template Synchronization (2025-01-27)
- **Scope**: Updated all project templates to reflect Constitution v1.0.0 requirements
- **Changes**:
  - Enhanced plan-template.md with complete Constitution Check section (Articles I-VII)
  - Updated spec-template.md with constitutional requirement clarifications
  - Modified tasks-template.md with TDD gates, versioning tasks, and YAGNI principles
  - Updated Cursor commands (plan.md, tasks.md) with constitutional compliance
  - Enhanced CURSOR.md with versioning strategy and simplicity principles
  - Verified llms.txt documentation completeness
  - Added template version footers for tracking
- **Impact**: All templates now fully compliant with Constitution v1.0.0
- **Validation**: Templates are self-contained and reference all constitutional requirements