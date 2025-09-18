import { z } from 'zod';

// Enums para autenticação
export const ServerTypeEnum = z.enum(['datacenter', 'cloud']);
export const AuthenticationMethodEnum = z.enum(['oauth2', 'personal_token', 'app_password', 'basic_auth']);
export const DetectionMethodEnum = z.enum(['application_properties', 'api_2_0', 'fallback']);

// Schemas de validação para credenciais de autenticação
export const AuthenticationCredentialsSchema = z.object({
  type: AuthenticationMethodEnum,
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

// Schema para sessão de usuário
export const UserSessionSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.number().int().positive(),
  serverType: ServerTypeEnum,
  authenticationMethod: AuthenticationMethodEnum,
  credentials: AuthenticationCredentialsSchema,
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  isActive: z.boolean(),
  lastAccessedAt: z.string().datetime().optional()
});

// Schema para configuração de servidor
export const ServerConfigurationSchema = z.object({
  serverType: ServerTypeEnum,
  baseUrl: z.string().url(),
  apiVersion: z.string(),
  capabilities: z.array(z.string()),
  detectedAt: z.string().datetime(),
  cacheExpiresAt: z.string().datetime(),
  detectionMethod: DetectionMethodEnum
});

// Schema para token OAuth
export const OAuthTokenSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().positive(),
  refreshToken: z.string().optional(),
  scope: z.string().optional(),
  createdAt: z.string().datetime()
});

// Schemas para OAuth Authorization
export const OAuthAuthorizationRequestSchema = z.object({
  responseType: z.literal('code'),
  clientId: z.string().min(1, 'client_id é obrigatório'),
  redirectUri: z.string().url('redirect_uri deve ser uma URL válida'),
  scope: z.string().optional(),
  state: z.string().min(1, 'state é obrigatório para proteção CSRF'),
  codeChallenge: z.string().min(1, 'code_challenge é obrigatório para PKCE'),
  codeChallengeMethod: z.literal('S256').optional()
});

export const OAuthAuthorizationResponseSchema = z.object({
  authorizationUrl: z.string().url('URL de autorização deve ser válida'),
  state: z.string(),
  codeChallenge: z.string()
});

// Schemas para OAuth Token Exchange
export const OAuthTokenRequestSchema = z.object({
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

export const OAuthTokenResponseSchema = z.object({
  accessToken: z.string().min(1, 'access_token é obrigatório'),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().positive('expires_in deve ser um número positivo'),
  refreshToken: z.string().optional(),
  scope: z.string().optional()
});

// Schemas para Current User (Data Center)
export const UserResponseSchema = z.object({
  name: z.string().min(1, 'name é obrigatório'),
  emailAddress: z.string().email('emailAddress deve ser um email válido'),
  id: z.number().int().positive('id deve ser um número inteiro positivo'),
  displayName: z.string().min(1, 'displayName é obrigatório'),
  slug: z.string().min(1, 'slug é obrigatório'),
  type: z.literal('NORMAL'),
  active: z.boolean(),
  links: z.object({
    self: z.array(z.object({
      href: z.string().url('href deve ser uma URL válida')
    }))
  })
});

// Schemas para Current User (Cloud)
export const CloudUserResponseSchema = z.object({
  uuid: z.string().uuid('uuid deve ser um UUID válido'),
  username: z.string().min(1, 'username é obrigatório'),
  display_name: z.string().min(1, 'display_name é obrigatório'),
  account_id: z.string().min(1, 'account_id é obrigatório'),
  account_status: z.enum(['active', 'inactive']),
  email: z.string().email('email deve ser um email válido'),
  created_on: z.string().datetime('created_on deve ser uma data ISO válida'),
  has_2fa_enabled: z.boolean(),
  links: z.object({
    self: z.object({
      href: z.string().url('href deve ser uma URL válida')
    }),
    avatar: z.object({
      href: z.string().url('href deve ser uma URL válida')
    })
  })
});

// Schemas para Session Management
export const SessionRequestSchema = z.object({
  userId: z.number().int().positive('userId deve ser um número inteiro positivo'),
  serverType: ServerTypeEnum,
  authenticationMethod: AuthenticationMethodEnum,
  credentials: z.record(z.string(), z.any()).optional()
});

export const SessionResponseSchema = z.object({
  sessionId: z.string().uuid('sessionId deve ser um UUID válido'),
  userId: z.number().int().positive('userId deve ser um número inteiro positivo'),
  serverType: ServerTypeEnum,
  authenticationMethod: AuthenticationMethodEnum,
  createdAt: z.string().datetime('createdAt deve ser uma data ISO válida'),
  expiresAt: z.string().datetime('expiresAt deve ser uma data ISO válida'),
  isActive: z.boolean(),
  lastAccessedAt: z.string().datetime('lastAccessedAt deve ser uma data ISO válida').optional()
});

export const SessionListResponseSchema = z.object({
  sessions: z.array(SessionResponseSchema),
  totalCount: z.number().int().nonnegative('totalCount deve ser um número inteiro não negativo'),
  activeCount: z.number().int().nonnegative('activeCount deve ser um número inteiro não negativo')
});

// Schemas para Server Detection
export const ServerDetectionResultSchema = z.object({
  serverType: ServerTypeEnum,
  baseUrl: z.string().url(),
  apiVersion: z.string(),
  capabilities: z.array(z.string()),
  detectedAt: z.string().datetime(),
  cacheExpiresAt: z.string().datetime(),
  detectionMethod: DetectionMethodEnum
});

export const ApplicationPropertiesResponseSchema = z.object({
  version: z.string(),
  buildNumber: z.string(),
  buildDate: z.string(),
  displayName: z.string(),
  platformVersion: z.string().optional()
});

export const Api2ResponseSchema = z.object({
  type: z.string(),
  uuid: z.string(),
  links: z.object({
    self: z.object({
      href: z.string().url()
    })
  })
});

// Schemas para Authentication Hierarchy
export const AuthenticationPrioritySchema = z.object({
  method: AuthenticationMethodEnum,
  priority: z.number().int().min(1).max(4),
  isSecure: z.boolean(),
  isRecommended: z.boolean()
});

export const AuthenticationResultSchema = z.object({
  success: z.boolean(),
  method: AuthenticationMethodEnum,
  priority: z.number().int().min(1).max(4),
  error: z.string().optional(),
  fallbackAvailable: z.boolean()
});

// Schemas para OAuth Revocation
export const OAuthRevocationRequestSchema = z.object({
  token: z.string().min(1),
  tokenTypeHint: z.enum(['access_token', 'refresh_token']).optional(),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1)
});

// Tipos TypeScript derivados dos schemas
export type ServerType = z.infer<typeof ServerTypeEnum>;
export type AuthenticationMethod = z.infer<typeof AuthenticationMethodEnum>;
export type DetectionMethod = z.infer<typeof DetectionMethodEnum>;
export type AuthenticationCredentials = z.infer<typeof AuthenticationCredentialsSchema>;
export type UserSession = z.infer<typeof UserSessionSchema>;
export type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;
export type OAuthToken = z.infer<typeof OAuthTokenSchema>;
export type OAuthAuthorizationRequest = z.infer<typeof OAuthAuthorizationRequestSchema>;
export type OAuthAuthorizationResponse = z.infer<typeof OAuthAuthorizationResponseSchema>;
export type OAuthTokenRequest = z.infer<typeof OAuthTokenRequestSchema>;
export type OAuthTokenResponse = z.infer<typeof OAuthTokenResponseSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type CloudUserResponse = z.infer<typeof CloudUserResponseSchema>;
export type SessionRequest = z.infer<typeof SessionRequestSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type SessionListResponse = z.infer<typeof SessionListResponseSchema>;
export type ServerDetectionResult = z.infer<typeof ServerDetectionResultSchema>;
export type ApplicationPropertiesResponse = z.infer<typeof ApplicationPropertiesResponseSchema>;
export type Api2Response = z.infer<typeof Api2ResponseSchema>;
export type AuthenticationPriority = z.infer<typeof AuthenticationPrioritySchema>;
export type AuthenticationResult = z.infer<typeof AuthenticationResultSchema>;
export type OAuthRevocationRequest = z.infer<typeof OAuthRevocationRequestSchema>;

// Constantes para hierarquia de autenticação
export const AUTHENTICATION_PRIORITIES: Record<AuthenticationMethod, AuthenticationPriority> = {
  oauth2: {
    method: 'oauth2',
    priority: 1,
    isSecure: true,
    isRecommended: true
  },
  personal_token: {
    method: 'personal_token',
    priority: 2,
    isSecure: true,
    isRecommended: true
  },
  app_password: {
    method: 'app_password',
    priority: 3,
    isSecure: false,
    isRecommended: false
  },
  basic_auth: {
    method: 'basic_auth',
    priority: 4,
    isSecure: false,
    isRecommended: false
  }
};

// Constantes para capacidades de servidor
export const SERVER_CAPABILITIES = {
  datacenter: ['oauth2', 'personal_tokens', 'app_passwords', 'basic_auth'] as string[],
  cloud: ['oauth2', 'personal_tokens', 'basic_auth'] as string[]
};

// Constantes para configuração
export const CACHE_DURATION = {
  SERVER_CONFIG: 5 * 60 * 1000, // 5 minutos
  HEALTH_CHECK: 30 * 1000, // 30 segundos
  SESSION: 60 * 60 * 1000 // 1 hora
} as const;

export const TIMEOUTS = {
  DETECTION: 5000, // 5 segundos
  REQUEST: 10000, // 10 segundos
  RETRY: 3000 // 3 segundos
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000, // 1 segundo
  MAX_DELAY: 10000 // 10 segundos
} as const;
