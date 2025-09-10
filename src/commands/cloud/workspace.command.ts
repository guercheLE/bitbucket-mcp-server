import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { WorkspaceService } from '../../services/cloud/workspace.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';

/**
 * Workspace Commands for Bitbucket Cloud CLI
 *
 * Provides command line interface for workspace operations including:
 * - Get workspace details
 * - List workspaces
 * - Create/update/delete workspaces
 * - Manage workspace members and permissions
 * - Manage workspace hooks and variables
 */
export class CloudWorkspaceCommands {
  private static logger = Logger.forContext('CloudWorkspaceCommands');

  /**
   * Handle get workspace command
   */
  private static async handleGetWorkspace(options: any): Promise<void> {
    try {
      this.logger.info(`Getting workspace: ${options.workspace}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const result = await workspaceService.getWorkspace(options.workspace);
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get workspace:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle list workspaces command
   */
  private static async handleListWorkspaces(options: any): Promise<void> {
    try {
      this.logger.info('Listing workspaces');
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const result = await workspaceService.listWorkspaces({
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
        role: options.role,
        q: options.q,
        sort: options.sort,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list workspaces:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle create workspace command
   */
  private static async handleCreateWorkspace(options: any): Promise<void> {
    try {
      this.logger.info(`Creating workspace: ${options.name}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const request = {
        name: options.name,
        slug: options.slug,
        description: options.description,
        is_private: options.isPrivate,
      };

      const result = await workspaceService.createWorkspace(request);
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create workspace:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle list workspace members command
   */
  private static async handleListWorkspaceMembers(options: any): Promise<void> {
    try {
      this.logger.info(`Listing workspace members: ${options.workspace}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const result = await workspaceService.listWorkspaceMembers(options.workspace, {
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
        q: options.q,
        sort: options.sort,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list workspace members:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle get workspace member command
   */
  private static async handleGetWorkspaceMember(options: any): Promise<void> {
    try {
      this.logger.info(`Getting workspace member: ${options.workspace}/${options.member}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const result = await workspaceService.getWorkspaceMember(options.workspace, options.member);
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get workspace member:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle list workspace permissions command
   */
  private static async handleListWorkspacePermissions(options: any): Promise<void> {
    try {
      this.logger.info(`Listing workspace permissions: ${options.workspace}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const result = await workspaceService.listWorkspacePermissions(options.workspace, {
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
        q: options.q,
        sort: options.sort,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list workspace permissions:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle list workspace hooks command
   */
  private static async handleListWorkspaceHooks(options: any): Promise<void> {
    try {
      this.logger.info(`Listing workspace hooks: ${options.workspace}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const result = await workspaceService.listWorkspaceHooks(options.workspace);
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list workspace hooks:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle list workspace variables command
   */
  private static async handleListWorkspaceVariables(options: any): Promise<void> {
    try {
      this.logger.info(`Listing workspace variables: ${options.workspace}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const result = await workspaceService.listWorkspaceVariables(options.workspace);
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list workspace variables:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle update workspace command
   */
  private static async handleUpdateWorkspace(options: any): Promise<void> {
    try {
      this.logger.info(`Updating workspace: ${options.workspace}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );

      const updateData: any = {};
      if (options.name) updateData.name = options.name;
      if (options.description) updateData.description = options.description;
      if (options.isPrivate !== undefined) updateData.is_private = options.isPrivate === 'true';

      const result = await workspaceService.updateWorkspace(options.workspace, updateData);
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to update workspace:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle delete workspace command
   */
  private static async handleDeleteWorkspace(options: any): Promise<void> {
    try {
      this.logger.info(`Deleting workspace: ${options.workspace}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      await workspaceService.deleteWorkspace(options.workspace);
      const mcpResponse = createMcpResponse(
        { message: 'Workspace deleted successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to delete workspace:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle get workspace hook command
   */
  private static async handleGetWorkspaceHook(options: any): Promise<void> {
    try {
      this.logger.info(`Getting workspace hook: ${options.hookUid}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const result = await workspaceService.getWorkspaceHook(options.workspace, options.hookUid);
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get workspace hook:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle create workspace hook command
   */
  private static async handleCreateWorkspaceHook(options: any): Promise<void> {
    try {
      this.logger.info(`Creating workspace hook: ${options.url}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const events = options.events.split(',').map((e: string) => e.trim());
      const result = await workspaceService.createWorkspaceHook(options.workspace, {
        url: options.url,
        description: options.description,
        events: events,
        active: options.active,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create workspace hook:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle update workspace hook command
   */
  private static async handleUpdateWorkspaceHook(options: any): Promise<void> {
    try {
      this.logger.info(`Updating workspace hook: ${options.hookUid}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const updateData: any = {};
      if (options.url) updateData.url = options.url;
      if (options.description) updateData.description = options.description;
      if (options.events) {
        updateData.events = options.events.split(',').map((e: string) => e.trim());
      }
      if (options.active !== undefined) updateData.active = options.active === 'true';

      const result = await workspaceService.updateWorkspaceHook(
        options.workspace,
        options.hookUid,
        updateData
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to update workspace hook:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle delete workspace hook command
   */
  private static async handleDeleteWorkspaceHook(options: any): Promise<void> {
    try {
      this.logger.info(`Deleting workspace hook: ${options.hookUid}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      await workspaceService.deleteWorkspaceHook(options.workspace, options.hookUid);
      const mcpResponse = createMcpResponse(
        { message: 'Workspace hook deleted successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to delete workspace hook:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle get workspace variable command
   */
  private static async handleGetWorkspaceVariable(options: any): Promise<void> {
    try {
      this.logger.info(`Getting workspace variable: ${options.variableUuid}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const result = await workspaceService.getWorkspaceVariable(
        options.workspace,
        options.variableUuid
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get workspace variable:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle create workspace variable command
   */
  private static async handleCreateWorkspaceVariable(options: any): Promise<void> {
    try {
      this.logger.info(`Creating workspace variable: ${options.key}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const result = await workspaceService.createWorkspaceVariable(options.workspace, {
        key: options.key,
        value: options.value,
        secured: options.secured || false,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create workspace variable:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle update workspace variable command
   */
  private static async handleUpdateWorkspaceVariable(options: any): Promise<void> {
    try {
      this.logger.info(`Updating workspace variable: ${options.variableUuid}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      const updateData: any = {};
      if (options.key) updateData.key = options.key;
      if (options.value) updateData.value = options.value;
      if (options.secured !== undefined) updateData.secured = options.secured === 'true';

      const result = await workspaceService.updateWorkspaceVariable(
        options.workspace,
        options.variableUuid,
        updateData
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to update workspace variable:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle delete workspace variable command
   */
  private static async handleDeleteWorkspaceVariable(options: any): Promise<void> {
    try {
      this.logger.info(`Deleting workspace variable: ${options.variableUuid}`);
      const workspaceService = new WorkspaceService(
        new ApiClient(),
        Logger.forContext('WorkspaceService')
      );
      await workspaceService.deleteWorkspaceVariable(options.workspace, options.variableUuid);
      const mcpResponse = createMcpResponse(
        { message: 'Workspace variable deleted successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to delete workspace variable:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Register all workspace commands with the CLI program
   */
  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de workspace');

    const workspaceCommand = program
      .command('workspace')
      .description('Comandos de workspace do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server workspace <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Get workspace command
    workspaceCommand
      .command('get')
      .description('Obtém detalhes de um workspace específico')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace get --workspace my-company
  $ npx -y @guerchele/bitbucket-mcp-server workspace get -w my-company --output json

**Descrição:**
  Obtém informações detalhadas de um workspace específico, incluindo
  metadados, configurações e estatísticas.`
      )
      .action(async options => {
        await this.handleGetWorkspace(options);
      });

    // List workspaces command
    workspaceCommand
      .command('list')
      .description('Lista workspaces')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--role <role>', 'Filtrar por role (owner, admin, member, contributor)')
      .option('--q <query>', 'Query de busca')
      .option('--sort <field>', 'Campo de ordenação')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--role\`: Filtrar por role (owner, admin, member, contributor)
- \`--q\`: Query de busca
- \`--sort\`: Campo de ordenação
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace list
  $ npx -y @guerchele/bitbucket-mcp-server workspace list --page 2
  $ npx -y @guerchele/bitbucket-mcp-server workspace list --role admin
  $ npx -y @guerchele/bitbucket-mcp-server workspace list --q "my"
  $ npx -y @guerchele/bitbucket-mcp-server workspace list --output json

**Descrição:**
  Lista workspaces com opções de paginação, filtros e ordenação.`
      )
      .action(async options => {
        await this.handleListWorkspaces(options);
      });

    // Create workspace command
    workspaceCommand
      .command('create')
      .description('Cria um novo workspace')
      .requiredOption('-n, --name <name>', 'Nome do workspace')
      .option('-s, --slug <slug>', 'Slug do workspace (opcional)')
      .option('-d, --description <description>', 'Descrição do workspace')
      .option('--is-private', 'Workspace privado')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome do workspace

**Opções disponíveis:**
- \`-s, --slug\`: Slug do workspace (opcional)
- \`-d, --description\`: Descrição do workspace
- \`--is-private\`: Workspace privado
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace create --name "My Company"
  $ npx -y @guerchele/bitbucket-mcp-server workspace create --name "My Company" --slug my-company
  $ npx -y @guerchele/bitbucket-mcp-server workspace create --name "My Company" --description "Company workspace"
  $ npx -y @guerchele/bitbucket-mcp-server workspace create --name "My Company" --is-private

**Descrição:**
  Cria um novo workspace com as configurações especificadas.`
      )
      .action(async options => {
        await this.handleCreateWorkspace(options);
      });

    // List workspace members command
    workspaceCommand
      .command('list-members')
      .description('Lista membros de um workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--q <query>', 'Query de busca')
      .option('--sort <field>', 'Campo de ordenação')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--q\`: Query de busca
- \`--sort\`: Campo de ordenação (created_on, display_name)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace list-members --workspace my-company
  $ npx -y @guerchele/bitbucket-mcp-server workspace list-members -w my-company --page 2
  $ npx -y @guerchele/bitbucket-mcp-server workspace list-members -w my-company --q "john"
  $ npx -y @guerchele/bitbucket-mcp-server workspace list-members -w my-company --sort display_name

**Descrição:**
  Lista membros de um workspace com opções de paginação e filtros.`
      )
      .action(async options => {
        await this.handleListWorkspaceMembers(options);
      });

    // Get workspace member command
    workspaceCommand
      .command('get-member')
      .description('Obtém detalhes de um membro específico do workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-m, --member <member>', 'Slug do membro')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-m, --member\`: Slug do membro

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace get-member --workspace my-company --member john.doe
  $ npx -y @guerchele/bitbucket-mcp-server workspace get-member -w my-company -m john.doe --output json

**Descrição:**
  Obtém informações detalhadas de um membro específico do workspace.`
      )
      .action(async options => {
        await this.handleGetWorkspaceMember(options);
      });

    // List workspace permissions command
    workspaceCommand
      .command('list-permissions')
      .description('Lista permissões de um workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--q <query>', 'Query de busca')
      .option('--sort <field>', 'Campo de ordenação')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--q\`: Query de busca
- \`--sort\`: Campo de ordenação (created_on, display_name)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace list-permissions --workspace my-company
  $ npx -y @guerchele/bitbucket-mcp-server workspace list-permissions -w my-company --page 2
  $ npx -y @guerchele/bitbucket-mcp-server workspace list-permissions -w my-company --q "admin"
  $ npx -y @guerchele/bitbucket-mcp-server workspace list-permissions -w my-company --sort display_name

**Descrição:**
  Lista permissões de um workspace com opções de paginação e filtros.`
      )
      .action(async options => {
        await this.handleListWorkspacePermissions(options);
      });

    // List workspace hooks command
    workspaceCommand
      .command('list-hooks')
      .description('Lista hooks de um workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace list-hooks --workspace my-company
  $ npx -y @guerchele/bitbucket-mcp-server workspace list-hooks -w my-company --output json

**Descrição:**
  Lista hooks configurados para um workspace.`
      )
      .action(async options => {
        await this.handleListWorkspaceHooks(options);
      });

    // List workspace variables command
    workspaceCommand
      .command('list-variables')
      .description('Lista variáveis de um workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace list-variables --workspace my-company
  $ npx -y @guerchele/bitbucket-mcp-server workspace list-variables -w my-company --output json

**Descrição:**
  Lista variáveis de pipeline configuradas para um workspace.`
      )
      .action(async options => {
        await this.handleListWorkspaceVariables(options);
      });

    // Update workspace command
    workspaceCommand
      .command('update')
      .description('Atualiza um workspace existente')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .option('-n, --name <name>', 'Novo nome do workspace')
      .option('-d, --description <description>', 'Nova descrição do workspace')
      .option('--is-private <private>', 'Se o workspace é privado (true/false)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace

**Opções disponíveis:**
- \`-n, --name\`: Novo nome do workspace
- \`-d, --description\`: Nova descrição do workspace
- \`--is-private\`: Se o workspace é privado (true/false)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace update --workspace my-company --name "New Company Name"
  $ npx -y @guerchele/bitbucket-mcp-server workspace update -w my-company --description "Updated description"
  $ npx -y @guerchele/bitbucket-mcp-server workspace update -w my-company --is-private true

**Descrição:**
  Atualiza as propriedades de um workspace existente.`
      )
      .action(async options => {
        await this.handleUpdateWorkspace(options);
      });

    // Delete workspace command
    workspaceCommand
      .command('delete')
      .description('Exclui um workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace delete --workspace my-company
  $ npx -y @guerchele/bitbucket-mcp-server workspace delete -w my-company --output json

**Descrição:**
  Exclui permanentemente um workspace. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteWorkspace(options);
      });

    // Get workspace hook command
    workspaceCommand
      .command('get-hook')
      .description('Obtém detalhes de um hook específico do workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-u, --hook-uid <uid>', 'UID do hook')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-u, --hook-uid\`: UID do hook

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace get-hook --workspace my-company --hook-uid 12345
  $ npx -y @guerchele/bitbucket-mcp-server workspace get-hook -w my-company -u 67890 --output json

**Descrição:**
  Obtém informações detalhadas de um hook específico do workspace.`
      )
      .action(async options => {
        await this.handleGetWorkspaceHook(options);
      });

    // Create workspace hook command
    workspaceCommand
      .command('create-hook')
      .description('Cria um novo hook no workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-u, --url <url>', 'URL do hook')
      .requiredOption('-d, --description <description>', 'Descrição do hook')
      .option('-e, --events <events>', 'Eventos do hook (separados por vírgula)', 'workspace:push')
      .option('--active', 'Hook ativo', true)
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-u, --url\`: URL do hook
- \`-d, --description\`: Descrição do hook

**Opções disponíveis:**
- \`-e, --events\`: Eventos do hook (separados por vírgula) - padrão: workspace:push
- \`--active\`: Hook ativo - padrão: true
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace create-hook --workspace my-company --url "https://example.com/webhook" --description "CI Webhook"
  $ npx -y @guerchele/bitbucket-mcp-server workspace create-hook -w my-company -u "https://example.com/webhook" -d "Deploy Webhook" --events "workspace:push,workspace:created"

**Descrição:**
  Cria um novo hook no workspace para receber notificações de eventos.`
      )
      .action(async options => {
        await this.handleCreateWorkspaceHook(options);
      });

    // Update workspace hook command
    workspaceCommand
      .command('update-hook')
      .description('Atualiza um hook existente do workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-u, --hook-uid <uid>', 'UID do hook')
      .option('--url <url>', 'Nova URL do hook')
      .option('--description <description>', 'Nova descrição do hook')
      .option('--events <events>', 'Novos eventos do hook (separados por vírgula)')
      .option('--active <active>', 'Status ativo (true/false)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-u, --hook-uid\`: UID do hook

**Opções disponíveis:**
- \`--url\`: Nova URL do hook
- \`--description\`: Nova descrição do hook
- \`--events\`: Novos eventos do hook (separados por vírgula)
- \`--active\`: Status ativo (true/false)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace update-hook --workspace my-company --hook-uid 12345 --url "https://new-url.com/webhook"
  $ npx -y @guerchele/bitbucket-mcp-server workspace update-hook -w my-company -u 12345 --description "Updated hook"

**Descrição:**
  Atualiza as propriedades de um hook existente do workspace.`
      )
      .action(async options => {
        await this.handleUpdateWorkspaceHook(options);
      });

    // Delete workspace hook command
    workspaceCommand
      .command('delete-hook')
      .description('Exclui um hook do workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-u, --hook-uid <uid>', 'UID do hook')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-u, --hook-uid\`: UID do hook

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace delete-hook --workspace my-company --hook-uid 12345
  $ npx -y @guerchele/bitbucket-mcp-server workspace delete-hook -w my-company -u 67890 --output json

**Descrição:**
  Exclui um hook do workspace. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteWorkspaceHook(options);
      });

    // Get workspace variable command
    workspaceCommand
      .command('get-variable')
      .description('Obtém detalhes de uma variável específica do workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-v, --variable-uuid <uuid>', 'UUID da variável')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-v, --variable-uuid\`: UUID da variável

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace get-variable --workspace my-company --variable-uuid 12345
  $ npx -y @guerchele/bitbucket-mcp-server workspace get-variable -w my-company -v 67890 --output json

**Descrição:**
  Obtém informações detalhadas de uma variável de pipeline específica do workspace.`
      )
      .action(async options => {
        await this.handleGetWorkspaceVariable(options);
      });

    // Create workspace variable command
    workspaceCommand
      .command('create-variable')
      .description('Cria uma nova variável de pipeline no workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave da variável')
      .requiredOption('-v, --value <value>', 'Valor da variável')
      .option('-s, --secured', 'Variável segura (valor será mascarado)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave da variável
- \`-v, --value\`: Valor da variável

**Opções disponíveis:**
- \`-s, --secured\`: Variável segura (valor será mascarado)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace create-variable --workspace my-company --key "API_KEY" --value "secret123"
  $ npx -y @guerchele/bitbucket-mcp-server workspace create-variable -w my-company -k "DB_PASSWORD" -v "password123" --secured

**Descrição:**
  Cria uma nova variável de pipeline no workspace.`
      )
      .action(async options => {
        await this.handleCreateWorkspaceVariable(options);
      });

    // Update workspace variable command
    workspaceCommand
      .command('update-variable')
      .description('Atualiza uma variável de pipeline existente do workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-v, --variable-uuid <uuid>', 'UUID da variável')
      .option('-k, --key <key>', 'Nova chave da variável')
      .option('--value <value>', 'Novo valor da variável')
      .option('-s, --secured <secured>', 'Status seguro (true/false)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-v, --variable-uuid\`: UUID da variável

**Opções disponíveis:**
- \`-k, --key\`: Nova chave da variável
- \`--value\`: Novo valor da variável
- \`-s, --secured\`: Status seguro (true/false)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace update-variable --workspace my-company --variable-uuid 12345 --key "NEW_API_KEY"
  $ npx -y @guerchele/bitbucket-mcp-server workspace update-variable -w my-company -v 12345 --value "newvalue123"

**Descrição:**
  Atualiza as propriedades de uma variável de pipeline existente do workspace.`
      )
      .action(async options => {
        await this.handleUpdateWorkspaceVariable(options);
      });

    // Delete workspace variable command
    workspaceCommand
      .command('delete-variable')
      .description('Exclui uma variável de pipeline do workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-v, --variable-uuid <uuid>', 'UUID da variável')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-v, --variable-uuid\`: UUID da variável

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace delete-variable --workspace my-company --variable-uuid 12345
  $ npx -y @guerchele/bitbucket-mcp-server workspace delete-variable -w my-company -v 67890 --output json

**Descrição:**
  Exclui uma variável de pipeline do workspace. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteWorkspaceVariable(options);
      });

    registerLogger.info('Successfully registered all cloud workspace commands');
  }
}
