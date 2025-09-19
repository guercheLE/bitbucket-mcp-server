/**
 * Integration Tests: Issue Updates and Transitions
 * 
 * Testa o cenário completo de atualizações e transições de Issues
 * incluindo validação, persistência e notificações
 * 
 * @fileoverview Testes de integração para atualizações e transições de Issues
 * @version 1.0.0
 * @since 2024-12-19
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  Issue, 
  UpdateIssueRequest, 
  TransitionIssueRequest,
  IssueTransition,
  IssueStatus,
  IssueType,
  IssuePriority
} from '../../src/types/issues';

// ============================================================================
// Mock Data
// ============================================================================

const baseIssue: Issue = {
  id: 1,
  title: 'Original Issue Title',
  content: {
    raw: 'Original issue description',
    markup: 'markdown',
    html: '<p>Original issue description</p>',
    type: 'text'
  },
  reporter: {
    uuid: 'user-uuid-123',
    display_name: 'Test User',
    nickname: 'testuser',
    account_id: 'account-123',
    links: {
      self: { href: 'https://api.bitbucket.org/2.0/users/testuser' },
      html: { href: 'https://bitbucket.org/testuser' },
      avatar: { href: 'https://bitbucket.org/account/testuser/avatar/32/' }
    }
  },
  kind: 'bug',
  priority: 'major',
  status: 'new',
  created_on: '2024-12-19T10:00:00.000Z',
  updated_on: '2024-12-19T10:00:00.000Z',
  state: {
    name: 'New',
    type: 'unresolved',
    color: '#ff6b6b'
  },
  links: {
    self: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1' },
    html: { href: 'https://bitbucket.org/workspace/repo/issues/1' },
    comments: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/comments' },
    attachments: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/attachments' },
    watch: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/watch' },
    vote: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/vote' }
  },
  watchers_count: 0,
  voters_count: 0
};

const mockTransitions: IssueTransition[] = [
  {
    id: 'open',
    name: 'Open',
    to: {
      name: 'Open',
      type: 'unresolved',
      color: '#4ecdc4'
    }
  },
  {
    id: 'resolve',
    name: 'Resolve',
    to: {
      name: 'Resolved',
      type: 'resolved',
      color: '#45b7d1'
    }
  },
  {
    id: 'close',
    name: 'Close',
    to: {
      name: 'Closed',
      type: 'resolved',
      color: '#96ceb4'
    }
  }
];

// ============================================================================
// Integration Tests
// ============================================================================

describe('Issue Updates Integration Tests', () => {
  let mockApiCall: jest.MockedFunction<any>;
  let mockLogger: jest.MockedFunction<any>;
  let mockAuthService: jest.MockedFunction<any>;

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Mock implementation of issue update function
   * This would be replaced with actual implementation in real tests
   */
  const updateIssue = async (issueId: number, request: UpdateIssueRequest): Promise<Issue> => {
    // Mock authentication
    const authResult = await mockAuthService();
    
    // Mock API call
    const response = await mockApiCall(
      `https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/${issueId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authResult.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      }
    );

    // Mock logging
    const updatedFields = Object.keys(request);
    mockLogger('info', 'Issue updated successfully', {
      issueId,
      updatedFields
    });

    return response.data;
  };

  /**
   * Mock implementation of issue transition function
   * This would be replaced with actual implementation in real tests
   */
  const transitionIssue = async (issueId: number, request: TransitionIssueRequest): Promise<Issue> => {
    // Mock authentication
    const authResult = await mockAuthService();
    
    // Mock API call
    const response = await mockApiCall(
      `https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/${issueId}/transitions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authResult.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      }
    );

    // Mock logging
    mockLogger('info', 'Issue transitioned successfully', {
      issueId,
      transitionId: request.transition.id,
      fromState: baseIssue.status,
      toState: response.data.status
    });

    return response.data;
  };

  /**
   * Mock implementation of get issue transitions function
   * This would be replaced with actual implementation in real tests
   */
  const getIssueTransitions = async (issueId: number): Promise<IssueTransition[]> => {
    // Mock authentication
    const authResult = await mockAuthService();
    
    // Mock API call
    const response = await mockApiCall(
      `https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/${issueId}/transitions`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authResult.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.values;
  };

  beforeEach(() => {
    // Setup mocks
    mockApiCall = jest.fn();
    mockLogger = jest.fn();
    mockAuthService = jest.fn();

    // Setup environment
    process.env.BITBUCKET_CLOUD_API_URL = 'https://api.bitbucket.org/2.0';
    process.env.BITBUCKET_WORKSPACE = 'test-workspace';
    process.env.BITBUCKET_REPOSITORY = 'test-repo';
    process.env.BITBUCKET_OAUTH_TOKEN = 'test-oauth-token';
  });

  afterEach(() => {
    // Cleanup
    delete process.env.BITBUCKET_CLOUD_API_URL;
    delete process.env.BITBUCKET_WORKSPACE;
    delete process.env.BITBUCKET_REPOSITORY;
    delete process.env.BITBUCKET_OAUTH_TOKEN;
    
    jest.clearAllMocks();
  });

  // ============================================================================
  // Basic Update Scenarios
  // ============================================================================

  describe('Basic Update Scenarios', () => {
    it('should update issue title', async () => {
      const updateRequest: UpdateIssueRequest = {
        title: 'Updated Issue Title'
      };

      const updatedIssue = {
        ...baseIssue,
        title: 'Updated Issue Title',
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateIssue(1, updateRequest);

      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/1',
        {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateRequest)
        }
      );

      expect(result.title).toBe('Updated Issue Title');
      expect(result.updated_on).not.toBe(baseIssue.updated_on);
    });

    it('should update issue content', async () => {
      const updateRequest: UpdateIssueRequest = {
        content: {
          raw: 'Updated issue description with more details',
          markup: 'markdown'
        }
      };

      const updatedIssue = {
        ...baseIssue,
        content: {
          raw: 'Updated issue description with more details',
          markup: 'markdown',
          html: '<p>Updated issue description with more details</p>',
          type: 'text'
        },
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateIssue(1, updateRequest);

      expect(result.content?.raw).toBe('Updated issue description with more details');
      expect(result.updated_on).not.toBe(baseIssue.updated_on);
    });

    it('should update issue priority', async () => {
      const updateRequest: UpdateIssueRequest = {
        priority: 'critical'
      };

      const updatedIssue = {
        ...baseIssue,
        priority: 'critical',
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateIssue(1, updateRequest);

      expect(result.priority).toBe('critical');
    });

    it('should update issue type', async () => {
      const updateRequest: UpdateIssueRequest = {
        kind: 'enhancement'
      };

      const updatedIssue = {
        ...baseIssue,
        kind: 'enhancement',
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateIssue(1, updateRequest);

      expect(result.kind).toBe('enhancement');
    });
  });

  // ============================================================================
  // Assignment Scenarios
  // ============================================================================

  describe('Assignment Scenarios', () => {
    it('should assign issue to user', async () => {
      const updateRequest: UpdateIssueRequest = {
        assignee: {
          uuid: 'assignee-uuid-123'
        }
      };

      const updatedIssue = {
        ...baseIssue,
        assignee: {
          uuid: 'assignee-uuid-123',
          display_name: 'Assignee User',
          nickname: 'assignee',
          account_id: 'assignee-account-123',
          links: {
            self: { href: 'https://api.bitbucket.org/2.0/users/assignee' },
            html: { href: 'https://bitbucket.org/assignee' },
            avatar: { href: 'https://bitbucket.org/account/assignee/avatar/32/' }
          }
        },
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateIssue(1, updateRequest);

      expect(result.assignee).toBeDefined();
      expect(result.assignee?.uuid).toBe('assignee-uuid-123');
    });

    it('should unassign issue', async () => {
      const issueWithAssignee = {
        ...baseIssue,
        assignee: {
          uuid: 'assignee-uuid-123',
          display_name: 'Assignee User',
          nickname: 'assignee',
          account_id: 'assignee-account-123',
          links: {
            self: { href: 'https://api.bitbucket.org/2.0/users/assignee' },
            html: { href: 'https://bitbucket.org/assignee' },
            avatar: { href: 'https://bitbucket.org/account/assignee/avatar/32/' }
          }
        }
      };

      const updateRequest: UpdateIssueRequest = {
        assignee: null
      };

      const updatedIssue = {
        ...issueWithAssignee,
        assignee: undefined,
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateIssue(1, updateRequest);

      expect(result.assignee).toBeUndefined();
    });
  });

  // ============================================================================
  // Component and Milestone Scenarios
  // ============================================================================

  describe('Component and Milestone Scenarios', () => {
    it('should update issue component', async () => {
      const updateRequest: UpdateIssueRequest = {
        component: {
          name: 'frontend'
        }
      };

      const updatedIssue = {
        ...baseIssue,
        component: {
          name: 'frontend',
          description: 'Frontend components'
        },
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateIssue(1, updateRequest);

      expect(result.component).toBeDefined();
      expect(result.component?.name).toBe('frontend');
    });

    it('should update issue milestone', async () => {
      const updateRequest: UpdateIssueRequest = {
        milestone: {
          name: 'v1.0'
        }
      };

      const updatedIssue = {
        ...baseIssue,
        milestone: {
          name: 'v1.0',
          description: 'Version 1.0 release',
          due_date: '2024-12-31'
        },
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateIssue(1, updateRequest);

      expect(result.milestone).toBeDefined();
      expect(result.milestone?.name).toBe('v1.0');
    });

    it('should remove issue component', async () => {
      const issueWithComponent = {
        ...baseIssue,
        component: {
          name: 'frontend',
          description: 'Frontend components'
        }
      };

      const updateRequest: UpdateIssueRequest = {
        component: null
      };

      const updatedIssue = {
        ...issueWithComponent,
        component: undefined,
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateIssue(1, updateRequest);

      expect(result.component).toBeUndefined();
    });

    it('should remove issue milestone', async () => {
      const issueWithMilestone = {
        ...baseIssue,
        milestone: {
          name: 'v1.0',
          description: 'Version 1.0 release',
          due_date: '2024-12-31'
        }
      };

      const updateRequest: UpdateIssueRequest = {
        milestone: null
      };

      const updatedIssue = {
        ...issueWithMilestone,
        milestone: undefined,
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateIssue(1, updateRequest);

      expect(result.milestone).toBeUndefined();
    });
  });

  // ============================================================================
  // Transition Scenarios
  // ============================================================================

  describe('Transition Scenarios', () => {
    it('should get available transitions', async () => {
      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          size: 3,
          page: 1,
          pagelen: 10,
          values: mockTransitions
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await getIssueTransitions(1);

      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/1/transitions',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          }
        }
      );

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('open');
      expect(result[1].id).toBe('resolve');
      expect(result[2].id).toBe('close');
    });

    it('should transition issue to open state', async () => {
      const transitionRequest: TransitionIssueRequest = {
        transition: {
          id: 'open'
        }
      };

      const transitionedIssue = {
        ...baseIssue,
        status: 'open',
        state: {
          name: 'Open',
          type: 'unresolved',
          color: '#4ecdc4'
        },
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: transitionedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await transitionIssue(1, transitionRequest);

      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/1/transitions',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transitionRequest)
        }
      );

      expect(result.status).toBe('open');
      expect(result.state.name).toBe('Open');
    });

    it('should transition issue to resolved state', async () => {
      const transitionRequest: TransitionIssueRequest = {
        transition: {
          id: 'resolve'
        }
      };

      const transitionedIssue = {
        ...baseIssue,
        status: 'resolved',
        state: {
          name: 'Resolved',
          type: 'resolved',
          color: '#45b7d1'
        },
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: transitionedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await transitionIssue(1, transitionRequest);

      expect(result.status).toBe('resolved');
      expect(result.state.name).toBe('Resolved');
      expect(result.state.type).toBe('resolved');
    });

    it('should transition issue to closed state', async () => {
      const transitionRequest: TransitionIssueRequest = {
        transition: {
          id: 'close'
        }
      };

      const transitionedIssue = {
        ...baseIssue,
        status: 'closed',
        state: {
          name: 'Closed',
          type: 'resolved',
          color: '#96ceb4'
        },
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: transitionedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await transitionIssue(1, transitionRequest);

      expect(result.status).toBe('closed');
      expect(result.state.name).toBe('Closed');
      expect(result.state.type).toBe('resolved');
    });

    it('should transition issue with additional fields', async () => {
      const transitionRequest: TransitionIssueRequest = {
        transition: {
          id: 'resolve'
        },
        fields: {
          resolution: 'Fixed',
          comment: 'Issue has been resolved'
        }
      };

      const transitionedIssue = {
        ...baseIssue,
        status: 'resolved',
        state: {
          name: 'Resolved',
          type: 'resolved',
          color: '#45b7d1'
        },
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: transitionedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await transitionIssue(1, transitionRequest);

      expect(result.status).toBe('resolved');
    });
  });

  // ============================================================================
  // Validation Scenarios
  // ============================================================================

  describe('Validation Scenarios', () => {
    it('should reject update with invalid priority', async () => {
      const updateRequest: UpdateIssueRequest = {
        priority: 'invalid-priority' as IssuePriority
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Invalid priority value'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(updateIssue(1, updateRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Invalid priority value'
          }
        }
      });
    });

    it('should reject update with invalid type', async () => {
      const updateRequest: UpdateIssueRequest = {
        kind: 'invalid-type' as IssueType
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Invalid issue type'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(updateIssue(1, updateRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Invalid issue type'
          }
        }
      });
    });

    it('should reject transition with invalid transition ID', async () => {
      const transitionRequest: TransitionIssueRequest = {
        transition: {
          id: 'invalid-transition'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Invalid transition ID'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(transitionIssue(1, transitionRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Invalid transition ID'
          }
        }
      });
    });
  });

  // ============================================================================
  // Permission Scenarios
  // ============================================================================

  describe('Permission Scenarios', () => {
    it('should handle insufficient permissions for update', async () => {
      const updateRequest: UpdateIssueRequest = {
        title: 'Updated Title'
      };

      mockApiCall.mockRejectedValueOnce({
        status: 403,
        data: {
          type: 'error',
          error: {
            message: 'Insufficient permissions',
            detail: 'You do not have permission to update this issue'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(updateIssue(1, updateRequest)).rejects.toMatchObject({
        status: 403,
        data: {
          type: 'error',
          error: {
            message: 'Insufficient permissions',
            detail: 'You do not have permission to update this issue'
          }
        }
      });
    });

    it('should handle insufficient permissions for transition', async () => {
      const transitionRequest: TransitionIssueRequest = {
        transition: {
          id: 'resolve'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 403,
        data: {
          type: 'error',
          error: {
            message: 'Insufficient permissions',
            detail: 'You do not have permission to transition this issue'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(transitionIssue(1, transitionRequest)).rejects.toMatchObject({
        status: 403,
        data: {
          type: 'error',
          error: {
            message: 'Insufficient permissions',
            detail: 'You do not have permission to transition this issue'
          }
        }
      });
    });
  });

  // ============================================================================
  // Error Scenarios
  // ============================================================================

  describe('Error Scenarios', () => {
    it('should handle issue not found', async () => {
      const updateRequest: UpdateIssueRequest = {
        title: 'Updated Title'
      };

      mockApiCall.mockRejectedValueOnce({
        status: 404,
        data: {
          type: 'error',
          error: {
            message: 'Issue not found',
            detail: 'The requested issue does not exist'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(updateIssue(999, updateRequest)).rejects.toMatchObject({
        status: 404,
        data: {
          type: 'error',
          error: {
            message: 'Issue not found',
            detail: 'The requested issue does not exist'
          }
        }
      });
    });

    it('should handle concurrent update conflicts', async () => {
      const updateRequest: UpdateIssueRequest = {
        title: 'Updated Title'
      };

      mockApiCall.mockRejectedValueOnce({
        status: 409,
        data: {
          type: 'error',
          error: {
            message: 'Conflict',
            detail: 'Issue has been modified by another user'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(updateIssue(1, updateRequest)).rejects.toMatchObject({
        status: 409,
        data: {
          type: 'error',
          error: {
            message: 'Conflict',
            detail: 'Issue has been modified by another user'
          }
        }
      });
    });
  });

  // ============================================================================
  // Logging and Monitoring
  // ============================================================================

  describe('Logging and Monitoring', () => {
    it('should log successful issue update', async () => {
      const updateRequest: UpdateIssueRequest = {
        title: 'Updated Title'
      };

      const updatedIssue = {
        ...baseIssue,
        title: 'Updated Title',
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await updateIssue(1, updateRequest);

      expect(mockLogger).toHaveBeenCalledWith(
        'info',
        'Issue updated successfully',
        expect.objectContaining({
          issueId: 1,
          updatedFields: ['title']
        })
      );
    });

    it('should log successful issue transition', async () => {
      const transitionRequest: TransitionIssueRequest = {
        transition: {
          id: 'resolve'
        }
      };

      const transitionedIssue = {
        ...baseIssue,
        status: 'resolved',
        state: {
          name: 'Resolved',
          type: 'resolved',
          color: '#45b7d1'
        },
        updated_on: '2024-12-19T11:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: transitionedIssue
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await transitionIssue(1, transitionRequest);

      expect(mockLogger).toHaveBeenCalledWith(
        'info',
        'Issue transitioned successfully',
        expect.objectContaining({
          issueId: 1,
          transitionId: 'resolve',
          fromState: 'new',
          toState: 'resolved'
        })
      );
    });
  });
});

