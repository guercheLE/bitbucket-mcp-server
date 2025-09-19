/**
 * Bitbucket Cloud Issues Types
 * 
 * Este arquivo define os tipos TypeScript para a funcionalidade de Issues
 * do Bitbucket Cloud, incluindo entidades principais e relacionamentos.
 * 
 * @fileoverview Tipos para gestão de Issues no Bitbucket Cloud
 * @version 1.0.0
 * @since 2024-12-19
 */

// ============================================================================
// Core Issue Types
// ============================================================================

/**
 * Status de uma Issue
 */
export type IssueStatus = 
  | 'new'           // Nova issue
  | 'open'          // Issue aberta
  | 'resolved'      // Issue resolvida
  | 'on hold'       // Issue em espera
  | 'invalid'       // Issue inválida
  | 'duplicate'     // Issue duplicada
  | 'wontfix'       // Issue não será corrigida
  | 'closed';       // Issue fechada

/**
 * Prioridade de uma Issue
 */
export type IssuePriority = 
  | 'trivial'       // Trivial
  | 'minor'         // Menor
  | 'major'         // Maior
  | 'critical'      // Crítica
  | 'blocker';      // Bloqueadora

/**
 * Tipo de Issue
 */
export type IssueType = 
  | 'bug'           // Bug
  | 'enhancement'   // Melhoria
  | 'proposal'      // Proposta
  | 'task';         // Tarefa

/**
 * Estado de uma Issue
 */
export interface IssueState {
  name: string;
  type: 'unresolved' | 'resolved';
  color: string;
}

/**
 * Componente de uma Issue
 */
export interface IssueComponent {
  name: string;
  description?: string;
}

/**
 * Milestone de uma Issue
 */
export interface IssueMilestone {
  name: string;
  description?: string;
  due_date?: string;
}

/**
 * Versão de uma Issue
 */
export interface IssueVersion {
  name: string;
  description?: string;
  released?: boolean;
  release_date?: string;
}

/**
 * Watcher de uma Issue
 */
export interface IssueWatcher {
  uuid: string;
  display_name: string;
  nickname: string;
  account_id: string;
  links: {
    self: { href: string };
    html: { href: string };
    avatar: { href: string };
  };
}

/**
 * Votante de uma Issue
 */
export interface IssueVoter {
  uuid: string;
  display_name: string;
  nickname: string;
  account_id: string;
  links: {
    self: { href: string };
    html: { href: string };
    avatar: { href: string };
  };
}

/**
 * Issue principal do Bitbucket Cloud
 */
export interface Issue {
  id: number;
  title: string;
  content?: {
    raw: string;
    markup: string;
    html: string;
    type: string;
  };
  reporter: {
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
  assignee?: {
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
  kind: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  component?: IssueComponent;
  milestone?: IssueMilestone;
  version?: IssueVersion;
  created_on: string;
  updated_on: string;
  edited_on?: string;
  state: IssueState;
  links: {
    self: { href: string };
    html: { href: string };
    comments: { href: string };
    attachments: { href: string };
    watch: { href: string };
    vote: { href: string };
  };
  watchers_count: number;
  voters_count: number;
  watchers?: IssueWatcher[];
  voters?: IssueVoter[];
}

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
// Transition Types
// ============================================================================

/**
 * Transição de estado de uma Issue
 */
export interface IssueTransition {
  id: string;
  name: string;
  to: {
    name: string;
    type: 'unresolved' | 'resolved';
    color: string;
  };
  fields?: {
    [key: string]: {
      required: boolean;
      allowed_values?: string[];
      default_value?: any;
    };
  };
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Parâmetros para criar uma Issue
 */
export interface CreateIssueRequest {
  title: string;
  content?: {
    raw: string;
    markup?: string;
  };
  kind?: IssueType;
  priority?: IssuePriority;
  assignee?: {
    uuid: string;
  };
  component?: {
    name: string;
  };
  milestone?: {
    name: string;
  };
  version?: {
    name: string;
  };
}

/**
 * Parâmetros para atualizar uma Issue
 */
export interface UpdateIssueRequest {
  title?: string;
  content?: {
    raw: string;
    markup?: string;
  };
  kind?: IssueType;
  priority?: IssuePriority;
  assignee?: {
    uuid: string;
  } | null;
  component?: {
    name: string;
  } | null;
  milestone?: {
    name: string;
  } | null;
  version?: {
    name: string;
  } | null;
}

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
 * Parâmetros para transição de Issue
 */
export interface TransitionIssueRequest {
  transition: {
    id: string;
  };
  fields?: {
    [key: string]: any;
  };
}

// ============================================================================
// List Response Types
// ============================================================================

/**
 * Resposta de lista de Issues
 */
export interface IssuesListResponse {
  size: number;
  page: number;
  pagelen: number;
  next?: string;
  previous?: string;
  values: Issue[];
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

/**
 * Resposta de lista de transições
 */
export interface TransitionsListResponse {
  size: number;
  page: number;
  pagelen: number;
  next?: string;
  previous?: string;
  values: IssueTransition[];
}

// ============================================================================
// Search and Filter Types
// ============================================================================

/**
 * Parâmetros de busca para Issues
 */
export interface IssuesSearchParams {
  q?: string;                    // Query de busca
  sort?: string;                 // Campo de ordenação
  state?: IssueStatus;           // Estado da issue
  kind?: IssueType;              // Tipo da issue
  priority?: IssuePriority;      // Prioridade da issue
  assignee?: string;             // UUID do responsável
  reporter?: string;             // UUID do reporter
  component?: string;            // Nome do componente
  milestone?: string;            // Nome do milestone
  version?: string;              // Nome da versão
  created_on?: string;           // Data de criação (formato ISO)
  updated_on?: string;           // Data de atualização (formato ISO)
  page?: number;                 // Página
  pagelen?: number;              // Tamanho da página
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Erro específico de Issues
 */
export interface IssuesError {
  type: string;
  error: {
    message: string;
    detail?: string;
    data?: any;
  };
}

// ============================================================================
// Export all types
// ============================================================================

// All types are already exported above with their declarations
