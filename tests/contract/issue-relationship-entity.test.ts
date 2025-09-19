/**
 * Contract Tests: Issue Relationship Entity Validation
 * 
 * Testa a validação e estrutura da entidade IssueRelationship
 * conforme definido no modelo de dados
 * 
 * @fileoverview Testes de contrato para entidade IssueRelationship
 * @version 1.0.0
 * @since 2024-12-19
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  IssueRelationship, 
  IssueRelationshipType 
} from '../../src/types/issues';

// ============================================================================
// Mock Data
// ============================================================================

const validIssueRelationship: IssueRelationship = {
  id: 1,
  type: 'relates',
  issue: {
    id: 1,
    title: 'Source Issue',
    links: {
      self: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1' },
      html: { href: 'https://bitbucket.org/workspace/repo/issues/1' }
    }
  },
  related_issue: {
    id: 2,
    title: 'Related Issue',
    links: {
      self: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/2' },
      html: { href: 'https://bitbucket.org/workspace/repo/issues/2' }
    }
  },
  created_on: '2024-12-19T10:00:00.000Z',
  updated_on: '2024-12-19T10:00:00.000Z',
  links: {
    self: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/relationships/1' },
    html: { href: 'https://bitbucket.org/workspace/repo/issues/1#relationships' }
  }
};

// ============================================================================
// Contract Tests
// ============================================================================

describe('Issue Relationship Entity Contract Tests', () => {
  beforeEach(() => {
    // Setup test environment
  });

  // ============================================================================
  // Core Relationship Properties
  // ============================================================================

  describe('Core Relationship Properties', () => {
    it('should have required id field as number', () => {
      expect(validIssueRelationship.id).toBeDefined();
      expect(typeof validIssueRelationship.id).toBe('number');
      expect(validIssueRelationship.id).toBeGreaterThan(0);
    });

    it('should have required type field with valid values', () => {
      const validTypes: IssueRelationshipType[] = [
        'relates',
        'duplicates',
        'duplicated_by',
        'blocks',
        'blocked_by',
        'clones',
        'cloned_by'
      ];
      expect(validTypes).toContain(validIssueRelationship.type);
    });

    it('should have required issue field with correct structure', () => {
      expect(validIssueRelationship.issue).toBeDefined();
      expect(validIssueRelationship.issue).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        links: expect.objectContaining({
          self: expect.objectContaining({ href: expect.any(String) }),
          html: expect.objectContaining({ href: expect.any(String) })
        })
      });
    });

    it('should have required related_issue field with correct structure', () => {
      expect(validIssueRelationship.related_issue).toBeDefined();
      expect(validIssueRelationship.related_issue).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        links: expect.objectContaining({
          self: expect.objectContaining({ href: expect.any(String) }),
          html: expect.objectContaining({ href: expect.any(String) })
        })
      });
    });

    it('should have required created_on field as ISO date string', () => {
      expect(validIssueRelationship.created_on).toBeDefined();
      expect(typeof validIssueRelationship.created_on).toBe('string');
      expect(new Date(validIssueRelationship.created_on)).toBeInstanceOf(Date);
      expect(new Date(validIssueRelationship.created_on).toISOString()).toBe(validIssueRelationship.created_on);
    });

    it('should have required updated_on field as ISO date string', () => {
      expect(validIssueRelationship.updated_on).toBeDefined();
      expect(typeof validIssueRelationship.updated_on).toBe('string');
      expect(new Date(validIssueRelationship.updated_on)).toBeInstanceOf(Date);
      expect(new Date(validIssueRelationship.updated_on).toISOString()).toBe(validIssueRelationship.updated_on);
    });

    it('should have required links field with correct structure', () => {
      expect(validIssueRelationship.links).toBeDefined();
      expect(validIssueRelationship.links).toMatchObject({
        self: expect.objectContaining({ href: expect.any(String) }),
        html: expect.objectContaining({ href: expect.any(String) })
      });
    });
  });

  // ============================================================================
  // Relationship Type Validation
  // ============================================================================

  describe('Relationship Type Validation', () => {
    it('should validate all relationship types', () => {
      const validTypes: IssueRelationshipType[] = [
        'relates',
        'duplicates',
        'duplicated_by',
        'blocks',
        'blocked_by',
        'clones',
        'cloned_by'
      ];

      validTypes.forEach(type => {
        const relationship = { ...validIssueRelationship, type };
        expect(validTypes).toContain(relationship.type);
      });
    });

    it('should validate relates relationship type', () => {
      const relatesRelationship = { ...validIssueRelationship, type: 'relates' as IssueRelationshipType };
      expect(relatesRelationship.type).toBe('relates');
    });

    it('should validate duplicates relationship type', () => {
      const duplicatesRelationship = { ...validIssueRelationship, type: 'duplicates' as IssueRelationshipType };
      expect(duplicatesRelationship.type).toBe('duplicates');
    });

    it('should validate duplicated_by relationship type', () => {
      const duplicatedByRelationship = { ...validIssueRelationship, type: 'duplicated_by' as IssueRelationshipType };
      expect(duplicatedByRelationship.type).toBe('duplicated_by');
    });

    it('should validate blocks relationship type', () => {
      const blocksRelationship = { ...validIssueRelationship, type: 'blocks' as IssueRelationshipType };
      expect(blocksRelationship.type).toBe('blocks');
    });

    it('should validate blocked_by relationship type', () => {
      const blockedByRelationship = { ...validIssueRelationship, type: 'blocked_by' as IssueRelationshipType };
      expect(blockedByRelationship.type).toBe('blocked_by');
    });

    it('should validate clones relationship type', () => {
      const clonesRelationship = { ...validIssueRelationship, type: 'clones' as IssueRelationshipType };
      expect(clonesRelationship.type).toBe('clones');
    });

    it('should validate cloned_by relationship type', () => {
      const clonedByRelationship = { ...validIssueRelationship, type: 'cloned_by' as IssueRelationshipType };
      expect(clonedByRelationship.type).toBe('cloned_by');
    });
  });

  // ============================================================================
  // Issue Field Validation
  // ============================================================================

  describe('Issue Field Validation', () => {
    it('should validate issue id field as positive number', () => {
      expect(validIssueRelationship.issue.id).toBeDefined();
      expect(typeof validIssueRelationship.issue.id).toBe('number');
      expect(validIssueRelationship.issue.id).toBeGreaterThan(0);
    });

    it('should validate issue title field as non-empty string', () => {
      expect(validIssueRelationship.issue.title).toBeDefined();
      expect(typeof validIssueRelationship.issue.title).toBe('string');
      expect(validIssueRelationship.issue.title.length).toBeGreaterThan(0);
    });

    it('should validate issue links structure', () => {
      expect(validIssueRelationship.issue.links).toMatchObject({
        self: expect.objectContaining({ href: expect.any(String) }),
        html: expect.objectContaining({ href: expect.any(String) })
      });
    });

    it('should validate issue self link URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      expect(urlPattern.test(validIssueRelationship.issue.links.self.href)).toBe(true);
    });

    it('should validate issue html link URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      expect(urlPattern.test(validIssueRelationship.issue.links.html.href)).toBe(true);
    });

    it('should validate issue self link contains issue ID', () => {
      expect(validIssueRelationship.issue.links.self.href).toContain('/issues/');
      expect(validIssueRelationship.issue.links.self.href).toContain(validIssueRelationship.issue.id.toString());
    });

    it('should validate issue html link contains issue ID', () => {
      expect(validIssueRelationship.issue.links.html.href).toContain('/issues/');
      expect(validIssueRelationship.issue.links.html.href).toContain(validIssueRelationship.issue.id.toString());
    });
  });

  // ============================================================================
  // Related Issue Field Validation
  // ============================================================================

  describe('Related Issue Field Validation', () => {
    it('should validate related_issue id field as positive number', () => {
      expect(validIssueRelationship.related_issue.id).toBeDefined();
      expect(typeof validIssueRelationship.related_issue.id).toBe('number');
      expect(validIssueRelationship.related_issue.id).toBeGreaterThan(0);
    });

    it('should validate related_issue title field as non-empty string', () => {
      expect(validIssueRelationship.related_issue.title).toBeDefined();
      expect(typeof validIssueRelationship.related_issue.title).toBe('string');
      expect(validIssueRelationship.related_issue.title.length).toBeGreaterThan(0);
    });

    it('should validate related_issue links structure', () => {
      expect(validIssueRelationship.related_issue.links).toMatchObject({
        self: expect.objectContaining({ href: expect.any(String) }),
        html: expect.objectContaining({ href: expect.any(String) })
      });
    });

    it('should validate related_issue self link URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      expect(urlPattern.test(validIssueRelationship.related_issue.links.self.href)).toBe(true);
    });

    it('should validate related_issue html link URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      expect(urlPattern.test(validIssueRelationship.related_issue.links.html.href)).toBe(true);
    });

    it('should validate related_issue self link contains issue ID', () => {
      expect(validIssueRelationship.related_issue.links.self.href).toContain('/issues/');
      expect(validIssueRelationship.related_issue.links.self.href).toContain(validIssueRelationship.related_issue.id.toString());
    });

    it('should validate related_issue html link contains issue ID', () => {
      expect(validIssueRelationship.related_issue.links.html.href).toContain('/issues/');
      expect(validIssueRelationship.related_issue.links.html.href).toContain(validIssueRelationship.related_issue.id.toString());
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
        const relationship = { ...validIssueRelationship, created_on: dateString };
        expect(new Date(relationship.created_on)).toBeInstanceOf(Date);
        expect(new Date(relationship.created_on).toISOString()).toBe(dateString);
      });
    });

    it('should validate updated_on date format', () => {
      const validDateFormats = [
        '2024-12-19T10:00:00.000Z',
        '2024-12-19T10:00:00Z',
        '2024-12-19T10:00:00.123Z'
      ];

      validDateFormats.forEach(dateString => {
        const relationship = { ...validIssueRelationship, updated_on: dateString };
        expect(new Date(relationship.updated_on)).toBeInstanceOf(Date);
        expect(new Date(relationship.updated_on).toISOString()).toBe(dateString);
      });
    });
  });

  // ============================================================================
  // Links Field Validation
  // ============================================================================

  describe('Links Field Validation', () => {
    it('should validate self link URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      expect(urlPattern.test(validIssueRelationship.links.self.href)).toBe(true);
    });

    it('should validate html link URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      expect(urlPattern.test(validIssueRelationship.links.html.href)).toBe(true);
    });

    it('should validate self link contains relationship ID', () => {
      expect(validIssueRelationship.links.self.href).toContain('/relationships/');
      expect(validIssueRelationship.links.self.href).toContain(validIssueRelationship.id.toString());
    });

    it('should validate html link contains relationships reference', () => {
      expect(validIssueRelationship.links.html.href).toContain('#relationships');
    });
  });

  // ============================================================================
  // Business Rules Validation
  // ============================================================================

  describe('Business Rules Validation', () => {
    it('should ensure updated_on is not before created_on', () => {
      const createdDate = new Date(validIssueRelationship.created_on);
      const updatedDate = new Date(validIssueRelationship.updated_on);
      
      expect(updatedDate.getTime()).toBeGreaterThanOrEqual(createdDate.getTime());
    });

    it('should ensure issue and related_issue have different IDs', () => {
      expect(validIssueRelationship.issue.id).not.toBe(validIssueRelationship.related_issue.id);
    });

    it('should ensure issue and related_issue have different titles', () => {
      expect(validIssueRelationship.issue.title).not.toBe(validIssueRelationship.related_issue.title);
    });

    it('should ensure issue and related_issue have different self links', () => {
      expect(validIssueRelationship.issue.links.self.href).not.toBe(validIssueRelationship.related_issue.links.self.href);
    });

    it('should ensure issue and related_issue have different html links', () => {
      expect(validIssueRelationship.issue.links.html.href).not.toBe(validIssueRelationship.related_issue.links.html.href);
    });
  });

  // ============================================================================
  // Symmetric Relationship Validation
  // ============================================================================

  describe('Symmetric Relationship Validation', () => {
    it('should validate duplicates/duplicated_by symmetry', () => {
      const duplicatesRelationship = { ...validIssueRelationship, type: 'duplicates' as IssueRelationshipType };
      const duplicatedByRelationship = {
        ...validIssueRelationship,
        type: 'duplicated_by' as IssueRelationshipType,
        issue: validIssueRelationship.related_issue,
        related_issue: validIssueRelationship.issue
      };

      expect(duplicatesRelationship.type).toBe('duplicates');
      expect(duplicatedByRelationship.type).toBe('duplicated_by');
      expect(duplicatesRelationship.issue.id).toBe(duplicatedByRelationship.related_issue.id);
      expect(duplicatesRelationship.related_issue.id).toBe(duplicatedByRelationship.issue.id);
    });

    it('should validate blocks/blocked_by symmetry', () => {
      const blocksRelationship = { ...validIssueRelationship, type: 'blocks' as IssueRelationshipType };
      const blockedByRelationship = {
        ...validIssueRelationship,
        type: 'blocked_by' as IssueRelationshipType,
        issue: validIssueRelationship.related_issue,
        related_issue: validIssueRelationship.issue
      };

      expect(blocksRelationship.type).toBe('blocks');
      expect(blockedByRelationship.type).toBe('blocked_by');
      expect(blocksRelationship.issue.id).toBe(blockedByRelationship.related_issue.id);
      expect(blocksRelationship.related_issue.id).toBe(blockedByRelationship.issue.id);
    });

    it('should validate clones/cloned_by symmetry', () => {
      const clonesRelationship = { ...validIssueRelationship, type: 'clones' as IssueRelationshipType };
      const clonedByRelationship = {
        ...validIssueRelationship,
        type: 'cloned_by' as IssueRelationshipType,
        issue: validIssueRelationship.related_issue,
        related_issue: validIssueRelationship.issue
      };

      expect(clonesRelationship.type).toBe('clones');
      expect(clonedByRelationship.type).toBe('cloned_by');
      expect(clonesRelationship.issue.id).toBe(clonedByRelationship.related_issue.id);
      expect(clonesRelationship.related_issue.id).toBe(clonedByRelationship.issue.id);
    });

    it('should validate relates is symmetric', () => {
      const relatesRelationship1 = { ...validIssueRelationship, type: 'relates' as IssueRelationshipType };
      const relatesRelationship2 = {
        ...validIssueRelationship,
        type: 'relates' as IssueRelationshipType,
        issue: validIssueRelationship.related_issue,
        related_issue: validIssueRelationship.issue
      };

      expect(relatesRelationship1.type).toBe('relates');
      expect(relatesRelationship2.type).toBe('relates');
      expect(relatesRelationship1.issue.id).toBe(relatesRelationship2.related_issue.id);
      expect(relatesRelationship1.related_issue.id).toBe(relatesRelationship2.issue.id);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle relationship with same created_on and updated_on', () => {
      const sameDate = '2024-12-19T10:00:00.000Z';
      const sameDateRelationship = {
        ...validIssueRelationship,
        created_on: sameDate,
        updated_on: sameDate
      };

      expect(sameDateRelationship.created_on).toBe(sameDateRelationship.updated_on);
    });

    it('should handle relationship with minimal issue titles', () => {
      const minimalRelationship = {
        ...validIssueRelationship,
        issue: {
          ...validIssueRelationship.issue,
          title: 'a'
        },
        related_issue: {
          ...validIssueRelationship.related_issue,
          title: 'b'
        }
      };

      expect(minimalRelationship.issue.title).toBe('a');
      expect(minimalRelationship.related_issue.title).toBe('b');
    });

    it('should handle relationship with long issue titles', () => {
      const longTitle = 'a'.repeat(1000);
      const longTitleRelationship = {
        ...validIssueRelationship,
        issue: {
          ...validIssueRelationship.issue,
          title: longTitle
        },
        related_issue: {
          ...validIssueRelationship.related_issue,
          title: longTitle + 'b'
        }
      };

      expect(longTitleRelationship.issue.title.length).toBe(1000);
      expect(longTitleRelationship.related_issue.title.length).toBe(1001);
    });

    it('should handle relationship with special characters in titles', () => {
      const specialTitle = 'Issue with special chars: <>&"\'`';
      const specialRelationship = {
        ...validIssueRelationship,
        issue: {
          ...validIssueRelationship.issue,
          title: specialTitle
        },
        related_issue: {
          ...validIssueRelationship.related_issue,
          title: specialTitle + ' related'
        }
      };

      expect(specialRelationship.issue.title).toContain('<');
      expect(specialRelationship.issue.title).toContain('>');
      expect(specialRelationship.issue.title).toContain('&');
      expect(specialRelationship.issue.title).toContain('"');
      expect(specialRelationship.issue.title).toContain("'");
      expect(specialRelationship.issue.title).toContain('`');
    });

    it('should handle relationship with unicode characters in titles', () => {
      const unicodeTitle = 'Issue with unicode: 🚀 émojis and ñ characters';
      const unicodeRelationship = {
        ...validIssueRelationship,
        issue: {
          ...validIssueRelationship.issue,
          title: unicodeTitle
        },
        related_issue: {
          ...validIssueRelationship.related_issue,
          title: unicodeTitle + ' related'
        }
      };

      expect(unicodeRelationship.issue.title).toContain('🚀');
      expect(unicodeRelationship.issue.title).toContain('é');
      expect(unicodeRelationship.issue.title).toContain('ñ');
    });
  });

  // ============================================================================
  // Type Safety Tests
  // ============================================================================

  describe('Type Safety Tests', () => {
    it('should enforce correct types for all fields', () => {
      // These tests ensure TypeScript type safety
      expect(typeof validIssueRelationship.id).toBe('number');
      expect(typeof validIssueRelationship.type).toBe('string');
      expect(typeof validIssueRelationship.issue.id).toBe('number');
      expect(typeof validIssueRelationship.issue.title).toBe('string');
      expect(typeof validIssueRelationship.related_issue.id).toBe('number');
      expect(typeof validIssueRelationship.related_issue.title).toBe('string');
      expect(typeof validIssueRelationship.created_on).toBe('string');
      expect(typeof validIssueRelationship.updated_on).toBe('string');
      expect(typeof validIssueRelationship.links.self.href).toBe('string');
      expect(typeof validIssueRelationship.links.html.href).toBe('string');
    });

    it('should enforce relationship type enum values', () => {
      const validTypes: IssueRelationshipType[] = [
        'relates',
        'duplicates',
        'duplicated_by',
        'blocks',
        'blocked_by',
        'clones',
        'cloned_by'
      ];

      validTypes.forEach(type => {
        const relationship = { ...validIssueRelationship, type };
        expect(validTypes).toContain(relationship.type);
      });
    });
  });
});
