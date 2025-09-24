/**
 * Unit Tests for Connection Manager
 * 
 * Tests the connection management functionality including:
 * - Session creation and authentication
 * - Graceful disconnection
 * - Timeout handling
 * - Health checks and cleanup
 * - Statistics tracking
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ConnectionManager, createConnectionManager, ConnectionStats } from '../../src/server/connection-manager';
import { MCPServerLogger, createLoggerFromConfig } from '../../src/server/logger';
import { 
  ServerConfig, 
  Transport, 
  TransportType, 
  ClientSessionState,
  MCPErrorCode 
} from '../../src/types/index';

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  let mockConfig: ServerConfig;
  let mockLogger: MCPServerLogger;
  let mockTransport: Transport;

  beforeEach(() => {
    mockConfig = {
      name: 'TestServer',
      version: '1.0.0',
      maxClients: 10,
      clientTimeout: 60000,
      memoryLimit: 512 * 1024 * 1024,
      logging: {
        level: 'debug',
        console: true,
        file: undefined
      },
      transports: [],
      tools: { autoRegister: true, selectiveLoading: true, validationEnabled: true }
    };

    mockLogger = createLoggerFromConfig(mockConfig);
    
    mockTransport = {
      type: 'stdio' as TransportType,
      config: { type: 'stdio' as TransportType },
      isConnected: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      receive: jest.fn(),
      isHealthy: jest.fn().mockReturnValue(true),
      getStats: jest.fn().mockReturnValue({
        messagesSent: 0,
        messagesReceived: 0,
        bytesSent: 0,
        bytesReceived: 0,
        averageResponseTime: 0,
        uptime: 0,
        lastActivity: new Date()
      })
    } as any;

    connectionManager = createConnectionManager(mockConfig, mockLogger);
  });

  afterEach(async () => {
    await connectionManager.shutdown();
    await mockLogger.close();
  });

  describe('Session Creation', () => {
    test('should create a new session successfully', async () => {
      const clientId = 'test-client-1';
      const session = await connectionManager.createSession(clientId, mockTransport);

      expect(session).toBeDefined();
      expect(session.id).toMatch(/^session_test-client-1_\d+_[a-z0-9]+$/);
      expect(session.clientId).toBe(clientId);
      expect(session.state).toBe(ClientSessionState.CONNECTING);
      expect(session.transport).toBe(mockTransport);
      expect(session.isActive()).toBe(false);
      expect(session.isExpired()).toBe(false);
    });

    test('should throw error when max connections exceeded', async () => {
      // Create sessions up to the limit
      for (let i = 0; i < mockConfig.maxClients!; i++) {
        await connectionManager.createSession(`client-${i}`, mockTransport);
      }

      // Try to create one more session
      await expect(
        connectionManager.createSession('excess-client', mockTransport)
      ).rejects.toThrow();
    });

    test('should throw error when server is shutting down', async () => {
      await connectionManager.shutdown();
      
      await expect(
        connectionManager.createSession('test-client', mockTransport)
      ).rejects.toThrow('Server is shutting down');
    });

    test('should emit connection:created event', async () => {
      const eventSpy = jest.fn();
      connectionManager.on('connection:created', eventSpy);

      const session = await connectionManager.createSession('test-client', mockTransport);
      
      expect(eventSpy).toHaveBeenCalledWith(session);
    });
  });

  describe('Session Authentication', () => {
    test('should authenticate session successfully', async () => {
      const session = await connectionManager.createSession('test-client', mockTransport);
      
      await connectionManager.authenticateSession(session.id);
      
      expect(session.state).toBe(ClientSessionState.AUTHENTICATED);
      expect(session.isActive()).toBe(true);
    });

    test('should throw error for non-existent session', async () => {
      await expect(
        connectionManager.authenticateSession('non-existent-session')
      ).rejects.toThrow('Session non-existent-session not found');
    });

    test('should throw error for session not in connecting state', async () => {
      const session = await connectionManager.createSession('test-client', mockTransport);
      await connectionManager.authenticateSession(session.id);
      
      await expect(
        connectionManager.authenticateSession(session.id)
      ).rejects.toThrow('is not in connecting state');
    });

    test('should emit connection:authenticated event', async () => {
      const eventSpy = jest.fn();
      connectionManager.on('connection:authenticated', eventSpy);

      const session = await connectionManager.createSession('test-client', mockTransport);
      await connectionManager.authenticateSession(session.id);
      
      expect(eventSpy).toHaveBeenCalledWith(session);
    });
  });

  describe('Session Disconnection', () => {
    test('should disconnect session gracefully', async () => {
      const session = await connectionManager.createSession('test-client', mockTransport);
      await connectionManager.authenticateSession(session.id);
      
      await connectionManager.disconnectSession(session.id, 'test_reason');
      
      expect(session.state).toBe(ClientSessionState.DISCONNECTED);
      expect(connectionManager.getSession(session.id)).toBeUndefined();
    });

    test('should handle disconnection of non-existent session', async () => {
      // Should not throw error
      await expect(
        connectionManager.disconnectSession('non-existent-session', 'test_reason')
      ).resolves.not.toThrow();
    });

    test('should emit connection:disconnected event', async () => {
      const eventSpy = jest.fn();
      connectionManager.on('connection:disconnected', eventSpy);

      const session = await connectionManager.createSession('test-client', mockTransport);
      await connectionManager.authenticateSession(session.id);
      await connectionManager.disconnectSession(session.id, 'test_reason');
      
      expect(eventSpy).toHaveBeenCalledWith(session, 'test_reason');
    });

    test('should clean up transport resources on disconnection', async () => {
      const session = await connectionManager.createSession('test-client', mockTransport);
      await connectionManager.authenticateSession(session.id);
      
      await connectionManager.disconnectSession(session.id, 'test_reason');
      
      expect(mockTransport.disconnect).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    test('should get session by ID', async () => {
      const session = await connectionManager.createSession('test-client', mockTransport);
      
      const retrievedSession = connectionManager.getSession(session.id);
      expect(retrievedSession).toBe(session);
    });

    test('should get all active sessions', async () => {
      const session1 = await connectionManager.createSession('client-1', mockTransport);
      const session2 = await connectionManager.createSession('client-2', mockTransport);
      
      await connectionManager.authenticateSession(session1.id);
      await connectionManager.authenticateSession(session2.id);
      
      const activeSessions = connectionManager.getActiveSessions();
      expect(activeSessions).toHaveLength(2);
      expect(activeSessions).toContain(session1);
      expect(activeSessions).toContain(session2);
    });

    test('should not include inactive sessions in active list', async () => {
      const session = await connectionManager.createSession('test-client', mockTransport);
      // Don't authenticate, so session remains inactive
      
      const activeSessions = connectionManager.getActiveSessions();
      expect(activeSessions).toHaveLength(0);
    });
  });

  describe('Session Timeout and Expiration', () => {
    test('should detect expired session', async () => {
      const session = await connectionManager.createSession('test-client', mockTransport);
      
      // Manually set lastActivity to past time
      session.lastActivity = new Date(Date.now() - 70000); // 70 seconds ago
      
      expect(session.isExpired()).toBe(true);
    });

    test('should not detect non-expired session', async () => {
      const session = await connectionManager.createSession('test-client', mockTransport);
      
      expect(session.isExpired()).toBe(false);
    });

    test('should perform health check and disconnect expired sessions', async () => {
      const session = await connectionManager.createSession('test-client', mockTransport);
      await connectionManager.authenticateSession(session.id);
      
      // Manually set lastActivity to past time
      session.lastActivity = new Date(Date.now() - 70000); // 70 seconds ago
      
      const eventSpy = jest.fn();
      connectionManager.on('session:expired', eventSpy);
      
      await connectionManager.performHealthCheck();
      
      expect(eventSpy).toHaveBeenCalledWith(session);
      expect(connectionManager.getSession(session.id)).toBeUndefined();
    });
  });

  describe('Statistics', () => {
    test('should track connection statistics', async () => {
      const session1 = await connectionManager.createSession('client-1', mockTransport);
      const session2 = await connectionManager.createSession('client-2', mockTransport);
      
      await connectionManager.authenticateSession(session1.id);
      await connectionManager.authenticateSession(session2.id);
      
      const stats = connectionManager.getStats();
      
      expect(stats.activeConnections).toBe(2);
      expect(stats.totalConnections).toBe(2);
      expect(stats.connectionsByTransport.stdio).toBe(2);
      expect(stats.connectionsByTransport.http).toBe(0);
      expect(stats.connectionsByTransport.sse).toBe(0);
    });

    test('should update statistics after disconnection', async () => {
      const session = await connectionManager.createSession('test-client', mockTransport);
      await connectionManager.authenticateSession(session.id);
      
      let stats = connectionManager.getStats();
      expect(stats.activeConnections).toBe(1);
      expect(stats.totalConnections).toBe(1);
      
      await connectionManager.disconnectSession(session.id, 'test_reason');
      
      stats = connectionManager.getStats();
      expect(stats.activeConnections).toBe(0);
      expect(stats.totalConnections).toBe(1);
      expect(stats.totalDisconnections).toBe(1);
    });
  });

  describe('Cleanup', () => {
    test('should clean up expired sessions', async () => {
      const session1 = await connectionManager.createSession('client-1', mockTransport);
      const session2 = await connectionManager.createSession('client-2', mockTransport);
      
      await connectionManager.authenticateSession(session1.id);
      await connectionManager.authenticateSession(session2.id);
      
      // Make session1 expired
      session1.lastActivity = new Date(Date.now() - 70000);
      
      const eventSpy = jest.fn();
      connectionManager.on('cleanup:completed', eventSpy);
      
      const cleanedCount = await connectionManager.cleanup();
      
      expect(cleanedCount).toBe(1);
      expect(eventSpy).toHaveBeenCalledWith(1);
      expect(connectionManager.getSession(session1.id)).toBeUndefined();
      expect(connectionManager.getSession(session2.id)).toBeDefined();
    });

    test('should emit cleanup events', async () => {
      const startedSpy = jest.fn();
      const completedSpy = jest.fn();
      
      connectionManager.on('cleanup:started', startedSpy);
      connectionManager.on('cleanup:completed', completedSpy);
      
      await connectionManager.cleanup();
      
      expect(startedSpy).toHaveBeenCalled();
      expect(completedSpy).toHaveBeenCalledWith(0); // No sessions to clean up
    });
  });

  describe('Graceful Shutdown', () => {
    test('should shutdown gracefully', async () => {
      const session1 = await connectionManager.createSession('client-1', mockTransport);
      const session2 = await connectionManager.createSession('client-2', mockTransport);
      
      await connectionManager.authenticateSession(session1.id);
      await connectionManager.authenticateSession(session2.id);
      
      const eventSpy = jest.fn();
      connectionManager.on('connection:disconnected', eventSpy);
      
      await connectionManager.shutdown();
      
      expect(eventSpy).toHaveBeenCalledTimes(2);
      expect(connectionManager.getActiveSessions()).toHaveLength(0);
    });

    test('should not create new sessions after shutdown', async () => {
      await connectionManager.shutdown();
      
      await expect(
        connectionManager.createSession('test-client', mockTransport)
      ).rejects.toThrow('Server is shutting down');
    });

    test('should handle shutdown timeout', async () => {
      const session = await connectionManager.createSession('test-client', mockTransport);
      await connectionManager.authenticateSession(session.id);
      
      // Should shutdown gracefully
      await expect(connectionManager.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Event Handling', () => {
    test('should emit connection events', async () => {
      const createdSpy = jest.fn();
      const authenticatedSpy = jest.fn();
      const disconnectedSpy = jest.fn();
      
      connectionManager.on('connection:created', createdSpy);
      connectionManager.on('connection:authenticated', authenticatedSpy);
      connectionManager.on('connection:disconnected', disconnectedSpy);
      
      const session = await connectionManager.createSession('test-client', mockTransport);
      await connectionManager.authenticateSession(session.id);
      await connectionManager.disconnectSession(session.id, 'test_reason');
      
      expect(createdSpy).toHaveBeenCalledWith(session);
      expect(authenticatedSpy).toHaveBeenCalledWith(session);
      expect(disconnectedSpy).toHaveBeenCalledWith(session, 'test_reason');
    });
  });
});
