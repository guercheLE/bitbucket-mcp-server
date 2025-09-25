# Research: Server & Connectivity

## Research Summary
This document outlines the research conducted to inform the implementation of the MCP server, focusing on best practices for the selected technology stack.

---

### 1. @modelcontextprotocol/sdk
- **Decision**: Utilize the `createServer` function from the SDK to instantiate the MCP server. Implement `start` and `stop` methods to manage the server lifecycle. For transport protocols, the SDK provides built-in support for `stdio` and `HTTP`, which will be configured during server creation.
- **Rationale**: The SDK is the official and most reliable way to implement MCP functionalities, ensuring compliance with the protocol.
- **Alternatives considered**: None, as the constitution mandates the use of the official SDK.

### 2. axios
- **Decision**: Create a dedicated `BitbucketService` that encapsulates all `axios`-based communication with the Bitbucket API. This service will handle connection logic, including error handling and automatic retries with exponential backoff upon connection failure. Interceptors will be used to manage authentication and logging.
- **Rationale**: Centralizing API interactions within a service improves modularity and maintainability. `axios` interceptors provide a clean way to handle cross-cutting concerns like authentication and logging.
- **Alternatives considered**: `node-fetch`, but `axios` offers a richer feature set, including interceptors and automatic JSON parsing, which are beneficial for this project.

### 3. winston
- **Decision**: Implement a custom `winston` format to sanitize sensitive information from logs, such as credentials and tokens. This format will be applied to all transports.
- **Rationale**: Log sanitization is a critical security requirement. A custom format provides a flexible and reusable way to ensure no sensitive data is logged.
- **Alternatives considered**: Manually sanitizing log messages at the call site, but this is error-prone and less maintainable.

### 4. commander.js
- **Decision**: Define `start` and `stop` commands using `commander.js`. The `start` command will initialize and start the MCP server, while the `stop` command will gracefully shut it down.
- **Rationale**: `commander.js` is a standard and powerful library for building command-line interfaces in Node.js.
- **Alternatives considered**: `yargs`, but `commander.js` is sufficient for the current needs and is already listed in the project's dependencies.

### 5. Jest & TDD
- **Decision**: Follow a strict Red-Green-Refactor TDD cycle. Tests will be written for each functional requirement before the implementation code. This includes tests for server start/stop, transport connectivity, Bitbucket connection, and error handling.
- **Rationale**: TDD is a non-negotiable constitutional requirement, ensuring high-quality, well-tested code.
- **Alternatives considered**: None.

### 6. Zod
- **Decision**: Use `Zod` to define schemas for environment variables and API responses. This will ensure that the server operates with valid data and that API interactions are type-safe.
- **Rationale**: `Zod` provides a powerful and expressive way to define and validate schemas, which is essential for robust and reliable applications.
- **Alternatives considered**: `Joi`, but `Zod` has better TypeScript integration.
