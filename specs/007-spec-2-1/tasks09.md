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
