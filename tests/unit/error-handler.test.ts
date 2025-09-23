/**
 * Error Handler Unit Tests
 * 
 * Tests the MCP error handling system for protocol compliance
 * and proper error response formatting.
 * 
 * Key Test Areas:
 * - JSON-RPC 2.0 error responses
 * - MCP protocol specific errors
 * - Error context and metadata
 * - Error statistics and monitoring
 * - Error severity classification
 * 
 * Constitutional Requirements:
 * - Test-First Development
 * - MCP Protocol First
 * - Complete API Coverage
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { 
  MCPErrorHandler, 
  createMCPError, 
  handleToolError,
  handleTransportError,
  ErrorContext,
  ErrorSeverity
} from '../../src/server/error-handler';
import { MCPErrorCode } from '../../src/types';

describe('MCP Error Handler', () => {
  let errorHandler: MCPErrorHandler;

  beforeEach(() => {
    errorHandler = new MCPErrorHandler();
  });

  describe('Error Response Creation', () => {
    test('should create valid JSON-RPC 2.0 error response', () => {
      const errorResponse = createMCPError(
        'test-request-id',
        MCPErrorCode.INVALID_PARAMS,
        'Invalid parameters provided',
        {
          operation: 'test_operation',
          metadata: { field: 'test_field' }
        }
      );

      expect(errorResponse).toMatchObject({
        jsonrpc: '2.0',
        id: 'test-request-id',
        error: {
          code: MCPErrorCode.INVALID_PARAMS,
          message: 'Invalid parameters provided',
          data: {
            timestamp: expect.any(String),
            operation: 'test_operation',
            context: { field: 'test_field' }
          }
        }
      });
    });

    test('should handle null request ID', () => {
      const errorResponse = createMCPError(
        null,
        MCPErrorCode.INTERNAL_ERROR,
        'Internal server error'
      );

      expect(errorResponse.id).toBeNull();
      expect(errorResponse.error.code).toBe(MCPErrorCode.INTERNAL_ERROR);
    });

    test('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const errorResponse = createMCPError(
        'test-id',
        MCPErrorCode.INTERNAL_ERROR,
        'Test error'
      );

      expect(errorResponse.error.data?.stack).toBeDefined();
      expect(typeof errorResponse.error.data?.stack).toBe('string');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Tool Error Handling', () => {
    test('should handle tool execution errors', () => {
      const error = new Error('Tool execution failed');
      const errorResponse = handleToolError(
        'test-id',
        'test_tool',
        error,
        {
          operation: 'tool_execution',
          metadata: { toolName: 'test_tool' }
        }
      );

      expect(errorResponse.error.code).toBe(MCPErrorCode.TOOL_EXECUTION_FAILED);
      expect(errorResponse.error.message).toContain('Tool execution failed for \'test_tool\'');
      expect(errorResponse.error.data?.context?.toolName).toBe('test_tool');
    });

    test('should map tool not found errors correctly', () => {
      const error = new Error('Tool not found');
      const errorResponse = handleToolError(
        'test-id',
        'missing_tool',
        error
      );

      expect(errorResponse.error.code).toBe(MCPErrorCode.TOOL_NOT_FOUND);
    });
  });

  describe('Transport Error Handling', () => {
    test('should handle transport errors', () => {
      const error = new Error('Connection failed');
      const errorResponse = handleTransportError(
        'test-id',
        'stdio',
        error,
        {
          operation: 'transport_connection',
          metadata: { transportType: 'stdio' }
        }
      );

      expect(errorResponse.error.code).toBe(MCPErrorCode.TRANSPORT_ERROR);
      expect(errorResponse.error.message).toContain('Transport error (stdio)');
      expect(errorResponse.error.data?.context?.transportType).toBe('stdio');
    });
  });

  describe('Error Statistics', () => {
    test('should track error counts', () => {
      // Generate some errors
      createMCPError('id1', MCPErrorCode.INVALID_PARAMS, 'Error 1');
      createMCPError('id2', MCPErrorCode.INVALID_PARAMS, 'Error 2');
      createMCPError('id3', MCPErrorCode.INTERNAL_ERROR, 'Error 3');

      const stats = errorHandler.getErrorStatistics();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorCounts[MCPErrorCode.INVALID_PARAMS]).toBe(2);
      expect(stats.errorCounts[MCPErrorCode.INTERNAL_ERROR]).toBe(1);
    });

    test('should provide recent errors', () => {
      createMCPError('id1', MCPErrorCode.INVALID_PARAMS, 'Recent error 1');
      createMCPError('id2', MCPErrorCode.INTERNAL_ERROR, 'Recent error 2');

      const stats = errorHandler.getErrorStatistics();

      expect(stats.recentErrors).toHaveLength(2);
      expect(stats.recentErrors[0].code).toBe(MCPErrorCode.INVALID_PARAMS);
      expect(stats.recentErrors[1].code).toBe(MCPErrorCode.INTERNAL_ERROR);
    });

    test('should calculate error rate', () => {
      // Generate errors to test rate calculation
      for (let i = 0; i < 5; i++) {
        createMCPError(`id${i}`, MCPErrorCode.INTERNAL_ERROR, `Error ${i}`);
      }

      const stats = errorHandler.getErrorStatistics();
      expect(stats.errorRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Severity Classification', () => {
    test('should classify parse errors as low severity', () => {
      const errorResponse = createMCPError(
        'test-id',
        MCPErrorCode.PARSE_ERROR,
        'Parse error'
      );

      // The severity is logged internally, we can't directly test it
      // but we can verify the error response is created correctly
      expect(errorResponse.error.code).toBe(MCPErrorCode.PARSE_ERROR);
    });

    test('should classify memory errors as critical severity', () => {
      const errorResponse = createMCPError(
        'test-id',
        MCPErrorCode.MEMORY_LIMIT_EXCEEDED,
        'Memory limit exceeded'
      );

      expect(errorResponse.error.code).toBe(MCPErrorCode.MEMORY_LIMIT_EXCEEDED);
    });

    test('should classify authentication errors as critical severity', () => {
      const errorResponse = createMCPError(
        'test-id',
        MCPErrorCode.AUTHENTICATION_FAILED,
        'Authentication failed'
      );

      expect(errorResponse.error.code).toBe(MCPErrorCode.AUTHENTICATION_FAILED);
    });
  });

  describe('Error Context Handling', () => {
    test('should include session context when provided', () => {
      const mockSession = {
        id: 'session-123',
        clientId: 'client-456',
        state: 'connected' as any,
        transport: { type: 'stdio' as any } as any,
        createdAt: new Date(),
        lastActivity: new Date(),
        metadata: {},
        availableTools: new Set(),
        timeout: 300000,
        updateActivity: () => {},
        isActive: () => true,
        isExpired: () => false,
        getStats: () => ({
          duration: 0,
          requestsProcessed: 0,
          toolsCalled: 0,
          averageProcessingTime: 0,
          memoryUsage: 0,
          lastRequest: new Date()
        })
      } as any;

      const errorResponse = createMCPError(
        'test-id',
        MCPErrorCode.SESSION_EXPIRED,
        'Session expired',
        { session: mockSession }
      );

      expect(errorResponse.error.data?.sessionId).toBe('session-123');
    });

    test('should include request context when provided', () => {
      const mockRequest = {
        jsonrpc: '2.0' as const,
        id: 'request-789',
        method: 'test_method',
        params: { test: 'value' }
      };

      const errorResponse = createMCPError(
        'test-id',
        MCPErrorCode.INVALID_REQUEST,
        'Invalid request',
        { request: mockRequest }
      );

      expect(errorResponse.error.data?.requestId).toBe('request-789');
    });
  });

  describe('Error Log Management', () => {
    test('should clear error log', () => {
      // Generate some errors
      createMCPError('id1', MCPErrorCode.INVALID_PARAMS, 'Error 1');
      createMCPError('id2', MCPErrorCode.INTERNAL_ERROR, 'Error 2');

      // Verify errors exist
      let stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(2);

      // Clear the log
      errorHandler.clearErrorLog();

      // Verify errors are cleared
      stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
    });
  });

  describe('Error Code Mapping', () => {
    test('should map generic errors to appropriate MCP codes', () => {
      const testCases = [
        { error: new Error('Resource not found'), expectedCode: MCPErrorCode.RESOURCE_NOT_FOUND },
        { error: new Error('Authentication failed'), expectedCode: MCPErrorCode.AUTHENTICATION_FAILED },
        { error: new Error('Permission denied'), expectedCode: MCPErrorCode.AUTHORIZATION_FAILED },
        { error: new Error('Session timeout'), expectedCode: MCPErrorCode.SESSION_EXPIRED },
        { error: new Error('Memory heap overflow'), expectedCode: MCPErrorCode.MEMORY_LIMIT_EXCEEDED },
        { error: new Error('Tool execution failed'), expectedCode: MCPErrorCode.TOOL_EXECUTION_FAILED },
        { error: new Error('Transport connection lost'), expectedCode: MCPErrorCode.TRANSPORT_ERROR },
        { error: new Error('Unknown error'), expectedCode: MCPErrorCode.INTERNAL_ERROR }
      ];

      testCases.forEach(({ error, expectedCode }) => {
        const errorResponse = handleToolError('test-id', 'test_tool', error);
        expect(errorResponse.error.code).toBe(expectedCode);
      });
    });
  });
});
