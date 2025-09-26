# Tasks: Projects and Workspaces Management

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
This file lists the tasks for implementing the **Projects and Workspaces** API endpoints. The process for each endpoint is identical: write a contract test, then write the implementation to make it pass. All list operations must use the shared pagination utility defined in `tasks.md` (T400).

---

## Phase 3.2: Core Implementation (Projects & Workspaces)

### Group 3.1: Workspace Operations
- [ ] **T081** [P]: Write contract test for `bitbucket.workspaces.list` in `tests/contract/operations/workspaces/list.test.ts`.
- [ ] **T082**: Implement `bitbucket.workspaces.list` in `src/tools/operations/workspaces/list.ts`.
- [ ] **T083** [P]: Write contract test for `bitbucket.workspaces.get` in `tests/contract/operations/workspaces/get.test.ts`.
- [ ] **T084**: Implement `bitbucket.workspaces.get` in `src/tools/operations/workspaces/get.ts`.
- [ ] **T085** [P]: Write contract test for `bitbucket.workspaces.members.list` in `tests/contract/operations/workspaces/members/list.test.ts`.
- [ ] **T086**: Implement `bitbucket.workspaces.members.list` in `src/tools/operations/workspaces/members/list.ts`.
- [ ] **T087** [P]: Write contract test for `bitbucket.workspaces.permissions.get` in `tests/contract/operations/workspaces/permissions/get.test.ts`.
- [ ] **T088**: Implement `bitbucket.workspaces.permissions.get` in `src/tools/operations/workspaces/permissions/get.ts`.

### Group 3.2: Project Operations
- [ ] **T089** [P]: Write contract test for `bitbucket.projects.list` in `tests/contract/operations/projects/list.test.ts`.
- [ ] **T090**: Implement `bitbucket.projects.list` in `src/tools/operations/projects/list.ts`.
- [ ] **T091** [P]: Write contract test for `bitbucket.projects.get` in `tests/contract/operations/projects/get.test.ts`.
- [ ] **T092**: Implement `bitbucket.projects.get` in `src/tools/operations/projects/get.ts`.
- [ ] **T093** [P]: Write contract test for `bitbucket.projects.create` in `tests/contract/operations/projects/create.test.ts`.
- [ ] **T094**: Implement `bitbucket.projects.create` in `src/tools/operations/projects/create.ts`.
- [ ] **T095** [P]: Write contract test for `bitbucket.projects.update` in `tests/contract/operations/projects/update.test.ts`.
- [ ] **T096**: Implement `bitbucket.projects.update` in `src/tools/operations/projects/update.ts`.
- [ ] **T097** [P]: Write contract test for `bitbucket.projects.delete` in `tests/contract/operations/projects/delete.test.ts`.
- [ ] **T098**: Implement `bitbucket.projects.delete` in `src/tools/operations/projects/delete.ts`.
