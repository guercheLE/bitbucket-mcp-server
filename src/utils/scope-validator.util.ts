import { Logger } from './logger.util.js';
import {
  OAUTH_SCOPES,
  REPOSITORY_TOKEN_SCOPES,
  PROJECT_TOKEN_SCOPES,
  WORKSPACE_TOKEN_SCOPES,
} from './constants.util.js';

export interface TokenScope {
  name: string;
  description: string;
  required: boolean;
}

export interface ScopeValidationResult {
  isValid: boolean;
  missingScopes: string[];
  invalidScopes: string[];
  warnings: string[];
}

/**
 * Scope Validator for Bitbucket Access Tokens
 *
 * Validates that tokens have the necessary scopes for requested operations
 * according to Bitbucket's official documentation
 */
export class ScopeValidator {
  private static logger = Logger.forContext('ScopeValidator');

  /**
   * Validate repository access token scopes
   */
  static validateRepositoryTokenScopes(
    tokenScopes: string[],
    requiredScopes: string[],
    workspaceSlug: string,
    repositorySlug: string
  ): ScopeValidationResult {
    const methodLogger = this.logger.forMethod('validateRepositoryTokenScopes');

    methodLogger.debug('Validating repository token scopes', {
      tokenScopes,
      requiredScopes,
      workspaceSlug,
      repositorySlug,
    });

    const result: ScopeValidationResult = {
      isValid: true,
      missingScopes: [],
      invalidScopes: [],
      warnings: [],
    };

    // Check if all required scopes are present
    for (const requiredScope of requiredScopes) {
      if (!tokenScopes.includes(requiredScope)) {
        result.missingScopes.push(requiredScope);
        result.isValid = false;
      }
    }

    // Check for invalid scopes (scopes not allowed for repository tokens)
    for (const tokenScope of tokenScopes) {
      if (!REPOSITORY_TOKEN_SCOPES.includes(tokenScope as any)) {
        result.invalidScopes.push(tokenScope);
        result.warnings.push(`Scope '${tokenScope}' is not valid for repository access tokens`);
      }
    }

    // Add scope-specific warnings
    if (tokenScopes.includes(OAUTH_SCOPES.REPOSITORY_ADMIN)) {
      result.warnings.push('Repository admin scope provides full control - use with caution');
    }

    if (tokenScopes.includes(OAUTH_SCOPES.REPOSITORY_DELETE)) {
      result.warnings.push(
        'Repository delete scope allows permanent deletion - use with extreme caution'
      );
    }

    methodLogger.debug('Repository token scope validation result', result);
    return result;
  }

  /**
   * Validate project access token scopes
   */
  static validateProjectTokenScopes(
    tokenScopes: string[],
    requiredScopes: string[],
    workspaceSlug: string,
    projectKey: string
  ): ScopeValidationResult {
    const methodLogger = this.logger.forMethod('validateProjectTokenScopes');

    methodLogger.debug('Validating project token scopes', {
      tokenScopes,
      requiredScopes,
      workspaceSlug,
      projectKey,
    });

    const result: ScopeValidationResult = {
      isValid: true,
      missingScopes: [],
      invalidScopes: [],
      warnings: [],
    };

    // Check if all required scopes are present
    for (const requiredScope of requiredScopes) {
      if (!tokenScopes.includes(requiredScope)) {
        result.missingScopes.push(requiredScope);
        result.isValid = false;
      }
    }

    // Check for invalid scopes (scopes not allowed for project tokens)
    for (const tokenScope of tokenScopes) {
      if (!PROJECT_TOKEN_SCOPES.includes(tokenScope as any)) {
        result.invalidScopes.push(tokenScope);
        result.warnings.push(`Scope '${tokenScope}' is not valid for project access tokens`);
      }
    }

    // Add scope-specific warnings
    if (tokenScopes.includes(OAUTH_SCOPES.PROJECT_ADMIN)) {
      result.warnings.push('Project admin scope provides full project control - use with caution');
    }

    if (tokenScopes.includes(OAUTH_SCOPES.REPOSITORY_DELETE)) {
      result.warnings.push(
        'Repository delete scope allows permanent deletion within project - use with extreme caution'
      );
    }

    methodLogger.debug('Project token scope validation result', result);
    return result;
  }

  /**
   * Validate workspace access token scopes
   */
  static validateWorkspaceTokenScopes(
    tokenScopes: string[],
    requiredScopes: string[],
    workspaceSlug: string
  ): ScopeValidationResult {
    const methodLogger = this.logger.forMethod('validateWorkspaceTokenScopes');

    methodLogger.debug('Validating workspace token scopes', {
      tokenScopes,
      requiredScopes,
      workspaceSlug,
    });

    const result: ScopeValidationResult = {
      isValid: true,
      missingScopes: [],
      invalidScopes: [],
      warnings: [],
    };

    // Check if all required scopes are present
    for (const requiredScope of requiredScopes) {
      if (!tokenScopes.includes(requiredScope)) {
        result.missingScopes.push(requiredScope);
        result.isValid = false;
      }
    }

    // Check for invalid scopes (scopes not allowed for workspace tokens)
    for (const tokenScope of tokenScopes) {
      if (!WORKSPACE_TOKEN_SCOPES.includes(tokenScope as any)) {
        result.invalidScopes.push(tokenScope);
        result.warnings.push(`Scope '${tokenScope}' is not valid for workspace access tokens`);
      }
    }

    // Add scope-specific warnings
    if (tokenScopes.includes(OAUTH_SCOPES.PROJECT_ADMIN)) {
      result.warnings.push(
        'Project admin scope provides full project control across workspace - use with caution'
      );
    }

    if (tokenScopes.includes(OAUTH_SCOPES.ACCOUNT_READ)) {
      result.warnings.push('Account read scope provides access to workspace account information');
    }

    methodLogger.debug('Workspace token scope validation result', result);
    return result;
  }

  /**
   * Get required scopes for a specific operation
   */
  static getRequiredScopesForOperation(operation: string): string[] {
    const methodLogger = this.logger.forMethod('getRequiredScopesForOperation');

    const scopeMap: Record<string, string[]> = {
      // Repository operations
      'repository:read': [OAUTH_SCOPES.REPOSITORY_READ],
      'repository:write': [OAUTH_SCOPES.REPOSITORY_READ, OAUTH_SCOPES.REPOSITORY_WRITE],
      'repository:admin': [
        OAUTH_SCOPES.REPOSITORY_READ,
        OAUTH_SCOPES.REPOSITORY_WRITE,
        OAUTH_SCOPES.REPOSITORY_ADMIN,
      ],
      'repository:delete': [
        OAUTH_SCOPES.REPOSITORY_READ,
        OAUTH_SCOPES.REPOSITORY_ADMIN,
        OAUTH_SCOPES.REPOSITORY_DELETE,
      ],

      // Pull request operations
      'pullrequest:read': [OAUTH_SCOPES.PULL_REQUEST_READ],
      'pullrequest:write': [OAUTH_SCOPES.PULL_REQUEST_READ, OAUTH_SCOPES.PULL_REQUEST_WRITE],

      // Webhook operations
      'webhook:read': [OAUTH_SCOPES.WEBHOOK_READ],
      'webhook:write': [OAUTH_SCOPES.WEBHOOK_READ],

      // Pipeline operations
      'pipeline:read': [OAUTH_SCOPES.PIPELINE_READ],
      'pipeline:write': [OAUTH_SCOPES.PIPELINE_READ, OAUTH_SCOPES.PIPELINE_WRITE],
      'pipeline:variable': [OAUTH_SCOPES.PIPELINE_READ, OAUTH_SCOPES.PIPELINE_VARIABLE],

      // Runner operations
      'runner:read': [OAUTH_SCOPES.RUNNER_READ],
      'runner:write': [OAUTH_SCOPES.RUNNER_READ, OAUTH_SCOPES.RUNNER_WRITE],

      // Project operations
      'project:read': [OAUTH_SCOPES.PROJECT_READ],
      'project:admin': [OAUTH_SCOPES.PROJECT_READ, OAUTH_SCOPES.PROJECT_ADMIN],

      // Account operations
      'account:read': [OAUTH_SCOPES.ACCOUNT_READ],
    };

    const requiredScopes = scopeMap[operation] || [];
    methodLogger.debug(`Required scopes for operation '${operation}':`, requiredScopes);

    return requiredScopes;
  }

  /**
   * Check if a token has sufficient scopes for an operation
   */
  static hasSufficientScopes(tokenScopes: string[], operation: string): boolean {
    const requiredScopes = this.getRequiredScopesForOperation(operation);

    for (const requiredScope of requiredScopes) {
      if (!tokenScopes.includes(requiredScope)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get a human-readable description of scopes
   */
  static getScopeDescription(scope: string): string {
    const scopeDescriptions: Record<string, string> = {
      [OAUTH_SCOPES.REPOSITORY_READ]: 'Read repository content and metadata',
      [OAUTH_SCOPES.REPOSITORY_WRITE]: 'Write to repository (push, create branches)',
      [OAUTH_SCOPES.REPOSITORY_ADMIN]: 'Full repository administration',
      [OAUTH_SCOPES.REPOSITORY_DELETE]: 'Delete repository (dangerous)',
      [OAUTH_SCOPES.PULL_REQUEST_READ]: 'Read pull requests and comments',
      [OAUTH_SCOPES.PULL_REQUEST_WRITE]: 'Create and update pull requests',
      [OAUTH_SCOPES.WEBHOOK_READ]: 'Read webhook configurations',
      [OAUTH_SCOPES.PIPELINE_READ]: 'Read pipeline configurations and status',
      [OAUTH_SCOPES.PIPELINE_WRITE]: 'Trigger and control pipelines',
      [OAUTH_SCOPES.PIPELINE_VARIABLE]: 'Manage pipeline variables',
      [OAUTH_SCOPES.RUNNER_READ]: 'Read self-hosted runner information',
      [OAUTH_SCOPES.RUNNER_WRITE]: 'Manage self-hosted runners',
      [OAUTH_SCOPES.PROJECT_READ]: 'Read project information and settings',
      [OAUTH_SCOPES.PROJECT_ADMIN]: 'Full project administration',
      [OAUTH_SCOPES.ACCOUNT_READ]: 'Read workspace account information',
    };

    return scopeDescriptions[scope] || `Unknown scope: ${scope}`;
  }

  /**
   * Format scope validation result for display
   */
  static formatValidationResult(result: ScopeValidationResult): string {
    let output = '';

    if (result.isValid) {
      output += '✅ **Token scopes are valid**\n\n';
    } else {
      output += '❌ **Token scopes are invalid**\n\n';
    }

    if (result.missingScopes.length > 0) {
      output += '**Missing required scopes:**\n';
      result.missingScopes.forEach(scope => {
        output += `- \`${scope}\`: ${this.getScopeDescription(scope)}\n`;
      });
      output += '\n';
    }

    if (result.invalidScopes.length > 0) {
      output += '**Invalid scopes (not allowed for this token type):**\n';
      result.invalidScopes.forEach(scope => {
        output += `- \`${scope}\`: ${this.getScopeDescription(scope)}\n`;
      });
      output += '\n';
    }

    if (result.warnings.length > 0) {
      output += '**Warnings:**\n';
      result.warnings.forEach(warning => {
        output += `- ⚠️ ${warning}\n`;
      });
      output += '\n';
    }

    return output;
  }
}
