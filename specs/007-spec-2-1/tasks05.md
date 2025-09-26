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

## Extended Coverage

### Cloud · Users Operations
- [ ] **T930** [P]: Write contract test for `bitbucket.user.emails.get` in `tests/contract/operations/user/emails/get.test.ts`.
- [ ] **T931**: Implement `bitbucket.user.emails.get` in `src/tools/operations/user/emails/get.ts`.
- [ ] **T932** [P]: Write contract test for `bitbucket.user.get` in `tests/contract/operations/user/get.test.ts`.
- [ ] **T933**: Implement `bitbucket.user.get` in `src/tools/operations/user/get.ts`.

### Cloud · SSH Operations
- [ ] **T934** [P]: Write contract test for `bitbucket.users.ssh-keys.add` in `tests/contract/operations/users/ssh-keys/add.test.ts`.
- [ ] **T935**: Implement `bitbucket.users.ssh-keys.add` in `src/tools/operations/users/ssh-keys/add.ts`.
- [ ] **T936** [P]: Write contract test for `bitbucket.users.ssh-keys.delete` in `tests/contract/operations/users/ssh-keys/delete.test.ts`.
- [ ] **T937**: Implement `bitbucket.users.ssh-keys.delete` in `src/tools/operations/users/ssh-keys/delete.ts`.
- [ ] **T938** [P]: Write contract test for `bitbucket.users.ssh-keys.get` in `tests/contract/operations/users/ssh-keys/get.test.ts`.
- [ ] **T939**: Implement `bitbucket.users.ssh-keys.get` in `src/tools/operations/users/ssh-keys/get.ts`.
- [ ] **T940** [P]: Write contract test for `bitbucket.users.ssh-keys.list` in `tests/contract/operations/users/ssh-keys/list.test.ts`.
- [ ] **T941**: Implement `bitbucket.users.ssh-keys.list` in `src/tools/operations/users/ssh-keys/list.ts`.
- [ ] **T942** [P]: Write contract test for `bitbucket.users.ssh-keys.update` in `tests/contract/operations/users/ssh-keys/update.test.ts`.
- [ ] **T943**: Implement `bitbucket.users.ssh-keys.update` in `src/tools/operations/users/ssh-keys/update.ts`.

### Cloud · GPG Operations
- [ ] **T944** [P]: Write contract test for `bitbucket.users.gpg-keys.add` in `tests/contract/operations/users/gpg-keys/add.test.ts`.
- [ ] **T945**: Implement `bitbucket.users.gpg-keys.add` in `src/tools/operations/users/gpg-keys/add.ts`.
- [ ] **T946** [P]: Write contract test for `bitbucket.users.gpg-keys.delete` in `tests/contract/operations/users/gpg-keys/delete.test.ts`.
- [ ] **T947**: Implement `bitbucket.users.gpg-keys.delete` in `src/tools/operations/users/gpg-keys/delete.ts`.
- [ ] **T948** [P]: Write contract test for `bitbucket.users.gpg-keys.get` in `tests/contract/operations/users/gpg-keys/get.test.ts`.
- [ ] **T949**: Implement `bitbucket.users.gpg-keys.get` in `src/tools/operations/users/gpg-keys/get.ts`.
- [ ] **T950** [P]: Write contract test for `bitbucket.users.gpg-keys.list` in `tests/contract/operations/users/gpg-keys/list.test.ts`.
- [ ] **T951**: Implement `bitbucket.users.gpg-keys.list` in `src/tools/operations/users/gpg-keys/list.ts`.
