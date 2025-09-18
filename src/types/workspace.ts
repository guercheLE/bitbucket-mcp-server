import { z } from 'zod';

/**
 * Workspace entity model for Bitbucket Cloud
 * T031: Workspace entity model in src/types/workspace.ts
 * 
 * Represents a workspace container that groups related repositories in Cloud
 * Based on data-model.md specifications
 */

// Workspace schema definition
export const WorkspaceSchema = z.object({
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

// Workspace type definition
export type Workspace = z.infer<typeof WorkspaceSchema>;

// Workspace creation input schema
export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-]+$/),
  description: z.string().max(1000).optional(),
  isPrivate: z.boolean().default(true)
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;

// Workspace update input schema
export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-]+$/).optional(),
  description: z.string().max(1000).optional(),
  isPrivate: z.boolean().optional()
});

export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;

// Workspace list response schema
export const WorkspaceListSchema = z.object({
  size: z.number(),
  limit: z.number(),
  isLastPage: z.boolean(),
  values: z.array(WorkspaceSchema),
  start: z.number()
});

export type WorkspaceList = z.infer<typeof WorkspaceListSchema>;

// Workspace state enum
export enum WorkspaceState {
  CREATED = 'created',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

// Workspace business rules validation
export class WorkspaceValidator {
  /**
   * Validates workspace name according to business rules
   */
  static validateName(name: string): boolean {
    return name.trim().length > 0 && name.length <= 255;
  }

  /**
   * Validates workspace slug format according to business rules
   */
  static validateSlug(slug: string): boolean {
    return /^[a-zA-Z0-9-]{1,50}$/.test(slug);
  }

  /**
   * Validates workspace description according to business rules
   */
  static validateDescription(description?: string): boolean {
    if (!description) return true;
    return description.length <= 1000;
  }

  /**
   * Validates complete workspace data
   */
  static validate(workspace: CreateWorkspaceInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateName(workspace.name)) {
      errors.push('Workspace name must be 1-255 characters, not empty');
    }

    if (!this.validateSlug(workspace.slug)) {
      errors.push('Workspace slug must be 1-50 characters, alphanumeric, hyphens allowed');
    }

    if (!this.validateDescription(workspace.description)) {
      errors.push('Workspace description must be maximum 1000 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Workspace factory for creating instances
export class WorkspaceFactory {
  /**
   * Creates a new workspace instance with default values
   */
  static create(input: CreateWorkspaceInput): Workspace {
    const now = new Date().toISOString();
    
    return {
      uuid: crypto.randomUUID(),
      name: input.name,
      slug: input.slug,
      description: input.description,
      isPrivate: input.isPrivate ?? true,
      createdOn: now,
      updatedOn: now,
      links: {
        self: []
      }
    };
  }

  /**
   * Updates an existing workspace instance
   */
  static update(workspace: Workspace, input: UpdateWorkspaceInput): Workspace {
    return {
      ...workspace,
      name: input.name ?? workspace.name,
      slug: input.slug ?? workspace.slug,
      description: input.description ?? workspace.description,
      isPrivate: input.isPrivate ?? workspace.isPrivate,
      updatedOn: new Date().toISOString()
    };
  }

  /**
   * Creates workspace with self link
   */
  static withSelfLink(workspace: Workspace, baseUrl: string): Workspace {
    return {
      ...workspace,
      links: {
        self: [{ href: `${baseUrl}/workspaces/${workspace.slug}` }]
      }
    };
  }
}

// Workspace state transitions
export class WorkspaceStateManager {
  /**
   * Transitions workspace to active state
   */
  static activate(workspace: Workspace): Workspace {
    return {
      ...workspace,
      updatedOn: new Date().toISOString()
    };
  }

  /**
   * Transitions workspace to archived state
   */
  static archive(workspace: Workspace): Workspace {
    return {
      ...workspace,
      updatedOn: new Date().toISOString()
    };
  }

  /**
   * Transitions workspace to deleted state
   */
  static delete(workspace: Workspace): Workspace {
    return {
      ...workspace,
      updatedOn: new Date().toISOString()
    };
  }
}

// Export all schemas and types
// Default export
export default WorkspaceSchema;
