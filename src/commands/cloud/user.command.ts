import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { UserService } from '../../services/cloud/user.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';

/**
 * User Commands for Bitbucket Cloud CLI
 *
 * Provides command line interface for user operations including:
 * - Get current user details
 * - Get user details by username
 * - List user email addresses
 * - Get user email details
 */
export class CloudUserCommands {
  private static logger = Logger.forContext('CloudUserCommands');

  private static async handleGetCurrent(options: any): Promise<void> {
    try {
      this.logger.info('Getting current user');
      const userService = new UserService(new ApiClient());
      const result = await userService.getCurrentUser();
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get current user:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGet(options: any): Promise<void> {
    try {
      this.logger.info(`Getting user: ${options.name}`);
      const userService = new UserService(new ApiClient());
      const result = await userService.getUser({
        selected_user: options.name,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get user:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleListEmails(options: any): Promise<void> {
    try {
      this.logger.info('Listing user emails');
      const userService = new UserService(new ApiClient());
      const result = await userService.listUserEmails({
        page: options.page ? parseInt(options.page) : undefined,
        pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to list user emails:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetEmail(options: any): Promise<void> {
    try {
      this.logger.info(`Getting user email: ${options.email}`);
      const userService = new UserService(new ApiClient());
      const result = await userService.getUserEmail({
        email: options.email,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get user email:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Register all user commands with the CLI program
   */
  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de usuário');

    const userCommand = program
      .command('user')
      .description('Comandos de usuário do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server user <command> --help' para mais informações sobre um comando específico.
`
      );

    // Get current user command
    userCommand
      .command('get-current')
      .description('Obtém detalhes do usuário atual')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server user get-current
  $ npx -y @guerchele/bitbucket-mcp-server user get-current --output json

**Descrição:**
  Obtém informações detalhadas do usuário atualmente autenticado,
  incluindo metadados, configurações e estatísticas.`
      )
      .action(async options => {
        await this.handleGetCurrent(options);
      });

    // Get user command
    userCommand
      .command('get')
      .description('Obtém detalhes de um usuário específico')
      .requiredOption('-u, --name <username>', 'Nome de usuário ou UUID')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-u, --name\`: Nome de usuário ou UUID

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server user get --name john.doe
  $ npx -y @guerchele/bitbucket-mcp-server user get -u john.doe
  $ npx -y @guerchele/bitbucket-mcp-server user get --name {12345678-1234-1234-1234-123456789abc}
  $ npx -y @guerchele/bitbucket-mcp-server user get --name john.doe --output json

**Descrição:**
  Obtém informações públicas de um usuário específico. Se o perfil
  do usuário for privado, alguns campos podem ser omitidos.`
      )
      .action(async options => {
        await this.handleGet(options);
      });

    // List user emails command
    userCommand
      .command('list-emails')
      .description('Lista endereços de email do usuário atual')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server user list-emails
  $ npx -y @guerchele/bitbucket-mcp-server user list-emails --page 2
  $ npx -y @guerchele/bitbucket-mcp-server user list-emails --pagelen 10
  $ npx -y @guerchele/bitbucket-mcp-server user list-emails --output json

**Descrição:**
  Lista todos os endereços de email do usuário atualmente autenticado,
  incluindo endereços confirmados e não confirmados.`
      )
      .action(async options => {
        await this.handleListEmails(options);
      });

    // Get user email command
    userCommand
      .command('get-email')
      .description('Obtém detalhes de um endereço de email específico')
      .requiredOption('-e, --email <email>', 'Endereço de email')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-e, --email\`: Endereço de email

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server user get-email --email john.doe@example.com
  $ npx -y @guerchele/bitbucket-mcp-server user get-email --email john.doe@example.com --output json

**Descrição:**
  Obtém detalhes de um endereço de email específico do usuário atual,
  incluindo se foi confirmado e se é o endereço primário.`
      )
      .action(async options => {
        await this.handleGetEmail(options);
      });

    registerLogger.info('Successfully registered all cloud user commands');
  }
}
