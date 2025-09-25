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
import { AuthAuditLogger } from './auth-audit-logger';
import { RateLimiter } from './rate-limiter';
import { SecurityHeadersManager } from './security-headers';
import { MemoryTokenStorage } from './token-storage';
import { SessionManager } from './session-manager';
import { OAuthManager } from './oauth-manager';
import { AuthenticationConfig } from '../../types/auth';
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
export declare class SecurityRequirementsValidator {
    private cryptoService;
    private auditLogger;
    private rateLimiter;
    private securityHeaders;
    private tokenStorage;
    private sessionManager;
    private oauthManager;
    private config;
    constructor(cryptoService: AdvancedCryptoService, auditLogger: AuthAuditLogger, rateLimiter: RateLimiter, securityHeaders: SecurityHeadersManager, tokenStorage: MemoryTokenStorage, sessionManager: SessionManager, oauthManager: OAuthManager, config: AuthenticationConfig);
    /**
     * Perform comprehensive security requirements validation
     */
    validateSecurityRequirements(): Promise<SecurityValidationReport>;
    /**
     * Validate cryptographic security requirements
     */
    private validateCryptographicSecurity;
    /**
     * Validate token security requirements
     */
    private validateTokenSecurity;
    /**
     * Validate session security requirements
     */
    private validateSessionSecurity;
    /**
     * Validate rate limiting requirements
     */
    private validateRateLimiting;
    /**
     * Validate audit logging requirements
     */
    private validateAuditLogging;
    /**
     * Validate security headers requirements
     */
    private validateSecurityHeaders;
    /**
     * Validate OAuth 2.0 compliance requirements
     */
    private validateOAuthCompliance;
    /**
     * Validate SSL/TLS security requirements
     */
    private validateSslTlsSecurity;
    /**
     * Validate data protection requirements
     */
    private validateDataProtection;
    /**
     * Validate performance security requirements
     */
    private validatePerformanceSecurity;
    /**
     * Generate comprehensive validation report
     */
    private generateValidationReport;
    /**
     * Generate security recommendations based on validation results
     */
    private generateRecommendations;
    /**
     * Get security compliance score (0-100)
     */
    getComplianceScore(report: SecurityValidationReport): number;
    /**
     * Check if system meets minimum security requirements
     */
    meetsMinimumSecurityRequirements(report: SecurityValidationReport): boolean;
}
//# sourceMappingURL=security-requirements-validator.d.ts.map