/**
 * Scope Validator Commands for Bitbucket Cloud
 * Handles scope validation operations
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';
import { ScopeValidatorService } from '../../services/cloud/scope-validator.service.js';

export class CloudScopeValidatorCommands {
  private static logger = Logger.forContext('CloudScopeValidatorCommands');

  private static async handleValidateOAuth(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      const result = scopeValidator.validateOAuthScopes(scopes);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao validar escopos OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleValidateRepositoryToken(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      const result = scopeValidator.validateRepositoryAccessTokenScopes(scopes);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao validar escopos de token de repositório', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleValidateProjectToken(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      const result = scopeValidator.validateProjectAccessTokenScopes(scopes);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao validar escopos de token de projeto', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleValidateWorkspaceToken(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      const result = scopeValidator.validateWorkspaceAccessTokenScopes(scopes);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao validar escopos de token de workspace', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListValidScopes(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      let result: any = {};

      switch (options.type) {
        case 'oauth':
          result = scopeValidator.validateOAuthScopes([]);
          break;
        case 'repository':
          result = scopeValidator.validateRepositoryAccessTokenScopes([]);
          break;
        case 'project':
          result = scopeValidator.validateProjectAccessTokenScopes([]);
          break;
        case 'workspace':
          result = scopeValidator.validateWorkspaceAccessTokenScopes([]);
          break;
        case 'forge':
          result = scopeValidator.validateForgeAppScopes([]);
          break;
        default:
          result = {
            oauth: scopeValidator.validateOAuthScopes([]),
            repository: scopeValidator.validateRepositoryAccessTokenScopes([]),
            project: scopeValidator.validateProjectAccessTokenScopes([]),
            workspace: scopeValidator.validateWorkspaceAccessTokenScopes([]),
            forge: scopeValidator.validateForgeAppScopes([]),
          };
      }

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar escopos válidos', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleValidateForgeApp(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      const result = scopeValidator.validateForgeAppScopes(scopes);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao validar escopos de aplicação Forge', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCheckCompatibility(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      const result = scopeValidator.areScopesCompatible(scopes);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao verificar compatibilidade de escopos', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetRequiredScopes(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const result = scopeValidator.getRequiredScopesForOperation(options.operation);

      const response = createMcpResponse(result, options.format);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter escopos necessários', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCheckTokenScopes(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const tokenScopes = options.tokenScopes.split(',').map((s: string) => s.trim());
      const requiredScopes = options.requiredScopes.split(',').map((s: string) => s.trim());

      const hasScopes = scopeValidator.hasRequiredScopes(tokenScopes, requiredScopes);
      const missingScopes = scopeValidator.getMissingScopes(tokenScopes, requiredScopes);

      const result = {
        hasRequiredScopes: hasScopes,
        missingScopes,
        tokenScopes,
        requiredScopes,
      };

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao verificar escopos do token', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetScopeHierarchy(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const result = scopeValidator.getScopeHierarchy(
        options.tokenType as 'repository' | 'project' | 'workspace'
      );

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter hierarquia de escopos', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetMinimumScopes(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const result = scopeValidator.getMinimumScopes(
        options.tokenType as 'repository' | 'project' | 'workspace'
      );

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter escopos mínimos', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetMaximumScopes(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const result = scopeValidator.getMaximumScopes(
        options.tokenType as 'repository' | 'project' | 'workspace'
      );

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter escopos máximos', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleNormalizeScopes(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      const result = scopeValidator.normalizeScopes(scopes);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao normalizar escopos', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeduplicateScopes(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      const result = scopeValidator.deduplicateScopes(scopes);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao deduplicar escopos', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetAllScopes(options: any): Promise<void> {
    try {
      const scopeValidator = new ScopeValidatorService(Logger.forContext('ScopeValidatorService'));

      const result = scopeValidator.getAllValidScopes();

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter todos os escopos', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de validação de escopo');

    const scopeCommand = program
      .command('scope')
      .description('Comandos de validação de escopos do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server scope <command> --help' para mais informações sobre um comando específico.
      `
      );

    scopeCommand
      .command('validate-oauth')
      .description('Valida escopos OAuth')
      .requiredOption('-s, --scopes <scopes>', 'Escopos para validar (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-s, --scopes\`: Escopos para validar (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope validate-oauth --scopes "repository:read,repository:write"
  $ npx -y @guerchele/bitbucket-mcp-server scope validate-oauth --scopes "account,repository:read"

**Descrição:**
  Valida se os escopos OAuth fornecidos são válidos e suportados.`
      )
      .action(async options => {
        await this.handleValidateOAuth(options);
      });

    scopeCommand
      .command('validate-repository-token')
      .description('Valida escopos de token de repositório')
      .requiredOption('-s, --scopes <scopes>', 'Escopos para validar (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-s, --scopes\`: Escopos para validar (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope validate-repository-token --scopes "repository,repository:write"
  $ npx -y @guerchele/bitbucket-mcp-server scope validate-repository-token --scopes "repository"

**Descrição:**
  Valida se os escopos fornecidos são válidos para tokens de repositório.`
      )
      .action(async options => {
        await this.handleValidateRepositoryToken(options);
      });

    scopeCommand
      .command('validate-project-token')
      .description('Valida escopos de token de projeto')
      .requiredOption('-s, --scopes <scopes>', 'Escopos para validar (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-s, --scopes\`: Escopos para validar (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope validate-project-token --scopes "project,repository:write"
  $ npx -y @guerchele/bitbucket-mcp-server scope validate-project-token --scopes "project"

**Descrição:**
  Valida se os escopos fornecidos são válidos para tokens de projeto.`
      )
      .action(async options => {
        await this.handleValidateProjectToken(options);
      });

    scopeCommand
      .command('validate-workspace-token')
      .description('Valida escopos de token de workspace')
      .requiredOption('-s, --scopes <scopes>', 'Escopos para validar (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-s, --scopes\`: Escopos para validar (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope validate-workspace-token --scopes "account,repository:write"
  $ npx -y @guerchele/bitbucket-mcp-server scope validate-workspace-token --scopes "account"

**Descrição:**
  Valida se os escopos fornecidos são válidos para tokens de workspace.`
      )
      .action(async options => {
        await this.handleValidateWorkspaceToken(options);
      });

    scopeCommand
      .command('list-valid-scopes')
      .description('Lista todos os escopos válidos')
      .option('-t, --type <type>', 'Tipo de escopo (oauth, repository, project, workspace, forge)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-t, --type\`: Tipo de escopo (oauth, repository, project, workspace, forge)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope list-valid-scopes
  $ npx -y @guerchele/bitbucket-mcp-server scope list-valid-scopes --type oauth
  $ npx -y @guerchele/bitbucket-mcp-server scope list-valid-scopes --type repository --output json

**Descrição:**
  Lista todos os escopos válidos, opcionalmente filtrados por tipo.`
      )
      .action(async options => {
        await this.handleListValidScopes(options);
      });

    scopeCommand
      .command('validate-forge-app')
      .description('Valida escopos de aplicação Forge')
      .requiredOption('-s, --scopes <scopes>', 'Escopos para validar (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-s, --scopes\`: Escopos para validar (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope validate-forge-app --scopes "read:repository:bitbucket,write:repository:bitbucket"
  $ npx -y @guerchele/bitbucket-mcp-server scope validate-forge-app --scopes "read:user:bitbucket"

**Descrição:**
  Valida se os escopos fornecidos são válidos para aplicações Forge do Bitbucket.`
      )
      .action(async options => {
        await this.handleValidateForgeApp(options);
      });

    scopeCommand
      .command('check-compatibility')
      .description('Verifica compatibilidade entre escopos')
      .requiredOption('-s, --scopes <scopes>', 'Escopos para verificar (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-s, --scopes\`: Escopos para verificar (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope check-compatibility --scopes "repository,repository:write"
  $ npx -y @guerchele/bitbucket-mcp-server scope check-compatibility --scopes "pullrequest,pullrequest:write"

**Descrição:**
  Verifica se os escopos fornecidos são compatíveis entre si e identifica possíveis conflitos.`
      )
      .action(async options => {
        await this.handleCheckCompatibility(options);
      });

    scopeCommand
      .command('get-required-scopes')
      .description('Obtém escopos necessários para uma operação')
      .requiredOption('-o, --operation <operation>', 'Operação para a qual obter escopos')
      .option('-f, --format <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-o, --operation\`: Operação para a qual obter escopos

**Opções disponíveis:**
- \`-f, --format\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope get-required-scopes --operation "repository:read"
  $ npx -y @guerchele/bitbucket-mcp-server scope get-required-scopes --operation "pullrequest:write"
  $ npx -y @guerchele/bitbucket-mcp-server scope get-required-scopes --operation "pipeline:variable"

**Descrição:**
  Retorna os escopos mínimos necessários para executar uma operação específica.`
      )
      .action(async options => {
        await this.handleGetRequiredScopes(options);
      });

    scopeCommand
      .command('check-token-scopes')
      .description('Verifica se token possui escopos necessários')
      .requiredOption('-t, --token-scopes <scopes>', 'Escopos do token (separados por vírgula)')
      .requiredOption(
        '-r, --required-scopes <scopes>',
        'Escopos necessários (separados por vírgula)'
      )
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token-scopes\`: Escopos do token (separados por vírgula)
- \`-r, --required-scopes\`: Escopos necessários (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope check-token-scopes --token-scopes "repository,pullrequest" --required-scopes "repository"
  $ npx -y @guerchele/bitbucket-mcp-server scope check-token-scopes --token-scopes "repository:write" --required-scopes "repository,repository:write"

**Descrição:**
  Verifica se um token possui todos os escopos necessários para uma operação.`
      )
      .action(async options => {
        await this.handleCheckTokenScopes(options);
      });

    scopeCommand
      .command('get-scope-hierarchy')
      .description('Obtém hierarquia de escopos para tipo de token')
      .requiredOption('-t, --token-type <type>', 'Tipo de token (repository|project|workspace)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token-type\`: Tipo de token (repository|project|workspace)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope get-scope-hierarchy --token-type repository
  $ npx -y @guerchele/bitbucket-mcp-server scope get-scope-hierarchy --token-type project
  $ npx -y @guerchele/bitbucket-mcp-server scope get-scope-hierarchy --token-type workspace

**Descrição:**
  Retorna a hierarquia de escopos em ordem crescente de permissões para o tipo de token especificado.`
      )
      .action(async options => {
        await this.handleGetScopeHierarchy(options);
      });

    scopeCommand
      .command('get-minimum-scopes')
      .description('Obtém escopos mínimos para tipo de token')
      .requiredOption('-t, --token-type <type>', 'Tipo de token (repository|project|workspace)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token-type\`: Tipo de token (repository|project|workspace)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope get-minimum-scopes --token-type repository
  $ npx -y @guerchele/bitbucket-mcp-server scope get-minimum-scopes --token-type project
  $ npx -y @guerchele/bitbucket-mcp-server scope get-minimum-scopes --token-type workspace

**Descrição:**
  Retorna os escopos mínimos necessários para o tipo de token especificado.`
      )
      .action(async options => {
        await this.handleGetMinimumScopes(options);
      });

    scopeCommand
      .command('get-maximum-scopes')
      .description('Obtém escopos máximos para tipo de token')
      .requiredOption('-t, --token-type <type>', 'Tipo de token (repository|project|workspace)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token-type\`: Tipo de token (repository|project|workspace)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope get-maximum-scopes --token-type repository
  $ npx -y @guerchele/bitbucket-mcp-server scope get-maximum-scopes --token-type project
  $ npx -y @guerchele/bitbucket-mcp-server scope get-maximum-scopes --token-type workspace

**Descrição:**
  Retorna todos os escopos disponíveis para o tipo de token especificado.`
      )
      .action(async options => {
        await this.handleGetMaximumScopes(options);
      });

    scopeCommand
      .command('normalize-scopes')
      .description('Normaliza lista de escopos')
      .requiredOption('-s, --scopes <scopes>', 'Escopos para normalizar (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-s, --scopes\`: Escopos para normalizar (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope normalize-scopes --scopes "REPOSITORY, repository:write, PULLREQUEST"
  $ npx -y @guerchele/bitbucket-mcp-server scope normalize-scopes --scopes "  pipeline  , pipeline:write  "

**Descrição:**
  Normaliza uma lista de escopos convertendo para formato consistente (minúsculas, sem espaços extras).`
      )
      .action(async options => {
        await this.handleNormalizeScopes(options);
      });

    scopeCommand
      .command('deduplicate-scopes')
      .description('Remove escopos duplicados da lista')
      .requiredOption('-s, --scopes <scopes>', 'Escopos para deduplicar (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-s, --scopes\`: Escopos para deduplicar (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope deduplicate-scopes --scopes "repository,repository,repository:write"
  $ npx -y @guerchele/bitbucket-mcp-server scope deduplicate-scopes --scopes "pullrequest,pullrequest:write,pullrequest"

**Descrição:**
  Remove escopos duplicados de uma lista, mantendo apenas uma ocorrência de cada escopo único.`
      )
      .action(async options => {
        await this.handleDeduplicateScopes(options);
      });

    scopeCommand
      .command('get-all-scopes')
      .description('Obtém todos os escopos válidos por categoria')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server scope get-all-scopes
  $ npx -y @guerchele/bitbucket-mcp-server scope get-all-scopes --output json

**Descrição:**
  Retorna todos os escopos válidos organizados por categoria (OAuth, Forge App, Repository, Project, Workspace).`
      )
      .action(async options => {
        await this.handleGetAllScopes(options);
      });

    registerLogger.info('Successfully registered all cloud scope validator commands');
  }
}
