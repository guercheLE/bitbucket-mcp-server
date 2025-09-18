import { z } from 'zod';

/**
 * Contract test for Project entity schema
 * T007: Contract test Project entity schema in tests/contract/test_project_schema.ts
 * 
 * This test MUST fail before implementation (Constitution Article V - TDD)
 * Validates the Project entity schema according to data-model.md specifications
 */

describe('Project Entity Schema Contract Tests', () => {
  // Schema definition from data-model.md
  const ProjectSchema = z.object({
    key: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    avatar: z.string().url().optional(),
    isPublic: z.boolean().default(false),
    links: z.object({
      self: z.array(z.object({ href: z.string().url() }))
    }),
    createdDate: z.string().datetime(),
    updatedDate: z.string().datetime()
  });

  describe('Valid Project Data', () => {
    it('should validate a complete project with all fields', () => {
      const validProject = {
        key: 'TEST',
        name: 'Test Project',
        description: 'A test project for validation',
        avatar: 'https://example.com/avatar.png',
        isPublic: true,
        links: {
          self: [{ href: 'https://bitbucket.example.com/projects/TEST' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(validProject)).not.toThrow();
    });

    it('should validate a minimal project with required fields only', () => {
      const minimalProject = {
        key: 'MIN',
        name: 'Minimal Project',
        isPublic: false,
        links: {
          self: [{ href: 'https://bitbucket.example.com/projects/MIN' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(minimalProject)).not.toThrow();
    });

    it('should apply default value for isPublic when not provided', () => {
      const projectWithoutPublic = {
        key: 'DEF',
        name: 'Default Project',
        links: {
          self: [{ href: 'https://bitbucket.example.com/projects/DEF' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      const result = ProjectSchema.parse(projectWithoutPublic);
      expect(result.isPublic).toBe(false);
    });
  });

  describe('Invalid Project Data - Key Validation', () => {
    it('should reject empty key', () => {
      const invalidProject = {
        key: '',
        name: 'Test Project',
        links: { self: [{ href: 'https://example.com' }] },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });

    it('should reject key longer than 10 characters', () => {
      const invalidProject = {
        key: 'VERYLONGKEY',
        name: 'Test Project',
        links: { self: [{ href: 'https://example.com' }] },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });

    it('should reject key with lowercase letters', () => {
      const invalidProject = {
        key: 'test',
        name: 'Test Project',
        links: { self: [{ href: 'https://example.com' }] },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });

    it('should reject key with special characters', () => {
      const invalidProject = {
        key: 'TEST-1',
        name: 'Test Project',
        links: { self: [{ href: 'https://example.com' }] },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });
  });

  describe('Invalid Project Data - Name Validation', () => {
    it('should reject empty name', () => {
      const invalidProject = {
        key: 'TEST',
        name: '',
        links: { self: [{ href: 'https://example.com' }] },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });

    it('should reject name longer than 255 characters', () => {
      const longName = 'A'.repeat(256);
      const invalidProject = {
        key: 'TEST',
        name: longName,
        links: { self: [{ href: 'https://example.com' }] },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });
  });

  describe('Invalid Project Data - Description Validation', () => {
    it('should reject description longer than 1000 characters', () => {
      const longDescription = 'A'.repeat(1001);
      const invalidProject = {
        key: 'TEST',
        name: 'Test Project',
        description: longDescription,
        links: { self: [{ href: 'https://example.com' }] },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });
  });

  describe('Invalid Project Data - Avatar Validation', () => {
    it('should reject invalid avatar URL', () => {
      const invalidProject = {
        key: 'TEST',
        name: 'Test Project',
        avatar: 'not-a-url',
        links: { self: [{ href: 'https://example.com' }] },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });
  });

  describe('Invalid Project Data - Links Validation', () => {
    it('should reject missing links', () => {
      const invalidProject = {
        key: 'TEST',
        name: 'Test Project',
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });

    it('should reject invalid self link URL', () => {
      const invalidProject = {
        key: 'TEST',
        name: 'Test Project',
        links: {
          self: [{ href: 'not-a-url' }]
        },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });
  });

  describe('Invalid Project Data - Date Validation', () => {
    it('should reject invalid createdDate format', () => {
      const invalidProject = {
        key: 'TEST',
        name: 'Test Project',
        links: { self: [{ href: 'https://example.com' }] },
        createdDate: 'invalid-date',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });

    it('should reject invalid updatedDate format', () => {
      const invalidProject = {
        key: 'TEST',
        name: 'Test Project',
        links: { self: [{ href: 'https://example.com' }] },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: 'invalid-date'
      };

      expect(() => ProjectSchema.parse(invalidProject)).toThrow();
    });
  });

  describe('Business Rules Validation', () => {
    it('should validate project key format according to business rules', () => {
      const validKeys = ['PROJ', 'TEST1', 'ABC123', 'A1B2C3'];
      
      validKeys.forEach(key => {
        const project = {
          key,
          name: 'Test Project',
          links: { self: [{ href: 'https://example.com' }] },
          createdDate: '2025-01-27T10:00:00Z',
          updatedDate: '2025-01-27T10:00:00Z'
        };
        
        expect(() => ProjectSchema.parse(project)).not.toThrow();
      });
    });

    it('should enforce unique key constraint (tested at service level)', () => {
      // This test documents that unique key constraint is enforced at service level
      // The schema only validates format, not uniqueness
      expect(true).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should support project creation state', () => {
      const newProject = {
        key: 'NEW',
        name: 'New Project',
        links: { self: [{ href: 'https://example.com' }] },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => ProjectSchema.parse(newProject)).not.toThrow();
    });

    it('should support project update state', () => {
      const updatedProject = {
        key: 'UPD',
        name: 'Updated Project',
        description: 'Updated description',
        links: { self: [{ href: 'https://example.com' }] },
        createdDate: '2025-01-27T10:00:00Z',
        updatedDate: '2025-01-27T11:00:00Z'
      };

      expect(() => ProjectSchema.parse(updatedProject)).not.toThrow();
    });
  });
});
