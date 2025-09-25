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
import { AuthenticationErrorCode } from '../../types/auth';
/**
 * Error Recovery Strategy
 * Defines how to handle different types of authentication errors
 */
export var ErrorRecoveryStrategy;
(function (ErrorRecoveryStrategy) {
    /** Retry the operation with exponential backoff */
    ErrorRecoveryStrategy["RETRY"] = "retry";
    /** Refresh the access token and retry */
    ErrorRecoveryStrategy["REFRESH_TOKEN"] = "refresh_token";
    /** Re-authenticate the user */
    ErrorRecoveryStrategy["REAUTHENTICATE"] = "reauthenticate";
    /** Use fallback authentication method */
    ErrorRecoveryStrategy["FALLBACK"] = "fallback";
    /** Fail the operation without recovery */
    ErrorRecoveryStrategy["FAIL"] = "fail";
})(ErrorRecoveryStrategy || (ErrorRecoveryStrategy = {}));
/**
 * Authentication Error Handler Class
 * Handles authentication errors with comprehensive recovery mechanisms
 */
export class AuthenticationErrorHandler extends EventEmitter {
    config;
    tokenStorage;
    apiManager;
    cryptoService;
    fallbackMethods = new Map();
    recoveryStats = new Map();
    constructor(config, tokenStorage, apiManager, cryptoService) {
        super();
        this.config = config;
        this.tokenStorage = tokenStorage;
        this.apiManager = apiManager;
        this.cryptoService = cryptoService;
        this.setupFallbackMethods();
        this.setupEventHandlers();
    }
    // ============================================================================
    // Error Classification and Handling
    // ============================================================================
    /**
     * Handle authentication error with appropriate recovery strategy
     */
    async handleError(error, context = {}) {
        const startTime = Date.now();
        const retryCount = context.retryCount || 0;
        try {
            // Classify the error and determine recovery strategy
            const strategy = this.classifyError(error);
            if (this.config.logRecoveryAttempts) {
                this.emit('recovery:attempted', {
                    error,
                    strategy,
                    retryCount,
                    context
                });
            }
            // Execute recovery strategy
            const result = await this.executeRecoveryStrategy(strategy, error, context);
            const recoveryTime = Date.now() - startTime;
            const recoveryResult = {
                success: result.success,
                strategy,
                attempts: retryCount + 1,
                recoveryTime,
                originalError: error,
                result: result.data,
                error: result.error
            };
            // Update recovery statistics
            this.updateRecoveryStats(strategy, recoveryResult.success);
            this.emit('recovery:completed', recoveryResult);
            return recoveryResult;
        }
        catch (recoveryError) {
            const recoveryTime = Date.now() - startTime;
            const recoveryResult = {
                success: false,
                strategy: ErrorRecoveryStrategy.FAIL,
                attempts: retryCount + 1,
                recoveryTime,
                originalError: error,
                error: this.createAuthenticationError(AuthenticationErrorCode.INTERNAL_ERROR, `Recovery failed: ${recoveryError.message}`, { originalError: error, recoveryError })
            };
            this.emit('recovery:failed', recoveryResult);
            return recoveryResult;
        }
    }
    /**
     * Classify error and determine appropriate recovery strategy
     */
    classifyError(error) {
        switch (error.code) {
            // Token-related errors - try refresh first
            case AuthenticationErrorCode.TOKEN_EXPIRED:
            case AuthenticationErrorCode.TOKEN_INVALID:
                return this.config.enableTokenRefresh
                    ? ErrorRecoveryStrategy.REFRESH_TOKEN
                    : ErrorRecoveryStrategy.REAUTHENTICATE;
            // Network errors - retry with backoff
            case AuthenticationErrorCode.NETWORK_ERROR:
            case AuthenticationErrorCode.TIMEOUT_ERROR:
            case AuthenticationErrorCode.CONNECTION_ERROR:
                return ErrorRecoveryStrategy.RETRY;
            // Session errors - re-authenticate
            case AuthenticationErrorCode.SESSION_EXPIRED:
            case AuthenticationErrorCode.SESSION_INVALID:
            case AuthenticationErrorCode.SESSION_NOT_FOUND:
                return ErrorRecoveryStrategy.REAUTHENTICATE;
            // OAuth flow errors - re-authenticate
            case AuthenticationErrorCode.INVALID_GRANT:
            case AuthenticationErrorCode.UNAUTHORIZED_CLIENT:
                return ErrorRecoveryStrategy.REAUTHENTICATE;
            // Application errors - try fallback
            case AuthenticationErrorCode.APPLICATION_NOT_FOUND:
            case AuthenticationErrorCode.APPLICATION_INACTIVE:
                return this.config.enableFallbackAuth
                    ? ErrorRecoveryStrategy.FALLBACK
                    : ErrorRecoveryStrategy.FAIL;
            // Security errors - fail immediately
            case AuthenticationErrorCode.CSRF_TOKEN_MISMATCH:
            case AuthenticationErrorCode.STATE_MISMATCH:
                return ErrorRecoveryStrategy.FAIL;
            // Default - retry once, then fail
            default:
                return ErrorRecoveryStrategy.RETRY;
        }
    }
    /**
     * Execute recovery strategy
     */
    async executeRecoveryStrategy(strategy, error, context) {
        switch (strategy) {
            case ErrorRecoveryStrategy.RETRY:
                return this.retryWithBackoff(error, context);
            case ErrorRecoveryStrategy.REFRESH_TOKEN:
                return this.refreshTokenAndRetry(error, context);
            case ErrorRecoveryStrategy.REAUTHENTICATE:
                return this.reauthenticateUser(error, context);
            case ErrorRecoveryStrategy.FALLBACK:
                return this.useFallbackAuthentication(error, context);
            case ErrorRecoveryStrategy.FAIL:
            default:
                return { success: false, error };
        }
    }
    // ============================================================================
    // Recovery Strategies Implementation
    // ============================================================================
    /**
     * Retry operation with exponential backoff
     */
    async retryWithBackoff(error, context) {
        const retryCount = context.retryCount || 0;
        if (retryCount >= this.config.maxRetries) {
            return { success: false, error };
        }
        // Calculate delay with exponential backoff
        const delay = Math.min(this.config.baseDelay * Math.pow(2, retryCount), this.config.maxDelay);
        // Wait before retry
        await this.sleep(delay);
        // Emit retry event
        this.emit('recovery:retry', {
            error,
            retryCount: retryCount + 1,
            delay
        });
        // Return indication that retry should be attempted
        return { success: true, data: { shouldRetry: true, retryCount: retryCount + 1 } };
    }
    /**
     * Refresh access token and retry operation
     */
    async refreshTokenAndRetry(error, context) {
        try {
            if (!context.sessionId) {
                return { success: false, error };
            }
            // Get current session and refresh token
            const session = await this.getSessionById(context.sessionId);
            if (!session || !session.refreshToken) {
                return { success: false, error };
            }
            // Attempt to refresh the token
            const newToken = await this.refreshAccessToken(session.refreshToken);
            if (!newToken) {
                return { success: false, error };
            }
            // Update session with new token
            await this.updateSessionToken(context.sessionId, newToken);
            this.emit('recovery:token-refreshed', {
                sessionId: context.sessionId,
                newToken
            });
            return { success: true, data: { newToken } };
        }
        catch (refreshError) {
            return {
                success: false,
                error: this.createAuthenticationError(AuthenticationErrorCode.TOKEN_INVALID, `Token refresh failed: ${refreshError.message}`, { originalError: error, refreshError })
            };
        }
    }
    /**
     * Re-authenticate user
     */
    async reauthenticateUser(error, context) {
        try {
            // Clear current session
            if (context.sessionId) {
                await this.clearSession(context.sessionId);
            }
            // Emit re-authentication required event
            this.emit('recovery:reauthentication-required', {
                userId: context.userId,
                sessionId: context.sessionId,
                reason: error.message
            });
            return { success: true, data: { requiresReauthentication: true } };
        }
        catch (reauthError) {
            return {
                success: false,
                error: this.createAuthenticationError(AuthenticationErrorCode.AUTHENTICATION_FAILED, `Re-authentication failed: ${reauthError.message}`, { originalError: error, reauthError })
            };
        }
    }
    /**
     * Use fallback authentication method
     */
    async useFallbackAuthentication(error, context) {
        try {
            // Find available fallback method
            const fallbackMethod = this.getAvailableFallbackMethod();
            if (!fallbackMethod) {
                return { success: false, error };
            }
            // Attempt fallback authentication
            const result = await this.attemptFallbackAuth(fallbackMethod, context);
            this.emit('recovery:fallback-used', {
                method: fallbackMethod.id,
                success: result.success,
                context
            });
            return result;
        }
        catch (fallbackError) {
            return {
                success: false,
                error: this.createAuthenticationError(AuthenticationErrorCode.AUTHENTICATION_FAILED, `Fallback authentication failed: ${fallbackError.message}`, { originalError: error, fallbackError })
            };
        }
    }
    // ============================================================================
    // User-Friendly Error Messages
    // ============================================================================
    /**
     * Get user-friendly error message
     */
    getUserFriendlyError(error) {
        const errorMap = {
            [AuthenticationErrorCode.INVALID_CLIENT]: {
                code: 'invalid_client',
                title: 'Aplicação não autorizada',
                description: 'A aplicação não está autorizada a acessar o Bitbucket.',
                action: 'Verifique as credenciais da aplicação OAuth.',
                recoverable: true,
                helpUrl: '/help/oauth-setup'
            },
            [AuthenticationErrorCode.INVALID_GRANT]: {
                code: 'invalid_grant',
                title: 'Autorização inválida',
                description: 'O código de autorização é inválido ou expirou.',
                action: 'Tente fazer login novamente.',
                recoverable: true
            },
            [AuthenticationErrorCode.TOKEN_EXPIRED]: {
                code: 'token_expired',
                title: 'Sessão expirada',
                description: 'Sua sessão expirou. Renovando automaticamente...',
                action: 'Aguarde enquanto renovamos sua sessão.',
                recoverable: true
            },
            [AuthenticationErrorCode.TOKEN_INVALID]: {
                code: 'token_invalid',
                title: 'Token inválido',
                description: 'O token de acesso é inválido.',
                action: 'Faça login novamente.',
                recoverable: true
            },
            [AuthenticationErrorCode.NETWORK_ERROR]: {
                code: 'network_error',
                title: 'Erro de conexão',
                description: 'Não foi possível conectar ao Bitbucket.',
                action: 'Verifique sua conexão com a internet e tente novamente.',
                recoverable: true
            },
            [AuthenticationErrorCode.TIMEOUT_ERROR]: {
                code: 'timeout_error',
                title: 'Timeout da conexão',
                description: 'A operação demorou muito para ser concluída.',
                action: 'Tente novamente em alguns momentos.',
                recoverable: true
            },
            [AuthenticationErrorCode.SESSION_EXPIRED]: {
                code: 'session_expired',
                title: 'Sessão expirada',
                description: 'Sua sessão expirou por inatividade.',
                action: 'Faça login novamente.',
                recoverable: true
            },
            [AuthenticationErrorCode.APPLICATION_NOT_FOUND]: {
                code: 'application_not_found',
                title: 'Aplicação não encontrada',
                description: 'A aplicação OAuth não foi encontrada.',
                action: 'Verifique a configuração da aplicação.',
                recoverable: false,
                helpUrl: '/help/oauth-setup'
            },
            [AuthenticationErrorCode.CSRF_TOKEN_MISMATCH]: {
                code: 'csrf_token_mismatch',
                title: 'Erro de segurança',
                description: 'Detectado possível ataque CSRF.',
                action: 'Recarregue a página e tente novamente.',
                recoverable: true
            },
            [AuthenticationErrorCode.AUTHENTICATION_FAILED]: {
                code: 'authentication_failed',
                title: 'Falha na autenticação',
                description: 'Não foi possível autenticar com o Bitbucket.',
                action: 'Verifique suas credenciais e tente novamente.',
                recoverable: true
            },
            [AuthenticationErrorCode.INTERNAL_ERROR]: {
                code: 'internal_error',
                title: 'Erro interno',
                description: 'Ocorreu um erro interno no servidor.',
                action: 'Tente novamente mais tarde ou entre em contato com o suporte.',
                recoverable: false
            }
        };
        return errorMap[error.code] || {
            code: 'unknown_error',
            title: 'Erro desconhecido',
            description: 'Ocorreu um erro inesperado.',
            action: 'Tente novamente ou entre em contato com o suporte.',
            recoverable: false
        };
    }
    // ============================================================================
    // Fallback Authentication Methods
    // ============================================================================
    /**
     * Setup fallback authentication methods
     */
    setupFallbackMethods() {
        // Basic token authentication fallback
        this.fallbackMethods.set('basic_token', {
            id: 'basic_token',
            name: 'Autenticação por Token Básico',
            description: 'Usa token de acesso direto quando OAuth falha',
            available: true,
            priority: 1,
            config: {
                requiresToken: true,
                supportsRefresh: false
            }
        });
        // Session-based authentication fallback
        this.fallbackMethods.set('session_auth', {
            id: 'session_auth',
            name: 'Autenticação por Sessão',
            description: 'Usa sessão existente quando disponível',
            available: true,
            priority: 2,
            config: {
                requiresSession: true,
                supportsRefresh: true
            }
        });
        // Anonymous access fallback (limited functionality)
        this.fallbackMethods.set('anonymous', {
            id: 'anonymous',
            name: 'Acesso Anônimo',
            description: 'Acesso limitado sem autenticação',
            available: true,
            priority: 3,
            config: {
                limitedAccess: true,
                readOnly: true
            }
        });
    }
    /**
     * Get available fallback method
     */
    getAvailableFallbackMethod() {
        const availableMethods = Array.from(this.fallbackMethods.values())
            .filter(method => method.available)
            .sort((a, b) => a.priority - b.priority);
        return availableMethods.length > 0 ? availableMethods[0] : null;
    }
    /**
     * Attempt fallback authentication
     */
    async attemptFallbackAuth(method, context) {
        try {
            switch (method.id) {
                case 'basic_token':
                    return this.attemptBasicTokenAuth(context);
                case 'session_auth':
                    return this.attemptSessionAuth(context);
                case 'anonymous':
                    return this.attemptAnonymousAuth(context);
                default:
                    return { success: false, error: this.createAuthenticationError(AuthenticationErrorCode.AUTHENTICATION_FAILED, `Unsupported fallback method: ${method.id}`) };
            }
        }
        catch (error) {
            return {
                success: false,
                error: this.createAuthenticationError(AuthenticationErrorCode.AUTHENTICATION_FAILED, `Fallback authentication failed: ${error.message}`)
            };
        }
    }
    /**
     * Attempt basic token authentication
     */
    async attemptBasicTokenAuth(context) {
        // Implementation would depend on available token in context
        // For now, return failure
        return {
            success: false,
            error: this.createAuthenticationError(AuthenticationErrorCode.TOKEN_MISSING, 'No basic token available for fallback authentication')
        };
    }
    /**
     * Attempt session-based authentication
     */
    async attemptSessionAuth(context) {
        if (!context.sessionId) {
            return {
                success: false,
                error: this.createAuthenticationError(AuthenticationErrorCode.SESSION_NOT_FOUND, 'No session available for fallback authentication')
            };
        }
        // Check if session is still valid
        const session = await this.getSessionById(context.sessionId);
        if (!session || !session.isActive()) {
            return {
                success: false,
                error: this.createAuthenticationError(AuthenticationErrorCode.SESSION_EXPIRED, 'Session is not active for fallback authentication')
            };
        }
        return { success: true, data: { session } };
    }
    /**
     * Attempt anonymous authentication
     */
    async attemptAnonymousAuth(context) {
        // Create limited anonymous session
        const anonymousSession = {
            id: 'anonymous',
            userId: 'anonymous',
            permissions: ['read:public'],
            isActive: () => true,
            isExpired: () => false
        };
        return { success: true, data: { session: anonymousSession } };
    }
    // ============================================================================
    // Helper Methods
    // ============================================================================
    /**
     * Create authentication error
     */
    createAuthenticationError(code, message, details) {
        return {
            code,
            message,
            details,
            timestamp: new Date(),
            isRecoverable: this.isRecoverableError(code)
        };
    }
    /**
     * Check if error is recoverable
     */
    isRecoverableError(code) {
        const nonRecoverableErrors = [
            AuthenticationErrorCode.CSRF_TOKEN_MISMATCH,
            AuthenticationErrorCode.STATE_MISMATCH,
            AuthenticationErrorCode.APPLICATION_NOT_FOUND
        ];
        return !nonRecoverableErrors.includes(code);
    }
    /**
     * Update recovery statistics
     */
    updateRecoveryStats(strategy, success) {
        const key = `${strategy}_${success ? 'success' : 'failure'}`;
        const current = this.recoveryStats.get(key) || 0;
        this.recoveryStats.set(key, current + 1);
    }
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Handle token storage events
        this.tokenStorage.on('token:expired', (data) => {
            this.emit('error:token-expired', data);
        });
        this.tokenStorage.on('token:invalid', (data) => {
            this.emit('error:token-invalid', data);
        });
        // Handle API manager events
        this.apiManager.on('request:failed', (data) => {
            this.emit('error:api-request-failed', data);
        });
    }
    // ============================================================================
    // Public API Methods (Placeholders for actual implementation)
    // ============================================================================
    async getSessionById(sessionId) {
        // Placeholder - would integrate with actual session manager
        return null;
    }
    async refreshAccessToken(refreshToken) {
        // Placeholder - would integrate with actual token manager
        return null;
    }
    async updateSessionToken(sessionId, newToken) {
        // Placeholder - would integrate with actual session manager
    }
    async clearSession(sessionId) {
        // Placeholder - would integrate with actual session manager
    }
    // ============================================================================
    // Statistics and Monitoring
    // ============================================================================
    /**
     * Get error recovery statistics
     */
    getRecoveryStats() {
        return Object.fromEntries(this.recoveryStats);
    }
    /**
     * Get available fallback methods
     */
    getAvailableFallbackMethods() {
        return Array.from(this.fallbackMethods.values())
            .filter(method => method.available)
            .sort((a, b) => a.priority - b.priority);
    }
    /**
     * Reset recovery statistics
     */
    resetStats() {
        this.recoveryStats.clear();
    }
    /**
     * Destroy the error handler and clean up resources
     */
    destroy() {
        this.removeAllListeners();
        this.fallbackMethods.clear();
        this.recoveryStats.clear();
    }
}
//# sourceMappingURL=auth-error-handler.js.map