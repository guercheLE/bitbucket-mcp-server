/**
 * Pull Request Types and Schemas
 * TypeScript type definitions and Zod validation schemas for Bitbucket Pull Requests
 * Compatible with Data Center 7.16+ and Cloud APIs
 */

import { z } from 'zod';

// ============================================================================
// Core Pull Request Types
// ============================================================================

export interface PullRequest {
  // Identificação
  id: number;                    // ID único do pull request
  version: number;               // Versão para controle de concorrência
  
  // Metadados básicos
  title: string;                 // Título do pull request
  description?: string;          // Descrição detalhada
  state: PullRequestState;       // Estado atual
  
  // Referências de branch
  fromRef: Ref;                  // Branch origem
  toRef: Ref;                    // Branch destino
  
  // Usuários e participantes
  author: User;                  // Autor do pull request
  reviewers: Reviewer[];         // Lista de revisores
  participants: Participant[];   // Lista de participantes
  
  // Timestamps
  createdDate: string;           // Data de criação (ISO 8601)
  updatedDate: string;           // Data da última atualização
  
  // Status e flags
  open: boolean;                 // Se está aberto
  closed: boolean;               // Se está fechado
  locked: boolean;               // Se está bloqueado
  
  // Configurações de merge
  closeSourceBranch?: boolean;   // Fechar branch origem após merge
  mergeCommit?: Commit;          // Commit de merge (se aplicável)
  
  // Links e recursos
  links: Links;                  // Links para recursos relacionados
}

export type PullRequestState = 
  | 'OPEN'       // Aberto
  | 'MERGED'     // Mergeado
  | 'DECLINED'   // Recusado
  | 'SUPERSEDED' // Substituído
  | 'DRAFT';     // Rascunho (Cloud apenas)

// ============================================================================
// Supporting Entities
// ============================================================================

export interface Ref {
  id: string;                    // ID da referência (ex: refs/heads/main)
  displayId: string;             // ID de exibição (ex: main)
  latestCommit: string;          // Último commit
  repository: Repository;        // Repositório da referência
}

export interface User {
  name: string;                  // Nome do usuário
  emailAddress?: string;         // Email do usuário
  id?: number;                   // ID numérico (Data Center)
  slug?: string;                 // Slug do usuário (Cloud)
  displayName?: string;          // Nome de exibição
  active?: boolean;              // Se está ativo
  type?: string;                 // Tipo do usuário
  links?: Links;                 // Links para recursos
}

export interface Repository {
  slug: string;                  // Slug do repositório
  name: string;                  // Nome do repositório
  project: Project;              // Projeto do repositório
  scmId?: string;                // Tipo de SCM (git, hg)
  public?: boolean;              // Se é público
  forkable?: boolean;            // Se pode ser forkado
  links?: Links;                 // Links para recursos
}

export interface Project {
  key: string;                   // Chave do projeto
  name: string;                  // Nome do projeto
  description?: string;          // Descrição do projeto
  public?: boolean;              // Se é público
  type?: string;                 // Tipo do projeto
  links?: Links;                 // Links para recursos
}

export interface Commit {
  id: string;                    // Hash do commit
  displayId: string;             // ID de exibição
  author: User;                  // Autor do commit
  authorTimestamp: string;       // Timestamp do autor
  committer?: User;              // Committer (se diferente do autor)
  committerTimestamp?: string;   // Timestamp do committer
  message: string;               // Mensagem do commit
  parents?: Commit[];            // Commits pais
}

export interface Links {
  self?: Link[];                 // Link para o próprio recurso
  html?: Link[];                 // Link para interface web
  clone?: Link[];                // Links de clone
  [key: string]: Link[] | undefined; // Outros links
}

export interface Link {
  href: string;                  // URL do link
  name?: string;                 // Nome do link
}

// ============================================================================
// Comment Types
// ============================================================================

export interface Comment {
  // Identificação
  id: number;                    // ID único do comentário
  version: number;               // Versão para controle de concorrência
  
  // Conteúdo
  text: string;                  // Texto do comentário
  
  // Metadados
  author: User;                  // Autor do comentário
  createdDate: string;           // Data de criação
  updatedDate?: string;          // Data da última atualização
  
  // Hierarquia
  parent?: Comment;              // Comentário pai (para threads)
  comments?: Comment[];          // Comentários filhos
  
  // Contexto
  anchor?: CommentAnchor;        // Âncora no código (se aplicável)
  
  // Status
  deleted?: boolean;             // Se foi deletado
  severity?: CommentSeverity;    // Severidade do comentário
  
  // Links
  links: Links;                  // Links para recursos relacionados
}

export interface CommentAnchor {
  line: number;                  // Linha do código
  lineType: 'ADDED' | 'REMOVED' | 'CONTEXT'; // Tipo de linha
  fileType: 'FROM' | 'TO';       // Tipo de arquivo
  path: string;                  // Caminho do arquivo
  srcPath?: string;              // Caminho de origem (se diferente)
}

export type CommentSeverity = 
  | 'NORMAL'     // Normal
  | 'BLOCKER'    // Bloqueador
  | 'WARNING';   // Aviso

// ============================================================================
// Reviewer and Participant Types
// ============================================================================

export interface Reviewer {
  // Usuário
  user: User;                    // Usuário revisor
  
  // Status de revisão
  approved: boolean;             // Se aprovou
  status: ReviewStatus;          // Status da revisão
  
  // Metadados
  lastReviewedCommit?: string;   // Último commit revisado
  role: ReviewRole;              // Papel na revisão
  
  // Timestamps
  participatedOn?: string;       // Data de participação
}

export interface Participant {
  // Usuário
  user: User;                    // Usuário participante
  
  // Papel e status
  role: ParticipantRole;         // Papel do participante
  approved: boolean;             // Se aprovou
  status?: ParticipantStatus;    // Status do participante
  
  // Timestamps
  participatedOn: string;        // Data de participação
}

export type ReviewStatus = 
  | 'APPROVED'   // Aprovado
  | 'NEEDS_WORK' // Precisa de trabalho
  | 'UNAPPROVED'; // Não aprovado

export type ReviewRole = 
  | 'REVIEWER'   // Revisor
  | 'AUTHOR'     // Autor
  | 'PARTICIPANT'; // Participante

export type ParticipantRole = 
  | 'AUTHOR'     // Autor
  | 'REVIEWER'   // Revisor
  | 'PARTICIPANT'; // Participante

export type ParticipantStatus = 
  | 'APPROVED'   // Aprovado
  | 'NEEDS_WORK' // Precisa de trabalho
  | 'UNAPPROVED'; // Não aprovado

// ============================================================================
// Activity Types
// ============================================================================

export interface Activity {
  // Identificação
  id: number;                    // ID único da atividade
  
  // Tipo e ação
  action: ActivityAction;        // Tipo de atividade
  commentAction?: CommentAction; // Ação específica de comentário
  
  // Usuário e contexto
  user: User;                    // Usuário que executou a atividade
  createdDate: string;           // Data da atividade
  
  // Detalhes específicos
  comment?: Comment;             // Comentário associado (se aplicável)
  fromHash?: string;             // Hash de origem (se aplicável)
  toHash?: string;               // Hash de destino (se aplicável)
  
  // Metadados adicionais
  added?: boolean;               // Se foi adicionado
  removed?: boolean;             // Se foi removido
}

export type ActivityAction = 
  | 'COMMENTED'      // Comentou
  | 'OPENED'         // Abriu
  | 'MERGED'         // Mergeou
  | 'DECLINED'       // Recusou
  | 'REOPENED'       // Reabriu
  | 'RESCOPED'       // Reescopo
  | 'UPDATED'        // Atualizou
  | 'APPROVED'       // Aprovou
  | 'UNAPPROVED'     // Desaprovou
  | 'REVIEWED'       // Revisou
  | 'COMMENTED_ON_COMMIT'; // Comentou em commit

export type CommentAction = 
  | 'ADDED'      // Adicionado
  | 'UPDATED'    // Atualizado
  | 'DELETED';   // Deletado

// ============================================================================
// Diff and Changes Types
// ============================================================================

export interface Diff {
  fromHash: string;              // Hash do commit de origem
  toHash: string;                // Hash do commit de destino
  contextLines: number;          // Número de linhas de contexto
  whitespace: WhitespaceHandling; // Tratamento de espaços em branco
  diff: string;                  // Conteúdo do diff unificado
  comments?: DiffComment[];      // Comentários no diff
  truncated: boolean;            // Se o diff foi truncado
}

export interface DiffComment {
  id: number;                    // ID do comentário
  text: string;                  // Texto do comentário
  author: User;                  // Autor do comentário
  createdDate: string;           // Data de criação
  anchor: CommentAnchor;         // Âncora no código
  severity?: CommentSeverity;    // Severidade do comentário
}

export type WhitespaceHandling = 
  | 'ignore-all'           // Ignorar todos os espaços
  | 'ignore-change-amount' // Ignorar quantidade de mudanças
  | 'ignore-eol-at-eof'    // Ignorar EOL no final do arquivo
  | 'show-all';            // Mostrar todos

export interface Change {
  contentId: string;             // ID do conteúdo
  fromContentId?: string;        // ID do conteúdo de origem
  path: string;                  // Caminho do arquivo
  type: ChangeTypeEnum;          // Tipo de mudança
  nodeType: NodeType;            // Tipo de nó
  srcExecutable?: boolean;       // Se origem é executável
  executable?: boolean;          // Se destino é executável
  percentUnchanged?: number;     // Percentual inalterado
  links?: Links;                 // Links para recursos
}

export type ChangeTypeEnum = 
  | 'ADD'      // Adicionado
  | 'MODIFY'   // Modificado
  | 'DELETE'   // Deletado
  | 'RENAME'   // Renomeado
  | 'COPY';    // Copiado

export type NodeType = 
  | 'FILE'       // Arquivo
  | 'DIRECTORY'; // Diretório

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreatePullRequestRequest {
  title: string;                 // Título do pull request
  description?: string;          // Descrição do pull request
  fromRef: Ref;                  // Referência de origem
  toRef: Ref;                    // Referência de destino
  reviewers?: User[];            // Lista de revisores
  closeSourceBranch?: boolean;   // Fechar branch origem após merge
}

export interface UpdatePullRequestRequest {
  version: number;               // Versão para controle de concorrência
  title?: string;                // Novo título
  description?: string;          // Nova descrição
  reviewers?: User[];            // Nova lista de revisores
  closeSourceBranch?: boolean;   // Fechar branch origem após merge
}

export interface CreateCommentRequest {
  text: string;                  // Texto do comentário
  parent?: {                     // Comentário pai (para threads)
    id: number;
  };
  anchor?: CommentAnchor;        // Âncora no código
  severity?: CommentSeverity;    // Severidade do comentário
}

export interface UpdateCommentRequest {
  version: number;               // Versão para controle de concorrência
  text: string;                  // Novo texto do comentário
  severity?: CommentSeverity;    // Nova severidade
}

export interface MergePullRequestRequest {
  version: number;               // Versão para controle de concorrência
  mergeCommitMessage?: string;   // Mensagem personalizada do commit de merge
  closeSourceBranch?: boolean;   // Fechar branch origem após merge
}

export interface DeclinePullRequestRequest {
  version: number;               // Versão para controle de concorrência
  reason?: string;               // Motivo da recusa
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginatedResponse<T> {
  size: number;                  // Tamanho da página
  limit: number;                 // Limite de itens por página
  isLastPage: boolean;           // Se é a última página
  values: T[];                   // Valores da página
  start: number;                 // Índice de início
  nextPageStart?: number;        // Próximo índice de início
}

// ============================================================================
// Error Types
// ============================================================================

export interface ConflictError {
  errors: Array<{
    context: string;             // Contexto do erro
    message: string;             // Mensagem do erro
    exceptionName: string;       // Nome da exceção
  }>;
}

export interface ApiError {
  errors: Array<{
    context: string;             // Contexto do erro
    message: string;             // Mensagem do erro
    exceptionName: string;       // Nome da exceção
  }>;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

// Base schemas
export const UserSchema = z.object({
  name: z.string().min(1, 'Nome do usuário é obrigatório'),
  emailAddress: z.string().email('Email inválido').optional(),
  id: z.number().int().positive('ID deve ser positivo').optional(),
  slug: z.string().min(1, 'Slug é obrigatório').optional(),
  displayName: z.string().min(1, 'Nome de exibição é obrigatório').optional(),
  active: z.boolean().optional(),
  type: z.string().optional(),
  links: z.record(z.array(z.object({
    href: z.string().url('URL inválida'),
    name: z.string().optional(),
  }))).optional(),
});

export const ProjectSchema = z.object({
  key: z.string().min(1, 'Chave do projeto é obrigatória'),
  name: z.string().min(1, 'Nome do projeto é obrigatório'),
  description: z.string().optional(),
  public: z.boolean().optional(),
  type: z.string().optional(),
  links: z.record(z.array(z.object({
    href: z.string().url('URL inválida'),
    name: z.string().optional(),
  }))).optional(),
});

export const RepositorySchema = z.object({
  slug: z.string().min(1, 'Slug do repositório é obrigatório'),
  name: z.string().min(1, 'Nome do repositório é obrigatório'),
  project: ProjectSchema,
  scmId: z.string().optional(),
  public: z.boolean().optional(),
  forkable: z.boolean().optional(),
  links: z.record(z.array(z.object({
    href: z.string().url('URL inválida'),
    name: z.string().optional(),
  }))).optional(),
});

export const RefSchema = z.object({
  id: z.string().min(1, 'ID da referência é obrigatório'),
  displayId: z.string().min(1, 'ID de exibição é obrigatório'),
  latestCommit: z.string().min(1, 'Hash do commit é obrigatório'),
  repository: RepositorySchema,
});

export const CommitSchema: z.ZodType<Commit> = z.object({
  id: z.string().min(1, 'Hash do commit é obrigatório'),
  displayId: z.string().min(1, 'ID de exibição é obrigatório'),
  author: UserSchema,
  authorTimestamp: z.string().datetime('Timestamp do autor inválido'),
  committer: UserSchema.optional(),
  committerTimestamp: z.string().datetime('Timestamp do committer inválido').optional(),
  message: z.string().min(1, 'Mensagem do commit é obrigatória'),
  parents: z.array(z.lazy((): z.ZodType<Commit> => CommitSchema)).optional(),
});

export const LinksSchema = z.record(z.array(z.object({
  href: z.string().url('URL inválida'),
  name: z.string().optional(),
})));

// Comment schemas
export const CommentAnchorSchema = z.object({
  line: z.number().int().positive('Linha deve ser positiva'),
  lineType: z.enum(['ADDED', 'REMOVED', 'CONTEXT'], {
    errorMap: () => ({ message: 'Tipo de linha deve ser ADDED, REMOVED ou CONTEXT' })
  }),
  fileType: z.enum(['FROM', 'TO'], {
    errorMap: () => ({ message: 'Tipo de arquivo deve ser FROM ou TO' })
  }),
  path: z.string().min(1, 'Caminho do arquivo é obrigatório'),
  srcPath: z.string().optional(),
});

export const CommentSeveritySchema = z.enum(['NORMAL', 'BLOCKER', 'WARNING'], {
  errorMap: () => ({ message: 'Severidade deve ser NORMAL, BLOCKER ou WARNING' })
});

export const CommentSchema: z.ZodType<Comment> = z.object({
  id: z.number().int().positive('ID do comentário deve ser positivo'),
  version: z.number().int().nonnegative('Versão deve ser não-negativa'),
  text: z.string().min(1, 'Texto do comentário é obrigatório').max(32768, 'Texto muito longo'),
  author: UserSchema,
  createdDate: z.string().datetime('Data de criação inválida'),
  updatedDate: z.string().datetime('Data de atualização inválida').optional(),
  parent: z.lazy((): z.ZodType<Comment> => CommentSchema).optional(),
  comments: z.array(z.lazy((): z.ZodType<Comment> => CommentSchema)).optional(),
  anchor: CommentAnchorSchema.optional(),
  deleted: z.boolean().optional(),
  severity: CommentSeveritySchema.optional(),
  links: LinksSchema,
});

// Reviewer and Participant schemas
export const ReviewStatusSchema = z.enum(['APPROVED', 'NEEDS_WORK', 'UNAPPROVED'], {
  errorMap: () => ({ message: 'Status deve ser APPROVED, NEEDS_WORK ou UNAPPROVED' })
});

export const ReviewRoleSchema = z.enum(['REVIEWER', 'AUTHOR', 'PARTICIPANT'], {
  errorMap: () => ({ message: 'Papel deve ser REVIEWER, AUTHOR ou PARTICIPANT' })
});

export const ParticipantRoleSchema = z.enum(['AUTHOR', 'REVIEWER', 'PARTICIPANT'], {
  errorMap: () => ({ message: 'Papel deve ser AUTHOR, REVIEWER ou PARTICIPANT' })
});

export const ParticipantStatusSchema = z.enum(['APPROVED', 'NEEDS_WORK', 'UNAPPROVED'], {
  errorMap: () => ({ message: 'Status deve ser APPROVED, NEEDS_WORK ou UNAPPROVED' })
});

export const ReviewerSchema = z.object({
  user: UserSchema,
  approved: z.boolean(),
  status: ReviewStatusSchema,
  lastReviewedCommit: z.string().optional(),
  role: ReviewRoleSchema,
  participatedOn: z.string().datetime('Data de participação inválida').optional(),
});

export const ParticipantSchema = z.object({
  user: UserSchema,
  role: ParticipantRoleSchema,
  approved: z.boolean(),
  status: ParticipantStatusSchema.optional(),
  participatedOn: z.string().datetime('Data de participação inválida'),
});

// Activity schemas
export const ActivityActionSchema = z.enum([
  'COMMENTED', 'OPENED', 'MERGED', 'DECLINED', 'REOPENED', 
  'RESCOPED', 'UPDATED', 'APPROVED', 'UNAPPROVED', 'REVIEWED', 'COMMENTED_ON_COMMIT'
], {
  errorMap: () => ({ message: 'Ação de atividade inválida' })
});

export const CommentActionSchema = z.enum(['ADDED', 'UPDATED', 'DELETED'], {
  errorMap: () => ({ message: 'Ação de comentário deve ser ADDED, UPDATED ou DELETED' })
});

export const ActivitySchema = z.object({
  id: z.number().int().positive('ID da atividade deve ser positivo'),
  action: ActivityActionSchema,
  commentAction: CommentActionSchema.optional(),
  user: UserSchema,
  createdDate: z.string().datetime('Data da atividade inválida'),
  comment: CommentSchema.optional(),
  fromHash: z.string().optional(),
  toHash: z.string().optional(),
  added: z.boolean().optional(),
  removed: z.boolean().optional(),
});

// Diff and Changes schemas
export const WhitespaceHandlingSchema = z.enum([
  'ignore-all', 'ignore-change-amount', 'ignore-eol-at-eof', 'show-all'
], {
  errorMap: () => ({ message: 'Tratamento de espaços inválido' })
});

export const DiffCommentSchema = z.object({
  id: z.number().int().positive('ID do comentário deve ser positivo'),
  text: z.string().min(1, 'Texto do comentário é obrigatório'),
  author: UserSchema,
  createdDate: z.string().datetime('Data de criação inválida'),
  anchor: CommentAnchorSchema,
  severity: CommentSeveritySchema.optional(),
});

export const DiffSchema = z.object({
  fromHash: z.string().min(1, 'Hash de origem é obrigatório'),
  toHash: z.string().min(1, 'Hash de destino é obrigatório'),
  contextLines: z.number().int().nonnegative('Linhas de contexto devem ser não-negativas'),
  whitespace: WhitespaceHandlingSchema,
  diff: z.string().min(1, 'Conteúdo do diff é obrigatório'),
  comments: z.array(DiffCommentSchema).optional(),
  truncated: z.boolean(),
});

export const ChangeTypeEnumSchema = z.enum(['ADD', 'MODIFY', 'DELETE', 'RENAME', 'COPY'], {
  errorMap: () => ({ message: 'Tipo de mudança deve ser ADD, MODIFY, DELETE, RENAME ou COPY' })
});

export const NodeTypeSchema = z.enum(['FILE', 'DIRECTORY'], {
  errorMap: () => ({ message: 'Tipo de nó deve ser FILE ou DIRECTORY' })
});

export const ChangeSchema = z.object({
  contentId: z.string().min(1, 'ID do conteúdo é obrigatório'),
  fromContentId: z.string().optional(),
  path: z.string().min(1, 'Caminho é obrigatório'),
  type: ChangeTypeEnumSchema,
  nodeType: NodeTypeSchema,
  srcExecutable: z.boolean().optional(),
  executable: z.boolean().optional(),
  percentUnchanged: z.number().int().min(0).max(100).optional(),
  links: LinksSchema.optional(),
});

// Main Pull Request schema
export const PullRequestStateSchema = z.enum(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED', 'DRAFT'], {
  errorMap: () => ({ message: 'Estado deve ser OPEN, MERGED, DECLINED, SUPERSEDED ou DRAFT' })
});

export const PullRequestSchema = z.object({
  id: z.number().int().positive('ID do pull request deve ser positivo'),
  version: z.number().int().nonnegative('Versão deve ser não-negativa'),
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  description: z.string().max(32768, 'Descrição muito longa').optional(),
  state: PullRequestStateSchema,
  fromRef: RefSchema,
  toRef: RefSchema,
  author: UserSchema,
  reviewers: z.array(ReviewerSchema),
  participants: z.array(ParticipantSchema),
  createdDate: z.string().datetime('Data de criação inválida'),
  updatedDate: z.string().datetime('Data de atualização inválida'),
  open: z.boolean(),
  closed: z.boolean(),
  locked: z.boolean(),
  closeSourceBranch: z.boolean().optional(),
  mergeCommit: CommitSchema.optional(),
  links: LinksSchema,
});

// Request schemas
export const CreatePullRequestRequestSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  description: z.string().max(32768, 'Descrição muito longa').optional(),
  fromRef: RefSchema,
  toRef: RefSchema,
  reviewers: z.array(UserSchema).optional(),
  closeSourceBranch: z.boolean().optional(),
});

export const UpdatePullRequestRequestSchema = z.object({
  version: z.number().int().nonnegative('Versão deve ser não-negativa'),
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo').optional(),
  description: z.string().max(32768, 'Descrição muito longa').optional(),
  reviewers: z.array(UserSchema).optional(),
  closeSourceBranch: z.boolean().optional(),
});

export const CreateCommentRequestSchema = z.object({
  text: z.string().min(1, 'Texto do comentário é obrigatório').max(32768, 'Texto muito longo'),
  parent: z.object({
    id: z.number().int().positive('ID do comentário pai deve ser positivo'),
  }).optional(),
  anchor: CommentAnchorSchema.optional(),
  severity: CommentSeveritySchema.optional(),
});

export const UpdateCommentRequestSchema = z.object({
  version: z.number().int().nonnegative('Versão deve ser não-negativa'),
  text: z.string().min(1, 'Texto do comentário é obrigatório').max(32768, 'Texto muito longo'),
  severity: CommentSeveritySchema.optional(),
});

export const MergePullRequestRequestSchema = z.object({
  version: z.number().int().nonnegative('Versão deve ser não-negativa'),
  mergeCommitMessage: z.string().max(1000, 'Mensagem muito longa').optional(),
  closeSourceBranch: z.boolean().optional(),
});

export const DeclinePullRequestRequestSchema = z.object({
  version: z.number().int().nonnegative('Versão deve ser não-negativa'),
  reason: z.string().max(1000, 'Motivo muito longo').optional(),
});

// Pagination schema
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    size: z.number().int().nonnegative('Tamanho deve ser não-negativo'),
    limit: z.number().int().positive('Limite deve ser positivo'),
    isLastPage: z.boolean(),
    values: z.array(itemSchema),
    start: z.number().int().nonnegative('Índice de início deve ser não-negativo'),
    nextPageStart: z.number().int().nonnegative('Próximo índice deve ser não-negativo').optional(),
  });

// Error schemas
export const ApiErrorSchema = z.object({
  errors: z.array(z.object({
    context: z.string(),
    message: z.string(),
    exceptionName: z.string(),
  })),
});

export const ConflictErrorSchema = ApiErrorSchema;

// ============================================================================
// Type Exports
// ============================================================================

// Inferred types from schemas
export type PullRequestType = z.infer<typeof PullRequestSchema>;
export type CommentType = z.infer<typeof CommentSchema>;
export type ActivityType = z.infer<typeof ActivitySchema>;
export type DiffType = z.infer<typeof DiffSchema>;
export type ChangeType = z.infer<typeof ChangeSchema>;
export type UserType = z.infer<typeof UserSchema>;
export type ProjectType = z.infer<typeof ProjectSchema>;
export type RepositoryType = z.infer<typeof RepositorySchema>;
export type RefType = z.infer<typeof RefSchema>;
export type CommitType = z.infer<typeof CommitSchema>;
export type ReviewerType = z.infer<typeof ReviewerSchema>;
export type ParticipantType = z.infer<typeof ParticipantSchema>;

// Request types
export type CreatePullRequestRequestType = z.infer<typeof CreatePullRequestRequestSchema>;
export type UpdatePullRequestRequestType = z.infer<typeof UpdatePullRequestRequestSchema>;
export type CreateCommentRequestType = z.infer<typeof CreateCommentRequestSchema>;
export type UpdateCommentRequestType = z.infer<typeof UpdateCommentRequestSchema>;
export type MergePullRequestRequestType = z.infer<typeof MergePullRequestRequestSchema>;
export type DeclinePullRequestRequestType = z.infer<typeof DeclinePullRequestRequestSchema>;

// Pagination types
export type PaginatedPullRequestsType = z.infer<ReturnType<typeof PaginatedResponseSchema<typeof PullRequestSchema>>>;
export type PaginatedCommentsType = z.infer<ReturnType<typeof PaginatedResponseSchema<typeof CommentSchema>>>;
export type PaginatedActivitiesType = z.infer<ReturnType<typeof PaginatedResponseSchema<typeof ActivitySchema>>>;
export type PaginatedChangesType = z.infer<ReturnType<typeof PaginatedResponseSchema<typeof ChangeSchema>>>;

// Error types
export type ApiErrorType = z.infer<typeof ApiErrorSchema>;
export type ConflictErrorType = z.infer<typeof ConflictErrorSchema>;

// Enum types
export type PullRequestStateType = z.infer<typeof PullRequestStateSchema>;
export type ReviewStatusType = z.infer<typeof ReviewStatusSchema>;
export type ReviewRoleType = z.infer<typeof ReviewRoleSchema>;
export type ParticipantRoleType = z.infer<typeof ParticipantRoleSchema>;
export type ParticipantStatusType = z.infer<typeof ParticipantStatusSchema>;
export type ActivityActionType = z.infer<typeof ActivityActionSchema>;
export type CommentActionType = z.infer<typeof CommentActionSchema>;
export type CommentSeverityType = z.infer<typeof CommentSeveritySchema>;
export type WhitespaceHandlingType = z.infer<typeof WhitespaceHandlingSchema>;
export type ChangeTypeEnumType = z.infer<typeof ChangeTypeEnumSchema>;
export type NodeTypeType = z.infer<typeof NodeTypeSchema>;
