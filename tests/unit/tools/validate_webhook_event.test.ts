/**
 * Webhook Event Validator Tool Tests
 * 
 * Unit tests for the webhook event validation functionality.
 */

import { executeValidateWebhookEvent } from '../../../src/server/tools/validate_webhook_event.js';

describe('Validate Webhook Event Tool', () => {
  describe('executeValidateWebhookEvent', () => {
    it('should validate repo:push event with valid payload', async () => {
      const input = {
        event_key: 'repo:push',
        payload: {
          repository: {
            full_name: 'test-workspace/test-repo'
          },
          push: {
            changes: [{
              new: {
                name: 'main'
              },
              commits: [{
                author: {
                  user: {
                    display_name: 'Test User'
                  }
                }
              }]
            }]
          }
        }
      };

      const result = await executeValidateWebhookEvent(input);

      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(true);
      expect(result.validation.event_key).toBe('repo:push');
      expect(result.validation.metadata.event_type).toBe('repo:push');
      expect(result.validation.metadata.repository).toBe('test-workspace/test-repo');
      expect(result.validation.metadata.branch).toBe('main');
      expect(result.validation.metadata.author).toBe('Test User');
    });

    it('should validate pullrequest:created event with valid payload', async () => {
      const input = {
        event_key: 'pullrequest:created',
        payload: {
          repository: {
            full_name: 'test-workspace/test-repo'
          },
          pullrequest: {
            id: 123,
            title: 'Test PR',
            source: {
              branch: {
                name: 'feature-branch'
              }
            },
            destination: {
              branch: {
                name: 'main'
              }
            },
            author: {
              display_name: 'PR Author'
            }
          }
        }
      };

      const result = await executeValidateWebhookEvent(input);

      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(true);
      expect(result.validation.metadata.event_type).toBe('pullrequest:created');
      expect(result.validation.metadata.pull_request_id).toBe(123);
      expect(result.validation.metadata.title).toBe('Test PR');
      expect(result.validation.metadata.source_branch).toBe('feature-branch');
      expect(result.validation.metadata.destination_branch).toBe('main');
      expect(result.validation.metadata.author).toBe('PR Author');
    });

    it('should validate signature when provided', async () => {
      const payload = {
        repository: { full_name: 'test/repo' },
        push: { changes: [] }
      };
      const secret = 'test-secret';
      const payloadString = JSON.stringify(payload);
      
      // Create valid signature
      const crypto = await import('node:crypto');
      const validSignature = crypto.createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex');

      const input = {
        event_key: 'repo:push',
        payload,
        signature: `sha256=${validSignature}`,
        secret
      };

      const result = await executeValidateWebhookEvent(input);

      expect(result.success).toBe(true);
      expect(result.validation.validation_checks.signature?.valid).toBe(true);
      expect(result.validation.validation_checks.signature?.message).toContain('validated successfully');
    });

    it('should fail validation with invalid signature', async () => {
      const input = {
        event_key: 'repo:push',
        payload: {
          repository: { full_name: 'test/repo' },
          push: { changes: [] }
        },
        signature: 'sha256=invalid-signature',
        secret: 'test-secret'
      };

      const result = await executeValidateWebhookEvent(input);

      expect(result.success).toBe(false);
      if (result.validation) {
        expect(result.validation.valid).toBe(false);
        expect(result.validation.validation_checks.signature?.valid).toBe(false);
        expect(result.validation.validation_checks.signature?.message).toContain('Invalid signature');
      } else {
        // If validation object is missing, check that error handling worked
        expect(result.error || result.message).toBeDefined();
      }
    });

    it('should handle missing signature gracefully', async () => {
      const input = {
        event_key: 'repo:push',
        payload: {
          repository: { full_name: 'test/repo' }
        }
      };

      const result = await executeValidateWebhookEvent(input);

      expect(result.success).toBe(true);
      expect(result.validation.validation_checks.signature?.valid).toBe(null);
      expect(result.validation.validation_checks.signature?.message).toContain('No signature provided');
    });

    it('should fail with empty event_key', async () => {
      const input = {
        event_key: '',
        payload: {}
      };

      await expect(executeValidateWebhookEvent(input as any)).rejects.toThrow();
    });

    it('should fail with null payload', async () => {
      const input = {
        event_key: 'repo:push',
        payload: null
      };

      await expect(executeValidateWebhookEvent(input as any)).rejects.toThrow();
    });

    it('should handle issue events', async () => {
      const input = {
        event_key: 'issue:created',
        payload: {
          repository: {
            full_name: 'test-workspace/test-repo'
          },
          issue: {
            id: 456,
            title: 'Test Issue',
            priority: 'high',
            assignee: {
              display_name: 'Issue Assignee'
            }
          }
        }
      };

      const result = await executeValidateWebhookEvent(input);

      expect(result.success).toBe(true);
      expect(result.validation.metadata.event_type).toBe('issue:created');
      expect(result.validation.metadata.issue_id).toBe(456);
      expect(result.validation.metadata.title).toBe('Test Issue');
      expect(result.validation.metadata.priority).toBe('high');
      expect(result.validation.metadata.assignee).toBe('Issue Assignee');
    });

    it('should handle unknown event types', async () => {
      const input = {
        event_key: 'unknown:event',
        payload: {
          some_field: 'some_value',
          another_field: 'another_value'
        }
      };

      const result = await executeValidateWebhookEvent(input);

      expect(result.success).toBe(true);
      expect(result.validation.metadata.event_type).toBe('unknown:event');
      expect(result.validation.metadata.raw_payload_keys).toEqual(['some_field', 'another_field']);
    });
  });
});