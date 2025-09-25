# Workspace Integration Analysis for Bitbucket MCP Tools

**Document Version**: 1.0  
**Last Updated**: September 25, 2025  
**Author**: MCP Server Development Team  
**Status**: Phase 2 - Workspace-Aware MCP Tools  

## Executive Summary

This document provides a comprehensive analysis of existing Bitbucket MCP tools and their integration requirements for multi-workspace support. The analysis identifies 28 existing MCP tools across 7 categories that require workspace context integration while maintaining backward compatibility.

### Key Findings

- **28 MCP Tools** require workspace context integration
- **7 Tool Categories** need workspace parameter support
- **Backward Compatibility** can be maintained through optional workspace parameters
- **Authentication Context** requires workspace-scoped credential management
- **Progressive Enhancement** approach recommended for implementation

## Current Tool Inventory

### 1. Repository Management Tools (5 tools)
**Impact Level**: Critical - All repository operations are workspace-scoped

| Tool Name | Current Parameters | Workspace Integration Need | Priority |
|-----------|-------------------|---------------------------|----------|
| `repository_list` | projectKey, limit, start, name | Add `workspaceId` parameter | Critical |
| `repository_get` | projectKey, repositorySlug | Add `workspaceId` parameter | Critical |
| `repository_create` | projectKey, name, description, isPrivate | Add `workspaceId` parameter | Critical |
| `repository_update` | projectKey, repositorySlug, name, description | Add `workspaceId` parameter | Critical |
| `repository_delete` | projectKey, repositorySlug | Add `workspaceId` parameter | Critical |

**Integration Strategy**:
- Add optional `workspaceId` parameter to all repository tools
- Maintain backward compatibility by using default workspace when not specified
- Update authentication context to use workspace-specific credentials
- Modify API base URL resolution to use workspace-specific endpoints

**Example Enhanced Tool Schema**:
```typescript
{
  name: 'repository_list',
  parameters: [
    {
      name: 'workspaceId',
      type: 'string',
      required: false,
      description: 'Workspace ID for multi-workspace operations. Uses default workspace if not specified.'
    },
    // ... existing parameters
  ]
}
```

### 2. Project Management Tools (5 tools)
**Impact Level**: Critical - Projects are workspace-specific entities

| Tool Name | Current Parameters | Workspace Integration Need | Priority |
|-----------|-------------------|---------------------------|----------|
| `project_list` | limit, start, name, permission | Add `workspaceId` parameter | Critical |
| `project_get` | projectKey | Add `workspaceId` parameter | Critical |
| `project_create` | key, name, description, isPrivate | Add `workspaceId` parameter | Critical |
| `project_update` | projectKey, name, description | Add `workspaceId` parameter | Critical |
| `project_delete` | projectKey | Add `workspaceId` parameter | Critical |

**Integration Strategy**:
- Similar approach to repository tools
- Project keys may need workspace prefixing for uniqueness
- Workspace-scoped project permissions validation

### 3. Pull Request Management Tools (6 tools)
**Impact Level**: Critical - Pull requests are repository-scoped within workspaces

| Tool Name | Current Parameters | Workspace Integration Need | Priority |
|-----------|-------------------|---------------------------|----------|
| `pullrequest_list` | projectKey, repositorySlug, state, limit, start | Add `workspaceId` parameter | Critical |
| `pullrequest_get` | projectKey, repositorySlug, pullRequestId | Add `workspaceId` parameter | Critical |
| `pullrequest_create` | projectKey, repositorySlug, title, description, fromRef, toRef | Add `workspaceId` parameter | Critical |
| `pullrequest_update` | projectKey, repositorySlug, pullRequestId, title, description | Add `workspaceId` parameter | Critical |
| `pullrequest_merge` | projectKey, repositorySlug, pullRequestId, version | Add `workspaceId` parameter | Critical |
| `pullrequest_decline` | projectKey, repositorySlug, pullRequestId, version | Add `workspaceId` parameter | Critical |

### 4. User Management Tools (2 tools)
**Impact Level**: Medium - User queries may be workspace-scoped

| Tool Name | Current Parameters | Workspace Integration Need | Priority |
|-----------|-------------------|---------------------------|----------|
| `user_info` | userSlug | Add `workspaceId` parameter for context | Medium |
| `user_list` | filter, limit, start | Add `workspaceId` parameter for scoping | Medium |

**Integration Strategy**:
- User information may be consistent across workspaces
- Workspace parameter useful for permission context
- Consider user-workspace relationship mapping

### 5. OAuth Application Tools (5 tools)
**Impact Level**: High - OAuth apps may be workspace-specific

| Tool Name | Current Parameters | Workspace Integration Need | Priority |
|-----------|-------------------|---------------------------|----------|
| `oauth_application_create` | name, description, callbackUrl, permissions | Add `workspaceId` parameter | High |
| `oauth_application_get` | clientId | Add `workspaceId` parameter | High |
| `oauth_application_update` | clientId, name, description, callbackUrl | Add `workspaceId` parameter | High |
| `oauth_application_delete` | clientId | Add `workspaceId` parameter | High |
| `oauth_application_list` | limit, start | Add `workspaceId` parameter | High |

### 6. Session Management Tools (5 tools)
**Impact Level**: Critical - Sessions must be workspace-aware

| Tool Name | Current Parameters | Workspace Integration Need | Priority |
|-----------|-------------------|---------------------------|----------|
| `session_create` | username, password, scope | Add `workspaceId` parameter | Critical |
| `session_get` | sessionToken | Workspace context from token | Critical |
| `session_refresh` | refreshToken | Workspace context from token | Critical |
| `session_revoke` | sessionToken | Workspace context from token | Critical |
| `session_list` | limit, start | Add `workspaceId` parameter for scoping | High |

### 7. Search Tools (5 tools)
**Impact Level**: High - Search operations should support workspace scoping

| Tool Name | Current Parameters | Workspace Integration Need | Priority |
|-----------|-------------------|---------------------------|----------|
| `search_repositories` | query, limit, start | Add `workspaceId` parameter | High |
| `search_commits` | query, repository, limit, start | Add `workspaceId` parameter | High |
| `search_pullrequests` | query, state, limit, start | Add `workspaceId` parameter | High |
| `search_code` | query, repository, limit, start | Add `workspaceId` parameter | High |
| `search_users` | query, limit, start | Add `workspaceId` parameter | Medium |

## Integration Requirements

### 1. Parameter Schema Enhancement

**Standard Workspace Parameter**:
```typescript
{
  name: 'workspaceId',
  type: 'string',
  required: false,
  description: 'Workspace identifier for multi-workspace operations. If not provided, uses the default workspace or requires workspace selection.',
  validation: {
    pattern: '^[a-zA-Z0-9-_]{3,64}$',
    errorMessage: 'Workspace ID must be 3-64 characters, containing only letters, numbers, hyphens, and underscores'
  }
}
```

**Cross-Workspace Parameter** (for advanced tools):
```typescript
{
  name: 'workspaceIds',
  type: 'array',
  items: { type: 'string' },
  required: false,
  description: 'Array of workspace identifiers for cross-workspace operations',
  maxItems: 10
}
```

### 2. Authentication Context Integration

**Current Authentication Flow**:
```typescript
authentication: {
  required: true,
  permissions: ['REPO_READ']
}
```

**Enhanced Authentication Flow**:
```typescript
authentication: {
  required: true,
  permissions: ['REPO_READ'],
  workspaceScoped: true,
  contextResolution: 'auto' // auto, explicit, inherited
}
```

### 3. Tool Execution Context Enhancement

**Current Execution Context**:
```typescript
interface ToolExecutionContext {
  sessionId?: string;
  userId?: string;
  permissions?: string[];
  authToken?: string;
}
```

**Enhanced Execution Context**:
```typescript
interface WorkspaceAwareToolExecutionContext extends ToolExecutionContext {
  workspaceId?: string;
  workspaceContext?: WorkspaceContext;
  isMultiWorkspace?: boolean;
  crossWorkspaceContexts?: CrossWorkspaceContext;
  defaultWorkspaceId?: string;
}
```

## Backward Compatibility Strategy

### 1. Parameter Compatibility
- All workspace parameters are optional
- Tools function normally when workspace parameters are omitted
- Default workspace behavior maintained for existing clients
- Graceful degradation for unsupported workspace operations

### 2. Response Format Compatibility
- Existing response structures unchanged
- Additional workspace metadata added as optional fields
- Workspace information included in metadata section

### 3. Error Handling Compatibility
- Existing error codes and messages preserved
- New workspace-specific errors use dedicated error codes
- Clear error messages for workspace-related issues

**Enhanced Response Format**:
```typescript
interface WorkspaceAwareToolResult extends ToolResult {
  workspaceMetadata?: {
    workspaceId: string;
    workspaceName: string;
    isDefaultWorkspace: boolean;
    multiWorkspaceOperation?: boolean;
    affectedWorkspaces?: string[];
  };
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (Completed)
- ✅ Workspace management system
- ✅ Workspace context provider
- ✅ Authentication management
- ✅ Configuration management

### Phase 2: Tool Enhancement (Current Phase)
**Week 1: Foundation**
- Create workspace context integration framework
- Implement parameter schema enhancements
- Develop authentication context resolution

**Week 2: Tool Migration**
- Enhance repository management tools (5 tools)
- Enhance project management tools (5 tools)
- Implement comprehensive testing

**Week 3: Extended Tool Support**
- Enhance pull request management tools (6 tools)
- Enhance session management tools (5 tools)
- Update search tools (5 tools)

**Week 4: Integration & Testing**
- Complete OAuth application tools (5 tools)
- Finalize user management tools (2 tools)
- Comprehensive integration testing

### Phase 3: Cross-Workspace Operations
- Cross-workspace search capabilities
- Multi-workspace analytics
- Bulk operations across workspaces

### Phase 4: Advanced Features
- Workspace templates
- Migration tools
- Advanced security features

## Risk Assessment

### High Risk Items
1. **Authentication Complexity**: Managing credentials across multiple workspaces
   - **Mitigation**: Implement secure credential storage with workspace isolation
   
2. **Performance Impact**: Additional workspace resolution overhead
   - **Mitigation**: Implement workspace context caching and connection pooling

3. **Backward Compatibility**: Ensuring existing tools continue to function
   - **Mitigation**: Comprehensive testing with existing tool configurations

### Medium Risk Items
1. **Parameter Validation**: Complex workspace parameter validation
   - **Mitigation**: Use Zod schemas for consistent validation

2. **Error Handling**: Managing workspace-specific error scenarios
   - **Mitigation**: Standardized error handling with clear error codes

### Low Risk Items
1. **Documentation Updates**: Updating tool documentation
2. **Configuration Migration**: Updating existing configurations

## Success Metrics

### Technical Metrics
- **100% Tool Coverage**: All 28 tools support workspace context
- **0 Breaking Changes**: Maintain complete backward compatibility
- **<100ms Overhead**: Workspace resolution overhead under 100ms
- **>95% Test Coverage**: Comprehensive test coverage for workspace features

### Functional Metrics
- **Seamless Migration**: Existing configurations work without changes
- **Clear Error Messages**: Workspace-related errors are clear and actionable
- **Performance Maintenance**: No performance degradation for single-workspace operations

## Next Steps

1. **Immediate (This Sprint)**:
   - Implement workspace context integration framework
   - Begin repository tool enhancements
   - Create comprehensive test suite

2. **Short-term (Next 2 Weeks)**:
   - Complete all tool enhancements
   - Implement cross-workspace parameter support
   - Performance optimization and caching

3. **Medium-term (Next Month)**:
   - Cross-workspace operation capabilities
   - Advanced workspace management features
   - Security audit and performance optimization

## Conclusion

The integration of workspace context into existing MCP tools requires careful planning and implementation to maintain backward compatibility while providing powerful multi-workspace capabilities. The progressive enhancement approach ensures a smooth transition path while delivering immediate value to users requiring multi-workspace functionality.

The analysis reveals that all 28 existing tools can be enhanced with workspace context support through optional parameter addition, maintaining full backward compatibility while enabling powerful multi-workspace operations.