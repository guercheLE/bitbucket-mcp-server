import { z } from 'zod';

/**
 * Avatar entity model for Bitbucket Data Center and Cloud
 * T035: Avatar entity model in src/types/avatar.ts
 * 
 * Image representation for projects or workspaces
 * Based on data-model.md specifications
 */

// Avatar content types enum
export enum AvatarContentType {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif'
}

// Avatar schema definition
export const AvatarSchema = z.object({
  id: z.string().uuid(),
  data: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/), // Base64 validation
  contentType: z.enum([
    AvatarContentType.JPEG,
    AvatarContentType.PNG,
    AvatarContentType.GIF
  ]),
  size: z.number().min(1).max(2 * 1024 * 1024), // Max 2MB
  width: z.number().min(1).max(1024).optional(),
  height: z.number().min(1).max(1024).optional(),
  uploadedDate: z.string().datetime()
});

// Avatar type definition
export type Avatar = z.infer<typeof AvatarSchema>;

// Avatar creation input schema
export const CreateAvatarSchema = z.object({
  data: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/), // Base64 validation
  contentType: z.enum([
    AvatarContentType.JPEG,
    AvatarContentType.PNG,
    AvatarContentType.GIF
  ]),
  width: z.number().min(1).max(1024).optional(),
  height: z.number().min(1).max(1024).optional()
});

export type CreateAvatarInput = z.infer<typeof CreateAvatarSchema>;

// Avatar update input schema
export const UpdateAvatarSchema = z.object({
  data: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/).optional(), // Base64 validation
  contentType: z.enum([
    AvatarContentType.JPEG,
    AvatarContentType.PNG,
    AvatarContentType.GIF
  ]).optional(),
  width: z.number().min(1).max(1024).optional(),
  height: z.number().min(1).max(1024).optional()
});

export type UpdateAvatarInput = z.infer<typeof UpdateAvatarSchema>;

// Avatar list response schema
export const AvatarListSchema = z.object({
  size: z.number(),
  limit: z.number(),
  isLastPage: z.boolean(),
  values: z.array(AvatarSchema),
  start: z.number()
});

export type AvatarList = z.infer<typeof AvatarListSchema>;

// Avatar state enum
export enum AvatarState {
  UPLOADED = 'uploaded',
  ACTIVE = 'active',
  REPLACED = 'replaced',
  DELETED = 'deleted'
}

// Avatar business rules validation
export class AvatarValidator {
  /**
   * Validates base64 data according to business rules
   */
  static validateData(data: string): boolean {
    // Check if it's valid base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(data)) return false;

    try {
      // Try to decode to verify it's valid base64
      atob(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates content type according to business rules
   */
  static validateContentType(contentType: AvatarContentType): boolean {
    return Object.values(AvatarContentType).includes(contentType);
  }

  /**
   * Validates file size according to business rules
   */
  static validateSize(size: number): boolean {
    return size > 0 && size <= 2 * 1024 * 1024; // Max 2MB
  }

  /**
   * Validates dimensions according to business rules
   */
  static validateDimensions(width?: number, height?: number): boolean {
    if (width !== undefined && (width < 1 || width > 1024)) return false;
    if (height !== undefined && (height < 1 || height > 1024)) return false;
    return true;
  }

  /**
   * Validates complete avatar data
   */
  static validate(avatar: CreateAvatarInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateData(avatar.data)) {
      errors.push('Avatar data must be valid base64');
    }

    if (!this.validateContentType(avatar.contentType)) {
      errors.push('Avatar content type must be image/jpeg, image/png, or image/gif');
    }

    // Calculate size from base64 data
    const size = this.calculateSize(avatar.data);
    if (!this.validateSize(size)) {
      errors.push('Avatar size must be between 1 byte and 2MB');
    }

    if (!this.validateDimensions(avatar.width, avatar.height)) {
      errors.push('Avatar dimensions must be between 1 and 1024 pixels');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculates size from base64 data
   */
  private static calculateSize(base64Data: string): number {
    // Remove padding and calculate size
    const padding = (base64Data.match(/=/g) || []).length;
    return (base64Data.length * 3) / 4 - padding;
  }
}

// Avatar factory for creating instances
export class AvatarFactory {
  /**
   * Creates a new avatar instance with default values
   */
  static create(input: CreateAvatarInput): Avatar {
    const now = new Date().toISOString();
    const size = this.calculateSize(input.data);
    
    return {
      id: crypto.randomUUID(),
      data: input.data,
      contentType: input.contentType,
      size,
      width: input.width,
      height: input.height,
      uploadedDate: now
    };
  }

  /**
   * Updates an existing avatar instance
   */
  static update(avatar: Avatar, input: UpdateAvatarInput): Avatar {
    const size = input.data ? this.calculateSize(input.data) : avatar.size;
    
    return {
      ...avatar,
      data: input.data ?? avatar.data,
      contentType: input.contentType ?? avatar.contentType,
      size,
      width: input.width ?? avatar.width,
      height: input.height ?? avatar.height,
      uploadedDate: new Date().toISOString()
    };
  }

  /**
   * Calculates size from base64 data
   */
  private static calculateSize(base64Data: string): number {
    const padding = (base64Data.match(/=/g) || []).length;
    return (base64Data.length * 3) / 4 - padding;
  }
}

// Avatar state transitions
export class AvatarStateManager {
  /**
   * Transitions avatar to active state
   */
  static activate(avatar: Avatar): Avatar {
    return {
      ...avatar,
      uploadedDate: new Date().toISOString()
    };
  }

  /**
   * Transitions avatar to replaced state
   */
  static replace(avatar: Avatar, newData: string, newContentType: AvatarContentType): Avatar {
    const size = AvatarFactory['calculateSize'](newData);
    
    return {
      ...avatar,
      data: newData,
      contentType: newContentType,
      size,
      uploadedDate: new Date().toISOString()
    };
  }

  /**
   * Transitions avatar to deleted state
   */
  static delete(avatar: Avatar): Avatar {
    return {
      ...avatar,
      uploadedDate: new Date().toISOString()
    };
  }
}

// Avatar utilities
export class AvatarUtils {
  /**
   * Gets supported content types
   */
  static getSupportedContentTypes(): AvatarContentType[] {
    return Object.values(AvatarContentType);
  }

  /**
   * Gets file extension from content type
   */
  static getFileExtension(contentType: AvatarContentType): string {
    const extensions = {
      [AvatarContentType.JPEG]: 'jpg',
      [AvatarContentType.PNG]: 'png',
      [AvatarContentType.GIF]: 'gif'
    };

    return extensions[contentType];
  }

  /**
   * Gets content type from file extension
   */
  static getContentTypeFromExtension(extension: string): AvatarContentType | null {
    const contentTypes: Record<string, AvatarContentType> = {
      'jpg': AvatarContentType.JPEG,
      'jpeg': AvatarContentType.JPEG,
      'png': AvatarContentType.PNG,
      'gif': AvatarContentType.GIF
    };

    return contentTypes[extension.toLowerCase()] || null;
  }

  /**
   * Validates file extension
   */
  static isValidExtension(extension: string): boolean {
    return this.getContentTypeFromExtension(extension) !== null;
  }

  /**
   * Generates avatar filename
   */
  static generateFilename(contentType: AvatarContentType): string {
    const extension = this.getFileExtension(contentType);
    const timestamp = Date.now();
    return `avatar_${timestamp}.${extension}`;
  }
}

// Avatar compression utilities
export class AvatarCompression {
  static readonly MAX_WIDTH = 1024;
  static readonly MAX_HEIGHT = 1024;
  static readonly MAX_SIZE = 2 * 1024 * 1024; // 2MB

  /**
   * Checks if avatar needs compression
   */
  static needsCompression(avatar: CreateAvatarInput): boolean {
    const size = AvatarFactory['calculateSize'](avatar.data);
    
    return size > this.MAX_SIZE ||
           (avatar.width !== undefined && avatar.width > this.MAX_WIDTH) ||
           (avatar.height !== undefined && avatar.height > this.MAX_HEIGHT);
  }

  /**
   * Gets recommended dimensions for compression
   */
  static getRecommendedDimensions(width?: number, height?: number): { width: number; height: number } {
    if (!width || !height) {
      return { width: this.MAX_WIDTH, height: this.MAX_HEIGHT };
    }

    const aspectRatio = width / height;
    
    if (width > height) {
      return {
        width: Math.min(width, this.MAX_WIDTH),
        height: Math.min(width / aspectRatio, this.MAX_HEIGHT)
      };
    } else {
      return {
        width: Math.min(height * aspectRatio, this.MAX_WIDTH),
        height: Math.min(height, this.MAX_HEIGHT)
      };
    }
  }
}

// Default export
export default AvatarSchema;
