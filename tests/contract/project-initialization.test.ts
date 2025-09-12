/**
 * Contract tests for Project Initialization API
 * TDD Red Phase - These tests should fail initially
 */

import { z } from 'zod';

// These schemas will be imported from the actual implementation
// For now, we define them here to test the contracts

describe('Project Initialization Contracts', () => {
  describe('InitializeProjectRequest Schema', () => {
    let InitializeProjectRequestSchema: z.ZodSchema<any>;

    beforeEach(async () => {
      // This will fail initially as the schema doesn't exist yet
      const { InitializeProjectRequestSchema: schema } = await import('@/types/index');
      InitializeProjectRequestSchema = schema;
    });

    it('should validate valid project initialization request', () => {
      const validRequest = {
        name: 'my-awesome-project',
        description: 'A fantastic project',
        author: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          url: 'https://johndoe.com',
        },
        license: 'MIT',
        repository: {
          type: 'git',
          url: 'https://github.com/johndoe/my-awesome-project.git',
        },
        keywords: ['typescript', 'node', 'api'],
        engines: {
          node: '>=18.0.0',
        },
      };

      const result = InitializeProjectRequestSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should reject invalid project name', () => {
      const invalidRequest = {
        name: 'Invalid Project Name!', // Invalid: contains spaces and special characters
        description: 'A project with invalid name',
        author: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
      };

      expect(() => {
        InitializeProjectRequestSchema.parse(invalidRequest);
      }).toThrow();
    });

    it('should reject project name that is too long', () => {
      const invalidRequest = {
        name: 'a'.repeat(215), // Invalid: too long (max 214 chars)
        description: 'A project with name too long',
        author: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
      };

      expect(() => {
        InitializeProjectRequestSchema.parse(invalidRequest);
      }).toThrow();
    });

    it('should reject project name starting with dot or underscore', () => {
      const invalidRequest = {
        name: '.invalid-name', // Invalid: starts with dot
        description: 'A project with invalid name',
        author: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
      };

      expect(() => {
        InitializeProjectRequestSchema.parse(invalidRequest);
      }).toThrow();
    });

    it('should reject invalid email format', () => {
      const invalidRequest = {
        name: 'valid-project-name',
        description: 'A project with invalid email',
        author: {
          name: 'John Doe',
          email: 'invalid-email', // Invalid email format
        },
      };

      expect(() => {
        InitializeProjectRequestSchema.parse(invalidRequest);
      }).toThrow();
    });

    it('should reject invalid URL format', () => {
      const invalidRequest = {
        name: 'valid-project-name',
        description: 'A project with invalid URL',
        author: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          url: 'not-a-valid-url', // Invalid URL format
        },
      };

      expect(() => {
        InitializeProjectRequestSchema.parse(invalidRequest);
      }).toThrow();
    });

    it('should accept valid URL formats', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://subdomain.example.com/path',
        'https://example.com:8080',
      ];

      validUrls.forEach(url => {
        const request = {
          name: 'valid-project-name',
          description: 'A project with valid URL',
          author: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            url,
          },
        };

        expect(() => {
          InitializeProjectRequestSchema.parse(request);
        }).not.toThrow();
      });
    });

    it('should validate required fields', () => {
      const incompleteRequest = {
        // Missing required 'name' field
        description: 'A project without name',
        author: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
      };

      expect(() => {
        InitializeProjectRequestSchema.parse(incompleteRequest);
      }).toThrow();
    });

    it('should validate author name is not empty', () => {
      const invalidRequest = {
        name: 'valid-project-name',
        description: 'A project with empty author name',
        author: {
          name: '', // Invalid: empty name
          email: 'john.doe@example.com',
        },
      };

      expect(() => {
        InitializeProjectRequestSchema.parse(invalidRequest);
      }).toThrow();
    });

    it('should validate keywords array', () => {
      const invalidRequest = {
        name: 'valid-project-name',
        description: 'A project with invalid keywords',
        author: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        keywords: ['valid-keyword', '', 'another-valid'], // Invalid: contains empty string
      };

      expect(() => {
        InitializeProjectRequestSchema.parse(invalidRequest);
      }).toThrow();
    });

    it('should validate engine version format', () => {
      const invalidRequest = {
        name: 'valid-project-name',
        description: 'A project with invalid engine version',
        author: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        engines: {
          node: 'invalid-version', // Invalid: not a valid semver range
        },
      };

      expect(() => {
        InitializeProjectRequestSchema.parse(invalidRequest);
      }).toThrow();
    });

    it('should accept valid semver ranges for engines', () => {
      const validVersions = [
        '>=18.0.0',
        '^16.0.0',
        '~14.0.0',
        '18.0.0',
        '>=16.0.0 <18.0.0',
      ];

      validVersions.forEach(version => {
        const request = {
          name: 'valid-project-name',
          description: 'A project with valid engine version',
          author: {
            name: 'John Doe',
            email: 'john.doe@example.com',
          },
          engines: {
            node: version,
          },
        };

        expect(() => {
          InitializeProjectRequestSchema.parse(request);
        }).not.toThrow();
      });
    });
  });

  describe('Project Configuration Schema', () => {
    let ProjectConfigurationSchema: z.ZodSchema<any>;

    beforeEach(async () => {
      const { ProjectConfigurationSchema: schema } = await import('@/types/index');
      ProjectConfigurationSchema = schema;
    });

    it('should validate complete project configuration', () => {
      const validConfig = {
        project: {
          name: 'my-project',
          version: '1.0.0',
          description: 'My awesome project',
        },
        dependencies: {
          production: {
            'express': '^4.18.0',
            'typescript': '^5.0.0',
          },
          development: {
            'jest': '^29.0.0',
            '@types/node': '^20.0.0',
          },
        },
        scripts: {
          build: 'tsc',
          test: 'jest',
          start: 'node dist/index.js',
        },
        config: {
          typescript: {
            strict: true,
            target: 'ES2022',
          },
          jest: {
            coverage: 80,
            timeout: 10000,
          },
        },
      };

      const result = ProjectConfigurationSchema.parse(validConfig);
      expect(result).toEqual(validConfig);
    });

    it('should reject invalid version format', () => {
      const invalidConfig = {
        project: {
          name: 'my-project',
          version: 'invalid-version', // Invalid: not semver
          description: 'My project',
        },
      };

      expect(() => {
        ProjectConfigurationSchema.parse(invalidConfig);
      }).toThrow();
    });

    it('should validate dependency version formats', () => {
      const invalidConfig = {
        project: {
          name: 'my-project',
          version: '1.0.0',
          description: 'My project',
        },
        dependencies: {
          production: {
            'express': 'invalid-version', // Invalid: not semver
          },
        },
      };

      expect(() => {
        ProjectConfigurationSchema.parse(invalidConfig);
      }).toThrow();
    });
  });

  describe('API Response Schemas', () => {
    let ProjectInitializationResponseSchema: z.ZodSchema<any>;

    beforeEach(async () => {
      const { ProjectInitializationResponseSchema: schema } = await import('@/types/index');
      ProjectInitializationResponseSchema = schema;
    });

    it('should validate successful initialization response', () => {
      const validResponse = {
        success: true,
        project: {
          name: 'my-project',
          path: '/path/to/project',
          created: '2025-01-27T10:00:00Z',
        },
        files: [
          {
            path: 'package.json',
            created: true,
          },
          {
            path: 'tsconfig.json',
            created: true,
          },
        ],
        message: 'Project initialized successfully',
      };

      const result = ProjectInitializationResponseSchema.parse(validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should validate error response', () => {
      const errorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid project name',
          details: {
            field: 'name',
            value: 'invalid-name',
          },
        },
      };

      const result = ProjectInitializationResponseSchema.parse(errorResponse);
      expect(result).toEqual(errorResponse);
    });
  });
});
