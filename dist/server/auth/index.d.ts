/**
 * Authentication Module Index
 *
 * This module exports all authentication-related classes and types
 * for the Bitbucket MCP Server authentication system.
 */
export { AuthenticationManager } from './authentication-manager';
export { OAuthManager } from './oauth-manager';
export { SessionManager } from './session-manager';
export { BitbucketApiClient } from './bitbucket-api-client';
export { AuthenticationMiddleware } from './auth-middleware';
export { TokenManager } from './token-manager';
export { TokenStorage, TokenStorageFactory, MemoryTokenStorage } from './token-storage';
export { MCPAuthIntegration } from './mcp-auth-integration';
export { MCPAuthMiddleware } from './mcp-auth-middleware';
export { MCPServerAuthIntegration } from './mcp-server-auth-integration';
export { BitbucketAuthenticatedClient, BitbucketAPIConfig } from './bitbucket-authenticated-client';
export { BitbucketAPIManager, BitbucketInstanceConfig } from './bitbucket-api-manager';
export { BitbucketToolsIntegration } from './bitbucket-tools-integration';
export { AdvancedSessionManager, SessionConfig, SessionStatistics } from './advanced-session-manager';
export { SessionPersistenceManager, SessionPersistenceConfig } from './session-persistence';
export { ConcurrentSessionManager, ConcurrentSessionConfig } from './concurrent-session-manager';
export { AdvancedCryptoService, EncryptedData, CryptoConfig, KeyManager } from './advanced-crypto';
export { AuthAuditLogger, AuditEvent, AuditEventType, AuditSeverity, AuditConfig, AuditStats } from './auth-audit-logger';
export { RateLimiter, RateLimitRule, RateLimitResult, RateLimitConfig, RateLimitStats, RateLimitAlgorithm, RateLimitScope } from './rate-limiter';
export { SecurityHeadersManager, SecurityHeadersConfig, CorsConfig, CspConfig, SecurityHeaderType } from './security-headers';
export { AuthenticationErrorHandler, ErrorRecoveryStrategy, ErrorRecoveryConfig, ErrorRecoveryResult, UserFriendlyError, FallbackAuthMethod } from './auth-error-handler';
export * from '../../types/auth';
export declare const defaultAuthConfig: {
    defaultApplication: {
        name: string;
        description: string;
        scopes: string[];
    };
    tokens: {
        accessTokenLifetime: number;
        refreshTokenLifetime: number;
        refreshThreshold: number;
    };
    sessions: {
        maxConcurrentSessions: number;
        sessionTimeout: number;
        activityTimeout: number;
    };
    security: {
        encryptTokens: boolean;
        requireHttps: boolean;
        csrfProtection: boolean;
        rateLimitRequests: boolean;
    };
    storage: {
        type: "memory";
        path: undefined;
        encryptionKey: undefined;
    };
    logging: {
        logAuthEvents: boolean;
        logTokenUsage: boolean;
        logSecurityEvents: boolean;
    };
};
//# sourceMappingURL=index.d.ts.map