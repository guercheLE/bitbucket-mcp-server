/**
 * Bitbucket Cloud Comments Types
 * 
 * Este arquivo define os tipos TypeScript para comentários de Issues
 * do Bitbucket Cloud, incluindo entidades e relacionamentos.
 * 
 * @fileoverview Tipos para comentários de Issues no Bitbucket Cloud
 * @version 1.0.0
 * @since 2024-12-19
 */

// ============================================================================
// Comment Types
// ============================================================================

/**
 * Comentário de uma Issue
 */
export interface IssueComment {
  id: number;
  content: {
    raw: string;
    markup: string;
    html: string;
    type: string;
  };
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
  updated_on: string;
  edited_on?: string;
  links: {
    self: { href: string };
    html: { href: string };
  };
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Parâmetros para criar um comentário
 */
export interface CreateCommentRequest {
  content: {
    raw: string;
    markup?: string;
  };
}

/**
 * Parâmetros para atualizar um comentário
 */
export interface UpdateCommentRequest {
  content: {
    raw: string;
    markup?: string;
  };
}

/**
 * Resposta de lista de comentários
 */
export interface CommentsListResponse {
  size: number;
  page: number;
  pagelen: number;
  next?: string;
  previous?: string;
  values: IssueComment[];
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error type for issues operations
 */
export interface IssuesError {
  type: string;
  error: {
    message: string;
    detail?: string;
  };
}

// ============================================================================
// Export all types
// ============================================================================

// All types are already exported above with their declarations
