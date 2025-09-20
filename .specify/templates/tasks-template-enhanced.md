# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/
**Dependencies**: [LIST_DEPENDENT_BRANCHES]
**Parallel Status**: [P] if can run in parallel, Sequential if not

## Execution Flow (main)
```
1. Handle branch dependencies and rebasing
   → If dependencies exist: rebase with dependent branches
   → Ensure clean working state before starting
2. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
3. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
4. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
5. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
6. Number tasks sequentially (T001, T002...)
7. Generate dependency graph
8. Create parallel execution examples
9. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
10. Return: SUCCESS (tasks ready for execution)
```

## Phase 0: Branch Management and Dependencies

### Dependency Rebasing (REQUIRED BEFORE ANY IMPLEMENTATION)
**Only execute if this feature has dependencies on other branches**

- [ ] T000 **Check current branch**: Verify you're on `[###-feature-name]` branch
- [ ] T001 **Rebase with dependencies**: 
  ```bash
  # For each dependent branch (in order):
  git fetch origin
  git rebase origin/[dependent-branch-1]
  git rebase origin/[dependent-branch-2]
  # ... continue for all dependencies
  ```
- [ ] T002 **Resolve conflicts**: If rebasing creates conflicts, resolve them carefully
- [ ] T003 **Verify clean state**: Ensure `git status` shows clean working directory

### Dependency Verification
- [ ] T004 **Verify dependent features**: Check that dependent branches have completed implementation
- [ ] T005 **Test integration points**: Ensure this feature can integrate with dependency features

**⚠️ CRITICAL: Do not proceed to Phase 1 until all dependency rebasing is complete**

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **Dependencies**: [LIST_DEPENDENT_BRANCHES] - branches this feature depends on
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 1: Setup
- [ ] T010 Create project structure per implementation plan
- [ ] T011 Initialize [language] project with [framework] dependencies
- [ ] T012 [P] Configure linting and formatting tools

## Phase 2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE PHASE 3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T020 [P] Contract test POST /api/users in tests/contract/test_users_post.py
- [ ] T021 [P] Contract test GET /api/users/{id} in tests/contract/test_users_get.py
- [ ] T022 [P] Integration test user registration in tests/integration/test_registration.py
- [ ] T023 [P] Integration test auth flow in tests/integration/test_auth.py

## Phase 3: Core Implementation (ONLY after tests are failing)
- [ ] T030 [P] User model in src/models/user.py
- [ ] T031 [P] UserService CRUD in src/services/user_service.py
- [ ] T032 [P] CLI --create-user in src/cli/user_commands.py
- [ ] T033 POST /api/users endpoint
- [ ] T034 GET /api/users/{id} endpoint
- [ ] T035 Input validation
- [ ] T036 Error handling and logging

## Phase 4: Integration
- [ ] T040 Connect UserService to DB
- [ ] T041 Auth middleware
- [ ] T042 Request/response logging
- [ ] T043 CORS and security headers

## Phase 5: Polish
- [ ] T050 [P] Unit tests for validation in tests/unit/test_validation.py
- [ ] T051 Performance tests (<200ms)
- [ ] T052 [P] Update docs/api.md
- [ ] T053 Remove duplication
- [ ] T054 Run manual-testing.md

## Dependencies Summary
**This feature depends on**: [LIST_DEPENDENT_BRANCHES]
**Dependent features can run in parallel**: [LIST_PARALLEL_FEATURES]

### Branch Merge Order
1. Complete all dependent branches first
2. Rebase this branch with dependencies (Phase 0)
3. Implement this feature (Phases 1-5)
4. Merge this branch to base branch
5. Notify dependent features of completion

## Dependencies
- Branch rebasing (T000-T005) before any implementation
- Tests (T020-T023) before implementation (T030-T036)
- Core implementation (T030-T036) before integration (T040-T043)
- Integration (T040-T043) before polish (T050-T054)

## Parallel Execution Coordination

### Tasks that CAN run in parallel [P]:
- Different files or components
- Independent test files
- Documentation updates
- Linting and formatting

### Tasks that MUST be sequential:
- Same file modifications
- Database migration dependencies
- API endpoint dependencies
- Integration tests that depend on core implementation

## Post-Implementation Checklist
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Branch ready for merge to base branch
- [ ] Dependent features notified of completion

---

**Note**: This tasks file includes enhanced dependency management for the MVP-to-Full workflow. Ensure proper rebasing and coordination with dependent features.