# Quickstart Guide: MCP Server Infrastructure

**Feature**: 001-mcp-server-infrastructure  
**Last Updated**: 2025-09-21  
**Prerequisites**: Node.js 18+, TypeScript

## Quick Validation Steps

### 1. Server Initialization Test
```bash
# Start the MCP server
npm start

# Expected output:
# ✅ MCP Server started on stdio transport
# ✅ Protocol version: 2024-11-05
# ✅ Server capabilities: tools, logging
# ✅ Ready for client connections
```

### 2. Client Connection Test
```bash
# In separate terminal, test with basic MCP client
echo '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test-client","version":"1.0.0"}}}' | npm start

# Expected response:
# {"jsonrpc":"2.0","id":"1","result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{"listChanged":false},"logging":{}},"serverInfo":{"name":"bitbucket-mcp-server","version":"1.0.0"}}}
```

### 3. Tool Discovery Test
```bash
# Request available tools list
echo '{"jsonrpc":"2.0","id":"2","method":"tools/list","params":{}}' | npm start

# Expected response:
# {"jsonrpc":"2.0","id":"2","result":{"tools":[]}}
# (Empty array since no Bitbucket tools registered yet - infrastructure only)
```

### 4. Health Check Test
```bash
# Ping the server
echo '{"jsonrpc":"2.0","id":"3","method":"ping","params":{}}' | npm start

# Expected response:
# {"jsonrpc":"2.0","id":"3","result":{}}
```

## Integration Test Scenarios

### Scenario 1: Complete Connection Lifecycle
```bash
# 1. Initialize connection
# 2. Send initialized notification  
# 3. List tools
# 4. Ping health check
# 5. Graceful shutdown

# All steps should complete without errors
# Server should log connection events
# Memory usage should remain stable
```

### Scenario 2: Multiple Concurrent Clients
```bash
# Start 3 simultaneous clients
# Each should receive unique session IDs
# All should be able to list tools simultaneously
# Server should handle concurrent requests without blocking
```

### Scenario 3: Error Handling
```bash
# Send malformed JSON
echo 'invalid-json' | npm start
# Expected: Parse error response with code -32700

# Send invalid method
echo '{"jsonrpc":"2.0","id":"1","method":"unknown","params":{}}' | npm start  
# Expected: Method not found error with code -32601

# Send request before initialization
echo '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}' | npm start
# Expected: Server error indicating initialization required
```

## Performance Validation

### Response Time Test
```bash
# All MCP protocol operations should complete within 2 seconds
time echo '{"jsonrpc":"2.0","id":"1","method":"ping","params":{}}' | npm start

# Should show real time < 2.0s for 95% of requests
```

### Memory Usage Test
```bash
# Start server and monitor memory
npm start &
SERVER_PID=$!

# Monitor memory usage
ps -o pid,vsz,rss,comm $SERVER_PID

# VSZ should be < 1GB as per constitutional requirement
# RSS should be reasonable for Node.js application
```

### Concurrent Connection Test
```bash
# Test constitutional requirement for multiple concurrent clients
for i in {1..5}; do
  echo '{"jsonrpc":"2.0","id":"'$i'","method":"ping","params":{}}' | npm start &
done
wait

# All 5 clients should receive successful responses
# Server should not crash or hang
```

## Success Criteria

- ✅ Server starts without errors
- ✅ MCP protocol initialization works
- ✅ Tool discovery returns empty list (expected for infrastructure-only)
- ✅ Health checks respond successfully  
- ✅ Error handling follows MCP specification
- ✅ Multiple clients can connect simultaneously
- ✅ Response times < 2s for 95% of operations
- ✅ Memory usage < 1GB constitutional limit
- ✅ Graceful shutdown preserves no critical state (stateless design)

## Troubleshooting

### Common Issues
1. **Server won't start**: Check Node.js version (18+ required)
2. **Connection refused**: Verify transport configuration
3. **Parse errors**: Ensure JSON messages are properly formatted
4. **Method not found**: Verify MCP protocol method names
5. **High memory usage**: Check for client session leaks

### Debug Mode
```bash
DEBUG=mcp:* npm start
# Enables detailed logging for all MCP operations
```

## Next Steps
After validating this infrastructure:
1. Proceed to 002-authentication-system (depends on this foundation)
2. Begin Bitbucket tool registration in 003-repository-management
3. Implement testing framework in 004-basic-testing-framework