/**
 * Bitbucket Cloud Issue Relationships Types
 * 
 * Este arquivo define os tipos TypeScript para relacionamentos entre Issues
 * do Bitbucket Cloud, incluindo entidades e relacionamentos.
 * 
 * @fileoverview Tipos para relacionamentos de Issues no Bitbucket Cloud
 * @version 1.0.0
 * @since 2024-12-19
 */

// ============================================================================
// Issue Relationship Types
// ============================================================================

/**
 * Tipo de relacionamento entre Issues
 */
export type IssueRelationshipType = 
  | 'relates'       // Relaciona
  | 'duplicates'    // Duplica
  | 'duplicated_by' // Duplicada por
  | 'blocks'        // Bloqueia
  | 'blocked_by'    // Bloqueada por
  | 'clones'        // Clona
  | 'cloned_by';    // Clonada por

/**
 * Relacionamento entre Issues
 */
export interface IssueRelationship {
  id: number;
  type: IssueRelationshipType;
  issue: {
    id: number;
    title: string;
    links: {
      self: { href: string };
      html: { href: string };
    };
  };
  related_issue: {
    id: number;
    title: string;
    links: {
      self: { href: string };
      html: { href: string };
    };
  };
  created_on: string;
  updated_on: string;
  links: {
    self: { href: string };
    html: { href: string };
  };
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Parâmetros para criar um relacionamento
 */
export interface CreateRelationshipRequest {
  type: IssueRelationshipType;
  related_issue: {
    id: number;
  };
}

/**
 * Resposta de lista de relacionamentos
 */
export interface RelationshipsListResponse {
  size: number;
  page: number;
  pagelen: number;
  next?: string;
  previous?: string;
  values: IssueRelationship[];
}

// ============================================================================
// Export all types
// ============================================================================

// All types are already exported above with their declarations
