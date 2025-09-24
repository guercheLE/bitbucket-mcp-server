/**
 * MCP Protocol Compliance Test
 * 
 * This test validates that our MCP server implementation follows the
 * Model Context Protocol specification correctly.
 * 
 * Tests include:
 * - Protocol initialization handshake
 * - Tool discovery and execution
 * - Error handling according to JSON-RPC 2.0
 * - Message format validation
 * - Transport layer compliance
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import { createWriteStream, createReadStream } from 'fs';
import { join } from 'path';

describe('MCP Protocol Compliance', () => {
  let serverProcess: ChildProcess | null = null;
  let serverInput: NodeJS.WritableStream | null = null;
  let serverOutput: NodeJS.ReadableStream | null = null;

  beforeAll(async () => {
    // Start the MCP server
    serverProcess = spawn('node', ['dist/server/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    serverInput = serverProcess.stdin!;
    serverOutput = serverProcess.stdout!;

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  test('should handle protocol initialization correctly', async () => {
    const initRequest = {
      jsonrpc: '2.0',
      id: '1',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };

    const response = await sendRequest(initRequest);
    
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('id', '1');
    expect(response).toHaveProperty('result');
    expect(response.result).toHaveProperty('protocolVersion', '2024-11-05');
    expect(response.result).toHaveProperty('capabilities');
    expect(response.result).toHaveProperty('serverInfo');
  });

  test('should handle tools/list request correctly', async () => {
    const toolsListRequest = {
      jsonrpc: '2.0',
      id: '2',
      method: 'tools/list',
      params: {}
    };

    const response = await sendRequest(toolsListRequest);
    
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('id', '2');
    expect(response).toHaveProperty('result');
    expect(response.result).toHaveProperty('tools');
    expect(Array.isArray(response.result.tools)).toBe(true);
  });

  test('should handle ping request correctly', async () => {
    const pingRequest = {
      jsonrpc: '2.0',
      id: '3',
      method: 'ping',
      params: {}
    };

    const response = await sendRequest(pingRequest);
    
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('id', '3');
    expect(response).toHaveProperty('result');
  });

  test('should handle invalid method with proper error response', async () => {
    const invalidRequest = {
      jsonrpc: '2.0',
      id: '4',
      method: 'invalid_method',
      params: {}
    };

    const response = await sendRequest(invalidRequest);
    
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('id', '4');
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('code', -32601); // Method not found
    expect(response.error).toHaveProperty('message');
  });

  test('should handle malformed JSON with proper error response', async () => {
    const malformedRequest = 'invalid-json';
    
    const response = await sendRequest(malformedRequest);
    
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('code', -32700); // Parse error
    expect(response.error).toHaveProperty('message');
  });

  test('should handle invalid parameters with proper error response', async () => {
    const invalidParamsRequest = {
      jsonrpc: '2.0',
      id: '5',
      method: 'tools/list',
      params: {
        invalidParam: 'should not be here'
      }
    };

    const response = await sendRequest(invalidParamsRequest);
    
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('id', '5');
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('code', -32602); // Invalid params
    expect(response.error).toHaveProperty('message');
  });

  test('should maintain session state correctly', async () => {
    // First, initialize the session
    const initRequest = {
      jsonrpc: '2.0',
      id: '6',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    };

    const initResponse = await sendRequest(initRequest);
    expect(initResponse).toHaveProperty('result');

    // Then send initialized notification
    const initializedNotification = {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {}
    };

    // Notifications don't expect responses, but shouldn't cause errors
    await sendRequest(initializedNotification);

    // Now try to list tools - should work after initialization
    const toolsListRequest = {
      jsonrpc: '2.0',
      id: '7',
      method: 'tools/list',
      params: {}
    };

    const toolsResponse = await sendRequest(toolsListRequest);
    expect(toolsResponse).toHaveProperty('result');
    expect(toolsResponse.result).toHaveProperty('tools');
  });

  test('should handle concurrent requests correctly', async () => {
    const requests = [
      { jsonrpc: '2.0', id: '8', method: 'ping', params: {} },
      { jsonrpc: '2.0', id: '9', method: 'ping', params: {} },
      { jsonrpc: '2.0', id: '10', method: 'ping', params: {} }
    ];

    const responses = await Promise.all(
      requests.map(request => sendRequest(request))
    );

    responses.forEach((response, index) => {
      expect(response).toHaveProperty('jsonrpc', '2.0');
      expect(response).toHaveProperty('id', String(8 + index));
      expect(response).toHaveProperty('result');
    });
  });

  test('should validate message format according to JSON-RPC 2.0', async () => {
    const validRequest = {
      jsonrpc: '2.0',
      id: '11',
      method: 'ping',
      params: {}
    };

    const response = await sendRequest(validRequest);
    
    // Validate JSON-RPC 2.0 format
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('result');
    
    // Should not have both result and error
    expect(response).not.toHaveProperty('error');
  });

  test('should handle server capabilities correctly', async () => {
    const initRequest = {
      jsonrpc: '2.0',
      id: '12',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          logging: {}
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };

    const response = await sendRequest(initRequest);
    
    expect(response).toHaveProperty('result');
    expect(response.result).toHaveProperty('capabilities');
    expect(response.result.capabilities).toHaveProperty('tools');
    expect(response.result.capabilities).toHaveProperty('logging');
  });

  // Helper function to send requests to the server
  async function sendRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!serverInput || !serverOutput) {
        reject(new Error('Server not available'));
        return;
      }

      let responseData = '';
      
      const onData = (data: Buffer) => {
        responseData += data.toString();
        
        // Try to parse the response
        try {
          const response = JSON.parse(responseData.trim());
          serverOutput!.removeListener('data', onData);
          resolve(response);
        } catch (e) {
          // Continue accumulating data if JSON is incomplete
        }
      };

      serverOutput.on('data', onData);
      
      // Send the request
      serverInput.write(JSON.stringify(request) + '\n');
      
      // Timeout after 5 seconds
      setTimeout(() => {
        serverOutput!.removeListener('data', onData);
        reject(new Error('Request timeout'));
      }, 5000);
    });
  }
});
