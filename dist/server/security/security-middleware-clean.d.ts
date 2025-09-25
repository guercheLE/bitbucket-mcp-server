/**
 * Security Middleware
 *
 * Middleware for integrating advanced security features with the MCP server,
 * providing comprehensive authentication, session management, and audit logging.
 *
 * Features:
 * - Enhanced authentication with MFA support
 * - Session security validation and enrichment
 * - Real-time security event logging
 * - Permission-based access control
 * - Request/response security enhancements
 */
import { EventEmitter } from 'events';
import { ToolExecutionContext, ToolRequest, ToolResponse } from '../../types/index.js';
/**
 * Security Middleware Configuration
 */
export interface SecurityMiddlewareConfig {
    /** Whether to require authentication for all requests */
    requireAuth: boolean;
    /** Whether to enforce MFA for sensitive operations */
    enforceAdvancedMFA: boolean;
    /** Sensitive operations requiring enhanced security */
    sensitiveOperations: string[];
    /** Session timeout in milliseconds */
    sessionTimeout: number;
    /** Maximum failed authentication attempts */
    maxFailedAttempts: number;
    /** Rate limiting configuration */
    rateLimiting: {
        enabled: boolean;
        windowMs: number;
        maxRequests: number;
    };
    /** Audit logging configuration */
    auditLogging: {
        enabled: boolean;
        logAllRequests: boolean;
        logSensitiveOperations: boolean;
        retentionDays: number;
    };
}
/**
 * Security Context
 * Enhanced security information for requests
 */
export interface SecurityContext {
    /** Whether request is authenticated */
    isAuthenticated: boolean;
    /** Whether MFA is verified for this session */
    mfaVerified: boolean;
    /** Security level of the current session */
    securityLevel: 'basic' | 'elevated' | 'admin';
    /** User permissions */
    permissions: string[];
    /** Risk score for the request */
    riskScore: number;
    /** Device fingerprint */
    deviceFingerprint?: string;
    /** Geographic location information */
    geoLocation?: {
        country?: string;
        region?: string;
        city?: string;
        suspicious: boolean;
    };
}
/**
 * Security Middleware Class
 */
export declare class SecurityMiddleware extends EventEmitter {
    private readonly config;
    private readonly mfaManager;
    private readonly sessionManager;
    private readonly auditLogger;
    private readonly rateLimitStore;
    constructor(config?: Partial<SecurityMiddlewareConfig>);
    /**
     * Pre-request Security Validation
     */
    preRequest(request: ToolRequest): Promise<{
        allowed: boolean;
        context: SecurityContext;
        error?: string;
    }>;
    /**
     * Post-request Security Processing
     */
    postRequest(request: ToolRequest, response: ToolResponse, securityContext: SecurityContext, executionTime: number): Promise<void>;
    /**
     * Enhanced Tool Execution Context
     */
    enhanceToolContext(baseContext: ToolExecutionContext, securityContext: SecurityContext): ToolExecutionContext;
    /**
     * Private helper methods
     */
    private setupEventListeners;
    private checkRateLimit;
    private validateAuthentication;
    private validateAdvancedMFA;
    private validatePermissions;
    private calculateRiskScore;
    private determineSecurityLevel;
    private getGeoLocation;
    private createEmptySecurityContext;
    private getRequiredPermissions;
    private sanitizeParameters;
    private detectSecurityAnomalies;
    /**
     * Public API methods for external use
     */
    getSecurityStats(): Promise<any>;
    getActiveThreats(): Promise<any[]>;
    updateConfig(newConfig: Partial<SecurityMiddlewareConfig>): void;
}
export default SecurityMiddleware;
//# sourceMappingURL=security-middleware-clean.d.ts.map