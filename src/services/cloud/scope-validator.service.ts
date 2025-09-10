/**
 * Scope Validator Service for Bitbucket Cloud REST API
 * Based on official documentation: https://developer.atlassian.com/cloud/bitbucket/rest/intro/#authentication
 */

import {
  OAuthScope,
  ForgeAppScope,
  RepositoryAccessTokenScope,
  ProjectAccessTokenScope,
  WorkspaceAccessTokenScope,
  AccessTokenScope,
} from './types/authentication.types.js';
import { Logger } from '../../utils/logger.util.js';

export class ScopeValidatorService {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  // ===== OAUTH SCOPES =====

  /**
   * Valid OAuth Scopes
   */
  private readonly validOAuthScopes: OAuthScope[] = [
    'account',
    'account:write',
    'repositories',
    'repositories:write',
    'repositories:admin',
    'repositories:delete',
    'pullrequests',
    'pullrequests:write',
    'issues',
    'issues:write',
    'wiki',
    'snippets',
    'snippets:write',
    'projects',
    'projects:write',
    'projects:delete',
    'webhooks',
    'pipeline',
    'pipeline:write',
    'pipeline:variable',
    'runner',
    'runner:write',
    'email',
  ];

  /**
   * Valid Forge App Scopes
   */
  private readonly validForgeAppScopes: ForgeAppScope[] = [
    'read:repository:bitbucket',
    'write:repository:bitbucket',
    'admin:repository:bitbucket',
    'delete:repository:bitbucket',
    'read:pullrequest:bitbucket',
    'write:pullrequest:bitbucket',
    'read:project:bitbucket',
    'admin:project:bitbucket',
    'read:workspace:bitbucket',
    'admin:workspace:bitbucket',
    'read:user:bitbucket',
    'write:user:bitbucket',
    'read:pipeline:bitbucket',
    'write:pipeline:bitbucket',
    'admin:pipeline:bitbucket',
    'read:runner:bitbucket',
    'write:runner:bitbucket',
    'read:issue:bitbucket',
    'write:issue:bitbucket',
    'delete:issue:bitbucket',
    'read:webhook:bitbucket',
    'write:webhook:bitbucket',
    'delete:webhook:bitbucket',
    'read:snippet:bitbucket',
    'write:snippet:bitbucket',
    'delete:snippet:bitbucket',
    'read:ssh-key:bitbucket',
    'write:ssh-key:bitbucket',
    'delete:ssh-key:bitbucket',
    'read:gpg-key:bitbucket',
    'write:gpg-key:bitbucket',
    'delete:gpg-key:bitbucket',
    'read:permission:bitbucket',
    'write:permission:bitbucket',
    'delete:permission:bitbucket',
  ];

  /**
   * Repository Access Token Scopes
   */
  private readonly validRepositoryScopes: RepositoryAccessTokenScope[] = [
    'repository',
    'repository:write',
    'repository:admin',
    'repository:delete',
    'pullrequest',
    'pullrequest:write',
    'webhook',
    'pipeline',
    'pipeline:write',
    'pipeline:variable',
    'runner',
    'runner:write',
  ];

  /**
   * Project Access Token Scopes
   */
  private readonly validProjectScopes: ProjectAccessTokenScope[] = [
    'project',
    'repository',
    'repository:write',
    'repository:admin',
    'repository:delete',
    'pullrequest',
    'pullrequest:write',
    'webhook',
    'pipeline',
    'pipeline:write',
    'pipeline:variable',
    'runner',
    'runner:write',
  ];

  /**
   * Workspace Access Token Scopes
   */
  private readonly validWorkspaceScopes: WorkspaceAccessTokenScope[] = [
    'project',
    'project:admin',
    'repository',
    'repository:write',
    'repository:admin',
    'repository:delete',
    'pullrequest',
    'pullrequest:write',
    'webhook',
    'account',
    'pipeline',
    'pipeline:write',
    'pipeline:variable',
    'runner',
    'runner:write',
  ];

  // ===== VALIDATION METHODS =====

  /**
   * Validate OAuth Scopes
   */
  validateOAuthScopes(scopes: string[]): { valid: boolean; invalidScopes: string[] } {
    this.logger.info('Validating OAuth scopes', { scopeCount: scopes.length });

    const invalidScopes = scopes.filter(
      scope => !this.validOAuthScopes.includes(scope as OAuthScope)
    );
    const valid = invalidScopes.length === 0;

    if (!valid) {
      this.logger.warn('Invalid OAuth scopes found', { invalidScopes });
    } else {
      this.logger.info('All OAuth scopes are valid');
    }

    return { valid, invalidScopes };
  }

  /**
   * Validate Forge App Scopes
   */
  validateForgeAppScopes(scopes: string[]): { valid: boolean; invalidScopes: string[] } {
    this.logger.info('Validating Forge app scopes', { scopeCount: scopes.length });

    const invalidScopes = scopes.filter(
      scope => !this.validForgeAppScopes.includes(scope as ForgeAppScope)
    );
    const valid = invalidScopes.length === 0;

    if (!valid) {
      this.logger.warn('Invalid Forge app scopes found', { invalidScopes });
    } else {
      this.logger.info('All Forge app scopes are valid');
    }

    return { valid, invalidScopes };
  }

  /**
   * Validate Repository Access Token Scopes
   */
  validateRepositoryAccessTokenScopes(scopes: string[]): {
    valid: boolean;
    invalidScopes: string[];
  } {
    this.logger.info('Validating repository access token scopes', { scopeCount: scopes.length });

    const invalidScopes = scopes.filter(
      scope => !this.validRepositoryScopes.includes(scope as RepositoryAccessTokenScope)
    );
    const valid = invalidScopes.length === 0;

    if (!valid) {
      this.logger.warn('Invalid repository access token scopes found', { invalidScopes });
    } else {
      this.logger.info('All repository access token scopes are valid');
    }

    return { valid, invalidScopes };
  }

  /**
   * Validate Project Access Token Scopes
   */
  validateProjectAccessTokenScopes(scopes: string[]): { valid: boolean; invalidScopes: string[] } {
    this.logger.info('Validating project access token scopes', { scopeCount: scopes.length });

    const invalidScopes = scopes.filter(
      scope => !this.validProjectScopes.includes(scope as ProjectAccessTokenScope)
    );
    const valid = invalidScopes.length === 0;

    if (!valid) {
      this.logger.warn('Invalid project access token scopes found', { invalidScopes });
    } else {
      this.logger.info('All project access token scopes are valid');
    }

    return { valid, invalidScopes };
  }

  /**
   * Validate Workspace Access Token Scopes
   */
  validateWorkspaceAccessTokenScopes(scopes: string[]): {
    valid: boolean;
    invalidScopes: string[];
  } {
    this.logger.info('Validating workspace access token scopes', { scopeCount: scopes.length });

    const invalidScopes = scopes.filter(
      scope => !this.validWorkspaceScopes.includes(scope as WorkspaceAccessTokenScope)
    );
    const valid = invalidScopes.length === 0;

    if (!valid) {
      this.logger.warn('Invalid workspace access token scopes found', { invalidScopes });
    } else {
      this.logger.info('All workspace access token scopes are valid');
    }

    return { valid, invalidScopes };
  }

  /**
   * Validate Access Token Scopes by Type
   */
  validateAccessTokenScopes(
    scopes: string[],
    tokenType: 'repository' | 'project' | 'workspace'
  ): { valid: boolean; invalidScopes: string[] } {
    switch (tokenType) {
      case 'repository':
        return this.validateRepositoryAccessTokenScopes(scopes);
      case 'project':
        return this.validateProjectAccessTokenScopes(scopes);
      case 'workspace':
        return this.validateWorkspaceAccessTokenScopes(scopes);
      default:
        this.logger.error('Invalid token type for scope validation', { tokenType });
        return { valid: false, invalidScopes: scopes };
    }
  }

  // ===== SCOPE RELATIONSHIPS =====

  /**
   * Check if Scopes are Compatible
   * Determines if a set of scopes can be used together
   */
  areScopesCompatible(scopes: string[]): { compatible: boolean; conflicts: string[] } {
    this.logger.info('Checking scope compatibility', { scopeCount: scopes.length });

    const conflicts: string[] = [];

    // Check for conflicting scopes
    const scopeSet = new Set(scopes);

    // Check for read/write conflicts
    const readWriteConflicts = [
      ['repository', 'repository:write'],
      ['pullrequest', 'pullrequest:write'],
      ['pipeline', 'pipeline:write'],
      ['runner', 'runner:write'],
    ];

    for (const [readScope, writeScope] of readWriteConflicts) {
      if (scopeSet.has(readScope!) && scopeSet.has(writeScope!)) {
        conflicts.push(`${readScope} conflicts with ${writeScope}`);
      }
    }

    // Check for admin/delete conflicts
    const adminDeleteConflicts = [['repository:admin', 'repository:delete']];

    for (const [adminScope, deleteScope] of adminDeleteConflicts) {
      if (scopeSet.has(adminScope!) && scopeSet.has(deleteScope!)) {
        conflicts.push(`${adminScope} conflicts with ${deleteScope}`);
      }
    }

    const compatible = conflicts.length === 0;

    if (!compatible) {
      this.logger.warn('Scope conflicts found', { conflicts });
    } else {
      this.logger.info('All scopes are compatible');
    }

    return { compatible, conflicts };
  }

  /**
   * Get Required Scopes for Operation
   * Returns the minimum scopes required for a specific operation
   */
  getRequiredScopesForOperation(operation: string): string[] {
    this.logger.info('Getting required scopes for operation', { operation });

    const operationScopeMap: Record<string, string[]> = {
      // Repository operations
      'repository:read': ['repository'],
      'repository:write': ['repository:write'],
      'repository:admin': ['repository:admin'],
      'repository:delete': ['repository:delete'],

      // Pull request operations
      'pullrequest:read': ['pullrequest'],
      'pullrequest:write': ['pullrequest:write'],

      // Pipeline operations
      'pipeline:read': ['pipeline'],
      'pipeline:write': ['pipeline:write'],
      'pipeline:variable': ['pipeline:variable'],

      // Runner operations
      'runner:read': ['runner'],
      'runner:write': ['runner:write'],

      // Webhook operations
      'webhook:manage': ['webhook'],

      // Project operations
      'project:read': ['project'],
      'project:admin': ['project:admin'],

      // Account operations
      'account:read': ['account'],
      'account:write': ['account:write'],
    };

    const requiredScopes = operationScopeMap[operation] || [];

    this.logger.info('Required scopes for operation', {
      operation,
      requiredScopes,
    });

    return requiredScopes;
  }

  /**
   * Check if Token Has Required Scopes
   */
  hasRequiredScopes(tokenScopes: string[], requiredScopes: string[]): boolean {
    this.logger.info('Checking if token has required scopes', {
      tokenScopeCount: tokenScopes.length,
      requiredScopeCount: requiredScopes.length,
    });

    const tokenScopeSet = new Set(tokenScopes);
    const hasAllScopes = requiredScopes.every(scope => tokenScopeSet.has(scope));

    this.logger.info('Token scope check result', { hasAllScopes });
    return hasAllScopes;
  }

  /**
   * Get Missing Scopes
   */
  getMissingScopes(tokenScopes: string[], requiredScopes: string[]): string[] {
    this.logger.info('Getting missing scopes', {
      tokenScopeCount: tokenScopes.length,
      requiredScopeCount: requiredScopes.length,
    });

    const tokenScopeSet = new Set(tokenScopes);
    const missingScopes = requiredScopes.filter(scope => !tokenScopeSet.has(scope));

    this.logger.info('Missing scopes', { missingScopes });
    return missingScopes;
  }

  // ===== SCOPE HIERARCHY =====

  /**
   * Get Scope Hierarchy
   * Returns scopes in order of increasing permissions
   */
  getScopeHierarchy(tokenType: 'repository' | 'project' | 'workspace'): string[] {
    this.logger.info('Getting scope hierarchy', { tokenType });

    let hierarchy: string[] = [];

    switch (tokenType) {
      case 'repository':
        hierarchy = [
          'repository',
          'repository:write',
          'repository:admin',
          'repository:delete',
          'pullrequest',
          'pullrequest:write',
          'webhook',
          'pipeline',
          'pipeline:write',
          'pipeline:variable',
          'runner',
          'runner:write',
        ];
        break;
      case 'project':
        hierarchy = [
          'project',
          'repository',
          'repository:write',
          'repository:admin',
          'repository:delete',
          'pullrequest',
          'pullrequest:write',
          'webhook',
          'pipeline',
          'pipeline:write',
          'pipeline:variable',
          'runner',
          'runner:write',
        ];
        break;
      case 'workspace':
        hierarchy = [
          'account',
          'project',
          'project:admin',
          'repository',
          'repository:write',
          'repository:admin',
          'repository:delete',
          'pullrequest',
          'pullrequest:write',
          'webhook',
          'pipeline',
          'pipeline:write',
          'pipeline:variable',
          'runner',
          'runner:write',
        ];
        break;
    }

    this.logger.info('Scope hierarchy', { tokenType, hierarchy });
    return hierarchy;
  }

  /**
   * Get Minimum Scopes for Token Type
   */
  getMinimumScopes(tokenType: 'repository' | 'project' | 'workspace'): string[] {
    this.logger.info('Getting minimum scopes for token type', { tokenType });

    const minimumScopes: Record<string, string[]> = {
      repository: ['repository'],
      project: ['project'],
      workspace: ['account'],
    };

    const scopes = minimumScopes[tokenType] || [];
    this.logger.info('Minimum scopes', { tokenType, scopes });
    return scopes;
  }

  /**
   * Get Maximum Scopes for Token Type
   */
  getMaximumScopes(tokenType: 'repository' | 'project' | 'workspace'): string[] {
    this.logger.info('Getting maximum scopes for token type', { tokenType });

    const maximumScopes: Record<string, string[]> = {
      repository: this.validRepositoryScopes,
      project: this.validProjectScopes,
      workspace: this.validWorkspaceScopes,
    };

    const scopes = maximumScopes[tokenType] || [];
    this.logger.info('Maximum scopes', { tokenType, scopes });
    return scopes;
  }

  // ===== UTILITY METHODS =====

  /**
   * Normalize Scopes
   * Converts scope strings to a consistent format
   */
  normalizeScopes(scopes: string[]): string[] {
    this.logger.info('Normalizing scopes', { scopeCount: scopes.length });

    const normalizedScopes = scopes
      .map(scope => scope.trim().toLowerCase())
      .filter(scope => scope.length > 0)
      .sort();

    this.logger.info('Normalized scopes', { normalizedScopes });
    return normalizedScopes;
  }

  /**
   * Deduplicate Scopes
   * Removes duplicate scopes from the array
   */
  deduplicateScopes(scopes: string[]): string[] {
    this.logger.info('Deduplicating scopes', { scopeCount: scopes.length });

    const uniqueScopes = [...new Set(scopes)];

    this.logger.info('Deduplicated scopes', {
      originalCount: scopes.length,
      uniqueCount: uniqueScopes.length,
    });

    return uniqueScopes;
  }

  /**
   * Get All Valid Scopes
   */
  getAllValidScopes(): {
    oauth: OAuthScope[];
    forgeApp: ForgeAppScope[];
    repository: RepositoryAccessTokenScope[];
    project: ProjectAccessTokenScope[];
    workspace: WorkspaceAccessTokenScope[];
  } {
    this.logger.info('Getting all valid scopes');

    return {
      oauth: [...this.validOAuthScopes],
      forgeApp: [...this.validForgeAppScopes],
      repository: [...this.validRepositoryScopes],
      project: [...this.validProjectScopes],
      workspace: [...this.validWorkspaceScopes],
    };
  }
}
