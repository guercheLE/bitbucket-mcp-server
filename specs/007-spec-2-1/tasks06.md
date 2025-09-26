# Tasks: Pipelines and Deployments Management

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
This file lists the tasks for implementing the **Pipelines and Deployments** API endpoints.

---

## Phase 3.2: Core Implementation (Pipelines & Deployments)

### Group 5.1: Pipelines Operations
- [ ] **T111** [P]: Write contract test for `bitbucket.pipelines.list` in `tests/contract/operations/pipelines/list.test.ts`.
- [ ] **T112**: Implement `bitbucket.pipelines.list` in `src/tools/operations/pipelines/list.ts`.
- [ ] **T113** [P]: Write contract test for `bitbucket.pipelines.get` in `tests/contract/operations/pipelines/get.test.ts`.
- [ ] **T114**: Implement `bitbucket.pipelines.get` in `src/tools/operations/pipelines/get.ts`.
- [ ] **T115** [P]: Write contract test for `bitbucket.pipelines.stop` in `tests/contract/operations/pipelines/stop.test.ts`.
- [ ] **T116**: Implement `bitbucket.pipelines.stop` in `src/tools/operations/pipelines/stop.ts`.

### Group 5.2: Deployments Operations
- [ ] **T117** [P]: Write contract test for `bitbucket.deployments.list` in `tests/contract/operations/deployments/list.test.ts`.
- [ ] **T118**: Implement `bitbucket.deployments.list` in `src/tools/operations/deployments/list.ts`.
- [ ] **T119** [P]: Write contract test for `bitbucket.deployments.get` in `tests/contract/operations/deployments/get.test.ts`.
- [ ] **T120**: Implement `bitbucket.deployments.get` in `src/tools/operations/deployments/get.ts`.
- [ ] **T121** [P]: Write contract test for `bitbucket.deployments.environments.list` in `tests/contract/operations/deployments/environments/list.test.ts`.
- [ ] **T122**: Implement `bitbucket.deployments.environments.list` in `src/tools/operations/deployments/environments/list.ts`.
