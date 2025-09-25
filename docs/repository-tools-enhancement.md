# Repository Tools Workspace Enhancement

## Overview

The Repository Tools have been enhanced with full workspace context support while maintaining 100% backward compatibility. This enhancement allows repository operations to be executed within specific workspace contexts, enabling multi-tenant Bitbucket server management through a single MCP server instance.

## Enhanced Tools

### 1. Repository List (`repository_list`)
- **Purpose**: List repositories in a project or across all projects
- **Workspace Support**: Optional workspace context
- **Backward Compatible**: ✅ Yes
- **Parameters**: 
  - `projectKey` (optional): Project key to filter repositories
  - `limit` (optional): Maximum number of repositories to return (default: 25)
  - `start` (optional): Starting index for pagination (default: 0)
  - `name` (optional): Filter repositories by name
  - `workspaceId` (optional): Target workspace ID
  - `workspaceSlug` (optional): Target workspace slug

### 2. Repository Get (`repository_get`)
- **Purpose**: Get details of a specific repository
- **Workspace Support**: Optional workspace context
- **Backward Compatible**: ✅ Yes
- **Parameters**:
  - `projectKey` (required): Project key containing the repository
  - `repositorySlug` (required): Repository slug/name
  - `workspaceId` (optional): Target workspace ID
  - `workspaceSlug` (optional): Target workspace slug

### 3. Repository Create (`repository_create`)
- **Purpose**: Create a new repository
- **Workspace Support**: Optional workspace context
- **Backward Compatible**: ✅ Yes
- **Parameters**:
  - `projectKey` (required): Project key where repository will be created
  - `name` (required): Repository name
  - `description` (optional): Repository description
  - `isPrivate` (optional): Whether repository is private (default: false)
  - `workspaceId` (optional): Target workspace ID
  - `workspaceSlug` (optional): Target workspace slug

### 4. Repository Update (`repository_update`)
- **Purpose**: Update repository settings
- **Workspace Support**: Optional workspace context
- **Backward Compatible**: ✅ Yes
- **Parameters**:
  - `projectKey` (required): Project key containing the repository
  - `repositorySlug` (required): Repository slug/name
  - `name` (optional): New repository name
  - `description` (optional): New repository description
  - `isPrivate` (optional): New privacy setting
  - `workspaceId` (optional): Target workspace ID
  - `workspaceSlug` (optional): Target workspace slug

### 5. Repository Delete (`repository_delete`)
- **Purpose**: Delete a repository
- **Workspace Support**: Optional workspace context
- **Backward Compatible**: ✅ Yes
- **Parameters**:
  - `projectKey` (required): Project key containing the repository
  - `repositorySlug` (required): Repository slug/name to delete
  - `workspaceId` (optional): Target workspace ID
  - `workspaceSlug` (optional): Target workspace slug

## Architecture

### Class: `WorkspaceRepositoryTools`

The main class that provides workspace-aware repository operations.

```typescript
import { WorkspaceRepositoryTools } from '../src/workspace/tools/repository-tools.js';

// Initialize with context manager and integration helper
const repositoryTools = new WorkspaceRepositoryTools(contextManager, integrationHelper);
```

### Key Features

1. **Optional Workspace Context**: All tools work with or without workspace parameters
2. **Parameter Enhancement**: Automatic enhancement of parameters with workspace context
3. **Context Validation**: Optional validation of workspace existence and status
4. **Execution Tracking**: Built-in tracking of tool execution with context information
5. **Schema Registration**: Automatic registration of workspace-aware tool schemas
6. **Backward Compatibility**: Full compatibility with existing tool interfaces

## Usage Examples

### Basic Usage (Backward Compatible)
```typescript
// Works exactly like the original tools
const repositories = await repositoryTools.repositoryList({
    projectKey: 'DEMO',
    limit: 10,
});
```

### Workspace-Aware Usage
```typescript
// Enhanced with workspace context
const repositories = await repositoryTools.repositoryList({
    projectKey: 'DEMO',
    limit: 10,
    workspaceId: 'production', // Targets specific workspace
});
```

### With Explicit Context
```typescript
// Create explicit execution context
const context = await contextManager.createContext('repository_list', 'development');
const repositories = await repositoryTools.repositoryList({
    projectKey: 'DEMO',
    limit: 10,
}, context);
```

### Context Switching
```typescript
// Switch between workspace contexts
const defaultContext = await contextManager.createContext('repository_get');
const repo1 = await repositoryTools.repositoryGet({
    projectKey: 'DEMO',
    repositorySlug: 'repo1',
}, defaultContext);

const stagingContext = await contextManager.switchContext('staging', true);
const repo2 = await repositoryTools.repositoryGet({
    projectKey: 'DEMO',
    repositorySlug: 'repo1', // Same repo, different workspace
}, stagingContext);
```

### Backward Compatible Wrappers
```typescript
// Create wrappers for gradual migration
const wrappers = repositoryTools.createBackwardCompatibleWrappers();

// Original interface (unchanged)
const originalResult = await wrappers.repository_list.original({
    projectKey: 'DEMO',
});

// Enhanced interface (with context)
const context = await contextManager.createContext('repository_list');
const enhancedResult = await wrappers.repository_list.enhanced({
    projectKey: 'DEMO',
}, context);
```

## Integration Patterns

### Pattern 1: Direct Integration
```typescript
// Direct use of enhanced tools
import { WorkspaceRepositoryTools } from '../workspace/tools/index.js';

const tools = new WorkspaceRepositoryTools(contextManager, integrationHelper);
const result = await tools.repositoryList({ projectKey: 'DEMO', workspaceId: 'prod' });
```

### Pattern 2: Schema Registration
```typescript
// Register schemas for validation and discovery
tools.registerAllSchemas();

// Check tool capabilities
const supportsWorkspace = contextManager.supportsWorkspaceContext('repository_list');
const schema = contextManager.getToolSchema('repository_list');
```

### Pattern 3: Wrapper Integration
```typescript
// Use wrappers for existing MCP tool interfaces
const wrappers = tools.createBackwardCompatibleWrappers();

// Register with MCP server (pseudo-code)
mcpServer.registerTool('repository_list', wrappers.repository_list.original);
mcpServer.registerTool('repository_list_enhanced', wrappers.repository_list.enhanced);
```

## Parameter Enhancement

All repository tools automatically enhance parameters with workspace context:

```typescript
// Input parameters
const params = {
    projectKey: 'DEMO',
    workspaceSlug: 'development',
};

// Enhanced parameters (internal)
const enhanced = {
    original: { projectKey: 'DEMO', workspaceSlug: 'development' },
    workspace: {
        id: 'dev-workspace-id',
        slug: 'development',
        config: { /* workspace configuration */ },
    },
    validation: { valid: true, errors: [] },
};
```

## Error Handling

Comprehensive error handling with workspace-specific context:

```typescript
try {
    await repositoryTools.repositoryGet({
        projectKey: 'DEMO',
        repositorySlug: 'repo1',
        workspaceId: 'invalid-workspace',
    });
} catch (error) {
    // Handle workspace-specific errors
    if (error.message.includes('Parameter validation failed')) {
        // Handle validation errors
    }
    // Original tool errors are preserved
}
```

## Migration Strategy

### Phase 1: Optional Enhancement (Current)
- All tools support optional workspace parameters
- Full backward compatibility maintained
- No breaking changes to existing implementations

### Phase 2: Gradual Adoption
- New integrations can use workspace-aware features
- Existing integrations continue to work unchanged
- Monitor usage and performance

### Phase 3: Full Integration
- Encourage adoption of workspace features
- Deprecate non-workspace versions (optional)
- Maintain backward compatibility wrappers

## Performance Considerations

1. **Context Caching**: Execution contexts are cached with TTL
2. **Parameter Validation**: Can be disabled for performance if needed
3. **Workspace Resolution**: Cached workspace configurations
4. **Execution Tracking**: Can be disabled if not required

## Testing

The enhanced repository tools include comprehensive testing support:

```typescript
// Test basic functionality
const result = await tools.repositoryList({ projectKey: 'TEST' });
expect(result.repositories).toBeDefined();

// Test workspace integration
const workspaceResult = await tools.repositoryList({
    projectKey: 'TEST',
    workspaceId: 'test-workspace',
});
expect(workspaceResult.repositories[0].name).toContain('Test Workspace');
```

## Example Implementation

See `examples/repository-tools-demo.ts` for a complete demonstration of all features and usage patterns.

## Next Steps

1. Implement similar enhancements for Project Tools (T011)
2. Enhance Pull Request Tools (T012)  
3. Add User and Search Tools workspace support
4. Create integration testing suite
5. Performance optimization and monitoring

This enhancement provides a solid foundation for workspace-aware repository management while ensuring zero impact on existing implementations.