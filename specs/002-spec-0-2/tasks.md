# Tasks: Core Component Design & Test Definition

This file outlines the development tasks for implementing the core components and test specifications for the Bitbucket MCP server.

## Task List

| ID   | Task                                                              | Files                              | Depends On | Status |
| ---- | ----------------------------------------------------------------- | ---------------------------------- | ---------- | ------ |
| T001 | **Setup**: Configure Jest for the project.                        | `jest.config.js`                   | -          | [X]    |
| T002 | **Setup**: Install required dependencies.                         | `package.json`                     | -          | [X]    |
| T003 | **Models [P]**: Define Zod schema for the `Project` entity.       | `src/models/project.ts`            | -          | [X]    |
| T004 | **Models [P]**: Define Zod schema for the `Repository` entity.    | `src/models/repository.ts`         | T003       | [X]    |
| T005 | **Models [P]**: Define Zod schema for the `Branch` entity.        | `src/models/branch.ts`             | T004       | [X]    |
| T006 | **Models [P]**: Define Zod schema for the `User` entity.          | `src/models/user.ts`               | -          | [X]    |
| T007 | **Models [P]**: Define Zod schema for the `PullRequest` entity.   | `src/models/pull-request.ts`       | T005, T006 | [X]    |
| T008 | **Tests [P]**: Create contract tests for `PullRequest` model.     | `tests/contract/models.test.ts`    | T007       | [X]    |
| T009 | **Tests**: Create integration tests for server startup.           | `tests/integration/server.test.ts` | T001       | [X]    |
| T010 | **Tests**: Create integration tests for Bitbucket authentication. | `tests/integration/auth.test.ts`   | T001       | [X]    |
| T011 | **Core**: Implement server startup logic.                         | `src/server.ts`                    | T009       | [X]    |
| T012 | **Core**: Implement Bitbucket authentication service.             | `src/services/auth.ts`             | T010       | [X]    |
| T013 | **Tests**: Create integration tests for `search-ids` tool.        | `tests/integration/tools.test.ts`  | T001       | [X]    |
| T014 | **Core**: Implement `search-ids` tool logic.                      | `src/services/search.ts`           | T013       | [X]    |
| T015 | **Tests**: Create integration tests for `get-id` tool.            | `tests/integration/tools.test.ts`  | T013       | [X]    |
| T016 | **Core**: Implement `get-id` tool logic.                          | `src/services/discovery.ts`        | T015       | [X]    |
| T017 | **Tests**: Create integration tests for `call-id` tool.           | `tests/integration/tools.test.ts`  | T013       | [X]    |
| T018 | **Core**: Implement `call-id` tool logic.                         | `src/services/execution.ts`        | T017       | [X]    |
| T019 | **CLI**: Implement CLI command for starting the server.           | `src/cli.ts`                       | T011       | [X]    |
| T020 | **Polish**: Add documentation for core services and models.       | `src/services/*`, `src/models/*`   | T018       | [X]    |

## Parallel Execution Examples

The following tasks can be executed in parallel.

### 1. Model and Contract Definition

These tasks define the data structures and their validation schemas. They are independent of each other until the `PullRequest` entity.

```bash
# Agent command to execute these tasks
copilot-agent execute --task-id T003 T006
copilot-agent execute --task-id T004
copilot-agent execute --task-id T005
copilot-agent execute --task-id T007
copilot-agent execute --task-id T008
```

### 2. Initial Test Setup

These tasks set up the testing framework for different parts of the application.

```bash
# Agent command to execute these tasks
copilot-agent execute --task-id T009 T010 T013
```
