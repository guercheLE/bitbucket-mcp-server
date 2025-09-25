# Data Model: Enterprise Readiness

This feature focuses on infrastructure and server enhancements rather than introducing new data entities. The primary changes involve configuration models for the new enterprise features.

## 1. Configuration Schemas (Zod)

### Security Configuration (`SecurityConfig`)
- **Purpose**: To configure all security-related middleware.
- **Schema**:
  ```typescript
  import { z } from 'zod';

  export const CorsConfigSchema = z.object({
    origin: z.union([z.string(), z.instanceof(RegExp), z.array(z.union([z.string(), z.instanceof(RegExp)]))]),
    methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE']),
  });

  export const RateLimitConfigSchema = z.object({
    windowMs: z.number().default(15 * 60 * 1000),
    max: z.number().default(100),
  });

  export const CircuitBreakerConfigSchema = z.object({
    timeout: z.number().default(3000),
    errorThresholdPercentage: z.number().min(0).max(100).default(50),
    resetTimeout: z.number().default(30000),
  });

  export const SecurityConfigSchema = z.object({
    helmet: z.boolean().default(true),
    cors: CorsConfigSchema,
    rateLimit: RateLimitConfigSchema,
    circuitBreaker: CircuitBreakerConfigSchema,
  });

  export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
  ```

### Observability Configuration (`ObservabilityConfig`)
- **Purpose**: To configure logging and metrics.
- **Schema**:
  ```typescript
  import { z } from 'zod';

  export const LogRotationConfigSchema = z.object({
    filename: z.string().default('application-%DATE%.log'),
    datePattern: z.string().default('YYYY-MM-DD'),
    zippedArchive: z.boolean().default(true),
    maxSize: z.string().default('20m'),
    maxFiles: z.string().default('14d'),
  });

  export const ObservabilityConfigSchema = z.object({
    logRotation: LogRotationConfigSchema,
    enableMetrics: z.boolean().default(true),
  });

  export type ObservabilityConfig = z.infer<typeof ObservabilityConfigSchema>;
  ```

### Authentication Configuration (`AuthConfig`)
- **Purpose**: To define the authentication methods and their priority.
- **Schema**:
  ```typescript
  import { z } from 'zod';

  const AuthMethodSchema = z.enum(['oauth2', 'bearer', 'apiKey', 'basic']);

  export const AuthConfigSchema = z.object({
    priority: z.array(AuthMethodSchema).default(['oauth2', 'bearer', 'apiKey', 'basic']),
  });

  export type AuthConfig = z.infer<typeof AuthConfigSchema>;
  ```

## 2. Relationships
- The main server configuration will be extended to include these new models.
- `SecurityConfig`, `ObservabilityConfig`, and `AuthConfig` will be nested within a global `AppConfig` object.
- No new database tables or persistent data entities are required.
