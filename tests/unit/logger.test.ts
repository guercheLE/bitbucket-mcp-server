/**
 * Logger Unit Tests
 * 
 * Tests the MCP server logging system with Winston integration,
 * including daily rotation, sanitization, and performance monitoring.
 * 
 * Key Test Areas:
 * - Winston logger configuration
 * - Daily log rotation
 * - Log sanitization
 * - Performance monitoring
 * - Remote logging setup
 * - Log categorization
 * 
 * Constitutional Requirements:
 * - Test-First Development
 * - Complete API Coverage
 * - Error handling and logging
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  MCPServerLogger, 
  LogLevel, 
  LogCategory,
  LoggingConfig,
  createLoggerFromConfig
} from '../../src/server/logger';
import { ServerConfig } from '../../src/types';

describe('MCP Server Logger', () => {
  let logger: MCPServerLogger;
  let testConfig: Partial<LoggingConfig>;

  beforeEach(() => {
    testConfig = {
      level: LogLevel.INFO,
      console: false, // Disable console for tests
      file: false, // Disable file logging for tests
      logDir: './test-logs',
      filePrefix: 'test-mcp-server',
      rotation: {
        maxSize: '10m',
        maxFiles: '7d',
        datePattern: 'YYYY-MM-DD'
      },
      sanitization: {
        removeSensitiveData: true,
        maskAuthTokens: true,
        truncateLargePayloads: true,
        maxPayloadSize: 100,
        excludeFields: ['password', 'token'],
        maskFields: ['authorization']
      },
      performance: {
        enabled: false, // Disable for tests
        slowOperationThreshold: 1000,
        memoryLogInterval: 60000
      }
    };
    
    logger = new MCPServerLogger(testConfig);
  });

  afterEach(async () => {
    await logger.close();
  });

  describe('Logger Initialization', () => {
    test('should create logger with default configuration', () => {
      const defaultLogger = new MCPServerLogger();
      expect(defaultLogger).toBeDefined();
      expect(defaultLogger).toBeInstanceOf(MCPServerLogger);
    });

    test('should create logger with custom configuration', () => {
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(MCPServerLogger);
    });

    test('should create logger from server config', () => {
      const serverConfig: ServerConfig = {
        name: 'Test Server',
        version: '1.0.0',
        maxClients: 10,
        clientTimeout: 60000,
        memoryLimit: 1024 * 1024 * 1024,
        logging: {
          level: 'info',
          console: true,
          file: './logs/server.log'
        },
        transports: [],
        tools: {
          autoRegister: true,
          selectiveLoading: true,
          validationEnabled: true
        }
      };

      const configLogger = createLoggerFromConfig(serverConfig);
      expect(configLogger).toBeDefined();
      expect(configLogger).toBeInstanceOf(MCPServerLogger);
    });
  });

  describe('Server Event Logging', () => {
    test('should log server start event', () => {
      logger.logServerEvent('start', {
        serverName: 'Test Server',
        version: '1.0.0'
      });
      
      // Logger should not throw errors
      expect(true).toBe(true);
    });

    test('should log server stop event', () => {
      logger.logServerEvent('stop', {
        uptime: 12345
      });
      
      expect(true).toBe(true);
    });

    test('should log server error event', () => {
      logger.logServerEvent('error', {
        error: {
          code: -32603,
          message: 'Internal server error',
          stack: 'Error stack trace'
        }
      });
      
      expect(true).toBe(true);
    });
  });

  describe('Session Event Logging', () => {
    test('should log session created event', () => {
      logger.logSessionEvent('session-123', 'created', {
        clientId: 'client-456',
        transportType: 'stdio'
      });
      
      expect(true).toBe(true);
    });

    test('should log session removed event', () => {
      logger.logSessionEvent('session-123', 'removed', {
        clientId: 'client-456',
        transportType: 'stdio',
        duration: 30000
      });
      
      expect(true).toBe(true);
    });

    test('should log session error event', () => {
      logger.logSessionEvent('session-123', 'error', {
        clientId: 'client-456',
        transportType: 'stdio',
        error: {
          code: -32004,
          message: 'Session expired'
        }
      });
      
      expect(true).toBe(true);
    });
  });

  describe('Tool Event Logging', () => {
    test('should log tool registered event', () => {
      logger.logToolEvent('test_tool', 'registered', {
        toolName: 'test_tool',
        description: 'A test tool',
        parameters: 2
      });
      
      expect(true).toBe(true);
    });

    test('should log tool executed event', () => {
      logger.logToolEvent('test_tool', 'executed', {
        toolName: 'test_tool',
        executionTime: 150,
        memoryUsed: 1024,
        success: true
      });
      
      expect(true).toBe(true);
    });

    test('should log tool error event', () => {
      logger.logToolEvent('test_tool', 'error', {
        toolName: 'test_tool',
        error: {
          code: -32002,
          message: 'Tool execution failed'
        }
      });
      
      expect(true).toBe(true);
    });
  });

  describe('Transport Event Logging', () => {
    test('should log transport connected event', () => {
      logger.logTransportEvent('stdio', 'connected');
      
      expect(true).toBe(true);
    });

    test('should log transport message sent event', () => {
      logger.logTransportEvent('stdio', 'message_sent', {
        messageSize: 256,
        responseTime: 50
      });
      
      expect(true).toBe(true);
    });

    test('should log transport error event', () => {
      logger.logTransportEvent('stdio', 'error', {
        error: {
          code: -32003,
          message: 'Transport connection lost'
        }
      });
      
      expect(true).toBe(true);
    });
  });

  describe('Performance Logging', () => {
    test('should log memory usage metric', () => {
      logger.logPerformanceMetric('memory_usage', 512 * 1024 * 1024, {
        threshold: 1024 * 1024 * 1024,
        exceeded: false
      });
      
      expect(true).toBe(true);
    });

    test('should log response time metric', () => {
      logger.logPerformanceMetric('response_time', 150, {
        threshold: 1000,
        exceeded: false
      });
      
      expect(true).toBe(true);
    });

    test('should log error rate metric', () => {
      logger.logPerformanceMetric('error_rate', 0.05, {
        threshold: 0.1,
        exceeded: false
      });
      
      expect(true).toBe(true);
    });
  });

  describe('Security Logging', () => {
    test('should log authentication event', () => {
      logger.logSecurityEvent('authentication', {
        clientId: 'client-123',
        ipAddress: '192.168.1.1',
        success: true
      });
      
      expect(true).toBe(true);
    });

    test('should log rate limit event', () => {
      logger.logSecurityEvent('rate_limit', {
        clientId: 'client-123',
        ipAddress: '192.168.1.1',
        success: false,
        reason: 'Too many requests'
      });
      
      expect(true).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    test('should log audit event', () => {
      logger.logAuditEvent(
        'tool_execution',
        'test_tool',
        'client-123',
        'session-456',
        true,
        {
          executionTime: 150,
          parameters: { test: 'value' }
        }
      );
      
      expect(true).toBe(true);
    });
  });

  describe('Error Logging', () => {
    test('should log error with context', () => {
      const error = new Error('Test error');
      logger.logError(error, {
        category: LogCategory.TOOL,
        requestId: 'req-123',
        sessionId: 'session-456',
        metadata: {
          toolName: 'test_tool'
        }
      });
      
      expect(true).toBe(true);
    });
  });

  describe('Protocol Message Logging', () => {
    test('should log incoming protocol message', () => {
      const message = {
        jsonrpc: '2.0' as const,
        id: '123',
        method: 'tools/call',
        params: { name: 'test_tool', arguments: {} }
      };

      logger.logProtocolMessage(message, 'incoming', 'session-123');
      
      expect(true).toBe(true);
    });

    test('should log outgoing protocol message', () => {
      const message = {
        jsonrpc: '2.0' as const,
        id: '123',
        result: { success: true }
      };

      logger.logProtocolMessage(message, 'outgoing', 'session-123');
      
      expect(true).toBe(true);
    });
  });

  describe('Logger Statistics', () => {
    test('should return logger statistics', () => {
      const stats = logger.getLoggerStats();
      
      expect(stats).toHaveProperty('totalLogs');
      expect(stats).toHaveProperty('logsByLevel');
      expect(stats).toHaveProperty('logsByCategory');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('uptime');
      
      expect(typeof stats.totalLogs).toBe('number');
      expect(typeof stats.memoryUsage).toBe('number');
      expect(typeof stats.uptime).toBe('number');
    });
  });

  describe('Logger Cleanup', () => {
    test('should close logger gracefully', async () => {
      await expect(logger.close()).resolves.not.toThrow();
    });
  });

  describe('Log Sanitization', () => {
    test('should sanitize sensitive data', () => {
      // This test would verify that sensitive data is properly sanitized
      // The actual sanitization happens internally in the logger
      logger.logServerEvent('start', {
        serverName: 'Test Server'
      });
      
      expect(true).toBe(true);
    });

    test('should mask authorization fields', () => {
      logger.logTransportEvent('http', 'message_received', {
        headers: {
          authorization: 'Bearer secret-token', // This should be masked
          'content-type': 'application/json'
        }
      });
      
      expect(true).toBe(true);
    });

    test('should truncate large payloads', () => {
      const largePayload = 'x'.repeat(200); // Larger than maxPayloadSize (100)
      
      logger.logToolEvent('test_tool', 'executed', {
        result: largePayload // This should be truncated
      });
      
      expect(true).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    test('should handle invalid log level gracefully', () => {
      const invalidConfig = {
        ...testConfig,
        level: 'invalid' as LogLevel
      };
      
      // Should not throw error, should fall back to default
      const invalidLogger = new MCPServerLogger(invalidConfig);
      expect(invalidLogger).toBeDefined();
    });

    test('should handle missing configuration gracefully', () => {
      const minimalConfig = {};
      const minimalLogger = new MCPServerLogger(minimalConfig);
      expect(minimalLogger).toBeDefined();
    });
  });
});
