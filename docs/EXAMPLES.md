# Usage Examples

## Overview

This document provides comprehensive examples of how to use the Bitbucket MCP Server for various scenarios and use cases.

## Basic Setup

### 1. Environment Configuration

```bash
# .env file
BITBUCKET_BASE_URL=https://api.bitbucket.org
BITBUCKET_USERNAME=your_username
BITBUCKET_PASSWORD=your_password
NODE_ENV=development
LOG_LEVEL=info
```

### 2. Programmatic Configuration

```typescript
import { ConfigService } from './src/services/config.service';

const configService = new ConfigService();

// Load configuration
const config = configService.loadConfig();

// Update configuration
configService.updateConfig({
  bitbucket: {
    baseUrl: 'https://your-bitbucket-instance.com',
    auth: {
      type: 'api_token',
      credentials: {
        username: 'your_username',
        token: 'your_api_token'
      }
    }
  }
});
```

## Authentication Examples

### 1. Basic Authentication

```typescript
import { AuthService } from './src/services/auth.service';

const authService = new AuthService();

// Authenticate with username/password
const authResult = await authService.authenticate({
  baseUrl: 'https://api.bitbucket.org',
  auth: {
    type: 'basic',
    credentials: {
      username: 'your_username',
      password: 'your_password'
    }
  }
});

console.log('Access Token:', authResult.accessToken);
```

### 2. API Token Authentication

```typescript
// Using API token
const authResult = await authService.authenticate({
  baseUrl: 'https://api.bitbucket.org',
  auth: {
    type: 'api_token',
    credentials: {
      username: 'your_username',
      token: 'your_api_token'
    }
  }
});
```

### 3. OAuth Authentication

```typescript
// OAuth flow
const authResult = await authService.authenticate({
  baseUrl: 'https://api.bitbucket.org',
  auth: {
    type: 'oauth',
    credentials: {
      accessToken: 'your_oauth_token'
    }
  }
});
```

## Repository Management Examples

### 1. List Repositories

```typescript
import { RepositoryManagementTool } from './src/tools/cloud/repository/repository-management.tool';

const repoTool = new RepositoryManagementTool();

// List all repositories
const result = await repoTool.execute({
  operation: 'list',
  accessToken: 'your_access_token'
});

console.log('Repositories:', result.data);
```

### 2. Get Repository Details

```typescript
// Get specific repository
const result = await repoTool.execute({
  operation: 'get',
  accessToken: 'your_access_token',
  repository: 'my-repo',
  workspace: 'my-workspace'
});

console.log('Repository details:', result.data);
```

### 3. Create Repository

```typescript
// Create new repository
const result = await repoTool.execute({
  operation: 'create',
  accessToken: 'your_access_token',
  workspace: 'my-workspace',
  data: {
    name: 'new-repository',
    description: 'A new repository',
    is_private: true,
    scm: 'git'
  }
});

console.log('Created repository:', result.data);
```

### 4. Update Repository

```typescript
// Update repository
const result = await repoTool.execute({
  operation: 'update',
  accessToken: 'your_access_token',
  repository: 'my-repo',
  workspace: 'my-workspace',
  data: {
    description: 'Updated description',
    is_private: false
  }
});
```

### 5. Delete Repository

```typescript
// Delete repository
const result = await repoTool.execute({
  operation: 'delete',
  accessToken: 'your_access_token',
  repository: 'my-repo',
  workspace: 'my-workspace'
});
```

## Pull Request Examples

### 1. List Pull Requests

```typescript
import { PullRequestWorkflowTool } from './src/tools/cloud/pull-request/pull-request-workflow.tool';

const prTool = new PullRequestWorkflowTool();

// List pull requests
const result = await prTool.execute({
  operation: 'list',
  accessToken: 'your_access_token',
  repository: 'my-repo',
  workspace: 'my-workspace'
});

console.log('Pull requests:', result.data);
```

### 2. Create Pull Request

```typescript
// Create pull request
const result = await prTool.execute({
  operation: 'create',
  accessToken: 'your_access_token',
  repository: 'my-repo',
  workspace: 'my-workspace',
  data: {
    title: 'Add new feature',
    description: 'This PR adds a new feature to the application',
    source: {
      branch: {
        name: 'feature/new-feature'
      }
    },
    destination: {
      branch: {
        name: 'main'
      }
    }
  }
});

console.log('Created PR:', result.data);
```

### 3. Get Pull Request Details

```typescript
// Get specific pull request
const result = await prTool.execute({
  operation: 'get',
  accessToken: 'your_access_token',
  repository: 'my-repo',
  workspace: 'my-workspace',
  pullRequestId: 123
});

console.log('PR details:', result.data);
```

### 4. Update Pull Request

```typescript
// Update pull request
const result = await prTool.execute({
  operation: 'update',
  accessToken: 'your_access_token',
  repository: 'my-repo',
  workspace: 'my-workspace',
  pullRequestId: 123,
  data: {
    title: 'Updated title',
    description: 'Updated description'
  }
});
```

### 5. Merge Pull Request

```typescript
// Merge pull request
const result = await prTool.execute({
  operation: 'merge',
  accessToken: 'your_access_token',
  repository: 'my-repo',
  workspace: 'my-workspace',
  pullRequestId: 123,
  data: {
    merge_strategy: 'merge_commit'
  }
});
```

### 6. Add Comment to Pull Request

```typescript
// Add comment
const result = await prTool.execute({
  operation: 'comment',
  accessToken: 'your_access_token',
  repository: 'my-repo',
  workspace: 'my-workspace',
  pullRequestId: 123,
  data: {
    content: {
      raw: 'This looks good to me!'
    }
  }
});
```

## Data Center Project Examples

### 1. List Projects

```typescript
import { ProjectManagementTool } from './src/tools/datacenter/project/project-management.tool';

const projectTool = new ProjectManagementTool();

// List all projects
const result = await projectTool.execute({
  operation: 'list',
  accessToken: 'your_access_token'
});

console.log('Projects:', result.data);
```

### 2. Create Project

```typescript
// Create new project
const result = await projectTool.execute({
  operation: 'create',
  accessToken: 'your_access_token',
  data: {
    key: 'PROJ',
    name: 'My Project',
    description: 'A new project',
    public: false
  }
});

console.log('Created project:', result.data);
```

### 3. Manage Project Permissions

```typescript
import { ProjectPermissionsTool } from './src/tools/datacenter/project/project-permissions.tool';

const permissionsTool = new ProjectPermissionsTool();

// Add user permission
const result = await permissionsTool.execute({
  operation: 'add',
  accessToken: 'your_access_token',
  projectKey: 'PROJ',
  user: 'john.doe',
  permission: 'PROJECT_WRITE'
});

// Add group permission
const groupResult = await permissionsTool.execute({
  operation: 'add',
  accessToken: 'your_access_token',
  projectKey: 'PROJ',
  group: 'developers',
  permission: 'PROJECT_READ'
});
```

### 4. Configure Project Settings

```typescript
import { ProjectSettingsTool } from './src/tools/datacenter/project/project-settings.tool';

const settingsTool = new ProjectSettingsTool();

// Update project settings
const result = await settingsTool.execute({
  operation: 'update',
  accessToken: 'your_access_token',
  projectKey: 'PROJ',
  settings: {
    defaultBranch: 'main',
    defaultMergeStrategy: 'merge_commit',
    defaultCommitMessage: 'Merge pull request'
  }
});
```

## CLI Usage Examples

### 1. Authentication

```bash
# Login with username/password
npm run cli auth login --username=your_username --password=your_password

# Login with API token
npm run cli auth login --username=your_username --token=your_token

# Check authentication status
npm run cli auth status
```

### 2. Repository Operations

```bash
# List repositories
npm run cli repository list

# Get repository details
npm run cli repository get --name=my-repo --workspace=my-workspace

# Create repository
npm run cli repository create --name=new-repo --workspace=my-workspace --private

# Update repository
npm run cli repository update --name=my-repo --workspace=my-workspace --description="Updated description"

# Delete repository
npm run cli repository delete --name=my-repo --workspace=my-workspace
```

### 3. Pull Request Operations

```bash
# List pull requests
npm run cli pullrequest list --repository=my-repo --workspace=my-workspace

# Create pull request
npm run cli pullrequest create \
  --title="New feature" \
  --source=feature-branch \
  --destination=main \
  --repository=my-repo \
  --workspace=my-workspace

# Get pull request details
npm run cli pullrequest get --id=123 --repository=my-repo --workspace=my-workspace

# Merge pull request
npm run cli pullrequest merge --id=123 --repository=my-repo --workspace=my-workspace

# Add comment
npm run cli pullrequest comment --id=123 --repository=my-repo --workspace=my-workspace --message="Looks good!"
```

### 4. Project Operations (Data Center)

```bash
# List projects
npm run cli project list

# Create project
npm run cli project create --key=PROJ --name="My Project" --description="A new project"

# Get project details
npm run cli project get --key=PROJ

# Update project
npm run cli project update --key=PROJ --name="Updated Project Name"

# Delete project
npm run cli project delete --key=PROJ

# Manage permissions
npm run cli project permissions add --key=PROJ --user=john.doe --permission=PROJECT_WRITE
npm run cli project permissions remove --key=PROJ --user=john.doe --permission=PROJECT_WRITE
```

## Error Handling Examples

### 1. Basic Error Handling

```typescript
import { ErrorHandlerService } from './src/services/error-handler.service';

const errorHandler = new ErrorHandlerService();

try {
  const result = await someOperation();
  return errorHandler.handleSuccess(result);
} catch (error) {
  return errorHandler.handleError(error, 'operation-name');
}
```

### 2. Retry Logic

```typescript
import { RetryHandler } from './src/integration/retry-handler';

const retryHandler = new RetryHandler({
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
});

const result = await retryHandler.executeWithRetry(async () => {
  return await apiCall();
});
```

### 3. Rate Limiting

```typescript
import { RateLimiter } from './src/integration/rate-limiter';

const rateLimiter = new RateLimiter({
  requestsPerMinute: 60,
  burstLimit: 10
});

// Check rate limit before making request
const rateLimitResult = await rateLimiter.checkRateLimit('api-calls');
if (!rateLimitResult.allowed) {
  throw new Error('Rate limit exceeded');
}

// Make API call
const result = await apiCall();
```

## Integration Examples

### 1. Custom Integration

```typescript
import { IntegrationManager } from './src/integration/integration-manager';
import { ApiClient } from './src/integration/api-client';
import { RateLimiter } from './src/integration/rate-limiter';

// Create custom integration
const apiClient = new ApiClient({
  baseUrl: 'https://api.bitbucket.org',
  timeout: 30000
});

const rateLimiter = new RateLimiter({
  requestsPerMinute: 60,
  burstLimit: 10
});

const integrationManager = new IntegrationManager({
  apiClient,
  rateLimiter
});

// Use integration
const result = await integrationManager.executeRequest({
  method: 'GET',
  endpoint: '/repositories',
  headers: {
    'Authorization': 'Bearer your_token'
  }
});
```

### 2. Server Type Detection

```typescript
import { ServerTypeDetectorService } from './src/services/server-type-detector.service';

const detector = new ServerTypeDetectorService();

// Detect server type
const serverType = await detector.detectServerType('https://api.bitbucket.org');
console.log('Server type:', serverType); // 'cloud' or 'datacenter'

// Configure based on server type
if (serverType === 'cloud') {
  // Configure for Cloud
} else {
  // Configure for Data Center
}
```

## Advanced Examples

### 1. Batch Operations

```typescript
// Batch create repositories
const repositories = [
  { name: 'repo1', description: 'Repository 1' },
  { name: 'repo2', description: 'Repository 2' },
  { name: 'repo3', description: 'Repository 3' }
];

const results = await Promise.all(
  repositories.map(repo => 
    repoTool.execute({
      operation: 'create',
      accessToken: 'your_access_token',
      workspace: 'my-workspace',
      data: repo
    })
  )
);

console.log('Created repositories:', results);
```

### 2. Webhook Integration

```typescript
// Set up webhook for repository events
const webhookResult = await repoTool.execute({
  operation: 'create_webhook',
  accessToken: 'your_access_token',
  repository: 'my-repo',
  workspace: 'my-workspace',
  data: {
    description: 'Repository webhook',
    url: 'https://your-app.com/webhook',
    events: ['repo:push', 'pullrequest:created', 'pullrequest:updated']
  }
});
```

### 3. Custom Tool Implementation

```typescript
import { MCPTool } from './src/types/mcp';

class CustomTool implements MCPTool {
  name = 'custom_tool';
  description = 'Custom tool for specific operations';

  inputSchema = {
    type: 'object',
    properties: {
      operation: { type: 'string' },
      data: { type: 'object' }
    },
    required: ['operation']
  };

  async execute(args: any): Promise<any> {
    const { operation, data } = args;

    switch (operation) {
      case 'custom_operation':
        return await this.customOperation(data);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  private async customOperation(data: any): Promise<any> {
    // Custom implementation
    return { success: true, data };
  }
}
```

## Testing Examples

### 1. Unit Test Example

```typescript
import { ConfigService } from '../src/services/config.service';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
  });

  it('should load configuration from environment', () => {
    process.env.BITBUCKET_BASE_URL = 'https://api.bitbucket.org';
    
    const config = configService.loadConfig();
    
    expect(config.bitbucket.baseUrl).toBe('https://api.bitbucket.org');
  });
});
```

### 2. Integration Test Example

```typescript
import { RepositoryManagementTool } from '../src/tools/cloud/repository/repository-management.tool';

describe('Repository Management Integration', () => {
  let repoTool: RepositoryManagementTool;

  beforeEach(() => {
    repoTool = new RepositoryManagementTool();
  });

  it('should create and delete repository', async () => {
    // Create repository
    const createResult = await repoTool.execute({
      operation: 'create',
      accessToken: process.env.TEST_ACCESS_TOKEN!,
      workspace: 'test-workspace',
      data: {
        name: 'test-repo',
        description: 'Test repository'
      }
    });

    expect(createResult.success).toBe(true);

    // Delete repository
    const deleteResult = await repoTool.execute({
      operation: 'delete',
      accessToken: process.env.TEST_ACCESS_TOKEN!,
      repository: 'test-repo',
      workspace: 'test-workspace'
    });

    expect(deleteResult.success).toBe(true);
  });
});
```

## Performance Optimization Examples

### 1. Connection Pooling

```typescript
import { ApiClient } from './src/integration/api-client';

const apiClient = new ApiClient({
  baseUrl: 'https://api.bitbucket.org',
  timeout: 30000,
  // Connection pooling is handled automatically
});

// Multiple concurrent requests will reuse connections
const promises = Array.from({ length: 10 }, (_, i) => 
  apiClient.get(`/repositories?page=${i}`)
);

const results = await Promise.all(promises);
```

### 2. Caching

```typescript
import { CacheService } from './src/services/cache.service';

const cacheService = new CacheService();

// Cache repository data
const cacheKey = 'repositories:my-workspace';
let repositories = await cacheService.get(cacheKey);

if (!repositories) {
  repositories = await repoTool.execute({
    operation: 'list',
    accessToken: 'your_access_token',
    workspace: 'my-workspace'
  });
  
  // Cache for 5 minutes
  await cacheService.set(cacheKey, repositories, 300);
}
```

## Monitoring Examples

### 1. Health Check

```typescript
import { HealthCheckService } from './src/services/health-check.service';

const healthCheck = new HealthCheckService();

// Check system health
const health = await healthCheck.checkHealth();
console.log('System health:', health);

// Custom health check
healthCheck.addCheck('custom-check', async () => {
  // Custom health check logic
  return { status: 'healthy', details: 'Custom check passed' };
});
```

### 2. Metrics Collection

```typescript
import { MetricsService } from './src/services/metrics.service';

const metrics = new MetricsService();

// Record metrics
metrics.incrementCounter('api.requests', { endpoint: '/repositories' });
metrics.recordHistogram('api.response_time', 150, { endpoint: '/repositories' });

// Get metrics
const apiMetrics = metrics.getMetrics('api.*');
console.log('API metrics:', apiMetrics);
```

These examples demonstrate the comprehensive capabilities of the Bitbucket MCP Server and provide practical guidance for implementing various use cases.
