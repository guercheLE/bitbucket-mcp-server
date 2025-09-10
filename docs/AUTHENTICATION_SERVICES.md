# Authentication Services

This document provides comprehensive information about the authentication methods supported by the Bitbucket MCP Server for both Bitbucket Cloud and Bitbucket Server/Data Center.

## 🔐 Overview

The Bitbucket MCP Server supports multiple authentication methods to provide flexibility and security for different use cases. This guide covers all available authentication options, setup procedures, and best practices.

## 📋 Table of Contents

- [🔐 Overview](#-overview)
- [☁️ Bitbucket Cloud Authentication](#️-bitbucket-cloud-authentication)
- [🖥️ Bitbucket Server/Data Center Authentication](#️-bitbucket-serverdata-center-authentication)
- [🔑 OAuth 2.0 Authentication](#-oauth-20-authentication)
- [🎫 Access Tokens](#-access-tokens)
- [⚙️ Configuration Examples](#️-configuration-examples)
- [🔒 Security Best Practices](#-security-best-practices)
- [🔧 Troubleshooting](#-troubleshooting)

### Supported Authentication Methods

| Method                  | Cloud | Server/DC | Description                                  | Security Level |
| ----------------------- | ----- | --------- | -------------------------------------------- | -------------- |
| App Password            | ✅    | ✅        | Username/password with app-specific password | Medium         |
| API Token               | ✅    | ✅        | Personal access token or API key             | High           |
| OAuth 2.0               | ✅    | ❌        | OAuth 2.0 flow with refresh tokens           | High           |
| Repository Access Token | ✅    | ❌        | Repository-specific access token             | High           |
| Project Access Token    | ✅    | ❌        | Project-specific access token                | High           |
| Workspace Access Token  | ✅    | ❌        | Workspace-specific access token              | High           |
| SSH Keys                | ✅    | ✅        | SSH key-based authentication                 | High           |

## ☁️ Bitbucket Cloud Authentication

### App Password Authentication

App passwords are the recommended method for Bitbucket Cloud authentication. They provide a secure way to authenticate without using your main account password.

#### Setup

1. **Create an App Password**:
   - Go to [Bitbucket Settings > App Passwords](https://bitbucket.org/account/settings/app-passwords/)
   - Click "Create app password"
   - Give it a descriptive name (e.g., "MCP Server Access")
   - Select required permissions:
     - `Repositories: Read, Write, Admin`
     - `Pull requests: Read, Write`
     - `Issues: Read, Write`
     - `Pipelines: Read, Write`
     - `Webhooks: Read, Write`

2. **Configure Environment Variables**:
   ```env
   ATLASSIAN_USER_EMAIL=your-email@example.com
   BITBUCKET_APP_PASSWORD=your-app-password-here
   ```

#### Required Permissions

| Permission             | Description                 | Required For                    | Priority |
| ---------------------- | --------------------------- | ------------------------------- | -------- |
| `Repositories: Read`   | View repository information | Repository listing, details     | High     |
| `Repositories: Write`  | Modify repository content   | Create, update repositories     | High     |
| `Repositories: Admin`  | Full repository control     | Delete, settings management     | Medium   |
| `Pull requests: Read`  | View pull requests          | PR listing, details             | High     |
| `Pull requests: Write` | Modify pull requests        | Create, update, merge PRs       | High     |
| `Issues: Read`         | View issues                 | Issue listing, details          | Medium   |
| `Issues: Write`        | Modify issues               | Create, update issues           | Medium   |
| `Pipelines: Read`      | View pipeline information   | Pipeline status, logs           | Medium   |
| `Pipelines: Write`     | Trigger pipelines           | Start, stop pipelines           | Medium   |
| `Webhooks: Read`       | View webhook information    | Webhook listing, details        | Low      |
| `Webhooks: Write`      | Manage webhooks             | Create, update, delete webhooks | Low      |

### API Token Authentication

For programmatic access, you can use Atlassian API tokens. These provide a more secure alternative to app passwords for automated systems.

#### Setup

1. **Create an API Token**:
   - Go to [Atlassian Account Settings > Security > API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Click "Create API token"
   - Give it a descriptive name
   - Copy the generated token

2. **Configure Environment Variables**:
   ```env
   ATLASSIAN_USER_EMAIL=your-email@example.com
   ATLASSIAN_API_TOKEN=your-api-token-here
   ```

### OAuth 2.0 Authentication

OAuth 2.0 provides the most secure and flexible authentication method for Bitbucket Cloud. It's ideal for applications that need to access user data on their behalf.

#### Setup

1. **Create OAuth Consumer**:
   - Go to [Bitbucket Settings > OAuth consumers](https://bitbucket.org/account/settings/app-passwords/)
   - Click "Add consumer"
   - Fill in the required information:
     - **Name**: Descriptive name for your application
     - **Callback URL**: Your application's callback URL
     - **Permissions**: Select required scopes

2. **Configure Environment Variables**:
   ```env
   OAUTH_CLIENT_ID=your-client-id
   OAUTH_CLIENT_SECRET=your-client-secret
   OAUTH_REDIRECT_URI=https://your-app.com/callback
   OAUTH_ACCESS_TOKEN=your-access-token
   OAUTH_REFRESH_TOKEN=your-refresh-token
   ```

#### OAuth Scopes

| Scope               | Description                 | Required For             |
| ------------------- | --------------------------- | ------------------------ |
| `repository`        | Read repository information | Repository access        |
| `repository:write`  | Write to repositories       | Repository modifications |
| `repository:admin`  | Administer repositories     | Repository management    |
| `repository:delete` | Delete repositories         | Repository deletion      |
| `pullrequest`       | Read pull requests          | PR access                |
| `pullrequest:write` | Write pull requests         | PR modifications         |
| `webhook`           | Manage webhooks             | Webhook operations       |
| `pipeline`          | Read pipeline information   | Pipeline access          |
| `pipeline:write`    | Trigger pipelines           | Pipeline operations      |
| `project`           | Read project information    | Project access           |
| `project:admin`     | Administer projects         | Project management       |
| `account`           | Read account information    | User account access      |

## 🖥️ Bitbucket Server/Data Center Authentication

### API Token Authentication

For Bitbucket Server/Data Center, use personal access tokens or API keys. These provide secure authentication for on-premises installations.

#### Setup

1. **Create Personal Access Token**:
   - Go to your Bitbucket Server instance
   - Navigate to Personal Settings > Personal Access Tokens
   - Click "Create token"
   - Set appropriate permissions and expiration

2. **Configure Environment Variables**:
   ```env
   BITBUCKET_USERNAME=your-username
   BITBUCKET_API_TOKEN=your-api-token
   BITBUCKET_BASE_URL=https://your-bitbucket-server.com
   ```

### App Password Authentication

Some Bitbucket Server instances support app passwords as an alternative authentication method.

#### Setup

1. **Create App Password**:
   - Go to your Bitbucket Server instance
   - Navigate to Personal Settings > App Passwords
   - Create a new app password with required permissions

2. **Configure Environment Variables**:
   ```env
   BITBUCKET_USERNAME=your-username
   BITBUCKET_APP_PASSWORD=your-app-password
   BITBUCKET_BASE_URL=https://your-bitbucket-server.com
   ```

## 🎫 Access Tokens

Bitbucket Cloud supports granular access tokens for specific resources. These provide fine-grained access control for different parts of your Bitbucket workspace.

### Repository Access Tokens

Repository-specific tokens with limited scope. Perfect for CI/CD pipelines or automated tools that only need access to specific repositories.

#### Setup

```env
REPOSITORY_ACCESS_TOKEN=your-repository-token
REPOSITORY_SLUG=your-repository-slug
REPOSITORY_WORKSPACE=your-workspace-slug
```

### Project Access Tokens

Project-specific tokens for project-level operations. Ideal for tools that need access to all repositories within a specific project.

#### Setup

```env
PROJECT_ACCESS_TOKEN=your-project-token
PROJECT_KEY=your-project-key
PROJECT_WORKSPACE=your-workspace-slug
```

### Workspace Access Tokens

Workspace-level tokens for workspace-wide operations. Suitable for administrative tools that need broad access across the entire workspace.

#### Setup

```env
WORKSPACE_ACCESS_TOKEN=your-workspace-token
WORKSPACE_SLUG=your-workspace-slug
```

## ⚙️ Configuration Examples

### Complete Cloud Configuration

```env
# Primary authentication
ATLASSIAN_USER_EMAIL=user@example.com
BITBUCKET_APP_PASSWORD=app-password-here

# OAuth configuration (optional)
OAUTH_CLIENT_ID=oauth-client-id
OAUTH_CLIENT_SECRET=oauth-client-secret
OAUTH_REDIRECT_URI=https://app.example.com/callback

# Server configuration
TRANSPORT_MODE=stdio
DEBUG=false
PORT=3000
```

### Complete Server Configuration

```env
# Server authentication
BITBUCKET_USERNAME=username
BITBUCKET_API_TOKEN=api-token-here
BITBUCKET_BASE_URL=https://bitbucket.company.com

# Server configuration
TRANSPORT_MODE=http
DEBUG=true
PORT=3000
```

### Multi-Environment Configuration

```env
# Development
BITBUCKET_BASE_URL=https://dev-bitbucket.company.com
BITBUCKET_USERNAME=dev-user
BITBUCKET_API_TOKEN=dev-token

# Production
# BITBUCKET_BASE_URL=https://prod-bitbucket.company.com
# BITBUCKET_USERNAME=prod-user
# BITBUCKET_API_TOKEN=prod-token
```

## 🔒 Security Best Practices

### Token Management

1. **Use App Passwords**: Prefer app passwords over regular passwords
2. **Rotate Tokens**: Regularly rotate access tokens and API keys
3. **Minimal Permissions**: Grant only the minimum required permissions
4. **Environment Variables**: Store credentials in environment variables, not in code
5. **Secure Storage**: Use secure credential storage solutions in production

### Network Security

1. **HTTPS Only**: Always use HTTPS for API communications
2. **VPN Access**: Use VPN for Bitbucket Server access when possible
3. **Firewall Rules**: Configure appropriate firewall rules
4. **IP Whitelisting**: Use IP whitelisting for server access when possible

### Monitoring and Auditing

1. **Access Logs**: Monitor access logs for unusual activity
2. **Token Usage**: Track token usage and permissions
3. **Regular Audits**: Conduct regular security audits
4. **Incident Response**: Have a plan for security incidents

## 🔧 Troubleshooting

### Common Issues

#### Authentication Failed

**Error**: `Authentication failed`

**Solutions**:

- Verify credentials are correct
- Check if the account has required permissions
- Ensure the account is not locked or suspended
- Verify the base URL is correct for server instances

#### Permission Denied

**Error**: `Permission denied`

**Solutions**:

- Check if the token has required permissions
- Verify the user has access to the specific resource
- Ensure the workspace/repository exists and is accessible
- Check if the account has the necessary role/permissions

#### Token Expired

**Error**: `Token expired`

**Solutions**:

- Generate a new token
- Update the environment variables
- Check token expiration settings
- Use refresh tokens for OAuth (if available)

#### Rate Limiting

**Error**: `Rate limit exceeded`

**Solutions**:

- Implement exponential backoff
- Reduce request frequency
- Use pagination for large datasets
- Consider using different authentication methods

### Debug Mode

Enable debug mode to get detailed authentication information:

```env
DEBUG=true
LOG_LEVEL=debug
```

This will log:

- Authentication method being used
- Token validation results
- API request/response details
- Error details and stack traces

### Testing Authentication

Test your authentication setup:

```bash
# Test with CLI
npx @guerchele/bitbucket-mcp-server --help

# Test specific command
npx @guerchele/bitbucket-mcp-server repository list
```

### Getting Help

If you encounter authentication issues:

1. **Check the logs**: Enable debug mode and review the detailed logs
2. **Verify configuration**: Double-check all environment variables
3. **Test connectivity**: Ensure network connectivity to Bitbucket
4. **Review permissions**: Verify that your account has the necessary permissions
5. **Check documentation**: Review the [Troubleshooting Guide](TROUBLESHOOTING.md) and [Security Documentation](SECURITY.md)
6. **Open an issue**: Create a GitHub issue with:
   - Error messages
   - Configuration (without credentials)
   - Steps to reproduce
   - Environment details
7. **Contact support**: Reach out to [guerchele@hotmail.com](mailto:guerchele@hotmail.com) for direct assistance
