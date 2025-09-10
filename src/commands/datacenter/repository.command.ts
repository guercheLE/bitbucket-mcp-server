import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { RepositoryService } from '../../services/datacenter/repository.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';

/**
 * Repository Commands for Bitbucket Data Center CLI
 *
 * Provides command line interface for repository operations including:
 * - Get repository details
 * - List repositories
 * - Manage repository settings
 */
export class DataCenterRepositoryCommands {
  private static logger = Logger.forContext('DataCenterRepositoryCommands');

  private static async handleGetRepository(options: any): Promise<void> {
    try {
      this.logger.info(`Getting repository: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.getRepository(options.project, options.repoSlug);
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get repository:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleListRepositories(options: any): Promise<void> {
    try {
      this.logger.info(
        `Listing repositories${options.project ? ` for project: ${options.project}` : ''}`
      );
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.listRepositories(options.project, {
        start: options.start ? parseInt(options.start) : undefined,
        limit: options.limit ? parseInt(options.limit) : undefined,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list repositories:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleCreateRepository(options: any): Promise<void> {
    try {
      this.logger.info(`Creating repository: ${options.project}/${options.name}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.createRepository(options.project, {
        name: options.name,
        scmId: options.scmId || 'git',
        forkable: options.forkable !== undefined ? options.forkable : true,
        public: options.public !== undefined ? options.public : false,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create repository:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleUpdateRepository(options: any): Promise<void> {
    try {
      this.logger.info(`Updating repository: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const updateData: any = {};
      if (options.name) updateData.name = options.name;
      if (options.description) updateData.description = options.description;
      if (options.forkable !== undefined) updateData.forkable = options.forkable;
      if (options.public !== undefined) updateData.public = options.public;

      const result = await repositoryService.updateRepository(
        options.project,
        options.repoSlug,
        updateData
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to update repository:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleDeleteRepository(options: any): Promise<void> {
    try {
      this.logger.info(`Deleting repository: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      await repositoryService.deleteRepository(options.project, options.repoSlug);
      const mcpResponse = createMcpResponse(
        { message: 'Repository deleted successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to delete repository:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleForkRepository(options: any): Promise<void> {
    try {
      this.logger.info(`Forking repository: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.createRepositoryFork(
        options.project,
        options.repoSlug,
        {
          name: options.name,
        }
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to fork repository:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetRepositoryHooks(options: any): Promise<void> {
    try {
      this.logger.info(`Getting repository hooks: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.getRepositoryHooks(options.project, options.repoSlug);
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get repository hooks:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleCreateRepositoryHook(options: any): Promise<void> {
    try {
      this.logger.info(`Creating repository hook: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.createRepositoryHook(
        options.project,
        options.repoSlug,
        {
          name: options.name || 'Webhook',
          url: options.url,
          events: options.events ? options.events.split(',') : ['repo:refs_changed'],
          active: options.active !== undefined ? options.active : true,
        }
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create repository hook:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleUpdateRepositoryHook(options: any): Promise<void> {
    try {
      this.logger.info(
        `Updating repository hook: ${options.project}/${options.repoSlug}/${options.hookId}`
      );
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const updateData: any = {};
      if (options.url) updateData.url = options.url;
      if (options.events) updateData.events = options.events.split(',');
      if (options.active !== undefined) updateData.active = options.active;

      const result = await repositoryService.updateRepositoryHook(
        options.project,
        options.repoSlug,
        options.hookId,
        updateData
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to update repository hook:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleDeleteRepositoryHook(options: any): Promise<void> {
    try {
      this.logger.info(
        `Deleting repository hook: ${options.project}/${options.repoSlug}/${options.hookId}`
      );
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      await repositoryService.deleteRepositoryHook(
        options.project,
        options.repoSlug,
        options.hookId
      );
      const mcpResponse = createMcpResponse(
        { message: 'Repository hook deleted successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to delete repository hook:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetRepositoryPermissions(options: any): Promise<void> {
    try {
      this.logger.info(`Getting repository permissions: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.getRepositoryPermissions(
        options.project,
        options.repoSlug
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get repository permissions:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleSetRepositoryPermission(options: any): Promise<void> {
    try {
      this.logger.info(`Setting repository permission: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.addRepositoryPermission(
        options.project,
        options.repoSlug,
        {
          user: options.user,
          group: options.group,
          permission: options.permission,
        }
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to set repository permission:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleRevokeRepositoryPermission(options: any): Promise<void> {
    try {
      this.logger.info(`Revoking repository permission: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      await repositoryService.removeRepositoryPermission(options.project, options.repoSlug, {
        user: options.user,
        group: options.group,
        permission: options.permission,
      });
      const mcpResponse = createMcpResponse(
        { message: 'Repository permission revoked successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to revoke repository permission:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetBranches(options: any): Promise<void> {
    try {
      this.logger.info(`Getting branches: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.getRepositoryBranches(
        options.project,
        options.repoSlug
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get branches:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetTags(options: any): Promise<void> {
    try {
      this.logger.info(`Getting tags: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.getRepositoryTags(options.project, options.repoSlug);
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get tags:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetCommits(options: any): Promise<void> {
    try {
      this.logger.info(`Getting commits: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      // TODO: Implement getCommits method in repository service
      const result = { message: 'getCommits method not implemented yet' };
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get commits:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetFiles(options: any): Promise<void> {
    try {
      this.logger.info(`Getting files: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      // TODO: Implement getFiles method in repository service
      const result = { message: 'getFiles method not implemented yet' };
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get files:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetFileContent(options: any): Promise<void> {
    try {
      this.logger.info(
        `Getting file content: ${options.project}/${options.repoSlug}/${options.path}`
      );
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      // TODO: Implement getFileContent method in repository service
      const result = { message: 'getFileContent method not implemented yet' };
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get file content:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetRepositorySettings(options: any): Promise<void> {
    try {
      this.logger.info(`Getting repository settings: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.getRepositorySettings(
        options.project,
        options.repoSlug
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get repository settings:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleUpdateRepositorySettings(options: any): Promise<void> {
    try {
      this.logger.info(`Updating repository settings: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const settings: any = {};
      if (options.defaultBranch) settings.defaultBranch = options.defaultBranch;
      if (options.pullRequestSettings)
        settings.pullRequestSettings = JSON.parse(options.pullRequestSettings);

      const result = await repositoryService.updateRepositorySettings(
        options.project,
        options.repoSlug,
        settings
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to update repository settings:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetRepositorySize(options: any): Promise<void> {
    try {
      this.logger.info(`Getting repository size: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.getRepository(options.project, options.repoSlug);
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get repository size:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleCreateBranch(options: any): Promise<void> {
    try {
      this.logger.info(`Creating repository branch: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.createRepositoryBranch(
        options.project,
        options.repoSlug,
        {
          name: options.name,
          startPoint: options.startPoint,
        }
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create repository branch:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleCreateTag(options: any): Promise<void> {
    try {
      this.logger.info(`Creating repository tag: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.createRepositoryTag(
        options.project,
        options.repoSlug,
        {
          name: options.name,
          startPoint: options.commit,
          message: options.message,
        }
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create repository tag:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetForks(options: any): Promise<void> {
    try {
      this.logger.info(`Getting repository forks: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.getRepositoryForks(options.project, options.repoSlug, {
        start: options.start ? parseInt(options.start) : undefined,
        limit: options.limit ? parseInt(options.limit) : undefined,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get repository forks:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleCreateFork(options: any): Promise<void> {
    try {
      this.logger.info(`Creating repository fork: ${options.project}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const forkData: any = {};
      if (options.name) forkData.name = options.name;
      if (options.description) forkData.description = options.description;
      if (options.private !== undefined) forkData.is_private = options.private === 'true';
      const result = await repositoryService.createRepositoryFork(
        options.project,
        options.repoSlug,
        forkData
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create repository fork:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Register all repository commands with the CLI program
   */
  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de repositório do Data Center');

    const repositoryCommand = program
      .command('repository')
      .description('Comandos de repositório do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server repository <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Get repository command
    repositoryCommand
      .command('get')
      .description('Obtém detalhes de um repositório específico (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get --project MOBILE --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server repository get --project MOBILE --repo-slug my-project --output json

**Descrição:**
  Obtém informações detalhadas de um repositório específico no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetRepository(options);
      });

    // List repositories command
    repositoryCommand
      .command('list')
      .description('Lista repositórios (Data Center)')
      .option('-p, --project <project>', 'Chave do projeto (opcional)')
      .option('--start <start>', 'Índice de início')
      .option('--limit <limit>', 'Número máximo de resultados')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --project\`: Chave do projeto (opcional)
- \`--start\`: Índice de início
- \`--limit\`: Número máximo de resultados
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository list
  $ npx -y @guerchele/bitbucket-mcp-server repository list --project MOBILE
  $ npx -y @guerchele/bitbucket-mcp-server repository list --start 0 --limit 10
  $ npx -y @guerchele/bitbucket-mcp-server repository list --output json

**Descrição:**
  Lista repositórios no Bitbucket Data Center com opções de paginação.`
      )
      .action(async options => {
        await this.handleListRepositories(options);
      });

    // Create repository command
    repositoryCommand
      .command('create')
      .description('Cria um novo repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome do repositório')
      .option('-d, --description <description>', 'Descrição do repositório')
      .option('--is-private <private>', 'Se o repositório é privado (true/false)', 'true')
      .option('--forkable <forkable>', 'Se o repositório pode ser bifurcado (true/false)', 'true')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório
- \`-n, --name\`: Nome do repositório

**Opções disponíveis:**
- \`-d, --description\`: Descrição do repositório
- \`--is-private\`: Se o repositório é privado (true/false, padrão: true)
- \`--forkable\`: Se o repositório pode ser bifurcado (true/false, padrão: true)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository create --project MOBILE --repo-slug my-new-repo --name "My New Repository"
  $ npx -y @guerchele/bitbucket-mcp-server repository create --project MOBILE --repo-slug my-new-repo --name "My New Repository" --description "Repository description" --is-private false

**Descrição:**
  Cria um novo repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleCreateRepository(options);
      });

    // Update repository command
    repositoryCommand
      .command('update')
      .description('Atualiza um repositório existente (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('-n, --name <name>', 'Novo nome do repositório')
      .option('-d, --description <description>', 'Nova descrição do repositório')
      .option('--is-private <private>', 'Se o repositório é privado (true/false)')
      .option('--forkable <forkable>', 'Se o repositório pode ser bifurcado (true/false)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-n, --name\`: Novo nome do repositório
- \`-d, --description\`: Nova descrição do repositório
- \`--is-private\`: Se o repositório é privado (true/false)
- \`--forkable\`: Se o repositório pode ser bifurcado (true/false)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository update --project MOBILE --repo-slug my-repo --name "Updated Repository Name"
  $ npx -y @guerchele/bitbucket-mcp-server repository update --project MOBILE --repo-slug my-repo --description "Updated description" --is-private false

**Descrição:**
  Atualiza as propriedades de um repositório existente no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleUpdateRepository(options);
      });

    // Delete repository command
    repositoryCommand
      .command('delete')
      .description('Exclui um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository delete --project MOBILE --repo-slug my-repo

**Descrição:**
  Exclui um repositório do Bitbucket Data Center. Esta ação é irreversível.`
      )
      .action(async options => {
        await this.handleDeleteRepository(options);
      });

    // Get repository permissions command
    repositoryCommand
      .command('get-permissions')
      .description('Obtém permissões de um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get-permissions --project MOBILE --repo-slug my-repo

**Descrição:**
  Obtém as permissões de um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetRepositoryPermissions(options);
      });

    // Add repository permission command
    repositoryCommand
      .command('add-permission')
      .description('Adiciona permissão a um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-u, --user <user>', 'Nome de usuário ou grupo')
      .requiredOption('--permission <permission>', 'Permissão (READ, WRITE, ADMIN)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório
- \`-u, --user\`: Nome de usuário ou grupo
- \`--permission\`: Permissão (READ, WRITE, ADMIN)

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository add-permission --project MOBILE --repo-slug my-repo --user john.doe --permission WRITE
  $ npx -y @guerchele/bitbucket-mcp-server repository add-permission --project MOBILE --repo-slug my-repo --user developers --permission READ

**Descrição:**
  Adiciona uma permissão a um usuário ou grupo em um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleSetRepositoryPermission(options);
      });

    // Remove repository permission command
    repositoryCommand
      .command('remove-permission')
      .description('Remove permissão de um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-u, --user <user>', 'Nome de usuário ou grupo')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório
- \`-u, --user\`: Nome de usuário ou grupo

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository remove-permission --project MOBILE --repo-slug my-repo --user john.doe
  $ npx -y @guerchele/bitbucket-mcp-server repository remove-permission --project MOBILE --repo-slug my-repo --user developers

**Descrição:**
  Remove uma permissão de um usuário ou grupo em um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleRevokeRepositoryPermission(options);
      });

    // Get repository settings command
    repositoryCommand
      .command('get-settings')
      .description('Obtém configurações de um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get-settings --project MOBILE --repo-slug my-repo

**Descrição:**
  Obtém as configurações de um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetRepositorySettings(options);
      });

    // Update repository settings command
    repositoryCommand
      .command('update-settings')
      .description('Atualiza configurações de um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--forkable <forkable>', 'Se o repositório pode ser bifurcado (true/false)')
      .option('--has-issues <hasIssues>', 'Se o repositório tem issues (true/false)')
      .option('--has-wiki <hasWiki>', 'Se o repositório tem wiki (true/false)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--forkable\`: Se o repositório pode ser bifurcado (true/false)
- \`--has-issues\`: Se o repositório tem issues (true/false)
- \`--has-wiki\`: Se o repositório tem wiki (true/false)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository update-settings --project MOBILE --repo-slug my-repo --forkable false
  $ npx -y @guerchele/bitbucket-mcp-server repository update-settings --project MOBILE --repo-slug my-repo --has-issues true --has-wiki false

**Descrição:**
  Atualiza as configurações de um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleUpdateRepositorySettings(options);
      });

    // Get repository hooks command
    repositoryCommand
      .command('get-hooks')
      .description('Obtém hooks de um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get-hooks --project MOBILE --repo-slug my-repo

**Descrição:**
  Obtém os hooks de um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetRepositoryHooks(options);
      });

    // Create repository hook command
    repositoryCommand
      .command('create-hook')
      .description('Cria um hook em um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome do hook')
      .requiredOption('-u, --url <url>', 'URL do hook')
      .option('-e, --events <events>', 'Eventos do hook (separados por vírgula)')
      .option('--active <active>', 'Se o hook está ativo (true/false)', 'true')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório
- \`-n, --name\`: Nome do hook
- \`-u, --url\`: URL do hook

**Opções disponíveis:**
- \`-e, --events\`: Eventos do hook (separados por vírgula)
- \`--active\`: Se o hook está ativo (true/false, padrão: true)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository create-hook --project MOBILE --repo-slug my-repo --name "My Hook" --url "https://example.com/hook"
  $ npx -y @guerchele/bitbucket-mcp-server repository create-hook --project MOBILE --repo-slug my-repo --name "My Hook" --url "https://example.com/hook" --events "repo:push,repo:fork"

**Descrição:**
  Cria um novo hook em um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleCreateRepositoryHook(options);
      });

    // Get repository hook command
    repositoryCommand
      .command('get-hook')
      .description('Obtém um hook específico de um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-h, --hook-id <hookId>', 'ID do hook')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório
- \`-h, --hook-id\`: ID do hook

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get-hook --project MOBILE --repo-slug my-repo --hook-id 123

**Descrição:**
  Obtém um hook específico de um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetRepositoryHooks(options);
      });

    // Update repository hook command
    repositoryCommand
      .command('update-hook')
      .description('Atualiza um hook de um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-h, --hook-id <hookId>', 'ID do hook')
      .option('-n, --name <name>', 'Novo nome do hook')
      .option('-u, --url <url>', 'Nova URL do hook')
      .option('-e, --events <events>', 'Novos eventos do hook (separados por vírgula)')
      .option('--active <active>', 'Se o hook está ativo (true/false)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório
- \`-h, --hook-id\`: ID do hook

**Opções disponíveis:**
- \`-n, --name\`: Novo nome do hook
- \`-u, --url\`: Nova URL do hook
- \`-e, --events\`: Novos eventos do hook (separados por vírgula)
- \`--active\`: Se o hook está ativo (true/false)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository update-hook --project MOBILE --repo-slug my-repo --hook-id 123 --name "Updated Hook"
  $ npx -y @guerchele/bitbucket-mcp-server repository update-hook --project MOBILE --repo-slug my-repo --hook-id 123 --url "https://new-url.com/hook" --active false

**Descrição:**
  Atualiza um hook de um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleUpdateRepositoryHook(options);
      });

    // Delete repository hook command
    repositoryCommand
      .command('delete-hook')
      .description('Exclui um hook de um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-h, --hook-id <hookId>', 'ID do hook')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório
- \`-h, --hook-id\`: ID do hook

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository delete-hook --project MOBILE --repo-slug my-repo --hook-id 123

**Descrição:**
  Exclui um hook de um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleDeleteRepositoryHook(options);
      });

    // Get repository branches command
    repositoryCommand
      .command('get-branches')
      .description('Obtém branches de um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--start <start>', 'Índice de início')
      .option('--limit <limit>', 'Número máximo de resultados')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--start\`: Índice de início
- \`--limit\`: Número máximo de resultados
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get-branches --project MOBILE --repo-slug my-repo
  $ npx -y @guerchele/bitbucket-mcp-server repository get-branches --project MOBILE --repo-slug my-repo --start 0 --limit 10

**Descrição:**
  Obtém as branches de um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetBranches(options);
      });

    // Create repository branch command
    repositoryCommand
      .command('create-branch')
      .description('Cria uma branch em um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome da branch')
      .requiredOption('-s, --start-point <startPoint>', 'Ponto de início da branch')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório
- \`-n, --name\`: Nome da branch
- \`-s, --start-point\`: Ponto de início da branch

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository create-branch --project MOBILE --repo-slug my-repo --name "feature/new-feature" --start-point "main"
  $ npx -y @guerchele/bitbucket-mcp-server repository create-branch --project MOBILE --repo-slug my-repo --name "hotfix/bug-fix" --start-point "develop"

**Descrição:**
  Cria uma nova branch em um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleCreateBranch(options);
      });

    // Get repository tags command
    repositoryCommand
      .command('get-tags')
      .description('Obtém tags de um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--start <start>', 'Índice de início')
      .option('--limit <limit>', 'Número máximo de resultados')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--start\`: Índice de início
- \`--limit\`: Número máximo de resultados
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get-tags --project MOBILE --repo-slug my-repo
  $ npx -y @guerchele/bitbucket-mcp-server repository get-tags --project MOBILE --repo-slug my-repo --start 0 --limit 10

**Descrição:**
  Obtém as tags de um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetTags(options);
      });

    // Create repository tag command
    repositoryCommand
      .command('create-tag')
      .description('Cria uma tag em um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome da tag')
      .requiredOption('-c, --commit <commit>', 'Hash do commit')
      .option('-m, --message <message>', 'Mensagem da tag')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório
- \`-n, --name\`: Nome da tag
- \`-c, --commit\`: Hash do commit

**Opções disponíveis:**
- \`-m, --message\`: Mensagem da tag
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository create-tag --project MOBILE --repo-slug my-repo --name "v1.0.0" --commit "abc123"
  $ npx -y @guerchele/bitbucket-mcp-server repository create-tag --project MOBILE --repo-slug my-repo --name "v1.0.0" --commit "abc123" --message "Release version 1.0.0"

**Descrição:**
  Cria uma nova tag em um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleCreateTag(options);
      });

    // Get repository forks command
    repositoryCommand
      .command('get-forks')
      .description('Obtém forks de um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--start <start>', 'Índice de início')
      .option('--limit <limit>', 'Número máximo de resultados')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--start\`: Índice de início
- \`--limit\`: Número máximo de resultados
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get-forks --project MOBILE --repo-slug my-repo
  $ npx -y @guerchele/bitbucket-mcp-server repository get-forks --project MOBILE --repo-slug my-repo --start 0 --limit 10

**Descrição:**
  Obtém os forks de um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetForks(options);
      });

    // Create repository fork command
    repositoryCommand
      .command('create-fork')
      .description('Cria um fork de um repositório (Data Center)')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('-n, --name <name>', 'Nome do fork')
      .option('-d, --description <description>', 'Descrição do fork')
      .option('--is-private <private>', 'Se o fork é privado (true/false)', 'true')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-n, --name\`: Nome do fork
- \`-d, --description\`: Descrição do fork
- \`--is-private\`: Se o fork é privado (true/false, padrão: true)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository create-fork --project MOBILE --repo-slug my-repo
  $ npx -y @guerchele/bitbucket-mcp-server repository create-fork --project MOBILE --repo-slug my-repo --name "my-fork" --description "My fork description" --is-private false

**Descrição:**
  Cria um fork de um repositório no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleCreateFork(options);
      });

    registerLogger.info('Successfully registered all Data Center repository commands');
  }
}
