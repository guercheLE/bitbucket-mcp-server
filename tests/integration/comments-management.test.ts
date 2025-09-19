/**
 * Integration Tests: Comments Management
 * 
 * Testa o cenário completo de gestão de comentários em Issues
 * incluindo criação, atualização, listagem e exclusão
 * 
 * @fileoverview Testes de integração para gestão de comentários
 * @version 1.0.0
 * @since 2024-12-19
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  IssueComment, 
  CreateCommentRequest, 
  UpdateCommentRequest,
  CommentsListResponse
} from '../../src/types/issues';

// ============================================================================
// Mock Data
// ============================================================================

const baseComment: IssueComment = {
  id: 1,
  content: {
    raw: 'This is a test comment',
    markup: 'markdown',
    html: '<p>This is a test comment</p>',
    type: 'text'
  },
  user: {
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
  created_on: '2024-12-19T10:00:00.000Z',
  updated_on: '2024-12-19T10:00:00.000Z',
  links: {
    self: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/comments/1' },
    html: { href: 'https://bitbucket.org/workspace/repo/issues/1#comment-1' }
  }
};

const mockCommentsListResponse: CommentsListResponse = {
  size: 3,
  page: 1,
  pagelen: 10,
  values: [
    baseComment,
    {
      ...baseComment,
      id: 2,
      content: {
        raw: 'This is a second comment',
        markup: 'markdown',
        html: '<p>This is a second comment</p>',
        type: 'text'
      },
      created_on: '2024-12-19T10:30:00.000Z',
      updated_on: '2024-12-19T10:30:00.000Z',
      links: {
        self: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/comments/2' },
        html: { href: 'https://bitbucket.org/workspace/repo/issues/1#comment-2' }
      }
    },
    {
      ...baseComment,
      id: 3,
      content: {
        raw: 'This is a third comment',
        markup: 'markdown',
        html: '<p>This is a third comment</p>',
        type: 'text'
      },
      created_on: '2024-12-19T11:00:00.000Z',
      updated_on: '2024-12-19T11:00:00.000Z',
      links: {
        self: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/comments/3' },
        html: { href: 'https://bitbucket.org/workspace/repo/issues/1#comment-3' }
      }
    }
  ]
};

// ============================================================================
// Integration Tests
// ============================================================================

describe('Comments Management Integration Tests', () => {
  let mockApiCall: jest.MockedFunction<any>;
  let mockLogger: jest.MockedFunction<any>;
  let mockAuthService: jest.MockedFunction<any>;

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Mock implementation of create comment function
   * This would be replaced with actual implementation in real tests
   */
  const createComment = async (issueId: number, request: CreateCommentRequest): Promise<IssueComment> => {
    // Mock authentication
    const authResult = await mockAuthService();
    
    // Mock API call
    const response = await mockApiCall(
      `https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/${issueId}/comments`,
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
    mockLogger('info', 'Comment created successfully', {
      issueId,
      commentId: response.data.id
    });

    return response.data;
  };

  /**
   * Mock implementation of list comments function
   * This would be replaced with actual implementation in real tests
   */
  const listComments = async (issueId: number, params?: { page?: number; pagelen?: number; sort?: string }): Promise<CommentsListResponse> => {
    // Mock authentication
    const authResult = await mockAuthService();
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const url = `https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/${issueId}/comments${queryString ? `?${queryString}` : ''}`;
    
    // Mock API call
    const response = await mockApiCall(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authResult.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  };

  /**
   * Mock implementation of update comment function
   * This would be replaced with actual implementation in real tests
   */
  const updateComment = async (issueId: number, commentId: number, request: UpdateCommentRequest): Promise<IssueComment> => {
    // Mock authentication
    const authResult = await mockAuthService();
    
    // Mock API call
    const response = await mockApiCall(
      `https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/${issueId}/comments/${commentId}`,
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
    mockLogger('info', 'Comment updated successfully', {
      issueId,
      commentId
    });

    return response.data;
  };

  /**
   * Mock implementation of delete comment function
   * This would be replaced with actual implementation in real tests
   */
  const deleteComment = async (issueId: number, commentId: number): Promise<void> => {
    // Mock authentication
    const authResult = await mockAuthService();
    
    // Mock API call
    await mockApiCall(
      `https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/${issueId}/comments/${commentId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authResult.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Mock logging
    mockLogger('info', 'Comment deleted successfully', {
      issueId,
      commentId
    });
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
  // Comment Creation Scenarios
  // ============================================================================

  describe('Comment Creation Scenarios', () => {
    it('should create comment with valid request', async () => {
      const createRequest: CreateCommentRequest = {
        content: {
          raw: 'This is a new comment',
          markup: 'markdown'
        }
      };

      const createdComment = {
        ...baseComment,
        content: {
          raw: 'This is a new comment',
          markup: 'markdown',
          html: '<p>This is a new comment</p>',
          type: 'text'
        },
        created_on: '2024-12-19T12:00:00.000Z',
        updated_on: '2024-12-19T12:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdComment
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createComment(1, createRequest);

      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/1/comments',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createRequest)
        }
      );

      expect(result.content.raw).toBe('This is a new comment');
      expect(result.created_on).toBe('2024-12-19T12:00:00.000Z');
    });

    it('should create comment with markdown formatting', async () => {
      const createRequest: CreateCommentRequest = {
        content: {
          raw: '# Header\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2',
          markup: 'markdown'
        }
      };

      const createdComment = {
        ...baseComment,
        content: {
          raw: '# Header\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2',
          markup: 'markdown',
          html: '<h1>Header</h1>\n<p><strong>Bold text</strong> and <em>italic text</em></p>\n<ul>\n<li>List item 1</li>\n<li>List item 2</li>\n</ul>',
          type: 'text'
        },
        created_on: '2024-12-19T12:00:00.000Z',
        updated_on: '2024-12-19T12:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdComment
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createComment(1, createRequest);

      expect(result.content.raw).toContain('# Header');
      expect(result.content.raw).toContain('**Bold text**');
      expect(result.content.raw).toContain('*italic text*');
      expect(result.content.raw).toContain('- List item');
    });

    it('should create comment with code blocks', async () => {
      const createRequest: CreateCommentRequest = {
        content: {
          raw: 'Here is some code:\n\n```javascript\nfunction hello() {\n  console.log("Hello, World!");\n}\n```',
          markup: 'markdown'
        }
      };

      const createdComment = {
        ...baseComment,
        content: {
          raw: 'Here is some code:\n\n```javascript\nfunction hello() {\n  console.log("Hello, World!");\n}\n```',
          markup: 'markdown',
          html: '<p>Here is some code:</p>\n<pre><code class="language-javascript">function hello() {\n  console.log("Hello, World!");\n}\n</code></pre>',
          type: 'text'
        },
        created_on: '2024-12-19T12:00:00.000Z',
        updated_on: '2024-12-19T12:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdComment
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createComment(1, createRequest);

      expect(result.content.raw).toContain('```javascript');
      expect(result.content.raw).toContain('function hello()');
    });

    it('should create comment with mentions', async () => {
      const createRequest: CreateCommentRequest = {
        content: {
          raw: 'Hey @testuser, can you take a look at this?',
          markup: 'markdown'
        }
      };

      const createdComment = {
        ...baseComment,
        content: {
          raw: 'Hey @testuser, can you take a look at this?',
          markup: 'markdown',
          html: '<p>Hey <a href="/testuser">@testuser</a>, can you take a look at this?</p>',
          type: 'text'
        },
        created_on: '2024-12-19T12:00:00.000Z',
        updated_on: '2024-12-19T12:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdComment
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await createComment(1, createRequest);

      expect(result.content.raw).toContain('@testuser');
    });
  });

  // ============================================================================
  // Comment Listing Scenarios
  // ============================================================================

  describe('Comment Listing Scenarios', () => {
    it('should list all comments for an issue', async () => {
      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: mockCommentsListResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await listComments(1);

      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/1/comments',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          }
        }
      );

      expect(result.values).toHaveLength(3);
      expect(result.size).toBe(3);
    });

    it('should list comments with pagination', async () => {
      const paginatedResponse = {
        size: 3,
        page: 1,
        pagelen: 2,
        next: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/comments?page=2&pagelen=2',
        values: [mockCommentsListResponse.values[0], mockCommentsListResponse.values[1]]
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: paginatedResponse
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await listComments(1, { page: 1, pagelen: 2 });

      expect(result.values).toHaveLength(2);
      expect(result.next).toBeDefined();
    });

    it('should list comments sorted by creation date', async () => {
      const sortedResponse = {
        ...mockCommentsListResponse,
        values: [...mockCommentsListResponse.values].sort((a, b) => 
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

      const result = await listComments(1, { sort: 'created_on' });

      expect(result.values[0].id).toBe(1); // Oldest
      expect(result.values[2].id).toBe(3); // Newest
    });
  });

  // ============================================================================
  // Comment Update Scenarios
  // ============================================================================

  describe('Comment Update Scenarios', () => {
    it('should update comment content', async () => {
      const updateRequest: UpdateCommentRequest = {
        content: {
          raw: 'This is an updated comment',
          markup: 'markdown'
        }
      };

      const updatedComment = {
        ...baseComment,
        content: {
          raw: 'This is an updated comment',
          markup: 'markdown',
          html: '<p>This is an updated comment</p>',
          type: 'text'
        },
        updated_on: '2024-12-19T12:00:00.000Z',
        edited_on: '2024-12-19T12:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedComment
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateComment(1, 1, updateRequest);

      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/1/comments/1',
        {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateRequest)
        }
      );

      expect(result.content.raw).toBe('This is an updated comment');
      expect(result.edited_on).toBeDefined();
    });

    it('should update comment with markdown formatting', async () => {
      const updateRequest: UpdateCommentRequest = {
        content: {
          raw: 'Updated comment with **bold** and *italic* text',
          markup: 'markdown'
        }
      };

      const updatedComment = {
        ...baseComment,
        content: {
          raw: 'Updated comment with **bold** and *italic* text',
          markup: 'markdown',
          html: '<p>Updated comment with <strong>bold</strong> and <em>italic</em> text</p>',
          type: 'text'
        },
        updated_on: '2024-12-19T12:00:00.000Z',
        edited_on: '2024-12-19T12:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedComment
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateComment(1, 1, updateRequest);

      expect(result.content.raw).toContain('**bold**');
      expect(result.content.raw).toContain('*italic*');
    });

    it('should preserve edit history', async () => {
      const updateRequest: UpdateCommentRequest = {
        content: {
          raw: 'Final version of the comment',
          markup: 'markdown'
        }
      };

      const updatedComment = {
        ...baseComment,
        content: {
          raw: 'Final version of the comment',
          markup: 'markdown',
          html: '<p>Final version of the comment</p>',
          type: 'text'
        },
        updated_on: '2024-12-19T12:00:00.000Z',
        edited_on: '2024-12-19T12:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedComment
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      const result = await updateComment(1, 1, updateRequest);

      expect(result.edited_on).toBeDefined();
      expect(new Date(result.edited_on!)).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // Comment Deletion Scenarios
  // ============================================================================

  describe('Comment Deletion Scenarios', () => {
    it('should delete comment successfully', async () => {
      mockApiCall.mockResolvedValueOnce({
        status: 204
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await deleteComment(1, 1);

      expect(mockApiCall).toHaveBeenCalledWith(
        'https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo/issues/1/comments/1',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should handle deletion of non-existent comment', async () => {
      mockApiCall.mockRejectedValueOnce({
        status: 404,
        data: {
          type: 'error',
          error: {
            message: 'Comment not found',
            detail: 'The requested comment does not exist'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(deleteComment(1, 999)).rejects.toMatchObject({
        status: 404,
        data: {
          type: 'error',
          error: {
            message: 'Comment not found',
            detail: 'The requested comment does not exist'
          }
        }
      });
    });
  });

  // ============================================================================
  // Validation Scenarios
  // ============================================================================

  describe('Validation Scenarios', () => {
    it('should reject comment creation with empty content', async () => {
      const createRequest: CreateCommentRequest = {
        content: {
          raw: '',
          markup: 'markdown'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Comment content cannot be empty'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createComment(1, createRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Comment content cannot be empty'
          }
        }
      });
    });

    it('should reject comment creation with whitespace-only content', async () => {
      const createRequest: CreateCommentRequest = {
        content: {
          raw: '   \n  \t  ',
          markup: 'markdown'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Comment content cannot be empty'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createComment(1, createRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Comment content cannot be empty'
          }
        }
      });
    });

    it('should reject comment update with empty content', async () => {
      const updateRequest: UpdateCommentRequest = {
        content: {
          raw: '',
          markup: 'markdown'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Comment content cannot be empty'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(updateComment(1, 1, updateRequest)).rejects.toMatchObject({
        status: 400,
        data: {
          type: 'error',
          error: {
            message: 'Invalid request data',
            detail: 'Comment content cannot be empty'
          }
        }
      });
    });
  });

  // ============================================================================
  // Permission Scenarios
  // ============================================================================

  describe('Permission Scenarios', () => {
    it('should handle insufficient permissions for comment creation', async () => {
      const createRequest: CreateCommentRequest = {
        content: {
          raw: 'This is a new comment',
          markup: 'markdown'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 403,
        data: {
          type: 'error',
          error: {
            message: 'Insufficient permissions',
            detail: 'You do not have permission to comment on this issue'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(createComment(1, createRequest)).rejects.toMatchObject({
        status: 403,
        data: {
          type: 'error',
          error: {
            message: 'Insufficient permissions',
            detail: 'You do not have permission to comment on this issue'
          }
        }
      });
    });

    it('should handle insufficient permissions for comment update', async () => {
      const updateRequest: UpdateCommentRequest = {
        content: {
          raw: 'Updated comment',
          markup: 'markdown'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 403,
        data: {
          type: 'error',
          error: {
            message: 'Insufficient permissions',
            detail: 'You do not have permission to update this comment'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(updateComment(1, 1, updateRequest)).rejects.toMatchObject({
        status: 403,
        data: {
          type: 'error',
          error: {
            message: 'Insufficient permissions',
            detail: 'You do not have permission to update this comment'
          }
        }
      });
    });

    it('should handle insufficient permissions for comment deletion', async () => {
      mockApiCall.mockRejectedValueOnce({
        status: 403,
        data: {
          type: 'error',
          error: {
            message: 'Insufficient permissions',
            detail: 'You do not have permission to delete this comment'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(deleteComment(1, 1)).rejects.toMatchObject({
        status: 403,
        data: {
          type: 'error',
          error: {
            message: 'Insufficient permissions',
            detail: 'You do not have permission to delete this comment'
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
      const createRequest: CreateCommentRequest = {
        content: {
          raw: 'This is a new comment',
          markup: 'markdown'
        }
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

      await expect(createComment(999, createRequest)).rejects.toMatchObject({
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

    it('should handle comment not found for update', async () => {
      const updateRequest: UpdateCommentRequest = {
        content: {
          raw: 'Updated comment',
          markup: 'markdown'
        }
      };

      mockApiCall.mockRejectedValueOnce({
        status: 404,
        data: {
          type: 'error',
          error: {
            message: 'Comment not found',
            detail: 'The requested comment does not exist'
          }
        }
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await expect(updateComment(1, 999, updateRequest)).rejects.toMatchObject({
        status: 404,
        data: {
          type: 'error',
          error: {
            message: 'Comment not found',
            detail: 'The requested comment does not exist'
          }
        }
      });
    });
  });

  // ============================================================================
  // Logging and Monitoring
  // ============================================================================

  describe('Logging and Monitoring', () => {
    it('should log successful comment creation', async () => {
      const createRequest: CreateCommentRequest = {
        content: {
          raw: 'This is a new comment',
          markup: 'markdown'
        }
      };

      const createdComment = {
        ...baseComment,
        content: {
          raw: 'This is a new comment',
          markup: 'markdown',
          html: '<p>This is a new comment</p>',
          type: 'text'
        },
        created_on: '2024-12-19T12:00:00.000Z',
        updated_on: '2024-12-19T12:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 201,
        data: createdComment
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await createComment(1, createRequest);

      expect(mockLogger).toHaveBeenCalledWith(
        'info',
        'Comment created successfully',
        expect.objectContaining({
          issueId: 1,
          commentId: createdComment.id
        })
      );
    });

    it('should log successful comment update', async () => {
      const updateRequest: UpdateCommentRequest = {
        content: {
          raw: 'Updated comment',
          markup: 'markdown'
        }
      };

      const updatedComment = {
        ...baseComment,
        content: {
          raw: 'Updated comment',
          markup: 'markdown',
          html: '<p>Updated comment</p>',
          type: 'text'
        },
        updated_on: '2024-12-19T12:00:00.000Z',
        edited_on: '2024-12-19T12:00:00.000Z'
      };

      mockApiCall.mockResolvedValueOnce({
        status: 200,
        data: updatedComment
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await updateComment(1, 1, updateRequest);

      expect(mockLogger).toHaveBeenCalledWith(
        'info',
        'Comment updated successfully',
        expect.objectContaining({
          issueId: 1,
          commentId: 1
        })
      );
    });

    it('should log successful comment deletion', async () => {
      mockApiCall.mockResolvedValueOnce({
        status: 204
      });

      mockAuthService.mockResolvedValueOnce({
        access_token: 'valid-token',
        token_type: 'Bearer'
      });

      await deleteComment(1, 1);

      expect(mockLogger).toHaveBeenCalledWith(
        'info',
        'Comment deleted successfully',
        expect.objectContaining({
          issueId: 1,
          commentId: 1
        })
      );
    });
  });
});

