/**
 * Authentication Module Index
 * 
 * This module exports all authentication-related classes and types
 * for the Bitbucket MCP Server authentication system.
 */

// Export main authentication classes
export { AuthenticationManager } from './authentication-manager';
export { OAuthManager } from './oauth-manager';
export { SessionManager } from './session-manager';
export { BitbucketApiClient } from './bitbucket-api-client';
export { AuthenticationMiddleware } from './auth-middleware';
export { TokenManager } from './token-manager';
export { TokenStorage, TokenStorageFactory, MemoryTokenStorage } from './token-storage';

// Export authentication types
export * from '../../types/auth';

// Export default authentication configuration
export const defaultAuthConfig = {
  defaultApplication: {
    name: 'Bitbucket MCP Server',
    description: 'OAuth application for Bitbucket MCP Server integration',
    scopes: [
      'read:repository',
      'write:repository',
      'read:project',
      'write:project',
      'read:pullrequest',
      'write:pullrequest',
      'read:issue',
      'write:issue',
      'read:user',
      'read:team'
    ]
  },
  tokens: {
    accessTokenLifetime: 3600000, // 1 hour
    refreshTokenLifetime: 2592000000, // 30 days
    refreshThreshold: 300000 // 5 minutes before expiry
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
    type: 'memory' as const,
    path: undefined,
    encryptionKey: undefined
  },
  logging: {
    logAuthEvents: true,
    logTokenUsage: true,
    logSecurityEvents: true
  }
};
