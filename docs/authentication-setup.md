# Authentication Setup Guide

This guide provides comprehensive instructions for setting up authentication in the Bitbucket MCP Server.

## Table of Contents

1. [Overview](#overview)
2. [OAuth Application Registration](#oauth-application-registration)
3. [Environment Configuration](#environment-configuration)
4. [Authentication Flow](#authentication-flow)
5. [MCP Tool Usage](#mcp-tool-usage)
6. [Troubleshooting](#troubleshooting)
7. [Security Best Practices](#security-best-practices)

## Overview

The Bitbucket MCP Server supports OAuth 2.0 authentication for both Bitbucket Data Center and Bitbucket Cloud. The authentication system provides:

- **OAuth 2.0 Authorization Code Flow**: Secure token-based authentication
- **Session Management**: Persistent user sessions with automatic refresh
- **Permission-based Access Control**: Fine-grained access control based on user permissions
- **Multi-server Support**: Works with both Data Center and Cloud instances
- **MCP Integration**: Seamless integration with MCP protocol tools

## OAuth Application Registration

### Bitbucket Data Center

1. **Access Admin Panel**
   - Log in to your Bitbucket Data Center instance as an administrator
   - Navigate to **Administration** → **Application Links**

2. **Create Application Link**
   - Click **Create application link**
   - Enter your application details:
     - **Application Name**: `Bitbucket MCP Server`
     - **Application Type**: `Generic Application`
     - **Service Provider Name**: `Bitbucket MCP Server`
     - **Consumer Key**: Generate a unique key (e.g., `mcp-server-{random-string}`)
     - **Consumer Secret**: Generate a secure secret
     - **Callback URL**: `http://localhost:3000/auth/callback` (or your server URL)

3. **Configure Permissions**
   - Grant the following permissions:
     - **Repositories**: Read, Write
     - **Pull Requests**: Read, Write
     - **Projects**: Read, Write
     - **Users**: Read (if user management is needed)
     - **Admin**: Read (if administrative functions are needed)

4. **Save Configuration**
   - Click **Save** to create the application link
   - Note down the **Consumer Key** and **Consumer Secret** for environment configuration

### Bitbucket Cloud

1. **Access Bitbucket Settings**
   - Log in to your Bitbucket Cloud account
   - Click on your profile picture → **Personal settings**

2. **Create OAuth Consumer**
   - Navigate to **OAuth consumers** in the left sidebar
   - Click **Add consumer**

3. **Configure Consumer**
   - **Name**: `Bitbucket MCP Server`
   - **Description**: `MCP Server for Bitbucket API integration`
   - **Callback URL**: `http://localhost:3000/auth/callback` (or your server URL)
   - **URL**: `http://localhost:3000` (or your server URL)

4. **Set Permissions**
   - **Repositories**: Read, Write
   - **Pull requests**: Read, Write
   - **Projects**: Read, Write
   - **Account**: Read (if user information is needed)
   - **Webhooks**: Read, Write (if webhook functionality is needed)

5. **Save and Get Credentials**
   - Click **Save**
   - Copy the **Key** and **Secret** for environment configuration

## Environment Configuration

Create a `.env` file in your project root with the following variables:

```bash
# Bitbucket Server Configuration
BITBUCKET_SERVER_URL=https://your-bitbucket-server.com
BITBUCKET_SERVER_TYPE=datacenter  # or 'cloud'

# OAuth Configuration
OAUTH_CLIENT_ID=your-consumer-key
OAUTH_CLIENT_SECRET=your-consumer-secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Session Configuration
SESSION_SECRET=your-super-secret-session-key
SESSION_MAX_AGE=86400000  # 24 hours in milliseconds

# Security Configuration
ENCRYPTION_KEY=your-32-character-encryption-key
RATE_LIMIT_WINDOW=900000  # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100

# Server Configuration
PORT=3000
NODE_ENV=development  # or 'production'
LOG_LEVEL=info  # debug, info, warn, error
```

### Environment Variables Explained

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `BITBUCKET_SERVER_URL` | URL of your Bitbucket instance | Yes | - |
| `BITBUCKET_SERVER_TYPE` | Type of Bitbucket instance | Yes | - |
| `OAUTH_CLIENT_ID` | OAuth consumer key | Yes | - |
| `OAUTH_CLIENT_SECRET` | OAuth consumer secret | Yes | - |
| `OAUTH_REDIRECT_URI` | OAuth callback URL | Yes | - |
| `SESSION_SECRET` | Secret for session encryption | Yes | - |
| `SESSION_MAX_AGE` | Session lifetime in milliseconds | No | 86400000 |
| `ENCRYPTION_KEY` | Key for token encryption | Yes | - |
| `RATE_LIMIT_WINDOW` | Rate limiting window in milliseconds | No | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No | 100 |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment mode | No | development |
| `LOG_LEVEL` | Logging level | No | info |

## Authentication Flow

### 1. Authorization Request

When a user needs to authenticate, the server generates an authorization URL:

```typescript
const authUrl = await oauthManager.getAuthorizationUrl({
  clientId: process.env.OAUTH_CLIENT_ID,
  redirectUri: process.env.OAUTH_REDIRECT_URI,
  scope: ['repository:read', 'repository:write', 'pullrequest:read', 'pullrequest:write']
});
```

### 2. User Authorization

The user is redirected to Bitbucket to authorize the application:

```
https://your-bitbucket-server.com/plugins/servlet/oauth/authorize?
  oauth_consumer_key=your-client-id&
  oauth_callback=http://localhost:3000/auth/callback&
  oauth_signature_method=HMAC-SHA1&
  oauth_timestamp=1234567890&
  oauth_nonce=random-nonce&
  oauth_signature=computed-signature
```

### 3. Token Exchange

After user authorization, the server exchanges the authorization code for access tokens:

```typescript
const tokens = await oauthManager.exchangeCodeForTokens({
  code: authorizationCode,
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  redirectUri: process.env.OAUTH_REDIRECT_URI
});
```

### 4. Session Creation

A user session is created with the obtained tokens:

```typescript
const userSession = await sessionManager.createSession({
  userId: userInfo.id,
  userName: userInfo.displayName,
  userEmail: userInfo.emailAddress,
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  permissions: userInfo.permissions
});
```

## MCP Tool Usage

### Authenticated Tool Execution

All MCP tools now support authentication context. Here's how to use them:

#### 1. Search Operations (search-ids)

```typescript
// Search for operations with user context
const results = await searchIdsTool.execute({
  query: "list repositories",
  pagination: { page: 1, limit: 10 }
}, userSession);

// Results include user access information
results.items.forEach(item => {
  console.log(`Operation: ${item.name}`);
  console.log(`User can access: ${item.authentication.userCanAccess}`);
  console.log(`Required permissions: ${item.authentication.permissions.join(', ')}`);
});
```

#### 2. Get Operation Details (get-id)

```typescript
// Get detailed operation information
const details = await getIdTool.execute({
  endpoint_id: "bitbucket.list-repositories"
}, userSession);

// Details include user authentication status
console.log(`User authenticated: ${details.authentication.userAuthenticated}`);
console.log(`User permissions: ${details.authentication.userPermissions.join(', ')}`);
```

#### 3. Execute Operations (call-id)

```typescript
// Execute Bitbucket API operations
const result = await callIdTool.execute({
  endpoint_id: "bitbucket.list-repositories",
  params: {
    projectKey: "MYPROJECT",
    limit: 25
  }
}, userSession);

// Result includes user context
console.log(`Execution successful: ${result.success}`);
console.log(`User context:`, result.metadata.user_context);
```

### Permission-based Filtering

The system automatically filters results based on user permissions:

- **Repository Operations**: Only shows repositories the user has access to
- **Project Operations**: Only shows projects the user can view
- **Admin Operations**: Only available to users with admin permissions
- **User Operations**: Only available to users with user management permissions

## Troubleshooting

### Common Issues

#### 1. OAuth Configuration Errors

**Error**: `Invalid OAuth consumer key`
- **Solution**: Verify the `OAUTH_CLIENT_ID` matches your Bitbucket application configuration
- **Check**: Ensure the consumer key is correctly copied from Bitbucket admin panel

**Error**: `OAuth signature verification failed`
- **Solution**: Verify the `OAUTH_CLIENT_SECRET` is correct
- **Check**: Ensure there are no extra spaces or characters in the secret

#### 2. Session Management Issues

**Error**: `Session expired`
- **Solution**: The user needs to re-authenticate
- **Check**: Verify `SESSION_MAX_AGE` configuration
- **Check**: Ensure system clock is synchronized

**Error**: `Invalid session token`
- **Solution**: Clear browser cookies and re-authenticate
- **Check**: Verify `SESSION_SECRET` is consistent across server restarts

#### 3. Permission Issues

**Error**: `Insufficient permissions for operation`
- **Solution**: User needs additional permissions in Bitbucket
- **Check**: Verify user has required permissions in Bitbucket admin panel
- **Check**: Ensure OAuth application has necessary scopes

#### 4. Network Issues

**Error**: `Network error during authentication`
- **Solution**: Check network connectivity to Bitbucket server
- **Check**: Verify `BITBUCKET_SERVER_URL` is accessible
- **Check**: Ensure firewall allows outbound HTTPS connections

### Debug Mode

Enable debug logging to troubleshoot authentication issues:

```bash
LOG_LEVEL=debug npm start
```

This will provide detailed logs of:
- OAuth flow steps
- Token exchange process
- Session creation and validation
- Permission checks
- API request/response details

## Security Best Practices

### 1. Environment Security

- **Never commit `.env` files** to version control
- **Use strong, unique secrets** for all authentication keys
- **Rotate secrets regularly** (every 90 days recommended)
- **Use different secrets** for development, staging, and production

### 2. Session Security

- **Use HTTPS** in production environments
- **Set secure session cookies** with `httpOnly` and `secure` flags
- **Implement session timeout** based on your security requirements
- **Monitor session activity** for suspicious behavior

### 3. Token Security

- **Encrypt tokens at rest** using the `ENCRYPTION_KEY`
- **Implement token refresh** to minimize exposure time
- **Revoke tokens** when users log out or sessions expire
- **Monitor token usage** for anomalies

### 4. Rate Limiting

- **Implement rate limiting** to prevent abuse
- **Set appropriate limits** based on your usage patterns
- **Monitor rate limit violations** for security threats
- **Implement progressive delays** for repeated violations

### 5. Audit Logging

- **Log all authentication events** (success and failure)
- **Log permission changes** and administrative actions
- **Monitor for suspicious patterns** in authentication logs
- **Retain logs** according to your compliance requirements

### 6. Network Security

- **Use HTTPS** for all communications
- **Implement proper CORS** configuration
- **Use secure redirect URIs** (no wildcards in production)
- **Validate all input** to prevent injection attacks

## Next Steps

After completing the authentication setup:

1. **Test the authentication flow** with a test user account
2. **Verify all MCP tools** work with authentication
3. **Configure monitoring** and alerting for authentication events
4. **Review and update** security policies as needed
5. **Train users** on the new authentication process

For additional help, refer to:
- [OAuth Configuration Examples](./oauth-examples.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Security Best Practices](./security-best-practices.md)
- [Integration Examples](./integration-examples.md)
