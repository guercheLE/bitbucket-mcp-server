# Research: Spec 0.1: Governance & Project Setup

## Decision: Technology Stack
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Testing**: Jest
- **Dependencies**: `@modelcontextprotocol/sdk`, `zod`, `axios`, `winston`, `commander.js`, `@lancedb/lancedb`
- **Rationale**: This stack aligns with the constitution's requirements and provides a robust foundation for building the MCP server. TypeScript offers strong typing, Jest is a comprehensive testing framework, and the selected libraries are well-suited for their respective tasks. `@lancedb/lancedb` is chosen for the embedded vector database due to its maintained Node.js support.
- **Alternatives considered**: `ChromaDB` was considered for the vector database, but `@lancedb/lancedb` (LanceDB) has better-perceived Node.js support.

## Decision: Project Structure
- **Structure**: A single project structure will be used, containing both the server and a console client.
- **Rationale**: The project is self-contained, and a monorepo structure with `backend`/`frontend` is not necessary at this stage. This simplifies the initial setup and build process.
- **Alternatives considered**: A multi-project structure was considered but deemed overly complex for the initial setup.
