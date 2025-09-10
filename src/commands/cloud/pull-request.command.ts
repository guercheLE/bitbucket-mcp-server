import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { PullRequestService } from '../../services/cloud/pull-request.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';

/**
 * Pull Request Commands for Bitbucket Cloud CLI
 *
 * Provides command line interface for pull request operations including:
 * - Get pull request details
 * - List pull requests
 * - Create/update/delete pull requests
 * - Manage pull request comments
 * - Approve/decline/merge pull requests
 * - Get pull request diff and patch
 */
export class CloudPullRequestCommands {
  private static logger = Logger.forContext('CloudPullRequestCommands');

  // Métodos estáticos para lidar com ações dos comandos
  private static async handleGetPullRequest(pullRequestId: string, options: any): Promise<void> {
    try {
      this.logger.info(`Getting pull request: ${pullRequestId}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.getPullRequest(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(pullRequestId)
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get pull request:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleListPullRequests(options: any): Promise<void> {
    try {
      this.logger.info('Listing pull requests');
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.listPullRequests(
        options.workspaceSlug,
        options.repoSlug,
        {
          state: options.state,
          page: options.page ? parseInt(options.page) : undefined,
          pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
        }
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list pull requests:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleCreatePullRequest(options: any): Promise<void> {
    try {
      this.logger.info('Creating pull request');
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const prData: any = {
        title: options.title,
        source: {
          branch: {
            name: options.sourceBranch,
          },
        },
        destination: {
          branch: {
            name: options.destinationBranch,
          },
        },
      };

      if (options.description) prData.description = options.description;
      if (options.reviewers) {
        prData.reviewers = options.reviewers
          .split(',')
          .map((r: string) => ({ username: r.trim() }));
      }
      if (options.closeSourceBranch) prData.close_source_branch = options.closeSourceBranch;

      const result = await pullRequestService.createPullRequest(
        options.workspaceSlug,
        options.repoSlug,
        prData
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create pull request:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleUpdatePullRequest(pullRequestId: string, options: any): Promise<void> {
    try {
      this.logger.info(`Updating pull request: ${pullRequestId}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const prData: any = {};

      if (options.title) prData.title = options.title;
      if (options.description) prData.description = options.description;
      if (options.reviewers) {
        prData.reviewers = options.reviewers
          .split(',')
          .map((r: string) => ({ username: r.trim() }));
      }
      if (options.closeSourceBranch !== undefined)
        prData.close_source_branch = options.closeSourceBranch;

      const result = await pullRequestService.updatePullRequest(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(pullRequestId),
        prData
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to update pull request:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleMergePullRequest(pullRequestId: string, options: any): Promise<void> {
    try {
      this.logger.info(`Merging pull request: ${pullRequestId}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const mergeData: any = {
        type: options.mergeStrategy || 'merge_commit',
      };

      if (options.message) mergeData.message = options.message;
      if (options.closeSourceBranch !== undefined)
        mergeData.close_source_branch = options.closeSourceBranch;

      const result = await pullRequestService.mergePullRequest(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(pullRequestId)
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to merge pull request:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleDeclinePullRequest(
    pullRequestId: string,
    options: any
  ): Promise<void> {
    try {
      this.logger.info(`Declining pull request: ${pullRequestId}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const declineData: any = {};

      if (options.message) declineData.message = options.message;

      const result = await pullRequestService.declinePullRequest(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(pullRequestId)
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to decline pull request:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleApprovePullRequest(
    pullRequestId: string,
    options: any
  ): Promise<void> {
    try {
      this.logger.info(`Approving pull request: ${pullRequestId}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.approvePullRequest(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(pullRequestId)
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to approve pull request:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetPullRequestDiff(
    pullRequestId: string,
    options: any
  ): Promise<void> {
    try {
      this.logger.info(`Getting pull request diff: ${pullRequestId}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.getPullRequestDiff(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(pullRequestId)
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get pull request diff:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleUnapprovePullRequest(
    pullRequestId: string,
    options: any
  ): Promise<void> {
    try {
      this.logger.info(`Unapproving pull request: ${pullRequestId}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.unapprovePullRequest(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(pullRequestId)
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to unapprove pull request:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleRequestChangesPullRequest(
    pullRequestId: string,
    options: any
  ): Promise<void> {
    try {
      this.logger.info(`Requesting changes for pull request: ${pullRequestId}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.requestChangesPullRequest(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(pullRequestId)
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to request changes for pull request:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetPullRequestPatch(
    pullRequestId: string,
    options: any
  ): Promise<void> {
    try {
      this.logger.info(`Getting pull request patch: ${pullRequestId}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.getPullRequestPatch(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(pullRequestId)
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get pull request patch:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleListPullRequestComments(options: any): Promise<void> {
    try {
      this.logger.info(`Listing pull request comments: ${options.id}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.listPullRequestComments(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(options.id),
        {
          page: options.page ? parseInt(options.page) : undefined,
          pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
        }
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list pull request comments:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetPullRequestComment(options: any): Promise<void> {
    try {
      this.logger.info(`Getting pull request comment: ${options.commentId}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.getPullRequestComment(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(options.id),
        parseInt(options.commentId)
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get pull request comment:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleCreatePullRequestComment(options: any): Promise<void> {
    try {
      this.logger.info(`Creating pull request comment: ${options.id}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const commentData: any = {
        content: { raw: options.content },
      };

      if (options.inline && options.path && options.line) {
        commentData.inline = {
          path: options.path,
          to: parseInt(options.line),
        };
      }

      const result = await pullRequestService.createPullRequestComment(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(options.id),
        commentData
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create pull request comment:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleUpdatePullRequestComment(options: any): Promise<void> {
    try {
      this.logger.info(`Updating pull request comment: ${options.commentId}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.updatePullRequestComment(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(options.id),
        parseInt(options.commentId),
        {
          content: { raw: options.content },
        }
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to update pull request comment:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleDeletePullRequestComment(options: any): Promise<void> {
    try {
      this.logger.info(`Deleting pull request comment: ${options.commentId}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      await pullRequestService.deletePullRequestComment(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(options.id),
        parseInt(options.commentId)
      );
      const mcpResponse = createMcpResponse(
        { message: 'Pull request comment deleted successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to delete pull request comment:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleListPullRequestActivities(options: any): Promise<void> {
    try {
      this.logger.info(`Listing pull request activities: ${options.id}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.listPullRequestActivities(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(options.id),
        {
          page: options.page ? parseInt(options.page) : undefined,
          pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
        }
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list pull request activities:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleListPullRequestStatuses(options: any): Promise<void> {
    try {
      this.logger.info(`Listing pull request statuses: ${options.id}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.listPullRequestStatuses(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(options.id)
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list pull request statuses:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleCreatePullRequestStatus(options: any): Promise<void> {
    try {
      this.logger.info(`Creating pull request status: ${options.key}`);
      const pullRequestService = new PullRequestService(
        new ApiClient(),
        Logger.forContext('PullRequestService')
      );
      const result = await pullRequestService.createPullRequestStatus(
        options.workspaceSlug,
        options.repoSlug,
        parseInt(options.id),
        {
          state: options.state,
          key: options.key,
          name: options.name,
          description: options.description,
          url: options.url,
        }
      );
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create pull request status:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Register all pull request commands with the CLI program
   */
  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de pull request');

    const prCommand = program
      .command('pull-request')
      .description('Comandos de Pull Request do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server pull-request <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Get pull request command
    prCommand
      .command('get')
      .description('Obtém detalhes de um pull request específico')
      .argument('<pull-request-id>', 'ID do pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`pull-request-id\`: ID do pull request

**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request get 123 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server pull-request get 456 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Obtém informações detalhadas de um pull request específico, incluindo
  status, metadados, informações de branch e merge, e detalhes do autor e revisores.`
      )
      .action(async (pullRequestId, options) => {
        await this.handleGetPullRequest(pullRequestId, options);
      });

    // List pull requests command
    prCommand
      .command('list')
      .description('Lista pull requests de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .option('-s, --state <state>', 'Estado do pull request (OPEN, MERGED, DECLINED, SUPERSEDED)')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-s, --state\`: Estado do pull request (OPEN, MERGED, DECLINED, SUPERSEDED)
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list --workspace my-company --repo-slug my-project --state OPEN
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list --workspace my-company --repo-slug my-project --page 2
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista pull requests de um repositório com opções de paginação
  e filtros por estado.`
      )
      .action(async options => {
        await this.handleListPullRequests(options);
      });

    // Create pull request command
    prCommand
      .command('create')
      .description('Cria um novo pull request')
      .requiredOption('-t, --title <title>', 'Título do pull request')
      .requiredOption('--source-branch <branch>', 'Branch de origem')
      .requiredOption('--destination-branch <branch>', 'Branch de destino')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .option('-d, --description <description>', 'Descrição do pull request')
      .option('--close-source-branch', 'Fechar branch de origem após merge')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --title\`: Título do pull request
- \`--source-branch\`: Branch de origem
- \`--destination-branch\`: Branch de destino
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-d, --description\`: Descrição do pull request
- \`--close-source-branch\`: Fechar branch de origem após merge
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request create --title "Fix bug" --source-branch feature --destination-branch main --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server pull-request create --title "New feature" --source-branch dev --destination-branch main --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server pull-request create --title "Update docs" --source-branch docs --destination-branch main --workspace my-company --repo-slug my-project --description "Updated documentation"
  $ npx -y @guerchele/bitbucket-mcp-server pull-request create --title "Hotfix" --source-branch hotfix --destination-branch main --workspace my-company --repo-slug my-project --close-source-branch

**Descrição:**
  Cria um novo pull request com as configurações especificadas,
  incluindo branches de origem e destino, título e descrição opcional.`
      )
      .action(async options => {
        await this.handleCreatePullRequest(options);
      });

    // Merge pull request command
    prCommand
      .command('merge')
      .description('Faz merge de um pull request')
      .argument('<pull-request-id>', 'ID do pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`pull-request-id\`: ID do pull request

**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request merge 123 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server pull-request merge 456 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Faz merge de um pull request, integrando as mudanças ao branch
  de destino e fechando automaticamente o pull request.`
      )
      .action(async (pullRequestId, options) => {
        await this.handleMergePullRequest(pullRequestId, options);
      });

    // Approve pull request command
    prCommand
      .command('approve')
      .description('Aprova um pull request')
      .argument('<pull-request-id>', 'ID do pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`pull-request-id\`: ID do pull request

**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request approve 123 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server pull-request approve 456 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Aprova um pull request, indicando que o código está pronto
  para ser integrado ao branch de destino.`
      )
      .action(async (pullRequestId, options) => {
        await this.handleApprovePullRequest(pullRequestId, options);
      });

    // Get pull request diff command
    prCommand
      .command('get-diff')
      .description('Obtém o diff de um pull request')
      .argument('<pull-request-id>', 'ID do pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`pull-request-id\`: ID do pull request

**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request get-diff 123 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server pull-request get-diff 456 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Obtém o diff completo de um pull request, mostrando todas as
  mudanças entre o branch de origem e o de destino.`
      )
      .action(async (pullRequestId, options) => {
        await this.handleGetPullRequestDiff(pullRequestId, options);
      });

    // Update pull request command
    prCommand
      .command('update')
      .description('Atualiza um pull request existente')
      .argument('<pull-request-id>', 'ID do pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .option('-t, --title <title>', 'Novo título do pull request')
      .option('-d, --description <description>', 'Nova descrição do pull request')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`pull-request-id\`: ID do pull request

**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-t, --title\`: Novo título do pull request
- \`-d, --description\`: Nova descrição do pull request
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request update 123 --workspace my-company --repo-slug my-project --title "Novo título"
  $ npx -y @guerchele/bitbucket-mcp-server pull-request update 456 --workspace my-company --repo-slug my-project --description "Nova descrição" --output json

**Descrição:**
  Atualiza um pull request existente com novos dados.`
      )
      .action(async (pullRequestId, options) => {
        await this.handleUpdatePullRequest(pullRequestId, options);
      });

    // Decline pull request command
    prCommand
      .command('decline')
      .description('Rejeita um pull request')
      .argument('<pull-request-id>', 'ID do pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`pull-request-id\`: ID do pull request

**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request decline 123 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server pull-request decline 456 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Rejeita um pull request, impedindo que seja merged.`
      )
      .action(async (pullRequestId, options) => {
        await this.handleDeclinePullRequest(pullRequestId, options);
      });

    // Unapprove pull request command
    prCommand
      .command('unapprove')
      .description('Remove aprovação de um pull request')
      .argument('<pull-request-id>', 'ID do pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`pull-request-id\`: ID do pull request

**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request unapprove 123 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server pull-request unapprove 456 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Remove a aprovação de um pull request que foi previamente aprovado.`
      )
      .action(async (pullRequestId, options) => {
        await this.handleUnapprovePullRequest(pullRequestId, options);
      });

    // Request changes pull request command
    prCommand
      .command('request-changes')
      .description('Solicita mudanças em um pull request')
      .argument('<pull-request-id>', 'ID do pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`pull-request-id\`: ID do pull request

**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request request-changes 123 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server pull-request request-changes 456 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Solicita mudanças em um pull request, indicando que precisa de revisão adicional.`
      )
      .action(async (pullRequestId, options) => {
        await this.handleRequestChangesPullRequest(pullRequestId, options);
      });

    // Get pull request patch command
    prCommand
      .command('get-patch')
      .description('Obtém o patch de um pull request')
      .argument('<pull-request-id>', 'ID do pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`pull-request-id\`: ID do pull request

**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request get-patch 123 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server pull-request get-patch 456 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Obtém o patch completo de um pull request em formato de texto.`
      )
      .action(async (pullRequestId, options) => {
        await this.handleGetPullRequestPatch(pullRequestId, options);
      });

    // List pull request comments command
    prCommand
      .command('list-comments')
      .description('Lista comentários de um pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID do pull request')
      .option('--page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID do pull request

**Opções disponíveis:**
- \`--page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list-comments --workspace my-company --repo-slug my-project --id 123
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list-comments --workspace my-company --repo-slug my-project --id 123 --page 2

**Descrição:**
  Lista todos os comentários de um pull request específico.`
      )
      .action(async options => {
        await this.handleListPullRequestComments(options);
      });

    // Get pull request comment command
    prCommand
      .command('get-comment')
      .description('Obtém detalhes de um comentário específico')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID do pull request')
      .requiredOption('-c, --comment-id <id>', 'ID do comentário')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID do pull request
- \`-c, --comment-id\`: ID do comentário

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request get-comment --workspace my-company --repo-slug my-project --id 123 --comment-id 456
  $ npx -y @guerchele/bitbucket-mcp-server pull-request get-comment --workspace my-company --repo-slug my-project --id 123 --comment-id 456 --output json

**Descrição:**
  Obtém informações detalhadas de um comentário específico de um pull request.`
      )
      .action(async options => {
        await this.handleGetPullRequestComment(options);
      });

    // Create pull request comment command
    prCommand
      .command('create-comment')
      .description('Cria um novo comentário em um pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID do pull request')
      .requiredOption('-c, --content <content>', 'Conteúdo do comentário')
      .option('--inline', 'Comentário inline')
      .option('--path <path>', 'Caminho do arquivo (para comentários inline)')
      .option('--line <line>', 'Número da linha (para comentários inline)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID do pull request
- \`-c, --content\`: Conteúdo do comentário

**Opções disponíveis:**
- \`--inline\`: Comentário inline
- \`--path\`: Caminho do arquivo (para comentários inline)
- \`--line\`: Número da linha (para comentários inline)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request create-comment --workspace my-company --repo-slug my-project --id 123 --content "Great work!"
  $ npx -y @guerchele/bitbucket-mcp-server pull-request create-comment --workspace my-company --repo-slug my-project --id 123 --content "Please fix this" --inline --path "src/file.js" --line 10

**Descrição:**
  Cria um novo comentário em um pull request. Pode ser um comentário geral ou inline.`
      )
      .action(async options => {
        await this.handleCreatePullRequestComment(options);
      });

    // Update pull request comment command
    prCommand
      .command('update-comment')
      .description('Atualiza um comentário existente')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID do pull request')
      .requiredOption('-c, --comment-id <id>', 'ID do comentário')
      .requiredOption('--content <content>', 'Novo conteúdo do comentário')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID do pull request
- \`-c, --comment-id\`: ID do comentário
- \`--content\`: Novo conteúdo do comentário

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request update-comment --workspace my-company --repo-slug my-project --id 123 --comment-id 456 --content "Updated comment"
  $ npx -y @guerchele/bitbucket-mcp-server pull-request update-comment --workspace my-company --repo-slug my-project --id 123 --comment-id 456 --content "Updated comment" --output json

**Descrição:**
  Atualiza o conteúdo de um comentário existente em um pull request.`
      )
      .action(async options => {
        await this.handleUpdatePullRequestComment(options);
      });

    // Delete pull request comment command
    prCommand
      .command('delete-comment')
      .description('Exclui um comentário de um pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID do pull request')
      .requiredOption('-c, --comment-id <id>', 'ID do comentário')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID do pull request
- \`-c, --comment-id\`: ID do comentário

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request delete-comment --workspace my-company --repo-slug my-project --id 123 --comment-id 456
  $ npx -y @guerchele/bitbucket-mcp-server pull-request delete-comment --workspace my-company --repo-slug my-project --id 123 --comment-id 456 --output json

**Descrição:**
  Exclui um comentário de um pull request. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeletePullRequestComment(options);
      });

    // List pull request activities command
    prCommand
      .command('list-activities')
      .description('Lista atividades de um pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID do pull request')
      .option('--page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID do pull request

**Opções disponíveis:**
- \`--page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list-activities --workspace my-company --repo-slug my-project --id 123
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list-activities --workspace my-company --repo-slug my-project --id 123 --page 2

**Descrição:**
  Lista todas as atividades de um pull request, incluindo comentários, aprovações e mudanças de status.`
      )
      .action(async options => {
        await this.handleListPullRequestActivities(options);
      });

    // List pull request statuses command
    prCommand
      .command('list-statuses')
      .description('Lista status de um pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID do pull request')
      .option('--page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID do pull request

**Opções disponíveis:**
- \`--page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list-statuses --workspace my-company --repo-slug my-project --id 123
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list-statuses --workspace my-company --repo-slug my-project --id 123 --page 2

**Descrição:**
  Lista todos os status de build/CI de um pull request específico.`
      )
      .action(async options => {
        await this.handleListPullRequestStatuses(options);
      });

    // Create pull request status command
    prCommand
      .command('create-status')
      .description('Cria um novo status para um pull request')
      .requiredOption('-w, --workspace <workspace>', 'Workspace')
      .requiredOption('-r, --repo <repo-slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID do pull request')
      .requiredOption(
        '-s, --state <state>',
        'Estado do status (SUCCESSFUL, FAILED, INPROGRESS, STOPPED)'
      )
      .requiredOption('-k, --key <key>', 'Chave única do status')
      .requiredOption('-n, --name <name>', 'Nome do status')
      .option('-d, --description <description>', 'Descrição do status')
      .option('-u, --url <url>', 'URL relacionada ao status')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID do pull request
- \`-s, --state\`: Estado do status (SUCCESSFUL, FAILED, INPROGRESS, STOPPED)
- \`-k, --key\`: Chave única do status
- \`-n, --name\`: Nome do status

**Opções disponíveis:**
- \`-d, --description\`: Descrição do status
- \`-u, --url\`: URL relacionada ao status
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request create-status --workspace my-company --repo-slug my-project --id 123 --state SUCCESSFUL --key "build" --name "Build Status"
  $ npx -y @guerchele/bitbucket-mcp-server pull-request create-status --workspace my-company --repo-slug my-project --id 123 --state FAILED --key "test" --name "Test Status" --description "Tests failed"

**Descrição:**
  Cria um novo status de build/CI para um pull request específico.`
      )
      .action(async options => {
        await this.handleCreatePullRequestStatus(options);
      });

    registerLogger.info('Successfully registered all cloud pull request commands');
  }
}
