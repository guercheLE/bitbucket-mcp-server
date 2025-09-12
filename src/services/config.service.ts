import { config } from 'dotenv';
import { z } from 'zod';
import {
  BitbucketConfig,
  BitbucketConfigSchema,
  AuthConfig,
  ServerType,
  ServerTypeSchema,
  AuthType,
  ConfigValidationResult,
  TimeoutConfig,
  RateLimitConfig,
} from '@/types/config';
import { createError, createValidationError } from '@/types/errors';

// Environment variable schema
const EnvSchema = z.object({
  // Bitbucket Configuration
  BITBUCKET_BASE_URL: z.string().url().default('https://bitbucket.org'),
  BITBUCKET_SERVER_TYPE: ServerTypeSchema.optional(),

  // OAuth Configuration
  BITBUCKET_OAUTH_CLIENT_ID: z.string().optional(),
  BITBUCKET_OAUTH_CLIENT_SECRET: z.string().optional(),
  BITBUCKET_OAUTH_ACCESS_TOKEN: z.string().optional(),
  BITBUCKET_OAUTH_REFRESH_TOKEN: z.string().optional(),

  // App Password Configuration
  BITBUCKET_USERNAME: z.string().optional(),
  BITBUCKET_APP_PASSWORD: z.string().optional(),

  // API Token Configuration
  BITBUCKET_API_TOKEN: z.string().optional(),

  // Basic Auth Configuration
  BITBUCKET_BASIC_USERNAME: z.string().optional(),
  BITBUCKET_BASIC_PASSWORD: z.string().optional(),

  // Timeout Configuration
  BITBUCKET_READ_TIMEOUT: z.string().transform(Number).default('2000'),
  BITBUCKET_WRITE_TIMEOUT: z.string().transform(Number).default('5000'),
  BITBUCKET_CONNECT_TIMEOUT: z.string().transform(Number).default('10000'),

  // Rate Limiting Configuration
  BITBUCKET_REQUESTS_PER_MINUTE: z.string().transform(Number).default('60'),
  BITBUCKET_BURST_LIMIT: z.string().transform(Number).default('10'),
  BITBUCKET_RETRY_AFTER: z.string().transform(Number).default('1000'),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),

  // MCP Server Configuration
  MCP_SERVER_PORT: z.string().transform(Number).default('3000'),
  MCP_SERVER_HOST: z.string().default('localhost'),

  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

type EnvConfig = z.infer<typeof EnvSchema>;

export class ConfigService {
  private static instance: ConfigService;
  private config: BitbucketConfig | null = null;
  private envConfig: EnvConfig | null = null;

  private constructor() {
    this.loadEnvironmentVariables();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadEnvironmentVariables(): void {
    try {
      // Load .env file
      config();

      // Validate environment variables
      this.envConfig = EnvSchema.parse(process.env);
    } catch (error) {
      throw createError('CONFIGURATION_ERROR', 'Failed to load environment variables', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public getConfig(): BitbucketConfig {
    if (!this.config) {
      this.config = this.buildConfig();
    }
    return this.config;
  }

  public validateConfig(config: unknown): ConfigValidationResult {
    try {
      const validatedConfig = BitbucketConfigSchema.parse(config);
      return {
        valid: true,
        errors: [],
        config: validatedConfig,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  public detectServerType(baseUrl: string): ServerType {
    if (baseUrl.includes('bitbucket.org')) {
      return 'cloud';
    }
    return 'datacenter';
  }

  public getAuthConfig(): AuthConfig {
    if (!this.envConfig) {
      throw createError('CONFIGURATION_ERROR', 'Environment configuration not loaded');
    }

    // Determine auth type based on available credentials
    if (this.envConfig.BITBUCKET_OAUTH_CLIENT_ID && this.envConfig.BITBUCKET_OAUTH_CLIENT_SECRET) {
      return {
        type: 'oauth',
        credentials: {
          clientId: this.envConfig.BITBUCKET_OAUTH_CLIENT_ID,
          clientSecret: this.envConfig.BITBUCKET_OAUTH_CLIENT_SECRET,
          accessToken: this.envConfig.BITBUCKET_OAUTH_ACCESS_TOKEN,
          refreshToken: this.envConfig.BITBUCKET_OAUTH_REFRESH_TOKEN,
          tokenType: 'Bearer',
        },
      };
    }

    if (this.envConfig.BITBUCKET_USERNAME && this.envConfig.BITBUCKET_APP_PASSWORD) {
      return {
        type: 'app_password',
        credentials: {
          username: this.envConfig.BITBUCKET_USERNAME,
          appPassword: this.envConfig.BITBUCKET_APP_PASSWORD,
        },
      };
    }

    if (this.envConfig.BITBUCKET_API_TOKEN) {
      return {
        type: 'api_token',
        credentials: {
          username: this.envConfig.BITBUCKET_USERNAME || 'token',
          token: this.envConfig.BITBUCKET_API_TOKEN,
        },
      };
    }

    if (this.envConfig.BITBUCKET_BASIC_USERNAME && this.envConfig.BITBUCKET_BASIC_PASSWORD) {
      return {
        type: 'basic',
        credentials: {
          username: this.envConfig.BITBUCKET_BASIC_USERNAME,
          password: this.envConfig.BITBUCKET_BASIC_PASSWORD,
        },
      };
    }

    throw createError(
      'CONFIGURATION_ERROR',
      'No valid authentication credentials found in environment variables'
    );
  }

  // Helper method to get credentials by type for testing
  public getCredentialsByType(authType: AuthType): any {
    const authConfig = this.getAuthConfig();
    if (authConfig.type !== authType) {
      throw createError(
        'CONFIGURATION_ERROR',
        `Auth type mismatch: expected ${authType}, got ${authConfig.type}`
      );
    }
    return authConfig.credentials;
  }

  public getTimeoutConfig(): TimeoutConfig {
    if (!this.envConfig) {
      throw createError('CONFIGURATION_ERROR', 'Environment configuration not loaded');
    }

    return {
      read: this.envConfig.BITBUCKET_READ_TIMEOUT,
      write: this.envConfig.BITBUCKET_WRITE_TIMEOUT,
      connect: this.envConfig.BITBUCKET_CONNECT_TIMEOUT,
    };
  }

  public getRateLimitConfig(): RateLimitConfig {
    if (!this.envConfig) {
      throw createError('CONFIGURATION_ERROR', 'Environment configuration not loaded');
    }

    return {
      requestsPerMinute: this.envConfig.BITBUCKET_REQUESTS_PER_MINUTE,
      burstLimit: this.envConfig.BITBUCKET_BURST_LIMIT,
      retryAfter: this.envConfig.BITBUCKET_RETRY_AFTER,
    };
  }

  public getLogLevel(): string {
    return this.envConfig?.LOG_LEVEL || 'info';
  }

  public getLogFormat(): string {
    return this.envConfig?.LOG_FORMAT || 'json';
  }

  public getMCPServerConfig(): { host: string; port: number } {
    return {
      host: this.envConfig?.MCP_SERVER_HOST || 'localhost',
      port: this.envConfig?.MCP_SERVER_PORT || 3000,
    };
  }

  public getNodeEnv(): string {
    return this.envConfig?.NODE_ENV || 'development';
  }

  public isProduction(): boolean {
    return this.getNodeEnv() === 'production';
  }

  public isDevelopment(): boolean {
    return this.getNodeEnv() === 'development';
  }

  public isTest(): boolean {
    return this.getNodeEnv() === 'test';
  }

  public updateConfig(updates: Partial<BitbucketConfig>): void {
    const currentConfig = this.getConfig();
    const updatedConfig = { ...currentConfig, ...updates };

    const validation = this.validateConfig(updatedConfig);
    if (!validation.valid) {
      throw createValidationError(
        'Invalid configuration updates',
        undefined,
        updates,
        validation.errors.map(error => ({ field: 'config', message: error }))
      );
    }

    this.config = validation.config!;
  }

  public resetConfig(): void {
    this.config = null;
    this.loadEnvironmentVariables();
  }

  private buildConfig(): BitbucketConfig {
    if (!this.envConfig) {
      throw createError('CONFIGURATION_ERROR', 'Environment configuration not loaded');
    }

    const baseUrl = this.envConfig.BITBUCKET_BASE_URL;
    const serverType = this.envConfig.BITBUCKET_SERVER_TYPE || this.detectServerType(baseUrl);

    const config: BitbucketConfig = {
      baseUrl,
      serverType,
      auth: this.getAuthConfig(),
      timeouts: this.getTimeoutConfig(),
      rateLimit: this.getRateLimitConfig(),
    };

    // Validate the built configuration
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw createValidationError(
        'Invalid configuration built from environment variables',
        undefined,
        config,
        validation.errors.map(error => ({ field: 'config', message: error }))
      );
    }

    return validation.config!;
  }

  public getCompatibleAuthTypes(serverType: ServerType): AuthType[] {
    switch (serverType) {
      case 'cloud':
        return ['oauth', 'app_password'];
      case 'datacenter':
        return ['oauth', 'api_token', 'basic'];
      default:
        return [];
    }
  }

  public isAuthTypeCompatible(authType: AuthType, serverType: ServerType): boolean {
    return this.getCompatibleAuthTypes(serverType).includes(authType);
  }

  public getRequiredEnvVars(authType: AuthType): string[] {
    switch (authType) {
      case 'oauth':
        return ['BITBUCKET_OAUTH_CLIENT_ID', 'BITBUCKET_OAUTH_CLIENT_SECRET'];
      case 'app_password':
        return ['BITBUCKET_USERNAME', 'BITBUCKET_APP_PASSWORD'];
      case 'api_token':
        return ['BITBUCKET_API_TOKEN'];
      case 'basic':
        return ['BITBUCKET_BASIC_USERNAME', 'BITBUCKET_BASIC_PASSWORD'];
      default:
        return [];
    }
  }

  public validateEnvironmentForAuthType(authType: AuthType): { valid: boolean; missing: string[] } {
    const required = this.getRequiredEnvVars(authType);
    const missing = required.filter(varName => !process.env[varName]);

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  // Additional methods required by tests
  public getLoggingConfig(): { level: string; format: string } {
    return {
      level: this.getLogLevel(),
      format: this.getLogFormat(),
    };
  }

  public getEnvironmentConfig(): EnvConfig {
    if (!this.envConfig) {
      throw createError('CONFIGURATION_ERROR', 'Environment configuration not loaded');
    }
    return this.envConfig;
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();
