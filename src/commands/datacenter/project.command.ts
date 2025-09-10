import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ProjectService } from '../../services/datacenter/project.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';

/**
 * Project Commands for Bitbucket Data Center CLI
 *
 * Provides command line interface for project operations including:
 * - Get project details
 * - List projects
 * - Manage project settings
 */
export class DataCenterProjectCommands {
  private static logger = Logger.forContext('DataCenterProjectCommands');

  /**
   * Register all project commands with the CLI program
   */
  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de projeto do Data Center');

    const projectCommand = program
      .command('project')
      .description('Comandos de projeto do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server project <command> --help' para mais informações sobre um comando específico.
`
      );

    // Get project command
    projectCommand
      .command('get')
      .description('Obtém detalhes de um projeto específico (Data Center)')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .option('--output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --key\`: Chave do projeto

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project get --key MOBILE
  $ npx -y @guerchele/bitbucket-mcp-server project get --key MOBILE --output json

**Descrição:**
  Obtém informações detalhadas de um projeto específico no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting project: ${options.key}`);
          const projectService = new ProjectService(
            new ApiClient(),
            Logger.forContext('ProjectService')
          );
          const result = await projectService.getProject(options.key);
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get project:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List projects command
    projectCommand
      .command('list')
      .description('Lista projetos (Data Center)')
      .option('--start <start>', 'Índice de início')
      .option('--limit <limit>', 'Número máximo de resultados')
      .option('--output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`--start\`: Índice de início
- \`--limit\`: Número máximo de resultados
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project list
  $ npx -y @guerchele/bitbucket-mcp-server project list --start 0 --limit 10
  $ npx -y @guerchele/bitbucket-mcp-server project list --output json

**Descrição:**
  Lista projetos no Bitbucket Data Center com opções de paginação.`
      )
      .action(async options => {
        try {
          this.logger.info('Listing projects');
          const projectService = new ProjectService(
            new ApiClient(),
            Logger.forContext('ProjectService')
          );
          const result = await projectService.listProjects({
            start: options.start ? parseInt(options.start) : undefined,
            limit: options.limit ? parseInt(options.limit) : undefined,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list projects:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center project commands');
  }
}
