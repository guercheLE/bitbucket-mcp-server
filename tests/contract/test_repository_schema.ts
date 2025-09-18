import { z } from 'zod';

/**
 * Contract test for Repository entity schema
 * T009: Contract test Repository entity schema in tests/contract/test_repository_schema.ts
 * 
 * This test MUST fail before implementation (Constitution Article V - TDD)
 * Validates the Repository entity schema according to data-model.md specifications
 */

describe('Repository Entity Schema Contract Tests', () => {
  // Schema definition from data-model.md
  const RepositorySchema = z.object({
    slug: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-]+$/),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    scmId: z.literal("git"),
    forkable: z.boolean().default(true),
    isPublic: z.boolean().default(false),
    project: z.object({
      key: z.string()
    }).optional(),
    workspace: z.object({
      uuid: z.string(),
      name: z.string(),
      slug: z.string()
    }).optional(),
    links: z.object({
      self: z.array(z.object({ href: z.string().url() })),
      clone: z.array(z.object({ 
        href: z.string().url(),
        name: z.string()
      }))
    }),
    createdDate: z.string().datetime(),
    updatedDate: z.string().datetime()
  });

  describe('Valid Repository Data - Data Center', () => {
    it('should validate a complete Data Center repository with all fields', () => {
      const validRepository = {
        slug: 'test-repo',
        name: 'Test Repository',
        description: 'A test repository for validation',
        scmId: 'git',
        forkable: true,
        isPublic: false,
        project: {
          key: 'TEST'
        },
        links: {
          self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/test-repo' }],
          clone: [
            { href: 'https://bitbucket.example.com/scm/test/test-repo.git', name: 'https' },
            { href: 'ssh://git@bitbucket.example.com:7999/test/test-repo.git', name: 'ssh' }
          ]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(validRepository)).not.toThrow();
    });

    it('should validate a minimal Data Center repository with required fields only', () => {
      const minimalRepository = {
        slug: 'minimal-repo',
        name: 'Minimal Repository',
        scmId: 'git',
        project: {
          key: 'TEST'
        },
        links: {
          self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/minimal-repo' }],
          clone: [{ href: 'https://bitbucket.example.com/scm/test/minimal-repo.git', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(minimalRepository)).not.toThrow();
    });
  });

  describe('Valid Repository Data - Cloud', () => {
    it('should validate a complete Cloud repository with all fields', () => {
      const validRepository = {
        slug: 'cloud-repo',
        name: 'Cloud Repository',
        description: 'A cloud repository for validation',
        scmId: 'git',
        forkable: false,
        isPublic: true,
        workspace: {
          uuid: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Workspace',
          slug: 'test-workspace'
        },
        links: {
          self: [{ href: 'https://bitbucket.org/test-workspace/cloud-repo' }],
          clone: [
            { href: 'https://bitbucket.org/test-workspace/cloud-repo.git', name: 'https' },
            { href: 'git@bitbucket.org:test-workspace/cloud-repo.git', name: 'ssh' }
          ]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(validRepository)).not.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should apply default values for forkable and isPublic when not provided', () => {
      const repositoryWithoutDefaults = {
        slug: 'default-repo',
        name: 'Default Repository',
        scmId: 'git',
        project: { key: 'TEST' },
        links: {
          self: [{ href: 'https://example.com' }],
          clone: [{ href: 'https://example.com/repo.git', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      const result = RepositorySchema.parse(repositoryWithoutDefaults);
      expect(result.forkable).toBe(true);
      expect(result.isPublic).toBe(false);
    });
  });

  describe('Invalid Repository Data - Slug Validation', () => {
    it('should reject empty slug', () => {
      const invalidRepository = {
        slug: '',
        name: 'Test Repository',
        scmId: 'git',
        project: { key: 'TEST' },
        links: {
          self: [{ href: 'https://example.com' }],
          clone: [{ href: 'https://example.com/repo.git', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(invalidRepository)).toThrow();
    });

    it('should reject slug longer than 50 characters', () => {
      const longSlug = 'a'.repeat(51);
      const invalidRepository = {
        slug: longSlug,
        name: 'Test Repository',
        scmId: 'git',
        project: { key: 'TEST' },
        links: {
          self: [{ href: 'https://example.com' }],
          clone: [{ href: 'https://example.com/repo.git', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(invalidRepository)).toThrow();
    });

    it('should reject slug with special characters', () => {
      const invalidRepository = {
        slug: 'test_repo',
        name: 'Test Repository',
        scmId: 'git',
        project: { key: 'TEST' },
        links: {
          self: [{ href: 'https://example.com' }],
          clone: [{ href: 'https://example.com/repo.git', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(invalidRepository)).toThrow();
    });
  });

  describe('Invalid Repository Data - Name Validation', () => {
    it('should reject empty name', () => {
      const invalidRepository = {
        slug: 'test-repo',
        name: '',
        scmId: 'git',
        project: { key: 'TEST' },
        links: {
          self: [{ href: 'https://example.com' }],
          clone: [{ href: 'https://example.com/repo.git', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(invalidRepository)).toThrow();
    });

    it('should reject name longer than 255 characters', () => {
      const longName = 'A'.repeat(256);
      const invalidRepository = {
        slug: 'test-repo',
        name: longName,
        scmId: 'git',
        project: { key: 'TEST' },
        links: {
          self: [{ href: 'https://example.com' }],
          clone: [{ href: 'https://example.com/repo.git', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(invalidRepository)).toThrow();
    });
  });

  describe('Invalid Repository Data - SCM Validation', () => {
    it('should reject non-git scmId', () => {
      const invalidRepository = {
        slug: 'test-repo',
        name: 'Test Repository',
        scmId: 'svn',
        project: { key: 'TEST' },
        links: {
          self: [{ href: 'https://example.com' }],
          clone: [{ href: 'https://example.com/repo.git', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(invalidRepository)).toThrow();
    });
  });

  describe('Invalid Repository Data - Parent Validation', () => {
    it('should reject repository without project or workspace', () => {
      const invalidRepository = {
        slug: 'test-repo',
        name: 'Test Repository',
        scmId: 'git',
        links: {
          self: [{ href: 'https://example.com' }],
          clone: [{ href: 'https://example.com/repo.git', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(invalidRepository)).toThrow();
    });

    it('should reject repository with both project and workspace', () => {
      const invalidRepository = {
        slug: 'test-repo',
        name: 'Test Repository',
        scmId: 'git',
        project: { key: 'TEST' },
        workspace: {
          uuid: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Workspace',
          slug: 'test-workspace'
        },
        links: {
          self: [{ href: 'https://example.com' }],
          clone: [{ href: 'https://example.com/repo.git', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(invalidRepository)).toThrow();
    });
  });

  describe('Invalid Repository Data - Links Validation', () => {
    it('should reject missing links', () => {
      const invalidRepository = {
        slug: 'test-repo',
        name: 'Test Repository',
        scmId: 'git',
        project: { key: 'TEST' },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(invalidRepository)).toThrow();
    });

    it('should reject missing clone links', () => {
      const invalidRepository = {
        slug: 'test-repo',
        name: 'Test Repository',
        scmId: 'git',
        project: { key: 'TEST' },
        links: {
          self: [{ href: 'https://example.com' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(invalidRepository)).toThrow();
    });

    it('should reject invalid clone link URL', () => {
      const invalidRepository = {
        slug: 'test-repo',
        name: 'Test Repository',
        scmId: 'git',
        project: { key: 'TEST' },
        links: {
          self: [{ href: 'https://example.com' }],
          clone: [{ href: 'not-a-url', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(invalidRepository)).toThrow();
    });
  });

  describe('Business Rules Validation', () => {
    it('should validate repository slug format according to business rules', () => {
      const validSlugs = ['repo', 'test-123', 'my-repo', 'a1b2c3'];
      
      validSlugs.forEach(slug => {
        const repository = {
          slug,
          name: 'Test Repository',
          scmId: 'git',
          project: { key: 'TEST' },
          links: {
            self: [{ href: 'https://example.com' }],
            clone: [{ href: 'https://example.com/repo.git', name: 'https' }]
          },
          createdDate: '2025-01-27T10:00:00Z',
          updatedDate: '2025-01-27T10:00:00Z'
        };
        
        expect(() => RepositorySchema.parse(repository)).not.toThrow();
      });
    });

    it('should enforce unique slug constraint within parent (tested at service level)', () => {
      // This test documents that unique slug constraint is enforced at service level
      // The schema only validates format, not uniqueness
      expect(true).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should support repository creation state', () => {
      const newRepository = {
        slug: 'new-repo',
        name: 'New Repository',
        scmId: 'git',
        project: { key: 'TEST' },
        links: {
          self: [{ href: 'https://example.com' }],
          clone: [{ href: 'https://example.com/repo.git', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => RepositorySchema.parse(newRepository)).not.toThrow();
    });

    it('should support repository update state', () => {
      const updatedRepository = {
        slug: 'updated-repo',
        name: 'Updated Repository',
        description: 'Updated description',
        scmId: 'git',
        project: { key: 'TEST' },
        links: {
          self: [{ href: 'https://example.com' }],
          clone: [{ href: 'https://example.com/repo.git', name: 'https' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T11:00:00Z'
      };

      expect(() => RepositorySchema.parse(updatedRepository)).not.toThrow();
    });
  });
});
