# Bitbucket MCP Server Documentation

Welcome to the comprehensive documentation for the Bitbucket MCP Server authentication system.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication Setup](#authentication-setup)
3. [Configuration](#configuration)
4. [Usage Examples](#usage-examples)
5. [Error Handling](#error-handling)
6. [Troubleshooting](#troubleshooting)
7. [API Reference](#api-reference)

## Getting Started

The Bitbucket MCP Server provides a comprehensive authentication system that integrates with both Bitbucket Data Center and Bitbucket Cloud. This documentation will guide you through the complete setup and usage process.

### Prerequisites

- Node.js 18+ and npm
- Access to a Bitbucket instance (Data Center or Cloud)
- Administrator privileges for OAuth application registration

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bitbucket-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## Authentication Setup

### 1. OAuth Application Registration

Before using the MCP Server, you need to register an OAuth application with your Bitbucket instance:

- **[OAuth Registration Guide](./oauth-registration-guide.md)** - Step-by-step instructions for registering OAuth applications
- **[Authentication Setup Guide](./authentication-setup.md)** - Complete authentication configuration guide

### 2. Environment Configuration

Configure your environment variables for authentication:

- **[Environment Configuration Guide](./environment-configuration.md)** - Comprehensive guide to environment setup

### 3. Authentication Flow

Understand how authentication works in the system:

- **[Authentication Flow Guide](./authentication-flow.md)** - Detailed explanation of the authentication process

## Configuration

### Environment Variables

The server uses environment variables for configuration. Key variables include:

```bash
# Bitbucket Configuration
BITBUCKET_SERVER_URL=https://your-bitbucket-instance.com
BITBUCKET_SERVER_TYPE=datacenter  # or 'cloud'

# OAuth Configuration
OAUTH_CLIENT_ID=your-consumer-key
OAUTH_CLIENT_SECRET=your-consumer-secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Security Configuration
SESSION_SECRET=your-super-secret-session-key
ENCRYPTION_KEY=your-32-character-encryption-key
```

For complete configuration details, see the [Environment Configuration Guide](./environment-configuration.md).

## Usage Examples

### MCP Tools

The server provides comprehensive MCP tools for interacting with Bitbucket:

#### Core MCP Tools
1. **search-ids** - Semantic search across Bitbucket operations
2. **get-id** - Get detailed information about specific operations  
3. **call-id** - Execute Bitbucket API operations

#### Pipeline Management Tools (25+ tools)
Complete pipeline management capabilities including:
- **Pipeline Operations**: create_pipeline, execute_pipeline, monitor_pipeline
- **Configuration Management**: configure_pipeline, manage_pipeline_variables, configure_pipeline_triggers
- **Access Control**: manage_pipeline_permissions, audit_pipeline_access
- **Analytics & Reporting**: get_pipeline_analytics, generate_pipeline_reports, track_pipeline_metrics
- **Troubleshooting**: diagnose_pipeline_issues, troubleshoot_pipeline_failures (AI-powered)
- **Optimization**: optimize_pipeline_performance (AI-enhanced)
- **Maintenance**: archive_pipeline, cleanup_pipeline_data, migrate_pipeline_config

For complete pipeline management documentation, see [Pipeline Management Feature Guide](./features/007-pipeline-management.md).

### Example Usage

```typescript
// Search for repository operations
const searchResults = await searchTool.execute({
  query: "list repositories",
  pagination: { page: 1, limit: 10 }
}, userSession);

// Get operation details
const details = await getIdTool.execute({
  endpoint_id: "bitbucket.list-repositories"
}, userSession);

// Execute operation
const result = await callIdTool.execute({
  endpoint_id: "bitbucket.list-repositories",
  params: { projectKey: "MYPROJECT" }
}, userSession);
```

For comprehensive examples, see the [MCP Tools Examples Guide](./mcp-tools-examples.md).

## Error Handling

The system provides comprehensive error handling for authentication and authorization scenarios:

- **Authentication Errors** - Issues with user identity verification
- **Authorization Errors** - Issues with user permissions and access control
- **Session Errors** - Issues with user session management
- **Token Errors** - Issues with OAuth token management

### Error Handling Examples

```typescript
try {
  const result = await callIdTool.execute({
    endpoint_id: "bitbucket.list-repositories",
    params: { projectKey: "MYPROJECT" }
  }, userSession);
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication errors
    console.error('Authentication failed:', error.message);
  } else if (error instanceof AuthorizationError) {
    // Handle authorization errors
    console.error('Authorization failed:', error.message);
  }
}
```

For detailed error handling guidance, see the [Authentication Error Handling Guide](./authentication-error-handling.md).

## Troubleshooting

### Common Issues

1. **OAuth Configuration Errors**
   - Invalid consumer key/secret
   - Callback URL mismatch
   - Permission issues

2. **Session Management Issues**
   - Session expiration
   - Invalid session tokens
   - Concurrent session handling

3. **Permission Issues**
   - Insufficient permissions
   - Resource access denied
   - Operation not allowed

4. **Network Issues**
   - Connectivity problems
   - Timeout errors
   - Rate limiting

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
LOG_LEVEL=debug npm start
```

For comprehensive troubleshooting guidance, see the [Troubleshooting Guide](./troubleshooting.md).

## API Reference

### MCP Tools

#### search-ids

Semantic search across Bitbucket API operations and documentation.

**Parameters:**
- `query` (string): Natural language query describing desired functionality
- `pagination` (object, optional): Pagination parameters

**Returns:**
- `items`: Array of operation summaries
- `pagination`: Pagination information
- `has_more`: Whether more results are available

#### get-id

Get detailed information about a specific Bitbucket API operation.

**Parameters:**
- `endpoint_id` (string): Internal operation ID

**Returns:**
- `name`: Human-readable operation name
- `description`: Detailed operation description
- `inputSchema`: Input parameter schema
- `outputSchema`: Output response schema
- `authentication`: Authentication requirements

#### call-id

Execute a Bitbucket API operation with dynamic parameter validation.

**Parameters:**
- `endpoint_id` (string): Internal operation ID
- `params` (object): Operation parameters
- `pagination` (object, optional): Pagination parameters

**Returns:**
- `success`: Whether execution was successful
- `data`: Operation result data
- `error`: Error message if execution failed
- `metadata`: Execution metadata including user context

### Authentication Context

All tools support an optional `userSession` parameter that provides:

- `userId`: Bitbucket user ID
- `userName`: User display name
- `userEmail`: User email address
- `permissions`: User permissions array
- `isActive()`: Session status check method

## Security Considerations

### Best Practices

1. **Environment Security**
   - Never commit `.env` files to version control
   - Use strong, unique secrets for all authentication keys
   - Rotate secrets regularly

2. **Session Security**
   - Use HTTPS in production environments
   - Set secure session cookies with appropriate flags
   - Implement session timeout based on security requirements

3. **Token Security**
   - Encrypt tokens at rest using the encryption key
   - Implement token refresh to minimize exposure time
   - Revoke tokens when users log out or sessions expire

4. **Rate Limiting**
   - Implement rate limiting to prevent abuse
   - Set appropriate limits based on usage patterns
   - Monitor rate limit violations for security threats

## Support

For additional help and support:

1. **Documentation**: Review the comprehensive guides in this documentation
2. **Issues**: Report issues on the project repository
3. **Community**: Join the community discussions
4. **Professional Support**: Contact for professional support options

## Contributing

We welcome contributions to improve the Bitbucket MCP Server. Please see our contributing guidelines for more information.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Compatibility**: Bitbucket Data Center 7.0+, Bitbucket Cloud
