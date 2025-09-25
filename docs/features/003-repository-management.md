# Feature 003: Repository Management

## Overview

The Repository Management feature provides comprehensive MCP tools for managing Bitbucket repositories, including creation, configuration, permissions, lifecycle operations, branch management, webhook configuration, and integration features. This feature supports both Bitbucket Data Center and Cloud APIs.

## Architecture

### Tool Categories

The repository management tools are organized into three main categories:

1. **Core Operations** - Basic repository CRUD operations
2. **Configuration Management** - Settings, permissions, and lifecycle
3. **Advanced Features** - Branches, webhooks, and integrations

### Tool Registry

All repository management tools are registered under the `repository_management` category and can be imported from `src/server/tools/index.ts`.

## Tools Reference

### Core Operations

#### 1. create_repository
Creates new repositories with configurable settings.

**Parameters:**
- `name` (string, required): Repository name
- `workspace` (string, required): Workspace or project key
- `description` (string, optional): Repository description
- `is_private` (boolean, optional): Repository visibility
- `language` (string, optional): Primary programming language
- `has_issues` (boolean, optional): Enable issue tracking
- `has_wiki` (boolean, optional): Enable wiki functionality

**Example:**
```json
{
  "name": "my-new-repo",
  "workspace": "my-workspace",
  "description": "A new repository for my project",
  "is_private": true,
  "language": "typescript"
}
```

#### 2. list_repositories
Lists and discovers repositories with filtering and search capabilities.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `q` (string, optional): Search query
- `is_private` (boolean, optional): Filter by visibility
- `language` (string, optional): Filter by language
- `has_issues` (boolean, optional): Filter by issue tracking
- `has_wiki` (boolean, optional): Filter by wiki
- `page` (number, optional): Page number for pagination
- `page_size` (number, optional): Items per page

**Example:**
```json
{
  "workspace": "my-workspace",
  "q": "typescript",
  "is_private": false,
  "page": 1,
  "page_size": 20
}
```

#### 3. get_repository
Retrieves comprehensive repository information.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name
- `include_branches` (boolean, optional): Include branch information
- `include_statistics` (boolean, optional): Include repository statistics
- `include_permissions` (boolean, optional): Include permission information

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "include_branches": true,
  "include_statistics": true,
  "include_permissions": true
}
```

### Configuration Management

#### 4. update_repository_settings
Updates repository configuration and settings.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name
- `description` (string, optional): New description
- `is_private` (boolean, optional): New visibility setting
- `language` (string, optional): New primary language
- `has_issues` (boolean, optional): Enable/disable issues
- `has_wiki` (boolean, optional): Enable/disable wiki

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "description": "Updated repository description",
  "language": "javascript"
}
```

#### 5. manage_repository_permissions
Manages user and group access control.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name
- `action` (string, required): Permission action (grant, revoke, list, get)
- `permission_level` (string, optional): Permission level (read, write, admin)
- `user` (string, optional): Target user
- `group` (string, optional): Target group
- `include_inherited` (boolean, optional): Include inherited permissions

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "action": "grant",
  "permission_level": "write",
  "user": "developer@example.com"
}
```

#### 6. repository_lifecycle
Manages repository lifecycle operations.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name
- `action` (string, required): Lifecycle action (delete, archive, restore, status, cleanup)
- `confirmation_token` (string, optional): Confirmation token for destructive actions
- `archive_reason` (string, optional): Reason for archiving
- `dry_run` (boolean, optional): Perform dry run without actual changes

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "action": "archive",
  "confirmation_token": "confirm123",
  "archive_reason": "Project completed"
}
```

### Advanced Features

#### 7. branch_management
Manages repository branches and protection rules.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name
- `action` (string, required): Branch action (list, create, delete, set_default, get_protection, set_protection, compare)
- `branch_name` (string, optional): Branch name for specific operations
- `source_branch` (string, optional): Source branch for creation
- `target_branch` (string, optional): Target branch for comparison
- `protection_rules` (object, optional): Branch protection rules

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "action": "create",
  "branch_name": "feature/new-feature",
  "source_branch": "develop"
}
```

#### 8. webhook_management
Manages repository webhooks and event subscriptions.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name
- `action` (string, required): Webhook action (create, list, get, update, delete, test, get_events)
- `webhook_id` (string, optional): Webhook ID for specific operations
- `url` (string, optional): Webhook URL
- `description` (string, optional): Webhook description
- `events` (array, optional): Array of events to subscribe to
- `active` (boolean, optional): Webhook active status
- `secret` (string, optional): Webhook secret for authentication

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "action": "create",
  "url": "https://example.com/webhook",
  "events": ["repo:push", "pullrequest:created"],
  "active": true
}
```

#### 9. repository_integration
Manages repository integration features.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name
- `action` (string, required): Integration action (clone, mirror, import, backup, restore, sync, get_clone_urls)
- `source_url` (string, optional): Source repository URL
- `source_type` (string, optional): Source repository type
- `mirror_direction` (string, optional): Mirror direction (push, pull, both)
- `backup_format` (string, optional): Backup format
- `include_lfs` (boolean, optional): Include Git LFS files
- `include_submodules` (boolean, optional): Include submodules

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "action": "get_clone_urls"
}
```

## Error Handling

All tools implement comprehensive error handling with standardized error codes:

- `-32602`: Invalid parameters
- `-32603`: Internal error
- `-32000`: Authentication required
- `-32001`: Permission denied
- `-32002`: Resource not found

## Security Features

### Authentication and Authorization
- All tools require valid authentication
- Permission validation for sensitive operations
- Workspace-level access control
- User and group permission management

### Input Validation
- Parameter validation and sanitization
- Repository name format validation
- URL format validation for webhooks
- Confirmation token validation for destructive operations

### Audit Trail
- Comprehensive logging of all operations
- User context tracking
- Permission change auditing
- Security event logging

## Performance Considerations

### Rate Limiting
- Tool-specific rate limits
- Request throttling
- Resource usage monitoring

### Caching
- Repository metadata caching
- Permission cache invalidation
- Branch information caching

### Pagination
- Large result set pagination
- Configurable page sizes
- Efficient data retrieval

## Testing

### Test Coverage
- Unit tests for all tools
- Security and permission tests
- End-to-end integration tests
- Performance and scalability tests

### Test Files
- `tests/unit/repository-management.test.ts` - Unit tests
- `tests/unit/repository-security.test.ts` - Security tests
- `tests/integration/repository-end-to-end.test.ts` - E2E tests

## Usage Examples

### Complete Repository Setup
```typescript
// 1. Create repository
const createResult = await createRepositoryTool.execute({
  name: 'my-project',
  workspace: 'my-workspace',
  description: 'My new project',
  is_private: true,
  language: 'typescript'
}, context);

// 2. Set up permissions
await manageRepositoryPermissionsTool.execute({
  workspace: 'my-workspace',
  repository: 'my-project',
  action: 'grant',
  permission_level: 'write',
  user: 'developer@example.com'
}, context);

// 3. Create feature branch
await branchManagementTool.execute({
  workspace: 'my-workspace',
  repository: 'my-project',
  action: 'create',
  branch_name: 'feature/initial-setup',
  source_branch: 'main'
}, context);

// 4. Set up webhook
await webhookManagementTool.execute({
  workspace: 'my-workspace',
  repository: 'my-project',
  action: 'create',
  url: 'https://ci.example.com/webhook',
  events: ['repo:push', 'pullrequest:created']
}, context);
```

### Repository Cleanup
```typescript
// 1. List repositories
const listResult = await listRepositoriesTool.execute({
  workspace: 'my-workspace',
  q: 'old-project'
}, context);

// 2. Archive old repositories
for (const repo of listResult.data.repositories) {
  await repositoryLifecycleTool.execute({
    workspace: 'my-workspace',
    repository: repo.name,
    action: 'archive',
    confirmation_token: 'cleanup123',
    archive_reason: 'Project deprecated'
  }, context);
}
```

## Migration Guide

### From Manual Operations
1. Replace manual repository creation with `create_repository` tool
2. Use `manage_repository_permissions` for permission management
3. Implement `branch_management` for branch operations
4. Set up `webhook_management` for CI/CD integration

### API Version Compatibility
- Supports Bitbucket Cloud API v2.0
- Supports Bitbucket Data Center API v1.0
- Backward compatibility maintained
- Graceful degradation for unsupported features

## Troubleshooting

### Common Issues

#### Repository Creation Fails
- Verify workspace permissions
- Check repository name format
- Ensure authentication is valid

#### Permission Management Issues
- Validate user/group existence
- Check permission inheritance
- Verify admin privileges

#### Webhook Configuration Problems
- Validate webhook URL accessibility
- Check event subscription format
- Verify webhook secret configuration

### Debug Mode
Enable debug logging by setting the `DEBUG` environment variable:
```bash
DEBUG=repository-management:* npm start
```

## Future Enhancements

### Planned Features
- Repository templates support
- Advanced branch protection rules
- Webhook retry mechanisms
- Repository analytics and insights
- Automated repository provisioning

### API Improvements
- GraphQL support
- Real-time webhook delivery
- Advanced filtering and search
- Bulk operations support

## Support

For issues and questions:
- Check the troubleshooting section
- Review test cases for usage examples
- Consult the API documentation
- Contact the development team

## Changelog

### Version 1.0.0
- Initial implementation of all 9 repository management tools
- Complete test coverage
- Security and permission validation
- End-to-end integration testing
- Comprehensive documentation
