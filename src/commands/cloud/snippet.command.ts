import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { SnippetService } from '../../services/cloud/snippet.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';

/**
 * Snippet Commands for Bitbucket Cloud CLI
 *
 * Provides command line interface for snippet operations including:
 * - Get snippet details
 * - List snippets
 * - Create/update/delete snippets
 * - Manage snippet comments
 * - Watch snippets
 * - Get snippet files and revisions
 */
export class CloudSnippetCommands {
  private static logger = Logger.forContext('CloudSnippetCommands');

  /**
   * Handle get snippet command
   */
  private static async handleGetSnippet(options: any): Promise<void> {
    try {
      this.logger.info(`Getting snippet: ${options.id}`);
      const snippetService = new SnippetService(new ApiClient());
      const result = await snippetService.getSnippet({
        workspace: options.workspace,
        encoded_id: options.id,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get snippet:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle list snippets command
   */
  private static async handleListSnippets(options: any): Promise<void> {
    try {
      this.logger.info('Listing snippets');
      const snippetService = new SnippetService(new ApiClient());

      let result;
      if (options.workspace) {
        result = await snippetService.listWorkspaceSnippets({
          workspace: options.workspace,
          page: options.page ? parseInt(options.page) : undefined,
          pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
          role: options.role,
        });
      } else {
        result = await snippetService.listSnippets({
          page: options.page ? parseInt(options.page) : undefined,
          pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
          role: options.role,
        });
      }

      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list snippets:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle create snippet command
   */
  private static async handleCreateSnippet(options: any): Promise<void> {
    try {
      this.logger.info(`Creating snippet: ${options.title}`);
      const snippetService = new SnippetService(new ApiClient());

      const request = {
        title: options.title,
        description: options.description,
        is_private: options.isPrivate,
        scm: 'git',
        files: {
          [options.filename || 'file.txt']: {
            content: options.content || '// Snippet content',
          },
        },
      };

      let result;
      if (options.workspace) {
        result = await snippetService.createWorkspaceSnippet({
          workspace: options.workspace,
          snippet: request,
        });
      } else {
        result = await snippetService.createSnippet({ snippet: request });
      }

      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create snippet:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle list snippet comments command
   */
  private static async handleListSnippetComments(options: any): Promise<void> {
    try {
      this.logger.info(`Listing snippet comments: ${options.id}`);
      const snippetService = new SnippetService(new ApiClient());
      const result = await snippetService.listSnippetComments({
        workspace: options.workspace,
        encoded_id: options.id,
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list snippet comments:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle watch snippet command
   */
  private static async handleWatchSnippet(options: any): Promise<void> {
    try {
      this.logger.info(`Watching snippet: ${options.id}`);
      const snippetService = new SnippetService(new ApiClient());
      await snippetService.watchSnippet({
        workspace: options.workspace,
        encoded_id: options.id,
      });
      const mcpResponse = createMcpResponse(
        { message: 'Started watching snippet successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to watch snippet:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle stop watching snippet command
   */
  private static async handleStopWatchingSnippet(options: any): Promise<void> {
    try {
      this.logger.info(`Stopping watching snippet: ${options.id}`);
      const snippetService = new SnippetService(new ApiClient());
      await snippetService.stopWatchingSnippet({
        workspace: options.workspace,
        encoded_id: options.id,
      });
      const mcpResponse = createMcpResponse(
        { message: 'Stopped watching snippet successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to stop watching snippet:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle list snippet watchers command
   */
  private static async handleListSnippetWatchers(options: any): Promise<void> {
    try {
      this.logger.info(`Listing snippet watchers: ${options.id}`);
      const snippetService = new SnippetService(new ApiClient());
      const result = await snippetService.listSnippetWatchers({
        workspace: options.workspace,
        encoded_id: options.id,
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list snippet watchers:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle update snippet command
   */
  private static async handleUpdateSnippet(options: any): Promise<void> {
    try {
      this.logger.info(`Updating snippet: ${options.id}`);
      const snippetService = new SnippetService(new ApiClient());

      const updateData: any = {};
      if (options.title) updateData.title = options.title;
      if (options.description) updateData.description = options.description;
      if (options.isPrivate !== undefined) updateData.is_private = options.isPrivate;

      const result = await snippetService.updateSnippet({
        workspace: options.workspace,
        encoded_id: options.id,
        snippet: updateData,
      });

      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to update snippet:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle delete snippet command
   */
  private static async handleDeleteSnippet(options: any): Promise<void> {
    try {
      this.logger.info(`Deleting snippet: ${options.id}`);
      const snippetService = new SnippetService(new ApiClient());

      await snippetService.deleteSnippet({
        workspace: options.workspace,
        encoded_id: options.id,
      });

      const mcpResponse = createMcpResponse(
        { message: 'Snippet deleted successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to delete snippet:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle create snippet comment command
   */
  private static async handleCreateSnippetComment(options: any): Promise<void> {
    try {
      this.logger.info(`Creating comment for snippet: ${options.id}`);
      const snippetService = new SnippetService(new ApiClient());

      const result = await snippetService.createSnippetComment({
        workspace: options.workspace,
        encoded_id: options.id,
        comment: {
          content: options.content,
          inline: options.inline,
        },
      });

      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create snippet comment:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle get snippet comment command
   */
  private static async handleGetSnippetComment(options: any): Promise<void> {
    try {
      this.logger.info(`Getting comment ${options.commentId} for snippet: ${options.id}`);
      const snippetService = new SnippetService(new ApiClient());

      const result = await snippetService.getSnippetComment({
        workspace: options.workspace,
        encoded_id: options.id,
        comment_id: options.commentId,
      });

      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get snippet comment:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle list snippet changes command
   */
  private static async handleListSnippetChanges(options: any): Promise<void> {
    try {
      this.logger.info(`Listing changes for snippet: ${options.id}`);
      const snippetService = new SnippetService(new ApiClient());

      const result = await snippetService.listSnippetChanges({
        workspace: options.workspace,
        encoded_id: options.id,
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
      });

      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list snippet changes:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle get snippet file command
   */
  private static async handleGetSnippetFile(options: any): Promise<void> {
    try {
      this.logger.info(`Getting file ${options.path} from snippet: ${options.id}`);
      const snippetService = new SnippetService(new ApiClient());

      const result = await snippetService.getSnippetFile({
        workspace: options.workspace,
        encoded_id: options.id,
        path: options.path,
        node_id: options.nodeId,
      });

      const mcpResponse = createMcpResponse(
        { content: result },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get snippet file:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle is watching snippet command
   */
  private static async handleIsWatchingSnippet(options: any): Promise<void> {
    try {
      this.logger.info(`Checking if watching snippet: ${options.id}`);
      const snippetService = new SnippetService(new ApiClient());

      const isWatching = await snippetService.isWatchingSnippet({
        workspace: options.workspace,
        encoded_id: options.id,
      });

      const mcpResponse = createMcpResponse({ isWatching }, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to check if watching snippet:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Register all snippet commands with the CLI program
   */
  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de snippet');

    const snippetCommand = program
      .command('snippet')
      .description('Comandos de snippets do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server snippet <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Get snippet command
    snippetCommand
      .command('get')
      .description('Obtém detalhes de um snippet específico')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-i, --id <id>', 'ID codificado do snippet')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-i, --id\`: ID codificado do snippet

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet get --workspace my-company --id abc123
  $ npx -y @guerchele/bitbucket-mcp-server snippet get --workspace my-company --id abc123 --output json

**Descrição:**
  Obtém informações detalhadas de um snippet específico, incluindo
  metadados, arquivos e configurações.`
      )
      .action(async options => {
        await this.handleGetSnippet(options);
      });

    // List snippets command
    snippetCommand
      .command('list')
      .description('Lista snippets')
      .option('-w, --workspace <workspace>', 'Slug do workspace (opcional)')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--role <role>', 'Filtrar por role (owner, admin, member, contributor)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-w, --workspace\`: Slug do workspace (opcional)
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--role\`: Filtrar por role (owner, admin, member, contributor)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet list
  $ npx -y @guerchele/bitbucket-mcp-server snippet list --workspace my-company
  $ npx -y @guerchele/bitbucket-mcp-server snippet list --workspace my-company --page 2
  $ npx -y @guerchele/bitbucket-mcp-server snippet list --workspace my-company --role owner
  $ npx -y @guerchele/bitbucket-mcp-server snippet list --workspace my-company --output json

**Descrição:**
  Lista snippets com opções de paginação e filtros.
  Se workspace for especificado, lista apenas snippets desse workspace.`
      )
      .action(async options => {
        await this.handleListSnippets(options);
      });

    // Create snippet command
    snippetCommand
      .command('create')
      .description('Cria um novo snippet')
      .option('-w, --workspace <workspace>', 'Slug do workspace (opcional)')
      .requiredOption('-t, --title <title>', 'Título do snippet')
      .option('-d, --description <description>', 'Descrição do snippet')
      .option('--is-private', 'Snippet privado')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --title\`: Título do snippet

**Opções disponíveis:**
- \`-w, --workspace\`: Slug do workspace (opcional)
- \`-d, --description\`: Descrição do snippet
- \`--is-private\`: Snippet privado
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet create --title "My Code Snippet"
  $ npx -y @guerchele/bitbucket-mcp-server snippet create --workspace my-company --title "My Code Snippet"
  $ npx -y @guerchele/bitbucket-mcp-server snippet create --title "My Code Snippet" --description "A useful code snippet"
  $ npx -y @guerchele/bitbucket-mcp-server snippet create --title "My Code Snippet" --is-private

**Descrição:**
  Cria um novo snippet com as configurações especificadas.
  Nota: Este comando cria um snippet básico. Para adicionar arquivos,
  use a API diretamente ou a interface web.`
      )
      .action(async options => {
        await this.handleCreateSnippet(options);
      });

    // List snippet comments command
    snippetCommand
      .command('list-comments')
      .description('Lista comentários de um snippet')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-i, --id <id>', 'ID codificado do snippet')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-i, --id\`: ID codificado do snippet

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet list-comments --workspace my-company --id abc123
  $ npx -y @guerchele/bitbucket-mcp-server snippet list-comments --workspace my-company --id abc123 --page 2
  $ npx -y @guerchele/bitbucket-mcp-server snippet list-comments --workspace my-company --id abc123 --output json

**Descrição:**
  Lista comentários de um snippet com opções de paginação.`
      )
      .action(async options => {
        await this.handleListSnippetComments(options);
      });

    // Watch snippet command
    snippetCommand
      .command('watch')
      .description('Observa um snippet')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-i, --id <id>', 'ID codificado do snippet')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-i, --id\`: ID codificado do snippet

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet watch --workspace my-company --id abc123
  $ npx -y @guerchele/bitbucket-mcp-server snippet watch --workspace my-company --id abc123 --output json

**Descrição:**
  Adiciona o usuário atual como observador de um snippet.`
      )
      .action(async options => {
        await this.handleWatchSnippet(options);
      });

    // Stop watching snippet command
    snippetCommand
      .command('stop-watching')
      .description('Para de observar um snippet')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-i, --id <id>', 'ID codificado do snippet')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-i, --id\`: ID codificado do snippet

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet stop-watching --workspace my-company --id abc123
  $ npx -y @guerchele/bitbucket-mcp-server snippet stop-watching --workspace my-company --id abc123 --output json

**Descrição:**
  Remove o usuário atual dos observadores de um snippet.`
      )
      .action(async options => {
        await this.handleStopWatchingSnippet(options);
      });

    // List snippet watchers command
    snippetCommand
      .command('list-watchers')
      .description('Lista observadores de um snippet')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-i, --id <id>', 'ID codificado do snippet')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-i, --id\`: ID codificado do snippet

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet list-watchers --workspace my-company --id abc123
  $ npx -y @guerchele/bitbucket-mcp-server snippet list-watchers --workspace my-company --id abc123 --page 2
  $ npx -y @guerchele/bitbucket-mcp-server snippet list-watchers --workspace my-company --id abc123 --output json

**Descrição:**
  Lista usuários que estão observando um snippet.`
      )
      .action(async options => {
        await this.handleListSnippetWatchers(options);
      });

    // Update snippet command
    snippetCommand
      .command('update')
      .description('Atualiza um snippet existente')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-i, --id <id>', 'ID codificado do snippet')
      .option('-t, --title <title>', 'Novo título do snippet')
      .option('-d, --description <description>', 'Nova descrição do snippet')
      .option('--is-private', 'Tornar snippet privado')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-i, --id\`: ID codificado do snippet

**Opções disponíveis:**
- \`-t, --title\`: Novo título do snippet
- \`-d, --description\`: Nova descrição do snippet
- \`--is-private\`: Tornar snippet privado
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet update --workspace my-company --id abc123 --title "Updated Title"
  $ npx -y @guerchele/bitbucket-mcp-server snippet update --workspace my-company --id abc123 --description "New description"
  $ npx -y @guerchele/bitbucket-mcp-server snippet update --workspace my-company --id abc123 --is-private

**Descrição:**
  Atualiza as propriedades de um snippet existente.`
      )
      .action(async options => {
        await this.handleUpdateSnippet(options);
      });

    // Delete snippet command
    snippetCommand
      .command('delete')
      .description('Deleta um snippet')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-i, --id <id>', 'ID codificado do snippet')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-i, --id\`: ID codificado do snippet

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet delete --workspace my-company --id abc123
  $ npx -y @guerchele/bitbucket-mcp-server snippet delete --workspace my-company --id abc123 --output json

**Descrição:**
  Remove permanentemente um snippet. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteSnippet(options);
      });

    // Create comment command
    snippetCommand
      .command('create-comment')
      .description('Cria um comentário em um snippet')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-i, --id <id>', 'ID codificado do snippet')
      .requiredOption('-c, --content <content>', 'Conteúdo do comentário')
      .option('--inline', 'Comentário inline')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-i, --id\`: ID codificado do snippet
- \`-c, --content\`: Conteúdo do comentário

**Opções disponíveis:**
- \`--inline\`: Comentário inline
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet create-comment --workspace my-company --id abc123 --content "Great snippet!"
  $ npx -y @guerchele/bitbucket-mcp-server snippet create-comment --workspace my-company --id abc123 --content "Inline comment" --inline

**Descrição:**
  Adiciona um novo comentário a um snippet.`
      )
      .action(async options => {
        await this.handleCreateSnippetComment(options);
      });

    // Get comment command
    snippetCommand
      .command('get-comment')
      .description('Obtém um comentário específico de um snippet')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-i, --id <id>', 'ID codificado do snippet')
      .requiredOption('-c, --comment-id <commentId>', 'ID do comentário')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-i, --id\`: ID codificado do snippet
- \`-c, --comment-id\`: ID do comentário

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet get-comment --workspace my-company --id abc123 --comment-id 123
  $ npx -y @guerchele/bitbucket-mcp-server snippet get-comment --workspace my-company --id abc123 --comment-id 123 --output json

**Descrição:**
  Obtém detalhes de um comentário específico de um snippet.`
      )
      .action(async options => {
        await this.handleGetSnippetComment(options);
      });

    // List changes command
    snippetCommand
      .command('list-changes')
      .description('Lista mudanças/commits de um snippet')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-i, --id <id>', 'ID codificado do snippet')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-i, --id\`: ID codificado do snippet

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet list-changes --workspace my-company --id abc123
  $ npx -y @guerchele/bitbucket-mcp-server snippet list-changes --workspace my-company --id abc123 --page 2
  $ npx -y @guerchele/bitbucket-mcp-server snippet list-changes --workspace my-company --id abc123 --output json

**Descrição:**
  Lista o histórico de mudanças/commits de um snippet.`
      )
      .action(async options => {
        await this.handleListSnippetChanges(options);
      });

    // Get file command
    snippetCommand
      .command('get-file')
      .description('Obtém conteúdo de um arquivo do snippet')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-i, --id <id>', 'ID codificado do snippet')
      .requiredOption('-p, --path <path>', 'Caminho do arquivo')
      .option('-n, --node-id <nodeId>', 'ID do nó/revisão específica')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-i, --id\`: ID codificado do snippet
- \`-p, --path\`: Caminho do arquivo

**Opções disponíveis:**
- \`-n, --node-id\`: ID do nó/revisão específica
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet get-file --workspace my-company --id abc123 --path "main.js"
  $ npx -y @guerchele/bitbucket-mcp-server snippet get-file --workspace my-company --id abc123 --path "main.js" --node-id "abc123"
  $ npx -y @guerchele/bitbucket-mcp-server snippet get-file --workspace my-company --id abc123 --path "main.js" --output json

**Descrição:**
  Obtém o conteúdo de um arquivo específico de um snippet.`
      )
      .action(async options => {
        await this.handleGetSnippetFile(options);
      });

    // Is watching command
    snippetCommand
      .command('is-watching')
      .description('Verifica se o usuário está observando um snippet')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-i, --id <id>', 'ID codificado do snippet')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-i, --id\`: ID codificado do snippet

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server snippet is-watching --workspace my-company --id abc123
  $ npx -y @guerchele/bitbucket-mcp-server snippet is-watching --workspace my-company --id abc123 --output json

**Descrição:**
  Verifica se o usuário atual está observando o snippet especificado.`
      )
      .action(async options => {
        await this.handleIsWatchingSnippet(options);
      });

    registerLogger.info('Successfully registered all cloud snippet commands');
  }
}
