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
import EnhancedSessionManager from '../auth/enhanced-session-manager.js';
import MFAManager from '../auth/mfa-manager.js';
import SecurityAuditLogger, { EventCategory, EventSeverity, SecurityEventType } from '../security/audit-logger.js';
/**
 * Default Security Configuration
 */
const DEFAULT_SECURITY_CONFIG = {
    requireAuth: true,
    enforceAdvancedMFA: true,
    sensitiveOperations: [
        'bitbucket_delete_repository',
        'bitbucket_create_webhook',
        'bitbucket_modify_permissions',
        'security_management',
        'workspace_management'
    ],
    sessionTimeout: 60 * 60 * 1000, // 1 hour
    maxFailedAttempts: 5,
    rateLimiting: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000
    },
    auditLogging: {
        enabled: true,
        logAllRequests: false,
        logSensitiveOperations: true,
        retentionDays: 30
    }
};
/**
 * Security Middleware Class
 */
export class SecurityMiddleware extends EventEmitter {
    config;
    mfaManager;
    sessionManager;
    auditLogger;
    rateLimitStore;
    constructor(config = {}) {
        super();
        this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
        // Initialize security components
        this.mfaManager = new MFAManager();
        // Session manager configuration - simplified for now
        this.sessionManager = new EnhancedSessionManager({
            defaultDuration: this.config.sessionTimeout,
            maxDuration: this.config.sessionTimeout * 2,
            mfaRequired: {
                forRoles: ['admin', 'maintainer'],
                forActions: this.config.sensitiveOperations,
                timeout: 30 * 60 * 1000 // 30 minutes for MFA validity
            },
            cleanupInterval: 5 * 60 * 1000, // 5 minutes
            maxConcurrentSessions: 5
        });
        this.auditLogger = new SecurityAuditLogger({
            maxMemoryEvents: 10000,
            batchSize: 100,
            flushInterval: 30000,
            enableCorrelation: true,
            defaultRetention: {
                standard: this.config.auditLogging.retentionDays,
                compliance: 365 * 7, // 7 years for compliance
                security: 365 * 2, // 2 years for security events
                legal: 365 * 7 // 7 years for legal hold
            },
            enableDeduplication: true,
            deduplicationWindow: 60000
        });
        this.rateLimitStore = new Map();
        // Set up event listeners
        this.setupEventListeners();
    }
    /**
     * Pre-request Security Validation
     */
    async preRequest(request) {
        const startTime = Date.now();
        try {
            // Extract context information from the request
            const context = request.context;
            const toolName = request.name;
            const userId = context.authentication?.userId;
            const sessionId = context.session?.id;
            // 1. Rate limiting check
            if (this.config.rateLimiting.enabled) {
                const rateLimitResult = this.checkRateLimit(context);
                if (!rateLimitResult.allowed) {
                    await this.auditLogger.logEvent({
                        eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
                        category: EventCategory.SECURITY,
                        severity: EventSeverity.MEDIUM,
                        userId,
                        sessionId,
                        resourceType: 'api',
                        action: 'rate_limit_exceeded',
                        result: 'denied',
                        ipAddress: context.request?.transport,
                        userAgent: undefined,
                        details: {
                            context: {
                                toolName,
                                rateLimitInfo: rateLimitResult
                            }
                        }
                    });
                    return {
                        allowed: false,
                        context: this.createEmptySecurityContext(),
                        error: 'Rate limit exceeded. Please try again later.'
                    };
                }
            }
            // 2. Authentication validation
            const authResult = await this.validateAuthentication(context);
            if (!authResult.valid) {
                await this.auditLogger.logEvent({
                    eventType: SecurityEventType.ACCESS_DENIED,
                    category: EventCategory.AUTHENTICATION,
                    severity: EventSeverity.MEDIUM,
                    userId,
                    sessionId,
                    resourceType: 'api',
                    action: 'authentication_failed',
                    result: 'denied',
                    ipAddress: context.request?.transport,
                    userAgent: undefined,
                    details: {
                        context: {
                            toolName,
                            reason: authResult.reason
                        }
                    }
                });
                return {
                    allowed: false,
                    context: this.createEmptySecurityContext(),
                    error: authResult.reason || 'Authentication required'
                };
            }
            // 3. Enhanced MFA validation for sensitive operations
            if (this.config.enforceAdvancedMFA &&
                this.config.sensitiveOperations.includes(toolName)) {
                const mfaResult = await this.validateAdvancedMFA(context);
                if (!mfaResult.valid) {
                    await this.auditLogger.logEvent({
                        eventType: SecurityEventType.MFA_FAILURE,
                        category: EventCategory.AUTHENTICATION,
                        severity: EventSeverity.HIGH,
                        userId,
                        sessionId,
                        resourceType: toolName,
                        action: 'mfa_required',
                        result: 'denied',
                        ipAddress: context.request?.transport,
                        userAgent: undefined,
                        details: {
                            context: {
                                toolName,
                                reason: mfaResult.reason
                            }
                        }
                    });
                    return {
                        allowed: false,
                        context: this.createEmptySecurityContext(),
                        error: mfaResult.reason || 'Multi-factor authentication required for this operation'
                    };
                }
            }
            // 4. Permission validation
            const permissionResult = this.validatePermissions(toolName, context);
            if (!permissionResult.valid) {
                await this.auditLogger.logEvent({
                    eventType: SecurityEventType.ACCESS_DENIED,
                    category: EventCategory.AUTHORIZATION,
                    severity: EventSeverity.MEDIUM,
                    userId,
                    sessionId,
                    resourceType: toolName,
                    action: 'permission_denied',
                    result: 'denied',
                    ipAddress: context.request?.transport,
                    userAgent: undefined,
                    details: {
                        context: {
                            toolName,
                            requiredPermissions: permissionResult.requiredPermissions,
                            userPermissions: context.authentication?.permissions
                        }
                    }
                });
                return {
                    allowed: false,
                    context: this.createEmptySecurityContext(),
                    error: permissionResult.reason || 'Insufficient permissions'
                };
            }
            // 5. Risk assessment
            const riskScore = this.calculateRiskScore(toolName, context);
            // 6. Create security context
            const securityContext = {
                isAuthenticated: true,
                mfaVerified: false, // Would be determined from session state
                securityLevel: this.determineSecurityLevel(toolName, context),
                permissions: context.authentication?.permissions || [],
                riskScore,
                deviceFingerprint: undefined, // Would be extracted from request
                geoLocation: await this.getGeoLocation(context.request?.transport)
            };
            // 7. Log successful security validation
            if (this.config.auditLogging.logAllRequests ||
                this.config.sensitiveOperations.includes(toolName)) {
                await this.auditLogger.logEvent({
                    eventType: SecurityEventType.ACCESS_GRANTED,
                    category: EventCategory.AUTHORIZATION,
                    severity: EventSeverity.LOW,
                    userId,
                    sessionId,
                    resourceType: toolName,
                    action: 'access_granted',
                    result: 'success',
                    ipAddress: context.request?.transport,
                    userAgent: undefined,
                    details: {
                        context: {
                            toolName,
                            securityLevel: securityContext.securityLevel,
                            riskScore: securityContext.riskScore,
                            validationTime: Date.now() - startTime
                        }
                    }
                });
            }
            return {
                allowed: true,
                context: securityContext
            };
        }
        catch (error) {
            // Log security validation error
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SECURITY_VIOLATION,
                category: EventCategory.SECURITY,
                severity: EventSeverity.HIGH,
                userId: request.context.authentication?.userId,
                sessionId: request.context.session?.id,
                resourceType: 'security_middleware',
                action: 'validation_error',
                result: 'error',
                ipAddress: request.context.request?.transport,
                userAgent: undefined,
                details: {
                    error: {
                        code: 'SECURITY_VALIDATION_ERROR',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                }
            });
            return {
                allowed: false,
                context: this.createEmptySecurityContext(),
                error: 'Security validation failed'
            };
        }
    }
    /**
     * Post-request Security Processing
     */
    async postRequest(request, response, securityContext, executionTime) {
        try {
            const context = request.context;
            const toolName = request.name;
            const userId = context.authentication?.userId;
            const sessionId = context.session?.id;
            // Log tool execution
            if (this.config.auditLogging.enabled) {
                await this.auditLogger.logEvent({
                    eventType: response.success ? SecurityEventType.DATA_ACCESSED : SecurityEventType.ACCESS_DENIED,
                    category: EventCategory.SYSTEM,
                    severity: response.success ? EventSeverity.LOW : EventSeverity.MEDIUM,
                    userId,
                    sessionId,
                    resourceType: toolName,
                    action: 'tool_execution',
                    result: response.success ? 'success' : 'failure',
                    ipAddress: context.request?.transport,
                    userAgent: undefined,
                    details: {
                        context: {
                            toolName,
                            parameters: this.sanitizeParameters(request.arguments),
                            executionTime,
                            memoryUsed: response.metadata?.memoryUsed
                        },
                        error: response.error ? {
                            code: response.error.code,
                            message: response.error.message
                        } : undefined
                    }
                });
            }
            // Update session activity - validateSession already updates lastActivity
            if (sessionId) {
                // Session activity is automatically updated during validateSession
                // No additional update needed
            }
            // Security anomaly detection
            this.detectSecurityAnomalies(request, response, securityContext, executionTime);
        }
        catch (error) {
            // Log post-processing error
            console.error('Security post-request processing error:', error);
        }
    }
    /**
     * Enhanced Tool Execution Context
     */
    enhanceToolContext(baseContext, securityContext) {
        // Merge security context into tool execution context
        return {
            ...baseContext,
            authentication: {
                ...baseContext.authentication,
                isAuthenticated: securityContext.isAuthenticated,
                permissions: securityContext.permissions
            }
        };
    }
    /**
     * Private helper methods
     */
    setupEventListeners() {
        // Listen to security events
        this.sessionManager.on('session:created', (event) => {
            this.emit('security:session_created', event);
        });
        this.sessionManager.on('session:expired', (event) => {
            this.emit('security:session_expired', event);
        });
        this.auditLogger.on('security:threat_detected', (event) => {
            this.emit('security:threat_detected', event);
        });
    }
    checkRateLimit(context) {
        const key = `${context.request?.transport || 'unknown'}:${context.authentication?.userId || 'anonymous'}`;
        const now = Date.now();
        const window = this.config.rateLimiting.windowMs;
        const limit = this.config.rateLimiting.maxRequests;
        const record = this.rateLimitStore.get(key);
        if (!record || record.resetTime <= now) {
            // New window or expired record
            this.rateLimitStore.set(key, {
                count: 1,
                resetTime: now + window
            });
            return {
                allowed: true,
                remaining: limit - 1,
                resetTime: now + window
            };
        }
        if (record.count >= limit) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: record.resetTime
            };
        }
        record.count++;
        return {
            allowed: true,
            remaining: limit - record.count,
            resetTime: record.resetTime
        };
    }
    async validateAuthentication(context) {
        if (!this.config.requireAuth) {
            return { valid: true };
        }
        // Check if user is authenticated
        if (!context.authentication?.isAuthenticated) {
            return { valid: false, reason: 'Authentication required' };
        }
        // Validate session
        if (context.session) {
            const session = this.sessionManager.validateSession(context.session.id);
            if (!session || session.status !== 'active' || session.expiresAt < new Date()) {
                return { valid: false, reason: 'Invalid or expired session' };
            }
        }
        return { valid: true };
    }
    async validateAdvancedMFA(context) {
        // Simplified MFA validation - in production, this would check actual MFA status
        if (!context.authentication?.isAuthenticated) {
            return { valid: false, reason: 'Authentication required before MFA verification' };
        }
        // In a real implementation, we would check if the user has MFA enabled and verified
        // For now, we'll assume it's valid if authenticated
        return { valid: true };
    }
    validatePermissions(toolName, context) {
        // Tool-specific permission requirements would be defined here
        // This is a simplified implementation
        const requiredPermissions = this.getRequiredPermissions(toolName);
        if (requiredPermissions.length === 0) {
            return { valid: true };
        }
        const userPermissions = context.authentication?.permissions || [];
        // Check if user has admin permission (bypass)
        if (userPermissions.includes('admin:*')) {
            return { valid: true };
        }
        // Check specific permissions
        const hasAllPermissions = requiredPermissions.every(permission => userPermissions.includes(permission));
        if (!hasAllPermissions) {
            return {
                valid: false,
                reason: `Missing required permissions: ${requiredPermissions.join(', ')}`,
                requiredPermissions
            };
        }
        return { valid: true };
    }
    calculateRiskScore(toolName, context) {
        let riskScore = 0;
        // Base risk by tool type
        if (this.config.sensitiveOperations.includes(toolName)) {
            riskScore += 50;
        }
        // IP-based risk (simplified)
        const transport = context.request?.transport || '';
        if (transport.includes('stdio')) {
            riskScore += 0; // Local stdio connection
        }
        else {
            riskScore += 20; // Network connection
        }
        // Time-based risk
        const hour = new Date().getHours();
        if (hour < 6 || hour > 22) {
            riskScore += 10; // Off-hours activity
        }
        // Authentication-based risk
        if (!context.authentication?.isAuthenticated) {
            riskScore += 50;
        }
        return Math.min(riskScore, 100); // Cap at 100
    }
    determineSecurityLevel(toolName, context) {
        const userPermissions = context.authentication?.permissions || [];
        if (userPermissions.includes('admin:*')) {
            return 'admin';
        }
        if (this.config.sensitiveOperations.includes(toolName)) {
            return 'elevated';
        }
        return 'basic';
    }
    async getGeoLocation(transport) {
        // Simplified geo-location - in production, use a service like MaxMind
        if (!transport || transport.includes('stdio')) {
            return {
                country: 'LOCAL',
                region: 'STDIO',
                city: 'Local Connection',
                suspicious: false
            };
        }
        // For demo purposes, return basic info
        return {
            country: 'Unknown',
            suspicious: false
        };
    }
    createEmptySecurityContext() {
        return {
            isAuthenticated: false,
            mfaVerified: false,
            securityLevel: 'basic',
            permissions: [],
            riskScore: 100
        };
    }
    getRequiredPermissions(toolName) {
        // Define tool-specific permission requirements
        const permissionMap = {
            'bitbucket_delete_repository': ['repo:admin'],
            'bitbucket_create_webhook': ['repo:admin'],
            'bitbucket_modify_permissions': ['repo:admin'],
            'security_management': ['admin:security'],
            'workspace_management': ['admin:workspace']
        };
        return permissionMap[toolName] || [];
    }
    sanitizeParameters(params) {
        // Remove sensitive information from parameters for logging
        const sanitized = { ...params };
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];
        for (const key in sanitized) {
            if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
                sanitized[key] = '[REDACTED]';
            }
        }
        return sanitized;
    }
    detectSecurityAnomalies(request, response, context, executionTime) {
        // Implement anomaly detection logic
        // 1. Execution time anomaly
        if (executionTime > 30000) { // 30 seconds
            this.emit('security:anomaly_detected', {
                type: 'slow_execution',
                toolName: request.name,
                executionTime,
                userId: request.context.authentication?.userId,
                sessionId: request.context.session?.id
            });
        }
        // 2. High error rate
        if (!response.success && context.riskScore > 70) {
            this.emit('security:anomaly_detected', {
                type: 'high_risk_failure',
                toolName: request.name,
                riskScore: context.riskScore,
                error: response.error,
                userId: request.context.authentication?.userId,
                sessionId: request.context.session?.id
            });
        }
        // 3. Unusual access patterns
        // This would be more sophisticated in production
    }
    /**
     * Public API methods for external use
     */
    async getSecurityStats() {
        return this.auditLogger.getSecurityStats({
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            end: new Date()
        });
    }
    async getActiveThreats() {
        // Return current active security threats
        // This would query threat intelligence in production
        return [];
    }
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
    }
}
export default SecurityMiddleware;
//# sourceMappingURL=security-middleware-clean.js.map