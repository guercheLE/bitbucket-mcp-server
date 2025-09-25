# Webhook Support Feature

The Webhook Support feature provides comprehensive webhook management capabilities for Bitbucket repositories through the MCP (Model Context Protocol) server.

## Overview

This feature enables users to:
- Create, list, update, and delete webhooks for Bitbucket repositories
- Validate webhook events and payloads
- Test webhook endpoints before deployment
- Handle webhook signature validation for security

## Available Tools

### 1. Create Webhook (`create_webhook`)

Creates a new webhook for a Bitbucket repository.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `url` (string, required): Webhook URL that will receive HTTP POST requests
- `events` (array, required): Array of events that trigger the webhook
- `description` (string, optional): Description for the webhook
- `active` (boolean, optional): Whether the webhook is active (default: true)
- `skip_cert_verification` (boolean, optional): Skip SSL certificate verification (default: false)

**Supported Events:**
- `repo:push` - Repository push events
- `repo:fork` - Repository fork events
- `repo:commit_comment_created` - Commit comment creation
- `repo:commit_status_created` - Commit status creation
- `repo:commit_status_updated` - Commit status updates
- `issue:created` - Issue creation
- `issue:updated` - Issue updates
- `issue:comment_created` - Issue comment creation
- `pullrequest:created` - Pull request creation
- `pullrequest:updated` - Pull request updates
- `pullrequest:approved` - Pull request approvals
- `pullrequest:unapproved` - Pull request unapprovals
- `pullrequest:fulfilled` - Pull request merges
- `pullrequest:rejected` - Pull request rejections
- `pullrequest:comment_created` - PR comment creation
- `pullrequest:comment_updated` - PR comment updates
- `pullrequest:comment_deleted` - PR comment deletions

**Example Usage:**
```json
{
  "workspace": "my-workspace",
  "repository": "my-repo",
  "url": "https://example.com/webhook",
  "events": ["repo:push", "pullrequest:created"],
  "description": "CI/CD webhook",
  "active": true
}
```

### 2. List Webhooks (`list_webhooks`)

Lists all webhooks configured for a repository.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `active_only` (boolean, optional): Only return active webhooks (default: false)

### 3. Update Webhook (`update_webhook`)

Updates an existing webhook configuration.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `webhook_uuid` (string, required): UUID of the webhook to update
- `url` (string, optional): New webhook URL
- `description` (string, optional): New description
- `events` (array, optional): New array of trigger events
- `active` (boolean, optional): New active status
- `skip_cert_verification` (boolean, optional): New SSL verification setting

### 4. Delete Webhook (`delete_webhook`)

Deletes a webhook from a repository.

**Parameters:**
- `workspace` (string, required): Workspace or project key
- `repository` (string, required): Repository name or slug
- `webhook_uuid` (string, required): UUID of the webhook to delete

### 5. Validate Webhook Event (`validate_webhook_event`)

Validates webhook events and payloads for security and integrity.

**Parameters:**
- `event_key` (string, required): The webhook event type
- `payload` (object, required): The webhook payload data
- `headers` (object, optional): HTTP headers from the webhook request
- `signature` (string, optional): HMAC signature for payload verification
- `secret` (string, optional): Secret key for signature validation

**Features:**
- Signature validation using HMAC-SHA256
- Payload structure validation
- Event metadata extraction
- Support for all Bitbucket webhook events

### 6. Test Webhook (`test_webhook`)

Tests a webhook endpoint by sending a test payload.

**Parameters:**
- `url` (string, required): Webhook URL to test
- `event_type` (string, optional): Type of event to simulate (default: "repo:push")
- `timeout` (number, optional): Request timeout in seconds (1-30, default: 10)
- `skip_cert_verification` (boolean, optional): Skip SSL certificate verification (default: false)

**Features:**
- Generates realistic test payloads for different event types
- Tests connectivity and response handling
- SSL certificate validation
- Response time measurement

## Security Features

### Signature Validation

The webhook validation tool supports HMAC-SHA256 signature validation:
- Uses the `X-Hub-Signature-256` header format
- Compares signatures using timing-safe comparison
- Prevents replay attacks and ensures payload integrity

### SSL Certificate Verification

All webhook tools support SSL certificate verification:
- Validates SSL certificates by default
- Option to skip verification for testing environments
- Helps ensure secure communication

## Error Handling

All webhook tools include comprehensive error handling:
- Input validation using Zod schemas
- Graceful error responses with descriptive messages
- Type-safe error handling throughout the codebase

## Testing

The feature includes comprehensive test coverage:
- Unit tests for all webhook tools
- Integration tests for workflow scenarios
- Mock implementations for testing without external dependencies
- 18 test cases covering various scenarios and edge cases

## Usage Examples

### Creating a CI/CD Webhook

```json
{
  "tool": "create_webhook",
  "parameters": {
    "workspace": "mycompany",
    "repository": "my-project",
    "url": "https://ci.mycompany.com/bitbucket/webhook",
    "events": ["repo:push", "pullrequest:created", "pullrequest:fulfilled"],
    "description": "CI/CD pipeline webhook",
    "active": true
  }
}
```

### Validating a Push Event

```json
{
  "tool": "validate_webhook_event",
  "parameters": {
    "event_key": "repo:push",
    "payload": {
      "repository": {
        "full_name": "mycompany/my-project"
      },
      "push": {
        "changes": [{
          "new": {
            "name": "main"
          },
          "commits": [{
            "hash": "abc123",
            "message": "Add new feature",
            "author": {
              "user": {
                "display_name": "John Doe"
              }
            }
          }]
        }]
      }
    },
    "signature": "sha256=abcdef123456...",
    "secret": "my-webhook-secret"
  }
}
```

### Testing a Webhook Endpoint

```json
{
  "tool": "test_webhook",
  "parameters": {
    "url": "https://my-app.com/webhook",
    "event_type": "pullrequest:created",
    "timeout": 15
  }
}
```

## Implementation Details

The webhook support feature is built with:
- TypeScript for type safety
- Zod for runtime validation
- MCP SDK for protocol compliance
- Jest for comprehensive testing
- Node.js crypto module for security features

All tools follow the MCP protocol standards and provide consistent error handling and response formats.