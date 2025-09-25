# Tasks: Vector DB & Embedding Pipeline

**Input**: Design documents from `/Users/lucianoguerche/Documents/GitHub/bitbucket-mcp-server/specs/004-spec-1-2/`
**Prerequisites**: plan.md, research.md, data-model.md, quickstart.md

## Phase 3.1: Setup
- [ ] T001 [P] Install required dependencies: `npm install sqlite-vec sentence-transformers`
- [ ] T002 [P] Create the directory `src/scripts` for the new generation script.
- [ ] T003 [P] Create an empty file `data/bitbucket-api.json` to hold the source data, and add it to `.gitignore`.

## Phase 3.2: Core Implementation
- [ ] T004 Define the `ApiOperationSource` Zod schema in `src/models/api-operation-source.ts` based on `data-model.md`.
- [ ] T005 Create the embedding generation script at `src/scripts/generate-embeddings.ts`.
- [ ] T006 Implement logic in the script to read and parse `data/bitbucket-api.json` using the `ApiOperationSourceSchema`.
- [ ] T007 Implement logic to initialize the `sqlite-vec` database client, creating the file at `dist/db/bitbucket-embeddings.db`.
- [ ] T008 Implement a loop to iterate through each API operation source. Inside the loop, serialize the JSON object to a string to be used for embedding.
- [ ] T009 Integrate the `sentence-transformers` library to generate a vector embedding from the serialized string.
- [ ] T010 Implement logic to insert the embedding and the full JSON object as metadata into the `sqlite-vec` database.
- [ ] T011 Add error handling to log failures for individual operations and continue the process, as specified in the clarifications.
- [ ] T012 Add a `commander.js` command to the `package.json` scripts, e.g., `"generate-embeddings": "ts-node src/scripts/generate-embeddings.ts"`.

## Phase 3.3: Tests First (TDD)
- [ ] T013 [P] Create a test file `tests/unit/api-operation-source.test.ts` to validate the `ApiOperationSourceSchema` with valid and invalid data.
- [ ] T014 [P] Create a test file `tests/integration/generate-embeddings.test.ts`.
- [ ] T015 Write a test in `generate-embeddings.test.ts` to mock the `data/bitbucket-api.json` file with sample data.
- [ ] T016 Write a test to run the generation script and assert that the `dist/db/bitbucket-embeddings.db` file is created.
- [ ] T017 Write a test to connect to the generated database and perform a search for a known term from the sample data.
- [ ] T018 Assert that the search result is the correct ID and that the retrieved metadata matches the original sample data.
- [ ] T019 Write a test to verify the error handling by providing one invalid record in the sample data and ensuring the script logs an error but still completes.

## Phase 3.4: Polish
- [ ] T020 [P] Add comprehensive JSDoc comments to the `generate-embeddings.ts` script and the `api-operation-source.ts` model.
- [ ] T021 [P] Update the main `README.md` to include instructions on how to generate the vector database using the new script.

## Dependencies
- **T001, T002, T003** must be done before other tasks.
- **T004** blocks **T006**.
- **Tests (T013-T019)** should ideally be written before or in parallel with the implementation tasks (**T005-T012**) to follow TDD. For example, write **T016** then implement **T007**.

## Parallel Example
The following setup and test creation tasks can be run in parallel:
```
Task: "T001 [P] Install required dependencies: npm install sqlite-vec sentence-transformers"
Task: "T002 [P] Create the directory src/scripts for the new generation script."
Task: "T003 [P] Create an empty file data/bitbucket-api.json to hold the source data, and add it to .gitignore."
Task: "T013 [P] Create a test file tests/unit/api-operation-source.test.ts to validate the ApiOperationSourceSchema with valid and invalid data."
Task: "T014 [P] Create a test file tests/integration/generate-embeddings.test.ts."
```
