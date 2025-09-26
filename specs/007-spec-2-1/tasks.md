# Tasks: Complete API Operation Implementation

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: plan.md, research.md, data-model.md

## Execution Flow

This task list is generated based on the design artifacts. The primary goal is to iteratively implement all 200+ Bitbucket API endpoints following a strict TDD workflow. Due to the large number of endpoints, the tasks are grouped by API resource categories for clarity. The process for each endpoint is identical: write a contract test, then write the implementation to make it pass.

## Path Conventions

- All source code will be in `src/`.
- All tests will be in `tests/`.
- This plan assumes a single project structure as decided in `plan.md`.

---

## Phase 3.1: Setup & Scaffolding

_These tasks set up the structure for the large-scale implementation._

- [x] **T001**: Create placeholder directories for major API categories within `src/tools/operations/` (e.g., `repositories`, `pull-requests`, `users`).
- [x] **T002**: Create corresponding placeholder directories for contract tests within `tests/contract/operations/` (e.g., `repositories`, `pull-requests`, `users`).

---

## Phase 3.2: Core Implementation (Iterative)

_This phase is the bulk of the work. The tasks below represent a template to be repeated for **each** of the 200+ Bitbucket API endpoints. This list shows examples for a few key resources._

### Group 1: Repository Management (Example)

- [x] **T003** [P]: Write contract test for `bitbucket.repositories.list` in `tests/contract/operations/repositories/list.test.ts`. The test must fail initially.
- [x] **T004**: Implement the internal operation for `bitbucket.repositories.list` in `src/tools/operations/repositories/list.ts` to make the contract test pass.
- [x] **T005** [P]: Write contract test for `bitbucket.repositories.get` in `tests/contract/operations/repositories/get.test.ts`.
- [x] **T006**: Implement the internal operation for `bitbucket.repositories.get` in `src/tools/operations/repositories/get.ts`.
- [x] **T007** [P]: Write contract test for `bitbucket.repositories.create` in `tests/contract/operations/repositories/create.test.ts`.
- [x] **T008**: Implement the internal operation for `bitbucket.repositories.create` in `src/tools/operations/repositories/create.ts`.
      _(...and so on for all repository-related endpoints)_

### Group 2: Pull Request Management (Example)

- [x] **T009** [P]: Write contract test for `bitbucket.pull-requests.list` in `tests/contract/operations/pull-requests/list.test.ts`.
- [x] **T010**: Implement the internal operation for `bitbucket.pull-requests.list` in `src/tools/operations/pull-requests/list.ts`.
- [x] **T011** [P]: Write contract test for `bitbucket.pull-requests.create` in `tests/contract/operations/pull-requests/create.test.ts`.
- [x] **T012**: Implement the internal operation for `bitbucket.pull-requests.create` in `src/tools/operations/pull-requests/create.ts`.
- [x] **T013** [P]: Write contract test for `bitbucket.pull-requests.merge` in `tests/contract/operations/pull-requests/merge.test.ts`.
- [x] **T014**: Implement the internal operation for `bitbucket.pull-requests.merge` in `src/tools/operations/pull-requests/merge.ts`.
- [x] **T015** [P]: Write contract test for `bitbucket.pull-requests.get` in `tests/contract/operations/pull-requests/get.test.ts`.
- [x] **T016**: Implement the internal operation for `bitbucket.pull-requests.get` in `src/tools/operations/pull-requests/get.ts`.
- [x] **T017** [P]: Write contract test for `bitbucket.pull-requests.approve` in `tests/contract/operations/pull-requests/approve.test.ts`.
- [x] **T018**: Implement the internal operation for `bitbucket.pull-requests.approve` in `src/tools/operations/pull-requests/approve.ts`.
- [x] **T019** [P]: Write contract test for `bitbucket.pull-requests.decline` in `tests/contract/operations/pull-requests/decline.test.ts`.
- [x] **T020**: Implement the internal operation for `bitbucket.pull-requests.decline` in `src/tools/operations/pull-requests/decline.ts`.
- [x] **T021** [P]: Write contract test for `bitbucket.pull-requests.unapprove` in `tests/contract/operations/pull-requests/unapprove.test.ts`.
- [x] **T022**: Implement the internal operation for `bitbucket.pull-requests.unapprove` in `src/tools/operations/pull-requests/unapprove.ts`.
- [x] **T023** [P]: Write contract test for `bitbucket.pull-requests.update` in `tests/contract/operations/pull-requests/update.test.ts`.
- [x] **T024**: Implement the internal operation for `bitbucket.pull-requests.update` in `src/tools/operations/pull-requests/update.ts`.
- [x] **T025** [P]: Write contract test for `bitbucket.pull-requests.activities` in `tests/contract/operations/pull-requests/activities.test.ts`.
- [x] **T026**: Implement the internal operation for `bitbucket.pull-requests.activities` in `src/tools/operations/pull-requests/activities.ts`.
- [x] **T027** [P]: Write contract test for `bitbucket.pull-requests.commits` in `tests/contract/operations/pull-requests/commits.test.ts`.
- [x] **T028**: Implement the internal operation for `bitbucket.pull-requests.commits` in `src/tools/operations/pull-requests/commits.ts`.
- [x] **T029** [P]: Write contract test for `bitbucket.pull-requests.comments.list` in `tests/contract/operations/pull-requests/comments.list.test.ts`.
- [x] **T030**: Implement the internal operation for `bitbucket.pull-requests.comments.list` in `src/tools/operations/pull-requests/comments/list.ts`.
- [x] **T031** [P]: Write contract test for `bitbucket.pull-requests.comments.create` in `tests/contract/operations/pull-requests/comments.create.test.ts`.
- [x] **T032**: Implement the internal operation for `bitbucket.pull-requests.comments.create` in `src/tools/operations/pull-requests/comments/create.ts`.
- [x] **T033** [P]: Write contract test for `bitbucket.pull-requests.diff` in `tests/contract/operations/pull-requests/diff.test.ts`.
- [x] **T034**: Implement the internal operation for `bitbucket.pull-requests.diff` in `src/tools/operations/pull-requests/diff.ts`.
      _(...and so on for all pull-request-related endpoints)_

### Group 3: Bitbucket Data Center Projects & Settings

- [ ] **T035** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/projects`, `GET /rest/api/1.0/projects/{projectKey}/permissions/groups`, `GET /rest/api/1.0/projects/{projectKey}/settings/hooks`.
- [ ] **T036**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /rest/api/1.0/projects`
  - `POST /rest/api/1.0/projects`
  - `DELETE /rest/api/1.0/projects/{projectKey}`
  - `GET /rest/api/1.0/projects/{projectKey}`
  - `PUT /rest/api/1.0/projects/{projectKey}`
  - `GET /rest/api/1.0/projects/{projectKey}/avatar.png`
  - `POST /rest/api/1.0/projects/{projectKey}/avatar.png`
  - `GET /rest/api/1.0/projects/{projectKey}/permissions/{permission}/all`
  - `POST /rest/api/1.0/projects/{projectKey}/permissions/{permission}/all`
  - `DELETE /rest/api/1.0/projects/{projectKey}/permissions/groups`
  - `GET /rest/api/1.0/projects/{projectKey}/permissions/groups`
  - `PUT /rest/api/1.0/projects/{projectKey}/permissions/groups`
  - `GET /rest/api/1.0/projects/{projectKey}/permissions/groups/none`
  - `DELETE /rest/api/1.0/projects/{projectKey}/permissions/users`
  - `GET /rest/api/1.0/projects/{projectKey}/permissions/users`
  - `PUT /rest/api/1.0/projects/{projectKey}/permissions/users`
  - `GET /rest/api/1.0/projects/{projectKey}/permissions/users/none`
  - `DELETE /rest/api/1.0/projects/{projectKey}/settings/auto-decline`
  - `GET /rest/api/1.0/projects/{projectKey}/settings/auto-decline`
  - `PUT /rest/api/1.0/projects/{projectKey}/settings/auto-decline`
  - `GET /rest/api/1.0/projects/{projectKey}/settings/hooks`
  - `GET /rest/api/1.0/projects/{projectKey}/settings/hooks/{hookKey}`
  - `DELETE /rest/api/1.0/projects/{projectKey}/settings/hooks/{hookKey}/enabled`
  - `PUT /rest/api/1.0/projects/{projectKey}/settings/hooks/{hookKey}/enabled`
  - `GET /rest/api/1.0/projects/{projectKey}/settings/hooks/{hookKey}/settings`
  - `PUT /rest/api/1.0/projects/{projectKey}/settings/hooks/{hookKey}/settings`
  - `GET /rest/api/1.0/projects/{projectKey}/settings/pull-requests/{scmId}`
  - `POST /rest/api/1.0/projects/{projectKey}/settings/pull-requests/{scmId}`
  - `GET /rest/api/1.0/projects/{projectKey}/settings/reviewer-groups`
  - `POST /rest/api/1.0/projects/{projectKey}/settings/reviewer-groups`
  - `DELETE /rest/api/1.0/projects/{projectKey}/settings/reviewer-groups/{id}`
  - `GET /rest/api/1.0/projects/{projectKey}/settings/reviewer-groups/{id}`
  - `PUT /rest/api/1.0/projects/{projectKey}/settings/reviewer-groups/{id}`

### Group 4: Bitbucket Data Center Repositories & Webhooks

- [ ] **T037** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/projects/{projectKey}/repos`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/webhooks`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/labels`.
- [ ] **T038**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /rest/api/1.0/projects/{projectKey}/repos`
  - `POST /rest/api/1.0/projects/{projectKey}/repos`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/archive`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/attachments/{attachmentId}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/attachments/{attachmentId}`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/attachments/{attachmentId}/metadata`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/attachments/{attachmentId}/metadata`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/attachments/{attachmentId}/metadata`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/compare/changes`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/compare/commits`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/compare/diff{path:.*}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/contributing`
  - `HEAD /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/contributing`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/default-branch`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/default-branch`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/diff`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/diff`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/diff/{path:.*}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/diff/{path:.*}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/forks`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/labels`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/labels`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/labels/{labelName}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/last-modified`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/last-modified/{path:.*}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/license`
  - `HEAD /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/license`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/participants`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/patch`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/readme`
  - `HEAD /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/readme`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/recreate`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/ref-change-activities`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/ref-change-activities/branches`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/related`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/auto-decline`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/auto-decline`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/auto-decline`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/pull-requests`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/pull-requests`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/reviewer-groups`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/reviewer-groups`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/reviewer-groups/{id}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/reviewer-groups/{id}`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/reviewer-groups/{id}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/reviewer-groups/{id}/users`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/watch`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/watch`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/webhooks`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/webhooks`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/webhooks/{webhookId}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/webhooks/{webhookId}`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/webhooks/{webhookId}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/webhooks/{webhookId}/latest`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/webhooks/{webhookId}/statistics`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/webhooks/{webhookId}/statistics/summary`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/webhooks/test`
  - `GET /rest/api/1.0/repos`

### Group 5: Bitbucket Data Center Repository Permissions

- [ ] **T039** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/groups`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/users`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/groups/none`.
- [ ] **T040**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/groups`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/groups`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/groups`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/groups/none`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/users`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/users`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/users`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/users/none`

### Group 6: Bitbucket Data Center Pull Requests

- [ ] **T041** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/activities`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/changes`.
- [ ] **T042**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}.diff`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}.patch`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/activities`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/approve`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/approve`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/blocker-comments`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/blocker-comments`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/blocker-comments/{commentId}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/blocker-comments/{commentId}`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/blocker-comments/{commentId}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/changes`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}/apply-suggestion`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/commits`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/decline`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/diff`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/diff`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/diff/{path:.*}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/diff/{path:.*}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/merge`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/merge`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/participants`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/participants`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/participants`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/participants/{userSlug}`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/participants/{userSlug}`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/reopen`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/review`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/review`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/review`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/tasks`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/tasks/count`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/watch`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/watch`

### Group 7: Bitbucket Data Center Commits & Build Results

- [ ] **T043** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/changes`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/comments`.
- [ ] **T044**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/builds`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/builds`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/builds`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/changes`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/comments`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/comments`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/comments/{commentId}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/comments/{commentId}`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/comments/{commentId}`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/deployments`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/deployments`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/deployments`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/diff`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/diff`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/diff/{path:.*}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/diff/{path:.*}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/pull-requests`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/watch`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/watch`

### Group 8: Bitbucket Data Center Branches & Default Branch

- [ ] **T045** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches/default`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/ref-change-activities/branches`.
- [ ] **T046**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches/default`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches/default`

### Group 9: Bitbucket Data Center Tags & Archive

- [ ] **T047** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags/{name:.*}`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/archive`.
- [ ] **T048**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags`
  - `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags/{name:.*}`

### Group 10: Bitbucket Data Center Source & File Browsing

- [ ] **T049** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/browse`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/files`, `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/changes`.
- [ ] **T050**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/browse`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/browse/{path:.*}`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/browse/{path:.*}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/changes`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/files`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/files/{path:.*}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/raw`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/raw/{path:.*}`

### Group 11: Bitbucket Data Center Admin Directory & Banner

- [ ] **T051** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/admin/users`, `GET /rest/api/1.0/admin/groups`, `GET /rest/api/1.0/admin/users/more-members`.
- [ ] **T052**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `DELETE /rest/api/1.0/admin/banner`
  - `GET /rest/api/1.0/admin/banner`
  - `PUT /rest/api/1.0/admin/banner`
  - `GET /rest/api/1.0/admin/cluster`
  - `DELETE /rest/api/1.0/admin/default-branch`
  - `GET /rest/api/1.0/admin/default-branch`
  - `PUT /rest/api/1.0/admin/default-branch`
  - `DELETE /rest/api/1.0/admin/groups`
  - `GET /rest/api/1.0/admin/groups`
  - `POST /rest/api/1.0/admin/groups`
  - `POST /rest/api/1.0/admin/groups/add-user`
  - `POST /rest/api/1.0/admin/groups/add-users`
  - `GET /rest/api/1.0/admin/groups/more-members`
  - `GET /rest/api/1.0/admin/groups/more-non-members`
  - `POST /rest/api/1.0/admin/groups/remove-user`
  - `GET /rest/api/1.0/admin/license`
  - `POST /rest/api/1.0/admin/license`
  - `DELETE /rest/api/1.0/admin/mail-server`
  - `GET /rest/api/1.0/admin/mail-server`
  - `PUT /rest/api/1.0/admin/mail-server`
  - `DELETE /rest/api/1.0/admin/mail-server/sender-address`
  - `GET /rest/api/1.0/admin/mail-server/sender-address`
  - `PUT /rest/api/1.0/admin/mail-server/sender-address`
  - `DELETE /rest/api/1.0/admin/permissions/groups`
  - `GET /rest/api/1.0/admin/permissions/groups`
  - `PUT /rest/api/1.0/admin/permissions/groups`
  - `GET /rest/api/1.0/admin/permissions/groups/none`
  - `DELETE /rest/api/1.0/admin/permissions/users`
  - `GET /rest/api/1.0/admin/permissions/users`
  - `PUT /rest/api/1.0/admin/permissions/users`
  - `GET /rest/api/1.0/admin/permissions/users/none`
  - `GET /rest/api/1.0/admin/pull-requests/{scmId}`
  - `POST /rest/api/1.0/admin/pull-requests/{scmId}`
  - `GET /rest/api/1.0/admin/rate-limit/history`
  - `GET /rest/api/1.0/admin/rate-limit/settings`
  - `PUT /rest/api/1.0/admin/rate-limit/settings`
  - `GET /rest/api/1.0/admin/rate-limit/settings/users`
  - `POST /rest/api/1.0/admin/rate-limit/settings/users`
  - `DELETE /rest/api/1.0/admin/rate-limit/settings/users/{userSlug}`
  - `GET /rest/api/1.0/admin/rate-limit/settings/users/{userSlug}`
  - `PUT /rest/api/1.0/admin/rate-limit/settings/users/{userSlug}`
  - `DELETE /rest/api/1.0/admin/users`
  - `GET /rest/api/1.0/admin/users`
  - `POST /rest/api/1.0/admin/users`
  - `PUT /rest/api/1.0/admin/users`
  - `POST /rest/api/1.0/admin/users/add-group`
  - `POST /rest/api/1.0/admin/users/add-groups`
  - `DELETE /rest/api/1.0/admin/users/captcha`
  - `PUT /rest/api/1.0/admin/users/credentials`
  - `GET /rest/api/1.0/admin/users/erasure`
  - `POST /rest/api/1.0/admin/users/erasure`
  - `GET /rest/api/1.0/admin/users/more-members`
  - `GET /rest/api/1.0/admin/users/more-non-members`
  - `POST /rest/api/1.0/admin/users/remove-group`
  - `POST /rest/api/1.0/admin/users/rename`

### Group 12: Bitbucket Data Center Accounts & Profiles

- [ ] **T053** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/users`, `GET /rest/api/1.0/users/{userSlug}/permissions`, `GET /rest/api/1.0/profile/recent`.
- [ ] **T054**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /rest/api/1.0/groups`
  - `GET /rest/api/1.0/profile/recent/repos`
  - `GET /rest/api/1.0/users`
  - `PUT /rest/api/1.0/users`
  - `GET /rest/api/1.0/users/{userSlug}`
  - `DELETE /rest/api/1.0/users/{userSlug}/avatar.png`
  - `POST /rest/api/1.0/users/{userSlug}/avatar.png`
  - `GET /rest/api/1.0/users/{userSlug}/settings`
  - `POST /rest/api/1.0/users/{userSlug}/settings`
  - `PUT /rest/api/1.0/users/credentials`

### Group 13: Bitbucket Data Center Migration & Synchronization

- [ ] **T055** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/migration/exports`, `GET /rest/api/1.0/migration/imports`, `GET /rest/api/1.0/migration/workspaces`.
- [ ] **T056**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /rest/api/1.0/migration/exports`
  - `GET /rest/api/1.0/migration/exports/{jobId}`
  - `POST /rest/api/1.0/migration/exports/{jobId}/cancel`
  - `GET /rest/api/1.0/migration/exports/{jobId}/messages`
  - `POST /rest/api/1.0/migration/exports/preview`
  - `POST /rest/api/1.0/migration/imports`
  - `GET /rest/api/1.0/migration/imports/{jobId}`
  - `POST /rest/api/1.0/migration/imports/{jobId}/cancel`
  - `GET /rest/api/1.0/migration/imports/{jobId}/messages`

### Group 14: Bitbucket Data Center Diagnostics & Tasks

- [ ] **T057** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/logs`, `GET /rest/api/1.0/tasks`, `GET /rest/api/1.0/dashboard/pull-requests`.
- [ ] **T058**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /rest/api/1.0/dashboard/pull-request-suggestions`
  - `GET /rest/api/1.0/dashboard/pull-requests`
  - `GET /rest/api/1.0/inbox/pull-requests`
  - `GET /rest/api/1.0/inbox/pull-requests/count`
  - `GET /rest/api/1.0/logs/logger/{loggerName}`
  - `PUT /rest/api/1.0/logs/logger/{loggerName}/{levelName}`
  - `GET /rest/api/1.0/logs/rootLogger`
  - `PUT /rest/api/1.0/logs/rootLogger/{levelName}`
  - `POST /rest/api/1.0/tasks`
  - `DELETE /rest/api/1.0/tasks/{taskId}`
  - `GET /rest/api/1.0/tasks/{taskId}`
  - `PUT /rest/api/1.0/tasks/{taskId}`

### Group 15: Bitbucket Data Center Integrations & System Settings

- [ ] **T059** [P]: Write contract tests covering all Bitbucket Data Center endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /rest/api/1.0/hooks`, `GET /rest/api/1.0/application-properties`, `GET /rest/api/1.0/deployment/projects`.
- [ ] **T060**: Implement internal operations for the Bitbucket Data Center endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /rest/api/1.0/application-properties`
  - `GET /rest/api/1.0/build/capabilities`
  - `GET /rest/api/1.0/deployment/capabilities`
  - `GET /rest/api/1.0/hooks/{hookKey}/avatar`
  - `POST /rest/api/1.0/markup/preview`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/hooks`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/hooks/{hookKey}`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/hooks/{hookKey}`
  - `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/hooks/{hookKey}/enabled`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/hooks/{hookKey}/enabled`
  - `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/hooks/{hookKey}/settings`
  - `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/settings/hooks/{hookKey}/settings`

### Group 16: Workspaces

- [ ] **T061** [P]: Write contract tests covering all Bitbucket Cloud Workspaces endpoints below. Ensure contract coverage asserts shared pagination behavior for 9 list endpoints like `GET /workspaces/{workspace}/permissions/repositories/{repo_slug}`, `GET /workspaces/{workspace}/permissions/repositories`, `GET /workspaces/{workspace}/projects`.
- [ ] **T062**: Implement internal operations for the Bitbucket Cloud Workspaces endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /workspaces/{workspace}/hooks` — Create a webhook for a workspace
  - `DELETE /workspaces/{workspace}/hooks/{uid}` — Delete a webhook for a workspace
  - `GET /workspaces/{workspace}/hooks/{uid}` — Get a webhook for a workspace
  - `GET /workspaces/{workspace}` — Get a workspace
  - `GET /workspaces/{workspace}/members/{member}` — Get user membership for a workspace
  - `GET /workspaces/{workspace}/permissions/repositories/{repo_slug}` — List a repository permissions for a workspace
  - `GET /workspaces/{workspace}/permissions/repositories` — List all repository permissions for a workspace
  - `GET /workspaces/{workspace}/projects` — List projects in a workspace
  - `GET /workspaces/{workspace}/permissions` — List user permissions in a workspace
  - `GET /workspaces/{workspace}/members` — List users in a workspace
  - `GET /workspaces/{workspace}/hooks` — List webhooks for a workspace
  - `GET /workspaces/{workspace}/pullrequests/{selected_user}` — List workspace pull requests for a user
  - `GET /user/permissions/workspaces` — List workspaces for the current user
  - `GET /workspaces` — List workspaces for user
  - `PUT /workspaces/{workspace}/hooks/{uid}` — Update a webhook for a workspace

### Group 17: Projects

- [ ] **T063** [P]: Write contract tests covering all Bitbucket Cloud Projects endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /workspaces/{workspace}/projects/{project_key}/permissions-config/groups`, `GET /workspaces/{workspace}/projects/{project_key}/permissions-config/users`, `GET /workspaces/{workspace}/projects/{project_key}/default-reviewers`.
- [ ] **T064**: Implement internal operations for the Bitbucket Cloud Projects endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `PUT /workspaces/{workspace}/projects/{project_key}/default-reviewers/{selected_user}` — Add the specific user as a default reviewer for the project
  - `POST /workspaces/{workspace}/projects` — Create a project in a workspace
  - `DELETE /workspaces/{workspace}/projects/{project_key}` — Delete a project for a workspace
  - `DELETE /workspaces/{workspace}/projects/{project_key}/permissions-config/groups/{group_slug}` — Delete an explicit group permission for a project
  - `DELETE /workspaces/{workspace}/projects/{project_key}/permissions-config/users/{selected_user_id}` — Delete an explicit user permission for a project
  - `GET /workspaces/{workspace}/projects/{project_key}/default-reviewers/{selected_user}` — Get a default reviewer
  - `GET /workspaces/{workspace}/projects/{project_key}` — Get a project for a workspace
  - `GET /workspaces/{workspace}/projects/{project_key}/permissions-config/groups/{group_slug}` — Get an explicit group permission for a project
  - `GET /workspaces/{workspace}/projects/{project_key}/permissions-config/users/{selected_user_id}` — Get an explicit user permission for a project
  - `GET /workspaces/{workspace}/projects/{project_key}/permissions-config/groups` — List explicit group permissions for a project
  - `GET /workspaces/{workspace}/projects/{project_key}/permissions-config/users` — List explicit user permissions for a project
  - `GET /workspaces/{workspace}/projects/{project_key}/default-reviewers` — List the default reviewers in a project
  - `DELETE /workspaces/{workspace}/projects/{project_key}/default-reviewers/{selected_user}` — Remove the specific user from the project's default reviewers
  - `PUT /workspaces/{workspace}/projects/{project_key}` — Update a project for a workspace
  - `PUT /workspaces/{workspace}/projects/{project_key}/permissions-config/groups/{group_slug}` — Update an explicit group permission for a project
  - `PUT /workspaces/{workspace}/projects/{project_key}/permissions-config/users/{selected_user_id}` — Update an explicit user permission for a project

### Group 18: Repositories

- [ ] **T065** [P]: Write contract tests covering all Bitbucket Cloud Repositories endpoints below. Ensure contract coverage asserts shared pagination behavior for 8 list endpoints like `GET /repositories/{workspace}/{repo_slug}/permissions-config/groups`, `GET /repositories/{workspace}/{repo_slug}/permissions-config/users`, `GET /repositories`.
- [ ] **T066**: Implement internal operations for the Bitbucket Cloud Repositories endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /repositories/{workspace}/{repo_slug}` — Create a repository
  - `POST /repositories/{workspace}/{repo_slug}/hooks` — Create a webhook for a repository
  - `DELETE /repositories/{workspace}/{repo_slug}` — Delete a repository
  - `DELETE /repositories/{workspace}/{repo_slug}/hooks/{uid}` — Delete a webhook for a repository
  - `DELETE /repositories/{workspace}/{repo_slug}/permissions-config/groups/{group_slug}` — Delete an explicit group permission for a repository
  - `DELETE /repositories/{workspace}/{repo_slug}/permissions-config/users/{selected_user_id}` — Delete an explicit user permission for a repository
  - `POST /repositories/{workspace}/{repo_slug}/forks` — Fork a repository
  - `GET /repositories/{workspace}/{repo_slug}` — Get a repository
  - `GET /repositories/{workspace}/{repo_slug}/hooks/{uid}` — Get a webhook for a repository
  - `GET /repositories/{workspace}/{repo_slug}/permissions-config/groups/{group_slug}` — Get an explicit group permission for a repository
  - `GET /repositories/{workspace}/{repo_slug}/permissions-config/users/{selected_user_id}` — Get an explicit user permission for a repository
  - `GET /repositories/{workspace}/{repo_slug}/permissions-config/groups` — List explicit group permissions for a repository
  - `GET /repositories/{workspace}/{repo_slug}/permissions-config/users` — List explicit user permissions for a repository
  - `GET /repositories` — List public repositories
  - `GET /repositories/{workspace}` — List repositories in a workspace
  - `GET /repositories/{workspace}/{repo_slug}/watchers` — List repositories watchers
  - `GET /repositories/{workspace}/{repo_slug}/forks` — List repository forks
  - `GET /user/permissions/repositories` — List repository permissions for a user
  - `GET /repositories/{workspace}/{repo_slug}/hooks` — List webhooks for a repository
  - `GET /repositories/{workspace}/{repo_slug}/override-settings` — Retrieve the inheritance state for repository settings
  - `PUT /repositories/{workspace}/{repo_slug}/override-settings` — Set the inheritance state for repository settings
  - `PUT /repositories/{workspace}/{repo_slug}` — Update a repository
  - `PUT /repositories/{workspace}/{repo_slug}/hooks/{uid}` — Update a webhook for a repository
  - `PUT /repositories/{workspace}/{repo_slug}/permissions-config/groups/{group_slug}` — Update an explicit group permission for a repository
  - `PUT /repositories/{workspace}/{repo_slug}/permissions-config/users/{selected_user_id}` — Update an explicit user permission for a repository

### Group 19: Pullrequests

- [ ] **T067** [P]: Write contract tests covering all Bitbucket Cloud Pullrequests endpoints below. Ensure contract coverage asserts shared pagination behavior for 11 list endpoints like `GET /repositories/{workspace}/{repo_slug}/pullrequests/activity`, `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/activity`, `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/diff`.
- [ ] **T068**: Implement internal operations for the Bitbucket Cloud Pullrequests endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `PUT /repositories/{workspace}/{repo_slug}/default-reviewers/{target_username}` — Add a user to the default reviewers
  - `POST /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/approve` — Approve a pull request
  - `POST /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments` — Create a comment on a pull request
  - `POST /repositories/{workspace}/{repo_slug}/pullrequests` — Create a pull request
  - `POST /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/tasks` — Create a task on a pull request
  - `POST /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/decline` — Decline a pull request
  - `DELETE /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}` — Delete a comment on a pull request
  - `DELETE /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/tasks/{task_id}` — Delete a task on a pull request
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}` — Get a comment on a pull request
  - `GET /repositories/{workspace}/{repo_slug}/default-reviewers/{target_username}` — Get a default reviewer
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}` — Get a pull request
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/tasks/{task_id}` — Get a task on a pull request
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/diffstat` — Get the diff stat for a pull request
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/merge/task-status/{task_id}` — Get the merge task status for a pull request
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/patch` — Get the patch for a pull request
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/activity` — List a pull request activity log
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/activity` — List a pull request activity log
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/diff` — List changes in a pull request
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments` — List comments on a pull request
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/statuses` — List commit statuses for a pull request
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/commits` — List commits on a pull request
  - `GET /repositories/{workspace}/{repo_slug}/default-reviewers` — List default reviewers
  - `GET /repositories/{workspace}/{repo_slug}/effective-default-reviewers` — List effective default reviewers
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests` — List pull requests
  - `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/pullrequests` — List pull requests that contain a commit
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/tasks` — List tasks on a pull request
  - `POST /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/merge` — Merge a pull request
  - `DELETE /repositories/{workspace}/{repo_slug}/default-reviewers/{target_username}` — Remove a user from the default reviewers
  - `DELETE /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/request-changes` — Remove change request for a pull request
  - `DELETE /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}/resolve` — Reopen a comment thread
  - `POST /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/request-changes` — Request changes for a pull request
  - `POST /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}/resolve` — Resolve a comment thread
  - `DELETE /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/approve` — Unapprove a pull request
  - `PUT /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}` — Update a comment on a pull request
  - `PUT /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}` — Update a pull request
  - `PUT /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/tasks/{task_id}` — Update a task on a pull request

### Group 20: Branch restrictions

- [ ] **T069** [P]: Write contract tests covering all Bitbucket Cloud Branch restrictions endpoints below. Ensure contract coverage asserts shared pagination behavior for 1 list endpoints like `GET /repositories/{workspace}/{repo_slug}/branch-restrictions`.
- [ ] **T070**: Implement internal operations for the Bitbucket Cloud Branch restrictions endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /repositories/{workspace}/{repo_slug}/branch-restrictions` — Create a branch restriction rule
  - `DELETE /repositories/{workspace}/{repo_slug}/branch-restrictions/{id}` — Delete a branch restriction rule
  - `GET /repositories/{workspace}/{repo_slug}/branch-restrictions/{id}` — Get a branch restriction rule
  - `GET /repositories/{workspace}/{repo_slug}/branch-restrictions` — List branch restrictions
  - `PUT /repositories/{workspace}/{repo_slug}/branch-restrictions/{id}` — Update a branch restriction rule

### Group 21: Branching model

- [ ] **T071** [P]: Write contract tests covering all Bitbucket Cloud Branching model endpoints below.
- [ ] **T072**: Implement internal operations for the Bitbucket Cloud Branching model endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /workspaces/{workspace}/projects/{project_key}/branching-model/settings` — Get the branching model config for a project
  - `GET /repositories/{workspace}/{repo_slug}/branching-model/settings` — Get the branching model config for a repository
  - `GET /workspaces/{workspace}/projects/{project_key}/branching-model` — Get the branching model for a project
  - `GET /repositories/{workspace}/{repo_slug}/branching-model` — Get the branching model for a repository
  - `GET /repositories/{workspace}/{repo_slug}/effective-branching-model` — Get the effective, or currently applied, branching model for a repository
  - `PUT /workspaces/{workspace}/projects/{project_key}/branching-model/settings` — Update the branching model config for a project
  - `PUT /repositories/{workspace}/{repo_slug}/branching-model/settings` — Update the branching model config for a repository

### Group 22: Refs

- [ ] **T073** [P]: Write contract tests covering all Bitbucket Cloud Refs endpoints below. Ensure contract coverage asserts shared pagination behavior for 3 list endpoints like `GET /repositories/{workspace}/{repo_slug}/refs`, `GET /repositories/{workspace}/{repo_slug}/refs/branches`, `GET /repositories/{workspace}/{repo_slug}/refs/tags`.
- [ ] **T074**: Implement internal operations for the Bitbucket Cloud Refs endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /repositories/{workspace}/{repo_slug}/refs/branches` — Create a branch
  - `POST /repositories/{workspace}/{repo_slug}/refs/tags` — Create a tag
  - `DELETE /repositories/{workspace}/{repo_slug}/refs/branches/{name}` — Delete a branch
  - `DELETE /repositories/{workspace}/{repo_slug}/refs/tags/{name}` — Delete a tag
  - `GET /repositories/{workspace}/{repo_slug}/refs/branches/{name}` — Get a branch
  - `GET /repositories/{workspace}/{repo_slug}/refs/tags/{name}` — Get a tag
  - `GET /repositories/{workspace}/{repo_slug}/refs` — List branches and tags
  - `GET /repositories/{workspace}/{repo_slug}/refs/branches` — List open branches
  - `GET /repositories/{workspace}/{repo_slug}/refs/tags` — List tags

### Group 23: Commits

- [ ] **T075** [P]: Write contract tests covering all Bitbucket Cloud Commits endpoints below. Ensure contract coverage asserts shared pagination behavior for 5 list endpoints like `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/comments`, `GET /repositories/{workspace}/{repo_slug}/commits`, `GET /repositories/{workspace}/{repo_slug}/commits/{revision}`.
- [ ] **T076**: Implement internal operations for the Bitbucket Cloud Commits endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /repositories/{workspace}/{repo_slug}/commit/{commit}/approve` — Approve a commit
  - `GET /repositories/{workspace}/{repo_slug}/diffstat/{spec}` — Compare two commit diff stats
  - `GET /repositories/{workspace}/{repo_slug}/diff/{spec}` — Compare two commits
  - `POST /repositories/{workspace}/{repo_slug}/commit/{commit}/comments` — Create comment for a commit
  - `DELETE /repositories/{workspace}/{repo_slug}/commit/{commit}/comments/{comment_id}` — Delete a commit comment
  - `GET /repositories/{workspace}/{repo_slug}/commit/{commit}` — Get a commit
  - `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/comments/{comment_id}` — Get a commit comment
  - `GET /repositories/{workspace}/{repo_slug}/patch/{spec}` — Get a patch for two commits
  - `GET /repositories/{workspace}/{repo_slug}/merge-base/{revspec}` — Get the common ancestor between two commits
  - `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/comments` — List a commit's comments
  - `GET /repositories/{workspace}/{repo_slug}/commits` — List commits
  - `GET /repositories/{workspace}/{repo_slug}/commits/{revision}` — List commits for revision
  - `POST /repositories/{workspace}/{repo_slug}/commits/{revision}` — List commits for revision using include/exclude
  - `POST /repositories/{workspace}/{repo_slug}/commits` — List commits with include/exclude
  - `DELETE /repositories/{workspace}/{repo_slug}/commit/{commit}/approve` — Unapprove a commit
  - `PUT /repositories/{workspace}/{repo_slug}/commit/{commit}/comments/{comment_id}` — Update a commit comment

### Group 24: Commit statuses

- [ ] **T077** [P]: Write contract tests covering all Bitbucket Cloud Commit statuses endpoints below. Ensure contract coverage asserts shared pagination behavior for 1 list endpoints like `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/statuses`.
- [ ] **T078**: Implement internal operations for the Bitbucket Cloud Commit statuses endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build` — Create a build status for a commit
  - `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build/{key}` — Get a build status for a commit
  - `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/statuses` — List commit statuses for a commit
  - `PUT /repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build/{key}` — Update a build status for a commit

### Group 25: Source

- [ ] **T079** [P]: Write contract tests covering all Bitbucket Cloud Source endpoints below. Ensure contract coverage asserts shared pagination behavior for 1 list endpoints like `GET /repositories/{workspace}/{repo_slug}/filehistory/{commit}/{path}`.
- [ ] **T080**: Implement internal operations for the Bitbucket Cloud Source endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /repositories/{workspace}/{repo_slug}/src` — Create a commit by uploading a file
  - `GET /repositories/{workspace}/{repo_slug}/src/{commit}/{path}` — Get file or directory contents
  - `GET /repositories/{workspace}/{repo_slug}/src` — Get the root directory of the main branch
  - `GET /repositories/{workspace}/{repo_slug}/filehistory/{commit}/{path}` — List commits that modified a file

### Group 26: Pipelines

- [ ] **T081** [P]: Write contract tests covering all Bitbucket Cloud Pipelines endpoints below. Ensure contract coverage asserts shared pagination behavior for 11 list endpoints like `GET /repositories/{workspace}/{repo_slug}/pipelines-config/caches`, `GET /repositories/{workspace}/{repo_slug}/pipelines_config/schedules/{schedule_uuid}/executions`, `GET /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts`.
- [ ] **T082**: Implement internal operations for the Bitbucket Cloud Pipelines endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts` — Create a known host
  - `POST /repositories/{workspace}/{repo_slug}/pipelines_config/schedules` — Create a schedule
  - `POST /repositories/{workspace}/{repo_slug}/pipelines_config/variables` — Create a variable for a repository
  - `POST /teams/{username}/pipelines_config/variables` — Create a variable for a user
  - `POST /users/{selected_user}/pipelines_config/variables` — Create a variable for a user
  - `POST /workspaces/{workspace}/pipelines-config/variables` — Create a variable for a workspace
  - `POST /repositories/{workspace}/{repo_slug}/deployments_config/environments/{environment_uuid}/variables` — Create a variable for an environment
  - `DELETE /repositories/{workspace}/{repo_slug}/pipelines-config/caches/{cache_uuid}` — Delete a cache
  - `DELETE /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts/{known_host_uuid}` — Delete a known host
  - `DELETE /repositories/{workspace}/{repo_slug}/pipelines_config/schedules/{schedule_uuid}` — Delete a schedule
  - `DELETE /repositories/{workspace}/{repo_slug}/pipelines_config/variables/{variable_uuid}` — Delete a variable for a repository
  - `DELETE /teams/{username}/pipelines_config/variables/{variable_uuid}` — Delete a variable for a team
  - `DELETE /users/{selected_user}/pipelines_config/variables/{variable_uuid}` — Delete a variable for a user
  - `DELETE /workspaces/{workspace}/pipelines-config/variables/{variable_uuid}` — Delete a variable for a workspace
  - `DELETE /repositories/{workspace}/{repo_slug}/deployments_config/environments/{environment_uuid}/variables/{variable_uuid}` — Delete a variable for an environment
  - `DELETE /repositories/{workspace}/{repo_slug}/pipelines-config/caches` — Delete caches
  - `DELETE /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/key_pair` — Delete SSH key pair
  - `GET /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts/{known_host_uuid}` — Get a known host
  - `GET /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}` — Get a pipeline
  - `GET /repositories/{workspace}/{repo_slug}/pipelines_config/schedules/{schedule_uuid}` — Get a schedule
  - `GET /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}` — Get a step of a pipeline
  - `GET /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}/test_reports` — Get a summary of test reports for a given step of a pipeline.
  - `GET /repositories/{workspace}/{repo_slug}/pipelines_config/variables/{variable_uuid}` — Get a variable for a repository
  - `GET /teams/{username}/pipelines_config/variables/{variable_uuid}` — Get a variable for a team
  - `GET /users/{selected_user}/pipelines_config/variables/{variable_uuid}` — Get a variable for a user
  - `GET /repositories/{workspace}/{repo_slug}/pipelines-config/caches/{cache_uuid}/content-uri` — Get cache content URI
  - `GET /repositories/{workspace}/{repo_slug}/pipelines_config` — Get configuration
  - `GET /workspaces/{workspace}/pipelines-config/identity/oidc/keys.json` — Get keys for OIDC in Pipelines
  - `GET /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}/log` — Get log file for a step
  - `GET /workspaces/{workspace}/pipelines-config/identity/oidc/.well-known/openid-configuration` — Get OpenID configuration for OIDC in Pipelines
  - `GET /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/key_pair` — Get SSH key pair
  - `GET /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}/test_reports/test_cases/{test_case_uuid}/test_case_reasons` — Get test case reasons (output) for a given test case in a step of a pipeline.
  - `GET /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}/test_reports/test_cases` — Get test cases for a given step of a pipeline.
  - `GET /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}/logs/{log_uuid}` — Get the logs for the build container or a service container for a given step of a pipeline.
  - `GET /workspaces/{workspace}/pipelines-config/variables/{variable_uuid}` — Get variable for a workspace
  - `GET /repositories/{workspace}/{repo_slug}/pipelines-config/caches` — List caches
  - `GET /repositories/{workspace}/{repo_slug}/pipelines_config/schedules/{schedule_uuid}/executions` — List executions of a schedule
  - `GET /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts` — List known hosts
  - `GET /repositories/{workspace}/{repo_slug}/pipelines` — List pipelines
  - `GET /repositories/{workspace}/{repo_slug}/pipelines_config/schedules` — List schedules
  - `GET /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps` — List steps for a pipeline
  - `GET /repositories/{workspace}/{repo_slug}/pipelines_config/variables` — List variables for a repository
  - `GET /users/{selected_user}/pipelines_config/variables` — List variables for a user
  - `GET /workspaces/{workspace}/pipelines-config/variables` — List variables for a workspace
  - `GET /teams/{username}/pipelines_config/variables` — List variables for an account
  - `GET /repositories/{workspace}/{repo_slug}/deployments_config/environments/{environment_uuid}/variables` — List variables for an environment
  - `POST /repositories/{workspace}/{repo_slug}/pipelines` — Run a pipeline
  - `POST /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/stopPipeline` — Stop a pipeline
  - `PUT /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts/{known_host_uuid}` — Update a known host
  - `PUT /repositories/{workspace}/{repo_slug}/pipelines_config/schedules/{schedule_uuid}` — Update a schedule
  - `PUT /repositories/{workspace}/{repo_slug}/pipelines_config/variables/{variable_uuid}` — Update a variable for a repository
  - `PUT /teams/{username}/pipelines_config/variables/{variable_uuid}` — Update a variable for a team
  - `PUT /users/{selected_user}/pipelines_config/variables/{variable_uuid}` — Update a variable for a user
  - `PUT /repositories/{workspace}/{repo_slug}/deployments_config/environments/{environment_uuid}/variables/{variable_uuid}` — Update a variable for an environment
  - `PUT /repositories/{workspace}/{repo_slug}/pipelines_config` — Update configuration
  - `PUT /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/key_pair` — Update SSH key pair
  - `PUT /repositories/{workspace}/{repo_slug}/pipelines_config/build_number` — Update the next build number
  - `PUT /workspaces/{workspace}/pipelines-config/variables/{variable_uuid}` — Update variable for a workspace

### Group 27: Deployments

- [ ] **T083** [P]: Write contract tests covering all Bitbucket Cloud Deployments endpoints below. Ensure contract coverage asserts shared pagination behavior for 4 list endpoints like `GET /repositories/{workspace}/{repo_slug}/deployments`, `GET /repositories/{workspace}/{repo_slug}/environments`, `GET /workspaces/{workspace}/projects/{project_key}/deploy-keys`.
- [ ] **T084**: Implement internal operations for the Bitbucket Cloud Deployments endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /repositories/{workspace}/{repo_slug}/deploy-keys` — Add a repository deploy key
  - `POST /workspaces/{workspace}/projects/{project_key}/deploy-keys` — Create a project deploy key
  - `POST /repositories/{workspace}/{repo_slug}/environments` — Create an environment
  - `DELETE /workspaces/{workspace}/projects/{project_key}/deploy-keys/{key_id}` — Delete a deploy key from a project
  - `DELETE /repositories/{workspace}/{repo_slug}/deploy-keys/{key_id}` — Delete a repository deploy key
  - `DELETE /repositories/{workspace}/{repo_slug}/environments/{environment_uuid}` — Delete an environment
  - `GET /repositories/{workspace}/{repo_slug}/deployments/{deployment_uuid}` — Get a deployment
  - `GET /workspaces/{workspace}/projects/{project_key}/deploy-keys/{key_id}` — Get a project deploy key
  - `GET /repositories/{workspace}/{repo_slug}/deploy-keys/{key_id}` — Get a repository deploy key
  - `GET /repositories/{workspace}/{repo_slug}/environments/{environment_uuid}` — Get an environment
  - `GET /repositories/{workspace}/{repo_slug}/deployments` — List deployments
  - `GET /repositories/{workspace}/{repo_slug}/environments` — List environments
  - `GET /workspaces/{workspace}/projects/{project_key}/deploy-keys` — List project deploy keys
  - `GET /repositories/{workspace}/{repo_slug}/deploy-keys` — List repository deploy keys
  - `PUT /repositories/{workspace}/{repo_slug}/deploy-keys/{key_id}` — Update a repository deploy key
  - `POST /repositories/{workspace}/{repo_slug}/environments/{environment_uuid}/changes` — Update an environment

### Group 28: Issue tracker

- [ ] **T085** [P]: Write contract tests covering all Bitbucket Cloud Issue tracker endpoints below. Ensure contract coverage asserts shared pagination behavior for 7 list endpoints like `GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments`, `GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}/changes`, `GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments`.
- [ ] **T086**: Implement internal operations for the Bitbucket Cloud Issue tracker endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}/watch` — Check if current user is watching a issue
  - `GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}/vote` — Check if current user voted for an issue
  - `GET /repositories/{workspace}/{repo_slug}/issues/export/{repo_name}-issues-{task_id}.zip` — Check issue export status
  - `GET /repositories/{workspace}/{repo_slug}/issues/import` — Check issue import status
  - `POST /repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments` — Create a comment on an issue
  - `POST /repositories/{workspace}/{repo_slug}/issues` — Create an issue
  - `DELETE /repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments/{comment_id}` — Delete a comment on an issue
  - `DELETE /repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments/{path}` — Delete an attachment for an issue
  - `DELETE /repositories/{workspace}/{repo_slug}/issues/{issue_id}` — Delete an issue
  - `POST /repositories/{workspace}/{repo_slug}/issues/export` — Export issues
  - `GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments/{comment_id}` — Get a comment on an issue
  - `GET /repositories/{workspace}/{repo_slug}/components/{component_id}` — Get a component for issues
  - `GET /repositories/{workspace}/{repo_slug}/versions/{version_id}` — Get a defined version for issues
  - `GET /repositories/{workspace}/{repo_slug}/milestones/{milestone_id}` — Get a milestone
  - `GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}` — Get an issue
  - `GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments/{path}` — Get attachment for an issue
  - `GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}/changes/{change_id}` — Get issue change object
  - `POST /repositories/{workspace}/{repo_slug}/issues/import` — Import issues
  - `GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments` — List attachments for an issue
  - `GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}/changes` — List changes on an issue
  - `GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments` — List comments on an issue
  - `GET /repositories/{workspace}/{repo_slug}/components` — List components
  - `GET /repositories/{workspace}/{repo_slug}/versions` — List defined versions for issues
  - `GET /repositories/{workspace}/{repo_slug}/issues` — List issues
  - `GET /repositories/{workspace}/{repo_slug}/milestones` — List milestones
  - `POST /repositories/{workspace}/{repo_slug}/issues/{issue_id}/changes` — Modify the state of an issue
  - `DELETE /repositories/{workspace}/{repo_slug}/issues/{issue_id}/vote` — Remove vote for an issue
  - `DELETE /repositories/{workspace}/{repo_slug}/issues/{issue_id}/watch` — Stop watching an issue
  - `PUT /repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments/{comment_id}` — Update a comment on an issue
  - `PUT /repositories/{workspace}/{repo_slug}/issues/{issue_id}` — Update an issue
  - `POST /repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments` — Upload an attachment to an issue
  - `PUT /repositories/{workspace}/{repo_slug}/issues/{issue_id}/vote` — Vote for an issue
  - `PUT /repositories/{workspace}/{repo_slug}/issues/{issue_id}/watch` — Watch an issue

### Group 29: Snippets

- [ ] **T087** [P]: Write contract tests covering all Bitbucket Cloud Snippets endpoints below. Ensure contract coverage asserts shared pagination behavior for 5 list endpoints like `GET /snippets/{workspace}/{encoded_id}/comments`, `GET /snippets/{workspace}/{encoded_id}/commits`, `GET /snippets`.
- [ ] **T088**: Implement internal operations for the Bitbucket Cloud Snippets endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /snippets/{workspace}/{encoded_id}/watch` — Check if the current user is watching a snippet
  - `POST /snippets/{workspace}/{encoded_id}/comments` — Create a comment on a snippet
  - `POST /snippets` — Create a snippet
  - `POST /snippets/{workspace}` — Create a snippet for a workspace
  - `DELETE /snippets/{workspace}/{encoded_id}/comments/{comment_id}` — Delete a comment on a snippet
  - `DELETE /snippets/{workspace}/{encoded_id}/{node_id}` — Delete a previous revision of a snippet
  - `DELETE /snippets/{workspace}/{encoded_id}` — Delete a snippet
  - `GET /snippets/{workspace}/{encoded_id}/comments/{comment_id}` — Get a comment on a snippet
  - `GET /snippets/{workspace}/{encoded_id}/{node_id}` — Get a previous revision of a snippet
  - `GET /snippets/{workspace}/{encoded_id}/commits/{revision}` — Get a previous snippet change
  - `GET /snippets/{workspace}/{encoded_id}` — Get a snippet
  - `GET /snippets/{workspace}/{encoded_id}/{node_id}/files/{path}` — Get a snippet's raw file
  - `GET /snippets/{workspace}/{encoded_id}/files/{path}` — Get a snippet's raw file at HEAD
  - `GET /snippets/{workspace}/{encoded_id}/{revision}/diff` — Get snippet changes between versions
  - `GET /snippets/{workspace}/{encoded_id}/{revision}/patch` — Get snippet patch between versions
  - `GET /snippets/{workspace}/{encoded_id}/comments` — List comments on a snippet
  - `GET /snippets/{workspace}/{encoded_id}/commits` — List snippet changes
  - `GET /snippets` — List snippets
  - `GET /snippets/{workspace}` — List snippets in a workspace
  - `GET /snippets/{workspace}/{encoded_id}/watchers` — List users watching a snippet
  - `DELETE /snippets/{workspace}/{encoded_id}/watch` — Stop watching a snippet
  - `PUT /snippets/{workspace}/{encoded_id}/comments/{comment_id}` — Update a comment on a snippet
  - `PUT /snippets/{workspace}/{encoded_id}/{node_id}` — Update a previous revision of a snippet
  - `PUT /snippets/{workspace}/{encoded_id}` — Update a snippet
  - `PUT /snippets/{workspace}/{encoded_id}/watch` — Watch a snippet

### Group 30: Downloads

- [ ] **T089** [P]: Write contract tests covering all Bitbucket Cloud Downloads endpoints below. Ensure contract coverage asserts shared pagination behavior for 1 list endpoints like `GET /repositories/{workspace}/{repo_slug}/downloads`.
- [ ] **T090**: Implement internal operations for the Bitbucket Cloud Downloads endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `DELETE /repositories/{workspace}/{repo_slug}/downloads/{filename}` — Delete a download artifact
  - `GET /repositories/{workspace}/{repo_slug}/downloads/{filename}` — Get a download artifact link
  - `GET /repositories/{workspace}/{repo_slug}/downloads` — List download artifacts
  - `POST /repositories/{workspace}/{repo_slug}/downloads` — Upload a download artifact

### Group 31: Users

- [ ] **T091** [P]: Write contract tests covering all Bitbucket Cloud Users endpoints below. Ensure contract coverage asserts shared pagination behavior for 1 list endpoints like `GET /user/emails`.
- [ ] **T092**: Implement internal operations for the Bitbucket Cloud Users endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /users/{selected_user}` — Get a user
  - `GET /user/emails/{email}` — Get an email address for current user
  - `GET /user` — Get current user
  - `GET /user/emails` — List email addresses for current user

### Group 32: Webhooks

- [ ] **T093** [P]: Write contract tests covering all Bitbucket Cloud Webhooks endpoints below. Ensure contract coverage asserts shared pagination behavior for 1 list endpoints like `GET /hook_events/{subject_type}`.
- [ ] **T094**: Implement internal operations for the Bitbucket Cloud Webhooks endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /hook_events` — Get a webhook resource
  - `GET /hook_events/{subject_type}` — List subscribable webhook types

### Group 33: Search

- [ ] **T095** [P]: Write contract tests covering all Bitbucket Cloud Search endpoints below.
- [ ] **T096**: Implement internal operations for the Bitbucket Cloud Search endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `GET /teams/{username}/search/code` — Search for code in a team's repositories
  - `GET /users/{selected_user}/search/code` — Search for code in a user's repositories
  - `GET /workspaces/{workspace}/search/code` — Search for code in a workspace

### Group 34: Reports

- [ ] **T097** [P]: Write contract tests covering all Bitbucket Cloud Reports endpoints below. Ensure contract coverage asserts shared pagination behavior for 2 list endpoints like `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}/annotations`, `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/reports`.
- [ ] **T098**: Implement internal operations for the Bitbucket Cloud Reports endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}/annotations` — Bulk create or update annotations
  - `PUT /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}` — Create or update a report
  - `PUT /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}/annotations/{annotationId}` — Create or update an annotation
  - `DELETE /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}` — Delete a report
  - `DELETE /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}/annotations/{annotationId}` — Delete an annotation
  - `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}` — Get a report
  - `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}/annotations/{annotationId}` — Get an annotation
  - `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}/annotations` — List annotations
  - `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/reports` — List reports

### Group 35: Addon

- [ ] **T099** [P]: Write contract tests covering all Bitbucket Cloud Addon endpoints below. Ensure contract coverage asserts shared pagination behavior for 2 list endpoints like `GET /addon/linkers/{linker_key}/values`, `GET /addon/linkers`.
- [ ] **T100**: Implement internal operations for the Bitbucket Cloud Addon endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /addon/linkers/{linker_key}/values` — Create a linker value
  - `DELETE /addon/linkers/{linker_key}/values/{value_id}` — Delete a linker value
  - `DELETE /addon/linkers/{linker_key}/values` — Delete all linker values
  - `DELETE /addon` — Delete an app
  - `GET /addon/linkers/{linker_key}` — Get a linker for an app
  - `GET /addon/linkers/{linker_key}/values/{value_id}` — Get a linker value
  - `GET /addon/linkers/{linker_key}/values` — List linker values for a linker
  - `GET /addon/linkers` — List linkers for an app
  - `PUT /addon/linkers/{linker_key}/values` — Update a linker value
  - `PUT /addon` — Update an installed app

### Group 36: GPG

- [ ] **T101** [P]: Write contract tests covering all Bitbucket Cloud GPG endpoints below. Ensure contract coverage asserts shared pagination behavior for 1 list endpoints like `GET /users/{selected_user}/gpg-keys`.
- [ ] **T102**: Implement internal operations for the Bitbucket Cloud GPG endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /users/{selected_user}/gpg-keys` — Add a new GPG key
  - `DELETE /users/{selected_user}/gpg-keys/{fingerprint}` — Delete a GPG key
  - `GET /users/{selected_user}/gpg-keys/{fingerprint}` — Get a GPG key
  - `GET /users/{selected_user}/gpg-keys` — List GPG keys

### Group 37: SSH

- [ ] **T103** [P]: Write contract tests covering all Bitbucket Cloud SSH endpoints below. Ensure contract coverage asserts shared pagination behavior for 1 list endpoints like `GET /users/{selected_user}/ssh-keys`.
- [ ] **T104**: Implement internal operations for the Bitbucket Cloud SSH endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `POST /users/{selected_user}/ssh-keys` — Add a new SSH key
  - `DELETE /users/{selected_user}/ssh-keys/{key_id}` — Delete a SSH key
  - `GET /users/{selected_user}/ssh-keys/{key_id}` — Get a SSH key
  - `GET /users/{selected_user}/ssh-keys` — List SSH keys
  - `PUT /users/{selected_user}/ssh-keys/{key_id}` — Update a SSH key

### Group 38: properties

- [ ] **T105** [P]: Write contract tests covering all Bitbucket Cloud properties endpoints below.
- [ ] **T106**: Implement internal operations for the Bitbucket Cloud properties endpoints below, using the shared pagination utility for every list endpoint and aligning with SchemaService validation.
  - `DELETE /repositories/{workspace}/{repo_slug}/commit/{commit}/properties/{app_key}/{property_name}` — Delete a commit application property
  - `DELETE /repositories/{workspace}/{repo_slug}/pullrequests/{pullrequest_id}/properties/{app_key}/{property_name}` — Delete a pull request application property
  - `DELETE /repositories/{workspace}/{repo_slug}/properties/{app_key}/{property_name}` — Delete a repository application property
  - `DELETE /users/{selected_user}/properties/{app_key}/{property_name}` — Delete a user application property
  - `GET /repositories/{workspace}/{repo_slug}/commit/{commit}/properties/{app_key}/{property_name}` — Get a commit application property
  - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pullrequest_id}/properties/{app_key}/{property_name}` — Get a pull request application property
  - `GET /repositories/{workspace}/{repo_slug}/properties/{app_key}/{property_name}` — Get a repository application property
  - `GET /users/{selected_user}/properties/{app_key}/{property_name}` — Get a user application property
  - `PUT /repositories/{workspace}/{repo_slug}/commit/{commit}/properties/{app_key}/{property_name}` — Update a commit application property
  - `PUT /repositories/{workspace}/{repo_slug}/pullrequests/{pullrequest_id}/properties/{app_key}/{property_name}` — Update a pull request application property
  - `PUT /repositories/{workspace}/{repo_slug}/properties/{app_key}/{property_name}` — Update a repository application property
  - `PUT /users/{selected_user}/properties/{app_key}/{property_name}` — Update a user application property
