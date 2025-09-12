import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  BitbucketConfig,
  ServerType,
  AuthType,
  OAuthCredentials,
  AppPasswordCredentials,
  ApiTokenCredentials,
  BasicCredentials,
} from '@/types/config';
import { User } from '@/types/bitbucket';
import { AuthenticationError, createAuthenticationError } from '@/types/errors';
import { configService } from './config.service';
import { loggerService } from './logger.service';
import { errorHandlerService } from './error-handler.service';

export interface AuthResult {
  success: boolean;
  user?: User;
  accessToken?: string | undefined;
  refreshToken?: string | undefined;
  expiresAt?: Date | undefined;
  error?: AuthenticationError;
}

export interface Session {
  id: string;
  user: User;
  accessToken?: string | undefined;
  refreshToken?: string | undefined;
  expiresAt: Date;
  isValid(): boolean;
}

export class AuthService {
  private static instance: AuthService;
  private sessions: Map<string, Session> = new Map();
  private logger = loggerService.getLogger('auth-service');

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async authenticate(config: BitbucketConfig): Promise<AuthResult> {
    const startTime = Date.now();

    try {
      this.logger.info('Starting authentication', {
        serverType: config.serverType,
        authType: config.auth.type,
        baseUrl: config.baseUrl,
      });

      const result = await this.performAuthentication(config);

      loggerService.logAuthentication(config.serverType, config.auth.type, result.success, {
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      const authError = errorHandlerService.handleError(error, {
        operation: 'authenticate',
        serverType: config.serverType,
        authType: config.auth.type,
      }) as AuthenticationError;

      loggerService.logAuthentication(config.serverType, config.auth.type, false, {
        duration: Date.now() - startTime,
        error: authError.message,
      });

      return {
        success: false,
        error: authError,
      };
    }
  }

  public async detectServerType(baseUrl: string): Promise<ServerType | null> {
    try {
      this.logger.debug('Detecting server type', { baseUrl });

      // Try to access the API endpoint to determine server type
      const response = await axios.get(`${baseUrl}/rest/api/1.0/application-properties`, {
        timeout: 5000,
        validateStatus: () => true, // Don't throw on any status
      });

      if (response.status === 200) {
        this.logger.debug('Detected Data Center server', { baseUrl });
        return 'datacenter';
      }

      // Try Cloud API endpoint
      const cloudResponse = await axios.get(`${baseUrl}/2.0/user`, {
        timeout: 5000,
        validateStatus: () => true,
      });

      if (cloudResponse.status === 200 || cloudResponse.status === 401) {
        this.logger.debug('Detected Cloud server', { baseUrl });
        return 'cloud';
      }

      this.logger.warn('Could not determine server type', { baseUrl, status: response.status });
      return null;
    } catch (error) {
      this.logger.warn('Server type detection failed', {
        baseUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  public async refreshToken(config: BitbucketConfig): Promise<AuthResult> {
    if (config.auth.type !== 'oauth') {
      return {
        success: false,
        error: createAuthenticationError(
          'INVALID_CREDENTIALS',
          'Refresh token not available for this auth type'
        ),
      };
    }

    const credentials = config.auth.credentials as OAuthCredentials;
    if (!credentials.refreshToken) {
      return {
        success: false,
        error: createAuthenticationError('INVALID_CREDENTIALS', 'Refresh token not available'),
      };
    }

    try {
      this.logger.info('Refreshing OAuth token');

      const credentials = config.auth.credentials as OAuthCredentials;
      const response = await axios.post(
        `${config.baseUrl}/site/oauth2/access_token`,
        {
          grant_type: 'refresh_token',
          refresh_token: credentials.refreshToken,
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: config.timeouts.write,
        }
      );

      const tokenData = response.data;
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      this.logger.info('Token refreshed successfully', {
        expiresAt: expiresAt.toISOString(),
      });

      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
      };
    } catch (error) {
      const authError = errorHandlerService.handleError(error, {
        operation: 'refreshToken',
        authType: 'oauth',
      }) as AuthenticationError;

      return {
        success: false,
        error: authError,
      };
    }
  }

  public async createSession(config: BitbucketConfig): Promise<Session> {
    const authResult = await this.authenticate(config);

    if (!authResult.success || !authResult.user) {
      throw createAuthenticationError(
        'AUTHENTICATION_FAILED',
        'Failed to authenticate user for session creation'
      );
    }

    const sessionId = this.generateSessionId();
    const expiresAt = authResult.expiresAt || new Date(Date.now() + 3600000); // 1 hour default

    const session: Session = {
      id: sessionId,
      user: authResult.user,
      accessToken: authResult.accessToken || undefined,
      refreshToken: authResult.refreshToken || undefined,
      expiresAt,
      isValid: function () {
        return new Date() < this.expiresAt;
      },
    };

    this.sessions.set(sessionId, session);

    this.logger.info('Session created', {
      sessionId,
      userId: session.user.id,
      expiresAt: expiresAt.toISOString(),
    });

    return session;
  }

  public async refreshSession(session: Session): Promise<Session> {
    if (!session.refreshToken) {
      throw createAuthenticationError(
        'TOKEN_INVALID',
        'No refresh token available for session refresh'
      );
    }

    // Create a temporary config for refresh
    const config: BitbucketConfig = {
      baseUrl: 'https://bitbucket.org', // Will be updated based on session
      serverType: 'cloud', // Will be updated based on session
      auth: {
        type: 'oauth',
        credentials: {
          clientId: '', // Will be updated
          clientSecret: '', // Will be updated
          tokenType: 'Bearer',
          refreshToken: session.refreshToken,
        },
      },
      timeouts: configService.getTimeoutConfig(),
      rateLimit: configService.getRateLimitConfig(),
    };

    const refreshResult = await this.refreshToken(config);

    if (!refreshResult.success) {
      throw refreshResult.error!;
    }

    // Update session with new tokens
    session.accessToken = refreshResult.accessToken || undefined;
    session.refreshToken = refreshResult.refreshToken || undefined;
    session.expiresAt = refreshResult.expiresAt || new Date(Date.now() + 3600000);

    this.logger.info('Session refreshed', {
      sessionId: session.id,
      expiresAt: session.expiresAt.toISOString(),
    });

    return session;
  }

  public async revokeSession(session: Session): Promise<{ success: boolean }> {
    try {
      // Remove from local sessions
      this.sessions.delete(session.id);

      // If it's an OAuth session, revoke the token
      if (session.accessToken) {
        await this.revokeOAuthToken(session.accessToken);
      }

      this.logger.info('Session revoked', { sessionId: session.id });

      return { success: true };
    } catch (error) {
      this.logger.warn('Session revocation failed', {
        sessionId: session.id,
        error: error instanceof Error ? error.message : String(error),
      });

      return { success: false };
    }
  }

  public getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  public getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  public clearExpiredSessions(): number {
    const now = new Date();
    let clearedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      this.logger.info('Cleared expired sessions', { count: clearedCount });
    }

    return clearedCount;
  }

  private async performAuthentication(config: BitbucketConfig): Promise<AuthResult> {
    switch (config.auth.type) {
      case 'oauth':
        return this.authenticateOAuth(config);
      case 'app_password':
        return this.authenticateAppPassword(config);
      case 'api_token':
        return this.authenticateApiToken(config);
      case 'basic':
        return this.authenticateBasic(config);
      default:
        throw createAuthenticationError(
          'INVALID_CREDENTIALS',
          `Unsupported authentication type: ${config.auth.type}`
        );
    }
  }

  private async authenticateOAuth(config: BitbucketConfig): Promise<AuthResult> {
    const credentials = config.auth.credentials as OAuthCredentials;

    if (!credentials.accessToken) {
      throw createAuthenticationError('INVALID_CREDENTIALS', 'OAuth access token is required');
    }

    const apiClient = this.createApiClient(config, credentials.accessToken);
    const user = await this.getCurrentUser(apiClient, config.serverType);

    return {
      success: true,
      user,
      accessToken: credentials.accessToken || undefined,
      refreshToken: credentials.refreshToken || undefined,
      expiresAt: config.auth.expiresAt,
    };
  }

  private async authenticateAppPassword(config: BitbucketConfig): Promise<AuthResult> {
    const credentials = config.auth.credentials as AppPasswordCredentials;

    const apiClient = this.createApiClient(config, undefined, {
      username: credentials.username,
      password: credentials.appPassword,
    });

    const user = await this.getCurrentUser(apiClient, config.serverType);

    return {
      success: true,
      user,
    };
  }

  private async authenticateApiToken(config: BitbucketConfig): Promise<AuthResult> {
    const credentials = config.auth.credentials as ApiTokenCredentials;

    const apiClient = this.createApiClient(config, undefined, {
      username: credentials.username,
      password: credentials.token,
    });

    const user = await this.getCurrentUser(apiClient, config.serverType);

    return {
      success: true,
      user,
    };
  }

  private async authenticateBasic(config: BitbucketConfig): Promise<AuthResult> {
    const credentials = config.auth.credentials as BasicCredentials;

    const apiClient = this.createApiClient(config, undefined, {
      username: credentials.username,
      password: credentials.password,
    });

    const user = await this.getCurrentUser(apiClient, config.serverType);

    return {
      success: true,
      user,
    };
  }

  private async getCurrentUser(apiClient: AxiosInstance, serverType: ServerType): Promise<User> {
    let response: AxiosResponse;

    if (serverType === 'cloud') {
      response = await apiClient.get('/2.0/user');
    } else {
      response = await apiClient.get('/rest/api/1.0/users/current');
    }

    return this.transformUserResponse(response.data, serverType);
  }

  private transformUserResponse(data: any, serverType: ServerType): User {
    if (serverType === 'cloud') {
      return {
        id: data.uuid,
        name: data.username,
        displayName: data.display_name,
        emailAddress: data.email,
        uuid: data.uuid,
        accountStatus: data.account_status,
        avatarUrl: data.links?.avatar?.href,
      };
    } else {
      return {
        id: data.id,
        name: data.slug,
        displayName: data.displayName,
        emailAddress: data.emailAddress,
        slug: data.slug,
        type: data.type,
        active: data.active,
        directoryName: data.directoryName,
        mutableDetails: data.mutableDetails,
        mutableGroups: data.mutableGroups,
        lastAuthenticationTimestamp: data.lastAuthenticationTimestamp,
      };
    }
  }

  private createApiClient(
    config: BitbucketConfig,
    accessToken?: string,
    basicAuth?: { username: string; password: string }
  ): AxiosInstance {
    const client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeouts.read,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (accessToken) {
      client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else if (basicAuth) {
      const auth = Buffer.from(`${basicAuth.username}:${basicAuth.password}`).toString('base64');
      client.defaults.headers.common['Authorization'] = `Basic ${auth}`;
    }

    return client;
  }

  private async revokeOAuthToken(accessToken: string): Promise<void> {
    try {
      await axios.post(
        'https://bitbucket.org/site/oauth2/revoke_token',
        {
          token: accessToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 5000,
        }
      );
    } catch (error) {
      this.logger.warn('OAuth token revocation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Additional methods for comprehensive auth management
  public validateCredentials(authType: AuthType, credentials: any): boolean {
    try {
      switch (authType) {
        case 'oauth':
          return !!(credentials.clientId && credentials.clientSecret && credentials.tokenType);
        case 'app_password':
          return !!(credentials.username && credentials.appPassword);
        case 'api_token':
          return !!(credentials.username && credentials.token);
        case 'basic':
          return !!(credentials.username && credentials.password);
        default:
          return false;
      }
    } catch (error) {
      this.logger.warn('Credential validation failed', {
        authType,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  public getSupportedAuthTypes(): AuthType[] {
    return ['oauth', 'app_password', 'api_token', 'basic'];
  }

  public getAuthTypesForServerType(serverType: ServerType): AuthType[] {
    if (serverType === 'cloud') {
      return ['oauth', 'app_password'];
    } else {
      return ['oauth', 'api_token', 'basic'];
    }
  }

  public formatUserInfo(user: User): string {
    const parts = [];

    if (user.displayName) {
      parts.push(`Display Name: ${user.displayName}`);
    }

    if (user.name) {
      parts.push(`Username: ${user.name}`);
    }

    if (user.emailAddress) {
      parts.push(`Email: ${user.emailAddress}`);
    }

    if (user.id) {
      parts.push(`ID: ${user.id}`);
    }

    return parts.join(', ');
  }

  public getAuthenticationStatus(): {
    isAuthenticated: boolean;
    activeSessions: number;
    expiredSessions: number;
    lastAuthentication?: Date | undefined;
  } {
    const allSessions = this.getAllSessions();
    const now = new Date();

    const activeSessions = allSessions.filter(session => session.expiresAt > now);
    const expiredSessions = allSessions.filter(session => session.expiresAt <= now);

    const lastAuthentication =
      allSessions.length > 0
        ? new Date(Math.max(...allSessions.map(s => s.expiresAt.getTime() - 3600000))) // Assuming 1 hour sessions
        : undefined;

    return {
      isAuthenticated: activeSessions.length > 0,
      activeSessions: activeSessions.length,
      expiredSessions: expiredSessions.length,
      lastAuthentication: lastAuthentication || undefined,
    };
  }

  public validateToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Basic token validation - check if it's not empty and has reasonable length
    if (token.length < 10) {
      return false;
    }

    // Check if token looks like a valid format (basic validation)
    const tokenPattern = /^[A-Za-z0-9_-]+$/;
    return tokenPattern.test(token.replace(/[.=]/g, '')); // Allow dots and equals for JWT/base64
  }

  public getTokenExpiry(token: string): Date | null {
    try {
      // For JWT tokens, try to decode and get expiry
      if (token.includes('.')) {
        const parts = token.split('.');
        if (parts.length === 3 && parts[1]) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          if (payload.exp) {
            return new Date(payload.exp * 1000);
          }
        }
      }

      // For other tokens, we can't determine expiry without server call
      return null;
    } catch (error) {
      this.logger.debug('Failed to parse token expiry', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  public isTokenExpired(token: string): boolean {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) {
      // If we can't determine expiry, assume token is valid
      return false;
    }

    return new Date() >= expiry;
  }

  public async validateServerConnection(baseUrl: string): Promise<boolean> {
    try {
      const response = await axios.get(`${baseUrl}/`, {
        timeout: 5000,
        validateStatus: () => true, // Don't throw on any status
      });

      // Consider any response (even error responses) as a valid connection
      return response.status < 500;
    } catch (error) {
      this.logger.debug('Server connection validation failed', {
        baseUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  public getSessionStats(): {
    total: number;
    active: number;
    expired: number;
    byAuthType: Record<string, number>;
  } {
    const allSessions = this.getAllSessions();
    const now = new Date();

    const active = allSessions.filter(session => session.expiresAt > now);
    const expired = allSessions.filter(session => session.expiresAt <= now);

    // Count by auth type (would need to track this in session creation)
    const byAuthType: Record<string, number> = {};

    return {
      total: allSessions.length,
      active: active.length,
      expired: expired.length,
      byAuthType,
    };
  }

  public async logout(): Promise<{ success: boolean; sessionsRevoked: number }> {
    const allSessions = this.getAllSessions();
    let revokedCount = 0;

    for (const session of allSessions) {
      try {
        const result = await this.revokeSession(session);
        if (result.success) {
          revokedCount++;
        }
      } catch (error) {
        this.logger.warn('Failed to revoke session during logout', {
          sessionId: session.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.logger.info('Logout completed', { sessionsRevoked: revokedCount });

    return {
      success: true,
      sessionsRevoked: revokedCount,
    };
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
