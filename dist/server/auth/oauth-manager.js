/**
 * OAuth Manager for Bitbucket MCP Server
 *
 * This module implements OAuth 2.0 authorization code flow for Bitbucket
 * Data Center and Cloud integration. It manages OAuth applications, token
 * exchange, and refresh operations.
 *
 * Key Features:
 * - OAuth 2.0 authorization code flow
 * - Token management and refresh
 * - Application registration and validation
 * - Security and CSRF protection
 * - Error handling and recovery
 *
 * Constitutional Requirements:
 * - OAuth 2.0 compliance
 * - Secure token storage
 * - MCP protocol integration
 * - Comprehensive error handling
 * - Security auditing
 */
import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import { AuthenticationErrorCode } from '../../types/auth';
import { BitbucketApiClient } from './bitbucket-api-client';
/**
 * OAuth Manager Class
 * Manages OAuth 2.0 flows and token operations
 */
export class OAuthManager extends EventEmitter {
    applications = new Map();
    authorizationStates = new Map();
    config;
    constructor(config) {
        super();
        this.config = config;
        this.setupCleanupInterval();
    }
    // ============================================================================
    // OAuth Application Management
    // ============================================================================
    /**
     * Register a new OAuth application
     */
    async registerApplication(request) {
        try {
            // Validate request
            this.validateApplicationRequest(request);
            // Generate application ID
            const applicationId = this.generateApplicationId();
            // Create OAuth application
            const application = {
                id: applicationId,
                name: request.name,
                description: request.description,
                clientId: this.generateClientId(),
                clientSecret: this.generateClientSecret(),
                redirectUri: request.redirectUri,
                instanceType: request.instanceType,
                baseUrl: request.baseUrl,
                scopes: request.scopes || this.config.defaultApplication.scopes,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
            };
            // Store application
            this.applications.set(applicationId, application);
            // Emit event
            this.emit('auth:application:registered', application);
            return {
                success: true,
                data: application,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return this.handleError(error, 'Failed to register OAuth application');
        }
    }
    /**
     * Get OAuth application by ID
     */
    async getApplication(applicationId) {
        try {
            const application = this.applications.get(applicationId);
            if (!application) {
                throw new AuthenticationError({
                    code: AuthenticationErrorCode.APPLICATION_NOT_FOUND,
                    message: `OAuth application not found: ${applicationId}`,
                    timestamp: new Date(),
                    isRecoverable: false
                });
            }
            if (!application.isActive) {
                throw new AuthenticationError({
                    code: AuthenticationErrorCode.APPLICATION_INACTIVE,
                    message: `OAuth application is inactive: ${applicationId}`,
                    timestamp: new Date(),
                    isRecoverable: false
                });
            }
            return {
                success: true,
                data: application,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return this.handleError(error, 'Failed to get OAuth application');
        }
    }
    /**
     * Update OAuth application
     */
    async updateApplication(applicationId, updates) {
        try {
            const application = this.applications.get(applicationId);
            if (!application) {
                throw new AuthenticationError({
                    code: AuthenticationErrorCode.APPLICATION_NOT_FOUND,
                    message: `OAuth application not found: ${applicationId}`,
                    timestamp: new Date(),
                    isRecoverable: false
                });
            }
            // Create updated application
            const updatedApplication = {
                ...application,
                name: updates.name || application.name,
                description: updates.description || application.description,
                redirectUri: updates.redirectUri || application.redirectUri,
                baseUrl: updates.baseUrl || application.baseUrl,
                scopes: updates.scopes || application.scopes,
                updatedAt: new Date()
            };
            // Store updated application
            this.applications.set(applicationId, updatedApplication);
            // Emit event
            this.emit('auth:application:updated', updatedApplication);
            return {
                success: true,
                data: updatedApplication,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return this.handleError(error, 'Failed to update OAuth application');
        }
    }
    // ============================================================================
    // OAuth Authorization Flow
    // ============================================================================
    /**
     * Generate OAuth authorization URL
     */
    async generateAuthorizationUrl(request) {
        try {
            // Get OAuth application
            const appResponse = await this.getApplication(request.applicationId);
            if (!appResponse.success || !appResponse.data) {
                return appResponse;
            }
            const application = appResponse.data;
            // Generate state parameter for CSRF protection
            const state = request.state || this.generateState();
            // Store authorization state
            const authState = {
                state,
                applicationId: application.id,
                redirectUri: application.redirectUri,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            };
            this.authorizationStates.set(state, authState);
            // Build authorization URL
            const authUrl = this.buildAuthorizationUrl(application, state, request.params);
            return {
                success: true,
                data: {
                    authorizationUrl: authUrl,
                    state,
                    expiresAt: authState.expiresAt
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return this.handleError(error, 'Failed to generate authorization URL');
        }
    }
    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(request) {
        try {
            // Validate state parameter
            const authState = this.authorizationStates.get(request.state);
            if (!authState) {
                throw new AuthenticationError({
                    code: AuthenticationErrorCode.STATE_MISMATCH,
                    message: 'Invalid or expired state parameter',
                    timestamp: new Date(),
                    isRecoverable: false
                });
            }
            // Check state expiration
            if (authState.expiresAt < new Date()) {
                this.authorizationStates.delete(request.state);
                throw new AuthenticationError({
                    code: AuthenticationErrorCode.STATE_MISMATCH,
                    message: 'Authorization state has expired',
                    timestamp: new Date(),
                    isRecoverable: false
                });
            }
            // Get OAuth application
            const appResponse = await this.getApplication(request.applicationId);
            if (!appResponse.success || !appResponse.data) {
                return appResponse;
            }
            const application = appResponse.data;
            // Validate redirect URI
            if (request.redirectUri !== application.redirectUri) {
                throw new AuthenticationError({
                    code: AuthenticationErrorCode.INVALID_REDIRECT_URI,
                    message: 'Redirect URI mismatch',
                    timestamp: new Date(),
                    isRecoverable: false
                });
            }
            // Exchange code for tokens via Bitbucket API
            const tokenResponse = await this.exchangeCodeWithBitbucket(application, request.code);
            // Create access token
            const accessToken = {
                token: tokenResponse.access_token,
                tokenType: tokenResponse.token_type || 'Bearer',
                expiresAt: new Date(Date.now() + (tokenResponse.expires_in * 1000)),
                scope: tokenResponse.scope ? tokenResponse.scope.split(' ') : [],
                refreshTokenId: tokenResponse.refresh_token ? this.generateTokenId() : undefined,
                createdAt: new Date(),
                lastUsedAt: new Date(),
                isValid: true
            };
            // Create refresh token if provided
            let refreshToken;
            if (tokenResponse.refresh_token) {
                refreshToken = {
                    id: accessToken.refreshTokenId,
                    token: tokenResponse.refresh_token,
                    expiresAt: new Date(Date.now() + this.config.tokens.refreshTokenLifetime),
                    applicationId: application.id,
                    userId: tokenResponse.user_id || 'unknown',
                    createdAt: new Date(),
                    lastUsedAt: new Date(),
                    isValid: true,
                    isRevoked: false
                };
            }
            // Clean up authorization state
            this.authorizationStates.delete(request.state);
            return {
                success: true,
                data: {
                    accessToken,
                    refreshToken: refreshToken
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return this.handleError(error, 'Failed to exchange code for tokens');
        }
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(request) {
        try {
            // Get OAuth application
            const appResponse = await this.getApplication(request.applicationId);
            if (!appResponse.success || !appResponse.data) {
                return appResponse;
            }
            const application = appResponse.data;
            // Get refresh token (this would typically come from secure storage)
            const refreshToken = await this.getRefreshToken(request.refreshTokenId);
            if (!refreshToken) {
                throw new AuthenticationError({
                    code: AuthenticationErrorCode.TOKEN_INVALID,
                    message: 'Refresh token not found or invalid',
                    timestamp: new Date(),
                    isRecoverable: false
                });
            }
            // Check refresh token validity
            if (!refreshToken.isValid || refreshToken.isRevoked || refreshToken.expiresAt < new Date()) {
                throw new AuthenticationError({
                    code: AuthenticationErrorCode.TOKEN_EXPIRED,
                    message: 'Refresh token is expired or revoked',
                    timestamp: new Date(),
                    isRecoverable: false
                });
            }
            // Refresh token via Bitbucket API
            const tokenResponse = await this.refreshTokenWithBitbucket(application, refreshToken.token);
            // Create new access token
            const newAccessToken = {
                token: tokenResponse.access_token,
                tokenType: tokenResponse.token_type || 'Bearer',
                expiresAt: new Date(Date.now() + (tokenResponse.expires_in * 1000)),
                scope: tokenResponse.scope ? tokenResponse.scope.split(' ') : [],
                refreshTokenId: refreshToken.id,
                createdAt: new Date(),
                lastUsedAt: new Date(),
                isValid: true
            };
            // Update refresh token usage
            refreshToken.lastUsedAt = new Date();
            return {
                success: true,
                data: newAccessToken,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return this.handleError(error, 'Failed to refresh access token');
        }
    }
    // ============================================================================
    // Private Helper Methods
    // ============================================================================
    validateApplicationRequest(request) {
        if (!request.name || request.name.trim().length === 0) {
            throw new AuthenticationError({
                code: AuthenticationErrorCode.INVALID_REQUEST,
                message: 'Application name is required',
                timestamp: new Date(),
                isRecoverable: true
            });
        }
        if (!request.redirectUri || !this.isValidUrl(request.redirectUri)) {
            throw new AuthenticationError({
                code: AuthenticationErrorCode.INVALID_REDIRECT_URI,
                message: 'Valid redirect URI is required',
                timestamp: new Date(),
                isRecoverable: true
            });
        }
        if (!request.baseUrl || !this.isValidUrl(request.baseUrl)) {
            throw new AuthenticationError({
                code: AuthenticationErrorCode.INVALID_REQUEST,
                message: 'Valid base URL is required',
                timestamp: new Date(),
                isRecoverable: true
            });
        }
    }
    buildAuthorizationUrl(application, state, params) {
        const url = new URL(`${application.baseUrl}/site/oauth2/authorize`);
        url.searchParams.set('client_id', application.clientId);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('redirect_uri', application.redirectUri);
        url.searchParams.set('state', state);
        url.searchParams.set('scope', application.scopes.join(' '));
        // Add additional parameters
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
        }
        return url.toString();
    }
    async exchangeCodeWithBitbucket(application, code) {
        const apiClient = new BitbucketApiClient(application.baseUrl, application.instanceType);
        try {
            const response = await apiClient.exchangeCodeForToken(application.clientId, application.clientSecret, code, application.redirectUri);
            return response;
        }
        catch (error) {
            // Re-throw authentication errors as-is
            if (error instanceof AuthenticationError) {
                throw error;
            }
            // Wrap other errors
            throw new AuthenticationError({
                code: AuthenticationErrorCode.NETWORK_ERROR,
                message: `Failed to exchange code with Bitbucket: ${error.message}`,
                details: { originalError: error.message },
                timestamp: new Date(),
                isRecoverable: true
            });
        }
    }
    async refreshTokenWithBitbucket(application, refreshToken) {
        const apiClient = new BitbucketApiClient(application.baseUrl, application.instanceType);
        try {
            const response = await apiClient.refreshAccessToken(application.clientId, application.clientSecret, refreshToken);
            return response;
        }
        catch (error) {
            // Re-throw authentication errors as-is
            if (error instanceof AuthenticationError) {
                throw error;
            }
            // Wrap other errors
            throw new AuthenticationError({
                code: AuthenticationErrorCode.NETWORK_ERROR,
                message: `Failed to refresh token with Bitbucket: ${error.message}`,
                details: { originalError: error.message },
                timestamp: new Date(),
                isRecoverable: true
            });
        }
    }
    async getRefreshToken(tokenId) {
        // This would retrieve from secure storage
        // For testing purposes, we'll simulate a token lookup
        // In a real implementation, this would query the token storage
        return null;
    }
    generateApplicationId() {
        return `app_${randomBytes(16).toString('hex')}`;
    }
    generateClientId() {
        return randomBytes(32).toString('hex');
    }
    generateClientSecret() {
        return randomBytes(64).toString('hex');
    }
    generateState() {
        return randomBytes(32).toString('hex');
    }
    generateTokenId() {
        return `token_${randomBytes(16).toString('hex')}`;
    }
    generateAccessToken() {
        return `access_${randomBytes(32).toString('hex')}`;
    }
    generateRefreshToken() {
        return `refresh_${randomBytes(32).toString('hex')}`;
    }
    generateRequestId() {
        return `req_${randomBytes(8).toString('hex')}`;
    }
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    setupCleanupInterval() {
        // Clean up expired authorization states every 5 minutes
        setInterval(() => {
            const now = new Date();
            for (const [state, authState] of this.authorizationStates.entries()) {
                if (authState.expiresAt < now) {
                    this.authorizationStates.delete(state);
                }
            }
        }, 5 * 60 * 1000);
    }
    handleError(error, context) {
        let authError;
        if (error instanceof AuthenticationError) {
            authError = error;
        }
        else {
            authError = {
                code: error.code || AuthenticationErrorCode.INTERNAL_ERROR,
                message: error.message || context,
                details: error.details,
                timestamp: new Date(),
                isRecoverable: error.isRecoverable !== undefined ? error.isRecoverable : true
            };
        }
        this.emit('auth:error', authError);
        return {
            success: false,
            error: authError,
            metadata: {
                timestamp: new Date(),
                requestId: this.generateRequestId(),
                processingTime: 0
            }
        };
    }
}
//# sourceMappingURL=oauth-manager.js.map