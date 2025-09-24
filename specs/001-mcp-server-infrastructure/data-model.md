# Data Model: MCP Server Infrastructure

**Feature**: 001-mcp-server-infrastructure  
**Date**: 2025-09-21  
**Status**: Complete  

## Core Entities

### MCPServer
**Purpose**: Main server instance that implements the Model Context Protocol
**Fields**:
- id: string (unique server identifier)
- version: string (MCP protocol version supported)
- capabilities: ServerCapabilities (advertised capabilities)
- transports: Transport[] (active transport connections)
- tools: Map<string, Tool> (registered tools by name)
- clients: Map<string, ClientSession> (active client sessions)
- status: ServerStatus (running, stopped, error)
- startTime: Date (server startup timestamp)

**Validation Rules**:
- id must be unique and non-empty
- version must follow semver format
- status must be valid enum value
- tools map cannot exceed constitutional memory limits

**State Transitions**:
- stopped → starting → running
- running → stopping → stopped  
- any → error (on unrecoverable failure)

### ClientSession
**Purpose**: Represents an active connection with an MCP client
**Fields**:
- sessionId: string (unique session identifier)
- transport: Transport (connection transport type)
- capabilities: ClientCapabilities (client-advertised capabilities)
- connectionTime: Date (when session established)
- lastActivity: Date (last request/response timestamp)
- status: SessionStatus (connected, disconnected, error)

**Validation Rules**:
- sessionId must be unique per server instance
- connectionTime cannot be future date
- lastActivity must be >= connectionTime

**Relationships**:
- belongs to one MCPServer
- uses one Transport

### Tool
**Purpose**: Represents a registered MCP tool (Bitbucket API integration)
**Fields**:
- name: string (tool identifier, must be unique)
- description: string (human-readable description)
- inputSchema: ZodSchema (Zod schema for tool input validation)
- outputSchema: ZodSchema (Zod schema for tool output validation)
- handler: Function (tool execution function)
- metadata: ToolMetadata (server type, version requirements)
- registrationTime: Date (when tool was registered)

**Validation Rules**:
- name must match MCP tool naming conventions
- inputSchema and outputSchema must be valid Zod schemas
- handler must be a callable function
- metadata must specify required Bitbucket server capabilities

**Relationships**:
- registered with one MCPServer
- can be invoked by multiple ClientSessions

### Transport
**Purpose**: Represents a communication transport (stdio, HTTP, SSE)
**Fields**:
- type: TransportType (stdio, http, sse)
- isActive: boolean (connection status)
- configuration: TransportConfig (transport-specific settings)
- lastError: Error? (most recent error if any)

**Validation Rules**:
- type must be supported transport type
- configuration must be valid for transport type

### ProtocolMessage
**Purpose**: Represents MCP protocol messages exchanged between client and server
**Fields**:
- id: string (message identifier for request-response correlation)
- method: string (MCP method name)
- params: any (method parameters, validated by tool schemas)
- result?: any (response data for successful requests)
- error?: MCPError (error details for failed requests)
- timestamp: Date (message processing time)

**Validation Rules**:
- id must be unique within session
- method must be valid MCP protocol method
- either result or error must be present in responses, not both

## Enums and Types

### ServerStatus
- stopped: Server is not running
- starting: Server is initializing
- running: Server is active and accepting connections
- stopping: Server is shutting down gracefully
- error: Server encountered unrecoverable error

### SessionStatus
- connected: Client session is active
- disconnected: Client session ended normally
- error: Client session ended due to error

### TransportType
- stdio: Standard input/output transport
- http: HTTP transport (REST-like)
- sse: Server-Sent Events transport

## Schema Validation

All entities use Zod schemas for runtime validation to ensure type safety and MCP protocol compliance:

```typescript
const MCPServerSchema = z.object({
  id: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  capabilities: ServerCapabilitiesSchema,
  transports: z.array(TransportSchema),
  tools: z.map(z.string(), ToolSchema),
  clients: z.map(z.string(), ClientSessionSchema),
  status: z.enum(['stopped', 'starting', 'running', 'stopping', 'error']),
  startTime: z.date()
});
```

## Memory and Performance Considerations

- Tools map uses efficient lookup for O(1) tool resolution
- Client sessions automatically cleaned up on disconnect
- Protocol messages use streaming for large responses
- Constitutional <1GB memory limit enforced through bounded collections
- Garbage collection friendly object lifecycle management