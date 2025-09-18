# Cursor Code Context: Bitbucket MCP Server

**Project**: Comprehensive Bitbucket MCP Server  
**Date**: 2025-01-27  
**Version**: 1.0  

## Project Overview

This is a comprehensive MCP (Model Context Protocol) server for Bitbucket that supports both Data Center (versions 7.16+) and Cloud environments. The server provides complete coverage of 250+ endpoints with selective tool loading, integrated console client with 20-language support, and HTTP request logging with sanitization.

## Architecture Patterns

### MCP Server Structure
```
src/
├── server/           # MCP server implementation
│   ├── index.ts     # Main server entry point
│   └── mcp/         # MCP protocol handlers
├── client/          # Integrated console client
│   ├── cli/         # CLI interface
│   └── commands/    # Command implementations
├── tools/           # MCP tools organized by server type
│   ├── cloud/       # Cloud-specific tools
│   ├── datacenter/  # Data Center-specific tools
│   └── shared/      # Shared tools
├── services/        # Bitbucket API abstraction
└── types/           # TypeScript type definitions
```

### Key Patterns

1. **Selective Tool Loading**: Tools are loaded based on detected server type (Cloud vs Data Center)
2. **Server Type Detection**: Automatic detection from connection parameters
3. **Version-Based Registration**: Tools registered based on server version compatibility
4. **Unified Interface**: Same interface regardless of underlying server type
5. **HTTP Logging**: All requests logged with sensitive data sanitization

## Technology Stack

- **Language**: TypeScript 5.0+
- **Runtime**: Node.js >= 18.0.0
- **MCP SDK**: @modelcontextprotocol/sdk
- **Validation**: Zod schemas
- **HTTP Client**: Axios with retry and circuit breaker
- **CLI**: Commander.js
- **Logging**: Winston with structured logging
- **Testing**: Jest with >80% coverage

## Development Guidelines

### Code Organization (Constitution-compliant)
- Use barrel exports (`index.ts`) for clean imports
- Organize tools by server type and functionality (Article III)
- Implement proper error handling with retry mechanisms
- Use Zod for input validation (integrated with MCP SDK)
- Follow MCP protocol specifications strictly (Article I)
- Support multi-transport protocols (Article II)
- Implement selective tool registration (Article III)

### Testing Strategy (Constitution Article V - NON-NEGOTIABLE)
- TDD mandatory: Tests written → Project Lead approved → Tests fail → Then implement
- Red-Green-Refactor cycle strictly enforced
- Test coverage >80% mandatory (line coverage)
- Test approval gates before implementation
- Contract tests first (RED phase)
- Integration tests with real Bitbucket APIs (Article IV)
- Unit tests for business logic
- End-to-end tests for complete workflows
- Performance tests for response time <2s for 95% of requests
- Logging and observability tests with sanitization

### Error Handling
- Implement exponential backoff with jitter
- Use circuit breaker pattern for resilience
- Sanitize sensitive data in logs
- Provide clear error messages to users
- Follow MCP protocol error handling standards

### Versioning Strategy (Constitution Article VI)
- Semantic versioning (MAJOR.MINOR.PATCH) for all releases
- Breaking changes documented with migration procedures
- Version increment reminders for all changes
- Automatic migration when possible
- Changelog maintenance for each release

### Simplicity Principles (Constitution Article VII)
- Project count limits enforced (max 3 projects per feature)
- YAGNI (You Aren't Gonna Need It) principles applied
- Pattern prohibition examples documented
- Complexity deviations justified in documentation
- Library-first approach emphasized

## Recent Changes

1. **2025-01-27**: Project initialization feature implemented with Constitution compliance
2. **2025-01-27**: Research phase completed with all technical decisions documented
3. **2025-01-27**: Data model defined with 8 core entities and validation schemas
4. **2025-01-27**: API contracts created for project initialization endpoints
5. **2025-01-27**: Quickstart guide created with 12-step validation process
6. **2025-01-27**: Constitution v1.0.0 ratified with 7 core articles
7. **2025-01-27**: Complete API coverage documented (250+ endpoints)
8. **2025-01-27**: MCP Protocol First architecture implemented (Article I)
9. **2025-01-27**: Multi-transport protocol support added (Article II)
10. **2025-01-27**: Selective tool registration system designed (Article III)
11. **2025-01-27**: Complete Bitbucket API coverage planned (Article IV)
12. **2025-01-27**: Test-First development mandated (Article V)
13. **2025-01-27**: Versioning strategy established (Article VI)
14. **2025-01-27**: Simplicity principles defined (Article VII)

## Key Files

- `specs/001-projeto-base-mcp-bitbucket/spec.md`: Complete feature specification
- `specs/001-projeto-base-mcp-bitbucket/plan.md`: Implementation plan with Constitution compliance
- `specs/001-projeto-base-mcp-bitbucket/research.md`: Technical research and decisions
- `specs/001-projeto-base-mcp-bitbucket/data-model.md`: Complete data model definitions
- `specs/001-projeto-base-mcp-bitbucket/contracts/`: OpenAPI schemas for project initialization
- `specs/001-projeto-base-mcp-bitbucket/quickstart.md`: 12-step setup and validation guide

## Development Commands

```bash
# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Run integration tests
npm run test:integration

# Start MCP server
npm start

# Run CLI client
npm run cli
```

## Bitbucket API Coverage (Constitution Article IV)

### Data Center (250+ endpoints)
- Authentication (8 endpoints)
- Project Management (12 endpoints)
- Repository Management (20 endpoints)
- Pull Request Management (18 endpoints)
- System Administration (25+ endpoints)
- Search (10 endpoints)
- Dashboard (12 endpoints)
- Builds and Deployments (15 endpoints)
- Capabilities (5 endpoints)
- Content Security Policy (8 endpoints)
- And more...

### Cloud (250+ endpoints)
- Authentication (5 endpoints)
- Workspace Management (14 endpoints)
- Repository Management (20 endpoints)
- Pull Request Management (18 endpoints)
- Issue Tracking (25 endpoints)
- Pipeline Management (20 endpoints)
- Webhooks (8 endpoints)
- Snippets (12 endpoints)
- SSH/GPG Keys (12 endpoints)
- And more...

## Version Compatibility

- **Data Center**: 7.16+ to 9.6+
- **Cloud**: API v2.0 with 2024-2025 updates
- **64-bit Integer IDs**: Supported for Cloud API (effective August 18, 2025)
- **New Features**: Data Center 9.6+ features included

## Security Considerations

- OAuth 2.0 with PKCE support
- Secure credential management
- Rate limiting with burst protection
- Input validation with Zod
- Automatic retry with exponential backoff
- Sensitive data sanitization in logs
