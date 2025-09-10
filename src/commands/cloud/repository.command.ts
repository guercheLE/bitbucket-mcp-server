import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { RepositoryService } from '../../services/cloud/repository.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';

/**
 * Repository Commands for Bitbucket Cloud CLI
 *
 * Provides command line interface for repository operations including:
 * - Get repository details
 * - List repositories
 * - Create/update/delete repositories
 * - Manage repository branches and tags
 * - Manage repository webhooks and variables
 * - Fork repositories
 */
export class CloudRepositoryCommands {
  private static logger = Logger.forContext('CloudRepositoryCommands');

  // Métodos estáticos para lidar com ações dos comandos
  private static async handleGetRepository(options: any): Promise<void> {
    try {
      this.logger.info(`Getting repository: ${options.workspace}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.getRepository(options.workspace, options.repoSlug);
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
      this.logger.info('Listing repositories');
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const result = await repositoryService.listRepositories({
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
        role: options.role,
        q: options.query,
        sort: options.sort,
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
      this.logger.info(`Creating repository: ${options.workspace}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const repositoryData: any = {
        name: options.name,
        description: options.description,
        is_private: options.isPrivate || false,
        scm: options.scm || 'git',
        language: options.language,
        has_issues: options.hasIssues || false,
        has_wiki: options.hasWiki || false,
      };

      if (options.project) repositoryData.project = { key: options.project };

      const result = await repositoryService.createRepository(options.workspace, repositoryData);
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
      this.logger.info(`Updating repository: ${options.workspace}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      const repositoryData: any = {};

      if (options.name) repositoryData.name = options.name;
      if (options.description) repositoryData.description = options.description;
      if (options.isPrivate !== undefined) repositoryData.is_private = options.isPrivate;
      if (options.language) repositoryData.language = options.language;
      if (options.hasIssues !== undefined) repositoryData.has_issues = options.hasIssues;
      if (options.hasWiki !== undefined) repositoryData.has_wiki = options.hasWiki;
      if (options.project) repositoryData.project = { key: options.project };

      const result = await repositoryService.updateRepository(
        options.workspace,
        options.repoSlug,
        repositoryData
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
      this.logger.info(`Deleting repository: ${options.workspace}/${options.repoSlug}`);
      const repositoryService = new RepositoryService(
        new ApiClient(),
        Logger.forContext('RepositoryService')
      );
      await repositoryService.deleteRepository(options.workspace, options.repoSlug);
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

  /**
   * Register all repository commands with the CLI program
   */
  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de repositório');

    const repositoryCommand = program
      .command('repository')
      .description('Comandos de Repositório do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server repository <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Get repository command
    repositoryCommand
      .command('get')
      .description('Obtém detalhes de um repositório específico')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server repository get --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Obtém informações detalhadas de um repositório específico, incluindo
  metadados, configurações, permissões e estatísticas.`
      )
      .action(async options => {
        await this.handleGetRepository(options);
      });

    // List repositories command
    repositoryCommand
      .command('list-repositories')
      .description('Lista repositórios')
      .option('-w, --workspace <workspace>', 'Slug do workspace (opcional)')
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
- \`-w, --workspace\`: Slug do workspace (opcional)
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--role\`: Filtrar por role (owner, admin, member, contributor)
- \`--q\`: Query de busca
- \`--sort\`: Campo de ordenação
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository list-repositories
  $ npx -y @guerchele/bitbucket-mcp-server repository list-repositories --workspace my-company
  $ npx -y @guerchele/bitbucket-mcp-server repository list-repositories --workspace my-company --page 2
  $ npx -y @guerchele/bitbucket-mcp-server repository list-repositories --workspace my-company --role admin
  $ npx -y @guerchele/bitbucket-mcp-server repository list-repositories --workspace my-company --q "react"
  $ npx -y @guerchele/bitbucket-mcp-server repository list-repositories --workspace my-company --output json

**Descrição:**
  Lista repositórios com opções de paginação, filtros e ordenação.
  Se workspace for especificado, lista apenas repositórios desse workspace.`
      )
      .action(async options => {
        try {
          this.logger.info('Listing repositories');
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );

          let result;
          if (options.workspace) {
            result = await repositoryService.listWorkspaceRepositories(options.workspace, {
              page: options.page ? parseInt(options.page) : undefined,
              pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
              role: options.role,
              q: options.q,
              sort: options.sort,
            });
          } else {
            result = await repositoryService.listRepositories({
              page: options.page ? parseInt(options.page) : undefined,
              pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
              role: options.role,
              q: options.q,
              sort: options.sort,
            });
          }

          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list repositories:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Create repository command
    repositoryCommand
      .command('create')
      .description('Cria um novo repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-n, --name <name>', 'Nome do repositório')
      .option('-d, --description <description>', 'Descrição do repositório')
      .option('--is-private', 'Repositório privado')
      .option('--has-issues', 'Habilitar issues')
      .option('--has-wiki', 'Habilitar wiki')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-n, --name\`: Nome do repositório

**Opções disponíveis:**
- \`-d, --description\`: Descrição do repositório
- \`--is-private\`: Repositório privado
- \`--has-issues\`: Habilitar issues
- \`--has-wiki\`: Habilitar wiki
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository create --workspace my-company --name my-new-project
  $ npx -y @guerchele/bitbucket-mcp-server repository create --workspace my-company --name my-new-project --description "My new project"
  $ npx -y @guerchele/bitbucket-mcp-server repository create --workspace my-company --name my-new-project --is-private
  $ npx -y @guerchele/bitbucket-mcp-server repository create --workspace my-company --name my-new-project --has-issues --has-wiki

**Descrição:**
  Cria um novo repositório com as configurações especificadas.`
      )
      .action(async options => {
        try {
          this.logger.info(`Creating repository: ${options.name}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const request = {
            name: options.name,
            description: options.description,
            is_private: options.isPrivate,
            has_issues: options.hasIssues,
            has_wiki: options.hasWiki,
          };

          const result = await repositoryService.createRepository(options.workspace, request);
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to create repository:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List repository branches command
    repositoryCommand
      .command('list-branches')
      .description('Lista branches de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
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
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--q\`: Query de busca
- \`--sort\`: Campo de ordenação
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository list-branches --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server repository list-branches --workspace my-company --repo-slug my-project --page 2
  $ npx -y @guerchele/bitbucket-mcp-server repository list-branches --workspace my-company --repo-slug my-project --q "feature"
  $ npx -y @guerchele/bitbucket-mcp-server repository list-branches --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista branches de um repositório com opções de paginação e filtros.`
      )
      .action(async options => {
        try {
          this.logger.info(`Listing repository branches: ${options.workspace}/${options.repoSlug}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.listRepositoryBranches(
            options.workspace,
            options.repoSlug,
            {
              page: options.page ? parseInt(options.page) : undefined,
              pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
              q: options.q,
              sort: options.sort,
            }
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list repository branches:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List repository tags command
    repositoryCommand
      .command('list-tags')
      .description('Lista tags de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
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
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--q\`: Query de busca
- \`--sort\`: Campo de ordenação
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository list-tags --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server repository list-tags --workspace my-company --repo-slug my-project --page 2
  $ npx -y @guerchele/bitbucket-mcp-server repository list-tags --workspace my-company --repo-slug my-project --q "v1"
  $ npx -y @guerchele/bitbucket-mcp-server repository list-tags --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista tags de um repositório com opções de paginação e filtros.`
      )
      .action(async options => {
        try {
          this.logger.info(`Listing repository tags: ${options.workspace}/${options.repoSlug}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.listRepositoryTags(
            options.workspace,
            options.repoSlug,
            {
              page: options.page ? parseInt(options.page) : undefined,
              pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
              q: options.q,
              sort: options.sort,
            }
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list repository tags:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Fork repository command
    repositoryCommand
      .command('fork')
      .description('Faz fork de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--name <name>', 'Nome do repositório fork')
      .option('--description <description>', 'Descrição do repositório fork')
      .option('--is-private', 'Repositório fork privado')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--name\`: Nome do repositório fork
- \`--description\`: Descrição do repositório fork
- \`--is-private\`: Repositório fork privado
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository fork --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server repository fork --workspace my-company --repo-slug my-project --name my-fork
  $ npx -y @guerchele/bitbucket-mcp-server repository fork --workspace my-company --repo-slug my-project --description "My fork"
  $ npx -y @guerchele/bitbucket-mcp-server repository fork --workspace my-company --repo-slug my-project --is-private

**Descrição:**
  Faz fork de um repositório para o workspace atual do usuário.`
      )
      .action(async options => {
        try {
          this.logger.info(`Forking repository: ${options.workspace}/${options.repoSlug}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const request = {
            name: options.name,
            description: options.description,
            is_private: options.isPrivate,
          };

          const result = await repositoryService.forkRepository(
            options.workspace,
            options.repoSlug,
            request
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to fork repository:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Update repository command
    repositoryCommand
      .command('update')
      .description('Atualiza um repositório existente')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('-n, --name <name>', 'Novo nome do repositório')
      .option('-d, --description <description>', 'Nova descrição do repositório')
      .option('--private <private>', 'Se o repositório é privado (true/false)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-n, --name\`: Novo nome do repositório
- \`-d, --description\`: Nova descrição do repositório
- \`--private\`: Se o repositório é privado (true/false)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository update --workspace my-company --repo-slug my-project --name "Novo Nome"
  $ npx -y @guerchele/bitbucket-mcp-server repository update --workspace my-company --repo-slug my-project --description "Nova descrição" --output json

**Descrição:**
  Atualiza as propriedades de um repositório existente.`
      )
      .action(async options => {
        try {
          this.logger.info(`Updating repository: ${options.repoSlug}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );

          const updateData: any = {};
          if (options.name) updateData.name = options.name;
          if (options.description) updateData.description = options.description;
          if (options.private !== undefined) updateData.is_private = options.private === 'true';

          const result = await repositoryService.updateRepository(
            options.workspace,
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
      });

    // Delete repository command
    repositoryCommand
      .command('delete')
      .description('Exclui um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository delete --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server repository delete --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Exclui permanentemente um repositório. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        try {
          this.logger.info(`Deleting repository: ${options.repoSlug}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          await repositoryService.deleteRepository(options.workspace, options.repoSlug);
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
      });

    // Get repository branch command
    repositoryCommand
      .command('get-branch')
      .description('Obtém detalhes de uma branch específica')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-b, --branch-name <name>', 'Nome da branch')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-b, --branch-name\`: Nome da branch

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get-branch --workspace my-company --repo-slug my-project --branch-name main
  $ npx -y @guerchele/bitbucket-mcp-server repository get-branch --workspace my-company --repo-slug my-project --branch-name develop --output json

**Descrição:**
  Obtém informações detalhadas de uma branch específica do repositório.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting repository branch: ${options.branchName}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.getRepositoryBranch(
            options.workspace,
            options.repoSlug,
            options.branchName
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get repository branch:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Create repository branch command
    repositoryCommand
      .command('create-branch')
      .description('Cria uma nova branch no repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-b, --branch-name <name>', 'Nome da nova branch')
      .requiredOption('-f, --from-branch <from>', 'Branch de origem')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-b, --branch-name\`: Nome da nova branch
- \`-f, --from-branch\`: Branch de origem

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository create-branch --workspace my-company --repo-slug my-project --branch-name feature/new-feature --from-branch main
  $ npx -y @guerchele/bitbucket-mcp-server repository create-branch --workspace my-company --repo-slug my-project --branch-name hotfix/bug-fix --from-branch develop --output json

**Descrição:**
  Cria uma nova branch no repositório a partir de uma branch existente.`
      )
      .action(async options => {
        try {
          this.logger.info(`Creating repository branch: ${options.branchName}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.createRepositoryBranch(
            options.workspace,
            options.repoSlug,
            {
              name: options.branchName,
              target: { hash: options.fromBranch },
            }
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to create repository branch:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Delete repository branch command
    repositoryCommand
      .command('delete-branch')
      .description('Exclui uma branch do repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-b, --branch-name <name>', 'Nome da branch')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-b, --branch-name\`: Nome da branch

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository delete-branch --workspace my-company --repo-slug my-project --branch-name feature/old-feature
  $ npx -y @guerchele/bitbucket-mcp-server repository delete-branch --workspace my-company --repo-slug my-project --branch-name hotfix/old-bug --output json

**Descrição:**
  Exclui uma branch do repositório. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        try {
          this.logger.info(`Deleting repository branch: ${options.branchName}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          await repositoryService.deleteRepositoryBranch(
            options.workspace,
            options.repoSlug,
            options.branchName
          );
          const mcpResponse = createMcpResponse(
            { message: 'Repository branch deleted successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to delete repository branch:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List repository forks command
    repositoryCommand
      .command('list-forks')
      .description('Lista forks de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
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
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--q\`: Query de busca
- \`--sort\`: Campo de ordenação
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository list-forks --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server repository list-forks --workspace my-company --repo-slug my-project --page 2
  $ npx -y @guerchele/bitbucket-mcp-server repository list-forks --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista todos os forks de um repositório específico.`
      )
      .action(async options => {
        try {
          this.logger.info(`Listing repository forks: ${options.workspace}/${options.repoSlug}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.listRepositoryForks(
            options.workspace,
            options.repoSlug,
            {
              page: options.page ? parseInt(options.page) : undefined,
              pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
              q: options.q,
              sort: options.sort,
            }
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list repository forks:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Get repository tag command
    repositoryCommand
      .command('get-tag')
      .description('Obtém detalhes de uma tag específica')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-t, --tag-name <name>', 'Nome da tag')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-t, --tag-name\`: Nome da tag

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get-tag --workspace my-company --repo-slug my-project --tag-name v1.0.0
  $ npx -y @guerchele/bitbucket-mcp-server repository get-tag --workspace my-company --repo-slug my-project --tag-name v2.0.0 --output json

**Descrição:**
  Obtém informações detalhadas de uma tag específica do repositório.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting repository tag: ${options.tagName}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.getRepositoryTag(
            options.workspace,
            options.repoSlug,
            options.tagName
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get repository tag:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Create repository tag command
    repositoryCommand
      .command('create-tag')
      .description('Cria uma nova tag no repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome da tag')
      .requiredOption('-t, --target <target>', 'Hash do commit ou branch de destino')
      .option('-m, --message <message>', 'Mensagem da tag')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-n, --name\`: Nome da tag
- \`-t, --target\`: Hash do commit ou branch de destino

**Opções disponíveis:**
- \`-m, --message\`: Mensagem da tag
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository create-tag --workspace my-company --repo-slug my-project --name v1.0.0 --target abc123
  $ npx -y @guerchele/bitbucket-mcp-server repository create-tag --workspace my-company --repo-slug my-project --name v2.0.0 --target main --message "Release v2.0.0"

**Descrição:**
  Cria uma nova tag no repositório apontando para um commit específico.`
      )
      .action(async options => {
        try {
          this.logger.info(`Creating repository tag: ${options.name}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.createRepositoryTag(
            options.workspace,
            options.repoSlug,
            {
              name: options.name,
              target: { hash: options.target },
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
      });

    // Delete repository tag command
    repositoryCommand
      .command('delete-tag')
      .description('Exclui uma tag do repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-t, --tag-name <name>', 'Nome da tag')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-t, --tag-name\`: Nome da tag

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository delete-tag --workspace my-company --repo-slug my-project --tag-name v1.0.0
  $ npx -y @guerchele/bitbucket-mcp-server repository delete-tag --workspace my-company --repo-slug my-project --tag-name v2.0.0 --output json

**Descrição:**
  Exclui uma tag do repositório. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        try {
          this.logger.info(`Deleting repository tag: ${options.tagName}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          await repositoryService.deleteRepositoryTag(
            options.workspace,
            options.repoSlug,
            options.tagName
          );
          const mcpResponse = createMcpResponse(
            { message: 'Repository tag deleted successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to delete repository tag:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List repository commits command
    repositoryCommand
      .command('list-commits')
      .description('Lista commits de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--include <include>', 'Incluir informações adicionais (branches, tags)')
      .option('--exclude <exclude>', 'Excluir informações (branches, tags)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--include\`: Incluir informações adicionais (branches, tags)
- \`--exclude\`: Excluir informações (branches, tags)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository list-commits --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server repository list-commits --workspace my-company --repo-slug my-project --page 2
  $ npx -y @guerchele/bitbucket-mcp-server repository list-commits --workspace my-company --repo-slug my-project --include branches

**Descrição:**
  Lista commits de um repositório com opções de paginação e filtros.`
      )
      .action(async options => {
        try {
          this.logger.info(`Listing repository commits: ${options.workspace}/${options.repoSlug}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.listRepositoryCommits(
            options.workspace,
            options.repoSlug,
            {
              page: options.page ? parseInt(options.page) : undefined,
              pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
              include: options.include,
              exclude: options.exclude,
            }
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list repository commits:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Get repository commit command
    repositoryCommand
      .command('get-commit')
      .description('Obtém detalhes de um commit específico')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-c, --commit <commit>', 'Hash do commit')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-c, --commit\`: Hash do commit

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get-commit --workspace my-company --repo-slug my-project --commit abc123
  $ npx -y @guerchele/bitbucket-mcp-server repository get-commit --workspace my-company --repo-slug my-project --commit def456 --output json

**Descrição:**
  Obtém informações detalhadas de um commit específico do repositório.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting repository commit: ${options.commit}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.getRepositoryCommit(
            options.workspace,
            options.repoSlug,
            options.commit
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get repository commit:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List repository webhooks command
    repositoryCommand
      .command('list-webhooks')
      .description('Lista webhooks de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository list-webhooks --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server repository list-webhooks --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista todos os webhooks configurados para um repositório específico.`
      )
      .action(async options => {
        try {
          this.logger.info(`Listing repository webhooks: ${options.workspace}/${options.repoSlug}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.listRepositoryWebhooks(
            options.workspace,
            options.repoSlug
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list repository webhooks:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Get repository webhook command
    repositoryCommand
      .command('get-webhook')
      .description('Obtém detalhes de um webhook específico')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-u, --webhook-uid <uid>', 'UID do webhook')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-u, --webhook-uid\`: UID do webhook

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get-webhook --workspace my-company --repo-slug my-project --webhook-uid 12345
  $ npx -y @guerchele/bitbucket-mcp-server repository get-webhook --workspace my-company --repo-slug my-project --webhook-uid 67890 --output json

**Descrição:**
  Obtém informações detalhadas de um webhook específico do repositório.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting repository webhook: ${options.webhookUid}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.getRepositoryWebhook(
            options.workspace,
            options.repoSlug,
            options.webhookUid
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get repository webhook:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Create repository webhook command
    repositoryCommand
      .command('create-webhook')
      .description('Cria um novo webhook no repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-u, --url <url>', 'URL do webhook')
      .requiredOption('-d, --description <description>', 'Descrição do webhook')
      .option('-e, --events <events>', 'Eventos do webhook (separados por vírgula)', 'repo:push')
      .option('--active', 'Webhook ativo', true)
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-u, --url\`: URL do webhook
- \`-d, --description\`: Descrição do webhook

**Opções disponíveis:**
- \`-e, --events\`: Eventos do webhook (separados por vírgula) - padrão: repo:push
- \`--active\`: Webhook ativo - padrão: true
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository create-webhook --workspace my-company --repo-slug my-project --url "https://example.com/webhook" --description "CI Webhook"
  $ npx -y @guerchele/bitbucket-mcp-server repository create-webhook --workspace my-company --repo-slug my-project --url "https://example.com/webhook" --description "Deploy Webhook" --events "repo:push,pullrequest:created"

**Descrição:**
  Cria um novo webhook no repositório para receber notificações de eventos.`
      )
      .action(async options => {
        try {
          this.logger.info(`Creating repository webhook: ${options.url}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const events = options.events.split(',').map((e: string) => e.trim());
          const result = await repositoryService.createRepositoryWebhook(
            options.workspace,
            options.repoSlug,
            {
              url: options.url,
              description: options.description,
              events: events,
              active: options.active,
            }
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to create repository webhook:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Update repository webhook command
    repositoryCommand
      .command('update-webhook')
      .description('Atualiza um webhook existente')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-u, --webhook-uid <uid>', 'UID do webhook')
      .option('--url <url>', 'Nova URL do webhook')
      .option('--description <description>', 'Nova descrição do webhook')
      .option('--events <events>', 'Novos eventos do webhook (separados por vírgula)')
      .option('--active <active>', 'Status ativo (true/false)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-u, --webhook-uid\`: UID do webhook

**Opções disponíveis:**
- \`--url\`: Nova URL do webhook
- \`--description\`: Nova descrição do webhook
- \`--events\`: Novos eventos do webhook (separados por vírgula)
- \`--active\`: Status ativo (true/false)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository update-webhook --workspace my-company --repo-slug my-project --webhook-uid 12345 --url "https://new-url.com/webhook"
  $ npx -y @guerchele/bitbucket-mcp-server repository update-webhook --workspace my-company --repo-slug my-project --webhook-uid 12345 --description "Updated webhook"

**Descrição:**
  Atualiza as propriedades de um webhook existente no repositório.`
      )
      .action(async options => {
        try {
          this.logger.info(`Updating repository webhook: ${options.webhookUid}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const updateData: any = {};
          if (options.url) updateData.url = options.url;
          if (options.description) updateData.description = options.description;
          if (options.events) {
            updateData.events = options.events.split(',').map((e: string) => e.trim());
          }
          if (options.active !== undefined) updateData.active = options.active === 'true';

          const result = await repositoryService.updateRepositoryWebhook(
            options.workspace,
            options.repoSlug,
            options.webhookUid,
            updateData
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to update repository webhook:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Delete repository webhook command
    repositoryCommand
      .command('delete-webhook')
      .description('Exclui um webhook do repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-u, --webhook-uid <uid>', 'UID do webhook')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-u, --webhook-uid\`: UID do webhook

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository delete-webhook --workspace my-company --repo-slug my-project --webhook-uid 12345
  $ npx -y @guerchele/bitbucket-mcp-server repository delete-webhook --workspace my-company --repo-slug my-project --webhook-uid 67890 --output json

**Descrição:**
  Exclui um webhook do repositório. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        try {
          this.logger.info(`Deleting repository webhook: ${options.webhookUid}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          await repositoryService.deleteRepositoryWebhook(
            options.workspace,
            options.repoSlug,
            options.webhookUid
          );
          const mcpResponse = createMcpResponse(
            { message: 'Repository webhook deleted successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to delete repository webhook:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List repository variables command
    repositoryCommand
      .command('list-variables')
      .description('Lista variáveis de pipeline de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository list-variables --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server repository list-variables --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista todas as variáveis de pipeline configuradas para um repositório específico.`
      )
      .action(async options => {
        try {
          this.logger.info(
            `Listing repository variables: ${options.workspace}/${options.repoSlug}`
          );
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.listRepositoryVariables(
            options.workspace,
            options.repoSlug
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list repository variables:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Get repository variable command
    repositoryCommand
      .command('get-variable')
      .description('Obtém detalhes de uma variável específica')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-v, --variable-uuid <uuid>', 'UUID da variável')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-v, --variable-uuid\`: UUID da variável

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository get-variable --workspace my-company --repo-slug my-project --variable-uuid 12345
  $ npx -y @guerchele/bitbucket-mcp-server repository get-variable --workspace my-company --repo-slug my-project --variable-uuid 67890 --output json

**Descrição:**
  Obtém informações detalhadas de uma variável de pipeline específica do repositório.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting repository variable: ${options.variableUuid}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.getRepositoryVariable(
            options.workspace,
            options.repoSlug,
            options.variableUuid
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get repository variable:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Create repository variable command
    repositoryCommand
      .command('create-variable')
      .description('Cria uma nova variável de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-k, --key <key>', 'Chave da variável')
      .requiredOption('-v, --value <value>', 'Valor da variável')
      .option('-s, --secured', 'Variável segura (valor será mascarado)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-k, --key\`: Chave da variável
- \`-v, --value\`: Valor da variável

**Opções disponíveis:**
- \`-s, --secured\`: Variável segura (valor será mascarado)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository create-variable --workspace my-company --repo-slug my-project --key "API_KEY" --value "secret123"
  $ npx -y @guerchele/bitbucket-mcp-server repository create-variable --workspace my-company --repo-slug my-project --key "DB_PASSWORD" --value "password123" --secured

**Descrição:**
  Cria uma nova variável de pipeline no repositório.`
      )
      .action(async options => {
        try {
          this.logger.info(`Creating repository variable: ${options.key}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const result = await repositoryService.createRepositoryVariable(
            options.workspace,
            options.repoSlug,
            {
              key: options.key,
              value: options.value,
              secured: options.secured || false,
            }
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to create repository variable:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Update repository variable command
    repositoryCommand
      .command('update-variable')
      .description('Atualiza uma variável de pipeline existente')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
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
- \`-r, --repo-slug\`: Slug do repositório
- \`-v, --variable-uuid\`: UUID da variável

**Opções disponíveis:**
- \`-k, --key\`: Nova chave da variável
- \`--value\`: Novo valor da variável
- \`-s, --secured\`: Status seguro (true/false)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository update-variable --workspace my-company --repo-slug my-project --variable-uuid 12345 --key "NEW_API_KEY"
  $ npx -y @guerchele/bitbucket-mcp-server repository update-variable --workspace my-company --repo-slug my-project --variable-uuid 12345 --value "newvalue123"

**Descrição:**
  Atualiza as propriedades de uma variável de pipeline existente no repositório.`
      )
      .action(async options => {
        try {
          this.logger.info(`Updating repository variable: ${options.variableUuid}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          const updateData: any = {};
          if (options.key) updateData.key = options.key;
          if (options.value) updateData.value = options.value;
          if (options.secured !== undefined) updateData.secured = options.secured === 'true';

          const result = await repositoryService.updateRepositoryVariable(
            options.workspace,
            options.repoSlug,
            options.variableUuid,
            updateData
          );
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to update repository variable:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Delete repository variable command
    repositoryCommand
      .command('delete-variable')
      .description('Exclui uma variável de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-v, --variable-uuid <uuid>', 'UUID da variável')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-v, --variable-uuid\`: UUID da variável

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server repository delete-variable --workspace my-company --repo-slug my-project --variable-uuid 12345
  $ npx -y @guerchele/bitbucket-mcp-server repository delete-variable --workspace my-company --repo-slug my-project --variable-uuid 67890 --output json

**Descrição:**
  Exclui uma variável de pipeline do repositório. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        try {
          this.logger.info(`Deleting repository variable: ${options.variableUuid}`);
          const repositoryService = new RepositoryService(
            new ApiClient(),
            Logger.forContext('RepositoryService')
          );
          await repositoryService.deleteRepositoryVariable(
            options.workspace,
            options.repoSlug,
            options.variableUuid
          );
          const mcpResponse = createMcpResponse(
            { message: 'Repository variable deleted successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to delete repository variable:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all cloud repository commands');
  }
}
