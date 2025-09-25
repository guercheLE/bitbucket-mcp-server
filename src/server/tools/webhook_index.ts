/**
 * Webhook Support Tools Index
 * 
 * Exports all webhook management tools for the MCP server.
 */

// Import all webhook tools
import { createWebhookTool } from './create_webhook.js';
import { listWebhooksTool } from './list_webhooks.js';
import { deleteWebhookTool } from './delete_webhook.js';
import { updateWebhookTool } from './update_webhook.js';
import { validateWebhookEventTool } from './validate_webhook_event.js';
import { testWebhookTool } from './test_webhook.js';

// Export webhook tools array
export const webhookTools = [
  createWebhookTool,
  listWebhooksTool,
  deleteWebhookTool,
  updateWebhookTool,
  validateWebhookEventTool,
  testWebhookTool
];

// Export individual tools
export {
  createWebhookTool,
  listWebhooksTool,
  deleteWebhookTool,
  updateWebhookTool,
  validateWebhookEventTool,
  testWebhookTool
};

// Export execution functions
export { executeCreateWebhook } from './create_webhook.js';
export { executeListWebhooks } from './list_webhooks.js';
export { executeDeleteWebhook } from './delete_webhook.js';
export { executeUpdateWebhook } from './update_webhook.js';
export { executeValidateWebhookEvent } from './validate_webhook_event.js';
export { executeTestWebhook } from './test_webhook.js';