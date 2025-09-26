# Tasks: Pull Request Management (Continuation)

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
This file lists the remaining tasks for implementing the **Pull Request** API endpoints. The process for each endpoint is identical: write a contract test, then write the implementation to make it pass. All list operations must use the shared pagination utility defined in `tasks.md` (T400).

---

## Phase 3.2: Core Implementation (Pull Requests)

### Group 2.1: Core Pull Request Operations
- [ ] **T065** [P]: Write contract test for `bitbucket.pull-requests.comments.get` in `tests/contract/operations/pull-requests/comments/get.test.ts`.
- [ ] **T066**: Implement `bitbucket.pull-requests.comments.get` in `src/tools/operations/pull-requests/comments/get.ts`.
- [ ] **T067** [P]: Write contract test for `bitbucket.pull-requests.comments.update` in `tests/contract/operations/pull-requests/comments/update.test.ts`.
- [ ] **T068**: Implement `bitbucket.pull-requests.comments.update` in `src/tools/operations/pull-requests/comments/update.ts`.
- [ ] **T069** [P]: Write contract test for `bitbucket.pull-requests.comments.delete` in `tests/contract/operations/pull-requests/comments/delete.test.ts`.
- [ ] **T070**: Implement `bitbucket.pull-requests.comments.delete` in `src/tools/operations/pull-requests/comments/delete.ts`.

### Group 2.2: Pull Request Tasks
- [ ] **T071** [P]: Write contract test for `bitbucket.pull-requests.tasks.list` in `tests/contract/operations/pull-requests/tasks/list.test.ts`.
- [ ] **T072**: Implement `bitbucket.pull-requests.tasks.list` in `src/tools/operations/pull-requests/tasks/list.ts`.
- [ ] **T073** [P]: Write contract test for `bitbucket.pull-requests.tasks.create` in `tests/contract/operations/pull-requests/tasks/create.test.ts`.
- [ ] **T074**: Implement `bitbucket.pull-requests.tasks.create` in `src/tools/operations/pull-requests/tasks/create.ts`.
- [ ] **T075** [P]: Write contract test for `bitbucket.pull-requests.tasks.get` in `tests/contract/operations/pull-requests/tasks/get.test.ts`.
- [ ] **T076**: Implement `bitbucket.pull-requests.tasks.get` in `src/tools/operations/pull-requests/tasks/get.ts`.
- [ ] **T077** [P]: Write contract test for `bitbucket.pull-requests.tasks.update` in `tests/contract/operations/pull-requests/tasks/update.test.ts`.
- [ ] **T078**: Implement `bitbucket.pull-requests.tasks.update` in `src/tools/operations/pull-requests/tasks/update.ts`.
- [ ] **T079** [P]: Write contract test for `bitbucket.pull-requests.tasks.delete` in `tests/contract/operations/pull-requests/tasks/delete.test.ts`.
- [ ] **T080**: Implement `bitbucket.pull-requests.tasks.delete` in `src/tools/operations/pull-requests/tasks/delete.ts`.

*(...and so on for all other pull request-related endpoints like statuses, etc.)*
