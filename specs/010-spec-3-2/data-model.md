# Data Model: Console Client & User Experience

This feature primarily introduces client-side entities and interacts with server-side data structures.

## 1. Client-Side Entities

### `ClientCommand`

- **Description**: Represents a command that can be executed by the user from the command line. These are dynamically generated based on the `ServerCapability` objects received from the server.
- **Fields**:
  - `name` (string): The name of the command (e.g., "search-ids").
  - `description` (string): A brief explanation of what the command does, used for help text.
  - `action` (Function): The function to execute when the command is called. This function will wrap the call to the server's corresponding tool.
- **Validation**:
  - `name` must be a valid `commander.js` command name (no spaces or special characters).
- **State Transitions**: None.

## 2. Server-Side Entities (Expected Contract)

The client expects the server to provide the following data structure via its `get-capabilities` tool.

### `ServerCapability`

- **Description**: Represents a tool or operation that the MCP server exposes. The client uses this information to build its list of `ClientCommand`s.
- **Fields**:
  - `toolName` (string): The unique identifier for the tool on the server (e.g., "search-ids", "get-id", "call-id").
  - `description` (string): A user-friendly description of the tool's purpose.
  - `parameters` (Zod.Schema): A Zod schema defining the expected input parameters for the tool. The client will use this to generate CLI arguments and options.
- **Relationships**:
  - A `ServerCapability` object from the server maps one-to-one with a `ClientCommand` object on the client.
