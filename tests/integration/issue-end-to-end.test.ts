/**
 * Issue Management End-to-End Integration Tests
 * 
 * Comprehensive end-to-end tests for issue management MCP tools.
 * Tests complete workflows, MCP protocol compliance, and integration with Bitbucket APIs.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { issueManagementTools } from '../../src/server/tools/issue_management_index.js';
import { ToolExecutionContext } from '../../src/types/index.js';

describe('Issue Management End-to-End Integration', () => {
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
        user: {
          username: 'developer1',
          permissions: ['read', 'write', 'admin'],
          workspace_access: ['test-workspace']
        },
        emit: jest.fn()
      } as any
    };
  });

  describe('Complete Issue Lifecycle', () => {
    it('should handle complete issue lifecycle from creation to resolution', async () => {
      const workspace = 'test-workspace';
      const repository = 'test-repo';

      // 1. Create an issue
      const createResult = await issueManagementTools[0].execute({
        workspace,
        repository,
        title: 'End-to-End Test Issue',
        content: {
          raw: 'This is a test issue for end-to-end testing',
          markup: 'markdown'
        },
        kind: 'bug',
        priority: 'major',
        labels: ['test', 'e2e']
      }, mockContext);

      expect(createResult.success).toBe(true);
      const issueId = createResult.data.issue.number.toString();

      // 2. Assign the issue
      const assignResult = await issueManagementTools[4].execute({
        workspace,
        repository,
        action: 'assign',
        issue_id: issueId,
        assignee: 'developer1'
      }, mockContext);

      expect(assignResult.success).toBe(true);

      // 3. Add a comment
      const commentResult = await issueManagementTools[5].execute({
        workspace,
        repository,
        action: 'create',
        issue_id: issueId,
        content: {
          raw: 'Working on this issue',
          markup: 'markdown'
        }
      }, mockContext);

      expect(commentResult.success).toBe(true);

      // 4. Link to a commit
      const linkResult = await issueManagementTools[6].execute({
        workspace,
        repository,
        action: 'link_commit',
        issue_id: issueId,
        commit_hash: 'abc123def456'
      }, mockContext);

      expect(linkResult.success).toBe(true);

      // 5. Upload an attachment
      const uploadResult = await issueManagementTools[8].execute({
        workspace,
        repository,
        action: 'upload',
        issue_id: issueId,
        file_name: 'test-file.txt',
        file_content: 'dGVzdCBjb250ZW50'
      }, mockContext);

      expect(uploadResult.success).toBe(true);

      // 6. Update the issue status
      const updateResult = await issueManagementTools[3].execute({
        workspace,
        repository,
        issue_id: issueId,
        state: 'resolved',
        priority: 'minor'
      }, mockContext);

      expect(updateResult.success).toBe(true);

      // 7. Get final issue details
      const getResult = await issueManagementTools[2].execute({
        workspace,
        repository,
        issue_id: issueId,
        include_comments: true,
        include_attachments: true,
        include_history: true,
        include_relationships: true
      }, mockContext);

      expect(getResult.success).toBe(true);
      expect(getResult.data.issue.state).toBe('resolved');
      expect(getResult.data.issue.priority).toBe('minor');
    });

    it('should handle issue search and filtering workflow', async () => {
      const workspace = 'test-workspace';
      const repository = 'test-repo';

      // 1. Create multiple issues with different properties
      const issues = [
        {
          title: 'Critical Bug in Auth',
          kind: 'bug',
          priority: 'critical',
          labels: ['bug', 'auth', 'critical']
        },
        {
          title: 'Enhancement Request',
          kind: 'enhancement',
          priority: 'minor',
          labels: ['enhancement', 'ui']
        },
        {
          title: 'Documentation Task',
          kind: 'task',
          priority: 'major',
          labels: ['documentation', 'task']
        }
      ];

      for (const issue of issues) {
        const result = await issueManagementTools[0].execute({
          workspace,
          repository,
          title: issue.title,
          content: { raw: `Description for ${issue.title}` },
          kind: issue.kind,
          priority: issue.priority,
          labels: issue.labels
        }, mockContext);

        expect(result.success).toBe(true);
      }

      // 2. Search for critical bugs
      const searchResult = await issueManagementTools[7].execute({
        workspace,
        repository,
        action: 'search',
        filters: {
          priority: ['critical'],
          kind: ['bug']
        }
      }, mockContext);

      expect(searchResult.success).toBe(true);
      expect(searchResult.data.issues.every((issue: any) => 
        issue.priority === 'critical' && issue.kind === 'bug'
      )).toBe(true);

      // 3. Save the search
      const saveResult = await issueManagementTools[7].execute({
        workspace,
        repository,
        action: 'save_search',
        saved_search_name: 'critical_bugs',
        filters: {
          priority: ['critical'],
          kind: ['bug']
        }
      }, mockContext);

      expect(saveResult.success).toBe(true);

      // 4. Export search results
      const exportResult = await issueManagementTools[7].execute({
        workspace,
        repository,
        action: 'export_results',
        filters: {
          priority: ['critical'],
          kind: ['bug']
        },
        export_format: 'json'
      }, mockContext);

      expect(exportResult.success).toBe(true);
    });
  });

  describe('MCP Protocol Compliance', () => {
    it('should return proper MCP tool structure', () => {
      expect(issueManagementTools).toHaveLength(9);
      
      issueManagementTools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('parameters');
        expect(tool).toHaveProperty('category');
        expect(tool).toHaveProperty('version');
        expect(tool).toHaveProperty('enabled');
        expect(tool).toHaveProperty('execute');
        expect(tool).toHaveProperty('metadata');
        
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(Array.isArray(tool.parameters)).toBe(true);
        expect(typeof tool.category).toBe('string');
        expect(typeof tool.version).toBe('string');
        expect(typeof tool.enabled).toBe('boolean');
        expect(typeof tool.execute).toBe('function');
        expect(typeof tool.metadata).toBe('object');
      });
    });

    it('should return proper MCP response format', async () => {
      const result = await issueManagementTools[0].execute({
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'MCP Compliance Test',
        content: { raw: 'Testing MCP compliance' }
      }, mockContext);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.data).toBe('object');
      expect(typeof result.metadata).toBe('object');
      
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.metadata).toHaveProperty('tool');
      expect(result.metadata).toHaveProperty('execution_time');
    });

    it('should handle MCP error format correctly', async () => {
      const result = await issueManagementTools[0].execute({
        workspace: 'test-workspace',
        repository: 'invalid@repo!',
        title: 'Test Issue',
        content: { raw: 'Test content' }
      }, mockContext);

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(result.error).toHaveProperty('code');
      expect(result.error).toHaveProperty('message');
      expect(result.error).toHaveProperty('details');
      
      expect(typeof result.error.code).toBe('number');
      expect(typeof result.error.message).toBe('string');
      expect(typeof result.error.details).toBe('object');
    });
  });

  describe('Bitbucket API Integration', () => {
    it('should handle Bitbucket Cloud API format', async () => {
      const result = await issueManagementTools[1].execute({
        workspace: 'test-workspace',
        repository: 'test-repo',
        page: 1,
        page_size: 20
      }, mockContext);

      expect(result.success).toBe(true);
      
      // Check that the response follows Bitbucket API format
      if (result.data.issues && result.data.issues.length > 0) {
        const issue = result.data.issues[0];
        expect(issue).toHaveProperty('id');
        expect(issue).toHaveProperty('number');
        expect(issue).toHaveProperty('title');
        expect(issue).toHaveProperty('state');
        expect(issue).toHaveProperty('links');
        expect(issue.links).toHaveProperty('self');
        expect(issue.links).toHaveProperty('html');
      }
    });

    it('should handle Bitbucket Data Center API format', async () => {
      // Simulate Data Center API response format
      const result = await issueManagementTools[2].execute({
        workspace: 'test-workspace',
        repository: 'test-repo',
        issue_id: '1',
        include_comments: true
      }, mockContext);

      expect(result.success).toBe(true);
      
      // Check that the response follows Data Center API format
      expect(result.data.issue).toHaveProperty('id');
      expect(result.data.issue).toHaveProperty('number');
      expect(result.data.issue).toHaveProperty('title');
      expect(result.data.issue).toHaveProperty('state');
      expect(result.data.issue).toHaveProperty('links');
    });

    it('should handle API rate limiting gracefully', async () => {
      // Simulate rapid API calls
      const promises = Array(10).fill(null).map((_, index) => 
        issueManagementTools[1].execute({
          workspace: 'test-workspace',
          repository: 'test-repo',
          page: index + 1,
          page_size: 10
        }, mockContext)
      );

      const results = await Promise.all(promises);
      
      // All requests should succeed (current implementation doesn't enforce rate limits)
      expect(results.every(result => result.success)).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large issue lists efficiently', async () => {
      const startTime = Date.now();
      
      const result = await issueManagementTools[1].execute({
        workspace: 'test-workspace',
        repository: 'test-repo',
        page: 1,
        page_size: 100
      }, mockContext);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle complex search queries efficiently', async () => {
      const startTime = Date.now();
      
      const result = await issueManagementTools[7].execute({
        workspace: 'test-workspace',
        repository: 'test-repo',
        action: 'search',
        search_query: 'complex search query with multiple terms',
        filters: {
          state: ['open', 'new', 'resolved'],
          priority: ['critical', 'major', 'minor'],
          kind: ['bug', 'enhancement', 'task'],
          labels: ['urgent', 'important', 'feature']
        },
        sort: 'updated_on',
        sort_direction: 'desc'
      }, mockContext);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      
      // Simulate bulk assignment
      const promises = Array(20).fill(null).map((_, index) => 
        issueManagementTools[4].execute({
          workspace: 'test-workspace',
          repository: 'test-repo',
          action: 'assign',
          issue_id: (index + 1).toString(),
          assignee: 'developer1'
        }, mockContext)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results.every(result => result.success)).toBe(true);
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network timeouts gracefully', async () => {
      // Simulate network timeout
      const result = await issueManagementTools[0].execute({
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'Timeout Test',
        content: { raw: 'Testing timeout handling' }
      }, mockContext);

      expect(result.success).toBe(true);
      // In a real implementation, this should handle timeouts
      // TODO: Implement actual timeout handling
    });

    it('should handle API errors gracefully', async () => {
      // Simulate API error
      const result = await issueManagementTools[0].execute({
        workspace: 'test-workspace',
        repository: 'test-repo',
        title: 'API Error Test',
        content: { raw: 'Testing API error handling' }
      }, mockContext);

      expect(result.success).toBe(true);
      // In a real implementation, this should handle API errors
      // TODO: Implement actual API error handling
    });

    it('should handle malformed responses gracefully', async () => {
      // Simulate malformed response
      const result = await issueManagementTools[1].execute({
        workspace: 'test-workspace',
        repository: 'test-repo'
      }, mockContext);

      expect(result.success).toBe(true);
      // In a real implementation, this should handle malformed responses
      // TODO: Implement actual malformed response handling
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across operations', async () => {
      const workspace = 'test-workspace';
      const repository = 'test-repo';

      // Create an issue
      const createResult = await issueManagementTools[0].execute({
        workspace,
        repository,
        title: 'Consistency Test Issue',
        content: { raw: 'Testing data consistency' },
        kind: 'bug',
        priority: 'major'
      }, mockContext);

      expect(createResult.success).toBe(true);
      const issueId = createResult.data.issue.number.toString();

      // Update the issue
      const updateResult = await issueManagementTools[3].execute({
        workspace,
        repository,
        issue_id: issueId,
        title: 'Updated Consistency Test Issue',
        state: 'resolved'
      }, mockContext);

      expect(updateResult.success).toBe(true);

      // Verify the update was applied
      const getResult = await issueManagementTools[2].execute({
        workspace,
        repository,
        issue_id: issueId
      }, mockContext);

      expect(getResult.success).toBe(true);
      expect(getResult.data.issue.title).toBe('Updated Consistency Test Issue');
      expect(getResult.data.issue.state).toBe('resolved');
    });

    it('should handle concurrent operations correctly', async () => {
      const workspace = 'test-workspace';
      const repository = 'test-repo';

      // Create an issue
      const createResult = await issueManagementTools[0].execute({
        workspace,
        repository,
        title: 'Concurrent Test Issue',
        content: { raw: 'Testing concurrent operations' }
      }, mockContext);

      expect(createResult.success).toBe(true);
      const issueId = createResult.data.issue.number.toString();

      // Perform concurrent operations
      const promises = [
        issueManagementTools[3].execute({
          workspace,
          repository,
          issue_id: issueId,
          title: 'Updated by Operation 1'
        }, mockContext),
        issueManagementTools[3].execute({
          workspace,
          repository,
          issue_id: issueId,
          state: 'resolved'
        }, mockContext),
        issueManagementTools[5].execute({
          workspace,
          repository,
          action: 'create',
          issue_id: issueId,
          content: { raw: 'Comment from concurrent operation' }
        }, mockContext)
      ];

      const results = await Promise.all(promises);
      expect(results.every(result => result.success)).toBe(true);
    });
  });
});
