# Bitbucket MCP Server

A comprehensive MCP (Model Context Protocol) server for integration with Bitbucket Cloud and Data Center, developed in TypeScript with automatic server type detection and selective tool loading support.

## 🚀 Features

- **Automatic Detection**: Automatically detects whether connecting to Bitbucket Cloud or Data Center
- **Selective Loading**: Loads only MCP tools relevant to the detected server type
- **Complete Support**: Support for authentication, repositories, pull requests, projects, and much more
- **Intelligent Rate Limiting**: Smart rate limiting with burst limits
- **Automatic Retry**: Automatic retry with exponential backoff
- **Structured Logging**: Structured logging for observability
- **Integrated CLI**: Integrated CLI client for direct interaction
- **Comprehensive Testing**: Complete test coverage with TDD

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Access to Bitbucket Cloud or Data Center

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd bitbucket-mcp-server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit the .env file with your credentials
```

## ⚙️ Configuration

### Environment Variables

```bash
# Bitbucket Configuration
BITBUCKET_BASE_URL=https://api.bitbucket.org  # or your Data Center URL
BITBUCKET_USERNAME=your_username
BITBUCKET_PASSWORD=your_password
# or
BITBUCKET_TOKEN=your_api_token

# Server Type (optional - auto-detects if not specified)
BITBUCKET_SERVER_TYPE=cloud  # or 'datacenter'

# Timeouts (optional)
BITBUCKET_TIMEOUT_REQUEST=30000
BITBUCKET_TIMEOUT_CONNECTION=10000

# Rate Limiting (optional)
BITBUCKET_RATE_LIMIT_REQUESTS_PER_MINUTE=60
BITBUCKET_RATE_LIMIT_BURST_LIMIT=10

# Retry Configuration (optional)
BITBUCKET_RETRY_MAX_ATTEMPTS=3
BITBUCKET_RETRY_BASE_DELAY=1000
BITBUCKET_RETRY_MAX_DELAY=10000
BITBUCKET_RETRY_BACKOFF_MULTIPLIER=2

# Logging (optional)
LOG_LEVEL=info  # error, warn, info, debug
```

### MCP Server Configuration

The MCP server can be configured through environment variables or configuration file:

```typescript
// Programmatic configuration example
const config = {
  baseUrl: 'https://api.bitbucket.org',
  auth: {
    type: 'basic',
    credentials: {
      username: 'your_username',
      password: 'your_password'
    }
  },
  serverType: 'auto', // 'cloud', 'datacenter', or 'auto'
  timeouts: {
    request: 30000,
    connection: 10000
  },
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  },
  rateLimit: {
    requestsPerMinute: 60,
    burstLimit: 10
  }
};
```

## 🚀 Usage

### Starting the MCP Server

```bash
# Development
npm run dev

# Production
npm start

# With specific configuration
npm start -- --config config.json
```

### Using the CLI

```bash
# Authentication
npm run cli auth login --username=your_username --password=your_password

# List repositories
npm run cli repository list

# Create pull request
npm run cli pullrequest create --title="New feature" --source=feature-branch --destination=main

# List projects (Data Center)
npm run cli project list

# Check server status
npm run cli server status
```

### Integration with MCP Clients

The MCP server exposes the following tools (selectively loaded based on server type):

#### Common Tools (Cloud and Data Center)
- `authentication` - Authentication
- `get_current_user` - Get current user
- `repository_management` - Repository management
- `pull_request_workflow` - Pull request workflow

#### Data Center Specific Tools
- `project_management` - Project management
- `project_permissions` - Project permissions
- `project_settings` - Project settings
- `project_hooks` - Project hooks
- `project_avatar` - Project avatar

## 🏗️ Architecture

### Project Structure

```
src/
├── types/                 # TypeScript types and Zod schemas
│   ├── bitbucket.ts      # Core Bitbucket entities
│   ├── config.ts         # Configuration
│   ├── errors.ts         # Error handling
│   └── ...
├── services/             # Core services
│   ├── config.service.ts
│   ├── logger.service.ts
│   ├── auth.service.ts
│   └── ...
├── tools/                # MCP tools
│   ├── cloud/           # Tools for Bitbucket Cloud
│   └── datacenter/      # Tools for Data Center
├── server/              # MCP server
│   ├── mcp-server.ts
│   ├── server-manager.ts
│   └── ...
├── cli/                 # CLI client
│   ├── commands/
│   └── cli.ts
└── integration/         # API integration
    ├── api-client.ts
    ├── rate-limiter.ts
    └── ...
```

### Core Components

1. **ConfigService**: Manages configuration and validation
2. **LoggerService**: Structured logging
3. **AuthService**: Multi-method authentication
4. **ServerTypeDetectorService**: Automatic server type detection
5. **BitbucketAPIService**: HTTP client for Bitbucket APIs
6. **MCPServer**: MCP server with selective loading
7. **IntegrationManager**: Integration manager

## 🧪 Testing

```bash
# Run all tests
npm test

# Tests with coverage
npm run test:coverage

# Tests in watch mode
npm run test:watch

# Specific tests
npm test -- --testNamePattern="ConfigService"

# Integration tests
npm run test:integration
```

### Test Coverage

The project maintains high test coverage:
- **Unit Tests**: All services and components
- **Integration Tests**: Complete authentication and operation flows
- **Contract Tests**: MCP API validation
- **E2E Tests**: Complete usage scenarios

## 📚 API Reference

### Services

#### ConfigService
```typescript
class ConfigService {
  loadConfig(): BitbucketConfig
  validateConfig(config: BitbucketConfig): void
  updateConfig(config: Partial<BitbucketConfig>): void
  getConfig(): BitbucketConfig
  resetConfig(): void
}
```

#### LoggerService
```typescript
class LoggerService {
  getLogger(module: string): Logger
  setLogLevel(level: LogLevel): void
  setContext(context: Record<string, any>): void
  createChildLogger(parent: Logger, context: Record<string, any>): Logger
}
```

#### AuthService
```typescript
class AuthService {
  authenticate(config: BitbucketConfig): Promise<AuthResult>
  refreshToken(token: string): Promise<AuthResult>
  validateToken(token: string): Promise<boolean>
}
```

### MCP Tools

#### Authentication Tool
```typescript
{
  name: "authentication",
  description: "Authenticate with Bitbucket",
  inputSchema: {
    type: "object",
    properties: {
      username: { type: "string" },
      password: { type: "string" },
      serverType: { type: "string", enum: ["cloud", "datacenter"] }
    },
    required: ["username", "password"]
  }
}
```

#### Repository Management Tool
```typescript
{
  name: "repository_management",
  description: "Manage Bitbucket repositories",
  inputSchema: {
    type: "object",
    properties: {
      operation: { type: "string", enum: ["list", "get", "create", "update", "delete"] },
      repository: { type: "string" },
      project: { type: "string" },
      workspace: { type: "string" }
    },
    required: ["operation"]
  }
}
```

## 🔧 Development

### Available Scripts

```bash
npm run build          # Compile TypeScript
npm run dev            # Development mode
npm run start          # Start server
npm run test           # Run tests
npm run test:watch     # Tests in watch mode
npm run test:coverage  # Tests with coverage
npm run lint           # Linting
npm run lint:fix       # Fix lint issues
npm run format         # Code formatting
npm run type-check     # Type checking
npm run cli            # Run CLI
```

### Contributing

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

### Code Standards

- **TypeScript**: Strict typing
- **ESLint**: Custom configuration
- **Prettier**: Consistent formatting
- **Jest**: TDD testing
- **Zod**: Schema validation

## 🐛 Troubleshooting

### Common Issues

#### Authentication Error
```
Error: Authentication failed
```
**Solution**: Check your credentials in the `.env` file or configuration.

#### Rate Limit Exceeded
```
Error: Rate limit exceeded
```
**Solution**: The system implements automatic rate limiting. Wait or adjust the settings.

#### Server Not Detected
```
Error: Could not detect server type
```
**Solution**: Check the base URL and connectivity. Manually specify the server type.

#### Connection Timeout
```
Error: Connection timeout
```
**Solution**: Increase timeouts in configuration or check network connectivity.

### Logs

The system generates structured logs at different levels:

```bash
# Debug logs
LOG_LEVEL=debug npm start

# Module-specific logs
LOG_LEVEL=info npm start -- --log-modules=auth,api
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## 🗺️ Roadmap

- [ ] Webhook support
- [ ] Intelligent caching
- [ ] Advanced metrics
- [ ] Multi-instance support
- [ ] Web interface
- [ ] Plugin system

## 🙏 Acknowledgments

- Bitbucket team for the excellent API
- MCP community for the protocol
- Project contributors
