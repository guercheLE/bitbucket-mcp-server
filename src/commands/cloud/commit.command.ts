import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { CommitService } from '../../services/cloud/commit.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';

/**
 * Commit Commands for Bitbucket Cloud CLI
 *
 * Provides command line interface for commit operations including:
 * - Get commit details
 * - Approve/unapprove commits
 * - Manage commit comments
 * - List commits
 * - Compare commits
 * - Get commit statistics
 */
export class CloudCommitCommands {
  private static logger = Logger.forContext('CloudCommitCommands');

  // Métodos estáticos para lidar com ações dos comandos
  private static async handleGetCommit(commit: string, options: any): Promise<void> {
    try {
      this.logger.info(`Getting commit: ${commit}`);
      const commitService = new CommitService(new ApiClient());
      const result = await commitService.getCommit({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        commit,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get commit:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleApproveCommit(commit: string, options: any): Promise<void> {
    try {
      this.logger.info(`Approving commit: ${commit}`);
      const commitService = new CommitService(new ApiClient());
      await commitService.approveCommit({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        commit,
      });
      const mcpResponse = createMcpResponse(
        { message: 'Commit approved successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to approve commit:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleUnapproveCommit(commit: string, options: any): Promise<void> {
    try {
      this.logger.info(`Unapproving commit: ${commit}`);
      const commitService = new CommitService(new ApiClient());
      await commitService.unapproveCommit({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        commit,
      });
      const mcpResponse = createMcpResponse(
        { message: 'Commit unapproved successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to unapprove commit:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleListCommitComments(commit: string, options: any): Promise<void> {
    try {
      this.logger.info(`Listing commit comments for: ${commit}`);
      const commitService = new CommitService(new ApiClient());
      const result = await commitService.listCommitComments({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        commit,
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list commit comments:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleListCommits(options: any): Promise<void> {
    try {
      this.logger.info('Listing commits');
      const commitService = new CommitService(new ApiClient());
      const result = await commitService.listCommits({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
        include: options.include,
        exclude: options.exclude,
        q: options.query,
        sort: options.sort,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list commits:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleCompareCommits(spec: string, options: any): Promise<void> {
    try {
      this.logger.info(`Comparing commits: ${spec}`);
      const commitService = new CommitService(new ApiClient());
      const result = await commitService.compareCommits({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        spec,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to compare commits:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleCreateCommitComment(commit: string, options: any): Promise<void> {
    try {
      this.logger.info(`Creating commit comment for: ${commit}`);
      const commitService = new CommitService(new ApiClient());

      const result = await commitService.createCommitComment({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        commit,
        content: options.content,
        inline:
          options.line || options.path
            ? {
                to: options.line ? parseInt(options.line) : undefined,
                path: options.path,
              }
            : undefined,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create commit comment:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetCommitComment(
    commit: string,
    commentId: string,
    options: any
  ): Promise<void> {
    try {
      this.logger.info(`Getting commit comment: ${commentId} for commit: ${commit}`);
      const commitService = new CommitService(new ApiClient());
      const result = await commitService.getCommitComment({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        commit,
        comment_id: parseInt(commentId),
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get commit comment:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleUpdateCommitComment(
    commit: string,
    commentId: string,
    options: any
  ): Promise<void> {
    try {
      this.logger.info(`Updating commit comment: ${commentId} for commit: ${commit}`);
      const commitService = new CommitService(new ApiClient());
      const result = await commitService.updateCommitComment({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        commit,
        comment_id: parseInt(commentId),
        content: options.content,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to update commit comment:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleDeleteCommitComment(
    commit: string,
    commentId: string,
    options: any
  ): Promise<void> {
    try {
      this.logger.info(`Deleting commit comment: ${commentId} for commit: ${commit}`);
      const commitService = new CommitService(new ApiClient());
      await commitService.deleteCommitComment({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        commit,
        comment_id: parseInt(commentId),
      });
      const mcpResponse = createMcpResponse(
        { message: 'Commit comment deleted successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to delete commit comment:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleListCommitsForRevision(revision: string, options: any): Promise<void> {
    try {
      this.logger.info(`Listing commits for revision: ${revision}`);
      const commitService = new CommitService(new ApiClient());
      const result = await commitService.listCommitsForRevision({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        revision,
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list commits for revision:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetCommitDiffStats(commit: string, options: any): Promise<void> {
    try {
      this.logger.info(`Getting commit diff stats for: ${commit}`);
      const commitService = new CommitService(new ApiClient());
      const result = await commitService.getCommitDiffStats({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        spec: commit,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get commit diff stats:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetCommonAncestor(
    commit1: string,
    commit2: string,
    options: any
  ): Promise<void> {
    try {
      this.logger.info(`Getting common ancestor between: ${commit1} and ${commit2}`);
      const commitService = new CommitService(new ApiClient());
      const result = await commitService.getCommonAncestor({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        spec: `${commit1}..${commit2}`,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get common ancestor:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetCommitPatch(commit: string, options: any): Promise<void> {
    try {
      this.logger.info(`Getting commit patch for: ${commit}`);
      const commitService = new CommitService(new ApiClient());
      const result = await commitService.getCommitPatch({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        spec: commit,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get commit patch:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Register all commit commands with the CLI program
   */
  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de commit');

    const commitCommand = program
      .command('commit')
      .description('Comandos de commit do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server commit <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Get commit command
    commitCommand
      .command('get')
      .description('Obtém detalhes de um commit específico')
      .argument('<commit>', 'Hash ou identificador do commit')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`commit\`: Hash ou identificador do commit

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit get abc123 --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit get def456 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit get abc123 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Obtém informações detalhadas de um commit específico, incluindo
  metadados do autor, data, hash, mensagem e estatísticas de mudanças.`
      )
      .action(async (commit, options) => {
        await this.handleGetCommit(commit, options);
      });

    // Approve commit command
    commitCommand
      .command('approve')
      .description('Aprova um commit específico')
      .argument('<commit>', 'Hash ou identificador do commit')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`commit\`: Hash ou identificador do commit

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit approve abc123 --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit approve def456 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit approve abc123 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Aprova um commit específico, indicando que o código está pronto
  para ser integrado ao branch de destino.`
      )
      .action(async (commit, options) => {
        await this.handleApproveCommit(commit, options);
      });

    // Unapprove commit command
    commitCommand
      .command('unapprove')
      .description('Remove a aprovação de um commit específico')
      .argument('<commit>', 'Hash ou identificador do commit')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`commit\`: Hash ou identificador do commit

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit unapprove abc123 --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit unapprove def456 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit unapprove abc123 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Remove a aprovação de um commit específico, revertendo a decisão
  de revisão anterior.`
      )
      .action(async (commit, options) => {
        await this.handleUnapproveCommit(commit, options);
      });

    // List commit comments command
    commitCommand
      .command('list-comments')
      .description('Lista comentários de um commit específico')
      .argument('<commit>', 'Hash ou identificador do commit')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`commit\`: Hash ou identificador do commit

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit list-comments abc123 --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit list-comments def456 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit list-comments abc123 --workspace my-company --repo-slug my-project --page 2
  $ npx -y @guerchele/bitbucket-mcp-server commit list-comments abc123 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista todos os comentários associados a um commit específico,
  incluindo comentários inline e gerais.`
      )
      .action(async (commit, options) => {
        await this.handleListCommitComments(commit, options);
      });

    // List commits command
    commitCommand
      .command('list')
      .description('Lista commits de um repositório')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--include <fields>', 'Campos a incluir')
      .option('--exclude <fields>', 'Campos a excluir')
      .option('-q, --query <query>', 'Query de busca')
      .option('-s, --sort <field>', 'Campo de ordenação')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--include\`: Campos a incluir
- \`--exclude\`: Campos a excluir
- \`-q, --query\`: Query de busca
- \`-s, --sort\`: Campo de ordenação
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit list --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit list --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit list --workspace my-company --repo-slug my-project --page 2
  $ npx -y @guerchele/bitbucket-mcp-server commit list --workspace my-company --repo-slug my-project --query "fix"
  $ npx -y @guerchele/bitbucket-mcp-server commit list --workspace my-company --repo-slug my-project --sort "created_on"
  $ npx -y @guerchele/bitbucket-mcp-server commit list --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista commits de um repositório com opções de paginação,
  filtros e ordenação.`
      )
      .action(async options => {
        await this.handleListCommits(options);
      });

    // Compare commits command
    commitCommand
      .command('compares')
      .description('Compara dois commits')
      .argument('<spec>', 'Especificação dos commits (ex: "main..feature")')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`spec\`: Especificação dos commits (ex: "main..feature", "abc123..def456")

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit compares "main..feature" --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit compares "abc123..def456" --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit compares "develop..hotfix" --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit compares "main..feature" --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Compara dois commits e retorna informações sobre as diferenças
  entre eles, incluindo arquivos modificados e estatísticas.`
      )
      .action(async (spec, options) => {
        await this.handleCompareCommits(spec, options);
      });

    // Create commit comment command
    commitCommand
      .command('create-comment')
      .description('Cria um comentário em um commit')
      .argument('<commit>', 'Hash ou identificador do commit')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-c, --content <content>', 'Conteúdo do comentário')
      .option('-l, --line <line>', 'Número da linha para comentário inline')
      .option('-p, --path <path>', 'Caminho do arquivo para comentário inline')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`commit\`: Hash ou identificador do commit

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório
- \`-c, --content\`: Conteúdo do comentário

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`-l, --line\`: Número da linha para comentário inline
- \`-p, --path\`: Caminho do arquivo para comentário inline
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit create-comment abc123 --repo-slug my-project --content "Ótimo trabalho!"
  $ npx -y @guerchele/bitbucket-mcp-server commit create-comment def456 --workspace my-company --repo-slug my-project --content "Precisa revisar esta linha" --line 42 --path "src/app.js"
  $ npx -y @guerchele/bitbucket-mcp-server commit create-comment abc123 --workspace my-company --repo-slug my-project --content "Comentário geral" --output json

**Descrição:**
  Cria um comentário em um commit específico. Pode ser um comentário geral
  ou um comentário inline em uma linha específica de um arquivo.`
      )
      .action(async (commit, options) => {
        await this.handleCreateCommitComment(commit, options);
      });

    // Get commit comment command
    commitCommand
      .command('get-comment')
      .description('Obtém detalhes de um comentário de commit')
      .argument('<commit>', 'Hash ou identificador do commit')
      .argument('<comment-id>', 'ID do comentário')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`commit\`: Hash ou identificador do commit
- \`comment-id\`: ID do comentário

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit get-comment abc123 12345 --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit get-comment def456 67890 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit get-comment abc123 12345 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Obtém informações detalhadas de um comentário específico de um commit,
  incluindo conteúdo, autor, data de criação e metadados.`
      )
      .action(async (commit, commentId, options) => {
        await this.handleGetCommitComment(commit, commentId, options);
      });

    // Update commit comment command
    commitCommand
      .command('update-comment')
      .description('Atualiza um comentário de commit')
      .argument('<commit>', 'Hash ou identificador do commit')
      .argument('<comment-id>', 'ID do comentário')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-c, --content <content>', 'Novo conteúdo do comentário')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`commit\`: Hash ou identificador do commit
- \`comment-id\`: ID do comentário

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório
- \`-c, --content\`: Novo conteúdo do comentário

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit update-comment abc123 12345 --repo-slug my-project --content "Comentário atualizado"
  $ npx -y @guerchele/bitbucket-mcp-server commit update-comment def456 67890 --workspace my-company --repo-slug my-project --content "Novo conteúdo do comentário"
  $ npx -y @guerchele/bitbucket-mcp-server commit update-comment abc123 12345 --workspace my-company --repo-slug my-project --content "Comentário corrigido" --output json

**Descrição:**
  Atualiza o conteúdo de um comentário existente em um commit.
  Apenas o autor do comentário pode editá-lo.`
      )
      .action(async (commit, commentId, options) => {
        await this.handleUpdateCommitComment(commit, commentId, options);
      });

    // Delete commit comment command
    commitCommand
      .command('delete-comment')
      .description('Exclui um comentário de commit')
      .argument('<commit>', 'Hash ou identificador do commit')
      .argument('<comment-id>', 'ID do comentário')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`commit\`: Hash ou identificador do commit
- \`comment-id\`: ID do comentário

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit delete-comment abc123 12345 --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit delete-comment def456 67890 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit delete-comment abc123 12345 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Exclui permanentemente um comentário de um commit.
  Apenas o autor do comentário ou administradores podem excluí-lo.`
      )
      .action(async (commit, commentId, options) => {
        await this.handleDeleteCommitComment(commit, commentId, options);
      });

    // List commits for revision command
    commitCommand
      .command('lists-for-revision')
      .description('Lista commits para uma revisão específica')
      .argument('<revision>', 'Hash ou identificador da revisão')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`revision\`: Hash ou identificador da revisão

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit lists-for-revision abc123 --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit lists-for-revision def456 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit lists-for-revision abc123 --workspace my-company --repo-slug my-project --page 2
  $ npx -y @guerchele/bitbucket-mcp-server commit lists-for-revision abc123 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista todos os commits que fazem parte de uma revisão específica,
  incluindo commits de merge e commits individuais.`
      )
      .action(async (revision, options) => {
        await this.handleListCommitsForRevision(revision, options);
      });

    // Get commit diff stats command
    commitCommand
      .command('get-diff-stats')
      .description('Obtém estatísticas de diff de um commit')
      .argument('<commit>', 'Hash ou identificador do commit')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`commit\`: Hash ou identificador do commit

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit get-diff-stats abc123 --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit get-diff-stats def456 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit get-diff-stats abc123 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Obtém estatísticas detalhadas das mudanças em um commit,
  incluindo número de linhas adicionadas, removidas e modificadas.`
      )
      .action(async (commit, options) => {
        await this.handleGetCommitDiffStats(commit, options);
      });

    // Get common ancestor command
    commitCommand
      .command('get-common-ancestor')
      .description('Encontra o ancestral comum entre dois commits')
      .argument('<commit1>', 'Primeiro commit')
      .argument('<commit2>', 'Segundo commit')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`commit1\`: Hash ou identificador do primeiro commit
- \`commit2\`: Hash ou identificador do segundo commit

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit get-common-ancestor abc123 def456 --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit get-common-ancestor abc123 def456 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit get-common-ancestor abc123 def456 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Encontra o commit ancestral comum entre dois commits específicos.
  Útil para determinar o ponto de divergência entre branches.`
      )
      .action(async (commit1, commit2, options) => {
        await this.handleGetCommonAncestor(commit1, commit2, options);
      });

    // Get commit patch command
    commitCommand
      .command('get-patch')
      .description('Obtém patch de um commit')
      .argument('<commit>', 'Hash ou identificador do commit')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`commit\`: Hash ou identificador do commit

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server commit get-patch abc123 --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit get-patch def456 --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server commit get-patch abc123 --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Obtém o patch completo de um commit, mostrando todas as mudanças
  em formato de patch unificado (diff).`
      )
      .action(async (commit, options) => {
        await this.handleGetCommitPatch(commit, options);
      });

    registerLogger.info('Successfully registered all cloud commit commands');
  }
}
