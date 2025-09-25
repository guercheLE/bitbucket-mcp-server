/**
 * Pull Request Management Unit Tests
 * 
 * Comprehensive unit tests for pull request management MCP tools.
 * Tests all pull request operations including creation, listing, updates, reviews, comments, merging, and integrations.
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

describe('Pull Request Management Tools', () => {
  let mockContext: ToolExecutionContext;

  beforeEach(() => {
    mockContext = {
      request: {
        timestamp: new Date(),
        id: 'test-request-id',
        method: 'test',
        params: {}
      },
      session: {
        id: 'test-session-id',
        emit: jest.fn()
      } as any
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create_pull_request', () => {
    it('should create a pull request with valid parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test Pull Request',
        source_branch: 'feature/test-branch',
        destination_branch: 'main',
        description: {
          raw: 'Test description',
          markup: 'markdown'
        },
        reviewers: ['reviewer1', 'reviewer2'],
        labels: ['enhancement', 'bugfix']
      };

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('pull_request');
      expect(result.data.pull_request.title).toBe('Test Pull Request');
      expect(result.data.pull_request.source.branch.name).toBe('feature/test-branch');
      expect(result.data.pull_request.destination.branch.name).toBe('main');
      expect(result.data.pull_request.reviewers).toHaveLength(2);
      expect(result.data.pull_request.labels).toHaveLength(2);
    });

    it('should fail with missing required parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo'
        // Missing title and source_branch
      };

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('required');
    });

    it('should fail with invalid repository name', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'invalid@repo!',
        title: 'Test PR',
        source_branch: 'feature/test'
      };

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Repository name must contain only alphanumeric characters');
    });

    it('should fail with title too long', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'A'.repeat(201), // Exceeds 200 character limit
        source_branch: 'feature/test'
      };

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Pull request title must be 200 characters or less');
    });

    it('should fail with too many reviewers', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test',
        reviewers: Array(11).fill('reviewer') // Exceeds 10 reviewer limit
      };

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Maximum 10 reviewers allowed');
    });
  });

  describe('list_pull_requests', () => {
    it('should list pull requests with valid parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        state: 'open',
        page: 1,
        page_size: 20
      };

      const result = await listPullRequestsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('pull_requests');
      expect(result.data).toHaveProperty('pagination');
      expect(result.data.pagination.page).toBe(1);
      expect(result.data.pagination.page_size).toBe(20);
    });

    it('should filter pull requests by state', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        state: 'merged'
      };

      const result = await listPullRequestsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.filters.state).toBe('merged');
    });

    it('should fail with invalid date format', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        created_after: 'invalid-date'
      };

      const result = await listPullRequestsTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('must be a valid ISO 8601 date-time string');
    });

    it('should fail with search query too long', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        search_query: 'A'.repeat(201) // Exceeds 200 character limit
      };

      const result = await listPullRequestsTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Search query must be 200 characters or less');
    });
  });

  describe('get_pull_request', () => {
    it('should get pull request details with valid parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        include_diff: true,
        include_commits: true
      };

      const result = await getPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('pull_request');
      expect(result.data.pull_request.number).toBe(123);
    });

    it('should fail with missing pull request ID', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo'
        // Missing pull_request_id
      };

      const result = await getPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('pull_request_id are required');
    });
  });

  describe('update_pull_request', () => {
    it('should update pull request with valid parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        title: 'Updated Title',
        state: 'open'
      };

      const result = await updatePullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('pull_request');
      expect(result.data).toHaveProperty('updated_fields');
      expect(result.data.updated_fields).toContain('title');
      expect(result.data.updated_fields).toContain('state');
    });

    it('should fail with no fields to update', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123'
        // No update fields provided
      };

      const result = await updatePullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('At least one field must be provided for update');
    });
  });

  describe('manage_pull_request_reviews', () => {
    it('should assign reviewers with valid parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'assign_reviewers',
        reviewers: ['reviewer1', 'reviewer2']
      };

      const result = await managePullRequestReviewsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('assign_reviewers');
      expect(result.data.pull_request.reviewers).toHaveLength(2);
    });

    it('should approve pull request', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'approve',
        reviewer: 'reviewer1',
        review_comment: 'Looks good!'
      };

      const result = await managePullRequestReviewsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('approve');
      expect(result.data.review.state).toBe('approved');
    });

    it('should fail with invalid action', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'invalid_action'
      };

      const result = await managePullRequestReviewsTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Invalid action specified');
    });
  });

  describe('manage_pull_request_comments', () => {
    it('should create comment with valid parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'create_comment',
        content: {
          raw: 'Test comment',
          markup: 'markdown'
        }
      };

      const result = await managePullRequestCommentsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('create_comment');
      expect(result.data.comment.content.raw).toBe('Test comment');
    });

    it('should create inline comment', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'create_comment',
        content: {
          raw: 'Inline comment',
          markup: 'markdown'
        },
        inline_comment: {
          path: 'src/file.ts',
          line: 10
        }
      };

      const result = await managePullRequestCommentsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.comment.inline).toBeDefined();
      expect(result.data.comment.inline.path).toBe('src/file.ts');
      expect(result.data.comment.inline.line).toBe(10);
    });

    it('should fail with comment content too long', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'create_comment',
        content: {
          raw: 'A'.repeat(10001), // Exceeds 10,000 character limit
          markup: 'markdown'
        }
      };

      const result = await managePullRequestCommentsTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Comment content must be 10,000 characters or less');
    });
  });

  describe('merge_pull_request', () => {
    it('should merge pull request with merge strategy', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        merge_strategy: 'merge_commit',
        merge_message: 'Merge PR #123'
      };

      const result = await mergePullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.pull_request.state).toBe('merged');
      expect(result.data.merge_details.strategy).toBe('merge_commit');
    });

    it('should merge with squash strategy', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        merge_strategy: 'squash',
        squash_message: 'Squash PR #123'
      };

      const result = await mergePullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.merge_result.merge_strategy).toBe('squash');
    });

    it('should fail with invalid merge strategy', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        merge_strategy: 'invalid_strategy'
      };

      const result = await mergePullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Invalid merge strategy specified');
    });
  });

  describe('manage_pull_request_branches', () => {
    it('should update source branch', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'update_source_branch',
        source_branch: 'feature/updated-branch'
      };

      const result = await managePullRequestBranchesTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('update_source_branch');
      expect(result.data.pull_request.source_branch.name).toBe('feature/updated-branch');
    });

    it('should compare branches', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'compare_branches',
        source_branch: 'feature/test',
        destination_branch: 'main',
        include_diff: true
      };

      const result = await managePullRequestBranchesTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('compare_branches');
      expect(result.data.comparison.source_branch).toBe('feature/test');
      expect(result.data.comparison.destination_branch).toBe('main');
    });

    it('should fail with invalid branch name', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'update_source_branch',
        source_branch: 'invalid@branch!'
      };

      const result = await managePullRequestBranchesTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Source branch name contains invalid characters');
    });
  });

  describe('manage_pull_request_integration', () => {
    it('should create status check', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'create_status_check',
        status_check_name: 'CI Build',
        status_check_state: 'successful',
        status_check_description: 'Build passed'
      };

      const result = await managePullRequestIntegrationTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('create_status_check');
      expect(result.data.status_check.name).toBe('CI Build');
      expect(result.data.status_check.state).toBe('successful');
    });

    it('should trigger webhook', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'trigger_webhook',
        webhook_url: 'https://example.com/webhook',
        webhook_payload: { test: 'data' }
      };

      const result = await managePullRequestIntegrationTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('trigger_webhook');
      expect(result.data.webhook.url).toBe('https://example.com/webhook');
      expect(result.data.webhook.triggered).toBe(true);
    });

    it('should fail with invalid webhook URL', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        action: 'trigger_webhook',
        webhook_url: 'invalid-url'
      };

      const result = await managePullRequestIntegrationTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Webhook URL must be a valid HTTP/HTTPS URL');
    });
  });

  describe('Tool Metadata', () => {
    it('should have correct metadata for all tools', () => {
      const tools = [
        createPullRequestTool,
        listPullRequestsTool,
        getPullRequestTool,
        updatePullRequestTool,
        managePullRequestReviewsTool,
        managePullRequestCommentsTool,
        mergePullRequestTool,
        managePullRequestBranchesTool,
        managePullRequestIntegrationTool
      ];

      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.category).toBe('pull_request_management');
        expect(tool.version).toBe('1.0.0');
        expect(tool.enabled).toBe(true);
        expect(tool.parameters).toBeDefined();
        expect(tool.execute).toBeDefined();
        expect(tool.metadata).toBeDefined();
        expect(tool.metadata.supported_apis).toContain('bitbucket_cloud');
        expect(tool.metadata.supported_apis).toContain('bitbucket_data_center');
        expect(tool.metadata.requires_auth).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Mock a tool to throw an unexpected error
      const originalExecute = createPullRequestTool.execute;
      createPullRequestTool.execute = jest.fn().mockRejectedValue(new Error('Unexpected error'));

      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test'
      };

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32603);
      expect(result.error?.message).toBe('Unexpected error');

      // Restore original function
      createPullRequestTool.execute = originalExecute;
    });
  });
});
