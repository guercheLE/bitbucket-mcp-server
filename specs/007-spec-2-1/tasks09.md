# Tasks: Source Code, Commits, and Diffs Management

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
This file lists the tasks for implementing API endpoints related to **Source Code, Commits, and Diffs**.

---

## Phase 3.2: Core Implementation (Source, Commits, Diffs)

### Group 8.1: Source Code Operations
- [ ] **T153** [P]: Write contract test for `bitbucket.source.browse` in `tests/contract/operations/source/browse.test.ts`.
- [ ] **T154**: Implement `bitbucket.source.browse` in `src/tools/operations/source/browse.ts`.
- [ ] **T155** [P]: Write contract test for `bitbucket.source.getFile` in `tests/contract/operations/source/getFile.test.ts`.
- [ ] **T156**: Implement `bitbucket.source.getFile` in `src/tools/operations/source/getFile.ts`.
- [ ] **T157** [P]: Write contract test for `bitbucket.source.getHistory` in `tests/contract/operations/source/getHistory.test.ts`.
- [ ] **T158**: Implement `bitbucket.source.getHistory` in `src/tools/operations/source/getHistory.ts`.

### Group 8.2: Diff Operations
- [ ] **T159** [P]: Write contract test for `bitbucket.diff.get` in `tests/contract/operations/diff/get.test.ts`.
- [ ] **T160**: Implement `bitbucket.diff.get` in `src/tools/operations/diff/get.ts`.
- [ ] **T161** [P]: Write contract test for `bitbucket.diff.getStat` in `tests/contract/operations/diff/getStat.test.ts`.
- [ ] **T162**: Implement `bitbucket.diff.getStat` in `src/tools/operations/diff/getStat.ts`.

## Extended Coverage

### Cloud · Commits Operations
- [ ] **T566** [P]: Write contract test for `bitbucket.repositories.commit.approve` in `tests/contract/operations/repositories/commit/approve.test.ts`.
- [ ] **T567**: Implement `bitbucket.repositories.commit.approve` in `src/tools/operations/repositories/commit/approve.ts`.
- [ ] **T568** [P]: Write contract test for `bitbucket.repositories.commit.comments.delete` in `tests/contract/operations/repositories/commit/comments/delete.test.ts`.
- [ ] **T569**: Implement `bitbucket.repositories.commit.comments.delete` in `src/tools/operations/repositories/commit/comments/delete.ts`.
- [ ] **T570** [P]: Write contract test for `bitbucket.repositories.commit.comments.get` in `tests/contract/operations/repositories/commit/comments/get.test.ts`.
- [ ] **T571**: Implement `bitbucket.repositories.commit.comments.get` in `src/tools/operations/repositories/commit/comments/get.ts`.
- [ ] **T572** [P]: Write contract test for `bitbucket.repositories.commit.comments.update` in `tests/contract/operations/repositories/commit/comments/update.test.ts`.
- [ ] **T573**: Implement `bitbucket.repositories.commit.comments.update` in `src/tools/operations/repositories/commit/comments/update.ts`.
- [ ] **T574** [P]: Write contract test for `bitbucket.repositories.commit.unapprove` in `tests/contract/operations/repositories/commit/unapprove.test.ts`.
- [ ] **T575**: Implement `bitbucket.repositories.commit.unapprove` in `src/tools/operations/repositories/commit/unapprove.ts`.
- [ ] **T576** [P]: Write contract test for `bitbucket.repositories.commits.create` in `tests/contract/operations/repositories/commits/create.test.ts`.
- [ ] **T577**: Implement `bitbucket.repositories.commits.create` in `src/tools/operations/repositories/commits/create.ts`.
- [ ] **T578** [P]: Write contract test for `bitbucket.repositories.commits.create` in `tests/contract/operations/repositories/commits/create.test.ts`.
- [ ] **T579**: Implement `bitbucket.repositories.commits.create` in `src/tools/operations/repositories/commits/create.ts`.
- [ ] **T580** [P]: Write contract test for `bitbucket.repositories.commits.get` in `tests/contract/operations/repositories/commits/get.test.ts`.
- [ ] **T581**: Implement `bitbucket.repositories.commits.get` in `src/tools/operations/repositories/commits/get.ts`.
- [ ] **T582** [P]: Write contract test for `bitbucket.repositories.diff.compare` in `tests/contract/operations/repositories/diff/compare.test.ts`.
- [ ] **T583**: Implement `bitbucket.repositories.diff.compare` in `src/tools/operations/repositories/diff/compare.ts`.
- [ ] **T584** [P]: Write contract test for `bitbucket.repositories.diffstat.compare` in `tests/contract/operations/repositories/diffstat/compare.test.ts`.
- [ ] **T585**: Implement `bitbucket.repositories.diffstat.compare` in `src/tools/operations/repositories/diffstat/compare.ts`.
- [ ] **T586** [P]: Write contract test for `bitbucket.repositories.merge-base.get` in `tests/contract/operations/repositories/merge-base/get.test.ts`.
- [ ] **T587**: Implement `bitbucket.repositories.merge-base.get` in `src/tools/operations/repositories/merge-base/get.ts`.
- [ ] **T588** [P]: Write contract test for `bitbucket.repositories.patch.get` in `tests/contract/operations/repositories/patch/get.test.ts`.
- [ ] **T589**: Implement `bitbucket.repositories.patch.get` in `src/tools/operations/repositories/patch/get.ts`.

### Cloud · Commit Statuses Operations
- [ ] **T590** [P]: Write contract test for `bitbucket.repositories.commit.statuses.build.create` in `tests/contract/operations/repositories/commit/statuses/build/create.test.ts`.
- [ ] **T591**: Implement `bitbucket.repositories.commit.statuses.build.create` in `src/tools/operations/repositories/commit/statuses/build/create.ts`.
- [ ] **T592** [P]: Write contract test for `bitbucket.repositories.commit.statuses.build.get` in `tests/contract/operations/repositories/commit/statuses/build/get.test.ts`.
- [ ] **T593**: Implement `bitbucket.repositories.commit.statuses.build.get` in `src/tools/operations/repositories/commit/statuses/build/get.ts`.
- [ ] **T594** [P]: Write contract test for `bitbucket.repositories.commit.statuses.build.update` in `tests/contract/operations/repositories/commit/statuses/build/update.test.ts`.
- [ ] **T595**: Implement `bitbucket.repositories.commit.statuses.build.update` in `src/tools/operations/repositories/commit/statuses/build/update.ts`.
- [ ] **T596** [P]: Write contract test for `bitbucket.repositories.commit.statuses.list` in `tests/contract/operations/repositories/commit/statuses/list.test.ts`.
- [ ] **T597**: Implement `bitbucket.repositories.commit.statuses.list` in `src/tools/operations/repositories/commit/statuses/list.ts`.

### Cloud · Source Operations
- [ ] **T598** [P]: Write contract test for `bitbucket.repositories.filehistory.get` in `tests/contract/operations/repositories/filehistory/get.test.ts`.
- [ ] **T599**: Implement `bitbucket.repositories.filehistory.get` in `src/tools/operations/repositories/filehistory/get.ts`.
- [ ] **T600** [P]: Write contract test for `bitbucket.repositories.src.create` in `tests/contract/operations/repositories/src/create.test.ts`.
- [ ] **T601**: Implement `bitbucket.repositories.src.create` in `src/tools/operations/repositories/src/create.ts`.
- [ ] **T602** [P]: Write contract test for `bitbucket.repositories.src.get` in `tests/contract/operations/repositories/src/get.test.ts`.
- [ ] **T603**: Implement `bitbucket.repositories.src.get` in `src/tools/operations/repositories/src/get.ts`.
- [ ] **T604** [P]: Write contract test for `bitbucket.repositories.src.get` in `tests/contract/operations/repositories/src/get.test.ts`.
- [ ] **T605**: Implement `bitbucket.repositories.src.get` in `src/tools/operations/repositories/src/get.ts`.
