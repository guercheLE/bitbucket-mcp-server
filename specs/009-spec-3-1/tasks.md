# Tasks: Maintenance & Updates

**Input**: Design documents from `/specs/009-spec-3-1/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

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
- Paths shown below assume single project structure as defined in `plan.md`.

## Phase 3.1: Setup
- [X] T001 [P] Install `npm-check-updates` as a dev dependency.
- [X] T002 [P] Install `prom-client` as a production dependency.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [X] T003 [P] Create test file `tests/unit/update-dependencies.test.js` to test the `update-dependencies.sh` script. It should mock `ncu` and `npm` commands and verify that the script behaves correctly with and without updates.
- [X] T004 [P] Create test file `tests/unit/monitor-vulnerabilities.test.js` to test the `monitor-vulnerabilities.sh` script. It should mock `npm audit` to simulate finding vulnerabilities and verify the script's exit code.
- [X] T005 [P] Create test file `tests/unit/regenerate-embeddings.test.js` to test the `regenerate-embeddings.sh` script. It should mock `curl` and `shasum` to test the checksum logic.
- [X] T006 [P] Create test file `tests/integration/health-endpoint.test.js` to verify the `/health` endpoint and Prometheus metrics.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [X] T007 Implement the `update-dependencies.sh` script in `src/scripts/maintenance/`.
- [X] T008 Implement the `monitor-vulnerabilities.sh` script in `src/scripts/maintenance/`.
- [X] T009 Implement the `regenerate-embeddings.sh` script in `src/scripts/maintenance/`.
- [X] T010 Implement the `/health` endpoint in the main server file (`src/server/index.ts`) to return a 200 OK status.
- [X] T011 Integrate `prom-client` to expose `health_check_success_rate` and `api_latency` metrics.

## Phase 3.4: Integration
- [X] T012 Create a new GitHub Actions workflow file at `.github/workflows/weekly-maintenance.yml`.
- [X] T013 Configure the workflow to run on a weekly schedule.
- [X] T014 Add a job to the workflow to run the `update-dependencies.sh` script.
- [X] T015 Add a job to the main CI workflow (`.github/workflows/ci.yml`) to run the `monitor-vulnerabilities.sh` script on every push to `main`.

## Phase 3.5: Polish
- [X] T016 [P] Add comprehensive JSDoc comments to all new scripts and the health endpoint implementation.
- [X] T017 [P] Update the main `README.md` to document the new maintenance processes and the health endpoint.

## Dependencies
- Setup (T001-T002) before everything.
- Tests (T003-T006) before implementation (T007-T011).
- Core implementation (T007-T011) before integration (T012-T015).
- All other tasks before Polish (T016-T017).

## Parallel Example
```
# Launch T001-T006 together:
Task: "Install npm-check-updates as a dev dependency."
Task: "Install prom-client as a production dependency."
Task: "Create test file tests/unit/update-dependencies.test.js..."
Task: "Create test file tests/unit/monitor-vulnerabilities.test.js..."
Task: "Create test file tests/unit/regenerate-embeddings.test.js..."
Task: "Create test file tests/integration/health-endpoint.test.js..."
```

## Notes
- The `.sh` scripts from the `contracts` directory should be moved to a new `src/scripts/maintenance/` directory during implementation.
- Ensure all tests are passing after each implementation task.
- Commit after each task.
