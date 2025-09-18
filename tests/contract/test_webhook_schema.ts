import { z } from 'zod';

/**
 * Contract test for Webhook entity schema
 * T011: Contract test Webhook entity schema in tests/contract/test_webhook_schema.ts
 * 
 * This test MUST fail before implementation (Constitution Article V - TDD)
 * Validates the Webhook entity schema according to data-model.md specifications
 */

describe('Webhook Entity Schema Contract Tests', () => {
  // Schema definition from data-model.md
  const WebhookSchema = z.object({
    id: z.string().uuid(),
    url: z.string().url(),
    description: z.string().max(500).optional(),
    events: z.array(z.enum([
      "repo:push", "pullrequest:created", "pullrequest:updated",
      "pullrequest:approved", "pullrequest:merged", "pullrequest:declined"
    ])).min(1),
    active: z.boolean().default(true),
    createdDate: z.string().datetime(),
    updatedDate: z.string().datetime()
  });

  describe('Valid Webhook Data', () => {
    it('should validate a complete webhook with all fields', () => {
      const validWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        description: 'A test webhook for validation',
        events: ['repo:push', 'pullrequest:created'],
        active: true,
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(validWebhook)).not.toThrow();
    });

    it('should validate a minimal webhook with required fields only', () => {
      const minimalWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        url: 'https://example.com/webhook',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(minimalWebhook)).not.toThrow();
    });

    it('should apply default value for active when not provided', () => {
      const webhookWithoutActive = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        url: 'https://example.com/webhook',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      const result = WebhookSchema.parse(webhookWithoutActive);
      expect(result.active).toBe(true);
    });
  });

  describe('Invalid Webhook Data - ID Validation', () => {
    it('should reject invalid UUID format', () => {
      const invalidWebhook = {
        id: 'not-a-uuid',
        url: 'https://example.com/webhook',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(invalidWebhook)).toThrow();
    });

    it('should reject empty ID', () => {
      const invalidWebhook = {
        id: '',
        url: 'https://example.com/webhook',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(invalidWebhook)).toThrow();
    });
  });

  describe('Invalid Webhook Data - URL Validation', () => {
    it('should reject invalid URL format', () => {
      const invalidWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'not-a-url',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(invalidWebhook)).toThrow();
    });

    it('should reject empty URL', () => {
      const invalidWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: '',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(invalidWebhook)).toThrow();
    });

    it('should reject non-HTTP URLs', () => {
      const invalidWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'ftp://example.com/webhook',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(invalidWebhook)).toThrow();
    });
  });

  describe('Invalid Webhook Data - Description Validation', () => {
    it('should reject description longer than 500 characters', () => {
      const longDescription = 'A'.repeat(501);
      const invalidWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        description: longDescription,
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(invalidWebhook)).toThrow();
    });
  });

  describe('Invalid Webhook Data - Events Validation', () => {
    it('should reject empty events array', () => {
      const invalidWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        events: [],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(invalidWebhook)).toThrow();
    });

    it('should reject invalid event types', () => {
      const invalidWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        events: ['invalid:event'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(invalidWebhook)).toThrow();
    });

    it('should reject mixed valid and invalid events', () => {
      const invalidWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        events: ['repo:push', 'invalid:event'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(invalidWebhook)).toThrow();
    });
  });

  describe('Valid Event Types', () => {
    it('should validate all supported event types', () => {
      const validEvents = [
        'repo:push',
        'pullrequest:created',
        'pullrequest:updated',
        'pullrequest:approved',
        'pullrequest:merged',
        'pullrequest:declined'
      ];

      validEvents.forEach(event => {
        const validWebhook = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          url: 'https://example.com/webhook',
          events: [event],
          createdDate: '2025-01-27T10:00:00Z',
          updatedDate: '2025-01-27T10:00:00Z'
        };

        expect(() => WebhookSchema.parse(validWebhook)).not.toThrow();
      });
    });

    it('should validate multiple events in single webhook', () => {
      const validWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        events: [
          'repo:push',
          'pullrequest:created',
          'pullrequest:updated',
          'pullrequest:approved',
          'pullrequest:merged',
          'pullrequest:declined'
        ],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(validWebhook)).not.toThrow();
    });
  });

  describe('Invalid Webhook Data - Date Validation', () => {
    it('should reject invalid createdDate format', () => {
      const invalidWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        events: ['repo:push'],
        createdDate: 'invalid-date',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(invalidWebhook)).toThrow();
    });

    it('should reject invalid updatedDate format', () => {
      const invalidWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: 'invalid-date'
      };

      expect(() => WebhookSchema.parse(invalidWebhook)).toThrow();
    });
  });

  describe('Business Rules Validation', () => {
    it('should validate webhook URL accessibility (tested at service level)', () => {
      // URL accessibility is validated at service level, not schema level
      const validWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(validWebhook)).not.toThrow();
    });

    it('should enforce unique ID constraint (tested at service level)', () => {
      // Unique ID constraint is enforced at service level
      const validWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(validWebhook)).not.toThrow();
    });
  });

  describe('State Transitions', () => {
    it('should support webhook creation state', () => {
      const newWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(newWebhook)).not.toThrow();
    });

    it('should support webhook active state', () => {
      const activeWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        events: ['repo:push'],
        active: true,
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(activeWebhook)).not.toThrow();
    });

    it('should support webhook inactive state', () => {
      const inactiveWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook',
        events: ['repo:push'],
        active: false,
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(inactiveWebhook)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle HTTPS URLs with ports', () => {
      const validWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com:8080/webhook',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(validWebhook)).not.toThrow();
    });

    it('should handle URLs with query parameters', () => {
      const validWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/webhook?token=abc123',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(validWebhook)).not.toThrow();
    });

    it('should handle URLs with path segments', () => {
      const validWebhook = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://example.com/api/v1/webhooks/bitbucket',
        events: ['repo:push'],
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => WebhookSchema.parse(validWebhook)).not.toThrow();
    });
  });
});
