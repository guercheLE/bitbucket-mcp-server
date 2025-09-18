import { z } from 'zod';

// Schemas de validação para OAuth Token Exchange
const OAuthTokenRequestSchema = z.object({
  grantType: z.enum(['authorization_code', 'refresh_token'], {
    errorMap: () => ({ message: 'grant_type deve ser "authorization_code" ou "refresh_token"' })
  }),
  clientId: z.string().min(1, 'client_id é obrigatório'),
  clientSecret: z.string().min(1, 'client_secret é obrigatório'),
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
  },
  {
    message: 'Parâmetros obrigatórios não fornecidos para o grant_type especificado'
  }
);

const OAuthTokenResponseSchema = z.object({
  accessToken: z.string().min(1, 'access_token é obrigatório'),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().positive('expires_in deve ser um número positivo'),
  refreshToken: z.string().optional(),
  scope: z.string().optional()
});

describe('OAuth Token Exchange Contract Tests', () => {
  describe('OAuthTokenRequest validation', () => {
    it('deve validar request de authorization_code válido', () => {
      const validRequest = {
        grantType: 'authorization_code' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        code: 'authorization-code',
        redirectUri: 'https://example.com/callback',
        codeVerifier: 'code-verifier'
      };

      expect(() => OAuthTokenRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('deve validar request de refresh_token válido', () => {
      const validRequest = {
        grantType: 'refresh_token' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        refreshToken: 'refresh-token'
      };

      expect(() => OAuthTokenRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('deve rejeitar request sem grant_type', () => {
      const invalidRequest = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        code: 'authorization-code',
        redirectUri: 'https://example.com/callback',
        codeVerifier: 'code-verifier'
      };

      expect(() => OAuthTokenRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar grant_type inválido', () => {
      const invalidRequest = {
        grantType: 'invalid_grant' as any,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        code: 'authorization-code',
        redirectUri: 'https://example.com/callback',
        codeVerifier: 'code-verifier'
      };

      expect(() => OAuthTokenRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar request sem client_id', () => {
      const invalidRequest = {
        grantType: 'authorization_code' as const,
        clientSecret: 'test-client-secret',
        code: 'authorization-code',
        redirectUri: 'https://example.com/callback',
        codeVerifier: 'code-verifier'
      };

      expect(() => OAuthTokenRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar request sem client_secret', () => {
      const invalidRequest = {
        grantType: 'authorization_code' as const,
        clientId: 'test-client-id',
        code: 'authorization-code',
        redirectUri: 'https://example.com/callback',
        codeVerifier: 'code-verifier'
      };

      expect(() => OAuthTokenRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar authorization_code sem code', () => {
      const invalidRequest = {
        grantType: 'authorization_code' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'https://example.com/callback',
        codeVerifier: 'code-verifier'
      };

      expect(() => OAuthTokenRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar authorization_code sem redirect_uri', () => {
      const invalidRequest = {
        grantType: 'authorization_code' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        code: 'authorization-code',
        codeVerifier: 'code-verifier'
      };

      expect(() => OAuthTokenRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar authorization_code sem code_verifier (PKCE)', () => {
      const invalidRequest = {
        grantType: 'authorization_code' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        code: 'authorization-code',
        redirectUri: 'https://example.com/callback'
      };

      expect(() => OAuthTokenRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar refresh_token sem refresh_token', () => {
      const invalidRequest = {
        grantType: 'refresh_token' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };

      expect(() => OAuthTokenRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar redirect_uri inválida', () => {
      const invalidRequest = {
        grantType: 'authorization_code' as const,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        code: 'authorization-code',
        redirectUri: 'invalid-url',
        codeVerifier: 'code-verifier'
      };

      expect(() => OAuthTokenRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('OAuthTokenResponse validation', () => {
    it('deve validar response válido com refresh_token', () => {
      const validResponse = {
        accessToken: 'access-token',
        tokenType: 'Bearer' as const,
        expiresIn: 3600,
        refreshToken: 'refresh-token',
        scope: 'read write'
      };

      expect(() => OAuthTokenResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('deve validar response válido sem refresh_token', () => {
      const validResponse = {
        accessToken: 'access-token',
        tokenType: 'Bearer' as const,
        expiresIn: 3600,
        scope: 'read write'
      };

      expect(() => OAuthTokenResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('deve rejeitar response sem access_token', () => {
      const invalidResponse = {
        tokenType: 'Bearer' as const,
        expiresIn: 3600,
        refreshToken: 'refresh-token'
      };

      expect(() => OAuthTokenResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar tokenType diferente de Bearer', () => {
      const invalidResponse = {
        accessToken: 'access-token',
        tokenType: 'Basic' as any,
        expiresIn: 3600,
        refreshToken: 'refresh-token'
      };

      expect(() => OAuthTokenResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar expiresIn negativo', () => {
      const invalidResponse = {
        accessToken: 'access-token',
        tokenType: 'Bearer' as const,
        expiresIn: -1,
        refreshToken: 'refresh-token'
      };

      expect(() => OAuthTokenResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar expiresIn zero', () => {
      const invalidResponse = {
        accessToken: 'access-token',
        tokenType: 'Bearer' as const,
        expiresIn: 0,
        refreshToken: 'refresh-token'
      };

      expect(() => OAuthTokenResponseSchema.parse(invalidResponse)).toThrow();
    });
  });
});
