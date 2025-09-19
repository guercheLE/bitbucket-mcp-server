/**
 * Integration tests for Issue transitions workflow
 * 
 * This test suite covers the complete workflow of transitioning issues
 * through different states, including validation, permissions, and
 * state machine compliance.
 * 
 * @fileoverview Integration tests for issue transitions
 * @author Bitbucket MCP Server Team
 * @version 1.0.0
 */

import { Issue, IssueStatus, IssueTransition, TransitionIssueRequest } from '../../src/types/issues';

// ============================================================================
// Test Data
// ============================================================================

const mockIssue: Issue = {
  id: 1,
  title: 'Test Issue',
  content: {
    raw: 'Test issue description',
    markup: 'markdown',
    html: '<p>Test issue description</p>',
    type: 'text'
  },
  state: {
    name: 'new',
    type: 'unresolved',
    color: '#ff6b6b'
  },
  kind: 'bug',
  priority: 'major',
  status: 'new',
  created_on: '2024-12-19T10:00:00.000Z',
  updated_on: '2024-12-19T10:00:00.000Z',
  reporter: {
    uuid: 'reporter-uuid-123',
    display_name: 'Reporter User',
    nickname: 'reporter',
    account_id: 'reporter-account-123',
    links: {
      self: { href: 'https://api.bitbucket.org/2.0/users/reporter' },
      html: { href: 'https://bitbucket.org/reporter' },
      avatar: { href: 'https://bitbucket.org/account/reporter/avatar/32/' }
    }
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
    id: 'new-to-open',
    name: 'Open',
    to: {
      name: 'open',
      type: 'unresolved',
      color: '#ff6b6b'
    }
  },
  {
    id: 'new-to-resolved',
    name: 'Resolve',
    to: {
      name: 'resolved',
      type: 'resolved',
      color: '#51cf66'
    }
  },
  {
    id: 'open-to-resolved',
    name: 'Resolve',
    to: {
      name: 'resolved',
      type: 'resolved',
      color: '#51cf66'
    }
  },
  {
    id: 'open-to-closed',
    name: 'Close',
    to: {
      name: 'closed',
      type: 'resolved',
      color: '#868e96'
    }
  },
  {
    id: 'resolved-to-closed',
    name: 'Close',
    to: {
      name: 'closed',
      type: 'resolved',
      color: '#868e96'
    }
  },
  {
    id: 'resolved-to-open',
    name: 'Reopen',
    to: {
      name: 'open',
      type: 'unresolved',
      color: '#ff6b6b'
    }
  }
];

const mockTransitionRequest: TransitionIssueRequest = {
  transition: {
    id: 'new-to-open'
  }
};

// ============================================================================
// Test Suite
// ============================================================================

describe('Issue Transitions Integration Tests', () => {
  let mockApiCall: jest.MockedFunction<any>;
  let mockLogger: jest.MockedFunction<any>;
  let mockAuthService: jest.MockedFunction<any>;

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Mock implementation of get issue transitions function
   * This would be replaced with actual implementation in real tests
   */
  const getIssueTransitions = async (issueId: number): Promise<IssueTransition[]> => {
    // Mock authentication
    const authResult = await mockAuthService();
    
    // Mock API call
    const response = await mockApiCall(
      `${process.env.BITBUCKET_CLOUD_API_URL}/repositories/${process.env.BITBUCKET_WORKSPACE}/${process.env.BITBUCKET_REPOSITORY}/issues/${issueId}/transitions`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authResult.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Mock logging
    mockLogger('info', 'Issue transitions retrieved successfully', {
      issueId,
      transitionCount: response.data.transitions.length
    });

    return response.data.transitions;
  };

  /**
   * Mock implementation of transition issue function
   * This would be replaced with actual implementation in real tests
   */
  const transitionIssue = async (issueId: number, request: TransitionIssueRequest): Promise<Issue> => {
    // Mock authentication
    const authResult = await mockAuthService();
    
    // Mock API call
    const response = await mockApiCall(
      `${process.env.BITBUCKET_CLOUD_API_URL}/repositories/${process.env.BITBUCKET_WORKSPACE}/${process.env.BITBUCKET_REPOSITORY}/issues/${issueId}/transitions`,
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
      newState: response.data.state
    });

    return response.data;
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
  });

  // ============================================================================
  // Get Transitions Tests
  // ============================================================================

  describe('Get Issue Transitions', () => {
    it('should retrieve available transitions for new issue', async () => {
      const newIssueTransitions = mockTransitions.filter(t => 
        t.id === 'new-to-open' || t.id === 'new-to-resolved'
      );

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          transitions: newIssueTransitions
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await getIssueTransitions(1);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('new-to-open');
      expect(result[1].id).toBe('new-to-resolved');
    });

    it('should retrieve available transitions for open issue', async () => {
      const openIssueTransitions = mockTransitions.filter(t => 
        t.id === 'open-to-resolved' || t.id === 'open-to-closed'
      );

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          transitions: openIssueTransitions
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await getIssueTransitions(2);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('open-to-resolved');
      expect(result[1].id).toBe('open-to-closed');
    });

    it('should retrieve available transitions for resolved issue', async () => {
      const resolvedIssueTransitions = mockTransitions.filter(t => 
        t.id === 'resolved-to-closed' || t.id === 'resolved-to-open'
      );

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          transitions: resolvedIssueTransitions
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await getIssueTransitions(3);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('resolved-to-closed');
      expect(result[1].id).toBe('resolved-to-open');
    });

    it('should return empty transitions for closed issue', async () => {
      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          transitions: []
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await getIssueTransitions(4);

      expect(result).toHaveLength(0);
    });

    it('should handle issue not found', async () => {
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

      await expect(getIssueTransitions(999)).rejects.toMatchObject({
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
  });

  // ============================================================================
  // Transition Issue Tests
  // ============================================================================

  describe('Transition Issue', () => {
    it('should transition issue from new to open', async () => {
      const transitionedIssue = {
        ...mockIssue,
        state: 'open',
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

      const result = await transitionIssue(1, mockTransitionRequest);

      expect(result.state).toBe('open');
      expect(result.updated_on).toBe('2024-12-19T11:00:00.000Z');
    });

    it('should transition issue from new to resolved', async () => {
      const transitionRequest = {
        transition: {
          id: 'new-to-resolved'
        }
      };

      const transitionedIssue = {
        ...mockIssue,
        state: 'resolved',
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

      expect(result.state).toBe('resolved');
    });

    it('should transition issue from open to resolved', async () => {
      const openIssue = {
        ...mockIssue,
        state: 'open'
      };

      const transitionRequest = {
        transition: {
          id: 'open-to-resolved'
        }
      };

      const transitionedIssue = {
        ...openIssue,
        state: 'resolved',
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

      const result = await transitionIssue(2, transitionRequest);

      expect(result.state).toBe('resolved');
    });

    it('should transition issue from resolved to closed', async () => {
      const resolvedIssue = {
        ...mockIssue,
        state: 'resolved'
      };

      const transitionRequest = {
        transition: {
          id: 'resolved-to-closed'
        }
      };

      const transitionedIssue = {
        ...resolvedIssue,
        state: 'closed',
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

      const result = await transitionIssue(3, transitionRequest);

      expect(result.state).toBe('closed');
    });

    it('should transition issue from resolved to open (reopen)', async () => {
      const resolvedIssue = {
        ...mockIssue,
        state: 'resolved'
      };

      const transitionRequest = {
        transition: {
          id: 'resolved-to-open'
        }
      };

      const transitionedIssue = {
        ...resolvedIssue,
        state: 'open',
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

      const result = await transitionIssue(3, transitionRequest);

      expect(result.state).toBe('open');
    });
  });

  // ============================================================================
  // Validation Scenarios
  // ============================================================================

  describe('Validation Scenarios', () => {
    it('should reject invalid transition', async () => {
      const invalidTransitionRequest = {
        transition: {
          id: 'invalid-transition'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid transition',
            detail: 'The specified transition is not available for this issue'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(transitionIssue(1, invalidTransitionRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid transition',
            detail: 'The specified transition is not available for this issue'
          }
        }
      });
    });

    it('should reject transition from closed issue', async () => {
      const closedIssueTransitionRequest: TransitionIssueRequest = {
        transition: {
          id: 'closed-to-open'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid transition',
            detail: 'Cannot transition from closed state'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(transitionIssue(4, closedIssueTransitionRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid transition',
            detail: 'Cannot transition from closed state'
          }
        }
      });
    });

    it('should reject transition with missing transition ID', async () => {
      const invalidRequest: TransitionIssueRequest = {
        transition: {
          id: ''
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Transition ID is required'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(transitionIssue(1, invalidRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Transition ID is required'
          }
        }
      });
    });
  });

  // ============================================================================
  // Permission Scenarios
  // ============================================================================

  describe('Permission Scenarios', () => {
    it('should handle insufficient permissions for transition', async () => {
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

      await expect(transitionIssue(1, mockTransitionRequest)).rejects.toMatchObject({
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

    it('should handle repository not found', async () => {
      mockApiCall.mockRejectedValueOnce({
        status: 404,
        data: {
          type: 'error',
          error: {
            message: 'Repository not found',
            detail: 'The requested repository does not exist'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(transitionIssue(1, mockTransitionRequest)).rejects.toMatchObject({
        status: 404,
        data: {
          type: 'error',
          error: {
            message: 'Repository not found',
            detail: 'The requested repository does not exist'
          }
        }
      });
    });
  });

  // ============================================================================
  // Workflow Scenarios
  // ============================================================================

  describe('Workflow Scenarios', () => {
    it('should complete full issue lifecycle', async () => {
      // Step 1: Get transitions for new issue
      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          transitions: mockTransitions.filter(t => 
            t.id === 'new-to-open' || t.id === 'new-to-resolved'
          )
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const transitions = await getIssueTransitions(1);
      expect(transitions).toHaveLength(2);

      // Step 2: Transition to open
      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          ...mockIssue,
          state: 'open',
          updated_on: '2024-12-19T11:00:00.000Z'
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const openIssue = await transitionIssue(1, { transition: { id: 'new-to-open' } });
      expect(openIssue.state).toBe('open');

      // Step 3: Get transitions for open issue
      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          transitions: mockTransitions.filter(t => 
            t.id === 'open-to-resolved' || t.id === 'open-to-closed'
          )
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const openTransitions = await getIssueTransitions(1);
      expect(openTransitions).toHaveLength(2);

      // Step 4: Transition to resolved
      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          ...openIssue,
          state: 'resolved',
          updated_on: '2024-12-19T12:00:00.000Z'
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const resolvedIssue = await transitionIssue(1, { transition: { id: 'open-to-resolved' } });
      expect(resolvedIssue.state).toBe('resolved');

      // Step 5: Transition to closed
      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          ...resolvedIssue,
          state: 'closed',
          updated_on: '2024-12-19T13:00:00.000Z'
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const closedIssue = await transitionIssue(1, { transition: { id: 'resolved-to-closed' } });
      expect(closedIssue.state).toBe('closed');
    });

    it('should handle reopen workflow', async () => {
      // Start with resolved issue
      const resolvedIssue = {
        ...mockIssue,
        state: 'resolved'
      };

      // Get transitions for resolved issue
      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          transitions: mockTransitions.filter(t => 
            t.id === 'resolved-to-closed' || t.id === 'resolved-to-open'
          )
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const transitions = await getIssueTransitions(3);
      expect(transitions).toHaveLength(2);

      // Reopen issue
      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: {
          ...resolvedIssue,
          state: 'open',
          updated_on: '2024-12-19T11:00:00.000Z'
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const reopenedIssue = await transitionIssue(3, { transition: { id: 'resolved-to-open' } });
      expect(reopenedIssue.state).toBe('open');
    });
  });

  // ============================================================================
  // Logging and Monitoring
  // ============================================================================

  describe('Logging and Monitoring', () => {
    it('should log successful transition', async () => {
      const transitionedIssue = {
        ...mockIssue,
        state: 'open',
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

      await transitionIssue(1, mockTransitionRequest);

      expect(mockLogger).toHaveBeenCalledWith(
        'info',
        'Issue transitioned successfully',
        expect.objectContaining({
          issueId: 1,
          transitionId: 'new-to-open',
          newState: 'open'
        })
      );
    });

    it('should log failed transition', async () => {
      const error = {
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid transition',
            detail: 'The specified transition is not available for this issue'
          }
        }
      };

      mockApiCall.mockRejectedValueOnce(error);

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(transitionIssue(1, { transition: { id: 'invalid-transition' } } as TransitionIssueRequest)).rejects.toMatchObject(error);

      expect(mockLogger).toHaveBeenCalledWith(
        'error',
        'Failed to transition issue',
        expect.objectContaining({
          issueId: 1,
          transitionId: 'invalid-transition',
          error: error.data.error.message
        })
      );
    });

    it('should log performance metrics', async () => {
      const transitionedIssue = {
        ...mockIssue,
        state: 'open',
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

      const startTime = Date.now();
      await transitionIssue(1, mockTransitionRequest);
      const endTime = Date.now();

      expect(mockLogger).toHaveBeenCalledWith(
        'info',
        'Issue transition performance',
        expect.objectContaining({
          operation: 'transition_issue',
          duration: expect.any(Number),
          success: true
        })
      );
    });
  });
});
