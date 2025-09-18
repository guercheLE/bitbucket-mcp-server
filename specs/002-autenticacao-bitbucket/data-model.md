# Data Model: Autenticação Bitbucket

**Feature**: Autenticação Bitbucket MCP Server  
**Date**: 2025-01-27  
**Status**: Design Complete

## Core Entities

### 1. AuthenticationCredentials
Representa diferentes tipos de credenciais de autenticação com validação e renovação.

```typescript
interface AuthenticationCredentials {
  id: string;
  type: 'oauth' | 'pat' | 'app_password' | 'basic';
  serverType: 'datacenter' | 'cloud';
  serverUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    scope?: string[];
    tokenEndpoint?: string;
    authorizationEndpoint?: string;
  };
}
```

**Validation Rules**:
- `type` must be one of the supported authentication types
- `serverUrl` must be a valid HTTPS URL (except for development)
- `serverType` must be detected automatically or provided by user
- OAuth credentials must include `clientId` and `clientSecret`
- PAT credentials must include valid token
- App Password credentials must include username and password
- Basic Auth credentials must include username and password

**State Transitions**:
- `created` → `active` (when successfully validated)
- `active` → `expired` (when token expires)
- `active` → `revoked` (when user revokes access)
- `expired` → `refreshed` (when token is renewed)
- `revoked` → `active` (when re-authenticated)

### 2. UserSession
Representa estado de autenticação ativa com informações do usuário, tokens válidos e tempo de expiração.

```typescript
interface UserSession {
  id: string;
  userId: string;
  username: string;
  email?: string;
  displayName?: string;
  serverType: 'datacenter' | 'cloud';
  serverUrl: string;
  authenticationMethod: 'oauth' | 'pat' | 'app_password' | 'basic';
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresAt: Date;
  scope: string[];
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  lastAccessedAt: Date;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
}
```

**Validation Rules**:
- `userId` must be a valid Bitbucket user identifier
- `accessToken` must be a valid JWT or opaque token
- `expiresAt` must be in the future for active sessions
- `scope` must match the requested permissions
- `permissions` must be subset of available server permissions

**State Transitions**:
- `created` → `active` (when authentication succeeds)
- `active` → `expired` (when token expires)
- `active` → `revoked` (when user logs out or revokes access)
- `expired` → `refreshed` (when token is renewed)
- `revoked` → `inactive` (final state)

### 3. ServerConfiguration
Representa informações sobre o servidor Bitbucket (tipo, URL, capacidades) para detecção automática.

```typescript
interface ServerConfiguration {
  id: string;
  url: string;
  type: 'datacenter' | 'cloud';
  version?: string;
  apiVersion: '1.0' | '2.0';
  capabilities: {
    oauth: boolean;
    pat: boolean;
    appPassword: boolean;
    basicAuth: boolean;
    sessionManagement: boolean;
    userManagement: boolean;
    projectManagement: boolean;
    repositoryManagement: boolean;
    pullRequestManagement: boolean;
  };
  endpoints: {
    oauth: {
      authorize: string;
      token: string;
      revoke: string;
    };
    api: {
      base: string;
      version: string;
    };
    user: {
      current: string;
      profile: string;
    };
  };
  isDetected: boolean;
  detectedAt: Date;
  lastCheckedAt: Date;
  isHealthy: boolean;
  metadata: {
    applicationProperties?: Record<string, any>;
    serverInfo?: Record<string, any>;
    healthStatus?: Record<string, any>;
  };
}
```

**Validation Rules**:
- `url` must be a valid HTTPS URL (except for development)
- `type` must be detected automatically via `/rest/api/1.0/application-properties`
- `apiVersion` must match the detected server type
- `capabilities` must be determined from server response
- `endpoints` must be constructed based on server type and version

**State Transitions**:
- `unknown` → `detected` (when server type is identified)
- `detected` → `healthy` (when health check passes)
- `healthy` → `unhealthy` (when health check fails)
- `unhealthy` → `healthy` (when health check recovers)

### 4. OAuthToken
Representa tokens de acesso e refresh com metadados de expiração e escopo de permissões.

```typescript
interface OAuthToken {
  id: string;
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number;
  expiresAt: Date;
  scope: string[];
  clientId: string;
  userId: string;
  serverType: 'datacenter' | 'cloud';
  serverUrl: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date;
  metadata: {
    grantType: 'authorization_code' | 'refresh_token' | 'client_credentials';
    redirectUri?: string;
    state?: string;
    codeChallenge?: string;
    codeChallengeMethod?: 'S256';
  };
}
```

**Validation Rules**:
- `accessToken` must be a valid JWT or opaque token
- `expiresAt` must be calculated from `expiresIn` and creation time
- `scope` must match the requested permissions
- `clientId` must match the OAuth application
- `userId` must be a valid Bitbucket user identifier

**State Transitions**:
- `created` → `active` (when token is issued)
- `active` → `expired` (when token expires)
- `active` → `revoked` (when user revokes access)
- `expired` → `refreshed` (when refresh token is used)
- `revoked` → `inactive` (final state)

## Entity Relationships

### Authentication Flow
```
ServerConfiguration (1) → (N) AuthenticationCredentials
AuthenticationCredentials (1) → (N) UserSession
UserSession (1) → (1) OAuthToken (for OAuth authentication)
```

### Session Management
```
UserSession (1) → (1) ServerConfiguration
UserSession (1) → (N) OAuthToken (token refresh history)
```

### Server Detection
```
ServerConfiguration (1) → (N) AuthenticationCredentials
ServerConfiguration (1) → (N) UserSession
```

## Validation Schemas

### AuthenticationCredentials Schema
```typescript
const AuthenticationCredentialsSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['oauth', 'pat', 'app_password', 'basic']),
  serverType: z.enum(['datacenter', 'cloud']),
  serverUrl: z.string().url(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date().optional(),
  metadata: z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    redirectUri: z.string().url().optional(),
    scope: z.array(z.string()).optional(),
    tokenEndpoint: z.string().url().optional(),
    authorizationEndpoint: z.string().url().optional(),
  }),
});
```

### UserSession Schema
```typescript
const UserSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  username: z.string(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  serverType: z.enum(['datacenter', 'cloud']),
  serverUrl: z.string().url(),
  authenticationMethod: z.enum(['oauth', 'pat', 'app_password', 'basic']),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  tokenType: z.literal('Bearer'),
  expiresAt: z.date(),
  scope: z.array(z.string()),
  permissions: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.date(),
  lastAccessedAt: z.date(),
  metadata: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    sessionId: z.string().optional(),
  }),
});
```

### ServerConfiguration Schema
```typescript
const ServerConfigurationSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  type: z.enum(['datacenter', 'cloud']),
  version: z.string().optional(),
  apiVersion: z.enum(['1.0', '2.0']),
  capabilities: z.object({
    oauth: z.boolean(),
    pat: z.boolean(),
    appPassword: z.boolean(),
    basicAuth: z.boolean(),
    sessionManagement: z.boolean(),
    userManagement: z.boolean(),
    projectManagement: z.boolean(),
    repositoryManagement: z.boolean(),
    pullRequestManagement: z.boolean(),
  }),
  endpoints: z.object({
    oauth: z.object({
      authorize: z.string().url(),
      token: z.string().url(),
      revoke: z.string().url(),
    }),
    api: z.object({
      base: z.string().url(),
      version: z.string(),
    }),
    user: z.object({
      current: z.string().url(),
      profile: z.string().url(),
    }),
  }),
  isDetected: z.boolean(),
  detectedAt: z.date(),
  lastCheckedAt: z.date(),
  isHealthy: z.boolean(),
  metadata: z.object({
    applicationProperties: z.record(z.any()).optional(),
    serverInfo: z.record(z.any()).optional(),
    healthStatus: z.record(z.any()).optional(),
  }),
});
```

### OAuthToken Schema
```typescript
const OAuthTokenSchema = z.object({
  id: z.string().uuid(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().positive(),
  expiresAt: z.date(),
  scope: z.array(z.string()),
  clientId: z.string(),
  userId: z.string(),
  serverType: z.enum(['datacenter', 'cloud']),
  serverUrl: z.string().url(),
  isActive: z.boolean(),
  createdAt: z.date(),
  lastUsedAt: z.date(),
  metadata: z.object({
    grantType: z.enum(['authorization_code', 'refresh_token', 'client_credentials']),
    redirectUri: z.string().url().optional(),
    state: z.string().optional(),
    codeChallenge: z.string().optional(),
    codeChallengeMethod: z.enum(['S256']).optional(),
  }),
});
```

## Business Rules

### Authentication Priority
1. **OAuth 2.0**: Highest priority, most secure
2. **Personal Access Token**: Second priority, good for automation
3. **App Password**: Third priority, legacy support
4. **Basic Authentication**: Lowest priority, fallback only

### Token Management
- Access tokens expire based on server configuration
- Refresh tokens are used to obtain new access tokens
- Expired tokens are automatically refreshed when possible
- Revoked tokens are immediately invalidated

### Session Security
- Sessions are stateless and use JWT tokens
- Sensitive data is encrypted at rest and in transit
- Session metadata is logged for audit purposes
- Failed authentication attempts are rate-limited

### Server Detection
- Server type is detected automatically on first connection
- Detection results are cached for 5 minutes
- Fallback to Cloud API if Data Center detection fails
- Health checks are performed every 30 seconds

## Data Persistence

### In-Memory Storage
- Active sessions stored in memory for performance
- Server configurations cached in memory
- Authentication credentials stored securely in memory

### External Storage (Optional)
- Redis for distributed session storage
- Encrypted file storage for credential persistence
- Database for audit logs and session history

## Performance Considerations

### Caching Strategy
- Server configurations cached for 5 minutes
- User sessions cached until expiration
- Authentication credentials cached securely
- API responses cached based on TTL

### Optimization
- Lazy loading of server capabilities
- Batch processing of authentication requests
- Connection pooling for API calls
- Efficient token refresh strategies

## Security Considerations

### Data Protection
- All sensitive data encrypted at rest
- Tokens encrypted in transit
- Credentials stored securely
- Audit logging for all operations

### Access Control
- Role-based access control
- Permission-based tool registration
- Rate limiting per user/IP
- Brute force protection

### Compliance
- OWASP security guidelines
- OAuth 2.0/2.1 compliance
- MCP protocol security requirements
- Industry best practices
