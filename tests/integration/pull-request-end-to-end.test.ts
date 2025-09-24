/**
 * Pull Request End-to-End Integration Tests
 * 
 * Comprehensive end-to-end integration tests for pull request management workflows.
 * Tests complete pull request lifecycle from creation to merge with real-world scenarios.
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

describe('Pull Request End-to-End Integration Tests', () => {
  let mockContext: ToolExecutionContext;
  let mockSession: any;
  let createdPullRequest: any;

  beforeEach(() => {
    mockSession = {
      id: 'test-session-id',
      emit: jest.fn(),
      user: {
        username: 'test-user',
        permissions: ['read', 'write', 'admin'],
        roles: ['developer', 'reviewer']
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

    createdPullRequest = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Pull Request Lifecycle', () => {
    it('should handle complete pull request workflow from creation to merge', async () => {
      const workspace = 'test-workspace';
      const repository = 'test-repo';
      const sourceBranch = 'feature/complete-workflow-test';
      const destinationBranch = 'main';

      // Step 1: Create Pull Request
      const createParams = {
        workspace,
        repository,
        title: 'Complete Workflow Test PR',
        description: {
          raw: 'This PR tests the complete workflow from creation to merge',
          markup: 'markdown'
        },
        source_branch: sourceBranch,
        destination_branch: destinationBranch,
        reviewers: ['reviewer1', 'reviewer2'],
        assignees: ['assignee1'],
        labels: ['enhancement', 'testing'],
        close_source_branch: false,
        merge_strategy: 'merge_commit'
      };

      const createResult = await createPullRequestTool.execute(createParams, mockContext);
      expect(createResult.success).toBe(true);
      expect(createResult.data.pull_request.title).toBe('Complete Workflow Test PR');
      expect(createResult.data.pull_request.state).toBe('open');
      expect(createResult.data.pull_request.reviewers).toHaveLength(2);
      expect(createResult.data.pull_request.assignees).toHaveLength(1);
      expect(createResult.data.pull_request.labels).toHaveLength(2);

      createdPullRequest = createResult.data.pull_request;
      const pullRequestId = createdPullRequest.number.toString();

      // Step 2: List Pull Requests (verify creation)
      const listParams = {
        workspace,
        repository,
        state: 'open',
        page: 1,
        page_size: 10
      };

      const listResult = await listPullRequestsTool.execute(listParams, mockContext);
      expect(listResult.success).toBe(true);
      expect(listResult.data.pull_requests.length).toBeGreaterThan(0);
      expect(listResult.data.pull_requests.some(pr => pr.number === createdPullRequest.number)).toBe(true);

      // Step 3: Get Pull Request Details
      const getParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        include_diff: true,
        include_commits: true,
        include_reviews: true,
        include_comments: true,
        include_status_checks: true
      };

      const getResult = await getPullRequestTool.execute(getParams, mockContext);
      expect(getResult.success).toBe(true);
      expect(getResult.data.pull_request.number).toBe(createdPullRequest.number);
      expect(getResult.data.pull_request.title).toBe('Complete Workflow Test PR');

      // Step 4: Add Comments
      const commentParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'create_comment',
        content: {
          raw: 'Great work on this feature! Just a few minor suggestions.',
          markup: 'markdown'
        }
      };

      const commentResult = await managePullRequestCommentsTool.execute(commentParams, mockContext);
      expect(commentResult.success).toBe(true);
      expect(commentResult.data.action).toBe('create_comment');
      expect(commentResult.data.comment.content.raw).toBe('Great work on this feature! Just a few minor suggestions.');

      // Step 5: Add Inline Comment
      const inlineCommentParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'create_comment',
        content: {
          raw: 'Consider adding error handling here',
          markup: 'markdown'
        },
        inline_comment: {
          path: 'src/feature.ts',
          line: 42,
          line_type: 'context'
        }
      };

      const inlineCommentResult = await managePullRequestCommentsTool.execute(inlineCommentParams, mockContext);
      expect(inlineCommentResult.success).toBe(true);
      expect(inlineCommentResult.data.comment.inline).toBeDefined();
      expect(inlineCommentResult.data.comment.inline.path).toBe('src/feature.ts');
      expect(inlineCommentResult.data.comment.inline.line).toBe(42);

      // Step 6: Submit Reviews
      const reviewParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'submit_review',
        reviewer: 'reviewer1',
        review_comment: 'Overall looks good, just need to address the inline comment'
      };

      const reviewResult = await managePullRequestReviewsTool.execute(reviewParams, mockContext);
      expect(reviewResult.success).toBe(true);
      expect(reviewResult.data.action).toBe('submit_review');
      expect(reviewResult.data.review.reviewer.username).toBe('reviewer1');

      // Step 7: Approve Pull Request
      const approveParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'approve',
        reviewer: 'reviewer2',
        review_comment: 'Approved! Ready to merge.',
        approve_changes: true
      };

      const approveResult = await managePullRequestReviewsTool.execute(approveParams, mockContext);
      expect(approveResult.success).toBe(true);
      expect(approveResult.data.action).toBe('approve');
      expect(approveResult.data.review.state).toBe('approved');

      // Step 8: Create Status Checks
      const statusCheckParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'create_status_check',
        status_check_name: 'CI Build',
        status_check_state: 'successful',
        status_check_description: 'All tests passed',
        status_check_url: 'https://ci.example.com/build/123'
      };

      const statusCheckResult = await managePullRequestIntegrationTool.execute(statusCheckParams, mockContext);
      expect(statusCheckResult.success).toBe(true);
      expect(statusCheckResult.data.action).toBe('create_status_check');
      expect(statusCheckResult.data.status_check.name).toBe('CI Build');
      expect(statusCheckResult.data.status_check.state).toBe('successful');

      // Step 9: Update Pull Request
      const updateParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        title: 'Complete Workflow Test PR - Updated',
        description: {
          raw: 'This PR tests the complete workflow from creation to merge - Updated with feedback',
          markup: 'markdown'
        },
        labels: ['enhancement', 'testing', 'ready-to-merge']
      };

      const updateResult = await updatePullRequestTool.execute(updateParams, mockContext);
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.pull_request.title).toBe('Complete Workflow Test PR - Updated');
      expect(updateResult.data.updated_fields).toContain('title');
      expect(updateResult.data.updated_fields).toContain('description');
      expect(updateResult.data.updated_fields).toContain('labels');

      // Step 10: Merge Pull Request
      const mergeParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        merge_strategy: 'merge_commit',
        merge_message: 'Merge PR: Complete Workflow Test',
        close_source_branch: true,
        merge_reason: 'Feature complete and approved'
      };

      const mergeResult = await mergePullRequestTool.execute(mergeParams, mockContext);
      expect(mergeResult.success).toBe(true);
      expect(mergeResult.data.pull_request.state).toBe('merged');
      expect(mergeResult.data.merge_details.strategy).toBe('merge_commit');
      expect(mergeResult.data.merge_details.close_source_branch).toBe(true);

      // Step 11: Verify Final State
      const finalListParams = {
        workspace,
        repository,
        state: 'merged',
        page: 1,
        page_size: 10
      };

      const finalListResult = await listPullRequestsTool.execute(finalListParams, mockContext);
      expect(finalListResult.success).toBe(true);
      expect(finalListResult.data.pull_requests.some(pr => 
        pr.number === createdPullRequest.number && pr.state === 'merged'
      )).toBe(true);
    });

    it('should handle pull request workflow with conflicts and resolution', async () => {
      const workspace = 'test-workspace';
      const repository = 'test-repo';
      const sourceBranch = 'feature/conflict-resolution-test';
      const destinationBranch = 'main';

      // Step 1: Create Pull Request
      const createParams = {
        workspace,
        repository,
        title: 'Conflict Resolution Test PR',
        source_branch: sourceBranch,
        destination_branch: destinationBranch,
        reviewers: ['reviewer1']
      };

      const createResult = await createPullRequestTool.execute(createParams, mockContext);
      expect(createResult.success).toBe(true);
      const pullRequestId = createResult.data.pull_request.number.toString();

      // Step 2: Request Changes
      const requestChangesParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'request_changes',
        reviewer: 'reviewer1',
        review_comment: 'Please resolve the merge conflicts before merging',
        request_changes_reason: 'Merge conflicts detected'
      };

      const requestChangesResult = await managePullRequestReviewsTool.execute(requestChangesParams, mockContext);
      expect(requestChangesResult.success).toBe(true);
      expect(requestChangesResult.data.action).toBe('request_changes');
      expect(requestChangesResult.data.review.state).toBe('changes_requested');

      // Step 3: Update Source Branch (simulate conflict resolution)
      const updateBranchParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'update_source_branch',
        source_branch: sourceBranch
      };

      const updateBranchResult = await managePullRequestBranchesTool.execute(updateBranchParams, mockContext);
      expect(updateBranchResult.success).toBe(true);
      expect(updateBranchResult.data.action).toBe('update_source_branch');

      // Step 4: Compare Branches
      const compareParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'compare_branches',
        source_branch: sourceBranch,
        destination_branch: destinationBranch,
        include_diff: true,
        include_commits: true
      };

      const compareResult = await managePullRequestBranchesTool.execute(compareParams, mockContext);
      expect(compareResult.success).toBe(true);
      expect(compareResult.data.action).toBe('compare_branches');
      expect(compareResult.data.comparison.source_branch).toBe(sourceBranch);
      expect(compareResult.data.comparison.destination_branch).toBe(destinationBranch);

      // Step 5: Approve After Changes
      const approveParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'approve',
        reviewer: 'reviewer1',
        review_comment: 'Conflicts resolved, looks good now!'
      };

      const approveResult = await managePullRequestReviewsTool.execute(approveParams, mockContext);
      expect(approveResult.success).toBe(true);
      expect(approveResult.data.action).toBe('approve');

      // Step 6: Merge with Squash
      const mergeParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        merge_strategy: 'squash',
        squash_message: 'Squash: Resolve conflicts and implement feature',
        close_source_branch: true
      };

      const mergeResult = await mergePullRequestTool.execute(mergeParams, mockContext);
      expect(mergeResult.success).toBe(true);
      expect(mergeResult.data.merge_result.merge_strategy).toBe('squash');
    });

    it('should handle pull request workflow with multiple reviewers and complex approval process', async () => {
      const workspace = 'test-workspace';
      const repository = 'test-repo';
      const sourceBranch = 'feature/multi-reviewer-test';
      const destinationBranch = 'main';

      // Step 1: Create Pull Request with Multiple Reviewers
      const createParams = {
        workspace,
        repository,
        title: 'Multi-Reviewer Test PR',
        source_branch: sourceBranch,
        destination_branch: destinationBranch,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3'],
        assignees: ['assignee1', 'assignee2'],
        labels: ['complex', 'multi-reviewer', 'testing']
      };

      const createResult = await createPullRequestTool.execute(createParams, mockContext);
      expect(createResult.success).toBe(true);
      expect(createResult.data.pull_request.reviewers).toHaveLength(3);
      expect(createResult.data.pull_request.assignees).toHaveLength(2);
      const pullRequestId = createResult.data.pull_request.number.toString();

      // Step 2: First Reviewer Approves
      const approve1Params = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'approve',
        reviewer: 'reviewer1',
        review_comment: 'Looks good from my perspective'
      };

      const approve1Result = await managePullRequestReviewsTool.execute(approve1Params, mockContext);
      expect(approve1Result.success).toBe(true);
      expect(approve1Result.data.review.state).toBe('approved');

      // Step 3: Second Reviewer Requests Changes
      const requestChangesParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'request_changes',
        reviewer: 'reviewer2',
        review_comment: 'Need to add more error handling',
        request_changes_reason: 'Insufficient error handling'
      };

      const requestChangesResult = await managePullRequestReviewsTool.execute(requestChangesParams, mockContext);
      expect(requestChangesResult.success).toBe(true);
      expect(requestChangesResult.data.review.state).toBe('changes_requested');

      // Step 4: Add Comments from Third Reviewer
      const commentParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'create_comment',
        content: {
          raw: 'I agree with reviewer2, we should add more comprehensive error handling',
          markup: 'markdown'
        }
      };

      const commentResult = await managePullRequestCommentsTool.execute(commentParams, mockContext);
      expect(commentResult.success).toBe(true);

      // Step 5: Update Pull Request Based on Feedback
      const updateParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        description: {
          raw: 'Updated with comprehensive error handling as requested by reviewers',
          markup: 'markdown'
        },
        labels: ['complex', 'multi-reviewer', 'testing', 'error-handling']
      };

      const updateResult = await updatePullRequestTool.execute(updateParams, mockContext);
      expect(updateResult.success).toBe(true);

      // Step 6: Second Reviewer Approves After Changes
      const approve2Params = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'approve',
        reviewer: 'reviewer2',
        review_comment: 'Error handling looks much better now, approved!'
      };

      const approve2Result = await managePullRequestReviewsTool.execute(approve2Params, mockContext);
      expect(approve2Result.success).toBe(true);

      // Step 7: Third Reviewer Approves
      const approve3Params = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'approve',
        reviewer: 'reviewer3',
        review_comment: 'All concerns addressed, approved!'
      };

      const approve3Result = await managePullRequestReviewsTool.execute(approve3Params, mockContext);
      expect(approve3Result.success).toBe(true);

      // Step 8: Create Multiple Status Checks
      const statusChecks = [
        { name: 'CI Build', state: 'successful', description: 'All tests passed' },
        { name: 'Code Coverage', state: 'successful', description: 'Coverage: 95%' },
        { name: 'Security Scan', state: 'successful', description: 'No vulnerabilities found' }
      ];

      for (const statusCheck of statusChecks) {
        const statusParams = {
          workspace,
          repository,
          pull_request_id: pullRequestId,
          action: 'create_status_check',
          status_check_name: statusCheck.name,
          status_check_state: statusCheck.state,
          status_check_description: statusCheck.description
        };

        const statusResult = await managePullRequestIntegrationTool.execute(statusParams, mockContext);
        expect(statusResult.success).toBe(true);
        expect(statusResult.data.status_check.name).toBe(statusCheck.name);
        expect(statusResult.data.status_check.state).toBe(statusCheck.state);
      }

      // Step 9: Merge Pull Request
      const mergeParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        merge_strategy: 'merge_commit',
        merge_message: 'Merge: Multi-reviewer feature with comprehensive error handling',
        close_source_branch: true,
        merge_reason: 'All reviewers approved and all status checks passed'
      };

      const mergeResult = await mergePullRequestTool.execute(mergeParams, mockContext);
      expect(mergeResult.success).toBe(true);
      expect(mergeResult.data.pull_request.state).toBe('merged');
    });

    it('should handle pull request workflow with integration and webhook triggers', async () => {
      const workspace = 'test-workspace';
      const repository = 'test-repo';
      const sourceBranch = 'feature/integration-test';
      const destinationBranch = 'main';

      // Step 1: Create Pull Request
      const createParams = {
        workspace,
        repository,
        title: 'Integration Test PR',
        source_branch: sourceBranch,
        destination_branch: destinationBranch,
        reviewers: ['reviewer1']
      };

      const createResult = await createPullRequestTool.execute(createParams, mockContext);
      expect(createResult.success).toBe(true);
      const pullRequestId = createResult.data.pull_request.number.toString();

      // Step 2: Trigger Webhook for External System
      const webhookParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'trigger_webhook',
        webhook_url: 'https://external-system.example.com/webhook',
        webhook_payload: {
          pull_request: {
            id: pullRequestId,
            title: 'Integration Test PR',
            state: 'open'
          },
          action: 'opened'
        }
      };

      const webhookResult = await managePullRequestIntegrationTool.execute(webhookParams, mockContext);
      expect(webhookResult.success).toBe(true);
      expect(webhookResult.data.webhook.triggered).toBe(true);
      expect(webhookResult.data.webhook.url).toBe('https://external-system.example.com/webhook');

      // Step 3: Validate Integrations
      const validateParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'validate_integrations',
        integration_type: 'all'
      };

      const validateResult = await managePullRequestIntegrationTool.execute(validateParams, mockContext);
      expect(validateResult.success).toBe(true);
      expect(validateResult.data.action).toBe('validate_integrations');
      expect(validateResult.data.validation_results.overall_status).toBe('healthy');

      // Step 4: Approve and Merge
      const approveParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        action: 'approve',
        reviewer: 'reviewer1'
      };

      const approveResult = await managePullRequestReviewsTool.execute(approveParams, mockContext);
      expect(approveResult.success).toBe(true);

      const mergeParams = {
        workspace,
        repository,
        pull_request_id: pullRequestId,
        merge_strategy: 'fast_forward',
        close_source_branch: true
      };

      const mergeResult = await mergePullRequestTool.execute(mergeParams, mockContext);
      expect(mergeResult.success).toBe(true);
      expect(mergeResult.data.merge_result.merge_strategy).toBe('fast_forward');
    });
  });

  describe('Error Scenarios and Recovery', () => {
    it('should handle pull request creation failure gracefully', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test PR',
        source_branch: 'feature/test'
      };

      // Mock a failure scenario
      const originalExecute = createPullRequestTool.execute;
      createPullRequestTool.execute = jest.fn().mockRejectedValue(new Error('Repository not found'));

      const result = await createPullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32603);
      expect(result.error?.message).toBe('Repository not found');

      // Restore original function
      createPullRequestTool.execute = originalExecute;
    });

    it('should handle merge conflicts gracefully', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        pull_request_id: '123',
        merge_strategy: 'merge_commit'
      };

      // Mock merge conflict scenario
      const originalExecute = mergePullRequestTool.execute;
      mergePullRequestTool.execute = jest.fn().mockImplementation(async (params, context) => {
        // Simulate validation that detects conflicts
        if (params.validate_before_merge !== false) {
          return {
            success: false,
            error: {
              code: -32603,
              message: 'Pull request has merge conflicts and cannot be merged',
              details: { 
                conflicts: true,
                force_merge_required: true,
                pull_request_number: 123
              }
            },
            metadata: {
              timestamp: new Date(),
              tool: 'merge_pull_request',
              validation_failed: true
            }
          };
        }
        return originalExecute(params, context);
      });

      const result = await mergePullRequestTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('merge conflicts');
      expect(result.error?.details?.conflicts).toBe(true);

      // Restore original function
      mergePullRequestTool.execute = originalExecute;
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large pull request lists efficiently', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        page: 1,
        page_size: 100 // Large page size
      };

      const startTime = Date.now();
      const result = await listPullRequestsTool.execute(params, mockContext);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.data.pagination.page_size).toBe(100);
    });

    it('should handle concurrent pull request operations', async () => {
      const workspace = 'test-workspace';
      const repository = 'test-repo';

      // Create multiple pull requests concurrently
      const createPromises = Array(5).fill(null).map((_, index) => {
        const params = {
          workspace,
          repository,
          title: `Concurrent Test PR ${index + 1}`,
          source_branch: `feature/concurrent-test-${index + 1}`,
          destination_branch: 'main'
        };
        return createPullRequestTool.execute(params, mockContext);
      });

      const results = await Promise.all(createPromises);

      // All should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data.pull_request.title).toBe(`Concurrent Test PR ${index + 1}`);
      });
    });
  });
});
