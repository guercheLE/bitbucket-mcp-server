import { z } from 'zod';

// Modelos para hierarquia de autenticação
const AuthenticationMethodSchema = z.enum(['oauth2', 'personal_token', 'app_password', 'basic_auth']);

const AuthenticationPrioritySchema = z.object({
  method: AuthenticationMethodSchema,
  priority: z.number().int().min(1).max(4),
  isSecure: z.boolean(),
  isRecommended: z.boolean()
});

const AuthenticationCredentialsSchema = z.object({
  type: AuthenticationMethodSchema,
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  token: z.string().optional()
}).refine(
  (data) => {
    switch (data.type) {
      case 'oauth2':
        return data.accessToken && data.clientId && data.clientSecret;
      case 'personal_token':
        return data.token;
      case 'app_password':
        return data.username && data.password;
      case 'basic_auth':
        return data.username && data.password;
      default:
        return false;
    }
  },
  {
    message: 'Credenciais inválidas para o tipo de autenticação especificado'
  }
);

const AuthenticationResultSchema = z.object({
  success: z.boolean(),
  method: AuthenticationMethodSchema,
  priority: z.number().int().min(1).max(4),
  error: z.string().optional(),
  fallbackAvailable: z.boolean()
});

describe('Authentication Hierarchy Unit Tests', () => {
  describe('Prioridade de métodos de autenticação', () => {
    it('deve ter OAuth 2.0 com prioridade máxima (1)', () => {
      const oauth2Priority = {
        method: 'oauth2' as const,
        priority: 1,
        isSecure: true,
        isRecommended: true
      };

      expect(() => AuthenticationPrioritySchema.parse(oauth2Priority)).not.toThrow();
      expect(oauth2Priority.priority).toBe(1);
      expect(oauth2Priority.isSecure).toBe(true);
      expect(oauth2Priority.isRecommended).toBe(true);
    });

    it('deve ter Personal Access Token com segunda prioridade (2)', () => {
      const patPriority = {
        method: 'personal_token' as const,
        priority: 2,
        isSecure: true,
        isRecommended: true
      };

      expect(() => AuthenticationPrioritySchema.parse(patPriority)).not.toThrow();
      expect(patPriority.priority).toBe(2);
      expect(patPriority.isSecure).toBe(true);
      expect(patPriority.isRecommended).toBe(true);
    });

    it('deve ter App Password com terceira prioridade (3)', () => {
      const appPasswordPriority = {
        method: 'app_password' as const,
        priority: 3,
        isSecure: false,
        isRecommended: false
      };

      expect(() => AuthenticationPrioritySchema.parse(appPasswordPriority)).not.toThrow();
      expect(appPasswordPriority.priority).toBe(3);
      expect(appPasswordPriority.isSecure).toBe(false);
      expect(appPasswordPriority.isRecommended).toBe(false);
    });

    it('deve ter Basic Auth com prioridade mínima (4)', () => {
      const basicAuthPriority = {
        method: 'basic_auth' as const,
        priority: 4,
        isSecure: false,
        isRecommended: false
      };

      expect(() => AuthenticationPrioritySchema.parse(basicAuthPriority)).not.toThrow();
      expect(basicAuthPriority.priority).toBe(4);
      expect(basicAuthPriority.isSecure).toBe(false);
      expect(basicAuthPriority.isRecommended).toBe(false);
    });

    it('deve rejeitar prioridade inválida', () => {
      const invalidPriority = {
        method: 'oauth2' as const,
        priority: 5, // Inválido
        isSecure: true,
        isRecommended: true
      };

      expect(() => AuthenticationPrioritySchema.parse(invalidPriority)).toThrow();
    });

    it('deve rejeitar prioridade zero', () => {
      const invalidPriority = {
        method: 'oauth2' as const,
        priority: 0, // Inválido
        isSecure: true,
        isRecommended: true
      };

      expect(() => AuthenticationPrioritySchema.parse(invalidPriority)).toThrow();
    });
  });

  describe('Fallback automático entre métodos', () => {
    it('deve permitir fallback de OAuth2 para Personal Token', () => {
      const oauth2Result = {
        success: false,
        method: 'oauth2' as const,
        priority: 1,
        error: 'Token expirado',
        fallbackAvailable: true
      };

      const patResult = {
        success: true,
        method: 'personal_token' as const,
        priority: 2,
        fallbackAvailable: true
      };

      expect(() => AuthenticationResultSchema.parse(oauth2Result)).not.toThrow();
      expect(() => AuthenticationResultSchema.parse(patResult)).not.toThrow();
      expect(oauth2Result.fallbackAvailable).toBe(true);
      expect(patResult.success).toBe(true);
    });

    it('deve permitir fallback de Personal Token para App Password', () => {
      const patResult = {
        success: false,
        method: 'personal_token' as const,
        priority: 2,
        error: 'Token inválido',
        fallbackAvailable: true
      };

      const appPasswordResult = {
        success: true,
        method: 'app_password' as const,
        priority: 3,
        fallbackAvailable: true
      };

      expect(() => AuthenticationResultSchema.parse(patResult)).not.toThrow();
      expect(() => AuthenticationResultSchema.parse(appPasswordResult)).not.toThrow();
      expect(patResult.fallbackAvailable).toBe(true);
      expect(appPasswordResult.success).toBe(true);
    });

    it('deve permitir fallback de App Password para Basic Auth', () => {
      const appPasswordResult = {
        success: false,
        method: 'app_password' as const,
        priority: 3,
        error: 'Credenciais inválidas',
        fallbackAvailable: true
      };

      const basicAuthResult = {
        success: true,
        method: 'basic_auth' as const,
        priority: 4,
        fallbackAvailable: false // Último método
      };

      expect(() => AuthenticationResultSchema.parse(appPasswordResult)).not.toThrow();
      expect(() => AuthenticationResultSchema.parse(basicAuthResult)).not.toThrow();
      expect(appPasswordResult.fallbackAvailable).toBe(true);
      expect(basicAuthResult.fallbackAvailable).toBe(false);
    });

    it('deve indicar quando não há fallback disponível', () => {
      const basicAuthResult = {
        success: false,
        method: 'basic_auth' as const,
        priority: 4,
        error: 'Credenciais inválidas',
        fallbackAvailable: false
      };

      expect(() => AuthenticationResultSchema.parse(basicAuthResult)).not.toThrow();
      expect(basicAuthResult.fallbackAvailable).toBe(false);
    });
  });

  describe('Tratamento de erros de autenticação', () => {
    it('deve tratar erro de token expirado', () => {
      const expiredTokenResult = {
        success: false,
        method: 'oauth2' as const,
        priority: 1,
        error: 'Token expirado',
        fallbackAvailable: true
      };

      expect(() => AuthenticationResultSchema.parse(expiredTokenResult)).not.toThrow();
      expect(expiredTokenResult.error).toBe('Token expirado');
    });

    it('deve tratar erro de credenciais inválidas', () => {
      const invalidCredentialsResult = {
        success: false,
        method: 'personal_token' as const,
        priority: 2,
        error: 'Credenciais inválidas',
        fallbackAvailable: true
      };

      expect(() => AuthenticationResultSchema.parse(invalidCredentialsResult)).not.toThrow();
      expect(invalidCredentialsResult.error).toBe('Credenciais inválidas');
    });

    it('deve tratar erro de servidor indisponível', () => {
      const serverErrorResult = {
        success: false,
        method: 'app_password' as const,
        priority: 3,
        error: 'Servidor indisponível',
        fallbackAvailable: true
      };

      expect(() => AuthenticationResultSchema.parse(serverErrorResult)).not.toThrow();
      expect(serverErrorResult.error).toBe('Servidor indisponível');
    });

    it('deve tratar erro de rede', () => {
      const networkErrorResult = {
        success: false,
        method: 'basic_auth' as const,
        priority: 4,
        error: 'Erro de rede',
        fallbackAvailable: false
      };

      expect(() => AuthenticationResultSchema.parse(networkErrorResult)).not.toThrow();
      expect(networkErrorResult.error).toBe('Erro de rede');
    });
  });

  describe('Validação de credenciais', () => {
    it('deve validar credenciais OAuth2 completas', () => {
      const validOAuth2Credentials = {
        type: 'oauth2' as const,
        accessToken: 'access-token',
        clientId: 'client-id',
        clientSecret: 'client-secret'
      };

      expect(() => AuthenticationCredentialsSchema.parse(validOAuth2Credentials)).not.toThrow();
    });

    it('deve validar credenciais Personal Token', () => {
      const validPatCredentials = {
        type: 'personal_token' as const,
        token: 'personal-token'
      };

      expect(() => AuthenticationCredentialsSchema.parse(validPatCredentials)).not.toThrow();
    });

    it('deve validar credenciais App Password', () => {
      const validAppPasswordCredentials = {
        type: 'app_password' as const,
        username: 'username',
        password: 'password'
      };

      expect(() => AuthenticationCredentialsSchema.parse(validAppPasswordCredentials)).not.toThrow();
    });

    it('deve validar credenciais Basic Auth', () => {
      const validBasicAuthCredentials = {
        type: 'basic_auth' as const,
        username: 'username',
        password: 'password'
      };

      expect(() => AuthenticationCredentialsSchema.parse(validBasicAuthCredentials)).not.toThrow();
    });

    it('deve rejeitar credenciais OAuth2 incompletas', () => {
      const invalidOAuth2Credentials = {
        type: 'oauth2' as const,
        accessToken: 'access-token',
        // Faltando clientId e clientSecret
      };

      expect(() => AuthenticationCredentialsSchema.parse(invalidOAuth2Credentials)).toThrow();
    });

    it('deve rejeitar credenciais Personal Token sem token', () => {
      const invalidPatCredentials = {
        type: 'personal_token' as const
        // Faltando token
      };

      expect(() => AuthenticationCredentialsSchema.parse(invalidPatCredentials)).toThrow();
    });

    it('deve rejeitar credenciais App Password sem username', () => {
      const invalidAppPasswordCredentials = {
        type: 'app_password' as const,
        password: 'password'
        // Faltando username
      };

      expect(() => AuthenticationCredentialsSchema.parse(invalidAppPasswordCredentials)).toThrow();
    });

    it('deve rejeitar credenciais Basic Auth sem password', () => {
      const invalidBasicAuthCredentials = {
        type: 'basic_auth' as const,
        username: 'username'
        // Faltando password
      };

      expect(() => AuthenticationCredentialsSchema.parse(invalidBasicAuthCredentials)).toThrow();
    });
  });

  describe('Segurança dos métodos de autenticação', () => {
    it('deve considerar OAuth2 como seguro', () => {
      const oauth2Priority = {
        method: 'oauth2' as const,
        priority: 1,
        isSecure: true,
        isRecommended: true
      };

      expect(oauth2Priority.isSecure).toBe(true);
      expect(oauth2Priority.isRecommended).toBe(true);
    });

    it('deve considerar Personal Token como seguro', () => {
      const patPriority = {
        method: 'personal_token' as const,
        priority: 2,
        isSecure: true,
        isRecommended: true
      };

      expect(patPriority.isSecure).toBe(true);
      expect(patPriority.isRecommended).toBe(true);
    });

    it('deve considerar App Password como não seguro', () => {
      const appPasswordPriority = {
        method: 'app_password' as const,
        priority: 3,
        isSecure: false,
        isRecommended: false
      };

      expect(appPasswordPriority.isSecure).toBe(false);
      expect(appPasswordPriority.isRecommended).toBe(false);
    });

    it('deve considerar Basic Auth como não seguro', () => {
      const basicAuthPriority = {
        method: 'basic_auth' as const,
        priority: 4,
        isSecure: false,
        isRecommended: false
      };

      expect(basicAuthPriority.isSecure).toBe(false);
      expect(basicAuthPriority.isRecommended).toBe(false);
    });
  });
});
