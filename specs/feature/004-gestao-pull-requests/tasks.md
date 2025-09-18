# Tasks: Gestão de Pull Requests

**Feature**: 004-gestao-pull-requests  
**Date**: 2025-01-27  
**Status**: Ready for Implementation

## Overview
Lista de tarefas estruturada para implementação completa de gestão de pull requests no Bitbucket MCP Server, incluindo operações CRUD, comentários, análise de diffs, merge/decline/reopen, com suporte para Data Center 7.16+ e Cloud.

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
- Paths shown below assume single project structure

## Phase 3.1: Setup
- [ ] T001 Create pull request feature structure in src/tools/datacenter/pullrequest/
- [ ] T002 Initialize pull request types in src/types/pullrequest.ts
- [ ] T003 [P] Configure pull request validation schemas with Zod
- [ ] T004 [P] Setup pull request error handling and sanitization
- [ ] T005 [P] Configure pull request logging with Winston
- [ ] T006 [P] Setup pull request caching with TTL 5 minutes

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation (Constitution Article V)**
**GATE: Project Lead approval required for test cases before implementation**
- [ ] T007 [P] Contract test pull request CRUD operations in tests/contract/test_pull_request_crud.ts
- [ ] T008 [P] Contract test pull request comments in tests/contract/test_pull_request_comments.ts
- [ ] T009 [P] Contract test pull request analysis in tests/contract/test_pull_request_analysis.ts
- [ ] T010 [P] Integration test pull request creation and retrieval in tests/integration/test_pull_request_crud.ts
- [ ] T011 [P] Integration test pull request comments workflow in tests/integration/test_pull_request_comments.ts
- [ ] T012 [P] Integration test pull request merge/decline/reopen in tests/integration/test_pull_request_operations.ts
- [ ] T013 [P] Integration test pull request diff and changes analysis in tests/integration/test_pull_request_analysis.ts
- [ ] T014 [P] Integration test pull request activities and history in tests/integration/test_pull_request_activities.ts
- [ ] T015 [P] Performance tests for pull request operations <2s for 95% of requests
- [ ] T016 [P] Integration test with real Bitbucket Data Center and Cloud dependencies (Article IV)

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T017 [P] Pull request data models in src/types/pullrequest.ts
- [ ] T018 [P] Pull request validation schemas in src/types/pullrequest.ts
- [ ] T019 [P] Pull request CRUD service in src/services/pullrequest-service.ts
- [ ] T020 [P] Pull request comments service in src/services/pullrequest-comments-service.ts
- [ ] T021 [P] Pull request analysis service in src/services/pullrequest-analysis-service.ts
- [ ] T022 [P] Pull request CRUD tools in src/tools/datacenter/pullrequest/crud.ts
- [ ] T023 [P] Pull request comments tools in src/tools/datacenter/pullrequest/comments.ts
- [ ] T024 [P] Pull request analysis tools in src/tools/datacenter/pullrequest/analysis.ts
- [ ] T025 [P] Pull request operations tools in src/tools/datacenter/pullrequest/operations.ts
- [ ] T026 [P] Pull request CLI commands in src/client/commands/pullrequest.ts

## Phase 3.4: Integration
- [ ] T027 Multi-transport support for pull request operations (stdio, HTTP, SSE)
- [ ] T028 OAuth 2.0, Personal Access Tokens, App Passwords, Basic Auth for pull requests
- [ ] T029 Request/response logging with sanitization for pull request operations
- [ ] T030 Rate limiting and circuit breaker for pull request API calls
- [ ] T031 Health checks and monitoring for pull request services
- [ ] T032 Error handling and retry logic for pull request operations
- [ ] T033 Cache implementation for pull request metadata (TTL 5 minutes)

## Phase 3.5: Polish
- [ ] T034 [P] Unit tests for all pull request services in tests/unit/pullrequest/
- [ ] T035 [P] Update API documentation for pull request operations in docs/api-reference.md
- [ ] T036 [P] Update architecture documentation for pull request features in docs/architecture.md
- [ ] T037 [P] Update contributing guidelines for pull request development in docs/contributing.md
- [ ] T038 [P] Code coverage verification for pull request features (>80%)
- [ ] T039 [P] Security audit and vulnerability scan for pull request operations
- [ ] T040 [P] Integration with 20-language CLI support for pull request commands
- [ ] T041 [P] Final validation and quickstart testing for pull request features
- [ ] T042 [P] Version increment and changelog update (Article VI)
- [ ] T043 [P] Breaking change documentation if applicable (Article VI)

## Dependencies
- Tests (T007-T016) before implementation (T017-T026) - Constitution Article V
- T017 (data models) blocks T019-T021 (services)
- T019-T021 (services) block T022-T025 (tools)
- T022-T025 (tools) block T026 (CLI commands)
- T027-T033 (integration) depend on T019-T021 (services)
- Implementation before polish (T034-T043)
- Version increment (T042) before breaking change docs (T043) - Article VI

## Parallel Example
```
# Launch T007-T016 together (Constitution Article V - TDD):
Task: "Contract test pull request CRUD operations in tests/contract/test_pull_request_crud.ts"
Task: "Contract test pull request comments in tests/contract/test_pull_request_comments.ts"
Task: "Contract test pull request analysis in tests/contract/test_pull_request_analysis.ts"
Task: "Integration test pull request creation and retrieval in tests/integration/test_pull_request_crud.ts"
Task: "Integration test pull request comments workflow in tests/integration/test_pull_request_comments.ts"
Task: "Integration test pull request merge/decline/reopen in tests/integration/test_pull_request_operations.ts"
Task: "Integration test pull request diff and changes analysis in tests/integration/test_pull_request_analysis.ts"
Task: "Integration test pull request activities and history in tests/integration/test_pull_request_activities.ts"
Task: "Performance tests for pull request operations <2s for 95% of requests"
Task: "Integration test with real Bitbucket Data Center and Cloud dependencies"

# Launch T022-T025 together (different tool files):
Task: "Pull request CRUD tools in src/tools/datacenter/pullrequest/crud.ts"
Task: "Pull request comments tools in src/tools/datacenter/pullrequest/comments.ts"
Task: "Pull request analysis tools in src/tools/datacenter/pullrequest/analysis.ts"
Task: "Pull request operations tools in src/tools/datacenter/pullrequest/operations.ts"
```

## Task Details

### Contract Tests (T007-T009)
Based on contracts/ directory:
- **pull-request-crud.yaml**: 7 endpoints (list, create, get, update, delete, merge, decline, reopen)
- **pull-request-comments.yaml**: 4 endpoints (list, create, get, update, delete comments)
- **pull-request-analysis.yaml**: 3 endpoints (activities, diff, changes)

### Data Model Tasks (T017-T018)
Based on data-model.md entities:
- **PullRequest**: Core entity with all metadata
- **Comment**: Comment entity with threading support
- **Reviewer**: Reviewer entity with approval status
- **Participant**: Participant entity with roles
- **Activity**: Activity entity for history tracking

### Service Tasks (T019-T021)
Based on research.md decisions:
- **CRUD Service**: Full CRUD operations with validation
- **Comments Service**: Comment management with threading
- **Analysis Service**: Diff, changes, and activity analysis

### Tool Tasks (T022-T025)
Based on MCP tool requirements:
- **CRUD Tools**: 7 MCP tools for CRUD operations
- **Comments Tools**: 4 MCP tools for comment management
- **Analysis Tools**: 3 MCP tools for analysis operations
- **Operations Tools**: 3 MCP tools for merge/decline/reopen

### Integration Tasks (T027-T033)
Based on research.md integration patterns:
- **Multi-transport**: stdio, HTTP, SSE support
- **Authentication**: OAuth 2.0, PAT, App Passwords, Basic Auth
- **Logging**: Winston with sanitization
- **Rate Limiting**: Circuit breaker and retry logic
- **Caching**: TTL 5 minutes for metadata

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (Constitution Article V - TDD)
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Follow Constitution Articles I-V for all implementations
- Ensure >80% test coverage (Constitution Article V)
- Use official MCP SDK as single source of truth (Constitution Article I)
- Support both Data Center 7.16+ and Cloud APIs
- Implement all 18 pull request endpoints as per research.md

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - pull-request-crud.yaml → T007 (contract test) + T022 (CRUD tools)
   - pull-request-comments.yaml → T008 (contract test) + T023 (comments tools)
   - pull-request-analysis.yaml → T009 (contract test) + T024 (analysis tools)
   
2. **From Data Model**:
   - PullRequest entity → T017 (data model)
   - Comment entity → T017 (data model)
   - Reviewer entity → T017 (data model)
   - Participant entity → T017 (data model)
   - Activity entity → T017 (data model)
   
3. **From User Stories**:
   - Quickstart scenarios → T010-T014 (integration tests)
   - Performance requirements → T015 (performance tests)

4. **Ordering**:
   - Setup → Tests → Models → Services → Tools → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (3 contracts → 3 test tasks)
- [x] All entities have model tasks (5 entities → 1 model task)
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] All 18 pull request endpoints covered
- [x] Both Data Center and Cloud support included
- [x] TDD compliance with test-first approach
- [x] Constitution compliance (Articles I-V)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*  
*Generated: 2025-01-27 - Feature 004-gestao-pull-requests*
