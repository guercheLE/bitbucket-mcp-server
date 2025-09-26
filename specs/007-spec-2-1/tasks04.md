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

## Extended Coverage

### Cloud · Workspaces Operations
- [ ] **T952** [P]: Write contract test for `bitbucket.user.permissions.workspaces.list` in `tests/contract/operations/user/permissions/workspaces/list.test.ts`.
- [ ] **T953**: Implement `bitbucket.user.permissions.workspaces.list` in `src/tools/operations/user/permissions/workspaces/list.ts`.
- [ ] **T954** [P]: Write contract test for `bitbucket.workspaces.hooks.create` in `tests/contract/operations/workspaces/hooks/create.test.ts`.
- [ ] **T955**: Implement `bitbucket.workspaces.hooks.create` in `src/tools/operations/workspaces/hooks/create.ts`.
- [ ] **T956** [P]: Write contract test for `bitbucket.workspaces.hooks.delete` in `tests/contract/operations/workspaces/hooks/delete.test.ts`.
- [ ] **T957**: Implement `bitbucket.workspaces.hooks.delete` in `src/tools/operations/workspaces/hooks/delete.ts`.
- [ ] **T958** [P]: Write contract test for `bitbucket.workspaces.hooks.get` in `tests/contract/operations/workspaces/hooks/get.test.ts`.
- [ ] **T959**: Implement `bitbucket.workspaces.hooks.get` in `src/tools/operations/workspaces/hooks/get.ts`.
- [ ] **T960** [P]: Write contract test for `bitbucket.workspaces.hooks.list` in `tests/contract/operations/workspaces/hooks/list.test.ts`.
- [ ] **T961**: Implement `bitbucket.workspaces.hooks.list` in `src/tools/operations/workspaces/hooks/list.ts`.
- [ ] **T962** [P]: Write contract test for `bitbucket.workspaces.hooks.update` in `tests/contract/operations/workspaces/hooks/update.test.ts`.
- [ ] **T963**: Implement `bitbucket.workspaces.hooks.update` in `src/tools/operations/workspaces/hooks/update.ts`.
- [ ] **T964** [P]: Write contract test for `bitbucket.workspaces.members.get` in `tests/contract/operations/workspaces/members/get.test.ts`.
- [ ] **T965**: Implement `bitbucket.workspaces.members.get` in `src/tools/operations/workspaces/members/get.ts`.
- [ ] **T966** [P]: Write contract test for `bitbucket.workspaces.permissions.list` in `tests/contract/operations/workspaces/permissions/list.test.ts`.
- [ ] **T967**: Implement `bitbucket.workspaces.permissions.list` in `src/tools/operations/workspaces/permissions/list.ts`.
- [ ] **T968** [P]: Write contract test for `bitbucket.workspaces.permissions.repositories.get` in `tests/contract/operations/workspaces/permissions/repositories/get.test.ts`.
- [ ] **T969**: Implement `bitbucket.workspaces.permissions.repositories.get` in `src/tools/operations/workspaces/permissions/repositories/get.ts`.
- [ ] **T970** [P]: Write contract test for `bitbucket.workspaces.permissions.repositories.list` in `tests/contract/operations/workspaces/permissions/repositories/list.test.ts`.
- [ ] **T971**: Implement `bitbucket.workspaces.permissions.repositories.list` in `src/tools/operations/workspaces/permissions/repositories/list.ts`.
- [ ] **T972** [P]: Write contract test for `bitbucket.workspaces.projects.list` in `tests/contract/operations/workspaces/projects/list.test.ts`.
- [ ] **T973**: Implement `bitbucket.workspaces.projects.list` in `src/tools/operations/workspaces/projects/list.ts`.
- [ ] **T974** [P]: Write contract test for `bitbucket.workspaces.pullrequests.get` in `tests/contract/operations/workspaces/pullrequests/get.test.ts`.
- [ ] **T975**: Implement `bitbucket.workspaces.pullrequests.get` in `src/tools/operations/workspaces/pullrequests/get.ts`.

### Cloud · Projects Operations
- [ ] **T976** [P]: Write contract test for `bitbucket.workspaces.projects.create` in `tests/contract/operations/workspaces/projects/create.test.ts`.
- [ ] **T977**: Implement `bitbucket.workspaces.projects.create` in `src/tools/operations/workspaces/projects/create.ts`.
- [ ] **T978** [P]: Write contract test for `bitbucket.workspaces.projects.default-reviewers.add` in `tests/contract/operations/workspaces/projects/default-reviewers/add.test.ts`.
- [ ] **T979**: Implement `bitbucket.workspaces.projects.default-reviewers.add` in `src/tools/operations/workspaces/projects/default-reviewers/add.ts`.
- [ ] **T980** [P]: Write contract test for `bitbucket.workspaces.projects.default-reviewers.get` in `tests/contract/operations/workspaces/projects/default-reviewers/get.test.ts`.
- [ ] **T981**: Implement `bitbucket.workspaces.projects.default-reviewers.get` in `src/tools/operations/workspaces/projects/default-reviewers/get.ts`.
- [ ] **T982** [P]: Write contract test for `bitbucket.workspaces.projects.default-reviewers.list` in `tests/contract/operations/workspaces/projects/default-reviewers/list.test.ts`.
- [ ] **T983**: Implement `bitbucket.workspaces.projects.default-reviewers.list` in `src/tools/operations/workspaces/projects/default-reviewers/list.ts`.
- [ ] **T984** [P]: Write contract test for `bitbucket.workspaces.projects.default-reviewers.remove` in `tests/contract/operations/workspaces/projects/default-reviewers/remove.test.ts`.
- [ ] **T985**: Implement `bitbucket.workspaces.projects.default-reviewers.remove` in `src/tools/operations/workspaces/projects/default-reviewers/remove.ts`.
- [ ] **T986** [P]: Write contract test for `bitbucket.workspaces.projects.delete` in `tests/contract/operations/workspaces/projects/delete.test.ts`.
- [ ] **T987**: Implement `bitbucket.workspaces.projects.delete` in `src/tools/operations/workspaces/projects/delete.ts`.
- [ ] **T988** [P]: Write contract test for `bitbucket.workspaces.projects.get` in `tests/contract/operations/workspaces/projects/get.test.ts`.
- [ ] **T989**: Implement `bitbucket.workspaces.projects.get` in `src/tools/operations/workspaces/projects/get.ts`.
- [ ] **T990** [P]: Write contract test for `bitbucket.workspaces.projects.permissions-config.groups.delete` in `tests/contract/operations/workspaces/projects/permissions-config/groups/delete.test.ts`.
- [ ] **T991**: Implement `bitbucket.workspaces.projects.permissions-config.groups.delete` in `src/tools/operations/workspaces/projects/permissions-config/groups/delete.ts`.
- [ ] **T992** [P]: Write contract test for `bitbucket.workspaces.projects.permissions-config.groups.get` in `tests/contract/operations/workspaces/projects/permissions-config/groups/get.test.ts`.
- [ ] **T993**: Implement `bitbucket.workspaces.projects.permissions-config.groups.get` in `src/tools/operations/workspaces/projects/permissions-config/groups/get.ts`.
- [ ] **T994** [P]: Write contract test for `bitbucket.workspaces.projects.permissions-config.groups.list` in `tests/contract/operations/workspaces/projects/permissions-config/groups/list.test.ts`.
- [ ] **T995**: Implement `bitbucket.workspaces.projects.permissions-config.groups.list` in `src/tools/operations/workspaces/projects/permissions-config/groups/list.ts`.
- [ ] **T996** [P]: Write contract test for `bitbucket.workspaces.projects.permissions-config.groups.update` in `tests/contract/operations/workspaces/projects/permissions-config/groups/update.test.ts`.
- [ ] **T997**: Implement `bitbucket.workspaces.projects.permissions-config.groups.update` in `src/tools/operations/workspaces/projects/permissions-config/groups/update.ts`.
- [ ] **T998** [P]: Write contract test for `bitbucket.workspaces.projects.permissions-config.users.delete` in `tests/contract/operations/workspaces/projects/permissions-config/users/delete.test.ts`.
- [ ] **T999**: Implement `bitbucket.workspaces.projects.permissions-config.users.delete` in `src/tools/operations/workspaces/projects/permissions-config/users/delete.ts`.
- [ ] **T1000** [P]: Write contract test for `bitbucket.workspaces.projects.permissions-config.users.get` in `tests/contract/operations/workspaces/projects/permissions-config/users/get.test.ts`.
- [ ] **T1001**: Implement `bitbucket.workspaces.projects.permissions-config.users.get` in `src/tools/operations/workspaces/projects/permissions-config/users/get.ts`.
- [ ] **T1002** [P]: Write contract test for `bitbucket.workspaces.projects.permissions-config.users.list` in `tests/contract/operations/workspaces/projects/permissions-config/users/list.test.ts`.
- [ ] **T1003**: Implement `bitbucket.workspaces.projects.permissions-config.users.list` in `src/tools/operations/workspaces/projects/permissions-config/users/list.ts`.
- [ ] **T1004** [P]: Write contract test for `bitbucket.workspaces.projects.permissions-config.users.update` in `tests/contract/operations/workspaces/projects/permissions-config/users/update.test.ts`.
- [ ] **T1005**: Implement `bitbucket.workspaces.projects.permissions-config.users.update` in `src/tools/operations/workspaces/projects/permissions-config/users/update.ts`.
- [ ] **T1006** [P]: Write contract test for `bitbucket.workspaces.projects.update` in `tests/contract/operations/workspaces/projects/update.test.ts`.
- [ ] **T1007**: Implement `bitbucket.workspaces.projects.update` in `src/tools/operations/workspaces/projects/update.ts`.
