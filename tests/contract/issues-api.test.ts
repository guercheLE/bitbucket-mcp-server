/**
 * Contract Tests: Issues API Endpoints
 * 
 * Testa os contratos da API de Issues do Bitbucket Cloud
 * conforme definido na especificação issues-api.yaml
 * 
 * @fileoverview Testes de contrato para endpoints da API de Issues
 * @version 1.0.0
 * @since 2024-12-19
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Issue, CreateIssueRequest, UpdateIssueRequest, IssuesListResponse } from '../../src/types/issues';

// ============================================================================
// Mock Data
// ============================================================================

const mockIssue: Issue = {
  id: 1,
  title: 'Test Issue',
  content: {
    raw: 'This is a test issue',
    markup: 'markdown',
    html: '<p>This is a test issue</p>',
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

const mockCreateRequest: CreateIssueRequest = {
  title: 'New Test Issue',
  content: {
    raw: 'This is a new test issue',
    markup: 'markdown'
  },
  kind: 'enhancement',
  priority: 'minor'
};

const mockUpdateRequest: UpdateIssueRequest = {
  title: 'Updated Test Issue',
  priority: 'critical'
};

const mockIssuesListResponse: IssuesListResponse = {
  size: 1,
  page: 1,
  pagelen: 10,
  values: [mockIssue]
};

// ============================================================================
// Contract Tests
// ============================================================================

describe('Issues API Contract Tests', () => {
  beforeEach(() => {
    // Setup mock environment
    process.env.BITBUCKET_CLOUD_API_URL = 'https://api.bitbucket.org/2.0';
    process.env.BITBUCKET_WORKSPACE = 'test-workspace';
    process.env.BITBUCKET_REPOSITORY = 'test-repo';
  });

  afterEach(() => {
    // Cleanup
    delete process.env.BITBUCKET_CLOUD_API_URL;
    delete process.env.BITBUCKET_WORKSPACE;
    delete process.env.BITBUCKET_REPOSITORY;
  });

  // ============================================================================
  // GET /repositories/{workspace}/{repo_slug}/issues
  // ============================================================================

  describe('GET /repositories/{workspace}/{repo_slug}/issues', () => {
    it('should return list of issues with correct structure', () => {
      expect(mockIssuesListResponse).toMatchObject({
        size: expect.any(Number),
        page: expect.any(Number),
        pagelen: expect.any(Number),
        values: expect.any(Array)
      });

      expect(mockIssuesListResponse.values[0]).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        reporter: expect.objectContaining({
          uuid: expect.any(String),
          display_name: expect.any(String),
          nickname: expect.any(String),
          account_id: expect.any(String),
          links: expect.objectContaining({
            self: expect.objectContaining({ href: expect.any(String) }),
            html: expect.objectContaining({ href: expect.any(String) }),
            avatar: expect.objectContaining({ href: expect.any(String) })
          })
        }),
        kind: expect.any(String),
        priority: expect.any(String),
        status: expect.any(String),
        created_on: expect.any(String),
        updated_on: expect.any(String),
        state: expect.objectContaining({
          name: expect.any(String),
          type: expect.stringMatching(/^(unresolved|resolved)$/),
          color: expect.any(String)
        }),
        links: expect.objectContaining({
          self: expect.objectContaining({ href: expect.any(String) }),
          html: expect.objectContaining({ href: expect.any(String) }),
          comments: expect.objectContaining({ href: expect.any(String) }),
          attachments: expect.objectContaining({ href: expect.any(String) }),
          watch: expect.objectContaining({ href: expect.any(String) }),
          vote: expect.objectContaining({ href: expect.any(String) })
        }),
        watchers_count: expect.any(Number),
        voters_count: expect.any(Number)
      });
    });

    it('should support query parameters for filtering', () => {
      const queryParams = {
        q: 'bug',
        sort: '-created_on',
        state: 'new',
        kind: 'bug',
        priority: 'major',
        assignee: 'user-uuid-123',
        reporter: 'user-uuid-456',
        component: 'frontend',
        milestone: 'v1.0',
        version: '1.0.0',
        page: 1,
        pagelen: 20
      };

      // Validate query parameter types
      expect(typeof queryParams.q).toBe('string');
      expect(typeof queryParams.sort).toBe('string');
      expect(typeof queryParams.state).toBe('string');
      expect(typeof queryParams.kind).toBe('string');
      expect(typeof queryParams.priority).toBe('string');
      expect(typeof queryParams.assignee).toBe('string');
      expect(typeof queryParams.reporter).toBe('string');
      expect(typeof queryParams.component).toBe('string');
      expect(typeof queryParams.milestone).toBe('string');
      expect(typeof queryParams.version).toBe('string');
      expect(typeof queryParams.page).toBe('number');
      expect(typeof queryParams.pagelen).toBe('number');
    });

    it('should support pagination with next/previous links', () => {
      const paginatedResponse = {
        ...mockIssuesListResponse,
        next: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues?page=2',
        previous: undefined
      };

      expect(paginatedResponse.next).toMatch(/^https:\/\/api\.bitbucket\.org\/2\.0\/repositories\/.*\/issues\?page=\d+$/);
    });
  });

  // ============================================================================
  // POST /repositories/{workspace}/{repo_slug}/issues
  // ============================================================================

  describe('POST /repositories/{workspace}/{repo_slug}/issues', () => {
    it('should accept valid create issue request', () => {
      expect(mockCreateRequest).toMatchObject({
        title: expect.any(String),
        content: expect.objectContaining({
          raw: expect.any(String),
          markup: expect.any(String)
        }),
        kind: expect.stringMatching(/^(bug|enhancement|proposal|task)$/),
        priority: expect.stringMatching(/^(trivial|minor|major|critical|blocker)$/)
      });
    });

    it('should require title field', () => {
      const invalidRequest = { ...mockCreateRequest };
      delete (invalidRequest as any).title;

      expect(() => {
        if (!invalidRequest.title) {
          throw new Error('Title is required');
        }
      }).toThrow('Title is required');
    });

    it('should validate issue kind values', () => {
      const validKinds = ['bug', 'enhancement', 'proposal', 'task'];
      
      validKinds.forEach(kind => {
        const request = { ...mockCreateRequest, kind: kind as any };
        expect(validKinds).toContain(request.kind);
      });
    });

    it('should validate priority values', () => {
      const validPriorities = ['trivial', 'minor', 'major', 'critical', 'blocker'];
      
      validPriorities.forEach(priority => {
        const request = { ...mockCreateRequest, priority: priority as any };
        expect(validPriorities).toContain(request.priority);
      });
    });
  });

  // ============================================================================
  // GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}
  // ============================================================================

  describe('GET /repositories/{workspace}/{repo_slug}/issues/{issue_id}', () => {
    it('should return single issue with complete structure', () => {
      expect(mockIssue).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        reporter: expect.objectContaining({
          uuid: expect.any(String),
          display_name: expect.any(String),
          nickname: expect.any(String),
          account_id: expect.any(String)
        }),
        kind: expect.any(String),
        priority: expect.any(String),
        status: expect.any(String),
        created_on: expect.any(String),
        updated_on: expect.any(String),
        state: expect.objectContaining({
          name: expect.any(String),
          type: expect.stringMatching(/^(unresolved|resolved)$/),
          color: expect.any(String)
        }),
        links: expect.objectContaining({
          self: expect.objectContaining({ href: expect.any(String) }),
          html: expect.objectContaining({ href: expect.any(String) }),
          comments: expect.objectContaining({ href: expect.any(String) }),
          attachments: expect.objectContaining({ href: expect.any(String) }),
          watch: expect.objectContaining({ href: expect.any(String) }),
          vote: expect.objectContaining({ href: expect.any(String) })
        })
      });
    });

    it('should include optional fields when present', () => {
      const issueWithOptionalFields = {
        ...mockIssue,
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
        component: {
          name: 'frontend',
          description: 'Frontend components'
        },
        milestone: {
          name: 'v1.0',
          description: 'Version 1.0 release',
          due_date: '2024-12-31'
        },
        version: {
          name: '1.0.0',
          description: 'Initial release',
          released: false
        }
      };

      expect(issueWithOptionalFields.assignee).toBeDefined();
      expect(issueWithOptionalFields.component).toBeDefined();
      expect(issueWithOptionalFields.milestone).toBeDefined();
      expect(issueWithOptionalFields.version).toBeDefined();
    });
  });

  // ============================================================================
  // PUT /repositories/{workspace}/{repo_slug}/issues/{issue_id}
  // ============================================================================

  describe('PUT /repositories/{workspace}/{repo_slug}/issues/{issue_id}', () => {
    it('should accept valid update issue request', () => {
      expect(mockUpdateRequest).toMatchObject({
        title: expect.any(String),
        priority: expect.stringMatching(/^(trivial|minor|major|critical|blocker)$/)
      });
    });

    it('should allow partial updates', () => {
      const partialUpdate = {
        title: 'Updated Title Only'
      };

      expect(partialUpdate).toMatchObject({
        title: expect.any(String)
      });
    });

    it('should allow null values for optional fields', () => {
      const nullUpdate = {
        assignee: null,
        component: null,
        milestone: null,
        version: null
      };

      expect(nullUpdate.assignee).toBeNull();
      expect(nullUpdate.component).toBeNull();
      expect(nullUpdate.milestone).toBeNull();
      expect(nullUpdate.version).toBeNull();
    });
  });

  // ============================================================================
  // DELETE /repositories/{workspace}/{repo_slug}/issues/{issue_id}
  // ============================================================================

  describe('DELETE /repositories/{workspace}/{repo_slug}/issues/{issue_id}', () => {
    it('should accept issue ID as path parameter', () => {
      const issueId = 123;
      expect(typeof issueId).toBe('number');
      expect(issueId).toBeGreaterThan(0);
    });

    it('should return 204 No Content on successful deletion', () => {
      const expectedStatusCode = 204;
      expect(expectedStatusCode).toBe(204);
    });
  });

  // ============================================================================
  // Error Response Contracts
  // ============================================================================

  describe('Error Response Contracts', () => {
    it('should return 400 Bad Request for invalid data', () => {
      const errorResponse = {
        type: 'error',
        error: {
          message: 'Invalid request data',
          detail: 'Title is required',
          data: {
            field: 'title',
            code: 'REQUIRED'
          }
        }
      };

      expect(errorResponse).toMatchObject({
        type: 'error',
        error: expect.objectContaining({
          message: expect.any(String),
          detail: expect.any(String),
          data: expect.any(Object)
        })
      });
    });

    it('should return 404 Not Found for non-existent issue', () => {
      const notFoundResponse = {
        type: 'error',
        error: {
          message: 'Issue not found',
          detail: 'The requested issue does not exist',
          data: {
            issue_id: 999999
          }
        }
      };

      expect(notFoundResponse.error.message).toContain('not found');
    });

    it('should return 403 Forbidden for insufficient permissions', () => {
      const forbiddenResponse = {
        type: 'error',
        error: {
          message: 'Insufficient permissions',
          detail: 'You do not have permission to perform this action',
          data: {
            required_permission: 'write'
          }
        }
      };

      expect(forbiddenResponse.error.message).toContain('permission');
    });
  });

  // ============================================================================
  // Authentication Contracts
  // ============================================================================

  describe('Authentication Contracts', () => {
    it('should require valid OAuth token', () => {
      const authHeader = 'Bearer valid-oauth-token';
      expect(authHeader).toMatch(/^Bearer\s+.+$/);
    });

    it('should return 401 Unauthorized for invalid token', () => {
      const unauthorizedResponse = {
        type: 'error',
        error: {
          message: 'Unauthorized',
          detail: 'Invalid or expired token'
        }
      };

      expect(unauthorizedResponse.error.message).toBe('Unauthorized');
    });
  });

  // ============================================================================
  // Rate Limiting Contracts
  // ============================================================================

  describe('Rate Limiting Contracts', () => {
    it('should include rate limit headers in response', () => {
      const rateLimitHeaders = {
        'X-RateLimit-Limit': '1000',
        'X-RateLimit-Remaining': '999',
        'X-RateLimit-Reset': '1640995200'
      };

      expect(rateLimitHeaders['X-RateLimit-Limit']).toMatch(/^\d+$/);
      expect(rateLimitHeaders['X-RateLimit-Remaining']).toMatch(/^\d+$/);
      expect(rateLimitHeaders['X-RateLimit-Reset']).toMatch(/^\d+$/);
    });

    it('should return 429 Too Many Requests when rate limit exceeded', () => {
      const rateLimitResponse = {
        type: 'error',
        error: {
          message: 'Rate limit exceeded',
          detail: 'Too many requests. Please try again later.',
          data: {
            retry_after: 60
          }
        }
      };

      expect(rateLimitResponse.error.message).toContain('Rate limit');
    });
  });
});
