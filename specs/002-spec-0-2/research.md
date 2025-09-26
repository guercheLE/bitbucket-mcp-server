# Research: Core Component Design & Test Definition

## 1. Semantic Discovery Pattern (`search-ids`, `get-id`, `call-id`)

### Objective
Design a 3-tool pattern for discovering and interacting with Bitbucket API endpoints, focusing on Pull Requests for the MVP.

### Key Considerations
- **`search-ids`**: This tool will perform a semantic search over an index of Bitbucket API operations related to Pull Requests. The search query will be natural language. The result will be a list of operation IDs and descriptions.
- **`get-id`**: This tool will take an operation ID from `search-ids` and return a detailed Zod schema for the operation's inputs and outputs. This provides the contract for `call-id`.
- **`call-id`**: This tool will execute the Bitbucket API operation using the provided ID and a JSON object matching the Zod schema from `get-id`.

### Technology
- **Vector Database**: For `search-ids`, an embedded vector database like `@lancedb/lancedb` or `ChromaDB` will be used to store and search embeddings of the API operation descriptions.
- **Embeddings**: `OpenAI embeddings` or a local model via `transformers.js` will be used to generate embeddings for the search.
- **Schema Generation**: Zod schemas will be generated, potentially from Bitbucket's OpenAPI specifications if available, or manually defined for the MVP.

## 2. Test Specifications (Jest)

### Objective
Create comprehensive test specifications for the MVP features using Jest. This follows the "Test-First" constitutional requirement.

### Test Structure
Tests will be organized into `unit`, `integration`, and `contract` tests within the `tests/` directory.

### Test Cases
#### a. Server Startup and Transport Connectivity
- `describe('Server Startup', ...)`
  - `it('should start without errors', ...)`
  - `it('should connect to the specified transport', ...)`

#### b. Bitbucket Server Detection and Authentication
- `describe('Bitbucket Server Discovery', ...)`
  - `it('should correctly detect a Bitbucket Cloud server', ...)`
  - `it('should correctly detect a Bitbucket Data Center server', ...)`
  - `it('should authenticate successfully using a Personal Access Token (PAT)', ...)`
  - `it('should handle authentication failures gracefully', ...)`

#### c. Core Tools (`search-ids`, `get-id`, `call-id`) for Pull Requests
- `describe('Core Tools - Pull Requests', ...)`
  - `describe('search-ids', ...)`
    - `it('should return relevant pull request operations for a natural language query', ...)`
    - `it('should handle pagination correctly', ...)`
  - `describe('get-id', ...)`
    - `it('should return the correct Zod schema for a given pull request operation ID', ...)`
    - `it('should return an error for an invalid operation ID', ...)`
  - `describe('call-id', ...)`
    - `it('should execute a pull request operation successfully with valid data', ...)`
    - `it('should handle validation errors for invalid data', ...)`
    - `it('should handle errors from the Bitbucket API', ...)`
