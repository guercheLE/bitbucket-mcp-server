# Tasks: Server & Connectivity

**Input**: Design documents from `/specs/003-spec-1-1/`
**Prerequisites**: plan.md, research.md, data-model.md, quickstart.md

## Phase 3.1: Setup

- [x] T001 [P] Create the initial directory structure: `src/server`, `src/services`, `src/types`, `src/utils`, `tests/unit`, `tests/integration`.
- [x] T002 [P] Define Zod schemas for `ServerConfig` and `BitbucketCredentials` in `src/types/config.ts`.
- [x] T003 [P] Define `BitbucketServerInfo` and `ServerState` types in `src/types/server.ts`.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T004 [P] Write a unit test for the logger service in `tests/unit/logger.test.ts` to verify log sanitization.
- [x] T005 [P] Write a unit test for the Bitbucket service in `tests/unit/bitbucket.test.ts` to mock and test connection, version detection, and error handling.
- [x] T006 [P] Write an integration test in `tests/integration/server.test.ts` to verify that the server can start and stop gracefully.
- [x] T007 [P] Write an integration test in `tests/integration/transport.test.ts` to verify the functionality of the `stdio` and `HTTP` transports.
- [x] T008 [P] Write an integration test in `tests/integration/cli.test.ts` to verify the `start` and `stop` commands.

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T009 Implement the logger service in `src/utils/logger.ts` using `winston` with a custom sanitization format.
- [x] T010 Implement the Bitbucket connectivity service in `src/services/bitbucket.ts` using `axios`, including connection logic, version detection, and retry mechanism.
- [x] T011 Implement the main server module in `src/server/index.ts` using `@modelcontextprotocol/sdk`, including start/stop logic and transport configuration.
- [x] T012 Implement the command-line interface in `src/cli.ts` using `commander.js` to handle the `start` and `stop` commands.

## Phase 3.4: Integration

- [x] T013 Integrate the Bitbucket service into the main server module to connect on startup.
- [x] T014 Integrate the logger service throughout the application.
- [x] T015 Implement the health check endpoint in the HTTP transport.

## Phase 3.5: Polish

- [x] T016 [P] Add additional unit tests to ensure >80% code coverage for all new modules.
- [x] T017 [P] Update the `README.md` with instructions on how to run the server.
- [x] T018 [P] Manually test the server following the steps in `specs/003-spec-1-1/quickstart.md`.

## Dependencies

- **T001, T002, T003** (Setup) must be completed before all other tasks.
- **T004-T008** (Tests) must be completed before **T009-T012** (Core Implementation).
- **T009** (Logger) is a dependency for **T010**, **T011**, **T012**.
- **T010** (Bitbucket Service) is a dependency for **T013**.
- **T011** (Server) is a dependency for **T012**, **T013**.
- **T013, T014, T015** (Integration) must be completed before **T016, T017, T018** (Polish).

## Parallel Example

The following test creation tasks can be run in parallel:

```
Task: "T004 [P] Write a unit test for the logger service in tests/unit/logger.test.ts to verify log sanitization."
Task: "T005 [P] Write a unit test for the Bitbucket service in tests/unit/bitbucket.test.ts to mock and test connection, version detection, and error handling."
Task: "T006 [P] Write an integration test in tests/integration/server.test.ts to verify that the server can start and stop gracefully."
Task: "T007 [P] Write an integration test in tests/integration/transport.test.ts to verify the functionality of the stdio and HTTP transports."
Task: "T008 [P] Write an integration test in tests/integration/cli.test.ts to verify the start and stop commands."
```
