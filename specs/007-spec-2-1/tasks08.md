# Tasks: Webhooks and Hooks Management

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
This file lists the tasks for implementing the **Webhooks and Hooks** API endpoints.

---

## Phase 3.2: Core Implementation (Webhooks & Hooks)

### Group 7.1: Webhook Operations (Cloud)
- [ ] **T137** [P]: Write contract test for `bitbucket.webhooks.list` in `tests/contract/operations/webhooks/list.test.ts`.
- [ ] **T138**: Implement `bitbucket.webhooks.list` in `src/tools/operations/webhooks/list.ts`.
- [ ] **T139** [P]: Write contract test for `bitbucket.webhooks.create` in `tests/contract/operations/webhooks/create.test.ts`.
- [ ] **T140**: Implement `bitbucket.webhooks.create` in `src/tools/operations/webhooks/create.ts`.
- [ ] **T141** [P]: Write contract test for `bitbucket.webhooks.get` in `tests/contract/operations/webhooks/get.test.ts`.
- [ ] **T142**: Implement `bitbucket.webhooks.get` in `src/tools/operations/webhooks/get.ts`.
- [ ] **T143** [P]: Write contract test for `bitbucket.webhooks.delete` in `tests/contract/operations/webhooks/delete.test.ts`.
- [ ] **T144**: Implement `bitbucket.webhooks.delete` in `src/tools/operations/webhooks/delete.ts`.

### Group 7.2: Hook Operations (Data Center)
- [ ] **T145** [P]: Write contract test for `bitbucket.dc.hooks.list` in `tests/contract/operations/hooks/list.test.ts`.
- [ ] **T146**: Implement `bitbucket.dc.hooks.list` in `src/tools/operations/hooks/list.ts`.
- [ ] **T147** [P]: Write contract test for `bitbucket.dc.hooks.get` in `tests/contract/operations/hooks/get.test.ts`.
- [ ] **T148**: Implement `bitbucket.dc.hooks.get` in `src/tools/operations/hooks/get.ts`.
- [ ] **T149** [P]: Write contract test for `bitbucket.dc.hooks.enable` in `tests/contract/operations/hooks/enable.test.ts`.
- [ ] **T150**: Implement `bitbucket.dc.hooks.enable` in `src/tools/operations/hooks/enable.ts`.
- [ ] **T151** [P]: Write contract test for `bitbucket.dc.hooks.updateSettings` in `tests/contract/operations/hooks/updateSettings.test.ts`.
- [ ] **T152**: Implement `bitbucket.dc.hooks.updateSettings` in `src/tools/operations/hooks/updateSettings.ts`.
