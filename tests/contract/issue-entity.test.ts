/**
 * Contract Tests: Issue Entity Validation
 * 
 * Testa a validação e estrutura da entidade Issue
 * conforme definido no modelo de dados
 * 
 * @fileoverview Testes de contrato para entidade Issue
 * @version 1.0.0
 * @since 2024-12-19
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  Issue, 
  IssueStatus, 
  IssuePriority, 
  IssueType, 
  IssueState,
  IssueComponent,
  IssueMilestone,
  IssueVersion,
  IssueWatcher,
  IssueVoter
} from '../../src/types/issues';

// ============================================================================
// Mock Data
// ============================================================================

const validIssueState: IssueState = {
  name: 'New',
  type: 'unresolved',
  color: '#ff6b6b'
};

const validIssueComponent: IssueComponent = {
  name: 'frontend',
  description: 'Frontend components'
};

const validIssueMilestone: IssueMilestone = {
  name: 'v1.0',
  description: 'Version 1.0 release',
  due_date: '2024-12-31'
};

const validIssueVersion: IssueVersion = {
  name: '1.0.0',
  description: 'Initial release',
  released: false,
  release_date: '2024-12-31'
};

const validIssueWatcher: IssueWatcher = {
  uuid: 'user-uuid-123',
  display_name: 'Test User',
  nickname: 'testuser',
  account_id: 'account-123',
  links: {
    self: { href: 'https://api.bitbucket.org/2.0/users/testuser' },
    html: { href: 'https://bitbucket.org/testuser' },
    avatar: { href: 'https://bitbucket.org/account/testuser/avatar/32/' }
  }
};

const validIssueVoter: IssueVoter = {
  uuid: 'user-uuid-456',
  display_name: 'Voter User',
  nickname: 'voter',
  account_id: 'account-456',
  links: {
    self: { href: 'https://api.bitbucket.org/2.0/users/voter' },
    html: { href: 'https://bitbucket.org/voter' },
    avatar: { href: 'https://bitbucket.org/account/voter/avatar/32/' }
  }
};

const validIssue: Issue = {
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
  state: validIssueState,
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

// ============================================================================
// Contract Tests
// ============================================================================

describe('Issue Entity Contract Tests', () => {
  beforeEach(() => {
    // Setup test environment
  });

  // ============================================================================
  // Core Issue Properties
  // ============================================================================

  describe('Core Issue Properties', () => {
    it('should have required id field as number', () => {
      expect(validIssue.id).toBeDefined();
      expect(typeof validIssue.id).toBe('number');
      expect(validIssue.id).toBeGreaterThan(0);
    });

    it('should have required title field as string', () => {
      expect(validIssue.title).toBeDefined();
      expect(typeof validIssue.title).toBe('string');
      expect(validIssue.title.length).toBeGreaterThan(0);
    });

    it('should have required reporter field with correct structure', () => {
      expect(validIssue.reporter).toBeDefined();
      expect(validIssue.reporter).toMatchObject({
        uuid: expect.any(String),
        display_name: expect.any(String),
        nickname: expect.any(String),
        account_id: expect.any(String),
        links: expect.objectContaining({
          self: expect.objectContaining({ href: expect.any(String) }),
          html: expect.objectContaining({ href: expect.any(String) }),
          avatar: expect.objectContaining({ href: expect.any(String) })
        })
      });
    });

    it('should have required kind field with valid values', () => {
      const validKinds: IssueType[] = ['bug', 'enhancement', 'proposal', 'task'];
      expect(validKinds).toContain(validIssue.kind);
    });

    it('should have required priority field with valid values', () => {
      const validPriorities: IssuePriority[] = ['trivial', 'minor', 'major', 'critical', 'blocker'];
      expect(validPriorities).toContain(validIssue.priority);
    });

    it('should have required status field with valid values', () => {
      const validStatuses: IssueStatus[] = ['new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed'];
      expect(validStatuses).toContain(validIssue.status);
    });

    it('should have required created_on field as ISO date string', () => {
      expect(validIssue.created_on).toBeDefined();
      expect(typeof validIssue.created_on).toBe('string');
      expect(new Date(validIssue.created_on)).toBeInstanceOf(Date);
      expect(new Date(validIssue.created_on).toISOString()).toBe(validIssue.created_on);
    });

    it('should have required updated_on field as ISO date string', () => {
      expect(validIssue.updated_on).toBeDefined();
      expect(typeof validIssue.updated_on).toBe('string');
      expect(new Date(validIssue.updated_on)).toBeInstanceOf(Date);
      expect(new Date(validIssue.updated_on).toISOString()).toBe(validIssue.updated_on);
    });

    it('should have required state field with correct structure', () => {
      expect(validIssue.state).toBeDefined();
      expect(validIssue.state).toMatchObject({
        name: expect.any(String),
        type: expect.stringMatching(/^(unresolved|resolved)$/),
        color: expect.any(String)
      });
    });

    it('should have required links field with all required links', () => {
      expect(validIssue.links).toBeDefined();
      expect(validIssue.links).toMatchObject({
        self: expect.objectContaining({ href: expect.any(String) }),
        html: expect.objectContaining({ href: expect.any(String) }),
        comments: expect.objectContaining({ href: expect.any(String) }),
        attachments: expect.objectContaining({ href: expect.any(String) }),
        watch: expect.objectContaining({ href: expect.any(String) }),
        vote: expect.objectContaining({ href: expect.any(String) })
      });
    });

    it('should have required watchers_count field as number', () => {
      expect(validIssue.watchers_count).toBeDefined();
      expect(typeof validIssue.watchers_count).toBe('number');
      expect(validIssue.watchers_count).toBeGreaterThanOrEqual(0);
    });

    it('should have required voters_count field as number', () => {
      expect(validIssue.voters_count).toBeDefined();
      expect(typeof validIssue.voters_count).toBe('number');
      expect(validIssue.voters_count).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // Optional Issue Properties
  // ============================================================================

  describe('Optional Issue Properties', () => {
    it('should allow optional content field with correct structure', () => {
      if (validIssue.content) {
        expect(validIssue.content).toMatchObject({
          raw: expect.any(String),
          markup: expect.any(String),
          html: expect.any(String),
          type: expect.any(String)
        });
      }
    });

    it('should allow optional assignee field with correct structure', () => {
      const issueWithAssignee = {
        ...validIssue,
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

      expect(issueWithAssignee.assignee).toMatchObject({
        uuid: expect.any(String),
        display_name: expect.any(String),
        nickname: expect.any(String),
        account_id: expect.any(String),
        links: expect.objectContaining({
          self: expect.objectContaining({ href: expect.any(String) }),
          html: expect.objectContaining({ href: expect.any(String) }),
          avatar: expect.objectContaining({ href: expect.any(String) })
        })
      });
    });

    it('should allow optional component field with correct structure', () => {
      const issueWithComponent = {
        ...validIssue,
        component: validIssueComponent
      };

      expect(issueWithComponent.component).toMatchObject({
        name: expect.any(String),
        description: expect.any(String)
      });
    });

    it('should allow optional milestone field with correct structure', () => {
      const issueWithMilestone = {
        ...validIssue,
        milestone: validIssueMilestone
      };

      expect(issueWithMilestone.milestone).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        due_date: expect.any(String)
      });
    });

    it('should allow optional version field with correct structure', () => {
      const issueWithVersion = {
        ...validIssue,
        version: validIssueVersion
      };

      expect(issueWithVersion.version).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        released: expect.any(Boolean),
        release_date: expect.any(String)
      });
    });

    it('should allow optional edited_on field as ISO date string', () => {
      const issueWithEditedOn = {
        ...validIssue,
        edited_on: '2024-12-19T11:00:00.000Z'
      };

      expect(issueWithEditedOn.edited_on).toBeDefined();
      expect(typeof issueWithEditedOn.edited_on).toBe('string');
      expect(new Date(issueWithEditedOn.edited_on!)).toBeInstanceOf(Date);
    });

    it('should allow optional watchers array with correct structure', () => {
      const issueWithWatchers = {
        ...validIssue,
        watchers: [validIssueWatcher]
      };

      expect(issueWithWatchers.watchers).toBeDefined();
      expect(Array.isArray(issueWithWatchers.watchers)).toBe(true);
      expect(issueWithWatchers.watchers![0]).toMatchObject({
        uuid: expect.any(String),
        display_name: expect.any(String),
        nickname: expect.any(String),
        account_id: expect.any(String),
        links: expect.objectContaining({
          self: expect.objectContaining({ href: expect.any(String) }),
          html: expect.objectContaining({ href: expect.any(String) }),
          avatar: expect.objectContaining({ href: expect.any(String) })
        })
      });
    });

    it('should allow optional voters array with correct structure', () => {
      const issueWithVoters = {
        ...validIssue,
        voters: [validIssueVoter]
      };

      expect(issueWithVoters.voters).toBeDefined();
      expect(Array.isArray(issueWithVoters.voters)).toBe(true);
      expect(issueWithVoters.voters![0]).toMatchObject({
        uuid: expect.any(String),
        display_name: expect.any(String),
        nickname: expect.any(String),
        account_id: expect.any(String),
        links: expect.objectContaining({
          self: expect.objectContaining({ href: expect.any(String) }),
          html: expect.objectContaining({ href: expect.any(String) }),
          avatar: expect.objectContaining({ href: expect.any(String) })
        })
      });
    });
  });

  // ============================================================================
  // Field Validation
  // ============================================================================

  describe('Field Validation', () => {
    it('should validate issue kind enum values', () => {
      const validKinds: IssueType[] = ['bug', 'enhancement', 'proposal', 'task'];
      
      validKinds.forEach(kind => {
        const issue = { ...validIssue, kind };
        expect(validKinds).toContain(issue.kind);
      });
    });

    it('should validate issue priority enum values', () => {
      const validPriorities: IssuePriority[] = ['trivial', 'minor', 'major', 'critical', 'blocker'];
      
      validPriorities.forEach(priority => {
        const issue = { ...validIssue, priority };
        expect(validPriorities).toContain(issue.priority);
      });
    });

    it('should validate issue status enum values', () => {
      const validStatuses: IssueStatus[] = ['new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed'];
      
      validStatuses.forEach(status => {
        const issue = { ...validIssue, status };
        expect(validStatuses).toContain(issue.status);
      });
    });

    it('should validate issue state type enum values', () => {
      const validStateTypes = ['unresolved', 'resolved'];
      
      validStateTypes.forEach(type => {
        const state = { ...validIssueState, type: type as 'unresolved' | 'resolved' };
        expect(validStateTypes).toContain(state.type);
      });
    });

    it('should validate date format for created_on field', () => {
      const validDateFormats = [
        '2024-12-19T10:00:00.000Z',
        '2024-12-19T10:00:00Z',
        '2024-12-19T10:00:00.123Z'
      ];

      validDateFormats.forEach(dateString => {
        const issue = { ...validIssue, created_on: dateString };
        expect(new Date(issue.created_on)).toBeInstanceOf(Date);
        expect(new Date(issue.created_on).toISOString()).toBe(dateString);
      });
    });

    it('should validate date format for updated_on field', () => {
      const validDateFormats = [
        '2024-12-19T10:00:00.000Z',
        '2024-12-19T10:00:00Z',
        '2024-12-19T10:00:00.123Z'
      ];

      validDateFormats.forEach(dateString => {
        const issue = { ...validIssue, updated_on: dateString };
        expect(new Date(issue.updated_on)).toBeInstanceOf(Date);
        expect(new Date(issue.updated_on).toISOString()).toBe(dateString);
      });
    });

    it('should validate URL format for links', () => {
      const urlPattern = /^https?:\/\/.+/;
      
      expect(urlPattern.test(validIssue.links.self.href)).toBe(true);
      expect(urlPattern.test(validIssue.links.html.href)).toBe(true);
      expect(urlPattern.test(validIssue.links.comments.href)).toBe(true);
      expect(urlPattern.test(validIssue.links.attachments.href)).toBe(true);
      expect(urlPattern.test(validIssue.links.watch.href)).toBe(true);
      expect(urlPattern.test(validIssue.links.vote.href)).toBe(true);
    });

    it('should validate UUID format for user identifiers', () => {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      expect(uuidPattern.test(validIssue.reporter.uuid)).toBe(true);
      expect(uuidPattern.test(validIssue.reporter.account_id)).toBe(true);
    });
  });

  // ============================================================================
  // Business Rules Validation
  // ============================================================================

  describe('Business Rules Validation', () => {
    it('should ensure updated_on is not before created_on', () => {
      const createdDate = new Date(validIssue.created_on);
      const updatedDate = new Date(validIssue.updated_on);
      
      expect(updatedDate.getTime()).toBeGreaterThanOrEqual(createdDate.getTime());
    });

    it('should ensure edited_on is not before created_on when present', () => {
      const issueWithEditedOn = {
        ...validIssue,
        edited_on: '2024-12-19T11:00:00.000Z'
      };

      const createdDate = new Date(issueWithEditedOn.created_on);
      const editedDate = new Date(issueWithEditedOn.edited_on!);
      
      expect(editedDate.getTime()).toBeGreaterThanOrEqual(createdDate.getTime());
    });

    it('should ensure watchers_count matches watchers array length when present', () => {
      const issueWithWatchers = {
        ...validIssue,
        watchers: [validIssueWatcher, validIssueVoter],
        watchers_count: 2
      };

      expect(issueWithWatchers.watchers_count).toBe(issueWithWatchers.watchers!.length);
    });

    it('should ensure voters_count matches voters array length when present', () => {
      const issueWithVoters = {
        ...validIssue,
        voters: [validIssueVoter],
        voters_count: 1
      };

      expect(issueWithVoters.voters_count).toBe(issueWithVoters.voters!.length);
    });

    it('should ensure milestone due_date is valid ISO date when present', () => {
      const issueWithMilestone = {
        ...validIssue,
        milestone: validIssueMilestone
      };

      if (issueWithMilestone.milestone?.due_date) {
        expect(new Date(issueWithMilestone.milestone.due_date)).toBeInstanceOf(Date);
      }
    });

    it('should ensure version release_date is valid ISO date when present', () => {
      const issueWithVersion = {
        ...validIssue,
        version: validIssueVersion
      };

      if (issueWithVersion.version?.release_date) {
        expect(new Date(issueWithVersion.version.release_date)).toBeInstanceOf(Date);
      }
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle issue with minimal required fields', () => {
      const minimalIssue = {
        id: 1,
        title: 'Minimal Issue',
        reporter: validIssue.reporter,
        kind: 'task' as IssueType,
        priority: 'trivial' as IssuePriority,
        status: 'new' as IssueStatus,
        created_on: '2024-12-19T10:00:00.000Z',
        updated_on: '2024-12-19T10:00:00.000Z',
        state: validIssueState,
        links: validIssue.links,
        watchers_count: 0,
        voters_count: 0
      };

      expect(minimalIssue.id).toBeDefined();
      expect(minimalIssue.title).toBeDefined();
      expect(minimalIssue.reporter).toBeDefined();
      expect(minimalIssue.kind).toBeDefined();
      expect(minimalIssue.priority).toBeDefined();
      expect(minimalIssue.status).toBeDefined();
      expect(minimalIssue.created_on).toBeDefined();
      expect(minimalIssue.updated_on).toBeDefined();
      expect(minimalIssue.state).toBeDefined();
      expect(minimalIssue.links).toBeDefined();
      expect(minimalIssue.watchers_count).toBeDefined();
      expect(minimalIssue.voters_count).toBeDefined();
    });

    it('should handle issue with all optional fields', () => {
      const completeIssue = {
        ...validIssue,
        content: validIssue.content,
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
        component: validIssueComponent,
        milestone: validIssueMilestone,
        version: validIssueVersion,
        edited_on: '2024-12-19T11:00:00.000Z',
        watchers: [validIssueWatcher],
        voters: [validIssueVoter]
      };

      expect(completeIssue.content).toBeDefined();
      expect(completeIssue.assignee).toBeDefined();
      expect(completeIssue.component).toBeDefined();
      expect(completeIssue.milestone).toBeDefined();
      expect(completeIssue.version).toBeDefined();
      expect(completeIssue.edited_on).toBeDefined();
      expect(completeIssue.watchers).toBeDefined();
      expect(completeIssue.voters).toBeDefined();
    });
  });
});
