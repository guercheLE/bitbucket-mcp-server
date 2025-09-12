/**
 * Environment Configuration
 * Centralized environment variable management with Zod validation
 */

import { z } from 'zod';
import { config as loadDotenv } from 'dotenv';

// Load environment variables
loadDotenv();

// ============================================================================
// Environment Schemas
// ============================================================================

const EnvironmentSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Server Configuration
  SERVER_HOST: z.string().default('localhost'),
  SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  
  // Bitbucket Configuration
  BITBUCKET_SERVER_URL: z.string().url().optional(),
  BITBUCKET_AUTH_TYPE: z.enum(['oauth2', 'personal-token', 'app-password', 'basic']).optional(),
  BITBUCKET_AUTH_TOKEN: z.string().optional(),
  BITBUCKET_AUTH_USERNAME: z.string().optional(),
  BITBUCKET_AUTH_PASSWORD: z.string().optional(),
  BITBUCKET_AUTH_CLIENT_ID: z.string().optional(),
  BITBUCKET_AUTH_CLIENT_SECRET: z.string().optional(),
  BITBUCKET_AUTH_REDIRECT_URI: z.string().url().optional(),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('json'),
  LOG_FILE: z.string().optional(),
  
  // Cache Configuration
  CACHE_TYPE: z.enum(['memory', 'redis']).default('memory'),
  CACHE_TTL: z.coerce.number().int().positive().default(300), // 5 minutes
  CACHE_MAX_SIZE: z.coerce.number().int().positive().default(100), // 100MB
  
  // Redis Configuration (if using Redis cache)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).max(15).default(0),
  
  // Security Configuration
  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z.coerce.boolean().default(false),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  
  // Performance Configuration
  REQUEST_TIMEOUT: z.coerce.number().int().positive().default(10000), // 10 seconds
  MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),
  CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().int().positive().default(5),
  CIRCUIT_BREAKER_TIMEOUT: z.coerce.number().int().positive().default(60000), // 1 minute
  
  // Health Check Configuration
  HEALTH_CHECK_INTERVAL: z.coerce.number().int().positive().default(30000), // 30 seconds
  HEALTH_CHECK_TIMEOUT: z.coerce.number().int().positive().default(5000), // 5 seconds
  
  // Metrics Configuration
  METRICS_ENABLED: z.coerce.boolean().default(true),
  METRICS_INTERVAL: z.coerce.number().int().positive().default(60000), // 1 minute
  
  // Development Configuration
  DEBUG: z.coerce.boolean().default(false),
  VERBOSE: z.coerce.boolean().default(false),
  
  // Testing Configuration
  TEST_TIMEOUT: z.coerce.number().int().positive().default(30000), // 30 seconds
  TEST_COVERAGE_THRESHOLD: z.coerce.number().int().min(0).max(100).default(80),
});

// ============================================================================
// Environment Types
// ============================================================================

export type Environment = z.infer<typeof EnvironmentSchema>;

export interface EnvironmentConfig {
  node: {
    env: string;
  };
  server: {
    host: string;
    port: number;
  };
  bitbucket: {
    serverUrl?: string | undefined;
    auth: {
      type?: string | undefined;
      token?: string | undefined;
      username?: string | undefined;
      password?: string | undefined;
      clientId?: string | undefined;
      clientSecret?: string | undefined;
      redirectUri?: string | undefined;
    };
  };
  logging: {
    level: string;
    format: string;
    file?: string | undefined;
  };
  cache: {
    type: string;
    ttl: number;
    maxSize: number;
    redis?: {
      host: string;
      port: number;
      password?: string | undefined;
      db: number;
    } | undefined;
  };
  security: {
    cors: {
      origin: string;
      credentials: boolean;
    };
    rateLimit: {
      windowMs: number;
      max: number;
    };
  };
  performance: {
    requestTimeout: number;
    maxRetries: number;
    circuitBreaker: {
      threshold: number;
      timeout: number;
    };
  };
  healthCheck: {
    interval: number;
    timeout: number;
  };
  metrics: {
    enabled: boolean;
    interval: number;
  };
  development: {
    debug: boolean;
    verbose: boolean;
  };
  testing: {
    timeout: number;
    coverageThreshold: number;
  };
}

// ============================================================================
// Environment Configuration Class
// ============================================================================

class EnvironmentManager {
  private config: EnvironmentConfig;
  private rawEnv: Environment;

  constructor() {
    this.rawEnv = this.loadAndValidateEnvironment();
    this.config = this.transformEnvironment();
  }

  private loadAndValidateEnvironment(): Environment {
    try {
      return EnvironmentSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
        throw new Error(`Environment validation failed:\n${errorMessages}`);
      }
      throw error;
    }
  }

  private transformEnvironment(): EnvironmentConfig {
    return {
      node: {
        env: this.rawEnv.NODE_ENV,
      },
      server: {
        host: this.rawEnv.SERVER_HOST,
        port: this.rawEnv.SERVER_PORT,
      },
      bitbucket: {
        serverUrl: this.rawEnv.BITBUCKET_SERVER_URL,
        auth: {
          type: this.rawEnv.BITBUCKET_AUTH_TYPE || undefined,
          token: this.rawEnv.BITBUCKET_AUTH_TOKEN || undefined,
          username: this.rawEnv.BITBUCKET_AUTH_USERNAME || undefined,
          password: this.rawEnv.BITBUCKET_AUTH_PASSWORD || undefined,
          clientId: this.rawEnv.BITBUCKET_AUTH_CLIENT_ID || undefined,
          clientSecret: this.rawEnv.BITBUCKET_AUTH_CLIENT_SECRET || undefined,
          redirectUri: this.rawEnv.BITBUCKET_AUTH_REDIRECT_URI || undefined,
        },
      },
      logging: {
        level: this.rawEnv.LOG_LEVEL,
        format: this.rawEnv.LOG_FORMAT,
        file: this.rawEnv.LOG_FILE || undefined,
      },
      cache: {
        type: this.rawEnv.CACHE_TYPE,
        ttl: this.rawEnv.CACHE_TTL,
        maxSize: this.rawEnv.CACHE_MAX_SIZE,
        redis: this.rawEnv.CACHE_TYPE === 'redis' ? {
          host: this.rawEnv.REDIS_HOST,
          port: this.rawEnv.REDIS_PORT,
          password: this.rawEnv.REDIS_PASSWORD || undefined,
          db: this.rawEnv.REDIS_DB,
        } : undefined,
      },
      security: {
        cors: {
          origin: this.rawEnv.CORS_ORIGIN,
          credentials: this.rawEnv.CORS_CREDENTIALS,
        },
        rateLimit: {
          windowMs: this.rawEnv.RATE_LIMIT_WINDOW_MS,
          max: this.rawEnv.RATE_LIMIT_MAX,
        },
      },
      performance: {
        requestTimeout: this.rawEnv.REQUEST_TIMEOUT,
        maxRetries: this.rawEnv.MAX_RETRIES,
        circuitBreaker: {
          threshold: this.rawEnv.CIRCUIT_BREAKER_THRESHOLD,
          timeout: this.rawEnv.CIRCUIT_BREAKER_TIMEOUT,
        },
      },
      healthCheck: {
        interval: this.rawEnv.HEALTH_CHECK_INTERVAL,
        timeout: this.rawEnv.HEALTH_CHECK_TIMEOUT,
      },
      metrics: {
        enabled: this.rawEnv.METRICS_ENABLED,
        interval: this.rawEnv.METRICS_INTERVAL,
      },
      development: {
        debug: this.rawEnv.DEBUG,
        verbose: this.rawEnv.VERBOSE,
      },
      testing: {
        timeout: this.rawEnv.TEST_TIMEOUT,
        coverageThreshold: this.rawEnv.TEST_COVERAGE_THRESHOLD,
      },
    };
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public getRawEnvironment(): Environment {
    return this.rawEnv;
  }

  public isDevelopment(): boolean {
    return this.rawEnv.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.rawEnv.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.rawEnv.NODE_ENV === 'test';
  }

  public isDebugEnabled(): boolean {
    return this.rawEnv.DEBUG || this.rawEnv.VERBOSE;
  }

  public sanitizeForLogging(obj: any): any {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'credential',
    ];

    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForLogging(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeForLogging(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const environment = new EnvironmentManager();
export const envConfig = environment.getConfig();
export const isDevelopment = environment.isDevelopment();
export const isProduction = environment.isProduction();
export const isTest = environment.isTest();
export const isDebugEnabled = environment.isDebugEnabled();

// Export types (avoiding conflicts)
export type { Environment as EnvironmentType, EnvironmentConfig as EnvironmentConfigType };
