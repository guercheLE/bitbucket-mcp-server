# Research: Complete API Operation Implementation

## Summary
This research document outlines the technical decisions for implementing full Bitbucket API coverage, as specified in `spec.md`. The decisions are guided by the project's constitution and existing architecture.

## Technical Stack & Dependencies

### Language/Version
- **Decision**: TypeScript (latest stable version compatible with Node.js 18+).
- **Rationale**: The project constitution mandates TypeScript for its strong typing and compatibility with the `@modelcontextprotocol/sdk`. This ensures consistency with the existing codebase.
- **Alternatives considered**: None, as this is a constitutional requirement.

### Primary Dependencies
- **Decision**:
    - `@modelcontextprotocol/sdk`: For MCP server and tool implementation.
    - `axios`: For making HTTP requests to the Bitbucket API.
    - `zod`: For runtime validation of API parameters and responses.
    - `jest`: For writing contract, integration, and unit tests.
    - `winston`: For structured logging.
    - `sqlite-vec` & `sentence-transformers`: For creating and querying the vector database for the `search-ids` tool.
- **Rationale**: These dependencies are established in the project's existing specs (e.g., `004-spec-1-2`) and constitution. They provide the core foundation for the server's functionality.
- **Alternatives considered**: None, to maintain consistency.

### Storage
- **Decision**: `sqlite-vec` for the file-based vector database.
- **Rationale**: The constitution requires a portable, file-based vector DB. `sqlite-vec` is already integrated into the project and meets the requirements for storing and searching API operation embeddings. No other persistent storage is required for this feature.
- **Alternatives considered**: `LanceDB`, `ChromaDB`. `sqlite-vec` was chosen for its simplicity and strong Node.js support.

### Testing
- **Decision**: `jest`.
- **Rationale**: The constitution mandates `jest` for all testing. The implementation will follow a strict TDD process, creating contract tests for each of the 200+ API endpoints before implementing the logic.
- **Alternatives considered**: None.

### Target Platform
- **Decision**: Node.js 18+ environment.
- **Rationale**: This is a server-side application, and Node.js is the established runtime as per the constitution.
- **Alternatives considered**: None.

## Architectural Decisions

### API Implementation Strategy
- **Decision**: All 200+ Bitbucket API endpoints will be implemented as internal operations, accessible exclusively through the `call-id` tool. No new public MCP tools will be registered.
- **Rationale**: This adheres to the 3-tool semantic discovery pattern (`search-ids`, `get-id`, `call-id`) mandated by the constitution. It centralizes execution logic, simplifies the public tool interface, and enforces a consistent workflow for users.
- **Alternatives considered**: Registering each Bitbucket operation as a separate MCP tool. This was rejected as it violates the constitution and would lead to a bloated, unmanageable tool surface.

### Pagination
- **Decision**: All list-based operations will implement pagination by mapping the MCP `PaginationParams` to the native Bitbucket API parameters (`start`, `limit`). The response will be transformed back into the standard MCP `PaginatedResponse` format.
- **Rationale**: This is a non-functional requirement from the feature spec and a constitutional mandate to ensure performance and prevent excessive data transfer.
- **Alternatives considered**: No pagination. Rejected as it would violate the spec and constitution and lead to poor performance.

### Handling API Version Changes
- **Decision**: Implement a "Fail Fast" strategy. If an upstream Bitbucket API is changed or deprecated, the corresponding operation will fail with a clear error message.
- **Rationale**: This decision was made during the `/clarify` step. It is the safest and most explicit approach, preventing unexpected behavior and forcing a conscious update process.
- **Alternatives considered**: Graceful degradation, automated fallback. Rejected in favor of explicitness and reliability.
