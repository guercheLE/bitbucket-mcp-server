# Data Model: Bitbucket MCP Server

## Main Entities

### 1. BitbucketConfig
**Description**: Main Bitbucket server configuration

**Fields**:
- `baseUrl: string` - Bitbucket server base URL
- `serverType: 'cloud' | 'datacenter'` - Detected server type
- `auth: AuthConfig` - Authentication configuration
- `timeouts: TimeoutConfig` - Timeout configuration
- `rateLimit: RateLimitConfig` - Rate limiting configuration

**Validation**:
- `baseUrl` must be a valid URL
- `serverType` must be automatically detected
- `auth` must be valid for the server type

**State Transitions**: None (static configuration)

### 2. AuthConfig
**Description**: Authentication configuration based on server type

**Fields**:
- `type: 'oauth' | 'app_password' | 'api_token' | 'basic'`
- `credentials: AuthCredentials`
- `expiresAt?: Date` - For tokens with expiration

**Validation**:
- `type` must be compatible with `serverType`
- `credentials` must be valid for the chosen type

**State Transitions**:
- `active` → `expired` (when token expires)
- `active` → `invalid` (when credentials fail)

### 3. AuthCredentials
**Description**: Authentication credentials (union type)

**Variants**:
- **OAuth**: `{ accessToken: string, refreshToken?: string }`
- **App Password**: `{ username: string, appPassword: string }`
- **API Token**: `{ username: string, token: string }`
- **Basic**: `{ username: string, password: string }`

**Validation**:
- Required fields must be present
- Tokens must have valid format

### 4. Repository
**Description**: Bitbucket repository (Cloud and Data Center)

**Fields**:
- `id: integer` - Repository ID (Data Center) / `uuid: string` (Cloud)
- `slug: string` - Repository slug (Data Center)
- `name: string` - Repository name
- `scmId: string` - SCM ID (Data Center, defaults to 'git')
- `state: string` - Repository state
- `statusMessage?: string` - Status message
- `forkable: boolean` - Whether repository can be forked
- `public: boolean` - Whether the repository is public
- `project?: Project` - Associated project (Data Center)
- `workspace?: Workspace` - Associated workspace (Cloud)
- `links: RepositoryLinks` - Links for operations
  - `clone: CloneLink[]` - Clone links (HTTP, SSH)
  - `self: Link[]` - Self reference links

**Validation**:
- `name` must be valid for Bitbucket
- `slug` must be unique in project/workspace
- `public` must be boolean
- `forkable` must be boolean

**State Transitions**:
- `active` → `archived` (when archived)
- `active` → `deleted` (when deleted)

### 5. PullRequest
**Description**: Pull Request (Cloud and Data Center)

**Fields**:
- `id: integer` - Pull request ID
- `version: integer` - Pull request version
- `title: string` - PR title
- `description?: string` - PR description
- `state: string` - PR state (OPEN, DECLINED, MERGED, SUPERSEDED)
- `open: boolean` - Whether pull request is open
- `closed: boolean` - Whether pull request is closed
- `createdDate: integer` - Creation timestamp
- `updatedDate: integer` - Last update timestamp
- `fromRef: BranchRef` - Source branch reference
- `toRef: BranchRef` - Target branch reference
- `author: PullRequestAuthor` - PR author
- `reviewers: PullRequestReviewer[]` - Reviewers
- `repository: Repository` - Associated repository

**Validation**:
- `title` cannot be empty
- `fromRef` and `toRef` must be valid branch references
- `state` must be one of the valid values
- `version` must be positive integer

**State Transitions**:
- `OPEN` → `MERGED` (when merged)
- `OPEN` → `DECLINED` (when declined)
- `OPEN` → `SUPERSEDED` (when superseded)

### 6. Project (Data Center Only)
**Description**: Bitbucket Data Center project

**Fields**:
- `key: string` - Unique project key (max 10 characters)
- `id: integer` - Project ID
- `name: string` - Project name
- `description?: string` - Project description
- `public: boolean` - Whether the project is public
- `type: string` - Project type
- `links: ProjectLinks` - Links for operations
  - `self: Link[]` - Self reference links
  - `avatar: Link[]` - Avatar links

**Validation**:
- `key` must be unique and valid for Bitbucket (max 10 characters)
- `name` cannot be empty
- `public` must be boolean

**State Transitions**:
- `active` → `archived` (when archived)
- `active` → `deleted` (when deleted)

### 7. Issue (Cloud Only)
**Description**: Bitbucket Cloud issue

**Fields**:
- `id: number` - Issue ID
- `title: string` - Issue title
- `content?: string` - Issue content
- `state: 'new' | 'open' | 'resolved' | 'on_hold' | 'invalid' | 'duplicate' | 'wontfix' | 'closed'`
- `priority: 'trivial' | 'minor' | 'major' | 'critical' | 'blocker'`
- `kind: 'bug' | 'enhancement' | 'proposal' | 'task'`
- `assignee?: User` - Responsible user
- `reporter: User` - Reporting user
- `createdAt: Date` - Creation date
- `updatedAt: Date` - Last update date
- `repository: Repository` - Associated repository

**Validation**:
- `title` cannot be empty
- `state` must be one of the valid values
- `priority` and `kind` must be valid values

**State Transitions**:
- `new` → `open` (when accepted)
- `open` → `resolved` (when resolved)
- `resolved` → `closed` (when closed)
- Any state → `duplicate` (when marked as duplicate)

### 8. User
**Description**: Bitbucket user (Data Center and Cloud)

**Fields**:
- `id: integer` - Unique user ID (Data Center) / `uuid: string` (Cloud)
- `name: string` - Username
- `displayName: string` - Display name
- `emailAddress: string` - User email address
- `slug: string` - User slug (Data Center)
- `type: string` - User type
- `active: boolean` - Whether user is active
- `directoryName?: string` - Directory name (Data Center)
- `mutableDetails?: boolean` - Whether details are mutable (Data Center)
- `mutableGroups?: boolean` - Whether groups are mutable (Data Center)
- `lastAuthenticationTimestamp?: integer` - Last authentication timestamp (Data Center)
- `accountStatus?: 'active' | 'inactive' | 'closed'` - Account status (Cloud)
- `avatarUrl?: string` - Avatar URL (Cloud)

**Validation**:
- `name` must be unique
- `displayName` cannot be empty
- `emailAddress` must be valid email format
- `active` must be boolean

**State Transitions**:
- `active` → `inactive` (when disabled)
- `inactive` → `closed` (when account is closed)

### 9. OAuthToken (Data Center Only)
**Description**: OAuth token for Data Center authentication

**Fields**:
- `id: string` - Token ID
- `name: string` - Token name
- `createdDate: integer` - Creation timestamp
- `expiresDate?: integer` - Expiration timestamp
- `scopes: string[]` - Granted scopes
- `accessToken?: string` - Access token (for creation response)
- `tokenType?: string` - Token type (usually 'Bearer')
- `expiresIn?: integer` - Token expiration time in seconds
- `refreshToken?: string` - Refresh token for token renewal
- `scope?: string` - Granted scopes (for creation response)

**Validation**:
- `name` cannot be empty
- `scopes` must contain valid scope values
- `expiresDate` must be future timestamp if present

**State Transitions**:
- `active` → `expired` (when expires)
- `active` → `revoked` (when revoked)

### 10. Permission
**Description**: User or group permission on project or repository

**Fields**:
- `user?: User` - User with permission
- `group?: Group` - Group with permission
- `permission: string` - Permission level
  - Project: `PROJECT_READ`, `PROJECT_WRITE`, `PROJECT_ADMIN`
  - Repository: `REPO_READ`, `REPO_WRITE`, `REPO_ADMIN`

**Validation**:
- Either `user` or `group` must be present, not both
- `permission` must be valid for the context

**State Transitions**: None (static assignment)

### 11. BranchRef
**Description**: Branch reference in pull request

**Fields**:
- `id: string` - Branch ID
- `displayId: string` - Branch display ID
- `latestCommit: string` - Latest commit hash
- `repository: RepositoryRef` - Repository reference

**Validation**:
- `id` must be valid branch identifier
- `latestCommit` must be valid commit hash

**State Transitions**: None (immutable reference)

### 12. RepositoryRef
**Description**: Repository reference in branch or pull request

**Fields**:
- `slug: string` - Repository slug
- `name: string` - Repository name
- `project?: ProjectRef` - Project reference (Data Center)
- `workspace?: WorkspaceRef` - Workspace reference (Cloud)

**Validation**:
- `slug` and `name` cannot be empty
- Either `project` or `workspace` must be present

**State Transitions**: None (immutable reference)

### 13. ProjectRef
**Description**: Project reference

**Fields**:
- `key: string` - Project key
- `name: string` - Project name

**Validation**:
- `key` and `name` cannot be empty

**State Transitions**: None (immutable reference)

### 14. WorkspaceRef
**Description**: Workspace reference (Cloud)

**Fields**:
- `slug: string` - Workspace slug
- `name: string` - Workspace name

**Validation**:
- `slug` and `name` cannot be empty

**State Transitions**: None (immutable reference)

### 15. PullRequestAuthor
**Description**: Pull request author information

**Fields**:
- `user: User` - Author user

**Validation**:
- `user` must be valid

**State Transitions**: None (immutable)

### 16. PullRequestReviewer
**Description**: Pull request reviewer information

**Fields**:
- `user: User` - Reviewer user
- `approved: boolean` - Whether reviewer approved
- `status: string` - Reviewer status

**Validation**:
- `user` must be valid
- `approved` must be boolean

**State Transitions**:
- `pending` → `approved` | `needs_work` | `declined`

### 17. Group
**Description**: User group (Data Center)

**Fields**:
- `name: string` - Group name

**Validation**:
- `name` cannot be empty

**State Transitions**: None (static definition)

### 18. Link
**Description**: Hypermedia link

**Fields**:
- `href: string` - Link URL

**Validation**:
- `href` must be valid URL

**State Transitions**: None (immutable)

### 19. CloneLink
**Description**: Repository clone link

**Fields**:
- `href: string` - Clone URL
- `name: string` - Clone method (HTTP, SSH)

**Validation**:
- `href` must be valid URL
- `name` must be valid clone method

**State Transitions**: None (immutable)

### 20. MCPTool
**Description**: MCP tool with Zod schema validation

**Fields**:
- `name: string` - Tool name (pattern: mcp_bitbucket_[category]_[operation])
- `description: string` - Tool description
- `inputSchema: ZodSchema` - Zod schema for input validation
- `handler: ToolHandler` - Async function to execute the tool
- `serverType: ('cloud' | 'datacenter')[]` - Compatible server types
- `category: string` - Tool category (auth, repository, pull-request, etc.)
- `operation: string` - Specific operation (create, read, update, delete, list)

**Validation**:
- `name` must follow the established pattern
- `inputSchema` must be a valid Zod schema
- `handler` must be an async function
- `serverType` must contain at least one type

**State Transitions**: None (static definition)

### 10. Branch
**Description**: Git branch in repository

**Fields**:
- `id: string` - Branch ID
- `name: string` - Branch name
- `displayId: string` - Display ID
- `type: string` - Branch type
- `latestCommit: string` - Latest commit hash
- `isDefault: boolean` - Whether this is the default branch
- `repository: Repository` - Associated repository

**Validation**:
- `name` must be valid Git branch name
- `latestCommit` must be valid commit hash

**State Transitions**:
- `active` → `deleted` (when branch is deleted)

### 11. Tag
**Description**: Git tag in repository

**Fields**:
- `id: string` - Tag ID
- `name: string` - Tag name
- `displayId: string` - Display ID
- `type: string` - Tag type
- `latestCommit: string` - Latest commit hash
- `message?: string` - Tag message
- `repository: Repository` - Associated repository

**Validation**:
- `name` must be valid Git tag name
- `latestCommit` must be valid commit hash

**State Transitions**:
- `active` → `deleted` (when tag is deleted)

### 12. Commit
**Description**: Git commit

**Fields**:
- `id: string` - Commit hash
- `displayId: string` - Abbreviated commit hash
- `message: string` - Commit message
- `author: CommitAuthor` - Commit author
- `committer?: CommitAuthor` - Commit committer
- `authorTimestamp: number` - Author timestamp
- `committerTimestamp?: number` - Committer timestamp
- `parents: CommitParent[]` - Parent commits
- `repository: Repository` - Associated repository

**Validation**:
- `id` must be valid commit hash
- `message` cannot be empty
- `author` must be valid

**State Transitions**: None (immutable)

### 13. CommitAuthor
**Description**: Commit author information

**Fields**:
- `name: string` - Author name
- `emailAddress: string` - Author email
- `user?: User` - Associated user account

**Validation**:
- `name` cannot be empty
- `emailAddress` must be valid email format

### 14. Comment
**Description**: Comment on pull request or issue

**Fields**:
- `id: number` - Comment ID
- `text: string` - Comment text
- `author: User` - Comment author
- `createdAt: Date` - Creation date
- `updatedAt: Date` - Last update date
- `parent?: Comment` - Parent comment for replies
- `pullRequest?: PullRequest` - Associated pull request
- `issue?: Issue` - Associated issue

**Validation**:
- `text` cannot be empty
- Must be associated with either pull request or issue

**State Transitions**:
- `active` → `deleted` (when comment is deleted)

### 15. Webhook
**Description**: Repository webhook (Cloud only)

**Fields**:
- `uuid: string` - Webhook UUID
- `url: string` - Webhook URL
- `description?: string` - Webhook description
- `active: boolean` - Whether webhook is active
- `events: string[]` - Webhook event types
- `subject: WebhookSubject` - Webhook subject
- `createdAt: Date` - Creation date
- `updatedAt: Date` - Last update date

**Validation**:
- `url` must be valid URL
- `events` must contain valid event types

**State Transitions**:
- `active` → `inactive` (when disabled)
- `active` → `deleted` (when deleted)

### 16. Pipeline
**Description**: Bitbucket Pipelines (Cloud only)

**Fields**:
- `uuid: string` - Pipeline UUID
- `buildNumber: number` - Build number
- `creator: User` - Pipeline creator
- `target: PipelineTarget` - Pipeline target
- `state: PipelineState` - Pipeline state
- `createdAt: Date` - Creation date
- `completedAt?: Date` - Completion date
- `buildSecondsUsed: number` - Build seconds used
- `repository: Repository` - Associated repository

**Validation**:
- `buildNumber` must be positive
- `target` must be valid

**State Transitions**:
- `pending` → `in_progress` → `completed` | `failed` | `stopped`

### 17. PipelineStep
**Description**: Pipeline step

**Fields**:
- `uuid: string` - Step UUID
- `name: string` - Step name
- `state: PipelineState` - Step state
- `image?: PipelineImage` - Docker image
- `script: PipelineScript[]` - Step scripts
- `maxTime: number` - Maximum time in seconds
- `buildTimeSeconds: number` - Build time in seconds
- `createdAt: Date` - Creation date
- `startedAt?: Date` - Start date
- `completedAt?: Date` - Completion date

**Validation**:
- `name` cannot be empty
- `maxTime` must be positive

### 18. Snippet
**Description**: Code snippet (Cloud only)

**Fields**:
- `id: number` - Snippet ID
- `title: string` - Snippet title
- `scm: 'git' | 'hg'` - Source control management
- `isPrivate: boolean` - Whether snippet is private
- `owner: User` - Snippet owner
- `creator: User` - Snippet creator
- `createdAt: Date` - Creation date
- `updatedAt: Date` - Last update date

**Validation**:
- `title` cannot be empty
- `scm` must be valid type

**State Transitions**:
- `active` → `deleted` (when deleted)

### 19. SSHKey
**Description**: User SSH key (Cloud only)

**Fields**:
- `uuid: string` - SSH key UUID
- `key: string` - SSH public key
- `label: string` - SSH key label
- `createdAt: Date` - Creation date
- `lastUsed?: Date` - Last used date
- `user: User` - Associated user

**Validation**:
- `key` must be valid SSH public key
- `label` cannot be empty

**State Transitions**:
- `active` → `deleted` (when deleted)

### 20. GPGKey
**Description**: User GPG key (Cloud only)

**Fields**:
- `keyId: string` - GPG key ID
- `key: string` - GPG public key
- `createdAt: Date` - Creation date
- `user: User` - Associated user

**Validation**:
- `key` must be valid GPG public key
- `keyId` must be valid

**State Transitions**:
- `active` → `deleted` (when deleted)

### 21. BranchRestriction
**Description**: Branch restriction (Cloud only)

**Fields**:
- `id: number` - Restriction ID
- `kind: 'push' | 'delete' | 'force_push' | 'restrict_merges'` - Restriction kind
- `branchType: 'branch' | 'pattern' | 'model'` - Branch type
- `branchMatchKind?: 'glob' | 'regexp'` - Branch match kind
- `branchMatch?: string` - Branch pattern to match
- `users: User[]` - Allowed users
- `groups: Group[]` - Allowed groups

**Validation**:
- `kind` must be valid restriction type
- `branchType` must be valid

**State Transitions**:
- `active` → `deleted` (when deleted)

### 22. CommitStatus
**Description**: Commit status (Cloud only)

**Fields**:
- `key: string` - Status key
- `state: 'SUCCESSFUL' | 'FAILED' | 'INPROGRESS' | 'STOPPED'` - Status state
- `name?: string` - Status name
- `description?: string` - Status description
- `url?: string` - Status URL
- `createdAt: Date` - Creation date
- `updatedAt: Date` - Last update date

**Validation**:
- `key` must be unique
- `state` must be valid

**State Transitions**:
- `inprogress` → `successful` | `failed` | `stopped`

### 23. Deployment
**Description**: Deployment (Cloud only)

**Fields**:
- `uuid: string` - Deployment UUID
- `name: string` - Deployment name
- `key: string` - Deployment key
- `url?: string` - Deployment URL
- `state: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'STOPPED'` - Deployment state
- `environment: DeploymentEnvironment` - Deployment environment
- `release?: DeploymentRelease` - Associated release
- `createdAt: Date` - Creation date
- `updatedAt: Date` - Last update date

**Validation**:
- `name` cannot be empty
- `key` must be unique
- `state` must be valid

**State Transitions**:
- `pending` → `in_progress` → `completed` | `failed` | `stopped`

### 24. Download
**Description**: File download (Cloud only)

**Fields**:
- `name: string` - Download filename
- `path: string` - Download path
- `size: number` - File size in bytes
- `createdAt: Date` - Creation date

**Validation**:
- `name` cannot be empty
- `size` must be positive

**State Transitions**:
- `active` → `deleted` (when deleted)

### 25. CLICommand
**Description**: CLI command

**Fields**:
- `name: string` - Command name
- `description: string` - Command description
- `category: string` - Command category
- `options: CommandOption[]` - Command options
- `arguments: CommandArgument[]` - Command arguments
- `handler: CommandHandler` - Processing function
- `serverType: ('cloud' | 'datacenter')[]` - Compatible server types

**Validation**:
- `name` must be unique within the category
- `handler` must be a valid function

**State Transitions**: None (static definition)

## Relationships

### 1. Repository ↔ User
- **Type**: Many-to-Many
- **Description**: Users can have access to multiple repositories
- **Relationship Fields**: `permissions`, `role`

### 2. Repository ↔ PullRequest
- **Type**: One-to-Many
- **Description**: A repository can have multiple pull requests
- **Relationship Fields**: `repository.id`

### 3. Repository ↔ Issue (Cloud Only)
- **Type**: One-to-Many
- **Description**: A repository can have multiple issues
- **Relationship Fields**: `repository.id`

### 4. Repository ↔ Branch
- **Type**: One-to-Many
- **Description**: A repository can have multiple branches
- **Relationship Fields**: `repository.id`

### 5. Repository ↔ Tag
- **Type**: One-to-Many
- **Description**: A repository can have multiple tags
- **Relationship Fields**: `repository.id`

### 6. Repository ↔ Commit
- **Type**: One-to-Many
- **Description**: A repository can have multiple commits
- **Relationship Fields**: `repository.id`

### 7. Repository ↔ Webhook (Cloud Only)
- **Type**: One-to-Many
- **Description**: A repository can have multiple webhooks
- **Relationship Fields**: `repository.id`

### 8. Repository ↔ Pipeline (Cloud Only)
- **Type**: One-to-Many
- **Description**: A repository can have multiple pipelines
- **Relationship Fields**: `repository.id`

### 9. Repository ↔ Deployment (Cloud Only)
- **Type**: One-to-Many
- **Description**: A repository can have multiple deployments
- **Relationship Fields**: `repository.id`

### 10. Repository ↔ Download (Cloud Only)
- **Type**: One-to-Many
- **Description**: A repository can have multiple downloads
- **Relationship Fields**: `repository.id`

### 11. Repository ↔ BranchRestriction (Cloud Only)
- **Type**: One-to-Many
- **Description**: A repository can have multiple branch restrictions
- **Relationship Fields**: `repository.id`

### 12. Project ↔ Repository (Data Center Only)
- **Type**: One-to-Many
- **Description**: A project can contain multiple repositories
- **Relationship Fields**: `project.key`

### 13. User ↔ PullRequest
- **Type**: Many-to-Many
- **Description**: Users can be authors or reviewers of pull requests
- **Relationship Fields**: `author`, `reviewers[]`

### 14. User ↔ Issue
- **Type**: Many-to-Many
- **Description**: Users can be assignees or reporters of issues
- **Relationship Fields**: `assignee`, `reporter`

### 15. User ↔ Comment
- **Type**: One-to-Many
- **Description**: Users can create multiple comments
- **Relationship Fields**: `author`

### 16. User ↔ SSHKey (Cloud Only)
- **Type**: One-to-Many
- **Description**: Users can have multiple SSH keys
- **Relationship Fields**: `user`

### 17. User ↔ GPGKey (Cloud Only)
- **Type**: One-to-Many
- **Description**: Users can have multiple GPG keys
- **Relationship Fields**: `user`

### 18. User ↔ Snippet (Cloud Only)
- **Type**: One-to-Many
- **Description**: Users can own multiple snippets
- **Relationship Fields**: `owner`, `creator`

### 19. User ↔ Pipeline (Cloud Only)
- **Type**: One-to-Many
- **Description**: Users can create multiple pipelines
- **Relationship Fields**: `creator`

### 20. PullRequest ↔ Comment
- **Type**: One-to-Many
- **Description**: Pull requests can have multiple comments
- **Relationship Fields**: `pullRequest`

### 21. Issue ↔ Comment
- **Type**: One-to-Many
- **Description**: Issues can have multiple comments
- **Relationship Fields**: `issue`

### 22. Pipeline ↔ PipelineStep
- **Type**: One-to-Many
- **Description**: Pipelines can have multiple steps
- **Relationship Fields**: `pipeline.uuid`

### 23. Commit ↔ CommitStatus (Cloud Only)
- **Type**: One-to-Many
- **Description**: Commits can have multiple statuses
- **Relationship Fields**: `commit.id`

### 24. Branch ↔ Commit
- **Type**: One-to-Many
- **Description**: Branches can have multiple commits
- **Relationship Fields**: `latestCommit`

### 25. Tag ↔ Commit
- **Type**: One-to-One
- **Description**: Tags point to specific commits
- **Relationship Fields**: `latestCommit`

### 26. User ↔ OAuthToken (Data Center Only)
- **Type**: One-to-Many
- **Description**: Users can have multiple OAuth tokens
- **Relationship Fields**: `user` (implicit)

### 27. Project ↔ Permission (Data Center Only)
- **Type**: One-to-Many
- **Description**: Projects can have multiple permissions
- **Relationship Fields**: `projectKey`

### 28. Repository ↔ Permission
- **Type**: One-to-Many
- **Description**: Repositories can have multiple permissions
- **Relationship Fields**: `repositorySlug`

### 29. User ↔ Permission
- **Type**: One-to-Many
- **Description**: Users can have multiple permissions
- **Relationship Fields**: `user.name`

### 30. Group ↔ Permission (Data Center Only)
- **Type**: One-to-Many
- **Description**: Groups can have multiple permissions
- **Relationship Fields**: `group.name`

### 31. PullRequest ↔ BranchRef
- **Type**: One-to-Two
- **Description**: Pull requests reference source and target branches
- **Relationship Fields**: `fromRef`, `toRef`

### 32. BranchRef ↔ RepositoryRef
- **Type**: Many-to-One
- **Description**: Branch references belong to repositories
- **Relationship Fields**: `repository`

### 33. RepositoryRef ↔ ProjectRef (Data Center Only)
- **Type**: Many-to-One
- **Description**: Repository references belong to projects
- **Relationship Fields**: `project`

### 34. RepositoryRef ↔ WorkspaceRef (Cloud Only)
- **Type**: Many-to-One
- **Description**: Repository references belong to workspaces
- **Relationship Fields**: `workspace`

### 35. PullRequest ↔ PullRequestAuthor
- **Type**: One-to-One
- **Description**: Pull requests have one author
- **Relationship Fields**: `author`

### 36. PullRequest ↔ PullRequestReviewer
- **Type**: One-to-Many
- **Description**: Pull requests can have multiple reviewers
- **Relationship Fields**: `reviewers[]`

### 37. User ↔ PullRequestAuthor
- **Type**: One-to-Many
- **Description**: Users can be authors of multiple pull requests
- **Relationship Fields**: `user`

### 38. User ↔ PullRequestReviewer
- **Type**: One-to-Many
- **Description**: Users can be reviewers of multiple pull requests
- **Relationship Fields**: `user`

## Business Validations

### 1. Server Detection
- URLs containing `bitbucket.org` → Cloud
- Custom URLs → Data Center
- Connectivity validation before loading tools
- Automatic tool loading based on server type

### 2. Authentication
- **Cloud**: OAuth 2.0 > App Password > API Token
- **Data Center**: OAuth Token > API Token > Personal Access Token > Basic Auth
- Credential validation before operations
- Token expiration handling and refresh

### 3. Rate Limiting
- Respect Bitbucket API limits
- Implement retry with exponential backoff
- Log attempts and failures
- Queue management for high-volume operations

### 4. Input Validation
- Zod schemas for all inputs
- Type and format validation
- Required field validation
- Sensitive data sanitization
- URL parameter validation

### 5. Error Handling
- API error code mapping
- User-friendly error messages
- Structured logs for debugging
- HTTP status code handling
- Network timeout handling

### 6. Data Validation
- **Project Key**: Max 10 characters, unique
- **Repository Slug**: Valid Git repository name
- **Branch Names**: Valid Git branch names
- **Tag Names**: Valid Git tag names
- **Email Addresses**: Valid email format
- **URLs**: Valid URL format
- **Timestamps**: Valid Unix timestamps

### 7. Permission Validation
- **Project Permissions**: PROJECT_READ, PROJECT_WRITE, PROJECT_ADMIN
- **Repository Permissions**: REPO_READ, REPO_WRITE, REPO_ADMIN
- User/Group permission validation
- Permission inheritance rules

### 8. State Validation
- **Pull Request States**: OPEN, DECLINED, MERGED, SUPERSEDED
- **Issue States**: new, open, resolved, on_hold, invalid, duplicate, wontfix, closed
- **Pipeline States**: pending, in_progress, completed, failed, stopped
- State transition validation

## Performance Constraints

### 1. Timeouts
- Read operations: 2 seconds
- Write operations: 5 seconds
- Configurable via environment

### 2. Pagination
- Support for pagination of large lists
- Default limit of 50 items per page
- Configurable via parameters

### 3. Cache
- Server configuration cache
- User information cache
- Configurable TTL

### 4. Concurrency
- Limit of simultaneous requests
- HTTP connection pool
- Queue for critical operations
