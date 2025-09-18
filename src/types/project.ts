import { z } from 'zod';

/**
 * Project entity model for Bitbucket Data Center
 * T030: Project entity model in src/types/project.ts
 * 
 * Represents a project container that groups related repositories
 * Based on data-model.md specifications
 */

// Project schema definition
export const ProjectSchema = z.object({
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

// Project type definition
export type Project = z.infer<typeof ProjectSchema>;

// Project creation input schema
export const CreateProjectSchema = z.object({
  key: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  avatar: z.string().url().optional(),
  isPublic: z.boolean().default(false)
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// Project update input schema
export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  avatar: z.string().url().optional(),
  isPublic: z.boolean().optional()
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

// Project list response schema
export const ProjectListSchema = z.object({
  size: z.number(),
  limit: z.number(),
  isLastPage: z.boolean(),
  values: z.array(ProjectSchema),
  start: z.number()
});

export type ProjectList = z.infer<typeof ProjectListSchema>;

// Project state enum
export enum ProjectState {
  CREATED = 'created',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

// Project business rules validation
export class ProjectValidator {
  /**
   * Validates project key format according to business rules
   */
  static validateKey(key: string): boolean {
    return /^[A-Z0-9]{1,10}$/.test(key);
  }

  /**
   * Validates project name according to business rules
   */
  static validateName(name: string): boolean {
    return name.trim().length > 0 && name.length <= 255;
  }

  /**
   * Validates project description according to business rules
   */
  static validateDescription(description?: string): boolean {
    if (!description) return true;
    return description.length <= 1000;
  }

  /**
   * Validates avatar URL according to business rules
   */
  static validateAvatar(avatar?: string): boolean {
    if (!avatar) return true;
    try {
      new URL(avatar);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates complete project data
   */
  static validate(project: CreateProjectInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateKey(project.key)) {
      errors.push('Project key must be 1-10 characters, alphanumeric, uppercase');
    }

    if (!this.validateName(project.name)) {
      errors.push('Project name must be 1-255 characters, not empty');
    }

    if (!this.validateDescription(project.description)) {
      errors.push('Project description must be maximum 1000 characters');
    }

    if (!this.validateAvatar(project.avatar)) {
      errors.push('Project avatar must be a valid URL');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Project factory for creating instances
export class ProjectFactory {
  /**
   * Creates a new project instance with default values
   */
  static create(input: CreateProjectInput): Project {
    const now = new Date().toISOString();
    
    return {
      key: input.key,
      name: input.name,
      description: input.description,
      avatar: input.avatar,
      isPublic: input.isPublic ?? false,
      links: {
        self: []
      },
      createdDate: now,
      updatedDate: now
    };
  }

  /**
   * Updates an existing project instance
   */
  static update(project: Project, input: UpdateProjectInput): Project {
    return {
      ...project,
      name: input.name ?? project.name,
      description: input.description ?? project.description,
      avatar: input.avatar ?? project.avatar,
      isPublic: input.isPublic ?? project.isPublic,
      updatedDate: new Date().toISOString()
    };
  }

  /**
   * Creates project with self link
   */
  static withSelfLink(project: Project, baseUrl: string): Project {
    return {
      ...project,
      links: {
        self: [{ href: `${baseUrl}/projects/${project.key}` }]
      }
    };
  }
}

// Project state transitions
export class ProjectStateManager {
  /**
   * Transitions project to active state
   */
  static activate(project: Project): Project {
    return {
      ...project,
      updatedDate: new Date().toISOString()
    };
  }

  /**
   * Transitions project to archived state
   */
  static archive(project: Project): Project {
    return {
      ...project,
      updatedDate: new Date().toISOString()
    };
  }

  /**
   * Transitions project to deleted state
   */
  static delete(project: Project): Project {
    return {
      ...project,
      updatedDate: new Date().toISOString()
    };
  }
}

// Default export
export default ProjectSchema;
