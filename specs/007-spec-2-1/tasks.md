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

- [X] **T001**: Create placeholder directories for major API categories within `src/tools/operations/` (e.g., `repositories`, `pull-requests`, `users`).
- [X] **T002**: Create corresponding placeholder directories for contract tests within `tests/contract/operations/` (e.g., `repositories`, `pull-requests`, `users`).

---

## Phase 3.2: Core Implementation (Iterative)
*This phase is the bulk of the work. The tasks below represent a template to be repeated for **each** of the 200+ Bitbucket API endpoints. This list shows examples for a few key resources.*

### Group 1: Repository Management (Example)
- [X] **T003** [P]: Write contract test for `bitbucket.repositories.list` in `tests/contract/operations/repositories/list.test.ts`. The test must fail initially.
- [X] **T004**: Implement the internal operation for `bitbucket.repositories.list` in `src/tools/operations/repositories/list.ts` to make the contract test pass.
- [X] **T005** [P]: Write contract test for `bitbucket.repositories.get` in `tests/contract/operations/repositories/get.test.ts`.
- [X] **T006**: Implement the internal operation for `bitbucket.repositories.get` in `src/tools/operations/repositories/get.ts`.
- [X] **T007** [P]: Write contract test for `bitbucket.repositories.create` in `tests/contract/operations/repositories/create.test.ts`.
- [X] **T008**: Implement the internal operation for `bitbucket.repositories.create` in `src/tools/operations/repositories/create.ts`.
*(...and so on for all repository-related endpoints)*

### Group 2: Pull Request Management (Example)
- [X] **T009** [P]: Write contract test for `bitbucket.pull-requests.list` in `tests/contract/operations/pull-requests/list.test.ts`.
- [X] **T010**: Implement the internal operation for `bitbucket.pull-requests.list` in `src/tools/operations/pull-requests/list.ts`.
- [X] **T011** [P]: Write contract test for `bitbucket.pull-requests.create` in `tests/contract/operations/pull-requests/create.test.ts`.
- [X] **T012**: Implement the internal operation for `bitbucket.pull-requests.create` in `src/tools/operations/pull-requests/create.ts`.
- [X] **T013** [P]: Write contract test for `bitbucket.pull-requests.merge` in `tests/contract/operations/pull-requests/merge.test.ts`.
- [X] **T014**: Implement the internal operation for `bitbucket.pull-requests.merge` in `src/tools/operations/pull-requests/merge.ts`.
- [X] **T015** [P]: Write contract test for `bitbucket.pull-requests.get` in `tests/contract/operations/pull-requests/get.test.ts`.
- [X] **T016**: Implement the internal operation for `bitbucket.pull-requests.get` in `src/tools/operations/pull-requests/get.ts`.
- [X] **T017** [P]: Write contract test for `bitbucket.pull-requests.approve` in `tests/contract/operations/pull-requests/approve.test.ts`.
- [X] **T018**: Implement the internal operation for `bitbucket.pull-requests.approve` in `src/tools/operations/pull-requests/approve.ts`.
- [X] **T019** [P]: Write contract test for `bitbucket.pull-requests.decline` in `tests/contract/operations/pull-requests/decline.test.ts`.
- [X] **T020**: Implement the internal operation for `bitbucket.pull-requests.decline` in `src/tools/operations/pull-requests/decline.ts`.
- [X] **T021** [P]: Write contract test for `bitbucket.pull-requests.unapprove` in `tests/contract/operations/pull-requests/unapprove.test.ts`.
- [X] **T022**: Implement the internal operation for `bitbucket.pull-requests.unapprove` in `src/tools/operations/pull-requests/unapprove.ts`.
- [X] **T023** [P]: Write contract test for `bitbucket.pull-requests.update` in `tests/contract/operations/pull-requests/update.test.ts`.
- [X] **T024**: Implement the internal operation for `bitbucket.pull-requests.update` in `src/tools/operations/pull-requests/update.ts`.
- [X] **T025** [P]: Write contract test for `bitbucket.pull-requests.activities` in `tests/contract/operations/pull-requests/activities.test.ts`.
- [X] **T026**: Implement the internal operation for `bitbucket.pull-requests.activities` in `src/tools/operations/pull-requests/activities.ts`.
- [X] **T027** [P]: Write contract test for `bitbucket.pull-requests.commits` in `tests/contract/operations/pull-requests/commits.test.ts`.
- [X] **T028**: Implement the internal operation for `bitbucket.pull-requests.commits` in `src/tools/operations/pull-requests/commits.ts`.
- [X] **T029** [P]: Write contract test for `bitbucket.pull-requests.comments.list` in `tests/contract/operations/pull-requests/comments.list.test.ts`.
- [X] **T030**: Implement the internal operation for `bitbucket.pull-requests.comments.list` in `src/tools/operations/pull-requests/comments/list.ts`.
- [X] **T031** [P]: Write contract test for `bitbucket.pull-requests.comments.create` in `tests/contract/operations/pull-requests/comments.create.test.ts`.
- [X] **T032**: Implement the internal operation for `bitbucket.pull-requests.comments.create` in `src/tools/operations/pull-requests/comments/create.ts`.
- [X] **T033** [P]: Write contract test for `bitbucket.pull-requests.diff` in `tests/contract/operations/pull-requests/diff.test.ts`.
- [X] **T034**: Implement the internal operation for `bitbucket.pull-requests.diff` in `src/tools/operations/pull-requests/diff.ts`.
*(...and so on for all pull-request-related endpoints)*

### Group N: ...
*(This pattern repeats for all other API categories: Users, Projects, Builds, etc.)*

---

## Phase 3.3: Pagination Implementation
*While pagination is part of each list-based operation, these tasks ensure a consistent approach.*

- [X] **T400**: Create a shared utility function in `src/utils/pagination.ts` to handle mapping between MCP and Bitbucket pagination parameters.
- [X] **T401**: Refactor all implemented list-based operations (e.g., T004, T010) to use the shared pagination utility.
- [X] **T402**: Update all corresponding contract tests for list-based operations to include assertions for correct pagination behavior.

---

## Phase 3.4: Embedding Generation
*This is the final step after all operations are implemented and tested.*

- [X] **T403**: Create a script `scripts/generate-embeddings.ts` that:
    - Scans the `src/tools/operations/` directory for all implemented operation files.
    - Extracts metadata (`id`, `summary`, `description`, `tags`, `compatibility`).
    - Uses the `sentence-transformers` library to generate a vector for each operation's text.
    - Saves the vectors and metadata into the `sqlite-vec` database file.
- [X] **T404**: Execute the `generate-embeddings.ts` script to create the final production vector database.
- [X] **T405**: Update the package build process (`package.json`) to include the generated vector database file in the final distributable.

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
