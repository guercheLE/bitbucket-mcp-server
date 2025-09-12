# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
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
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

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
- [ ] T007 [P] Contract test MCP tool schemas in tests/contract/test_mcp_tool_schemas.ts
- [ ] T008 [P] Contract test Bitbucket API endpoints in tests/contract/test_bitbucket_api.ts
- [ ] T009 [P] Integration test server type detection in tests/integration/test_server_detection.ts
- [ ] T010 [P] Integration test tool registration in tests/integration/test_tool_registration.ts
- [ ] T011 [P] Integration test authentication flow in tests/integration/test_auth_flow.ts
- [ ] T012 [P] Integration test multi-transport support in tests/integration/test_transports.ts
- [ ] T013 [P] Integration test with real Bitbucket dependencies (Article IV)
- [ ] T014 [P] Performance tests for response time <2s for 95% of requests
- [ ] T015 [P] Logging and observability tests with sanitization

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T016 [P] MCP server core in src/server/index.ts
- [ ] T017 [P] Tool registry with selective loading in src/services/tool-registry.ts
- [ ] T018 [P] Server type detection service in src/services/server-detection.ts
- [ ] T019 [P] Authentication service in src/services/AuthenticationService.ts
- [ ] T020 [P] Bitbucket API service in src/services/bitbucket-api.ts
- [ ] T021 [P] Repository tools in src/tools/datacenter/repository/
- [ ] T022 [P] Pull request tools in src/tools/datacenter/pullrequest/
- [ ] T023 [P] Project tools in src/tools/datacenter/project/
- [ ] T024 [P] Search tools in src/tools/shared/search/
- [ ] T025 [P] Dashboard tools in src/tools/datacenter/dashboard/
- [ ] T026 [P] Console client in src/client/cli/index.ts
- [ ] T027 [P] CLI commands in src/client/commands/

## Phase 3.4: Integration
- [ ] T028 Multi-transport implementation (stdio, HTTP, SSE)
- [ ] T029 OAuth 2.0, App Passwords, API Tokens, Basic Auth support
- [ ] T030 Request/response logging with sanitization
- [ ] T031 Rate limiting and circuit breaker implementation
- [ ] T032 Health checks and monitoring
- [ ] T033 Error handling and retry logic

## Phase 3.5: Polish
- [ ] T034 [P] Unit tests for all services in tests/unit/
- [ ] T035 [P] Update API documentation in docs/API.md
- [ ] T036 [P] Update architecture documentation in docs/ARCHITECTURE.md
- [ ] T037 [P] Update contributing guidelines in docs/CONTRIBUTING.md
- [ ] T038 [P] Code coverage verification (>80%)
- [ ] T039 [P] Security audit and vulnerability scan
- [ ] T040 [P] Integration with 20-language CLI support
- [ ] T041 [P] Final validation and quickstart testing
- [ ] T042 [P] Version increment and changelog update (Article VI)
- [ ] T043 [P] Breaking change documentation if applicable (Article VI)

## Dependencies
- Tests (T007-T015) before implementation (T016-T027) - Constitution Article V
- T016 (MCP server core) blocks T017-T020 (services)
- T017 (tool registry) blocks T021-T025 (tools)
- T018 (server detection) blocks T019 (authentication)
- T019 (authentication) blocks T028-T033 (integration)
- Implementation before polish (T034-T043)
- Version increment (T042) before breaking change docs (T043) - Article VI

## Parallel Example
```
# Launch T007-T015 together (Constitution Article V - TDD):
Task: "Contract test MCP tool schemas in tests/contract/test_mcp_tool_schemas.ts"
Task: "Contract test Bitbucket API endpoints in tests/contract/test_bitbucket_api.ts"
Task: "Integration test server type detection in tests/integration/test_server_detection.ts"
Task: "Integration test tool registration in tests/integration/test_tool_registration.ts"
Task: "Integration test authentication flow in tests/integration/test_auth_flow.ts"
Task: "Integration test multi-transport support in tests/integration/test_transports.ts"
Task: "Integration test with real Bitbucket dependencies"
Task: "Performance tests for response time <2s for 95% of requests"
Task: "Logging and observability tests with sanitization"

# Launch T021-T025 together (different tool files):
Task: "Repository tools in src/tools/datacenter/repository/"
Task: "Pull request tools in src/tools/datacenter/pullrequest/"
Task: "Project tools in src/tools/datacenter/project/"
Task: "Search tools in src/tools/shared/search/"
Task: "Dashboard tools in src/tools/datacenter/dashboard/"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (Constitution Article V - TDD)
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Follow Constitution Articles I-V for all implementations
- Ensure >80% test coverage (Constitution Article V)
- Use official MCP SDK as single source of truth (Constitution Article I)

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*  
*Template updated: 2025-01-27 - Constitution v1.0.0 ratified*