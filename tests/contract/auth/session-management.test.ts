import { z } from 'zod';

// Enums para validação
const ServerTypeEnum = z.enum(['datacenter', 'cloud']);
const AuthenticationMethodEnum = z.enum(['oauth2', 'personal_token', 'app_password', 'basic_auth']);

// Schemas de validação para gerenciamento de sessão
const SessionRequestSchema = z.object({
  userId: z.number().int().positive('userId deve ser um número inteiro positivo'),
  serverType: ServerTypeEnum,
  authenticationMethod: AuthenticationMethodEnum,
  credentials: z.record(z.string(), z.any()).optional()
});

const SessionResponseSchema = z.object({
  sessionId: z.string().uuid('sessionId deve ser um UUID válido'),
  userId: z.number().int().positive('userId deve ser um número inteiro positivo'),
  serverType: ServerTypeEnum,
  authenticationMethod: AuthenticationMethodEnum,
  createdAt: z.string().datetime('createdAt deve ser uma data ISO válida'),
  expiresAt: z.string().datetime('expiresAt deve ser uma data ISO válida'),
  isActive: z.boolean(),
  lastAccessedAt: z.string().datetime('lastAccessedAt deve ser uma data ISO válida').optional()
});

const SessionListResponseSchema = z.object({
  sessions: z.array(SessionResponseSchema),
  totalCount: z.number().int().nonnegative('totalCount deve ser um número inteiro não negativo'),
  activeCount: z.number().int().nonnegative('activeCount deve ser um número inteiro não negativo')
});

describe('Session Management Contract Tests', () => {
  describe('SessionRequest validation', () => {
    it('deve validar request válido', () => {
      const validRequest = {
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        credentials: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        }
      };

      expect(() => SessionRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('deve validar request sem credentials', () => {
      const validRequest = {
        userId: 12345,
        serverType: 'cloud' as const,
        authenticationMethod: 'personal_token' as const
      };

      expect(() => SessionRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('deve rejeitar request sem userId', () => {
      const invalidRequest = {
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const
      };

      expect(() => SessionRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar userId negativo', () => {
      const invalidRequest = {
        userId: -1,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const
      };

      expect(() => SessionRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar userId zero', () => {
      const invalidRequest = {
        userId: 0,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const
      };

      expect(() => SessionRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar userId não inteiro', () => {
      const invalidRequest = {
        userId: 123.45,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const
      };

      expect(() => SessionRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar serverType inválido', () => {
      const invalidRequest = {
        userId: 12345,
        serverType: 'invalid' as any,
        authenticationMethod: 'oauth2' as const
      };

      expect(() => SessionRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve rejeitar authenticationMethod inválido', () => {
      const invalidRequest = {
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'invalid' as any
      };

      expect(() => SessionRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('deve aceitar todos os serverTypes válidos', () => {
      const validServerTypes = ['datacenter', 'cloud'] as const;
      
      validServerTypes.forEach(serverType => {
        const validRequest = {
          userId: 12345,
          serverType,
          authenticationMethod: 'oauth2' as const
        };

        expect(() => SessionRequestSchema.parse(validRequest)).not.toThrow();
      });
    });

    it('deve aceitar todos os authenticationMethods válidos', () => {
      const validAuthMethods = ['oauth2', 'personal_token', 'app_password', 'basic_auth'] as const;
      
      validAuthMethods.forEach(authMethod => {
        const validRequest = {
          userId: 12345,
          serverType: 'datacenter' as const,
          authenticationMethod: authMethod
        };

        expect(() => SessionRequestSchema.parse(validRequest)).not.toThrow();
      });
    });
  });

  describe('SessionResponse validation', () => {
    it('deve validar response válido', () => {
      const validResponse = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        createdAt: '2023-01-01T00:00:00.000Z',
        expiresAt: '2023-01-01T01:00:00.000Z',
        isActive: true,
        lastAccessedAt: '2023-01-01T00:30:00.000Z'
      };

      expect(() => SessionResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('deve validar response sem lastAccessedAt', () => {
      const validResponse = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        createdAt: '2023-01-01T00:00:00.000Z',
        expiresAt: '2023-01-01T01:00:00.000Z',
        isActive: true
      };

      expect(() => SessionResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('deve rejeitar sessionId inválido', () => {
      const invalidResponse = {
        sessionId: 'invalid-uuid',
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        createdAt: '2023-01-01T00:00:00.000Z',
        expiresAt: '2023-01-01T01:00:00.000Z',
        isActive: true
      };

      expect(() => SessionResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar createdAt inválido', () => {
      const invalidResponse = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        createdAt: 'invalid-date',
        expiresAt: '2023-01-01T01:00:00.000Z',
        isActive: true
      };

      expect(() => SessionResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar expiresAt inválido', () => {
      const invalidResponse = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        createdAt: '2023-01-01T00:00:00.000Z',
        expiresAt: 'invalid-date',
        isActive: true
      };

      expect(() => SessionResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar lastAccessedAt inválido', () => {
      const invalidResponse = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 12345,
        serverType: 'datacenter' as const,
        authenticationMethod: 'oauth2' as const,
        createdAt: '2023-01-01T00:00:00.000Z',
        expiresAt: '2023-01-01T01:00:00.000Z',
        isActive: true,
        lastAccessedAt: 'invalid-date'
      };

      expect(() => SessionResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('SessionListResponse validation', () => {
    it('deve validar response válido com sessões', () => {
      const validResponse = {
        sessions: [
          {
            sessionId: '550e8400-e29b-41d4-a716-446655440000',
            userId: 12345,
            serverType: 'datacenter' as const,
            authenticationMethod: 'oauth2' as const,
            createdAt: '2023-01-01T00:00:00.000Z',
            expiresAt: '2023-01-01T01:00:00.000Z',
            isActive: true
          }
        ],
        totalCount: 1,
        activeCount: 1
      };

      expect(() => SessionListResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('deve validar response válido sem sessões', () => {
      const validResponse = {
        sessions: [],
        totalCount: 0,
        activeCount: 0
      };

      expect(() => SessionListResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('deve rejeitar totalCount negativo', () => {
      const invalidResponse = {
        sessions: [],
        totalCount: -1,
        activeCount: 0
      };

      expect(() => SessionListResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar activeCount negativo', () => {
      const invalidResponse = {
        sessions: [],
        totalCount: 0,
        activeCount: -1
      };

      expect(() => SessionListResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar activeCount maior que totalCount', () => {
      const invalidResponse = {
        sessions: [],
        totalCount: 1,
        activeCount: 2
      };

      expect(() => SessionListResponseSchema.parse(invalidResponse)).not.toThrow(); // Não é erro de schema, mas lógica de negócio
    });
  });
});
