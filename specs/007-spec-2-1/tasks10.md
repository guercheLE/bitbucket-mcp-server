# Tasks: Administration and Server Settings

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
This file lists the tasks for implementing **Administration and Server Settings** API endpoints, which are primarily for Bitbucket Data Center.

---

## Phase 3.2: Core Implementation (Admin & Settings)

### Group 9.1: User and Group Management (Admin)
- [ ] **T163** [P]: Write contract test for `bitbucket.dc.admin.users.create` in `tests/contract/operations/admin/users/create.test.ts`.
- [ ] **T164**: Implement `bitbucket.dc.admin.users.create` in `src/tools/operations/admin/users/create.ts`.
- [ ] **T165** [P]: Write contract test for `bitbucket.dc.admin.users.list` in `tests/contract/operations/admin/users/list.test.ts`.
- [ ] **T166**: Implement `bitbucket.dc.admin.users.list` in `src/tools/operations/admin/users/list.ts`.

### Group 9.2: Permissions Management (Admin)
- [ ] **T167** [P]: Write contract test for `bitbucket.dc.admin.permissions.groups.list` in `tests/contract/operations/admin/permissions/groups/list.test.ts`.
- [ ] **T168**: Implement `bitbucket.dc.admin.permissions.groups.list` in `src/tools/operations/admin/permissions/groups/list.ts`.
- [ ] **T169** [P]: Write contract test for `bitbucket.dc.admin.permissions.users.list` in `tests/contract/operations/admin/permissions/users/list.test.ts`.
- [ ] **T170**: Implement `bitbucket.dc.admin.permissions.users.list` in `src/tools/operations/admin/permissions/users/list.ts`.

### Group 9.3: Server Settings
- [ ] **T171** [P]: Write contract test for `bitbucket.dc.admin.license.get` in `tests/contract/operations/admin/license/get.test.ts`.
- [ ] **T172**: Implement `bitbucket.dc.admin.license.get` in `src/tools/operations/admin/license/get.ts`.
- [ ] **T173** [P]: Write contract test for `bitbucket.dc.admin.mailServer.get` in `tests/contract/operations/admin/mailServer/get.test.ts`.
- [ ] **T174**: Implement `bitbucket.dc.admin.mailServer.get` in `src/tools/operations/admin/mailServer/get.ts`.
