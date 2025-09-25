/**
 * Security Requirements Validator Tests
 * 
 * This module implements comprehensive tests for the SecurityRequirementsValidator
 * to ensure all security requirements are properly validated according to the Constitution.
 * 
 * Test Coverage:
 * - Cryptographic security validation
 * - Token security validation
 * - Session security validation
 * - Rate limiting validation
 * - Audit logging validation
 * - Security headers validation
 * - OAuth 2.0 compliance validation
 * - SSL/TLS security validation
 * - Data protection validation
 * - Performance security validation
 * - Overall compliance reporting
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

describe('Security Requirements Validator Tests', () => {
  let validator: SecurityRequirementsValidator;
  let cryptoService: AdvancedCryptoService;
  let auditLogger: AuthAuditLogger;
  let rateLimiter: RateLimiter;
  let securityHeaders: SecurityHeadersManager;
  let tokenStorage: MemoryTokenStorage;
  let sessionManager: SessionManager;
  let oauthManager: OAuthManager;
  let testConfig: AuthenticationConfig;

  beforeEach(() => {
    testConfig = {
      defaultApplication: {
        name: 'Security Test App',
        description: 'Security Test Application',
        scopes: ['read:repository', 'write:repository']
      },
      tokens: {
        accessTokenLifetime: 3600000, // 1 hour
        refreshTokenLifetime: 2592000000, // 30 days
        refreshThreshold: 300000 // 5 minutes
      },
      sessions: {
        maxConcurrentSessions: 5,
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
        encryptionKey: 'test-encryption-key-for-security-validation'
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
      pbkdf2Iterations: 10000,
      memoryProtection: true,
      forwardSecrecy: true
    });

    auditLogger = new AuthAuditLogger({
      enabled: true,
      logLevel: AuditSeverity.LOW,
      maxMemoryEntries: 1000,
      retentionDays: 1,
      realTimeAlerts: true,
      performanceMetrics: true
    });

    rateLimiter = new RateLimiter();
    securityHeaders = new SecurityHeadersManager();
    tokenStorage = new MemoryTokenStorage(testConfig);
    
    // Mock OAuthManager
    oauthManager = {
      createApplication: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'test-app',
          name: 'Test App',
          clientId: 'client-123',
          clientSecret: 'secret-123'
        }
      } as any),
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

    sessionManager = new SessionManager(oauthManager, testConfig);

    validator = new SecurityRequirementsValidator(
      cryptoService,
      auditLogger,
      rateLimiter,
      securityHeaders,
      tokenStorage,
      sessionManager,
      oauthManager,
      testConfig
    );
  });

  afterEach(() => {
    cryptoService.destroy();
    auditLogger.destroy();
    rateLimiter.destroy();
    tokenStorage.destroy();
  });

  describe('Comprehensive Security Validation', () => {
    it('should perform complete security requirements validation', async () => {
      const report = await validator.validateSecurityRequirements();

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
    });

    it('should validate cryptographic security requirements', async () => {
      const report = await validator.validateSecurityRequirements();
      const cryptoResults = report.results.filter(r => 
        r.requirement.includes('Encryption') || 
        r.requirement.includes('Cryptographic')
      );

      expect(cryptoResults.length).toBeGreaterThan(0);
      
      // At least one cryptographic test should pass
      const passedCrypto = cryptoResults.filter(r => r.status === 'PASS');
      expect(passedCrypto.length).toBeGreaterThan(0);
    });

    it('should validate token security requirements', async () => {
      const report = await validator.validateSecurityRequirements();
      const tokenResults = report.results.filter(r => 
        r.requirement.includes('Token')
      );

      expect(tokenResults.length).toBeGreaterThan(0);
      
      // Token security tests should pass
      const passedToken = tokenResults.filter(r => r.status === 'PASS');
      expect(passedToken.length).toBeGreaterThan(0);
    });

    it('should validate session security requirements', async () => {
      const report = await validator.validateSecurityRequirements();
      const sessionResults = report.results.filter(r => 
        r.requirement.includes('Session')
      );

      expect(sessionResults.length).toBeGreaterThan(0);
      
      // Session security tests should pass
      const passedSession = sessionResults.filter(r => r.status === 'PASS');
      expect(passedSession.length).toBeGreaterThan(0);
    });

    it('should validate rate limiting requirements', async () => {
      const report = await validator.validateSecurityRequirements();
      const rateLimitResults = report.results.filter(r => 
        r.requirement.includes('Rate Limiting')
      );

      expect(rateLimitResults.length).toBeGreaterThan(0);
      
      // Rate limiting tests should pass
      const passedRateLimit = rateLimitResults.filter(r => r.status === 'PASS');
      expect(passedRateLimit.length).toBeGreaterThan(0);
    });

    it('should validate audit logging requirements', async () => {
      const report = await validator.validateSecurityRequirements();
      const auditResults = report.results.filter(r => 
        r.requirement.includes('Audit')
      );

      expect(auditResults.length).toBeGreaterThan(0);
      
      // Audit logging tests should pass
      const passedAudit = auditResults.filter(r => r.status === 'PASS');
      expect(passedAudit.length).toBeGreaterThan(0);
    });

    it('should validate security headers requirements', async () => {
      const report = await validator.validateSecurityRequirements();
      const headersResults = report.results.filter(r => 
        r.requirement.includes('Headers')
      );

      expect(headersResults.length).toBeGreaterThan(0);
      
      // Security headers tests should pass
      const passedHeaders = headersResults.filter(r => r.status === 'PASS');
      expect(passedHeaders.length).toBeGreaterThan(0);
    });

    it('should validate OAuth 2.0 compliance requirements', async () => {
      const report = await validator.validateSecurityRequirements();
      const oauthResults = report.results.filter(r => 
        r.requirement.includes('OAuth')
      );

      expect(oauthResults.length).toBeGreaterThan(0);
      
      // OAuth compliance tests should pass
      const passedOAuth = oauthResults.filter(r => r.status === 'PASS');
      expect(passedOAuth.length).toBeGreaterThan(0);
    });

    it('should validate SSL/TLS security requirements', async () => {
      const report = await validator.validateSecurityRequirements();
      const sslResults = report.results.filter(r => 
        r.requirement.includes('HTTPS') || 
        r.requirement.includes('CSRF') ||
        r.requirement.includes('SSL')
      );

      expect(sslResults.length).toBeGreaterThan(0);
      
      // SSL/TLS security tests should pass or warn
      const passedSsl = sslResults.filter(r => r.status === 'PASS' || r.status === 'WARNING');
      expect(passedSsl.length).toBeGreaterThan(0);
    });

    it('should validate data protection requirements', async () => {
      const report = await validator.validateSecurityRequirements();
      const dataProtectionResults = report.results.filter(r => 
        r.requirement.includes('Data Protection') ||
        r.requirement.includes('Token Encryption') ||
        r.requirement.includes('Storage')
      );

      expect(dataProtectionResults.length).toBeGreaterThan(0);
      
      // Data protection tests should pass or warn
      const passedDataProtection = dataProtectionResults.filter(r => r.status === 'PASS' || r.status === 'WARNING');
      expect(passedDataProtection.length).toBeGreaterThan(0);
    });

    it('should validate performance security requirements', async () => {
      const report = await validator.validateSecurityRequirements();
      const performanceResults = report.results.filter(r => 
        r.requirement.includes('Performance') ||
        r.requirement.includes('Token Lifetime') ||
        r.requirement.includes('Refresh Threshold')
      );

      expect(performanceResults.length).toBeGreaterThan(0);
      
      // Performance security tests should pass or warn
      const passedPerformance = performanceResults.filter(r => r.status === 'PASS' || r.status === 'WARNING');
      expect(passedPerformance.length).toBeGreaterThan(0);
    });
  });

  describe('Compliance Scoring', () => {
    it('should calculate compliance score correctly', async () => {
      const report = await validator.validateSecurityRequirements();
      const score = validator.getComplianceScore(report);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(score)).toBe(true);
    });

    it('should determine minimum security requirements compliance', async () => {
      const report = await validator.validateSecurityRequirements();
      const meetsMinimum = validator.meetsMinimumSecurityRequirements(report);

      expect(typeof meetsMinimum).toBe('boolean');
      
      // If no critical failures, should meet minimum requirements
      if (report.criticalFailures === 0) {
        expect(meetsMinimum).toBe(true);
      }
    });

    it('should provide meaningful recommendations', async () => {
      const report = await validator.validateSecurityRequirements();

      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      // Recommendations should be strings
      report.recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Create a validator with invalid configuration
      const invalidConfig = {
        ...testConfig,
        security: {
          encryptTokens: false,
          requireHttps: false,
          csrfProtection: false,
          rateLimitRequests: false
        }
      };

      const invalidValidator = new SecurityRequirementsValidator(
        cryptoService,
        auditLogger,
        rateLimiter,
        securityHeaders,
        tokenStorage,
        sessionManager,
        oauthManager,
        invalidConfig
      );

      const report = await invalidValidator.validateSecurityRequirements();

      expect(report).toBeDefined();
      expect(report.overallStatus).toBeDefined();
      expect(report.results.length).toBeGreaterThan(0);
      
      // Should have some failures or warnings
      expect(report.failedRequirements + report.warningRequirements).toBeGreaterThan(0);
    });

    it('should handle service failures gracefully', async () => {
      // Mock a failing crypto service
      const failingCryptoService = {
        encrypt: jest.fn().mockRejectedValue(new Error('Encryption failed') as any),
        decrypt: jest.fn().mockRejectedValue(new Error('Decryption failed') as any),
        encryptToken: jest.fn().mockRejectedValue(new Error('Token encryption failed') as any),
        decryptToken: jest.fn().mockRejectedValue(new Error('Token decryption failed') as any),
        generateSecureToken: jest.fn().mockReturnValue('mock-token'),
        destroy: jest.fn()
      } as any;

      const failingValidator = new SecurityRequirementsValidator(
        failingCryptoService,
        auditLogger,
        rateLimiter,
        securityHeaders,
        tokenStorage,
        sessionManager,
        oauthManager,
        testConfig
      );

      const report = await failingValidator.validateSecurityRequirements();

      expect(report).toBeDefined();
      expect(report.overallStatus).toBeDefined();
      
      // Should have some failures due to crypto service issues
      const cryptoFailures = report.results.filter(r => 
        r.requirement.includes('Encryption') && r.status === 'FAIL'
      );
      expect(cryptoFailures.length).toBeGreaterThan(0);
    });
  });

  describe('Constitution Compliance', () => {
    it('should validate all Constitution security requirements', async () => {
      const report = await validator.validateSecurityRequirements();

      // Check for Constitution-mandated security requirements
      const constitutionRequirements = [
        'Strong Encryption',
        'Token Security',
        'Session Security',
        'Rate Limiting',
        'Audit Logging',
        'Security Headers',
        'OAuth 2.0',
        'Data Protection'
      ];

      const validatedRequirements = report.results.map(r => r.requirement);
      
      // Each Constitution requirement should be covered
      constitutionRequirements.forEach(req => {
        const hasRequirement = validatedRequirements.some(vr => 
          vr.toLowerCase().includes(req.toLowerCase())
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
      
      // Constitution requires high compliance score
      const score = validator.getComplianceScore(report);
      expect(score).toBeGreaterThanOrEqual(80); // 80% minimum compliance
    });

    it('should provide Constitution-compliant recommendations', async () => {
      const report = await validator.validateSecurityRequirements();

      // Recommendations should address Constitution requirements
      const recommendations = report.recommendations.join(' ').toLowerCase();
      
      // Should mention critical security aspects
      const securityAspects = [
        'encryption',
        'token',
        'session',
        'rate limit',
        'audit',
        'headers',
        'oauth',
        'security'
      ];

      // At least some security aspects should be mentioned
      const mentionedAspects = securityAspects.filter(aspect => 
        recommendations.includes(aspect)
      );
      expect(mentionedAspects.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now();
      const report = await validator.validateSecurityRequirements();
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(report).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent validation requests', async () => {
      const validationPromises = Array(5).fill(null).map(() => 
        validator.validateSecurityRequirements()
      );

      const reports = await Promise.all(validationPromises);

      expect(reports.length).toBe(5);
      reports.forEach(report => {
        expect(report).toBeDefined();
        expect(report.overallStatus).toBeDefined();
        expect(report.results.length).toBeGreaterThan(0);
      });
    });

    it('should provide consistent validation results', async () => {
      const report1 = await validator.validateSecurityRequirements();
      const report2 = await validator.validateSecurityRequirements();

      expect(report1.totalRequirements).toBe(report2.totalRequirements);
      expect(report1.overallStatus).toBe(report2.overallStatus);
      expect(report1.results.length).toBe(report2.results.length);
    });
  });
});

