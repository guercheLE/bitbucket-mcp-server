/**
 * Authentication Error Handler for Bitbucket MCP Server
 *
 * This module provides comprehensive error handling for authentication failures,
 * including automatic recovery mechanisms, user-friendly error messages, and
 * fallback authentication methods.
 *
 * Key Features:
 * - Comprehensive error classification and handling
 * - Automatic token refresh on expiration
 * - Network failure recovery mechanisms
 * - User-friendly error messages
 * - Fallback authentication methods
 * - Error logging and monitoring
 *
 * Constitutional Requirements:
 * - Comprehensive error handling
 * - Automatic recovery mechanisms
 * - User-friendly error messages
 * - Security compliance
 * - Performance optimization
 */
import { EventEmitter } from 'events';
import { AuthenticationError } from '../../types/auth';
import { AdvancedCryptoService } from './advanced-crypto';
import { TokenStorage } from './token-storage';
import { BitbucketAPIManager } from './bitbucket-api-manager';
/**
 * Error Recovery Strategy
 * Defines how to handle different types of authentication errors
 */
export declare enum ErrorRecoveryStrategy {
    /** Retry the operation with exponential backoff */
    RETRY = "retry",
    /** Refresh the access token and retry */
    REFRESH_TOKEN = "refresh_token",
    /** Re-authenticate the user */
    REAUTHENTICATE = "reauthenticate",
    /** Use fallback authentication method */
    FALLBACK = "fallback",
    /** Fail the operation without recovery */
    FAIL = "fail"
}
/**
 * Error Recovery Configuration
 * Configuration for error recovery mechanisms
 */
export interface ErrorRecoveryConfig {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Base delay for exponential backoff in milliseconds */
    baseDelay: number;
    /** Maximum delay between retries in milliseconds */
    maxDelay: number;
    /** Whether to enable automatic token refresh */
    enableTokenRefresh: boolean;
    /** Whether to enable fallback authentication */
    enableFallbackAuth: boolean;
    /** Timeout for network operations in milliseconds */
    networkTimeout: number;
    /** Whether to log all error recovery attempts */
    logRecoveryAttempts: boolean;
}
/**
 * Error Recovery Result
 * Result of an error recovery attempt
 */
export interface ErrorRecoveryResult {
    /** Whether recovery was successful */
    success: boolean;
    /** Recovery strategy used */
    strategy: ErrorRecoveryStrategy;
    /** Number of attempts made */
    attempts: number;
    /** Total time spent on recovery in milliseconds */
    recoveryTime: number;
    /** Error that caused the recovery attempt */
    originalError: AuthenticationError;
    /** Final result after recovery */
    result?: any;
    /** Error if recovery failed */
    error?: AuthenticationError;
}
/**
 * User-Friendly Error Message
 * Localized and user-friendly error message
 */
export interface UserFriendlyError {
    /** Error code */
    code: string;
    /** User-friendly title */
    title: string;
    /** User-friendly description */
    description: string;
    /** Suggested action for the user */
    action: string;
    /** Whether the error is recoverable */
    recoverable: boolean;
    /** Additional help information */
    helpUrl?: string;
}
/**
 * Fallback Authentication Method
 * Alternative authentication method when primary fails
 */
export interface FallbackAuthMethod {
    /** Method identifier */
    id: string;
    /** Method name */
    name: string;
    /** Method description */
    description: string;
    /** Whether method is available */
    available: boolean;
    /** Priority (lower number = higher priority) */
    priority: number;
    /** Method configuration */
    config: Record<string, any>;
}
/**
 * Authentication Error Handler Class
 * Handles authentication errors with comprehensive recovery mechanisms
 */
export declare class AuthenticationErrorHandler extends EventEmitter {
    private config;
    private tokenStorage;
    private apiManager;
    private cryptoService;
    private fallbackMethods;
    private recoveryStats;
    constructor(config: ErrorRecoveryConfig, tokenStorage: TokenStorage, apiManager: BitbucketAPIManager, cryptoService: AdvancedCryptoService);
    /**
     * Handle authentication error with appropriate recovery strategy
     */
    handleError(error: AuthenticationError, context?: {
        sessionId?: string;
        userId?: string;
        operation?: string;
        retryCount?: number;
    }): Promise<ErrorRecoveryResult>;
    /**
     * Classify error and determine appropriate recovery strategy
     */
    private classifyError;
    /**
     * Execute recovery strategy
     */
    private executeRecoveryStrategy;
    /**
     * Retry operation with exponential backoff
     */
    private retryWithBackoff;
    /**
     * Refresh access token and retry operation
     */
    private refreshTokenAndRetry;
    /**
     * Re-authenticate user
     */
    private reauthenticateUser;
    /**
     * Use fallback authentication method
     */
    private useFallbackAuthentication;
    /**
     * Get user-friendly error message
     */
    getUserFriendlyError(error: AuthenticationError): UserFriendlyError;
    /**
     * Setup fallback authentication methods
     */
    private setupFallbackMethods;
    /**
     * Get available fallback method
     */
    private getAvailableFallbackMethod;
    /**
     * Attempt fallback authentication
     */
    private attemptFallbackAuth;
    /**
     * Attempt basic token authentication
     */
    private attemptBasicTokenAuth;
    /**
     * Attempt session-based authentication
     */
    private attemptSessionAuth;
    /**
     * Attempt anonymous authentication
     */
    private attemptAnonymousAuth;
    /**
     * Create authentication error
     */
    private createAuthenticationError;
    /**
     * Check if error is recoverable
     */
    private isRecoverableError;
    /**
     * Update recovery statistics
     */
    private updateRecoveryStats;
    /**
     * Sleep utility
     */
    private sleep;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    private getSessionById;
    private refreshAccessToken;
    private updateSessionToken;
    private clearSession;
    /**
     * Get error recovery statistics
     */
    getRecoveryStats(): Record<string, number>;
    /**
     * Get available fallback methods
     */
    getAvailableFallbackMethods(): FallbackAuthMethod[];
    /**
     * Reset recovery statistics
     */
    resetStats(): void;
    /**
     * Destroy the error handler and clean up resources
     */
    destroy(): void;
}
//# sourceMappingURL=auth-error-handler.d.ts.map