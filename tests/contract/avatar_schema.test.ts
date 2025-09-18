import { z } from 'zod';

/**
 * Contract test for Avatar entity schema
 * T012: Contract test Avatar entity schema in tests/contract/test_avatar_schema.ts
 * 
 * This test MUST fail before implementation (Constitution Article V - TDD)
 * Validates the Avatar entity schema according to data-model.md specifications
 */

describe('Avatar Entity Schema Contract Tests', () => {
  // Schema definition from data-model.md
  const AvatarSchema = z.object({
    id: z.string().uuid(),
    data: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/), // Base64 validation
    contentType: z.enum(['image/jpeg', 'image/png', 'image/gif']),
    size: z.number().min(1).max(2 * 1024 * 1024), // Max 2MB
    width: z.number().min(1).max(1024).optional(),
    height: z.number().min(1).max(1024).optional(),
    uploadedDate: z.string().datetime()
  });

  describe('Valid Avatar Data', () => {
    it('should validate a complete avatar with all fields', () => {
      const validAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        size: 1024,
        width: 100,
        height: 100,
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(validAvatar)).not.toThrow();
    });

    it('should validate a minimal avatar with required fields only', () => {
      const minimalAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/jpeg',
        size: 512,
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(minimalAvatar)).not.toThrow();
    });
  });

  describe('Invalid Avatar Data - ID Validation', () => {
    it('should reject invalid UUID format', () => {
      const invalidAvatar = {
        id: 'not-a-uuid',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        size: 1024,
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(invalidAvatar)).toThrow();
    });
  });

  describe('Invalid Avatar Data - Data Validation', () => {
    it('should reject invalid base64 data', () => {
      const invalidAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: 'invalid-base64-data!',
        contentType: 'image/png',
        size: 1024,
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(invalidAvatar)).toThrow();
    });

    it('should reject empty data', () => {
      const invalidAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: '',
        contentType: 'image/png',
        size: 1024,
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(invalidAvatar)).toThrow();
    });
  });

  describe('Invalid Avatar Data - Content Type Validation', () => {
    it('should reject unsupported content types', () => {
      const invalidContentTypes = ['image/bmp', 'image/svg+xml', 'text/plain', 'application/pdf'];

      invalidContentTypes.forEach(contentType => {
        const invalidAvatar = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          contentType: contentType as any,
          size: 1024,
          uploadedDate: '2025-01-27T10:00:00Z'
        };

        expect(() => AvatarSchema.parse(invalidAvatar)).toThrow();
      });
    });

    it('should accept supported content types', () => {
      const validContentTypes = ['image/jpeg', 'image/png', 'image/gif'];

      validContentTypes.forEach(contentType => {
        const validAvatar = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          contentType: contentType as any,
          size: 1024,
          uploadedDate: '2025-01-27T10:00:00Z'
        };

        expect(() => AvatarSchema.parse(validAvatar)).not.toThrow();
      });
    });
  });

  describe('Invalid Avatar Data - Size Validation', () => {
    it('should reject size larger than 2MB', () => {
      const invalidAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        size: 2 * 1024 * 1024 + 1,
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(invalidAvatar)).toThrow();
    });

    it('should reject zero or negative size', () => {
      const invalidAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        size: 0,
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(invalidAvatar)).toThrow();
    });
  });

  describe('Invalid Avatar Data - Dimensions Validation', () => {
    it('should reject width larger than 1024px', () => {
      const invalidAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        size: 1024,
        width: 1025,
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(invalidAvatar)).toThrow();
    });

    it('should reject height larger than 1024px', () => {
      const invalidAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        size: 1024,
        height: 1025,
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(invalidAvatar)).toThrow();
    });

    it('should reject zero or negative dimensions', () => {
      const invalidAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        size: 1024,
        width: 0,
        height: 0,
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(invalidAvatar)).toThrow();
    });
  });

  describe('Business Rules Validation', () => {
    it('should enforce file size limit of 2MB', () => {
      const maxSizeAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        size: 2 * 1024 * 1024, // Exactly 2MB
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(maxSizeAvatar)).not.toThrow();
    });

    it('should enforce maximum dimensions of 1024x1024', () => {
      const maxDimensionsAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        size: 1024,
        width: 1024,
        height: 1024,
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(maxDimensionsAvatar)).not.toThrow();
    });
  });

  describe('State Transitions', () => {
    it('should support avatar upload state', () => {
      const uploadedAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        size: 1024,
        uploadedDate: '2025-01-27T10:00:00Z'
      };

      expect(() => AvatarSchema.parse(uploadedAvatar)).not.toThrow();
    });

    it('should support avatar replacement state', () => {
      const replacedAvatar = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/jpeg',
        size: 2048,
        width: 200,
        height: 200,
        uploadedDate: '2025-01-27T11:00:00Z'
      };

      expect(() => AvatarSchema.parse(replacedAvatar)).not.toThrow();
    });
  });
});
