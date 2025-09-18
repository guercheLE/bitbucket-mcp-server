# Cursor Context: Bitbucket MCP Server

**Project**: Bitbucket MCP Server  
**Version**: 1.0.0  
**Last Updated**: 2025-01-27

## Project Overview
Servidor MCP (Model Context Protocol) para integração completa com Bitbucket Data Center 7.16+ e Cloud, implementando todas as APIs através de ferramentas MCP padronizadas, com suporte multi-transporte e registro seletivo de ferramentas.

## Architecture
- **Runtime**: Node.js 18+ com TypeScript 5.0+
- **SDK**: @modelcontextprotocol/sdk oficial com Zod schemas
- **Testing**: Jest com TDD obrigatório e cobertura >80%
- **Authentication**: OAuth 2.0, Personal Access Tokens, App Passwords, Basic Auth
- **Transports**: stdio, HTTP, SSE, HTTP streaming
- **Server Detection**: Automática (Data Center/Cloud) com fallback

## Current Feature: Gestão de Pull Requests (004-gestao-pull-requests)

### Scope
Implementação completa de gestão de pull requests incluindo:
- **CRUD Operations**: Create, Read, Update, Delete pull requests
- **Comment Management**: Create, update, delete, thread comments
- **Analysis**: Activities, diffs, changes, statistics
- **Merge Operations**: Merge, decline, reopen with conflict handling
- **Pagination**: Support for up to 1000 items per page
- **Filtering**: By state, author, reviewer, date, branch

### API Coverage
- **Data Center**: 18 endpoints via `/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/*`
- **Cloud**: 18 endpoints via `/2.0/repositories/{workspace}/{repo_slug}/pullrequests/*`
- **Operations**: List, Create, Get, Update, Delete, Merge, Decline, Reopen, Comments, Activities, Diff, Changes

### Key Entities
- **PullRequest**: ID, version, title, description, state, fromRef/toRef, author, reviewers, participants
- **Comment**: ID, version, text, author, parent (for threads), anchor (for code comments)
- **Activity**: ID, action, user, timestamp, comment, fromHash/toHash
- **Change**: contentId, path, type (ADD/MODIFY/DELETE/RENAME/COPY), statistics

## Technology Stack

### Core Dependencies
```json
{
  "@modelcontextprotocol/sdk": "latest",
  "zod": "^3.23.0",
  "axios": "^1.7.0",
  "winston": "^3.13.0",
  "commander": "^12.0.0"
}
```

### Development Dependencies
```json
{
  "typescript": "^5.3.0",
  "jest": "^29.7.0",
  "eslint": "^8.55.0",
  "prettier": "^3.1.0"
}
```

## Project Structure
```
src/
├── server/          # Main MCP server
├── client/          # Console client
├── tools/           # MCP tools by server type
│   ├── cloud/       # Cloud-specific tools
│   ├── datacenter/  # Data Center-specific tools
│   └── shared/      # Shared tools
├── services/        # Business services
├── types/           # TypeScript definitions
└── utils/           # Utilities

tests/
├── contract/        # Contract tests
├── integration/     # Integration tests
└── unit/           # Unit tests
```

## Constitutional Requirements

### Article I: MCP Protocol First
- All functionality through standardized MCP tools
- Official MCP SDK as single source of truth
- Library-first approach in all implementations

### Article II: Multi-Transport Protocol
- Support stdio, HTTP, SSE, HTTP streaming
- Independent and testable transport implementations
- CLI interface with text I/O protocol

### Article III: Selective Tool Registration
- Tools registered based on server type and version
- Automatic server detection with graceful degradation
- Console client commands registered selectively

### Article IV: Complete API Coverage
- All Bitbucket Data Center (7.16+) and Cloud APIs
- Official Atlassian documentation as source of truth
- Integration testing with real dependencies

### Article V: Test-First (NON-NEGOTIABLE)
- TDD mandatory: Tests → Approval → Implementation
- Red-Green-Refactor cycle enforced
- Test coverage >80% mandatory
- Contract, integration, and unit tests for each tool

### Article VI: Versioning
- Semantic versioning (MAJOR.MINOR.PATCH)
- Breaking changes documented with migration procedures
- Version increment reminders for all changes

### Article VII: Simplicity
- Project count limits (max 3 per feature)
- YAGNI principles applied
- Pattern prohibition examples documented

## Performance Targets
- **CRUD Operations**: <500ms (95th percentile)
- **List Operations**: <2s (95th percentile)
- **Diff Operations**: <5s (95th percentile)
- **Merge Operations**: <30s (95th percentile)
- **Uptime**: >99.9%
- **Cache TTL**: 5 minutes for PR metadata

## Security Requirements
- **Data Sanitization**: Automatic sanitization of sensitive data in logs
- **Permission Validation**: Verify access before each operation
- **Rate Limiting**: Per-user/IP rate limiting
- **Audit Trail**: Log all critical operations (merge, delete, etc.)

## Recent Changes
1. **2025-01-27**: Implemented pull request management feature specification
2. **2025-01-27**: Generated complete data model with 7 core entities
3. **2025-01-27**: Created API contracts for CRUD, comments, and analysis operations

## Development Commands
```bash
# Development
npm run dev          # Development mode with hot reload
npm run build        # TypeScript compilation
npm start           # Production server start

# Testing
npm test            # Run all tests
npm run test:unit   # Unit tests only
npm run test:integration # Integration tests only
npm run test:contract # Contract tests only
npm run test:coverage # Tests with coverage report

# Quality
npm run lint        # Code linting
npm run lint:fix    # Fix linting issues
npm run format      # Code formatting
```

## Configuration
```bash
# Server Configuration
BITBUCKET_BASE_URL=https://bitbucket.company.com
BITBUCKET_SERVER_TYPE=datacenter
BITBUCKET_API_VERSION=1.0

# Authentication (Priority Order)
BITBUCKET_OAUTH_CLIENT_ID=your_client_id
BITBUCKET_OAUTH_CLIENT_SECRET=your_client_secret
BITBUCKET_ACCESS_TOKEN=your_access_token
BITBUCKET_USERNAME=your_username
BITBUCKET_APP_PASSWORD=your_app_password

# Performance
CACHE_TTL=300
CACHE_MAX_SIZE=100MB
RATE_LIMIT_WINDOW=900
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

## Error Handling Patterns
- **Circuit Breaker**: Prevent cascading failures
- **Retry Logic**: Exponential backoff for temporary failures
- **Graceful Degradation**: Continue with reduced capabilities
- **Structured Errors**: Consistent error response format
- **Correlation IDs**: Track requests across services

## Testing Strategy
- **Contract Tests**: Validate MCP tool schemas
- **Integration Tests**: Test Bitbucket API communication
- **Unit Tests**: Test business logic in isolation
- **Performance Tests**: Validate response time targets
- **Security Tests**: Validate authentication and authorization

## Common Patterns
- **Server Detection**: Automatic type detection with fallback
- **Tool Registration**: Selective loading based on capabilities
- **Schema Validation**: Zod schemas for all inputs/outputs
- **Logging**: Structured JSON logs with sanitization
- **Caching**: TTL-based caching with invalidation

## Next Steps
1. Implement pull request CRUD tools
2. Implement comment management tools
3. Implement analysis and diff tools
4. Implement merge operation tools
5. Add comprehensive test coverage
6. Performance optimization and monitoring

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*