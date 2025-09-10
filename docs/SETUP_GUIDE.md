# 🚀 Setup Guide

This comprehensive guide will help you set up the Bitbucket MCP Server for your specific environment and use case. Follow this guide step-by-step to get your server running smoothly.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Configuration](#configuration)
- [Authentication Setup](#authentication-setup)
- [Platform-Specific Setup](#platform-specific-setup)
- [Environment Configuration](#environment-configuration)
- [Feature Configuration](#feature-configuration)
- [Testing Your Setup](#testing-your-setup)
- [Troubleshooting](#troubleshooting)

## 📋 Prerequisites

### System Requirements

#### Minimum Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (or yarn 1.22.0+)
- **Operating System**: Linux, macOS, or Windows
- **Memory**: 512 MB RAM minimum
- **Disk Space**: 100 MB for installation
- **Network**: Internet connection for API access

#### Recommended Requirements

- **Node.js**: Version 20.0.0 or higher (LTS recommended)
- **Memory**: 1 GB RAM or more
- **Disk Space**: 500 MB for logs and temporary files
- **Network**: Stable internet connection for API access
- **CPU**: 2+ cores for better performance

### 🔐 Bitbucket Access

#### Bitbucket Cloud

- **Atlassian Account**: Valid Atlassian account with Bitbucket access
- **Workspace Access**: Access to at least one Bitbucket workspace
- **API Permissions**: Appropriate API permissions for your use case
- **Two-Factor Authentication**: 2FA enabled (recommended for security)

#### Bitbucket Server/Data Center

- **Server Access**: Network access to your Bitbucket Server instance
- **User Account**: Valid user account with appropriate permissions
- **API Access**: REST API access enabled
- **Admin Rights**: Admin access for advanced features (optional)

### 🔑 Authentication Credentials

You'll need one of the following authentication methods:

1. **App Password** (Cloud/Server) - Simple and secure
2. **API Token** (Cloud/Server) - Recommended for automation
3. **OAuth 2.0** (Cloud only) - For third-party integrations
4. **Granular Access Tokens** (Cloud only) - Fine-grained permissions
5. **SSH Keys** (Cloud/Server) - For Git operations
6. **SAML/LDAP** (Server/Data Center only) - Enterprise authentication

## 📦 Installation Methods

### Method 1: Global Installation (Recommended)

#### Using npm

```bash
# Install globally
npm install -g @guerchele/bitbucket-mcp-server

# Verify installation
bitbucket-mcp-server --version
```

#### Using yarn

```bash
# Install globally
yarn global add @guerchele/bitbucket-mcp-server

# Verify installation
bitbucket-mcp-server --version
```

### Method 2: Local Installation

#### In Your Project

```bash
# Install as project dependency
npm install @guerchele/bitbucket-mcp-server

# Or install as dev dependency
npm install --save-dev @guerchele/bitbucket-mcp-server
```

#### Using npx (No Installation)

```bash
# Run without installation (downloads on first use)
npx @guerchele/bitbucket-mcp-server --help

# Run with specific version
npx @guerchele/bitbucket-mcp-server@latest --help
```

### Method 3: Development Installation

#### Clone and Build

```bash
# Clone the repository
git clone https://github.com/guercheLE/bitbucket-mcp-server.git
cd bitbucket-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Link globally for development
npm link

# Verify development installation
bitbucket-mcp-server --version
```

#### Docker Development

```bash
# Build development image
docker build -t bitbucket-mcp-server:dev .

# Run development container
docker run -it --rm \
  -e ATLASSIAN_USER_EMAIL=your_email@company.com \
  -e ATLASSIAN_API_TOKEN=your_token \
  bitbucket-mcp-server:dev
```

## ⚙️ Configuration

### Environment File Setup

#### 1. Copy Example Configuration

```bash
# Copy the example environment file
cp env.example .env

# Or create a new .env file
touch .env
```

#### 2. Basic Configuration Structure

```env
# =============================================================================
# BITBUCKET CONFIGURATION
# =============================================================================

# Choose ONE authentication method below

# Method 1: Bitbucket Cloud (Atlassian)
ATLASSIAN_USER_EMAIL=your_email@company.com
ATLASSIAN_API_TOKEN=your_atlassian_api_token

# Method 2: Bitbucket Server
BITBUCKET_USERNAME=your_username
BITBUCKET_API_TOKEN=your_api_token
BITBUCKET_BASE_URL=https://bitbucket.yourcompany.com

# Method 3: App Password (Cloud)
ATLASSIAN_USER_EMAIL=your_email@company.com
BITBUCKET_APP_PASSWORD=your_app_password

# Method 4: App Password (Server)
BITBUCKET_USERNAME=your_username
BITBUCKET_APP_PASSWORD=your_app_password
BITBUCKET_BASE_URL=https://bitbucket.yourcompany.com

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================

# Transport mode: 'stdio' (default) or 'http'
TRANSPORT_MODE=stdio

# HTTP server port (only used when TRANSPORT_MODE=http)
PORT=3000

# Debug mode: 'true' or 'false'
DEBUG=false

# Log level: debug, info, warn, error
LOG_LEVEL=info

# API configuration
API_TIMEOUT=30000
API_MAX_RETRIES=3
API_RATE_LIMIT=1000
```

### Configuration Validation

#### Test Your Configuration

```bash
# Test configuration without starting server
bitbucket-mcp-server --help

# Test with debug mode
DEBUG=true bitbucket-mcp-server --help
```

## 🔐 Authentication Setup

### Bitbucket Cloud Setup

#### Option 1: Atlassian API Token (Recommended)

1. **Create API Token**:
   - Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Click "Create API token"
   - Give it a descriptive label
   - Copy the generated token

2. **Configure Environment**:
   ```env
   ATLASSIAN_USER_EMAIL=your_email@company.com
   ATLASSIAN_API_TOKEN=your_generated_token
   ```

#### Option 2: App Password

1. **Create App Password**:
   - Go to [Bitbucket App Passwords](https://bitbucket.org/account/settings/app-passwords/)
   - Click "Create app password"
   - Select required permissions
   - Copy the generated password

2. **Configure Environment**:
   ```env
   ATLASSIAN_USER_EMAIL=your_email@company.com
   BITBUCKET_APP_PASSWORD=your_generated_password
   ```

#### Option 3: OAuth 2.0

1. **Create OAuth App**:
   - Go to [Bitbucket OAuth](https://bitbucket.org/account/settings/app-passwords/)
   - Click "Add consumer"
   - Set callback URL and permissions
   - Copy Client ID and Secret

2. **Configure Environment**:
   ```env
   OAUTH_CLIENT_ID=your_client_id
   OAUTH_CLIENT_SECRET=your_client_secret
   OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback
   OAUTH_SCOPE=repository:admin,repository:write,repository:read
   ```

#### Option 4: Granular Access Tokens

1. **Repository Access Token**:

   ```env
   REPOSITORY_ACCESS_TOKEN=your_repository_token
   REPOSITORY_SLUG=your_repository
   REPOSITORY_WORKSPACE=your_workspace
   ```

2. **Project Access Token**:

   ```env
   PROJECT_ACCESS_TOKEN=your_project_token
   PROJECT_KEY=PROJ
   PROJECT_WORKSPACE=your_workspace
   ```

3. **Workspace Access Token**:
   ```env
   WORKSPACE_ACCESS_TOKEN=your_workspace_token
   WORKSPACE_SLUG=your_workspace
   ```

### Bitbucket Server/Data Center Setup

#### Option 1: API Token (Recommended)

1. **Create API Token**:
   - Go to Personal Settings → Access tokens
   - Click "Create token"
   - Set permissions and expiration
   - Copy the generated token

2. **Configure Environment**:
   ```env
   BITBUCKET_USERNAME=your_username
   BITBUCKET_API_TOKEN=your_generated_token
   BITBUCKET_BASE_URL=https://bitbucket.yourcompany.com
   ```

#### Option 2: App Password

1. **Create App Password**:
   - Go to Personal Settings → App passwords
   - Click "Create app password"
   - Set expiration and permissions
   - Copy the generated password

2. **Configure Environment**:
   ```env
   BITBUCKET_USERNAME=your_username
   BITBUCKET_APP_PASSWORD=your_generated_password
   BITBUCKET_BASE_URL=https://bitbucket.yourcompany.com
   ```

#### Option 3: SAML/LDAP Integration (Enterprise)

1. **SAML Configuration**:

   ```env
   SAML_ENABLED=true
   SAML_ENTITY_ID=your_entity_id
   SAML_SSO_URL=https://your-saml-provider.com/sso
   SAML_CERTIFICATE=your_certificate
   ```

2. **LDAP Configuration**:
   ```env
   LDAP_ENABLED=true
   LDAP_SERVER=ldap://your-ldap-server.com
   LDAP_BASE_DN=dc=company,dc=com
   LDAP_USER_DN=cn=admin,dc=company,dc=com
   LDAP_PASSWORD=your_ldap_password
   ```

### SSH Key Authentication

#### Generate SSH Key

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your_email@company.com"

# Add to SSH agent
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

#### Configure SSH Access

```env
# SSH configuration
SSH_KEY_PATH=~/.ssh/id_ed25519
SSH_PASSPHRASE=your_passphrase
GIT_SSH_COMMAND=ssh -i ~/.ssh/id_ed25519
```

## 🔌 Platform-Specific Setup

### MCP Client Integration

#### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "bitbucket-mcp-server",
      "env": {
        "ATLASSIAN_USER_EMAIL": "your_email@company.com",
        "ATLASSIAN_API_TOKEN": "your_token",
        "DEBUG": "false",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Cursor IDE Configuration

```json
{
  "mcp": {
    "servers": {
      "bitbucket": {
        "command": "bitbucket-mcp-server",
        "args": [],
        "env": {
          "ATLASSIAN_USER_EMAIL": "your_email@company.com",
          "ATLASSIAN_API_TOKEN": "your_token"
        }
      }
    }
  }
}
```

#### Custom MCP Client

```typescript
import { McpClient } from '@modelcontextprotocol/sdk/client';

const client = new McpClient({
  name: 'bitbucket-client',
  version: '2.2.0',
});

// Connect to server
await client.connect({
  command: 'bitbucket-mcp-server',
  env: {
    ATLASSIAN_USER_EMAIL: 'your_email@company.com',
    ATLASSIAN_API_TOKEN: 'your_token',
  },
});
```

### HTTP Server Mode

#### Start HTTP Server

```bash
# Start HTTP server
TRANSPORT_MODE=http PORT=3000 bitbucket-mcp-server

# Or set in environment
export TRANSPORT_MODE=http
export PORT=3000
bitbucket-mcp-server

# With custom configuration
TRANSPORT_MODE=http PORT=8080 DEBUG=true bitbucket-mcp-server
```

#### Test HTTP Endpoints

```bash
# Health check
curl http://localhost:3000/

# MCP endpoint
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

### 🐳 Docker Setup

#### Dockerfile

```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bitbucket-mcp-server -u 1001

# Change ownership
RUN chown -R bitbucket-mcp-server:nodejs /app
USER bitbucket-mcp-server

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  bitbucket-mcp-server:
    build: .
    ports:
      - '3000:3000'
    environment:
      - ATLASSIAN_USER_EMAIL=${ATLASSIAN_USER_EMAIL}
      - ATLASSIAN_API_TOKEN=${ATLASSIAN_API_TOKEN}
      - TRANSPORT_MODE=http
      - DEBUG=false
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

### ☸️ Kubernetes Setup

#### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bitbucket-mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bitbucket-mcp-server
  template:
    metadata:
      labels:
        app: bitbucket-mcp-server
    spec:
      containers:
        - name: bitbucket-mcp-server
          image: bitbucket-mcp-server:latest
          ports:
            - containerPort: 3000
          env:
            - name: ATLASSIAN_USER_EMAIL
              valueFrom:
                secretKeyRef:
                  name: bitbucket-secrets
                  key: email
            - name: ATLASSIAN_API_TOKEN
              valueFrom:
                secretKeyRef:
                  name: bitbucket-secrets
                  key: token
            - name: TRANSPORT_MODE
              value: 'http'
```

#### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: bitbucket-mcp-server-service
spec:
  selector:
    app: bitbucket-mcp-server
  ports:
    - port: 3000
      targetPort: 3000
  type: LoadBalancer
```

## 🌍 Environment Configuration

### Development Environment

#### .env.development

```env
# Development configuration
ATLASSIAN_USER_EMAIL=dev@company.com
ATLASSIAN_API_TOKEN=dev_token
DEBUG=true
TRANSPORT_MODE=stdio
LOG_LEVEL=debug
```

#### Development Scripts

```json
{
  "scripts": {
    "dev": "DEBUG=true TRANSPORT_MODE=stdio npm run start",
    "dev:http": "DEBUG=true TRANSPORT_MODE=http PORT=3000 npm run start",
    "dev:watch": "DEBUG=true npm run dev -- --watch"
  }
}
```

### Staging Environment

#### .env.staging

```env
# Staging configuration
ATLASSIAN_USER_EMAIL=staging@company.com
ATLASSIAN_API_TOKEN=staging_token
DEBUG=false
TRANSPORT_MODE=http
PORT=3000
LOG_LEVEL=info
```

### Production Environment

#### .env.production

```env
# Production configuration
ATLASSIAN_USER_EMAIL=prod@company.com
ATLASSIAN_API_TOKEN=prod_token
DEBUG=false
TRANSPORT_MODE=http
PORT=3000
LOG_LEVEL=warn
API_TIMEOUT=30000
API_MAX_RETRIES=3
```

### Environment Variables Reference

#### Core Configuration

| Variable               | Description                       | Default | Required    |
| ---------------------- | --------------------------------- | ------- | ----------- |
| `ATLASSIAN_USER_EMAIL` | Your Atlassian email (Cloud)      | -       | Cloud only  |
| `ATLASSIAN_API_TOKEN`  | Your Atlassian API token (Cloud)  | -       | Cloud only  |
| `BITBUCKET_USERNAME`   | Your Bitbucket username (Server)  | -       | Server only |
| `BITBUCKET_API_TOKEN`  | Your Bitbucket API token (Server) | -       | Server only |
| `BITBUCKET_BASE_URL`   | Your Bitbucket Server URL         | -       | Server only |
| `TRANSPORT_MODE`       | Transport mode: `stdio` or `http` | `stdio` | No          |
| `PORT`                 | HTTP server port                  | `3000`  | No          |
| `DEBUG`                | Enable debug logging              | `false` | No          |

#### API Configuration

| Variable          | Description              | Default | Required |
| ----------------- | ------------------------ | ------- | -------- |
| `API_TIMEOUT`     | API request timeout (ms) | `30000` | No       |
| `API_MAX_RETRIES` | Maximum API retries      | `3`     | No       |
| `API_RATE_LIMIT`  | API rate limit (req/sec) | `1000`  | No       |

## 🛠️ Feature Configuration

### Tool Selection

#### Enable/Disable Tools

```env
# Core tools (enabled by default)
CLOUD_CORE_AUTH=true
CLOUD_CORE_REPOSITORY=true
CLOUD_CORE_PULL_REQUEST=true
CLOUD_CORE_COMMIT=true
CLOUD_CORE_PROJECT=true
CLOUD_CORE_WORKSPACE=true

# Secondary tools (enabled by default)
CLOUD_SECONDARY_USER=true
CLOUD_SECONDARY_SEARCH=true
CLOUD_SECONDARY_ISSUE=true
CLOUD_SECONDARY_DIFF=true
CLOUD_SECONDARY_PIPELINE=true
CLOUD_SECONDARY_BRANCH_RESTRICTION=true

# Advanced tools (enabled by default)
CLOUD_ADVANCED_WEBHOOK=true
CLOUD_ADVANCED_OAUTH=true
CLOUD_ADVANCED_SSH=true
CLOUD_ADVANCED_SOURCE=true
CLOUD_ADVANCED_REF=true
CLOUD_ADVANCED_SNIPPET=true
CLOUD_ADVANCED_TOKEN_MANAGEMENT=true
CLOUD_ADVANCED_SCOPE_VALIDATOR=true
```

#### Minimal Configuration

```env
# Only enable essential tools
CLOUD_CORE_AUTH=true
CLOUD_CORE_REPOSITORY=true
CLOUD_CORE_PULL_REQUEST=true

# Disable all other tools
CLOUD_CORE_COMMIT=false
CLOUD_CORE_PROJECT=false
CLOUD_CORE_WORKSPACE=false
CLOUD_SECONDARY_USER=false
CLOUD_SECONDARY_SEARCH=false
CLOUD_SECONDARY_ISSUE=false
CLOUD_SECONDARY_DIFF=false
CLOUD_SECONDARY_PIPELINE=false
CLOUD_SECONDARY_BRANCH_RESTRICTION=false
CLOUD_ADVANCED_WEBHOOK=false
CLOUD_ADVANCED_OAUTH=false
CLOUD_ADVANCED_SSH=false
CLOUD_ADVANCED_SOURCE=false
CLOUD_ADVANCED_REF=false
CLOUD_ADVANCED_SNIPPET=false
CLOUD_ADVANCED_TOKEN_MANAGEMENT=false
CLOUD_ADVANCED_SCOPE_VALIDATOR=false
```

### Performance Tuning

#### Connection Pooling

```env
# Connection pool settings
CONNECTION_POOL_SIZE=10
CONNECTION_POOL_MIN=2
CONNECTION_POOL_MAX=20
CONNECTION_TIMEOUT=30000
```

#### Caching Configuration

```env
# Cache settings
CACHE_ENABLED=true
CACHE_TTL=300000
CACHE_MAX_SIZE=1000
CACHE_CLEANUP_INTERVAL=60000
```

## 🧪 Testing Your Setup

### Basic Connectivity Test

#### Test Authentication

```bash
# Test with debug mode
DEBUG=true bitbucket-mcp-server --help

# Check for authentication errors
bitbucket-mcp-server repository list
```

#### Test API Access

```bash
# Test repository listing
bitbucket-mcp-server repository list

# Test pull request listing
bitbucket-mcp-server pull-request list --workspace your_workspace --repo your_repo
```

### MCP Client Testing

#### Test MCP Connection

```bash
# Start server in stdio mode
bitbucket-mcp-server

# In another terminal, test MCP connection
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | bitbucket-mcp-server
```

#### Test HTTP Mode

```bash
# Start HTTP server
TRANSPORT_MODE=http bitbucket-mcp-server

# Test health endpoint
curl http://localhost:3000/

# Test MCP endpoint
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

### Comprehensive Testing

#### Run Test Suite

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test
npm test -- --testNamePattern="authentication"
```

#### Manual Testing Checklist

- [ ] **Authentication**: Can authenticate with Bitbucket
- [ ] **Repository Access**: Can list and access repositories
- [ ] **Pull Request Operations**: Can create, read, update PRs
- [ ] **User Operations**: Can access user information
- [ ] **Search Functionality**: Can search repositories and code
- [ ] **Error Handling**: Proper error messages for invalid operations
- [ ] **Logging**: Appropriate log messages for operations
- [ ] **Performance**: Operations complete within reasonable time

## 🔧 Troubleshooting

### Common Issues

#### Authentication Errors

```bash
# Error: Invalid credentials
# Solution: Check your email/token combination
ATLASSIAN_USER_EMAIL=your_correct_email@company.com
ATLASSIAN_API_TOKEN=your_valid_token
```

#### Network Issues

```bash
# Error: Connection timeout
# Solution: Check network connectivity and firewall
curl -I https://api.bitbucket.org/2.0/

# Error: SSL certificate issues
# Solution: Update certificates or use --insecure flag
npm config set strict-ssl false
```

#### Permission Issues

```bash
# Error: Insufficient permissions
# Solution: Check token scopes and repository permissions
# Ensure your token has the required permissions for the operation
```

### Debug Mode

#### Enable Debug Logging

```bash
# Set debug mode
export DEBUG=true

# Start server with debug logging
bitbucket-mcp-server
```

#### Debug Output Example

```
[DEBUG] Configuration loaded successfully
[DEBUG] Detected Bitbucket type: cloud
[DEBUG] Authentication method: api-token
[DEBUG] Registering Cloud tools...
[DEBUG] MCP server started successfully
```

### Log Analysis

#### Check Logs

```bash
# View recent logs
tail -f logs/bitbucket-mcp-server.log

# Search for errors
grep -i error logs/bitbucket-mcp-server.log

# Search for specific operations
grep -i "pull request" logs/bitbucket-mcp-server.log
```

### Performance Issues

#### Monitor Performance

```bash
# Check memory usage
ps aux | grep bitbucket-mcp-server

# Check network connections
netstat -an | grep :3000

# Monitor API response times
DEBUG=true bitbucket-mcp-server 2>&1 | grep "API call"
```

### Getting Help

#### Documentation

- [Authentication Services](AUTHENTICATION_SERVICES.md)
- [Features](FEATURES.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Security](SECURITY.md)

#### Community Support

- [GitHub Issues](https://github.com/guercheLE/bitbucket-mcp-server/issues)
- [GitHub Discussions](https://github.com/guercheLE/bitbucket-mcp-server/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/bitbucket-mcp-server)

#### Professional Support

- Contact the development team
- Enterprise support options
- Custom implementation services

## 🎯 Next Steps

After completing the setup:

1. **Review the [Features Documentation](FEATURES.md)** to understand available capabilities
2. **Check the [Security Guide](SECURITY.md)** for security best practices
3. **Explore the [API Documentation](API.md)** for advanced usage
4. **Join the [Community](CONTRIBUTING.md)** to contribute and get help
5. **Set up monitoring** for production environments
6. **Configure backups** for your configuration files
7. **Test all features** with your specific use cases

### Quick Start Commands

```bash
# Test basic functionality
bitbucket-mcp-server repository list

# Create a test pull request
bitbucket-mcp-server pull-request create \
  --workspace your-workspace \
  --repository your-repo \
  --title "Test PR" \
  --source-branch feature-branch \
  --destination-branch main

# Search for repositories
bitbucket-mcp-server search repositories --query "your-search-term"
```

Your Bitbucket MCP Server should now be ready for use! 🚀
