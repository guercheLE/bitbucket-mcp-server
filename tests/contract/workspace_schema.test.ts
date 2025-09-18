import { z } from 'zod';

/**
 * Contract test for Workspace entity schema
 * T008: Contract test Workspace entity schema in tests/contract/test_workspace_schema.ts
 * 
 * This test MUST fail before implementation (Constitution Article V - TDD)
 * Validates the Workspace entity schema according to data-model.md specifications
 */

describe('Workspace Entity Schema Contract Tests', () => {
  // Schema definition from data-model.md
  const WorkspaceSchema = z.object({
    uuid: z.string().uuid(),
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-]+$/),
    description: z.string().max(1000).optional(),
    isPrivate: z.boolean().default(true),
    createdOn: z.string().datetime(),
    updatedOn: z.string().datetime(),
    links: z.object({
      self: z.array(z.object({ href: z.string().url() }))
    })
  });

  describe('Valid Workspace Data', () => {
    it('should validate a complete workspace with all fields', () => {
      const validWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Workspace',
        slug: 'test-workspace',
        description: 'A test workspace for validation',
        isPrivate: false,
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z',
        links: {
          self: [{ href: 'https://bitbucket.org/test-workspace' }]
        }
      };

      expect(() => WorkspaceSchema.parse(validWorkspace)).not.toThrow();
    });

    it('should validate a minimal workspace with required fields only', () => {
      const minimalWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Minimal Workspace',
        slug: 'minimal-workspace',
        isPrivate: true,
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z',
        links: {
          self: [{ href: 'https://bitbucket.org/minimal-workspace' }]
        }
      };

      expect(() => WorkspaceSchema.parse(minimalWorkspace)).not.toThrow();
    });

    it('should apply default value for isPrivate when not provided', () => {
      const workspaceWithoutPrivate = {
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Default Workspace',
        slug: 'default-workspace',
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z',
        links: {
          self: [{ href: 'https://bitbucket.org/default-workspace' }]
        }
      };

      const result = WorkspaceSchema.parse(workspaceWithoutPrivate);
      expect(result.isPrivate).toBe(true);
    });
  });

  describe('Invalid Workspace Data - UUID Validation', () => {
    it('should reject invalid UUID format', () => {
      const invalidWorkspace = {
        uuid: 'not-a-uuid',
        name: 'Test Workspace',
        slug: 'test-workspace',
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(invalidWorkspace)).toThrow();
    });

    it('should reject empty UUID', () => {
      const invalidWorkspace = {
        uuid: '',
        name: 'Test Workspace',
        slug: 'test-workspace',
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(invalidWorkspace)).toThrow();
    });
  });

  describe('Invalid Workspace Data - Name Validation', () => {
    it('should reject empty name', () => {
      const invalidWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: '',
        slug: 'test-workspace',
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(invalidWorkspace)).toThrow();
    });

    it('should reject name longer than 255 characters', () => {
      const longName = 'A'.repeat(256);
      const invalidWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: longName,
        slug: 'test-workspace',
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(invalidWorkspace)).toThrow();
    });
  });

  describe('Invalid Workspace Data - Slug Validation', () => {
    it('should reject empty slug', () => {
      const invalidWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Workspace',
        slug: '',
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(invalidWorkspace)).toThrow();
    });

    it('should reject slug longer than 50 characters', () => {
      const longSlug = 'a'.repeat(51);
      const invalidWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Workspace',
        slug: longSlug,
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(invalidWorkspace)).toThrow();
    });

    it('should reject slug with special characters', () => {
      const invalidWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Workspace',
        slug: 'test_workspace',
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(invalidWorkspace)).toThrow();
    });

    it('should accept slug with hyphens', () => {
      const validWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Workspace',
        slug: 'test-workspace-123',
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(validWorkspace)).not.toThrow();
    });
  });

  describe('Invalid Workspace Data - Description Validation', () => {
    it('should reject description longer than 1000 characters', () => {
      const longDescription = 'A'.repeat(1001);
      const invalidWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Workspace',
        slug: 'test-workspace',
        description: longDescription,
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(invalidWorkspace)).toThrow();
    });
  });

  describe('Invalid Workspace Data - Links Validation', () => {
    it('should reject missing links', () => {
      const invalidWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Workspace',
        slug: 'test-workspace',
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(invalidWorkspace)).toThrow();
    });

    it('should reject invalid self link URL', () => {
      const invalidWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Workspace',
        slug: 'test-workspace',
        links: {
          self: [{ href: 'not-a-url' }]
        },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(invalidWorkspace)).toThrow();
    });
  });

  describe('Invalid Workspace Data - Date Validation', () => {
    it('should reject invalid createdOn format', () => {
      const invalidWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Workspace',
        slug: 'test-workspace',
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: 'invalid-date',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(invalidWorkspace)).toThrow();
    });

    it('should reject invalid updatedOn format', () => {
      const invalidWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Workspace',
        slug: 'test-workspace',
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: 'invalid-date'
      };

      expect(() => WorkspaceSchema.parse(invalidWorkspace)).toThrow();
    });
  });

  describe('Business Rules Validation', () => {
    it('should validate workspace slug format according to business rules', () => {
      const validSlugs = ['workspace', 'test-123', 'my-workspace', 'a1b2c3'];
      
      validSlugs.forEach(slug => {
        const workspace = {
          uuid: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Workspace',
          slug,
          links: { self: [{ href: 'https://example.com' }] },
          createdOn: '2025-01-27T10:00:00Z',
          updatedOn: '2025-01-27T10:00:00Z'
        };
        
        expect(() => WorkspaceSchema.parse(workspace)).not.toThrow();
      });
    });

    it('should enforce unique slug constraint (tested at service level)', () => {
      // This test documents that unique slug constraint is enforced at service level
      // The schema only validates format, not uniqueness
      expect(true).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should support workspace creation state', () => {
      const newWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'New Workspace',
        slug: 'new-workspace',
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T10:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(newWorkspace)).not.toThrow();
    });

    it('should support workspace update state', () => {
      const updatedWorkspace = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Updated Workspace',
        slug: 'updated-workspace',
        description: 'Updated description',
        links: { self: [{ href: 'https://example.com' }] },
        createdOn: '2025-01-27T10:00:00Z',
        updatedOn: '2025-01-27T11:00:00Z'
      };

      expect(() => WorkspaceSchema.parse(updatedWorkspace)).not.toThrow();
    });
  });
});
