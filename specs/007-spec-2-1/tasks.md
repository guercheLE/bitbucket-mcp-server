# Tasks: Complete API Operation Implementation

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: plan.md, research.md, data-model.md

## Execution Flow
This task list is generated based on the design artifacts. The primary goal is to iteratively implement all 200+ Bitbucket API endpoints following a strict TDD workflow. Due to the large number of endpoints, the tasks are grouped by API resource categories for clarity. The process for each endpoint is identical: write a contract test, then write the implementation to make it pass.

## Path Conventions
- All source code will be in `src/`.
- All tests will be in `tests/`.
- This plan assumes a single project structure as decided in `plan.md`.

---

## Phase 3.1: Setup & Scaffolding
*These tasks set up the structure for the large-scale implementation.*

- [ ] **T001**: Create placeholder directories for major API categories within `src/tools/operations/` (e.g., `repositories`, `pull-requests`, `users`).
- [ ] **T002**: Create corresponding placeholder directories for contract tests within `tests/contract/operations/` (e.g., `repositories`, `pull-requests`, `users`).

---

## Phase 3.2: Core Implementation (Iterative)
*This phase is the bulk of the work. The tasks below represent a template to be repeated for **each** of the 200+ Bitbucket API endpoints. This list shows examples for a few key resources.*

### Group 1: Repository Management (Example)
- [ ] **T003** [P]: Write contract test for `bitbucket.repositories.list` in `tests/contract/operations/repositories/list.test.ts`. The test must fail initially.
- [ ] **T004**: Implement the internal operation for `bitbucket.repositories.list` in `src/tools/operations/repositories/list.ts` to make the contract test pass.
- [ ] **T005** [P]: Write contract test for `bitbucket.repositories.get` in `tests/contract/operations/repositories/get.test.ts`.
- [ ] **T006**: Implement the internal operation for `bitbucket.repositories.get` in `src/tools/operations/repositories/get.ts`.
- [ ] **T007** [P]: Write contract test for `bitbucket.repositories.create` in `tests/contract/operations/repositories/create.test.ts`.
- [ ] **T008**: Implement the internal operation for `bitbucket.repositories.create` in `src/tools/operations/repositories/create.ts`.
*(...and so on for all repository-related endpoints)*

### Group 2: Pull Request Management (Example)
- [ ] **T009** [P]: Write contract test for `bitbucket.pull-requests.list` in `tests/contract/operations/pull-requests/list.test.ts`.
- [ ] **T010**: Implement the internal operation for `bitbucket.pull-requests.list` in `src/tools/operations/pull-requests/list.ts`.
- [ ] **T011** [P]: Write contract test for `bitbucket.pull-requests.create` in `tests/contract/operations/pull-requests/create.test.ts`.
- [ ] **T012**: Implement the internal operation for `bitbucket.pull-requests.create` in `src/tools/operations/pull-requests/create.ts`.
- [ ] **T013** [P]: Write contract test for `bitbucket.pull-requests.merge` in `tests/contract/operations/pull-requests/merge.test.ts`.
- [ ] **T014**: Implement the internal operation for `bitbucket.pull-requests.merge` in `src/tools/operations/pull-requests/merge.ts`.
*(...and so on for all pull-request-related endpoints)*

### Group N: ...
*(This pattern repeats for all other API categories: Users, Projects, Builds, etc.)*

---

## Phase 3.3: Pagination Implementation
*While pagination is part of each list-based operation, these tasks ensure a consistent approach.*

- [ ] **T400**: Create a shared utility function in `src/utils/pagination.ts` to handle mapping between MCP and Bitbucket pagination parameters.
- [ ] **T401**: Refactor all implemented list-based operations (e.g., T004, T010) to use the shared pagination utility.
- [ ] **T402**: Update all corresponding contract tests for list-based operations to include assertions for correct pagination behavior.

---

## Phase 3.4: Embedding Generation
*This is the final step after all operations are implemented and tested.*

- [ ] **T403**: Create a script `scripts/generate-embeddings.ts` that:
    - Scans the `src/tools/operations/` directory for all implemented operation files.
    - Extracts metadata (`id`, `summary`, `description`, `tags`, `compatibility`).
    - Uses the `sentence-transformers` library to generate a vector for each operation's text.
    - Saves the vectors and metadata into the `sqlite-vec` database file.
- [ ] **T404**: Execute the `generate-embeddings.ts` script to create the final production vector database.
- [ ] **T405**: Update the package build process (`package.json`) to include the generated vector database file in the final distributable.

---

## Dependencies
- **TDD is mandatory**: For any given endpoint, the contract test task (e.g., T003) MUST be completed before the implementation task (T004) begins.
- **Pagination**: T400 (pagination utility) should be done early, but T401 and T402 can be done iteratively as list operations are implemented.
- **Embeddings**: All implementation tasks (T004, T006, T008, T010, etc.) must be complete before T403 (embedding script) can be run. T404 and T405 are the final steps.

## Parallel Execution Example
Multiple contract tests can be written in parallel, as they target different, independent files.

```bash
# The following test creation tasks can be run simultaneously
Task: "T003 [P]: Write contract test for bitbucket.repositories.list in tests/contract/operations/repositories/list.test.ts"
Task: "T005 [P]: Write contract test for bitbucket.repositories.get in tests/contract/operations/repositories/get.test.ts"
Task: "T009 [P]: Write contract test for bitbucket.pull-requests.list in tests/contract/operations/pull-requests/list.test.ts"
```

Once a contract test is written and failing, its corresponding implementation task can begin. Multiple implementation tasks can also be worked on in parallel, provided they don't have overlapping dependencies.
