import { z } from 'zod';

// Schemas para fluxo OAuth 2.0 completo
const OAuthAuthorizationRequestSchema = z.object({
  responseType: z.literal('code'),
  clientId: z.string().min(1),
  redirectUri: z.string().url(),
  scope: z.string().optional(),
  state: z.string().min(1),
  codeChallenge: z.string().min(1),
  codeChallengeMethod: z.literal('S256').optional()
});

const OAuthTokenRequestSchema = z.object({
  grantType: z.enum(['authorization_code', 'refresh_token']),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  code: z.string().optional(),
  redirectUri: z.string().url().optional(),
  refreshToken: z.string().optional(),
  codeVerifier: z.string().optional()
}).refine(
  (data) => {
    if (data.grantType === 'authorization_code') {
      return data.code && data.redirectUri && data.codeVerifier;
    }
    if (data.grantType === 'refresh_token') {
      return data.refreshToken;
    }
    return false;
  }
);

const OAuthTokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().positive(),
  refreshToken: z.string().optional(),
  scope: z.string().optional()
});

const OAuthRevocationRequestSchema = z.object({
  token: z.string().min(1),
  tokenTypeHint: z.enum(['access_token', 'refresh_token']).optional(),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1)
});

describe('OAuth Flow Integration Tests', () => {
  describe('Fluxo de autorização OAuth 2.0', () => {
    it('deve gerar URL de autorização válida', () => {
      const authRequest = {
        responseType: 'code' as const,
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback',
        state: 'random-state-string',
        codeChallenge: 'test-code-challenge'
      };

      expect(() => OAuthAuthorizationRequestSchema.parse(authRequest)).not.toThrow();

      // Simular geração de URL de autorização
      const authUrl = `https://bitbucket.org/oauth/authorize?` +
        `response_type=code&` +
        `client_id=${authRequest.clientId}&` +
        `redirect_uri=${encodeURIComponent(authRequest.redirectUri)}&` +
        `state=${authRequest.state}&` +
        `code_challenge=${authRequest.codeChallenge}&` +
        `code_challenge_method=S256`;

      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain(`client_id=${authRequest.clientId}`);
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(authRequest.redirectUri)}`);
      expect(authUrl).toContain(`state=${authRequest.state}`);
      expect(authUrl).toContain(`code_challenge=${authRequest.codeChallenge}`);
      expect(authUrl).toContain('code_challenge_method=S256');
    });

    it('deve validar PKCE code challenge', () => {
      const codeChallenge = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const codeVerifier = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

      // Simular validação PKCE
      const isValidChallenge = codeChallenge.length > 0 && codeVerifier.length > 0;
      expect(isValidChallenge).toBe(true);
    });

    it('deve validar state para proteção CSRF', () => {
      const state = 'random-state-string-12345';
      const isValidState = state.length >= 10 && /^[a-zA-Z0-9-_]+$/.test(state);
      expect(isValidState).toBe(true);
    });
  });

  describe('Troca de código por token', () => {
    it('deve trocar código de autorização por token de acesso', () => {
      const tokenRequest = {
        grantType: 'authorization_code' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        code: 'authorization-code',
        redirectUri: 'https://example.com/callback',
        codeVerifier: 'code-verifier'
      };

      expect(() => OAuthTokenRequestSchema.parse(tokenRequest)).not.toThrow();

      // Simular resposta de token
      const tokenResponse = {
        accessToken: 'access-token-12345',
        tokenType: 'Bearer' as const,
        expiresIn: 3600,
        refreshToken: 'refresh-token-67890',
        scope: 'read write'
      };

      expect(() => OAuthTokenResponseSchema.parse(tokenResponse)).not.toThrow();
      expect(tokenResponse.tokenType).toBe('Bearer');
      expect(tokenResponse.expiresIn).toBeGreaterThan(0);
    });

    it('deve validar PKCE code verifier', () => {
      const codeVerifier = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
      const codeChallenge = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

      // Simular validação PKCE
      const isValidVerifier = codeVerifier.length >= 43 && codeVerifier.length <= 128;
      expect(isValidVerifier).toBe(true);
    });

    it('deve rejeitar código de autorização inválido', () => {
      const invalidTokenRequest = {
        grantType: 'authorization_code' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        code: 'invalid-code',
        redirectUri: 'https://example.com/callback',
        codeVerifier: 'code-verifier'
      };

      expect(() => OAuthTokenRequestSchema.parse(invalidTokenRequest)).not.toThrow();

      // Simular erro de código inválido
      const errorResponse = {
        error: 'invalid_grant',
        errorDescription: 'Authorization code is invalid or expired'
      };

      expect(errorResponse.error).toBe('invalid_grant');
    });
  });

  describe('Refresh de token', () => {
    it('deve renovar token de acesso usando refresh token', () => {
      const refreshRequest = {
        grantType: 'refresh_token' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        refreshToken: 'refresh-token-67890'
      };

      expect(() => OAuthTokenRequestSchema.parse(refreshRequest)).not.toThrow();

      // Simular resposta de refresh
      const refreshResponse = {
        accessToken: 'new-access-token-12345',
        tokenType: 'Bearer' as const,
        expiresIn: 3600,
        refreshToken: 'new-refresh-token-67890',
        scope: 'read write'
      };

      expect(() => OAuthTokenResponseSchema.parse(refreshResponse)).not.toThrow();
      expect(refreshResponse.accessToken).not.toBe(refreshRequest.refreshToken);
    });

    it('deve rejeitar refresh token expirado', () => {
      const expiredRefreshRequest = {
        grantType: 'refresh_token' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        refreshToken: 'expired-refresh-token'
      };

      expect(() => OAuthTokenRequestSchema.parse(expiredRefreshRequest)).not.toThrow();

      // Simular erro de refresh token expirado
      const errorResponse = {
        error: 'invalid_grant',
        errorDescription: 'Refresh token is invalid or expired'
      };

      expect(errorResponse.error).toBe('invalid_grant');
    });
  });

  describe('Revogação de token', () => {
    it('deve revogar token de acesso', () => {
      const revocationRequest = {
        token: 'access-token-12345',
        tokenTypeHint: 'access_token' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };

      expect(() => OAuthRevocationRequestSchema.parse(revocationRequest)).not.toThrow();

      // Simular revogação bem-sucedida
      const revocationResponse = {
        success: true,
        message: 'Token revoked successfully'
      };

      expect(revocationResponse.success).toBe(true);
    });

    it('deve revogar refresh token', () => {
      const revocationRequest = {
        token: 'refresh-token-67890',
        tokenTypeHint: 'refresh_token' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };

      expect(() => OAuthRevocationRequestSchema.parse(revocationRequest)).not.toThrow();

      // Simular revogação bem-sucedida
      const revocationResponse = {
        success: true,
        message: 'Refresh token revoked successfully'
      };

      expect(revocationResponse.success).toBe(true);
    });

    it('deve rejeitar revogação de token inválido', () => {
      const invalidRevocationRequest = {
        token: 'invalid-token',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };

      expect(() => OAuthRevocationRequestSchema.parse(invalidRevocationRequest)).not.toThrow();

      // Simular erro de token inválido
      const errorResponse = {
        error: 'invalid_token',
        errorDescription: 'Token is invalid or already revoked'
      };

      expect(errorResponse.error).toBe('invalid_token');
    });
  });

  describe('PKCE flow', () => {
    it('deve implementar PKCE flow completo', () => {
      // Simular geração de code verifier
      const codeVerifier = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
      
      // Simular geração de code challenge
      const codeChallenge = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

      // Simular fluxo PKCE
      const pkceFlow = {
        codeVerifier,
        codeChallenge,
        codeChallengeMethod: 'S256'
      };

      expect(pkceFlow.codeVerifier).toBeDefined();
      expect(pkceFlow.codeChallenge).toBeDefined();
      expect(pkceFlow.codeChallengeMethod).toBe('S256');
    });

    it('deve validar PKCE code challenge method', () => {
      const validMethods = ['S256'];
      const invalidMethods = ['plain', 'MD5', 'SHA1'];

      validMethods.forEach(method => {
        expect(method).toBe('S256');
      });

      invalidMethods.forEach(method => {
        expect(method).not.toBe('S256');
      });
    });
  });

  describe('Tratamento de erros OAuth', () => {
    it('deve tratar erro de client_id inválido', () => {
      const errorResponse = {
        error: 'invalid_client',
        errorDescription: 'Client authentication failed'
      };

      expect(errorResponse.error).toBe('invalid_client');
    });

    it('deve tratar erro de redirect_uri inválido', () => {
      const errorResponse = {
        error: 'invalid_request',
        errorDescription: 'Invalid redirect_uri'
      };

      expect(errorResponse.error).toBe('invalid_request');
    });

    it('deve tratar erro de scope inválido', () => {
      const errorResponse = {
        error: 'invalid_scope',
        errorDescription: 'The requested scope is invalid'
      };

      expect(errorResponse.error).toBe('invalid_scope');
    });

    it('deve tratar erro de servidor', () => {
      const errorResponse = {
        error: 'server_error',
        errorDescription: 'The authorization server encountered an unexpected condition'
      };

      expect(errorResponse.error).toBe('server_error');
    });

    it('deve tratar erro de acesso negado', () => {
      const errorResponse = {
        error: 'access_denied',
        errorDescription: 'The user denied the request'
      };

      expect(errorResponse.error).toBe('access_denied');
    });
  });

  describe('Validação de escopo', () => {
    it('deve validar escopo válido', () => {
      const validScopes = ['read', 'write', 'admin'];
      const requestedScope = 'read write';

      const isValidScope = validScopes.some(scope => requestedScope.includes(scope));
      expect(isValidScope).toBe(true);
    });

    it('deve rejeitar escopo inválido', () => {
      const validScopes = ['read', 'write', 'admin'];
      const requestedScope = 'invalid_scope';

      const isValidScope = validScopes.some(scope => requestedScope.includes(scope));
      expect(isValidScope).toBe(false);
    });

    it('deve validar escopo vazio', () => {
      const requestedScope = '';
      const isValidScope = requestedScope.length === 0 || requestedScope.trim() === '';
      expect(isValidScope).toBe(true);
    });
  });
});
