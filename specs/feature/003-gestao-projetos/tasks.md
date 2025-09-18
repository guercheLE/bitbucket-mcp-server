# Tasks: Gestão de Projetos e Repositórios

**Input**: Design documents from `/specs/003-gestao-projetos/`
**Prerequisites**: plan.md (required), research.md, data-model.md, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: TypeScript 5.0+, Node.js 18+, @modelcontextprotocol/sdk, Zod, Axios, Winston, Commander.js, Jest
2. Load design documents:
   → data-model.md: Extract 6 entities (Project, Workspace, Repository, Permission, Webhook, Avatar)
   → quickstart.md: Extract 5 test scenarios for validation
   → research.md: Extract technical decisions and dependencies
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests, entity tests
   → Core: models, services, MCP tools
   → Integration: authentication, transports, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD - Constitution Article V)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All entities have models and tests
   → All scenarios have integration tests
   → All MCP tools implemented
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **MCP Server**: `src/`, `tests/` at repository root
- **Tools**: `src/tools/datacenter/`, `src/tools/cloud/`, `src/tools/shared/`
- **Services**: `src/services/`
- **Types**: `src/types/`

## Phase 3.1: Setup
- [ ] T001 Create Bitbucket MCP Server structure per constitution
- [ ] T002 Initialize TypeScript project with MCP SDK and dependencies
- [ ] T003 [P] Configure Jest testing framework with >80% coverage requirement
- [ ] T004 [P] Configure ESLint, Prettier, and TypeScript strict mode
- [ ] T005 [P] Setup Winston logging with sanitization
- [ ] T006 [P] Configure multi-transport support (stdio, HTTP, SSE)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation (Constitution Article V)**
**GATE: Project Lead approval required for test cases before implementation**
- [ ] T007 [P] Contract test Project entity schema in tests/contract/test_project_schema.ts
- [ ] T008 [P] Contract test Workspace entity schema in tests/contract/test_workspace_schema.ts
- [ ] T009 [P] Contract test Repository entity schema in tests/contract/test_repository_schema.ts
- [ ] T010 [P] Contract test Permission entity schema in tests/contract/test_permission_schema.ts
- [ ] T011 [P] Contract test Webhook entity schema in tests/contract/test_webhook_schema.ts
- [ ] T012 [P] Contract test Avatar entity schema in tests/contract/test_avatar_schema.ts
- [ ] T013 [P] Integration test server type detection in tests/integration/test_server_detection.ts
- [ ] T014 [P] Integration test tool registration in tests/integration/test_tool_registration.ts
- [ ] T015 [P] Integration test authentication flow in tests/integration/test_auth_flow.ts
- [ ] T016 [P] Integration test multi-transport support in tests/integration/test_transports.ts
- [ ] T017 [P] Integration test with real Bitbucket dependencies (Article IV)
- [ ] T018 [P] Performance tests for response time <2s for 95% of requests
- [ ] T019 [P] Logging and observability tests with sanitization
- [ ] T020 [P] Integration test Project management scenario in tests/integration/test_project_management.ts
- [ ] T021 [P] Integration test Repository management scenario in tests/integration/test_repository_management.ts
- [ ] T022 [P] Integration test Workspace management scenario in tests/integration/test_workspace_management.ts
- [ ] T023 [P] Integration test Cloud repository management scenario in tests/integration/test_cloud_repository_management.ts
- [ ] T024 [P] Integration test cleanup operations scenario in tests/integration/test_cleanup_operations.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T025 [P] MCP server core in src/server/index.ts
- [ ] T026 [P] Tool registry with selective loading in src/services/tool-registry.ts
- [ ] T027 [P] Server type detection service in src/services/server-detection.ts
- [ ] T028 [P] Authentication service in src/services/AuthenticationService.ts
- [ ] T029 [P] Bitbucket API service in src/services/bitbucket-api.ts
- [ ] T030 [P] Project entity model in src/types/project.ts
- [ ] T031 [P] Workspace entity model in src/types/workspace.ts
- [ ] T032 [P] Repository entity model in src/types/repository.ts
- [ ] T033 [P] Permission entity model in src/types/permission.ts
- [ ] T034 [P] Webhook entity model in src/types/webhook.ts
- [ ] T035 [P] Avatar entity model in src/types/avatar.ts
- [ ] T036 [P] Project service in src/services/ProjectService.ts
- [ ] T037 [P] Repository service in src/services/RepositoryService.ts
- [ ] T038 [P] Permission service in src/services/PermissionService.ts
- [ ] T039 [P] Webhook service in src/services/WebhookService.ts
- [ ] T040 [P] Avatar service in src/services/AvatarService.ts
- [ ] T041 [P] Project MCP tools in src/tools/datacenter/project/
- [ ] T042 [P] Repository MCP tools in src/tools/datacenter/repository/
- [ ] T043 [P] Workspace MCP tools in src/tools/cloud/workspace/
- [ ] T044 [P] Cloud repository MCP tools in src/tools/cloud/repository/
- [ ] T045 [P] Permission MCP tools in src/tools/shared/permission/
- [ ] T046 [P] Webhook MCP tools in src/tools/shared/webhook/
- [ ] T047 [P] Avatar MCP tools in src/tools/shared/avatar/
- [ ] T048 [P] Search MCP tools in src/tools/shared/search/
- [ ] T049 [P] Console client in src/client/cli/index.ts
- [ ] T050 [P] CLI commands in src/client/commands/

## Phase 3.4: Integration
- [ ] T051 Multi-transport implementation (stdio, HTTP, SSE)
- [ ] T052 OAuth 2.0, Personal Access Tokens, App Passwords, Basic Auth support
- [ ] T053 Request/response logging with sanitization
- [ ] T054 Rate limiting and circuit breaker implementation
- [ ] T055 Health checks and monitoring
- [ ] T056 Error handling and retry logic
- [ ] T057 Cache implementation with 5-minute TTL
- [ ] T058 Server type detection with fallback to Data Center 7.16

## Phase 3.5: Polish
- [ ] T059 [P] Unit tests for all services in tests/unit/
- [ ] T060 [P] Unit tests for all entity models in tests/unit/models/
- [ ] T061 [P] Unit tests for all MCP tools in tests/unit/tools/
- [ ] T062 [P] Update API documentation in docs/api-reference.md
- [ ] T063 [P] Update architecture documentation in docs/architecture.md
- [ ] T064 [P] Update contributing guidelines in docs/contributing.md
- [ ] T065 [P] Code coverage verification (>80%)
- [ ] T066 [P] Security audit and vulnerability scan
- [ ] T067 [P] Integration with 20-language CLI support
- [ ] T068 [P] Final validation and quickstart testing
- [ ] T069 [P] Version increment and changelog update (Article VI)
- [ ] T070 [P] Breaking change documentation if applicable (Article VI)

## Dependencies
- Tests (T007-T024) before implementation (T025-T050) - Constitution Article V
- T025 (MCP server core) blocks T026-T029 (services)
- T026 (tool registry) blocks T041-T048 (MCP tools)
- T027 (server detection) blocks T028 (authentication)
- T028 (authentication) blocks T051-T058 (integration)
- T030-T035 (entity models) block T036-T040 (services)
- T036-T040 (services) block T041-T048 (MCP tools)
- Implementation before polish (T059-T070)
- Version increment (T069) before breaking change docs (T070) - Article VI

## Parallel Example
```
# Launch T007-T012 together (Entity schema tests):
Task: "Contract test Project entity schema in tests/contract/test_project_schema.ts"
Task: "Contract test Workspace entity schema in tests/contract/test_workspace_schema.ts"
Task: "Contract test Repository entity schema in tests/contract/test_repository_schema.ts"
Task: "Contract test Permission entity schema in tests/contract/test_permission_schema.ts"
Task: "Contract test Webhook entity schema in tests/contract/test_webhook_schema.ts"
Task: "Contract test Avatar entity schema in tests/contract/test_avatar_schema.ts"

# Launch T020-T024 together (Integration test scenarios):
Task: "Integration test Project management scenario in tests/integration/test_project_management.ts"
Task: "Integration test Repository management scenario in tests/integration/test_repository_management.ts"
Task: "Integration test Workspace management scenario in tests/integration/test_workspace_management.ts"
Task: "Integration test Cloud repository management scenario in tests/integration/test_cloud_repository_management.ts"
Task: "Integration test cleanup operations scenario in tests/integration/test_cleanup_operations.ts"

# Launch T030-T035 together (Entity models):
Task: "Project entity model in src/types/project.ts"
Task: "Workspace entity model in src/types/workspace.ts"
Task: "Repository entity model in src/types/repository.ts"
Task: "Permission entity model in src/types/permission.ts"
Task: "Webhook entity model in src/types/webhook.ts"
Task: "Avatar entity model in src/types/avatar.ts"

# Launch T041-T048 together (MCP tools):
Task: "Project MCP tools in src/tools/datacenter/project/"
Task: "Repository MCP tools in src/tools/datacenter/repository/"
Task: "Workspace MCP tools in src/tools/cloud/workspace/"
Task: "Cloud repository MCP tools in src/tools/cloud/repository/"
Task: "Permission MCP tools in src/tools/shared/permission/"
Task: "Webhook MCP tools in src/tools/shared/webhook/"
Task: "Avatar MCP tools in src/tools/shared/avatar/"
Task: "Search MCP tools in src/tools/shared/search/"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (Constitution Article V - TDD)
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Follow Constitution Articles I-V for all implementations
- Ensure >80% test coverage (Constitution Article V)
- Use official MCP SDK as single source of truth (Constitution Article I)
- Implement all 32 Data Center endpoints and 34 Cloud endpoints (Constitution Article IV)
- Support automatic server type detection with fallback (Constitution Article III)

## Task Generation Rules
*Applied during main() execution*

1. **From Data Model**:
   - Each entity (Project, Workspace, Repository, Permission, Webhook, Avatar) → model creation task [P]
   - Each entity → contract test task [P]
   - Relationships → service layer tasks

2. **From Quickstart Scenarios**:
   - Each scenario → integration test [P]
   - 5 scenarios total → 5 integration test tasks

3. **From Research Decisions**:
   - MCP SDK → setup and core tasks
   - Server detection → detection service task
   - Multi-transport → transport implementation tasks
   - Authentication → auth service and integration tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Tools → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All 6 entities have model tasks and contract tests
- [x] All 5 scenarios have integration tests
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] MCP tools cover all Data Center and Cloud endpoints
- [x] Server type detection and selective loading implemented
- [x] Multi-transport support included
- [x] Authentication with fallback methods included

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*  
*Template updated: 2025-01-27 - Constitution v1.0.0 ratified*
