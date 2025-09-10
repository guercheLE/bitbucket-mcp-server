/**
 * Token Management Commands for Bitbucket Cloud
 * Handles token management operations
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';
import { TokenManagementService } from '../../services/cloud/token-management.service.js';
import { ApiClient } from '../../utils/api-client.util.js';

export class CloudTokenManagementCommands {
  private static logger = Logger.forContext('CloudTokenManagementCommands');

  private static async handleValidate(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const result = await tokenService.validateToken(options.token);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao validar token', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetInfo(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const result = await tokenService.validateToken(options.token);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter informações do token', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListScopes(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      // Para listar escopos, retornamos os escopos disponíveis baseados no tipo
      const scopes = {
        repository: [
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
        ],
        project: [
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
        ],
        workspace: [
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
        ],
        oauth: [
          'account',
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
          'project',
          'project:admin',
        ],
      };

      const result = options.type
        ? scopes[options.type as keyof typeof scopes] || scopes.oauth
        : scopes;

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar escopos', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCheckScope(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      // Primeiro validamos o token
      const validation = await tokenService.validateToken(options.token);

      if (!validation.valid) {
        const result = {
          valid: false,
          hasScope: false,
          message: 'Token inválido',
        };
        const response = createMcpResponse(result, options.output);
        console.log(response.content[0]?.text || '');
        return;
      }

      // Para verificar escopo, precisaríamos de uma API específica
      // Por enquanto, retornamos que o token é válido mas não podemos verificar escopos específicos
      const result = {
        valid: true,
        hasScope: 'unknown',
        message: 'Token válido, mas verificação de escopo específico não implementada',
        requestedScope: options.scope,
        note: 'A verificação de escopos específicos requer acesso à API de informações do token',
      };

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao verificar escopo do token', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateRepo(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      const result = await tokenService.createRepositoryAccessToken(
        options.workspace,
        options.repo,
        {
          name: options.name,
          scopes: scopes as any,
        }
      );

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar token de acesso do repositório', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateProject(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      const result = await tokenService.createProjectAccessToken(
        options.workspace,
        options.project,
        {
          name: options.name,
          scopes: scopes as any,
        }
      );

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar token de acesso do projeto', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateWorkspace(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      const result = await tokenService.createWorkspaceAccessToken(options.workspace, {
        name: options.name,
        scopes: scopes as any,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar token de acesso do workspace', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateAppPassword(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      const result = await tokenService.createAppPassword({
        name: options.name,
        scopes: scopes as any,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar senha de aplicativo', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateApi(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      const result = await tokenService.createApiToken({
        name: options.name,
        scopes: scopes as any,
        expires_at: options.expiresAt,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar token de API', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListRepoTokens(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const result = await tokenService.listRepositoryAccessTokens(options.workspace, options.repo);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar tokens de acesso do repositório', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListProjectTokens(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const result = await tokenService.listProjectAccessTokens(options.workspace, options.project);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar tokens de acesso do projeto', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListWorkspaceTokens(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const result = await tokenService.listWorkspaceAccessTokens(options.workspace);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar tokens de acesso do workspace', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListAppPasswords(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const result = await tokenService.listAppPasswords();

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar senhas de aplicativo', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListApiTokens(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const result = await tokenService.listApiTokens();

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar tokens de API', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDelete(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      await tokenService.deleteAccessToken({ token_id: options.tokenId });

      const result = { success: true, message: 'Token excluído com sucesso' };
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir token de acesso', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteAppPassword(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      await tokenService.deleteAppPassword(options.passwordId);

      const result = { success: true, message: 'Senha de aplicativo excluída com sucesso' };
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir senha de aplicativo', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteApi(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      await tokenService.deleteApiToken(options.tokenId);

      const result = { success: true, message: 'Token de API excluído com sucesso' };
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir token de API', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdate(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const tokenService = new TokenManagementService(
        apiClient,
        Logger.forContext('TokenManagementService')
      );

      const updateParams: any = { token_id: options.tokenId };
      if (options.name) updateParams.name = options.name;
      if (options.scopes) {
        updateParams.scopes = options.scopes.split(',').map((s: string) => s.trim());
      }

      const result = await tokenService.updateAccessToken(updateParams);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar token de acesso', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de gerenciamento de token');

    const tokenCommand = program
      .command('token')
      .description('Comandos de gerenciamento de tokens do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server token <command> --help' para mais informações sobre um comando específico.
`
      );

    tokenCommand
      .command('validate')
      .description('Valida um token')
      .requiredOption('-t, --token <token>', 'Token para validar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token\`: Token para validar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token validate --token "your_token_here"
  $ npx -y @guerchele/bitbucket-mcp-server token validate --token "your_token_here" --output json

**Descrição:**
  Valida se um token é válido e está ativo.`
      )
      .action(async options => {
        await this.handleValidate(options);
      });

    tokenCommand
      .command('get-info')
      .description('Obtém informações de um token')
      .requiredOption('-t, --token <token>', 'Token para obter informações')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token\`: Token para obter informações

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token get-info --token "your_token_here"
  $ npx -y @guerchele/bitbucket-mcp-server token get-info --token "your_token_here" --output json

**Descrição:**
  Obtém informações detalhadas sobre um token, incluindo escopos e expiração.
  Este comando valida o token e retorna informações sobre sua validade e tipo.`
      )
      .action(async options => {
        await this.handleGetInfo(options);
      });

    tokenCommand
      .command('list-scopes')
      .description('Lista escopos disponíveis para tokens')
      .option('-t, --type <type>', 'Tipo de token (oauth, repository, project, workspace)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-t, --type\`: Tipo de token (oauth, repository, project, workspace)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token list-scopes
  $ npx -y @guerchele/bitbucket-mcp-server token list-scopes --type repository
  $ npx -y @guerchele/bitbucket-mcp-server token list-scopes --type oauth --output json

**Descrição:**
  Lista todos os escopos disponíveis para tokens, opcionalmente filtrados por tipo.`
      )
      .action(async options => {
        await this.handleListScopes(options);
      });

    tokenCommand
      .command('check-scope')
      .description('Verifica se um token tem um escopo específico')
      .requiredOption('-t, --token <token>', 'Token para verificar')
      .requiredOption('-s, --scope <scope>', 'Escopo para verificar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token\`: Token para verificar
- \`-s, --scope\`: Escopo para verificar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token check-scope --token "your_token_here" --scope "repository:read"
  $ npx -y @guerchele/bitbucket-mcp-server token check-scope --token "your_token_here" --scope "workspace:write"

**Descrição:**
  Verifica se um token específico tem um escopo particular.`
      )
      .action(async options => {
        await this.handleCheckScope(options);
      });

    // ===== CREATE TOKEN COMMANDS =====

    tokenCommand
      .command('create-repo')
      .description('Cria um token de acesso para repositório')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome do token')
      .requiredOption('-s, --scopes <scopes>', 'Escopos do token (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-n, --name\`: Nome do token
- \`-s, --scopes\`: Escopos do token (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Escopos disponíveis para repositório:**
- \`repository\`, \`repository:write\`, \`repository:admin\`, \`repository:delete\`
- \`pullrequest\`, \`pullrequest:write\`
- \`webhook\`, \`pipeline\`, \`pipeline:write\`, \`pipeline:variable\`
- \`runner\`, \`runner:write\`

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token create-repo-token --workspace my-company --repo my-project --name "CI Token" --scopes "repository:read,repository:write"
  $ npx -y @guerchele/bitbucket-mcp-server token create-repo --workspace my-company --repo my-project --name "Deploy Token" --scopes "repository:write,pipeline:write"

**Descrição:**
  Cria um token de acesso específico para um repositório com os escopos especificados.
  O token criado pode ser usado para autenticação em operações do repositório.`
      )
      .action(async options => {
        await this.handleCreateRepo(options);
      });

    tokenCommand
      .command('create-project')
      .description('Cria um token de acesso para projeto')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-n, --name <name>', 'Nome do token')
      .requiredOption('-s, --scopes <scopes>', 'Escopos do token (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-p, --project\`: Chave do projeto
- \`-n, --name\`: Nome do token
- \`-s, --scopes\`: Escopos do token (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Escopos disponíveis para projeto:**
- \`project\`, \`repository\`, \`repository:write\`, \`repository:admin\`, \`repository:delete\`
- \`pullrequest\`, \`pullrequest:write\`
- \`webhook\`, \`pipeline\`, \`pipeline:write\`, \`pipeline:variable\`
- \`runner\`, \`runner:write\`

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token create-project --workspace my-company --project MOBILE --name "Project Token" --scopes "project,repository:read"
  $ npx -y @guerchele/bitbucket-mcp-server token create-project --workspace my-company --project MOBILE --name "CI Token" --scopes "repository:write,pipeline:write"

**Descrição:**
  Cria um token de acesso específico para um projeto com os escopos especificados.
  O token criado pode ser usado para autenticação em operações do projeto.`
      )
      .action(async options => {
        await this.handleCreateProject(options);
      });

    tokenCommand
      .command('create-workspace')
      .description('Cria um token de acesso para workspace')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-n, --name <name>', 'Nome do token')
      .requiredOption('-s, --scopes <scopes>', 'Escopos do token (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-n, --name\`: Nome do token
- \`-s, --scopes\`: Escopos do token (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Escopos disponíveis para workspace:**
- \`project\`, \`project:admin\`, \`account\`
- \`repository\`, \`repository:write\`, \`repository:admin\`, \`repository:delete\`
- \`pullrequest\`, \`pullrequest:write\`
- \`webhook\`, \`pipeline\`, \`pipeline:write\`, \`pipeline:variable\`
- \`runner\`, \`runner:write\`

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token create-workspace --workspace my-company --name "Workspace Token" --scopes "account,project:admin"
  $ npx -y @guerchele/bitbucket-mcp-server token create-workspace --workspace my-company --name "CI Token" --scopes "repository:write,pipeline:write"

**Descrição:**
  Cria um token de acesso específico para um workspace com os escopos especificados.
  O token criado pode ser usado para autenticação em operações do workspace.`
      )
      .action(async options => {
        await this.handleCreateWorkspace(options);
      });

    tokenCommand
      .command('create-app-password')
      .description('Cria uma senha de aplicativo')
      .requiredOption('-n, --name <name>', 'Nome da senha de aplicativo')
      .requiredOption('-s, --scopes <scopes>', 'Escopos da senha (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome da senha de aplicativo
- \`-s, --scopes\`: Escopos da senha (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token create-app-password --name "My App Password" --scopes "account:read,repository:read"
  $ npx -y @guerchele/bitbucket-mcp-server token create-app-password --name "CI Password" --scopes "repository:write,pipeline:write"

**Descrição:**
  Cria uma senha de aplicativo que pode ser usada para autenticação em vez de sua senha real.
  As senhas de aplicativo são mais seguras e podem ter escopos limitados.`
      )
      .action(async options => {
        await this.handleCreateAppPassword(options);
      });

    tokenCommand
      .command('create-api')
      .description('Cria um token de API')
      .requiredOption('-n, --name <name>', 'Nome do token de API')
      .requiredOption('-s, --scopes <scopes>', 'Escopos do token (separados por vírgula)')
      .requiredOption('-e, --expires-at <date>', 'Data de expiração (ISO 8601)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome do token de API
- \`-s, --scopes\`: Escopos do token (separados por vírgula)
- \`-e, --expires-at\`: Data de expiração no formato ISO 8601 (ex: 2024-12-31T23:59:59Z)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token create-api --name "API Token" --scopes "account:read" --expires-at "2024-12-31T23:59:59Z"
  $ npx -y @guerchele/bitbucket-mcp-server token create-api --name "CI Token" --scopes "repository:write" --expires-at "2024-06-30T00:00:00Z"

**Descrição:**
  Cria um token de API com data de expiração específica. O token não pode expirar
  mais de 1 ano a partir da data atual.`
      )
      .action(async options => {
        await this.handleCreateApi(options);
      });

    // ===== LIST TOKEN COMMANDS =====

    tokenCommand
      .command('list-repo-tokens')
      .description('Lista tokens de acesso de repositório')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token list-repo-tokens --workspace my-company --repo my-project
  $ npx -y @guerchele/bitbucket-mcp-server token list-repo-tokens --workspace my-company --repo my-project --output json

**Descrição:**
  Lista todos os tokens de acesso criados para um repositório específico.`
      )
      .action(async options => {
        await this.handleListRepoTokens(options);
      });

    tokenCommand
      .command('list-project-tokens')
      .description('Lista tokens de acesso de projeto')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-p, --project\`: Chave do projeto

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token list-project-tokens --workspace my-company --project MOBILE
  $ npx -y @guerchele/bitbucket-mcp-server token list-project-tokens --workspace my-company --project MOBILE --output json

**Descrição:**
  Lista todos os tokens de acesso criados para um projeto específico.`
      )
      .action(async options => {
        await this.handleListProjectTokens(options);
      });

    tokenCommand
      .command('list-workspace-tokens')
      .description('Lista tokens de acesso de workspace')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token list-workspace-tokens --workspace my-company
  $ npx -y @guerchele/bitbucket-mcp-server token list-workspace-tokens --workspace my-company --output json

**Descrição:**
  Lista todos os tokens de acesso criados para um workspace específico.`
      )
      .action(async options => {
        await this.handleListWorkspaceTokens(options);
      });

    tokenCommand
      .command('list-app-passwords')
      .description('Lista senhas de aplicativo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token list-app-passwords
  $ npx -y @guerchele/bitbucket-mcp-server token list-app-passwords --output json

**Descrição:**
  Lista todas as senhas de aplicativo criadas para o usuário autenticado.`
      )
      .action(async options => {
        await this.handleListAppPasswords(options);
      });

    tokenCommand
      .command('list-api-tokens')
      .description('Lista tokens de API')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token list-api-tokens
  $ npx -y @guerchele/bitbucket-mcp-server token list-api-tokens --output json

**Descrição:**
  Lista todos os tokens de API criados para o usuário autenticado.`
      )
      .action(async options => {
        await this.handleListApiTokens(options);
      });

    // ===== DELETE TOKEN COMMANDS =====

    tokenCommand
      .command('delete')
      .description('Exclui um token de acesso')
      .requiredOption('-i, --token-id <tokenId>', 'ID do token para excluir')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --token-id\`: ID do token para excluir

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token delete --token-id "12345678-1234-1234-1234-123456789012"
  $ npx -y @guerchele/bitbucket-mcp-server token delete --token-id "12345678-1234-1234-1234-123456789012" --output json

**Descrição:**
  Exclui um token de acesso específico. Esta operação é irreversível.`
      )
      .action(async options => {
        await this.handleDelete(options);
      });

    tokenCommand
      .command('delete-app-password')
      .description('Exclui uma senha de aplicativo')
      .requiredOption('-i, --password-id <passwordId>', 'ID da senha de aplicativo para excluir')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --password-id\`: ID da senha de aplicativo para excluir

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token delete-app-password --password-id "12345678-1234-1234-1234-123456789012"
  $ npx -y @guerchele/bitbucket-mcp-server token delete-app-password --password-id "12345678-1234-1234-1234-123456789012" --output json

**Descrição:**
  Exclui uma senha de aplicativo específica. Esta operação é irreversível.`
      )
      .action(async options => {
        await this.handleDeleteAppPassword(options);
      });

    tokenCommand
      .command('delete-api')
      .description('Exclui um token de API')
      .requiredOption('-i, --token-id <tokenId>', 'ID do token de API para excluir')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --token-id\`: ID do token de API para excluir

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token delete-api --token-id "12345678-1234-1234-1234-123456789012"
  $ npx -y @guerchele/bitbucket-mcp-server token delete-api --token-id "12345678-1234-1234-1234-123456789012" --output json

**Descrição:**
  Exclui um token de API específico. Esta operação é irreversível.`
      )
      .action(async options => {
        await this.handleDeleteApi(options);
      });

    // ===== UPDATE TOKEN COMMANDS =====

    tokenCommand
      .command('update')
      .description('Atualiza um token de acesso')
      .requiredOption('-i, --token-id <tokenId>', 'ID do token para atualizar')
      .option('-n, --name <name>', 'Novo nome do token')
      .option('-s, --scopes <scopes>', 'Novos escopos do token (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --token-id\`: ID do token para atualizar

**Opções disponíveis:**
- \`-n, --name\`: Novo nome do token
- \`-s, --scopes\`: Novos escopos do token (separados por vírgula)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server token update --token-id "12345678-1234-1234-1234-123456789012" --name "Updated Token"
  $ npx -y @guerchele/bitbucket-mcp-server token update --token-id "12345678-1234-1234-1234-123456789012" --scopes "repository:read,repository:write"

**Descrição:**
  Atualiza um token de acesso existente. Você pode atualizar o nome e/ou os escopos do token.`
      )
      .action(async options => {
        await this.handleUpdate(options);
      });

    registerLogger.info('Successfully registered all cloud token management commands');
  }
}
