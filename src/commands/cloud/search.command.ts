import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { SearchService } from '../../services/cloud/search.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';

/**
 * Search Commands for Bitbucket Cloud CLI
 *
 * Provides command line interface for search operations including:
 * - Search code in team repositories
 * - Search code in user repositories
 * - Search code in workspace repositories
 */
export class CloudSearchCommands {
  private static logger = Logger.forContext('CloudSearchCommands');

  /**
   * Handle search team code command
   */
  private static async handleSearchTeamCode(options: any): Promise<void> {
    try {
      this.logger.info(`Searching team code: ${options.username} - ${options.query}`);
      const searchService = new SearchService(new ApiClient());
      const result = await searchService.searchTeamCode({
        username: options.username,
        search_query: options.query,
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to search team code:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle search user code command
   */
  private static async handleSearchUserCode(options: any): Promise<void> {
    try {
      this.logger.info(`Searching user code: ${options.user} - ${options.query}`);
      const searchService = new SearchService(new ApiClient());
      const result = await searchService.searchUserCode({
        selected_user: options.user,
        search_query: options.query,
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to search user code:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Handle search workspace code command
   */
  private static async handleSearchWorkspaceCode(options: any): Promise<void> {
    try {
      this.logger.info(`Searching workspace code: ${options.workspace} - ${options.query}`);
      const searchService = new SearchService(new ApiClient());
      const result = await searchService.searchWorkspaceCode({
        workspace: options.workspace,
        search_query: options.query,
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to search workspace code:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Register all search commands with the CLI program
   */
  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de busca');

    const searchCommand = program
      .command('search')
      .description('Comandos de busca do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server search <command> --help' para mais informações sobre um comando específico.
`
      );

    // Search team code command
    searchCommand
      .command('team-code')
      .description('Busca código nos repositórios de um time')
      .requiredOption('-u, --username <username>', 'Nome de usuário do time')
      .requiredOption('-q, --query <query>', 'Query de busca')
      .option('-p, --page <number>', 'Número da página', '1')
      .option('--pagelen <number>', 'Tamanho da página', '10')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-u, --username\`: Nome de usuário do time
- \`-q, --query\`: Query de busca

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`--pagelen\`: Tamanho da página (padrão: 10)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server team-code --username my-team --query "function"
  $ npx -y @guerchele/bitbucket-mcp-server team-code --username my-team --query "TODO" --page 2
  $ npx -y @guerchele/bitbucket-mcp-server team-code --username my-team --query "import React" --pagelen 20
  $ npx -y @guerchele/bitbucket-mcp-server team-code --username my-team --query "function" --output json

**Descrição:**
  Busca código nos repositórios de um time específico usando a query fornecida.`
      )
      .action(async options => {
        await this.handleSearchTeamCode(options);
      });

    // Search user code command
    searchCommand
      .command('user-code')
      .description('Busca código nos repositórios de um usuário')
      .requiredOption('-u, --user <user>', 'Nome de usuário')
      .requiredOption('-q, --query <query>', 'Query de busca')
      .option('-p, --page <number>', 'Número da página', '1')
      .option('--pagelen <number>', 'Tamanho da página', '10')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-u, --user\`: Nome de usuário
- \`-q, --query\`: Query de busca

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`--pagelen\`: Tamanho da página (padrão: 10)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server user-code --user john.doe --query "function"
  $ npx -y @guerchele/bitbucket-mcp-server user-code --user john.doe --query "TODO" --page 2
  $ npx -y @guerchele/bitbucket-mcp-server user-code --user john.doe --query "import React" --pagelen 20
  $ npx -y @guerchele/bitbucket-mcp-server user-code --user john.doe --query "function" --output json

**Descrição:**
  Busca código nos repositórios de um usuário específico usando a query fornecida.`
      )
      .action(async options => {
        await this.handleSearchUserCode(options);
      });

    // Search workspace code command
    searchCommand
      .command('workspace-code')
      .description('Busca código nos repositórios de um workspace')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-q, --query <query>', 'Query de busca')
      .option('-p, --page <number>', 'Número da página', '1')
      .option('--pagelen <number>', 'Tamanho da página', '10')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-q, --query\`: Query de busca

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`--pagelen\`: Tamanho da página (padrão: 10)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server workspace-code --workspace my-company --query "function"
  $ npx -y @guerchele/bitbucket-mcp-server workspace-code --workspace my-company --query "TODO" --page 2
  $ npx -y @guerchele/bitbucket-mcp-server workspace-code --workspace my-company --query "import React" --pagelen 20
  $ npx -y @guerchele/bitbucket-mcp-server workspace-code --workspace my-company --query "function" --output json

**Descrição:**
  Busca código nos repositórios de um workspace específico usando a query fornecida.`
      )
      .action(async options => {
        await this.handleSearchWorkspaceCode(options);
      });

    registerLogger.info('Successfully registered all cloud search commands');
  }
}
