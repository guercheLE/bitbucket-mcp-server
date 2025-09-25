# Bitbucket MCP Server - Webhook Support

This README provides quick setup and usage information for the Webhook Support feature.

## Quick Start

### Installation

```bash
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run only webhook tests
npm run test:webhook

# Run unit tests
npm run test:unit
```

### Building

```bash
npm run build
```

## Available Webhook Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| `create_webhook` | Create new webhooks | Setting up CI/CD integrations |
| `list_webhooks` | List repository webhooks | Auditing webhook configurations |
| `update_webhook` | Modify existing webhooks | Updating URLs or events |
| `delete_webhook` | Remove webhooks | Cleanup and maintenance |
| `validate_webhook_event` | Validate webhook payloads | Security and integrity checks |
| `test_webhook` | Test webhook endpoints | Pre-deployment testing |

## Common Usage Patterns

### 1. Setting up CI/CD Webhooks

```javascript
// Create a webhook for push events
await createWebhook({
  workspace: "mycompany",
  repository: "my-app",
  url: "https://ci.mycompany.com/webhook",
  events: ["repo:push"],
  description: "CI build trigger"
});
```

### 2. Pull Request Automation

```javascript
// Create webhook for PR events
await createWebhook({
  workspace: "mycompany", 
  repository: "my-app",
  url: "https://automation.mycompany.com/pr-webhook",
  events: [
    "pullrequest:created",
    "pullrequest:updated", 
    "pullrequest:fulfilled"
  ],
  description: "PR automation webhook"
});
```

### 3. Issue Tracking Integration

```javascript
// Create webhook for issue events
await createWebhook({
  workspace: "mycompany",
  repository: "my-app", 
  url: "https://tickets.mycompany.com/bitbucket",
  events: ["issue:created", "issue:updated"],
  description: "Issue tracker sync"
});
```

## Security Best Practices

1. **Always use HTTPS URLs** for webhook endpoints
2. **Validate webhook signatures** using the `validate_webhook_event` tool
3. **Use strong secrets** for signature validation
4. **Test webhooks** before deploying to production
5. **Monitor webhook activity** and rotate secrets regularly

## Troubleshooting

### Common Issues

**Webhook not triggering:**
- Check that the webhook is active
- Verify the URL is accessible from Bitbucket
- Confirm the events are correctly configured

**Signature validation failing:**
- Ensure the secret matches between Bitbucket and your application
- Verify the signature format (should be `sha256=...`)
- Check that the payload is being read correctly

**SSL certificate errors:**
- Ensure your webhook endpoint has a valid SSL certificate
- Use `skip_cert_verification: false` only for testing

### Testing Tools

Use the `test_webhook` tool to verify your endpoint:

```javascript
await testWebhook({
  url: "https://your-app.com/webhook",
  event_type: "repo:push",
  timeout: 10
});
```

## Support

For more detailed documentation, see [webhook-support.md](./webhook-support.md).

For issues or questions, please check the test files for usage examples:
- `tests/unit/tools/create_webhook.test.ts`
- `tests/unit/tools/validate_webhook_event.test.ts`