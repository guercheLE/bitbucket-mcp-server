/**
 * Bitbucket Cloud Issue Attachments Types
 * 
 * Este arquivo define os tipos TypeScript para anexos de Issues
 * do Bitbucket Cloud, incluindo entidades e relacionamentos.
 * 
 * @fileoverview Tipos para anexos de Issues no Bitbucket Cloud
 * @version 1.0.0
 * @since 2024-12-19
 */

// ============================================================================
// Attachment Types
// ============================================================================

/**
 * Anexo de uma Issue
 */
export interface IssueAttachment {
  id: number;
  name: string;
  path: string;
  size: number;
  type: string;
  user: {
    uuid: string;
    display_name: string;
    nickname: string;
    account_id: string;
    links: {
      self: { href: string };
      html: { href: string };
      avatar: { href: string };
    };
  };
  created_on: string;
  links: {
    self: { href: string };
    download: { href: string };
  };
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Parâmetros para upload de anexo
 */
export interface UploadAttachmentRequest {
  name: string;
  content: string; // Base64 encoded content
  type?: string;   // MIME type
}

/**
 * Resposta de lista de anexos
 */
export interface AttachmentsListResponse {
  size: number;
  page: number;
  pagelen: number;
  next?: string;
  previous?: string;
  values: IssueAttachment[];
}

// ============================================================================
// Export all types
// ============================================================================

// All types are already exported above with their declarations
