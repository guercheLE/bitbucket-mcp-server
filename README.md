# Bitbucket MCP Server

[![npm version](https://img.shields.io/npm/v/@guerchele/bitbucket-mcp-server.svg)](https://www.npmjs.com/package/@guerchele/bitbucket-mcp-server)
[![License: LGPL v2.1](https://img.shields.io/badge/License-LGPL%20v2.1-blue.svg)](https://www.gnu.org/licenses/lgpl-2.1.html)
[![Node.js Version](https://img.shields.io/node/v/@guerchele/bitbucket-mcp-server.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/guercheLE/bitbucket-mcp-server)

A comprehensive **Model Context Protocol (MCP) server** that provides AI-powered integration with Bitbucket's extensive API ecosystem. This server enables AI assistants to interact with Bitbucket repositories, pull requests, issues, pipelines, and more through a standardized protocol.

## ✨ Key Highlights

- **🌐 Dual Platform Support**: Works with both Bitbucket Cloud and Bitbucket Server/Data Center
- **🛠️ 75+ Tools**: Comprehensive set of tools covering all major Bitbucket operations
- **🔐 Multiple Authentication Methods**: Support for App Passwords, API Tokens, OAuth 2.0, and more
- **🚀 Flexible Transport**: Both STDIO and HTTP transport modes
- **💻 CLI Interface**: Command-line interface for direct tool interaction
- **⚙️ Configurable Tools**: Enable/disable specific tool categories via environment variables
- **📘 TypeScript**: Built with TypeScript for type safety and better development experience
- **🧪 Comprehensive Testing**: Full test suite with unit, integration, and E2E tests
- **🔒 Security**: Secure token handling and input validation
- **📚 Extensive Documentation**: Complete documentation and guides

## 🚀 Features

### Core Capabilities

- **🌐 Dual Platform Support**: Works with both Bitbucket Cloud and Bitbucket Server/Data Center
- **🛠️ 75+ Tools**: Comprehensive set of tools covering all major Bitbucket operations
- **🔐 Multiple Authentication Methods**: App passwords, API tokens, OAuth 2.0, Repository Access Tokens, Project Access Tokens, Workspace Access Tokens, and SSH
- **🚀 Flexible Transport**: STDIO (default) and HTTP transport modes
- **💻 CLI Interface**: Command-line interface for direct tool access
- **⚙️ Configurable Tools**: Enable/disable specific tool categories via environment variables (feature flags)

### Technical Excellence

- **📘 TypeScript**: Fully typed with comprehensive type definitions and strict type checking
- **🧪 Comprehensive Testing**: Unit, integration, and end-to-end tests with Jest
- **🔒 Security Focused**: Input validation, secure token handling, and security best practices
- **📊 Performance Optimized**: Efficient API calls, connection pooling, and memory management
- **🔄 Error Handling**: Robust error handling and recovery mechanisms

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Usage](#-usage)
- [Features](#-features)
- [Documentation](#-documentation)
- [Development](#️-development)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **Valid Bitbucket Account**: Cloud or Server/Data Center
- **Authentication Credentials**: API token, app password, or OAuth credentials

### Installation

```bash
# Install globally (recommended)
npm install -g @guerchele/bitbucket-mcp-server

# Or use npx (no installation required)
npx @guerchele/bitbucket-mcp-server --help

# Verify installation
bitbucket-mcp-server --version
```

### Basic Configuration

Create a `.env` file with your Bitbucket credentials:

```env
# For Bitbucket Cloud
ATLASSIAN_USER_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token

# For Bitbucket Server/Data Center
BITBUCKET_USERNAME=your-username
BITBUCKET_API_TOKEN=your-api-token
BITBUCKET_BASE_URL=https://your-bitbucket-server.com

# Optional: Transport mode and port
TRANSPORT_MODE=stdio  # or 'http'
PORT=3000
DEBUG=false
```

### Running the Server

```bash
# STDIO mode (default) - for MCP clients
npx @guerchele/bitbucket-mcp-server

# HTTP mode - for web-based clients
TRANSPORT_MODE=http npx @guerchele/bitbucket-mcp-server

# With debug logging
DEBUG=true npx @guerchele/bitbucket-mcp-server

# CLI mode - for direct command execution
npx @guerchele/bitbucket-mcp-server --help
```

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @guerchele/bitbucket-mcp-server
```

### Local Installation

```bash
npm install @guerchele/bitbucket-mcp-server
```

### Using npx (No Installation Required)

```bash
# Run directly without installation
npx @guerchele/bitbucket-mcp-server --help
```

### Docker Installation

```bash
docker pull guerchele/bitbucket-mcp-server:latest
```

## ⚙️ Configuration

The server supports multiple authentication methods and configuration options. See the [Configuration Guide](docs/SETUP_GUIDE.md) for detailed setup instructions.

### Environment Variables

| Variable                 | Description                          | Required    | Default |
| ------------------------ | ------------------------------------ | ----------- | ------- |
| `ATLASSIAN_USER_EMAIL`   | Your Atlassian account email (Cloud) | Cloud only  | -       |
| `ATLASSIAN_API_TOKEN`    | Atlassian API token (Cloud)          | Cloud only  | -       |
| `BITBUCKET_APP_PASSWORD` | Bitbucket app password (Cloud)       | Cloud only  | -       |
| `BITBUCKET_USERNAME`     | Your Bitbucket username (Server)     | Server only | -       |
| `BITBUCKET_API_TOKEN`    | Bitbucket API token (Server)         | Server only | -       |
| `BITBUCKET_BASE_URL`     | Custom Bitbucket server URL          | Server only | -       |
| `TRANSPORT_MODE`         | Transport mode: `stdio` or `http`    | No          | `stdio` |
| `PORT`                   | HTTP server port                     | No          | `3000`  |
| `DEBUG`                  | Enable debug logging                 | No          | `false` |
| `LOG_LEVEL`              | Log level: debug, info, warn, error  | No          | `info`  |

### Tool Configuration

Control which tools are enabled using environment variables:

```env
# Cloud Core Tools (enabled by default)
CLOUD_CORE_AUTH=true
CLOUD_CORE_REPOSITORY=true
CLOUD_CORE_PULL_REQUEST=true
CLOUD_CORE_ISSUE=true
CLOUD_CORE_PIPELINE=true

# Cloud Secondary Tools
CLOUD_SECONDARY_USER=true
CLOUD_SECONDARY_WORKSPACE=true
CLOUD_SECONDARY_SEARCH=true
CLOUD_SECONDARY_DIFF=true
CLOUD_SECONDARY_REF=true
CLOUD_SECONDARY_SOURCE=true
CLOUD_SECONDARY_SNIPPET=true
CLOUD_SECONDARY_SSH=true

# Cloud Advanced Tools
CLOUD_ADVANCED_WEBHOOK=false
CLOUD_ADVANCED_OAUTH=false
CLOUD_ADVANCED_BRANCH_RESTRICTION=false
CLOUD_ADVANCED_TOKEN_MANAGEMENT=false

# Data Center Core Tools
DATACENTER_CORE_AUTH=true
DATACENTER_CORE_REPOSITORY=true
DATACENTER_CORE_PULL_REQUEST=true
DATACENTER_CORE_PROJECT=true

# Data Center Advanced Tools
DATACENTER_ADVANCED_WEBHOOK=false
DATACENTER_ADVANCED_SECURITY=false
DATACENTER_ADVANCED_SAML=false
DATACENTER_ADVANCED_JIRA=false
```

## 🎯 Usage

### MCP Server Mode

The server runs in MCP mode by default, providing tools for AI assistants:

```bash
# Start MCP server (STDIO mode)
npx @guerchele/bitbucket-mcp-server

# Start in HTTP mode
TRANSPORT_MODE=http npx @guerchele/bitbucket-mcp-server

# With debug logging
DEBUG=true npx @guerchele/bitbucket-mcp-server
```

### CLI Mode

Access tools directly via command line:

```bash
# Show available commands
npx @guerchele/bitbucket-mcp-server --help

# List repositories (Cloud)
npx @guerchele/bitbucket-mcp-server repository list --workspace my-workspace

# List repositories (Server/Data Center)
npx @guerchele/bitbucket-mcp-server repository list --project my-project

# Create a pull request (Cloud)
npx @guerchele/bitbucket-mcp-server pull-request create \
  --workspace my-workspace \
  --repository my-repo \
  --title "Feature: Add new functionality" \
  --source-branch feature-branch \
  --destination-branch main

# Create a pull request (Server/Data Center)
npx @guerchele/bitbucket-mcp-server pull-request create \
  --project my-project \
  --repository my-repo \
  --title "Feature: Add new functionality" \
  --source-branch feature-branch \
  --destination-branch main
```

### Programmatic Usage

```typescript
import { startServer } from '@guerchele/bitbucket-mcp-server';

// Start server programmatically
const server = await startServer('stdio');

// Or start in HTTP mode
const httpServer = await startServer('http');
```

## 🔧 Features

### Bitbucket Cloud Tools

- **Authentication**: OAuth 2.0, app passwords, API tokens, Repository/Project/Workspace access tokens
- **Repositories**: Create, read, update, delete repositories with full CRUD operations
- **Pull Requests**: Complete lifecycle management, merge, decline, comments, activities
- **Issues**: Create, update, comment on issues with full issue management
- **Pipelines**: Trigger, monitor, and manage pipelines with variable support
- **Webhooks**: Create and manage webhooks with event filtering
- **Users & Workspaces**: User and workspace management with permissions
- **Search**: Advanced search capabilities for repositories, commits, code, and users
- **Branches & Tags**: Branch and tag management with restrictions
- **Diffs**: File and commit diff viewing and analysis
- **Source**: Source code browsing and file operations
- **Snippets**: Code snippet creation and management
- **SSH**: SSH key management and operations

### Bitbucket Server/Data Center Tools

- **Authentication**: API tokens, personal access tokens, OAuth applications
- **Repositories**: Full repository management with permissions and settings
- **Pull Requests**: Complete pull request lifecycle with comments and activities
- **Projects**: Project creation and management with permissions and settings
- **Security**: Security and permission management with advanced controls
- **System Maintenance**: Administrative operations and system health
- **Jira Integration**: Jira connectivity and issue linking
- **SAML Configuration**: SAML authentication setup and management
- **Dashboard**: Dashboard creation and management
- **Search**: Advanced search with analytics and configuration
- **Builds**: Build management and monitoring
- **Capabilities**: System capabilities and feature detection
- **Mirroring**: Repository mirroring configuration
- **Rolling Upgrades**: System upgrade management

### Advanced Features

- **Multiple Transport Modes**: STDIO and HTTP
- **Configurable Tool Sets**: Enable only needed tools
- **Comprehensive Logging**: Debug and production logging
- **Error Handling**: Robust error handling and recovery
- **Type Safety**: Full TypeScript support

## 📚 Documentation

- [📖 Setup Guide](docs/SETUP_GUIDE.md) - Detailed installation and configuration
- [🖥️ Server Setup Guide](docs/SETUP_GUIDE_SERVER.md) - Server-specific configuration
- [🔐 Authentication Services](docs/AUTHENTICATION_SERVICES.md) - Authentication methods
- [✨ Features](docs/FEATURES.md) - Complete feature overview
- [📋 Project Summary](docs/PROJECT_SUMMARY.md) - Project overview and architecture
- [🧪 Testing](docs/TESTING.md) - Testing guidelines
- [🔧 Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [🔒 Security](docs/SECURITY.md) - Security best practices
- [📝 Contributing](docs/CONTRIBUTING.md) - How to contribute
- [📏 Style Guide](docs/STYLE_GUIDE.md) - Code style and conventions
- [📜 Changelog](docs/CHANGELOG.md) - Version history
- [📢 Release Notes](docs/RELEASE_NOTES.md) - Release information
- [🤝 Code of Conduct](docs/CODE_OF_CONDUCT.md) - Community guidelines

## 🛠️ Development

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **Package Manager**: npm, yarn, or pnpm
- **Git**: For version control
- **TypeScript**: For development (included in devDependencies)

### Setup

```bash
# Clone the repository
git clone https://github.com/guercheLE/bitbucket-mcp-server.git
cd bitbucket-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development server
npm run dev

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Available Scripts

- `npm run build` - Build the project
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run mcp:stdio` - Start MCP server in STDIO mode
- `npm run mcp:http` - Start MCP server in HTTP mode

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details on how to:

- 🐛 Report bugs and issues
- 💡 Suggest new features
- 🔧 Submit pull requests
- 📏 Follow our coding standards
- 🧪 Add tests and documentation

## 📄 License

This project is licensed under the GNU Lesser General Public License v2.1 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the MCP specification
- [Bitbucket API](https://developer.atlassian.com/cloud/bitbucket/) for comprehensive API documentation
- The open-source community for inspiration and feedback

## 📞 Support

- 📖 [Documentation](docs/) - Complete documentation and guides
- 🐛 [Issue Tracker](https://github.com/guercheLE/bitbucket-mcp-server/issues) - Report bugs and request features
- 💬 [Discussions](https://github.com/guercheLE/bitbucket-mcp-server/discussions) - Community discussions and Q&A
- 📧 [Email Support](mailto:guerchele@hotmail.com) - Direct support contact

---

**Made with ❤️ by the Bitbucket MCP Community**

_For questions, suggestions, or support, please don't hesitate to reach out!_
