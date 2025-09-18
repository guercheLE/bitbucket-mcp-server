# Quickstart: Autenticação Bitbucket

**Feature**: Autenticação Bitbucket MCP Server  
**Date**: 2025-01-27  
**Status**: Ready for Implementation

## Overview

Este quickstart demonstra como usar o sistema de autenticação do Bitbucket MCP Server para se conectar a servidores Bitbucket Data Center e Cloud usando diferentes métodos de autenticação.

## Prerequisites

- Node.js 18+ instalado
- Bitbucket MCP Server configurado
- Acesso a um servidor Bitbucket (Data Center ou Cloud)
- Credenciais de autenticação apropriadas

## Authentication Methods

O sistema suporta 4 métodos de autenticação em ordem de prioridade:

1. **OAuth 2.0** (Recomendado) - Mais seguro e padrão da indústria
2. **Personal Access Token (PAT)** - Bom para automação
3. **App Password** - Suporte a sistemas legados
4. **Basic Authentication** - Fallback apenas

## Quick Start Examples

### 1. OAuth 2.0 Authentication (Recommended)

#### Step 1: Configure OAuth Application
```bash
# Configure environment variables
export BITBUCKET_OAUTH_CLIENT_ID="your_client_id"
export BITBUCKET_OAUTH_CLIENT_SECRET="your_client_secret"
export BITBUCKET_OAUTH_REDIRECT_URI="https://your-app.com/callback"
export BITBUCKET_BASE_URL="https://bitbucket.company.com"
```

#### Step 2: Start Authentication Flow
```typescript
import { BitbucketAuthService } from '@bitbucket-mcp-server/auth';

const authService = new BitbucketAuthService();

// Generate authorization URL
const authUrl = await authService.getAuthorizationUrl({
  clientId: process.env.BITBUCKET_OAUTH_CLIENT_ID,
  redirectUri: process.env.BITBUCKET_OAUTH_REDIRECT_URI,
  scope: ['read', 'write'],
  state: 'random_state_string'
});

console.log('Visit this URL to authorize:', authUrl);
```

#### Step 3: Exchange Authorization Code
```typescript
// After user authorizes and returns with code
const tokenResponse = await authService.exchangeCodeForToken({
  code: 'authorization_code_from_callback',
  clientId: process.env.BITBUCKET_OAUTH_CLIENT_ID,
  clientSecret: process.env.BITBUCKET_OAUTH_CLIENT_SECRET,
  redirectUri: process.env.BITBUCKET_OAUTH_REDIRECT_URI
});

console.log('Access token:', tokenResponse.accessToken);
console.log('Refresh token:', tokenResponse.refreshToken);
```

#### Step 4: Use Authenticated Session
```typescript
// Create authenticated session
const session = await authService.createSession({
  accessToken: tokenResponse.accessToken,
  refreshToken: tokenResponse.refreshToken,
  serverType: 'datacenter', // or 'cloud'
  serverUrl: process.env.BITBUCKET_BASE_URL
});

// Get current user information
const currentUser = await authService.getCurrentUser(session);
console.log('Authenticated as:', currentUser.displayName);
```

### 2. Personal Access Token Authentication

#### Step 1: Configure PAT
```bash
export BITBUCKET_ACCESS_TOKEN="your_personal_access_token"
export BITBUCKET_BASE_URL="https://bitbucket.company.com"
```

#### Step 2: Create Session with PAT
```typescript
import { BitbucketAuthService } from '@bitbucket-mcp-server/auth';

const authService = new BitbucketAuthService();

// Create session with PAT
const session = await authService.createSession({
  accessToken: process.env.BITBUCKET_ACCESS_TOKEN,
  serverType: 'datacenter',
  serverUrl: process.env.BITBUCKET_BASE_URL,
  authenticationMethod: 'pat'
});

// Verify authentication
const currentUser = await authService.getCurrentUser(session);
console.log('Authenticated as:', currentUser.username);
```

### 3. App Password Authentication

#### Step 1: Configure App Password
```bash
export BITBUCKET_USERNAME="your_username"
export BITBUCKET_APP_PASSWORD="your_app_password"
export BITBUCKET_BASE_URL="https://bitbucket.company.com"
```

#### Step 2: Create Session with App Password
```typescript
import { BitbucketAuthService } from '@bitbucket-mcp-server/auth';

const authService = new BitbucketAuthService();

// Create session with App Password
const session = await authService.createSession({
  username: process.env.BITBUCKET_USERNAME,
  password: process.env.BITBUCKET_APP_PASSWORD,
  serverType: 'datacenter',
  serverUrl: process.env.BITBUCKET_BASE_URL,
  authenticationMethod: 'app_password'
});

// Verify authentication
const currentUser = await authService.getCurrentUser(session);
console.log('Authenticated as:', currentUser.username);
```

### 4. Basic Authentication (Fallback)

#### Step 1: Configure Basic Auth
```bash
export BITBUCKET_USERNAME="your_username"
export BITBUCKET_PASSWORD="your_password"
export BITBUCKET_BASE_URL="https://bitbucket.company.com"
```

#### Step 2: Create Session with Basic Auth
```typescript
import { BitbucketAuthService } from '@bitbucket-mcp-server/auth';

const authService = new BitbucketAuthService();

// Create session with Basic Auth
const session = await authService.createSession({
  username: process.env.BITBUCKET_USERNAME,
  password: process.env.BITBUCKET_PASSWORD,
  serverType: 'datacenter',
  serverUrl: process.env.BITBUCKET_BASE_URL,
  authenticationMethod: 'basic'
});

// Verify authentication
const currentUser = await authService.getCurrentUser(session);
console.log('Authenticated as:', currentUser.username);
```

## Server Type Detection

O sistema detecta automaticamente o tipo de servidor Bitbucket:

```typescript
import { BitbucketServerDetector } from '@bitbucket-mcp-server/auth';

const detector = new BitbucketServerDetector();

// Detect server type
const serverInfo = await detector.detectServerType('https://bitbucket.company.com');
console.log('Server type:', serverInfo.type); // 'datacenter' or 'cloud'
console.log('API version:', serverInfo.apiVersion); // '1.0' or '2.0'
console.log('Capabilities:', serverInfo.capabilities);
```

## Session Management

### Create Session
```typescript
const session = await authService.createSession({
  accessToken: 'your_token',
  serverType: 'datacenter',
  serverUrl: 'https://bitbucket.company.com'
});
```

### Get Current Session
```typescript
const currentSession = await authService.getCurrentSession();
console.log('Session ID:', currentSession.sessionId);
console.log('User:', currentSession.username);
console.log('Expires at:', currentSession.expiresAt);
```

### List Active Sessions
```typescript
const activeSessions = await authService.listActiveSessions();
console.log('Active sessions:', activeSessions.length);
activeSessions.forEach(session => {
  console.log(`- ${session.sessionId}: ${session.username} (${session.serverType})`);
});
```

### Revoke Session
```typescript
await authService.revokeSession(session.sessionId);
console.log('Session revoked successfully');
```

## Token Management

### Refresh Access Token
```typescript
// Automatic refresh when token expires
const refreshedSession = await authService.refreshToken(session);
console.log('New access token:', refreshedSession.accessToken);
```

### Get Token Information
```typescript
const tokenInfo = await authService.getTokenInfo(session.accessToken);
console.log('Token expires at:', tokenInfo.expiresAt);
console.log('Token scope:', tokenInfo.scope);
```

### Revoke Access Token
```typescript
await authService.revokeAccessToken(session.accessToken);
console.log('Access token revoked');
```

## Error Handling

### Handle Authentication Errors
```typescript
try {
  const session = await authService.createSession({
    accessToken: 'invalid_token',
    serverType: 'datacenter',
    serverUrl: 'https://bitbucket.company.com'
  });
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    console.log('Invalid credentials - please re-authenticate');
  } else if (error.code === 'SERVER_ERROR') {
    console.log('Server error - please try again later');
  } else {
    console.log('Authentication failed:', error.message);
  }
}
```

### Handle Token Expiration
```typescript
try {
  const user = await authService.getCurrentUser(session);
} catch (error) {
  if (error.code === 'TOKEN_EXPIRED') {
    // Automatically refresh token
    const refreshedSession = await authService.refreshToken(session);
    const user = await authService.getCurrentUser(refreshedSession);
  }
}
```

## MCP Tool Usage

### OAuth Token Exchange
```typescript
// Using MCP tool
const result = await mcpClient.callTool('mcp_bitbucket_auth_get_oauth_token', {
  grantType: 'authorization_code',
  code: 'authorization_code',
  redirectUri: 'https://app.example.com/callback',
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret'
});
```

### Get Current Session
```typescript
const session = await mcpClient.callTool('mcp_bitbucket_auth_get_current_session', {});
console.log('Current user:', session.username);
```

### Revoke Access Token
```typescript
await mcpClient.callTool('mcp_bitbucket_auth_revoke_access_token', {
  accessToken: 'your_access_token'
});
```

## Configuration Examples

### Environment Variables
```bash
# Server Configuration
BITBUCKET_BASE_URL=https://bitbucket.company.com
BITBUCKET_SERVER_TYPE=datacenter
BITBUCKET_API_VERSION=1.0

# OAuth Configuration
BITBUCKET_OAUTH_CLIENT_ID=your_client_id
BITBUCKET_OAUTH_CLIENT_SECRET=your_client_secret
BITBUCKET_OAUTH_REDIRECT_URI=https://your-app.com/callback

# PAT Configuration
BITBUCKET_ACCESS_TOKEN=your_access_token

# App Password Configuration
BITBUCKET_USERNAME=your_username
BITBUCKET_APP_PASSWORD=your_app_password

# Basic Auth Configuration (fallback)
BITBUCKET_PASSWORD=your_password

# MCP Server Configuration
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost
MCP_SERVER_PROTOCOL=http
```

### Configuration File
```json
{
  "bitbucket": {
    "baseUrl": "https://bitbucket.company.com",
    "serverType": "datacenter",
    "apiVersion": "1.0",
    "oauth": {
      "clientId": "your_client_id",
      "clientSecret": "your_client_secret",
      "redirectUri": "https://your-app.com/callback"
    },
    "pat": {
      "accessToken": "your_access_token"
    },
    "appPassword": {
      "username": "your_username",
      "password": "your_app_password"
    }
  },
  "mcp": {
    "server": {
      "port": 3000,
      "host": "localhost",
      "protocol": "http"
    }
  }
}
```

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Contract Tests
```bash
npm run test:contract
```

### Test Coverage
```bash
npm run test:coverage
```

## Troubleshooting

### Common Issues

#### 1. Server Type Detection Fails
```typescript
// Manual server type configuration
const serverInfo = {
  type: 'datacenter',
  apiVersion: '1.0',
  url: 'https://bitbucket.company.com'
};
```

#### 2. OAuth Authorization Fails
- Verify client ID and secret are correct
- Check redirect URI matches registered URI
- Ensure OAuth application is properly configured

#### 3. Token Expiration
- Implement automatic token refresh
- Handle refresh token expiration
- Provide re-authentication flow

#### 4. Network Connectivity
- Check server URL accessibility
- Verify SSL certificate validity
- Test with different network configurations

### Debug Mode
```bash
export DEBUG=bitbucket-mcp-server:auth
npm start
```

### Logs
```typescript
import { logger } from '@bitbucket-mcp-server/auth';

logger.info('Authentication successful', { userId: user.id });
logger.error('Authentication failed', { error: error.message });
```

## Security Best Practices

1. **Never store credentials in code** - Use environment variables
2. **Use HTTPS in production** - Never use HTTP for authentication
3. **Implement token encryption** - Encrypt tokens at rest
4. **Enable audit logging** - Log all authentication events
5. **Use least privilege** - Request only necessary permissions
6. **Implement rate limiting** - Prevent brute force attacks
7. **Regular token rotation** - Refresh tokens regularly

## Next Steps

1. **Implement OAuth 2.0 flow** - Set up OAuth application
2. **Configure server detection** - Test with your Bitbucket server
3. **Set up session management** - Implement session storage
4. **Add error handling** - Handle authentication failures
5. **Implement security measures** - Add encryption and logging
6. **Test thoroughly** - Run all test suites
7. **Deploy to production** - Follow security best practices

## Support

- **Documentation**: [GitHub Repository](https://github.com/guercheLE/bitbucket-mcp-server)
- **Issues**: [GitHub Issues](https://github.com/guercheLE/bitbucket-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/guercheLE/bitbucket-mcp-server/discussions)
