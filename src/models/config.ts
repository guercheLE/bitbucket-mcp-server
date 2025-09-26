import { z } from 'zod';

const RegExpSchema = z.instanceof(RegExp);

export const CorsOriginSchema = z
    .union([z.string(), RegExpSchema, z.array(z.union([z.string(), RegExpSchema]))])
    .default("*");

export const CorsConfigSchema = z
    .object({
        origin: CorsOriginSchema,
        methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE']),
    })
    .default({});

export const RateLimitConfigSchema = z
    .object({
        windowMs: z.number().default(15 * 60 * 1000),
        max: z.number().default(100),
    })
    .default({});

export const CircuitBreakerConfigSchema = z
    .object({
        timeout: z.number().default(3000),
        errorThresholdPercentage: z.number().min(0).max(100).default(50),
        resetTimeout: z.number().default(30000),
    })
    .default({});

export const SecurityConfigSchema = z.object({
    helmet: z.boolean().default(true),
    cors: CorsConfigSchema,
    rateLimit: RateLimitConfigSchema,
    circuitBreaker: CircuitBreakerConfigSchema,
}).default(() => ({
    helmet: true,
    cors: CorsConfigSchema.parse({}),
    rateLimit: RateLimitConfigSchema.parse({}),
    circuitBreaker: CircuitBreakerConfigSchema.parse({}),
}));

export const LogRotationConfigSchema = z.object({
    filename: z.string().default('application-%DATE%.log'),
    datePattern: z.string().default('YYYY-MM-DD'),
    zippedArchive: z.boolean().default(true),
    maxSize: z.string().default('20m'),
    maxFiles: z.string().default('14d'),
});

export const ObservabilityConfigSchema = z
    .object({
        logRotation: LogRotationConfigSchema,
        enableMetrics: z.boolean().default(true),
    })
    .default(() => ({
        logRotation: LogRotationConfigSchema.parse({}),
        enableMetrics: true,
    }));

const AuthMethodSchema = z.enum(['oauth2', 'bearer', 'apiKey', 'basic']);
const DEFAULT_AUTH_PRIORITY = AuthMethodSchema.options as readonly ['oauth2', 'bearer', 'apiKey', 'basic'];

export const AuthConfigSchema = z
    .object({
        priority: z.array(AuthMethodSchema).default([...DEFAULT_AUTH_PRIORITY]),
    })
    .default(() => ({ priority: [...DEFAULT_AUTH_PRIORITY] }));

export const AppConfigSchema = z
    .object({
        security: SecurityConfigSchema,
        observability: ObservabilityConfigSchema,
        authentication: AuthConfigSchema,
    })
    .default(() => ({
        security: SecurityConfigSchema.parse({}),
        observability: ObservabilityConfigSchema.parse({}),
        authentication: AuthConfigSchema.parse({}),
    }));

export type CorsConfig = z.infer<typeof CorsConfigSchema>;
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
export type CircuitBreakerConfig = z.infer<typeof CircuitBreakerConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type LogRotationConfig = z.infer<typeof LogRotationConfigSchema>;
export type ObservabilityConfig = z.infer<typeof ObservabilityConfigSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;
