# Research: 3-Tool Implementation

## Decision Summary

- **`search-ids` Tool**: Implemented using `sqlite-vec` for vector search and `sentence-transformers` for embedding generation. This provides a fast, local, and portable solution.
- **`get-id` Tool**: Implemented as a direct lookup from an in-memory map or a simple file-based database containing Zod schemas for each operation ID.
- **`call-id` Tool**: Implemented using `axios` to make the final API call to Bitbucket. Zod is used for request parameter validation against the schema provided by `get-id`.

## Rationale

- **`sqlite-vec`**: Chosen for its simplicity, file-based nature (no external server needed), and good performance for the scale of this project (200+ API endpoints). It's a perfect fit for an embedded semantic search solution.
- **`sentence-transformers`**: Provides high-quality sentence embeddings and is well-integrated with Python, making the embedding generation script straightforward.
- **`axios`**: A mature and widely-used HTTP client for Node.js, offering features like interceptors which can be useful for handling authentication and logging.
- **`zod`**: The standard for type-safe validation in the TypeScript ecosystem. Its integration with the MCP SDK is a constitutional requirement.

## Alternatives Considered

- **`@lancedb/lancedb` (LanceDB) / `ChromaDB`**: While powerful, they were considered overkill for this project's initial needs. They introduce more complex setup and potential external dependencies compared to the simplicity of `sqlite-vec`.
- **Other HTTP Clients (`fetch`, etc.)**: `axios` was preferred for its rich feature set and established community support.
- **Manual Validation**: Using Zod is a constitutional requirement and provides much more robust and maintainable validation than manual checks.
