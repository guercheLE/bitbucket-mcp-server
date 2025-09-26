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

## Extended Coverage

### Cloud · Repositories Operations
- [ ] **T464** [P]: Write contract test for `bitbucket.repositories.forks.fork` in `tests/contract/operations/repositories/forks/fork.test.ts`.
- [ ] **T465**: Implement `bitbucket.repositories.forks.fork` in `src/tools/operations/repositories/forks/fork.ts`.
- [ ] **T466** [P]: Write contract test for `bitbucket.repositories.forks.list` in `tests/contract/operations/repositories/forks/list.test.ts`.
- [ ] **T467**: Implement `bitbucket.repositories.forks.list` in `src/tools/operations/repositories/forks/list.ts`.
- [ ] **T468** [P]: Write contract test for `bitbucket.repositories.hooks.create` in `tests/contract/operations/repositories/hooks/create.test.ts`.
- [ ] **T469**: Implement `bitbucket.repositories.hooks.create` in `src/tools/operations/repositories/hooks/create.ts`.
- [ ] **T470** [P]: Write contract test for `bitbucket.repositories.hooks.delete` in `tests/contract/operations/repositories/hooks/delete.test.ts`.
- [ ] **T471**: Implement `bitbucket.repositories.hooks.delete` in `src/tools/operations/repositories/hooks/delete.ts`.
- [ ] **T472** [P]: Write contract test for `bitbucket.repositories.hooks.get` in `tests/contract/operations/repositories/hooks/get.test.ts`.
- [ ] **T473**: Implement `bitbucket.repositories.hooks.get` in `src/tools/operations/repositories/hooks/get.ts`.
- [ ] **T474** [P]: Write contract test for `bitbucket.repositories.hooks.list` in `tests/contract/operations/repositories/hooks/list.test.ts`.
- [ ] **T475**: Implement `bitbucket.repositories.hooks.list` in `src/tools/operations/repositories/hooks/list.ts`.
- [ ] **T476** [P]: Write contract test for `bitbucket.repositories.hooks.update` in `tests/contract/operations/repositories/hooks/update.test.ts`.
- [ ] **T477**: Implement `bitbucket.repositories.hooks.update` in `src/tools/operations/repositories/hooks/update.ts`.
- [ ] **T478** [P]: Write contract test for `bitbucket.repositories.override-settings.retrieve` in `tests/contract/operations/repositories/override-settings/retrieve.test.ts`.
- [ ] **T479**: Implement `bitbucket.repositories.override-settings.retrieve` in `src/tools/operations/repositories/override-settings/retrieve.ts`.
- [ ] **T480** [P]: Write contract test for `bitbucket.repositories.override-settings.set` in `tests/contract/operations/repositories/override-settings/set.test.ts`.
- [ ] **T481**: Implement `bitbucket.repositories.override-settings.set` in `src/tools/operations/repositories/override-settings/set.ts`.
- [ ] **T482** [P]: Write contract test for `bitbucket.repositories.permissions-config.groups.delete` in `tests/contract/operations/repositories/permissions-config/groups/delete.test.ts`.
- [ ] **T483**: Implement `bitbucket.repositories.permissions-config.groups.delete` in `src/tools/operations/repositories/permissions-config/groups/delete.ts`.
- [ ] **T484** [P]: Write contract test for `bitbucket.repositories.permissions-config.groups.get` in `tests/contract/operations/repositories/permissions-config/groups/get.test.ts`.
- [ ] **T485**: Implement `bitbucket.repositories.permissions-config.groups.get` in `src/tools/operations/repositories/permissions-config/groups/get.ts`.
- [ ] **T486** [P]: Write contract test for `bitbucket.repositories.permissions-config.groups.list` in `tests/contract/operations/repositories/permissions-config/groups/list.test.ts`.
- [ ] **T487**: Implement `bitbucket.repositories.permissions-config.groups.list` in `src/tools/operations/repositories/permissions-config/groups/list.ts`.
- [ ] **T488** [P]: Write contract test for `bitbucket.repositories.permissions-config.groups.update` in `tests/contract/operations/repositories/permissions-config/groups/update.test.ts`.
- [ ] **T489**: Implement `bitbucket.repositories.permissions-config.groups.update` in `src/tools/operations/repositories/permissions-config/groups/update.ts`.
- [ ] **T490** [P]: Write contract test for `bitbucket.repositories.permissions-config.users.delete` in `tests/contract/operations/repositories/permissions-config/users/delete.test.ts`.
- [ ] **T491**: Implement `bitbucket.repositories.permissions-config.users.delete` in `src/tools/operations/repositories/permissions-config/users/delete.ts`.
- [ ] **T492** [P]: Write contract test for `bitbucket.repositories.permissions-config.users.get` in `tests/contract/operations/repositories/permissions-config/users/get.test.ts`.
- [ ] **T493**: Implement `bitbucket.repositories.permissions-config.users.get` in `src/tools/operations/repositories/permissions-config/users/get.ts`.
- [ ] **T494** [P]: Write contract test for `bitbucket.repositories.permissions-config.users.list` in `tests/contract/operations/repositories/permissions-config/users/list.test.ts`.
- [ ] **T495**: Implement `bitbucket.repositories.permissions-config.users.list` in `src/tools/operations/repositories/permissions-config/users/list.ts`.
- [ ] **T496** [P]: Write contract test for `bitbucket.repositories.permissions-config.users.update` in `tests/contract/operations/repositories/permissions-config/users/update.test.ts`.
- [ ] **T497**: Implement `bitbucket.repositories.permissions-config.users.update` in `src/tools/operations/repositories/permissions-config/users/update.ts`.
- [ ] **T498** [P]: Write contract test for `bitbucket.repositories.watchers.list` in `tests/contract/operations/repositories/watchers/list.test.ts`.
- [ ] **T499**: Implement `bitbucket.repositories.watchers.list` in `src/tools/operations/repositories/watchers/list.ts`.
- [ ] **T500** [P]: Write contract test for `bitbucket.user.permissions.repositories.list` in `tests/contract/operations/user/permissions/repositories/list.test.ts`.
- [ ] **T501**: Implement `bitbucket.user.permissions.repositories.list` in `src/tools/operations/user/permissions/repositories/list.ts`.

### Cloud · Refs Operations
- [ ] **T502** [P]: Write contract test for `bitbucket.repositories.refs.branches.delete` in `tests/contract/operations/repositories/refs/branches/delete.test.ts`.
- [ ] **T503**: Implement `bitbucket.repositories.refs.branches.delete` in `src/tools/operations/repositories/refs/branches/delete.ts`.
- [ ] **T504** [P]: Write contract test for `bitbucket.repositories.refs.branches.get` in `tests/contract/operations/repositories/refs/branches/get.test.ts`.
- [ ] **T505**: Implement `bitbucket.repositories.refs.branches.get` in `src/tools/operations/repositories/refs/branches/get.ts`.
- [ ] **T506** [P]: Write contract test for `bitbucket.repositories.refs.list` in `tests/contract/operations/repositories/refs/list.test.ts`.
- [ ] **T507**: Implement `bitbucket.repositories.refs.list` in `src/tools/operations/repositories/refs/list.ts`.
- [ ] **T508** [P]: Write contract test for `bitbucket.repositories.refs.tags.delete` in `tests/contract/operations/repositories/refs/tags/delete.test.ts`.
- [ ] **T509**: Implement `bitbucket.repositories.refs.tags.delete` in `src/tools/operations/repositories/refs/tags/delete.ts`.
- [ ] **T510** [P]: Write contract test for `bitbucket.repositories.refs.tags.get` in `tests/contract/operations/repositories/refs/tags/get.test.ts`.
- [ ] **T511**: Implement `bitbucket.repositories.refs.tags.get` in `src/tools/operations/repositories/refs/tags/get.ts`.

### Cloud · Branching Model Operations
- [ ] **T512** [P]: Write contract test for `bitbucket.repositories.branching-model.get` in `tests/contract/operations/repositories/branching-model/get.test.ts`.
- [ ] **T513**: Implement `bitbucket.repositories.branching-model.get` in `src/tools/operations/repositories/branching-model/get.ts`.
- [ ] **T514** [P]: Write contract test for `bitbucket.repositories.branching-model.settings.get` in `tests/contract/operations/repositories/branching-model/settings/get.test.ts`.
- [ ] **T515**: Implement `bitbucket.repositories.branching-model.settings.get` in `src/tools/operations/repositories/branching-model/settings/get.ts`.
- [ ] **T516** [P]: Write contract test for `bitbucket.repositories.branching-model.settings.update` in `tests/contract/operations/repositories/branching-model/settings/update.test.ts`.
- [ ] **T517**: Implement `bitbucket.repositories.branching-model.settings.update` in `src/tools/operations/repositories/branching-model/settings/update.ts`.
- [ ] **T518** [P]: Write contract test for `bitbucket.repositories.effective-branching-model.get` in `tests/contract/operations/repositories/effective-branching-model/get.test.ts`.
- [ ] **T519**: Implement `bitbucket.repositories.effective-branching-model.get` in `src/tools/operations/repositories/effective-branching-model/get.ts`.
- [ ] **T520** [P]: Write contract test for `bitbucket.workspaces.projects.branching-model.get` in `tests/contract/operations/workspaces/projects/branching-model/get.test.ts`.
- [ ] **T521**: Implement `bitbucket.workspaces.projects.branching-model.get` in `src/tools/operations/workspaces/projects/branching-model/get.ts`.
- [ ] **T522** [P]: Write contract test for `bitbucket.workspaces.projects.branching-model.settings.get` in `tests/contract/operations/workspaces/projects/branching-model/settings/get.test.ts`.
- [ ] **T523**: Implement `bitbucket.workspaces.projects.branching-model.settings.get` in `src/tools/operations/workspaces/projects/branching-model/settings/get.ts`.
- [ ] **T524** [P]: Write contract test for `bitbucket.workspaces.projects.branching-model.settings.update` in `tests/contract/operations/workspaces/projects/branching-model/settings/update.test.ts`.
- [ ] **T525**: Implement `bitbucket.workspaces.projects.branching-model.settings.update` in `src/tools/operations/workspaces/projects/branching-model/settings/update.ts`.

### Cloud · Branch Restrictions Operations
- [ ] **T526** [P]: Write contract test for `bitbucket.repositories.branch-restrictions.get` in `tests/contract/operations/repositories/branch-restrictions/get.test.ts`.
- [ ] **T527**: Implement `bitbucket.repositories.branch-restrictions.get` in `src/tools/operations/repositories/branch-restrictions/get.ts`.

### Cloud · Properties Operations
- [ ] **T528** [P]: Write contract test for `bitbucket.repositories.commit.properties.delete` in `tests/contract/operations/repositories/commit/properties/delete.test.ts`.
- [ ] **T529**: Implement `bitbucket.repositories.commit.properties.delete` in `src/tools/operations/repositories/commit/properties/delete.ts`.
- [ ] **T530** [P]: Write contract test for `bitbucket.repositories.commit.properties.get` in `tests/contract/operations/repositories/commit/properties/get.test.ts`.
- [ ] **T531**: Implement `bitbucket.repositories.commit.properties.get` in `src/tools/operations/repositories/commit/properties/get.ts`.
- [ ] **T532** [P]: Write contract test for `bitbucket.repositories.commit.properties.update` in `tests/contract/operations/repositories/commit/properties/update.test.ts`.
- [ ] **T533**: Implement `bitbucket.repositories.commit.properties.update` in `src/tools/operations/repositories/commit/properties/update.ts`.
- [ ] **T534** [P]: Write contract test for `bitbucket.repositories.properties.delete` in `tests/contract/operations/repositories/properties/delete.test.ts`.
- [ ] **T535**: Implement `bitbucket.repositories.properties.delete` in `src/tools/operations/repositories/properties/delete.ts`.
- [ ] **T536** [P]: Write contract test for `bitbucket.repositories.properties.get` in `tests/contract/operations/repositories/properties/get.test.ts`.
- [ ] **T537**: Implement `bitbucket.repositories.properties.get` in `src/tools/operations/repositories/properties/get.ts`.
- [ ] **T538** [P]: Write contract test for `bitbucket.repositories.properties.update` in `tests/contract/operations/repositories/properties/update.test.ts`.
- [ ] **T539**: Implement `bitbucket.repositories.properties.update` in `src/tools/operations/repositories/properties/update.ts`.
- [ ] **T540** [P]: Write contract test for `bitbucket.repositories.pullrequests.properties.delete` in `tests/contract/operations/repositories/pullrequests/properties/delete.test.ts`.
- [ ] **T541**: Implement `bitbucket.repositories.pullrequests.properties.delete` in `src/tools/operations/repositories/pullrequests/properties/delete.ts`.
- [ ] **T542** [P]: Write contract test for `bitbucket.repositories.pullrequests.properties.get` in `tests/contract/operations/repositories/pullrequests/properties/get.test.ts`.
- [ ] **T543**: Implement `bitbucket.repositories.pullrequests.properties.get` in `src/tools/operations/repositories/pullrequests/properties/get.ts`.
- [ ] **T544** [P]: Write contract test for `bitbucket.repositories.pullrequests.properties.update` in `tests/contract/operations/repositories/pullrequests/properties/update.test.ts`.
- [ ] **T545**: Implement `bitbucket.repositories.pullrequests.properties.update` in `src/tools/operations/repositories/pullrequests/properties/update.ts`.
- [ ] **T546** [P]: Write contract test for `bitbucket.users.properties.delete` in `tests/contract/operations/users/properties/delete.test.ts`.
- [ ] **T547**: Implement `bitbucket.users.properties.delete` in `src/tools/operations/users/properties/delete.ts`.
- [ ] **T548** [P]: Write contract test for `bitbucket.users.properties.get` in `tests/contract/operations/users/properties/get.test.ts`.
- [ ] **T549**: Implement `bitbucket.users.properties.get` in `src/tools/operations/users/properties/get.ts`.
- [ ] **T550** [P]: Write contract test for `bitbucket.users.properties.update` in `tests/contract/operations/users/properties/update.test.ts`.
- [ ] **T551**: Implement `bitbucket.users.properties.update` in `src/tools/operations/users/properties/update.ts`.

### Cloud · Downloads Operations
- [ ] **T552** [P]: Write contract test for `bitbucket.repositories.downloads.delete` in `tests/contract/operations/repositories/downloads/delete.test.ts`.
- [ ] **T553**: Implement `bitbucket.repositories.downloads.delete` in `src/tools/operations/repositories/downloads/delete.ts`.
- [ ] **T554** [P]: Write contract test for `bitbucket.repositories.downloads.get` in `tests/contract/operations/repositories/downloads/get.test.ts`.
- [ ] **T555**: Implement `bitbucket.repositories.downloads.get` in `src/tools/operations/repositories/downloads/get.ts`.
- [ ] **T556** [P]: Write contract test for `bitbucket.repositories.downloads.list` in `tests/contract/operations/repositories/downloads/list.test.ts`.
- [ ] **T557**: Implement `bitbucket.repositories.downloads.list` in `src/tools/operations/repositories/downloads/list.ts`.
- [ ] **T558** [P]: Write contract test for `bitbucket.repositories.downloads.upload` in `tests/contract/operations/repositories/downloads/upload.test.ts`.
- [ ] **T559**: Implement `bitbucket.repositories.downloads.upload` in `src/tools/operations/repositories/downloads/upload.ts`.

### Cloud · Search Operations
- [ ] **T560** [P]: Write contract test for `bitbucket.teams.search.code.search` in `tests/contract/operations/teams/search/code/search.test.ts`.
- [ ] **T561**: Implement `bitbucket.teams.search.code.search` in `src/tools/operations/teams/search/code/search.ts`.
- [ ] **T562** [P]: Write contract test for `bitbucket.users.search.code.search` in `tests/contract/operations/users/search/code/search.test.ts`.
- [ ] **T563**: Implement `bitbucket.users.search.code.search` in `src/tools/operations/users/search/code/search.ts`.
- [ ] **T564** [P]: Write contract test for `bitbucket.workspaces.search.code.search` in `tests/contract/operations/workspaces/search/code/search.test.ts`.
- [ ] **T565**: Implement `bitbucket.workspaces.search.code.search` in `src/tools/operations/workspaces/search/code/search.ts`.
