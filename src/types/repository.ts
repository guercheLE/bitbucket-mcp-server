import { z } from 'zod';

/**
 * Repository entity model for Bitbucket Data Center and Cloud
 * T032: Repository entity model in src/types/repository.ts
 * 
 * Represents a Git repository within a project/workspace
 * Based on data-model.md specifications
 */

// Repository schema definition
export const RepositorySchema = z.object({
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
}).refine(data => data.project || data.workspace, {
  message: "Repository must belong to either a project (Data Center) or workspace (Cloud)"
}).refine(data => !(data.project && data.workspace), {
  message: "Repository cannot belong to both project and workspace"
});

// Repository type definition
export type Repository = z.infer<typeof RepositorySchema>;

// Repository creation input schema
export const CreateRepositorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-]+$/).optional(),
  description: z.string().max(1000).optional(),
  scmId: z.literal("git").default("git"),
  forkable: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  projectKey: z.string().optional(),
  workspaceSlug: z.string().optional()
}).refine(data => data.projectKey || data.workspaceSlug, {
  message: "Repository must belong to either a project or workspace"
}).refine(data => !(data.projectKey && data.workspaceSlug), {
  message: "Repository cannot belong to both project and workspace"
});

export type CreateRepositoryInput = z.infer<typeof CreateRepositorySchema>;

// Repository update input schema
export const UpdateRepositorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  forkable: z.boolean().optional(),
  isPublic: z.boolean().optional()
});

export type UpdateRepositoryInput = z.infer<typeof UpdateRepositorySchema>;

// Repository list response schema
export const RepositoryListSchema = z.object({
  size: z.number(),
  limit: z.number(),
  isLastPage: z.boolean(),
  values: z.array(RepositorySchema),
  start: z.number()
});

export type RepositoryList = z.infer<typeof RepositoryListSchema>;

// Repository state enum
export enum RepositoryState {
  CREATED = 'created',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

// Repository business rules validation
export class RepositoryValidator {
  /**
   * Validates repository name according to business rules
   */
  static validateName(name: string): boolean {
    return name.trim().length > 0 && name.length <= 255;
  }

  /**
   * Validates repository slug format according to business rules
   */
  static validateSlug(slug: string): boolean {
    return /^[a-zA-Z0-9-]{1,50}$/.test(slug);
  }

  /**
   * Validates repository description according to business rules
   */
  static validateDescription(description?: string): boolean {
    if (!description) return true;
    return description.length <= 1000;
  }

  /**
   * Validates SCM type according to business rules
   */
  static validateScmId(scmId: string): boolean {
    return scmId === 'git';
  }

  /**
   * Validates parent relationship according to business rules
   */
  static validateParent(projectKey?: string, workspaceSlug?: string): boolean {
    return !!(projectKey || workspaceSlug) && !(projectKey && workspaceSlug);
  }

  /**
   * Validates complete repository data
   */
  static validate(repository: CreateRepositoryInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateName(repository.name)) {
      errors.push('Repository name must be 1-255 characters, not empty');
    }

    if (repository.slug && !this.validateSlug(repository.slug)) {
      errors.push('Repository slug must be 1-50 characters, alphanumeric, hyphens allowed');
    }

    if (!this.validateDescription(repository.description)) {
      errors.push('Repository description must be maximum 1000 characters');
    }

    if (!this.validateScmId(repository.scmId)) {
      errors.push('Repository SCM type must be git');
    }

    if (!this.validateParent(repository.projectKey, repository.workspaceSlug)) {
      errors.push('Repository must belong to either a project or workspace, not both');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Repository factory for creating instances
export class RepositoryFactory {
  /**
   * Creates a new repository instance with default values
   */
  static create(input: CreateRepositoryInput): Repository {
    const now = new Date().toISOString();
    const slug = input.slug || this.generateSlug(input.name);
    
    const repository: Repository = {
      slug,
      name: input.name,
      description: input.description,
      scmId: input.scmId,
      forkable: input.forkable ?? true,
      isPublic: input.isPublic ?? false,
      links: {
        self: [],
        clone: []
      },
      createdDate: now,
      updatedDate: now
    };

    // Add parent relationship
    if (input.projectKey) {
      repository.project = { key: input.projectKey };
    } else if (input.workspaceSlug) {
      repository.workspace = {
        uuid: crypto.randomUUID(),
        name: input.workspaceSlug,
        slug: input.workspaceSlug
      };
    }

    return repository;
  }

  /**
   * Updates an existing repository instance
   */
  static update(repository: Repository, input: UpdateRepositoryInput): Repository {
    return {
      ...repository,
      name: input.name ?? repository.name,
      description: input.description ?? repository.description,
      forkable: input.forkable ?? repository.forkable,
      isPublic: input.isPublic ?? repository.isPublic,
      updatedDate: new Date().toISOString()
    };
  }

  /**
   * Creates repository with self and clone links
   */
  static withLinks(repository: Repository, baseUrl: string): Repository {
    const parentPath = repository.project 
      ? `projects/${repository.project.key}/repos/${repository.slug}`
      : `repositories/${repository.workspace!.slug}/${repository.slug}`;

    return {
      ...repository,
      links: {
        self: [{ href: `${baseUrl}/${parentPath}` }],
        clone: [
          { href: `${baseUrl}/scm/${repository.slug}/${repository.slug}.git`, name: 'https' },
          { href: `ssh://git@${baseUrl.replace('https://', '')}/${repository.slug}/${repository.slug}.git`, name: 'ssh' }
        ]
      }
    };
  }

  /**
   * Generates slug from repository name
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }
}

// Repository state transitions
export class RepositoryStateManager {
  /**
   * Transitions repository to active state
   */
  static activate(repository: Repository): Repository {
    return {
      ...repository,
      updatedDate: new Date().toISOString()
    };
  }

  /**
   * Transitions repository to archived state
   */
  static archive(repository: Repository): Repository {
    return {
      ...repository,
      updatedDate: new Date().toISOString()
    };
  }

  /**
   * Transitions repository to deleted state
   */
  static delete(repository: Repository): Repository {
    return {
      ...repository,
      updatedDate: new Date().toISOString()
    };
  }
}

// Export all schemas and types
// Default export
export default RepositorySchema;
