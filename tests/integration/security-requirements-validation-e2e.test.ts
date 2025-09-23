/**
 * Security Requirements Validation End-to-End Tests
 * 
 * This module implements end-to-end tests for security requirements validation
 * to ensure the complete authentication system meets all security requirements
 * specified in the Constitution.
 * 
 * Test Coverage:
 * - Complete security validation workflow
 * - Constitution compliance validation
 * - Real-world security scenario testing
 * - Performance and reliability validation
 * - Integration with all authentication components
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SecurityRequirementsValidator } from '../../src/server/auth/security-requirements-validator';
import { AdvancedCryptoService } from '../../src/server/auth/advanced-crypto';
import { AuthAuditLogger, AuditEventType, AuditSeverity } from '../../src/server/auth/auth-audit-logger';
import { RateLimiter, RateLimitAlgorithm, RateLimitScope } from '../../src/server/auth/rate-limiter';
import { SecurityHeadersManager, SecurityHeaderType } from '../../src/server/auth/security-headers';
import { MemoryTokenStorage } from '../../src/server/auth/token-storage';
import { SessionManager } from '../../src/server/auth/session-manager';
import { OAuthManager } from '../../src/server/auth/oauth-manager';
import { 
  AccessToken, 
  RefreshToken, 
  AuthenticationConfig, 
  OAuthApplication,
  UserSessionState
} from '../../src/types/auth';

describe('Security Requirements Validation E2E Tests', () => {
  let validator: SecurityRequirementsValidator;
  let cryptoService: AdvancedCryptoService;
  let auditLogger: AuthAuditLogger;
  let rateLimiter: RateLimiter;
  let securityHeaders: SecurityHeadersManager;
  let tokenStorage: MemoryTokenStorage;
  let sessionManager: SessionManager;
  let oauthManager: OAuthManager;
  let productionConfig: AuthenticationConfig;

  beforeEach(() => {
    // Production-like configuration for comprehensive testing
    productionConfig = {
      defaultApplication: {
        name: 'Bitbucket MCP Server',
        description: 'Bitbucket MCP Server Authentication',
        scopes: ['read:repository', 'write:repository', 'admin:project']
      },
      tokens: {
        accessTokenLifetime: 3600000, // 1 hour
        refreshTokenLifetime: 2592000000, // 30 days
        refreshThreshold: 300000 // 5 minutes
      },
      sessions: {
        maxConcurrentSessions: 10,
        sessionTimeout: 86400000, // 24 hours
        activityTimeout: 1800000 // 30 minutes
      },
      security: {
        encryptTokens: true,
        requireHttps: true,
        csrfProtection: true,
        rateLimitRequests: true
      },
      storage: {
        type: 'memory',
        encryptionKey: 'production-encryption-key-for-security-validation'
      },
      logging: {
        logAuthEvents: true,
        logTokenUsage: true,
        logSecurityEvents: true
      }
    };

    cryptoService = new AdvancedCryptoService({
      algorithm: 'aes-256-gcm',
      kdf: 'pbkdf2',
      pbkdf2Iterations: 100000, // Higher iterations for production
      memoryProtection: true,
      forwardSecrecy: true
    });

    auditLogger = new AuthAuditLogger({
      enabled: true,
      logLevel: AuditSeverity.LOW,
      maxMemoryEntries: 10000,
      retentionDays: 30,
      realTimeAlerts: true,
      performanceMetrics: true
    });

    rateLimiter = new RateLimiter();
    securityHeaders = new SecurityHeadersManager();
    tokenStorage = new MemoryTokenStorage(productionConfig);
    
    // Mock OAuthManager with production-like behavior
    oauthManager = {
      createApplication: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'prod-app',
          name: 'Production App',
          clientId: 'prod-client-123',
          clientSecret: 'prod-secret-123',
          redirectUri: 'https://prodapp.com/callback',
          instanceType: 'datacenter',
          baseUrl: 'https://prodapp.com',
          scopes: ['read:repository', 'write:repository'],
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        }
      }),
      getApplication: jest.fn(),
      updateApplication: jest.fn(),
      deleteApplication: jest.fn(),
      listApplications: jest.fn(),
      generateAuthorizationUrl: jest.fn(),
      exchangeCodeForToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      revokeToken: jest.fn(),
      validateToken: jest.fn(),
      getTokenInfo: jest.fn()
    } as any;

    sessionManager = new SessionManager(oauthManager, productionConfig);

    validator = new SecurityRequirementsValidator(
      cryptoService,
      auditLogger,
      rateLimiter,
      securityHeaders,
      tokenStorage,
      sessionManager,
      oauthManager,
      productionConfig
    );
  });

  afterEach(() => {
    cryptoService.destroy();
    auditLogger.destroy();
    rateLimiter.destroy();
    tokenStorage.destroy();
  });

  describe('Complete Security Validation Workflow', () => {
    it('should validate all security requirements end-to-end', async () => {
      const report = await validator.validateSecurityRequirements();

      // Validate report structure
      expect(report).toBeDefined();
      expect(report.overallStatus).toBeDefined();
      expect(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL_COMPLIANCE']).toContain(report.overallStatus);
      expect(report.totalRequirements).toBeGreaterThan(0);
      expect(report.passedRequirements).toBeGreaterThanOrEqual(0);
      expect(report.failedRequirements).toBeGreaterThanOrEqual(0);
      expect(report.warningRequirements).toBeGreaterThanOrEqual(0);
      expect(report.criticalFailures).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.results)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.timestamp).toBeInstanceOf(Date);

      // Validate that all major security areas are covered
      const requirementCategories = [
        'Cryptographic',
        'Token',
        'Session',
        'Rate Limiting',
        'Audit',
        'Headers',
        'OAuth',
        'SSL',
        'Data Protection',
        'Performance'
      ];

      const coveredCategories = requirementCategories.filter(category =>
        report.results.some(result => 
          result.requirement.toLowerCase().includes(category.toLowerCase())
        )
      );

      expect(coveredCategories.length).toBeGreaterThanOrEqual(8); // At least 8 categories should be covered
    });

    it('should achieve high compliance score with production configuration', async () => {
      const report = await validator.validateSecurityRequirements();
      const score = validator.getComplianceScore(report);

      expect(score).toBeGreaterThanOrEqual(80); // Should achieve at least 80% compliance
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should meet minimum security requirements', async () => {
      const report = await validator.validateSecurityRequirements();
      const meetsMinimum = validator.meetsMinimumSecurityRequirements(report);

      expect(meetsMinimum).toBe(true);
      expect(report.criticalFailures).toBe(0);
    });

    it('should provide actionable security recommendations', async () => {
      const report = await validator.validateSecurityRequirements();

      expect(report.recommendations.length).toBeGreaterThan(0);
      
      // Recommendations should be specific and actionable
      report.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(10);
        expect(recommendation).not.toBe(''); // Should not be empty
      });
    });
  });

  describe('Constitution Compliance Validation', () => {
    it('should validate all Constitution security requirements', async () => {
      const report = await validator.validateSecurityRequirements();

      // Constitution Article V: Security and Authentication requirements
      const constitutionRequirements = [
        'Strong encryption for sensitive data',
        'Secure token generation and validation',
        'Session security and timeout handling',
        'Rate limiting and abuse prevention',
        'Comprehensive audit logging',
        'Security headers implementation',
        'OAuth 2.0 compliance',
        'Token security and automatic refresh',
        'SSL/TLS configuration',
        'Data sanitization and protection'
      ];

      // Check that all Constitution requirements are validated
      const validatedRequirements = report.results.map(r => r.requirement);
      
      constitutionRequirements.forEach(req => {
        const hasRequirement = validatedRequirements.some(vr => 
          vr.toLowerCase().includes(req.toLowerCase().split(' ')[0]) // Check first word
        );
        expect(hasRequirement).toBe(true);
      });
    });

    it('should meet Constitution security standards', async () => {
      const report = await validator.validateSecurityRequirements();

      // Constitution requires no critical security failures
      expect(report.criticalFailures).toBe(0);
      
      // Constitution requires overall compliance
      expect(['COMPLIANT', 'PARTIAL_COMPLIANCE']).toContain(report.overallStatus);
      
      // Constitution requires high compliance score (80%+)
      const score = validator.getComplianceScore(report);
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('should validate Constitution-mandated authentication methods', async () => {
      const report = await validator.validateSecurityRequirements();

      // Constitution Article V: Authentication Methods Priority Order
      // OAuth 2.0 → Personal Access Tokens → App Passwords → Basic Authentication
      
      const oauthResults = report.results.filter(r => 
        r.requirement.toLowerCase().includes('oauth')
      );
      
      expect(oauthResults.length).toBeGreaterThan(0);
      
      // OAuth should be properly implemented
      const oauthPassed = oauthResults.filter(r => r.status === 'PASS');
      expect(oauthPassed.length).toBeGreaterThan(0);
    });

    it('should validate Constitution-mandated data security', async () => {
      const report = await validator.validateSecurityRequirements();

      // Constitution Article V: Data Security requirements
      const dataSecurityResults = report.results.filter(r => 
        r.requirement.toLowerCase().includes('encryption') ||
        r.requirement.toLowerCase().includes('token') ||
        r.requirement.toLowerCase().includes('data protection')
      );
      
      expect(dataSecurityResults.length).toBeGreaterThan(0);
      
      // Data security should be properly implemented
      const dataSecurityPassed = dataSecurityResults.filter(r => r.status === 'PASS');
      expect(dataSecurityPassed.length).toBeGreaterThan(0);
    });
  });

  describe('Real-World Security Scenarios', () => {
    it('should handle high-volume authentication requests securely', async () => {
      // Simulate high-volume scenario
      const clientIds = Array(100).fill(null).map((_, i) => `client-${i}`);
      
      // Test rate limiting under load
      const rateLimitResults = await Promise.all(
        clientIds.map(clientId => 
          rateLimiter.checkRateLimit(clientId, {
            userId: clientId,
            sessionId: `session-${clientId}`
          })
        )
      );

      // All requests should be handled properly
      expect(rateLimitResults.length).toBe(100);
      rateLimitResults.forEach(result => {
        expect(result.allowed).toBeDefined();
        expect(result.remaining).toBeDefined();
        expect(result.resetTime).toBeDefined();
      });

      // Validate security under load
      const report = await validator.validateSecurityRequirements();
      expect(report.criticalFailures).toBe(0);
    });

    it('should maintain security during concurrent operations', async () => {
      // Simulate concurrent security operations
      const concurrentOperations = [
        validator.validateSecurityRequirements(),
        validator.validateSecurityRequirements(),
        validator.validateSecurityRequirements(),
        validator.validateSecurityRequirements(),
        validator.validateSecurityRequirements()
      ];

      const reports = await Promise.all(concurrentOperations);

      // All operations should complete successfully
      expect(reports.length).toBe(5);
      reports.forEach(report => {
        expect(report).toBeDefined();
        expect(report.overallStatus).toBeDefined();
        expect(report.criticalFailures).toBe(0);
      });
    });

    it('should handle security validation during token operations', async () => {
      // Create and store tokens
      const accessToken: AccessToken = {
        token: 'test-access-token-for-security-validation',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['read:repository', 'write:repository'],
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      const refreshToken: RefreshToken = {
        id: 'refresh-security-test',
        token: 'test-refresh-token-for-security-validation',
        expiresAt: new Date(Date.now() + 2592000000),
        applicationId: 'security-test-app',
        userId: 'security-test-user',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      // Store tokens
      await tokenStorage.storeAccessToken(accessToken, 'security-test-client');
      await tokenStorage.storeRefreshToken(refreshToken);

      // Validate security while tokens are active
      const report = await validator.validateSecurityRequirements();

      expect(report).toBeDefined();
      expect(report.criticalFailures).toBe(0);
      
      // Token security should be validated
      const tokenResults = report.results.filter(r => 
        r.requirement.toLowerCase().includes('token')
      );
      expect(tokenResults.length).toBeGreaterThan(0);
    });

    it('should maintain security during session management', async () => {
      // Create test application
      const testApplication: OAuthApplication = {
        id: 'security-test-app',
        name: 'Security Test Application',
        description: 'Application for security testing',
        clientId: 'security-client-123',
        clientSecret: 'security-secret-123',
        redirectUri: 'https://securitytest.com/callback',
        instanceType: 'datacenter',
        baseUrl: 'https://securitytest.com',
        scopes: ['read:repository'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const accessToken: AccessToken = {
        token: 'session-security-test-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['read:repository'],
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      const refreshToken: RefreshToken = {
        id: 'session-refresh-test',
        token: 'session-refresh-token',
        expiresAt: new Date(Date.now() + 2592000000),
        applicationId: 'security-test-app',
        userId: 'session-test-user',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      const userInfo = {
        id: 'session-test-user',
        name: 'Session Test User',
        email: 'session@test.com'
      };

      // Create session
      const sessionResponse = await sessionManager.createSession(
        'security-test-session',
        testApplication,
        accessToken,
        refreshToken,
        userInfo
      );

      expect(sessionResponse.success).toBe(true);

      // Validate security during active session
      const report = await validator.validateSecurityRequirements();

      expect(report).toBeDefined();
      expect(report.criticalFailures).toBe(0);
      
      // Session security should be validated
      const sessionResults = report.results.filter(r => 
        r.requirement.toLowerCase().includes('session')
      );
      expect(sessionResults.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete validation within performance requirements', async () => {
      const startTime = Date.now();
      const report = await validator.validateSecurityRequirements();
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(report).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle validation errors gracefully', async () => {
      // Create validator with problematic configuration
      const problematicConfig = {
        ...productionConfig,
        security: {
          encryptTokens: false,
          requireHttps: false,
          csrfProtection: false,
          rateLimitRequests: false
        }
      };

      const problematicValidator = new SecurityRequirementsValidator(
        cryptoService,
        auditLogger,
        rateLimiter,
        securityHeaders,
        tokenStorage,
        sessionManager,
        oauthManager,
        problematicConfig
      );

      const report = await problematicValidator.validateSecurityRequirements();

      expect(report).toBeDefined();
      expect(report.overallStatus).toBeDefined();
      expect(report.results.length).toBeGreaterThan(0);
      
      // Should have warnings or failures for problematic config
      expect(report.failedRequirements + report.warningRequirements).toBeGreaterThan(0);
    });

    it('should provide consistent validation results', async () => {
      const report1 = await validator.validateSecurityRequirements();
      const report2 = await validator.validateSecurityRequirements();

      // Results should be consistent
      expect(report1.totalRequirements).toBe(report2.totalRequirements);
      expect(report1.overallStatus).toBe(report2.overallStatus);
      expect(report1.results.length).toBe(report2.results.length);
      
      // Compliance score should be consistent
      const score1 = validator.getComplianceScore(report1);
      const score2 = validator.getComplianceScore(report2);
      expect(score1).toBe(score2);
    });

    it('should scale with increased security requirements', async () => {
      // Test with multiple validation cycles
      const validationCycles = 10;
      const reports = [];

      for (let i = 0; i < validationCycles; i++) {
        const report = await validator.validateSecurityRequirements();
        reports.push(report);
      }

      expect(reports.length).toBe(validationCycles);
      
      // All reports should be consistent
      reports.forEach(report => {
        expect(report).toBeDefined();
        expect(report.overallStatus).toBeDefined();
        expect(report.criticalFailures).toBe(0);
      });
    });
  });

  describe('Integration with Authentication Components', () => {
    it('should validate integration with crypto service', async () => {
      const report = await validator.validateSecurityRequirements();
      
      const cryptoResults = report.results.filter(r => 
        r.requirement.toLowerCase().includes('encryption') ||
        r.requirement.toLowerCase().includes('cryptographic')
      );
      
      expect(cryptoResults.length).toBeGreaterThan(0);
      
      // Crypto integration should work
      const cryptoPassed = cryptoResults.filter(r => r.status === 'PASS');
      expect(cryptoPassed.length).toBeGreaterThan(0);
    });

    it('should validate integration with audit logger', async () => {
      const report = await validator.validateSecurityRequirements();
      
      const auditResults = report.results.filter(r => 
        r.requirement.toLowerCase().includes('audit')
      );
      
      expect(auditResults.length).toBeGreaterThan(0);
      
      // Audit integration should work
      const auditPassed = auditResults.filter(r => r.status === 'PASS');
      expect(auditPassed.length).toBeGreaterThan(0);
    });

    it('should validate integration with rate limiter', async () => {
      const report = await validator.validateSecurityRequirements();
      
      const rateLimitResults = report.results.filter(r => 
        r.requirement.toLowerCase().includes('rate limiting')
      );
      
      expect(rateLimitResults.length).toBeGreaterThan(0);
      
      // Rate limiting integration should work
      const rateLimitPassed = rateLimitResults.filter(r => r.status === 'PASS');
      expect(rateLimitPassed.length).toBeGreaterThan(0);
    });

    it('should validate integration with security headers', async () => {
      const report = await validator.validateSecurityRequirements();
      
      const headersResults = report.results.filter(r => 
        r.requirement.toLowerCase().includes('headers')
      );
      
      expect(headersResults.length).toBeGreaterThan(0);
      
      // Security headers integration should work
      const headersPassed = headersResults.filter(r => r.status === 'PASS');
      expect(headersPassed.length).toBeGreaterThan(0);
    });

    it('should validate integration with token storage', async () => {
      const report = await validator.validateSecurityRequirements();
      
      const tokenResults = report.results.filter(r => 
        r.requirement.toLowerCase().includes('token')
      );
      
      expect(tokenResults.length).toBeGreaterThan(0);
      
      // Token storage integration should work
      const tokenPassed = tokenResults.filter(r => r.status === 'PASS');
      expect(tokenPassed.length).toBeGreaterThan(0);
    });

    it('should validate integration with session manager', async () => {
      const report = await validator.validateSecurityRequirements();
      
      const sessionResults = report.results.filter(r => 
        r.requirement.toLowerCase().includes('session')
      );
      
      expect(sessionResults.length).toBeGreaterThan(0);
      
      // Session management integration should work
      const sessionPassed = sessionResults.filter(r => r.status === 'PASS');
      expect(sessionPassed.length).toBeGreaterThan(0);
    });

    it('should validate integration with OAuth manager', async () => {
      const report = await validator.validateSecurityRequirements();
      
      const oauthResults = report.results.filter(r => 
        r.requirement.toLowerCase().includes('oauth')
      );
      
      expect(oauthResults.length).toBeGreaterThan(0);
      
      // OAuth integration should work
      const oauthPassed = oauthResults.filter(r => r.status === 'PASS');
      expect(oauthPassed.length).toBeGreaterThan(0);
    });
  });
});

