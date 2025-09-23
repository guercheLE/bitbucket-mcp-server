/**
 * Authentication Security Tests
 * 
 * Tests for the advanced security implementations in the authentication system.
 * This includes tests for encryption, audit logging, rate limiting, and security headers.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AdvancedCryptoService, EncryptedData } from '../../src/server/auth/advanced-crypto';
import { AuthAuditLogger, AuditEventType, AuditSeverity } from '../../src/server/auth/auth-audit-logger';
import { RateLimiter, RateLimitAlgorithm, RateLimitScope } from '../../src/server/auth/rate-limiter';
import { SecurityHeadersManager, SecurityHeaderType } from '../../src/server/auth/security-headers';
import { MemoryTokenStorage } from '../../src/server/auth/token-storage';
import { AccessToken, RefreshToken, AuthenticationConfig } from '../../src/types/auth';

describe('Authentication Security', () => {
  let cryptoService: AdvancedCryptoService;
  let auditLogger: AuthAuditLogger;
  let rateLimiter: RateLimiter;
  let securityHeaders: SecurityHeadersManager;
  let tokenStorage: MemoryTokenStorage;

  beforeEach(() => {
    cryptoService = new AdvancedCryptoService({
      algorithm: 'aes-256-gcm',
      kdf: 'pbkdf2',
      pbkdf2Iterations: 1000, // Reduced for testing
      memoryProtection: true,
      forwardSecrecy: true
    });

    auditLogger = new AuthAuditLogger({
      enabled: true,
      logLevel: AuditSeverity.LOW,
      maxMemoryEntries: 1000,
      retentionDays: 1,
      realTimeAlerts: false,
      performanceMetrics: true
    });

    rateLimiter = new RateLimiter();
    securityHeaders = new SecurityHeadersManager();
    
    const authConfig: AuthenticationConfig = {
      defaultApplication: {
        name: 'Test App',
        description: 'Test Application',
        scopes: ['read:repository']
      },
      tokens: {
        accessTokenLifetime: 3600000,
        refreshTokenLifetime: 2592000000,
        refreshThreshold: 300000
      },
      sessions: {
        maxConcurrentSessions: 10,
        sessionTimeout: 86400000,
        activityTimeout: 1800000
      },
      security: {
        encryptTokens: true,
        requireHttps: true,
        csrfProtection: true,
        rateLimitRequests: true
      },
      storage: {
        type: 'memory',
        encryptionKey: 'test-encryption-key'
      },
      logging: {
        logAuthEvents: true,
        logTokenUsage: true,
        logSecurityEvents: true
      }
    };

    tokenStorage = new MemoryTokenStorage(authConfig);
  });

  afterEach(() => {
    cryptoService.destroy();
    auditLogger.destroy();
    rateLimiter.destroy();
    tokenStorage.destroy();
  });

  describe('Advanced Crypto Service', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const testData = 'sensitive authentication data';
      
      const encrypted = await cryptoService.encrypt(testData);
      expect(encrypted.data).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.integrity).toBeDefined();
      
      const decrypted = await cryptoService.decrypt(encrypted);
      expect(decrypted).toBe(testData);
    });

    it('should encrypt and decrypt tokens correctly', async () => {
      const testToken: AccessToken = {
        token: 'test-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['read:repository'],
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };
      
      const encrypted = await cryptoService.encryptToken(testToken);
      expect(encrypted.data).toBeDefined();
      
      const decrypted = await cryptoService.decryptToken<AccessToken>(encrypted);
      expect(decrypted.token).toBe(testToken.token);
      expect(decrypted.tokenType).toBe(testToken.tokenType);
      expect(decrypted.scope).toEqual(testToken.scope);
    });

    it('should generate secure tokens', () => {
      const token1 = cryptoService.generateSecureToken(32);
      const token2 = cryptoService.generateSecureToken(32);
      
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it('should generate secure passwords', () => {
      const password1 = cryptoService.generateSecurePassword(16);
      const password2 = cryptoService.generateSecurePassword(16);
      
      expect(password1).toHaveLength(16);
      expect(password2).toHaveLength(16);
      expect(password1).not.toBe(password2);
    });

    it('should create and verify HMACs', () => {
      const data = 'test data';
      const key = Buffer.from('test-key', 'utf8');
      
      const hmac = cryptoService.createHmac(data, key);
      expect(hmac).toBeDefined();
      
      const isValid = cryptoService.verifyHmac(data, key, hmac);
      expect(isValid).toBe(true);
      
      const isInvalid = cryptoService.verifyHmac('different data', key, hmac);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Audit Logger', () => {
    it('should log authentication events', async () => {
      const eventId = await auditLogger.logEvent(
        AuditEventType.AUTH_LOGIN_SUCCESS,
        'User successfully authenticated',
        { userId: 'test-user' },
        AuditSeverity.LOW,
        { userId: 'test-user', sessionId: 'test-session' }
      );
      
      expect(eventId).toBeDefined();
      
      const events = auditLogger.getEvents({ userId: 'test-user' });
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(AuditEventType.AUTH_LOGIN_SUCCESS);
    });

    it('should log authentication failures', async () => {
      const eventId = await auditLogger.logAuthFailure(
        'test-user',
        {
          code: 'invalid_credentials' as any,
          message: 'Invalid credentials',
          timestamp: new Date(),
          isRecoverable: true
        },
        { sourceIp: '192.168.1.1' }
      );
      
      expect(eventId).toBeDefined();
      
      const events = auditLogger.getEvents({ userId: 'test-user' });
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(AuditEventType.AUTH_LOGIN_FAILURE);
    });

    it('should generate compliance reports', async () => {
      // Log some test events
      await auditLogger.logEvent(AuditEventType.AUTH_LOGIN_SUCCESS, 'Test success');
      await auditLogger.logEvent(AuditEventType.AUTH_LOGIN_FAILURE, 'Test failure');
      await auditLogger.logEvent(AuditEventType.SECURITY_VIOLATION, 'Test violation');
      
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();
      
      const report = auditLogger.generateComplianceReport(startDate, endDate);
      
      expect(report.totalEvents).toBeGreaterThan(0);
      expect(report.securityViolations).toBeGreaterThan(0);
      expect(report.failedAuthAttempts).toBeGreaterThan(0);
    });

    it('should provide statistics', () => {
      const stats = auditLogger.getStats();
      
      expect(stats.totalEvents).toBeDefined();
      expect(stats.eventsByType).toBeDefined();
      expect(stats.eventsBySeverity).toBeDefined();
      expect(stats.securityViolations).toBeDefined();
      expect(stats.failedAuthAttempts).toBeDefined();
    });
  });

  describe('Rate Limiter', () => {
    it('should allow requests within limits', async () => {
      const result = await rateLimiter.checkRateLimit('test-identifier', {
        sourceIp: '192.168.1.1'
      });
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.ruleId).toBeDefined();
    });

    it('should block requests exceeding limits', async () => {
      const identifier = 'test-identifier-blocked';
      
      // Make multiple requests to exceed rate limit
      for (let i = 0; i < 20; i++) {
        await rateLimiter.checkRateLimit(identifier, {
          sourceIp: '192.168.1.1'
        });
      }
      
      const result = await rateLimiter.checkRateLimit(identifier, {
        sourceIp: '192.168.1.1'
      });
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should provide statistics', () => {
      const stats = rateLimiter.getStats();
      
      expect(stats.totalRequests).toBeDefined();
      expect(stats.allowedRequests).toBeDefined();
      expect(stats.blockedRequests).toBeDefined();
      expect(stats.activeRules).toBeGreaterThan(0);
    });

    it('should manage blocked identifiers', () => {
      const identifier = 'test-blocked-identifier';
      
      rateLimiter.blockIdentifier(identifier, 60000); // Block for 1 minute
      
      const blocked = rateLimiter.getBlockedIdentifiers();
      expect(blocked.some(b => b.identifier === identifier)).toBe(true);
      
      rateLimiter.unblockIdentifier(identifier);
      
      const unblocked = rateLimiter.getBlockedIdentifiers();
      expect(unblocked.some(b => b.identifier === identifier)).toBe(false);
    });
  });

  describe('Security Headers', () => {
    it('should generate security headers', () => {
      const headers = securityHeaders.generateSecurityHeaders({
        isHttps: true,
        origin: 'https://example.com'
      });
      
      expect(headers[SecurityHeaderType.X_CONTENT_TYPE_OPTIONS]).toBe('nosniff');
      expect(headers[SecurityHeaderType.X_FRAME_OPTIONS]).toBe('DENY');
      expect(headers[SecurityHeaderType.X_XSS_PROTECTION]).toBeDefined();
      expect(headers[SecurityHeaderType.REFERRER_POLICY]).toBeDefined();
    });

    it('should generate CORS headers', () => {
      const corsHeaders = securityHeaders.generateCorsHeaders({
        origin: 'https://example.com',
        method: 'GET'
      });
      
      expect(corsHeaders['Access-Control-Allow-Origin']).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Credentials']).toBeDefined();
    });

    it('should handle preflight requests', () => {
      const corsHeaders = securityHeaders.generateCorsHeaders({
        origin: 'https://example.com',
        method: 'OPTIONS',
        headers: ['Content-Type', 'Authorization']
      });
      
      expect(corsHeaders['Access-Control-Allow-Methods']).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Headers']).toBeDefined();
      expect(corsHeaders['Access-Control-Max-Age']).toBeDefined();
    });

    it('should validate headers', () => {
      const headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'self'"
      };
      
      const validation = securityHeaders.validateHeaders(headers);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Token Storage with Encryption', () => {
    it('should store and retrieve encrypted tokens', async () => {
      const accessToken: AccessToken = {
        token: 'test-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['read:repository'],
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };
      
      await tokenStorage.storeAccessToken(accessToken, 'test-user');
      
      const retrieved = await tokenStorage.getAccessToken(accessToken.token);
      expect(retrieved).toBeDefined();
      expect(retrieved?.token).toBe(accessToken.token);
      expect(retrieved?.tokenType).toBe(accessToken.tokenType);
    });

    it('should store and retrieve encrypted refresh tokens', async () => {
      const refreshToken: RefreshToken = {
        id: 'test-refresh-token-id',
        token: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 2592000000),
        applicationId: 'test-app',
        userId: 'test-user',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };
      
      await tokenStorage.storeRefreshToken(refreshToken);
      
      const retrieved = await tokenStorage.getRefreshToken(refreshToken.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(refreshToken.id);
      expect(retrieved?.token).toBe(refreshToken.token);
    });

    it('should clean up expired tokens', async () => {
      const expiredToken: AccessToken = {
        token: 'expired-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() - 1000), // Expired
        scope: ['read:repository'],
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };
      
      await tokenStorage.storeAccessToken(expiredToken, 'test-user');
      
      const cleanedCount = await tokenStorage.cleanupExpiredTokens();
      expect(cleanedCount).toBeGreaterThan(0);
      
      const retrieved = await tokenStorage.getAccessToken(expiredToken.token);
      expect(retrieved).toBeNull();
    });

    it('should provide storage statistics', () => {
      const stats = tokenStorage.getStats();
      
      expect(stats.accessTokenCount).toBeDefined();
      expect(stats.refreshTokenCount).toBeDefined();
      expect(stats.storageSize).toBeDefined();
      expect(stats.lastCleanup).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should work together for secure authentication flow', async () => {
      // 1. Generate secure token
      const secureToken = cryptoService.generateSecureToken(32);
      
      // 2. Create access token
      const accessToken: AccessToken = {
        token: secureToken,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['read:repository'],
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };
      
      // 3. Store encrypted token
      await tokenStorage.storeAccessToken(accessToken, 'test-user');
      
      // 4. Check rate limit
      const rateLimitResult = await rateLimiter.checkRateLimit('test-user', {
        userId: 'test-user',
        sourceIp: '192.168.1.1'
      });
      expect(rateLimitResult.allowed).toBe(true);
      
      // 5. Log authentication success
      const eventId = await auditLogger.logAuthSuccess(
        'test-user',
        'test-session',
        { sourceIp: '192.168.1.1' }
      );
      expect(eventId).toBeDefined();
      
      // 6. Generate security headers
      const headers = securityHeaders.generateSecurityHeaders({
        isHttps: true,
        origin: 'https://example.com'
      });
      expect(headers[SecurityHeaderType.X_CONTENT_TYPE_OPTIONS]).toBe('nosniff');
      
      // 7. Retrieve and validate token
      const retrieved = await tokenStorage.getAccessToken(secureToken);
      expect(retrieved).toBeDefined();
      expect(retrieved?.token).toBe(secureToken);
    });
  });
});
