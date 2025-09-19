# Tasks: Gestão de Issues (Bitbucket Cloud)

**Input**: Design documents from `/specs/001-feature-gestao-issues/`
**Prerequisites**: research.md, data-model.md, contracts/issues-api.yaml, quickstart.md

## Execution Flow (main)
```
1. Load research.md from feature directory
   → Extract: tech stack, libraries, API endpoints, decisions
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/issues-api.yaml: Extract endpoints → contract test tasks
   → quickstart.md: Extract scenarios → integration test tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, MCP tools
   → Integration: authentication, error handling, logging
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
- [ ] T001 Create Issues feature structure in src/tools/cloud/issues/
- [ ] T002 Initialize Issues types in src/types/issues.ts
- [ ] T003 [P] Configure Jest testing framework with >80% coverage requirement
- [ ] T004 [P] Configure ESLint, Prettier, and TypeScript strict mode
- [ ] T005 [P] Setup Winston logging with sanitization for Issues operations
- [ ] T006 [P] Configure Axios HTTP client with retry and rate limiting

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation (Constitution Article V)**
**GATE: Project Lead approval required for test cases before implementation**
- [ ] T007 [P] Contract test Issues API endpoints in tests/contract/test_issues_api.ts
- [ ] T008 [P] Contract test Issue entity validation in tests/contract/test_issue_entity.ts
- [ ] T009 [P] Contract test Comment entity validation in tests/contract/test_comment_entity.ts
- [ ] T010 [P] Contract test IssueRelationship entity validation in tests/contract/test_issue_relationship_entity.ts
- [ ] T011 [P] Contract test Attachment entity validation in tests/contract/test_attachment_entity.ts
- [ ] T012 [P] Integration test Issue creation scenario in tests/integration/test_issue_creation.ts
- [ ] T013 [P] Integration test Issue search and filtering in tests/integration/test_issue_search.ts
- [ ] T014 [P] Integration test Issue updates and transitions in tests/integration/test_issue_updates.ts
- [ ] T015 [P] Integration test Comments management in tests/integration/test_comments_management.ts
- [ ] T016 [P] Integration test Issue transitions workflow in tests/integration/test_issue_transitions.ts
- [ ] T017 [P] Integration test with real Bitbucket Cloud dependencies (Article IV)
- [ ] T018 [P] Performance tests for response time <2s for 95% of requests
- [ ] T019 [P] Edge case tests for dependencies and permissions in tests/integration/test_edge_cases.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T020 [P] Issue entity model in src/types/issues.ts
- [ ] T021 [P] Comment entity model in src/types/comments.ts
- [ ] T022 [P] IssueRelationship entity model in src/types/issue-relationships.ts
- [ ] T023 [P] Attachment entity model in src/types/attachments.ts
- [ ] T024 [P] Issues service in src/services/issues-service.ts
- [ ] T025 [P] Comments service in src/services/comments-service.ts
- [ ] T026 [P] Transitions service in src/services/transitions-service.ts
- [ ] T027 [P] MCP tool: List issues in src/tools/cloud/issues/list-issues.ts
- [ ] T028 [P] MCP tool: Create issue in src/tools/cloud/issues/create-issue.ts
- [ ] T029 [P] MCP tool: Get issue in src/tools/cloud/issues/get-issue.ts
- [ ] T030 [P] MCP tool: Update issue in src/tools/cloud/issues/update-issue.ts
- [ ] T031 [P] MCP tool: Delete issue in src/tools/cloud/issues/delete-issue.ts
- [ ] T032 [P] MCP tool: List comments in src/tools/cloud/issues/list-comments.ts
- [ ] T033 [P] MCP tool: Create comment in src/tools/cloud/issues/create-comment.ts
- [ ] T034 [P] MCP tool: Update comment in src/tools/cloud/issues/update-comment.ts
- [ ] T035 [P] MCP tool: Delete comment in src/tools/cloud/issues/delete-comment.ts
- [ ] T036 [P] MCP tool: List transitions in src/tools/cloud/issues/list-transitions.ts
- [ ] T037 [P] MCP tool: Transition issue in src/tools/cloud/issues/transition-issue.ts

## Phase 3.4: Integration
- [ ] T038 Issues tool registration for Cloud servers only in src/mcp/tool-registry.ts
- [ ] T039 OAuth 2.0 authentication for Issues API calls
- [ ] T040 Request/response logging with sanitization for Issues operations
- [ ] T041 Rate limiting and circuit breaker for Issues API
- [ ] T042 Error handling and retry logic for Issues operations
- [ ] T043 Cache implementation with 5-minute TTL for Issues data
- [ ] T044 Validation of Issue state transitions and business rules

## Phase 3.5: Polish
- [ ] T045 [P] Unit tests for all Issues services in tests/unit/services/
- [ ] T046 [P] Unit tests for all Issues MCP tools in tests/unit/tools/
- [ ] T047 [P] Update API documentation in docs/api-reference.md
- [ ] T048 [P] Update architecture documentation in docs/architecture.md
- [ ] T049 [P] Update contributing guidelines in docs/contributing.md
- [ ] T050 [P] Code coverage verification (>80%)
- [ ] T051 [P] Security audit and vulnerability scan
- [ ] T052 [P] Integration with 20-language CLI support
- [ ] T053 [P] Final validation and quickstart testing
- [ ] T054 [P] Version increment and changelog update (Article VI)
- [ ] T055 [P] Breaking change documentation if applicable (Article VI)

## Dependencies
- Tests (T007-T019) before implementation (T020-T037) - Constitution Article V
- T020-T023 (entity models) before T024-T026 (services)
- T024-T026 (services) before T027-T037 (MCP tools)
- T027-T037 (MCP tools) before T038 (tool registration)
- T038 (tool registration) before T039-T044 (integration)
- Implementation before polish (T045-T055)
- Version increment (T054) before breaking change docs (T055) - Article VI

## Parallel Example
```
# Launch T007-T019 together (Constitution Article V - TDD):
Task: "Contract test Issues API endpoints in tests/contract/test_issues_api.ts"
Task: "Contract test Issue entity validation in tests/contract/test_issue_entity.ts"
Task: "Contract test Comment entity validation in tests/contract/test_comment_entity.ts"
Task: "Contract test IssueRelationship entity validation in tests/contract/test_issue_relationship_entity.ts"
Task: "Contract test Attachment entity validation in tests/contract/test_attachment_entity.ts"
Task: "Integration test Issue creation scenario in tests/integration/test_issue_creation.ts"
Task: "Integration test Issue search and filtering in tests/integration/test_issue_search.ts"
Task: "Integration test Issue updates and transitions in tests/integration/test_issue_updates.ts"
Task: "Integration test Comments management in tests/integration/test_comments_management.ts"
Task: "Integration test Issue transitions workflow in tests/integration/test_issue_transitions.ts"
Task: "Integration test with real Bitbucket Cloud dependencies"
Task: "Performance tests for response time <2s for 95% of requests"
Task: "Edge case tests for dependencies and permissions in tests/integration/test_edge_cases.ts"

# Launch T020-T023 together (different entity files):
Task: "Issue entity model in src/types/issues.ts"
Task: "Comment entity model in src/types/comments.ts"
Task: "IssueRelationship entity model in src/types/issue-relationships.ts"
Task: "Attachment entity model in src/types/attachments.ts"

# Launch T024-T026 together (different service files):
Task: "Issues service in src/services/issues-service.ts"
Task: "Comments service in src/services/comments-service.ts"
Task: "Transitions service in src/services/transitions-service.ts"

# Launch T027-T037 together (different MCP tool files):
Task: "MCP tool: List issues in src/tools/cloud/issues/list-issues.ts"
Task: "MCP tool: Create issue in src/tools/cloud/issues/create-issue.ts"
Task: "MCP tool: Get issue in src/tools/cloud/issues/get-issue.ts"
Task: "MCP tool: Update issue in src/tools/cloud/issues/update-issue.ts"
Task: "MCP tool: Delete issue in src/tools/cloud/issues/delete-issue.ts"
Task: "MCP tool: List comments in src/tools/cloud/issues/list-comments.ts"
Task: "MCP tool: Create comment in src/tools/cloud/issues/create-comment.ts"
Task: "MCP tool: Update comment in src/tools/cloud/issues/update-comment.ts"
Task: "MCP tool: Delete comment in src/tools/cloud/issues/delete-comment.ts"
Task: "MCP tool: List transitions in src/tools/cloud/issues/list-transitions.ts"
Task: "MCP tool: Transition issue in src/tools/cloud/issues/transition-issue.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (Constitution Article V - TDD)
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Follow Constitution Articles I-V for all implementations
- Ensure >80% test coverage (Constitution Article V)
- Use official MCP SDK as single source of truth (Constitution Article I)
- Issues are Cloud-only feature - register tools only for Cloud servers (Article III)

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - issues-api.yaml → contract test task [P]
   - 8 endpoints → 8 MCP tool implementation tasks
   
2. **From Data Model**:
   - 4 entities → 4 model creation tasks [P]
   - Relationships → service layer tasks
   
3. **From Quickstart**:
   - 5 scenarios → 5 integration test tasks [P]
   - 3 edge cases → 1 edge case test task [P]

4. **Ordering**:
   - Setup → Tests → Models → Services → Tools → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (issues-api.yaml → T007)
- [x] All entities have model tasks (4 entities → T020-T023)
- [x] All tests come before implementation (T007-T019 before T020-T037)
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] All 8 API endpoints have corresponding MCP tools
- [x] All 5 quickstart scenarios have integration tests
- [x] Cloud-only tool registration strategy included

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*  
*Tasks generated: 2024-12-19 - Feature: 001-feature-gestao-issues*
