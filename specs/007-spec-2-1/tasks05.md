# Tasks: Users and Groups Management

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
This file lists the tasks for implementing the **Users and Groups** API endpoints.

---

## Phase 3.2: Core Implementation (Users & Groups)

### Group 4.1: User Operations
- [ ] **T099** [P]: Write contract test for `bitbucket.users.get` in `tests/contract/operations/users/get.test.ts`.
- [ ] **T100**: Implement `bitbucket.users.get` in `src/tools/operations/users/get.ts`.
- [ ] **T101** [P]: Write contract test for `bitbucket.user.emails.list` in `tests/contract/operations/user/emails/list.test.ts`.
- [ ] **T102**: Implement `bitbucket.user.emails.list` in `src/tools/operations/user/emails/list.ts`.

### Group 4.2: Group Operations (Data Center)
- [ ] **T103** [P]: Write contract test for `bitbucket.dc.admin.groups.list` in `tests/contract/operations/admin/groups/list.test.ts`.
- [ ] **T104**: Implement `bitbucket.dc.admin.groups.list` in `src/tools/operations/admin/groups/list.ts`.
- [ ] **T105** [P]: Write contract test for `bitbucket.dc.admin.groups.create` in `tests/contract/operations/admin/groups/create.test.ts`.
- [ ] **T106**: Implement `bitbucket.dc.admin.groups.create` in `src/tools/operations/admin/groups/create.ts`.
- [ ] **T107** [P]: Write contract test for `bitbucket.dc.admin.groups.delete` in `tests/contract/operations/admin/groups/delete.test.ts`.
- [ ] **T108**: Implement `bitbucket.dc.admin.groups.delete` in `src/tools/operations/admin/groups/delete.ts`.
- [ ] **T109** [P]: Write contract test for `bitbucket.dc.admin.groups.addUsers` in `tests/contract/operations/admin/groups/addUsers.test.ts`.
- [ ] **T110**: Implement `bitbucket.dc.admin.groups.addUsers` in `src/tools/operations/admin/groups/addUsers.ts`.
