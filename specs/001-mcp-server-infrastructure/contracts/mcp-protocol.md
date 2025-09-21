# MCP Protocol Contracts

## Server Initialization Contract

### initialize
**Method**: `initialize`
**Description**: Initialize MCP client-server connection and capability negotiation
**Request Schema**:
```json
{
  "jsonrpc": "2.0",
  "id": "string",
  "method": "initialize", 
  "params": {
    "protocolVersion": "string",
    "capabilities": {
      "tools": "object"
    },
    "clientInfo": {
      "name": "string",
      "version": "string"
    }
  }
}
```

**Response Schema**:
```json
{
  "jsonrpc": "2.0",
  "id": "string", 
  "result": {
    "protocolVersion": "string",
    "capabilities": {
      "tools": {
        "listChanged": "boolean"
      },
      "logging": "object"
    },
    "serverInfo": {
      "name": "string",
      "version": "string"
    }
  }
}
```

**Error Schema**:
```json
{
  "jsonrpc": "2.0",
  "id": "string",
  "error": {
    "code": "number",
    "message": "string",
    "data": "any"
  }
}
```

## Tool Management Contracts

### tools/list
**Method**: `tools/list`
**Description**: Get list of available tools
**Request Schema**:
```json
{
  "jsonrpc": "2.0",
  "id": "string",
  "method": "tools/list",
  "params": {}
}
```

**Response Schema**:
```json
{
  "jsonrpc": "2.0",
  "id": "string",
  "result": {
    "tools": [
      {
        "name": "string",
        "description": "string",
        "inputSchema": "object"
      }
    ]
  }
}
```

### tools/call
**Method**: `tools/call`
**Description**: Execute a tool with parameters
**Request Schema**:
```json
{
  "jsonrpc": "2.0",
  "id": "string", 
  "method": "tools/call",
  "params": {
    "name": "string",
    "arguments": "object"
  }
}
```

**Response Schema**:
```json
{
  "jsonrpc": "2.0",
  "id": "string",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "string"
      }
    ],
    "isError": "boolean"
  }
}
```

## Connection Management Contracts

### notifications/initialized
**Method**: `notifications/initialized`
**Description**: Notify server that client has completed initialization
**Notification Schema**:
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized",
  "params": {}
}
```

### ping
**Method**: `ping`
**Description**: Health check request
**Request Schema**:
```json
{
  "jsonrpc": "2.0",
  "id": "string",
  "method": "ping",
  "params": {}
}
```

**Response Schema**:
```json
{
  "jsonrpc": "2.0", 
  "id": "string",
  "result": {}
}
```

## Error Handling Contracts

### Standard MCP Error Codes
- `-32700`: Parse error (Invalid JSON)
- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32000` to `-32099`: Server error range

### Custom Error Responses
All errors follow MCP JSON-RPC 2.0 error format with additional context in `data` field for debugging.