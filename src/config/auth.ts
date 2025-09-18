import { z } from 'zod';
import { 
  ServerType, 
  AuthenticationMethod,
  SERVER_CAPABILITIES,
  AUTHENTICATION_PRIORITIES,
  CACHE_DURATION,
  TIMEOUTS,
  RETRY_CONFIG
} from '../types/auth';

/**
 * Schema de validação para configuração de OAuth
 */
const OAuthConfigSchema = z.object({
  clientId: z.string().min(1, 'Client ID é obrigatório'),
  clientSecret: z.string().min(1, 'Client Secret é obrigatório'),
  redirectUri: z.string().url('Redirect URI deve ser uma URL válida'),
  scope: z.string().optional(),
  baseUrl: z.string().url('Base URL deve ser uma URL válida'),
  endpoints: z.object({
    authorize: z.string().min(1, 'Endpoint de autorização é obrigatório'),
    token: z.string().min(1, 'Endpoint de token é obrigatório'),
    revoke: z.string().min(1, 'Endpoint de revogação é obrigatório'),
    userInfo: z.string().min(1, 'Endpoint de informações do usuário é obrigatório')
  })
});

/**
 * Schema de validação para configuração de servidor
 */
const ServerConfigSchema = z.object({
  baseUrl: z.string().url('Base URL deve ser uma URL válida'),
  serverType: z.enum(['datacenter', 'cloud']),
  apiVersion: z.string().min(1, 'Versão da API é obrigatória'),
  capabilities: z.array(z.string()),
  timeout: z.number().positive('Timeout deve ser um número positivo'),
  retryAttempts: z.number().int().min(0, 'Número de tentativas deve ser não negativo')
});

/**
 * Schema de validação para configuração de sessão
 */
const SessionConfigSchema = z.object({
  timeout: z.number().positive('Timeout de sessão deve ser um número positivo'),
  refreshThreshold: z.number().positive('Threshold de refresh deve ser um número positivo'),
  maxSessions: z.number().int().positive('Número máximo de sessões deve ser um número inteiro positivo'),
  cleanupInterval: z.number().positive('Intervalo de limpeza deve ser um número positivo')
});

/**
 * Schema de validação para configuração de segurança
 */
const SecurityConfigSchema = z.object({
  encryptionKey: z.string().min(32, 'Chave de criptografia deve ter pelo menos 32 caracteres'),
  jwtSecret: z.string().min(32, 'JWT Secret deve ter pelo menos 32 caracteres'),
  rateLimitWindow: z.number().positive('Janela de rate limit deve ser um número positivo'),
  rateLimitMaxRequests: z.number().int().positive('Máximo de requisições deve ser um número inteiro positivo'),
  maxLoginAttempts: z.number().int().positive('Máximo de tentativas de login deve ser um número inteiro positivo'),
  lockoutDuration: z.number().positive('Duração de lockout deve ser um número positivo'),
  tokenExpirationTime: z.number().positive('Tempo de expiração do token deve ser um número positivo'),
  sessionTimeout: z.number().positive('Timeout de sessão deve ser um número positivo')
});

/**
 * Schema de validação para configuração de cache
 */
const CacheConfigSchema = z.object({
  serverConfig: z.number().positive('Cache de configuração de servidor deve ser um número positivo'),
  healthCheck: z.number().positive('Cache de health check deve ser um número positivo'),
  session: z.number().positive('Cache de sessão deve ser um número positivo'),
  userInfo: z.number().positive('Cache de informações do usuário deve ser um número positivo')
});

/**
 * Schema de validação para configuração completa
 */
const AuthConfigSchema = z.object({
  oauth: OAuthConfigSchema,
  server: ServerConfigSchema,
  session: SessionConfigSchema,
  security: SecurityConfigSchema,
  cache: CacheConfigSchema,
  environment: z.enum(['development', 'staging', 'production']),
  debug: z.boolean(),
  logLevel: z.enum(['error', 'warn', 'info', 'debug'])
});

/**
 * Tipos TypeScript derivados dos schemas
 */
export type OAuthConfig = z.infer<typeof OAuthConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type SessionConfig = z.infer<typeof SessionConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;

/**
 * Classe para gerenciamento de configuração de autenticação
 */
export class AuthConfigurationManager {
  private config: AuthConfig | null = null;
  private configValidationErrors: string[] = [];

  /**
   * Carrega configuração do ambiente
   */
  loadConfiguration(): AuthConfig {
    try {
      const config = this.loadFromEnvironment();
      const validatedConfig = this.validateConfiguration(config);
      this.config = validatedConfig;
      this.configValidationErrors = [];
      return validatedConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.configValidationErrors.push(errorMessage);
      throw new Error(`Falha ao carregar configuração: ${errorMessage}`);
    }
  }

  /**
   * Carrega configuração dos valores padrão
   */
  loadDefaultConfiguration(): AuthConfig {
    const defaultConfig: AuthConfig = {
      oauth: {
        clientId: 'default-client-id',
        clientSecret: 'default-client-secret',
        redirectUri: 'http://localhost:3000/callback',
        scope: 'read write',
        baseUrl: 'https://bitbucket.org',
        endpoints: {
          authorize: '/oauth/authorize',
          token: '/oauth/token',
          revoke: '/oauth/revoke',
          userInfo: '/2.0/user'
        }
      },
      server: {
        baseUrl: 'https://bitbucket.org',
        serverType: 'cloud',
        apiVersion: '2.0',
        capabilities: SERVER_CAPABILITIES.cloud,
        timeout: TIMEOUTS.REQUEST,
        retryAttempts: RETRY_CONFIG.MAX_RETRIES
      },
      session: {
        timeout: 3600000, // 1 hora
        refreshThreshold: 300000, // 5 minutos
        maxSessions: 100,
        cleanupInterval: 600000 // 10 minutos
      },
      security: {
        encryptionKey: this.generateSecureKey(),
        jwtSecret: this.generateSecureKey(),
        rateLimitWindow: 60000, // 1 minuto
        rateLimitMaxRequests: 100,
        maxLoginAttempts: 5,
        lockoutDuration: 300000, // 5 minutos
        tokenExpirationTime: 3600000, // 1 hora
        sessionTimeout: 1800000 // 30 minutos
      },
      cache: {
        serverConfig: CACHE_DURATION.SERVER_CONFIG,
        healthCheck: CACHE_DURATION.HEALTH_CHECK,
        session: CACHE_DURATION.SESSION,
        userInfo: 300000 // 5 minutos
      },
      environment: 'development',
      debug: true,
      logLevel: 'info'
    };

    return this.validateConfiguration(defaultConfig);
  }

  /**
   * Carrega configuração do ambiente
   */
  private loadFromEnvironment(): Partial<AuthConfig> {
    return {
      oauth: {
        clientId: process.env.OAUTH_CLIENT_ID || 'default-client-id',
        clientSecret: process.env.OAUTH_CLIENT_SECRET || 'default-client-secret',
        redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/callback',
        scope: process.env.OAUTH_SCOPE,
        baseUrl: process.env.BITBUCKET_BASE_URL || 'https://bitbucket.org',
        endpoints: {
          authorize: process.env.OAUTH_AUTHORIZE_ENDPOINT || '/oauth/authorize',
          token: process.env.OAUTH_TOKEN_ENDPOINT || '/oauth/token',
          revoke: process.env.OAUTH_REVOKE_ENDPOINT || '/oauth/revoke',
          userInfo: process.env.OAUTH_USER_INFO_ENDPOINT || '/2.0/user'
        }
      },
      server: {
        baseUrl: process.env.BITBUCKET_BASE_URL || 'https://bitbucket.org',
        serverType: (process.env.BITBUCKET_SERVER_TYPE as ServerType) || 'cloud',
        apiVersion: process.env.BITBUCKET_API_VERSION || '2.0',
        capabilities: process.env.BITBUCKET_CAPABILITIES?.split(',') || [],
        timeout: process.env.BITBUCKET_TIMEOUT ? parseInt(process.env.BITBUCKET_TIMEOUT, 10) : 10000,
        retryAttempts: process.env.BITBUCKET_RETRY_ATTEMPTS ? parseInt(process.env.BITBUCKET_RETRY_ATTEMPTS, 10) : 3
      },
      session: {
        timeout: process.env.SESSION_TIMEOUT ? parseInt(process.env.SESSION_TIMEOUT, 10) : 3600000,
        refreshThreshold: process.env.SESSION_REFRESH_THRESHOLD ? parseInt(process.env.SESSION_REFRESH_THRESHOLD, 10) : 300000,
        maxSessions: process.env.SESSION_MAX_SESSIONS ? parseInt(process.env.SESSION_MAX_SESSIONS, 10) : 100,
        cleanupInterval: process.env.SESSION_CLEANUP_INTERVAL ? parseInt(process.env.SESSION_CLEANUP_INTERVAL, 10) : 600000
      },
      security: {
        encryptionKey: process.env.ENCRYPTION_KEY || this.generateSecureKey(),
        jwtSecret: process.env.JWT_SECRET || this.generateSecureKey(),
        rateLimitWindow: process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW, 10) : 60000,
        rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) : 100,
        maxLoginAttempts: process.env.MAX_LOGIN_ATTEMPTS ? parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) : 5,
        lockoutDuration: process.env.LOCKOUT_DURATION ? parseInt(process.env.LOCKOUT_DURATION, 10) : 300000,
        tokenExpirationTime: process.env.TOKEN_EXPIRATION_TIME ? parseInt(process.env.TOKEN_EXPIRATION_TIME, 10) : 3600000,
        sessionTimeout: process.env.SESSION_TIMEOUT ? parseInt(process.env.SESSION_TIMEOUT, 10) : 1800000
      },
      cache: {
        serverConfig: process.env.CACHE_SERVER_CONFIG ? parseInt(process.env.CACHE_SERVER_CONFIG, 10) : 300000,
        healthCheck: process.env.CACHE_HEALTH_CHECK ? parseInt(process.env.CACHE_HEALTH_CHECK, 10) : 30000,
        session: process.env.CACHE_SESSION ? parseInt(process.env.CACHE_SESSION, 10) : 3600000,
        userInfo: process.env.CACHE_USER_INFO ? parseInt(process.env.CACHE_USER_INFO, 10) : 300000
      },
      environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
      debug: process.env.DEBUG === 'true',
      logLevel: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info'
    };
  }

  /**
   * Valida configuração usando schemas Zod
   */
  private validateConfiguration(config: Partial<AuthConfig>): AuthConfig {
    try {
      return AuthConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        throw new Error(`Erros de validação: ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Obtém configuração atual
   */
  getConfiguration(): AuthConfig {
    if (!this.config) {
      throw new Error('Configuração não carregada. Chame loadConfiguration() primeiro.');
    }
    return this.config;
  }

  /**
   * Obtém configuração de OAuth
   */
  getOAuthConfig(): OAuthConfig {
    return this.getConfiguration().oauth;
  }

  /**
   * Obtém configuração de servidor
   */
  getServerConfig(): ServerConfig {
    return this.getConfiguration().server;
  }

  /**
   * Obtém configuração de sessão
   */
  getSessionConfig(): SessionConfig {
    return this.getConfiguration().session;
  }

  /**
   * Obtém configuração de segurança
   */
  getSecurityConfig(): SecurityConfig {
    return this.getConfiguration().security;
  }

  /**
   * Obtém configuração de cache
   */
  getCacheConfig(): CacheConfig {
    return this.getConfiguration().cache;
  }

  /**
   * Atualiza configuração
   */
  updateConfiguration(updates: Partial<AuthConfig>): AuthConfig {
    if (!this.config) {
      throw new Error('Configuração não carregada. Chame loadConfiguration() primeiro.');
    }

    const updatedConfig = { ...this.config, ...updates };
    const validatedConfig = this.validateConfiguration(updatedConfig);
    this.config = validatedConfig;
    return validatedConfig;
  }

  /**
   * Obtém configuração otimizada para o tipo de servidor
   */
  getOptimizedConfiguration(serverType: ServerType): AuthConfig {
    const baseConfig = this.getConfiguration();
    
    // Otimizar configuração baseada no tipo de servidor
    const optimizedConfig: AuthConfig = {
      ...baseConfig,
      server: {
        ...baseConfig.server,
        serverType,
        capabilities: SERVER_CAPABILITIES[serverType],
        apiVersion: serverType === 'cloud' ? '2.0' : '1.0'
      },
      oauth: {
        ...baseConfig.oauth,
        baseUrl: serverType === 'cloud' ? 'https://bitbucket.org' : baseConfig.oauth.baseUrl,
        endpoints: {
          ...baseConfig.oauth.endpoints,
          userInfo: serverType === 'cloud' ? '/2.0/user' : '/rest/api/1.0/users/current'
        }
      },
      session: {
        ...baseConfig.session,
        timeout: serverType === 'cloud' ? 3600000 : 7200000, // Cloud: 1h, Data Center: 2h
        maxSessions: serverType === 'cloud' ? 10 : 50 // Cloud: 10, Data Center: 50
      }
    };

    return this.validateConfiguration(optimizedConfig);
  }

  /**
   * Obtém configuração de autenticação recomendada
   */
  getRecommendedAuthConfiguration(serverType: ServerType): {
    primaryAuthMethod: AuthenticationMethod;
    fallbackAuthMethods: AuthenticationMethod[];
    configuration: AuthConfig;
  } {
    const capabilities = SERVER_CAPABILITIES[serverType];
    const availableMethods: AuthenticationMethod[] = [];

    if (capabilities.includes('oauth2')) {
      availableMethods.push('oauth2');
    }
    if (capabilities.includes('personal_tokens')) {
      availableMethods.push('personal_token');
    }
    if (capabilities.includes('app_passwords' as any)) {
      availableMethods.push('app_password');
    }
    if (capabilities.includes('basic_auth')) {
      availableMethods.push('basic_auth');
    }

    // Ordenar por prioridade
    const sortedMethods = availableMethods.sort((a, b) => 
      AUTHENTICATION_PRIORITIES[a].priority - AUTHENTICATION_PRIORITIES[b].priority
    );

    const primaryMethod = sortedMethods[0] || 'basic_auth';
    const fallbackMethods = sortedMethods.slice(1);

    return {
      primaryAuthMethod: primaryMethod,
      fallbackAuthMethods: fallbackMethods,
      configuration: this.getOptimizedConfiguration(serverType)
    };
  }

  /**
   * Valida se a configuração é adequada para produção
   */
  validateProductionConfiguration(): { isValid: boolean; warnings: string[]; errors: string[] } {
    const config = this.getConfiguration();
    const warnings: string[] = [];
    const errors: string[] = [];

    // Verificar se está em produção
    if (config.environment === 'production') {
      // Verificar chaves de segurança
      if (config.security.encryptionKey === 'default-encryption-key-change-in-production') {
        errors.push('Chave de criptografia padrão detectada em produção');
      }
      if (config.security.jwtSecret === 'default-jwt-secret-change-in-production') {
        errors.push('JWT Secret padrão detectado em produção');
      }

      // Verificar configurações de debug
      if (config.debug) {
        warnings.push('Debug habilitado em produção');
      }
      if (config.logLevel === 'debug') {
        warnings.push('Log level debug em produção pode expor informações sensíveis');
      }

      // Verificar URLs de desenvolvimento
      if (config.oauth.redirectUri.includes('localhost')) {
        errors.push('Redirect URI localhost em produção');
      }
      if (config.oauth.baseUrl.includes('localhost')) {
        errors.push('Base URL localhost em produção');
      }

      // Verificar configurações de segurança
      if (config.security.rateLimitMaxRequests > 1000) {
        warnings.push('Rate limit muito alto para produção');
      }
      if (config.security.maxLoginAttempts > 10) {
        warnings.push('Máximo de tentativas de login muito alto');
      }
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Gera chave segura
   */
  private generateSecureKey(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Obtém erros de validação
   */
  getValidationErrors(): string[] {
    return [...this.configValidationErrors];
  }

  /**
   * Limpa erros de validação
   */
  clearValidationErrors(): void {
    this.configValidationErrors = [];
  }

  /**
   * Exporta configuração para arquivo
   */
  exportConfiguration(): string {
    const config = this.getConfiguration();
    
    // Remover informações sensíveis
    const safeConfig = {
      ...config,
      security: {
        ...config.security,
        encryptionKey: '[REDACTED]',
        jwtSecret: '[REDACTED]'
      },
      oauth: {
        ...config.oauth,
        clientSecret: '[REDACTED]'
      }
    };

    return JSON.stringify(safeConfig, null, 2);
  }

  /**
   * Obtém informações de configuração para debug
   */
  getConfigurationInfo(): {
    environment: string;
    serverType: ServerType;
    capabilities: string[];
    authMethods: AuthenticationMethod[];
    isProduction: boolean;
    hasValidationErrors: boolean;
  } {
    const config = this.getConfiguration();
    
    return {
      environment: config.environment,
      serverType: config.server.serverType,
      capabilities: config.server.capabilities,
      authMethods: this.getAvailableAuthMethods(config.server.serverType),
      isProduction: config.environment === 'production',
      hasValidationErrors: this.configValidationErrors.length > 0
    };
  }

  /**
   * Obtém métodos de autenticação disponíveis
   */
  private getAvailableAuthMethods(serverType: ServerType): AuthenticationMethod[] {
    const capabilities = SERVER_CAPABILITIES[serverType];
    const methods: AuthenticationMethod[] = [];

    if (capabilities.includes('oauth2')) methods.push('oauth2');
    if (capabilities.includes('personal_tokens')) methods.push('personal_token');
    if (capabilities.includes('app_passwords' as any)) methods.push('app_password');
    if (capabilities.includes('basic_auth')) methods.push('basic_auth');

    return methods;
  }
}

// Instância singleton do gerenciador de configuração
export const authConfigurationManager = new AuthConfigurationManager();
