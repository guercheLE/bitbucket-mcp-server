import { z } from 'zod';

// Schemas de validação para OAuth Authorization
const OAuthAuthorizationRequestSchema = z.object({
  responseType: z.literal('code'),
  clientId: z.string().min(1, 'client_id é obrigatório'),
  redirectUri: z.string().url('redirect_uri deve ser uma URL válida'),
  scope: z.string().optional(),
  state: z.string().min(1, 'state é obrigatório para proteção CSRF'),
  codeChallenge: z.string().min(1, 'code_challenge é obrigatório para PKCE'),
  codeChallengeMethod: z.literal('S256').optional()
});

const OAuthAuthorizationResponseSchema = z.object({
  authorizationUrl: z.string().url('URL de autorização deve ser válida'),
  state: z.string(),
  codeChallenge: z.string()
});

describe('OAuth Authorization Contract Tests', () => {
  describe('OAuthAuthorizationRequest validation', () => {
    it('deve validar request válido com todos os campos obrigatórios', () => {
      const validRequest = {
        responseType: 'code' as const,
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback',
        state: 'random-state-string',
        codeChallenge: 'test-code-challenge'
      };

      expect(() => OAuthAuthorizationRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('deve rejeitar request sem client_id', () => {
      const invalidRequest = {
        responseType: 'code' as const,
        redirectUri: 'https://example.com/callback',
        state: 'random-state-string',
        codeChallenge: 'test-code-challenge'
      };

      expect(() => OAuthAuthorizationRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar request sem redirect_uri', () => {
      const invalidRequest = {
        responseType: 'code' as const,
        clientId: 'test-client-id',
        state: 'random-state-string',
        codeChallenge: 'test-code-challenge'
      };

      expect(() => OAuthAuthorizationRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar response_type diferente de "code"', () => {
      const invalidRequest = {
        responseType: 'token' as any,
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback',
        state: 'random-state-string',
        codeChallenge: 'test-code-challenge'
      };

      expect(() => OAuthAuthorizationRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar request sem code_challenge (PKCE)', () => {
      const invalidRequest = {
        responseType: 'code' as const,
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback',
        state: 'random-state-string'
      };

      expect(() => OAuthAuthorizationRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar request sem state (CSRF protection)', () => {
      const invalidRequest = {
        responseType: 'code' as const,
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback',
        codeChallenge: 'test-code-challenge'
      };

      expect(() => OAuthAuthorizationRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar redirect_uri inválida', () => {
      const invalidRequest = {
        responseType: 'code' as const,
        clientId: 'test-client-id',
        redirectUri: 'invalid-url',
        state: 'random-state-string',
        codeChallenge: 'test-code-challenge'
      };

      expect(() => OAuthAuthorizationRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve aceitar code_challenge_method S256', () => {
      const validRequest = {
        responseType: 'code' as const,
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback',
        state: 'random-state-string',
        codeChallenge: 'test-code-challenge',
        codeChallengeMethod: 'S256' as const
      };

      expect(() => OAuthAuthorizationRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('deve rejeitar code_challenge_method diferente de S256', () => {
      const invalidRequest = {
        responseType: 'code' as const,
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback',
        state: 'random-state-string',
        codeChallenge: 'test-code-challenge',
        codeChallengeMethod: 'plain' as any
      };

      expect(() => OAuthAuthorizationRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('OAuthAuthorizationResponse validation', () => {
    it('deve validar response válido', () => {
      const validResponse = {
        authorizationUrl: 'https://bitbucket.org/oauth/authorize?client_id=test&redirect_uri=callback&state=state&code_challenge=challenge',
        state: 'random-state-string',
        codeChallenge: 'test-code-challenge'
      };

      expect(() => OAuthAuthorizationResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('deve rejeitar authorizationUrl inválida', () => {
      const invalidResponse = {
        authorizationUrl: 'invalid-url',
        state: 'random-state-string',
        codeChallenge: 'test-code-challenge'
      };

      expect(() => OAuthAuthorizationResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar response sem authorizationUrl', () => {
      const invalidResponse = {
        state: 'random-state-string',
        codeChallenge: 'test-code-challenge'
      };

      expect(() => OAuthAuthorizationResponseSchema.parse(invalidResponse)).toThrow();
    });
  });
});
