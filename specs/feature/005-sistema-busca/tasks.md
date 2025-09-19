# Tasks: Sistema de Busca

**Input**: Design documents from `/specs/001-sistema-busca/`
**Prerequisites**: research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load research.md from feature directory
   → Extract: tech stack, libraries, MCP tool implementation decisions
2. Load design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → quickstart.md: Extract scenarios → integration test tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, MCP tools
   → Integration: API connections, caching, logging
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
   → All MCP tools implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **MCP Tools**: `src/tools/shared/search/`
- **Services**: `src/services/`
- **Types**: `src/types/`

## Phase 3.1: Setup
- [ ] T001 Create search system structure per constitution
- [ ] T002 Initialize search dependencies (Zod, Axios, Winston)
- [ ] T003 [P] Configure Jest testing framework with >80% coverage requirement
- [ ] T004 [P] Configure ESLint, Prettier, and TypeScript strict mode
- [ ] T005 [P] Setup Winston logging with sanitization for search operations
- [ ] T006 [P] Configure cache system for search results (5min TTL)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation (Constitution Article V)**
**GATE: Project Lead approval required for test cases before implementation**
- [ ] T007 [P] Contract test search-repositories.yaml in tests/contract/test_search_repositories.ts
- [ ] T008 [P] Contract test search-commits.yaml in tests/contract/test_search_commits.ts
- [ ] T009 [P] Contract test search-pullrequests.yaml in tests/contract/test_search_pullrequests.ts
- [ ] T010 [P] Contract test search-code.yaml in tests/contract/test_search_code.ts
- [ ] T011 [P] Integration test search repositories with real Bitbucket API in tests/integration/test_search_repositories.ts
- [ ] T012 [P] Integration test search commits with real Bitbucket API in tests/integration/test_search_commits.ts
- [ ] T013 [P] Integration test search pull requests with real Bitbucket API in tests/integration/test_search_pullrequests.ts
- [ ] T014 [P] Integration test search code with real Bitbucket API in tests/integration/test_search_code.ts
- [ ] T015 [P] Performance tests for search response time <5s for 95% of requests
- [ ] T016 [P] Cache and rate limiting tests for search operations
- [ ] T017 [P] Search history and analytics tests

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T018 [P] Search data models in src/types/search.ts (SearchQuery, SearchResult, SearchHistory, SearchResponse)
- [ ] T019 [P] Search validation schemas with Zod in src/types/search-schemas.ts
- [ ] T020 [P] Search service base class in src/services/search-service.ts
- [ ] T021 [P] Repository search service in src/services/repository-search-service.ts
- [ ] T022 [P] Commit search service in src/services/commit-search-service.ts
- [ ] T023 [P] Pull request search service in src/services/pullrequest-search-service.ts
- [ ] T024 [P] Code search service in src/services/code-search-service.ts
- [ ] T025 [P] Search history service in src/services/search-history-service.ts
- [ ] T026 [P] Search analytics service in src/services/search-analytics-service.ts
- [ ] T027 [P] MCP tool mcp_bitbucket_search_repositories in src/tools/shared/search/search-repositories.ts
- [ ] T028 [P] MCP tool mcp_bitbucket_search_commits in src/tools/shared/search/search-commits.ts
- [ ] T029 [P] MCP tool mcp_bitbucket_search_pull_requests in src/tools/shared/search/search-pullrequests.ts
- [ ] T030 [P] MCP tool mcp_bitbucket_search_code in src/tools/shared/search/search-code.ts
- [ ] T031 [P] MCP tool mcp_bitbucket_search_users in src/tools/shared/search/search-users.ts
- [ ] T032 [P] MCP tool mcp_bitbucket_search_get_suggestions in src/tools/shared/search/search-suggestions.ts
- [ ] T033 [P] MCP tool mcp_bitbucket_search_get_configuration in src/tools/shared/search/search-configuration.ts
- [ ] T034 [P] MCP tool mcp_bitbucket_search_get_indexes in src/tools/shared/search/search-indexes.ts
- [ ] T035 [P] MCP tool mcp_bitbucket_search_rebuild_index in src/tools/shared/search/search-rebuild-index.ts
- [ ] T036 [P] MCP tool mcp_bitbucket_search_get_history in src/tools/shared/search/search-history.ts
- [ ] T037 [P] MCP tool mcp_bitbucket_search_get_analytics in src/tools/shared/search/search-analytics.ts
- [ ] T038 [P] MCP tool mcp_bitbucket_search_get_statistics in src/tools/shared/search/search-statistics.ts

## Phase 3.4: Integration
- [ ] T039 Search result caching implementation with 5min TTL
- [ ] T040 Search query validation and sanitization
- [ ] T041 Search result pagination and sorting
- [ ] T042 Search history tracking and cleanup (90 days retention)
- [ ] T043 Search analytics and performance metrics
- [ ] T044 Search suggestions and auto-complete
- [ ] T045 Search configuration management
- [ ] T046 Search index management and rebuilding
- [ ] T047 Error handling and retry logic for search operations
- [ ] T048 Rate limiting for search requests

## Phase 3.5: Polish
- [ ] T049 [P] Unit tests for all search services in tests/unit/search/
- [ ] T050 [P] Unit tests for all search MCP tools in tests/unit/tools/search/
- [ ] T051 [P] Update API documentation in docs/api-reference.md
- [ ] T052 [P] Update search quickstart in docs/quickstart-search.md
- [ ] T053 [P] Update architecture documentation in docs/architecture.md
- [ ] T054 [P] Code coverage verification (>80%)
- [ ] T055 [P] Security audit for search operations
- [ ] T056 [P] Performance optimization and benchmarking
- [ ] T057 [P] Search result relevance scoring improvements
- [ ] T058 [P] Final validation and quickstart testing
- [ ] T059 [P] Version increment and changelog update (Article VI)
- [ ] T060 [P] Breaking change documentation if applicable (Article VI)

## Dependencies
- Tests (T007-T017) before implementation (T018-T038) - Constitution Article V
- T018 (search data models) blocks T019 (validation schemas)
- T019 (validation schemas) blocks T020-T026 (services)
- T020 (search service base) blocks T021-T026 (specific services)
- T021-T026 (services) block T027-T038 (MCP tools)
- T027-T038 (MCP tools) block T039-T048 (integration)
- Implementation before polish (T049-T060)
- Version increment (T059) before breaking change docs (T060) - Article VI

## Parallel Example
```
# Launch T007-T010 together (Contract tests - different files):
Task: "Contract test search-repositories.yaml in tests/contract/test_search_repositories.ts"
Task: "Contract test search-commits.yaml in tests/contract/test_search_commits.ts"
Task: "Contract test search-pullrequests.yaml in tests/contract/test_search_pullrequests.ts"
Task: "Contract test search-code.yaml in tests/contract/test_search_code.ts"

# Launch T011-T014 together (Integration tests - different files):
Task: "Integration test search repositories with real Bitbucket API in tests/integration/test_search_repositories.ts"
Task: "Integration test search commits with real Bitbucket API in tests/integration/test_search_commits.ts"
Task: "Integration test search pull requests with real Bitbucket API in tests/integration/test_search_pullrequests.ts"
Task: "Integration test search code with real Bitbucket API in tests/integration/test_search_code.ts"

# Launch T021-T026 together (Search services - different files):
Task: "Repository search service in src/services/repository-search-service.ts"
Task: "Commit search service in src/services/commit-search-service.ts"
Task: "Pull request search service in src/services/pullrequest-search-service.ts"
Task: "Code search service in src/services/code-search-service.ts"
Task: "Search history service in src/services/search-history-service.ts"
Task: "Search analytics service in src/services/search-analytics-service.ts"

# Launch T027-T038 together (MCP tools - different files):
Task: "MCP tool mcp_bitbucket_search_repositories in src/tools/shared/search/search-repositories.ts"
Task: "MCP tool mcp_bitbucket_search_commits in src/tools/shared/search/search-commits.ts"
Task: "MCP tool mcp_bitbucket_search_pull_requests in src/tools/shared/search/search-pullrequests.ts"
Task: "MCP tool mcp_bitbucket_search_code in src/tools/shared/search/search-code.ts"
Task: "MCP tool mcp_bitbucket_search_users in src/tools/shared/search/search-users.ts"
Task: "MCP tool mcp_bitbucket_search_get_suggestions in src/tools/shared/search/search-suggestions.ts"
Task: "MCP tool mcp_bitbucket_search_get_configuration in src/tools/shared/search/search-configuration.ts"
Task: "MCP tool mcp_bitbucket_search_get_indexes in src/tools/shared/search/search-indexes.ts"
Task: "MCP tool mcp_bitbucket_search_rebuild_index in src/tools/shared/search/search-rebuild-index.ts"
Task: "MCP tool mcp_bitbucket_search_get_history in src/tools/shared/search/search-history.ts"
Task: "MCP tool mcp_bitbucket_search_get_analytics in src/tools/shared/search/search-analytics.ts"
Task: "MCP tool mcp_bitbucket_search_get_statistics in src/tools/shared/search/search-statistics.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (Constitution Article V - TDD)
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Follow Constitution Articles I-V for all implementations
- Ensure >80% test coverage (Constitution Article V)
- Use official MCP SDK as single source of truth (Constitution Article I)
- All search operations must support both Data Center and Cloud APIs
- Search results must be cached for 5 minutes with automatic cleanup
- Search history must be retained for 90 days with automatic cleanup
- All search operations must include relevance scoring (0-1)
- Search suggestions must be provided for better user experience

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → MCP tool implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From Research**:
   - Each MCP tool decision → implementation task
   - Each API endpoint → service task
   
4. **From Quickstart**:
   - Each scenario → integration test [P]
   - Each example → validation task

5. **Ordering**:
   - Setup → Tests → Models → Services → MCP Tools → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All MCP tools have implementation tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] All search types covered (repositories, commits, pull requests, code, users)
- [ ] All search features covered (suggestions, configuration, indexes, history, analytics)
- [ ] Performance requirements met (<5s response time)
- [ ] Caching and rate limiting implemented
- [ ] Search history and analytics implemented

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*  
*Template updated: 2024-12-19 - Sistema de Busca feature*
