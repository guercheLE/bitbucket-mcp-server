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

## Extended Coverage

### Cloud · Pullrequests Operations
- [ ] **T606** [P]: Write contract test for `bitbucket.repositories.commit.pullrequests.list` in `tests/contract/operations/repositories/commit/pullrequests/list.test.ts`.
- [ ] **T607**: Implement `bitbucket.repositories.commit.pullrequests.list` in `src/tools/operations/repositories/commit/pullrequests/list.ts`.
- [ ] **T608** [P]: Write contract test for `bitbucket.repositories.default-reviewers.add` in `tests/contract/operations/repositories/default-reviewers/add.test.ts`.
- [ ] **T609**: Implement `bitbucket.repositories.default-reviewers.add` in `src/tools/operations/repositories/default-reviewers/add.ts`.
- [ ] **T610** [P]: Write contract test for `bitbucket.repositories.default-reviewers.get` in `tests/contract/operations/repositories/default-reviewers/get.test.ts`.
- [ ] **T611**: Implement `bitbucket.repositories.default-reviewers.get` in `src/tools/operations/repositories/default-reviewers/get.ts`.
- [ ] **T612** [P]: Write contract test for `bitbucket.repositories.default-reviewers.list` in `tests/contract/operations/repositories/default-reviewers/list.test.ts`.
- [ ] **T613**: Implement `bitbucket.repositories.default-reviewers.list` in `src/tools/operations/repositories/default-reviewers/list.ts`.
- [ ] **T614** [P]: Write contract test for `bitbucket.repositories.default-reviewers.remove` in `tests/contract/operations/repositories/default-reviewers/remove.test.ts`.
- [ ] **T615**: Implement `bitbucket.repositories.default-reviewers.remove` in `src/tools/operations/repositories/default-reviewers/remove.ts`.
- [ ] **T616** [P]: Write contract test for `bitbucket.repositories.effective-default-reviewers.list` in `tests/contract/operations/repositories/effective-default-reviewers/list.test.ts`.
- [ ] **T617**: Implement `bitbucket.repositories.effective-default-reviewers.list` in `src/tools/operations/repositories/effective-default-reviewers/list.ts`.
- [ ] **T618** [P]: Write contract test for `bitbucket.repositories.pullrequests.activity.list` in `tests/contract/operations/repositories/pullrequests/activity/list.test.ts`.
- [ ] **T619**: Implement `bitbucket.repositories.pullrequests.activity.list` in `src/tools/operations/repositories/pullrequests/activity/list.ts`.
- [ ] **T620** [P]: Write contract test for `bitbucket.repositories.pullrequests.activity.list` in `tests/contract/operations/repositories/pullrequests/activity/list.test.ts`.
- [ ] **T621**: Implement `bitbucket.repositories.pullrequests.activity.list` in `src/tools/operations/repositories/pullrequests/activity/list.ts`.
- [ ] **T622** [P]: Write contract test for `bitbucket.repositories.pullrequests.approve` in `tests/contract/operations/repositories/pullrequests/approve.test.ts`.
- [ ] **T623**: Implement `bitbucket.repositories.pullrequests.approve` in `src/tools/operations/repositories/pullrequests/approve.ts`.
- [ ] **T624** [P]: Write contract test for `bitbucket.repositories.pullrequests.comments.create` in `tests/contract/operations/repositories/pullrequests/comments/create.test.ts`.
- [ ] **T625**: Implement `bitbucket.repositories.pullrequests.comments.create` in `src/tools/operations/repositories/pullrequests/comments/create.ts`.
- [ ] **T626** [P]: Write contract test for `bitbucket.repositories.pullrequests.comments.delete` in `tests/contract/operations/repositories/pullrequests/comments/delete.test.ts`.
- [ ] **T627**: Implement `bitbucket.repositories.pullrequests.comments.delete` in `src/tools/operations/repositories/pullrequests/comments/delete.ts`.
- [ ] **T628** [P]: Write contract test for `bitbucket.repositories.pullrequests.comments.get` in `tests/contract/operations/repositories/pullrequests/comments/get.test.ts`.
- [ ] **T629**: Implement `bitbucket.repositories.pullrequests.comments.get` in `src/tools/operations/repositories/pullrequests/comments/get.ts`.
- [ ] **T630** [P]: Write contract test for `bitbucket.repositories.pullrequests.comments.list` in `tests/contract/operations/repositories/pullrequests/comments/list.test.ts`.
- [ ] **T631**: Implement `bitbucket.repositories.pullrequests.comments.list` in `src/tools/operations/repositories/pullrequests/comments/list.ts`.
- [ ] **T632** [P]: Write contract test for `bitbucket.repositories.pullrequests.comments.resolve` in `tests/contract/operations/repositories/pullrequests/comments/resolve.test.ts`.
- [ ] **T633**: Implement `bitbucket.repositories.pullrequests.comments.resolve` in `src/tools/operations/repositories/pullrequests/comments/resolve.ts`.
- [ ] **T634** [P]: Write contract test for `bitbucket.repositories.pullrequests.comments.resolve.reopen` in `tests/contract/operations/repositories/pullrequests/comments/resolve/reopen.test.ts`.
- [ ] **T635**: Implement `bitbucket.repositories.pullrequests.comments.resolve.reopen` in `src/tools/operations/repositories/pullrequests/comments/resolve/reopen.ts`.
- [ ] **T636** [P]: Write contract test for `bitbucket.repositories.pullrequests.comments.update` in `tests/contract/operations/repositories/pullrequests/comments/update.test.ts`.
- [ ] **T637**: Implement `bitbucket.repositories.pullrequests.comments.update` in `src/tools/operations/repositories/pullrequests/comments/update.ts`.
- [ ] **T638** [P]: Write contract test for `bitbucket.repositories.pullrequests.commits.list` in `tests/contract/operations/repositories/pullrequests/commits/list.test.ts`.
- [ ] **T639**: Implement `bitbucket.repositories.pullrequests.commits.list` in `src/tools/operations/repositories/pullrequests/commits/list.ts`.
- [ ] **T640** [P]: Write contract test for `bitbucket.repositories.pullrequests.create` in `tests/contract/operations/repositories/pullrequests/create.test.ts`.
- [ ] **T641**: Implement `bitbucket.repositories.pullrequests.create` in `src/tools/operations/repositories/pullrequests/create.ts`.
- [ ] **T642** [P]: Write contract test for `bitbucket.repositories.pullrequests.decline` in `tests/contract/operations/repositories/pullrequests/decline.test.ts`.
- [ ] **T643**: Implement `bitbucket.repositories.pullrequests.decline` in `src/tools/operations/repositories/pullrequests/decline.ts`.
- [ ] **T644** [P]: Write contract test for `bitbucket.repositories.pullrequests.diff.list` in `tests/contract/operations/repositories/pullrequests/diff/list.test.ts`.
- [ ] **T645**: Implement `bitbucket.repositories.pullrequests.diff.list` in `src/tools/operations/repositories/pullrequests/diff/list.ts`.
- [ ] **T646** [P]: Write contract test for `bitbucket.repositories.pullrequests.diffstat.get` in `tests/contract/operations/repositories/pullrequests/diffstat/get.test.ts`.
- [ ] **T647**: Implement `bitbucket.repositories.pullrequests.diffstat.get` in `src/tools/operations/repositories/pullrequests/diffstat/get.ts`.
- [ ] **T648** [P]: Write contract test for `bitbucket.repositories.pullrequests.get` in `tests/contract/operations/repositories/pullrequests/get.test.ts`.
- [ ] **T649**: Implement `bitbucket.repositories.pullrequests.get` in `src/tools/operations/repositories/pullrequests/get.ts`.
- [ ] **T650** [P]: Write contract test for `bitbucket.repositories.pullrequests.list` in `tests/contract/operations/repositories/pullrequests/list.test.ts`.
- [ ] **T651**: Implement `bitbucket.repositories.pullrequests.list` in `src/tools/operations/repositories/pullrequests/list.ts`.
- [ ] **T652** [P]: Write contract test for `bitbucket.repositories.pullrequests.merge` in `tests/contract/operations/repositories/pullrequests/merge.test.ts`.
- [ ] **T653**: Implement `bitbucket.repositories.pullrequests.merge` in `src/tools/operations/repositories/pullrequests/merge.ts`.
- [ ] **T654** [P]: Write contract test for `bitbucket.repositories.pullrequests.merge.task-status.get` in `tests/contract/operations/repositories/pullrequests/merge/task-status/get.test.ts`.
- [ ] **T655**: Implement `bitbucket.repositories.pullrequests.merge.task-status.get` in `src/tools/operations/repositories/pullrequests/merge/task-status/get.ts`.
- [ ] **T656** [P]: Write contract test for `bitbucket.repositories.pullrequests.patch.get` in `tests/contract/operations/repositories/pullrequests/patch/get.test.ts`.
- [ ] **T657**: Implement `bitbucket.repositories.pullrequests.patch.get` in `src/tools/operations/repositories/pullrequests/patch/get.ts`.
- [ ] **T658** [P]: Write contract test for `bitbucket.repositories.pullrequests.request-changes.remove` in `tests/contract/operations/repositories/pullrequests/request-changes/remove.test.ts`.
- [ ] **T659**: Implement `bitbucket.repositories.pullrequests.request-changes.remove` in `src/tools/operations/repositories/pullrequests/request-changes/remove.ts`.
- [ ] **T660** [P]: Write contract test for `bitbucket.repositories.pullrequests.request-changes.request` in `tests/contract/operations/repositories/pullrequests/request-changes/request.test.ts`.
- [ ] **T661**: Implement `bitbucket.repositories.pullrequests.request-changes.request` in `src/tools/operations/repositories/pullrequests/request-changes/request.ts`.
- [ ] **T662** [P]: Write contract test for `bitbucket.repositories.pullrequests.statuses.list` in `tests/contract/operations/repositories/pullrequests/statuses/list.test.ts`.
- [ ] **T663**: Implement `bitbucket.repositories.pullrequests.statuses.list` in `src/tools/operations/repositories/pullrequests/statuses/list.ts`.
- [ ] **T664** [P]: Write contract test for `bitbucket.repositories.pullrequests.tasks.create` in `tests/contract/operations/repositories/pullrequests/tasks/create.test.ts`.
- [ ] **T665**: Implement `bitbucket.repositories.pullrequests.tasks.create` in `src/tools/operations/repositories/pullrequests/tasks/create.ts`.
- [ ] **T666** [P]: Write contract test for `bitbucket.repositories.pullrequests.tasks.delete` in `tests/contract/operations/repositories/pullrequests/tasks/delete.test.ts`.
- [ ] **T667**: Implement `bitbucket.repositories.pullrequests.tasks.delete` in `src/tools/operations/repositories/pullrequests/tasks/delete.ts`.
- [ ] **T668** [P]: Write contract test for `bitbucket.repositories.pullrequests.tasks.get` in `tests/contract/operations/repositories/pullrequests/tasks/get.test.ts`.
- [ ] **T669**: Implement `bitbucket.repositories.pullrequests.tasks.get` in `src/tools/operations/repositories/pullrequests/tasks/get.ts`.
- [ ] **T670** [P]: Write contract test for `bitbucket.repositories.pullrequests.tasks.list` in `tests/contract/operations/repositories/pullrequests/tasks/list.test.ts`.
- [ ] **T671**: Implement `bitbucket.repositories.pullrequests.tasks.list` in `src/tools/operations/repositories/pullrequests/tasks/list.ts`.
- [ ] **T672** [P]: Write contract test for `bitbucket.repositories.pullrequests.tasks.update` in `tests/contract/operations/repositories/pullrequests/tasks/update.test.ts`.
- [ ] **T673**: Implement `bitbucket.repositories.pullrequests.tasks.update` in `src/tools/operations/repositories/pullrequests/tasks/update.ts`.
- [ ] **T674** [P]: Write contract test for `bitbucket.repositories.pullrequests.unapprove` in `tests/contract/operations/repositories/pullrequests/unapprove.test.ts`.
- [ ] **T675**: Implement `bitbucket.repositories.pullrequests.unapprove` in `src/tools/operations/repositories/pullrequests/unapprove.ts`.
- [ ] **T676** [P]: Write contract test for `bitbucket.repositories.pullrequests.update` in `tests/contract/operations/repositories/pullrequests/update.test.ts`.
- [ ] **T677**: Implement `bitbucket.repositories.pullrequests.update` in `src/tools/operations/repositories/pullrequests/update.ts`.
