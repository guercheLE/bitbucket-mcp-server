/**
 * Bitbucket Cloud Issues Module
 * 
 * Este módulo exporta todas as funcionalidades relacionadas a Issues
 * do Bitbucket Cloud, incluindo serviços, ferramentas MCP e tipos.
 * 
 * @fileoverview Módulo principal para Issues no Bitbucket Cloud
 * @version 1.0.0
 * @since 2024-12-19
 */

// ============================================================================
// Service Exports
// ============================================================================

export { IssuesService, createIssuesService, IssuesServiceConfig } from './issues-service';

// ============================================================================
// MCP Tools Exports
// ============================================================================

export { issuesMcpTools, IssuesMcpHandlers, createIssuesMcpHandlers } from './mcp-tools';

// ============================================================================
// Type Exports
// ============================================================================

export type {
  Issue,
  IssueComment,
  IssueRelationship,
  IssueAttachment,
  IssueTransition,
  CreateIssueRequest,
  UpdateIssueRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  TransitionIssueRequest,
  IssuesListResponse,
  CommentsListResponse,
  RelationshipsListResponse,
  AttachmentsListResponse,
  TransitionsListResponse,
  IssuesSearchParams,
  IssuesError,
  IssueStatus,
  IssuePriority,
  IssueType,
  IssueState,
  IssueComponent,
  IssueMilestone,
  IssueVersion,
  IssueWatcher,
  IssueVoter,
  IssueRelationshipType
} from '../../../types/issues';

// ============================================================================
// Default Export
// ============================================================================

// Import the actual implementations
import { IssuesService, createIssuesService } from './issues-service';
import { issuesMcpTools, IssuesMcpHandlers, createIssuesMcpHandlers } from './mcp-tools';

export default {
  IssuesService,
  createIssuesService,
  issuesMcpTools,
  IssuesMcpHandlers,
  createIssuesMcpHandlers
};
