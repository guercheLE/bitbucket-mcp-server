import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { ScopeValidatorService } from '../../services/cloud/scope-validator.service.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const ValidateOAuthScopesSchema = z.object({
  scopes: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ValidateRepositoryAccessTokenScopesSchema = z.object({
  scopes: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ValidateWorkspaceAccessTokenScopesSchema = z.object({
  scopes: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ValidateProjectAccessTokenScopesSchema = z.object({
  scopes: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetValidOAuthScopesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetValidRepositoryAccessTokenScopesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetValidWorkspaceAccessTokenScopesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetValidProjectAccessTokenScopesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ValidateAccessTokenScopesByTypeSchema = z.object({
  scopes: z.string(),
  tokenType: z.enum(['repository', 'project', 'workspace']),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const AreScopesCompatibleSchema = z.object({
  scopes: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetRequiredScopesForOperationSchema = z.object({
  operation: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const HasRequiredScopesSchema = z.object({
  tokenScopes: z.string(),
  requiredScopes: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMissingScopesSchema = z.object({
  tokenScopes: z.string(),
  requiredScopes: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetScopeHierarchySchema = z.object({
  tokenType: z.enum(['repository', 'project', 'workspace']),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMinimumScopesSchema = z.object({
  tokenType: z.enum(['repository', 'project', 'workspace']),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMaximumScopesSchema = z.object({
  tokenType: z.enum(['repository', 'project', 'workspace']),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const NormalizeScopesSchema = z.object({
  scopes: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeduplicateScopesSchema = z.object({
  scopes: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const OutputOnlySchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Cloud Scope Validator Tools
 * Ferramentas para validação de escopos no Bitbucket Cloud
 */
export class CloudScopeValidatorTools {
  private static logger = Logger.forContext('CloudScopeValidatorTools');
  private static scopeValidatorServicePool: Pool<ScopeValidatorService>;

  static initialize(): void {
    const scopeValidatorServiceFactory = {
      create: async () => new ScopeValidatorService(Logger.forContext('ScopeValidatorService')),
      destroy: async () => {},
    };

    this.scopeValidatorServicePool = createPool(scopeValidatorServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Cloud Scope Validator tools initialized');
  }

  static async validateOAuthScopes(scopes: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('validateOAuthScopes');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Validating OAuth scopes:', { scopes });

      const parsedScopes = JSON.parse(scopes);
      const result = service.validateOAuthScopes(parsedScopes);

      methodLogger.info('Successfully validated OAuth scopes');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to validate OAuth scopes:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to validate OAuth scopes');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async validateForgeAppScopes(scopes: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('validateForgeAppScopes');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Validating Forge app scopes:', { scopes });

      const parsedScopes = JSON.parse(scopes);
      const result = service.validateForgeAppScopes(parsedScopes);

      methodLogger.info('Successfully validated Forge app scopes');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to validate Forge app scopes:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to validate Forge app scopes');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async validateRepositoryAccessTokenScopes(
    scopes: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('validateRepositoryAccessTokenScopes');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Validating repository access token scopes:', { scopes });

      const parsedScopes = JSON.parse(scopes);
      const result = service.validateRepositoryAccessTokenScopes(parsedScopes);

      methodLogger.info('Successfully validated repository access token scopes');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to validate repository access token scopes:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to validate repository access token scopes');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async validateProjectAccessTokenScopes(
    scopes: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('validateProjectAccessTokenScopes');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Validating project access token scopes:', { scopes });

      const parsedScopes = JSON.parse(scopes);
      const result = service.validateProjectAccessTokenScopes(parsedScopes);

      methodLogger.info('Successfully validated project access token scopes');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to validate project access token scopes:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to validate project access token scopes');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async validateWorkspaceAccessTokenScopes(
    scopes: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('validateWorkspaceAccessTokenScopes');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Validating workspace access token scopes:', { scopes });

      const parsedScopes = JSON.parse(scopes);
      const result = service.validateWorkspaceAccessTokenScopes(parsedScopes);

      methodLogger.info('Successfully validated workspace access token scopes');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to validate workspace access token scopes:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to validate workspace access token scopes');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async validateAccessTokenScopesByType(
    scopes: string,
    tokenType: 'repository' | 'project' | 'workspace',
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('validateAccessTokenScopesByType');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Validating access token scopes by type:', { scopes, tokenType });

      const parsedScopes = JSON.parse(scopes);
      const result = service.validateAccessTokenScopes(parsedScopes, tokenType);

      methodLogger.info('Successfully validated access token scopes by type');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to validate access token scopes by type:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to validate access token scopes by type');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async areScopesCompatible(scopes: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('areScopesCompatible');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Checking scopes compatibility:', { scopes });

      const parsedScopes = JSON.parse(scopes);
      const result = service.areScopesCompatible(parsedScopes);

      methodLogger.info('Successfully checked scopes compatibility');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to check scopes compatibility:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to check scopes compatibility');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async getRequiredScopesForOperation(
    operation: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getRequiredScopesForOperation');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Getting required scopes for operation:', { operation });

      const result = service.getRequiredScopesForOperation(operation);

      methodLogger.info('Successfully retrieved required scopes for operation');
      return createMcpResponse({ scopes: result }, output);
    } catch (error) {
      methodLogger.error('Failed to get required scopes for operation:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to get required scopes for operation');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async hasRequiredScopes(
    tokenScopes: string,
    requiredScopes: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('hasRequiredScopes');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Checking if token has required scopes:', { tokenScopes, requiredScopes });

      const parsedTokenScopes = JSON.parse(tokenScopes);
      const parsedRequiredScopes = JSON.parse(requiredScopes);
      const result = service.hasRequiredScopes(parsedTokenScopes, parsedRequiredScopes);

      methodLogger.info('Successfully checked if token has required scopes');
      return createMcpResponse({ hasRequiredScopes: result }, output);
    } catch (error) {
      methodLogger.error('Failed to check if token has required scopes:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to check if token has required scopes');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async getMissingScopes(
    tokenScopes: string,
    requiredScopes: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMissingScopes');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Getting missing scopes:', { tokenScopes, requiredScopes });

      const parsedTokenScopes = JSON.parse(tokenScopes);
      const parsedRequiredScopes = JSON.parse(requiredScopes);
      const result = service.getMissingScopes(parsedTokenScopes, parsedRequiredScopes);

      methodLogger.info('Successfully retrieved missing scopes');
      return createMcpResponse({ missingScopes: result }, output);
    } catch (error) {
      methodLogger.error('Failed to get missing scopes:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to get missing scopes');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async getScopeHierarchy(
    tokenType: 'repository' | 'project' | 'workspace',
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getScopeHierarchy');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Getting scope hierarchy:', { tokenType });

      const result = service.getScopeHierarchy(tokenType);

      methodLogger.info('Successfully retrieved scope hierarchy');
      return createMcpResponse({ hierarchy: result }, output);
    } catch (error) {
      methodLogger.error('Failed to get scope hierarchy:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to get scope hierarchy');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async getMinimumScopes(
    tokenType: 'repository' | 'project' | 'workspace',
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMinimumScopes');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Getting minimum scopes for token type:', { tokenType });

      const result = service.getMinimumScopes(tokenType);

      methodLogger.info('Successfully retrieved minimum scopes for token type');
      return createMcpResponse({ minimumScopes: result }, output);
    } catch (error) {
      methodLogger.error('Failed to get minimum scopes for token type:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to get minimum scopes for token type');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async getMaximumScopes(
    tokenType: 'repository' | 'project' | 'workspace',
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMaximumScopes');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Getting maximum scopes for token type:', { tokenType });

      const result = service.getMaximumScopes(tokenType);

      methodLogger.info('Successfully retrieved maximum scopes for token type');
      return createMcpResponse({ maximumScopes: result }, output);
    } catch (error) {
      methodLogger.error('Failed to get maximum scopes for token type:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to get maximum scopes for token type');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async normalizeScopes(scopes: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('normalizeScopes');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Normalizing scopes:', { scopes });

      const parsedScopes = JSON.parse(scopes);
      const result = service.normalizeScopes(parsedScopes);

      methodLogger.info('Successfully normalized scopes');
      return createMcpResponse({ normalizedScopes: result }, output);
    } catch (error) {
      methodLogger.error('Failed to normalize scopes:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to normalize scopes');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async deduplicateScopes(scopes: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deduplicateScopes');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Deduplicating scopes:', { scopes });

      const parsedScopes = JSON.parse(scopes);
      const result = service.deduplicateScopes(parsedScopes);

      methodLogger.info('Successfully deduplicated scopes');
      return createMcpResponse({ uniqueScopes: result }, output);
    } catch (error) {
      methodLogger.error('Failed to deduplicate scopes:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to deduplicate scopes');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static async getAllValidScopes(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getAllValidScopes');
    let service: ScopeValidatorService | null = null;

    try {
      service = await this.scopeValidatorServicePool.acquire();
      methodLogger.debug('Getting all valid scopes');

      const result = service.getAllValidScopes();

      methodLogger.info('Successfully retrieved all valid scopes');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get all valid scopes:', error);
      if (service) {
        this.scopeValidatorServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse('Failed to get all valid scopes');
    } finally {
      if (service) {
        this.scopeValidatorServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Validate OAuth Scopes
    server.registerTool(
      'scope_validate_oauth',
      {
        description: `Valida escopos OAuth no Bitbucket Cloud.

**Funcionalidades:**
- Validação de escopos OAuth
- Verificação de permissões
- Lista de escopos inválidos

**Parâmetros:**
- \`scopes\`: Lista de escopos (JSON array)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da validação.`,
        inputSchema: ValidateOAuthScopesSchema.shape,
      },
      async (params: z.infer<typeof ValidateOAuthScopesSchema>) => {
        const validatedParams = ValidateOAuthScopesSchema.parse(params);
        return await this.validateOAuthScopes(validatedParams.scopes, validatedParams.output);
      }
    );

    // Validate Forge App Scopes
    server.registerTool(
      'scope_validate_forge_app',
      {
        description: `Valida escopos de aplicação Forge no Bitbucket Cloud.

**Funcionalidades:**
- Validação de escopos Forge
- Verificação de permissões
- Lista de escopos inválidos

**Parâmetros:**
- \`scopes\`: Lista de escopos (JSON array)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da validação.`,
        inputSchema: ValidateOAuthScopesSchema.shape,
      },
      async (params: z.infer<typeof ValidateOAuthScopesSchema>) => {
        const validatedParams = ValidateOAuthScopesSchema.parse(params);
        return await this.validateForgeAppScopes(validatedParams.scopes, validatedParams.output);
      }
    );

    // Validate Repository Access Token Scopes
    server.registerTool(
      'scope_validate_repository_access_token',
      {
        description: `Valida escopos de token de acesso de repositório no Bitbucket Cloud.

**Funcionalidades:**
- Validação de escopos de repositório
- Verificação de permissões
- Lista de escopos inválidos

**Parâmetros:**
- \`scopes\`: Lista de escopos (JSON array)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da validação.`,
        inputSchema: ValidateRepositoryAccessTokenScopesSchema.shape,
      },
      async (params: z.infer<typeof ValidateRepositoryAccessTokenScopesSchema>) => {
        const validatedParams = ValidateRepositoryAccessTokenScopesSchema.parse(params);
        return await this.validateRepositoryAccessTokenScopes(
          validatedParams.scopes,
          validatedParams.output
        );
      }
    );

    // Validate Project Access Token Scopes
    server.registerTool(
      'scope_validate_project_access_token',
      {
        description: `Valida escopos de token de acesso de projeto no Bitbucket Cloud.

**Funcionalidades:**
- Validação de escopos de projeto
- Verificação de permissões
- Lista de escopos inválidos

**Parâmetros:**
- \`scopes\`: Lista de escopos (JSON array)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da validação.`,
        inputSchema: ValidateProjectAccessTokenScopesSchema.shape,
      },
      async (params: z.infer<typeof ValidateProjectAccessTokenScopesSchema>) => {
        const validatedParams = ValidateProjectAccessTokenScopesSchema.parse(params);
        return await this.validateProjectAccessTokenScopes(
          validatedParams.scopes,
          validatedParams.output
        );
      }
    );

    // Validate Workspace Access Token Scopes
    server.registerTool(
      'scope_validate_workspace_access_token',
      {
        description: `Valida escopos de token de acesso de workspace no Bitbucket Cloud.

**Funcionalidades:**
- Validação de escopos de workspace
- Verificação de permissões
- Lista de escopos inválidos

**Parâmetros:**
- \`scopes\`: Lista de escopos (JSON array)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da validação.`,
        inputSchema: ValidateWorkspaceAccessTokenScopesSchema.shape,
      },
      async (params: z.infer<typeof ValidateWorkspaceAccessTokenScopesSchema>) => {
        const validatedParams = ValidateWorkspaceAccessTokenScopesSchema.parse(params);
        return await this.validateWorkspaceAccessTokenScopes(
          validatedParams.scopes,
          validatedParams.output
        );
      }
    );

    // Validate Access Token Scopes by Type
    server.registerTool(
      'scope_validate_access_token_by_type',
      {
        description: `Valida escopos de token de acesso por tipo no Bitbucket Cloud.

**Funcionalidades:**
- Validação por tipo de token
- Verificação de permissões
- Lista de escopos inválidos

**Parâmetros:**
- \`scopes\`: Lista de escopos (JSON array)
- \`tokenType\`: Tipo do token (repository, project, workspace)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da validação.`,
        inputSchema: ValidateAccessTokenScopesByTypeSchema.shape,
      },
      async (params: z.infer<typeof ValidateAccessTokenScopesByTypeSchema>) => {
        const validatedParams = ValidateAccessTokenScopesByTypeSchema.parse(params);
        return await this.validateAccessTokenScopesByType(
          validatedParams.scopes,
          validatedParams.tokenType,
          validatedParams.output
        );
      }
    );

    // Check if Scopes are Compatible
    server.registerTool(
      'scope_check_compatibility',
      {
        description: `Verifica compatibilidade de escopos no Bitbucket Cloud.

**Funcionalidades:**
- Verificação de compatibilidade
- Detecção de conflitos
- Lista de conflitos

**Parâmetros:**
- \`scopes\`: Lista de escopos (JSON array)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da verificação de compatibilidade.`,
        inputSchema: AreScopesCompatibleSchema.shape,
      },
      async (params: z.infer<typeof AreScopesCompatibleSchema>) => {
        const validatedParams = AreScopesCompatibleSchema.parse(params);
        return await this.areScopesCompatible(validatedParams.scopes, validatedParams.output);
      }
    );

    // Get Required Scopes for Operation
    server.registerTool(
      'scope_get_required_for_operation',
      {
        description: `Obtém escopos necessários para uma operação no Bitbucket Cloud.

**Funcionalidades:**
- Escopos necessários
- Mapeamento de operações
- Lista de permissões

**Parâmetros:**
- \`operation\`: Nome da operação
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os escopos necessários.`,
        inputSchema: GetRequiredScopesForOperationSchema.shape,
      },
      async (params: z.infer<typeof GetRequiredScopesForOperationSchema>) => {
        const validatedParams = GetRequiredScopesForOperationSchema.parse(params);
        return await this.getRequiredScopesForOperation(
          validatedParams.operation,
          validatedParams.output
        );
      }
    );

    // Check if Token Has Required Scopes
    server.registerTool(
      'scope_check_token_has_required',
      {
        description: `Verifica se token possui escopos necessários no Bitbucket Cloud.

**Funcionalidades:**
- Verificação de escopos
- Validação de permissões
- Comparação de escopos

**Parâmetros:**
- \`tokenScopes\`: Escopos do token (JSON array)
- \`requiredScopes\`: Escopos necessários (JSON array)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resultado da verificação.`,
        inputSchema: HasRequiredScopesSchema.shape,
      },
      async (params: z.infer<typeof HasRequiredScopesSchema>) => {
        const validatedParams = HasRequiredScopesSchema.parse(params);
        return await this.hasRequiredScopes(
          validatedParams.tokenScopes,
          validatedParams.requiredScopes,
          validatedParams.output
        );
      }
    );

    // Get Missing Scopes
    server.registerTool(
      'scope_get_missing',
      {
        description: `Obtém escopos em falta no Bitbucket Cloud.

**Funcionalidades:**
- Escopos em falta
- Comparação de permissões
- Lista de escopos necessários

**Parâmetros:**
- \`tokenScopes\`: Escopos do token (JSON array)
- \`requiredScopes\`: Escopos necessários (JSON array)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os escopos em falta.`,
        inputSchema: GetMissingScopesSchema.shape,
      },
      async (params: z.infer<typeof GetMissingScopesSchema>) => {
        const validatedParams = GetMissingScopesSchema.parse(params);
        return await this.getMissingScopes(
          validatedParams.tokenScopes,
          validatedParams.requiredScopes,
          validatedParams.output
        );
      }
    );

    // Get Scope Hierarchy
    server.registerTool(
      'scope_get_hierarchy',
      {
        description: `Obtém hierarquia de escopos no Bitbucket Cloud.

**Funcionalidades:**
- Hierarquia de escopos
- Ordem de permissões
- Lista de escopos ordenados

**Parâmetros:**
- \`tokenType\`: Tipo do token (repository, project, workspace)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a hierarquia de escopos.`,
        inputSchema: GetScopeHierarchySchema.shape,
      },
      async (params: z.infer<typeof GetScopeHierarchySchema>) => {
        const validatedParams = GetScopeHierarchySchema.parse(params);
        return await this.getScopeHierarchy(validatedParams.tokenType, validatedParams.output);
      }
    );

    // Get Minimum Scopes for Token Type
    server.registerTool(
      'scope_get_minimum_for_token_type',
      {
        description: `Obtém escopos mínimos para tipo de token no Bitbucket Cloud.

**Funcionalidades:**
- Escopos mínimos
- Configuração básica
- Lista de permissões essenciais

**Parâmetros:**
- \`tokenType\`: Tipo do token (repository, project, workspace)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os escopos mínimos.`,
        inputSchema: GetMinimumScopesSchema.shape,
      },
      async (params: z.infer<typeof GetMinimumScopesSchema>) => {
        const validatedParams = GetMinimumScopesSchema.parse(params);
        return await this.getMinimumScopes(validatedParams.tokenType, validatedParams.output);
      }
    );

    // Get Maximum Scopes for Token Type
    server.registerTool(
      'scope_get_maximum_for_token_type',
      {
        description: `Obtém escopos máximos para tipo de token no Bitbucket Cloud.

**Funcionalidades:**
- Escopos máximos
- Configuração completa
- Lista de todas as permissões

**Parâmetros:**
- \`tokenType\`: Tipo do token (repository, project, workspace)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os escopos máximos.`,
        inputSchema: GetMaximumScopesSchema.shape,
      },
      async (params: z.infer<typeof GetMaximumScopesSchema>) => {
        const validatedParams = GetMaximumScopesSchema.parse(params);
        return await this.getMaximumScopes(validatedParams.tokenType, validatedParams.output);
      }
    );

    // Normalize Scopes
    server.registerTool(
      'scope_normalize',
      {
        description: `Normaliza escopos no Bitbucket Cloud.

**Funcionalidades:**
- Normalização de escopos
- Formatação consistente
- Limpeza de dados

**Parâmetros:**
- \`scopes\`: Lista de escopos (JSON array)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os escopos normalizados.`,
        inputSchema: NormalizeScopesSchema.shape,
      },
      async (params: z.infer<typeof NormalizeScopesSchema>) => {
        const validatedParams = NormalizeScopesSchema.parse(params);
        return await this.normalizeScopes(validatedParams.scopes, validatedParams.output);
      }
    );

    // Deduplicate Scopes
    server.registerTool(
      'scope_deduplicate',
      {
        description: `Remove escopos duplicados no Bitbucket Cloud.

**Funcionalidades:**
- Remoção de duplicatas
- Otimização de escopos
- Lista única de permissões

**Parâmetros:**
- \`scopes\`: Lista de escopos (JSON array)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os escopos únicos.`,
        inputSchema: DeduplicateScopesSchema.shape,
      },
      async (params: z.infer<typeof DeduplicateScopesSchema>) => {
        const validatedParams = DeduplicateScopesSchema.parse(params);
        return await this.deduplicateScopes(validatedParams.scopes, validatedParams.output);
      }
    );

    // Get All Valid Scopes
    server.registerTool(
      'scope_get_all_valid',
      {
        description: `Obtém todos os escopos válidos no Bitbucket Cloud.

**Funcionalidades:**
- Todos os escopos válidos
- Categorização por tipo
- Lista completa de permissões

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com todos os escopos válidos.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.getAllValidScopes(validatedParams.output);
      }
    );

    registerLogger.info('Successfully registered all cloud scope validator tools');
  }
}
