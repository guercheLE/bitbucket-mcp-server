# Tasks: Repository Management (Continuation)

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
This file lists the remaining tasks for implementing the **Repository** API endpoints. The process for each endpoint is identical: write a contract test, then write the implementation to make it pass. All list operations must use the shared pagination utility defined in `tasks.md` (T400).

---

## Phase 3.2: Core Implementation (Repositories)

### Group 1.1: Core Repository Operations
- [ ] **T035** [P]: Write contract test for `bitbucket.repositories.update` in `tests/contract/operations/repositories/update.test.ts`.
- [ ] **T036**: Implement the internal operation for `bitbucket.repositories.update` in `src/tools/operations/repositories/update.ts`.
- [ ] **T037** [P]: Write contract test for `bitbucket.repositories.delete` in `tests/contract/operations/repositories/delete.test.ts`.
- [ ] **T038**: Implement the internal operation for `bitbucket.repositories.delete` in `src/tools/operations/repositories/delete.ts`.
- [ ] **T039** [P]: Write contract test for `bitbucket.repositories.fork` in `tests/contract/operations/repositories/fork.test.ts`.
- [ ] **T040**: Implement the internal operation for `bitbucket.repositories.fork` in `src/tools/operations/repositories/fork.ts`.

### Group 1.2: Branching and Tagging
- [ ] **T041** [P]: Write contract test for `bitbucket.repositories.refs.branches.list` in `tests/contract/operations/repositories/refs/branches/list.test.ts`.
- [ ] **T042**: Implement `bitbucket.repositories.refs.branches.list` in `src/tools/operations/repositories/refs/branches/list.ts`.
- [ ] **T043** [P]: Write contract test for `bitbucket.repositories.refs.branches.create` in `tests/contract/operations/repositories/refs/branches/create.test.ts`.
- [ ] **T044**: Implement `bitbucket.repositories.refs.branches.create` in `src/tools/operations/repositories/refs/branches/create.ts`.
- [ ] **T045** [P]: Write contract test for `bitbucket.repositories.refs.tags.list` in `tests/contract/operations/repositories/refs/tags/list.test.ts`.
- [ ] **T046**: Implement `bitbucket.repositories.refs.tags.list` in `src/tools/operations/repositories/refs/tags/list.ts`.
- [ ] **T047** [P]: Write contract test for `bitbucket.repositories.refs.tags.create` in `tests/contract/operations/repositories/refs/tags/create.test.ts`.
- [ ] **T048**: Implement `bitbucket.repositories.refs.tags.create` in `src/tools/operations/repositories/refs/tags/create.ts`.

### Group 1.3: Commits
- [ ] **T049** [P]: Write contract test for `bitbucket.repositories.commits.list` in `tests/contract/operations/repositories/commits/list.test.ts`.
- [ ] **T050**: Implement `bitbucket.repositories.commits.list` in `src/tools/operations/repositories/commits/list.ts`.
- [ ] **T051** [P]: Write contract test for `bitbucket.repositories.commit.get` in `tests/contract/operations/repositories/commit/get.test.ts`.
- [ ] **T052**: Implement `bitbucket.repositories.commit.get` in `src/tools/operations/repositories/commit/get.ts`.
- [ ] **T053** [P]: Write contract test for `bitbucket.repositories.commit.comments.list` in `tests/contract/operations/repositories/commit/comments/list.test.ts`.
- [ ] **T054**: Implement `bitbucket.repositories.commit.comments.list` in `src/tools/operations/repositories/commit/comments/list.ts`.
- [ ] **T055** [P]: Write contract test for `bitbucket.repositories.commit.comments.create` in `tests/contract/operations/repositories/commit/comments/create.test.ts`.
- [ ] **T056**: Implement `bitbucket.repositories.commit.comments.create` in `src/tools/operations/repositories/commit/comments/create.ts`.

### Group 1.4: Branch Restrictions
- [ ] **T057** [P]: Write contract test for `bitbucket.repositories.branch-restrictions.list` in `tests/contract/operations/repositories/branch-restrictions/list.test.ts`.
- [ ] **T058**: Implement `bitbucket.repositories.branch-restrictions.list` in `src/tools/operations/repositories/branch-restrictions/list.ts`.
- [ ] **T059** [P]: Write contract test for `bitbucket.repositories.branch-restrictions.create` in `tests/contract/operations/repositories/branch-restrictions/create.test.ts`.
- [ ] **T060**: Implement `bitbucket.repositories.branch-restrictions.create` in `src/tools/operations/repositories/branch-restrictions/create.ts`.
- [ ] **T061** [P]: Write contract test for `bitbucket.repositories.branch-restrictions.update` in `tests/contract/operations/repositories/branch-restrictions/update.test.ts`.
- [ ] **T062**: Implement `bitbucket.repositories.branch-restrictions.update` in `src/tools/operations/repositories/branch-restrictions/update.ts`.
- [ ] **T063** [P]: Write contract test for `bitbucket.repositories.branch-restrictions.delete` in `tests/contract/operations/repositories/branch-restrictions/delete.test.ts`.
- [ ] **T064**: Implement `bitbucket.repositories.branch-restrictions.delete` in `src/tools/operations/repositories/branch-restrictions/delete.ts`.

*(...and so on for all other repository-related endpoints like webhooks, permissions, etc.)*
