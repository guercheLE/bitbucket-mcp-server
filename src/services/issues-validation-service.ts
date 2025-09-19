/**
 * Bitbucket Cloud Issues Validation Service
 * 
 * Este serviço implementa validações de regras de negócio e transições
 * de estado para Issues do Bitbucket Cloud.
 * 
 * @fileoverview Serviço de validação para Issues no Bitbucket Cloud
 * @version 1.0.0
 * @since 2024-12-19
 */

import { logger } from '../utils/logger';
import {
  Issue,
  IssueStatus,
  IssueType,
  IssuePriority,
  IssueTransition,
  CreateIssueRequest,
  UpdateIssueRequest,
  TransitionIssueRequest
} from '../types/issues';

// ============================================================================
// Validation Rules Interface
// ============================================================================

export interface ValidationRule {
  name: string;
  validate: (data: any) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Business Rules Configuration
// ============================================================================

export interface IssuesBusinessRules {
  // Title validation
  titleMinLength: number;
  titleMaxLength: number;
  
  // Content validation
  contentMaxLength: number;
  
  // Priority rules
  allowedPriorities: IssuePriority[];
  
  // Type rules
  allowedTypes: IssueType[];
  
  // Status transition rules
  allowedTransitions: { [from: string]: string[] };
  
  // Required fields for transitions
  requiredFieldsForTransitions: { [transitionId: string]: string[] };
}

// ============================================================================
// Issues Validation Service
// ============================================================================

export class IssuesValidationService {
  private rules: IssuesBusinessRules;

  constructor(rules?: Partial<IssuesBusinessRules>) {
    this.rules = {
      titleMinLength: 3,
      titleMaxLength: 200,
      contentMaxLength: 10000,
      allowedPriorities: ['trivial', 'minor', 'major', 'critical', 'blocker'],
      allowedTypes: ['bug', 'enhancement', 'proposal', 'task'],
      allowedTransitions: {
        'new': ['open', 'invalid', 'duplicate'],
        'open': ['resolved', 'on hold', 'invalid', 'duplicate', 'wontfix'],
        'resolved': ['open', 'closed'],
        'on hold': ['open', 'resolved', 'closed'],
        'invalid': ['open'],
        'duplicate': ['open'],
        'wontfix': ['open'],
        'closed': ['open']
      },
      requiredFieldsForTransitions: {
        'resolve': ['resolution'],
        'close': ['resolution']
      },
      ...rules
    };
  }

  // ============================================================================
  // Issue Creation Validation
  // ============================================================================

  /**
   * Validate issue creation request
   */
  validateCreateIssue(request: CreateIssueRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Title validation
    if (!request.title || request.title.trim().length === 0) {
      errors.push('Título é obrigatório');
    } else {
      if (request.title.length < this.rules.titleMinLength) {
        errors.push(`Título deve ter pelo menos ${this.rules.titleMinLength} caracteres`);
      }
      if (request.title.length > this.rules.titleMaxLength) {
        errors.push(`Título deve ter no máximo ${this.rules.titleMaxLength} caracteres`);
      }
    }

    // Content validation
    if (request.content?.raw) {
      if (request.content.raw.length > this.rules.contentMaxLength) {
        errors.push(`Conteúdo deve ter no máximo ${this.rules.contentMaxLength} caracteres`);
      }
    }

    // Type validation
    if (request.kind && !this.rules.allowedTypes.includes(request.kind)) {
      errors.push(`Tipo '${request.kind}' não é permitido. Tipos permitidos: ${this.rules.allowedTypes.join(', ')}`);
    }

    // Priority validation
    if (request.priority && !this.rules.allowedPriorities.includes(request.priority)) {
      errors.push(`Prioridade '${request.priority}' não é permitida. Prioridades permitidas: ${this.rules.allowedPriorities.join(', ')}`);
    }

    // Business rule: Critical issues should have assignee
    if (request.priority === 'critical' && !request.assignee) {
      warnings.push('Issues críticas devem ter um responsável atribuído');
    }

    // Business rule: Bugs should have detailed content
    if (request.kind === 'bug' && (!request.content?.raw || request.content.raw.length < 50)) {
      warnings.push('Bugs devem ter uma descrição detalhada (mínimo 50 caracteres)');
    }

    logger.debug('Issue creation validation completed', {
      errors: errors.length,
      warnings: warnings.length,
      title: request.title?.substring(0, 50)
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ============================================================================
  // Issue Update Validation
  // ============================================================================

  /**
   * Validate issue update request
   */
  validateUpdateIssue(request: UpdateIssueRequest, currentIssue: Issue): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Title validation
    if (request.title !== undefined) {
      if (!request.title || request.title.trim().length === 0) {
        errors.push('Título não pode ser vazio');
      } else {
        if (request.title.length < this.rules.titleMinLength) {
          errors.push(`Título deve ter pelo menos ${this.rules.titleMinLength} caracteres`);
        }
        if (request.title.length > this.rules.titleMaxLength) {
          errors.push(`Título deve ter no máximo ${this.rules.titleMaxLength} caracteres`);
        }
      }
    }

    // Content validation
    if (request.content?.raw) {
      if (request.content.raw.length > this.rules.contentMaxLength) {
        errors.push(`Conteúdo deve ter no máximo ${this.rules.contentMaxLength} caracteres`);
      }
    }

    // Type validation
    if (request.kind && !this.rules.allowedTypes.includes(request.kind)) {
      errors.push(`Tipo '${request.kind}' não é permitido. Tipos permitidos: ${this.rules.allowedTypes.join(', ')}`);
    }

    // Priority validation
    if (request.priority && !this.rules.allowedPriorities.includes(request.priority)) {
      errors.push(`Prioridade '${request.priority}' não é permitida. Prioridades permitidas: ${this.rules.allowedPriorities.join(', ')}`);
    }

    // Business rule: Cannot change type of closed issues
    if (currentIssue.state.type === 'resolved' && request.kind && request.kind !== currentIssue.kind) {
      warnings.push('Não é recomendado alterar o tipo de issues resolvidas');
    }

    // Business rule: Critical issues should have assignee
    const newPriority = request.priority || currentIssue.priority;
    const newAssignee = request.assignee || currentIssue.assignee;
    if (newPriority === 'critical' && !newAssignee) {
      warnings.push('Issues críticas devem ter um responsável atribuído');
    }

    logger.debug('Issue update validation completed', {
      issueId: currentIssue.id,
      errors: errors.length,
      warnings: warnings.length
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ============================================================================
  // Transition Validation
  // ============================================================================

  /**
   * Validate issue transition
   */
  validateTransition(
    request: TransitionIssueRequest, 
    currentIssue: Issue, 
    availableTransitions: IssueTransition[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if transition is available
    const transition = availableTransitions.find(t => t.id === request.transition.id);
    if (!transition) {
      errors.push(`Transição '${request.transition.id}' não está disponível para esta issue`);
      return { isValid: false, errors, warnings };
    }

    // Check if transition is allowed from current state
    const currentStatus = currentIssue.status;
    const allowedTransitions = this.rules.allowedTransitions[currentStatus] || [];
    const targetStatus = transition.to.name.toLowerCase();
    
    if (!allowedTransitions.includes(targetStatus)) {
      errors.push(`Transição de '${currentStatus}' para '${targetStatus}' não é permitida`);
    }

    // Validate required fields for transition
    const requiredFields = this.rules.requiredFieldsForTransitions[request.transition.id] || [];
    for (const field of requiredFields) {
      if (!request.fields || !request.fields[field]) {
        errors.push(`Campo '${field}' é obrigatório para a transição '${request.transition.id}'`);
      }
    }

    // Business rules for specific transitions
    if (request.transition.id === 'resolve' || request.transition.id === 'close') {
      // Resolved/closed issues should have assignee
      if (!currentIssue.assignee) {
        warnings.push('Issues resolvidas/fechadas devem ter um responsável atribuído');
      }

      // Bugs should have detailed resolution
      if (currentIssue.kind === 'bug' && (!request.fields?.resolution || request.fields.resolution.length < 20)) {
        warnings.push('Bugs resolvidos devem ter uma descrição detalhada da resolução');
      }
    }

    // Business rule: Cannot transition critical issues without proper review
    if (currentIssue.priority === 'critical' && (request.transition.id === 'resolve' || request.transition.id === 'close')) {
      warnings.push('Issues críticas devem passar por revisão antes de serem resolvidas/fechadas');
    }

    // Business rule: Duplicate issues should reference original
    if (request.transition.id === 'duplicate' && (!request.fields?.duplicate_of || !request.fields.duplicate_of.trim())) {
      warnings.push('Issues duplicadas devem referenciar a issue original');
    }

    logger.debug('Issue transition validation completed', {
      issueId: currentIssue.id,
      transitionId: request.transition.id,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      errors: errors.length,
      warnings: warnings.length
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ============================================================================
  // Comment Validation
  // ============================================================================

  /**
   * Validate comment creation/update
   */
  validateComment(content: string, issue: Issue): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Content validation
    if (!content || content.trim().length === 0) {
      errors.push('Conteúdo do comentário é obrigatório');
    } else {
      if (content.length > this.rules.contentMaxLength) {
        errors.push(`Comentário deve ter no máximo ${this.rules.contentMaxLength} caracteres`);
      }
      if (content.length < 3) {
        errors.push('Comentário deve ter pelo menos 3 caracteres');
      }
    }

    // Business rule: Cannot comment on closed issues (warning only)
    if (issue.state.type === 'resolved') {
      warnings.push('Comentando em issue resolvida - considere reabrir se necessário');
    }

    logger.debug('Comment validation completed', {
      issueId: issue.id,
      contentLength: content?.length || 0,
      errors: errors.length,
      warnings: warnings.length
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ============================================================================
  // Additional Validation Methods
  // ============================================================================

  /**
   * Validate issue ID
   */
  validateIssueId(issueId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!issueId || issueId.trim().length === 0) {
      errors.push('ID da issue é obrigatório');
    } else if (!/^\d+$/.test(issueId)) {
      errors.push('ID da issue deve ser um número válido');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate comment ID
   */
  validateCommentId(commentId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!commentId || commentId.trim().length === 0) {
      errors.push('ID do comentário é obrigatório');
    } else if (!/^\d+$/.test(commentId)) {
      errors.push('ID do comentário deve ser um número válido');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate create comment request
   */
  validateCreateCommentRequest(request: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!request) {
      errors.push('Request é obrigatório');
      return { isValid: false, errors, warnings };
    }

    if (!request.content || request.content.trim().length === 0) {
      errors.push('Conteúdo do comentário é obrigatório');
    } else {
      if (request.content.length > this.rules.contentMaxLength) {
        errors.push(`Comentário deve ter no máximo ${this.rules.contentMaxLength} caracteres`);
      }
      if (request.content.length < 3) {
        errors.push('Comentário deve ter pelo menos 3 caracteres');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate update comment request
   */
  validateUpdateCommentRequest(request: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!request) {
      errors.push('Request é obrigatório');
      return { isValid: false, errors, warnings };
    }

    if (!request.content || request.content.trim().length === 0) {
      errors.push('Conteúdo do comentário é obrigatório');
    } else {
      if (request.content.length > this.rules.contentMaxLength) {
        errors.push(`Comentário deve ter no máximo ${this.rules.contentMaxLength} caracteres`);
      }
      if (request.content.length < 3) {
        errors.push('Comentário deve ter pelo menos 3 caracteres');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate transition request
   */
  validateTransitionRequest(request: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!request) {
      errors.push('Request é obrigatório');
      return { isValid: false, errors, warnings };
    }

    if (!request.transition || !request.transition.name) {
      errors.push('Transição é obrigatória');
    }

    if (request.fields) {
      // Validate fields if provided
      for (const [fieldName, fieldValue] of Object.entries(request.fields)) {
        if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
          warnings.push(`Campo '${fieldName}' está vazio`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate pagination parameters
   */
  validatePaginationParams(page?: number, pagelen?: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (page !== undefined) {
      if (page < 0) {
        errors.push('Página deve ser um número não negativo');
      }
    }

    if (pagelen !== undefined) {
      if (pagelen < 1) {
        errors.push('Tamanho da página deve ser pelo menos 1');
      } else if (pagelen > 1000) {
        errors.push('Tamanho da página não pode exceder 1000');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get available transitions for an issue
   */
  getAvailableTransitions(currentStatus: IssueStatus): string[] {
    return this.rules.allowedTransitions[currentStatus] || [];
  }

  /**
   * Check if a transition is valid
   */
  isValidTransition(fromStatus: IssueStatus, toStatus: string): boolean {
    const allowedTransitions = this.rules.allowedTransitions[fromStatus] || [];
    return allowedTransitions.includes(toStatus.toLowerCase());
  }

  /**
   * Get business rules configuration
   */
  getBusinessRules(): Readonly<IssuesBusinessRules> {
    return { ...this.rules };
  }

  /**
   * Update business rules
   */
  updateBusinessRules(newRules: Partial<IssuesBusinessRules>): void {
    this.rules = { ...this.rules, ...newRules };
    logger.info('Business rules updated', { updatedFields: Object.keys(newRules) });
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createIssuesValidationService(rules?: Partial<IssuesBusinessRules>): IssuesValidationService {
  return new IssuesValidationService(rules);
}

// ============================================================================
// Default Instance
// ============================================================================

export const issuesValidationService = createIssuesValidationService();
