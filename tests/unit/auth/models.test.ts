import { z } from 'zod';

// Modelos de dados de autenticação
const AuthenticationCredentialsSchema = z.object({
  type: z.enum(['oauth2', 'personal_token', 'app_password', 'basic_auth']),
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

const UserSessionSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.number().int().positive(),
  serverType: z.enum(['datacenter', 'cloud']),
  authenticationMethod: z.enum(['oauth2', 'personal_token', 'app_password', 'basic_auth']),
  credentials: AuthenticationCredentialsSchema,
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  isActive: z.boolean(),
  lastAccessedAt: z.string().datetime().optional()
});

const ServerConfigurationSchema = z.object({
  serverType: z.enum(['datacenter', 'cloud']),
  baseUrl: z.string().url(),
  apiVersion: z.string(),
  capabilities: z.array(z.string()),
  detectedAt: z.string().datetime(),
  cacheExpiresAt: z.string().datetime()
});

const OAuthTokenSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().positive(),
  refreshToken: z.string().optional(),
  scope: z.string().optional(),
  createdAt: z.string().datetime()
});

describe('Authentication Models Unit Tests', () => {
  describe('AuthenticationCredentials validation', () => {
    it('deve validar credenciais OAuth2 válidas', () => {
      const validCredentials = {
        type: 'oauth2' as const,
        accessToken: 'access-token',
        clientId: 'client-id',
        clientSecret: 'client-secret'
      };

      expect(() => AuthenticationCredentialsSchema.parse(validCredentials)).not.toThrow();
    });

    it('deve validar credenciais Personal Token válidas', () => {
      const validCredentials = {
        type: 'personal_token' as const,
        token: 'personal-token'
      };

      expect(() => AuthenticationCredentialsSchema.parse(validCredentials)).not.toThrow();
    });

    it('deve validar credenciais App Password válidas', () => {
      const validCredentials = {
        type: 'app_password' as const,
        username: 'username',
        password: 'password'
      };

      expect(() => AuthenticationCredentialsSchema.parse(validCredentials)).not.toThrow();
    });

    it('deve validar credenciais Basic Auth válidas', () => {
      const validCredentials = {
        type: 'basic_auth' as const,
        username: 'username',
        password: 'password'
      };

      expect(() => AuthenticationCredentialsSchema.parse(validCredentials)).not.toThrow();
    });

    it('deve rejeitar OAuth2 sem accessToken', () => {
      const invalidCredentials = {
        type: 'oauth2' as const,
        clientId: 'client-id',
        clientSecret: 'client-secret'
      };

      expect(() => AuthenticationCredentialsSchema.parse(invalidCredentials)).toThrow();
    });

    it('deve rejeitar OAuth2 sem clientId', () => {
      const invalidCredentials = {
        type: 'oauth2' as const,
        accessToken: 'access-token',
        clientSecret: 'client-secret'
      };

      expect(() => AuthenticationCredentialsSchema.parse(invalidCredentials)).toThrow();
    });

    it('deve rejeitar Personal Token sem token', () => {
      const invalidCredentials = {
        type: 'personal_token' as const
      };

      expect(() => AuthenticationCredentialsSchema.parse(invalidCredentials)).toThrow();
    });

    it('deve rejeitar App Password sem username', () => {
      const invalidCredentials = {
        type: 'app_password' as const,
        password: 'password'
      };

      expect(() => AuthenticationCredentialsSchema.parse(invalidCredentials)).toThrow();
    });

    it('deve rejeitar App Password sem password', () => {
      const invalidCredentials = {
        type: 'app_password' as const,
        username: 'username'
      };

      expect(() => AuthenticationCredentialsSchema.parse(invalidCredentials)).toThrow();
    });

    it('deve rejeitar Basic Auth sem username', () => {
      const invalidCredentials = {
        type: 'basic_auth' as const,
        password: 'password'
      };

      expect(() => AuthenticationCredentialsSchema.parse(invalidCredentials)).toThrow();
    });

    it('deve rejeitar Basic Auth sem password', () => {
      const invalidCredentials = {
        type: 'basic_auth' as const,
        username: 'username'
      };

      expect(() => AuthenticationCredentialsSchema.parse(invalidCredentials)).toThrow();
    });
  });

  describe('UserSession validation', () => {
    it('deve validar sessão válida', () => {
      const validSession = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        credentials: {
          type: 'oauth2' as const,
          accessToken: 'access-token',
          clientId: 'client-id',
          clientSecret: 'client-secret'
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        expiresAt: '2023-01-01T01:00:00.000Z',
        isActive: true,
        lastAccessedAt: '2023-01-01T00:30:00.000Z'
      };

      expect(() => UserSessionSchema.parse(validSession)).not.toThrow();
    });

    it('deve validar sessão sem lastAccessedAt', () => {
      const validSession = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        credentials: {
          type: 'oauth2' as const,
          accessToken: 'access-token',
          clientId: 'client-id',
          clientSecret: 'client-secret'
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        expiresAt: '2023-01-01T01:00:00.000Z',
        isActive: true
      };

      expect(() => UserSessionSchema.parse(validSession)).not.toThrow();
    });

    it('deve rejeitar sessão com sessionId inválido', () => {
      const invalidSession = {
        sessionId: 'invalid-uuid',
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        credentials: {
          type: 'oauth2' as const,
          accessToken: 'access-token',
          clientId: 'client-id',
          clientSecret: 'client-secret'
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        expiresAt: '2023-01-01T01:00:00.000Z',
        isActive: true
      };

      expect(() => UserSessionSchema.parse(invalidSession)).toThrow();
    });

    it('deve rejeitar sessão com userId negativo', () => {
      const invalidSession = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        userId: -1,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        credentials: {
          type: 'oauth2' as const,
          accessToken: 'access-token',
          clientId: 'client-id',
          clientSecret: 'client-secret'
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        expiresAt: '2023-01-01T01:00:00.000Z',
        isActive: true
      };

      expect(() => UserSessionSchema.parse(invalidSession)).toThrow();
    });

    it('deve rejeitar sessão com credenciais inválidas', () => {
      const invalidSession = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        credentials: {
          type: 'oauth2' as const,
          // Faltando accessToken
          clientId: 'client-id',
          clientSecret: 'client-secret'
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        expiresAt: '2023-01-01T01:00:00.000Z',
        isActive: true
      };

      expect(() => UserSessionSchema.parse(invalidSession)).toThrow();
    });
  });

  describe('ServerConfiguration validation', () => {
    it('deve validar configuração Data Center válida', () => {
      const validConfig = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '1.0',
        capabilities: ['oauth2', 'personal_tokens', 'app_passwords'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z'
      };

      expect(() => ServerConfigurationSchema.parse(validConfig)).not.toThrow();
    });

    it('deve validar configuração Cloud válida', () => {
      const validConfig = {
        serverType: 'cloud' as const,
        baseUrl: 'https://api.bitbucket.org',
        apiVersion: '2.0',
        capabilities: ['oauth2', 'personal_tokens'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z'
      };

      expect(() => ServerConfigurationSchema.parse(validConfig)).not.toThrow();
    });

    it('deve rejeitar baseUrl inválida', () => {
      const invalidConfig = {
        serverType: 'datacenter' as const,
        baseUrl: 'invalid-url',
        apiVersion: '1.0',
        capabilities: ['oauth2'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z'
      };

      expect(() => ServerConfigurationSchema.parse(invalidConfig)).toThrow();
    });

    it('deve rejeitar serverType inválido', () => {
      const invalidConfig = {
        serverType: 'invalid' as any,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '1.0',
        capabilities: ['oauth2'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z'
      };

      expect(() => ServerConfigurationSchema.parse(invalidConfig)).toThrow();
    });

    it('deve rejeitar capabilities não array', () => {
      const invalidConfig = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '1.0',
        capabilities: 'oauth2' as any,
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z'
      };

      expect(() => ServerConfigurationSchema.parse(invalidConfig)).toThrow();
    });
  });

  describe('OAuthToken validation', () => {
    it('deve validar token OAuth válido', () => {
      const validToken = {
        accessToken: 'access-token',
        tokenType: 'Bearer' as const,
        expiresIn: 3600,
        refreshToken: 'refresh-token',
        scope: 'read write',
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      expect(() => OAuthTokenSchema.parse(validToken)).not.toThrow();
    });

    it('deve validar token OAuth sem refreshToken', () => {
      const validToken = {
        accessToken: 'access-token',
        tokenType: 'Bearer' as const,
        expiresIn: 3600,
        scope: 'read write',
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      expect(() => OAuthTokenSchema.parse(validToken)).not.toThrow();
    });

    it('deve validar token OAuth sem scope', () => {
      const validToken = {
        accessToken: 'access-token',
        tokenType: 'Bearer' as const,
        expiresIn: 3600,
        refreshToken: 'refresh-token',
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      expect(() => OAuthTokenSchema.parse(validToken)).not.toThrow();
    });

    it('deve rejeitar accessToken vazio', () => {
      const invalidToken = {
        accessToken: '',
        tokenType: 'Bearer' as const,
        expiresIn: 3600,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      expect(() => OAuthTokenSchema.parse(invalidToken)).toThrow();
    });

    it('deve rejeitar tokenType diferente de Bearer', () => {
      const invalidToken = {
        accessToken: 'access-token',
        tokenType: 'Basic' as any,
        expiresIn: 3600,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      expect(() => OAuthTokenSchema.parse(invalidToken)).toThrow();
    });

    it('deve rejeitar expiresIn negativo', () => {
      const invalidToken = {
        accessToken: 'access-token',
        tokenType: 'Bearer' as const,
        expiresIn: -1,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      expect(() => OAuthTokenSchema.parse(invalidToken)).toThrow();
    });

    it('deve rejeitar expiresIn zero', () => {
      const invalidToken = {
        accessToken: 'access-token',
        tokenType: 'Bearer' as const,
        expiresIn: 0,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      expect(() => OAuthTokenSchema.parse(invalidToken)).toThrow();
    });

    it('deve rejeitar createdAt inválido', () => {
      const invalidToken = {
        accessToken: 'access-token',
        tokenType: 'Bearer' as const,
        expiresIn: 3600,
        createdAt: 'invalid-date'
      };

      expect(() => OAuthTokenSchema.parse(invalidToken)).toThrow();
    });
  });

  describe('Transições de estado', () => {
    it('deve permitir transição de sessão ativa para inativa', () => {
      const activeSession = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        credentials: {
          type: 'oauth2' as const,
          accessToken: 'access-token',
          clientId: 'client-id',
          clientSecret: 'client-secret'
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        expiresAt: '2023-01-01T01:00:00.000Z',
        isActive: true
      };

      const inactiveSession = {
        ...activeSession,
        isActive: false
      };

      expect(() => UserSessionSchema.parse(activeSession)).not.toThrow();
      expect(() => UserSessionSchema.parse(inactiveSession)).not.toThrow();
    });

    it('deve permitir atualização de lastAccessedAt', () => {
      const session = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        credentials: {
          type: 'oauth2' as const,
          accessToken: 'access-token',
          clientId: 'client-id',
          clientSecret: 'client-secret'
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        expiresAt: '2023-01-01T01:00:00.000Z',
        isActive: true
      };

      const updatedSession = {
        ...session,
        lastAccessedAt: '2023-01-01T00:30:00.000Z'
      };

      expect(() => UserSessionSchema.parse(session)).not.toThrow();
      expect(() => UserSessionSchema.parse(updatedSession)).not.toThrow();
    });
  });
});
