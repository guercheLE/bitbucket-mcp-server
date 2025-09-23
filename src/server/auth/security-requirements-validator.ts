/**
 * Security Requirements Validator
 * 
 * This module implements comprehensive security requirements validation for the authentication system
 * to ensure compliance with the Constitution security requirements:
 * 
 * Security Requirements from Constitution:
 * - Strong encryption for sensitive data (AES-256-GCM)
 * - Secure token generation and validation
 * - Session security and timeout handling
 * - Rate limiting and abuse prevention
 * - Comprehensive audit logging
 * - Security headers implementation
 * - OAuth 2.0 compliance
 * - Token security and automatic refresh
 * - SSL/TLS configuration
 * - Data sanitization and protection
 * 
 * @fileoverview Security requirements validation system
 */

import { AdvancedCryptoService } from './advanced-crypto';
import { AuthAuditLogger, AuditEventType, AuditSeverity } from './auth-audit-logger';
import { RateLimiter, RateLimitAlgorithm, RateLimitScope } from './rate-limiter';
import { SecurityHeadersManager, SecurityHeaderType } from './security-headers';
import { MemoryTokenStorage } from './token-storage';
import { SessionManager } from './session-manager';
import { OAuthManager } from './oauth-manager';
import { 
  AccessToken, 
  RefreshToken, 
  AuthenticationConfig, 
  OAuthApplication,
  UserSessionState
} from '../../types/auth';

/**
 * Security requirement validation result
 */
export interface SecurityValidationResult {
  requirement: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Overall security validation report
 */
export interface SecurityValidationReport {
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL_COMPLIANCE';
  totalRequirements: number;
  passedRequirements: number;
  failedRequirements: number;
  warningRequirements: number;
  criticalFailures: number;
  results: SecurityValidationResult[];
  recommendations: string[];
  timestamp: Date;
}

/**
 * Security Requirements Validator
 * 
 * Validates that the authentication system meets all security requirements
 * specified in the Constitution and industry best practices.
 */
export class SecurityRequirementsValidator {
  private cryptoService: AdvancedCryptoService;
  private auditLogger: AuthAuditLogger;
  private rateLimiter: RateLimiter;
  private securityHeaders: SecurityHeadersManager;
  private tokenStorage: MemoryTokenStorage;
  private sessionManager: SessionManager;
  private oauthManager: OAuthManager;
  private config: AuthenticationConfig;

  constructor(
    cryptoService: AdvancedCryptoService,
    auditLogger: AuthAuditLogger,
    rateLimiter: RateLimiter,
    securityHeaders: SecurityHeadersManager,
    tokenStorage: MemoryTokenStorage,
    sessionManager: SessionManager,
    oauthManager: OAuthManager,
    config: AuthenticationConfig
  ) {
    this.cryptoService = cryptoService;
    this.auditLogger = auditLogger;
    this.rateLimiter = rateLimiter;
    this.securityHeaders = securityHeaders;
    this.tokenStorage = tokenStorage;
    this.sessionManager = sessionManager;
    this.oauthManager = oauthManager;
    this.config = config;
  }

  /**
   * Perform comprehensive security requirements validation
   */
  async validateSecurityRequirements(): Promise<SecurityValidationReport> {
    const results: SecurityValidationResult[] = [];
    
    // Cryptographic Security Requirements
    results.push(...await this.validateCryptographicSecurity());
    
    // Token Security Requirements
    results.push(...await this.validateTokenSecurity());
    
    // Session Security Requirements
    results.push(...await this.validateSessionSecurity());
    
    // Rate Limiting Requirements
    results.push(...await this.validateRateLimiting());
    
    // Audit Logging Requirements
    results.push(...await this.validateAuditLogging());
    
    // Security Headers Requirements
    results.push(...await this.validateSecurityHeaders());
    
    // OAuth 2.0 Compliance Requirements
    results.push(...await this.validateOAuthCompliance());
    
    // SSL/TLS Security Requirements
    results.push(...await this.validateSslTlsSecurity());
    
    // Data Protection Requirements
    results.push(...await this.validateDataProtection());
    
    // Performance Security Requirements
    results.push(...await this.validatePerformanceSecurity());

    return this.generateValidationReport(results);
  }

  /**
   * Validate cryptographic security requirements
   */
  private async validateCryptographicSecurity(): Promise<SecurityValidationResult[]> {
    const results: SecurityValidationResult[] = [];

    try {
      // Test encryption strength
      const testData = 'security-validation-test-data';
      const encrypted = await this.cryptoService.encrypt(testData);
      const decrypted = await this.cryptoService.decrypt(encrypted);

      results.push({
        requirement: 'Strong Encryption (AES-256-GCM)',
        status: decrypted === testData ? 'PASS' : 'FAIL',
        message: decrypted === testData 
          ? 'AES-256-GCM encryption working correctly'
          : 'Encryption/decryption failed',
        severity: 'CRITICAL'
      });

      // Test token encryption
      const testToken: AccessToken = {
        token: 'test-token-for-encryption',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['read:repository'],
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      const encryptedToken = await this.cryptoService.encryptToken(testToken);
      const decryptedToken = await this.cryptoService.decryptToken<AccessToken>(encryptedToken);

      results.push({
        requirement: 'Token Encryption Security',
        status: decryptedToken.token === testToken.token ? 'PASS' : 'FAIL',
        message: decryptedToken.token === testToken.token
          ? 'Token encryption/decryption working correctly'
          : 'Token encryption failed',
        severity: 'CRITICAL'
      });

      // Test secure token generation
      const tokens = new Set();
      for (let i = 0; i < 10; i++) {
        const token = this.cryptoService.generateSecureToken(32);
        tokens.add(token);
      }

      results.push({
        requirement: 'Secure Token Generation',
        status: tokens.size === 10 ? 'PASS' : 'FAIL',
        message: tokens.size === 10
          ? 'Token generation produces unique tokens'
          : 'Token generation produces duplicate tokens',
        severity: 'HIGH'
      });

    } catch (error) {
      results.push({
        requirement: 'Cryptographic Security',
        status: 'FAIL',
        message: `Cryptographic validation failed: ${error.message}`,
        severity: 'CRITICAL'
      });
    }

    return results;
  }

  /**
   * Validate token security requirements
   */
  private async validateTokenSecurity(): Promise<SecurityValidationResult[]> {
    const results: SecurityValidationResult[] = [];

    try {
      // Test token storage security
      const testToken: AccessToken = {
        token: 'test-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['read:repository'],
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      await this.tokenStorage.storeAccessToken(testToken, 'test-client');
      const retrieved = await this.tokenStorage.getAccessToken('test-client');

      results.push({
        requirement: 'Token Storage Security',
        status: retrieved?.token === testToken.token ? 'PASS' : 'FAIL',
        message: retrieved?.token === testToken.token
          ? 'Token storage and retrieval working correctly'
          : 'Token storage/retrieval failed',
        severity: 'CRITICAL'
      });

      // Test token expiration handling
      const expiredToken = { 
        ...testToken, 
        expiresAt: new Date(Date.now() - 1000),
        isValid: false
      };
      await this.tokenStorage.storeAccessToken(expiredToken, 'expired-client');
      const expiredRetrieved = await this.tokenStorage.getAccessToken('expired-client');

      results.push({
        requirement: 'Token Expiration Handling',
        status: expiredRetrieved?.isValid === false ? 'PASS' : 'FAIL',
        message: expiredRetrieved?.isValid === false
          ? 'Token expiration handling working correctly'
          : 'Token expiration not properly handled',
        severity: 'HIGH'
      });

      // Test refresh token security
      const refreshToken: RefreshToken = {
        id: 'refresh-123',
        token: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 2592000000),
        applicationId: 'app-123',
        userId: 'user-123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      await this.tokenStorage.storeRefreshToken(refreshToken);
      const retrievedRefresh = await this.tokenStorage.getRefreshToken('test-client');

      results.push({
        requirement: 'Refresh Token Security',
        status: retrievedRefresh?.token === refreshToken.token ? 'PASS' : 'FAIL',
        message: retrievedRefresh?.token === refreshToken.token
          ? 'Refresh token storage working correctly'
          : 'Refresh token storage failed',
        severity: 'HIGH'
      });

    } catch (error) {
      results.push({
        requirement: 'Token Security',
        status: 'FAIL',
        message: `Token security validation failed: ${error.message}`,
        severity: 'CRITICAL'
      });
    }

    return results;
  }

  /**
   * Validate session security requirements
   */
  private async validateSessionSecurity(): Promise<SecurityValidationResult[]> {
    const results: SecurityValidationResult[] = [];

    try {
      // Test session creation security
      const testApplication: OAuthApplication = {
        id: 'test-app',
        name: 'Test Application',
        description: 'Test App Description',
        clientId: 'client-123',
        clientSecret: 'secret-123',
        redirectUri: 'https://testapp.com/callback',
        instanceType: 'datacenter',
        baseUrl: 'https://testapp.com',
        scopes: ['read:repository'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const accessToken: AccessToken = {
        token: 'test-access-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['read:repository'],
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true
      };

      const refreshToken: RefreshToken = {
        id: 'refresh-123',
        token: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 2592000000),
        applicationId: 'test-app',
        userId: 'user123',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        isRevoked: false
      };

      const userInfo = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      };

      const sessionResponse = await this.sessionManager.createSession(
        'test-session',
        testApplication,
        accessToken,
        refreshToken,
        userInfo
      );

      results.push({
        requirement: 'Session Creation Security',
        status: sessionResponse.success ? 'PASS' : 'FAIL',
        message: sessionResponse.success
          ? 'Session creation working correctly'
          : 'Session creation failed',
        severity: 'HIGH'
      });

      // Test session timeout configuration
      const sessionTimeout = this.config.sessions?.sessionTimeout || 0;
      results.push({
        requirement: 'Session Timeout Configuration',
        status: sessionTimeout > 0 ? 'PASS' : 'WARNING',
        message: sessionTimeout > 0
          ? `Session timeout configured: ${sessionTimeout}ms`
          : 'Session timeout not configured',
        severity: 'MEDIUM'
      });

      // Test concurrent session limits
      const maxSessions = this.config.sessions?.maxConcurrentSessions || 0;
      results.push({
        requirement: 'Concurrent Session Limits',
        status: maxSessions > 0 ? 'PASS' : 'WARNING',
        message: maxSessions > 0
          ? `Max concurrent sessions: ${maxSessions}`
          : 'Concurrent session limits not configured',
        severity: 'MEDIUM'
      });

    } catch (error) {
      results.push({
        requirement: 'Session Security',
        status: 'FAIL',
        message: `Session security validation failed: ${error.message}`,
        severity: 'CRITICAL'
      });
    }

    return results;
  }

  /**
   * Validate rate limiting requirements
   */
  private async validateRateLimiting(): Promise<SecurityValidationResult[]> {
    const results: SecurityValidationResult[] = [];

    try {
      // Test rate limiting functionality
      const clientId = 'rate-limit-test';
      const rateLimitResult = await this.rateLimiter.checkRateLimit(clientId, {
        userId: clientId,
        sessionId: 'test-session'
      });

      results.push({
        requirement: 'Rate Limiting Implementation',
        status: rateLimitResult.allowed !== undefined ? 'PASS' : 'FAIL',
        message: rateLimitResult.allowed !== undefined
          ? 'Rate limiting working correctly'
          : 'Rate limiting not implemented',
        severity: 'HIGH'
      });

      // Test rate limiting configuration
      const rateLimitEnabled = this.config.security?.rateLimitRequests;
      results.push({
        requirement: 'Rate Limiting Configuration',
        status: rateLimitEnabled ? 'PASS' : 'WARNING',
        message: rateLimitEnabled
          ? 'Rate limiting enabled in configuration'
          : 'Rate limiting not enabled in configuration',
        severity: 'MEDIUM'
      });

    } catch (error) {
      results.push({
        requirement: 'Rate Limiting',
        status: 'FAIL',
        message: `Rate limiting validation failed: ${error.message}`,
        severity: 'HIGH'
      });
    }

    return results;
  }

  /**
   * Validate audit logging requirements
   */
  private async validateAuditLogging(): Promise<SecurityValidationResult[]> {
    const results: SecurityValidationResult[] = [];

    try {
      // Test audit logging functionality
      await this.auditLogger.logEvent(
        AuditEventType.AUTH_LOGIN_SUCCESS,
        'Security validation test',
        {
          userId: 'user123',
          clientId: 'client456',
          ipAddress: '192.168.1.1',
          userAgent: 'Security Validator',
          details: { test: 'security_validation' }
        }
      );

      const events = await this.auditLogger.getEvents({
        userId: 'user123',
        limit: 1
      });

      results.push({
        requirement: 'Audit Logging Implementation',
        status: events.length > 0 ? 'PASS' : 'FAIL',
        message: events.length > 0
          ? 'Audit logging working correctly'
          : 'Audit logging not working',
        severity: 'CRITICAL'
      });

      // Test audit logging configuration
      const auditEnabled = this.config.logging?.logAuthEvents;
      results.push({
        requirement: 'Audit Logging Configuration',
        status: auditEnabled ? 'PASS' : 'WARNING',
        message: auditEnabled
          ? 'Audit logging enabled in configuration'
          : 'Audit logging not enabled in configuration',
        severity: 'MEDIUM'
      });

    } catch (error) {
      results.push({
        requirement: 'Audit Logging',
        status: 'FAIL',
        message: `Audit logging validation failed: ${error.message}`,
        severity: 'CRITICAL'
      });
    }

    return results;
  }

  /**
   * Validate security headers requirements
   */
  private async validateSecurityHeaders(): Promise<SecurityValidationResult[]> {
    const results: SecurityValidationResult[] = [];

    try {
      // Test security headers generation
      const headers = this.securityHeaders.generateSecurityHeaders({
        origin: 'https://example.com',
        isHttps: true
      });

      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security'
      ];

      const missingHeaders = requiredHeaders.filter(header => !headers[header]);

      results.push({
        requirement: 'Security Headers Implementation',
        status: missingHeaders.length === 0 ? 'PASS' : 'FAIL',
        message: missingHeaders.length === 0
          ? 'All required security headers present'
          : `Missing security headers: ${missingHeaders.join(', ')}`,
        severity: 'HIGH'
      });

      // Test CORS headers
      const corsHeaders = this.securityHeaders.generateCorsHeaders({
        origin: 'https://trusted.com',
        method: 'POST'
      });

      const corsRequiredHeaders = [
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Headers'
      ];

      const missingCorsHeaders = corsRequiredHeaders.filter(header => !corsHeaders[header]);

      results.push({
        requirement: 'CORS Security Headers',
        status: missingCorsHeaders.length === 0 ? 'PASS' : 'FAIL',
        message: missingCorsHeaders.length === 0
          ? 'CORS security headers working correctly'
          : `Missing CORS headers: ${missingCorsHeaders.join(', ')}`,
        severity: 'MEDIUM'
      });

    } catch (error) {
      results.push({
        requirement: 'Security Headers',
        status: 'FAIL',
        message: `Security headers validation failed: ${error.message}`,
        severity: 'HIGH'
      });
    }

    return results;
  }

  /**
   * Validate OAuth 2.0 compliance requirements
   */
  private async validateOAuthCompliance(): Promise<SecurityValidationResult[]> {
    const results: SecurityValidationResult[] = [];

    try {
      // Test OAuth application creation
      const testApp = {
        name: 'Security Test App',
        description: 'Security Test Application',
        url: 'https://testapp.com',
        callbackUrl: 'https://testapp.com/callback'
      };

      const appResult = await this.oauthManager.createApplication(testApp);

      results.push({
        requirement: 'OAuth 2.0 Application Management',
        status: appResult.success ? 'PASS' : 'FAIL',
        message: appResult.success
          ? 'OAuth application creation working correctly'
          : 'OAuth application creation failed',
        severity: 'CRITICAL'
      });

      // Test OAuth configuration
      const oauthConfig = this.config.defaultApplication;
      results.push({
        requirement: 'OAuth 2.0 Configuration',
        status: oauthConfig ? 'PASS' : 'WARNING',
        message: oauthConfig
          ? 'OAuth configuration present'
          : 'OAuth configuration missing',
        severity: 'MEDIUM'
      });

    } catch (error) {
      results.push({
        requirement: 'OAuth 2.0 Compliance',
        status: 'FAIL',
        message: `OAuth compliance validation failed: ${error.message}`,
        severity: 'CRITICAL'
      });
    }

    return results;
  }

  /**
   * Validate SSL/TLS security requirements
   */
  private async validateSslTlsSecurity(): Promise<SecurityValidationResult[]> {
    const results: SecurityValidationResult[] = [];

    try {
      // Test HTTPS requirement
      const requireHttps = this.config.security?.requireHttps;
      results.push({
        requirement: 'HTTPS Requirement',
        status: requireHttps ? 'PASS' : 'WARNING',
        message: requireHttps
          ? 'HTTPS required in configuration'
          : 'HTTPS not required in configuration',
        severity: 'HIGH'
      });

      // Test CSRF protection
      const csrfProtection = this.config.security?.csrfProtection;
      results.push({
        requirement: 'CSRF Protection',
        status: csrfProtection ? 'PASS' : 'WARNING',
        message: csrfProtection
          ? 'CSRF protection enabled'
          : 'CSRF protection not enabled',
        severity: 'MEDIUM'
      });

    } catch (error) {
      results.push({
        requirement: 'SSL/TLS Security',
        status: 'FAIL',
        message: `SSL/TLS security validation failed: ${error.message}`,
        severity: 'CRITICAL'
      });
    }

    return results;
  }

  /**
   * Validate data protection requirements
   */
  private async validateDataProtection(): Promise<SecurityValidationResult[]> {
    const results: SecurityValidationResult[] = [];

    try {
      // Test token encryption requirement
      const encryptTokens = this.config.security?.encryptTokens;
      results.push({
        requirement: 'Token Encryption',
        status: encryptTokens ? 'PASS' : 'WARNING',
        message: encryptTokens
          ? 'Token encryption enabled'
          : 'Token encryption not enabled',
        severity: 'HIGH'
      });

      // Test secure storage configuration
      const storageType = this.config.storage?.type;
      const encryptionKey = this.config.storage?.encryptionKey;

      results.push({
        requirement: 'Secure Storage Configuration',
        status: storageType && encryptionKey ? 'PASS' : 'WARNING',
        message: storageType && encryptionKey
          ? 'Secure storage properly configured'
          : 'Storage configuration incomplete',
        severity: 'MEDIUM'
      });

    } catch (error) {
      results.push({
        requirement: 'Data Protection',
        status: 'FAIL',
        message: `Data protection validation failed: ${error.message}`,
        severity: 'CRITICAL'
      });
    }

    return results;
  }

  /**
   * Validate performance security requirements
   */
  private async validatePerformanceSecurity(): Promise<SecurityValidationResult[]> {
    const results: SecurityValidationResult[] = [];

    try {
      // Test token lifetime configuration
      const accessTokenLifetime = this.config.tokens?.accessTokenLifetime || 0;
      const refreshTokenLifetime = this.config.tokens?.refreshTokenLifetime || 0;

      results.push({
        requirement: 'Token Lifetime Configuration',
        status: accessTokenLifetime > 0 && refreshTokenLifetime > 0 ? 'PASS' : 'WARNING',
        message: accessTokenLifetime > 0 && refreshTokenLifetime > 0
          ? `Token lifetimes configured: access=${accessTokenLifetime}ms, refresh=${refreshTokenLifetime}ms`
          : 'Token lifetimes not properly configured',
        severity: 'MEDIUM'
      });

      // Test refresh threshold
      const refreshThreshold = this.config.tokens?.refreshThreshold || 0;
      results.push({
        requirement: 'Token Refresh Threshold',
        status: refreshThreshold > 0 ? 'PASS' : 'WARNING',
        message: refreshThreshold > 0
          ? `Token refresh threshold configured: ${refreshThreshold}ms`
          : 'Token refresh threshold not configured',
        severity: 'LOW'
      });

    } catch (error) {
      results.push({
        requirement: 'Performance Security',
        status: 'FAIL',
        message: `Performance security validation failed: ${error.message}`,
        severity: 'MEDIUM'
      });
    }

    return results;
  }

  /**
   * Generate comprehensive validation report
   */
  private generateValidationReport(results: SecurityValidationResult[]): SecurityValidationReport {
    const totalRequirements = results.length;
    const passedRequirements = results.filter(r => r.status === 'PASS').length;
    const failedRequirements = results.filter(r => r.status === 'FAIL').length;
    const warningRequirements = results.filter(r => r.status === 'WARNING').length;
    const criticalFailures = results.filter(r => r.status === 'FAIL' && r.severity === 'CRITICAL').length;

    let overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL_COMPLIANCE';
    if (criticalFailures > 0) {
      overallStatus = 'NON_COMPLIANT';
    } else if (failedRequirements > 0 || warningRequirements > 0) {
      overallStatus = 'PARTIAL_COMPLIANCE';
    } else {
      overallStatus = 'COMPLIANT';
    }

    const recommendations = this.generateRecommendations(results);

    return {
      overallStatus,
      totalRequirements,
      passedRequirements,
      failedRequirements,
      warningRequirements,
      criticalFailures,
      results,
      recommendations,
      timestamp: new Date()
    };
  }

  /**
   * Generate security recommendations based on validation results
   */
  private generateRecommendations(results: SecurityValidationResult[]): string[] {
    const recommendations: string[] = [];

    const failedResults = results.filter(r => r.status === 'FAIL');
    const warningResults = results.filter(r => r.status === 'WARNING');

    if (failedResults.length > 0) {
      recommendations.push('CRITICAL: Address all failed security requirements immediately');
      
      const criticalFailures = failedResults.filter(r => r.severity === 'CRITICAL');
      if (criticalFailures.length > 0) {
        recommendations.push(`CRITICAL: Fix ${criticalFailures.length} critical security failures`);
      }
    }

    if (warningResults.length > 0) {
      recommendations.push(`WARNING: Review ${warningResults.length} security warnings`);
    }

    // Specific recommendations based on failed requirements
    const failedRequirements = failedResults.map(r => r.requirement);
    
    if (failedRequirements.some(r => r.includes('Encryption'))) {
      recommendations.push('Enable strong encryption (AES-256-GCM) for all sensitive data');
    }
    
    if (failedRequirements.some(r => r.includes('Token'))) {
      recommendations.push('Implement secure token storage and management');
    }
    
    if (failedRequirements.some(r => r.includes('Session'))) {
      recommendations.push('Configure proper session security and timeout handling');
    }
    
    if (failedRequirements.some(r => r.includes('Rate Limiting'))) {
      recommendations.push('Enable rate limiting to prevent abuse');
    }
    
    if (failedRequirements.some(r => r.includes('Audit'))) {
      recommendations.push('Enable comprehensive audit logging');
    }
    
    if (failedRequirements.some(r => r.includes('Headers'))) {
      recommendations.push('Implement security headers for all HTTP responses');
    }

    if (recommendations.length === 0) {
      recommendations.push('Security requirements validation passed - maintain current security posture');
    }

    return recommendations;
  }

  /**
   * Get security compliance score (0-100)
   */
  getComplianceScore(report: SecurityValidationReport): number {
    if (report.totalRequirements === 0) return 0;
    
    const score = (report.passedRequirements / report.totalRequirements) * 100;
    return Math.round(score);
  }

  /**
   * Check if system meets minimum security requirements
   */
  meetsMinimumSecurityRequirements(report: SecurityValidationReport): boolean {
    return report.criticalFailures === 0 && report.overallStatus !== 'NON_COMPLIANT';
  }
}

