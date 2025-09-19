/**
 * Contract Tests: Comment Entity Validation
 * 
 * Testa a validação e estrutura da entidade Comment
 * conforme definido no modelo de dados
 * 
 * @fileoverview Testes de contrato para entidade Comment
 * @version 1.0.0
 * @since 2024-12-19
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { IssueComment } from '../../src/types/issues';

// ============================================================================
// Mock Data
// ============================================================================

const validComment: IssueComment = {
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

const validCommentWithEditedOn: IssueComment = {
  ...validComment,
  edited_on: '2024-12-19T11:00:00.000Z'
};

// ============================================================================
// Contract Tests
// ============================================================================

describe('Comment Entity Contract Tests', () => {
  beforeEach(() => {
    // Setup test environment
  });

  // ============================================================================
  // Core Comment Properties
  // ============================================================================

  describe('Core Comment Properties', () => {
    it('should have required id field as number', () => {
      expect(validComment.id).toBeDefined();
      expect(typeof validComment.id).toBe('number');
      expect(validComment.id).toBeGreaterThan(0);
    });

    it('should have required content field with correct structure', () => {
      expect(validComment.content).toBeDefined();
      expect(validComment.content).toMatchObject({
        raw: expect.any(String),
        markup: expect.any(String),
        html: expect.any(String),
        type: expect.any(String)
      });
    });

    it('should have required user field with correct structure', () => {
      expect(validComment.user).toBeDefined();
      expect(validComment.user).toMatchObject({
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

    it('should have required created_on field as ISO date string', () => {
      expect(validComment.created_on).toBeDefined();
      expect(typeof validComment.created_on).toBe('string');
      expect(new Date(validComment.created_on)).toBeInstanceOf(Date);
      expect(new Date(validComment.created_on).toISOString()).toBe(validComment.created_on);
    });

    it('should have required updated_on field as ISO date string', () => {
      expect(validComment.updated_on).toBeDefined();
      expect(typeof validComment.updated_on).toBe('string');
      expect(new Date(validComment.updated_on)).toBeInstanceOf(Date);
      expect(new Date(validComment.updated_on).toISOString()).toBe(validComment.updated_on);
    });

    it('should have required links field with correct structure', () => {
      expect(validComment.links).toBeDefined();
      expect(validComment.links).toMatchObject({
        self: expect.objectContaining({ href: expect.any(String) }),
        html: expect.objectContaining({ href: expect.any(String) })
      });
    });
  });

  // ============================================================================
  // Optional Comment Properties
  // ============================================================================

  describe('Optional Comment Properties', () => {
    it('should allow optional edited_on field as ISO date string', () => {
      expect(validCommentWithEditedOn.edited_on).toBeDefined();
      expect(typeof validCommentWithEditedOn.edited_on).toBe('string');
      expect(new Date(validCommentWithEditedOn.edited_on!)).toBeInstanceOf(Date);
      expect(new Date(validCommentWithEditedOn.edited_on!).toISOString()).toBe(validCommentWithEditedOn.edited_on);
    });

    it('should handle comment without edited_on field', () => {
      expect(validComment.edited_on).toBeUndefined();
    });
  });

  // ============================================================================
  // Content Field Validation
  // ============================================================================

  describe('Content Field Validation', () => {
    it('should validate content raw field as string', () => {
      expect(typeof validComment.content.raw).toBe('string');
      expect(validComment.content.raw.length).toBeGreaterThan(0);
    });

    it('should validate content markup field as string', () => {
      expect(typeof validComment.content.markup).toBe('string');
      expect(validComment.content.markup.length).toBeGreaterThan(0);
    });

    it('should validate content html field as string', () => {
      expect(typeof validComment.content.html).toBe('string');
      expect(validComment.content.html.length).toBeGreaterThan(0);
    });

    it('should validate content type field as string', () => {
      expect(typeof validComment.content.type).toBe('string');
      expect(validComment.content.type.length).toBeGreaterThan(0);
    });

    it('should support different content types', () => {
      const contentTypes = ['text', 'markdown', 'html'];
      
      contentTypes.forEach(type => {
        const comment = {
          ...validComment,
          content: {
            ...validComment.content,
            type
          }
        };
        expect(comment.content.type).toBe(type);
      });
    });

    it('should support different markup types', () => {
      const markupTypes = ['markdown', 'creole', 'plaintext'];
      
      markupTypes.forEach(markup => {
        const comment = {
          ...validComment,
          content: {
            ...validComment.content,
            markup
          }
        };
        expect(comment.content.markup).toBe(markup);
      });
    });
  });

  // ============================================================================
  // User Field Validation
  // ============================================================================

  describe('User Field Validation', () => {
    it('should validate user uuid field format', () => {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidPattern.test(validComment.user.uuid)).toBe(true);
    });

    it('should validate user account_id field format', () => {
      const accountIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(accountIdPattern.test(validComment.user.account_id)).toBe(true);
    });

    it('should validate user display_name field as non-empty string', () => {
      expect(typeof validComment.user.display_name).toBe('string');
      expect(validComment.user.display_name.length).toBeGreaterThan(0);
    });

    it('should validate user nickname field as non-empty string', () => {
      expect(typeof validComment.user.nickname).toBe('string');
      expect(validComment.user.nickname.length).toBeGreaterThan(0);
    });

    it('should validate user links structure', () => {
      expect(validComment.user.links).toMatchObject({
        self: expect.objectContaining({ href: expect.any(String) }),
        html: expect.objectContaining({ href: expect.any(String) }),
        avatar: expect.objectContaining({ href: expect.any(String) })
      });
    });

    it('should validate user links URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      
      expect(urlPattern.test(validComment.user.links.self.href)).toBe(true);
      expect(urlPattern.test(validComment.user.links.html.href)).toBe(true);
      expect(urlPattern.test(validComment.user.links.avatar.href)).toBe(true);
    });
  });

  // ============================================================================
  // Date Field Validation
  // ============================================================================

  describe('Date Field Validation', () => {
    it('should validate created_on date format', () => {
      const validDateFormats = [
        '2024-12-19T10:00:00.000Z',
        '2024-12-19T10:00:00Z',
        '2024-12-19T10:00:00.123Z'
      ];

      validDateFormats.forEach(dateString => {
        const comment = { ...validComment, created_on: dateString };
        expect(new Date(comment.created_on)).toBeInstanceOf(Date);
        expect(new Date(comment.created_on).toISOString()).toBe(dateString);
      });
    });

    it('should validate updated_on date format', () => {
      const validDateFormats = [
        '2024-12-19T10:00:00.000Z',
        '2024-12-19T10:00:00Z',
        '2024-12-19T10:00:00.123Z'
      ];

      validDateFormats.forEach(dateString => {
        const comment = { ...validComment, updated_on: dateString };
        expect(new Date(comment.updated_on)).toBeInstanceOf(Date);
        expect(new Date(comment.updated_on).toISOString()).toBe(dateString);
      });
    });

    it('should validate edited_on date format when present', () => {
      const validDateFormats = [
        '2024-12-19T11:00:00.000Z',
        '2024-12-19T11:00:00Z',
        '2024-12-19T11:00:00.123Z'
      ];

      validDateFormats.forEach(dateString => {
        const comment = { ...validComment, edited_on: dateString };
        expect(new Date(comment.edited_on!)).toBeInstanceOf(Date);
        expect(new Date(comment.edited_on!).toISOString()).toBe(dateString);
      });
    });
  });

  // ============================================================================
  // Links Field Validation
  // ============================================================================

  describe('Links Field Validation', () => {
    it('should validate self link URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      expect(urlPattern.test(validComment.links.self.href)).toBe(true);
    });

    it('should validate html link URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      expect(urlPattern.test(validComment.links.html.href)).toBe(true);
    });

    it('should validate self link contains comment ID', () => {
      expect(validComment.links.self.href).toContain('/comments/');
      expect(validComment.links.self.href).toContain(validComment.id.toString());
    });

    it('should validate html link contains comment reference', () => {
      expect(validComment.links.html.href).toContain('#comment-');
      expect(validComment.links.html.href).toContain(validComment.id.toString());
    });
  });

  // ============================================================================
  // Business Rules Validation
  // ============================================================================

  describe('Business Rules Validation', () => {
    it('should ensure updated_on is not before created_on', () => {
      const createdDate = new Date(validComment.created_on);
      const updatedDate = new Date(validComment.updated_on);
      
      expect(updatedDate.getTime()).toBeGreaterThanOrEqual(createdDate.getTime());
    });

    it('should ensure edited_on is not before created_on when present', () => {
      const createdDate = new Date(validCommentWithEditedOn.created_on);
      const editedDate = new Date(validCommentWithEditedOn.edited_on!);
      
      expect(editedDate.getTime()).toBeGreaterThanOrEqual(createdDate.getTime());
    });

    it('should ensure edited_on is not before updated_on when present', () => {
      const updatedDate = new Date(validCommentWithEditedOn.updated_on);
      const editedDate = new Date(validCommentWithEditedOn.edited_on!);
      
      expect(editedDate.getTime()).toBeGreaterThanOrEqual(updatedDate.getTime());
    });

    it('should ensure content raw field is not empty', () => {
      expect(validComment.content.raw.trim().length).toBeGreaterThan(0);
    });

    it('should ensure content html field is not empty', () => {
      expect(validComment.content.html.trim().length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle comment with minimal content', () => {
      const minimalComment = {
        ...validComment,
        content: {
          raw: 'a',
          markup: 'markdown',
          html: '<p>a</p>',
          type: 'text'
        }
      };

      expect(minimalComment.content.raw).toBe('a');
      expect(minimalComment.content.html).toBe('<p>a</p>');
    });

    it('should handle comment with long content', () => {
      const longContent = 'a'.repeat(10000);
      const longComment = {
        ...validComment,
        content: {
          raw: longContent,
          markup: 'markdown',
          html: `<p>${longContent}</p>`,
          type: 'text'
        }
      };

      expect(longComment.content.raw.length).toBe(10000);
      expect(longComment.content.html.length).toBeGreaterThan(10000);
    });

    it('should handle comment with special characters in content', () => {
      const specialContent = 'Comment with special chars: <>&"\'`';
      const specialComment = {
        ...validComment,
        content: {
          raw: specialContent,
          markup: 'markdown',
          html: `<p>${specialContent}</p>`,
          type: 'text'
        }
      };

      expect(specialComment.content.raw).toContain('<');
      expect(specialComment.content.raw).toContain('>');
      expect(specialComment.content.raw).toContain('&');
      expect(specialComment.content.raw).toContain('"');
      expect(specialComment.content.raw).toContain("'");
      expect(specialComment.content.raw).toContain('`');
    });

    it('should handle comment with unicode characters', () => {
      const unicodeContent = 'Comment with unicode: 🚀 émojis and ñ characters';
      const unicodeComment = {
        ...validComment,
        content: {
          raw: unicodeContent,
          markup: 'markdown',
          html: `<p>${unicodeContent}</p>`,
          type: 'text'
        }
      };

      expect(unicodeComment.content.raw).toContain('🚀');
      expect(unicodeComment.content.raw).toContain('é');
      expect(unicodeComment.content.raw).toContain('ñ');
    });

    it('should handle comment with markdown formatting', () => {
      const markdownContent = '# Header\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2';
      const markdownComment = {
        ...validComment,
        content: {
          raw: markdownContent,
          markup: 'markdown',
          html: '<h1>Header</h1>\n<p><strong>Bold text</strong> and <em>italic text</em></p>\n<ul>\n<li>List item 1</li>\n<li>List item 2</li>\n</ul>',
          type: 'text'
        }
      };

      expect(markdownComment.content.raw).toContain('# Header');
      expect(markdownComment.content.raw).toContain('**Bold text**');
      expect(markdownComment.content.raw).toContain('*italic text*');
      expect(markdownComment.content.raw).toContain('- List item');
    });

    it('should handle comment with same created_on and updated_on', () => {
      const sameDate = '2024-12-19T10:00:00.000Z';
      const sameDateComment = {
        ...validComment,
        created_on: sameDate,
        updated_on: sameDate
      };

      expect(sameDateComment.created_on).toBe(sameDateComment.updated_on);
    });

    it('should handle comment with same created_on, updated_on and edited_on', () => {
      const sameDate = '2024-12-19T10:00:00.000Z';
      const sameDateComment = {
        ...validComment,
        created_on: sameDate,
        updated_on: sameDate,
        edited_on: sameDate
      };

      expect(sameDateComment.created_on).toBe(sameDateComment.updated_on);
      expect(sameDateComment.updated_on).toBe(sameDateComment.edited_on);
    });
  });

  // ============================================================================
  // Type Safety Tests
  // ============================================================================

  describe('Type Safety Tests', () => {
    it('should enforce correct types for all fields', () => {
      // These tests ensure TypeScript type safety
      expect(typeof validComment.id).toBe('number');
      expect(typeof validComment.content.raw).toBe('string');
      expect(typeof validComment.content.markup).toBe('string');
      expect(typeof validComment.content.html).toBe('string');
      expect(typeof validComment.content.type).toBe('string');
      expect(typeof validComment.user.uuid).toBe('string');
      expect(typeof validComment.user.display_name).toBe('string');
      expect(typeof validComment.user.nickname).toBe('string');
      expect(typeof validComment.user.account_id).toBe('string');
      expect(typeof validComment.created_on).toBe('string');
      expect(typeof validComment.updated_on).toBe('string');
      expect(typeof validComment.links.self.href).toBe('string');
      expect(typeof validComment.links.html.href).toBe('string');
    });

    it('should handle optional edited_on field type correctly', () => {
      if (validCommentWithEditedOn.edited_on) {
        expect(typeof validCommentWithEditedOn.edited_on).toBe('string');
      }
    });
  });
});
