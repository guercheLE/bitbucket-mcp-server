/**
 * Webhook Commands for Bitbucket Cloud
 * Handles webhook-related operations
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';
import { WebhookService } from '../../services/cloud/webhook.service.js';
import { ApiClient } from '../../utils/api-client.util.js';

export class CloudWebhookCommands {
  private static logger = Logger.forContext('CloudWebhookCommands');

  /**
   * Handle get webhook resource command
   */
  private static async handleGetWebhookResource(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const webhookService = new WebhookService(apiClient);

      const result = await webhookService.getWebhookResource();

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter recursos de webhook', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  /**
   * Handle list webhook types command
   */
  private static async handleListWebhookTypes(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const webhookService = new WebhookService(apiClient);

      const params: any = {
        subject_type: options.subjectType,
      };
      if (options.page) params.page = parseInt(options.page);
      if (options.pagelen) params.pagelen = parseInt(options.pagelen);

      const result = await webhookService.listWebhookTypes(params);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar tipos de webhook', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de webhook');

    const webhookCommand = program
      .command('webhook')
      .description('Comandos de webhooks do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server webhook <command> --help' para mais informações sobre um comando específico.
`
      );

    webhookCommand
      .command('get-resource')
      .description('Obtém recursos de webhook disponíveis')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server webhook get-resource
  $ npx -y @guerchele/bitbucket-mcp-server webhook get-resource --output json

**Descrição:**
  Obtém informações sobre os recursos de webhook disponíveis no Bitbucket Cloud.
  Retorna os tipos de assunto nos quais webhooks podem ser registrados.`
      )
      .action(async options => {
        await this.handleGetWebhookResource(options);
      });

    webhookCommand
      .command('list-types')
      .description('Lista tipos de webhook disponíveis')
      .requiredOption(
        '-s, --subject-type <subjectType>',
        'Tipo de sujeito (repository, workspace, etc.)'
      )
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-s, --subject-type\`: Tipo de sujeito (repository, workspace, etc.)

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server webhook list-types --subject-type repository
  $ npx -y @guerchele/bitbucket-mcp-server webhook list-types --subject-type workspace
  $ npx -y @guerchele/bitbucket-mcp-server webhook list-types --subject-type repository --page 2
  $ npx -y @guerchele/bitbucket-mcp-server webhook list-types --subject-type repository --pagelen 10
  $ npx -y @guerchele/bitbucket-mcp-server webhook list-types --subject-type repository --output json

**Descrição:**
  Lista todos os eventos de webhook válidos para a entidade especificada.
  Retorna uma lista paginada de eventos que podem ser usados para configurar webhooks.
  Os webhooks de team e user estão depreciados, use workspace em vez disso.`
      )
      .action(async options => {
        await this.handleListWebhookTypes(options);
      });

    registerLogger.info('Successfully registered all cloud webhook commands');
  }
}
