# Architecture Documentation

## Overview

The Bitbucket MCP Server is a comprehensive Model Context Protocol (MCP) server designed to provide seamless integration with both Bitbucket Cloud and Data Center. The architecture emphasizes modularity, scalability, and automatic server type detection with selective tool loading.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Client                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 MCP Server                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Server Manager                             ││
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐││
│  │  │ Selective Loader│  │    Health Check & Metrics      │││
│  │  └─────────────────┘  └─────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Integration Layer                              │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐│
│  │ Integration     │  │        API Client                   ││
│  │ Manager         │  │  ┌─────────────┐ ┌─────────────────┐││
│  │                 │  │  │ Rate Limiter│ │ Retry Handler   │││
│  │                 │  │  └─────────────┘ └─────────────────┘││
│  │                 │  │  ┌─────────────┐ ┌─────────────────┐││
│  │                 │  │  │Error Mapper │ │Response Processor│││
│  │                 │  │  └─────────────┘ └─────────────────┘││
│  └─────────────────┘  └─────────────────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Service Layer                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │Config Service│ │Logger Service│ │   Auth Service         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │Server Type  │ │Bitbucket API│ │  Error Handler Service  ││
│  │Detector     │ │   Service   │ │                         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Tool Layer                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              MCP Tools                                  ││
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐││
│  │  │  Cloud Tools    │  │    Data Center Tools           │││
│  │  │                 │  │                                 │││
│  │  │ • Authentication│  │ • Project Management           │││
│  │  │ • Repository    │  │ • Project Permissions         │││
│  │  │ • Pull Request  │  │ • Project Settings            │││
│  │  │ • User          │  │ • Project Hooks               │││
│  │  └─────────────────┘  │ • Project Avatar              │││
│  │                       └─────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. MCP Server (`src/server/`)

The MCP server is the main entry point that handles MCP protocol communication and manages the overall server lifecycle.

#### Key Components:
- **MCPServer**: Core MCP protocol implementation
- **ServerManager**: Manages server lifecycle and operations
- **SelectiveLoader**: Handles selective loading of tools based on server type
- **HealthCheck**: Implements health check endpoints
- **Metrics**: Provides server metrics and monitoring

#### Responsibilities:
- MCP protocol compliance
- Tool registration and management
- Request routing and validation
- Health monitoring
- Metrics collection

### 2. Integration Layer (`src/integration/`)

The integration layer provides a unified interface for interacting with Bitbucket APIs while handling the complexities of different server types.

#### Key Components:
- **IntegrationManager**: Orchestrates integration operations
- **ApiClient**: Generic HTTP client for Bitbucket interactions
- **RateLimiter**: Implements intelligent rate limiting
- **RetryHandler**: Handles automatic retries with exponential backoff
- **ErrorMapper**: Maps and categorizes errors
- **ResponseProcessor**: Processes and normalizes API responses

#### Responsibilities:
- Server type detection
- API request management
- Rate limiting and retry logic
- Error handling and mapping
- Response processing and normalization

### 3. Service Layer (`src/services/`)

The service layer provides core business logic and utilities used throughout the application.

#### Key Components:
- **ConfigService**: Configuration management and validation
- **LoggerService**: Structured logging with context
- **AuthService**: Multi-method authentication handling
- **ServerTypeDetectorService**: Automatic server type detection
- **BitbucketAPIService**: High-level API client
- **ErrorHandlerService**: Advanced error handling

#### Responsibilities:
- Configuration management
- Logging and observability
- Authentication and authorization
- Server type detection
- Error handling and recovery

### 4. Tool Layer (`src/tools/`)

The tool layer implements MCP tools that provide specific functionality for Bitbucket operations.

#### Cloud Tools (`src/tools/cloud/`):
- **Authentication**: OAuth and basic authentication
- **Repository Management**: CRUD operations for repositories
- **Pull Request Workflow**: Complete PR lifecycle management
- **User Management**: User information and operations

#### Data Center Tools (`src/tools/datacenter/`):
- **Project Management**: Complete project lifecycle
- **Project Permissions**: User and group permission management
- **Project Settings**: Configuration management
- **Project Hooks**: Webhook management
- **Project Avatar**: Avatar management

### 5. Type System (`src/types/`)

The type system provides comprehensive TypeScript types and Zod schemas for validation.

#### Key Components:
- **bitbucket.ts**: Core Bitbucket entities
- **config.ts**: Configuration types
- **errors.ts**: Error handling types
- **mcp.ts**: MCP protocol types
- **server-specific.ts**: Server-specific types

## Data Flow

### 1. Request Processing Flow

```
MCP Client Request
        ↓
   MCP Server
        ↓
  Server Manager
        ↓
  Selective Loader
        ↓
   Tool Execution
        ↓
  Integration Manager
        ↓
   API Client
        ↓
  Rate Limiter
        ↓
  Retry Handler
        ↓
  Bitbucket API
        ↓
  Response Processor
        ↓
  Error Mapper
        ↓
   Tool Response
        ↓
   MCP Response
```

### 2. Server Type Detection Flow

```
Initial Request
        ↓
Server Type Detector
        ↓
  API Probe
        ↓
  Response Analysis
        ↓
  Type Determination
        ↓
  Tool Loading
        ↓
  Service Configuration
```

### 3. Error Handling Flow

```
Error Occurrence
        ↓
  Error Mapper
        ↓
  Error Classification
        ↓
  Retry Decision
        ↓
  Error Response
        ↓
  Logging
```

## Design Patterns

### 1. Strategy Pattern

Used for server type detection and tool loading:

```typescript
interface ServerStrategy {
  detectServerType(baseUrl: string): Promise<'cloud' | 'datacenter'>;
  loadTools(): MCPTool[];
  configureServices(config: Config): void;
}
```

### 2. Factory Pattern

Used for creating appropriate integration components:

```typescript
class IntegrationFactory {
  createCloudIntegration(config: Config): BitbucketCloudIntegration;
  createDataCenterIntegration(config: Config): BitbucketDataCenterIntegration;
}
```

### 3. Observer Pattern

Used for health monitoring and metrics:

```typescript
interface HealthObserver {
  onHealthChange(status: HealthStatus): void;
  onMetricUpdate(metric: Metric): void;
}
```

### 4. Chain of Responsibility

Used for request processing pipeline:

```typescript
interface RequestHandler {
  setNext(handler: RequestHandler): void;
  handle(request: Request): Promise<Response>;
}
```

## Configuration Management

### Configuration Hierarchy

1. **Environment Variables**: Highest priority
2. **Configuration File**: Medium priority
3. **Default Values**: Lowest priority

### Configuration Schema

```typescript
interface BitbucketConfig {
  baseUrl: string;
  auth: AuthConfig;
  serverType: 'cloud' | 'datacenter' | 'auto';
  timeouts: TimeoutConfig;
  retry: RetryConfig;
  rateLimit: RateLimitConfig;
  logging: LoggingConfig;
}
```

## Security Considerations

### 1. Authentication

- Support for multiple authentication methods
- Secure credential storage
- Token refresh mechanisms
- Session management

### 2. Authorization

- Role-based access control
- Permission validation
- Resource-level authorization
- Audit logging

### 3. Data Protection

- Input validation and sanitization
- Output encoding
- Secure communication (HTTPS)
- Credential encryption

## Performance Optimizations

### 1. Caching

- Response caching for frequently accessed data
- Configuration caching
- Authentication token caching

### 2. Rate Limiting

- Intelligent rate limiting with burst support
- Adaptive rate limiting based on server response
- Request queuing and prioritization

### 3. Connection Pooling

- HTTP connection reuse
- Connection pool management
- Keep-alive connections

### 4. Lazy Loading

- On-demand tool loading
- Lazy initialization of services
- Dynamic resource allocation

## Monitoring and Observability

### 1. Logging

- Structured logging with context
- Log levels and filtering
- Performance metrics in logs
- Error tracking and reporting

### 2. Metrics

- Request/response metrics
- Error rates and types
- Performance indicators
- Resource utilization

### 3. Health Checks

- Service health monitoring
- Dependency health checks
- Graceful degradation
- Circuit breaker pattern

## Scalability Considerations

### 1. Horizontal Scaling

- Stateless design
- Load balancer compatibility
- Session management
- Resource sharing

### 2. Vertical Scaling

- Memory optimization
- CPU efficiency
- I/O optimization
- Resource monitoring

### 3. Caching Strategy

- Multi-level caching
- Cache invalidation
- Cache warming
- Distributed caching

## Testing Strategy

### 1. Unit Tests

- Component isolation
- Mock dependencies
- Edge case coverage
- Performance testing

### 2. Integration Tests

- End-to-end workflows
- API integration
- Error scenarios
- Performance validation

### 3. Contract Tests

- API contract validation
- Schema validation
- Backward compatibility
- Forward compatibility

## Deployment Architecture

### 1. Container Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
```

### 2. Environment Configuration

- Development environment
- Staging environment
- Production environment
- Environment-specific configurations

### 3. Health Monitoring

- Health check endpoints
- Metrics endpoints
- Log aggregation
- Alert configuration

## Future Enhancements

### 1. Plugin System

- Dynamic tool loading
- Custom tool development
- Plugin management
- Version compatibility

### 2. Advanced Caching

- Redis integration
- Cache warming strategies
- Intelligent invalidation
- Performance optimization

### 3. Web Interface

- Management dashboard
- Configuration UI
- Monitoring interface
- User management

### 4. Multi-Instance Support

- Load balancing
- Session sharing
- Configuration synchronization
- Health coordination
