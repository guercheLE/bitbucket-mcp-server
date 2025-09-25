# MCP Tools Usage Examples

This document provides comprehensive examples of using the authenticated MCP tools in the Bitbucket MCP Server.

## Table of Contents

1. [Overview](#overview)
2. [Search Operations (search-ids)](#search-operations-search-ids)
3. [Get Operation Details (get-id)](#get-operation-details-get-id)
4. [Execute Operations (call-id)](#execute-operations-call-id)
5. [Authentication Context Examples](#authentication-context-examples)
6. [Error Handling Examples](#error-handling-examples)
7. [Complete Workflow Examples](#complete-workflow-examples)
8. [Best Practices](#best-practices)

## Overview

The Bitbucket MCP Server provides three main tools for interacting with Bitbucket APIs:

1. **search-ids**: Semantic search across Bitbucket operations
2. **get-id**: Get detailed information about specific operations
3. **call-id**: Execute Bitbucket API operations

All tools support authentication context and provide user-specific results based on permissions.

## Search Operations (search-ids)

### Basic Search Without Authentication

```typescript
// Search for repository operations without authentication
const searchTool = new SearchIdsTool();

const results = await searchTool.execute({
  query: "list repositories",
  pagination: { page: 1, limit: 10 }
});

console.log('Search results:', results.items.length);
console.log('Total pages:', results.pagination.total_pages);

// Results include basic operation information
results.items.forEach(item => {
  console.log(`Operation: ${item.name}`);
  console.log(`Description: ${item.description}`);
  console.log(`Category: ${item.category}`);
  console.log(`Server Type: ${item.serverType}`);
  console.log(`Authentication Required: ${item.authentication.required}`);
});
```

### Authenticated Search with User Context

```typescript
// Search with user authentication context
const userSession = await getCurrentUserSession(); // Get from session manager

const results = await searchTool.execute({
  query: "create pull request",
  pagination: { page: 1, limit: 5 }
}, userSession);

// Results now include user-specific information
results.items.forEach(item => {
  console.log(`Operation: ${item.name}`);
  console.log(`User can access: ${item.authentication.userCanAccess}`);
  console.log(`Required permissions: ${item.authentication.permissions.join(', ')}`);
  console.log(`User permissions: ${item.authentication.userPermissions?.join(', ')}`);
});
```

### Advanced Search with Filters

```typescript
// Search with specific criteria
const results = await searchTool.execute({
  query: "repository management operations for Data Center",
  pagination: { page: 1, limit: 20 }
}, userSession);

// Filter results by user access
const accessibleOperations = results.items.filter(item => 
  item.authentication.userCanAccess
);

console.log(`Found ${accessibleOperations.length} accessible operations`);
```

### Search Examples by Category

```typescript
// Search for repository operations
const repoResults = await searchTool.execute({
  query: "repository operations",
  pagination: { page: 1, limit: 10 }
}, userSession);

// Search for pull request operations
const prResults = await searchTool.execute({
  query: "pull request management",
  pagination: { page: 1, limit: 10 }
}, userSession);

// Search for user management operations
const userResults = await searchTool.execute({
  query: "user administration",
  pagination: { page: 1, limit: 10 }
}, userSession);

// Search for project operations
const projectResults = await searchTool.execute({
  query: "project management",
  pagination: { page: 1, limit: 10 }
}, userSession);
```

## Get Operation Details (get-id)

### Get Basic Operation Information

```typescript
// Get details for a specific operation
const getIdTool = new GetIdTool();

const details = await getIdTool.execute({
  endpoint_id: "bitbucket.list-repositories"
});

console.log('Operation Details:');
console.log(`Name: ${details.name}`);
console.log(`Description: ${details.description}`);
console.log(`Category: ${details.category}`);
console.log(`Version: ${details.version}`);
console.log(`Server Type: ${details.serverType}`);
console.log(`Parameters: ${details.parameters.join(', ')}`);
console.log(`Authentication Required: ${details.authentication.required}`);
console.log(`Required Permissions: ${details.authentication.permissions.join(', ')}`);
```

### Get Operation Details with User Context

```typescript
// Get details with user authentication context
const userSession = await getCurrentUserSession();

const details = await getIdTool.execute({
  endpoint_id: "bitbucket.create-pull-request"
}, userSession);

console.log('Operation Details with User Context:');
console.log(`Name: ${details.name}`);
console.log(`User Authenticated: ${details.authentication.userAuthenticated}`);
console.log(`User Permissions: ${details.authentication.userPermissions?.join(', ')}`);

// Check if user can access this operation
if (details.authentication.userAuthenticated) {
  const hasRequiredPermissions = details.authentication.permissions.every(
    permission => details.authentication.userPermissions?.includes(permission)
  );
  
  if (hasRequiredPermissions) {
    console.log('✅ User can access this operation');
  } else {
    console.log('❌ User lacks required permissions');
  }
} else {
  console.log('❌ User not authenticated');
}
```

### Get Operation Schema Information

```typescript
// Get detailed schema information
const details = await getIdTool.execute({
  endpoint_id: "bitbucket.list-repositories"
}, userSession);

console.log('Input Schema:');
console.log(JSON.stringify(details.inputSchema, null, 2));

console.log('Output Schema:');
console.log(JSON.stringify(details.outputSchema, null, 2));

console.log('Example Usage:');
console.log(JSON.stringify(details.example, null, 2));
```

## Execute Operations (call-id)

### Basic Operation Execution

```typescript
// Execute a simple operation
const callIdTool = new CallIdTool();

const result = await callIdTool.execute({
  endpoint_id: "bitbucket.list-repositories",
  params: {
    limit: 10
  }
});

console.log('Execution Result:');
console.log(`Success: ${result.success}`);
console.log(`Data: ${JSON.stringify(result.data, null, 2)}`);
console.log(`Execution Time: ${result.metadata.execution_time_ms}ms`);
```

### Authenticated Operation Execution

```typescript
// Execute operation with user authentication
const userSession = await getCurrentUserSession();

const result = await callIdTool.execute({
  endpoint_id: "bitbucket.list-repositories",
  params: {
    projectKey: "MYPROJECT",
    limit: 25
  }
}, userSession);

console.log('Authenticated Execution Result:');
console.log(`Success: ${result.success}`);
console.log(`User Context:`, result.metadata.user_context);
console.log(`Data: ${JSON.stringify(result.data, null, 2)}`);
```

### Repository Operations Examples

```typescript
// List repositories in a project
const listReposResult = await callIdTool.execute({
  endpoint_id: "bitbucket.list-repositories",
  params: {
    projectKey: "MYPROJECT",
    limit: 50
  }
}, userSession);

// Get repository details
const repoDetailsResult = await callIdTool.execute({
  endpoint_id: "bitbucket.get-repository",
  params: {
    projectKey: "MYPROJECT",
    repositorySlug: "my-repo"
  }
}, userSession);

// Create a new repository
const createRepoResult = await callIdTool.execute({
  endpoint_id: "bitbucket.create-repository",
  params: {
    projectKey: "MYPROJECT",
    name: "new-repository",
    description: "A new repository created via MCP",
    isPublic: false
  }
}, userSession);
```

### Pull Request Operations Examples

```typescript
// List pull requests
const listPRsResult = await callIdTool.execute({
  endpoint_id: "bitbucket.list-pull-requests",
  params: {
    projectKey: "MYPROJECT",
    repositorySlug: "my-repo",
    state: "OPEN"
  }
}, userSession);

// Create a pull request
const createPRResult = await callIdTool.execute({
  endpoint_id: "bitbucket.create-pull-request",
  params: {
    projectKey: "MYPROJECT",
    repositorySlug: "my-repo",
    title: "Feature: Add new functionality",
    description: "This PR adds new functionality to the application",
    sourceBranch: "feature/new-feature",
    destinationBranch: "main"
  }
}, userSession);

// Get pull request details
const prDetailsResult = await callIdTool.execute({
  endpoint_id: "bitbucket.get-pull-request",
  params: {
    projectKey: "MYPROJECT",
    repositorySlug: "my-repo",
    pullRequestId: 123
  }
}, userSession);
```

### Project Operations Examples

```typescript
// List projects
const listProjectsResult = await callIdTool.execute({
  endpoint_id: "bitbucket.list-projects",
  params: {
    limit: 20
  }
}, userSession);

// Get project details
const projectDetailsResult = await callIdTool.execute({
  endpoint_id: "bitbucket.get-project",
  params: {
    projectKey: "MYPROJECT"
  }
}, userSession);

// Create a new project
const createProjectResult = await callIdTool.execute({
  endpoint_id: "bitbucket.create-project",
  params: {
    key: "NEWPROJECT",
    name: "New Project",
    description: "A new project created via MCP"
  }
}, userSession);
```

## Authentication Context Examples

### Creating User Session

```typescript
// Create a user session after OAuth authentication
const userSession = await sessionManager.createSession({
  userId: "user123",
  userName: "John Doe",
  userEmail: "john.doe@company.com",
  accessToken: "access_token_here",
  refreshToken: "refresh_token_here",
  permissions: [
    "REPO_READ",
    "REPO_WRITE",
    "PROJECT_READ",
    "PULL_REQUEST_READ",
    "PULL_REQUEST_WRITE"
  ],
  expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour
});

console.log('User Session Created:');
console.log(`User ID: ${userSession.userId}`);
console.log(`User Name: ${userSession.userName}`);
console.log(`Permissions: ${userSession.permissions.join(', ')}`);
console.log(`Session Active: ${userSession.isActive()}`);
```

### Validating User Permissions

```typescript
// Check if user has specific permissions
function checkUserPermissions(userSession: UserSession, requiredPermissions: string[]): boolean {
  const userPermissions = userSession.permissions;
  
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
}

// Example usage
const canCreateRepos = checkUserPermissions(userSession, ['REPO_WRITE']);
const canManageUsers = checkUserPermissions(userSession, ['USER_WRITE', 'ADMIN_WRITE']);

console.log(`Can create repositories: ${canCreateRepos}`);
console.log(`Can manage users: ${canManageUsers}`);
```

### Session Management

```typescript
// Update session activity
await sessionManager.updateLastActivity(userSession.id);

// Check session status
const isActive = userSession.isActive();
const timeUntilExpiry = userSession.expiresAt.getTime() - Date.now();

console.log(`Session active: ${isActive}`);
console.log(`Time until expiry: ${timeUntilExpiry}ms`);

// Refresh session if needed
if (timeUntilExpiry < 300000) { // 5 minutes
  const refreshedSession = await sessionManager.refreshSession(userSession.id);
  console.log('Session refreshed');
}
```

## Error Handling Examples

### Authentication Errors

```typescript
try {
  const result = await callIdTool.execute({
    endpoint_id: "bitbucket.list-repositories",
    params: { projectKey: "MYPROJECT" }
  }); // No user session provided
  
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('Is Recoverable:', error.isRecoverable);
    
    if (error.code === 'SESSION_EXPIRED') {
      // Redirect user to re-authenticate
      console.log('Redirecting to authentication...');
    }
  }
}
```

### Authorization Errors

```typescript
try {
  const result = await callIdTool.execute({
    endpoint_id: "bitbucket.create-repository",
    params: {
      projectKey: "MYPROJECT",
      name: "new-repo"
    }
  }, userSession); // User lacks REPO_WRITE permission
  
} catch (error) {
  if (error instanceof AuthorizationError) {
    console.error('Authorization Error:', error.message);
    console.error('Required Permissions:', error.requiredPermissions);
    console.error('User Permissions:', error.userPermissions);
    
    // Suggest required permissions to user
    const missingPermissions = error.requiredPermissions.filter(
      perm => !error.userPermissions.includes(perm)
    );
    console.log('Missing permissions:', missingPermissions);
  }
}
```

### Operation Errors

```typescript
try {
  const result = await callIdTool.execute({
    endpoint_id: "bitbucket.get-repository",
    params: {
      projectKey: "NONEXISTENT",
      repositorySlug: "nonexistent-repo"
    }
  }, userSession);
  
} catch (error) {
  if (error.message.includes('not found')) {
    console.error('Repository not found');
    // Handle resource not found
  } else if (error.message.includes('permission')) {
    console.error('Permission denied');
    // Handle permission issues
  } else {
    console.error('Unexpected error:', error.message);
    // Handle other errors
  }
}
```

## Complete Workflow Examples

### Repository Management Workflow

```typescript
async function repositoryManagementWorkflow(userSession: UserSession) {
  try {
    // 1. Search for repository operations
    const searchResults = await searchTool.execute({
      query: "repository management operations",
      pagination: { page: 1, limit: 10 }
    }, userSession);
    
    console.log(`Found ${searchResults.items.length} repository operations`);
    
    // 2. Get details for list repositories operation
    const listReposDetails = await getIdTool.execute({
      endpoint_id: "bitbucket.list-repositories"
    }, userSession);
    
    console.log('List repositories operation details:', listReposDetails);
    
    // 3. List repositories in a project
    const repositories = await callIdTool.execute({
      endpoint_id: "bitbucket.list-repositories",
      params: {
        projectKey: "MYPROJECT",
        limit: 50
      }
    }, userSession);
    
    console.log(`Found ${repositories.data?.values?.length || 0} repositories`);
    
    // 4. Get details for each repository
    for (const repo of repositories.data?.values || []) {
      const repoDetails = await callIdTool.execute({
        endpoint_id: "bitbucket.get-repository",
        params: {
          projectKey: repo.project.key,
          repositorySlug: repo.slug
        }
      }, userSession);
      
      console.log(`Repository: ${repoDetails.data.name}`);
      console.log(`Description: ${repoDetails.data.description}`);
      console.log(`Public: ${repoDetails.data.public}`);
    }
    
  } catch (error) {
    console.error('Repository management workflow failed:', error);
  }
}
```

### Pull Request Workflow

```typescript
async function pullRequestWorkflow(userSession: UserSession) {
  try {
    // 1. Search for pull request operations
    const searchResults = await searchTool.execute({
      query: "pull request operations",
      pagination: { page: 1, limit: 5 }
    }, userSession);
    
    // 2. List open pull requests
    const openPRs = await callIdTool.execute({
      endpoint_id: "bitbucket.list-pull-requests",
      params: {
        projectKey: "MYPROJECT",
        repositorySlug: "my-repo",
        state: "OPEN"
      }
    }, userSession);
    
    console.log(`Found ${openPRs.data?.values?.length || 0} open pull requests`);
    
    // 3. Review each pull request
    for (const pr of openPRs.data?.values || []) {
      const prDetails = await callIdTool.execute({
        endpoint_id: "bitbucket.get-pull-request",
        params: {
          projectKey: "MYPROJECT",
          repositorySlug: "my-repo",
          pullRequestId: pr.id
        }
      }, userSession);
      
      console.log(`PR #${pr.id}: ${prDetails.data.title}`);
      console.log(`Author: ${prDetails.data.author.user.displayName}`);
      console.log(`Status: ${prDetails.data.state}`);
      
      // 4. Add comment if needed
      if (prDetails.data.state === 'OPEN' && needsReview(prDetails.data)) {
        await callIdTool.execute({
          endpoint_id: "bitbucket.create-pull-request-comment",
          params: {
            projectKey: "MYPROJECT",
            repositorySlug: "my-repo",
            pullRequestId: pr.id,
            text: "This PR looks good and is ready for review."
          }
        }, userSession);
      }
    }
    
  } catch (error) {
    console.error('Pull request workflow failed:', error);
  }
}
```

### Project Administration Workflow

```typescript
async function projectAdministrationWorkflow(userSession: UserSession) {
  try {
    // Check if user has admin permissions
    const hasAdminPermissions = userSession.permissions.includes('PROJECT_ADMIN');
    
    if (!hasAdminPermissions) {
      throw new AuthorizationError('Admin permissions required for this workflow');
    }
    
    // 1. List all projects
    const projects = await callIdTool.execute({
      endpoint_id: "bitbucket.list-projects",
      params: { limit: 100 }
    }, userSession);
    
    console.log(`Found ${projects.data?.values?.length || 0} projects`);
    
    // 2. Get details for each project
    for (const project of projects.data?.values || []) {
      const projectDetails = await callIdTool.execute({
        endpoint_id: "bitbucket.get-project",
        params: {
          projectKey: project.key
        }
      }, userSession);
      
      console.log(`Project: ${projectDetails.data.name}`);
      console.log(`Key: ${projectDetails.data.key}`);
      console.log(`Description: ${projectDetails.data.description}`);
      
      // 3. Get project permissions
      const permissions = await callIdTool.execute({
        endpoint_id: "bitbucket.get-project-permissions",
        params: {
          projectKey: project.key
        }
      }, userSession);
      
      console.log(`Permissions: ${permissions.data?.length || 0} entries`);
    }
    
  } catch (error) {
    console.error('Project administration workflow failed:', error);
  }
}
```

## Best Practices

### 1. Error Handling

```typescript
// Always wrap tool executions in try-catch blocks
async function safeToolExecution(tool: any, params: any, userSession?: UserSession) {
  try {
    const result = await tool.execute(params, userSession);
    return { success: true, data: result };
  } catch (error) {
    console.error('Tool execution failed:', error);
    return { success: false, error: error.message };
  }
}
```

### 2. Permission Checking

```typescript
// Always check permissions before executing operations
async function executeWithPermissionCheck(
  operation: string,
  params: any,
  userSession: UserSession
) {
  // Check if operation requires authentication
  if (requiresAuthentication(operation) && !userSession) {
    throw new AuthenticationError('Authentication required');
  }
  
  // Check if user has required permissions
  const requiredPermissions = getRequiredPermissions(operation);
  const hasPermissions = requiredPermissions.every(permission =>
    userSession.permissions.includes(permission)
  );
  
  if (!hasPermissions) {
    throw new AuthorizationError('Insufficient permissions');
  }
  
  // Execute operation
  return await callIdTool.execute({
    endpoint_id: operation,
    params
  }, userSession);
}
```

### 3. Session Management

```typescript
// Always validate session before use
async function executeWithSessionValidation(
  operation: string,
  params: any,
  userSession: UserSession
) {
  // Validate session
  if (!userSession.isActive()) {
    throw new AuthenticationError('Session expired');
  }
  
  // Update last activity
  await sessionManager.updateLastActivity(userSession.id);
  
  // Execute operation
  return await callIdTool.execute({
    endpoint_id: operation,
    params
  }, userSession);
}
```

### 4. Pagination Handling

```typescript
// Handle pagination for large result sets
async function getAllRepositories(userSession: UserSession, projectKey: string) {
  const allRepositories = [];
  let start = 0;
  const limit = 50;
  
  while (true) {
    const result = await callIdTool.execute({
      endpoint_id: "bitbucket.list-repositories",
      params: {
        projectKey,
        start,
        limit
      }
    }, userSession);
    
    const repositories = result.data?.values || [];
    allRepositories.push(...repositories);
    
    if (repositories.length < limit) {
      break; // No more results
    }
    
    start += limit;
  }
  
  return allRepositories;
}
```

### 5. Rate Limiting

```typescript
// Implement rate limiting for API calls
class RateLimitedToolExecutor {
  private rateLimiter = new Map<string, number>();
  
  async executeWithRateLimit(
    operation: string,
    params: any,
    userSession: UserSession,
    maxRequestsPerMinute = 60
  ) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${userSession.userId}:${minute}`;
    
    const currentRequests = this.rateLimiter.get(key) || 0;
    
    if (currentRequests >= maxRequestsPerMinute) {
      throw new Error('Rate limit exceeded');
    }
    
    this.rateLimiter.set(key, currentRequests + 1);
    
    return await callIdTool.execute({
      endpoint_id: operation,
      params
    }, userSession);
  }
}
```

## Next Steps

After understanding the MCP tools usage:

1. **Implement the examples** in your application
2. **Customize the workflows** for your specific use cases
3. **Add proper error handling** and logging
4. **Implement rate limiting** and performance monitoring
5. **Test with your Bitbucket instance** and user accounts

For additional help:
- [Authentication Setup Guide](./authentication-setup.md)
- [Authentication Flow Guide](./authentication-flow.md)
- [Environment Configuration Guide](./environment-configuration.md)
- [Troubleshooting Guide](./troubleshooting.md)
