# 🔧 Troubleshooting Guide

This comprehensive troubleshooting guide helps you diagnose and resolve common issues with the Bitbucket MCP Server. It provides step-by-step solutions for authentication, configuration, performance, and other common problems.

## Table of Contents

- [🚀 Quick Diagnosis](#-quick-diagnosis)
- [🔐 Authentication Issues](#-authentication-issues)
- [🌐 Connection Problems](#-connection-problems)
- [⚙️ Configuration Issues](#️-configuration-issues)
- [⚡ Performance Problems](#-performance-problems)
- [🔗 MCP Protocol Issues](#-mcp-protocol-issues)
- [💻 CLI Issues](#-cli-issues)
- [🌍 HTTP Server Issues](#-http-server-issues)
- [🛠️ Development Issues](#️-development-issues)
- [📊 Log Analysis](#-log-analysis)
- [❌ Common Error Messages](#-common-error-messages)
- [🆘 Getting Help](#-getting-help)
- [🎯 Quick Reference](#-quick-reference)

## 🚀 Quick Diagnosis

### Health Check Commands

#### Basic Health Check

```bash
# Check if the server is installed correctly
bitbucket-mcp-server --version

# Check configuration
bitbucket-mcp-server --help

# Test basic connectivity
bitbucket-mcp-server repository list --workspace your-workspace
```

#### Debug Mode

```bash
# Enable debug logging
DEBUG=true bitbucket-mcp-server --help

# Check environment variables
env | grep -E "(ATLASSIAN|BITBUCKET|OAUTH)"

# Test with verbose output
bitbucket-mcp-server --verbose repository list
```

### Quick Fixes

#### Common Quick Fixes

```bash
# 1. Clear npm cache
npm cache clean --force

# 2. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Reset configuration
rm .env
cp env.example .env
# Edit .env with your credentials

# 4. Check Node.js version
node --version  # Should be 18.0.0+

# 5. Check network connectivity
curl -I https://api.bitbucket.org/2.0/
```

## 🔐 Authentication Issues

### Invalid Credentials

#### Error: "Invalid credentials" or "Authentication failed"

**Symptoms:**

- 401 Unauthorized errors
- "Invalid credentials" messages
- Authentication failures

**Diagnosis:**

```bash
# Check your credentials
echo $ATLASSIAN_USER_EMAIL
echo $ATLASSIAN_API_TOKEN

# Test credentials manually
curl -u "$ATLASSIAN_USER_EMAIL:$ATLASSIAN_API_TOKEN" \
  https://api.bitbucket.org/2.0/user
```

**Solutions:**

1. **Verify Email Address**

   ```bash
   # Ensure email is correct (case-sensitive)
   ATLASSIAN_USER_EMAIL=your_exact_email@company.com
   ```

2. **Regenerate API Token**
   - Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Delete old token
   - Create new token
   - Update environment variable

3. **Check Token Permissions**
   - Ensure token has required scopes
   - Verify token hasn't expired
   - Check if token was revoked

4. **Test with App Password**
   ```bash
   # Try app password instead
   ATLASSIAN_USER_EMAIL=your_email@company.com
   BITBUCKET_APP_PASSWORD=your_app_password
   ```

### Token Expiration

#### Error: "Token expired" or "Invalid token"

**Symptoms:**

- 401 errors after working initially
- "Token expired" messages
- Authentication failures

**Solutions:**

1. **Check Token Expiration**

   ```bash
   # Check if token has expiration date
   # Some tokens expire after 30 days
   ```

2. **Refresh OAuth Token**

   ```bash
   # For OAuth tokens, use refresh token
   OAUTH_REFRESH_TOKEN=your_refresh_token
   ```

3. **Generate New Token**
   ```bash
   # Create new API token
   # Update environment variable
   ATLASSIAN_API_TOKEN=new_token
   ```

### Permission Issues

#### Error: "Insufficient permissions" or "Forbidden"

**Symptoms:**

- 403 Forbidden errors
- "Insufficient permissions" messages
- Access denied errors

**Diagnosis:**

```bash
# Check what permissions your token has
curl -u "$ATLASSIAN_USER_EMAIL:$ATLASSIAN_API_TOKEN" \
  https://api.bitbucket.org/2.0/user/permissions
```

**Solutions:**

1. **Check Repository Permissions**
   - Verify you have access to the repository
   - Check if repository is private and you have access
   - Ensure you're using the correct workspace

2. **Use Granular Tokens**

   ```bash
   # Use repository-specific token
   REPOSITORY_ACCESS_TOKEN=your_repo_token
   REPOSITORY_SLUG=your_repo
   REPOSITORY_WORKSPACE=your_workspace
   ```

3. **Check Workspace Access**
   ```bash
   # Verify workspace access
   curl -u "$ATLASSIAN_USER_EMAIL:$ATLASSIAN_API_TOKEN" \
     https://api.bitbucket.org/2.0/workspaces/your_workspace
   ```

## 🌐 Connection Problems

### Network Issues

#### Error: "Connection timeout" or "Network error"

**Symptoms:**

- Connection timeouts
- Network unreachable errors
- DNS resolution failures

**Diagnosis:**

```bash
# Test basic connectivity
ping api.bitbucket.org

# Test HTTPS connectivity
curl -I https://api.bitbucket.org/2.0/

# Test with timeout
curl --connect-timeout 10 https://api.bitbucket.org/2.0/
```

**Solutions:**

1. **Check Firewall Settings**

   ```bash
   # Allow outbound HTTPS (port 443)
   # Allow outbound HTTP (port 80)
   ```

2. **Configure Proxy**

   ```bash
   # Set proxy environment variables
   export HTTP_PROXY=http://proxy.company.com:8080
   export HTTPS_PROXY=http://proxy.company.com:8080
   export NO_PROXY=localhost,127.0.0.1
   ```

3. **Increase Timeout**
   ```bash
   # Increase API timeout
   API_TIMEOUT=60000  # 60 seconds
   ```

### SSL/TLS Issues

#### Error: "SSL certificate problem" or "TLS error"

**Symptoms:**

- SSL certificate errors
- TLS handshake failures
- Certificate validation errors

**Diagnosis:**

```bash
# Test SSL connectivity
openssl s_client -connect api.bitbucket.org:443

# Check certificate
curl -v https://api.bitbucket.org/2.0/
```

**Solutions:**

1. **Update Certificates**

   ```bash
   # Update system certificates
   sudo apt-get update && sudo apt-get install ca-certificates
   ```

2. **Bypass SSL Verification (Development Only)**

   ```bash
   # NOT recommended for production
   NODE_TLS_REJECT_UNAUTHORIZED=0
   ```

3. **Use Custom CA Bundle**
   ```bash
   # Set custom CA bundle
   NODE_EXTRA_CA_CERTS=/path/to/ca-bundle.crt
   ```

### Rate Limiting

#### Error: "Rate limit exceeded" or "Too many requests"

**Symptoms:**

- 429 Too Many Requests errors
- Rate limit exceeded messages
- Temporary failures

**Solutions:**

1. **Implement Retry Logic**

   ```bash
   # Increase retry attempts
   API_MAX_RETRIES=5
   ```

2. **Reduce Request Frequency**

   ```bash
   # Add delays between requests
   API_RATE_LIMIT=100  # requests per second
   ```

3. **Use Exponential Backoff**
   ```typescript
   // Implement exponential backoff
   const delay = Math.pow(2, retryCount) * 1000;
   await new Promise(resolve => setTimeout(resolve, delay));
   ```

## ⚙️ Configuration Issues

### Environment Variables

#### Error: "Configuration not loaded" or "Missing environment variables"

**Symptoms:**

- Configuration errors
- Missing environment variables
- Invalid configuration

**Diagnosis:**

```bash
# Check environment variables
env | grep -E "(ATLASSIAN|BITBUCKET|OAUTH|TRANSPORT|DEBUG)"

# Check .env file
cat .env

# Validate configuration
bitbucket-mcp-server --help
```

**Solutions:**

1. **Check .env File**

   ```bash
   # Ensure .env file exists and is readable
   ls -la .env
   chmod 600 .env
   ```

2. **Validate Environment Variables**

   ```bash
   # Check required variables
   echo "Email: $ATLASSIAN_USER_EMAIL"
   echo "Token: ${ATLASSIAN_API_TOKEN:0:10}..."
   ```

3. **Use Absolute Paths**
   ```bash
   # Use absolute paths for configuration
   export CONFIG_PATH=/absolute/path/to/.env
   ```

### Feature Flags

#### Error: "Tool not available" or "Feature disabled"

**Symptoms:**

- Tools not appearing in MCP client
- "Feature disabled" messages
- Missing functionality

**Diagnosis:**

```bash
# Check feature flags
env | grep -E "(CLOUD_|DATACENTER_)"

# List available tools
bitbucket-mcp-server --help
```

**Solutions:**

1. **Enable Required Features**

   ```bash
   # Enable core features
   CLOUD_CORE_AUTH=true
   CLOUD_CORE_REPOSITORY=true
   CLOUD_CORE_PULL_REQUEST=true
   ```

2. **Check Feature Dependencies**

   ```bash
   # Some features require others
   CLOUD_CORE_AUTH=true  # Required for most features
   ```

3. **Restart Server**
   ```bash
   # Restart after changing feature flags
   pkill -f bitbucket-mcp-server
   bitbucket-mcp-server
   ```

## ⚡ Performance Problems

### Slow Response Times

#### Symptoms: Slow API responses or timeouts

**Diagnosis:**

```bash
# Test response times
time curl -u "$ATLASSIAN_USER_EMAIL:$ATLASSIAN_API_TOKEN" \
  https://api.bitbucket.org/2.0/user

# Check system resources
top
free -h
df -h
```

**Solutions:**

1. **Optimize API Calls**

   ```bash
   # Reduce API timeout
   API_TIMEOUT=15000  # 15 seconds

   # Increase retry attempts
   API_MAX_RETRIES=3
   ```

2. **Use Caching**

   ```bash
   # Enable caching
   CACHE_ENABLED=true
   CACHE_TTL=300000  # 5 minutes
   ```

3. **Optimize Memory Usage**
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=2048"
   ```

### High Memory Usage

#### Symptoms: High memory consumption or out of memory errors

**Solutions:**

1. **Monitor Memory Usage**

   ```bash
   # Check memory usage
   ps aux | grep bitbucket-mcp-server

   # Monitor with htop
   htop
   ```

2. **Optimize Memory Settings**

   ```bash
   # Set memory limits
   NODE_OPTIONS="--max-old-space-size=1024"

   # Enable garbage collection
   NODE_OPTIONS="--expose-gc"
   ```

3. **Restart Periodically**
   ```bash
   # Set up automatic restart
   # Use systemd or PM2 for process management
   ```

## 🔗 MCP Protocol Issues

### MCP Client Connection

#### Error: "MCP connection failed" or "Protocol error"

**Symptoms:**

- MCP client can't connect
- Protocol errors
- Communication failures

**Diagnosis:**

```bash
# Test MCP server directly
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | \
  bitbucket-mcp-server

# Check MCP client configuration
# Verify command and environment variables
```

**Solutions:**

1. **Check MCP Client Configuration**

   ```json
   {
     "mcpServers": {
       "bitbucket": {
         "command": "bitbucket-mcp-server",
         "env": {
           "ATLASSIAN_USER_EMAIL": "your_email@company.com",
           "ATLASSIAN_API_TOKEN": "your_token"
         }
       }
     }
   }
   ```

2. **Test STDIO Mode**

   ```bash
   # Test STDIO communication
   TRANSPORT_MODE=stdio bitbucket-mcp-server
   ```

3. **Check MCP Version Compatibility**
   ```bash
   # Ensure MCP SDK version compatibility
   npm list @modelcontextprotocol/sdk
   ```

### Tool Registration

#### Error: "Tool not found" or "Invalid tool"

**Symptoms:**

- Tools not appearing in client
- "Tool not found" errors
- Missing tool functionality

**Solutions:**

1. **Check Tool Registration**

   ```bash
   # List available tools
   bitbucket-mcp-server --help

   # Check feature flags
   env | grep CLOUD_CORE
   ```

2. **Enable Required Tools**

   ```bash
   # Enable specific tools
   CLOUD_CORE_REPOSITORY=true
   CLOUD_CORE_PULL_REQUEST=true
   ```

3. **Restart MCP Server**
   ```bash
   # Restart server after configuration changes
   pkill -f bitbucket-mcp-server
   bitbucket-mcp-server
   ```

## 💻 CLI Issues

### Command Not Found

#### Error: "Command not found" or "bitbucket-mcp-server: command not found"

**Solutions:**

1. **Check Installation**

   ```bash
   # Verify global installation
   npm list -g @guerchele/bitbucket-mcp-server

   # Check PATH
   which bitbucket-mcp-server
   echo $PATH
   ```

2. **Reinstall Globally**

   ```bash
   # Uninstall and reinstall
   npm uninstall -g @guerchele/bitbucket-mcp-server
   npm install -g @guerchele/bitbucket-mcp-server
   ```

3. **Use npx**
   ```bash
   # Use npx instead of global installation
   npx @guerchele/bitbucket-mcp-server --help
   ```

### Command Execution Errors

#### Error: Command fails or returns errors

**Diagnosis:**

```bash
# Run with debug mode
DEBUG=true bitbucket-mcp-server repository list

# Check command syntax
bitbucket-mcp-server repository --help
```

**Solutions:**

1. **Check Command Syntax**

   ```bash
   # Use correct command format
   bitbucket-mcp-server repository list --workspace your-workspace
   ```

2. **Verify Parameters**

   ```bash
   # Check required parameters
   bitbucket-mcp-server pull-request list \
     --workspace your-workspace \
     --repo your-repository
   ```

3. **Use Verbose Output**
   ```bash
   # Get detailed output
   bitbucket-mcp-server --verbose repository list
   ```

## 🌍 HTTP Server Issues

### Server Won't Start

#### Error: "Port already in use" or "Server start failed"

**Diagnosis:**

```bash
# Check if port is in use
netstat -tulpn | grep :3000
lsof -i :3000

# Check server logs
tail -f logs/bitbucket-mcp-server.log
```

**Solutions:**

1. **Change Port**

   ```bash
   # Use different port
   PORT=3001 bitbucket-mcp-server
   ```

2. **Kill Existing Process**

   ```bash
   # Find and kill existing process
   pkill -f bitbucket-mcp-server

   # Or kill by port
   kill $(lsof -t -i:3000)
   ```

3. **Check Permissions**
   ```bash
   # Check if user can bind to port
   sudo netstat -tulpn | grep :3000
   ```

### HTTP Requests Failing

#### Error: HTTP requests return errors or timeouts

**Diagnosis:**

```bash
# Test HTTP endpoint
curl -v http://localhost:3000/

# Test MCP endpoint
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

**Solutions:**

1. **Check Server Status**

   ```bash
   # Verify server is running
   ps aux | grep bitbucket-mcp-server

   # Check server logs
   tail -f logs/bitbucket-mcp-server.log
   ```

2. **Test Connectivity**

   ```bash
   # Test local connectivity
   curl -I http://localhost:3000/

   # Test from external machine
   curl -I http://your-server:3000/
   ```

3. **Check Firewall**

   ```bash
   # Allow HTTP traffic
   sudo ufw allow 3000/tcp

   # Check firewall status
   sudo ufw status
   ```

## 🛠️ Development Issues

### Build Failures

#### Error: "Build failed" or "TypeScript errors"

**Diagnosis:**

```bash
# Check TypeScript errors
npm run build

# Check linting errors
npm run lint

# Check test failures
npm test
```

**Solutions:**

1. **Fix TypeScript Errors**

   ```bash
   # Check TypeScript configuration
   npx tsc --noEmit

   # Fix type errors
   # Update type definitions
   ```

2. **Fix Linting Errors**

   ```bash
   # Auto-fix linting issues
   npm run lint:fix

   # Check specific files
   npx eslint src/path/to/file.ts
   ```

3. **Update Dependencies**

   ```bash
   # Update dependencies
   npm update

   # Check for security vulnerabilities
   npm audit
   npm audit fix
   ```

### Test Failures

#### Error: Tests failing or coverage issues

**Solutions:**

1. **Run Specific Tests**

   ```bash
   # Run specific test file
   npm test -- src/services/repository.service.test.ts

   # Run tests in watch mode
   npm run test:watch
   ```

2. **Debug Test Issues**

   ```bash
   # Run tests with debug output
   DEBUG=true npm test

   # Run tests with coverage
   npm run test:coverage
   ```

3. **Fix Test Dependencies**

   ```bash
   # Clear test cache
   npm test -- --clearCache

   # Reinstall test dependencies
   npm install --save-dev jest @types/jest
   ```

## 📊 Log Analysis

### Understanding Logs

#### Log Levels and Messages

```bash
# Check log levels
grep -E "\[(DEBUG|INFO|WARN|ERROR)\]" logs/bitbucket-mcp-server.log

# Filter by log level
grep "\[ERROR\]" logs/bitbucket-mcp-server.log
grep "\[WARN\]" logs/bitbucket-mcp-server.log
```

#### Common Log Patterns

```bash
# Authentication logs
grep -i "auth" logs/bitbucket-mcp-server.log

# API request logs
grep -i "api" logs/bitbucket-mcp-server.log

# Error logs
grep -i "error\|exception\|failed" logs/bitbucket-mcp-server.log
```

### Log Rotation

#### Configure Log Rotation

```bash
# Set up log rotation
sudo nano /etc/logrotate.d/bitbucket-mcp-server

# Add configuration
/var/log/bitbucket-mcp-server/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 bitbucket-mcp-server bitbucket-mcp-server
    postrotate
        systemctl reload bitbucket-mcp-server
    endscript
}
```

## ❌ Common Error Messages

### Authentication Errors

| Error Message              | Cause               | Solution           |
| -------------------------- | ------------------- | ------------------ |
| "Invalid credentials"      | Wrong email/token   | Verify credentials |
| "Token expired"            | Expired token       | Generate new token |
| "Insufficient permissions" | Missing permissions | Check token scopes |
| "Authentication failed"    | Network/API issue   | Check connectivity |

### Configuration Errors

| Error Message                   | Cause                 | Solution               |
| ------------------------------- | --------------------- | ---------------------- |
| "Configuration not loaded"      | Missing .env file     | Create .env file       |
| "Invalid configuration"         | Wrong format          | Check .env format      |
| "Missing environment variables" | Required vars missing | Set required variables |
| "Feature disabled"              | Feature flag off      | Enable feature flag    |

### Network Errors

| Error Message             | Cause             | Solution            |
| ------------------------- | ----------------- | ------------------- |
| "Connection timeout"      | Network issue     | Check connectivity  |
| "SSL certificate problem" | Certificate issue | Update certificates |
| "Rate limit exceeded"     | Too many requests | Implement backoff   |
| "DNS resolution failed"   | DNS issue         | Check DNS settings  |

### MCP Errors

| Error Message           | Cause               | Solution              |
| ----------------------- | ------------------- | --------------------- |
| "MCP connection failed" | Client config issue | Check client config   |
| "Tool not found"        | Tool not registered | Enable tool feature   |
| "Protocol error"        | Version mismatch    | Update MCP SDK        |
| "Invalid tool call"     | Wrong parameters    | Check tool parameters |

## 🆘 Getting Help

### Self-Help Resources

#### Documentation

- [README.md](../README.md) - Project overview and quick start
- [Setup Guide](SETUP_GUIDE.md) - Detailed setup instructions
- [Features](FEATURES.md) - Complete feature documentation
- [Security](SECURITY.md) - Security considerations
- [Contributing](CONTRIBUTING.md) - How to contribute

#### Debugging Tools

```bash
# Enable debug mode
DEBUG=true bitbucket-mcp-server

# Check system information
node --version
npm --version
uname -a

# Check network connectivity
ping api.bitbucket.org
curl -I https://api.bitbucket.org/2.0/
```

### Community Support

#### GitHub Issues

- [Report Bugs](https://github.com/guercheLE/bitbucket-mcp-server/issues)
- [Request Features](https://github.com/guercheLE/bitbucket-mcp-server/issues)
- [Ask Questions](https://github.com/guercheLE/bitbucket-mcp-server/discussions)

#### When Reporting Issues

Include the following information:

1. **Environment Details**

   ```bash
   # System information
   uname -a
   node --version
   npm --version
   ```

2. **Configuration**

   ```bash
   # Environment variables (sanitized)
   env | grep -E "(ATLASSIAN|BITBUCKET|OAUTH|TRANSPORT|DEBUG)" | \
     sed 's/=.*/=***/'
   ```

3. **Error Logs**

   ```bash
   # Recent error logs
   tail -n 50 logs/bitbucket-mcp-server.log
   ```

4. **Steps to Reproduce**
   - Exact commands run
   - Expected vs actual behavior
   - Error messages

### Professional Support

#### Enterprise Support

- Custom implementation services
- Priority support
- Training and consulting
- Custom feature development

#### Contact Information

- **Email**: [support@example.com]
- **Documentation**: [docs.example.com]
- **Community**: [GitHub Discussions](https://github.com/guercheLE/bitbucket-mcp-server/discussions)

### Emergency Procedures

#### Critical Issues

1. **Security Issues**: Report immediately via email
2. **Data Loss**: Stop operations and contact support
3. **System Compromise**: Isolate system and report

#### Recovery Procedures

1. **Backup Configuration**: Always backup working configurations
2. **Rollback Plan**: Keep previous versions available
3. **Disaster Recovery**: Document recovery procedures

## 🎯 Quick Reference

### Emergency Commands

```bash
# Stop all instances
pkill -f bitbucket-mcp-server

# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Reset configuration
rm .env
cp env.example .env
# Edit .env with your credentials

# Check system status
ps aux | grep bitbucket-mcp-server
netstat -tulpn | grep :3000
```

### Quick Fixes by Issue Type

| Issue Type         | Quick Fix                                     |
| ------------------ | --------------------------------------------- |
| **Authentication** | Regenerate API token, check email format      |
| **Connection**     | Check firewall, test network connectivity     |
| **Configuration**  | Verify .env file, check environment variables |
| **Performance**    | Increase memory limit, enable caching         |
| **MCP Protocol**   | Check client configuration, restart server    |
| **CLI**            | Reinstall globally, use npx                   |
| **HTTP Server**    | Change port, check permissions                |
| **Development**    | Fix TypeScript errors, update dependencies    |

### Diagnostic Commands

```bash
# System information
uname -a
node --version
npm --version

# Network connectivity
ping api.bitbucket.org
curl -I https://api.bitbucket.org/2.0/

# Process information
ps aux | grep bitbucket-mcp-server
lsof -i :3000

# Log analysis
tail -f logs/bitbucket-mcp-server.log
grep -i "error\|exception" logs/bitbucket-mcp-server.log
```

### Environment Variables Checklist

```bash
# Required for Cloud
ATLASSIAN_USER_EMAIL=your_email@company.com
ATLASSIAN_API_TOKEN=your_token

# Required for Server/Data Center
BITBUCKET_USERNAME=your_username
BITBUCKET_API_TOKEN=your_token
BITBUCKET_BASE_URL=https://your-bitbucket-server.com

# Optional
DEBUG=true
LOG_LEVEL=debug
TRANSPORT_MODE=stdio
PORT=3000
```

This troubleshooting guide should help you resolve most issues with the Bitbucket MCP Server. If you encounter issues not covered here, please refer to the community support resources or contact the development team. For more information, see the [Setup Guide](SETUP_GUIDE.md) and [Security Guide](SECURITY.md).
