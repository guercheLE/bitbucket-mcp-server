# Environment Configuration Guide

This guide provides comprehensive instructions for configuring environment variables for the Bitbucket MCP Server authentication system.

## Table of Contents

1. [Overview](#overview)
2. [Required Variables](#required-variables)
3. [Optional Variables](#optional-variables)
4. [Environment-Specific Configuration](#environment-specific-configuration)
5. [Security Best Practices](#security-best-practices)
6. [Validation and Testing](#validation-and-testing)
7. [Troubleshooting](#troubleshooting)

## Overview

The Bitbucket MCP Server uses environment variables for configuration to ensure security and flexibility across different deployment environments. All sensitive information, such as OAuth credentials and encryption keys, should be stored as environment variables rather than hardcoded in the application.

### Configuration Files

- **`.env`** - Local development environment
- **`.env.local`** - Local overrides (gitignored)
- **`.env.production`** - Production environment
- **`.env.staging`** - Staging environment
- **`.env.test`** - Testing environment

## Required Variables

### Bitbucket Server Configuration

```bash
# Bitbucket Server URL
BITBUCKET_SERVER_URL=https://your-bitbucket-instance.com

# Server Type (datacenter or cloud)
BITBUCKET_SERVER_TYPE=datacenter
```

**Description:**
- `BITBUCKET_SERVER_URL`: The base URL of your Bitbucket instance
- `BITBUCKET_SERVER_TYPE`: Specifies whether you're using Data Center or Cloud

**Examples:**
```bash
# Data Center
BITBUCKET_SERVER_URL=https://bitbucket.yourcompany.com
BITBUCKET_SERVER_TYPE=datacenter

# Cloud
BITBUCKET_SERVER_URL=https://api.bitbucket.org
BITBUCKET_SERVER_TYPE=cloud
```

### OAuth Configuration

```bash
# OAuth Client Credentials
OAUTH_CLIENT_ID=your-consumer-key-or-client-id
OAUTH_CLIENT_SECRET=your-consumer-secret-or-client-secret

# OAuth Callback URL
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

**Description:**
- `OAUTH_CLIENT_ID`: The consumer key from your OAuth application registration
- `OAUTH_CLIENT_SECRET`: The consumer secret from your OAuth application registration
- `OAUTH_REDIRECT_URI`: The callback URL where users will be redirected after authorization

**Examples:**
```bash
# Development
OAUTH_CLIENT_ID=mcp-server-dev-abc123
OAUTH_CLIENT_SECRET=super-secret-key-for-development-only
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Production
OAUTH_CLIENT_ID=mcp-server-prod-xyz789
OAUTH_CLIENT_SECRET=production-secret-key-very-secure
OAUTH_REDIRECT_URI=https://your-domain.com/auth/callback
```

### Security Configuration

```bash
# Session Secret (for session encryption)
SESSION_SECRET=your-super-secret-session-key

# Encryption Key (for token encryption)
ENCRYPTION_KEY=your-32-character-encryption-key
```

**Description:**
- `SESSION_SECRET`: Used to encrypt session data and cookies
- `ENCRYPTION_KEY`: Used to encrypt stored tokens (must be exactly 32 characters)

**Generation Examples:**
```bash
# Generate session secret (64 characters)
SESSION_SECRET=$(openssl rand -hex 32)

# Generate encryption key (32 characters)
ENCRYPTION_KEY=$(openssl rand -hex 16)
```

## Optional Variables

### Session Configuration

```bash
# Session lifetime in milliseconds (default: 24 hours)
SESSION_MAX_AGE=86400000

# Session cookie name (default: mcp-session)
SESSION_COOKIE_NAME=mcp-session

# Session cookie domain (default: undefined)
SESSION_COOKIE_DOMAIN=.yourdomain.com

# Session cookie secure flag (default: true in production)
SESSION_COOKIE_SECURE=true

# Session cookie httpOnly flag (default: true)
SESSION_COOKIE_HTTP_ONLY=true

# Session cookie sameSite policy (default: strict)
SESSION_COOKIE_SAME_SITE=strict
```

### Rate Limiting Configuration

```bash
# Rate limiting window in milliseconds (default: 15 minutes)
RATE_LIMIT_WINDOW=900000

# Maximum requests per window (default: 100)
RATE_LIMIT_MAX_REQUESTS=100

# Rate limiting storage type (default: memory)
RATE_LIMIT_STORAGE=memory

# Redis URL for distributed rate limiting (optional)
RATE_LIMIT_REDIS_URL=redis://localhost:6379
```

### Server Configuration

```bash
# Server port (default: 3000)
PORT=3000

# Server host (default: 0.0.0.0)
HOST=0.0.0.0

# Environment mode (development, staging, production)
NODE_ENV=development

# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Enable request logging (default: true)
ENABLE_REQUEST_LOGGING=true

# Enable performance monitoring (default: true)
ENABLE_PERFORMANCE_MONITORING=true
```

### Database Configuration (if using persistent storage)

```bash
# Database URL for session persistence
DATABASE_URL=postgresql://user:password@localhost:5432/mcp_sessions

# Database connection pool size
DATABASE_POOL_SIZE=10

# Database connection timeout
DATABASE_TIMEOUT=30000
```

### Monitoring and Logging

```bash
# Enable audit logging (default: true)
ENABLE_AUDIT_LOGGING=true

# Audit log level (default: info)
AUDIT_LOG_LEVEL=info

# Log file path (default: logs/mcp-server.log)
LOG_FILE_PATH=logs/mcp-server.log

# Log rotation size (default: 10MB)
LOG_ROTATION_SIZE=10485760

# Log retention days (default: 30)
LOG_RETENTION_DAYS=30
```

## Environment-Specific Configuration

### Development Environment

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true

# Development OAuth credentials
OAUTH_CLIENT_ID=mcp-server-dev-abc123
OAUTH_CLIENT_SECRET=dev-secret-not-for-production
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Development server
BITBUCKET_SERVER_URL=https://dev-bitbucket.yourcompany.com
BITBUCKET_SERVER_TYPE=datacenter

# Development security (less strict)
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAME_SITE=lax
```

### Staging Environment

```bash
# .env.staging
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true

# Staging OAuth credentials
OAUTH_CLIENT_ID=mcp-server-staging-def456
OAUTH_CLIENT_SECRET=staging-secret-key
OAUTH_REDIRECT_URI=https://staging-mcp.yourdomain.com/auth/callback

# Staging server
BITBUCKET_SERVER_URL=https://staging-bitbucket.yourcompany.com
BITBUCKET_SERVER_TYPE=datacenter

# Staging security
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=strict
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_REQUEST_LOGGING=false
ENABLE_PERFORMANCE_MONITORING=true

# Production OAuth credentials
OAUTH_CLIENT_ID=mcp-server-prod-ghi789
OAUTH_CLIENT_SECRET=production-secret-very-secure
OAUTH_REDIRECT_URI=https://mcp.yourdomain.com/auth/callback

# Production server
BITBUCKET_SERVER_URL=https://bitbucket.yourcompany.com
BITBUCKET_SERVER_TYPE=datacenter

# Production security (strict)
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=strict
SESSION_COOKIE_DOMAIN=.yourdomain.com

# Production monitoring
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_LEVEL=info
```

### Testing Environment

```bash
# .env.test
NODE_ENV=test
LOG_LEVEL=error
ENABLE_REQUEST_LOGGING=false
ENABLE_PERFORMANCE_MONITORING=false

# Test OAuth credentials (mock)
OAUTH_CLIENT_ID=test-client-id
OAUTH_CLIENT_SECRET=test-client-secret
OAUTH_REDIRECT_URI=http://localhost:3001/auth/callback

# Test server (mock)
BITBUCKET_SERVER_URL=http://localhost:8080
BITBUCKET_SERVER_TYPE=datacenter

# Test security (relaxed)
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAME_SITE=lax
```

## Security Best Practices

### 1. Credential Management

```bash
# Use strong, unique secrets
SESSION_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)

# Rotate secrets regularly
# Set up automated secret rotation
# Use different secrets for different environments
```

### 2. Environment Isolation

```bash
# Never use production secrets in development
# Use separate OAuth applications for each environment
# Implement proper access controls for environment files
```

### 3. File Permissions

```bash
# Set restrictive permissions on .env files
chmod 600 .env
chmod 600 .env.production
chmod 600 .env.staging

# Ensure .env files are in .gitignore
echo ".env*" >> .gitignore
```

### 4. Secret Validation

```typescript
// validate-env.ts
import { z } from 'zod';

const envSchema = z.object({
  BITBUCKET_SERVER_URL: z.string().url(),
  BITBUCKET_SERVER_TYPE: z.enum(['datacenter', 'cloud']),
  OAUTH_CLIENT_ID: z.string().min(1),
  OAUTH_CLIENT_SECRET: z.string().min(32),
  OAUTH_REDIRECT_URI: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(32),
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']),
});

export function validateEnvironment() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}
```

## Validation and Testing

### 1. Environment Validation Script

```typescript
// scripts/validate-env.ts
import { validateEnvironment } from '../src/utils/validate-env';

function validateEnvironmentConfiguration() {
  console.log('🔍 Validating environment configuration...');
  
  try {
    const env = validateEnvironment();
    console.log('✅ Environment configuration is valid');
    
    // Additional validations
    validateOAuthConfiguration(env);
    validateSecurityConfiguration(env);
    validateServerConfiguration(env);
    
    console.log('🎉 All environment validations passed');
    
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}

function validateOAuthConfiguration(env: any) {
  console.log('🔐 Validating OAuth configuration...');
  
  // Validate OAuth credentials format
  if (!env.OAUTH_CLIENT_ID.match(/^[a-zA-Z0-9-_]+$/)) {
    throw new Error('Invalid OAuth client ID format');
  }
  
  if (env.OAUTH_CLIENT_SECRET.length < 32) {
    throw new Error('OAuth client secret must be at least 32 characters');
  }
  
  // Validate redirect URI
  if (!env.OAUTH_REDIRECT_URI.startsWith('http')) {
    throw new Error('OAuth redirect URI must be a valid URL');
  }
  
  console.log('✅ OAuth configuration is valid');
}

function validateSecurityConfiguration(env: any) {
  console.log('🔒 Validating security configuration...');
  
  // Validate session secret
  if (env.SESSION_SECRET.length < 32) {
    throw new Error('Session secret must be at least 32 characters');
  }
  
  // Validate encryption key
  if (env.ENCRYPTION_KEY.length !== 32) {
    throw new Error('Encryption key must be exactly 32 characters');
  }
  
  // Validate production security settings
  if (env.NODE_ENV === 'production') {
    if (!env.SESSION_COOKIE_SECURE) {
      throw new Error('Session cookies must be secure in production');
    }
    
    if (env.SESSION_COOKIE_SAME_SITE !== 'strict') {
      throw new Error('Session cookies must use strict SameSite in production');
    }
  }
  
  console.log('✅ Security configuration is valid');
}

function validateServerConfiguration(env: any) {
  console.log('🌐 Validating server configuration...');
  
  // Validate server URL
  try {
    new URL(env.BITBUCKET_SERVER_URL);
  } catch {
    throw new Error('Invalid Bitbucket server URL');
  }
  
  // Validate server type
  if (!['datacenter', 'cloud'].includes(env.BITBUCKET_SERVER_TYPE)) {
    throw new Error('Invalid Bitbucket server type');
  }
  
  // Validate port
  const port = parseInt(env.PORT || '3000');
  if (port < 1 || port > 65535) {
    throw new Error('Invalid port number');
  }
  
  console.log('✅ Server configuration is valid');
}

validateEnvironmentConfiguration();
```

### 2. Configuration Testing

```typescript
// scripts/test-config.ts
import { OAuthManager } from '../src/server/auth/oauth-manager';
import { SessionManager } from '../src/server/auth/session-manager';

async function testConfiguration() {
  console.log('🧪 Testing configuration...');
  
  try {
    // Test OAuth manager initialization
    const oauthManager = new OAuthManager();
    console.log('✅ OAuth manager initialized');
    
    // Test session manager initialization
    const sessionManager = new SessionManager();
    console.log('✅ Session manager initialized');
    
    // Test authorization URL generation
    const authUrl = await oauthManager.getAuthorizationUrl({
      clientId: process.env.OAUTH_CLIENT_ID!,
      redirectUri: process.env.OAUTH_REDIRECT_URI!,
      scope: ['repository:read']
    });
    
    console.log('✅ Authorization URL generated:', authUrl);
    
    // Test encryption/decryption
    const testData = 'test-data';
    const encrypted = sessionManager.encrypt(testData);
    const decrypted = sessionManager.decrypt(encrypted);
    
    if (decrypted === testData) {
      console.log('✅ Encryption/decryption working');
    } else {
      throw new Error('Encryption/decryption failed');
    }
    
    console.log('🎉 All configuration tests passed');
    
  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    process.exit(1);
  }
}

testConfiguration();
```

### 3. Environment Health Check

```typescript
// scripts/health-check.ts
import { HealthChecker } from '../src/server/health-checker';

async function performHealthCheck() {
  console.log('🏥 Performing health check...');
  
  const healthChecker = new HealthChecker();
  
  try {
    const health = await healthChecker.checkHealth();
    
    if (health.status === 'healthy') {
      console.log('✅ System is healthy');
      console.log('📊 Health details:', health);
    } else {
      console.error('❌ System health check failed:', health);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Health check error:', error);
    process.exit(1);
  }
}

performHealthCheck();
```

## Troubleshooting

### Common Issues

#### 1. Missing Environment Variables

**Error:** `Environment variable OAUTH_CLIENT_ID is not defined`

**Solution:**
```bash
# Check if .env file exists
ls -la .env

# Verify environment variables are loaded
node -e "console.log(process.env.OAUTH_CLIENT_ID)"

# Load environment variables explicitly
source .env
```

#### 2. Invalid Environment Variable Format

**Error:** `Invalid OAuth client ID format`

**Solution:**
```bash
# Check OAuth client ID format
echo $OAUTH_CLIENT_ID

# Ensure it matches the format from Bitbucket
# Data Center: alphanumeric with hyphens/underscores
# Cloud: alphanumeric with hyphens/underscores
```

#### 3. Encryption Key Length Issues

**Error:** `Encryption key must be exactly 32 characters`

**Solution:**
```bash
# Generate a new 32-character encryption key
ENCRYPTION_KEY=$(openssl rand -hex 16)
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env

# Verify the length
echo $ENCRYPTION_KEY | wc -c  # Should be 33 (32 chars + newline)
```

#### 4. URL Format Issues

**Error:** `Invalid Bitbucket server URL`

**Solution:**
```bash
# Check URL format
echo $BITBUCKET_SERVER_URL

# Ensure it includes protocol
BITBUCKET_SERVER_URL=https://your-bitbucket-instance.com

# Test URL accessibility
curl -I $BITBUCKET_SERVER_URL
```

### Debug Mode

Enable debug mode to troubleshoot configuration issues:

```bash
# Set debug log level
LOG_LEVEL=debug

# Enable detailed logging
DEBUG=mcp:*

# Run with debug output
npm run dev -- --debug
```

### Environment Validation Commands

```bash
# Validate environment configuration
npm run validate:env

# Test OAuth configuration
npm run test:oauth

# Perform health check
npm run health:check

# Test all configurations
npm run test:config
```

## Next Steps

After configuring your environment:

1. **Validate the configuration** using the provided scripts
2. **Test the OAuth flow** with your credentials
3. **Verify all MCP tools** work with the configuration
4. **Set up monitoring** for environment health
5. **Document any custom configurations** for your team

For additional help:
- [OAuth Registration Guide](./oauth-registration-guide.md)
- [Authentication Setup Guide](./authentication-setup.md)
- [Troubleshooting Guide](./troubleshooting.md)
