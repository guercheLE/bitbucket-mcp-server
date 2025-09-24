# Feature 005: Issue Tracking

## Overview

The Issue Tracking feature provides comprehensive issue management capabilities for Bitbucket repositories through MCP (Model Context Protocol) tools. This feature enables users to create, manage, and track issues with full lifecycle support, including assignments, comments, relationships, search, and file attachments.

## Features

### Core Issue Operations
- **Issue Creation**: Create new issues with configurable fields, priority, labels, and assignee
- **Issue Listing**: List and discover issues with advanced filtering and search capabilities
- **Issue Details**: Retrieve comprehensive issue information including metadata, comments, and history

### Issue Management
- **Issue Updates**: Update issues with status workflow transitions and field modifications
- **Assignment Management**: Manage issue assignments and ownership with user/group support
- **Comment Management**: Create, edit, and manage issue comments with threading support

### Advanced Features
- **Relationship Management**: Link issues to commits, branches, pull requests, and other issues
- **Advanced Search**: Complex search and filtering with saved searches and export capabilities
- **Attachment Management**: Upload, download, and manage file attachments with security validation

## MCP Tools

### 1. create_issue
Creates new issues in Bitbucket repositories with comprehensive field validation.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `title` (string, required): Issue title (max 200 characters)
- `content` (object, required): Issue content with raw text and markup
- `kind` (string, optional): Issue type (bug, enhancement, proposal, task)
- `priority` (string, optional): Priority level (trivial, minor, major, critical, blocker)
- `assignee` (string, optional): User to assign the issue to
- `labels` (array, optional): Array of labels (max 10)
- `milestone` (string, optional): Milestone to associate
- `component` (string, optional): Component to associate
- `version` (string, optional): Version to associate

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "title": "Fix authentication bug",
  "content": {
    "raw": "Users are experiencing login issues with OAuth",
    "markup": "markdown"
  },
  "kind": "bug",
  "priority": "critical",
  "assignee": "developer1",
  "labels": ["bug", "authentication", "critical"]
}
```

### 2. list_issues
Lists and discovers issues with filtering, search, and pagination capabilities.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `q` (string, optional): Search query for filtering issues
- `state` (string, optional): Filter by issue state
- `kind` (string, optional): Filter by issue type
- `priority` (string, optional): Filter by issue priority
- `assignee` (string, optional): Filter by assigned user
- `labels` (array, optional): Filter by labels
- `sort` (string, optional): Sort field (default: created_on)
- `sort_direction` (string, optional): Sort direction (asc/desc)
- `page` (number, optional): Page number (default: 1)
- `page_size` (number, optional): Issues per page (default: 20)

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "state": "open",
  "priority": "critical",
  "labels": ["bug", "authentication"],
  "sort": "priority",
  "sort_direction": "desc",
  "page": 1,
  "page_size": 20
}
```

### 3. get_issue
Retrieves comprehensive issue information including metadata, comments, attachments, and history.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `issue_id` (string, required): Issue ID or number
- `include_comments` (boolean, optional): Include comments (default: true)
- `include_attachments` (boolean, optional): Include attachments (default: true)
- `include_history` (boolean, optional): Include history (default: true)
- `include_relationships` (boolean, optional): Include relationships (default: true)
- `include_watchers` (boolean, optional): Include watchers (default: false)

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "issue_id": "123",
  "include_comments": true,
  "include_attachments": true,
  "include_history": true,
  "include_relationships": true
}
```

### 4. update_issue
Updates issues with status workflow transitions and field modifications.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `issue_id` (string, required): Issue ID or number
- `title` (string, optional): New issue title
- `content` (object, optional): Updated issue content
- `state` (string, optional): New issue state
- `kind` (string, optional): New issue type
- `priority` (string, optional): New issue priority
- `assignee` (string, optional): New assignee
- `labels` (array, optional): New labels array
- `add_labels` (array, optional): Labels to add
- `remove_labels` (array, optional): Labels to remove
- `comment` (string, optional): Comment explaining changes

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "issue_id": "123",
  "state": "resolved",
  "priority": "minor",
  "comment": "Issue has been resolved in the latest release"
}
```

### 5. manage_issue_assignment
Manages issue assignments and ownership with comprehensive tracking.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `action` (string, required): Action (assign, unassign, reassign, list_assignments, get_assignment_history)
- `issue_id` (string, optional): Issue ID for assignment actions
- `issue_ids` (array, optional): Array of issue IDs for bulk operations
- `assignee` (string, optional): User to assign to
- `assignee_type` (string, optional): Type of assignee (user/group)
- `previous_assignee` (string, optional): Previous assignee for reassignment
- `assignment_reason` (string, optional): Reason for assignment
- `notify_assignee` (boolean, optional): Send notification (default: true)

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "action": "assign",
  "issue_id": "123",
  "assignee": "developer1",
  "assignment_reason": "Expertise in authentication systems",
  "notify_assignee": true
}
```

### 6. manage_issue_comments
Manages issue comments with creation, editing, deletion, and threading support.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `action` (string, required): Action (create, update, delete, list, get, reply)
- `issue_id` (string, required): Issue ID or number
- `comment_id` (string, optional): Comment ID for specific actions
- `content` (object, optional): Comment content
- `parent_comment_id` (string, optional): Parent comment for replies
- `mentions` (array, optional): Array of usernames to mention
- `attachments` (array, optional): Array of attachment IDs
- `is_internal` (boolean, optional): Mark as internal comment

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "action": "create",
  "issue_id": "123",
  "content": {
    "raw": "I can reproduce this issue. The OAuth callback URL is not properly configured.",
    "markup": "markdown"
  },
  "mentions": ["developer1", "developer2"],
  "is_internal": false
}
```

### 7. manage_issue_relationships
Manages issue linking and relationships with commits, branches, pull requests, and other issues.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `action` (string, required): Action (link_commit, link_branch, link_pull_request, link_issue, remove_relationship, list_relationships, get_relationship_history)
- `issue_id` (string, required): Issue ID or number
- `commit_hash` (string, optional): Commit hash for linking
- `branch_name` (string, optional): Branch name for linking
- `pull_request_id` (string, optional): Pull request ID for linking
- `related_issue_id` (string, optional): Related issue ID for linking
- `related_workspace` (string, optional): Workspace of related issue
- `related_repository` (string, optional): Repository of related issue
- `relationship_type` (string, optional): Type of relationship
- `relationship_reason` (string, optional): Reason for relationship

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "action": "link_commit",
  "issue_id": "123",
  "commit_hash": "abc123def456",
  "relationship_reason": "This commit fixes the issue"
}
```

### 8. advanced_issue_search
Advanced issue search and filtering with complex filter combinations and saved searches.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `action` (string, required): Action (search, save_search, load_search, list_saved_searches, delete_saved_search, export_results)
- `search_query` (string, optional): Search query string
- `filters` (object, optional): Complex filter combinations
- `sort` (string, optional): Sort field (default: created_on)
- `sort_direction` (string, optional): Sort direction (asc/desc)
- `page` (number, optional): Page number (default: 1)
- `page_size` (number, optional): Issues per page (default: 20)
- `saved_search_name` (string, optional): Name for saved search
- `export_format` (string, optional): Export format (json, csv, xml, html)

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "action": "search",
  "search_query": "authentication bug",
  "filters": {
    "state": ["open", "new"],
    "priority": ["critical", "blocker"],
    "labels": ["bug", "authentication"],
    "has_comments": true,
    "created_date": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    }
  },
  "sort": "priority",
  "sort_direction": "desc"
}
```

### 9. manage_issue_attachments
Manages issue attachments with upload, download, validation, and security features.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `action` (string, required): Action (upload, download, list, get, delete, update_metadata, get_preview)
- `issue_id` (string, required): Issue ID or number
- `attachment_id` (string, optional): Attachment ID for specific actions
- `file_path` (string, optional): Local file path for upload
- `file_content` (string, optional): File content as base64
- `file_name` (string, optional): File name for upload
- `file_description` (string, optional): Description for attachment
- `allowed_file_types` (array, optional): Allowed file types
- `max_file_size` (number, optional): Maximum file size in bytes
- `download_path` (string, optional): Local path to save downloaded file
- `include_preview` (boolean, optional): Include preview information
- `preview_size` (string, optional): Preview size for images

**Example:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "action": "upload",
  "issue_id": "123",
  "file_name": "error-log.txt",
  "file_content": "dGVzdCBjb250ZW50",
  "file_description": "Error log from OAuth authentication failure",
  "max_file_size": 10485760
}
```

## Security Features

### Access Control
- Repository-level permissions enforcement
- User and group-based access control
- Cross-repository security validation
- Read-only vs. write permissions

### Data Protection
- Input validation and sanitization
- XSS and injection attack prevention
- File upload security scanning
- Malware detection for attachments

### Audit and Compliance
- Comprehensive audit trails
- User action logging
- Data privacy protection
- GDPR compliance features

## Performance Features

### Optimization
- Efficient pagination for large datasets
- Optimized search algorithms
- Caching for frequently accessed data
- Bulk operation support

### Scalability
- Support for large repositories
- Concurrent operation handling
- Rate limiting and abuse prevention
- Performance monitoring

## API Compatibility

### Bitbucket Cloud
- Full support for Bitbucket Cloud API 2.0
- Cloud-specific features and endpoints
- OAuth authentication support
- Webhook integration

### Bitbucket Data Center
- Full support for Bitbucket Data Center API 1.0
- Data Center-specific features
- On-premises deployment support
- Enterprise security features

## Error Handling

### Validation
- Comprehensive parameter validation
- File type and size validation
- Content length and format validation
- Security boundary enforcement

### Recovery
- Graceful error handling
- Network timeout management
- API error recovery
- Data consistency maintenance

## Testing

### Unit Tests
- Comprehensive unit test coverage
- Individual tool testing
- Parameter validation testing
- Error scenario testing

### Integration Tests
- End-to-end workflow testing
- MCP protocol compliance testing
- API integration testing
- Performance testing

### Security Tests
- Access control testing
- Security boundary testing
- Permission validation testing
- Audit trail validation

## Usage Examples

### Basic Issue Creation
```javascript
const result = await createIssueTool.execute({
  workspace: 'my-workspace',
  repository: 'my-repo',
  title: 'Fix login bug',
  content: {
    raw: 'Users cannot log in with OAuth',
    markup: 'markdown'
  },
  kind: 'bug',
  priority: 'critical',
  assignee: 'developer1',
  labels: ['bug', 'authentication', 'critical']
}, context);
```

### Advanced Search
```javascript
const result = await advancedIssueSearchTool.execute({
  workspace: 'my-workspace',
  repository: 'my-repo',
  action: 'search',
  search_query: 'authentication',
  filters: {
    state: ['open', 'new'],
    priority: ['critical', 'blocker'],
    labels: ['bug', 'authentication'],
    has_comments: true
  },
  sort: 'priority',
  sort_direction: 'desc'
}, context);
```

### Issue Relationship Management
```javascript
const result = await manageIssueRelationshipsTool.execute({
  workspace: 'my-workspace',
  repository: 'my-repo',
  action: 'link_commit',
  issue_id: '123',
  commit_hash: 'abc123def456',
  relationship_reason: 'This commit fixes the issue'
}, context);
```

## Dependencies

- **001-mcp-server-infrastructure**: Core MCP server infrastructure
- **002-authentication-system**: Authentication and authorization
- **003-repository-management**: Repository management capabilities

## Future Enhancements

- Real-time issue notifications
- Advanced workflow automation
- Integration with external tools
- Enhanced reporting and analytics
- Mobile app support
- Advanced collaboration features
