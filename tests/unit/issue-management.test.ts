/**
 * Issue Management Unit Tests
 * 
 * Comprehensive unit tests for issue management MCP tools.
 * Tests all issue operations including creation, listing, updates, assignments, comments, relationships, search, and attachments.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createIssueTool } from '../../src/server/tools/create_issue.js';
import { listIssuesTool } from '../../src/server/tools/list_issues.js';
import { getIssueTool } from '../../src/server/tools/get_issue.js';
import { updateIssueTool } from '../../src/server/tools/update_issue.js';
import { manageIssueAssignmentTool } from '../../src/server/tools/manage_issue_assignment.js';
import { manageIssueCommentsTool } from '../../src/server/tools/manage_issue_comments.js';
import { manageIssueRelationshipsTool } from '../../src/server/tools/manage_issue_relationships.js';
import { advancedIssueSearchTool } from '../../src/server/tools/advanced_issue_search.js';
import { manageIssueAttachmentsTool } from '../../src/server/tools/manage_issue_attachments.js';
import { ToolExecutionContext } from '../../src/types/index.js';

describe('Issue Management Tools', () => {
  let mockContext: ToolExecutionContext;

  beforeEach(() => {
    mockContext = {
      request: {
        timestamp: new Date(),
        id: 'test-request-1',
        method: 'test',
        params: {}
      },
      session: {
        id: 'test-session-1',
        emit: jest.fn()
      } as any
    };
  });

  describe('create_issue', () => {
    it('should create an issue with valid parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test Issue',
        content: {
          raw: 'This is a test issue description',
          markup: 'markdown'
        },
        kind: 'bug',
        priority: 'major'
      };

      const result = await createIssueTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('issue');
      expect(result.data.issue.title).toBe('Test Issue');
      expect(result.data.issue.kind).toBe('bug');
      expect(result.data.issue.priority).toBe('major');
    });

    it('should reject invalid repository name', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'invalid@repo!',
        title: 'Test Issue',
        content: {
          raw: 'This is a test issue description'
        }
      };

      const result = await createIssueTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Repository name must contain only alphanumeric characters');
    });

    it('should reject missing required parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo'
        // Missing title and content
      };

      const result = await createIssueTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Workspace, repository, title, and content are required');
    });

    it('should reject title that is too long', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'A'.repeat(201), // Too long
        content: {
          raw: 'This is a test issue description'
        }
      };

      const result = await createIssueTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Issue title must be 200 characters or less');
    });

    it('should reject content that is too long', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test Issue',
        content: {
          raw: 'A'.repeat(10001) // Too long
        }
      };

      const result = await createIssueTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Issue content must have raw text and be 10,000 characters or less');
    });

    it('should reject too many labels', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Test Issue',
        content: {
          raw: 'This is a test issue description'
        },
        labels: Array(11).fill('label') // Too many labels
      };

      const result = await createIssueTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('Maximum 10 labels allowed per issue');
    });
  });

  describe('list_issues', () => {
    it('should list issues with valid parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        page: 1,
        page_size: 20
      };

      const result = await listIssuesTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('issues');
      expect(result.data).toHaveProperty('pagination');
      expect(Array.isArray(result.data.issues)).toBe(true);
    });

    it('should filter issues by state', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        state: 'open'
      };

      const result = await listIssuesTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.issues.every((issue: any) => issue.state === 'open')).toBe(true);
    });

    it('should filter issues by priority', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        priority: 'critical'
      };

      const result = await listIssuesTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.issues.every((issue: any) => issue.priority === 'critical')).toBe(true);
    });

    it('should search issues by query', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        q: 'authentication'
      };

      const result = await listIssuesTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.issues.every((issue: any) => 
        issue.title.toLowerCase().includes('authentication') ||
        issue.content.raw.toLowerCase().includes('authentication')
      )).toBe(true);
    });

    it('should reject invalid repository name', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'invalid@repo!'
      };

      const result = await listIssuesTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
    });
  });

  describe('get_issue', () => {
    it('should get issue details with valid parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        issue_id: '1',
        include_comments: true,
        include_attachments: true,
        include_history: true
      };

      const result = await getIssueTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('issue');
      expect(result.data).toHaveProperty('comments');
      expect(result.data).toHaveProperty('attachments');
      expect(result.data).toHaveProperty('history');
    });

    it('should get issue without optional data', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        issue_id: '1',
        include_comments: false,
        include_attachments: false,
        include_history: false
      };

      const result = await getIssueTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('issue');
      expect(result.data).not.toHaveProperty('comments');
      expect(result.data).not.toHaveProperty('attachments');
      expect(result.data).not.toHaveProperty('history');
    });

    it('should reject invalid issue ID', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        issue_id: 'invalid@id!'
      };

      const result = await getIssueTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
    });
  });

  describe('update_issue', () => {
    it('should update issue with valid parameters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        issue_id: '1',
        title: 'Updated Issue Title',
        state: 'resolved',
        priority: 'minor'
      };

      const result = await updateIssueTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('issue');
      expect(result.data).toHaveProperty('updated_fields');
      expect(result.data.updated_fields).toContain('title');
      expect(result.data.updated_fields).toContain('state');
      expect(result.data.updated_fields).toContain('priority');
    });

    it('should reject update without any fields', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        issue_id: '1'
        // No update fields provided
      };

      const result = await updateIssueTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
      expect(result.error?.message).toContain('At least one field must be provided for update');
    });

    it('should reject title that is too long', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        issue_id: '1',
        title: 'A'.repeat(201) // Too long
      };

      const result = await updateIssueTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
    });
  });

  describe('manage_issue_assignment', () => {
    it('should assign issue to user', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'assign',
        issue_id: '1',
        assignee: 'developer1'
      };

      const result = await manageIssueAssignmentTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('assign');
      expect(result.data.assignee.username).toBe('developer1');
    });

    it('should unassign issue', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'unassign',
        issue_id: '1'
      };

      const result = await manageIssueAssignmentTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('unassign');
    });

    it('should reassign issue', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'reassign',
        issue_id: '1',
        assignee: 'developer2',
        previous_assignee: 'developer1'
      };

      const result = await manageIssueAssignmentTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('reassign');
      expect(result.data.new_assignee.username).toBe('developer2');
      expect(result.data.previous_assignee.username).toBe('developer1');
    });

    it('should list assignments', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'list_assignments'
      };

      const result = await manageIssueAssignmentTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('list_assignments');
      expect(result.data).toHaveProperty('assignments');
    });

    it('should reject assign action without assignee', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'assign',
        issue_id: '1'
        // Missing assignee
      };

      const result = await manageIssueAssignmentTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
    });
  });

  describe('manage_issue_comments', () => {
    it('should create comment', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'create',
        issue_id: '1',
        content: {
          raw: 'This is a test comment',
          markup: 'markdown'
        }
      };

      const result = await manageIssueCommentsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('create');
      expect(result.data.comment.content.raw).toBe('This is a test comment');
    });

    it('should update comment', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'update',
        issue_id: '1',
        comment_id: 'comment_1',
        content: {
          raw: 'Updated comment content',
          markup: 'markdown'
        }
      };

      const result = await manageIssueCommentsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('update');
      expect(result.data.comment.content.raw).toBe('Updated comment content');
    });

    it('should delete comment', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'delete',
        issue_id: '1',
        comment_id: 'comment_1'
      };

      const result = await manageIssueCommentsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('delete');
    });

    it('should list comments', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'list',
        issue_id: '1'
      };

      const result = await manageIssueCommentsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('list');
      expect(result.data).toHaveProperty('comments');
    });

    it('should reject create action without content', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'create',
        issue_id: '1'
        // Missing content
      };

      const result = await manageIssueCommentsTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
    });
  });

  describe('manage_issue_relationships', () => {
    it('should link issue to commit', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'link_commit',
        issue_id: '1',
        commit_hash: 'abc123def456'
      };

      const result = await manageIssueRelationshipsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('link_commit');
      expect(result.data.relationship.type).toBe('commit_link');
      expect(result.data.relationship.target.hash).toBe('abc123def456');
    });

    it('should link issue to branch', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'link_branch',
        issue_id: '1',
        branch_name: 'feature/test-branch'
      };

      const result = await manageIssueRelationshipsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('link_branch');
      expect(result.data.relationship.type).toBe('branch_link');
      expect(result.data.relationship.target.name).toBe('feature/test-branch');
    });

    it('should link issue to pull request', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'link_pull_request',
        issue_id: '1',
        pull_request_id: '10'
      };

      const result = await manageIssueRelationshipsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('link_pull_request');
      expect(result.data.relationship.type).toBe('pull_request_link');
      expect(result.data.relationship.target.id).toBe('10');
    });

    it('should link issue to another issue', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'link_issue',
        issue_id: '1',
        related_issue_id: '2',
        relationship_type: 'blocks'
      };

      const result = await manageIssueRelationshipsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('link_issue');
      expect(result.data.relationship.type).toBe('issue_link');
      expect(result.data.relationship.relationship_type).toBe('blocks');
    });

    it('should reject invalid commit hash', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'link_commit',
        issue_id: '1',
        commit_hash: 'invalid-hash'
      };

      const result = await manageIssueRelationshipsTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
    });
  });

  describe('advanced_issue_search', () => {
    it('should search issues with query', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'search',
        search_query: 'authentication bug'
      };

      const result = await advancedIssueSearchTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('search');
      expect(result.data).toHaveProperty('issues');
      expect(result.data).toHaveProperty('pagination');
    });

    it('should search issues with filters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'search',
        filters: {
          state: ['open', 'new'],
          priority: ['critical', 'blocker'],
          labels: ['bug', 'authentication']
        }
      };

      const result = await advancedIssueSearchTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('search');
      expect(result.data.filters.state).toEqual(['open', 'new']);
    });

    it('should save search', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'save_search',
        saved_search_name: 'critical_bugs',
        search_query: 'critical bug',
        filters: {
          priority: ['critical', 'blocker']
        }
      };

      const result = await advancedIssueSearchTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('save_search');
      expect(result.data.saved_search.name).toBe('critical_bugs');
    });

    it('should list saved searches', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'list_saved_searches'
      };

      const result = await advancedIssueSearchTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('list_saved_searches');
      expect(result.data).toHaveProperty('saved_searches');
    });

    it('should export search results', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'export_results',
        search_query: 'test query',
        export_format: 'csv'
      };

      const result = await advancedIssueSearchTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('export_results');
      expect(result.data.export.format).toBe('csv');
    });

    it('should reject search without query or filters', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'search'
        // No search query or filters
      };

      const result = await advancedIssueSearchTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
    });
  });

  describe('manage_issue_attachments', () => {
    it('should upload attachment', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'upload',
        issue_id: '1',
        file_name: 'test.txt',
        file_content: 'dGVzdCBjb250ZW50' // base64 for 'test content'
      };

      const result = await manageIssueAttachmentsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('upload');
      expect(result.data.attachment.name).toBe('test.txt');
    });

    it('should download attachment', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'download',
        issue_id: '1',
        attachment_id: 'att_1'
      };

      const result = await manageIssueAttachmentsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('download');
      expect(result.data.download.attachment_id).toBe('att_1');
    });

    it('should list attachments', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'list',
        issue_id: '1',
        include_preview: true
      };

      const result = await manageIssueAttachmentsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('list');
      expect(result.data).toHaveProperty('attachments');
    });

    it('should delete attachment', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'delete',
        issue_id: '1',
        attachment_id: 'att_1'
      };

      const result = await manageIssueAttachmentsTool.execute(params, mockContext);

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('delete');
    });

    it('should reject upload without file name', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'upload',
        issue_id: '1',
        file_content: 'dGVzdCBjb250ZW50'
        // Missing file_name
      };

      const result = await manageIssueAttachmentsTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
    });

    it('should reject file content that is too large', async () => {
      const params = {
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'upload',
        issue_id: '1',
        file_name: 'test.txt',
        file_content: 'A'.repeat(10485761), // Too large
        max_file_size: 10485760
      };

      const result = await manageIssueAttachmentsTool.execute(params, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
    });
  });
});
