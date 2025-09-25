# OAuth Application Registration Guide

This guide provides step-by-step instructions for registering OAuth applications with Bitbucket Data Center and Bitbucket Cloud.

## Table of Contents

1. [Bitbucket Data Center Registration](#bitbucket-data-center-registration)
2. [Bitbucket Cloud Registration](#bitbucket-cloud-registration)
3. [Application Configuration](#application-configuration)
4. [Permission Scopes](#permission-scopes)
5. [Testing Your Registration](#testing-your-registration)
6. [Common Issues](#common-issues)

## Bitbucket Data Center Registration

### Prerequisites

- Administrator access to Bitbucket Data Center
- Access to the Administration panel
- Knowledge of your server's base URL

### Step-by-Step Registration

#### 1. Access Administration Panel

1. Log in to your Bitbucket Data Center instance
2. Click on your profile picture in the top-right corner
3. Select **Administration** from the dropdown menu
4. Navigate to **Application Links** in the left sidebar

#### 2. Create Application Link

1. Click **Create application link** button
2. Fill in the application details:

   **Basic Information:**
   - **Application Name**: `Bitbucket MCP Server`
   - **Application Type**: Select `Generic Application`
   - **Service Provider Name**: `Bitbucket MCP Server`

   **Authentication Details:**
   - **Consumer Key**: Generate a unique identifier
     - Example: `mcp-server-${random-string}`
     - Must be unique across your Bitbucket instance
   - **Consumer Secret**: Generate a secure secret
     - Use a strong, random string (minimum 32 characters)
     - Store this securely - it cannot be retrieved later

   **Callback Configuration:**
   - **Callback URL**: `http://localhost:3000/auth/callback`
     - For production: `https://your-domain.com/auth/callback`
     - Must match exactly what you configure in your application

#### 3. Configure Permissions

Select the appropriate permissions based on your use case:

**Repository Permissions:**
- ✅ **Repositories: Read** - Required for listing repositories
- ✅ **Repositories: Write** - Required for creating/modifying repositories
- ✅ **Repositories: Admin** - Required for repository administration

**Pull Request Permissions:**
- ✅ **Pull Requests: Read** - Required for listing/viewing pull requests
- ✅ **Pull Requests: Write** - Required for creating/modifying pull requests

**Project Permissions:**
- ✅ **Projects: Read** - Required for listing projects
- ✅ **Projects: Write** - Required for creating/modifying projects
- ✅ **Projects: Admin** - Required for project administration

**User Management (if needed):**
- ✅ **Users: Read** - Required for user information access
- ✅ **Users: Write** - Required for user management operations

**Administrative (if needed):**
- ✅ **Admin: Read** - Required for system information
- ✅ **Admin: Write** - Required for administrative operations

#### 4. Advanced Configuration

**IP Address Restrictions (Optional):**
- Add IP addresses or ranges that can use this application
- Leave empty to allow access from any IP

**Rate Limiting (Optional):**
- Configure request rate limits if needed
- Default settings are usually sufficient

#### 5. Save and Verify

1. Click **Save** to create the application link
2. Verify the application appears in the list
3. **Important**: Copy and securely store the Consumer Key and Consumer Secret
4. Test the configuration using the provided test URL

### Configuration Example

```bash
# Environment variables for Data Center
BITBUCKET_SERVER_URL=https://bitbucket.yourcompany.com
BITBUCKET_SERVER_TYPE=datacenter
OAUTH_CLIENT_ID=mcp-server-abc123def456
OAUTH_CLIENT_SECRET=your-super-secure-secret-key-here
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

## Bitbucket Cloud Registration

### Prerequisites

- Bitbucket Cloud account with appropriate permissions
- Access to account settings
- Knowledge of your application's callback URL

### Step-by-Step Registration

#### 1. Access Account Settings

1. Log in to [Bitbucket Cloud](https://bitbucket.org)
2. Click on your profile picture in the bottom-left corner
3. Select **Personal settings** from the menu
4. Navigate to **OAuth consumers** in the left sidebar

#### 2. Create OAuth Consumer

1. Click **Add consumer** button
2. Fill in the consumer details:

   **Basic Information:**
   - **Name**: `Bitbucket MCP Server`
   - **Description**: `MCP Server for Bitbucket API integration and automation`
   - **URL**: `http://localhost:3000` (your application's base URL)

   **Callback Configuration:**
   - **Callback URL**: `http://localhost:3000/auth/callback`
     - For production: `https://your-domain.com/auth/callback`
     - Must match exactly what you configure in your application

#### 3. Configure Permissions

Select the appropriate scopes based on your use case:

**Repository Scopes:**
- ✅ **Repositories: Read** - Access repository information
- ✅ **Repositories: Write** - Create and modify repositories
- ✅ **Repositories: Admin** - Full repository administration

**Pull Request Scopes:**
- ✅ **Pull requests: Read** - View pull requests
- ✅ **Pull requests: Write** - Create and modify pull requests

**Project Scopes:**
- ✅ **Projects: Read** - View project information
- ✅ **Projects: Write** - Create and modify projects

**Account Scopes:**
- ✅ **Account: Read** - Access account information
- ✅ **Account: Write** - Modify account settings

**Webhook Scopes (if needed):**
- ✅ **Webhooks: Read** - View webhook configurations
- ✅ **Webhooks: Write** - Create and modify webhooks

#### 4. Save and Get Credentials

1. Click **Save** to create the OAuth consumer
2. **Important**: Copy the **Key** and **Secret** immediately
3. The secret will not be shown again after this step
4. Store these credentials securely

### Configuration Example

```bash
# Environment variables for Cloud
BITBUCKET_SERVER_URL=https://api.bitbucket.org
BITBUCKET_SERVER_TYPE=cloud
OAUTH_CLIENT_ID=your-oauth-consumer-key
OAUTH_CLIENT_SECRET=your-oauth-consumer-secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

## Application Configuration

### Environment Variables Setup

Create a `.env` file with your OAuth credentials:

```bash
# Bitbucket Configuration
BITBUCKET_SERVER_URL=https://your-bitbucket-instance.com
BITBUCKET_SERVER_TYPE=datacenter  # or 'cloud'

# OAuth Credentials
OAUTH_CLIENT_ID=your-consumer-key-or-client-id
OAUTH_CLIENT_SECRET=your-consumer-secret-or-client-secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Security Configuration
SESSION_SECRET=your-super-secret-session-key
ENCRYPTION_KEY=your-32-character-encryption-key

# Optional Configuration
SESSION_MAX_AGE=86400000  # 24 hours
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Validation Script

Create a simple validation script to test your OAuth configuration:

```typescript
// validate-oauth-config.ts
import { OAuthManager } from './src/server/auth/oauth-manager';

async function validateOAuthConfig() {
  const oauthManager = new OAuthManager();
  
  try {
    // Test authorization URL generation
    const authUrl = await oauthManager.getAuthorizationUrl({
      clientId: process.env.OAUTH_CLIENT_ID!,
      redirectUri: process.env.OAUTH_REDIRECT_URI!,
      scope: ['repository:read', 'repository:write']
    });
    
    console.log('✅ OAuth configuration is valid');
    console.log('Authorization URL:', authUrl);
    
  } catch (error) {
    console.error('❌ OAuth configuration error:', error);
    process.exit(1);
  }
}

validateOAuthConfig();
```

## Permission Scopes

### Data Center Permissions

| Permission | Description | Required For |
|------------|-------------|--------------|
| `REPO_READ` | Read repository information | Listing repositories, viewing repository details |
| `REPO_WRITE` | Modify repositories | Creating repositories, updating repository settings |
| `REPO_ADMIN` | Full repository control | Repository administration, deleting repositories |
| `PROJECT_READ` | Read project information | Listing projects, viewing project details |
| `PROJECT_WRITE` | Modify projects | Creating projects, updating project settings |
| `PROJECT_ADMIN` | Full project control | Project administration, deleting projects |
| `PULL_REQUEST_READ` | Read pull requests | Listing pull requests, viewing PR details |
| `PULL_REQUEST_WRITE` | Modify pull requests | Creating pull requests, updating PR settings |
| `USER_READ` | Read user information | Accessing user profiles, listing users |
| `USER_WRITE` | Modify user information | User management operations |
| `ADMIN_READ` | Read system information | System monitoring, configuration viewing |
| `ADMIN_WRITE` | Modify system settings | System administration, configuration changes |

### Cloud Scopes

| Scope | Description | Required For |
|-------|-------------|--------------|
| `repository:read` | Read repository information | Listing repositories, viewing repository details |
| `repository:write` | Modify repositories | Creating repositories, updating repository settings |
| `repository:admin` | Full repository control | Repository administration, deleting repositories |
| `project:read` | Read project information | Listing projects, viewing project details |
| `project:write` | Modify projects | Creating projects, updating project settings |
| `pullrequest:read` | Read pull requests | Listing pull requests, viewing PR details |
| `pullrequest:write` | Modify pull requests | Creating pull requests, updating PR settings |
| `account:read` | Read account information | Accessing account details, user information |
| `account:write` | Modify account settings | Account management operations |
| `webhook:read` | Read webhook configurations | Viewing webhook settings |
| `webhook:write` | Modify webhook configurations | Creating and updating webhooks |

## Testing Your Registration

### 1. Basic Connectivity Test

```bash
# Test server connectivity
curl -I https://your-bitbucket-instance.com/rest/api/1.0/projects

# Expected response: 401 Unauthorized (this is expected without authentication)
```

### 2. OAuth Flow Test

```typescript
// test-oauth-flow.ts
import { OAuthManager } from './src/server/auth/oauth-manager';

async function testOAuthFlow() {
  const oauthManager = new OAuthManager();
  
  // Step 1: Generate authorization URL
  const authUrl = await oauthManager.getAuthorizationUrl({
    clientId: process.env.OAUTH_CLIENT_ID!,
    redirectUri: process.env.OAUTH_REDIRECT_URI!,
    scope: ['repository:read']
  });
  
  console.log('Step 1: Visit this URL to authorize:');
  console.log(authUrl);
  
  // Step 2: After user authorization, test token exchange
  // (This would be done with the authorization code from the callback)
  console.log('Step 2: After authorization, test token exchange with the callback code');
}

testOAuthFlow();
```

### 3. MCP Tool Test

```typescript
// test-mcp-tools.ts
import { SearchIdsTool } from './src/server/tools/search-ids';

async function testMCPTools() {
  const searchTool = new SearchIdsTool();
  
  // Test search without authentication
  const publicResults = await searchTool.execute({
    query: "list repositories"
  });
  
  console.log('Public search results:', publicResults.items.length);
  
  // Test search with authentication (if you have a user session)
  // const authResults = await searchTool.execute({
  //   query: "list repositories"
  // }, userSession);
  
  // console.log('Authenticated search results:', authResults.items.length);
}

testMCPTools();
```

## Common Issues

### 1. Invalid Consumer Key/Secret

**Symptoms:**
- `401 Unauthorized` errors
- `Invalid OAuth consumer key` messages

**Solutions:**
- Verify the Consumer Key matches exactly (case-sensitive)
- Ensure the Consumer Secret is correct
- Check for extra spaces or characters
- Regenerate credentials if necessary

### 2. Callback URL Mismatch

**Symptoms:**
- `Invalid callback URL` errors
- OAuth flow fails at callback step

**Solutions:**
- Ensure callback URL matches exactly in both places
- Check for trailing slashes
- Verify protocol (http vs https)
- Update both application registration and environment variables

### 3. Permission Denied

**Symptoms:**
- `403 Forbidden` errors
- Limited access to resources

**Solutions:**
- Verify user has required permissions in Bitbucket
- Check OAuth application has necessary scopes
- Ensure user is member of required groups/projects
- Review permission inheritance

### 4. Network Connectivity

**Symptoms:**
- Connection timeouts
- DNS resolution errors

**Solutions:**
- Verify server URL is accessible
- Check firewall settings
- Test network connectivity
- Verify SSL certificate validity

### 5. Rate Limiting

**Symptoms:**
- `429 Too Many Requests` errors
- Intermittent failures

**Solutions:**
- Implement exponential backoff
- Reduce request frequency
- Use batch operations where possible
- Monitor rate limit headers

## Security Considerations

### 1. Credential Storage

- **Never store credentials in code**
- Use environment variables or secure key management
- Rotate credentials regularly
- Use different credentials for different environments

### 2. Callback URL Security

- Use HTTPS in production
- Avoid wildcard domains
- Validate callback URLs
- Implement CSRF protection

### 3. Permission Principle

- Grant minimum required permissions
- Regularly review and audit permissions
- Remove unused permissions
- Monitor permission usage

### 4. Token Security

- Implement secure token storage
- Use token encryption
- Implement token refresh
- Monitor token usage patterns

## Next Steps

After successful OAuth registration:

1. **Test the complete authentication flow**
2. **Configure your application with the credentials**
3. **Implement proper error handling**
4. **Set up monitoring and logging**
5. **Review and update security policies**

For additional help:
- [Authentication Setup Guide](./authentication-setup.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Security Best Practices](./security-best-practices.md)
