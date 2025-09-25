/**
 * Create Webhook Tool Tests
 * 
 * Unit tests for the create webhook functionality.
 */

import { executeCreateWebhook } from '../../../src/server/tools/create_webhook.js';

describe('Create Webhook Tool', () => {
  describe('executeCreateWebhook', () => {
    it('should create webhook with valid input', async () => {
      const input = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        url: 'https://example.com/webhook',
        events: ['repo:push', 'pullrequest:created'] as any,
        active: true,
        skip_cert_verification: false,
        description: 'Test webhook'
      };

      const result = await executeCreateWebhook(input);

      expect(result.success).toBe(true);
      expect(result.webhook).toBeDefined();
      expect(result.webhook.url).toBe(input.url);
      expect(result.webhook.events).toEqual(input.events);
      expect(result.webhook.active).toBe(input.active);
      expect(result.webhook.subject.full_name).toBe(`${input.workspace}/${input.repository}`);
      expect(result.webhook.uuid).toMatch(/^\{[0-9a-z-]+\}$/i);
      expect(result.message).toContain('successfully');
    });

    it('should create webhook with minimal input', async () => {
      const input = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        url: 'https://example.com/webhook',
        events: ['repo:push'] as any,
        active: true,
        skip_cert_verification: false
      };

      const result = await executeCreateWebhook(input);

      expect(result.success).toBe(true);
      expect(result.webhook).toBeDefined();
      expect(result.webhook.active).toBe(true); // default value
      expect(result.webhook.events).toEqual(['repo:push']);
    });

    it('should fail with invalid workspace', async () => {
      const input = {
        workspace: '',
        repository: 'test-repo',
        url: 'https://example.com/webhook',
        events: ['repo:push'] as any,
        active: true,
        skip_cert_verification: false
      };

      await expect(executeCreateWebhook(input as any)).rejects.toThrow();
    });

    it('should fail with invalid repository', async () => {
      const input = {
        workspace: 'test-workspace',
        repository: '',
        url: 'https://example.com/webhook',
        events: ['repo:push'] as any,
        active: true,
        skip_cert_verification: false
      };

      await expect(executeCreateWebhook(input as any)).rejects.toThrow();
    });

    it('should fail with invalid URL', async () => {
      const input = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        url: 'not-a-valid-url',
        events: ['repo:push'] as any,
        active: true,
        skip_cert_verification: false
      };

      await expect(executeCreateWebhook(input as any)).rejects.toThrow();
    });

    it('should fail with empty events array', async () => {
      const input = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        url: 'https://example.com/webhook',
        events: [],
        active: true,
        skip_cert_verification: false
      };

      await expect(executeCreateWebhook(input as any)).rejects.toThrow();
    });

    it('should fail with invalid event type', async () => {
      const input = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        url: 'https://example.com/webhook',
        events: ['invalid:event'],
        active: true,
        skip_cert_verification: false
      };

      await expect(executeCreateWebhook(input as any)).rejects.toThrow();
    });

    it('should handle all supported event types', async () => {
      const allEvents = [
        'repo:push',
        'repo:fork',
        'repo:commit_comment_created',
        'repo:commit_status_created',
        'repo:commit_status_updated',
        'issue:created',
        'issue:updated',
        'issue:comment_created',
        'pullrequest:created',
        'pullrequest:updated',
        'pullrequest:approved',
        'pullrequest:unapproved',
        'pullrequest:fulfilled',
        'pullrequest:rejected',
        'pullrequest:comment_created',
        'pullrequest:comment_updated',
        'pullrequest:comment_deleted'
      ];

      const input = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        url: 'https://example.com/webhook',
        events: allEvents as any,
        active: true,
        skip_cert_verification: false
      };

      const result = await executeCreateWebhook(input);

      expect(result.success).toBe(true);
      expect(result.webhook.events).toEqual(allEvents);
    });

    it('should set skip_cert_verification correctly', async () => {
      const input = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        url: 'https://example.com/webhook',
        events: ['repo:push'] as any,
        active: true,
        skip_cert_verification: true
      };

      const result = await executeCreateWebhook(input);

      expect(result.success).toBe(true);
      // Note: In the current implementation, skip_cert_verification is not returned in the response
      // This test validates the input is accepted without errors
    });
  });
});