import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { IssueService } from '../../services/cloud/issue.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';

/**
 * Issue Commands for Bitbucket Cloud CLI
 *
 * Provides command line interface for issue operations including:
 * - Get issue details
 * - List issues
 * - Create/update/delete issues
 * - Manage issue comments
 * - Vote and watch issues
 * - Manage components, milestones, and versions
 */
export class CloudIssueCommands {
  private static logger = Logger.forContext('CloudIssueCommands');

  // Métodos estáticos para lidar com ações dos comandos
  private static async handleGetIssue(options: any): Promise<void> {
    try {
      this.logger.info(`Getting issue: ${options.id}`);
      const issueService = new IssueService(new ApiClient());
      const result = await issueService.getIssue({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        issue_id: options.id,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get issue:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleListIssues(options: any): Promise<void> {
    try {
      this.logger.info('Listing issues');
      const issueService = new IssueService(new ApiClient());
      const result = await issueService.listIssues({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
        q: options.query,
        sort: options.sort,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list issues:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleCreateIssue(options: any): Promise<void> {
    try {
      this.logger.info('Creating issue');
      const issueService = new IssueService(new ApiClient());
      const issueData: any = {
        title: options.title,
        content: options.content,
        kind: options.kind || 'bug',
        priority: options.priority || 'major',
        state: options.state || 'new',
      };

      if (options.assignee) issueData.assignee = { username: options.assignee };
      if (options.component) issueData.component = { name: options.component };
      if (options.milestone) issueData.milestone = { name: options.milestone };
      if (options.version) issueData.version = { name: options.version };

      const result = await issueService.createIssue({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        issue: issueData,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create issue:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleUpdateIssue(options: any): Promise<void> {
    try {
      this.logger.info(`Updating issue: ${options.id}`);
      const issueService = new IssueService(new ApiClient());
      const issueData: any = {};

      if (options.title) issueData.title = options.title;
      if (options.content) issueData.content = options.content;
      if (options.kind) issueData.kind = options.kind;
      if (options.priority) issueData.priority = options.priority;
      if (options.state) issueData.state = options.state;
      if (options.assignee) issueData.assignee = { username: options.assignee };
      if (options.component) issueData.component = { name: options.component };
      if (options.milestone) issueData.milestone = { name: options.milestone };
      if (options.version) issueData.version = { name: options.version };

      const result = await issueService.updateIssue({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        issue_id: options.id,
        issue: issueData,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to update issue:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleDeleteIssue(options: any): Promise<void> {
    try {
      this.logger.info(`Deleting issue: ${options.id}`);
      const issueService = new IssueService(new ApiClient());
      await issueService.deleteIssue({
        workspace: options.workspace,
        repo_slug: options.repoSlug,
        issue_id: options.id,
      });
      const mcpResponse = createMcpResponse(
        { message: 'Issue deleted successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to delete issue:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Register all issue commands with the CLI program
   */
  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de issue');

    const issueCommand = program
      .command('issue')
      .description('Comandos de issues do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server issue <command> --help' para mais informações sobre um comando específico.
`
      );

    // Get issue command
    issueCommand
      .command('get')
      .description('Obtém detalhes de uma issue específica')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da issue')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID da issue

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue get --workspace my-company --repo-slug my-project --id 123
  $ npx -y @guerchele/bitbucket-mcp-server issue get --workspace my-company --repo-slug my-project --id 123 --output json

**Descrição:**
  Obtém informações detalhadas de uma issue específica, incluindo
  metadados, comentários, status e atribuições.`
      )
      .action(async options => {
        await this.handleGetIssue(options);
      });

    // List issues command
    issueCommand
      .command('list')
      .description('Lista issues de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('-q, --query <query>', 'Query de busca')
      .option('-s, --sort <field>', 'Campo de ordenação')
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
- \`-q, --query\`: Query de busca
- \`-s, --sort\`: Campo de ordenação
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue list --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server issue list --workspace my-company --repo-slug my-project --page 2
  $ npx -y @guerchele/bitbucket-mcp-server issue list --workspace my-company --repo-slug my-project --query "bug"
  $ npx -y @guerchele/bitbucket-mcp-server issue list --workspace my-company --repo-slug my-project --sort "created_on"
  $ npx -y @guerchele/bitbucket-mcp-server issue list --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista issues de um repositório com opções de paginação, filtros e ordenação.`
      )
      .action(async options => {
        try {
          this.logger.info('Listing issues');
          const issueService = new IssueService(new ApiClient());
          const result = await issueService.listIssues({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            page: options.page ? parseInt(options.page) : undefined,
            pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
            q: options.query,
            sort: options.sort,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list issues:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Create issue command
    issueCommand
      .command('create')
      .description('Cria uma nova issue')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-t, --title <title>', 'Título da issue')
      .option('-c, --content <content>', 'Conteúdo da issue')
      .option('-k, --kind <kind>', 'Tipo da issue (bug, enhancement, proposal, task)')
      .option('--priority <priority>', 'Prioridade (trivial, minor, major, critical, blocker)')
      .option('-a, --assignee <assignee>', 'Usuário responsável')
      .option('--component <component>', 'Componente')
      .option('--milestone <milestone>', 'Milestone')
      .option('--version <version>', 'Versão')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-t, --title\`: Título da issue

**Opções disponíveis:**
- \`-c, --content\`: Conteúdo da issue
- \`-k, --kind\`: Tipo da issue (bug, enhancement, proposal, task)
- \`--priority\`: Prioridade (trivial, minor, major, critical, blocker)
- \`-a, --assignee\`: Usuário responsável
- \`--component\`: Componente
- \`--milestone\`: Milestone
- \`--version\`: Versão
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue create --workspace my-company --repo-slug my-project --title "Fix bug"
  $ npx -y @guerchele/bitbucket-mcp-server issue create --workspace my-company --repo-slug my-project --title "New feature" --kind enhancement
  $ npx -y @guerchele/bitbucket-mcp-server issue create --workspace my-company --repo-slug my-project --title "Bug report" --kind bug --priority major
  $ npx -y @guerchele/bitbucket-mcp-server issue create --workspace my-company --repo-slug my-project --title "Task" --assignee john.doe

**Descrição:**
  Cria uma nova issue com as configurações especificadas.`
      )
      .action(async options => {
        try {
          this.logger.info(`Creating issue: ${options.title}`);
          const issueService = new IssueService(new ApiClient());
          const result = await issueService.createIssue({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            issue: {
              title: options.title,
              content: options.content,
              kind: options.kind,
              priority: options.priority,
              assignee: options.assignee,
              component: options.component,
              milestone: options.milestone,
              version: options.version,
            },
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to create issue:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Update issue command
    issueCommand
      .command('update')
      .description('Atualiza uma issue existente')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da issue')
      .option('-t, --title <title>', 'Título da issue')
      .option('-c, --content <content>', 'Conteúdo da issue')
      .option('-k, --kind <kind>', 'Tipo da issue (bug, enhancement, proposal, task)')
      .option('--priority <priority>', 'Prioridade (trivial, minor, major, critical, blocker)')
      .option('-a, --assignee <assignee>', 'Usuário responsável')
      .option('--component <component>', 'Componente')
      .option('--milestone <milestone>', 'Milestone')
      .option('--version <version>', 'Versão')
      .option(
        '--state <state>',
        'Estado (new, open, resolved, on hold, invalid, duplicate, wontfix, closed)'
      )
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID da issue

**Opções disponíveis:**
- \`-t, --title\`: Título da issue
- \`-c, --content\`: Conteúdo da issue
- \`-k, --kind\`: Tipo da issue (bug, enhancement, proposal, task)
- \`--priority\`: Prioridade (trivial, minor, major, critical, blocker)
- \`-a, --assignee\`: Usuário responsável
- \`--component\`: Componente
- \`--milestone\`: Milestone
- \`--version\`: Versão
- \`--state\`: Estado (new, open, resolved, on hold, invalid, duplicate, wontfix, closed)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue update --workspace my-company --repo-slug my-project --id 123 --title "Updated title"
  $ npx -y @guerchele/bitbucket-mcp-server issue update --workspace my-company --repo-slug my-project --id 123 --state resolved
  $ npx -y @guerchele/bitbucket-mcp-server issue update --workspace my-company --repo-slug my-project --id 123 --assignee john.doe

**Descrição:**
  Atualiza uma issue existente com as configurações especificadas.`
      )
      .action(async options => {
        try {
          this.logger.info(`Updating issue: ${options.id}`);
          const issueService = new IssueService(new ApiClient());
          const issue: any = {};
          if (options.title) issue.title = options.title;
          if (options.content) issue.content = options.content;
          if (options.kind) issue.kind = options.kind;
          if (options.priority) issue.priority = options.priority;
          if (options.assignee) issue.assignee = options.assignee;
          if (options.component) issue.component = options.component;
          if (options.milestone) issue.milestone = options.milestone;
          if (options.version) issue.version = options.version;
          if (options.state) issue.state = options.state;

          const result = await issueService.updateIssue({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            issue_id: options.id,
            issue,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to update issue:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Delete issue command
    issueCommand
      .command('delete')
      .description('Exclui uma issue')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da issue')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID da issue

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue delete --workspace my-company --repo-slug my-project --id 123
  $ npx -y @guerchele/bitbucket-mcp-server issue delete --workspace my-company --repo-slug my-project --id 123 --output json

**Descrição:**
  Exclui uma issue permanentemente. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        try {
          this.logger.info(`Deleting issue: ${options.id}`);
          const issueService = new IssueService(new ApiClient());
          await issueService.deleteIssue({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            issue_id: options.id,
          });
          const mcpResponse = createMcpResponse(
            { message: 'Issue deleted successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to delete issue:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Vote issue command
    issueCommand
      .command('vote')
      .description('Vota em uma issue')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da issue')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID da issue

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue vote --workspace my-company --repo-slug my-project --id 123
  $ npx -y @guerchele/bitbucket-mcp-server issue vote --workspace my-company --repo-slug my-project --id 123 --output json

**Descrição:**
  Adiciona um voto do usuário atual para uma issue.`
      )
      .action(async options => {
        try {
          this.logger.info(`Voting for issue: ${options.id}`);
          const issueService = new IssueService(new ApiClient());
          await issueService.voteIssue({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            issue_id: options.id,
          });
          const mcpResponse = createMcpResponse(
            { message: 'Vote added successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to vote for issue:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Watch issue command
    issueCommand
      .command('watch')
      .description('Observa uma issue')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da issue')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID da issue

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue watch --workspace my-company --repo-slug my-project --id 123
  $ npx -y @guerchele/bitbucket-mcp-server issue watch --workspace my-company --repo-slug my-project --id 123 --output json

**Descrição:**
  Adiciona o usuário atual como observador de uma issue.`
      )
      .action(async options => {
        try {
          this.logger.info(`Watching issue: ${options.id}`);
          const issueService = new IssueService(new ApiClient());
          await issueService.watchIssue({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            issue_id: options.id,
          });
          const mcpResponse = createMcpResponse(
            { message: 'Started watching issue successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to watch issue:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List issue comments command
    issueCommand
      .command('list-comments')
      .description('Lista comentários de uma issue')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da issue')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID da issue

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue list-comments --workspace my-company --repo-slug my-project --id 123
  $ npx -y @guerchele/bitbucket-mcp-server issue list-comments --workspace my-company --repo-slug my-project --id 123 --page 2
  $ npx -y @guerchele/bitbucket-mcp-server issue list-comments --workspace my-company --repo-slug my-project --id 123 --output json

**Descrição:**
  Lista todos os comentários de uma issue específica.`
      )
      .action(async options => {
        try {
          this.logger.info(`Listing comments for issue: ${options.id}`);
          const issueService = new IssueService(new ApiClient());
          const result = await issueService.listIssueComments({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            issue_id: parseInt(options.id),
            page: options.page ? parseInt(options.page) : undefined,
            pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list issue comments:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Create issue comment command
    issueCommand
      .command('create-comment')
      .description('Cria um comentário em uma issue')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da issue')
      .requiredOption('-c, --content <content>', 'Conteúdo do comentário')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID da issue
- \`-c, --content\`: Conteúdo do comentário

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue create-comment --workspace my-company --repo-slug my-project --id 123 --content "Este é um comentário"
  $ npx -y @guerchele/bitbucket-mcp-server issue create-comment --workspace my-company --repo-slug my-project --id 123 --content "Comentário" --output json

**Descrição:**
  Cria um novo comentário em uma issue específica.`
      )
      .action(async options => {
        try {
          this.logger.info(`Creating comment for issue: ${options.id}`);
          const issueService = new IssueService(new ApiClient());
          const result = await issueService.createIssueComment({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            issue_id: parseInt(options.id),
            comment: {
              content: options.content,
            },
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to create issue comment:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Get issue comment command
    issueCommand
      .command('get-comment')
      .description('Obtém detalhes de um comentário de issue')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da issue')
      .requiredOption('-c, --comment-id <id>', 'ID do comentário')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID da issue
- \`-c, --comment-id\`: ID do comentário

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue get-comment --workspace my-company --repo-slug my-project --id 123 --comment-id 456
  $ npx -y @guerchele/bitbucket-mcp-server issue get-comment --workspace my-company --repo-slug my-project --id 123 --comment-id 456 --output json

**Descrição:**
  Obtém informações detalhadas de um comentário específico de uma issue.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting comment ${options.commentId} for issue: ${options.id}`);
          const issueService = new IssueService(new ApiClient());
          const result = await issueService.getIssueComment({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            issue_id: parseInt(options.id),
            comment_id: parseInt(options.commentId),
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get issue comment:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Update issue comment command
    issueCommand
      .command('update-comment')
      .description('Atualiza um comentário de issue')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da issue')
      .requiredOption('-c, --comment-id <id>', 'ID do comentário')
      .requiredOption('--content <content>', 'Novo conteúdo do comentário')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID da issue
- \`-c, --comment-id\`: ID do comentário
- \`--content\`: Novo conteúdo do comentário

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue update-comment --workspace my-company --repo-slug my-project --id 123 --comment-id 456 --content "Comentário atualizado"
  $ npx -y @guerchele/bitbucket-mcp-server issue update-comment --workspace my-company --repo-slug my-project --id 123 --comment-id 456 --content "Atualizado" --output json

**Descrição:**
  Atualiza o conteúdo de um comentário específico de uma issue.`
      )
      .action(async options => {
        try {
          this.logger.info(`Updating comment ${options.commentId} for issue: ${options.id}`);
          const issueService = new IssueService(new ApiClient());
          const result = await issueService.updateIssueComment({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            issue_id: parseInt(options.id),
            comment_id: parseInt(options.commentId),
            comment: {
              content: options.content,
            },
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to update issue comment:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Delete issue comment command
    issueCommand
      .command('delete-comment')
      .description('Exclui um comentário de issue')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da issue')
      .requiredOption('-c, --comment-id <id>', 'ID do comentário')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID da issue
- \`-c, --comment-id\`: ID do comentário

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue delete-comment --workspace my-company --repo-slug my-project --id 123 --comment-id 456
  $ npx -y @guerchele/bitbucket-mcp-server issue delete-comment --workspace my-company --repo-slug my-project --id 123 --comment-id 456 --output json

**Descrição:**
  Exclui permanentemente um comentário de uma issue. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        try {
          this.logger.info(`Deleting comment ${options.commentId} for issue: ${options.id}`);
          const issueService = new IssueService(new ApiClient());
          await issueService.deleteIssueComment({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            issue_id: parseInt(options.id),
            comment_id: parseInt(options.commentId),
          });
          const mcpResponse = createMcpResponse(
            { message: 'Issue comment deleted successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to delete issue comment:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List components command
    issueCommand
      .command('list-components')
      .description('Lista componentes do issue tracker')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
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
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue list-components --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server issue list-components --workspace my-company --repo-slug my-project --page 2
  $ npx -y @guerchele/bitbucket-mcp-server issue list-components --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista todos os componentes disponíveis no issue tracker do repositório.`
      )
      .action(async options => {
        try {
          this.logger.info('Listing issue components');
          const issueService = new IssueService(new ApiClient());
          const result = await issueService.listComponents({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            page: options.page ? parseInt(options.page) : undefined,
            pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list components:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Get component command
    issueCommand
      .command('get-component')
      .description('Obtém detalhes de um componente')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-c, --component-id <id>', 'ID do componente')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-c, --component-id\`: ID do componente

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue get-component --workspace my-company --repo-slug my-project --component-id 123
  $ npx -y @guerchele/bitbucket-mcp-server issue get-component --workspace my-company --repo-slug my-project --component-id 123 --output json

**Descrição:**
  Obtém informações detalhadas de um componente específico do issue tracker.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting component: ${options.componentId}`);
          const issueService = new IssueService(new ApiClient());
          const result = await issueService.getComponent({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            component_id: options.componentId,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get component:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Remove vote issue command
    issueCommand
      .command('remove-vote')
      .description('Remove voto de uma issue')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da issue')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID da issue

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue remove-vote --workspace my-company --repo-slug my-project --id 123
  $ npx -y @guerchele/bitbucket-mcp-server issue remove-vote --workspace my-company --repo-slug my-project --id 123 --output json

**Descrição:**
  Remove o voto do usuário atual de uma issue.`
      )
      .action(async options => {
        try {
          this.logger.info(`Removing vote from issue: ${options.issueId}`);
          const issueService = new IssueService(new ApiClient());
          await issueService.removeVoteIssue({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            issue_id: options.issueId,
          });
          const mcpResponse = createMcpResponse(
            { message: 'Vote removed successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to remove vote from issue:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Stop watching issue command
    issueCommand
      .command('stop-watch')
      .description('Para de observar uma issue')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da issue')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-i, --id\`: ID da issue

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue stop-watch --workspace my-company --repo-slug my-project --id 123
  $ npx -y @guerchele/bitbucket-mcp-server issue stop-watch --workspace my-company --repo-slug my-project --id 123 --output json

**Descrição:**
  Remove o usuário atual da lista de observadores de uma issue.`
      )
      .action(async options => {
        try {
          this.logger.info(`Stopping to watch issue: ${options.id}`);
          const issueService = new IssueService(new ApiClient());
          await issueService.stopWatchingIssue({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            issue_id: options.id,
          });
          const mcpResponse = createMcpResponse(
            { message: 'Stopped watching issue successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to stop watching issue:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List milestones command
    issueCommand
      .command('list-milestones')
      .description('Lista marcos do issue tracker')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
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
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue list-milestones --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server issue list-milestones --workspace my-company --repo-slug my-project --page 2
  $ npx -y @guerchele/bitbucket-mcp-server issue list-milestones --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista todos os marcos disponíveis no issue tracker do repositório.`
      )
      .action(async options => {
        try {
          this.logger.info('Listing milestones');
          const issueService = new IssueService(new ApiClient());
          const result = await issueService.listMilestones({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            page: options.page ? parseInt(options.page) : undefined,
            pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list milestones:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Get milestone command
    issueCommand
      .command('get-milestone')
      .description('Obtém detalhes de um marco')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-m, --milestone-id <id>', 'ID do marco')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-m, --milestone-id\`: ID do marco

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue get-milestone --workspace my-company --repo-slug my-project --milestone-id 123
  $ npx -y @guerchele/bitbucket-mcp-server issue get-milestone --workspace my-company --repo-slug my-project --milestone-id 123 --output json

**Descrição:**
  Obtém informações detalhadas de um marco específico do issue tracker.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting milestone: ${options.milestoneId}`);
          const issueService = new IssueService(new ApiClient());
          const result = await issueService.getMilestone({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            milestone_id: options.milestoneId,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get milestone:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List versions command
    issueCommand
      .command('list-versions')
      .description('Lista versões do issue tracker')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
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
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue list-versions --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server issue list-versions --workspace my-company --repo-slug my-project --page 2
  $ npx -y @guerchele/bitbucket-mcp-server issue list-versions --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Lista todas as versões disponíveis no issue tracker do repositório.`
      )
      .action(async options => {
        try {
          this.logger.info('Listing versions');
          const issueService = new IssueService(new ApiClient());
          const result = await issueService.listVersions({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            page: options.page ? parseInt(options.page) : undefined,
            pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list versions:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Get version command
    issueCommand
      .command('get-version')
      .description('Obtém detalhes de uma versão')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .requiredOption('-v, --version-id <id>', 'ID da versão')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-r, --repo-slug\`: Slug do repositório
- \`-v, --version-id\`: ID da versão

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server issue get-version --workspace my-company --repo-slug my-project --version-id 123
  $ npx -y @guerchele/bitbucket-mcp-server issue get-version --workspace my-company --repo-slug my-project --version-id 123 --output json

**Descrição:**
  Obtém informações detalhadas de uma versão específica do issue tracker.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting version: ${options.versionId}`);
          const issueService = new IssueService(new ApiClient());
          const result = await issueService.getVersion({
            workspace: options.workspace,
            repo_slug: options.repoSlug,
            version_id: options.versionId,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get version:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all cloud issue commands');
  }
}
