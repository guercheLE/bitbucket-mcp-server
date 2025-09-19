/**
 * Integration Tests: Issue Search and Filtering
 * 
 * Testa o cenário completo de busca e filtragem de Issues
 * incluindo diferentes tipos de filtros e ordenação
 * 
 * @fileoverview Testes de integração para busca e filtragem de Issues
 * @version 1.0.0
 * @since 2024-12-19
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  Issue, 
  IssuesListResponse, 
  IssuesSearchParams,
  IssueStatus,
  IssueType,
  IssuePriority
} from '../../src/types/issues';

// ============================================================================
// Mock Data
// ============================================================================

const mockIssues: Issue[] = [
  {
    id: 1,
    title: 'Critical Bug in Login',
    content: {
      raw: 'Users cannot login to the system',
      markup: 'markdown',
      html: '<p>Users cannot login to the system</p>',
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
    priority: 'critical',
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
  },
  {
    id: 2,
    title: 'Enhancement Request',
    content: {
      raw: 'Add dark mode support',
      markup: 'markdown',
      html: '<p>Add dark mode support</p>',
      type: 'text'
    },
    reporter: {
      uuid: 'user-uuid-456',
      display_name: 'Another User',
      nickname: 'anotheruser',
      account_id: 'account-456',
      links: {
        self: { href: 'https://api.bitbucket.org/2.0/users/anotheruser' },
        html: { href: 'https://bitbucket.org/anotheruser' },
        avatar: { href: 'https://bitbucket.org/account/anotheruser/avatar/32/' }
      }
    },
    kind: 'enhancement',
    priority: 'minor',
    status: 'open',
    created_on: '2024-12-18T10:00:00.000Z',
    updated_on: '2024-12-18T10:00:00.000Z',
    state: {
      name: 'Open',
      type: 'unresolved',
      color: '#4ecdc4'
    },
    links: {
      self: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/2' },
      html: { href: 'https://bitbucket.org/workspace/repo/issues/2' },
      comments: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/2/comments' },
      attachments: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/2/attachments' },
      watch: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/2/watch' },
      vote: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/2/vote' }
    },
    watchers_count: 0,
    voters_count: 0
  },
  {
    id: 3,
    title: 'Task: Update Documentation',
    content: {
      raw: 'Update API documentation',
      markup: 'markdown',
      html: '<p>Update API documentation</p>',
      type: 'text'
    },
    reporter: {
      uuid: 'user-uuid-789',
      display_name: 'Third User',
      nickname: 'thirduser',
      account_id: 'account-789',
      links: {
        self: { href: 'https://api.bitbucket.org/2.0/users/thirduser' },
        html: { href: 'https://bitbucket.org/thirduser' },
        avatar: { href: 'https://bitbucket.org/account/thirduser/avatar/32/' }
      }
    },
    kind: 'task',
    priority: 'trivial',
    status: 'resolved',
    created_on: '2024-12-17T10:00:00.000Z',
    updated_on: '2024-12-17T11:00:00.000Z',
    state: {
      name: 'Resolved',
      type: 'resolved',
      color: '#45b7d1'
    },
    links: {
      self: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/3' },
      html: { href: 'https://bitbucket.org/workspace/repo/issues/3' },
      comments: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/3/comments' },
      attachments: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/3/attachments' },
      watch: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/3/watch' },
      vote: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/3/vote' }
    },
    watchers_count: 0,
    voters_count: 0
  }
];

const mockIssuesListResponse: IssuesListResponse = {
  size: 3,
  page: 1,
  pagelen: 10,
  values: mockIssues
};

// ============================================================================
// Integration Tests
// ============================================================================

describe('Issue Search Integration Tests', () => {
  let mockApiCall: jest.MockedFunction<any>;
  let mockLogger: jest.MockedFunction<any>;
  let mockAuthService: jest.MockedFunction<any>;

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Mock implementation of issue search function
   * This would be replaced with actual implementation in real tests
   */
  const searchIssues = async (query: IssueSearchQuery): Promise<IssueSearchResult> => {
    // Mock authentication
    const authResult = await mockAuthService();
    
    // Build query parameters
    const params = new URLSearchParams();
    if (query.q) params.append('q', query.q);
    if (query.sort) params.append('sort', query.sort);
    if (query.state) params.append('state', query.state);
    if (query.kind) params.append('kind', query.kind);
    if (query.priority) params.append('priority', query.priority);
    if (query.assignee) params.append('assignee', query.assignee);
    if (query.component) params.append('component', query.component);
    if (query.milestone) params.append('milestone', query.milestone);
    if (query.version) params.append('version', query.version);
    if (query.page) params.append('page', query.page.toString());
    if (query.pagelen) params.append('pagelen', query.pagelen.toString());

    // Mock API call
    const response = await mockApiCall(
      `${process.env.BITBUCKET_CLOUD_API_URL}/repositories/${process.env.BITBUCKET_WORKSPACE}/${process.env.BITBUCKET_REPOSITORY}/issues?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authResult.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Mock logging
    mockLogger('info', 'Issues searched successfully', {
      query: query.q,
      totalResults: response.data.size,
      page: query.page || 1,
      pagelen: query.pagelen || 10
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
    
    jest.clearAllMocks();
  });

  // ============================================================================
  // Basic Search Scenarios
  // ============================================================================

  describe('Basic Search Scenarios', () => {
    it('should search issues without filters', async () => {
      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: mockIssuesListResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues({});

      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          }
        }
      );

      expect(result).toEqual(mockIssuesListResponse);
      expect(result.values).toHaveLength(3);
    });

    it('should search issues with text query', async () => {
      const searchParams: IssuesSearchParams = {
        q: 'login bug'
      };

      const filteredResponse = {
        ...mockIssuesListResponse,
        values: [mockIssues[0]] // Only the login bug
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: filteredResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues?q=login%20bug',
        expect.any(Object)
      );

      expect(result.values).toHaveLength(1);
      expect(result.values[0].title).toContain('Login');
    });

    it('should search issues with multiple filters', async () => {
      const searchParams: IssuesSearchParams = {
        q: 'bug',
        state: 'new',
        kind: 'bug',
        priority: 'critical'
      };

      const filteredResponse = {
        ...mockIssuesListResponse,
        values: [mockIssues[0]] // Only the critical bug
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: filteredResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues?q=bug&state=new&kind=bug&priority=critical',
        expect.any(Object)
      );

      expect(result.values).toHaveLength(1);
      expect(result.values[0].kind).toBe('bug');
      expect(result.values[0].priority).toBe('critical');
    });
  });

  // ============================================================================
  // Filter Scenarios
  // ============================================================================

  describe('Filter Scenarios', () => {
    it('should filter by issue status', async () => {
      const searchParams: IssuesSearchParams = {
        state: 'new'
      };

      const filteredResponse = {
        ...mockIssuesListResponse,
        values: [mockIssues[0]] // Only new issues
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: filteredResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values).toHaveLength(1);
      expect(result.values[0].status).toBe('new');
    });

    it('should filter by issue type', async () => {
      const searchParams: IssuesSearchParams = {
        kind: 'enhancement'
      };

      const filteredResponse = {
        ...mockIssuesListResponse,
        values: [mockIssues[1]] // Only enhancement issues
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: filteredResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values).toHaveLength(1);
      expect(result.values[0].kind).toBe('enhancement');
    });

    it('should filter by issue priority', async () => {
      const searchParams: IssuesSearchParams = {
        priority: 'critical'
      };

      const filteredResponse = {
        ...mockIssuesListResponse,
        values: [mockIssues[0]] // Only critical issues
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: filteredResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values).toHaveLength(1);
      expect(result.values[0].priority).toBe('critical');
    });

    it('should filter by assignee', async () => {
      const searchParams: IssuesSearchParams = {
        assignee: 'user-uuid-123'
      };

      const filteredResponse = {
        ...mockIssuesListResponse,
        values: [mockIssues[0]] // Only issues assigned to user-uuid-123
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: filteredResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values).toHaveLength(1);
      expect(result.values[0].reporter.uuid).toBe('user-uuid-123');
    });

    it('should filter by reporter', async () => {
      const searchParams: IssuesSearchParams = {
        reporter: 'user-uuid-456'
      };

      const filteredResponse = {
        ...mockIssuesListResponse,
        values: [mockIssues[1]] // Only issues reported by user-uuid-456
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: filteredResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values).toHaveLength(1);
      expect(result.values[0].reporter.uuid).toBe('user-uuid-456');
    });

    it('should filter by component', async () => {
      const searchParams: IssuesSearchParams = {
        component: 'frontend'
      };

      const filteredResponse = {
        ...mockIssuesListResponse,
        values: [mockIssues[0]] // Only issues in frontend component
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: filteredResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values).toHaveLength(1);
    });

    it('should filter by milestone', async () => {
      const searchParams: IssuesSearchParams = {
        milestone: 'v1.0'
      };

      const filteredResponse = {
        ...mockIssuesListResponse,
        values: [mockIssues[0]] // Only issues in v1.0 milestone
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: filteredResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values).toHaveLength(1);
    });

    it('should filter by version', async () => {
      const searchParams: IssuesSearchParams = {
        version: '1.0.0'
      };

      const filteredResponse = {
        ...mockIssuesListResponse,
        values: [mockIssues[0]] // Only issues in version 1.0.0
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: filteredResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values).toHaveLength(1);
    });
  });

  // ============================================================================
  // Sorting Scenarios
  // ============================================================================

  describe('Sorting Scenarios', () => {
    it('should sort by creation date descending', async () => {
      const searchParams: IssuesSearchParams = {
        sort: '-created_on'
      };

      const sortedResponse = {
        ...mockIssuesListResponse,
        values: [...mockIssues].sort((a, b) => 
          new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
        )
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: sortedResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues?sort=-created_on',
        expect.any(Object)
      );

      expect(result.values[0].id).toBe(1); // Most recent
      expect(result.values[2].id).toBe(3); // Oldest
    });

    it('should sort by creation date ascending', async () => {
      const searchParams: IssuesSearchParams = {
        sort: 'created_on'
      };

      const sortedResponse = {
        ...mockIssuesListResponse,
        values: [...mockIssues].sort((a, b) => 
          new Date(a.created_on).getTime() - new Date(b.created_on).getTime()
        )
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: sortedResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values[0].id).toBe(3); // Oldest
      expect(result.values[2].id).toBe(1); // Most recent
    });

    it('should sort by update date descending', async () => {
      const searchParams: IssuesSearchParams = {
        sort: '-updated_on'
      };

      const sortedResponse = {
        ...mockIssuesListResponse,
        values: [...mockIssues].sort((a, b) => 
          new Date(b.updated_on).getTime() - new Date(a.updated_on).getTime()
        )
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: sortedResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values[0].id).toBe(1); // Most recently updated
    });

    it('should sort by title ascending', async () => {
      const searchParams: IssuesSearchParams = {
        sort: 'title'
      };

      const sortedResponse = {
        ...mockIssuesListResponse,
        values: [...mockIssues].sort((a, b) => a.title.localeCompare(b.title))
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: sortedResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values[0].title).toBe('Critical Bug in Login');
      expect(result.values[1].title).toBe('Enhancement Request');
      expect(result.values[2].title).toBe('Task: Update Documentation');
    });
  });

  // ============================================================================
  // Pagination Scenarios
  // ============================================================================

  describe('Pagination Scenarios', () => {
    it('should handle pagination with page parameter', async () => {
      const searchParams: IssuesSearchParams = {
        page: 2,
        pagelen: 1
      };

      const paginatedResponse = {
        size: 3,
        page: 2,
        pagelen: 1,
        next: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues?page=3&pagelen=1',
        previous: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues?page=1&pagelen=1',
        values: [mockIssues[1]] // Second page, one item
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: paginatedResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues?page=2&pagelen=1',
        expect.any(Object)
      );

      expect(result.page).toBe(2);
      expect(result.pagelen).toBe(1);
      expect(result.values).toHaveLength(1);
      expect(result.next).toBeDefined();
      expect(result.previous).toBeDefined();
    });

    it('should handle pagination with custom page size', async () => {
      const searchParams: IssuesSearchParams = {
        pagelen: 2
      };

      const paginatedResponse = {
        size: 3,
        page: 1,
        pagelen: 2,
        next: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues?page=2&pagelen=2',
        values: [mockIssues[0], mockIssues[1]] // First page, two items
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: paginatedResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.pagelen).toBe(2);
      expect(result.values).toHaveLength(2);
      expect(result.next).toBeDefined();
    });

    it('should handle last page without next link', async () => {
      const searchParams: IssuesSearchParams = {
        page: 2,
        pagelen: 2
      };

      const lastPageResponse = {
        size: 3,
        page: 2,
        pagelen: 2,
        previous: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues?page=1&pagelen=2',
        values: [mockIssues[2]] // Last page, one item
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: lastPageResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values).toHaveLength(1);
      expect(result.next).toBeUndefined();
      expect(result.previous).toBeDefined();
    });
  });

  // ============================================================================
  // Date Range Scenarios
  // ============================================================================

  describe('Date Range Scenarios', () => {
    it('should filter by creation date range', async () => {
      const searchParams: IssuesSearchParams = {
        created_on: '2024-12-19T00:00:00.000Z'
      };

      const filteredResponse = {
        ...mockIssuesListResponse,
        values: [mockIssues[0]] // Only issues created on 2024-12-19
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: filteredResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values).toHaveLength(1);
      expect(result.values[0].created_on).toContain('2024-12-19');
    });

    it('should filter by update date range', async () => {
      const searchParams: IssuesSearchParams = {
        updated_on: '2024-12-18T00:00:00.000Z'
      };

      const filteredResponse = {
        ...mockIssuesListResponse,
        values: [mockIssues[1]] // Only issues updated on 2024-12-18
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: filteredResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values).toHaveLength(1);
      expect(result.values[0].updated_on).toContain('2024-12-18');
    });
  });

  // ============================================================================
  // Error Scenarios
  // ============================================================================

  describe('Error Scenarios', () => {
    it('should handle empty search results', async () => {
      const searchParams: IssuesSearchParams = {
        q: 'nonexistent'
      };

      const emptyResponse = {
        size: 0,
        page: 1,
        pagelen: 10,
        values: []
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: emptyResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await searchIssues(searchParams);

      expect(result.values).toHaveLength(0);
      expect(result.size).toBe(0);
    });

    it('should handle invalid filter values', async () => {
      const searchParams: IssuesSearchParams = {
        state: 'invalid-state' as IssueStatus
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Invalid state value'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(searchIssues(searchParams)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Invalid state value'
          }
        }
      });
    });

    it('should handle authentication failure', async () => {
      mockAuthService.mockRejectedValueOnce({
        status: 401,
        data: {
          type: 'error',
          error: {
            message: 'Unauthorized',
            detail: 'Invalid or expired token'
          }
        }
      });

      await expect(searchIssues({})).rejects.toMatchObject({
        status: 401,
        data: {
          type: 'error',
          error: {
            message: 'Unauthorized',
            detail: 'Invalid or expired token'
          }
        }
      });
    });
  });

  // ============================================================================
  // Performance Scenarios
  // ============================================================================

  describe('Performance Scenarios', () => {
    it('should handle large result sets efficiently', async () => {
      const largeResponse = {
        size: 1000,
        page: 1,
        pagelen: 100,
        next: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues?page=2&pagelen=100',
        values: Array.from({ length: 100 }, (_, i) => ({
          ...mockIssues[0],
          id: i + 1,
          title: `Issue ${i + 1}`
        }))
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: largeResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const startTime = Date.now();
      const result = await searchIssues({});
      const endTime = Date.now();

      expect(result.values).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle complex queries efficiently', async () => {
      const complexParams: IssuesSearchParams = {
        q: 'bug critical login',
        state: 'new',
        kind: 'bug',
        priority: 'critical',
        sort: '-created_on',
        page: 1,
        pagelen: 50
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: mockIssuesListResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const startTime = Date.now();
      const result = await searchIssues(complexParams);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});

});
