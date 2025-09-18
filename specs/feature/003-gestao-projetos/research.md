# Research: Gestão de Projetos e Repositórios

**Feature**: 003-gestao-projetos  
**Date**: 2025-01-27  
**Status**: Complete

## Research Tasks Executed

### 1. MCP Protocol Implementation for Bitbucket APIs
**Task**: Research MCP protocol implementation patterns for Bitbucket Data Center and Cloud APIs

**Decision**: Implement MCP tools using official @modelcontextprotocol/sdk with Zod schema validation
**Rationale**: 
- Official SDK ensures protocol compliance and client compatibility
- Zod provides runtime type safety and validation
- Schema-first approach aligns with MCP best practices
- Automatic serialization/deserialization reduces boilerplate

**Alternatives considered**:
- Custom MCP implementation: Rejected due to compliance risks
- Manual schema validation: Rejected due to maintenance overhead
- GraphQL over MCP: Rejected as Bitbucket uses REST APIs

### 2. Server Type Detection and Selective Tool Loading
**Task**: Research automatic server type detection and selective tool registration patterns

**Decision**: Implement server detection via `/rest/api/1.0/application-properties` endpoint with fallback to Data Center 7.16
**Rationale**:
- Official endpoint provides reliable server type identification
- Fallback strategy ensures graceful degradation
- Caching with 5-minute TTL optimizes performance
- Health checks every 30 seconds maintain accuracy

**Alternatives considered**:
- Manual configuration: Rejected due to user friction
- Multiple endpoint probing: Rejected due to performance impact
- No fallback: Rejected due to reliability concerns

### 3. Multi-Transport Protocol Support
**Task**: Research multi-transport implementation for stdio, HTTP, SSE, and HTTP streaming

**Decision**: Implement independent transport handlers with automatic fallback
**Rationale**:
- Independent implementations enable better testing and maintenance
- Automatic fallback ensures reliability across different environments
- Transport-specific optimizations possible
- CLI interface with text I/O protocol support

**Alternatives considered**:
- Single transport only: Rejected due to Constitution Article II requirement
- Shared transport logic: Rejected due to complexity and testing challenges

### 4. Test-First Development Strategy
**Task**: Research TDD implementation patterns for MCP tools and Bitbucket API integration

**Decision**: Implement Red-Green-Refactor cycle with contract, integration, and unit tests
**Rationale**:
- Contract tests ensure API compliance and schema validation
- Integration tests verify real Bitbucket API interactions
- Unit tests provide fast feedback and >80% coverage
- Test approval gates prevent implementation without proper testing

**Alternatives considered**:
- Test-after development: Rejected due to Constitution Article V requirement
- Unit tests only: Rejected due to insufficient coverage of API interactions
- Manual testing only: Rejected due to scalability and reliability concerns

### 5. Bitbucket API Coverage Strategy
**Task**: Research complete API coverage for Data Center (7.16+) and Cloud endpoints

**Decision**: Implement all 32 Data Center endpoints (12 Project + 20 Repository) and 34 Cloud endpoints (14 Workspace + 20 Repository)
**Rationale**:
- Complete coverage aligns with Constitution Article IV
- Official Atlassian documentation as single source of truth
- Selective loading based on server type ensures compatibility
- Integration testing with real dependencies validates implementation

**Alternatives considered**:
- Partial API coverage: Rejected due to Constitution requirement
- Mock-only testing: Rejected due to insufficient validation
- Single server type support: Rejected due to market requirements

### 6. Authentication and Security Patterns
**Task**: Research authentication methods and security best practices for Bitbucket APIs

**Decision**: Implement priority-based authentication with OAuth 2.0 → Personal Access Tokens → App Passwords → Basic Auth
**Rationale**:
- Priority order ensures best security practices first
- Automatic method detection with fallback provides reliability
- Sensitive data sanitization in logs prevents information leakage
- Rate limiting and circuit breakers prevent abuse

**Alternatives considered**:
- Single authentication method: Rejected due to compatibility requirements
- No fallback strategy: Rejected due to reliability concerns
- Logging sensitive data: Rejected due to security risks

### 7. Performance and Scalability Patterns
**Task**: Research performance optimization and scalability patterns for MCP servers

**Decision**: Implement caching with 5-minute TTL, rate limiting, and circuit breakers
**Rationale**:
- Caching reduces API calls and improves response times
- Rate limiting prevents API quota exhaustion
- Circuit breakers prevent cascading failures
- Response time <2s for 95% of requests meets SLA requirements

**Alternatives considered**:
- No caching: Rejected due to performance requirements
- Unlimited rate limiting: Rejected due to API quota concerns
- No circuit breakers: Rejected due to reliability requirements

## Resolved NEEDS CLARIFICATION Items

### FR-021: Cache Invalidation Strategy
**Clarification**: Implement TTL-based cache with 5-minute expiration and manual invalidation on write operations
**Rationale**: TTL provides automatic cleanup while manual invalidation ensures data consistency

### FR-022: Rate Limiting Retry Policy
**Clarification**: Implement exponential backoff with max 3 attempts, 1000ms initial delay, factor 2, max 10000ms delay
**Rationale**: Exponential backoff prevents overwhelming the API while providing reasonable retry behavior

### FR-023: Logging Detail and Retention
**Clarification**: Implement structured JSON logs with info level, automatic sensitive data sanitization, daily rotation with 30-day retention
**Rationale**: Structured logs enable better analysis while sanitization protects sensitive information

## Technical Decisions Summary

1. **MCP Implementation**: Official SDK with Zod schemas
2. **Server Detection**: Application properties endpoint with fallback
3. **Transport Support**: Independent handlers with automatic fallback
4. **Testing Strategy**: TDD with contract, integration, and unit tests
5. **API Coverage**: Complete Data Center and Cloud endpoint coverage
6. **Authentication**: Priority-based with automatic fallback
7. **Performance**: Caching, rate limiting, and circuit breakers

## Dependencies Identified

- @modelcontextprotocol/sdk (latest with Zod support)
- zod (^3.23.0) for schema validation
- axios (^1.7.0) for HTTP client
- winston (^3.13.0) for logging
- commander.js (^12.0.0) for CLI
- jest (^29.7.0) for testing

## Risk Mitigation

1. **API Changes**: Use official documentation as source of truth, implement version detection
2. **Authentication Failures**: Implement multiple fallback methods
3. **Performance Issues**: Implement caching and rate limiting
4. **Server Detection Failures**: Implement fallback to Data Center 7.16
5. **Test Coverage**: Enforce >80% coverage with approval gates

---

*Research completed: 2025-01-27*  
*All NEEDS CLARIFICATION items resolved*  
*Ready for Phase 1: Design & Contracts*
