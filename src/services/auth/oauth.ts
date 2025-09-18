import { 
  OAuthAuthorizationRequest, 
  OAuthAuthorizationResponse, 
  OAuthTokenRequest, 
  OAuthTokenResponse,
  OAuthRevocationRequest,
  OAuthToken
} from '../../types/auth';
import * as crypto from 'crypto';

/**
 * Serviço OAuth 2.0 com PKCE e fluxo completo
 */
export class OAuthService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor(baseUrl: string, clientId: string, clientSecret: string) {
    this.baseUrl = baseUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Gera URL de autorização OAuth 2.0
   */
  generateAuthorizationUrl(request: OAuthAuthorizationRequest): OAuthAuthorizationResponse {
    const params = new URLSearchParams({
      response_type: request.responseType,
      client_id: request.clientId,
      redirect_uri: request.redirectUri,
      state: request.state,
      code_challenge: request.codeChallenge,
      code_challenge_method: request.codeChallengeMethod || 'S256'
    });

    if (request.scope) {
      params.append('scope', request.scope);
    }

    const authorizationUrl = `${this.baseUrl}/oauth/authorize?${params.toString()}`;

    return {
      authorizationUrl,
      state: request.state,
      codeChallenge: request.codeChallenge
    };
  }

  /**
   * Troca código de autorização por token de acesso
   */
  async exchangeCodeForToken(request: OAuthTokenRequest): Promise<OAuthTokenResponse> {
    if (request.grantType !== 'authorization_code') {
      throw new Error('Grant type deve ser authorization_code');
    }

    const tokenUrl = `${this.baseUrl}/oauth/token`;
    
    const body = new URLSearchParams({
      grant_type: request.grantType,
      client_id: request.clientId,
      client_secret: request.clientSecret,
      code: request.code!,
      redirect_uri: request.redirectUri!,
      code_verifier: request.codeVerifier!
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(`Erro na troca de token: ${response.status} - ${errorData.error_description || response.statusText}`);
      }

      const tokenData = await response.json() as any;
      
      return {
        accessToken: tokenData.access_token,
        tokenType: 'Bearer',
        expiresIn: tokenData.expires_in,
        refreshToken: tokenData.refresh_token,
        scope: tokenData.scope
      };
    } catch (error) {
      throw new Error(`Falha na troca de código por token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Renova token de acesso usando refresh token
   */
  async refreshToken(request: OAuthTokenRequest): Promise<OAuthTokenResponse> {
    if (request.grantType !== 'refresh_token') {
      throw new Error('Grant type deve ser refresh_token');
    }

    const tokenUrl = `${this.baseUrl}/oauth/token`;
    
    const body = new URLSearchParams({
      grant_type: request.grantType,
      client_id: request.clientId,
      client_secret: request.clientSecret,
      refresh_token: request.refreshToken!
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(`Erro no refresh de token: ${response.status} - ${errorData.error_description || response.statusText}`);
      }

      const tokenData = await response.json() as any;
      
      return {
        accessToken: tokenData.access_token,
        tokenType: 'Bearer',
        expiresIn: tokenData.expires_in,
        refreshToken: tokenData.refresh_token,
        scope: tokenData.scope
      };
    } catch (error) {
      throw new Error(`Falha no refresh de token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Revoga token de acesso ou refresh token
   */
  async revokeToken(request: OAuthRevocationRequest): Promise<{ success: boolean; message: string }> {
    const revokeUrl = `${this.baseUrl}/oauth/revoke`;
    
    const body = new URLSearchParams({
      token: request.token,
      client_id: request.clientId,
      client_secret: request.clientSecret
    });

    if (request.tokenTypeHint) {
      body.append('token_type_hint', request.tokenTypeHint);
    }

    try {
      const response = await fetch(revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(`Erro na revogação de token: ${response.status} - ${errorData.error_description || response.statusText}`);
      }

      return {
        success: true,
        message: 'Token revogado com sucesso'
      };
    } catch (error) {
      throw new Error(`Falha na revogação de token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Gera PKCE code verifier
   */
  generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Gera PKCE code challenge
   */
  generateCodeChallenge(codeVerifier: string): string {
    return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  }

  /**
   * Valida PKCE code verifier contra code challenge
   */
  validateCodeVerifier(codeVerifier: string, codeChallenge: string): boolean {
    const expectedChallenge = this.generateCodeChallenge(codeVerifier);
    return expectedChallenge === codeChallenge;
  }

  /**
   * Valida escopo de token
   */
  validateScope(requestedScope: string, allowedScopes: string[]): boolean {
    if (!requestedScope) {
      return true; // Escopo vazio é válido
    }

    const requestedScopes = requestedScope.split(' ').filter(s => s.length > 0);
    
    return requestedScopes.every(scope => allowedScopes.includes(scope));
  }

  /**
   * Obtém informações do token de acesso
   */
  async getTokenInfo(accessToken: string): Promise<{
    isValid: boolean;
    expiresAt?: string;
    scope?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return {
          isValid: false,
          error: `Token inválido: ${response.status}`
        };
      }

      const tokenInfo = await response.json() as any;
      
      return {
        isValid: true,
        expiresAt: tokenInfo.expires_at,
        scope: tokenInfo.scope
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Erro ao validar token'
      };
    }
  }

  /**
   * Criptografa token para armazenamento seguro
   */
  encryptToken(token: string, encryptionKey: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, encryptionKey);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Descriptografa token
   */
  decryptToken(encryptedToken: string, encryptionKey: string): string {
    const algorithm = 'aes-256-gcm';
    const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, encryptionKey);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Cria token OAuth a partir de resposta
   */
  createOAuthToken(tokenResponse: OAuthTokenResponse): OAuthToken {
    return {
      accessToken: tokenResponse.accessToken,
      tokenType: tokenResponse.tokenType,
      expiresIn: tokenResponse.expiresIn,
      refreshToken: tokenResponse.refreshToken,
      scope: tokenResponse.scope,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Verifica se token está expirado
   */
  isTokenExpired(token: OAuthToken): boolean {
    const createdAt = new Date(token.createdAt);
    const expiresAt = new Date(createdAt.getTime() + (token.expiresIn * 1000));
    const now = new Date();
    
    return now >= expiresAt;
  }

  /**
   * Obtém tempo restante do token em segundos
   */
  getTokenTimeRemaining(token: OAuthToken): number {
    const createdAt = new Date(token.createdAt);
    const expiresAt = new Date(createdAt.getTime() + (token.expiresIn * 1000));
    const now = new Date();
    
    const remaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
    return Math.max(0, remaining);
  }
}
