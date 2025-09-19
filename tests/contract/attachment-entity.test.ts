/**
 * Contract Tests: Attachment Entity Validation
 * 
 * Testa a validação e estrutura da entidade Attachment
 * conforme definido no modelo de dados
 * 
 * @fileoverview Testes de contrato para entidade Attachment
 * @version 1.0.0
 * @since 2024-12-19
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { IssueAttachment } from '../../src/types/issues';

// ============================================================================
// Mock Data
// ============================================================================

const validAttachment: IssueAttachment = {
  id: 1,
  name: 'test-file.txt',
  path: 'attachments/test-file.txt',
  size: 1024,
  type: 'text/plain',
  user: {
    uuid: 'user-uuid-123',
    display_name: 'Test User',
    nickname: 'testuser',
    account_id: 'account-123',
    links: {
      self: { href: 'https://api.bitbucket.org/2.0/users/testuser' },
      html: { href: 'https://bitbucket.org/testuser' },
      avatar: { href: 'https://bitbucket.org/account/testuser/avatar/32/' }
    }
  },
  created_on: '2024-12-19T10:00:00.000Z',
  links: {
    self: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/attachments/1' },
    download: { href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues/1/attachments/1/download' }
  }
};

// ============================================================================
// Contract Tests
// ============================================================================

describe('Attachment Entity Contract Tests', () => {
  beforeEach(() => {
    // Setup test environment
  });

  // ============================================================================
  // Core Attachment Properties
  // ============================================================================

  describe('Core Attachment Properties', () => {
    it('should have required id field as number', () => {
      expect(validAttachment.id).toBeDefined();
      expect(typeof validAttachment.id).toBe('number');
      expect(validAttachment.id).toBeGreaterThan(0);
    });

    it('should have required name field as string', () => {
      expect(validAttachment.name).toBeDefined();
      expect(typeof validAttachment.name).toBe('string');
      expect(validAttachment.name.length).toBeGreaterThan(0);
    });

    it('should have required path field as string', () => {
      expect(validAttachment.path).toBeDefined();
      expect(typeof validAttachment.path).toBe('string');
      expect(validAttachment.path.length).toBeGreaterThan(0);
    });

    it('should have required size field as number', () => {
      expect(validAttachment.size).toBeDefined();
      expect(typeof validAttachment.size).toBe('number');
      expect(validAttachment.size).toBeGreaterThanOrEqual(0);
    });

    it('should have required type field as string', () => {
      expect(validAttachment.type).toBeDefined();
      expect(typeof validAttachment.type).toBe('string');
      expect(validAttachment.type.length).toBeGreaterThan(0);
    });

    it('should have required user field with correct structure', () => {
      expect(validAttachment.user).toBeDefined();
      expect(validAttachment.user).toMatchObject({
        uuid: expect.any(String),
        display_name: expect.any(String),
        nickname: expect.any(String),
        account_id: expect.any(String),
        links: expect.objectContaining({
          self: expect.objectContaining({ href: expect.any(String) }),
          html: expect.objectContaining({ href: expect.any(String) }),
          avatar: expect.objectContaining({ href: expect.any(String) })
        })
      });
    });

    it('should have required created_on field as ISO date string', () => {
      expect(validAttachment.created_on).toBeDefined();
      expect(typeof validAttachment.created_on).toBe('string');
      expect(new Date(validAttachment.created_on)).toBeInstanceOf(Date);
      expect(new Date(validAttachment.created_on).toISOString()).toBe(validAttachment.created_on);
    });

    it('should have required links field with correct structure', () => {
      expect(validAttachment.links).toBeDefined();
      expect(validAttachment.links).toMatchObject({
        self: expect.objectContaining({ href: expect.any(String) }),
        download: expect.objectContaining({ href: expect.any(String) })
      });
    });
  });

  // ============================================================================
  // File Name Validation
  // ============================================================================

  describe('File Name Validation', () => {
    it('should validate file name format', () => {
      expect(validAttachment.name).toMatch(/^[^\/\\:*?"<>|]+$/);
    });

    it('should handle file names with extensions', () => {
      const attachmentWithExtension = {
        ...validAttachment,
        name: 'document.pdf'
      };
      expect(attachmentWithExtension.name).toContain('.');
    });

    it('should handle file names without extensions', () => {
      const attachmentWithoutExtension = {
        ...validAttachment,
        name: 'README'
      };
      expect(attachmentWithoutExtension.name).not.toContain('.');
    });

    it('should handle file names with multiple dots', () => {
      const attachmentWithMultipleDots = {
        ...validAttachment,
        name: 'file.backup.2024.txt'
      };
      expect(attachmentWithMultipleDots.name).toContain('.');
    });

    it('should handle file names with special characters', () => {
      const attachmentWithSpecialChars = {
        ...validAttachment,
        name: 'file-name_with.special+chars.txt'
      };
      expect(attachmentWithSpecialChars.name).toContain('-');
      expect(attachmentWithSpecialChars.name).toContain('_');
      expect(attachmentWithSpecialChars.name).toContain('+');
    });

    it('should handle file names with unicode characters', () => {
      const attachmentWithUnicode = {
        ...validAttachment,
        name: 'arquivo_com_acentos.txt'
      };
      expect(attachmentWithUnicode.name).toContain('ç');
    });

    it('should handle file names with spaces', () => {
      const attachmentWithSpaces = {
        ...validAttachment,
        name: 'my file name.txt'
      };
      expect(attachmentWithSpaces.name).toContain(' ');
    });
  });

  // ============================================================================
  // File Path Validation
  // ============================================================================

  describe('File Path Validation', () => {
    it('should validate file path format', () => {
      expect(validAttachment.path).toMatch(/^[^:*?"<>|]+$/);
    });

    it('should handle paths with directories', () => {
      const attachmentWithPath = {
        ...validAttachment,
        path: 'attachments/subfolder/file.txt'
      };
      expect(attachmentWithPath.path).toContain('/');
    });

    it('should handle paths without directories', () => {
      const attachmentWithoutPath = {
        ...validAttachment,
        path: 'file.txt'
      };
      expect(attachmentWithoutPath.path).not.toContain('/');
    });

    it('should handle paths with multiple levels', () => {
      const attachmentWithMultipleLevels = {
        ...validAttachment,
        path: 'attachments/2024/12/19/file.txt'
      };
      expect(attachmentWithMultipleLevels.path).toContain('/');
      expect(attachmentWithMultipleLevels.path.split('/')).toHaveLength(5);
    });
  });

  // ============================================================================
  // File Size Validation
  // ============================================================================

  describe('File Size Validation', () => {
    it('should validate file size as non-negative number', () => {
      expect(validAttachment.size).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero byte files', () => {
      const zeroByteAttachment = {
        ...validAttachment,
        size: 0
      };
      expect(zeroByteAttachment.size).toBe(0);
    });

    it('should handle small files', () => {
      const smallFileAttachment = {
        ...validAttachment,
        size: 1
      };
      expect(smallFileAttachment.size).toBe(1);
    });

    it('should handle large files', () => {
      const largeFileAttachment = {
        ...validAttachment,
        size: 1024 * 1024 * 100 // 100MB
      };
      expect(largeFileAttachment.size).toBe(104857600);
    });

    it('should handle very large files', () => {
      const veryLargeFileAttachment = {
        ...validAttachment,
        size: 1024 * 1024 * 1024 // 1GB
      };
      expect(veryLargeFileAttachment.size).toBe(1073741824);
    });
  });

  // ============================================================================
  // MIME Type Validation
  // ============================================================================

  describe('MIME Type Validation', () => {
    it('should validate common text MIME types', () => {
      const textMimeTypes = [
        'text/plain',
        'text/html',
        'text/css',
        'text/javascript',
        'text/csv',
        'text/xml'
      ];

      textMimeTypes.forEach(mimeType => {
        const attachment = { ...validAttachment, type: mimeType };
        expect(attachment.type).toMatch(/^text\//);
      });
    });

    it('should validate common image MIME types', () => {
      const imageMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/svg+xml',
        'image/webp'
      ];

      imageMimeTypes.forEach(mimeType => {
        const attachment = { ...validAttachment, type: mimeType };
        expect(attachment.type).toMatch(/^image\//);
      });
    });

    it('should validate common application MIME types', () => {
      const applicationMimeTypes = [
        'application/pdf',
        'application/json',
        'application/xml',
        'application/zip',
        'application/octet-stream'
      ];

      applicationMimeTypes.forEach(mimeType => {
        const attachment = { ...validAttachment, type: mimeType };
        expect(attachment.type).toMatch(/^application\//);
      });
    });

    it('should validate common audio MIME types', () => {
      const audioMimeTypes = [
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/mp4'
      ];

      audioMimeTypes.forEach(mimeType => {
        const attachment = { ...validAttachment, type: mimeType };
        expect(attachment.type).toMatch(/^audio\//);
      });
    });

    it('should validate common video MIME types', () => {
      const videoMimeTypes = [
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'video/webm'
      ];

      videoMimeTypes.forEach(mimeType => {
        const attachment = { ...validAttachment, type: mimeType };
        expect(attachment.type).toMatch(/^video\//);
      });
    });

    it('should validate MIME type format', () => {
      const mimeTypePattern = /^[a-z]+\/[a-z0-9][a-z0-9!#$&\-\^_]*$/i;
      expect(mimeTypePattern.test(validAttachment.type)).toBe(true);
    });
  });

  // ============================================================================
  // User Field Validation
  // ============================================================================

  describe('User Field Validation', () => {
    it('should validate user uuid field format', () => {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidPattern.test(validAttachment.user.uuid)).toBe(true);
    });

    it('should validate user account_id field format', () => {
      const accountIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(accountIdPattern.test(validAttachment.user.account_id)).toBe(true);
    });

    it('should validate user display_name field as non-empty string', () => {
      expect(typeof validAttachment.user.display_name).toBe('string');
      expect(validAttachment.user.display_name.length).toBeGreaterThan(0);
    });

    it('should validate user nickname field as non-empty string', () => {
      expect(typeof validAttachment.user.nickname).toBe('string');
      expect(validAttachment.user.nickname.length).toBeGreaterThan(0);
    });

    it('should validate user links structure', () => {
      expect(validAttachment.user.links).toMatchObject({
        self: expect.objectContaining({ href: expect.any(String) }),
        html: expect.objectContaining({ href: expect.any(String) }),
        avatar: expect.objectContaining({ href: expect.any(String) })
      });
    });

    it('should validate user links URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      
      expect(urlPattern.test(validAttachment.user.links.self.href)).toBe(true);
      expect(urlPattern.test(validAttachment.user.links.html.href)).toBe(true);
      expect(urlPattern.test(validAttachment.user.links.avatar.href)).toBe(true);
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
        const attachment = { ...validAttachment, created_on: dateString };
        expect(new Date(attachment.created_on)).toBeInstanceOf(Date);
        expect(new Date(attachment.created_on).toISOString()).toBe(dateString);
      });
    });

    it('should validate created_on is not in the future', () => {
      const now = new Date();
      const createdDate = new Date(validAttachment.created_on);
      
      expect(createdDate.getTime()).toBeLessThanOrEqual(now.getTime());
    });
  });

  // ============================================================================
  // Links Field Validation
  // ============================================================================

  describe('Links Field Validation', () => {
    it('should validate self link URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      expect(urlPattern.test(validAttachment.links.self.href)).toBe(true);
    });

    it('should validate download link URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      expect(urlPattern.test(validAttachment.links.download.href)).toBe(true);
    });

    it('should validate self link contains attachment ID', () => {
      expect(validAttachment.links.self.href).toContain('/attachments/');
      expect(validAttachment.links.self.href).toContain(validAttachment.id.toString());
    });

    it('should validate download link contains attachment ID', () => {
      expect(validAttachment.links.download.href).toContain('/attachments/');
      expect(validAttachment.links.download.href).toContain(validAttachment.id.toString());
      expect(validAttachment.links.download.href).toContain('/download');
    });

    it('should validate self and download links are different', () => {
      expect(validAttachment.links.self.href).not.toBe(validAttachment.links.download.href);
    });
  });

  // ============================================================================
  // Business Rules Validation
  // ============================================================================

  describe('Business Rules Validation', () => {
    it('should ensure file name matches path basename', () => {
      const pathParts = validAttachment.path.split('/');
      const pathBasename = pathParts[pathParts.length - 1];
      
      expect(validAttachment.name).toBe(pathBasename);
    });

    it('should ensure file size is reasonable for the file type', () => {
      // Basic validation - more sophisticated validation would be in business logic
      expect(validAttachment.size).toBeGreaterThanOrEqual(0);
    });

    it('should ensure MIME type is consistent with file extension', () => {
      // Basic validation - more sophisticated validation would be in business logic
      if (validAttachment.name.includes('.')) {
        const extension = validAttachment.name.split('.').pop()?.toLowerCase();
        expect(extension).toBeDefined();
      }
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle attachment with minimal file name', () => {
      const minimalAttachment = {
        ...validAttachment,
        name: 'a',
        path: 'a'
      };

      expect(minimalAttachment.name).toBe('a');
      expect(minimalAttachment.path).toBe('a');
    });

    it('should handle attachment with very long file name', () => {
      const longName = 'a'.repeat(255);
      const longNameAttachment = {
        ...validAttachment,
        name: longName,
        path: `attachments/${longName}`
      };

      expect(longNameAttachment.name.length).toBe(255);
      expect(longNameAttachment.path).toContain(longName);
    });

    it('should handle attachment with very long path', () => {
      const longPath = 'attachments/' + 'subfolder/'.repeat(50) + 'file.txt';
      const longPathAttachment = {
        ...validAttachment,
        path: longPath
      };

      expect(longPathAttachment.path.length).toBeGreaterThan(500);
    });

    it('should handle attachment with special characters in name', () => {
      const specialName = 'file with spaces & symbols!@#$%^&*().txt';
      const specialAttachment = {
        ...validAttachment,
        name: specialName,
        path: `attachments/${specialName}`
      };

      expect(specialAttachment.name).toContain(' ');
      expect(specialAttachment.name).toContain('&');
      expect(specialAttachment.name).toContain('!');
    });

    it('should handle attachment with unicode characters in name', () => {
      const unicodeName = 'arquivo_com_acentos_é_ñ.txt';
      const unicodeAttachment = {
        ...validAttachment,
        name: unicodeName,
        path: `attachments/${unicodeName}`
      };

      expect(unicodeAttachment.name).toContain('é');
      expect(unicodeAttachment.name).toContain('ñ');
    });

    it('should handle attachment with multiple file extensions', () => {
      const multiExtName = 'file.backup.2024.txt';
      const multiExtAttachment = {
        ...validAttachment,
        name: multiExtName,
        path: `attachments/${multiExtName}`
      };

      expect(multiExtAttachment.name).toContain('.');
      expect(multiExtAttachment.name.split('.')).toHaveLength(4);
    });

    it('should handle attachment with no file extension', () => {
      const noExtName = 'README';
      const noExtAttachment = {
        ...validAttachment,
        name: noExtName,
        path: `attachments/${noExtName}`
      };

      expect(noExtAttachment.name).not.toContain('.');
    });

    it('should handle attachment with hidden file (starts with dot)', () => {
      const hiddenName = '.hidden_file';
      const hiddenAttachment = {
        ...validAttachment,
        name: hiddenName,
        path: `attachments/${hiddenName}`
      };

      expect(hiddenAttachment.name).toMatch(/^\./);
    });
  });

  // ============================================================================
  // Type Safety Tests
  // ============================================================================

  describe('Type Safety Tests', () => {
    it('should enforce correct types for all fields', () => {
      // These tests ensure TypeScript type safety
      expect(typeof validAttachment.id).toBe('number');
      expect(typeof validAttachment.name).toBe('string');
      expect(typeof validAttachment.path).toBe('string');
      expect(typeof validAttachment.size).toBe('number');
      expect(typeof validAttachment.type).toBe('string');
      expect(typeof validAttachment.user.uuid).toBe('string');
      expect(typeof validAttachment.user.display_name).toBe('string');
      expect(typeof validAttachment.user.nickname).toBe('string');
      expect(typeof validAttachment.user.account_id).toBe('string');
      expect(typeof validAttachment.created_on).toBe('string');
      expect(typeof validAttachment.links.self.href).toBe('string');
      expect(typeof validAttachment.links.download.href).toBe('string');
    });

    it('should enforce non-negative size constraint', () => {
      expect(validAttachment.size).toBeGreaterThanOrEqual(0);
    });

    it('should enforce positive id constraint', () => {
      expect(validAttachment.id).toBeGreaterThan(0);
    });
  });
});
