# Tasks: The 3-Tool Implementation

**Input**: Design documents from `/specs/005-spec-1-3/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/

## Phase 3.1: Setup
- [ ] T001 [P] Install dependencies: `npm install zod sqlite-vec sentence-transformers`
- [ ] T002 [P] Configure Jest for TypeScript projects in `jest.config.js`.
- [ ] T003 Create a script `scripts/generate-embeddings.js` to read a subset of API documentation, generate embeddings using `sentence-transformers`, and save them to a `vector-db.sqlite` file.

## Phase 3.2: Tests First (TDD)
- [ ] T004 [P] Create contract test `tests/contract/search-ids.test.ts` for the `search-ids` tool. It should mock the vector DB and assert that the tool returns the expected `SearchIdsResponse` based on the `contracts/search-ids.ts` schema.
- [ ] T005 [P] Create contract test `tests/contract/get-id.test.ts` for the `get-id` tool. It should assert that the tool returns a valid Zod schema for a known ID and throws a "Not Found" error for an unknown ID, based on `contracts/get-id.ts`.
- [ ] T006 [P] Create contract test `tests/contract/call-id.test.ts` for the `call-id` tool. It should mock the Bitbucket API and assert that the tool validates parameters and returns the expected `CallIdResponse` based on `contracts/call-id.ts`.
- [ ] T007 Create integration test `tests/integration/3-tool-flow.test.ts` that covers the entire user story from `quickstart.md`: call `search-ids`, then `get-id`, then `call-id`.

## Phase 3.3: Core Implementation
- [ ] T008 Implement the vector database service in `src/services/VectorDBService.ts`. This service will be responsible for loading the `vector-db.sqlite` file and providing a method to search for embeddings.
- [ ] T009 Implement the schema service in `src/services/SchemaService.ts`. This service will be responsible for loading and providing Zod schemas based on an operation ID.
- [ ] T010 Implement the `search-ids` tool in `src/tools/search-ids.ts`. It will use the `VectorDBService` to query for operations. (Depends on T008)
- [ ] T011 Implement the `get-id` tool in `src/tools/get-id.ts`. It will use the `SchemaService` to retrieve schemas. (Depends on T009)
- [ ] T012 Implement the `call-id` tool in `src/tools/call-id.ts`. It will use the `SchemaService` to get a validator and `axios` to make the Bitbucket API call. It must handle success, validation errors, and API errors. (Depends on T009)
- [ ] T013 Implement the main server file `src/server.ts` to register the three tools with the MCP SDK.

## Phase 3.4: Polish
- [ ] T014 [P] Write unit tests for any utility functions created during implementation in `tests/unit/`.
- [ ] T015 [P] Add comprehensive JSDoc documentation to all new services and tools.
- [ ] T016 Manually run the `quickstart.md` scenario to ensure the end-to-end flow works as expected.

## Dependencies
- **T001-T003** (Setup) must be done first.
- **T004-T007** (Tests) must be completed before Phase 3.3.
- **T008** is a dependency for **T010**.
- **T009** is a dependency for **T011** and **T012**.
- **T010, T011, T012** are dependencies for **T013**.
- **T007** (Integration Test) depends on the completion of all core implementation tasks.

## Parallel Example
The contract tests can be developed in parallel:
```bash
# In one terminal
Task: "T004 Create contract test for search-ids"

# In another terminal
Task: "T005 Create contract test for get-id"

# In a third terminal
Task: "T006 Create contract test for call-id"
```
