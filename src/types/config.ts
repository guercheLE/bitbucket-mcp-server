import { z } from 'zod';

// Server Type enum
export const ServerTypeSchema = z.enum(['cloud', 'datacenter']);
export type ServerType = z.infer<typeof ServerTypeSchema>;

// Auth Type enum
export const AuthTypeSchema = z.enum(['oauth', 'app_password', 'api_token', 'basic']);
export type AuthType = z.infer<typeof AuthTypeSchema>;

// OAuth Credentials Schema
export const OAuthCredentialsSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenType: z.string().default('Bearer'),
  expiresIn: z.number().optional(),
  scope: z.string().optional(),
});

// App Password Credentials Schema
export const AppPasswordCredentialsSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  appPassword: z.string().min(1, 'App Password is required'),
});

// API Token Credentials Schema
export const ApiTokenCredentialsSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  token: z.string().min(1, 'API Token is required'),
});

// Basic Auth Credentials Schema
export const BasicCredentialsSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Union of all credential types
export const AuthCredentialsSchema = z.union([
  OAuthCredentialsSchema,
  AppPasswordCredentialsSchema,
  ApiTokenCredentialsSchema,
  BasicCredentialsSchema,
]);

export type OAuthCredentials = z.infer<typeof OAuthCredentialsSchema>;
export type AppPasswordCredentials = z.infer<typeof AppPasswordCredentialsSchema>;
export type ApiTokenCredentials = z.infer<typeof ApiTokenCredentialsSchema>;
export type BasicCredentials = z.infer<typeof BasicCredentialsSchema>;
export type AuthCredentials = z.infer<typeof AuthCredentialsSchema>;

// Auth Config Schema
export const AuthConfigSchema = z.object({
  type: AuthTypeSchema,
  credentials: AuthCredentialsSchema,
  expiresAt: z.date().optional(),
});

export type AuthConfig = z.infer<typeof AuthConfigSchema>;

// Timeout Config Schema
export const TimeoutConfigSchema = z.object({
  read: z.number().int().min(100).default(2000),
  write: z.number().int().min(100).default(5000),
  connect: z.number().int().min(100).default(10000),
});

export type TimeoutConfig = z.infer<typeof TimeoutConfigSchema>;

// Rate Limit Config Schema
export const RateLimitConfigSchema = z.object({
  requestsPerMinute: z.number().int().min(1).default(60),
  burstLimit: z.number().int().min(1).default(10),
  retryAfter: z.number().int().min(100).default(1000),
});

export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;

// Main Bitbucket Config Schema
export const BitbucketConfigSchema = z.object({
  baseUrl: z.string().url('Base URL must be a valid URL'),
  serverType: ServerTypeSchema,
  auth: AuthConfigSchema,
  timeouts: TimeoutConfigSchema.default({}),
  rateLimit: RateLimitConfigSchema.default({}),
});

export type BitbucketConfig = z.infer<typeof BitbucketConfigSchema>;

// Validation helpers
export const validateBitbucketConfig = (config: unknown): BitbucketConfig => {
  return BitbucketConfigSchema.parse(config);
};

export const validateAuthConfig = (config: unknown): AuthConfig => {
  return AuthConfigSchema.parse(config);
};

// Config validation result
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  config?: BitbucketConfig;
}

// Server detection utility types
export interface ServerDetectionResult {
  serverType: ServerType | null;
  version?: string;
  features?: string[];
}
