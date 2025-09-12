# Tasks: Node.js Bitbucket MCP Server with Integrated Console Client

**Input**: Design documents from `/specs/002-comprehensive-bitbucket-api/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: Node.js 18+, TypeScript, @modelcontextprotocol/sdk, Zod, Axios, Commander.js, Jest
   → Structure: Single project with src/, tests/ at repository root
2. Load optional design documents:
   → data-model.md: 25 entities → model tasks
   → contracts/: 2 files → contract test tasks
   → research.md: Technical decisions → setup tasks
   → quickstart.md: User scenarios → integration tests
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands, MCP tools
   → Integration: API connections, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All 160+ endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- Structure: `src/server/`, `src/client/`, `src/tools/`, `src/services/`, `src/types/`, `src/utils/`

## Phase 3.1: Setup
- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize Node.js project with TypeScript and dependencies (@modelcontextprotocol/sdk, zod, axios, commander, jest, winston)
- [ ] T003 [P] Configure TypeScript, ESLint, Prettier in tsconfig.json, .eslintrc.js, .prettierrc
- [ ] T004 [P] Setup Jest testing framework with coverage > 80% in jest.config.js
- [ ] T005 [P] Create environment configuration files (.env.example, env.example)
- [ ] T006 [P] Setup HTTP logging and sanitization utilities in src/utils/http-logger.ts, src/utils/stderr-logger.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T007 [P] Contract test MCP Server API in tests/contract/test-mcp-server-api.ts
- [ ] T008 [P] Contract test CLI Commands API in tests/contract/test-cli-commands-api.ts
- [ ] T009 [P] Integration test Bitbucket Cloud authentication in tests/integration/test-cloud-auth.ts
- [ ] T010 [P] Integration test Bitbucket Data Center authentication in tests/integration/test-datacenter-auth.ts
- [ ] T011 [P] Integration test repository CRUD operations in tests/integration/test-repository-crud.ts
- [ ] T012 [P] Integration test pull request operations in tests/integration/test-pull-request-ops.ts
- [ ] T013 [P] Integration test server type detection in tests/integration/test-server-detection.ts
- [ ] T014 [P] Integration test tool loading in tests/integration/test-tool-loading.ts
- [ ] T015 [P] Integration test CLI client functionality in tests/integration/test-cli-client.ts
- [ ] T016 [P] Integration test HTTP logging and sanitization in tests/integration/test-http-logging.ts

## Phase 3.3: Core Types & Models (ONLY after tests are failing)
- [ ] T017 [P] Create BitbucketConfig and AuthConfig types with Zod schemas in src/types/config.ts
- [ ] T018 [P] Create Repository, PullRequest, User types with Zod schemas in src/types/bitbucket.ts
- [ ] T019 [P] Create Project and Issue types (server-specific) with Zod schemas in src/types/entities.ts
- [ ] T020 [P] Create MCPTool and CLICommand types with Zod validation in src/types/mcp.ts
- [ ] T021 [P] Create error handling and validation types with Zod schemas in src/types/errors.ts
- [ ] T022 [P] Create HTTP logging and sanitization types in src/types/logging.ts
- [ ] T023 [P] Create Cloud-specific types (Webhook, Pipeline, Snippet, etc.) in src/types/cloud.ts
- [ ] T024 [P] Create Data Center-specific types (OAuthToken, Permission, Group, etc.) in src/types/datacenter.ts
- [ ] T025 [P] Create localization types and language support schemas in src/types/localization.ts

## Phase 3.4: Core Services
- [ ] T026 Implement BitbucketAPIService with Cloud/DC detection in src/services/bitbucket-api.service.ts
- [ ] T027 Implement AuthService with multiple auth methods in src/services/auth.service.ts
- [ ] T028 Implement ConfigService for environment management in src/services/config.service.ts
- [ ] T029 Implement LoggerService with structured logging in src/services/logger.service.ts
- [ ] T030 Implement ErrorHandlerService with proper error mapping in src/services/error-handler.service.ts
- [ ] T031 Implement HTTPLoggerService with sensitive data sanitization in src/services/http-logger.service.ts
- [ ] T032 Implement LocalizationService with 20-language support in src/services/localization.service.ts

## Phase 3.5: MCP Tools - Cloud [P]
- [ ] T033 [P] Implement Cloud authentication tools (OAuth, App Password, API Token) in src/tools/cloud/auth/
- [ ] T034 [P] Implement Cloud repository tools (CRUD operations, branches, tags) in src/tools/cloud/repository/
- [ ] T035 [P] Implement Cloud pull request tools (create, merge, decline, comments) in src/tools/cloud/pull-request/
- [ ] T036 [P] Implement Cloud issue tools (create, update, list, comments) in src/tools/cloud/issue/
- [ ] T037 [P] Implement Cloud pipeline tools (trigger, monitor, steps) in src/tools/cloud/pipeline/
- [ ] T038 [P] Implement Cloud webhook tools (create, update, delete, list) in src/tools/cloud/webhook/
- [ ] T039 [P] Implement Cloud snippet tools (create, update, delete, list) in src/tools/cloud/snippet/
- [ ] T040 [P] Implement Cloud SSH/GPG key tools (create, delete, list) in src/tools/cloud/keys/

## Phase 3.6: MCP Tools - Data Center [P]
- [ ] T041 [P] Implement DC authentication tools (OAuth Token, API Token, Basic) in src/tools/datacenter/auth/
- [ ] T042 [P] Implement DC repository tools (CRUD operations, branches, tags) in src/tools/datacenter/repository/
- [ ] T043 [P] Implement DC pull request tools (create, merge, decline, comments) in src/tools/datacenter/pull-request/
- [ ] T044 [P] Implement DC project tools (create, update, delete, list, permissions) in src/tools/datacenter/project/
- [ ] T045 [P] Implement DC security tools (permissions, access control) in src/tools/datacenter/security/
- [ ] T046 [P] Implement DC OAuth token management tools in src/tools/datacenter/oauth/
- [ ] T047 [P] Implement DC user and group management tools in src/tools/datacenter/user/

## Phase 3.7: MCP Server
- [ ] T048 Implement MCPServer with selective tool loading in src/server/mcp-server.ts
- [ ] T049 Implement tool loader with server type detection in src/server/tool-loader.ts
- [ ] T050 Implement server startup and configuration in src/server/server-manager.ts
- [ ] T051 Implement server health checks and monitoring in src/server/health-check.ts

## Phase 3.8: CLI Client
- [ ] T052 Implement CLI framework with Commander.js and nested commands in src/cli/console-client.ts
- [ ] T053 [P] Implement authentication commands (login, logout, status, OAuth) in src/cli/commands/auth.ts
- [ ] T054 [P] Implement repository commands (list, create, get, update, delete, branches, tags) in src/cli/commands/repository.ts
- [ ] T055 [P] Implement pull request commands (list, create, merge, decline, comments) in src/cli/commands/pull-request.ts
- [ ] T056 [P] Implement project commands (Data Center: list, create, update, delete, permissions) in src/cli/commands/project.ts
- [ ] T057 [P] Implement issue commands (Cloud: list, create, update, delete, comments) in src/cli/commands/issue.ts
- [ ] T058 [P] Implement search commands (commits, code, repositories, users) in src/cli/commands/search.ts
- [ ] T059 [P] Implement Cloud-specific commands (webhook, pipeline, snippet, SSH/GPG keys) in src/cli/commands/cloud/
- [ ] T060 [P] Implement Data Center-specific commands (permissions, OAuth, admin) in src/cli/commands/datacenter/
- [ ] T061 [P] Implement output formatters (JSON, table, human-readable) and language support in src/cli/formatters/

## Phase 3.9: Integration & Polish
- [ ] T062 Connect services to Bitbucket API with proper error handling
- [ ] T063 Implement rate limiting and retry logic in src/integration/rate-limiter.ts
- [ ] T064 Add request/response logging middleware with sanitization in src/integration/middleware.ts
- [ ] T065 Implement configuration validation and environment setup
- [ ] T066 Add server type detection and tool loading logic
- [ ] T067 Implement CLI command registration and help system with language support
- [ ] T068 [P] Create comprehensive unit tests for all components in tests/unit/
- [ ] T069 Performance testing (<2s read, <5s write operations)
- [ ] T070 [P] Create comprehensive README with examples in README.md
- [ ] T071 [P] Create API documentation with OpenAPI specs in docs/API.md
- [ ] T072 [P] Create troubleshooting guide in docs/TROUBLESHOOTING.md
- [ ] T073 [P] Create deployment and configuration guide in docs/DEPLOYMENT.md
- [ ] T074 Final testing and validation
- [ ] T075 Code optimization and cleanup

## Dependencies
- Tests (T007-T016) before implementation (T017-T075)
- T017-T025 blocks T026-T032
- T026-T032 blocks T033-T047
- T033-T047 blocks T048-T051
- T048-T051 blocks T052-T061
- T052-T061 blocks T062-T075
- Implementation before polish (T068-T075)

## Parallel Examples
```
# Launch T007-T016 together (Contract & Integration Tests):
Task: "Contract test MCP Server API in tests/contract/test-mcp-server-api.ts"
Task: "Contract test CLI Commands API in tests/contract/test-cli-commands-api.ts"
Task: "Integration test Bitbucket Cloud authentication in tests/integration/test-cloud-auth.ts"
Task: "Integration test Bitbucket Data Center authentication in tests/integration/test-datacenter-auth.ts"
Task: "Integration test repository CRUD operations in tests/integration/test-repository-crud.ts"
Task: "Integration test pull request operations in tests/integration/test-pull-request-ops.ts"
Task: "Integration test server type detection in tests/integration/test-server-detection.ts"
Task: "Integration test tool loading in tests/integration/test-tool-loading.ts"
Task: "Integration test CLI client functionality in tests/integration/test-cli-client.ts"
Task: "Integration test HTTP logging and sanitization in tests/integration/test-http-logging.ts"

# Launch T017-T025 together (Core Types & Models):
Task: "Create BitbucketConfig and AuthConfig types with Zod schemas in src/types/config.ts"
Task: "Create Repository, PullRequest, User types with Zod schemas in src/types/bitbucket.ts"
Task: "Create Project and Issue types (server-specific) with Zod schemas in src/types/entities.ts"
Task: "Create MCPTool and CLICommand types with Zod validation in src/types/mcp.ts"
Task: "Create error handling and validation types with Zod schemas in src/types/errors.ts"
Task: "Create HTTP logging and sanitization types in src/types/logging.ts"
Task: "Create Cloud-specific types (Webhook, Pipeline, Snippet, etc.) in src/types/cloud.ts"
Task: "Create Data Center-specific types (OAuthToken, Permission, Group, etc.) in src/types/datacenter.ts"
Task: "Create localization types and language support schemas in src/types/localization.ts"

# Launch T033-T040 together (Cloud MCP Tools):
Task: "Implement Cloud authentication tools in src/tools/cloud/auth/"
Task: "Implement Cloud repository tools in src/tools/cloud/repository/"
Task: "Implement Cloud pull request tools in src/tools/cloud/pull-request/"
Task: "Implement Cloud issue tools in src/tools/cloud/issue/"
Task: "Implement Cloud pipeline tools in src/tools/cloud/pipeline/"
Task: "Implement Cloud webhook tools in src/tools/cloud/webhook/"
Task: "Implement Cloud snippet tools in src/tools/cloud/snippet/"
Task: "Implement Cloud SSH/GPG key tools in src/tools/cloud/keys/"

# Launch T041-T047 together (Data Center MCP Tools):
Task: "Implement DC authentication tools in src/tools/datacenter/auth/"
Task: "Implement DC repository tools in src/tools/datacenter/repository/"
Task: "Implement DC pull request tools in src/tools/datacenter/pull-request/"
Task: "Implement DC project tools in src/tools/datacenter/project/"
Task: "Implement DC security tools in src/tools/datacenter/security/"
Task: "Implement DC OAuth token management tools in src/tools/datacenter/oauth/"
Task: "Implement DC user and group management tools in src/tools/datacenter/user/"

# Launch T053-T061 together (CLI Commands):
Task: "Implement authentication commands in src/cli/commands/auth.ts"
Task: "Implement repository commands in src/cli/commands/repository.ts"
Task: "Implement pull request commands in src/cli/commands/pull-request.ts"
Task: "Implement project commands in src/cli/commands/project.ts"
Task: "Implement issue commands in src/cli/commands/issue.ts"
Task: "Implement search commands in src/cli/commands/search.ts"
Task: "Implement Cloud-specific commands in src/cli/commands/cloud/"
Task: "Implement Data Center-specific commands in src/cli/commands/datacenter/"
Task: "Implement output formatters in src/cli/formatters/"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Each MCP tool covers 160+ endpoints from both Cloud and Data Center APIs
- CLI commands support 20 languages with nested Commander.js structure
- HTTP logging includes sensitive data sanitization for script generation

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - MCP Server API contract → contract test task [P]
   - CLI Commands API contract → contract test task [P]
   
2. **From Data Model**:
   - 25 entities → model creation tasks [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Authentication scenarios → integration tests [P]
   - Repository operations → integration tests [P]
   - Pull request operations → integration tests [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Tools → Server → CLI → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests
- [x] All 25 entities have model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] 160+ endpoints covered across Cloud and Data Center tools
- [x] CLI commands support 20 languages with nested structure
- [x] HTTP logging with sanitization included
- [x] Server type detection and selective tool loading covered